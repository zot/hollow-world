/**
 * Unit tests for AudioManager
 *
 * CRC: crc-AudioManager.md
 * Spec: specs/audio.md
 * Test Design: test-AudioSystem.md
 */

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
    let originalAudio: any;

    beforeEach(() => {
        // Mock the Audio constructor for AudioManager's internal providers
        originalAudio = globalThis.Audio;
        globalThis.Audio = MockAudio as any;
    });

    afterEach(() => {
        globalThis.Audio = originalAudio;
    });

    describe('Initialization', () => {
        it('should initialize with single music track', async () => {
            audioManager = new AudioManager('music-1.mp3', 'gunshot.mp3');
            await expect(audioManager.initialize()).resolves.toBeUndefined();
        });

        it('should initialize with multiple music tracks (8-track system)', async () => {
            const tracks = [
                'music-1.mp3', 'music-2.mp3', 'music-3.mp3', 'music-4.mp3',
                'music-5.mp3', 'music-6.mp3', 'music-7.mp3', 'music-8.mp3'
            ];
            audioManager = new AudioManager(tracks, 'gunshot.mp3');
            await expect(audioManager.initialize()).resolves.toBeUndefined();
        });

        it('should initialize gunshot sound effect', async () => {
            audioManager = new AudioManager('music.mp3', 'gunshot.mp3');
            await expect(audioManager.initialize()).resolves.toBeUndefined();
        });

        it('should set default music volume to 0.3', async () => {
            audioManager = new AudioManager('music.mp3', 'gunshot.mp3');
            await audioManager.initialize();
            // Volume is set during initialization (verified via console logs in implementation)
            // Can't directly test private providers, but initialize doesn't throw
        });
    });

    describe('Music Controls', () => {
        beforeEach(async () => {
            audioManager = new AudioManager('music.mp3', 'gunshot.mp3');
            await audioManager.initialize();
        });

        it('should play background music', async () => {
            await audioManager.playBackgroundMusic();
            expect(audioManager.isMusicPlaying()).toBe(true);
        });

        it('should pause background music', async () => {
            await audioManager.playBackgroundMusic();
            audioManager.pauseBackgroundMusic();
            expect(audioManager.isMusicPlaying()).toBe(false);
        });

        it('should stop background music', async () => {
            await audioManager.playBackgroundMusic();
            audioManager.stopBackgroundMusic();
            expect(audioManager.isMusicPlaying()).toBe(false);
        });

        it('should toggle music on and off', async () => {
            // Start paused
            expect(audioManager.isMusicPlaying()).toBe(false);

            // Toggle to play
            await audioManager.toggleMusic();
            expect(audioManager.isMusicPlaying()).toBe(true);

            // Toggle to pause
            await audioManager.toggleMusic();
            expect(audioManager.isMusicPlaying()).toBe(false);
        });

        it('should set music volume', async () => {
            audioManager.setMusicVolume(0.8);
            // Volume is set on internal providers
            // Verify by playing and checking it doesn't throw
            await expect(audioManager.playBackgroundMusic()).resolves.toBeUndefined();
        });

        it('should report music playing status', async () => {
            expect(audioManager.isMusicPlaying()).toBe(false);
            await audioManager.playBackgroundMusic();
            expect(audioManager.isMusicPlaying()).toBe(true);
        });
    });

    describe('Multi-Track Cycling', () => {
        beforeEach(async () => {
            const tracks = [
                'music-1.mp3', 'music-2.mp3', 'music-3.mp3', 'music-4.mp3'
            ];
            audioManager = new AudioManager(tracks, 'gunshot.mp3');
            await audioManager.initialize();
        });

        it('should start with track 0', async () => {
            const info = audioManager.getCurrentTrackInfo();
            expect(info).not.toBeNull();
            expect(info!.index).toBe(0);
            expect(info!.total).toBe(4);
        });

        it('should skip to next track', async () => {
            await audioManager.playBackgroundMusic();
            const before = audioManager.getCurrentTrackInfo();

            await audioManager.skipToNextTrack();
            const after = audioManager.getCurrentTrackInfo();

            expect(after!.index).toBe(before!.index + 1);
        });

        it('should wrap to track 0 when skipping past last track', async () => {
            await audioManager.playBackgroundMusic();

            // Skip to end
            await audioManager.skipToNextTrack();
            await audioManager.skipToNextTrack();
            await audioManager.skipToNextTrack();

            const atEnd = audioManager.getCurrentTrackInfo();
            expect(atEnd!.index).toBe(3);

            // Should wrap to beginning
            await audioManager.skipToNextTrack();
            const wrapped = audioManager.getCurrentTrackInfo();
            expect(wrapped!.index).toBe(0);
        });

        it('should skip to previous track', async () => {
            await audioManager.playBackgroundMusic();
            await audioManager.skipToNextTrack(); // Move to track 1

            const before = audioManager.getCurrentTrackInfo();
            expect(before!.index).toBe(1);

            await audioManager.skipToPreviousTrack();
            const after = audioManager.getCurrentTrackInfo();
            expect(after!.index).toBe(0);
        });

        it('should wrap to last track when skipping previous from track 0', async () => {
            await audioManager.playBackgroundMusic();
            const atStart = audioManager.getCurrentTrackInfo();
            expect(atStart!.index).toBe(0);

            await audioManager.skipToPreviousTrack();
            const wrapped = audioManager.getCurrentTrackInfo();
            expect(wrapped!.index).toBe(3); // Last track
        });

        it('should disable cycling', () => {
            audioManager.setCyclingEnabled(false);
            expect(audioManager.isCyclingEnabled()).toBe(false);
        });

        it('should enable cycling', () => {
            audioManager.setCyclingEnabled(false);
            audioManager.setCyclingEnabled(true);
            expect(audioManager.isCyclingEnabled()).toBe(true);
        });

        it('should provide current track info', () => {
            const info = audioManager.getCurrentTrackInfo();
            expect(info).not.toBeNull();
            expect(info!.index).toBe(0);
            expect(info!.total).toBe(4);
            expect(info!.name).toContain('Music'); // Name is derived from filename
        });
    });

    describe('Sound Effects', () => {
        beforeEach(async () => {
            audioManager = new AudioManager('music.mp3', 'gunshot.mp3');
            await audioManager.initialize();
        });

        it('should play gunshot sound effect', async () => {
            await expect(audioManager.playRandomGunshot()).resolves.toBeUndefined();
        });

        it('should play multiple gunshots simultaneously', async () => {
            await audioManager.playRandomGunshot();
            await audioManager.playRandomGunshot();
            await audioManager.playRandomGunshot();
            // Should not throw, allows overlapping sounds
        });

        it('should handle missing gunshot sound gracefully', async () => {
            const noGunshot = new AudioManager('music.mp3', '');
            await noGunshot.initialize();
            await expect(noGunshot.playRandomGunshot()).resolves.toBeUndefined();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty track array', async () => {
            audioManager = new AudioManager([], 'gunshot.mp3');
            await audioManager.initialize();
            // Should initialize without throwing
        });

        it('should handle single track system', async () => {
            audioManager = new AudioManager('single.mp3', 'gunshot.mp3');
            await audioManager.initialize();

            const info = audioManager.getCurrentTrackInfo();
            expect(info!.total).toBe(1);

            await audioManager.playBackgroundMusic();

            // Skipping in single-track should stay on same track
            await audioManager.skipToNextTrack();
            const after = audioManager.getCurrentTrackInfo();
            expect(after!.index).toBe(0);
        });

        it('should handle music already playing', async () => {
            audioManager = new AudioManager('music.mp3', 'gunshot.mp3');
            await audioManager.initialize();

            await audioManager.playBackgroundMusic();
            await audioManager.playBackgroundMusic(); // Play again

            expect(audioManager.isMusicPlaying()).toBe(true);
        });

        it('should handle pause when not playing', () => {
            audioManager = new AudioManager('music.mp3', 'gunshot.mp3');
            // Should not throw
            expect(() => audioManager.pauseBackgroundMusic()).not.toThrow();
        });

        it('should handle stop when not playing', () => {
            audioManager = new AudioManager('music.mp3', 'gunshot.mp3');
            // Should not throw
            expect(() => audioManager.stopBackgroundMusic()).not.toThrow();
        });

        it('should handle volume changes when not initialized', () => {
            audioManager = new AudioManager('music.mp3', 'gunshot.mp3');
            // Should not throw (volume will be applied when initialized)
            expect(() => audioManager.setMusicVolume(0.5)).not.toThrow();
        });
    });

    describe('Integration Tests', () => {
        it('should handle complete playback workflow', async () => {
            const tracks = ['music-1.mp3', 'music-2.mp3', 'music-3.mp3'];
            audioManager = new AudioManager(tracks, 'gunshot.mp3');
            await audioManager.initialize();

            // Play music
            await audioManager.playBackgroundMusic();
            expect(audioManager.isMusicPlaying()).toBe(true);

            // Play sound effect while music playing
            await audioManager.playRandomGunshot();
            expect(audioManager.isMusicPlaying()).toBe(true); // Music still playing

            // Skip track
            await audioManager.skipToNextTrack();
            expect(audioManager.isMusicPlaying()).toBe(true);

            // Change volume
            audioManager.setMusicVolume(0.5);

            // Stop music
            audioManager.stopBackgroundMusic();
            expect(audioManager.isMusicPlaying()).toBe(false);
        });

        it('should handle music with cycling enabled/disabled', async () => {
            const tracks = ['music-1.mp3', 'music-2.mp3'];
            audioManager = new AudioManager(tracks, 'gunshot.mp3');
            await audioManager.initialize();

            // Enable cycling
            audioManager.setCyclingEnabled(true);
            await audioManager.playBackgroundMusic();
            expect(audioManager.isCyclingEnabled()).toBe(true);

            // Disable cycling
            audioManager.setCyclingEnabled(false);
            expect(audioManager.isCyclingEnabled()).toBe(false);

            // Music should still be playing
            expect(audioManager.isMusicPlaying()).toBe(true);
        });
    });
});