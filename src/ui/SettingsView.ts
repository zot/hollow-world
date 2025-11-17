/**
 * SettingsView - Application Settings and Configuration Interface
 * Single Responsibility: Manages settings UI only (delegates storage to ProfileService, logging to LogService)
 *
 * CRC: crc-SettingsView.md
 * Spec: ui.settings.md
 * Template: public/templates/settings-view.html, public/templates/log-view.html
 */

import { IUIComponent } from './SplashScreen.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { AudioControlUtils, IEnhancedAudioControlSupport } from '../utils/AudioControlUtils.js';
import { IAudioManager } from '../audio/AudioManager.js';
import { MilkdownUtils, IMilkdownEditor } from '../utils/MilkdownUtils.js';
import { LogService, ILogEntry } from '../services/LogService.js';
import { HollowPeer } from '../p2p/index.js';
import type { IFriend } from '../p2p/types.js';
import { router } from '../utils/Router.js';
import { getProfileService } from '../services/ProfileService.js';
import { DEFAULT_PUBSUB_TOPIC, DEFAULT_PEER_PROTOCOL } from '../p2p/constants.js';

/**
 * ISettingsView interface
 * CRC: crc-SettingsView.md
 */
export interface ISettingsView {
    onBackToMenu?: () => void;
    audioManager?: IAudioManager;
    container: HTMLElement | null;
    renderSettings(container: HTMLElement): Promise<void>;
    renderLog(container: HTMLElement): Promise<void>;
    destroy(): void;
}

export interface ISettingsViewConfig {
    containerClass: string;
    titleClass: string;
    sectionClass: string;
    fieldClass: string;
    buttonClass: string;
    backButtonClass: string;
}

export interface ISettingsData {
    playerName: string;
    peerId: string;
    privateNotes: string;
    friends: IFriend[];
    pubsubTopic?: string;
    peerProtocol?: string;
}

const DEFAULT_CONFIG: ISettingsViewConfig = {
    containerClass: 'settings-container',
    titleClass: 'settings-title',
    sectionClass: 'settings-section',
    fieldClass: 'settings-field',
    buttonClass: 'settings-button',
    backButtonClass: 'settings-back-button'
};

/**
 * SettingsView - Manage application settings and view system log
 *
 * CRC: crc-SettingsView.md
 *
 * Key Features:
 * - Peer ID display (read-only, copyable)
 * - Profile picker (switch profiles)
 * - Private notes (Milkdown editor)
 * - System log viewer with filtering and sorting
 * - Debug configuration (pubsub topic, peer protocol)
 */
export class SettingsView implements ISettingsView, IEnhancedAudioControlSupport {
    private readonly STORAGE_KEY = 'hollowWorldSettings';
    private config: ISettingsViewConfig;
    public container: HTMLElement | null = null;
    public onBackToMenu?: () => void;
    public audioManager?: IAudioManager;
    private hollowPeer?: HollowPeer;
    private settingsData: ISettingsData;
    private backButtonElement: HTMLElement | null = null;
    private playerNameInput: HTMLInputElement | null = null;
    private pubsubTopicInput: HTMLInputElement | null = null;
    private peerProtocolInput: HTMLInputElement | null = null;
    private privateNotesEditor: IMilkdownEditor | null = null;
    public musicButtonElement: HTMLElement | null = null;
    private logService: LogService;
    private logSortColumn: string = 'serial';
    private logSortAscending: boolean = false;

    constructor(
        config: ISettingsViewConfig = DEFAULT_CONFIG,
        audioManager?: IAudioManager,
        hollowPeer?: HollowPeer
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.audioManager = audioManager;
        this.hollowPeer = hollowPeer;
        this.settingsData = this.loadSettings();
        this.logService = new LogService();

        // Set up event card handlers for friend requests/approvals
        this.setupEventCardHandlers();
    }

