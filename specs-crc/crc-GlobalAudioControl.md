# GlobalAudioControl

**Source Spec:** specs/audio.md, specs/ui.md
**Existing Code:** src/ui/GlobalAudioControl.ts
**Test Code:** (none - Phase 7)

## Responsibilities

### Knows
- `audioManager: IAudioManager | undefined` - Audio system instance
- `container: HTMLElement | null` - Fixed bottom-right container
- `updateInterval: number` - Timer for state updates

### Does
- **Rendering:**
  - `render()` - Create and return fixed-position audio control element
  - `updateContent()` - Update UI with current track info
  - `update()` - Refresh UI state (called every second)

- **Event Handling:**
  - `setupEventListeners()` - Wire up play/pause, next, prev, cycling buttons
  - Handle play/pause toggle
  - Handle next/previous track
  - Handle cycling toggle

- **Lifecycle:**
  - `destroy()` - Clean up interval and event listeners

## Collaborators

- **AudioManager** (src/audio/AudioManager.ts) - Audio system
- **TemplateEngine** (src/utils/TemplateEngine.ts) - Template rendering

## Code Review Notes

### ✅ Working well
- **Fixed positioning**: Always visible bottom-right
- **Real-time updates**: Updates every second
- **Graceful degradation**: Shows "Audio unavailable" if no AudioManager
- **Complete controls**: Play/pause, next, prev, cycling toggle
- **Track info display**: Shows current track and position
- **SOLID principles**:
  - Single Responsibility: Global audio controls only
  - Dependency Injection: AudioManager injected

### ✅ Matches spec perfectly
- Visible on all pages (CRITICAL requirement)
- Bottom-right positioning
- Track cycling controls
- Current track display
- Play/pause/next/prev buttons

### 📝 Implementation details
- **Update frequency**: 1000ms (1 second)
- **Template files**: global-audio-control.html, global-audio-control-unavailable.html
- **CSS class**: global-audio-control
- **Container ID**: global-audio-control
- **Event delegation**: Uses template-rendered buttons

## Sequences

- seq-play-background-music.md (already exists from Phase 3)
- seq-play-sound-effect.md (already exists from Phase 3)

## Related CRC Cards

- crc-AudioManager.md - Audio system (Phase 3)
- crc-Application.md - Application orchestrator

## Design Patterns

**Singleton Access**: Single global audio control instance
**Observer Pattern**: Polls AudioManager state every second
**Template View**: Uses TemplateEngine for rendering

## Key Design Decisions

1. **Fixed Positioning**: Always visible (CRITICAL spec requirement)
2. **Polling Updates**: State refreshed every second via setInterval
3. **Graceful Degradation**: Works even if AudioManager unavailable
4. **Complete Controls**: All audio operations accessible
5. **Track Info Display**: Shows current track name and position
6. **Lifecycle Management**: Proper cleanup on destroy
