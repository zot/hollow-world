# 🏜️ Splash Screen Specification

**The initial screen for the Hollow World game**

*Based on [`../claude.md`](../claude.md)*

## 🎯 Core Requirements
- [x] Use **SOLID principles** in all implementations ✅ **IMPLEMENTED**
- [x] Create comprehensive **unit tests** for all components ✅ **IMPLEMENTED**
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*

### 🎨 Theme & Typography
- [x] **Old-timey western look** with Sancreek font, like a dime novel ✅ **IMPLEMENTED**
- [x] **Non-selectable elements** unless specifically noted ✅ **IMPLEMENTED**
- [x] **"Don't Go Hollow" title** in large old-west style font ✅ **IMPLEMENTED**
  - [x] The word **"Hollow"** should have a **green glow** while still using Sancreek font ✅ **IMPLEMENTED**
- [x] **Text color**: Medium-light brown throughout ✅ **IMPLEMENTED**
- [x] **Min splash screen height** on desktop should be 100vh ✅ **IMPLEMENTED**

### 🏷️ Version Display
- [x] Keep the current version number in a VERSION file at the top of the project ✅ **IMPLEMENTED** (currently v0.0.13)
- [x] ~~The current version starts at 0.0.1~~ ✅ **COMPLETED** (now at v0.0.13)
- [x] Display the version number at the bottom of the splash screen ✅ **IMPLEMENTED**
- [x] Print the current version number to the console ✅ **IMPLEMENTED**

### 🚀 App Initialization
- [x] `let Base = new URL(location.toString())` ✅ **IMPLEMENTED**

### 🌐 Asset URL Management
- [x] **Pervasively**: use Base as parent URL for all assets, including templates ✅ **IMPLEMENTED**
- [x] Use `new URL(asset, Base).toString()` for the asset URL ✅ **IMPLEMENTED**

### 📡 Peer ID Display
- [x] **Display the peer ID** prominently ✅ **IMPLEMENTED**
- [x] **User-selectable** text (click to select all) ✅ **IMPLEMENTED**

### 🔘 Interactive Buttons
- [x] **Join Game** - Connect to existing game session ✅ **IMPLEMENTED** (placeholder)
- [x] **Start Game** - Begin new game session ✅ **IMPLEMENTED** (placeholder)
- [x] **Characters** - Navigate to character manager view ✅ **IMPLEMENTED**
- [x] **Credits** - Display pop up with a nice Western thankyou and license info about assets taken from README.md ✅ **IMPLEMENTED**
  - [x] Credits get their own line so people see 'em ✅ **IMPLEMENTED**
  - [x] Make audio file titles into links with the URL to the project ✅ **IMPLEMENTED**

#### 🔫 Button Audio Effects
- [x] **Random gunshot sound** on each button click ✅ **IMPLEMENTED**
- [x] Use [`single-gunshot-54-40780.mp3`](../src/assets/audio/single-gunshot-54-40780.mp3) ✅ **IMPLEMENTED**
- [x] **Randomly vary** pitch and duration on each click ✅ **IMPLEMENTED**
- [x] **Interrupt functionality**: New gunshot stops any currently playing ✅ **IMPLEMENTED**

### 🎵 Audio System Initialization
- [ ] **AudioManager must initialize successfully** - App must create working AudioManager instance
  - **Required audio files present**: All 8 music tracks + gunshot sound effect must be loadable
  - **Graceful fallback**: If audio initialization fails, continue without audio (hide music button)
  - **Error logging**: Clear console messages when audio fails vs succeeds
  - **Validation**: AudioManager.initialize() must complete without throwing errors
  - **Music button visibility**: Button only appears when AudioManager exists and is functional
  - **Button state synchronization**: Music play/mute button must reflect actual audio state after initialization ✅ **IMPLEMENTED**
  - **Reliable audio state detection**: AudioProvider.isPlaying() must accurately detect playing state even when currentTime is 0 ✅ **IMPLEMENTED**

### 🔧 Audio Asset Requirements
- [ ] **All audio files must be accessible via HTTP** - Audio files must be properly served by dev server
  - **File locations**: All audio files must exist in `src/assets/audio/` directory
  - **URL construction**: Audio URLs must resolve correctly with Base URL
  - **Network loading**: Audio files must be loadable without CORS or 404 errors
  - **File format support**: Browser must support MP3 format for all audio files

### 🎵 Background Audio
- [x] **Mysterious western ghosttown music** plays continuously ✅ **IMPLEMENTED** (8-track cycling system)

## 🧭 History Management

### URL-Based Navigation
- [x] **Single-page app location** represented by browser URL ✅ **IMPLEMENTED**
- [x] **Each view** gets its own URL path ✅ **IMPLEMENTED**

### Browser History Integration
- [x] **History array of objects** for browser back/forward navigation ✅ **IMPLEMENTED**
- [x] **Forward/back buttons** enabled only when history objects are available ✅ **IMPLEMENTED**
- [x] **Self-rendering objects**: Each history object knows what view to display ✅ **IMPLEMENTED**

### Navigation Behavior
- [x] **Going back**: User can navigate backward through history ✅ **IMPLEMENTED**
  - [x] **Forward navigation**: Can advance through existing history ✅ **IMPLEMENTED**
  - [x] **New navigation**: Can navigate to different object ✅ **IMPLEMENTED**
    - [x] **Future deletion**: Removes "future" history objects ✅ **IMPLEMENTED**
    - [x] **New object**: Pushes new object to history array ✅ **IMPLEMENTED**

### 🎵 Enhanced Background Music System
- [x] **Implement music cycling system** ✅ **IMPLEMENTED** - Now rotates through all 8 available music tracks
  - **Music files** (8 total, all in cycling rotation):
    1. `western-adventure-cinematic-spaghetti-loop-385618.mp3` ✅ **In rotation**
    2. `cinematic-spaghetti-western-music-tales-from-the-west-207360.mp3` ✅ **In rotation**
    3. `picker_s-grove-folk.mp3` ✅ **In rotation**
    4. `picker_s-grove-shanty.mp3` ✅ **In rotation**
    5. `picker_s-grove-western.mp3` ✅ **In rotation**
    6. `picker_s-grove-western-ballad.mp3` ✅ **In rotation**
    7. `mining-incident-waltz-hoedown.mp3` ✅ **In rotation**
    8. `mining-incident-waltz-polka.mp3` ✅ **In rotation**

- [x] **Enhancement tasks** ✅ **ALL COMPLETED**:
  - [x] Modify AudioManager to support multiple background tracks ✅ **IMPLEMENTED**
  - [x] Implement random or sequential cycling through music files ✅ **IMPLEMENTED** (sequential with auto-advance)
  - [x] Add smooth transitions between tracks ✅ **IMPLEMENTED** (1-second fade out)
  - [x] Ensure cycling works with play/pause/toggle functionality ✅ **IMPLEMENTED**
  - [x] Set appropriate low volume for background ambiance ✅ **IMPLEMENTED** (0.3 volume)
  - [x] Test music persistence across view navigation ✅ **IMPLEMENTED**

### 🎛️ **New Audio Features Available**
- **Track Navigation**: Skip to next/previous track manually
- **Cycling Control**: Enable/disable automatic track cycling
- **Track Information**: Get current track name, index, and total tracks
- **Smooth Transitions**: Automatic fade-out when switching tracks
- **Enhanced Console Logging**: Detailed track information and cycling status
