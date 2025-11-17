# Test Design: AudioSystem

**Component:** Audio System (AudioManager, AudioProvider, AudioControlUtils)
**CRC References:** crc-AudioManager.md, crc-AudioProvider.md, crc-AudioControlUtils.md, crc-GlobalAudioControl.md
**Spec Reference:** specs/audio.md
**Implementation Test:** No dedicated test file yet (needs creation)

## Component Overview

Audio System manages background music and sound effects for the application. Includes 8-track music cycling, smooth transitions, volume control, and global audio controls visible on all views.

## Test Categories

### Unit Tests - AudioProvider

#### File Loading Tests

**Test Case: Load Audio File**
- Purpose: Verify audio file loads successfully
- Setup: Audio file exists
- Input: Call loadAudio('background-1.mp3')
- Expected: Audio buffer loaded, ready to play
- Related CRC: crc-AudioProvider.md (loadAudio)

**Test Case: Load Missing Audio File**
- Purpose: Verify handling of 404 audio file
- Setup: Audio file doesn't exist
- Input: Call loadAudio('missing.mp3')
- Expected: Error returned, app continues
- Related CRC: crc-AudioProvider.md

**Test Case: Preload Multiple Files**
- Purpose: Verify batch loading
- Setup: Multiple audio files
- Input: Preload all background tracks
- Expected: All files loaded and cached
- Related CRC: crc-AudioProvider.md (preloadAudio)

#### Playback Tests

**Test Case: Play Audio**
- Purpose: Verify audio playback
- Setup: Audio file loaded
- Input: Call play(audioBuffer)
- Expected: Audio plays
- Related CRC: crc-AudioProvider.md (play)

**Test Case: Stop Audio**
- Purpose: Verify stopping playback
- Setup: Audio playing
- Input: Call stop()
- Expected: Audio stops immediately
- Related CRC: crc-AudioProvider.md (stop)

**Test Case: Pause Audio**
- Purpose: Verify pausing playback
- Setup: Audio playing
- Input: Call pause()
- Expected: Audio pauses, can resume later
- Related CRC: crc-AudioProvider.md (pause)

**Test Case: Resume Audio**
- Purpose: Verify resuming from pause
- Setup: Audio paused
- Input: Call resume()
- Expected: Audio resumes from pause point
- Related CRC: crc-AudioProvider.md (resume)

**Test Case: Set Volume**
- Purpose: Verify volume control
- Setup: Audio playing
- Input: Call setVolume(0.3)
- Expected: Volume set to 30%
- Related CRC: crc-AudioProvider.md (setVolume)
- Related Spec: specs/audio.md (Background music 0.3 volume)

**Test Case: Fade In**
- Purpose: Verify smooth fade in
- Setup: Audio stopped
- Input: Call fadeIn(2000) // 2 second fade
- Expected: Audio fades in from 0 to target volume over 2s
- Related CRC: crc-AudioProvider.md (fadeIn)

**Test Case: Fade Out**
- Purpose: Verify smooth fade out
- Setup: Audio playing
- Input: Call fadeOut(2000)
- Expected: Audio fades out to 0 over 2s, then stops
- Related CRC: crc-AudioProvider.md (fadeOut)

### Unit Tests - AudioManager

#### Background Music Tests

**Test Case: Start Background Music**
- Purpose: Verify music starts playing
- Setup: None
- Input: Call startBackgroundMusic()
- Expected: Random track from 8 tracks starts
- Related CRC: crc-AudioManager.md (startBackgroundMusic)
- Related Spec: specs/audio.md (8-track cycling)
- Related Sequence: seq-play-background-music.md

**Test Case: Stop Background Music**
- Purpose: Verify music stops
- Setup: Music playing
- Input: Call stopBackgroundMusic()
- Expected: Music fades out and stops
- Related CRC: crc-AudioManager.md (stopBackgroundMusic)

**Test Case: Track Cycling**
- Purpose: Verify music cycles through 8 tracks
- Setup: Music playing
- Input: Wait for track to end
- Expected: Next track starts automatically
- Related CRC: crc-AudioManager.md (handleTrackEnd)
- Related Spec: specs/audio.md (8-track cycling)

