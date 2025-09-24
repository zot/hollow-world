# 🏜️ Splash Screen Specification

**The initial screen for the Hollow World game**

*Based on [`../claude.md`](../claude.md)*

## 🎯 Core Requirements
- [x] Use **SOLID principles** in all implementations ✅ **IMPLEMENTED**
- **🔒 Strict TypeScript typing** - All function parameters, return values, and object properties must use explicit TypeScript types. Never use `any` type except for truly dynamic content. Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes` *(Type your code tighter than a hangman's noose)*
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

