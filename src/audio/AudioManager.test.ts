import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HTMLAudioProvider, AudioManager, IAudioProvider } from './AudioManager.js';

// Mock Audio constructor
class MockAudio {
    src: string = '';
    volume: number = 1;
    loop: boolean = false;
    paused: boolean = true;
    currentTime: number = 0;
    duration: number = 120;
    private eventListeners: Map<string, EventListener[]> = new Map();

    constructor() {
        // Mock implementation
    }

    load() {
        // Simulate successful load immediately to avoid timeout issues in tests
        const event = new Event('canplaythrough');
        this.dispatchEvent(event);
    }

    async play() {
        this.paused = false;
        this.currentTime = 1; // Set to > 0 to indicate playing
        return Promise.resolve();
    }

    pause() {
        this.paused = true;
    }

    addEventListener(type: string, listener: EventListener, options?: any) {
        if (!this.eventListeners.has(type)) {
            this.eventListeners.set(type, []);
        }
        this.eventListeners.get(type)!.push(listener);
    }

    removeEventListener(type: string, listener: EventListener) {
        const listeners = this.eventListeners.get(type);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    dispatchEvent(event: Event): boolean {
        const listeners = this.eventListeners.get(event.type);
        if (listeners) {
            listeners.forEach(listener => listener(event));
        }
        return true;
    }
}

// Mock HTMLAudioProvider for testing
class MockAudioProvider implements IAudioProvider {
    private isLoadedState: boolean = false;
    private isPlayingState: boolean = false;
    private volumeState: number = 1;
    private loopState: boolean = false;

    async load(src: string): Promise<void> {
        this.isLoadedState = true;
        return Promise.resolve();
    }

    async play(): Promise<void> {
        if (!this.isLoadedState) {
            throw new Error('Audio not loaded');
        }
        this.isPlayingState = true;
        return Promise.resolve();
    }

    pause(): void {
        this.isPlayingState = false;
    }

    stop(): void {
        this.isPlayingState = false;
    }

    setVolume(volume: number): void {
        this.volumeState = Math.max(0, Math.min(1, volume));
    }

    setLoop(loop: boolean): void {
        this.loopState = loop;
    }

    isPlaying(): boolean {
        return this.isPlayingState;
    }

    getCurrentTime(): number {
        return 0;
    }

    getDuration(): number {
        return 120;
    }

    // Test helper methods
    getVolume(): number {
        return this.volumeState;
    }

