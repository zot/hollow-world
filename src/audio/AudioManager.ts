// Audio interfaces following SOLID principles

export interface IAudioProvider {
    load(src: string): Promise<void>;
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    setVolume(volume: number): void;
    setLoop(loop: boolean): void;
    isPlaying(): boolean;
    getCurrentTime(): number;
    getDuration(): number;
}

export interface IAudioManager {
    initialize(): Promise<void>;
    playBackgroundMusic(): Promise<void>;
    pauseBackgroundMusic(): void;
    stopBackgroundMusic(): void;
    setMusicVolume(volume: number): void;
    isMusicPlaying(): boolean;
    toggleMusic(): Promise<void>;
    playRandomGunshot(): Promise<void>;
    // Enhanced cycling functionality
    skipToNextTrack(): Promise<void>;
    skipToPreviousTrack(): Promise<void>;
    getCurrentTrackInfo(): { index: number; name: string; total: number } | null;
    setCyclingEnabled(enabled: boolean): void;
    isCyclingEnabled(): boolean;
}

// HTML5 Audio implementation (Single Responsibility)
export class HTMLAudioProvider implements IAudioProvider {
    private audio: HTMLAudioElement;
    private isLoaded: boolean = false;

    constructor() {
        this.audio = new Audio();
        this.setupEventListeners();
    }

    async load(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.audio.src = src;

            // Add timeout to prevent hanging
            const timeout = setTimeout(() => {
                reject(new Error(`Audio load timeout for ${src}`));
            }, 3000); // 3 second timeout per track (aggressive to prevent hanging)

            this.audio.addEventListener('canplaythrough', () => {
                clearTimeout(timeout);
                this.isLoaded = true;
                resolve();
            }, { once: true });
            this.audio.addEventListener('error', (e) => {
                clearTimeout(timeout);
                const error = this.audio.error;
                const errorMessage = error ?
                    `Audio error code ${error.code}: ${this.getMediaErrorMessage(error.code)}` :
                    `Failed to load audio from ${src}`;
                reject(new Error(errorMessage));
            }, { once: true });
            this.audio.load();
        });
    }

    async play(): Promise<void> {
        if (!this.isLoaded) {
            throw new Error('Audio not loaded');
        }
        try {
            await this.audio.play();
        } catch (error) {
            // Preserve the original error for proper error type checking (e.g., NotAllowedError)
            if (error instanceof Error) {
                const playError = new Error(`Failed to play audio: ${error.name}: ${error.message}`);
                playError.name = error.name; // Preserve error name for type checking
                throw playError;
            }
            throw new Error(`Failed to play audio: ${error}`);
        }
    }

    pause(): void {
        this.audio.pause();
    }

    stop(): void {
        this.audio.pause();
        this.audio.currentTime = 0;
    }

    setVolume(volume: number): void {
        this.audio.volume = Math.max(0, Math.min(1, volume));
    }

    setLoop(loop: boolean): void {
        this.audio.loop = loop;
    }

    isPlaying(): boolean {
        // Check if audio is not paused and either currentTime > 0 or readyState indicates playing
        return !this.audio.paused && !this.audio.ended && (
            this.audio.currentTime > 0 || 
            this.audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
        );
    }

    getCurrentTime(): number {
        return this.audio.currentTime;
    }

    getDuration(): number {
        return this.audio.duration || 0;
    }

    private setupEventListeners(): void {
        this.audio.addEventListener('error', (e) => {
            console.warn('Audio error:', e);
        });
    }

    private getMediaErrorMessage(code: number): string {
        switch (code) {
            case MediaError.MEDIA_ERR_ABORTED:
                return 'Media loading aborted by user';
            case MediaError.MEDIA_ERR_NETWORK:
                return 'Network error occurred while loading media';
            case MediaError.MEDIA_ERR_DECODE:
                return 'Media decoding error';
            case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
                return 'Media format not supported or source not found';
            default:
                return 'Unknown media error';
        }
    }
}

