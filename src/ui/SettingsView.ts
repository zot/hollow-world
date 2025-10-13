import { IUIComponent } from './SplashScreen.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { AudioControlUtils, IEnhancedAudioControlSupport } from '../utils/AudioControlUtils.js';
import { IAudioManager } from '../audio/AudioManager.js';
import { MilkdownUtils, IMilkdownEditor } from '../utils/MilkdownUtils.js';
import { LogService, ILogEntry } from '../services/LogService.js';
import { HollowPeer } from '../p2p/index.js';
import { router } from '../utils/Router.js';
import { getProfileService } from '../services/ProfileService.js';
import '../styles/SettingsView.css';

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
    activeInvitations: Record<string, IInvitation>;
}

export interface IFriend {
    id: string;
    peerId: string;
    playerName: string;
    notes: string;
}

export interface IInvitation {
    friendName: string;
    friendId: string | null;
    notes: string;
}

const DEFAULT_CONFIG: ISettingsViewConfig = {
    containerClass: 'settings-container',
    titleClass: 'settings-title',
    sectionClass: 'settings-section',
    fieldClass: 'settings-field',
    buttonClass: 'settings-button',
    backButtonClass: 'settings-back-button'
};

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
    private privateNotesEditor: IMilkdownEditor | null = null;
    private inviteFriendNotesEditor: IMilkdownEditor | null = null;
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

            // Load friends from HollowPeer if available, otherwise use settingsData
            let friendsArray: IFriend[] = this.settingsData.friends;
            if (this.hollowPeer) {
                const friendsMap = this.hollowPeer.getAllFriends();
                friendsArray = Array.from(friendsMap.values());
            }

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
                friends: friendsArray,
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

    destroy(): void {
        if (this.peerCountInterval) {
            clearInterval(this.peerCountInterval);
            this.peerCountInterval = undefined;
        }
        if (this.privateNotesEditor) {
            this.privateNotesEditor.destroy();
            this.privateNotesEditor = null;
        }
        if (this.inviteFriendNotesEditor) {
            this.inviteFriendNotesEditor.destroy();
            this.inviteFriendNotesEditor = null;
        }
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
        this.backButtonElement = null;
        this.playerNameInput = null;
        this.musicButtonElement = null;
    }

    private loadSettings(): ISettingsData {
        // Load settings from localStorage or use defaults
        const defaultSettings: ISettingsData = {
            playerName: '',
            peerId: '', // Will be populated from network provider
            privateNotes: '',
            friends: [],
            activeInvitations: {}
        };

        try {
            const stored = getProfileService().getItem(this.STORAGE_KEY);
            if (stored) {
                return { ...defaultSettings, ...JSON.parse(stored) };
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
        // Private notes are auto-saved via Milkdown onChange callback

        // Invite Friend modal
        const inviteFriendBtn = this.container?.querySelector('#invite-friend-btn');
        const inviteModal = this.container?.querySelector('#invite-modal') as HTMLElement;
        const closeInviteModalBtn = this.container?.querySelector('#close-invite-modal-btn');
        const generateInviteBtn = this.container?.querySelector('#generate-invite-btn');
        const copyInvitationBtn = this.container?.querySelector('#copy-invitation-btn') as HTMLButtonElement;
        const invitationCodeInput = this.container?.querySelector('#invitation-code') as HTMLInputElement;
        const friendNameInput = this.container?.querySelector('#invite-friend-name') as HTMLInputElement;
        const friendIdInput = this.container?.querySelector('#invite-friend-id') as HTMLInputElement;

        inviteFriendBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            if (inviteModal) inviteModal.style.display = 'flex';

            // Initialize notes editor if not already created
            const notesContainer = this.container?.querySelector('#invite-friend-notes') as HTMLElement;
            if (notesContainer && !this.inviteFriendNotesEditor) {
                this.inviteFriendNotesEditor = await MilkdownUtils.createEditor(notesContainer, '');
            }
        });

        closeInviteModalBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            if (inviteModal) inviteModal.style.display = 'none';
            // Clear inputs
            if (friendNameInput) friendNameInput.value = '';
            if (friendIdInput) friendIdInput.value = '';
            if (invitationCodeInput) invitationCodeInput.value = '';
            if (copyInvitationBtn) copyInvitationBtn.disabled = true;

            // Clear and destroy notes editor
            if (this.inviteFriendNotesEditor) {
                this.inviteFriendNotesEditor.destroy();
                this.inviteFriendNotesEditor = null;
            }
        });

        generateInviteBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            const friendName = friendNameInput?.value.trim();
            const friendId = friendIdInput?.value.trim() || null;
            const notes = this.inviteFriendNotesEditor?.getMarkdown() || '';

            if (!friendName) {
                alert('Please enter a friend name');
                return;
            }

            const invitation = await this.createInvitation(friendName, friendId, notes);
            if (invitationCodeInput) {
                invitationCodeInput.value = invitation;
            }
            if (copyInvitationBtn) {
                copyInvitationBtn.disabled = false;
            }
        });

        copyInvitationBtn?.addEventListener('click', async () => {
            const invitation = invitationCodeInput?.value;
            if (invitation) {
                // Copy to clipboard first to preserve user gesture
                const success = await this.copyToClipboard(invitation);
                // Play sound after clipboard operation
                await AudioControlUtils.playButtonSound(this.audioManager);

                if (success) {
                    copyInvitationBtn.textContent = '✓';
                    setTimeout(() => {
                        copyInvitationBtn.textContent = '📋';
                    }, 2000);
                } else {
                    alert('Failed to copy to clipboard. Please copy manually.');
                }
            }
        });

        // Accept Invitation modal
        const acceptInvitationBtn = this.container?.querySelector('#accept-invitation-btn');
        const acceptModal = this.container?.querySelector('#accept-modal') as HTMLElement;
        const closeAcceptModalBtn = this.container?.querySelector('#close-accept-modal-btn');
        const acceptInviteBtn = this.container?.querySelector('#accept-invite-btn');
        const acceptedInvitationInput = this.container?.querySelector('#accepted-invitation') as HTMLInputElement;

        acceptInvitationBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            if (acceptModal) acceptModal.style.display = 'flex';
        });

        closeAcceptModalBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            if (acceptModal) acceptModal.style.display = 'none';
            if (acceptedInvitationInput) acceptedInvitationInput.value = '';
        });

        acceptInviteBtn?.addEventListener('click', async () => {
            await AudioControlUtils.playButtonSound(this.audioManager);
            const invitation = acceptedInvitationInput?.value.trim();
            if (!invitation) {
                alert('Please enter an invitation code');
                return;
            }

            const parsed = this.parseInvitation(invitation);
            if (!parsed) {
                this.logService.log('Failed to accept invitation: Invalid format');
                alert('Invalid invitation format');
                return;
            }

            // Send requestFriend message via P2P
            if (!this.hollowPeer) {
                this.logService.log('Failed to send friend request: P2P not initialized');
                alert('P2P system not initialized. Please try again later.');
                return;
            }

            try {
                await this.hollowPeer.sendRequestFriend(invitation);
                this.logService.log(`Friend request sent to peer: ${parsed.peerId} (code: ${parsed.inviteCode})`);
                console.log('✅ Friend request sent successfully:', parsed);
                alert('Friend request sent successfully!');
            } catch (error: any) {
                this.logService.log(`Failed to send friend request: ${error.message}`);
                console.error('❌ Failed to send friend request:', error);
                alert(`Failed to send friend request: ${error.message}`);
                return;
            }

            if (acceptModal) acceptModal.style.display = 'none';
            if (acceptedInvitationInput) acceptedInvitationInput.value = '';
        });

        // Friend card expand/collapse handlers
        this.setupFriendCardHandlers();
    }

    private setupFriendCardHandlers(): void {
        if (!this.container) return;

        const friendsList = this.container.querySelector('#friends-list');
        if (!friendsList) return;

        // Use event delegation for friend card interactions
        friendsList.addEventListener('click', async (e: Event) => {
            const target = e.target as HTMLElement;

            // Handle clicking on collapsed card to expand
            const collapsedCard = target.closest('.friend-card-collapsed');
            if (collapsedCard && !target.classList.contains('friend-kill-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const friendCard = collapsedCard.closest('.friend-card') as HTMLElement;
                if (friendCard) {
                    this.expandFriendCard(friendCard);
                }
                return;
            }

            // Handle clicking on header to collapse (except collapse button)
            const cardHeader = target.closest('.friend-card-header');
            if (cardHeader && !target.classList.contains('friend-collapse-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const friendCard = cardHeader.closest('.friend-card') as HTMLElement;
                if (friendCard) {
                    this.collapseFriendCard(friendCard);
                }
                return;
            }

            // Handle collapse button
            if (target.classList.contains('friend-collapse-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const friendCard = target.closest('.friend-card') as HTMLElement;
                if (friendCard) {
                    this.collapseFriendCard(friendCard);
                }
                return;
            }

            // Handle kill button (quick remove)
            if (target.classList.contains('friend-kill-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const peerId = target.getAttribute('data-friend-id');
                if (peerId && this.hollowPeer) {
                    if (confirm('Remove this friend?')) {
                        this.hollowPeer.removeFriend(peerId);
                        this.logService.log(`Removed friend: ${peerId}`);
                        // Re-render to update the list
                        if (this.container) {
                            this.renderSettings(this.container);
                        }
                    }
                }
                return;
            }

            // Handle remove button in expanded state
            if (target.classList.contains('remove-friend-btn')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                const peerId = target.getAttribute('data-friend-id');
                if (peerId && this.hollowPeer) {
                    if (confirm('Remove this friend?')) {
                        this.hollowPeer.removeFriend(peerId);
                        this.logService.log(`Removed friend: ${peerId}`);
                        // Re-render to update the list
                        if (this.container) {
                            this.renderSettings(this.container);
                        }
                    }
                }
                return;
            }
        });

        // Handle friend name input changes (blur event for auto-save)
        friendsList.addEventListener('blur', (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('friend-name-input')) {
                const input = target as HTMLInputElement;
                const peerId = input.getAttribute('data-friend-id');
                const newName = input.value.trim();

                if (peerId && newName && this.hollowPeer) {
                    // Update friend name in FriendsManager
                    const friendsManager = this.hollowPeer.getFriendsManager();
                    const friend = friendsManager.getAllFriends().get(peerId);
                    if (friend) {
                        friend.playerName = newName;
                        friendsManager.updateFriend(peerId, friend);
                        this.logService.log(`Updated friend name: ${newName}`);
                    }
                }
            }
        }, true); // Use capture phase for blur events
    }

    private expandFriendCard(friendCard: HTMLElement): void {
        const collapsedSection = friendCard.querySelector('.friend-card-collapsed') as HTMLElement;
        const expandedSection = friendCard.querySelector('.friend-card-expanded') as HTMLElement;

        if (collapsedSection && expandedSection) {
            collapsedSection.style.display = 'none';
            expandedSection.style.display = 'block';
            friendCard.setAttribute('data-expanded', 'true');

            // Initialize Milkdown editor for notes if not already initialized
            const peerId = friendCard.getAttribute('data-friend-id');
            if (peerId) {
                this.initializeFriendNotesEditor(peerId);
            }
        }
    }

    private collapseFriendCard(friendCard: HTMLElement): void {
        const collapsedSection = friendCard.querySelector('.friend-card-collapsed') as HTMLElement;
        const expandedSection = friendCard.querySelector('.friend-card-expanded') as HTMLElement;

        if (collapsedSection && expandedSection) {
            collapsedSection.style.display = 'flex';
            expandedSection.style.display = 'none';
            friendCard.setAttribute('data-expanded', 'false');
        }
    }

    private async initializeFriendNotesEditor(peerId: string): Promise<void> {
        const notesContainer = this.container?.querySelector(`#friend-notes-${peerId}`) as HTMLElement;
        if (!notesContainer || notesContainer.querySelector('.milkdown')) {
            return; // Already initialized
        }

        if (!this.hollowPeer) return;

        const friendsManager = this.hollowPeer.getFriendsManager();
        const friend = friendsManager.getAllFriends().get(peerId);
        if (!friend) return;

        // Create Milkdown editor for this friend's notes
        await MilkdownUtils.createEditor(
            notesContainer,
            friend.notes || '',
            (markdown) => {
                // Auto-save notes on change
                friend.notes = markdown;
                friendsManager.updateFriend(peerId, friend);
                this.logService.log(`Updated friend notes for: ${friend.playerName}`);
            }
        );
    }

    private setupEventCardHandlers(): void {
        // Use event delegation for dynamically rendered event cards
        document.addEventListener('click', async (e: Event) => {
            const target = e.target as HTMLElement;

            // Handle Accept button in friend request events
            if (target.classList.contains('event-action-accept')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                
                const peerId = target.getAttribute('data-peer-id');
                const friendName = target.getAttribute('data-friend-name');
                const inviteCode = target.getAttribute('data-invite-code');
                const eventId = target.getAttribute('data-event-id');

                if (!peerId || !friendName || !inviteCode) {
                    this.logService.log('Invalid friend request event data');
                    console.error('Missing data attributes on Accept button');
                    return;
                }

                if (!this.hollowPeer) {
                    this.logService.log('Failed to accept friend request: P2P not initialized');
                    alert('P2P system not initialized');
                    return;
                }

                try {
                    // Call HollowPeer's approveFriendRequest method
                    await this.hollowPeer.approveFriendRequest(peerId, friendName, inviteCode, true);
                    this.logService.log(`Accepted friend request from ${friendName} (${peerId})`);
                    console.log(`✅ Accepted friend request from ${friendName}`);

                    // Remove the event
                    if (eventId) {
                        const eventService = this.hollowPeer.getEventService();
                        eventService.removeEvent(eventId);
                    }
                } catch (error: any) {
                    this.logService.log(`Failed to accept friend request: ${error.message}`);
                    console.error('❌ Failed to accept friend request:', error);
                    alert(`Failed to accept friend request: ${error.message}`);
                }
            }

            // Handle Decline button in friend request events
            if (target.classList.contains('event-action-decline')) {
                await AudioControlUtils.playButtonSound(this.audioManager);

                const peerId = target.getAttribute('data-peer-id');
                const friendName = target.getAttribute('data-friend-name');
                const inviteCode = target.getAttribute('data-invite-code');
                const eventId = target.getAttribute('data-event-id');

                if (!peerId || !friendName || !inviteCode) {
                    this.logService.log('Invalid friend request event data');
                    console.error('Missing data attributes on Decline button');
                    return;
                }

                if (!this.hollowPeer) {
                    this.logService.log('Failed to decline friend request: P2P not initialized');
                    alert('P2P system not initialized');
                    return;
                }

                try {
                    // Call HollowPeer's approveFriendRequest method with approved: false
                    await this.hollowPeer.approveFriendRequest(peerId, friendName, inviteCode, false);
                    this.logService.log(`Declined friend request from ${friendName} (${peerId})`);
                    console.log(`❌ Declined friend request from ${friendName}`);

                    // Remove the event
                    if (eventId) {
                        const eventService = this.hollowPeer.getEventService();
                        eventService.removeEvent(eventId);
                    }
                } catch (error: any) {
                    this.logService.log(`Failed to decline friend request: ${error.message}`);
                    console.error('❌ Failed to decline friend request:', error);
                    alert(`Failed to decline friend request: ${error.message}`);
                }
            }

            // Handle Ignore button in friend request events
            if (target.classList.contains('event-action-ignore')) {
                await AudioControlUtils.playButtonSound(this.audioManager);
                
                const eventId = target.getAttribute('data-event-id');
                if (!eventId) {
                    console.error('Missing event ID on Ignore button');
                    return;
                }

                if (!this.hollowPeer) {
                    return;
                }

                // Just remove the event without sending approval
                const eventService = this.hollowPeer.getEventService();
                eventService.removeEvent(eventId);
                this.logService.log('Ignored friend request');
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
            console.warn('Settings fallback template failed, using minimal HTML:', error);
            return `
<div class="${this.config.containerClass}">
    <h1 class="${this.config.titleClass}">Settings</h1>
    <div class="${this.config.sectionClass}">
        <label for="player-name-input">Player Name:</label>
        <input type="text" id="player-name-input" value="${this.settingsData.playerName}" />
    </div>
    <div class="${this.config.sectionClass}">
        <label>Peer ID:</label>
        <span>${this.settingsData.peerId}</span>
    </div>
    <div class="${this.config.sectionClass}">
        <label>Private Notes:</label>
        <div id="private-notes-editor" class="milkdown-editor"></div>
    </div>
    <button class="${this.config.backButtonClass}">Back to Menu</button>
</div>`;
        }
    }

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

    updateHollowPeer(hollowPeer: HollowPeer): void {
        this.hollowPeer = hollowPeer;
        this.updatePeerCount();
        
        // Re-render the settings view to display friends from HollowPeer
        if (this.container) {
            this.renderSettings(this.container);
        }
    }

    private peerCountInterval?: number;

    startPeerCountUpdates(): void {
        this.updatePeerCount();
        this.peerCountInterval = window.setInterval(() => {
            this.updatePeerCount();
        }, 5000); // Update every 5 seconds
    }

    updatePeerCount(): void {
        const peerCountElement = this.container?.querySelector('#peer-count');
        if (peerCountElement && this.hollowPeer) {
            peerCountElement.textContent = this.hollowPeer.getConnectedPeerCount().toString();
        }
    }

    addFriend(friend: IFriend): void {
        this.settingsData.friends.push(friend);
        this.logService.log(`Friend added: ${friend.playerName} (${friend.peerId})`);
        this.saveSettings();
        // TODO: Re-render friends list section
    }

    removeFriend(friendId: string): void {
        const friend = this.settingsData.friends.find(f => f.id === friendId);
        this.settingsData.friends = this.settingsData.friends.filter(f => f.id !== friendId);
        if (friend) {
            this.logService.log(`Friend removed: ${friend.playerName}`);
        }
        this.saveSettings();
        // TODO: Re-render friends list section
    }

    refreshMusicButtonState(): void {
        if (this.audioManager) {
            AudioControlUtils.updateMusicButtonState(this);
        }
    }

    private generateInviteCode(): string {
        // Generate a random invite code (8 characters)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    private async createInvitation(friendName: string, friendId: string | null, notes: string): Promise<string> {
        if (!this.hollowPeer) {
            this.logService.log('Failed to create invitation: P2P not initialized');
            throw new Error('P2P system not initialized');
        }

        // Use HollowPeer's createInvitation method (notes are UI-only, not stored in invitation)
        const invitation = await this.hollowPeer.createInvitation(friendName, friendId);
        this.logService.log(`Invitation generated for: ${friendName}`);

        return invitation;
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

    private parseInvitation(invitation: string): { inviteCode: string; peerId: string } | null {
        try {
            // Decode base64-encoded invitation JSON
            const decodedJson = atob(invitation);
            const parsed = JSON.parse(decodedJson);

            // Validate invitation structure
            if (parsed.inviteCode && parsed.peerId) {
                return { inviteCode: parsed.inviteCode, peerId: parsed.peerId };
            }
            return null;
        } catch (error) {
            // If base64 decode or JSON parse fails, return null
            return null;
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