    /**
     * renderSettings implementation
     *
     * CRC: crc-SettingsView.md
     */
    async renderSettings(container: HTMLElement): Promise<void> {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;

        // Update hollowPeer reference from global if available and not already set
        if (!this.hollowPeer && (window as any).__HOLLOW_WORLD_TEST__?.hollowPeer) {
            this.hollowPeer = (window as any).__HOLLOW_WORLD_TEST__.hollowPeer;
        }

        try {
            const profileService = getProfileService();
            const currentProfile = profileService.getCurrentProfile();

            const templateData = {
                containerClass: this.config.containerClass,
                titleClass: this.config.titleClass,
                sectionClass: this.config.sectionClass,
                fieldClass: this.config.fieldClass,
                buttonClass: this.config.buttonClass,
                backButtonClass: this.config.backButtonClass,
                playerName: this.settingsData.playerName,
                peerId: this.settingsData.peerId,
                peerCount: this.hollowPeer ? this.hollowPeer.getConnectedPeerCount() : 0,
                privateNotes: this.settingsData.privateNotes,
                pubsubTopic: this.settingsData.pubsubTopic || DEFAULT_PUBSUB_TOPIC,
                peerProtocol: this.settingsData.peerProtocol || DEFAULT_PEER_PROTOCOL,
                defaultPubsubTopic: DEFAULT_PUBSUB_TOPIC,
                defaultPeerProtocol: DEFAULT_PEER_PROTOCOL,
                hasAudioManager: !!this.audioManager,
                profileName: `{${currentProfile.name}}`,
                showProfileName: currentProfile.name !== 'Default'
            };

            const settingsHtml = await templateEngine.renderTemplateFromFile('settings-view', templateData);
            container.innerHTML = settingsHtml;

            // Inject enhanced audio control if audio manager is available
            if (this.audioManager) {
                const audioControlHtml = await AudioControlUtils.renderEnhancedAudioControl(this);
                const settingsContainer = container.querySelector(`.${this.config.containerClass}`);

                if (settingsContainer) {
                    settingsContainer.insertAdjacentHTML('beforeend', audioControlHtml);
                }
            }

        } catch (error) {
            console.error('Failed to render settings view template:', error);
            // Fallback to basic HTML
            container.innerHTML = await this.createSettingsFallback();
        }

        this.setupElementReferences();
        await this.initializeMilkdownEditors();
        this.setupEventHandlers();
        this.startPeerCountUpdates();

        if (this.audioManager) {
            AudioControlUtils.setupEnhancedAudioControls(this);
            AudioControlUtils.updateEnhancedAudioState(this);
        }
    }

    private async initializeMilkdownEditors(): Promise<void> {
        // Import Crepe styles (styles are auto-imported but method kept for compatibility)
        MilkdownUtils.importCrepeStyles();

        // Initialize private notes editor
        const privateNotesContainer = this.container?.querySelector('#private-notes-editor') as HTMLElement;
        if (privateNotesContainer) {
            this.privateNotesEditor = await MilkdownUtils.createEditor(
                privateNotesContainer,
                this.settingsData.privateNotes,
                (markdown) => {
                    this.settingsData.privateNotes = markdown;
                    this.saveSettings();
                }
            );
        }
    }

    /**
     * destroy implementation
     *
     * CRC: crc-SettingsView.md
     */
    destroy(): void {
        if (this.peerCountInterval) {
            clearInterval(this.peerCountInterval);
            this.peerCountInterval = undefined;
        }
        if (this.privateNotesEditor) {
            this.privateNotesEditor.destroy();
            this.privateNotesEditor = null;
        }
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
        this.backButtonElement = null;
        this.playerNameInput = null;
        this.musicButtonElement = null;
    }

    /**
     * getContainer implementation - IView interface
     *
     * Spec: view-management.md
     */
    getContainer(): HTMLElement | null {
        return this.container;
    }

