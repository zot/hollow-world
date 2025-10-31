# Audio System Specifications

*See [`../CLAUDE.md`](../CLAUDE.md) for general development guidelines*

## Overview

The Hollow World audio system provides immersive western-themed ambiance with background music cycling and interactive sound effects.

## 🎵 Background Music System

### Music Files
The game cycles through 8 western-themed music tracks located in `public/assets/audio/`:

1. `western-adventure-cinematic-spaghetti-loop-385618.mp3`
2. `cinematic-spaghetti-western-music-tales-from-the-west-207360.mp3`
3. `picker_s-grove-folk.mp3`
4. `picker_s-grove-shanty.mp3`
5. `picker_s-grove-western.mp3`
6. `picker_s-grove-western-ballad.mp3`
7. `mining-incident-waltz-hoedown.mp3`
8. `mining-incident-waltz-polka.mp3`

### Music System Features
- [x] **Sequential cycling** with auto-advance ✅ **IMPLEMENTED**
- [x] **Smooth transitions** (1-second fade out between tracks) ✅ **IMPLEMENTED**
- [x] **Volume control** set to 0.3 for background ambiance ✅ **IMPLEMENTED**
- [x] **Music persistence** across view navigation ✅ **IMPLEMENTED**
- [x] **Mysterious western ghosttown music** plays continuously ✅ **IMPLEMENTED**

### Music Playback Behavior
- Tracks play in sequential order (1 through 8, then repeat)
- Automatic advancement to next track when current track ends
- Fade-out effect (1 second) when manually switching tracks
- Playback state persists across page navigation
- Music continues playing when switching between views

## 🔫 Button Audio Effects

### Sound Effects
Button clicks use: `single-gunshot-54-40780.mp3` located in `public/assets/audio/`

### Button Click Behavior
- [ ] **No Random gunshot sound** on each button click (configurable)
- [x] **Randomly vary pitch and duration** on each click ✅ **IMPLEMENTED**
- [x] **Interrupt functionality**: New gunshot stops any currently playing ✅ **IMPLEMENTED**

### Implementation Notes
- Pitch variation adds realism to button feedback
- Duration variation prevents monotonous sound
- Interrupt ensures rapid clicks don't stack sound effects

## 🎵 Audio System Initialization

### AudioManager Requirements
- [ ] **AudioManager must initialize successfully** - App must create working AudioManager instance
- [ ] **AudioManager must be created on startup**, as early as possible

### Initialization Checklist
- **Required audio files present**: All audio files must be loadable
  - 8 background music tracks
  - 1 gunshot sound effect
- **Graceful fallback**: If audio initialization fails, continue without audio (hide music button)
- **Error logging**: Clear console messages when audio fails vs succeeds
- **Validation**: AudioManager.initialize() must complete without throwing errors
- **Music button visibility**: Button only appears when AudioManager exists and is functional
- [x] **Button state synchronization**: Music play/mute button must reflect actual audio state after initialization ✅ **IMPLEMENTED**
- [x] **Reliable audio state detection**: AudioProvider.isPlaying() must accurately detect playing state even when currentTime is 0 ✅ **IMPLEMENTED**

### Initialization Flow
1. Create AudioManager instance early in app startup
2. Load all audio file URLs
3. Validate file accessibility
4. Initialize audio providers (background music, sound effects)
5. Set initial volume levels
6. Display audio controls if initialization succeeds
7. Hide audio controls if initialization fails (graceful degradation)

## 🔧 Audio Asset Requirements

