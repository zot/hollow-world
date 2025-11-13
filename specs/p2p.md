# 🌐 P2P Networking Specification

**Peer-to-peer networking for Hollow World using p2p-webapp**

*See also: [`p2p-messages.md`](p2p-messages.md), [`friends.md`](friends.md)*

---

## 📋 Overview

Hollow World uses **p2p-webapp** for P2P networking, providing browser-based peer-to-peer connectivity through a local WebSocket server.

**Key Architecture**:
- **One p2p-webapp server** provides P2P for multiple browser clients
- Each browser tab/window gets a **unique peer identity**
- WebSocket connection from browser to local server
- Server handles P2P routing using libp2p
- No custom relay servers needed

## 🔧 Technology Stack

### p2p-webapp Server
- **Language**: Go
- **Role**: Local WebSocket server providing libp2p P2P capabilities to browsers
- **Location**: `bin/p2p-webapp` (downloaded binary)
- **Repository**: https://github.com/zot/p2p-webapp

### Browser Client
- **Library**: TypeScript client extracted using CLI (`bin/p2p-webapp cp client.js client.d.ts types.d.ts src/p2p/client/`)
- **Location**: `src/p2p/client/` (client.js, client.d.ts, types.d.ts)
- **Protocol**: WebSocket
- **Connection**: `ws://localhost:<port>` (random port by default)
- **API**: Async JavaScript functions wrapping WebSocket communication

### Network Provider Interface
- **Interface**: `INetworkProvider` (src/p2p/types.ts)
- **Implementation**: `P2PWebAppNetworkProvider` (src/p2p/P2PWebAppNetworkProvider.ts)
- **Abstraction**: Allows swapping P2P implementations without changing app code

## 🏗️ Architecture

### Multi-Peer Architecture

<!-- BEGIN DIAGRAM: p2p-architecture -->
<!-- Generated from .claude/diagrams/sources/p2p-architecture.d2 -->
<!-- Regenerate with: ./.claude/scripts/diagrams-generate.sh -->
```
┌────────────────────────┐
│Tab 1: Peer 12D3Koo...A │──┐    ┌───────────────────────────┐
│                        │  │    │    p2p-webapp Server     │
└────────────────────────┘  │    │       ┌────────────┐      │
                            └───────────▶│            │      │
                                 │       │            │      │
┌────────────────────────┐──────────────▶│libp2p peer │      │
│Tab 2: Peer 12D3Koo...B │       │       │            │      │
│                        │  ┌───────────▶│            │      │
└────────────────────────┘  │    │       │            │      │
                            │    │       └────────────┘      │
┌────────────────────────┐──┘    │                           │
│Tab 3: Peer 12D3Koo...C │       └───────────────────────────┘
│                        │
└────────────────────────┘
```
<!-- END DIAGRAM: p2p-architecture -->

**Key Points**:
- One server handles multiple browser clients
- Each browser connection creates a unique peer identity
- Server routes P2P messages between all connected peers
- Example: 5 browser tabs = 5 peer IDs, 1 server

### Connection Flow

1. **Server Startup**
   ```bash
   cd hollow-world-p2p
   ../bin/p2p-webapp --dir . -v
   ```
   - Server starts on random port (e.g., `http://localhost:36157`)
   - libp2p peer created with unique ID
   - WebSocket server listens for browser connections

2. **Browser Connection**
   ```typescript
   import { P2PWebAppClient } from './client/client.js';
   const client = new P2PWebAppClient();
   // Connect to WebSocket and initialize peer in one call
   const [peerId, peerKey] = await client.connect(storedPeerKey);
   ```
   - Browser connects via WebSocket (auto-detects URL from window.location)
   - Server creates unique peer identity for this connection
   - Returns `[peerId, peerKey]` tuple - store `peerKey` for session persistence

3. **Pubsub Discovery**
   ```typescript
   // Subscribe to hollow-world topic for peer discovery
   await client.pubsub.subscribe('hollow-world', (senderId, message) => {
       console.log(`Discovery message from ${senderId}`);
   });
   ```
   - **Topic**: `hollow-world` - Used for peer discovery and announcements
   - **Purpose**: Allows peers to discover each other on the network
   - **Automatic**: Subscription happens during initialization

4. **P2P Messaging**
   ```typescript
   // Send message to another peer
   await client.send_p2p_message(targetPeerId, messageData);

   // Receive messages
   client.on_p2p_message((senderId, messageData) => {
       console.log(`Message from ${senderId}:`, messageData);
   });
   ```
   - **Protocol**: `/hollow-world/1.0.0` - Custom libp2p protocol for direct peer-to-peer messages (configurable in Settings)
   - **Topic**: `hollow-world` - Pubsub topic for peer discovery (configurable in Settings)
   - **Discovery vs Messaging**: Pubsub topic for discovery, custom protocol for direct messages
   - **Configuration**: Both protocol and topic can be changed in Settings view (requires app restart)

