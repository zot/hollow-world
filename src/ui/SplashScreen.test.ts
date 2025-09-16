import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SplashScreen, ISplashScreenConfig } from './SplashScreen.js';
import { INetworkProvider } from '../p2p.js';
import { IAudioManager } from '../audio/AudioManager.js';

// Mock network provider for testing
class MockNetworkProvider implements INetworkProvider {
    private peerId: string = 'test-peer-id-12345';
    private initializeCalled: boolean = false;

    async initialize(): Promise<void> {
        this.initializeCalled = true;
    }

    getPeerId(): string {
        if (!this.initializeCalled) {
            throw new Error('Network provider not initialized');
        }
        return this.peerId;
    }

    async destroy(): Promise<void> {
        // Mock implementation
    }

    setPeerId(peerId: string): void {
        this.peerId = peerId;
    }

    isInitialized(): boolean {
        return this.initializeCalled;
    }
}

// Mock audio manager for testing
class MockAudioManager implements IAudioManager {
    private musicPlaying: boolean = false;
    private initializeCalled: boolean = false;

    async initialize(): Promise<void> {
        this.initializeCalled = true;
    }

    async playBackgroundMusic(): Promise<void> {
        this.musicPlaying = true;
    }

    pauseBackgroundMusic(): void {
        this.musicPlaying = false;
    }

    stopBackgroundMusic(): void {
        this.musicPlaying = false;
    }

    setMusicVolume(volume: number): void {
        // Mock implementation
    }

    isMusicPlaying(): boolean {
        return this.musicPlaying;
    }

    async toggleMusic(): Promise<void> {
        if (this.musicPlaying) {
            this.pauseBackgroundMusic();
        } else {
            await this.playBackgroundMusic();
        }
    }

    async playRandomGunshot(): Promise<void> {
        // Mock implementation - could track if gunshot was played
    }

    isInitialized(): boolean {
        return this.initializeCalled;
    }
}

// Access to default config for testing
const DEFAULT_CONFIG: ISplashScreenConfig = {
    title: "Don't Go Hollow",
    titleClass: 'splash-title',
    peerIdClass: 'splash-peer-id',
    containerClass: 'splash-container',
    buttonsContainerClass: 'splash-buttons-container',
    joinButtonClass: 'splash-join-button',
    startButtonClass: 'splash-start-button',
    musicButtonClass: 'splash-music-button'
};