### File Locations
- [ ] **All audio files must be accessible via HTTP** - Audio files must be properly served by dev server
- **File locations**: All audio files must exist in `public/assets/audio/` directory
- **URL construction**: Audio URLs must resolve correctly with Base URL (see [`../CLAUDE.md`](../CLAUDE.md#-asset-url-management))
- **Network loading**: Audio files must be loadable without CORS or 404 errors
- **File format support**: Browser must support MP3 format for all audio files
- **Audio file HTTP requests** must return audio content (not 404 or HTML error pages)

### Asset URL Pattern
```typescript
// Correct pattern using Base URL
const audioUrl = new URL('assets/audio/track.mp3', window.Base).toString();

// Works from all routes: /, /settings, /settings/log, etc.
```

### Testing Asset Loading
- Verify audio files load correctly from all routes
- Check browser console for 404 errors
- Test from nested routes like `/settings/log`
- Confirm audio file MIME type is `audio/mpeg` or `audio/mp3`

## 🎛️ Audio Control UI Requirements

### Positioning and Visibility
**REQUIRED**: Audio controls **MUST be visible** on all pages/routes
- **Position**: Fixed at bottom-right corner of viewport
- **z-index**: High enough to appear above all page content (9999+)
- **Persistence**: Must remain visible during route navigation
- **Functionality available on every view**: `/`, `/settings`, `/settings/log`, `/characters`, `/character/:id`, `/game`

### Western Frontier Theme
The audio control must match the "Hollow World" western ghost town theme:

#### Colors
- **Background**: Dark brown/wood texture (e.g., `#2C1810` with transparency)
- **Border**: Saddle brown (`#8B4513`) with 2-3px solid border
- **Text colors**:
  - Gold (`#D4AF37`) for headers
  - Wheat (`#F5DEB3`) for content
- **Buttons**: Western-style with brown/tan color scheme
- **Font**: Western/frontier-appropriate styling where possible

### Interaction Requirements
- **Clicking the control header** (title area) **MUST** toggle collapse/expand state
- **Collapsed state**: Shows compact play/pause indicator
- **Expanded state**: Shows full controls (track info, navigation, cycling)
- **Smooth transition** between states

### Required Controls
- **Play/Pause toggle button** (must reflect current playback state)
- **Next track button**
- **Previous track button**
- **Current track name display**
- **Track position indicator** (e.g., "Track 3 of 8")
- **Collapse/Expand toggle** (clickable header)

### Audio Control Features
- **Track Navigation**: Skip to next/previous track manually
- **Cycling Control**: Enable/disable automatic track cycling
- **Track Information**: Get current track name, index, and total tracks
- **Smooth Transitions**: Automatic fade-out when switching tracks
- **Enhanced Console Logging**: Detailed track information and cycling status

### Control Layout (Expanded State)
```
┌─────────────────────────────┐
│ 🎵 Music Control      [▼]  │ ← Header (clickable to collapse)
├─────────────────────────────┤
│ Now Playing:                │
│ western-adventure-loop      │
│                             │
│ Track 3 of 8                │
│                             │
│ [◀] [⏸] [▶]              │ ← Prev, Play/Pause, Next
│                             │
│ [🔁] Auto-cycle: On        │ ← Cycling toggle
└─────────────────────────────┘
```

### Control Layout (Collapsed State)
```
┌─────────────────────────────┐
│ 🎵 [⏸]              [▲]   │ ← Header with play state
└─────────────────────────────┘
```

## 🧪 Testing Audio System

### Test API Access
AudioManager is accessible via `window.__HOLLOW_WORLD_TEST__.audioManager` in dev/test environments (optional, may be undefined)

#### Available Test Methods
```typescript
// Check playback state
const isPlaying = audioManager?.isMusicPlaying();

// Get track information
const trackInfo = audioManager?.getCurrentTrackInfo();
// Returns: { name: string, index: number, total: number }

// Control playback
audioManager?.playBackgroundMusic();
audioManager?.pauseBackgroundMusic();
audioManager?.toggleBackgroundMusic();

// Track navigation
audioManager?.nextTrack();
audioManager?.previousTrack();

// Cycling control
audioManager?.enableCycling();
audioManager?.disableCycling();
```

### Testing Scenarios
1. **Initialization Testing**
   - Verify AudioManager initializes without errors
   - Check audio files are loaded successfully
   - Confirm graceful fallback if initialization fails

2. **Playback Testing**
   - Test play/pause functionality
   - Verify music continues across route navigation
   - Check track cycling (auto-advance to next track)
   - Test manual track navigation (next/previous)

3. **UI Testing**
   - Verify audio controls visible on all routes
   - Test collapse/expand functionality
   - Check button states match audio state
   - Verify western theme styling

4. **Asset Loading Testing**
   - Test audio file loading from all routes
   - Check for 404 errors in console
   - Verify Base URL construction works correctly

5. **Sound Effects Testing**
   - Test button click sound effects
   - Verify pitch/duration randomization
   - Check interrupt functionality (new click stops previous)

See [`testing.md`](testing.md) for complete testing patterns and [`../CLAUDE.md`](../CLAUDE.md#test-api-for-singleton-access) for test API usage examples.
