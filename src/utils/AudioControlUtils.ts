// Enhanced audio control utilities following DRY principle
// Provides access to all AudioManager features through consistent UI

import { IAudioManager } from '../audio/AudioManager.js';
import { templateEngine } from './TemplateEngine.js';

export interface IAudioControlSupport {
    audioManager?: IAudioManager;
    musicButtonElement: HTMLElement | null;
}

export interface IEnhancedAudioControlSupport extends IAudioControlSupport {
    container: HTMLElement | null;
}

export class AudioControlUtils {
    // Legacy simple toggle support (for backward compatibility)
    static async toggleMusic(component: IAudioControlSupport): Promise<void> {
        if (!component.audioManager) return;

        try {
            await component.audioManager.toggleMusic();
            AudioControlUtils.updateMusicButtonState(component);
        } catch (error) {
            console.warn('Failed to toggle music:', error);
        }
    }

    static updateMusicButtonState(component: IAudioControlSupport): void {
        if (!component.musicButtonElement || !component.audioManager) return;

        const isPlaying = component.audioManager.isMusicPlaying();
        component.musicButtonElement.textContent = isPlaying ? '🎵' : '🔇';
        component.musicButtonElement.title = isPlaying ? 'Pause Music' : 'Play Music';
    }

    static setupMusicButtonEventListener(component: IAudioControlSupport): void {
        if (component.musicButtonElement && component.audioManager) {
            component.musicButtonElement.addEventListener('click', async () => {
                await AudioControlUtils.toggleMusic(component);
            });
        }
    }

    // Enhanced audio control support
    static async renderEnhancedAudioControl(component: IEnhancedAudioControlSupport): Promise<string> {
        if (!component.audioManager) return '';

        try {
            const trackInfo = component.audioManager.getCurrentTrackInfo();
            const isPlaying = component.audioManager.isMusicPlaying();
            const isCyclingEnabled = component.audioManager.isCyclingEnabled();

            const templateData = {
                hasAudioManager: true,
                currentTrackName: trackInfo?.name || 'Loading...',
                currentTrackIndex: (trackInfo?.index || 0) + 1,
                totalTracks: trackInfo?.total || 8,
                playPauseIcon: isPlaying ? '🎵' : '🔇',
                playPauseTitle: isPlaying ? 'Pause Music' : 'Play Music',
                isCyclingEnabled: isCyclingEnabled,
                currentVolume: 0.3, // Default volume
                volumePercent: 30
            };

            return await templateEngine.renderTemplateFromFile('enhanced-audio-control', templateData);
        } catch (error) {
            console.warn('Failed to render enhanced audio control:', error);
            // Fallback to simple control using template
            try {
                return await templateEngine.renderTemplateFromFile('music-button-fallback', {});
            } catch (fallbackError) {
                console.error('Even fallback template failed:', fallbackError);
                return '<button class="audio-control-button" id="music-toggle-btn" title="Toggle Music">🎵</button>';
            }
        }
    }

    static setupEnhancedAudioControls(component: IEnhancedAudioControlSupport): void {
        if (!component.container || !component.audioManager) return;

        // Expand/Collapse functionality
        const expandBtn = component.container.querySelector('#audio-expand-btn');
        const collapseBtn = component.container.querySelector('#audio-collapse-btn');
        const collapsedPanel = component.container.querySelector('#audio-control-collapsed');
        const expandedPanel = component.container.querySelector('#audio-control-expanded');

        if (expandBtn && collapsedPanel && expandedPanel) {
            expandBtn.addEventListener('click', () => {
                (collapsedPanel as HTMLElement).style.display = 'none';
                (expandedPanel as HTMLElement).style.display = 'block';
            });
        }

        if (collapseBtn && collapsedPanel && expandedPanel) {
            collapseBtn.addEventListener('click', () => {
                (expandedPanel as HTMLElement).style.display = 'none';
                (collapsedPanel as HTMLElement).style.display = 'block';
            });
        }

        // Music toggle buttons (both collapsed and expanded)
        const toggleBtns = component.container.querySelectorAll('#music-toggle-btn, #expanded-music-toggle-btn');
        toggleBtns.forEach(btn => {
            btn.addEventListener('click', async () => {
                await AudioControlUtils.toggleMusic(component);
                AudioControlUtils.updateEnhancedAudioState(component);
            });
        });

        // Track navigation
        const prevBtn = component.container.querySelector('#prev-track-btn');
        const nextBtn = component.container.querySelector('#next-track-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', async () => {
                await component.audioManager?.skipToPreviousTrack();
                AudioControlUtils.updateEnhancedAudioState(component);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', async () => {
                await component.audioManager?.skipToNextTrack();
                AudioControlUtils.updateEnhancedAudioState(component);
            });
        }

        // Volume control
        const volumeSlider = component.container.querySelector('#volume-slider') as HTMLInputElement;
        const volumeDisplay = component.container.querySelector('#volume-display');

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat((e.target as HTMLInputElement).value);
                component.audioManager?.setMusicVolume(volume);
                if (volumeDisplay) {
                    volumeDisplay.textContent = `${Math.round(volume * 100)}%`;
                }
            });
        }

        // Cycling toggle
        const cyclingBtn = component.container.querySelector('#cycling-toggle-btn');
        if (cyclingBtn) {
            cyclingBtn.addEventListener('click', () => {
                const currentState = component.audioManager?.isCyclingEnabled() || false;
                component.audioManager?.setCyclingEnabled(!currentState);
                AudioControlUtils.updateEnhancedAudioState(component);
            });
        }
    }

    static updateEnhancedAudioState(component: IEnhancedAudioControlSupport): void {
        if (!component.container || !component.audioManager) return;

        const trackInfo = component.audioManager.getCurrentTrackInfo();
        const isPlaying = component.audioManager.isMusicPlaying();
        const isCyclingEnabled = component.audioManager.isCyclingEnabled();

        // Update track names
        const trackNameElements = component.container.querySelectorAll('#current-track-name, #expanded-track-name');
        trackNameElements.forEach(el => {
            if (el && trackInfo) {
                el.textContent = trackInfo.name;

                // Add marquee animation for long titles
                if (el.id === 'current-track-name') {
                    const maxLength = 20; // Characters that fit in container
                    if (trackInfo.name.length > maxLength) {
                        el.classList.remove('short');
                    } else {
                        el.classList.add('short');
                    }
                }
            }
        });

        // Update track position
        const trackPositionEl = component.container.querySelector('#track-position');
        if (trackPositionEl && trackInfo) {
            trackPositionEl.textContent = `Track ${trackInfo.index + 1}/${trackInfo.total}`;
        }

        // Update play/pause buttons
        const playPauseBtns = component.container.querySelectorAll('#music-toggle-btn, #expanded-music-toggle-btn');
        playPauseBtns.forEach(btn => {
            if (btn) {
                btn.textContent = isPlaying ? '🎵' : '🔇';
                (btn as HTMLElement).title = isPlaying ? 'Pause Music' : 'Play Music';
            }
        });

        // Update cycling button
        const cyclingBtn = component.container.querySelector('#cycling-toggle-btn');
        if (cyclingBtn) {
            cyclingBtn.textContent = isCyclingEnabled ? 'ON' : 'OFF';
            cyclingBtn.classList.toggle('active', isCyclingEnabled);
        }
    }

    static async playButtonSound(audioManager?: IAudioManager): Promise<void> {
        // Gunshot sound disabled - no longer plays on button clicks
        return;
    }
}
