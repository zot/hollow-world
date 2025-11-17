# CRC Card: P2PWebAppNetworkProvider

**Source Spec:** p2p.md
**Existing Code:** src/p2p/P2PWebAppNetworkProvider.ts

## Class Responsibilities

### Knows About (Data)
- `client: P2PWebAppClient` - p2p-webapp TypeScript client
- `protocol: string` - Custom libp2p protocol (default: `/hollow-world/1.0.0`)
- `topic: string` - Pubsub topic for discovery (default: `hollow-world`)
- `messageHandler?: callback` - Callback for incoming messages
- `peerConnectHandler?: callback` - Callback for peer join events
- `peerDisconnectHandler?: callback` - Callback for peer leave events
- `connectedPeers: Set<string>` - Set of currently connected peer IDs
- `peerKey?: string` - Persistent peer key for session continuity
- `peerID?: string` - This peer's libp2p ID
- `profileService?: IProfileService` - Profile-aware storage

### Does (Behavior)

**Initialization:**
- `initialize()` - Connect to p2p-webapp WebSocket, start protocol, subscribe to topic
- `loadPeerKey()` - Load peer key from storage (profile-aware)
- `storePeerKey(key)` - Store peer key in storage (profile-aware)
- `loadSettings()` - Load protocol and topic from settings

**Message Operations:**
- `sendMessage(peerId, message, onAck)` - Send P2P message to peer with optional ack callback
- `onMessage(handler)` - Register message handler
- `handleMessage(peer, data)` - Route incoming message to application handler

**Peer Discovery:**
- `handlePeerJoined(peerId)` - Add peer to connected set, notify handler
- `handlePeerLeft(peerId)` - Remove peer from connected set, notify handler
- `onPeerConnect(handler)` - Register peer join handler
- `onPeerDisconnect(handler)` - Register peer leave handler

**Accessors:**
- `getPeerId()` - Get own peer ID
- `getConnectedPeers()` - Get array of connected peer IDs

**Cleanup:**
- `destroy()` - Unsubscribe, stop protocol, close WebSocket, clear peers

## Collaborators

**Uses:**
- **P2PWebAppClient** (src/p2p/client/client.js) - p2p-webapp JavaScript client
- **IProfileService** (src/services/ProfileService.ts) - Optional profile-aware storage

**Used By:**
- **HollowPeer** (src/p2p/HollowPeer.ts) - Uses P2PWebAppNetworkProvider as INetworkProvider

**Implements:**
- **INetworkProvider** (src/p2p/types.ts) - Network provider interface

## Design Patterns

**Adapter Pattern**: Adapts p2p-webapp client API to INetworkProvider interface
**Dependency Inversion**: Implements INetworkProvider interface
**Strategy Pattern**: Allows swapping network implementations (e.g., for testing with MockNetworkProvider)
**Single Responsibility**: Only handles network communication, no business logic

## Key Design Decisions

1. **Auto-Detection**: WebSocket URL auto-detected from window.location.host
2. **Session Persistence**: Peer key stored in LocalStorage for consistent peer ID across sessions
3. **Profile-Aware Storage**: Uses ProfileService if provided for multi-profile support
4. **Integrated Subscription**: subscribe() includes optional peer change monitoring callback
5. **Protocol + Topic**: Configurable via Settings view (default: `/hollow-world/1.0.0` and `hollow-world`)
6. **Connected Peers Set**: Tracks peers via pubsub topic join/leave events
7. **Single connect() Call**: WebSocket connection + peer initialization in one API call
8. **Ack Support**: sendMessage accepts optional onAck callback for reliable delivery

## Connection Flow

```
1. initialize() called
2. loadPeerKey() from storage
3. client.connect(peerKey) - WebSocket + peer init
4. client.start(protocol, messageHandler) - Listen for P2P messages
5. client.subscribe(topic, topicHandler, peerChangeHandler) - Discovery + monitoring
6. client.listPeers(topic) - Get initial peer list
7. connectedPeers populated
```

## Testing

**Test File:** test/HollowIPeer.test.ts (uses MockNetworkProvider, tests interface)

**Key Test Scenarios:**
- Initialize connection
- Send/receive messages
- Peer join/leave events
- Ack callback invocation
- Multiple peer connections
- WebSocket reconnection
- Protocol/topic configuration
