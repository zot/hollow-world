# 🌐 P2P Networking Specification

**Peer-to-peer API for the Hollow World game**

*Based on [`../claude.md`](../claude.md)*

## 🎯 Core Requirements
- Use **SOLID principles** in all implementations
- Create comprehensive **unit tests** for all components
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*

## 🔧 Technology Stack
- **LibP2P** - Decentralized networking protocol
- **Helia** - IPFS implementation for data storage

### 💾 Persistent Session Tracking
- **Loaded on session start**, saved when edited

### 🔑 Data Fields
- **`privateKey`**: Stores the LibP2P peer ID's private key
- **`friends`**: Map of friend names → their peer IDs

### 🔄 Session Restoration
- **Startup process**: Reload HollowPeer object and restore peer ID from persisted private key
- **LibP2P initialization**: Use `createLibp2p` with `libp2pInit` object
- **Private key supply**: Include persisted private key as `privateKey` property

## 🔧 API Methods

### Core Network Functions
- **`getPeerId()`**: Returns persistent peer ID
- **`addFriend(name, friendPeerId)`**: Adds friend's name and peer ID to persistent storage

### Implementation Details
- **Network provider interface**: [`src/p2p.ts`](../src/p2p.ts)
- **Storage integration**: Uses LocalStorageProvider for persistence
- **Error handling**: Graceful degradation when network fails