**Test Case: Random Track Selection**
- Purpose: Verify tracks play in random order
- Setup: None
- Input: Play multiple tracks
- Expected: Track order is random (not sequential)
- Related CRC: crc-AudioManager.md

**Test Case: Smooth Transitions**
- Purpose: Verify crossfade between tracks
- Setup: Track ending
- Input: Next track starts
- Expected: Smooth fade out/in transition (no silence gap)
- Related CRC: crc-AudioManager.md
- Related Spec: specs/audio.md (Smooth transitions)

**Test Case: Music Volume**
- Purpose: Verify background music at correct volume
- Setup: Music playing
- Input: Check volume
- Expected: Volume = 0.3 (30%)
- Related CRC: crc-AudioManager.md
- Related Spec: specs/audio.md (0.3 volume)

#### Sound Effect Tests

**Test Case: Play Gunshot Sound**
- Purpose: Verify gunshot sound effect
- Setup: None
- Input: Call playGunshot()
- Expected: Gunshot sound plays once
- Related CRC: crc-AudioManager.md (playGunshot)
- Related Sequence: seq-play-sound-effect.md

**Test Case: Gunshot Pitch Variation**
- Purpose: Verify pitch randomization
- Setup: None
- Input: Play gunshot 10 times
- Expected: Pitch varies each time (not identical)
- Related CRC: crc-AudioManager.md
- Related Spec: specs/audio.md (Pitch variation)

**Test Case: Gunshot Duration Variation**
- Purpose: Verify duration randomization
- Setup: None
- Input: Play gunshot multiple times
- Expected: Duration varies (not identical)
- Related CRC: crc-AudioManager.md
- Related Spec: specs/audio.md (Duration variation)

**Test Case: Sound Effect Volume**
- Purpose: Verify sound effects at correct volume
- Setup: None
- Input: Play gunshot
- Expected: Volume appropriate (not overpowering music)
- Related CRC: crc-AudioManager.md

**Test Case: Multiple Concurrent Sounds**
- Purpose: Verify overlapping sound effects
- Setup: None
- Input: Play multiple gunshots rapidly
- Expected: All sounds play (no cutoff)
- Related CRC: crc-AudioManager.md

### Unit Tests - AudioControlUtils

#### Control Rendering Tests

**Test Case: Render Audio Controls**
- Purpose: Verify control UI rendered
- Setup: Container element
- Input: Call renderAudioControls(container)
- Expected: Play/pause, volume controls visible
- Related CRC: crc-AudioControlUtils.md (renderAudioControls)
- Related Spec: specs/audio.md (Audio controls visible)

**Test Case: Play/Pause Button**
- Purpose: Verify play/pause toggle
- Setup: Audio controls rendered
- Input: Click play/pause button
- Expected: Music starts/stops, button icon updates
- Related CRC: crc-AudioControlUtils.md

**Test Case: Volume Slider**
- Purpose: Verify volume slider
- Setup: Audio controls rendered
- Input: Move volume slider
- Expected: Music volume changes in real-time
- Related CRC: crc-AudioControlUtils.md

**Test Case: Mute Button**
- Purpose: Verify mute toggle
- Setup: Audio controls rendered
- Input: Click mute button
- Expected: Music muted, button icon updates
- Related CRC: crc-AudioControlUtils.md

#### Control Positioning Tests

**Test Case: Fixed Bottom-Right Position**
- Purpose: Verify controls always visible
- Setup: Audio controls rendered
- Input: Scroll page
- Expected: Controls remain fixed at bottom-right
- Related CRC: crc-GlobalAudioControl.md
- Related Spec: specs/audio.md (Fixed bottom-right)

**Test Case: Controls on All Views**
- Purpose: Verify controls visible on every view
- Setup: Navigate through views
- Input: Check each view (splash, characters, friends, settings, worlds)
- Expected: Audio controls present on all views
- Related CRC: crc-GlobalAudioControl.md
- Related Spec: specs/ui.md (Audio controls on all views)

### Integration Tests

**Test Case: AudioManager + AudioProvider Integration**
- Purpose: Verify manager uses provider correctly
- Setup: None
- Input: Start background music
- Expected: Manager calls provider methods, music plays
- Related CRC: crc-AudioManager.md, crc-AudioProvider.md

