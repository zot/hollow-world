# Splash Screen Testing Requirements

*Testing specifications for [`ui.splash.md`](ui.splash.md)*

## Routing Tests

### Root Route: `/`
- [ ] **Direct navigation**: Navigate directly to `/` URL
  - Verify splash screen renders correctly
  - Verify all buttons visible (Join Game, Start Game, Characters, Settings)
  - Verify western theme styling applied
- [ ] **Page refresh**: Refresh browser on `/`
  - Verify splash screen remains
  - Verify no asset loading errors (404s)
  - Verify audio system initializes
- [ ] **Browser back from other views**: Navigate to another view, then back
  - Verify splash screen renders
  - Verify browser back button works correctly

## Audio System Tests

### AudioManager Initialization
- [ ] **Audio system initializes on app startup**
  - Verify AudioManager created as early as possible (in main.ts)
  - Verify console logs successful initialization
  - Verify all 8 music tracks + gunshot sound loadable
- [ ] **Graceful fallback on audio failure**
  - If audio initialization fails, app continues
  - Music button hidden when AudioManager unavailable
  - Clear console error messages when audio fails

### Music Button State Synchronization
- [ ] **Button reflects actual audio state**
  - After initialization, verify button shows correct state
  - If music playing, button shows "playing" state
  - If music paused, button shows "paused" state
- [ ] **Button state after auto-play**
  - Background music starts automatically
  - Wait 100ms for state to settle
  - Verify `splashScreen.refreshMusicButtonState()` called
  - Verify button state matches `audioManager.isMusicPlaying()`
- [ ] **Reliable audio state detection**
  - `AudioProvider.isPlaying()` accurate even when `currentTime === 0`
  - State detection works for all 8 music tracks

### Music Button Interactions
- [ ] **Toggle music play/pause**
  - Click music button
  - Verify music pauses/resumes
  - Verify button state updates
- [ ] **Music cycling**
  - Verify background music cycles through all 8 tracks
  - Verify smooth 1-second fade-out on track transitions
  - Verify `audioManager.isCyclingEnabled()` returns true
- [ ] **Track information display**
  - Verify console shows current track info
  - Format: "Now playing track N/8: [track-name]"
  - Verify "Music cycling: ON" message

### Button Audio Effects
- [ ] **Gunshot sound on button click**
  - Click any button (Join Game, Start Game, Characters, Settings)
  - Verify `single-gunshot-54-40780.mp3` plays
  - Verify pitch and duration vary randomly
- [ ] **Gunshot interrupt functionality**
  - Click button while gunshot playing
  - Verify previous gunshot stops
  - Verify new gunshot starts

## Navigation Tests

### Button Navigation
- [ ] **Join Game button** (placeholder)
  - Click Join Game
  - Verify console logs "Join Game clicked"
  - (TODO: Implement actual functionality)
- [ ] **Start Game button** (placeholder)
  - Click Start Game
  - Verify console logs "Start Game clicked"
  - (TODO: Implement actual functionality)
- [ ] **Characters button**
  - Click Characters
  - Verify navigates to `/characters`
  - Verify URL updates in browser
  - Verify browser back returns to `/`
- [ ] **Settings button**
  - Click Settings
  - Verify navigates to `/settings`
  - Verify URL updates in browser
  - Verify browser back returns to `/`

## Asset Loading Tests

### Audio Assets
- [ ] **All 8 music tracks accessible**
  - `western-adventure-cinematic-spaghetti-loop-385618.mp3`
  - `cinematic-spaghetti-western-music-tales-from-the-west-207360.mp3`
  - `picker_s-grove-folk.mp3`
  - `picker_s-grove-shanty.mp3`
  - `picker_s-grove-western.mp3`
  - `picker_s-grove-western-ballad.mp3`
  - `mining-incident-waltz-hoedown.mp3`
  - `mining-incident-waltz-polka.mp3`
- [ ] **Gunshot sound effect accessible**
  - `single-gunshot-54-40780.mp3`
- [ ] **Audio URLs resolve correctly**
  - All audio files load from `http://localhost:3000/assets/audio/...`
  - No CORS or 404 errors in console
  - Browser supports MP3 format

### Templates
- [ ] **Splash screen template loads**
  - Verify `splash-screen.html` template loads
  - Verify no 404 errors for template file
  - Verify template renders with correct structure

## Music Persistence Tests
- [ ] **Music continues across view navigation**
  - Start music on splash screen
  - Navigate to characters view
  - Verify music continues playing
  - Navigate back to splash
  - Verify music still playing
- [ ] **Music state persists**
  - Pause music on splash
  - Navigate to settings
  - Navigate back to splash
  - Verify music still paused
