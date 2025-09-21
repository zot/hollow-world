import { INetworkProvider } from '../p2p.js';
import { IAudioManager } from '../audio/AudioManager.js';

// Interface for UI components (Interface Segregation Principle)
export interface IUIComponent {
    render(container: HTMLElement): void;
    destroy(): void;
}

// Interface for splash screen specific functionality
export interface ISplashScreen extends IUIComponent {
    updatePeerId(peerId: string): void;
    onPeerIdClick?: () => void;
    onJoinGame?: () => void;
    onStartGame?: () => void;
    onCharacters?: () => void;
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
    private joinButtonElement: HTMLElement | null = null;
    private startButtonElement: HTMLElement | null = null;
    private charactersButtonElement: HTMLElement | null = null;
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

    render(container: HTMLElement): void {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;

        const splashHtml = this.createSplashHTML();
        container.innerHTML = splashHtml;

        this.peerIdElement = container.querySelector(`.${this.config.peerIdClass}`);
        this.joinButtonElement = container.querySelector(`.${this.config.joinButtonClass}`);
        this.startButtonElement = container.querySelector(`.${this.config.startButtonClass}`);
        this.charactersButtonElement = container.querySelector(`.${this.config.charactersButtonClass}`);
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

    private createSplashHTML(): string {
        const titleWithSpookyHollow = this.config.title.replace(
            /\bHollow\b/gi,
            '<span class="hollow-word">Hollow</span>'
        );

        return `
            <div class="${this.config.containerClass}">
                <h1 class="${this.config.titleClass}">${titleWithSpookyHollow}</h1>
                <div class="${this.config.peerIdClass}">Peer ID: ${this.currentPeerId}</div>
                <div class="${this.config.buttonsContainerClass}">
                    <button class="${this.config.joinButtonClass}">Join Game</button>
                    <button class="${this.config.startButtonClass}">Start Game</button>
                    <button class="${this.config.charactersButtonClass}">Characters</button>
                </div>
                ${this.audioManager ? `<button class="${this.config.musicButtonClass}" title="Toggle Music">🎵</button>` : ''}
            </div>
        `;
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

    private applyStyles(): void {
        if (!document.getElementById('splash-screen-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'splash-screen-styles';
            styleSheet.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Rye&family=Creepster&family=Sancreek&display=swap');
                .splash-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background:
                        radial-gradient(circle at center, rgba(255,248,220,0.1) 0%, transparent 50%),
                        linear-gradient(45deg, #8b4513 0%, #deb887 25%, #f4a460 50%, #deb887 75%, #8b4513 100%);
                    position: relative;
                    text-align: center;
                    padding: 20px;
                    overflow: hidden;
                }

                .splash-container::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background:
                        repeating-linear-gradient(
                            90deg,
                            transparent 0px,
                            rgba(139,69,19,0.1) 1px,
                            rgba(139,69,19,0.1) 2px,
                            transparent 3px,
                            transparent 20px
                        ),
                        repeating-linear-gradient(
                            0deg,
                            transparent 0px,
                            rgba(139,69,19,0.05) 1px,
                            rgba(139,69,19,0.05) 2px,
                            transparent 3px,
                            transparent 20px
                        );
                    pointer-events: none;
                }

                .splash-container::after {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                    border: 8px solid #8b4513;
                    border-image: repeating-linear-gradient(
                        45deg,
                        #8b4513,
                        #8b4513 10px,
                        #654321 10px,
                        #654321 20px
                    ) 8;
                    pointer-events: none;
                    box-shadow:
                        inset 0 0 50px rgba(0,0,0,0.3),
                        0 0 50px rgba(0,0,0,0.5);
                }

                .splash-title {
                    font-family: 'Sancreek', 'Rye', serif;
                    font-size: clamp(2.5rem, 8vw, 6rem);
                    font-weight: 900;
                    text-shadow:
                        1px 1px 0px #000,
                        2px 2px 0px #654321,
                        3px 3px 0px #4a2c1a,
                        4px 4px 0px #2d1810,
                        5px 5px 0px #1a0f08,
                        6px 6px 15px rgba(0,0,0,0.8);
                    margin: 0 0 3rem 0;
                    letter-spacing: 0.2em;
                    text-transform: uppercase;
                    color: #8B7355; /* medium-light brown */
                    text-stroke: 3px #000;
                    -webkit-text-stroke: 3px #000;
                    transform: perspective(300px) rotateX(-8deg) scaleY(1.2);
                    filter:
                        drop-shadow(0 0 20px rgba(139, 115, 85, 0.8))
                        drop-shadow(0 0 40px rgba(139, 115, 85, 0.4));
                    z-index: 10;
                    position: relative;
                    animation: flicker 3s ease-in-out infinite alternate;
                }

                .hollow-word {
                    font-family: 'Sancreek', 'Rye', serif;
                    color: #004a00;
                    background: linear-gradient(45deg, #008000, #228b22, #32cd32, #00ff00);
                    background-clip: text;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    text-shadow:
                        2px 2px 0px #000,
                        3px 3px 0px #003300,
                        4px 4px 0px #001a00,
                        5px 5px 0px #000d00,
                        6px 6px 20px rgba(0, 255, 0, 0.8);
                    filter:
                        drop-shadow(0 0 30px rgba(0, 255, 0, 0.9))
                        drop-shadow(0 0 60px rgba(34, 139, 34, 0.6));
                    animation: spookyGreenGlow 2s ease-in-out infinite alternate;
                }

                @keyframes spookyGreenGlow {
                    0%, 100% {
                        filter:
                            drop-shadow(0 0 30px rgba(0, 255, 0, 0.9))
                            drop-shadow(0 0 60px rgba(34, 139, 34, 0.6));
                        text-shadow:
                            2px 2px 0px #000,
                            3px 3px 0px #003300,
                            4px 4px 0px #001a00,
                            5px 5px 0px #000d00,
                            6px 6px 20px rgba(0, 255, 0, 0.8);
                    }
                    50% {
                        filter:
                            drop-shadow(0 0 40px rgba(0, 255, 0, 1))
                            drop-shadow(0 0 80px rgba(34, 139, 34, 0.8));
                        text-shadow:
                            2px 2px 0px #000,
                            3px 3px 0px #003300,
                            4px 4px 0px #001a00,
                            5px 5px 0px #000d00,
                            6px 6px 30px rgba(0, 255, 0, 1);
                    }
                }

                @keyframes flicker {
                    0%, 100% {
                        filter:
                            drop-shadow(0 0 20px rgba(205, 133, 63, 0.8))
                            drop-shadow(0 0 40px rgba(205, 133, 63, 0.4));
                    }
                    50% {
                        filter:
                            drop-shadow(0 0 30px rgba(205, 133, 63, 1))
                            drop-shadow(0 0 60px rgba(205, 133, 63, 0.6));
                    }
                }

                .splash-peer-id {
                    font-size: 1rem;
                    background:
                        linear-gradient(45deg, rgba(222,184,135,0.9), rgba(244,164,96,0.9));
                    padding: 12px 20px;
                    border: 3px solid #8b4513;
                    border-radius: 0;
                    font-family: 'Courier New', monospace;
                    word-break: break-all;
                    max-width: 70%;
                    color: #2d1810;
                    font-weight: bold;
                    text-shadow: 1px 1px 0px rgba(255,255,255,0.5);
                    box-shadow:
                        inset 0 0 10px rgba(139,69,19,0.3),
                        3px 3px 0px #654321,
                        6px 6px 10px rgba(0,0,0,0.5);
                    transform: perspective(200px) rotateX(5deg);
                    transition: all 0.3s ease;
                    position: relative;
                    z-index: 10;
                }

                .splash-peer-id::before {
                    content: '★ OUTLAW CODE ★';
                    position: absolute;
                    top: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.8rem;
                    color: #8b4513;
                    font-weight: bold;
                    text-shadow: 1px 1px 0px rgba(255,248,220,0.8);
                }

                .splash-peer-id:hover {
                    background: linear-gradient(45deg, rgba(255,248,220,0.95), rgba(222,184,135,0.95));
                    border-color: #654321;
                    box-shadow:
                        inset 0 0 15px rgba(139,69,19,0.4),
                        3px 3px 0px #4a2c1a,
                        8px 8px 15px rgba(0,0,0,0.6),
                        0 0 20px rgba(255,215,0,0.3);
                    transform: perspective(200px) rotateX(5deg) scale(1.02);
                }

                .splash-buttons-container {
                    display: flex;
                    gap: 2rem;
                    justify-content: center;
                    margin-top: 2rem;
                    z-index: 10;
                    position: relative;
                }

                .splash-join-button,
                .splash-start-button,
                .splash-characters-button {
                    font-family: 'Rye', 'Impact', 'Arial Black', sans-serif;
                    font-size: 1.4rem;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    padding: 15px 30px;
                    border: 4px solid #654321;
                    background:
                        linear-gradient(45deg, #deb887, #f4a460, #daa520, #deb887),
                        radial-gradient(circle at center, rgba(255,248,220,0.3), transparent);
                    color: #2d1810;
                    text-shadow:
                        1px 1px 0px rgba(255,255,255,0.8),
                        2px 2px 0px rgba(139,69,19,0.3);
                    box-shadow:
                        inset 0 0 15px rgba(255,248,220,0.5),
                        3px 3px 0px #654321,
                        6px 6px 0px #4a2c1a,
                        8px 8px 15px rgba(0,0,0,0.4);
                    border-radius: 0;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    transform: perspective(150px) rotateX(-5deg);
                    position: relative;
                    overflow: hidden;
                }

                .splash-join-button::before,
                .splash-start-button::before,
                .splash-characters-button::before {
                    content: '';
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    right: 5px;
                    bottom: 5px;
                    border: 2px solid rgba(139,69,19,0.3);
                    pointer-events: none;
                }

                .splash-join-button::after,
                .splash-start-button::after,
                .splash-characters-button::after {
                    content: '★';
                    position: absolute;
                    top: 2px;
                    right: 8px;
                    font-size: 0.8rem;
                    color: #8b4513;
                    opacity: 0.7;
                }

                .splash-join-button:hover,
                .splash-start-button:hover,
                .splash-characters-button:hover {
                    background:
                        linear-gradient(45deg, #f4a460, #ffd700, #ffb347, #f4a460),
                        radial-gradient(circle at center, rgba(255,248,220,0.5), transparent);
                    box-shadow:
                        inset 0 0 20px rgba(255,248,220,0.7),
                        3px 3px 0px #654321,
                        6px 6px 0px #4a2c1a,
                        10px 10px 20px rgba(0,0,0,0.5),
                        0 0 25px rgba(255,215,0,0.4);
                    transform: perspective(150px) rotateX(-5deg) translateY(-2px);
                    text-shadow:
                        1px 1px 0px rgba(255,255,255,0.9),
                        2px 2px 0px rgba(139,69,19,0.4),
                        0 0 10px rgba(255,215,0,0.6);
                }

                .splash-join-button:active,
                .splash-start-button:active,
                .splash-characters-button:active {
                    transform: perspective(150px) rotateX(-5deg) translateY(1px);
                    box-shadow:
                        inset 0 0 20px rgba(139,69,19,0.3),
                        2px 2px 0px #654321,
                        4px 4px 0px #4a2c1a,
                        6px 6px 10px rgba(0,0,0,0.6);
                }

                .splash-music-button {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border: 3px solid #654321;
                    background:
                        radial-gradient(circle, #deb887, #b8860b),
                        radial-gradient(circle at 30% 30%, rgba(255,248,220,0.8), transparent);
                    font-size: 1.8rem;
                    color: #2d1810;
                    cursor: pointer;
                    box-shadow:
                        inset 0 0 10px rgba(255,248,220,0.5),
                        3px 3px 0px #654321,
                        6px 6px 10px rgba(0,0,0,0.4);
                    transition: all 0.2s ease;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .splash-music-button:hover {
                    background:
                        radial-gradient(circle, #ffd700, #daa520),
                        radial-gradient(circle at 30% 30%, rgba(255,248,220,0.9), transparent);
                    box-shadow:
                        inset 0 0 15px rgba(255,248,220,0.7),
                        3px 3px 0px #654321,
                        8px 8px 15px rgba(0,0,0,0.5),
                        0 0 20px rgba(255,215,0,0.4);
                    transform: scale(1.05);
                }

                .splash-music-button:active {
                    transform: scale(0.95);
                    box-shadow:
                        inset 0 0 15px rgba(139,69,19,0.3),
                        2px 2px 0px #654321,
                        4px 4px 8px rgba(0,0,0,0.6);
                }

                /* Global Music Toggle Button - Enhanced Version */
                .music-toggle-button {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    border: 3px solid #654321;
                    background:
                        radial-gradient(circle, #deb887, #b8860b),
                        radial-gradient(circle at 30% 30%, rgba(255,248,220,0.8), transparent);
                    font-size: 1.8rem;
                    color: #2d1810;
                    cursor: pointer;
                    box-shadow:
                        inset 0 0 10px rgba(255,248,220,0.5),
                        3px 3px 0px #654321,
                        6px 6px 10px rgba(0,0,0,0.4);
                    transition: all 0.2s ease;
                    z-index: 1000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-shadow: 1px 1px 0px rgba(0,0,0,0.5);
                }

                .music-toggle-button:hover {
                    background:
                        radial-gradient(circle, #ffd700, #daa520),
                        radial-gradient(circle at 30% 30%, rgba(255,248,220,0.9), transparent);
                    box-shadow:
                        inset 0 0 15px rgba(255,248,220,0.7),
                        3px 3px 0px #654321,
                        8px 8px 15px rgba(0,0,0,0.5),
                        0 0 20px rgba(255,215,0,0.4);
                    transform: scale(1.05);
                }

                .music-toggle-button:active {
                    transform: scale(0.95);
                    box-shadow:
                        inset 0 0 15px rgba(139,69,19,0.3),
                        2px 2px 0px #654321,
                        4px 4px 8px rgba(0,0,0,0.6);
                }

                @media (max-width: 768px) {
                    .splash-title {
                        font-size: clamp(2rem, 10vw, 4rem);
                    }

                    .splash-peer-id {
                        font-size: 1rem;
                        padding: 12px 20px;
                        max-width: 95%;
                    }

                    .splash-buttons-container {
                        flex-direction: column;
                        gap: 1.5rem;
                        align-items: center;
                    }

                    .splash-join-button,
                    .splash-start-button {
                        font-size: 1.2rem;
                        padding: 12px 25px;
                        min-width: 200px;
                    }

                    .music-toggle-button {
                        width: 50px;
                        height: 50px;
                        font-size: 1.5rem;
                        bottom: 15px;
                        right: 15px;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
}