/**
 * SplashScreen - Main Menu Interface
 *
 * CRC: crc-SplashScreen.md
 * Spec: ui.splash.md
 * Sequences: seq-app-startup.md, seq-navigate-from-splash.md
 *
 * @template public/templates/splash-screen.html
 */

import { IAudioManager } from '../audio/AudioManager.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { VERSION } from '../version.js';
import { AudioControlUtils, IEnhancedAudioControlSupport } from '../utils/AudioControlUtils.js';

// Splash screen template is now loaded from splash-screen.html

// Interface for UI components (Interface Segregation Principle)
export interface IUIComponent {
    render(container: HTMLElement): Promise<void>;
    destroy(): void;
}

/**
 * ISplashScreen interface
 *
 * CRC: crc-SplashScreen.md
 */
export interface ISplashScreen extends IUIComponent {
    updatePeerId(peerId: string): void;
    onPeerIdClick?: () => void;
    onJoinGame?: () => void;
    onCharacters?: () => void;
    onFriends?: () => void;
    onCredits?: () => void;
    onSettings?: () => void;
    onAdventure?: () => void;
    toggleMusic?(): Promise<void>;
}

// Splash screen styling configuration (Single Responsibility)
export interface ISplashScreenConfig {
    title: string;
    titleClass: string;
    peerIdClass: string;
    containerClass: string;
    buttonsContainerClass: string;
    joinButtonClass: string;
    charactersButtonClass: string;
    friendsButtonClass: string;
    adventureButtonClass: string;
    musicButtonClass: string;
    settingsButtonClass: string;
}

// Default configuration
const DEFAULT_CONFIG: ISplashScreenConfig = {
    title: "Don't Go Hollow",
    titleClass: 'splash-title',
    peerIdClass: 'splash-peer-id',
    containerClass: 'splash-container',
    buttonsContainerClass: 'splash-buttons-container',
    joinButtonClass: 'splash-join-button',
    charactersButtonClass: 'splash-characters-button',
    friendsButtonClass: 'splash-friends-button',
    adventureButtonClass: 'splash-adventure-button',
    musicButtonClass: 'splash-music-button',
    settingsButtonClass: 'splash-settings-button'
};

/**
 * SplashScreen - Main menu with navigation to all app sections
 *
 * CRC: crc-SplashScreen.md
 * Spec: ui.splash.md
 * Sequences: seq-app-startup.md, seq-navigate-from-splash.md
 *
 * Purpose: Display application title, peer ID, and navigation buttons to access
 * characters, friends, settings, and adventure modes.
 *
 * Template: public/templates/splash-screen.html
 *
 * Key Features:
 * - Displays peer ID (clickable for settings)
 * - Navigation buttons to all major views
 * - Credits popup
 * - Application version display
 */
export class SplashScreen implements ISplashScreen, IEnhancedAudioControlSupport {
    public audioManager?: IAudioManager;
    private config: ISplashScreenConfig;
    public container: HTMLElement | null = null;
    private peerIdElement: HTMLElement | null = null;
    private currentPeerId: string = '';
    public onPeerIdClick?: () => void;
    public onJoinGame?: () => void;
    public onCharacters?: () => void;
    public onFriends?: () => void;
    public onCredits?: () => void;
    public onSettings?: () => void;
    public onAdventure?: () => void;
    private joinButtonElement: HTMLElement | null = null;
    private charactersButtonElement: HTMLElement | null = null;
    private friendsButtonElement: HTMLElement | null = null;
    private adventureButtonElement: HTMLElement | null = null;
    private creditsButtonElement: HTMLElement | null = null;
    private settingsButtonElement: HTMLElement | null = null;
    public musicButtonElement: HTMLElement | null = null;

