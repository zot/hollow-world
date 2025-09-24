// Shared audio control utilities following DRY principle
// Eliminates duplicated toggleMusic logic across UI components

import { IAudioManager } from '../audio/AudioManager.js';

export interface IAudioControlSupport {
    audioManager?: IAudioManager;
    musicButtonElement: HTMLElement | null;
}

export class AudioControlUtils {
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

    static async playButtonSound(audioManager?: IAudioManager): Promise<void> {
        if (audioManager) {
            try {
                await audioManager.playRandomGunshot();
            } catch (error) {
                console.warn('Failed to play button sound:', error);
            }
        }
    }
}