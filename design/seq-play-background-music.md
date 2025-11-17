# Sequence: Play Background Music with Cycling

**Source Spec:** audio.md
**Existing Code:** src/audio/AudioManager.ts

## Participants

- **User**
- **AudioControlUtils** (src/utils/AudioControlUtils.ts)
- **AudioManager** (src/audio/AudioManager.ts)
- **HTMLAudioProvider** (src/audio/AudioManager.ts)
- **HTMLAudioElement** (native browser API)

## Current Implementation - Initial Play

```
User -> AudioControlUtils: Click play button
AudioControlUtils -> AudioManager: toggleMusic()
AudioManager -> AudioManager: Check isMusicPlaying()
AudioManager -> AudioManager: isMusicPlaying() == false → call playBackgroundMusic()

AudioManager -> AudioManager: getCurrentMusicProvider()
Note: currentTrackIndex starts at 0
AudioManager -> HTMLAudioProvider: play()
HTMLAudioProvider -> HTMLAudioElement: play()
alt Browser allows playback
    HTMLAudioElement --> HTMLAudioProvider: Playing
    HTMLAudioProvider --> AudioManager: Playing

    AudioManager -> AudioManager: Check if isCycling == true
    alt Cycling enabled
        AudioManager -> AudioManager: setupAutoAdvance(provider)
        AudioManager -> HTMLAudioProvider: getDuration()
        HTMLAudioProvider --> AudioManager: duration (e.g., 180 seconds)
        AudioManager -> AudioManager: Calculate remainingTime = duration - currentTime - 1
        AudioManager -> window: setTimeout(advanceToNext, remainingTime * 1000)
        Note: Timeout set to fire 1 second before track ends
    end

    AudioManager -> AudioManager: Log "Playing track 1: Track Name"
    AudioManager --> AudioControlUtils: Music playing
else Browser blocks autoplay
    HTMLAudioElement --> HTMLAudioProvider: NotAllowedError
    HTMLAudioProvider --> AudioManager: throw NotAllowedError
    AudioManager -> AudioManager: Log "awaiting user interaction"
    AudioManager --> AudioControlUtils: Error (gracefully handled)
end

AudioControlUtils -> AudioControlUtils: updateEnhancedAudioState()
AudioControlUtils -> AudioManager: getCurrentTrackInfo()
AudioManager --> AudioControlUtils: {index: 0, name: "Track Name", total: 8}
AudioControlUtils -> AudioManager: isMusicPlaying()
AudioManager --> AudioControlUtils: true
AudioControlUtils -> AudioControlUtils: Update UI (play icon, track name, track position)
AudioControlUtils --> User: UI updated
```

## Current Implementation - Auto-Advance

```
Note: After ~179 seconds (1 second before track ends)
window.setTimeout -> AudioManager: Timeout callback fires
AudioManager -> AudioManager: Check isCycling == true && provider.isPlaying()
AudioManager -> AudioManager: Log "Auto-advancing from track 1 to next"
AudioManager -> AudioManager: skipToNextTrack()

AudioManager -> AudioManager: fadeOutCurrentTrack(1000ms)
AudioManager -> HTMLAudioProvider: Get current provider
loop 20 steps over 1 second
    AudioManager -> HTMLAudioProvider: setVolume(originalVolume - step)
    AudioManager -> AudioManager: await delay(50ms)
end
AudioManager -> HTMLAudioProvider: stop()
HTMLAudioProvider -> HTMLAudioElement: pause()
HTMLAudioProvider -> HTMLAudioElement: currentTime = 0
AudioManager -> HTMLAudioProvider: setVolume(originalVolume)

AudioManager -> AudioManager: currentTrackIndex = (currentTrackIndex + 1) % musicProviders.length
Note: If currentTrackIndex was 0, now it's 1. If it was 7, wraps to 0.
AudioManager -> AudioManager: Log "Skipped to track 2"

AudioManager -> AudioManager: playBackgroundMusic()
Note: Plays newly selected track and sets up next auto-advance
AudioManager -> HTMLAudioProvider: play() (new provider)
AudioManager -> AudioManager: setupAutoAdvance(newProvider)
AudioManager --> window.setTimeout: Next auto-advance scheduled
```

