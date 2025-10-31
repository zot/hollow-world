# The Hollow World Game

**A P2P Western RPG Client**

*See [`../CLAUDE.md`](../CLAUDE.md) for comprehensive development guidelines*

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

### Core Systems
- 👥 [`friends.md`](friends.md) - Friends system and P2P relationships
- 👤 [`characters.md`](characters.md) - Character creation, storage, and lifecycle
- 🗄️ [`storage.md`](storage.md) - MudStorage and LocalStorage patterns

### UI Components
- 🏜️ [`ui.splash.md`](ui.splash.md) - Main splash screen with western styling
- 👤 [`ui.characters.md`](ui.characters.md) - Character management system
- ⚙️ [`ui.settings.md`](ui.settings.md) - Settings view with log and peer management
- 📊 [`character-sheet-plan.md`](character-sheet-plan.md) - Comprehensive character sheet design

### System Architecture
- 🌐 [`p2p.md`](p2p.md) - Peer-to-peer networking with LibP2P
- 💬 [`p2p-messages.md`](p2p-messages.md) - P2P message protocols and formats
- 📦 [`dependencies.md`](dependencies.md) - NPM dependency management and overrides
- 🎮 [`integrate-textcraft.md`](integrate-textcraft.md) - TextCraft MUD integration

### Game Rules Reference
- 📖 [`Hollow-summary.md`](Hollow-summary.md) - Complete RPG system rules and mechanics

## 📈 Current Implementation Plan
- 📝 [`main-plan.md`](main-plan.md) - Detailed implementation plan and progress tracking

## 🎵 Audio System
**See [`audio.md`](audio.md) for comprehensive audio system specifications**

## 🤝 Friends & Characters Integration
**See [`friends.md`](friends.md) and [`characters.md`](characters.md) for detailed specifications**

Key integration points:
- Friends track shared worlds and characters across worlds
- Characters can exist independently and be used in multiple worlds
- TextCraft worlds store character instances with integrity hashing
- Automatic sync between master character and world instances

## 🧪 Testing
- 🧪 [`testing.md`](testing.md) - Comprehensive testing specifications and patterns
- 🧪 [`main.tests.md`](main.tests.md) - Integration test requirements and specifications

> **Note**: Update the plan file as implementation progresses to maintain current status
