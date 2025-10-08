# 🌐 P2P Networking Specification

**Peer-to-peer API for the Hollow World game**

*Based on [`../CLAUDE.md`](../CLAUDE.md)*

## 🎯 Core Requirements
- Use **SOLID principles** in all implementations
- Create comprehensive **unit tests** for all components
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*
- p2p transports are functions; to print them, use the raw objects as separate args

## 🌐 Architecture Overview

**Standalone Peer-to-Peer Web Application**
- **Primary architecture**: Fully decentralized, browser-to-browser connectivity
- **No server dependency**: Does NOT normally rely on servers for any purpose
- **Public infrastructure**: Uses IPFS/libp2p bootstrap nodes and public relays
- **Serverless by design**: All P2P functionality works without custom server infrastructure

**Go Servers - Optional Infrastructure for Edge Cases**
- **Purpose**: ONLY to enable same-firewall peer communication (browsers struggle with this)
- **Use case**: When multiple users are co-located behind the same NAT/firewall
- **Testing focus**: Primary purpose is development/testing of P2P features
- **Informal production use**: CAN be used opportunistically when users are co-located, but with informal expectations
- **Not required**: Most production users will NOT be behind the same firewall and will use public IPFS/libp2p infrastructure

**Key Principle**: The app is fundamentally serverless/peer-to-peer. Go servers are "nice to have" infrastructure for edge cases, not core architecture.

## 🔧 Technology Stack
- **LibP2P** - Decentralized networking protocol
  - **Direct streams** - For peer-to-peer messaging (protocol: `/hollow-world/1.0.0`)
  - **WebRTC** - For direct browser-to-browser connections
  - **Circuit relay** - Fallback when direct connection fails
  - ~~gossipsub~~ - NOT used (reserved for future broadcast features)
- **Helia** - IPFS implementation for peer discovery and data storage

### HollowPeer class holds the peer-to-peer code

**Architecture**: HollowPeer is the primary interface for P2P functionality
- **Network provider ownership**: HollowPeer creates and manages its own `LibP2PNetworkProvider` instance
- **UI components**: Should reference `HollowPeer`, not network providers directly
- **Initialization**: `main.ts` creates HollowPeer and passes it to UI components that need P2P functionality
- **Single instance**: Only one HollowPeer instance should exist per application session

