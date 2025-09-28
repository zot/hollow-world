import { IUIComponent } from './SplashScreen.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { AudioControlUtils, IEnhancedAudioControlSupport } from '../utils/AudioControlUtils.js';
import { IAudioManager } from '../audio/AudioManager.js';
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
}

export interface IFriend {
    id: string;
    peerId: string;
    playerName: string;
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
    private privateNotesTextarea: HTMLTextAreaElement | null = null;
    public musicButtonElement: HTMLElement | null = null;

    constructor(
        config: ISettingsViewConfig = DEFAULT_CONFIG,
        audioManager?: IAudioManager
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.audioManager = audioManager;
        this.settingsData = this.loadSettings();
    }

    async render(container: HTMLElement): Promise<void> {
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
        this.setupEventHandlers();

        if (this.audioManager) {
            AudioControlUtils.setupEnhancedAudioControls(this);
            AudioControlUtils.updateEnhancedAudioState(this);
        }
    }

    destroy(): void {
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
        this.backButtonElement = null;
        this.playerNameInput = null;
        this.privateNotesTextarea = null;
        this.musicButtonElement = null;
    }

    private loadSettings(): ISettingsData {
        // Load settings from localStorage or use defaults
        const defaultSettings: ISettingsData = {
            playerName: '',
            peerId: '', // Will be populated from network provider
            privateNotes: '',
            friends: []
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
            if (this.privateNotesTextarea) {
                this.settingsData.privateNotes = this.privateNotesTextarea.value;
            }

            localStorage.setItem('hollowWorldSettings', JSON.stringify(this.settingsData));
            console.log('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings to localStorage:', error);
        }
    }

    private setupElementReferences(): void {
        if (!this.container) return;

        this.backButtonElement = this.container.querySelector(`.${this.config.backButtonClass}`);
        this.playerNameInput = this.container.querySelector('#player-name-input') as HTMLInputElement;
        this.privateNotesTextarea = this.container.querySelector('#private-notes-textarea') as HTMLTextAreaElement;
        this.musicButtonElement = this.container.querySelector('#music-toggle-btn'); // Enhanced control only
    }

    private setupEventHandlers(): void {
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

        if (this.privateNotesTextarea) {
            this.privateNotesTextarea.addEventListener('blur', () => {
                this.saveSettings();
            });
        }
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
        <label for="private-notes-textarea">Private Notes:</label>
        <textarea id="private-notes-textarea">${this.settingsData.privateNotes}</textarea>
    </div>
    <button class="${this.config.backButtonClass}">Back to Menu</button>
</div>`;
        }
    }

    updatePeerId(peerId: string): void {
        this.settingsData.peerId = peerId;
        this.saveSettings();

        // Update display if rendered
        const peerIdElement = this.container?.querySelector('#peer-id-display');
        if (peerIdElement) {
            peerIdElement.textContent = peerId;
        }
    }

    addFriend(friend: IFriend): void {
        this.settingsData.friends.push(friend);
        this.saveSettings();
        // TODO: Re-render friends list section
    }

    removeFriend(friendId: string): void {
        this.settingsData.friends = this.settingsData.friends.filter(f => f.id !== friendId);
        this.saveSettings();
        // TODO: Re-render friends list section
    }

    refreshMusicButtonState(): void {
        if (this.audioManager) {
            AudioControlUtils.updateMusicButtonState(this);
        }
    }
}