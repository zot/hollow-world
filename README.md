# 🏜️ Hollow World

**[https://github.com/zot/hollow-world](https://github.com/zot/hollow-world)**

A P2P web-based RPG client for the Hollow frontier game system.

## 🌵 Overview

Welcome to Hollow World - a single-page web application that brings the mysterious frontier of the Hollow RPG system to life. Create characters, manage your outlaw personas, and connect with other players in this peer-to-peer western adventure.

## 📐 CRC-Driven Development

This project uses **CRC (Class-Responsibility-Collaboration) modeling** for design and development. The CRC infrastructure and tooling developed here has been extracted into a standalone project: **[claude-crc](https://github.com/zot/claude-crc)** - a reusable framework for CRC-driven development with Claude Code.

## ✅ Current Implementation Status

### **Real P2P Network Integration**
- **Real Peer ID**: Display actual libp2p peer ID instead of mock
- **Persistent Network**: Peer ID persists across sessions using stored private key
- **Selectable Peer ID**: Click to select full peer ID text

### **Comprehensive Character System**
- **Full Hollow RPG Integration**: Uses complete `ICharacter` interface with all 8 attributes
- **Proper Character Storage**: UUID-based persistence with comprehensive character data
- **Character Manager**: List view with character stats, attributes, and skull/crossbones delete buttons
- **Character Editor**: Full editor with character preview and Yep/Nope buttons

### **Advanced Routing & History**
- **URL-Based Navigation**: Each view has its own path (`/`, `/characters`, `/character/[id]`)
- **Browser History Support**: Back/forward buttons work correctly across all views
- **History Management**: Proper state management for character editing sessions

### **Western-Themed UI**
- **Consistent Styling**: Sancreek fonts, medium-light brown text (#8B7355)
- **Old-Timey Design**: Dime novel aesthetic across all components
- **Responsive Layout**: Works on desktop and mobile devices

### **Audio System**
- **Gunshot Sounds**: Random pitch/duration variations with interruption
- **Background Music**: Western ghosttown music loops automatically
- **Audio Feedback**: All buttons provide gunshot sound feedback

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to start your frontier adventure.

## 📋 Specifications

The application follows comprehensive specifications located in:

- [`specs/main.md`](specs/main.md) - Overall application architecture
- [`specs/ui.splash.md`](specs/ui.splash.md) - Splash screen requirements
- [`specs/ui.characters.md`](specs/ui.characters.md) - Character management system
- [`specs/p2p.md`](specs/p2p.md) - Peer-to-peer networking requirements
- [`specs/character-sheet-plan.md`](specs/character-sheet-plan.md) - Character sheet component design
- [`specs/main-plan.md`](specs/main-plan.md) - Detailed implementation plan and progress

## 🎯 Features

- **Don't Go Hollow**: Atmospheric splash screen with green glowing title
- **Character Creation**: Create and manage frontier outlaws with full RPG stats
- **P2P Networking**: Connect with other players using persistent peer IDs
- **Browser Navigation**: Full back/forward button support with URL routing
- **Western Audio**: Immersive gunshot effects and mysterious frontier music
- **Responsive Design**: Works seamlessly on all devices

## 🛠 Technical Architecture

Built with:
- **TypeScript** - Type-safe development following SOLID principles
- **Vite** - Fast development and build tooling
- **LibP2P** - Decentralized peer-to-peer networking
- **Vitest** - Comprehensive unit testing
- **Web Audio API** - Rich audio effects and background music

## 🧪 Testing

```bash
npm test         # Run unit tests
npm run test:ui  # Run tests with UI
```

---

## 📜 Historical Note

The CRC (Class-Responsibility-Collaboration) methodology and tooling used in this project was originally developed as part of HollowWorld's design process. As the CRC infrastructure matured, it was extracted into the standalone **[claude-crc](https://github.com/zot/claude-crc)** project to make it reusable for other Claude Code projects. The CRC system provides a three-tier documentation approach (Level 1 specs → Level 2 design models → Level 3 implementation) with comprehensive traceability and gap analysis tools.

---

*Don't go hollow out there, partner. The frontier's got secrets that'll chill your bones.* 🌵💀
