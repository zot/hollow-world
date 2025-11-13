# crc-AudioControlUtils

**Source Spec:** specs/audio.md (audio control UI requirements)
**Existing Code:** src/utils/AudioControlUtils.ts

## Responsibilities

### Knows
- (Stateless utility class, no instance state)

### Does
- **toggleMusic**(component): Toggle music play/pause and update UI
- **updateMusicButtonState**(component): Update button icon and title based on playback state
- **setupMusicButtonEventListener**(component): Attach click handler to simple music button
- **renderEnhancedAudioControl**(component): Render full audio control UI from template
- **setupEnhancedAudioControls**(component): Setup all event listeners for enhanced controls
- **updateEnhancedAudioState**(component): Update all UI elements to match audio state
- **playButtonSound**(audioManager): Play randomized gunshot on button click

## Collaborators

- **TemplateEngine**: Render audio control templates (enhanced-audio-control, music-button-fallback)
- **AudioManager**: Query state and control playback
- **IUIComponent** (SplashScreen, SettingsView): Components that include audio controls

## Sequences

- seq-app-startup.md (rendering controls during initialization)
- seq-play-background-music.md (UI updates after state changes)
- seq-play-sound-effect.md (button click sounds)

## Analysis

### Working Well ✅

1. **DRY principle**: Centralizes audio control logic used by multiple views

2. **Two control modes**:
   - Simple: Single play/pause button (legacy/fallback)
   - Enhanced: Full controls with track info, navigation, volume, cycling

3. **Template-based rendering**: All UI in templates (enhanced-audio-control, music-button-fallback)

4. **State synchronization**: updateEnhancedAudioState() keeps UI in sync with AudioManager

5. **Graceful fallback**: Falls back to simple controls if enhanced template fails

6. **Interface-based design**: Works with any component implementing IAudioControlSupport

7. **Complete control setup**:
   - Expand/collapse toggle
   - Play/pause (both panels)
   - Previous/next track
   - Volume slider
   - Cycling toggle

8. **Button sound integration**: playButtonSound() plays randomized gunshot

### Potential Issues ⚠️

None identified. Clean utility class following best practices.

### Missing from Spec 📝

- **IAudioControlSupport / IEnhancedAudioControlSupport**: Interfaces not in spec (good abstraction)
- **updateEnhancedAudioState method**: Not explicitly specified but necessary for state sync

### Implementation Notes

- Stateless utility class (all static methods)
- Components pass themselves to methods (dependency injection)
- Enhanced controls support expand/collapse for space efficiency
- Volume slider updates both audio and display in real-time
- Cycling toggle switches between auto-advance and loop mode
- All event listeners attached through setupEnhancedAudioControls()
- UI state updates happen after every user action
- Button sounds play asynchronously (fire-and-forget)
- Template rendering errors gracefully handled with fallbacks