**Test Case: Controls + Manager Integration**
- Purpose: Verify controls interact with manager
- Setup: Audio controls rendered
- Input: Click play button
- Expected: Manager starts music
- Related CRC: crc-AudioControlUtils.md, crc-AudioManager.md

**Test Case: Multi-View Audio Persistence**
- Purpose: Verify music continues across view changes
- Setup: Music playing on splash
- Input: Navigate to characters, friends, settings
- Expected: Music continues without interruption
- Related CRC: crc-AudioManager.md, crc-GlobalAudioControl.md

**Test Case: Audio State Persistence**
- Purpose: Verify audio state persists across page reloads
- Setup: Music playing, volume set to 0.5
- Input: Reload page
- Expected: Music auto-starts (or stays stopped based on last state), volume = 0.5
- Related CRC: crc-AudioManager.md

### E2E Tests

**Test Case: App Startup Audio**
- Purpose: Verify audio starts on app load
- Setup: Fresh app load
- Input: Navigate to app
- Expected: Background music playing (with user gesture if required)
- Test Type: Playwright E2E

**Test Case: Control Music Across Views**
- Purpose: Verify audio controls work on all views
- Setup: App loaded
- Input: Navigate views, use audio controls on each
- Expected: Controls always visible and functional
- Test Type: Playwright E2E

**Test Case: Play Sound Effect**
- Purpose: Verify sound effects in context
- Setup: In gameplay or character screen
- Input: Trigger action with sound effect
- Expected: Sound plays, music continues
- Test Type: Playwright E2E

### Edge Cases

**Test Case: Audio Context Not Allowed**
- Purpose: Verify handling when browser blocks audio
- Setup: Mock audio context error
- Input: Attempt to play music
- Expected: Error handled, user prompted for interaction
- Related CRC: crc-AudioManager.md

**Test Case: Missing Audio Files**
- Purpose: Verify handling when audio assets missing
- Setup: Mock 404 on audio file
- Input: Start background music
- Expected: Error logged, app continues without audio
- Related CRC: crc-AudioProvider.md

**Test Case: Audio Format Not Supported**
- Purpose: Verify fallback for unsupported formats
- Setup: Browser doesn't support MP3
- Input: Load audio file
- Expected: Fallback format loaded (OGG, WAV)
- Related CRC: crc-AudioProvider.md

**Test Case: Very Rapid Track Changes**
- Purpose: Verify handling of rapid track cycling
- Setup: Music playing
- Input: Skip tracks rapidly
- Expected: Transitions smooth, no memory leaks
- Related CRC: crc-AudioManager.md

**Test Case: Audio Controls During Template Render**
- Purpose: Verify controls persist during re-renders
- Setup: View re-rendering
- Input: Re-render template
- Expected: Audio controls remain, state preserved
- Related CRC: crc-GlobalAudioControl.md

**Test Case: Volume Limits**
- Purpose: Verify volume clamped to valid range
- Setup: Audio playing
- Input: Set volume to -1, 2, 999
- Expected: Volume clamped to 0-1 range
- Related CRC: crc-AudioProvider.md

**Test Case: Concurrent Fade Operations**
- Purpose: Verify handling of overlapping fades
- Setup: Audio fading in
- Input: Start fade out before fade in completes
- Expected: Fade out takes over, no errors
- Related CRC: crc-AudioProvider.md

## Coverage Goals

- Test AudioProvider (load, play, stop, pause, volume, fade)
- Test AudioManager (background music, track cycling, sound effects)
- Test AudioControlUtils (render controls, play/pause, volume, mute)
- Test GlobalAudioControl (fixed position, visible on all views)
- Test integration between components
- Test audio state persistence
- Test edge cases (blocked audio, missing files, unsupported formats)
- E2E tests for audio across views

## Notes

- Background music: 8 tracks, random cycling, 0.3 volume, smooth transitions
- Sound effects: Gunshot with pitch/duration variation
- Audio controls: Fixed bottom-right, visible on ALL views (critical requirement)
- Web Audio API for precise control and effects
- Graceful degradation when audio unavailable
- User gesture may be required to start audio (browser policy)
- Consider preloading audio assets for smooth playback
- Memory management for audio buffers