**Testing**: HollowPeer instance is exposed via `window.__HOLLOW_WORLD_TEST__.hollowPeer` in dev/test environments
- Access peer ID: `hollowPeer.getPeerId()`
- Access EventService: `hollowPeer.getEventService()`
- See [CLAUDE.md Testing section](../CLAUDE.md#test-api-for-singleton-access) for usage examples

**Initialization Order Issue**: UI components may be instantiated before HollowPeer initialization completes
- **Problem**: Components created with `hollowPeer = undefined` miss subsequent initialization
- **Solution**: Components should check for global reference at render time:
  ```typescript
  if (!this.hollowPeer && (window as any).__HOLLOW_WORLD_TEST__?.hollowPeer) {
      this.hollowPeer = (window as any).__HOLLOW_WORLD_TEST__.hollowPeer;
  }
  ```
- **Example**: `SettingsView.ts` retrieves `hollowPeer` in `renderSettings()` for peer count display
- **Result**: Peer count displays correctly and auto-updates every 5 seconds

### 💾 Persistent Session Tracking
- **Loaded on session start**, saved when edited

### 🔑 Data Fields

#### Persisted Fields
- **`privateKey`**: Stores the LibP2P peer ID's private key
- **`friends`**: Map of peerIds → friend objects
- **`stunServers`**: Array of STUN server objects (with url and responseTime)
  - initialized from assets/validated-public-servers.json

#### Non-Persisted Fields
- **`quarantined`**: Set of untrusted peerIDs
- **`messagePrefix`**: Random alphanumeric string + "-" (for request-response message correlation)
- **`messageCount`**: Sequential counter starting at 0 (for generating unique message IDs)
- **`pendingResponses`**: Map of messageId → zero-arg handler function (for request-response handling)

### 🔄 Session Restoration
- **Startup process**: Reload HollowPeer object and restore peer ID from persisted private key
- **LibP2P initialization**: Use `createLibp2p` with `libp2pInit` object
- **IPFS**: use Helia to connect to IPFS with current peerID
  - connect to public bootstrap IPFS nodes
- **Private key supply**: Include persisted private key as `privateKey` property
- if there are pendingFriendRequests, send friendRequest messages for them
- if there are invites, send approveFriendRequest messages for them

## 📨 Message Transport Layer

### LibP2P Stream-Based Communication

**Transport Mechanism**: Direct LibP2P streams (NOT GossipSub pubsub)
- **Protocol identifier**: `/hollow-world/1.0.0`
- **Communication pattern**: Unicast peer-to-peer messaging
- **Stream type**: Bidirectional streams for request-response patterns

### How Messages Are Sent

```typescript
// Sending a message to a specific peer
async sendMessage(targetPeerId: string, message: P2PMessage): Promise<void> {
  // 1. Get connection to target peer
  const connection = await this.libp2p.dial(targetPeerId);

  // 2. Open a stream using our protocol
  const stream = await connection.newStream('/hollow-world/1.0.0');

  // 3. Serialize message to JSON
  const messageJson = JSON.stringify(message);
  const messageBytes = new TextEncoder().encode(messageJson + '\n');

  // 4. Send message bytes
  await stream.sink([messageBytes]);

  // 5. Close stream (for one-way messages)
  await stream.close();
}
```

### How Messages Are Received

```typescript
// Register stream handler on initialization
async initialize(): Promise<void> {
  await this.libp2p.handle('/hollow-world/1.0.0', async ({ stream, connection }) => {
    // 1. Read incoming message bytes
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream.source) {
      chunks.push(chunk.subarray());
    }

    // 2. Decode message
    const messageText = new TextDecoder().decode(concatenate(chunks));
    const message: P2PMessage = JSON.parse(messageText.trim());

    // 3. Get sender's peer ID
    const senderPeerId = connection.remotePeer.toString();

    // 4. Process message based on method
    await this.handleIncomingMessage(senderPeerId, message);
  });
}
```

### Message Delivery Behavior

**Unicast (Peer-to-Peer)**:
- All P2P messages are sent directly to specific peers
- Messages are NOT broadcast to all connected peers
- Each message requires knowing the recipient's peer ID

**Connection Requirements**:
- Peer must be connected (or connection will be established automatically)
- If connection fails, error is thrown to caller
- No message queuing - failed sends must be retried by caller

**Error Handling**:
- **Peer not found**: Dial fails, throws error
- **Stream creation fails**: Throws error, caller should retry
- **Message too large**: No size limit enforced, but practical limit is ~1MB
- **Invalid JSON**: Receiver logs error and ignores message
- **Unknown method**: Receiver logs error and ignores message

### Implementation Guidance

**Stream Management**:
- One stream per message for simplicity
- Streams are short-lived (open, send, close)
- No persistent streams (avoids state management complexity)

**Message Framing**:
- Messages are newline-delimited JSON (`\n` separator)
- Allows multiple messages on one stream (if needed in future)
- TextEncoder/TextDecoder for UTF-8 encoding

**Concurrency**:
- Multiple messages can be sent in parallel
- Each message gets its own stream
- LibP2P handles stream multiplexing

**Request-Response Pattern**:
- Request includes `messageId` for correlation
- Response echoes `messageId` back
- Response handler registered in `pendingResponses` map
- See "Request-Response Messages" section for details

## 👥 Friends

### Friend Data Structure

**TypeScript Interface**:
```typescript
interface Friend {
  peerId: string;       // LibP2P peer ID (unique identifier)
  playerName: string;   // Display name for the friend
  notes: string;        // Private notes (not transmitted in messages)
}
```

### Field Specifications

**`peerId`** (required):
- LibP2P peer ID string (e.g., `"12D3KooW..."`)
- Must be valid LibP2P peer ID format
- Used as unique key in friends map
- Immutable once friend is added

**`playerName`** (required):
- Display name shown in UI
- Maximum length: 50 characters
- Minimum length: 1 character
- Can be edited by user after friend is added
- Validation: Non-empty, trimmed string

**`notes`** (required, can be empty string):
- Private notes about the friend
- Maximum length: 500 characters
- Never transmitted in P2P messages
- For user's reference only
- Validation: Any string (including empty)

### Storage Format

**In-memory**: `Map<string, Friend>`
- Key: `peerId` string
- Value: `Friend` object

**localStorage Persistence**: Serialized as JSON object (not Map)
```typescript
// Serialization (Map → Object)
const friendsObject: Record<string, Friend> = Object.fromEntries(this.friends);
localStorage.setItem('friends', JSON.stringify(friendsObject));

// Deserialization (Object → Map)
const friendsJson = localStorage.getItem('friends');
const friendsObject: Record<string, Friend> = friendsJson ? JSON.parse(friendsJson) : {};
this.friends = new Map(Object.entries(friendsObject));
```

**Why Object instead of Map**:
- `Map` doesn't serialize to JSON properly (becomes empty object `{}`)
- Object/Record pattern preserves key-value structure
- `Object.entries()` and `Object.fromEntries()` provide clean conversion

### Invitations
- invitation is a base64-encoded JSON Object
  - inviteCode
  - peerId
  - address information including external and internal IPs (including .local mDNS addresses) but not localhost (127.*, ::1)
- there is an `activeInvitations` Object (functions as a Map)
  - stores mapping of invite code -> [friendName,friendId]
  - friendId can be null
- there is a `pendingFriendRequests` Object of peerID -> invitation

### Peer connections
don't log peer connections since the peer count display handles that.
#### if a peer connects and its peerId is not in the friends map, add its peerId to the quarantined set
#### when connecting to another peer that has the same external IP as this one, use the internal IP instead
#### STUN servers
- copy validated-public-servers.json to public/assets
  - just the STUN list
    - URL and responseTime only

## 🏗️ Deployment Architecture

**Production Deployment**
- **Browser-only application**: Served as static files (HTML, CSS, JS)
- **P2P connectivity**: Direct browser-to-browser via WebRTC and IPFS/libp2p
- **Bootstrap nodes**: Uses public IPFS bootstrap nodes for peer discovery
- **Circuit relays**: Uses public libp2p relays when direct connection fails
- **No custom servers required**: App functions fully without dedicated infrastructure

**Development Environment**
1. **Application Server** (Vite dev server)
   - Serves the web application on port 3000 (HTTPS)
   - No P2P infrastructure dependencies
   - Lightweight and focused on app delivery

2. **Optional P2P Infrastructure Servers** (Go-based)
   - Independent processes started separately for testing
   - Handle TURN/STUN, circuit relay, and WebRTC signaling
   - Enable same-firewall peer testing (browser limitation)
   - Use Go's native WebTransport support for better browser compatibility

### 🧪 Local Development Servers

**Go-based P2P infrastructure** - Separate servers started independently from Vite

#### Why Go?
- **WebTransport support**: Go's `go-libp2p` has native server-side WebTransport support
- **Certificate handling**: Self-signed certificates work with manual browser approval (see Certificate Setup below)
- **Performance**: More efficient than Node.js for P2P relay operations
- **Simplicity**: Single binary with no Node.js dependency conflicts

#### Servers to Implement

1. **TURN/STUN Server** (`test/go-p2p-servers/turn-stun/`)
   - Port: `3478` (binds to all interfaces)
   - Protocol: UDP/TCP
   - Credentials: `testuser` / `testpass`
   - Provides NAT traversal for WebRTC connections
   - **Access**: Server provides network address to browser at runtime
     - Browser may be using `localhost` but needs actual network IP for P2P
     - Example: Server at `192.168.1.103` → browser receives `stun:192.168.1.103:3478`
   - **Implementation**: Use `pion/turn` package

2. **LibP2P Circuit Relay** (`test/go-p2p-servers/relay/`)
   - Port: `9090` (binds to all interfaces)
   - Transport: **WebTransport** (QUIC-based, uses self-signed certificates)
   - Peer ID: Generated fresh on each server startup (new private key each run)
   - Fallback for direct connection failures
   - **Access**: Server provides network address and peer ID to browser at runtime
     - Relay peer ID and network address exposed via HTTP endpoint on port 9092
     - **Multiaddr format**: `/ip4/${networkAddress}/udp/9090/quic-v1/webtransport/p2p/${relayPeerId}`
   - **Implementation**: Use `libp2p/go-libp2p` with WebTransport transport
   - **WebTransport advantages**:
     - QUIC provides better performance than WebSockets
     - Native support in both browser and Go libp2p
     - Works with self-signed certificates after manual browser approval (see Certificate Setup)

3. **WebRTC Signaling Server** (`test/go-p2p-servers/signaling/`)
   - Port: `9091` (binds to all interfaces)
   - Transport: WebSocket (WSS with self-signed certificate)
   - Exchanges SDP offers/answers between browser peers
   - **Access**: `wss://${networkAddress}:9091`
   - **Implementation**: Standard WebSocket server with message forwarding
   - **Note**: Uses self-signed certificate; requires manual browser approval on first connection (see Certificate Setup)

#### Certificate Setup for Dev Servers

**Development servers use self-signed certificates** that must be manually approved by the browser.

**Setup Process**:
1. **Start the dev servers** (TURN/STUN, relay, signaling)
2. **Visit the web app using network IP** (not localhost) via HTTPS
   - Example: `https://192.168.1.103:3000`
   - Browser will show a certificate warning
3. **Manually approve the self-signed certificate**
   - Click "Advanced" → "Proceed to site" (or equivalent in your browser)
   - This tells the browser to trust connections to this IP address
4. **Browser remembers approval** for this IP/certificate combination
5. **All subsequent connections** (WebSocket/WebTransport) to dev servers on the same IP will be trusted

**Key Points**:
- **Network IP required**: Must use actual network IP (e.g., `192.168.1.103`), not `localhost`
  - Browser treats each IP as a separate trust decision
  - Approving `localhost` doesn't approve `192.168.1.x`
- **One-time setup**: Browser remembers approval until certificate changes or expires
- **Development only**: Production deployments use public IPFS/libp2p infrastructure (no custom servers needed)
- **WebTransport benefit**: Works with self-signed certs after manual approval (unlike some other protocols)

**Testing Across LAN**:
- When testing between multiple devices on same LAN, each device must approve the certificate
- Each browser instance needs to visit `https://${networkIP}:3000` and approve the cert
- After approval, WebSocket and WebTransport connections to dev servers will work

#### Configuration Endpoint
- **HTTP endpoint on relay server**: Port 9092
  - `GET /config` - Returns JSON with relay peer ID and network addresses
  - Browser fetches this on startup to get current relay configuration
  - Example response:
    ```json
    {
      "relayPeerId": "12D3KooW...",
      "networkAddress": "192.168.1.103",
      "relayMultiaddr": "/ip4/192.168.1.103/udp/9090/quic-v1/webtransport/p2p/12D3KooW..."
    }
    ```

#### Dynamic Configuration (Testing/Same-Firewall Use Only)
- **DO NOT hard-code IP addresses** for local servers
- **DO NOT hard-code relay peer ID** - it's generated automatically and provided at runtime
- **DO NOT use `window.location.hostname`** - browser may be using `localhost` but P2P needs network IP
- Server determines its own network address and provides it to browser at runtime
- Relay peer ID and network addresses fetched from configuration endpoint at `http://localhost:9092/config`
- Servers bind to all network interfaces (0.0.0.0)
- Allows testing across LAN devices without code changes

**Configuration Endpoint Discovery**:
- Same machine: `http://localhost:9092/config` works directly
- Same LAN: Developer must manually configure endpoint URL (e.g., `http://192.168.1.103:9092/config`)
- Browser needs to know where Go servers are running
- This is acceptable for testing and same-firewall edge cases
- Not needed for typical production use (different firewalls)

#### Starting Servers
```bash
# Start all P2P infrastructure servers
cd test/go-p2p-servers
./start-all.sh  # Starts TURN/STUN, relay, and signaling servers

# Or start individually
cd turn-stun && go run main.go
cd relay && go run main.go
cd signaling && go run main.go
```

### 🧪 Testing Infrastructure Requirements

**Go Servers: Optional Infrastructure for Edge Cases**

**Primary Purpose**: Testing and development of P2P features
- Test P2P connectivity between browser instances on the same machine
- Test P2P connectivity between devices on the same LAN
- Validate circuit relay fallback mechanisms
- Debug WebRTC signaling issues
- Enable controlled testing without internet dependency

**Secondary Purpose**: Same-firewall production use (informal)
- When multiple users are co-located behind the same NAT/firewall
- Browsers struggle with same-firewall peer discovery
- Can use test servers opportunistically, but with informal expectations
- This is an edge case, not the primary production scenario

**When to Use**:
- Running integration tests with Playwright
- Testing multi-peer interactions locally or on same LAN
- Developing P2P features that require peer-to-peer messaging
- Verifying connection establishment flows
- Co-located users who want to connect (production edge case)

**Typical Production Scenario** (No Go Servers Needed):
- Users are on different networks/firewalls
- Uses public IPFS bootstrap nodes and relays
- WebRTC direct connections or public circuit relays
- DHT-based peer discovery
- No custom server infrastructure required

#### Migration from Node.js
**Deprecated servers** (to be removed):
- `test/local-relay-server.js` - Node.js relay (WSS only, no WebTransport)
- `test/local-turn-server.js` - Node.js TURN server
- `vite.config.ts` plugin `p2p-test-servers` - Vite-integrated server startup

**Benefits of Go migration**:
- ✅ WebTransport support (works with self-signed certs after manual browser approval)
- ✅ Independent processes, no Vite dependency
- ✅ Better performance and resource usage
- ✅ Native libp2p support in both browser and server
- ✅ Cleaner separation of concerns
- ✅ Certificate approval workflow simpler (one approval enables all dev server connections)

## 🔧 API Methods

### Core Network Functions
- **`getPeerId()`**: Returns persistent peer ID
- **`addFriend(name, friendPeerId)`**: Adds friend's name and peer ID to persistent storage
- **`getConnectedPeers()`**: Returns array of connected peer ID strings
- **`getConnectedPeerCount()`**: Returns number of currently connected peers

### Implementation Details
- **Network provider interface**: [`src/p2p.ts`](../src/p2p.ts)
- **Storage integration**: Uses LocalStorageProvider for persistence
- **Error handling**: Graceful degradation when network fails

## P2P App protocol

### How it works
- Peers send messages to each other (see P2P Communication Procedure)
- Connections are authenticated and encrypted
- first attempt to connect with WebRTC
  - use the first STUN server out of `stunServers` that connects out of the first 10
  - if that fails, try CircuitRelay with public servers

### Testing Results

**Global IPFS Connectivity** (Verified 2025-10-08):
- ✅ Successfully connects to 100+ peers using default Helia configuration
- ✅ Peer discovery working: DHT and bootstrap nodes functioning correctly
- ✅ No custom LibP2P transport configuration needed - Helia defaults work perfectly
- ✅ Connection gater configuration successfully applied to allow private IP connections

**Local P2P Testing Infrastructure** (Updated 2025-10-08):
- ✅ TURN server operational on port 3478
- ✅ **Certificate validation resolved**: Manual browser approval enables WebSocket/WebTransport connections
  - **Solution**: Visit web app via network IP (e.g., `https://192.168.1.103:3000`)
  - **Workflow**: Browser shows cert warning → User approves → All connections to that IP are trusted
  - **Status**: WebTransport and WSS connections work after one-time approval
- 🔄 **Go server migration in progress**: Moving from Node.js to Go-based infrastructure
  - **Benefit**: Better WebTransport support and performance
  - **Node.js limitation**: Node.js libp2p doesn't support server-side WebTransport listening
  - **Go advantage**: Native server-side WebTransport in `go-libp2p`

**Multi-Profile Testing** (Verified 2025-10-08):
- ✅ Multiple profiles with separate peer IDs working correctly
- ✅ Profile switching with localStorage isolation
- ✅ Concurrent profile testing in separate browser tabs via Playwright
- 🔄 **Ping/pong testing**: Ready to test after Go server migration
  - **Direct dial**: Will fail on localhost/same-firewall (WebRTC/browser limitation)
  - **Circuit relay fallback**: Will work with Go-based WebTransport relay
  - **Certificate approval**: Required one-time setup (see Certificate Setup section)

**Next Steps - Go Server Migration**:
1. ✅ Certificate validation approach clarified (manual approval workflow)
2. Implement Go-based circuit relay with WebTransport support
3. Implement Go-based TURN/STUN server
4. Implement Go-based signaling server
5. Update browser code to fetch relay config from HTTP endpoint
6. Retest ping/pong with WebTransport relay after certificate approval
7. Remove deprecated Node.js servers and Vite plugin
8. Document Go server setup and testing procedures

### Structure of app messages
#### `specs/p2p-messages.md` has the JSON specifiation for messages.

#### VERY IMPORTANT: DO NOT CHANGE protocol message structures unless specifically directed to by the `specs/p2p.md` file.

#### P2P messages are JSON objects, each one containing
- `method` -- indicates the method to execute, defined below
- other properties are method-specific

### Request-Response Messages
Some P2P messages follow a request-response pattern where a request message expects a corresponding response message.

#### How Request-Response Works
- **Request messages** contain a `messageId` property for correlation
- **Response messages** echo back the `messageId` from the request
- **messageId format**: `{messagePrefix}{messageCount}`
  - `messagePrefix`: Random string + "-" (generated on peer initialization, not persisted)
  - `messageCount`: Sequential counter starting at 0 (not persisted)
- **Handler registration**: When sending a request, caller can provide a zero-arg handler function
  - Handler is stored in `pendingResponses` map: `messageId -> handler function`
  - When response arrives, handler is executed and removed from map

#### Currently Supported Request-Response Pairs
- **ping** (request) → **pong** (response)

#### P2P Communication Procedure
Listen for well-formatted incoming p2p messages on peer connections and execute them.

Each p2p message will have a corresponding p2p method implementation in the HollowPeer class

#### P2P Messages
- requestFriend(invitation)
  - add peerId -> invitation to pendingFriendRequests
  - sends message to peerId and address in invitation
  - message properties
    - inviteCode: inviteCode from invitation
  - behavior on receiving peer
    - check activeInvitations Object for inviteCode entry (see Invitations, above)
      - if entry has a friendId, verfy that it matches the message's sender
    - if valid, add a friend request event
      - the event has the message
        - the event view has `Accept` and `Ignore` buttons
        - if the user clicks Accept
          - add the friend to the friend list
          - send an approveFriendRequest to the sender
        - clicking either button will remove the event from the event list
    - if invalid, log an invalid friend request
- approveFriendRequest
  - if peerId is in friends map, ignore it
  - if peerId is not in pendingFriendRequests, log it as an error
  - otherwise
    - remove the entry from pendingFriendRequests
    - add an entry for the peer to the friends map
    - add an accepted event to the event list
      - the event view has a "View Friend" button
        - removes the event from the event list
        - jumps to the settings page and selectes the friend
- ping(timestamp, messageId)
  - message properties
    - timestamp: Unix timestamp (milliseconds) when ping was sent
    - messageId: Unique message identifier for request-response correlation
  - behavior on receiving peer
    - immediately respond with pong message containing the same timestamp and messageId
    - log the ping receipt (for debugging)
- pong(timestamp, messageId)
  - message properties
    - timestamp: The original timestamp from the ping message (echo back)
    - messageId: The messageId from the ping request (echo back)
  - behavior on receiving peer
    - calculate round-trip time: Date.now() - timestamp
    - look up handler in pendingResponses using messageId
    - if handler found, execute it and remove from pendingResponses
    - if handler not found, log warning (unexpected response)
    - log successful connectivity
    - mark peer as reachable