// Enhanced Audio Manager implementation with music cycling (Single Responsibility)
export class AudioManager implements IAudioManager {
    private musicProviders: IAudioProvider[] = [];
    private gunshotProvider: IAudioProvider;
    private musicSources: string[];
    private gunshotSrc: string;
    private currentTrackIndex: number = 0;
    private defaultVolume: number = 0.3; // Lower volume for background ambiance
    private sfxVolume: number = 0.7;
    private activeGunshots: HTMLAudioElement[] = [];
    private isCycling: boolean = true;
    private cyclingTimeoutId: number | null = null;
    private isTransitioning: boolean = false;

    constructor(
        musicSources: string | string[],
        gunshotSrc: string
    ) {
        // Support both single string (backward compatibility) and array of strings
        this.musicSources = Array.isArray(musicSources) ? musicSources : [musicSources];
        this.gunshotSrc = gunshotSrc;
        this.gunshotProvider = new HTMLAudioProvider();

        // Initialize music providers for each track
        this.musicProviders = this.musicSources.map(() => new HTMLAudioProvider());
    }

    async initialize(): Promise<void> {
        try {
            console.log(`Initializing audio system with ${this.musicSources.length} music tracks`);

            // Initialize all background music tracks
            for (let i = 0; i < this.musicSources.length; i++) {
                const provider = this.musicProviders[i];
                const src = this.musicSources[i];

                try {
                    await provider.load(src);
                    provider.setVolume(this.defaultVolume);
                    provider.setLoop(false); // Individual tracks don't loop, we handle cycling
                    console.log(`Loaded music track ${i + 1}: ${this.getTrackName(src)}`);
                } catch (trackError) {
                    console.warn(`Failed to load music track ${i + 1} (${src}):`, trackError);
                    // Continue initializing other tracks even if one fails
                }
            }

            // Initialize gunshot sound effect
            if (this.gunshotSrc) {
                await this.gunshotProvider.load(this.gunshotSrc);
                this.gunshotProvider.setVolume(this.sfxVolume);
                this.gunshotProvider.setLoop(false);
                console.log('Gunshot sound effect loaded');
            }

            console.log('Audio system initialization completed');
        } catch (error) {
            console.warn('Failed to initialize audio system:', error);
            throw error;
        }
    }

    async playBackgroundMusic(): Promise<void> {
        try {
            if (this.musicProviders.length === 0) {
                console.warn('No music tracks available to play');
                return;
            }

            const currentProvider = this.getCurrentMusicProvider();
            if (currentProvider) {
                await currentProvider.play();
                console.log(`Playing track ${this.currentTrackIndex + 1}: ${this.getCurrentTrackName()}`);

                // Set up automatic cycling to next track when current track ends
                if (this.isCycling) {
                    this.setupAutoAdvance(currentProvider);
                }
            }
        } catch (error) {
            // Don't log scary errors for expected autoplay blocking
            if (error instanceof Error && error.message.includes('NotAllowedError')) {
                console.log('🎵 Music playback blocked by browser (awaiting user interaction)');
            } else {
                console.warn('Failed to play background music:', error);
            }
            throw error;
        }
    }

    pauseBackgroundMusic(): void {
        this.stopAllMusicTracks();
        this.clearCyclingTimeout();
    }

    stopBackgroundMusic(): void {
        this.stopAllMusicTracks();
        this.clearCyclingTimeout();
    }

    setMusicVolume(volume: number): void {
        this.defaultVolume = Math.max(0, Math.min(1, volume));
        // Apply to all music providers
        this.musicProviders.forEach(provider => {
            provider.setVolume(this.defaultVolume);
        });
    }

    isMusicPlaying(): boolean {
        return this.musicProviders.some(provider => provider.isPlaying());
    }

    async toggleMusic(): Promise<void> {
        if (this.isMusicPlaying()) {
            this.pauseBackgroundMusic();
        } else {
            await this.playBackgroundMusic();
        }
    }

