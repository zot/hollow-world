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
            this.audio.addEventListener('canplaythrough', () => {
                this.isLoaded = true;
                resolve();
            }, { once: true });
            this.audio.addEventListener('error', (e) => {
                reject(new Error(`Failed to load audio: ${e.message}`));
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
        return !this.audio.paused && this.audio.currentTime > 0;
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
}

// Audio Manager implementation (Single Responsibility)
export class AudioManager implements IAudioManager {
    private musicProvider: IAudioProvider;
    private gunshotProvider: IAudioProvider;
    private musicSrc: string;
    private gunshotSrc: string;
    private defaultVolume: number = 0.5;
    private sfxVolume: number = 0.7;
    private activeGunshots: HTMLAudioElement[] = [];

    constructor(
        musicSrc: string,
        gunshotSrc: string,
        musicProvider: IAudioProvider = new HTMLAudioProvider()
    ) {
        this.musicSrc = musicSrc;
        this.gunshotSrc = gunshotSrc;
        this.musicProvider = musicProvider;
        this.gunshotProvider = new HTMLAudioProvider();
    }

    async initialize(): Promise<void> {
        try {
            // Initialize background music
            await this.musicProvider.load(this.musicSrc);
            this.musicProvider.setVolume(this.defaultVolume);
            this.musicProvider.setLoop(true);

            // Initialize gunshot sound effect
            if (this.gunshotSrc) {
                await this.gunshotProvider.load(this.gunshotSrc);
                this.gunshotProvider.setVolume(this.sfxVolume);
                this.gunshotProvider.setLoop(false);
            }
        } catch (error) {
            console.warn('Failed to initialize audio:', error);
            throw error;
        }
    }

    async playBackgroundMusic(): Promise<void> {
        try {
            await this.musicProvider.play();
        } catch (error) {
            console.warn('Failed to play background music:', error);
            throw error;
        }
    }

    pauseBackgroundMusic(): void {
        this.musicProvider.pause();
    }

    stopBackgroundMusic(): void {
        this.musicProvider.stop();
    }

    setMusicVolume(volume: number): void {
        this.musicProvider.setVolume(volume);
    }

    isMusicPlaying(): boolean {
        return this.musicProvider.isPlaying();
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
}