## Current Implementation - Manual Next/Previous

```
User -> AudioControlUtils: Click "Next Track" button
AudioControlUtils -> AudioManager: skipToNextTrack()
AudioManager -> AudioManager: Check musicProviders.length > 1
AudioManager -> AudioManager: wasPlaying = isMusicPlaying()

AudioManager -> AudioManager: fadeOutCurrentTrack(1000ms)
Note: Same fade-out as auto-advance
AudioManager -> AudioManager: currentTrackIndex = (currentTrackIndex + 1) % total
alt wasPlaying == true
    AudioManager -> AudioManager: playBackgroundMusic()
else wasPlaying == false
    AudioManager -> AudioManager: Track changed but not playing
end
AudioManager -> AudioManager: Log "Skipped to track X"
AudioManager --> AudioControlUtils: Track changed

AudioControlUtils -> AudioControlUtils: updateEnhancedAudioState()
AudioControlUtils --> User: UI updated with new track info

User -> AudioControlUtils: Click "Previous Track" button
AudioControlUtils -> AudioManager: skipToPreviousTrack()
AudioManager -> AudioManager: currentTrackIndex = (currentTrackIndex - 1 + total) % total
Note: If currentTrackIndex was 0, wraps to 7
AudioManager -> AudioManager: Same fade-out and play logic as next
AudioManager --> AudioControlUtils: Track changed
AudioControlUtils --> User: UI updated
```

## Current Implementation - Pause

```
User -> AudioControlUtils: Click pause button
AudioControlUtils -> AudioManager: toggleMusic()
AudioManager -> AudioManager: isMusicPlaying() == true → call pauseBackgroundMusic()
AudioManager -> AudioManager: stopAllMusicTracks()
loop For each provider in musicProviders
    AudioManager -> HTMLAudioProvider: Check if playing
    alt Provider is playing
        AudioManager -> HTMLAudioProvider: pause()
        HTMLAudioProvider -> HTMLAudioElement: pause()
    end
end
AudioManager -> AudioManager: clearCyclingTimeout()
AudioManager -> window: clearTimeout(cyclingTimeoutId)
AudioManager --> AudioControlUtils: Music paused

AudioControlUtils -> AudioControlUtils: updateEnhancedAudioState()
AudioControlUtils -> AudioControlUtils: Update play/pause icon
AudioControlUtils --> User: UI shows paused state
```

## Spec Intent

Matches spec requirements:
- **Sequential cycling**: Tracks play in order 1→8, then repeat
- **Auto-advance**: Next track starts when current ends
- **Smooth transitions**: 1-second fade-out between tracks
- **Volume control**: Background music at 0.3 volume
- **Music persistence**: Continues across view navigation (AudioManager persists)
- **Manual control**: Previous/next buttons with same fade behavior

## Analysis

### Correctly Implemented ✅

1. **8-track cycling**: All 8 tracks loaded and cycle automatically
2. **Fade transitions**: Smooth 1-second fade-out when switching tracks
3. **Auto-advance timing**: Starts next track 1 second before current ends
4. **Wrap-around**: Track 8 → Track 1 (modulo arithmetic)
5. **Manual navigation**: Previous/next with same fade behavior
6. **Cycling toggle**: Can enable/disable auto-advance
7. **Loop mode**: When cycling disabled, current track loops
8. **Volume management**: Consistent 0.3 volume for background
9. **State synchronization**: UI updates reflect playback state
10. **Timeout cleanup**: clearCyclingTimeout prevents memory leaks

### Missing from Spec 📝

None. Implementation matches all spec requirements.

### Code vs Spec Deviations

None identified. Code follows spec exactly.

## Migration Actions

None required. Implementation is excellent.
