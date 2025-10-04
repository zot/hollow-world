# The Hollow World Game

**A P2P Western RPG Client**

*Based on [`../claude.md`](../claude.md)*

## 🎯 Core Principles
- Use **SOLID principles** in all implementations
- **🔒 Strict TypeScript typing** - All function parameters, return values, and object properties must use explicit TypeScript types. Never use `any` type except for truly dynamic content. Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes` *(Type your code tighter than a hangman's noose)*
- Create comprehensive **unit tests** for all components
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*
- Follow specifications for consistent western frontier theme

## 🏗️ Architecture
### UI Component Guidelines
- **UI components do not directly reference network providers** - UI components should interact with `HollowPeer` for all P2P functionality
- **HollowPeer manages network providers** - `HollowPeer` creates and owns its `LibP2PNetworkProvider` instance
- **main.ts coordinates** - `main.ts` initializes `HollowPeer` and passes it to UI components that need P2P functionality
- **UI components are "dumb"** - They display data and emit events; `main.ts` orchestrates the application logic

## 📋 Component Specifications
### Named Profiles (affects storage)
- each with a different storage prefix used by the app
  - all storage uses storage prefix
- selecting a profile
  - chooses which storage profile the app uses
  - applies only to the current tab (i.e. the selection is not persisted)
  - reconnects to libp2p using profile's peerID
- at startup
  - if storage exists but does not use profiles, remove it
  - if storage is empty (including if it was just removed), create the Default profile
- **Testing**: ProfileService is exposed via `window.__HOLLOW_WORLD_TEST__.profileService` in dev/test environments
  - Access profile-aware storage: `profileService.getItem(key)`
  - Get current profile: `profileService.getCurrentProfile()`
  - See [CLAUDE.md Testing section](../CLAUDE.md#test-api-for-singleton-access) for usage examples

### UI Components
- 🏜️ [`ui.splash.md`](ui.splash.md) - Main splash screen with western styling
- 👤 [`ui.characters.md`](ui.characters.md) - Character management system
- ⚙️ [`ui.settings.md`](ui.settings.md) - Settings view with log and peer management
- 📊 [`character-sheet-plan.md`](character-sheet-plan.md) - Comprehensive character sheet design
- **Play/mute button** at lower right should appear in all views and retain state across views

### System Architecture
- 🌐 [`p2p.md`](p2p.md) - Peer-to-peer networking with LibP2P
- 💬 [`p2p-messages.md`](p2p-messages.md) - P2P message protocols and formats
- 📦 [`dependencies.md`](dependencies.md) - NPM dependency management and overrides

### Game Rules Reference
- 📖 [`Hollow-summary.md`](Hollow-summary.md) - Complete RPG system rules and mechanics

## 📈 Current Implementation Plan
- 📝 [`main-plan.md`](main-plan.md) - Detailed implementation plan and progress tracking

## 🧪 Testing
- 🧪 [`main.tests.md`](main.tests.md) - Integration test requirements and specifications

> **Note**: Update the plan file as implementation progresses to maintain current status