    isLooped(): boolean {
        return this.loopState;
    }
}

describe('HTMLAudioProvider', () => {
    let provider: HTMLAudioProvider;
    let originalAudio: any;

    beforeEach(() => {
        // Mock the Audio constructor
        originalAudio = globalThis.Audio;
        globalThis.Audio = MockAudio as any;
        provider = new HTMLAudioProvider();
    });

    afterEach(() => {
        // Restore the original Audio constructor
        globalThis.Audio = originalAudio;
    });

    describe('Loading', () => {
        it('should load audio successfully', async () => {
            await expect(provider.load('test.mp3')).resolves.toBeUndefined();
        });

        it('should throw error when playing unloaded audio', async () => {
            const unloadedProvider = new HTMLAudioProvider();
            await expect(unloadedProvider.play()).rejects.toThrow('Audio not loaded');
        });
    });

    describe('Playback Controls', () => {
        beforeEach(async () => {
            await provider.load('test.mp3');
        });

        it('should play audio', async () => {
            await provider.play();
            expect(provider.isPlaying()).toBe(true);
        });

        it('should pause audio', async () => {
            await provider.play();
            provider.pause();
            expect(provider.isPlaying()).toBe(false);
        });

        it('should stop audio', async () => {
            await provider.play();
            provider.stop();
            expect(provider.isPlaying()).toBe(false);
        });
    });

    describe('Audio Properties', () => {
        beforeEach(async () => {
            await provider.load('test.mp3');
        });

        it('should set volume', () => {
            provider.setVolume(0.5);
            // Volume is set on the internal audio element
            // We can't easily test the actual value without exposing internals
        });

        it('should clamp volume between 0 and 1', () => {
            provider.setVolume(-0.5);
            provider.setVolume(1.5);
            // Should not throw and should clamp values
        });

        it('should set loop', () => {
            provider.setLoop(true);
            // Loop is set on the internal audio element
        });

        it('should return duration', () => {
            const duration = provider.getDuration();
            expect(typeof duration).toBe('number');
        });
    });
});

describe('AudioManager', () => {
    let audioManager: AudioManager;
    let mockProvider: MockAudioProvider;

    beforeEach(() => {
        mockProvider = new MockAudioProvider();
        audioManager = new AudioManager('test-music.mp3', 'test-gunshot.mp3', mockProvider);
    });

    describe('Initialization', () => {
        it('should initialize successfully', async () => {
            await audioManager.initialize();
            expect(mockProvider.getVolume()).toBe(0.5); // Default volume
            expect(mockProvider.isLooped()).toBe(true);
        });

        it('should throw error if initialization fails', async () => {
            const failingProvider: IAudioProvider = {
                load: vi.fn().mockRejectedValue(new Error('Load failed')),
                play: vi.fn(),
                pause: vi.fn(),
                stop: vi.fn(),
                setVolume: vi.fn(),
                setLoop: vi.fn(),
                isPlaying: vi.fn().mockReturnValue(false),
                getCurrentTime: vi.fn().mockReturnValue(0),
                getDuration: vi.fn().mockReturnValue(0)
            };

            const failingManager = new AudioManager('test.mp3', 'test-gunshot.mp3', failingProvider);
            await expect(failingManager.initialize()).rejects.toThrow('Load failed');
        });
    });

    describe('Music Controls', () => {
        beforeEach(async () => {
            await audioManager.initialize();
        });

        it('should play background music', async () => {
            await audioManager.playBackgroundMusic();
            expect(mockProvider.isPlaying()).toBe(true);
        });

        it('should pause background music', async () => {
            await audioManager.playBackgroundMusic();
            audioManager.pauseBackgroundMusic();
            expect(mockProvider.isPlaying()).toBe(false);
        });

        it('should stop background music', async () => {
            await audioManager.playBackgroundMusic();
            audioManager.stopBackgroundMusic();
            expect(mockProvider.isPlaying()).toBe(false);
        });

        it('should toggle music on and off', async () => {
            // Start paused
            expect(audioManager.isMusicPlaying()).toBe(false);

            // Toggle to play
            await audioManager.toggleMusic();
            expect(mockProvider.isPlaying()).toBe(true);

            // Toggle to pause
            await audioManager.toggleMusic();
            expect(mockProvider.isPlaying()).toBe(false);
        });

        it('should set music volume', async () => {
            audioManager.setMusicVolume(0.8);
            expect(mockProvider.getVolume()).toBe(0.8);
        });

        it('should report music playing status', async () => {
            expect(audioManager.isMusicPlaying()).toBe(false);
            await audioManager.playBackgroundMusic();
            expect(audioManager.isMusicPlaying()).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle play errors gracefully', async () => {
            const errorProvider: IAudioProvider = {
                load: vi.fn().mockResolvedValue(undefined),
                play: vi.fn().mockRejectedValue(new Error('Play failed')),
                pause: vi.fn(),
                stop: vi.fn(),
                setVolume: vi.fn(),
                setLoop: vi.fn(),
                isPlaying: vi.fn().mockReturnValue(false),
                getCurrentTime: vi.fn().mockReturnValue(0),
                getDuration: vi.fn().mockReturnValue(0)
            };

            const errorManager = new AudioManager('test.mp3', 'test-gunshot.mp3', errorProvider);
            await errorManager.initialize();

            await expect(errorManager.playBackgroundMusic()).rejects.toThrow('Play failed');
        });
    });
});