    async playRandomGunshot(): Promise<void> {
        if (!this.gunshotSrc || !this.gunshotProvider) {
            console.warn('No gunshot sound available');
            return;
        }

        try {
            // Stop and clean up any currently playing gunshots
            this.stopAllGunshots();

            // Create a new audio element for this gunshot
            const audio = new Audio(this.gunshotSrc);
            this.activeGunshots.push(audio);

            // More dramatic volume variation for western atmosphere
            const volumeVariation = 0.5 + Math.random() * 0.4; // 0.5 to 0.9
            audio.volume = this.sfxVolume * volumeVariation;

            // Wider pitch variation for more distinct gunshot sounds
            // Simulate different gun types and distances
            const pitchVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
            audio.playbackRate = pitchVariation;

            // More extreme duration variation for dramatic effect
            const durationVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3

            // Add slight delay for western showdown feel (0-200ms)
            const playbackDelay = Math.random() * 200;

            // Add audio processing effects for more variation
            const useReverb = Math.random() > 0.7; // 30% chance of reverb effect

            if (useReverb && window.AudioContext) {
                // Use Web Audio API for reverb effect when available
                try {
                    const audioContext = new AudioContext();
                    const source = audioContext.createMediaElementSource(audio);
                    const convolver = audioContext.createConvolver();
                    const gainNode = audioContext.createGain();

                    // Create simple impulse response for reverb
                    const impulseLength = audioContext.sampleRate * 2;
                    const impulse = audioContext.createBuffer(2, impulseLength, audioContext.sampleRate);
                    for (let channel = 0; channel < 2; channel++) {
                        const channelData = impulse.getChannelData(channel);
                        for (let i = 0; i < impulseLength; i++) {
                            channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
                        }
                    }
                    convolver.buffer = impulse;

                    gainNode.gain.value = volumeVariation;
                    source.connect(convolver);
                    convolver.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                } catch (webAudioError) {
                    // Fall back to regular audio if Web Audio API fails
                    console.warn('Web Audio API reverb failed, using standard audio:', webAudioError);
                }
            }

            // Set up duration control with fade out for natural ending
            audio.addEventListener('loadedmetadata', () => {
                const originalDuration = audio.duration;
                const targetDuration = originalDuration * durationVariation;

                if (durationVariation < 1.0) {
                    // Shorter duration with fade out
                    const fadeStartTime = targetDuration * 0.8; // Start fade at 80% of target duration

                    setTimeout(() => {
                        const fadeInterval = setInterval(() => {
                            if (audio.volume > 0.05) {
                                audio.volume *= 0.8; // Quick fade out
                            } else {
                                audio.pause();
                                audio.currentTime = 0;
                                clearInterval(fadeInterval);
                            }
                        }, 20);
                    }, fadeStartTime * 1000);

                    // Hard stop as backup
                    setTimeout(() => {
                        audio.pause();
                        audio.currentTime = 0;
                    }, targetDuration * 1000);
                }
            });

            // Set up cleanup when audio ends
            audio.addEventListener('ended', () => {
                this.removeGunshot(audio);
            });

            audio.addEventListener('error', () => {
                this.removeGunshot(audio);
            });

            // Play with optional delay for dramatic effect
            setTimeout(async () => {
                try {
                    await audio.play();
                } catch (playError) {
                    console.warn('Failed to play gunshot sound:', playError);
                    this.removeGunshot(audio);
                }
            }, playbackDelay);

        } catch (error) {
            console.warn('Failed to play gunshot sound:', error);
        }
    }

    private stopAllGunshots(): void {
        this.activeGunshots.forEach(audio => {
            try {
                audio.pause();
                audio.currentTime = 0;
            } catch (error) {
                console.warn('Error stopping gunshot:', error);
            }
        });
        this.activeGunshots = [];
    }

    private removeGunshot(audio: HTMLAudioElement): void {
        const index = this.activeGunshots.indexOf(audio);
        if (index > -1) {
            this.activeGunshots.splice(index, 1);
        }
    }

    // Enhanced cycling functionality implementation
    async skipToNextTrack(): Promise<void> {
        if (this.musicProviders.length <= 1) {
            console.log('Only one track available, cannot skip');
            return;
        }

        const wasPlaying = this.isMusicPlaying();

        // Stop current track with smooth fade out
        await this.fadeOutCurrentTrack();

        // Advance to next track
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.musicProviders.length;

        // Start new track if music was playing
        if (wasPlaying) {
            await this.playBackgroundMusic();
        }

        console.log(`Skipped to track ${this.currentTrackIndex + 1}: ${this.getCurrentTrackName()}`);
    }