    /**
     * show implementation - IView interface
     *
     * Spec: view-management.md
     */
    show(): void {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * hide implementation - IView interface
     *
     * Spec: view-management.md
     */
    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    private loadSettings(): ISettingsData {
        // Load settings from localStorage or use defaults
        const defaultSettings: ISettingsData = {
            playerName: '',
            peerId: '', // Will be populated from network provider
            privateNotes: '',
            friends: [],
            pubsubTopic: DEFAULT_PUBSUB_TOPIC,
            peerProtocol: DEFAULT_PEER_PROTOCOL
        };

        try {
            const stored = getProfileService().getItem(this.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return {
                    ...defaultSettings,
                    ...parsed,
                    // Ensure defaults are set if missing from storage
                    pubsubTopic: parsed.pubsubTopic || DEFAULT_PUBSUB_TOPIC,
                    peerProtocol: parsed.peerProtocol || DEFAULT_PEER_PROTOCOL
                };
            }
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }

        return defaultSettings;
    }

    private saveSettings(): void {
        try {
            // Update settings data from form inputs
            if (this.playerNameInput) {
                this.settingsData.playerName = this.playerNameInput.value;
            }

            if (this.pubsubTopicInput) {
                this.settingsData.pubsubTopic = this.pubsubTopicInput.value.trim() || DEFAULT_PUBSUB_TOPIC;
            }

            if (this.peerProtocolInput) {
                this.settingsData.peerProtocol = this.peerProtocolInput.value.trim() || DEFAULT_PEER_PROTOCOL;
            }

            // Get current markdown from editor before saving
            if (this.privateNotesEditor) {
                this.settingsData.privateNotes = this.privateNotesEditor.getMarkdown();
            }

            getProfileService().setItem(this.STORAGE_KEY, JSON.stringify(this.settingsData));
            this.logService.log('Settings saved successfully');
            console.log('Settings saved successfully');
        } catch (error) {
            this.logService.log(`Failed to save settings: ${error}`);
            console.error('Failed to save settings to localStorage:', error);
        }
    }

    private setupElementReferences(): void {
        if (!this.container) return;

        this.backButtonElement = this.container.querySelector(`.${this.config.backButtonClass}`);
        this.playerNameInput = this.container.querySelector('#player-name-input') as HTMLInputElement;
        this.pubsubTopicInput = this.container.querySelector('#pubsub-topic-input') as HTMLInputElement;
        this.peerProtocolInput = this.container.querySelector('#peer-protocol-input') as HTMLInputElement;
        this.musicButtonElement = this.container.querySelector('#music-toggle-btn'); // Enhanced control only
    }

    private setupEventHandlers(): void {
        // Log button handler
        const showLogBtn = this.container?.querySelector('#show-log-btn');
        showLogBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            router.navigate('/settings/log');
        });