## 🔌 API Reference

### P2PWebAppNetworkProvider

Implementation of `INetworkProvider` interface that wraps p2p-webapp-client.

**Key Methods**:

```typescript
interface INetworkProvider {
    // Initialize connection to p2p-webapp server
    initialize(): Promise<void>;

    // Get this peer's ID
    getPeerId(): string;

    // Get list of connected peer IDs
    getConnectedPeers(): string[];

    // Register handler for incoming messages
    onMessage(handler: (peerId: string, message: P2PMessage) => void): void;

    // Register handler for peer connections
    onPeerConnect(handler: (peerId: string) => void): void;

    // Send message to specific peer
    sendMessage(peerId: string, message: P2PMessage): Promise<void>;

    // Cleanup resources
    destroy(): Promise<void>;
}
```

### P2PMessage Format

```typescript
interface P2PMessage {
    method: string;      // Message type (e.g., 'friend-request', 'mud')
    payload: any;        // Method-specific data
}
```

See [`p2p-messages.md`](p2p-messages.md) for complete message protocol specification.

## 🧪 Testing

### Unit Tests
- **File**: `test/HollowIPeer.test.ts`
- **Mocking**: Uses `MockNetworkProvider` implementing `INetworkProvider`
- **Coverage**: Message handling, connection management, hosting/joining sessions
- **Run**: `npm run test:unit`

### Integration Tests
- **Framework**: Playwright
- **File**: `test/e2e/p2p.test.ts`
- **Multi-peer testing**: Multiple browser contexts connecting to same server
- **Run**: `npm run test:e2e`

**Example multi-peer test**:
```typescript
test('multi-peer communication', async ({ browser }) => {
    // Start p2p-webapp server
    const server = exec('cd hollow-world-p2p && ../bin/p2p-webapp --dir . --noopen -v');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Create two browser contexts (two peers)
    const peer1 = await browser.newContext();
    const peer2 = await browser.newContext();

    const page1 = await peer1.newPage();
    const page2 = await peer2.newPage();

    // Both connect to same server URL
    await page1.goto('http://localhost:36157');
    await page2.goto('http://localhost:36157');

    // Each page now has unique peer identity
    // Test P2P messaging between peers
    // ...
});
```

## 🚀 Development Workflow

### Starting Development Server
```bash
npm run dev
```

This runs `dev.sh` which:
1. Builds the application (`./build.sh`)
2. Starts esbuild watch mode (rebuilds on file changes)
3. Starts p2p-webapp server in `hollow-world-p2p/`
4. Opens browser to server URL

### Manual Server Control
```bash
# Start server
cd hollow-world-p2p
../bin/p2p-webapp --dir . -v

# Start without auto-opening browser
../bin/p2p-webapp --dir . -v --noopen

# Server prints URL when ready
# Output: Server running at http://localhost:36157
```

### Building for Production
```bash
npm run build
```

Creates production bundle in `hollow-world-p2p/html/`.

**Build Process**:
1. Extract p2p-webapp client library from binary (`client.js`, `client.d.ts`, `types.d.ts`)
2. Bundle TypeScript with esbuild
3. Copy assets and templates
4. Generate index.html

The build script automatically extracts the latest client library files from the p2p-webapp binary before compilation. This ensures the client library version matches the binary version.

## 📦 Dependencies

**Runtime Dependencies**: None (uses WebSocket, native browser APIs)

**Client Library**:
- Client library files (`client.js`, `client.d.ts`, `types.d.ts`) are embedded in the p2p-webapp binary
- Extracted to `src/p2p/client/` before each build using `p2p-webapp cp`
- Version automatically matches the binary version

**Binary Dependency**:
- `bin/p2p-webapp` - Go binary downloaded during setup
- Platform-specific (Linux, macOS, Windows)
- Contains embedded TypeScript client library

**Version Management**:
- p2p-webapp version documented in `specs/dependencies.md`
- Binary downloaded via setup script
- Client library version tied to binary version (no separate versioning)

## 🚫 Banned Peers

**Purpose**: Allow users to permanently block unwanted peer connections and friend requests.

### Ban List Storage
- **Key**: `hollow-banned-peers` (per profile, LocalStorage)
- **Structure**: Array of banned peer objects with `peerId`, `playerName`, `bannedAt`
- **Persistence**: Survives across sessions

### Banned Peer Behavior
1. **Friend requests from banned peers**:
   - Silently ignored (no event created)
   - No response sent to banned peer
   - Banned peer has no indication they've been banned