    async skipToPreviousTrack(): Promise<void> {
        if (this.musicProviders.length <= 1) {
            console.log('Only one track available, cannot skip');
            return;
        }

        const wasPlaying = this.isMusicPlaying();

        // Stop current track with smooth fade out
        await this.fadeOutCurrentTrack();

        // Go to previous track
        this.currentTrackIndex = this.currentTrackIndex === 0
            ? this.musicProviders.length - 1
            : this.currentTrackIndex - 1;

        // Start new track if music was playing
        if (wasPlaying) {
            await this.playBackgroundMusic();
        }

        console.log(`Skipped to previous track ${this.currentTrackIndex + 1}: ${this.getCurrentTrackName()}`);
    }

    getCurrentTrackInfo(): { index: number; name: string; total: number } | null {
        if (this.musicProviders.length === 0) {
            return null;
        }

        return {
            index: this.currentTrackIndex,
            name: this.getCurrentTrackName(),
            total: this.musicProviders.length
        };
    }

    setCyclingEnabled(enabled: boolean): void {
        this.isCycling = enabled;
        if (!enabled) {
            this.clearCyclingTimeout();
            // Set current track to loop if cycling is disabled
            const currentProvider = this.getCurrentMusicProvider();
            if (currentProvider) {
                currentProvider.setLoop(true);
            }
        } else {
            // Remove looping from current track and set up cycling
            const currentProvider = this.getCurrentMusicProvider();
            if (currentProvider) {
                currentProvider.setLoop(false);
                if (currentProvider.isPlaying()) {
                    this.setupAutoAdvance(currentProvider);
                }
            }
        }
        console.log(`Music cycling ${enabled ? 'enabled' : 'disabled'}`);
    }

    isCyclingEnabled(): boolean {
        return this.isCycling;
    }

    // Private helper methods for cycling functionality
    private getCurrentMusicProvider(): IAudioProvider | null {
        if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.musicProviders.length) {
            return this.musicProviders[this.currentTrackIndex];
        }
        return null;
    }

    private getCurrentTrackName(): string {
        if (this.currentTrackIndex >= 0 && this.currentTrackIndex < this.musicSources.length) {
            return this.getTrackName(this.musicSources[this.currentTrackIndex]);
        }
        return 'Unknown Track';
    }

    private getTrackName(src: string): string {
        // Extract filename from URL/path and make it human-readable
        const filename = src.split('/').pop() || src;
        return filename
            .replace(/\.(mp3|wav|ogg)$/i, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    private stopAllMusicTracks(): void {
        this.musicProviders.forEach(provider => {
            if (provider.isPlaying()) {
                provider.pause();
            }
        });
    }

    private clearCyclingTimeout(): void {
        if (this.cyclingTimeoutId !== null) {
            clearTimeout(this.cyclingTimeoutId);
            this.cyclingTimeoutId = null;
        }
    }

    private setupAutoAdvance(provider: IAudioProvider): void {
        this.clearCyclingTimeout();

        // Calculate when to start next track (slightly before current track ends)
        const duration = provider.getDuration();
        const currentTime = provider.getCurrentTime();
        const remainingTime = Math.max(0, duration - currentTime - 1); // 1 second before end

        if (duration > 0 && remainingTime > 0) {
            this.cyclingTimeoutId = window.setTimeout(async () => {
                if (this.isCycling && provider.isPlaying()) {
                    console.log(`Auto-advancing from track ${this.currentTrackIndex + 1} to next track`);
                    await this.skipToNextTrack();
                }
            }, remainingTime * 1000);
        }
    }

    private async fadeOutCurrentTrack(fadeTime: number = 1000): Promise<void> {
        const currentProvider = this.getCurrentMusicProvider();
        if (!currentProvider || !currentProvider.isPlaying()) {
            return;
        }

        this.isTransitioning = true;
        const originalVolume = this.defaultVolume;
        const steps = 20;
        const stepTime = fadeTime / steps;
        const volumeStep = originalVolume / steps;

        for (let i = 0; i < steps; i++) {
            const newVolume = Math.max(0, originalVolume - (volumeStep * (i + 1)));
            currentProvider.setVolume(newVolume);
            await new Promise(resolve => setTimeout(resolve, stepTime));
        }

        currentProvider.stop();
        currentProvider.setVolume(originalVolume);
        this.isTransitioning = false;
    }
}