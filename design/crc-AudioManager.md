# crc-AudioManager

**Source Spec:** specs/audio.md
**Existing Code:** src/audio/AudioManager.ts

## Responsibilities

### Knows
- musicProviders: IAudioProvider[] - Array of audio providers (one per track)
- gunshotProvider: IAudioProvider - Sound effect provider for button clicks
- musicSources: string[] - URLs of all background music tracks
- gunshotSrc: string - URL of gunshot sound effect
- currentTrackIndex: number - Currently playing track (0-based)
- defaultVolume: number - Background music volume (0.3)
- sfxVolume: number - Sound effects volume (0.7)
- activeGunshots: HTMLAudioElement[] - Currently playing gunshot sounds
- isCycling: boolean - Whether auto-cycling to next track is enabled
- cyclingTimeoutId: number | null - Timeout ID for auto-advance
- isTransitioning: boolean - Whether currently fading between tracks

### Does
- **initialize**(): Load all audio files and prepare providers
- **playBackgroundMusic**(): Start playing current track
- **pauseBackgroundMusic**(): Pause music and stop cycling
- **stopBackgroundMusic**(): Stop music completely and reset
- **setMusicVolume**(volume): Set background music volume (0.0-1.0)
- **isMusicPlaying**(): Check if any music track is playing
- **toggleMusic**(): Toggle play/pause state
- **playRandomGunshot**(): Play gunshot with randomized pitch/duration/volume
- **skipToNextTrack**(): Fade out current track and start next
- **skipToPreviousTrack**(): Fade out current track and start previous
- **getCurrentTrackInfo**(): Get current track index, name, and total tracks
- **setCyclingEnabled**(enabled): Enable/disable auto-advance to next track
- **isCyclingEnabled**(): Check if cycling is enabled
- **getCurrentMusicProvider**(): Get provider for current track
- **getCurrentTrackName**(): Get human-readable name of current track
- **getTrackName**(src): Extract readable name from file path
- **stopAllMusicTracks**(): Pause all music providers
- **clearCyclingTimeout**(): Clear auto-advance timeout
- **setupAutoAdvance**(provider): Schedule next track when current ends
- **fadeOutCurrentTrack**(fadeTime): Smooth fade-out over specified time
- **stopAllGunshots**(): Stop all currently playing gunshot sounds
- **removeGunshot**(audio): Remove gunshot from active list

## Collaborators

- **IAudioProvider** (HTMLAudioProvider): Delegates actual audio playback
- **AudioControlUtils**: Audio controls call AudioManager methods
- **SplashScreen**: Uses AudioManager for music and button sounds
- **SettingsView**: Uses AudioManager for audio controls

## Sequences

- seq-app-startup.md (initialization)
- seq-play-background-music.md (playback and cycling)
- seq-play-sound-effect.md (button clicks)

## Analysis

### Working Well ✅

1. **SOLID principles followed**:
   - Single Responsibility: Manages audio system only
   - Open/Closed: Extensible through IAudioProvider interface
   - Liskov Substitution: AudioManager implements IAudioManager
   - Interface Segregation: Clean separation of concerns
   - Dependency Inversion: Depends on IAudioProvider abstraction

2. **Multi-track cycling**: 8 tracks cycle automatically with smooth fade-out

3. **Graceful initialization**: Continues even if individual tracks fail to load

4. **Auto-advance**: Automatic progression to next track when current ends

5. **Smooth transitions**: 1-second fade-out when manually changing tracks

6. **Rich gunshot variation**:
   - Pitch randomization (0.7-1.3x)
   - Volume randomization (0.5-0.9)
   - Duration variation (0.7-1.3x)
   - Optional reverb effect (30% chance)
   - Playback delay (0-200ms)
   - Proper cleanup and interrupt handling

7. **Volume management**: Separate volumes for music (0.3) and SFX (0.7)

8. **Cycling control**: Enable/disable auto-advance with proper loop mode switching

9. **Track navigation**: Previous/next track with fade transitions

10. **Timeout management**: Aggressive 3-second timeout per track prevents hanging

11. **Error handling**: Specific browser autoplay error detection (NotAllowedError)

### Potential Issues ⚠️

None identified. Implementation exceeds spec requirements with advanced features.

### Missing from Spec 📝

- **Web Audio API reverb**: Code adds reverb effect to gunshots (enhancement)
- **Playback delay**: Random 0-200ms delay on gunshots (enhancement)
- **Fade-out on duration variation**: Shorter gunshots fade out smoothly (enhancement)

### Implementation Notes

- Multiple gunshots can play simultaneously (activeGunshots array)
- Interrupt functionality: New gunshot stops previous ones (stopAllGunshots)
- Track info includes index, name, and total count
- Cycling can be toggled on/off
- When cycling disabled, current track loops
- Audio providers initialized lazily during initialize()
- All music providers pre-loaded during initialization
- getCurrentTime and getDuration used for auto-advance timing
