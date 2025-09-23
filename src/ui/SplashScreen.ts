import { INetworkProvider } from '../p2p.js';
import { IAudioManager } from '../audio/AudioManager.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { VERSION } from '../version.js';
import '../styles/SplashScreen.css';

// Embedded splash screen template
const SPLASH_SCREEN_TEMPLATE = `<div class="{{containerClass}}">
    <h1 class="{{titleClass}}">{{titleWithHollow}}</h1>
    <div class="{{peerIdClass}}">Peer ID: {{currentPeerId}}</div>
    <div class="{{buttonsContainerClass}}">
        <button class="{{joinButtonClass}}">Join Game</button>
        <button class="{{startButtonClass}}">Start Game</button>
        <button class="{{charactersButtonClass}}">Characters</button>
    </div>
    <div class="splash-credits-container">
        <button class="splash-credits-button">Credits</button>
    </div>
    {{#if hasAudioManager}}
    <button class="{{musicButtonClass}}" title="Toggle Music">🎵</button>
    {{/if}}
    <div class="splash-version">Version {{version}}</div>
</div>`;

// Interface for UI components (Interface Segregation Principle)
export interface IUIComponent {
    render(container: HTMLElement): Promise<void>;
    destroy(): void;
}

// Interface for splash screen specific functionality
export interface ISplashScreen extends IUIComponent {
    updatePeerId(peerId: string): void;
    onPeerIdClick?: () => void;
    onJoinGame?: () => void;
    onStartGame?: () => void;
    onCharacters?: () => void;
    onCredits?: () => void;
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
    startButtonClass: string;
    charactersButtonClass: string;
    musicButtonClass: string;
}

// Default configuration
const DEFAULT_CONFIG: ISplashScreenConfig = {
    title: "Don't Go Hollow",
    titleClass: 'splash-title',
    peerIdClass: 'splash-peer-id',
    containerClass: 'splash-container',
    buttonsContainerClass: 'splash-buttons-container',
    joinButtonClass: 'splash-join-button',
    startButtonClass: 'splash-start-button',
    charactersButtonClass: 'splash-characters-button',
    musicButtonClass: 'splash-music-button'
};

// Splash screen implementation following SOLID principles
export class SplashScreen implements ISplashScreen {
    private networkProvider: INetworkProvider;
    private audioManager?: IAudioManager;
    private config: ISplashScreenConfig;
    private container: HTMLElement | null = null;
    private peerIdElement: HTMLElement | null = null;
    private currentPeerId: string = '';
    public onPeerIdClick?: () => void;
    public onJoinGame?: () => void;
    public onStartGame?: () => void;
    public onCharacters?: () => void;
    public onCredits?: () => void;
    private joinButtonElement: HTMLElement | null = null;
    private startButtonElement: HTMLElement | null = null;
    private charactersButtonElement: HTMLElement | null = null;
    private creditsButtonElement: HTMLElement | null = null;
    private musicButtonElement: HTMLElement | null = null;

    constructor(
        networkProvider: INetworkProvider,
        config: ISplashScreenConfig = DEFAULT_CONFIG,
        audioManager?: IAudioManager
    ) {
        this.networkProvider = networkProvider;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.audioManager = audioManager;
    }

