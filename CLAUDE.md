# Hollow World project

# written in typescript

## 🎯 Core Principles
- Use **SOLID principles** in all implementations
- **🔒 Strict TypeScript typing** - All function parameters, return values, and object properties must use explicit TypeScript types. Never use `any` type except for truly dynamic content. Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes` *(Type your code tighter than a hangman's noose)*
- Create comprehensive **unit tests** for all components
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*
- Follow specifications for consistent western frontier theme
- html templates are in public/templates

## UI principles
- audio control should appear on all pages

### 🚀 App Initialization
- [x] `let Base = new URL(location.toString())` ✅ **IMPLEMENTED**

### 🌐 Asset URL Management
- [x] **Pervasively**: use Base as parent URL for all assets, including templates ✅ **IMPLEMENTED**
- [x] Use `new URL(asset, Base).toString()` for the asset URL ✅ **IMPLEMENTED**

### 🔫 Button Audio Effects
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
- [ ] AudioManager must be created on startup, as early as possible

### 🔧 Audio Asset Requirements
- [ ] **All audio files must be accessible via HTTP** - Audio files must be properly served by dev server
  - **File locations**: All audio files must exist in `src/assets/audio/` directory
  - **URL construction**: Audio URLs must resolve correctly with Base URL
  - **Network loading**: Audio files must be loadable without CORS or 404 errors
  - **File format support**: Browser must support MP3 format for all audio files
  - audio file HTTP requests must return audio content

### 🎵 Background Audio
- [x] **Mysterious western ghosttown music** plays continuously ✅ **IMPLEMENTED** (8-track cycling system)

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
- the audio control UI component should give the user access to the new audio features
