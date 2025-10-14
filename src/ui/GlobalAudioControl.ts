/**
 * Global Audio Control - Fixed bottom-right audio controls visible on all pages
 * Following CLAUDE.md UI principles: "Audio control MUST be visible on all pages at the bottom-right"
 */

import { IAudioManager } from '../audio/AudioManager.js';
import { templateEngine } from '../utils/TemplateEngine.js';

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
        this.container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            background: rgba(44, 24, 16, 0.95);
            border: 3px solid #8B4513;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            min-width: 250px;
        `;

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
            this.container.innerHTML = `
                <div style="color: #8B7355; text-align: center; padding: 5px;">
                    Audio not available
                </div>
            `;
            return;
        }

        const trackInfo = this.audioManager.getCurrentTrackInfo();
        const isPlaying = this.audioManager.isMusicPlaying();
        const isCyclingEnabled = this.audioManager.isCyclingEnabled();

        this.container.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <!-- Header (clickable to collapse/expand) -->
                <div id="audio-header"
                     style="display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none;"
                     title="Click to collapse/expand">
                    <span style="color: #D4AF37; font-weight: bold; font-size: 14px;">🎵 Music</span>
                    <span id="audio-toggle-icon" style="color: #D4AF37; font-size: 16px;">▼</span>
                </div>

                <!-- Expanded Content -->
                <div id="audio-expanded-panel">
                    <!-- Track Info -->
                    <div style="color: #F5DEB3; font-size: 12px; margin-bottom: 8px;">
                        <div id="current-track-name" style="font-weight: bold; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${trackInfo?.name || 'No track'}
                        </div>
                        <div id="track-position" style="color: #8B7355;">
                            Track ${(trackInfo?.index || 0) + 1}/${trackInfo?.total || 0}
                        </div>
                    </div>

                    <!-- Controls -->
                    <div style="display: flex; gap: 8px; justify-content: center; margin-bottom: 8px;">
                        <button id="prev-track-btn"
                                style="background: #8B4513; border: 2px solid #654321; color: #F5DEB3; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;"
                                title="Previous Track">
                            ⏮
                        </button>
                        <button id="play-pause-btn"
                                style="background: #228B22; border: 2px solid #1F7A1F; color: white; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 16px;"
                                title="${isPlaying ? 'Pause' : 'Play'}">
                            ${isPlaying ? '⏸' : '▶'}
                        </button>
                        <button id="next-track-btn"
                                style="background: #8B4513; border: 2px solid #654321; color: #F5DEB3; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;"
                                title="Next Track">
                            ⏭
                        </button>
                    </div>

                    <!-- Cycling Toggle -->
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #F5DEB3;">
                        <span>Auto-cycle:</span>
                        <button id="cycling-toggle-btn"
                                style="background: ${isCyclingEnabled ? '#228B22' : '#8B4513'}; border: 2px solid ${isCyclingEnabled ? '#1F7A1F' : '#654321'}; color: white; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 11px;"
                                title="Toggle Auto-Cycling">
                            ${isCyclingEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                <!-- Collapsed Content (hidden by default) -->
                <div id="audio-collapsed-panel" style="display: none; text-align: center; color: #F5DEB3; font-size: 14px;">
                    ${isPlaying ? '🎵 Playing' : '🔇 Paused'}
                </div>
            </div>
        `;
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
            cyclingBtn.style.background = isCyclingEnabled ? '#228B22' : '#8B4513';
            cyclingBtn.style.borderColor = isCyclingEnabled ? '#1F7A1F' : '#654321';
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
