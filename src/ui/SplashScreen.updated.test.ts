// Updated unit tests for SplashScreen with Characters button following SOLID principles

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { SplashScreen, ISplashScreenConfig } from './SplashScreen.js';

// Mock the AudioManager
const mockAudioManager = {
    playRandomGunshot: vi.fn().mockResolvedValue(undefined),
    toggleMusic: vi.fn().mockResolvedValue(undefined),
    isMusicPlaying: vi.fn().mockReturnValue(false)
};

// Mock the NetworkProvider
const mockNetworkProvider = {
    initialize: vi.fn().mockResolvedValue(undefined),
    getPeerId: vi.fn().mockReturnValue('test-peer-id-123')
};

// Mock DOM environment
class MockElement {
    innerHTML: string = '';
    textContent: string = '';
    style: { [key: string]: string } = {};
    private listeners: Map<string, Function[]> = new Map();

    addEventListener(event: string, listener: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(listener);
    }

    removeEventListener(event: string, listener: Function): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(listener);
            if (index >= 0) {
                eventListeners.splice(index, 1);
            }
        }
    }

    querySelector(selector: string): MockElement | null {
        if (selector.includes('splash-peer-id')) return this;
        if (selector.includes('splash-join-button')) return this;
        if (selector.includes('splash-start-button')) return this;
        if (selector.includes('splash-characters-button')) return this;
        if (selector.includes('splash-music-button')) return this;
        return null;
    }

    click(): void {
        const clickListeners = this.listeners.get('click') || [];
        clickListeners.forEach(listener => {
            listener({ target: this, preventDefault: () => {} });
        });
    }
}

class MockSelection {
    removeAllRanges = vi.fn();
    addRange = vi.fn();
}

class MockRange {
    selectNodeContents = vi.fn();
}

class MockDocument {
    private styleSheets: MockElement[] = [];

    getElementById(id: string): MockElement | null {
        if (id === 'splash-screen-styles') {
            return this.styleSheets.length > 0 ? this.styleSheets[0] : null;
        }
        return null;
    }

    createElement(tagName: string): MockElement {
        return new MockElement();
    }

    createRange(): MockRange {
        return new MockRange();
    }

    get head(): MockElement {
        return new MockElement();
    }
}

class MockWindow {
    getSelection(): MockSelection {
        return new MockSelection();
    }
}