        // Profiles button handler
        const showProfilesBtn = this.container?.querySelector('#show-profiles-btn');
        showProfilesBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            await this.showProfilePicker();
        });

        // Home button handler
        const homeBtn = this.container?.querySelector('#settings-home-btn');
        homeBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            this.saveSettings(); // Auto-save when leaving
            this.router.navigate('/');
        });

        if (this.backButtonElement) {
            this.backButtonElement.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                this.saveSettings(); // Auto-save when leaving
                if (this.onBackToMenu) {
                    this.onBackToMenu();
                }
            });
        }

        // Auto-save on input changes
        if (this.playerNameInput) {
            this.playerNameInput.addEventListener('blur', () => {
                this.saveSettings();
                // Sync player name to HollowPeer nickname
                if (this.hollowPeer && this.playerNameInput) {
                    this.hollowPeer.setNickname(this.playerNameInput.value.trim());
                }
            });
        }

        // P2P Network Settings - auto-save on blur
        if (this.pubsubTopicInput) {
            this.pubsubTopicInput.addEventListener('blur', () => {
                this.saveSettings();
                this.showRestartNotification();
            });
        }

        if (this.peerProtocolInput) {
            this.peerProtocolInput.addEventListener('blur', () => {
                this.saveSettings();
                this.showRestartNotification();
            });
        }

        // Reset button handlers
        const resetPubsubTopicBtn = this.container?.querySelector('#reset-pubsub-topic-btn');
        resetPubsubTopicBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            if (this.pubsubTopicInput) {
                this.pubsubTopicInput.value = DEFAULT_PUBSUB_TOPIC;
                this.settingsData.pubsubTopic = DEFAULT_PUBSUB_TOPIC;
                this.saveSettings();
                this.showRestartNotification();
            }
        });

        const resetPeerProtocolBtn = this.container?.querySelector('#reset-peer-protocol-btn');
        resetPeerProtocolBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            if (this.peerProtocolInput) {
                this.peerProtocolInput.value = DEFAULT_PEER_PROTOCOL;
                this.settingsData.peerProtocol = DEFAULT_PEER_PROTOCOL;
                this.saveSettings();
                this.showRestartNotification();
            }
        });

        // Private notes are auto-saved via Milkdown onChange callback
    }

    private showRestartNotification(): void {
        this.logService.log('P2P settings changed. Restart the app for changes to take effect.');
        // Could optionally show a more prominent notification in the UI
    }


    private setupEventCardHandlers(): void {
        // Use event delegation for dynamically rendered event cards
        document.addEventListener('click', async (e: Event) => {
            const target = e.target as HTMLElement;

            // Handle Ignore button in friendRequest events
            if (target.classList.contains('event-action-ignore-friend')) {
                await AudioControlUtils.playButtonSound(this.audioManager);

                const peerId = target.getAttribute('data-peer-id');
                const peerName = target.getAttribute('data-peer-name');
                const eventId = target.getAttribute('data-event-id');

                if (!peerId) {
                    console.error('Missing peer ID on Ignore button');
                    return;
                }

                // Use fallback name if none provided (names aren't unique/required)
                const displayName = peerName || `Peer ${peerId.substring(0, 8)}`;

                if (!this.hollowPeer) {
                    this.logService.log('Failed to ignore friend request: P2P not initialized');
                    alert('P2P system not initialized');
                    return;
                }

                try {
                    // Add to ignored peers
                    this.hollowPeer.addIgnoredPeer(peerId, displayName);
                    this.logService.log(`Added ${displayName} (${peerId.substring(0, 20)}...) to ignored peers`);

                    // Remove the event
                    const eventService = this.hollowPeer.getEventService();
                    if (eventId) {
                        eventService.removeEvent(eventId);
                    }

                    // Re-render to update UI
                    if (this.container) {
                        this.renderSettings(this.container);
                    }
                } catch (error: any) {
                    this.logService.log(`Failed to ignore friend request: ${error.message}`);
                    console.error('❌ Failed to ignore friend request:', error);
                    alert(`Failed to ignore friend request: ${error.message}`);
                }
            }

            // Handle Accept button in friendRequest events
            if (target.classList.contains('event-action-accept-friend')) {
                await AudioControlUtils.playButtonSound(this.audioManager);

                const peerId = target.getAttribute('data-peer-id');
                const peerName = target.getAttribute('data-peer-name');
                const eventId = target.getAttribute('data-event-id');

                if (!peerId) {
                    console.error('Missing peer ID on Accept button');
                    return;
                }

                // Use fallback name if none provided (names aren't unique/required)
                const displayName = peerName || `Peer ${peerId.substring(0, 8)}`;

                if (!this.hollowPeer) {
                    this.logService.log('Failed to accept friend request: P2P not initialized');
                    alert('P2P system not initialized');
                    return;
                }

                try {
                    // Add friend with 'unsent' status (we're about to send response)
                    await this.hollowPeer.addFriend(displayName, peerId, '', 'unsent', false);
                    this.logService.log(`Added ${displayName} (${peerId.substring(0, 20)}...) as friend`);

                    // Send friendResponse with accept=true
                    await this.hollowPeer.sendFriendResponse(peerId, true);
                    this.logService.log(`Sent friend acceptance to ${peerId.substring(0, 20)}...`);

                    // Remove the event
                    const eventService = this.hollowPeer.getEventService();
                    if (eventId) {
                        eventService.removeEvent(eventId);
                    }

                    // Re-render to show the new friend
                    if (this.container) {
                        this.renderSettings(this.container);
                    }
                } catch (error: any) {
                    this.logService.log(`Failed to accept friend request: ${error.message}`);
                    console.error('❌ Failed to accept friend request:', error);
                    alert(`Failed to accept friend request: ${error.message}`);
                }
            }

            // Handle Ban button in friendRequest events
            if (target.classList.contains('event-action-ban-friend')) {
                await AudioControlUtils.playButtonSound(this.audioManager);

                const peerId = target.getAttribute('data-peer-id');
                const peerName = target.getAttribute('data-peer-name');
                const eventId = target.getAttribute('data-event-id');

                if (!peerId) {
                    console.error('Missing peer ID on Ban button');
                    return;
                }

                // Use fallback name if none provided (names aren't unique/required)
                const displayName = peerName || `Peer ${peerId.substring(0, 8)}`;

                if (!this.hollowPeer) {
                    this.logService.log('Failed to ban peer: P2P not initialized');
                    alert('P2P system not initialized');
                    return;
                }

                try {
                    // Ban the peer (creates ban entry with empty friend data since they're not a friend yet)
                    const friendsManager = this.hollowPeer.getFriendsManager();
                    const bannedFriend: import('../p2p/types.js').IFriend = {
                        peerId: peerId,
                        playerName: displayName,
                        notes: '',
                        worlds: []
                    };
                    friendsManager.banPeer(peerId, bannedFriend);
                    this.logService.log(`Banned ${displayName} (${peerId.substring(0, 20)}...)`);

                    // Remove the event
                    const eventService = this.hollowPeer.getEventService();
                    if (eventId) {
                        eventService.removeEvent(eventId);
                    }

                    // Re-render to update UI
                    if (this.container) {
                        this.renderSettings(this.container);
                    }
                } catch (error: any) {
                    this.logService.log(`Failed to ban peer: ${error.message}`);
                    console.error('❌ Failed to ban peer:', error);
                    alert(`Failed to ban peer: ${error.message}`);
                }
            }

            // Handle Dismiss button in friendDeclined events
            if (target.classList.contains('event-action-dismiss')) {
                await AudioControlUtils.playButtonSound(this.audioManager);

                const eventId = target.getAttribute('data-event-id');

                if (!eventId) {
                    console.error('Missing event ID on Dismiss button');
                    return;
                }

                if (!this.hollowPeer) {
                    return;
                }

                // Remove the event
                const eventService = this.hollowPeer.getEventService();
                eventService.removeEvent(eventId);
                this.logService.log(`Dismissed friend declined event ${eventId}`);
            }

            // Handle View Friend button in friend approved events
            if (target.classList.contains('event-action-view-friend')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                
                const peerId = target.getAttribute('data-peer-id');
                const eventId = target.getAttribute('data-event-id');

                if (peerId) {
                    // Navigate to settings with friend selected
                    router.navigate(`/settings#friend=${peerId}`);
                }

                // Remove the event
                if (eventId && this.hollowPeer) {
                    const eventService = this.hollowPeer.getEventService();
                    eventService.removeEvent(eventId);
                }
            }

            // Handle Remove button (💀) on any event
            if (target.classList.contains('event-remove')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                
                const eventId = target.getAttribute('data-event-id');
                if (!eventId) {
                    console.error('Missing event ID on Remove button');
                    return;
                }

                if (!this.hollowPeer) {
                    return;
                }

                const eventService = this.hollowPeer.getEventService();
                eventService.removeEvent(eventId);
            }
        });
    }

    private async createSettingsFallback(): Promise<string> {
        try {
            return await templateEngine.renderTemplateFromFile('settings-view-fallback', {
                containerClass: this.config.containerClass,
                titleClass: this.config.titleClass,
                backButtonClass: this.config.backButtonClass,
                playerName: this.settingsData.playerName,
                peerId: this.settingsData.peerId,
                privateNotes: this.settingsData.privateNotes
            });
        } catch (error) {
            console.error('Settings fallback template failed:', error);
            throw new Error('Failed to load settings view');
        }
    }

    /**
     * updatePeerId implementation
     *
     * CRC: crc-SettingsView.md
     */
    updatePeerId(peerId: string): void {
        this.settingsData.peerId = peerId;
        this.logService.log(`Peer ID updated: ${peerId}`);
        this.saveSettings();

        // Update display if rendered
        const peerIdElement = this.container?.querySelector('#peer-id-display');
        if (peerIdElement) {
            peerIdElement.textContent = peerId;
        }
    }

    /**
     * updateHollowPeer implementation
     *
     * CRC: crc-SettingsView.md
     */
    updateHollowPeer(hollowPeer: HollowPeer): void {
        this.hollowPeer = hollowPeer;
        this.updatePeerCount();

        // Re-render the settings view to update peer ID
        if (this.container) {
            this.renderSettings(this.container);
        }
    }

    private peerCountInterval?: number;

    /**
     * startPeerCountUpdates implementation
     *
     * CRC: crc-SettingsView.md
     */
    startPeerCountUpdates(): void {
        this.updatePeerCount();
        this.peerCountInterval = window.setInterval(() => {
            this.updatePeerCount();
        }, 5000); // Update every 5 seconds
    }

    /**
     * updatePeerCount implementation
     *
     * CRC: crc-SettingsView.md
     */
    updatePeerCount(): void {
        const peerCountElement = this.container?.querySelector('#peer-count');
        if (peerCountElement && this.hollowPeer) {
            const connected = this.hollowPeer.getConnectedPeerCount();
            peerCountElement.textContent = `${connected}`;
        }
    }


    /**
     * refreshMusicButtonState implementation
     *
     * CRC: crc-SettingsView.md
     */
    refreshMusicButtonState(): void {
        if (this.audioManager) {
            AudioControlUtils.updateMusicButtonState(this);
        }
    }


    private async copyToClipboard(text: string): Promise<boolean> {
        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                console.log('Copied to clipboard using Clipboard API');
                return true;
            } catch (error) {
                console.warn('Clipboard API failed, trying fallback:', error);
            }
        }

        // Fallback for browsers without Clipboard API or when it fails
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);

            if (successful) {
                console.log('Copied to clipboard using execCommand fallback');
                return true;
            } else {
                console.error('execCommand copy failed');
                return false;
            }
        } catch (error) {
            console.error('All clipboard methods failed:', error);
            return false;
        }
    }


    private async showProfilePicker(): Promise<void> {
        const { getProfileService } = await import('../services/ProfileService.js');
        const profileService = getProfileService();
        const currentProfile = profileService.getCurrentProfile();
        const allProfiles = profileService.getAllProfiles();

        // Prepare template data
        const profiles = allProfiles.map(profile => ({
            name: profile.name,
            selected: profile.name === currentProfile.name
        }));

        try {
            const pickerHtml = await templateEngine.renderTemplateFromFile('profile-picker', {
                profiles
            });

            // Create overlay element
            const overlay = document.createElement('div');
            overlay.innerHTML = pickerHtml;
            document.body.appendChild(overlay.firstElementChild as HTMLElement);

            const pickerOverlay = document.querySelector('.profile-picker-overlay') as HTMLElement;
            if (!pickerOverlay) return;

            const createModal = pickerOverlay.querySelector('.profile-create-modal') as HTMLElement;
            const profileNameInput = pickerOverlay.querySelector('#new-profile-name') as HTMLInputElement;

            // Close button handler
            const closeBtn = pickerOverlay.querySelector('.profile-picker-close');
            closeBtn?.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                pickerOverlay.remove();
            });

            // Profile selection handler
            const profileItems = pickerOverlay.querySelectorAll('.profile-item');
            profileItems.forEach(item => {
                item.addEventListener('click', async () => {
                    await AudioControlUtils.playButtonSound(this.audioManager);
                    const profileName = item.getAttribute('data-profile-name');
                    if (profileName && profileName !== currentProfile.name) {
                        try {
                            profileService.setCurrentProfile(profileName);
                            this.logService.log(`Switched to profile: ${profileName}`);
                            
                            // Reload the current view by navigating to current route
                            window.location.reload();
                        } catch (error: any) {
                            this.logService.log(`Failed to switch profile: ${error.message}`);
                            alert(`Failed to switch profile: ${error.message}`);
                        }
                    }
                    pickerOverlay.remove();
                });
            });

            // Create new profile button - show modal
            const createBtn = pickerOverlay.querySelector('.profile-create-btn');
            createBtn?.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (createModal) {
                    createModal.style.display = 'flex';
                    profileNameInput?.focus();
                }
            });

            // Accept button in create modal
            const acceptBtn = pickerOverlay.querySelector('.profile-accept-btn');
            acceptBtn?.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const profileName = profileNameInput?.value.trim();
                if (profileName) {
                    try {
                        profileService.createProfile(profileName);
                        profileService.setCurrentProfile(profileName);
                        this.logService.log(`Created and switched to new profile: ${profileName}`);
                        
                        // Reload to show new profile
                        window.location.reload();
                    } catch (error: any) {
                        this.logService.log(`Failed to create profile: ${error.message}`);
                        alert(`Failed to create profile: ${error.message}`);
                    }
                }
            });

            // Cancel button in create modal
            const cancelBtn = pickerOverlay.querySelector('.profile-cancel-btn');
            cancelBtn?.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (createModal) {
                    createModal.style.display = 'none';
                    if (profileNameInput) profileNameInput.value = '';
                }
            });

            // Enter key in name input
            profileNameInput?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    acceptBtn?.dispatchEvent(new Event('click'));
                }
            });

            // Click outside to close
            pickerOverlay.addEventListener('click', async (e) => {
                if (e.target === pickerOverlay) {
                    await AudioControlUtils.playButtonSound(this.audioManager);
                    pickerOverlay.remove();
                }
            });
        } catch (error) {
            console.error('Failed to show profile picker:', error);
            this.logService.log(`Failed to show profile picker: ${error}`);
        }
    }

    /**
     * renderLog implementation
     *
     * CRC: crc-SettingsView.md
     */
    async renderLog(container: HTMLElement): Promise<void> {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        const entries = this.logService.getEntries();

        // Sort entries
        const sortedEntries = this.sortLogEntries(entries);

        // Format dates for display
        const formattedEntries = sortedEntries.map(entry => ({
            serial: entry.serial,
            date: this.formatDate(entry.date),
            message: entry.message
        }));

        try {
            const logHtml = await templateEngine.renderTemplateFromFile('log-view', {
                containerClass: this.config.containerClass,
                titleClass: this.config.titleClass,
                buttonClass: this.config.buttonClass,
                backButtonClass: this.config.backButtonClass,
                entries: formattedEntries,
                entryCount: entries.length,
                totalChars: this.logService.getTotalChars()
            });

            this.container.innerHTML = logHtml;
            this.updateSortIndicators();
            this.setupLogEventHandlers();
        } catch (error) {
            console.error('Failed to render log view:', error);
        }
    }

    private updateSortIndicators(): void {
        if (!this.container) return;

        // Remove all sort classes
        const headers = this.container.querySelectorAll('.sortable');
        headers.forEach(header => {
            header.classList.remove('sorted-asc', 'sorted-desc');
        });

        // Add the current sort class
        const currentHeader = this.container.querySelector(`[data-column="${this.logSortColumn}"]`);
        if (currentHeader) {
            currentHeader.classList.add(this.logSortAscending ? 'sorted-asc' : 'sorted-desc');
        }
    }

    private setupLogEventHandlers(): void {
        if (!this.container) return;

        // Back to settings button
        const backBtn = this.container.querySelector('#back-to-settings-btn');
        backBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            router.navigate('/settings');
        });

        // Clear log button
        const clearBtn = this.container.querySelector('#clear-log-btn');
        clearBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            if (confirm('Are you sure you want to clear all log entries?')) {
                this.logService.clear();
                // Refresh the log view by navigating to the same route
                router.navigate('/settings/log');
            }
        });

        // Filter input
        const filterInput = this.container.querySelector('#log-filter') as HTMLInputElement;
        filterInput?.addEventListener('input', () => {
            this.filterLogTable(filterInput.value);
        });

        // Sortable columns
        const sortableHeaders = this.container.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const column = header.getAttribute('data-column');
                if (column) {
                    this.handleSort(column);
                }
            });
        });
    }

    private handleSort(column: string): void {
        if (this.logSortColumn === column) {
            this.logSortAscending = !this.logSortAscending;
        } else {
            this.logSortColumn = column;
            this.logSortAscending = true;
        }
        // Refresh the log view by navigating to the same route
        router.navigate('/settings/log');
    }

    private sortLogEntries(entries: ILogEntry[]): ILogEntry[] {
        const sorted = [...entries];

        sorted.sort((a, b) => {
            let comparison = 0;

            if (this.logSortColumn === 'serial') {
                comparison = a.serial - b.serial;
            } else if (this.logSortColumn === 'date') {
                comparison = a.date.getTime() - b.date.getTime();
            } else if (this.logSortColumn === 'message') {
                comparison = a.message.localeCompare(b.message);
            }

            return this.logSortAscending ? comparison : -comparison;
        });

        return sorted;
    }

    private filterLogTable(filterText: string): void {
        if (!this.container) return;

        const tbody = this.container.querySelector('#log-table-body');
        if (!tbody) return;

        const rows = tbody.querySelectorAll('tr');
        const lowerFilter = filterText.toLowerCase();

        rows.forEach(row => {
            const message = row.querySelector('.log-message')?.textContent || '';
            const date = row.querySelector('.log-date')?.textContent || '';
            const serial = row.querySelector('.log-serial')?.textContent || '';

            const matches = message.toLowerCase().includes(lowerFilter) ||
                          date.toLowerCase().includes(lowerFilter) ||
                          serial.includes(lowerFilter);

            (row as HTMLElement).style.display = matches ? '' : 'none';
        });
    }

    private formatDate(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
}
