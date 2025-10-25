/**
 * Global Audio Control - Fixed bottom-right audio controls visible on all pages
 * Following CLAUDE.md UI principles: "Audio control MUST be visible on all pages at the bottom-right"
 */

import { IAudioManager } from '../audio/AudioManager.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import '../styles/GlobalAudioControl.css';

export interface IGlobalAudioControl {
    render(): Promise<HTMLElement>;
    update(): void;
    destroy(): void;
}

export class GlobalAudioControl implements IGlobalAudioControl {
    private audioManager: IAudioManager | undefined;
    private container: HTMLElement | null = null;
    private updateInterval?: number;

    constructor(audioManager?: IAudioManager) {
        this.audioManager = audioManager;
    }

    async render(): Promise<HTMLElement> {
        // Create fixed container
        this.container = document.createElement('div');
        this.container.id = 'global-audio-control';
        this.container.className = 'global-audio-control';

        // Render content
        await this.updateContent();

        // Set up event listeners
        this.setupEventListeners();

        // Update state every second
        this.updateInterval = window.setInterval(() => {
            this.update();
        }, 1000);

        return this.container;
    }

    private async updateContent(): Promise<void> {
        if (!this.container) return;

        if (!this.audioManager) {
            this.container.innerHTML = await templateEngine.renderTemplateFromFile('global-audio-control-unavailable', {});
            return;
        }

        const trackInfo = this.audioManager.getCurrentTrackInfo();
        const isPlaying = this.audioManager.isMusicPlaying();
        const isCyclingEnabled = this.audioManager.isCyclingEnabled();

        this.container.innerHTML = await templateEngine.renderTemplateFromFile('global-audio-control', {
            trackName: trackInfo?.name || 'No track',
            trackIndex: (trackInfo?.index || 0) + 1,
            trackTotal: trackInfo?.total || 0,
            playPauseClass: isPlaying ? '' : 'paused',
            playPauseTitle: isPlaying ? 'Pause' : 'Play',
            playPauseIcon: isPlaying ? '⏸' : '▶',
            cyclingClass: isCyclingEnabled ? 'enabled' : '',
            cyclingText: isCyclingEnabled ? 'ON' : 'OFF',
            collapsedStatus: isPlaying ? '🎵 Playing' : '🔇 Paused'
        });
    }

    private setupEventListeners(): void {
        if (!this.container || !this.audioManager) return;

        // Collapse/Expand via header click
        const header = this.container.querySelector('#audio-header');
        const toggleIcon = this.container.querySelector('#audio-toggle-icon');
        const expandedPanel = this.container.querySelector('#audio-expanded-panel') as HTMLElement;
        const collapsedPanel = this.container.querySelector('#audio-collapsed-panel') as HTMLElement;

        header?.addEventListener('click', () => {
            if (expandedPanel && collapsedPanel && toggleIcon) {
                const isExpanded = expandedPanel.style.display !== 'none';

                if (isExpanded) {
                    // Collapse
                    expandedPanel.style.display = 'none';
                    collapsedPanel.style.display = 'block';
                    toggleIcon.textContent = '▶';
                } else {
                    // Expand
                    expandedPanel.style.display = 'block';
                    collapsedPanel.style.display = 'none';
                    toggleIcon.textContent = '▼';
                }
            }
        });

        // Play/Pause
        const playPauseBtn = this.container.querySelector('#play-pause-btn');
        playPauseBtn?.addEventListener('click', async () => {
            if (!this.audioManager) return;
            try {
                await this.audioManager.toggleMusic();
                this.update();
            } catch (error) {
                console.warn('Failed to toggle music:', error);
            }
        });

        // Previous Track
        const prevBtn = this.container.querySelector('#prev-track-btn');
        prevBtn?.addEventListener('click', async () => {
            if (!this.audioManager) return;
            await this.audioManager.skipToPreviousTrack();
            this.update();
        });

        // Next Track
        const nextBtn = this.container.querySelector('#next-track-btn');
        nextBtn?.addEventListener('click', async () => {
            if (!this.audioManager) return;
            await this.audioManager.skipToNextTrack();
            this.update();
        });

        // Cycling Toggle
        const cyclingBtn = this.container.querySelector('#cycling-toggle-btn');
        cyclingBtn?.addEventListener('click', () => {
            if (!this.audioManager) return;
            const currentState = this.audioManager.isCyclingEnabled();
            this.audioManager.setCyclingEnabled(!currentState);
            this.update();
        });
    }

    update(): void {
        if (!this.container || !this.audioManager) return;

        const trackInfo = this.audioManager.getCurrentTrackInfo();
        const isPlaying = this.audioManager.isMusicPlaying();
        const isCyclingEnabled = this.audioManager.isCyclingEnabled();

        // Update track name
        const trackNameEl = this.container.querySelector('#current-track-name');
        if (trackNameEl && trackInfo) {
            trackNameEl.textContent = trackInfo.name;
        }

        // Update track position
        const trackPositionEl = this.container.querySelector('#track-position');
        if (trackPositionEl && trackInfo) {
            trackPositionEl.textContent = `Track ${trackInfo.index + 1}/${trackInfo.total}`;
        }

        // Update play/pause button
        const playPauseBtn = this.container.querySelector('#play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.textContent = isPlaying ? '⏸' : '▶';
            (playPauseBtn as HTMLElement).title = isPlaying ? 'Pause' : 'Play';

            // Toggle paused class
            if (isPlaying) {
                playPauseBtn.classList.remove('paused');
            } else {
                playPauseBtn.classList.add('paused');
            }
        }

        // Update collapsed panel state
        const collapsedPanel = this.container.querySelector('#audio-collapsed-panel');
        if (collapsedPanel) {
            collapsedPanel.textContent = isPlaying ? '🎵 Playing' : '🔇 Paused';
        }

        // Update cycling button
        const cyclingBtn = this.container.querySelector('#cycling-toggle-btn') as HTMLElement;
        if (cyclingBtn) {
            cyclingBtn.textContent = isCyclingEnabled ? 'ON' : 'OFF';

            // Toggle enabled class
            if (isCyclingEnabled) {
                cyclingBtn.classList.add('enabled');
            } else {
                cyclingBtn.classList.remove('enabled');
            }
        }
    }

    updateAudioManager(audioManager: IAudioManager | undefined): void {
        this.audioManager = audioManager;
        if (this.container) {
            this.updateContent().then(() => {
                this.setupEventListeners();
            });
        }
    }

    destroy(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = undefined;
        }
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}
