import { IUIComponent } from './SplashScreen.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { AudioControlUtils, IEnhancedAudioControlSupport } from '../utils/AudioControlUtils.js';
import { IAudioManager } from '../audio/AudioManager.js';
import { MilkdownUtils, IMilkdownEditor } from '../utils/MilkdownUtils.js';
import { LogService, ILogEntry } from '../services/LogService.js';
import { router } from '../utils/Router.js';
import '../styles/SettingsView.css';

export interface ISettingsView extends IUIComponent {
    onBackToMenu?: () => void;
    audioManager?: IAudioManager;
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
    private config: ISettingsViewConfig;
    public container: HTMLElement | null = null;
    public onBackToMenu?: () => void;
    public audioManager?: IAudioManager;
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
        audioManager?: IAudioManager
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.audioManager = audioManager;
        this.settingsData = this.loadSettings();
        this.logService = new LogService();
    }

    async renderSettings(container: HTMLElement): Promise<void> {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;

        try {
            const templateData = {
                containerClass: this.config.containerClass,
                titleClass: this.config.titleClass,
                sectionClass: this.config.sectionClass,
                fieldClass: this.config.fieldClass,
                buttonClass: this.config.buttonClass,
                backButtonClass: this.config.backButtonClass,
                playerName: this.settingsData.playerName,
                peerId: this.settingsData.peerId,
                privateNotes: this.settingsData.privateNotes,
                friends: this.settingsData.friends,
                hasAudioManager: !!this.audioManager
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
            const stored = localStorage.getItem('hollowWorldSettings');
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

            localStorage.setItem('hollowWorldSettings', JSON.stringify(this.settingsData));
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

            const invitation = this.createInvitation(friendName, friendId, notes);
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

            // TODO: Send requestFriend message via P2P
            this.logService.log(`Accepting invitation from peer: ${parsed.peerId} (code: ${parsed.inviteCode})`);
            console.log('Accepting invitation:', parsed);
            alert('Friend request sent! (P2P integration pending)');

            if (acceptModal) acceptModal.style.display = 'none';
            if (acceptedInvitationInput) acceptedInvitationInput.value = '';
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

    private createInvitation(friendName: string, friendId: string | null, notes: string): string {
        const inviteCode = this.generateInviteCode();

        // Store the invitation
        this.settingsData.activeInvitations[inviteCode] = {
            friendName,
            friendId,
            notes
        };
        this.logService.log(`Invitation generated for: ${friendName} (code: ${inviteCode})`);
        this.saveSettings();

        // Create invitation string: inviteCode-peerID
        return `${inviteCode}-${this.settingsData.peerId}`;
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
        const parts = invitation.split('-');
        if (parts.length >= 2) {
            const inviteCode = parts[0];
            const peerId = parts.slice(1).join('-'); // Rejoin in case peer ID contains dashes
            return { inviteCode, peerId };
        }
        return null;
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