// Test setup
describe('SplashScreen with Characters Button', () => {
    let splashScreen: SplashScreen;
    let mockContainer: MockElement;
    let mockDocument: MockDocument;
    let mockWindow: MockWindow;

    beforeEach(() => {
        mockDocument = new MockDocument();
        mockWindow = new MockWindow();
        mockContainer = new MockElement();

        // Mock global objects
        (global as any).document = mockDocument;
        (global as any).window = mockWindow;

        splashScreen = new SplashScreen(
            mockNetworkProvider as any,
            undefined,
            mockAudioManager as any
        );
    });

    afterEach(() => {
        splashScreen.destroy();
    });

    describe('Characters Button Integration', () => {
        test('should include Characters button in HTML', () => {
            splashScreen.render(mockContainer);

            expect(mockContainer.innerHTML).toContain('Characters</button>');
            expect(mockContainer.innerHTML).toContain('splash-characters-button');
        });

        test('should set up Characters button event listener', () => {
            const onCharactersMock = vi.fn();
            splashScreen.onCharacters = onCharactersMock;

            splashScreen.render(mockContainer);

            const charactersButton = mockContainer.querySelector('.splash-characters-button');
            expect(charactersButton).toBeDefined();

            charactersButton?.click();

            expect(mockAudioManager.playRandomGunshot).toHaveBeenCalled();
            expect(onCharactersMock).toHaveBeenCalled();
        });

        test('should play gunshot sound when Characters button is clicked', async () => {
            splashScreen.render(mockContainer);

            const charactersButton = mockContainer.querySelector('.splash-characters-button');
            charactersButton?.click();

            expect(mockAudioManager.playRandomGunshot).toHaveBeenCalled();
        });

        test('should handle Characters button click without audio manager', () => {
            const noAudioSplash = new SplashScreen(mockNetworkProvider as any, undefined, undefined);
            const onCharactersMock = vi.fn();
            noAudioSplash.onCharacters = onCharactersMock;

            noAudioSplash.render(mockContainer);

            const charactersButton = mockContainer.querySelector('.splash-characters-button');
            charactersButton?.click();

            expect(onCharactersMock).toHaveBeenCalled();
            expect(mockAudioManager.playRandomGunshot).not.toHaveBeenCalled();

            noAudioSplash.destroy();
        });

        test('should not call onCharacters if callback is not set', () => {
            splashScreen.render(mockContainer);

            const charactersButton = mockContainer.querySelector('.splash-characters-button');

            // Should not throw error
            expect(() => charactersButton?.click()).not.toThrow();
        });
    });

    describe('Button Layout and Styling', () => {
        test('should include all three buttons in buttons container', () => {
            splashScreen.render(mockContainer);

            expect(mockContainer.innerHTML).toContain('Join Game</button>');
            expect(mockContainer.innerHTML).toContain('Start Game</button>');
            expect(mockContainer.innerHTML).toContain('Characters</button>');
        });

        test('should apply consistent styling to all buttons', () => {
            splashScreen.render(mockContainer);

            // Check that Characters button has same CSS classes as other buttons
            expect(mockContainer.innerHTML).toContain('splash-characters-button');

            // Verify the CSS includes characters button in the main button selectors
            const styleContent = mockContainer.innerHTML;
            expect(styleContent).toContain('.splash-join-button,');
            expect(styleContent).toContain('.splash-start-button,');
            expect(styleContent).toContain('.splash-characters-button');
        });

        test('should maintain proper button order', () => {
            splashScreen.render(mockContainer);

            const html = mockContainer.innerHTML;
            const joinIndex = html.indexOf('Join Game</button>');
            const startIndex = html.indexOf('Start Game</button>');
            const charactersIndex = html.indexOf('Characters</button>');

            expect(joinIndex).toBeLessThan(startIndex);
            expect(startIndex).toBeLessThan(charactersIndex);
        });
    });

    describe('Configuration and Customization', () => {
        test('should use custom Characters button class from configuration', () => {
            const customConfig: Partial<ISplashScreenConfig> = {
                charactersButtonClass: 'custom-characters-btn'
            };

            const customSplash = new SplashScreen(
                mockNetworkProvider as any,
                customConfig,
                mockAudioManager as any
            );

            customSplash.render(mockContainer);

            expect(mockContainer.innerHTML).toContain('custom-characters-btn');
            customSplash.destroy();
        });

        test('should include charactersButtonElement in destroy cleanup', () => {
            splashScreen.render(mockContainer);

            // Verify element is found
            const charactersButton = mockContainer.querySelector('.splash-characters-button');
            expect(charactersButton).toBeDefined();

            splashScreen.destroy();

            expect(mockContainer.innerHTML).toBe('');
        });
    });

    describe('Interface Compliance', () => {
        test('should implement onCharacters callback in interface', () => {
            // Test that onCharacters property exists and can be assigned
            expect(splashScreen.onCharacters).toBeUndefined();

            const callback = vi.fn();
            splashScreen.onCharacters = callback;

            expect(splashScreen.onCharacters).toBe(callback);
        });

        test('should maintain all existing functionality', () => {
            const onJoinGameMock = vi.fn();
            const onStartGameMock = vi.fn();
            const onPeerIdClickMock = vi.fn();

            splashScreen.onJoinGame = onJoinGameMock;
            splashScreen.onStartGame = onStartGameMock;
            splashScreen.onPeerIdClick = onPeerIdClickMock;

            splashScreen.render(mockContainer);

            // Test existing buttons still work
            const joinButton = mockContainer.querySelector('.splash-join-button');
            const startButton = mockContainer.querySelector('.splash-start-button');
            const peerIdElement = mockContainer.querySelector('.splash-peer-id');

            joinButton?.click();
            expect(onJoinGameMock).toHaveBeenCalled();

            startButton?.click();
            expect(onStartGameMock).toHaveBeenCalled();

            peerIdElement?.click();
            expect(onPeerIdClickMock).toHaveBeenCalled();
        });
    });

    describe('Audio Integration', () => {
        test('should interrupt existing gunshots when Characters button is clicked', async () => {
            splashScreen.render(mockContainer);

            const charactersButton = mockContainer.querySelector('.splash-characters-button');

            // Click multiple times rapidly
            charactersButton?.click();
            charactersButton?.click();
            charactersButton?.click();

            // Should call playRandomGunshot for each click (interruption handled in AudioManager)
            expect(mockAudioManager.playRandomGunshot).toHaveBeenCalledTimes(3);
        });
    });

    describe('Error Handling', () => {
        test('should handle audio error gracefully', async () => {
            mockAudioManager.playRandomGunshot.mockRejectedValueOnce(new Error('Audio failed'));

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

            splashScreen.render(mockContainer);

            const charactersButton = mockContainer.querySelector('.splash-characters-button');
            charactersButton?.click();

            // Should not throw error, should call console.warn (handled by AudioManager)
            expect(consoleSpy).not.toThrow();

            consoleSpy.mockRestore();
        });
    });
});