    constructor(
        config: ISplashScreenConfig = DEFAULT_CONFIG,
        audioManager?: IAudioManager
    ) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.audioManager = audioManager;
        this.currentPeerId = 'Initializing...';
    }

    async initialize(): Promise<void> {
        // SplashScreen is a dumb UI component - no initialization needed
        // Peer ID will be set by main.ts after HollowPeer initializes
    }

    /**
     * render implementation
     *
     * CRC: crc-SplashScreen.md
     * Sequence: seq-app-startup.md
     */
    async render(container: HTMLElement): Promise<void> {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;

        try {
            // Use embedded version
            const version = VERSION;
            console.log(`Current version: ${version}`);

            // Prepare template data
            const titleWithSpookyHollow = this.config.title.replace(
                /\bHollow\b/gi,
                '<span class="hollow-word">Hollow</span>'
            );

            const templateData = {
                containerClass: this.config.containerClass,
                titleClass: this.config.titleClass,
                titleWithHollow: titleWithSpookyHollow,
                peerIdClass: this.config.peerIdClass,
                currentPeerId: this.currentPeerId,
                buttonsContainerClass: this.config.buttonsContainerClass,
                joinButtonClass: this.config.joinButtonClass,
                charactersButtonClass: this.config.charactersButtonClass,
                friendsButtonClass: this.config.friendsButtonClass,
                adventureButtonClass: this.config.adventureButtonClass,
                hasAudioManager: !!this.audioManager,
                musicButtonClass: this.config.musicButtonClass,
                settingsButtonClass: this.config.settingsButtonClass,
                version: version
            };

            // Debug: Show audioManager state
            console.log('🎵 SplashScreen audioManager debug:');
            console.log('  - audioManager exists:', !!this.audioManager);
            console.log('  - audioManager type:', typeof this.audioManager);
            console.log('  - audioManager:', this.audioManager);
            console.log('  - hasAudioManager template value:', templateData.hasAudioManager);

            // Render template from file
            const splashHtml = await templateEngine.renderTemplateFromFile('splash-screen', templateData);
            container.innerHTML = splashHtml;

            // Inject enhanced audio control if audio manager is available
            if (this.audioManager) {
                const audioControlHtml = await AudioControlUtils.renderEnhancedAudioControl(this);
                const splashContainer = container.querySelector(`.${this.config.containerClass}`);
                
                if (splashContainer) {
                    splashContainer.insertAdjacentHTML('beforeend', audioControlHtml);
                }
            }

        } catch (error) {
            console.error('Failed to render splash screen template:', error);
            // Fallback to inline HTML for error recovery
            container.innerHTML = await this.createSplashHTMLFallback();
        }

        // Set up element references and interactions
        this.peerIdElement = container.querySelector(`.${this.config.peerIdClass}`);
        this.joinButtonElement = container.querySelector(`.${this.config.joinButtonClass}`);
        this.charactersButtonElement = container.querySelector(`.${this.config.charactersButtonClass}`);
        this.friendsButtonElement = container.querySelector(`.${this.config.friendsButtonClass}`);
        this.adventureButtonElement = container.querySelector(`.${this.config.adventureButtonClass}`);
        this.creditsButtonElement = container.querySelector('.splash-credits-button');
        this.settingsButtonElement = container.querySelector(`.${this.config.settingsButtonClass}`);
        this.musicButtonElement = container.querySelector('#music-toggle-btn'); // Enhanced control only

        if (this.peerIdElement) {
            this.setupPeerIdInteraction();
        }

        this.setupButtonInteractions();
        AudioControlUtils.setupEnhancedAudioControls(this);
        AudioControlUtils.updateEnhancedAudioState(this);
        this.applyStyles();
    }

    /**
     * updatePeerId implementation
     *
     * CRC: crc-SplashScreen.md
     */
    updatePeerId(peerId: string): void {
        console.log('📍 updatePeerId called with:', peerId);
        console.log('📍 peerIdElement exists:', !!this.peerIdElement);
        this.currentPeerId = peerId;
        if (this.peerIdElement) {
            const newText = peerId; // Just the peer ID value, no "Peer ID:" label
            console.log('📍 Setting peer ID text to:', newText);
            this.peerIdElement.textContent = newText;
            // Force repaint
            this.peerIdElement.style.display = 'none';
            this.peerIdElement.offsetHeight; // Trigger reflow
            this.peerIdElement.style.display = '';
            console.log('📍 Peer ID element textContent is now:', this.peerIdElement.textContent);
        } else {
            console.warn('📍 Cannot update peer ID: peerIdElement is null');
        }
    }

    /**
     * destroy implementation
     *
     * CRC: crc-SplashScreen.md
     */
    destroy(): void {
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
        this.peerIdElement = null;
        this.joinButtonElement = null;
        this.charactersButtonElement = null;
        this.friendsButtonElement = null;
        this.adventureButtonElement = null;
        this.settingsButtonElement = null;
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

    private async createSplashHTMLFallback(): Promise<string> {
        try {
            // Prepare template data same as main render method
            const titleWithSpookyHollow = this.config.title.replace(
                /\bHollow\b/gi,
                '<span class="hollow-word">Hollow</span>'
            );

            const templateData = {
                containerClass: this.config.containerClass,
                titleClass: this.config.titleClass,
                titleWithHollow: titleWithSpookyHollow,
                peerIdClass: this.config.peerIdClass,
                currentPeerId: this.currentPeerId,
                buttonsContainerClass: this.config.buttonsContainerClass,
                joinButtonClass: this.config.joinButtonClass,
                charactersButtonClass: this.config.charactersButtonClass,
                friendsButtonClass: this.config.friendsButtonClass,
                adventureButtonClass: this.config.adventureButtonClass,
                hasAudioManager: !!this.audioManager,
                musicButtonClass: this.config.musicButtonClass,
                settingsButtonClass: this.config.settingsButtonClass,
                version: VERSION
            };

            // Use HTML template instead of template literals
            return await templateEngine.renderTemplateFromFile('splash-fallback', templateData);
        } catch (error) {
            console.warn('Failed to use template for fallback, using minimal HTML:', error);
            // Ultra-minimal fallback if template system fails
            try {
                return await templateEngine.renderTemplateFromFile('splash-minimal', {
                    currentPeerId: this.currentPeerId
                });
            } catch (minimalError) {
                console.error('Even minimal template failed:', minimalError);
                return await templateEngine.renderTemplateFromFile('splash-interface-error', {});
            }
        }
    }

    /**
     * setupPeerIdInteraction implementation
     *
     * CRC: crc-SplashScreen.md
     */
    private setupPeerIdInteraction(): void {
        if (!this.peerIdElement) return;

        // Make peer ID clickable to copy
        this.peerIdElement.style.cursor = 'pointer';

        // Add click handler to copy to clipboard
        this.peerIdElement.addEventListener('click', async () => {
            await this.copyPeerIdToClipboard();
            if (this.onPeerIdClick) {
                this.onPeerIdClick();
            }
        });
    }

    /**
     * setupButtonInteractions implementation
     *
     * CRC: crc-SplashScreen.md
     * Sequence: seq-navigate-from-splash.md
     */
    private setupButtonInteractions(): void {
        if (this.joinButtonElement) {
            this.joinButtonElement.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (this.onJoinGame) {
                    this.onJoinGame();
                }
            });
        }

        if (this.charactersButtonElement) {
            this.charactersButtonElement.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (this.onCharacters) {
                    this.onCharacters();
                }
            });
        }

        if (this.friendsButtonElement) {
            this.friendsButtonElement.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (this.onFriends) {
                    this.onFriends();
                }
            });
        }

        if (this.adventureButtonElement) {
            this.adventureButtonElement.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (this.onAdventure) {
                    this.onAdventure();
                }
            });
        }

        if (this.creditsButtonElement) {
            this.creditsButtonElement.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (this.onCredits) {
                    this.onCredits();
                } else {
                    // Default credits popup if no callback set
                    this.showCreditsPopup().catch(error => {
                        console.warn('Failed to show credits popup:', error);
                    });
                }
            });
        }

        if (this.settingsButtonElement) {
            this.settingsButtonElement.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (this.onSettings) {
                    this.onSettings();
                }
            });
        }

        // Enhanced audio controls handle both collapsed and expanded music buttons
        // No need for separate setupMusicButtonEventListener call
    }

    



    /**
     * refreshMusicButtonState implementation
     *
     * CRC: crc-SplashScreen.md
     */
    refreshMusicButtonState(): void {
        AudioControlUtils.updateMusicButtonState(this);
    }

    /**
     * copyPeerIdToClipboard implementation
     *
     * CRC: crc-SplashScreen.md
     */
    private async copyPeerIdToClipboard(): Promise<void> {
        if (!this.peerIdElement) return;

        try {
            // Copy to clipboard
            await navigator.clipboard.writeText(this.currentPeerId);

            // Visual feedback: briefly change background color
            const originalBackground = this.peerIdElement.style.backgroundColor;
            this.peerIdElement.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
            this.peerIdElement.style.transition = 'background-color 0.3s ease';

            // Log success
            console.log('✅ Peer ID copied to clipboard:', this.currentPeerId);

            // Restore original color after brief delay
            setTimeout(() => {
                if (this.peerIdElement) {
                    this.peerIdElement.style.backgroundColor = originalBackground;
                }
            }, 500);
        } catch (error) {
            console.error('Failed to copy peer ID to clipboard:', error);
            // Fallback: try to select the text
            this.selectPeerIdText();
        }
    }

    private selectPeerIdText(): void {
        if (!this.peerIdElement) return;

        const selection = window.getSelection();
        const range = document.createRange();

        try {
            range.selectNodeContents(this.peerIdElement);
            selection?.removeAllRanges();
            selection?.addRange(range);
        } catch (error) {
            console.warn('Failed to select peer ID text:', error);
        }
    }

    /**
     * showCreditsPopup implementation
     *
     * CRC: crc-SplashScreen.md
     */
    private async showCreditsPopup(): Promise<void> {
        try {
            // Define credits data based on actual audio assets from README.md
            const creditsData = {
                audioCredits: [
                    {
                        title: "Background Music",
                        name: "Western Adventure Cinematic Spaghetti Loop",
                        url: "https://pixabay.com/music/adventure-western-adventure-cinematic-spaghetti-loop-385618/",
                        creator: "Sonican",
                        license: "Free for use under the Pixabay Content License",
                        description: "Donate to keep the flow of Music - Click the 'Donate' button – It's quick, easy, and secure. Be kind and Show your Support ✔ Thank You!"
                    },
                    {
                        title: "Background Music",
                        name: "Cinematic Spaghetti Western Music - Tales from the West",
                        url: "https://pixabay.com/music/adventure-cinematic-spaghetti-western-music-tales-from-the-west-207360/",
                        creator: "Luis Humanoide",
                        license: "Free for use under the Pixabay Content License",
                        contact: "luishumanoide@gmail.com",
                        description: "Music composer and VFX creator. Donations are welcome, so I can make more content. If you use my content in your production, crediting it will be appreciated."
                    },
                    {
                        title: "Sound Effects",
                        name: "Single Gunshot 5.4",
                        url: "https://pixabay.com/sound-effects/single-gunshot-54-40780/",
                        creator: "morganpurkis (Freesound)",
                        license: "Free for use under the Pixabay Content License",
                        description: "Gunshot, War, Rifle sound effect. Free for use."
                    },
                    {
                        title: "Background Music",
                        name: "Picker's Grove Folk",
                        url: "https://pixabay.com/music/",
                        creator: "Various Artists",
                        license: "Free for use under the Pixabay Content License",
                        description: "Folk music for ambient background."
                    },
                    {
                        title: "Background Music", 
                        name: "Picker's Grove Shanty",
                        url: "https://pixabay.com/music/",
                        creator: "Various Artists",
                        license: "Free for use under the Pixabay Content License",
                        description: "Sea shanty style music adapted for western themes."
                    },
                    {
                        title: "Background Music",
                        name: "Picker's Grove Western",
                        url: "https://pixabay.com/music/",
                        creator: "Various Artists", 
                        license: "Free for use under the Pixabay Content License",
                        description: "Traditional western music themes."
                    },
                    {
                        title: "Background Music",
                        name: "Picker's Grove Western Ballad",
                        url: "https://pixabay.com/music/",
                        creator: "Various Artists",
                        license: "Free for use under the Pixabay Content License", 
                        description: "Slower western ballad for atmospheric moments."
                    },
                    {
                        title: "Background Music",
                        name: "Mining Incident Waltz - Hoedown",
                        url: "https://pixabay.com/music/",
                        creator: "Various Artists",
                        license: "Free for use under the Pixabay Content License",
                        description: "Upbeat hoedown music for lively frontier scenes."
                    },
                    {
                        title: "Background Music",
                        name: "Mining Incident Waltz - Polka",
                        url: "https://pixabay.com/music/",
                        creator: "Various Artists", 
                        license: "Free for use under the Pixabay Content License",
                        description: "Polka-style music for diverse western atmosphere."
                    }
                ]
            };

            // Use HTML template instead of template literals
            const creditsHtml = await templateEngine.renderTemplateFromFile('credits-popup', creditsData);

            // Add popup to page
            this.displayCreditsPopup(creditsHtml);
        } catch (error) {
            console.warn('Failed to load credits template, using fallback:', error);
            // Fallback to minimal credits display
            try {
                const fallbackHtml = await templateEngine.renderTemplateFromFile('credits-popup-fallback', {});
                this.displayCreditsPopup(fallbackHtml);
            } catch (fallbackError) {
                console.error('Even fallback template failed:', fallbackError);
                // Last resort - show alert
                alert('Credits: Audio assets from Pixabay and Freesound. Thanks to all creators!');
            }
        }
    }

    private displayCreditsPopup(creditsHtml: string): void {

        // Add popup to page
        const popupDiv = document.createElement('div');
        popupDiv.innerHTML = creditsHtml;
        document.body.appendChild(popupDiv);

        // Set up close button
        const closeBtn = popupDiv.querySelector('.credits-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                document.body.removeChild(popupDiv);
            });
        }

        // Close on overlay click
        const overlay = popupDiv.querySelector('.credits-overlay');
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    document.body.removeChild(popupDiv);
                }
            });
        }
    }

    private applyStyles(): void {
        // Styles now loaded via CSS import - no longer embedded in TypeScript
    }
}