    async initialize(): Promise<void> {
        try {
            await this.networkProvider.initialize();
            this.currentPeerId = this.networkProvider.getPeerId();
        } catch (error) {
            console.error('Failed to initialize network provider:', error);
            this.currentPeerId = 'Failed to load peer ID';
        }
    }

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
                startButtonClass: this.config.startButtonClass,
                charactersButtonClass: this.config.charactersButtonClass,
                hasAudioManager: !!this.audioManager,
                musicButtonClass: this.config.musicButtonClass,
                version: version
            };

            // Debug: Show audioManager state
            console.log('🎵 SplashScreen audioManager debug:');
            console.log('  - audioManager exists:', !!this.audioManager);
            console.log('  - audioManager type:', typeof this.audioManager);
            console.log('  - audioManager:', this.audioManager);
            console.log('  - hasAudioManager template value:', templateData.hasAudioManager);

            // Render template using embedded template
            const splashHtml = templateEngine.renderTemplate(SPLASH_SCREEN_TEMPLATE, templateData);
            container.innerHTML = splashHtml;

        } catch (error) {
            console.error('Failed to render splash screen template:', error);
            // Fallback to inline HTML for error recovery
            container.innerHTML = this.createSplashHTMLFallback();
        }

        // Set up element references and interactions
        this.peerIdElement = container.querySelector(`.${this.config.peerIdClass}`);
        this.joinButtonElement = container.querySelector(`.${this.config.joinButtonClass}`);
        this.startButtonElement = container.querySelector(`.${this.config.startButtonClass}`);
        this.charactersButtonElement = container.querySelector(`.${this.config.charactersButtonClass}`);
        this.creditsButtonElement = container.querySelector('.splash-credits-button');
        this.musicButtonElement = container.querySelector(`.${this.config.musicButtonClass}`);

        if (this.peerIdElement) {
            this.setupPeerIdInteraction();
        }

        this.setupButtonInteractions();
        this.updateMusicButtonState(); // Set initial state
        this.applyStyles();
    }

    updatePeerId(peerId: string): void {
        this.currentPeerId = peerId;
        if (this.peerIdElement) {
            this.peerIdElement.textContent = `Peer ID: ${peerId}`;
        }
    }

    destroy(): void {
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
        this.peerIdElement = null;
        this.joinButtonElement = null;
        this.startButtonElement = null;
        this.charactersButtonElement = null;
        this.musicButtonElement = null;
    }

    private createSplashHTMLFallback(): string {
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
                startButtonClass: this.config.startButtonClass,
                charactersButtonClass: this.config.charactersButtonClass,
                hasAudioManager: !!this.audioManager,
                musicButtonClass: this.config.musicButtonClass,
                version: VERSION
            };

            // Use HTML template instead of template literals
            return templateEngine.renderTemplate(
                // Load the template synchronously from cache or use embedded fallback
                this.getSplashFallbackTemplate(),
                templateData
            );
        } catch (error) {
            console.warn('Failed to use template for fallback, using minimal HTML:', error);
            // Ultra-minimal fallback if template system fails
            return `<div class="splash-container"><h1>Don't Go Hollow</h1><p>Peer ID: ${this.currentPeerId}</p><p>Failed to load interface</p></div>`;
        }
    }

    private getSplashFallbackTemplate(): string {
        // Inline template as last resort fallback
        return `<div class="{{containerClass}}">
    <h1 class="{{titleClass}}">{{titleWithHollow}}</h1>
    <div class="{{peerIdClass}}">Peer ID: {{currentPeerId}}</div>
    <div class="{{buttonsContainerClass}}">
        <button class="{{joinButtonClass}}">Join Game</button>
        <button class="{{startButtonClass}}">Start Game</button>
        <button class="{{charactersButtonClass}}">Characters</button>
    </div>
    <div class="splash-credits-container">
        <button class="splash-credits-button">Credits</button>
    </div>
    {{#if hasAudioManager}}
    <button class="{{musicButtonClass}}" title="Toggle Music">🎵</button>
    {{/if}}
    <div class="splash-version">Version {{version}}</div>
</div>`;
    }

    private setupPeerIdInteraction(): void {
        if (!this.peerIdElement) return;

        // Make peer ID selectable
        this.peerIdElement.style.userSelect = 'text';
        this.peerIdElement.style.cursor = 'text';

        // Add click handler to select all text
        this.peerIdElement.addEventListener('click', () => {
            this.selectPeerIdText();
            if (this.onPeerIdClick) {
                this.onPeerIdClick();
            }
        });
    }

    private setupButtonInteractions(): void {
        if (this.joinButtonElement) {
            this.joinButtonElement.addEventListener('click', async () => {
                if (this.audioManager) {
                    await this.audioManager.playRandomGunshot();
                }
                if (this.onJoinGame) {
                    this.onJoinGame();
                }
            });
        }

        if (this.startButtonElement) {
            this.startButtonElement.addEventListener('click', async () => {
                if (this.audioManager) {
                    await this.audioManager.playRandomGunshot();
                }
                if (this.onStartGame) {
                    this.onStartGame();
                }
            });
        }

        if (this.charactersButtonElement) {
            this.charactersButtonElement.addEventListener('click', async () => {
                if (this.audioManager) {
                    await this.audioManager.playRandomGunshot();
                }
                if (this.onCharacters) {
                    this.onCharacters();
                }
            });
        }

        if (this.creditsButtonElement) {
            this.creditsButtonElement.addEventListener('click', async () => {
                if (this.audioManager) {
                    await this.audioManager.playRandomGunshot();
                }
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

        if (this.musicButtonElement && this.audioManager) {
            this.musicButtonElement.addEventListener('click', async () => {
                await this.toggleMusic();
            });
        }
    }

    async toggleMusic(): Promise<void> {
        if (!this.audioManager) return;

        try {
            await this.audioManager.toggleMusic();
            this.updateMusicButtonState();
        } catch (error) {
            console.warn('Failed to toggle music:', error);
        }
    }

    private updateMusicButtonState(): void {
        if (!this.musicButtonElement || !this.audioManager) return;

        const isPlaying = this.audioManager.isMusicPlaying();
        this.musicButtonElement.textContent = isPlaying ? '🎵' : '🔇';
        this.musicButtonElement.title = isPlaying ? 'Pause Music' : 'Play Music';
    }

    refreshMusicButtonState(): void {
        this.updateMusicButtonState();
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

    private async showCreditsPopup(): Promise<void> {
        try {
            // Define credits data for template
            const creditsData = {
                audioCredits: [
                    {
                        title: "Background Music",
                        name: "Western Adventure Cinematic Spaghetti Loop",
                        url: "https://pixabay.com/music/cinematic-western-adventure-cinematic-spaghetti-loop-385618/",
                        creator: "Sonican",
                        license: "Free for use under the Pixabay Content License",
                        description: "Donate to keep the flow of Music - Be kind and Show your Support ✔"
                    },
                    {
                        title: "Sound Effects",
                        name: "Single Gunshot",
                        url: "https://pixabay.com/sound-effects/single-gunshot-54-40780/",
                        creator: "morganpurkis (Freesound)",
                        license: "Free for use under the Pixabay Content License",
                        description: "Gunshot, War, Rifle sound effect. Free for use."
                    },
                    {
                        title: "Tales from the West",
                        name: "Cinematic Spaghetti Western Music",
                        url: "https://pixabay.com/music/cinematic-tales-from-the-west-cinematic-spaghetti-western-music-385616/",
                        creator: "Luis Humanoide",
                        license: "Free for use under the Pixabay Content License",
                        contact: "luishumanoide@gmail.com",
                        description: "Music composer and VFX creator. Donations are welcome, so I can make more content."
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
            const fallbackHtml = '<div class="credits-overlay"><div class="credits-popup"><div class="credits-header"><h2>🤠 Credits</h2></div><div class="credits-content"><p>Audio assets from Pixabay and Freesound</p><p>Thanks to all the creators who make this frontier adventure possible!</p></div><div class="credits-footer"><button class="credits-close-btn">Close</button></div></div></div>';
            this.displayCreditsPopup(fallbackHtml);
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