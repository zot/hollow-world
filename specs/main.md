# The Hollow World Game

**A P2P Western RPG Client**

*Based on [`../claude.md`](../claude.md)*

## 🎯 Core Principles
- Use **SOLID principles** in all implementations
- **🔒 Strict TypeScript typing** - All function parameters, return values, and object properties must use explicit TypeScript types. Never use `any` type except for truly dynamic content. Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes` *(Type your code tighter than a hangman's noose)*
- Create comprehensive **unit tests** for all components
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*
- Follow specifications for consistent western frontier theme

## 📋 Component Specifications

### UI Components
- 🏜️ [`ui.splash.md`](ui.splash.md) - Main splash screen with western styling
- 👤 [`ui.characters.md`](ui.characters.md) - Character management system
- 📊 [`character-sheet-plan.md`](character-sheet-plan.md) - Comprehensive character sheet design
- **Play/mute button** at lower right should appear in all views and retain state across views

### System Architecture
- 🌐 [`p2p.md`](p2p.md) - Peer-to-peer networking with LibP2P

## 📈 Current Implementation Plan
- 📝 [`main-plan.md`](main-plan.md) - Detailed implementation plan and progress tracking

> **Note**: Update the plan file as implementation progresses to maintain current status
