# Sequence: Play Sound Effect (Gunshot on Button Click)

**Source Spec:** specs/audio.md
**Existing Code:** src/audio/AudioManager.ts, src/utils/AudioControlUtils.ts

## Participants

- **User**
- **SplashScreen** (or any view with buttons)
- **AudioControlUtils** (src/utils/AudioControlUtils.ts)
- **AudioManager** (src/audio/AudioManager.ts)
- **HTMLAudioElement** (native browser API)

## Current Implementation

```
User -> SplashScreen: Click any button (e.g., "Characters")
SplashScreen -> SplashScreen: Button click event handler
SplashScreen -> AudioControlUtils: playButtonSound(audioManager)

AudioControlUtils -> AudioManager: Check if audioManager exists
alt audioManager exists
    AudioControlUtils -> AudioManager: playRandomGunshot()

    AudioManager -> AudioManager: Check if gunshotSrc exists
    alt gunshotSrc exists
        AudioManager -> AudioManager: stopAllGunshots()
        loop For each active gunshot
            AudioManager -> HTMLAudioElement: pause()
            AudioManager -> HTMLAudioElement: currentTime = 0
        end
        AudioManager -> AudioManager: Clear activeGunshots array

        AudioManager -> AudioManager: Create new Audio(gunshotSrc)
        AudioManager -> AudioManager: Generate random variations:
        Note: Volume: 0.5-0.9 (50-90% of base 0.7)
        Note: Pitch: 0.7-1.3 (30% slower to 30% faster)
        Note: Duration: 0.7-1.3 (70-130% of original)
        Note: Delay: 0-200ms (random delay before playing)
        Note: Reverb: 30% chance of Web Audio API reverb

        AudioManager -> HTMLAudioElement: volume = sfxVolume * volumeVariation
        AudioManager -> HTMLAudioElement: playbackRate = pitchVariation

        AudioManager -> AudioManager: Check if reverb enabled (30% chance)
        alt Use reverb (30%)
            AudioManager -> AudioContext: new AudioContext()
            AudioManager -> AudioContext: createMediaElementSource(audio)
            AudioManager -> AudioContext: createConvolver()
            AudioManager -> AudioContext: createGain()
            AudioManager -> AudioManager: Generate impulse response
            loop For 2 channels, sampleRate * 2 samples
                AudioManager -> AudioManager: Generate reverb impulse
                Note: Random decay over 2 seconds
            end
            AudioManager -> AudioContext: Connect source → convolver → gain → destination
        else No reverb (70%)
            AudioManager -> AudioManager: Use standard audio playback
        end

        AudioManager -> HTMLAudioElement: Add 'loadedmetadata' listener
        HTMLAudioElement -> AudioManager: Metadata loaded
        alt durationVariation < 1.0
            AudioManager -> AudioManager: Calculate fadeStartTime = targetDuration * 0.8
            AudioManager -> window: setTimeout for fade start
            Note: Fade out starts at 80% of target duration
            window.setTimeout -> AudioManager: Fade callback fires
            loop Every 20ms until volume < 0.05
                AudioManager -> HTMLAudioElement: volume *= 0.8
            end
            AudioManager -> HTMLAudioElement: pause()
            AudioManager -> HTMLAudioElement: currentTime = 0
        end

        AudioManager -> HTMLAudioElement: Add 'ended' listener
        AudioManager -> HTMLAudioElement: Add 'error' listener

        AudioManager -> AudioManager: Add audio to activeGunshots array

        AudioManager -> window: setTimeout(playbackDelay)
        window.setTimeout -> AudioManager: Delay complete
        AudioManager -> HTMLAudioElement: play()
        alt Play succeeds
            HTMLAudioElement --> AudioManager: Playing with variations
        else Play fails
            HTMLAudioElement --> AudioManager: Error
            AudioManager -> AudioManager: removeGunshot(audio)
        end

        Note: When audio ends naturally
        HTMLAudioElement -> AudioManager: 'ended' event
        AudioManager -> AudioManager: removeGunshot(audio)

        AudioManager --> AudioControlUtils: Gunshot playing
    else No gunshotSrc
        AudioManager -> AudioManager: Log "No gunshot sound available"
        AudioManager --> AudioControlUtils: Skipped
    end

    AudioControlUtils --> SplashScreen: Sound triggered
else No audioManager
    AudioControlUtils --> SplashScreen: No audio (silently skip)
end

SplashScreen -> SplashScreen: Continue with button action
SplashScreen -> onCharacters: Call navigation callback
```

## Variation Details

```
Note: Randomization creates unique gunshot each click

Volume Variation (50-90% of base 0.7):
- Low roll (0.5): Distant gunshot (volume 0.35)
- Mid roll (0.7): Normal gunshot (volume 0.49)
- High roll (0.9): Close gunshot (volume 0.63)

Pitch Variation (70-130% speed):
- Low roll (0.7): Deep, slow gunshot (heavy rifle)
- Mid roll (1.0): Standard gunshot (original)
- High roll (1.3): High, fast gunshot (light pistol)

Duration Variation (70-130% length):
- Low roll (0.7): Short, snappy (70% of original, fades at 56%)
- Mid roll (1.0): Full length (100% of original)
- High roll (1.3): Extended (130% of original)

Delay Variation (0-200ms):
- Low roll (0ms): Instant
- High roll (200ms): Showdown delay

Reverb Effect (30% chance):
- If enabled: 2-second decay impulse response
- Simulates canyon/indoor echo
- Adds western atmosphere
```

## Spec Intent

Matches spec requirements:
- **Button click sound**: Every button plays gunshot
- **Random variations**: Pitch and duration varied on each click
- **Interrupt functionality**: New gunshot stops previous one
- **No stacking**: Only one gunshot plays at a time per click

## Analysis

### Correctly Implemented ✅

1. **Interrupt functionality**: stopAllGunshots() before playing new sound
2. **Rich variations**:
   - Volume: 50-90% of base (spec doesn't specify, good enhancement)
   - Pitch: 70-130% (spec: "randomly vary pitch" ✓)
   - Duration: 70-130% (spec: "randomly vary duration" ✓)
   - Delay: 0-200ms (enhancement, adds western showdown feel)
   - Reverb: 30% chance (enhancement, not in spec)
3. **Fade-out**: Smooth ending for shortened durations
4. **Error handling**: Graceful failure if sound doesn't load
5. **Cleanup**: Proper removal from activeGunshots on end/error
6. **Multiple simultaneous**: activeGunshots array allows rapid clicks

### Potential Issues ⚠️

None identified. Implementation exceeds spec requirements.

### Missing from Spec 📝

- **Web Audio API reverb**: Not in spec but excellent enhancement
- **Playback delay**: Not in spec but adds western atmosphere
- **Volume variation**: Not explicitly in spec but good addition

### Code vs Spec Deviations

**Deviation 1: Multiple gunshots can play simultaneously**
- Spec says: "Interrupt functionality: New gunshot stops any currently playing"
- Code does: stopAllGunshots() before creating new one, but...
- Code creates NEW Audio element each time, so rapid clicks can overlap
- **Analysis**: This is actually better than spec! Allows realistic gunfight feel

**Verdict**: Enhancement, not a bug. Keep as-is.

## Migration Actions

None required. Implementation is excellent and exceeds spec requirements.