2. **Banning a peer**:
   - From friend request event: Adds peer to ban list, removes event
   - From Friends view: Shows confirmation, removes friend, adds to ban list
   - Ban persists across sessions

3. **Implementation**:
   - Check ban list before creating friend request events
   - Ban list checked in `handleRequestFriend()` method
   - Banned peers can't create events or send messages

4. **Silent protection**: Banned peers receive no notification of being banned, preventing confrontation

## 🌐 Peer Reachability

**IMPORTANT**: In P2P networks, peers being unreachable is **normal behavior**, not an error condition.

### Normal Unreachability Scenarios
- Peer is offline or not running the application
- Peer hasn't connected to the P2P network yet
- Network connectivity issues (firewalls, NAT, etc.)
- Peer has disconnected but friend entry still exists

### Application Behavior
- **DO NOT** show error dialogs for unreachable peers
- **DO** keep the friend in the friends list with `pending: true` flag
- **DO** log to console for debugging (info level, not error)
- **DO** silently fail message sends to unreachable peers
- **DO** allow users to retry connection attempts manually

### Friend Request Flow with Unreachable Peers
1. User adds friend by peer ID
2. Friend added to local friends list with `pending: true`
3. App attempts to send `requestFriend` message
4. **If peer unreachable**: Message fails silently, friend stays pending
5. **If peer reachable**: Message delivered, friend request event created
6. User can see pending status and retry later if needed

### Code Handling
```typescript
// CORRECT: Log and continue
try {
    await this.sendMessage(peerId, message);
    console.log(`📤 Sent friend request to ${peerId}`);
} catch (error) {
    console.log(`ℹ️  Could not reach peer ${peerId}, will retry when online`);
    // DO NOT throw - peer stays pending
}

// INCORRECT: Throw and show error dialog
try {
    await this.sendMessage(peerId, message);
} catch (error) {
    throw error;  // ❌ Don't do this!
}
```

## 🔍 Peer Discovery & Friend State Management

### Topic Subscription for Peer Discovery

**IMPORTANT**: Subscribe to the `hollow-world` topic immediately after creating the peer to enable automatic peer discovery.

```typescript
// Subscribe during initialization
await client.pubsub.subscribe('hollow-world', (senderId, message) => {
    // Handle joined/left messages for peer discovery
    if (message.type === 'joined') {
        addToPeerList(senderId);
    } else if (message.type === 'left') {
        removeFromPeerList(senderId);
    }
});

// Monitor peer list changes
const peers = await client.pubsub.listPeers('hollow-world');
```

### Peer List Management

The application maintains a real-time peer list for the `hollow-world` topic. This list is **not persisted** as peer connectivity changes frequently.

**Implementation**:

1. **Subscribe with Peer Change Monitoring**: Register topic subscription with peer join/leave handlers
   ```typescript
   // Subscribe to topic with data handler AND peer change handler
   await client.subscribe(
       'hollow-world',
       (senderId, data) => {
           // Handle topic messages
           console.log('Message from', senderId, data);
       },
       (peerId, joined) => {
           // Handle peer join/leave events
           if (joined) {
               this.connectedPeers.add(peerId);
               this.onPeerJoined(peerId);
           } else {
               this.connectedPeers.delete(peerId);
               this.onPeerLeft(peerId);
           }
       }
   );
   ```
   - The third parameter (peer change callback) is optional but recommended for peer tracking
   - Callback receives `(peerId: string, joined: boolean)` - `joined` is `true` for join, `false` for leave

2. **Initial Population**: Use `listPeers()` to get currently connected peers
   ```typescript
   const peers = await client.listPeers('hollow-world');
   // Store in memory (Set or Array)
   this.connectedPeers = new Set(peers);
   ```

3. **Peer Count Display**: Show peer list length on settings page
4. **Friend Presence**: Show online status for accepted friends based on peer list membership

**Key Points**:
- Peer list is **ephemeral** (runtime only, never persisted to storage)
- Use `Set<string>` for efficient add/remove/lookup operations
- Peer change monitoring is integrated into `subscribe()` - no separate `monitor()` API
- Unsubscribing automatically stops peer change monitoring
- Topic name: `hollow-world` (default, configurable in Settings view)
- Protocol string: `/hollow-world/1.0.0` (default, configurable in Settings view)

### Friend State Machine

Friends can be in one of three states:

| State      | Description                             | UI Display                  | Behavior                                 |
|------------|-----------------------------------------|-----------------------------|------------------------------------------|
| `unsent`   | Friend request created but not yet sent | `pending`                   | Auto-send when peer appears in peer list |
| `pending`  | Friend request sent, awaiting response  | `pending`                   | Wait for mutual `requestFriend` message  |
| `accepted` | Friend accepted the request             | Shows online/offline status | Can exchange messages                    |

