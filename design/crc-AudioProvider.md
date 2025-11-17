# crc-AudioProvider

**Source Spec:** audio.md (implied by AudioManager requirements)
**Existing Code:** src/audio/AudioManager.ts (IAudioProvider interface, HTMLAudioProvider implementation)

## Responsibilities

### Knows (Interface)
- (Interface defines behavior, implementations hold state)

### Knows (HTMLAudioProvider Implementation)
- audio: HTMLAudioElement - HTML5 audio element
- isLoaded: boolean - Whether audio file has loaded successfully

### Does (Interface)
- **load**(src): Load audio file from URL
- **play**(): Start audio playback
- **pause**(): Pause audio playback
- **stop**(): Stop audio and reset position to start
- **setVolume**(volume): Set audio volume (0.0-1.0)
- **setLoop**(loop): Enable/disable looping
- **isPlaying**(): Check if audio is currently playing
- **getCurrentTime**(): Get current playback position in seconds
- **getDuration**(): Get total audio duration in seconds

### Does (HTMLAudioProvider Implementation)
- **load**(src): Promise-based loading with 3-second timeout
- **play**(): Async play with error handling (preserves error.name)
- **pause**(): Pauses audio element
- **stop**(): Pauses and resets currentTime to 0
- **setVolume**(volume): Clamps volume to 0-1 range
- **setLoop**(loop): Sets audio.loop property
- **isPlaying**(): Checks !paused && !ended && (currentTime > 0 || readyState >= HAVE_CURRENT_DATA)
- **getCurrentTime**(): Returns audio.currentTime
- **getDuration**(): Returns audio.duration or 0
- **setupEventListeners**(): Attach error event listener
- **getMediaErrorMessage**(code): Convert MediaError code to human message

## Collaborators

- **AudioManager**: Uses IAudioProvider for all audio playback
- **HTMLMediaElement**: HTMLAudioProvider wraps native HTML5 audio

## Sequences

- seq-play-background-music.md (via AudioManager)
- seq-play-sound-effect.md (via AudioManager)

## Analysis

### Working Well ✅

1. **SOLID principles followed**:
   - Single Responsibility: Audio playback only
   - Open/Closed: Interface allows alternative implementations
   - Liskov Substitution: HTMLAudioProvider substitutable for IAudioProvider
   - Interface Segregation: Clean minimal interface
   - Dependency Inversion: AudioManager depends on abstraction

2. **Timeout protection**: 3-second timeout prevents hanging on load

3. **Error handling**:
   - Detailed MediaError code translation
   - Error name preservation for type checking (NotAllowedError)
   - Graceful error event listening

4. **Playing state detection**: Robust check handles edge cases (currentTime=0 but ready to play)

5. **Volume clamping**: Prevents invalid volume values

6. **Promise-based loading**: Modern async API with proper event handling

7. **Event cleanup**: Uses {once: true} for one-time event listeners

### Potential Issues ⚠️

None identified. Clean interface and solid implementation.

### Missing from Spec 📝

- **IAudioProvider interface**: Not explicitly in spec but necessary abstraction
- **Timeout duration**: 3-second timeout not specified in spec (implementation choice)

### Implementation Notes

- Interface enables testing with mock audio providers
- HTMLAudioProvider could be swapped for Web Audio API implementation
- isLoaded flag prevents play() before load completes
- getDuration returns 0 if duration unknown (graceful fallback)
- Error events logged to console.warn
- canplaythrough event used for load completion
- readyState check handles autoplay blocked scenario (audio ready but not playing)
