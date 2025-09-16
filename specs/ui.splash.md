# 🏜️ Splash Screen Specification

**The initial screen for the Hollow World game**

*Based on [`../claude.md`](../claude.md)*

## 🎯 Core Requirements
- Use **SOLID principles** in all implementations
- Create comprehensive **unit tests** for all components

### 🎨 Theme & Typography
- **Old-timey western look** with Sancreek font, like a dime novel
- **Non-selectable elements** unless specifically noted
- **"Don't Go Hollow" title** in large old-west style font
  - The word **"Hollow"** should have a **green glow** while still using Sancreek font
- **Text color**: Medium-light brown throughout

### 📡 Peer ID Display
- **Display the peer ID** prominently
- **User-selectable** text (click to select all)

### 🔘 Interactive Buttons
- **Join Game** - Connect to existing game session
- **Start Game** - Begin new game session
- **Characters** - Navigate to character manager view

#### 🔫 Button Audio Effects
- **Random gunshot sound** on each button click
- Use [`single-gunshot-54-40780.mp3`](../src/assets/audio/single-gunshot-54-40780.mp3)
- **Randomly vary** pitch and duration on each click
- **Interrupt functionality**: New gunshot stops any currently playing

### 🎵 Background Audio
- **Mysterious western ghosttown music** plays continuously

## 🧭 History Management

### URL-Based Navigation
- **Single-page app location** represented by browser URL
- **Each view** gets its own URL path

### Browser History Integration
- **History array of objects** for browser back/forward navigation
- **Forward/back buttons** enabled only when history objects are available
- **Self-rendering objects**: Each history object knows what view to display

### Navigation Behavior
- **Going back**: User can navigate backward through history
  - **Forward navigation**: Can advance through existing history
  - **New navigation**: Can navigate to different object
    - **Future deletion**: Removes "future" history objects
    - **New object**: Pushes new object to history array