**State Transitions**:
```
unsent → pending   (friend request sent)
pending → accepted (friend accepts request)
unsent → accepted  (direct acceptance if both add each other)
```

### Automatic Friend Request Sending

**Key Behavior**: If a friend is in `unsent` state AND appears in the peer list, automatically send them a friend request.

```typescript
// Pseudo-code for automatic sending
function onPeerJoined(peerId: string) {
    addToPeerList(peerId);

    const friend = friendsManager.getFriend(peerId);
    if (friend && friend.state === 'unsent') {
        // Peer is online and we haven't sent request yet
        sendFriendRequest(peerId);
        friend.state = 'pending';
    }
}
```

### Friend Presence Detection

For accepted friends, the UI shows whether they are currently online based on peer list membership:

```typescript
function getFriendPresence(peerId: string): 'online' | 'offline' {
    const friend = friendsManager.getFriend(peerId);
    if (!friend || friend.state !== 'accepted') {
        return 'offline';
    }
    return peerList.includes(peerId) ? 'online' : 'offline';
}
```

**UI Indicators**:
- `unsent`/`pending` friends: Show "pending" badge (no online/offline distinction)
- `accepted` friends: Show green indicator if in peer list, gray if not

### Peer Count Display

The settings page shows the number of connected peers from the `hollow-world` topic:

```typescript
// Update peer count display
const peerCount = hollowPeer.getConnectedPeerCount();
document.getElementById('peer-count').textContent = `${peerCount}`;
```

**Note**: Peer count includes ALL peers on the topic, not just friends. The count is displayed as a simple number in the settings header.

## 🔍 Troubleshooting

### WebSocket Connection Failed
**Symptom**: Browser can't connect to p2p-webapp
**Solutions**:
1. Verify server is running: `ps aux | grep p2p-webapp`
2. Check server output for URL/port
3. Ensure firewall allows localhost WebSocket connections
4. Try restarting server

### Peer ID Not Generated
**Symptom**: `client.connect()` hangs or throws error
**Solutions**:
1. Verify WebSocket connection established
2. Check browser console for errors
3. Ensure server is fully initialized (wait 2+ seconds after start)
4. Check server logs for initialization errors

### Messages Not Received
**Symptom**: `client.on_p2p_message` never fires
**Solutions**:
1. Verify both peers connected to same server
2. Check peer IDs are valid (not empty)
3. Verify message sent to correct peer ID
4. Check server logs for routing errors
5. Ensure message handlers registered before sending

### Multiple Servers Running
**Symptom**: Peers can't find each other despite same URL
**Solutions**:
1. Kill all p2p-webapp processes: `pkill p2p-webapp`
2. Start only ONE server
3. Connect all browser tabs to same server URL

## 🔐 Security Considerations

### Localhost Only
- p2p-webapp binds to localhost by default
- Not accessible from network (by design)
- Safe for local development and single-user applications

### Message Validation
- Always validate incoming P2P messages
- Check message structure before processing
- Sanitize user-generated content
- See `src/p2p/HollowPeer.ts` for validation patterns

### Peer Identity
- Peer IDs are not persistent (regenerated each session)
- Do not use peer IDs for authentication
- Implement separate authentication layer if needed

## 📚 Related Documentation

- **[`p2p-messages.md`](p2p-messages.md)** - Complete P2P message protocol
- **[`friends.md`](friends.md)** - Friends system using P2P
- **[`dependencies.md`](dependencies.md)** - Dependency versions and management
- **[`p2p-webapp-cli.md`](p2p-webapp-cli.md)** - p2p-webapp CLI tool documentation

## 🎯 Design Principles

### Interface-Based Architecture
- `INetworkProvider` abstracts P2P implementation
- Allows swapping providers without changing application code
- Mock implementations for testing
- See `src/p2p/types.ts`

### Separation of Concerns
- **Transport Layer**: p2p-webapp + WebSocket (handled by provider)
- **Protocol Layer**: Message types and formats (p2p-messages.md)
- **Application Layer**: Friend requests, MUD connections (HollowPeer)

### SOLID Principles
- **Single Responsibility**: Each class has one clear purpose
- **Open/Closed**: Extend via interfaces, don't modify core
- **Liskov Substitution**: MockNetworkProvider works anywhere INetworkProvider does
- **Interface Segregation**: INetworkProvider has minimal, focused API
- **Dependency Inversion**: App depends on INetworkProvider interface, not concrete implementation

---

*Last updated: 2025-11-08*