describe('SplashScreen', () => {
    let mockNetworkProvider: MockNetworkProvider;
    let splashScreen: SplashScreen;
    let container: HTMLDivElement;

    beforeEach(() => {
        mockNetworkProvider = new MockNetworkProvider();
        splashScreen = new SplashScreen(mockNetworkProvider);
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        splashScreen.destroy();
        document.body.removeChild(container);

        // Clean up any injected styles
        const styleElement = document.getElementById('splash-screen-styles');
        if (styleElement) {
            styleElement.remove();
        }
    });

    describe('Initialization', () => {
        it('should initialize with network provider', async () => {
            await splashScreen.initialize();
            expect(mockNetworkProvider.isInitialized()).toBe(true);
        });

        it('should handle network provider initialization failure', async () => {
            const failingProvider = {
                initialize: vi.fn().mockRejectedValue(new Error('Network error')),
                getPeerId: vi.fn(),
                destroy: vi.fn()
            } as INetworkProvider;

            const splashWithFailingProvider = new SplashScreen(failingProvider);
            await splashWithFailingProvider.initialize();

            splashWithFailingProvider.render(container);
            expect(container.textContent).toContain('Failed to load peer ID');
        });
    });

    describe('Rendering', () => {
        it('should render the splash screen with default configuration', async () => {
            await splashScreen.initialize();
            splashScreen.render(container);

            const titleElement = container.querySelector('.splash-title');
            const peerIdElement = container.querySelector('.splash-peer-id');
            const joinButton = container.querySelector('.splash-join-button');
            const startButton = container.querySelector('.splash-start-button');

            expect(titleElement).toBeTruthy();
            expect(titleElement?.innerHTML).toContain("Don't Go");
            expect(titleElement?.innerHTML).toContain('<span class="hollow-word">Hollow</span>');
            expect(peerIdElement).toBeTruthy();
            expect(peerIdElement?.textContent).toContain('test-peer-id-12345');
            expect(joinButton).toBeTruthy();
            expect(joinButton?.textContent).toBe('Join Game');
            expect(startButton).toBeTruthy();
            expect(startButton?.textContent).toBe('Start Game');
        });

        it('should render with custom configuration', async () => {
            const customConfig: ISplashScreenConfig = {
                title: 'Custom Title',
                titleClass: 'custom-title',
                peerIdClass: 'custom-peer-id',
                containerClass: 'custom-container',
                buttonsContainerClass: 'custom-buttons-container',
                joinButtonClass: 'custom-join-button',
                startButtonClass: 'custom-start-button',
                musicButtonClass: 'custom-music-button'
            };

            const customSplash = new SplashScreen(mockNetworkProvider, customConfig);
            await customSplash.initialize();
            customSplash.render(container);

            const titleElement = container.querySelector('.custom-title');
            const peerIdElement = container.querySelector('.custom-peer-id');
            const containerElement = container.querySelector('.custom-container');
            const joinButton = container.querySelector('.custom-join-button');
            const startButton = container.querySelector('.custom-start-button');

            expect(titleElement).toBeTruthy();
            expect(titleElement?.textContent).toBe('Custom Title');
            expect(peerIdElement).toBeTruthy();
            expect(containerElement).toBeTruthy();
            expect(joinButton).toBeTruthy();
            expect(startButton).toBeTruthy();

            customSplash.destroy();
        });

        it('should throw error when container is null', () => {
            expect(() => {
                splashScreen.render(null as any);
            }).toThrow('Container element is required');
        });

        it('should apply CSS styles to the document', async () => {
            await splashScreen.initialize();
            splashScreen.render(container);

            const styleElement = document.getElementById('splash-screen-styles');
            expect(styleElement).toBeTruthy();
            expect(styleElement?.textContent).toContain('.splash-container');
            expect(styleElement?.textContent).toContain('.splash-title');
            expect(styleElement?.textContent).toContain('.splash-peer-id');
            expect(styleElement?.textContent).toContain('.splash-title .hollow-word');
            expect(styleElement?.textContent).toContain('spookyGreenGlow');
        });
    });

    describe('Peer ID Functionality', () => {
        beforeEach(async () => {
            await splashScreen.initialize();
            splashScreen.render(container);
        });

        it('should update peer ID when updatePeerId is called', () => {
            const newPeerId = 'new-peer-id-67890';
            splashScreen.updatePeerId(newPeerId);

            const peerIdElement = container.querySelector('.splash-peer-id');
            expect(peerIdElement?.textContent).toContain(newPeerId);
        });

        it('should make peer ID selectable', () => {
            const peerIdElement = container.querySelector('.splash-peer-id') as HTMLElement;
            expect(peerIdElement.style.userSelect).toBe('text');
            expect(peerIdElement.style.cursor).toBe('text');
        });

        it('should select text when peer ID is clicked', () => {
            const peerIdElement = container.querySelector('.splash-peer-id') as HTMLElement;

            // Mock window.getSelection
            const mockSelection = {
                removeAllRanges: vi.fn(),
                addRange: vi.fn()
            };
            Object.defineProperty(window, 'getSelection', {
                value: vi.fn().mockReturnValue(mockSelection),
                configurable: true
            });

            // Mock document.createRange
            const mockRange = {
                selectNodeContents: vi.fn()
            };
            Object.defineProperty(document, 'createRange', {
                value: vi.fn().mockReturnValue(mockRange),
                configurable: true
            });

            // Simulate click
            peerIdElement.click();

            expect(mockRange.selectNodeContents).toHaveBeenCalledWith(peerIdElement);
            expect(mockSelection.removeAllRanges).toHaveBeenCalled();
            expect(mockSelection.addRange).toHaveBeenCalledWith(mockRange);
        });

        it('should call onPeerIdClick callback when peer ID is clicked', () => {
            const mockCallback = vi.fn();
            splashScreen.onPeerIdClick = mockCallback;

            const peerIdElement = container.querySelector('.splash-peer-id') as HTMLElement;
            peerIdElement.click();

            expect(mockCallback).toHaveBeenCalled();
        });
    });

    describe('Button Functionality', () => {
        beforeEach(async () => {
            await splashScreen.initialize();
            splashScreen.render(container);
        });

        it('should call onJoinGame callback when join button is clicked', () => {
            const mockJoinCallback = vi.fn();
            splashScreen.onJoinGame = mockJoinCallback;

            const joinButton = container.querySelector('.splash-join-button') as HTMLElement;
            joinButton.click();

            expect(mockJoinCallback).toHaveBeenCalled();
        });

        it('should call onStartGame callback when start button is clicked', () => {
            const mockStartCallback = vi.fn();
            splashScreen.onStartGame = mockStartCallback;

            const startButton = container.querySelector('.splash-start-button') as HTMLElement;
            startButton.click();

            expect(mockStartCallback).toHaveBeenCalled();
        });

        it('should not throw error if button callbacks are not set', () => {
            splashScreen.onJoinGame = undefined;
            splashScreen.onStartGame = undefined;

            const joinButton = container.querySelector('.splash-join-button') as HTMLElement;
            const startButton = container.querySelector('.splash-start-button') as HTMLElement;

            expect(() => {
                joinButton.click();
                startButton.click();
            }).not.toThrow();
        });

        it('should render buttons container with correct class', () => {
            const buttonsContainer = container.querySelector('.splash-buttons-container');
            expect(buttonsContainer).toBeTruthy();

            const buttons = buttonsContainer?.querySelectorAll('button');
            expect(buttons?.length).toBe(2);
        });
    });

    describe('Music Functionality', () => {
        let mockAudioManager: MockAudioManager;
        let splashScreenWithAudio: SplashScreen;

        beforeEach(async () => {
            mockAudioManager = new MockAudioManager();
            splashScreenWithAudio = new SplashScreen(mockNetworkProvider, DEFAULT_CONFIG, mockAudioManager);
            await splashScreenWithAudio.initialize();
            splashScreenWithAudio.render(container);
        });

        afterEach(() => {
            splashScreenWithAudio.destroy();
        });

        it('should render music button when audio manager is provided', () => {
            const musicButton = container.querySelector('.splash-music-button');
            expect(musicButton).toBeTruthy();
            expect(musicButton?.textContent).toBe('🔇'); // Initial state is paused
        });

        it('should not render music button when no audio manager is provided', async () => {
            const splashWithoutAudio = new SplashScreen(mockNetworkProvider);
            await splashWithoutAudio.initialize();
            splashWithoutAudio.render(container);

            const musicButton = container.querySelector('.splash-music-button');
            expect(musicButton).toBeFalsy();

            splashWithoutAudio.destroy();
        });

        it('should toggle music when music button is clicked', async () => {
            const musicButton = container.querySelector('.splash-music-button') as HTMLElement;

            expect(mockAudioManager.isMusicPlaying()).toBe(false);

            // Click to start music
            musicButton.click();
            // Wait for async operation
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockAudioManager.isMusicPlaying()).toBe(true);

            // Click to stop music
            musicButton.click();
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockAudioManager.isMusicPlaying()).toBe(false);
        });

        it('should update music button state when toggled', async () => {
            const musicButton = container.querySelector('.splash-music-button') as HTMLElement;

            // Initial state
            expect(musicButton.textContent).toBe('🔇');
            expect(musicButton.title).toBe('Play Music');

            // Toggle to playing
            await splashScreenWithAudio.toggleMusic();
            expect(musicButton.textContent).toBe('🎵');
            expect(musicButton.title).toBe('Pause Music');

            // Toggle to paused
            await splashScreenWithAudio.toggleMusic();
            expect(musicButton.textContent).toBe('🔇');
            expect(musicButton.title).toBe('Play Music');
        });

        it('should handle toggleMusic method directly', async () => {
            expect(mockAudioManager.isMusicPlaying()).toBe(false);

            await splashScreenWithAudio.toggleMusic();
            expect(mockAudioManager.isMusicPlaying()).toBe(true);

            await splashScreenWithAudio.toggleMusic();
            expect(mockAudioManager.isMusicPlaying()).toBe(false);
        });

        it('should handle missing audio manager gracefully', async () => {
            const splashWithoutAudio = new SplashScreen(mockNetworkProvider);
            await splashWithoutAudio.initialize();

            // Should not throw error
            await expect(splashWithoutAudio.toggleMusic()).resolves.toBeUndefined();

            splashWithoutAudio.destroy();
        });

        it('should handle audio manager errors gracefully', async () => {
            const erroringAudioManager: IAudioManager = {
                initialize: vi.fn().mockResolvedValue(undefined),
                playBackgroundMusic: vi.fn().mockResolvedValue(undefined),
                pauseBackgroundMusic: vi.fn(),
                stopBackgroundMusic: vi.fn(),
                setMusicVolume: vi.fn(),
                toggleMusic: vi.fn().mockRejectedValue(new Error('Audio error')),
                isMusicPlaying: vi.fn().mockReturnValue(false),
                playRandomGunshot: vi.fn().mockResolvedValue(undefined)
            };

            const splashWithErroringAudio = new SplashScreen(mockNetworkProvider, DEFAULT_CONFIG, erroringAudioManager);
            await splashWithErroringAudio.initialize();
            splashWithErroringAudio.render(container);

            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await splashWithErroringAudio.toggleMusic();

            expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to toggle music:', expect.any(Error));

            consoleWarnSpy.mockRestore();
            splashWithErroringAudio.destroy();
        });
    });

    describe('Cleanup', () => {
        it('should clean up DOM elements when destroyed', async () => {
            await splashScreen.initialize();
            splashScreen.render(container);

            expect(container.innerHTML).not.toBe('');

            splashScreen.destroy();

            expect(container.innerHTML).toBe('');
        });

        it('should handle destroy when not rendered', () => {
            expect(() => {
                splashScreen.destroy();
            }).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        it('should handle text selection errors gracefully', async () => {
            await splashScreen.initialize();
            splashScreen.render(container);

            // Mock window.getSelection to return null to trigger the early return
            const originalGetSelection = window.getSelection;
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            Object.defineProperty(window, 'getSelection', {
                value: vi.fn().mockReturnValue(null),
                configurable: true
            });

            const peerIdElement = container.querySelector('.splash-peer-id') as HTMLElement;

            // Should not throw error and should handle null selection gracefully
            expect(() => {
                peerIdElement.click();
            }).not.toThrow();

            // Restore original methods
            Object.defineProperty(window, 'getSelection', {
                value: originalGetSelection,
                configurable: true
            });
            consoleWarnSpy.mockRestore();
        });

    });

    describe('Responsive Design', () => {
        it('should include responsive CSS rules', async () => {
            await splashScreen.initialize();
            splashScreen.render(container);

            const styleElement = document.getElementById('splash-screen-styles');
            expect(styleElement?.textContent).toContain('@media (max-width: 768px)');
            expect(styleElement?.textContent).toContain('clamp(');
        });
    });
});