# fill out this spec below the ----
based on specs/p2p.md
- preserve as much as possible from p2p.md
- remove local server dependency
- specify that
  - the code is to be modeled on the p2p code on https://github.com/libp2p/universal-connectivity `js-peer/src/lib`
  - cache the github project in specs/cache for efficient access
  - put the p2p code in src/p2p
  - universal-connectivity messages are just strings with content type text/plain but ours will be JSON objects with type application/json
  - the app should initialize libp2p just like ucp2p, except it should use these bootstrap peers:
  ```
    peerDiscovery: [
      bootstrap({
        list: [
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
          '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
        ]
      })
    ]
  ```
----

# 🌐 P2P Networking Specification (Universal Connectivity)

**Peer-to-peer API for the Hollow World game - Serverless Edition**

*Based on [`../CLAUDE.md`](../CLAUDE.md) and [`libp2p/universal-connectivity`](https://github.com/libp2p/universal-connectivity)*

---

## ⚠️ CRITICAL: PACKAGE VERSION WARNING

**DO NOT UPGRADE LIBP2P OR HELIA PACKAGES UNLESS EXPLICITLY DIRECTED BY THE USER**

The current package versions are carefully selected for compatibility:
- **helia: 5.5.1** - DO NOT UPGRADE
- **libp2p: 2.9.0** - DO NOT UPGRADE
- **All @libp2p/* packages** - DO NOT UPGRADE
- **All @chainsafe/libp2p-* packages** - DO NOT UPGRADE

**Why this matters**:
- These packages have complex version interdependencies
- Upgrading one package can break compatibility with others
- The current versions are known to work together
- Breaking changes in newer versions may require extensive refactoring

**If user requests package upgrades**:
1. Ask for explicit confirmation
2. Upgrade ALL related packages together
3. Test thoroughly after upgrading
4. Be prepared to rollback if issues occur

**This warning applies to**:
- `npm install` with version bumps
- `npm update` commands
- Manual package.json edits
- Dependency resolution during installs

---

## 🎯 Core Requirements
- Use **SOLID principles** in all implementations
- Create comprehensive **unit tests** for all components
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*
- Model P2P code on the reference implementation from `https://github.com/libp2p/universal-connectivity` (`js-peer/src/lib`)
- Cache the GitHub project in `specs/cache/universal-connectivity` for efficient access
- Put the P2P code in `src/p2p/`
- P2P transports are functions; to print them, use the raw objects as separate args

## 📚 Reference Implementation
- **Source repository**: https://github.com/libp2p/universal-connectivity
- **Reference path**: `js-peer/src/lib`
- **Local cache**: `specs/cache/universal-connectivity/` (clone for offline reference)
- **Key differences from reference**:
  - Universal-connectivity uses plain text messages (`text/plain`)
  - Hollow World uses JSON object messages (`application/json`)
  - Universal-connectivity is a demo; we build a production P2P game protocol

## 🌐 Architecture Overview

**Fully Decentralized Peer-to-Peer Web Application**
- **Primary architecture**: Browser-to-browser connectivity without custom servers
- **No server dependency**: Does NOT rely on custom servers for ANY purpose
- **Public infrastructure only**: Uses public IPFS/libp2p bootstrap nodes and relays
- **Universal connectivity**: Follows libp2p universal-connectivity patterns for maximum reach
- **Serverless by design**: All P2P functionality works without custom infrastructure

**Key Principle**: The app is fundamentally serverless/peer-to-peer. Uses public IPFS/libp2p infrastructure exclusively.

## 🔧 Technology Stack
- **LibP2P** - Decentralized networking protocol
  - **Direct streams** - For peer-to-peer messaging (protocol: `/hollow-world/1.0.0`)
    - Stream handler registered AFTER libp2p initialization
  - **WebRTC** - For direct browser-to-browser connections
  - **WebTransport** - For QUIC-based browser connections
  - **WebSockets** - For connecting to public relays
  - **Circuit relay** - Fallback when direct connection fails
- **Public Bootstrap Nodes** - For peer discovery
  - Uses standard libp2p/IPFS bootstrap nodes
  - No custom bootstrap infrastructure required
- **Public Circuit Relays** - For NAT traversal
  - Uses public libp2p relay servers
  - No custom relay infrastructure required

### Universal Connectivity Pattern (ucp2p)
Follow the libp2p universal-connectivity approach for maximum peer reachability:

1. **Multiple transports**: WebRTC, WebTransport, WebSockets
2. **Public relays**: Use community-provided circuit relays
3. **DHT for discovery**: Leverage Kademlia DHT for peer finding
4. **AutoNAT**: Automatic NAT detection and traversal
5. **Hole punching**: DCUtR (Direct Connection Upgrade through Relay)

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

#### Non-Persisted Fields
- **`quarantined`**: Set of untrusted peerIDs
- **`messagePrefix`**: Random alphanumeric string + "-" (for request-response message correlation)
- **`messageCount`**: Sequential counter starting at 0 (for generating unique message IDs)
- **`pendingResponses`**: Map of messageId → zero-arg handler function (for request-response handling)

### 🔄 Session Restoration
- **Startup process**: Reload HollowPeer object and restore peer ID from persisted private key
- **LibP2P initialization**: Create libp2p node following exact ucp2p pattern from `js-peer/src/lib/libp2p.ts`

  **Configuration (following ucp2p exactly)**:
  ```typescript
  // 1. Create delegated routing client (for discovering relay multiaddrs)
  const delegatedClient = createDelegatedRoutingV1HttpApiClient('https://delegated-ipfs.dev')

  // 2. Get relay listen addresses from bootstrap peers via delegated routing
  const relayListenAddrs = await getRelayListenAddrs(delegatedClient)

  // 3. Create libp2p node
  const libp2p = await createLibp2p({
    privateKey: privateKey,  // Persisted private key
    addresses: {
      listen: [
        '/webrtc',           // Listen for WebRTC connections
        ...relayListenAddrs  // Listen via discovered circuit relays
      ]
    },
    transports: [
      webTransport(),        // QUIC-based browser transport
      webSockets(),          // For connecting to relays (wss://)
      webRTC(),              // Browser-to-browser direct P2P
      webRTCDirect(),        // For peers supporting WebRTC-direct (e.g. Rust peers)
      circuitRelayTransport() // Required to create relay reservations for hole punching
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    connectionGater: {
      // Allow all connections (including local network connections)
      // This is required for local testing between browser tabs
      denyDialMultiaddr: async () => false,
      denyInboundConnection: async () => false,
      denyOutboundConnection: async () => false,
      denyInboundEncryptedConnection: async () => false,
      denyOutboundEncryptedConnection: async () => false,
      denyInboundUpgradedConnection: async () => false,
      denyOutboundUpgradedConnection: async () => false,
    },
    peerDiscovery: [
      pubsubPeerDiscovery({
        interval: PEER_DISCOVERY_INTERVAL,  // e.g. 10_000 (10 seconds)
        topics: [PUBSUB_PEER_DISCOVERY_TOPIC],  // 'universal-connectivity-browser-peer-discovery'
        listenOnly: false
      })
    ],
    services: {
      pubsub: gossipsub({
        allowPublishToZeroTopicPeers: true,
        msgIdFn: msgIdFnStrictNoSign,  // Same as ucp2p for message deduplication
        ignoreDuplicatePublishError: true,
        runOnTransientConnection: true  // CRITICAL: Allow gossipsub over circuit relay connections
      }),
      // Delegated routing helps discover ephemeral multiaddrs of bootstrap peers
      // Uses public delegated routing endpoint: https://delegated-ipfs.dev
      delegatedRouting: () => delegatedClient,
      identify: identify(),
      directMessage: directMessage(),  // Custom protocol for direct messaging
      ping: ping()  // Optional: for connectivity testing
    }
  })

  // 4. Subscribe to pubsub peer discovery topic
  libp2p.services.pubsub.subscribe(PUBSUB_PEER_DISCOVERY_TOPIC)

  // 5. Dial discovered peers (filtering for WebRTC multiaddrs)
  libp2p.addEventListener('peer:discovery', (event) => {
    const { id, multiaddrs } = event.detail

    if (libp2p.getConnections(id)?.length > 0) {
      return  // Already connected
    }

    // Filter and dial WebRTC multiaddrs one at a time
    dialWebRTCMaddrs(libp2p, multiaddrs)
  })
  ```

  **Helper function (from ucp2p)**:
  ```typescript
  // Resolves bootstrap PeerIDs to dialable relay listen addresses
  async function getRelayListenAddrs(client: DelegatedRoutingV1HttpApiClient): Promise<string[]> {
    const peers = await Promise.all(
      BOOTSTRAP_PEER_IDS.map((peerId) => first(client.getPeers(peerIdFromString(peerId))))
    )

    const relayListenAddrs = []
    for (const p of peers) {
      if (p && p.Addrs.length > 0) {
        for (const maddr of p.Addrs) {
          const protos = maddr.protoNames()
          // Filter for secure WebSockets (wss) with TLS
          if (protos.includes('tls') && protos.includes('ws')) {
            if (maddr.nodeAddress().address === '127.0.0.1') continue  // Skip loopback
            relayListenAddrs.push(`${maddr.toString()}/p2p/${p.ID.toString()}/p2p-circuit`)
          }
        }
      }
    }
    return relayListenAddrs
  }

  // Dials WebRTC multiaddrs one at a time to avoid multiple connections to same peer
  async function dialWebRTCMaddrs(libp2p: Libp2p, multiaddrs: Multiaddr[]): Promise<void> {
    const webRTCMadrs = multiaddrs.filter((maddr) => maddr.protoNames().includes('webrtc'))

    for (const addr of webRTCMadrs) {
      try {
        await libp2p.dial(addr)
        return  // Success - stop trying other addresses
      } catch (error) {
        // Try next address
      }
    }
  }

  // Message ID function for gossipsub (prevents duplicate messages)
  async function msgIdFnStrictNoSign(msg: Message): Promise<Uint8Array> {
    const enc = new TextEncoder()
    const signedMessage = msg as SignedMessage
    const encodedSeqNum = enc.encode(signedMessage.sequenceNumber.toString())
    return await sha256.encode(encodedSeqNum)
  }
  ```

  **Hollow World Constants** (adapt from ucp2p's constants.ts):
  ```typescript
  // src/p2p/constants.ts

  // CURRENT: Using universal-connectivity topic for peer discovery to benefit from existing bootstrap subscribers
  // This allows discovery between HollowWorld instances and interoperability with other libp2p browser apps
  export const PUBSUB_PEER_DISCOVERY_TOPIC = 'universal-connectivity-browser-peer-discovery'

  // FUTURE: Custom topic (currently fails because relay doesn't subscribe, creating chicken-and-egg problem)
  // export const PUBSUB_PEER_DISCOVERY_TOPIC = 'hollow-world-browser-peer-discovery'

  export const DIRECT_MESSAGE_PROTOCOL = '/hollow-world/dm/1.0.0'
  export const PEER_DISCOVERY_INTERVAL = 10_000  // 10 seconds

  // Bootstrap peers: Public IPFS bootstrap nodes (peer IDs only)
  // NOTE: These are used by getRelayListenAddrs() to discover relay addresses via delegated routing
  // They are NOT relay peer IDs themselves - delegated routing resolves them to relay listen addresses

  // CURRENT: Using only ucp2p bootstrap peer to avoid initialization hangs
  // IMPORTANT: Using too many relay addresses (100+) causes createLibp2p() to hang
  export const BOOTSTRAP_PEER_IDS = [
    '12D3KooWFhXabKDwALpzqMbto94sB7rvmZ6M28hs9Y9xSopDKwQr'  // Universal-connectivity bootstrap peer (ucp2p)
  ]

  // FUTURE: Public IPFS bootstrap nodes (currently commented out to avoid initialization issues)
  // export const BOOTSTRAP_PEER_IDS = [
  //   'QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  //   'QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
  //   'QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  //   'QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
  // ]
  ```

  **How Bootstrap Peers Work (ucp2p pattern)**:
  - ucp2p uses custom rust/go bootstrap nodes with **ephemeral multiaddrs**
  - Hollow World CURRENTLY uses the **ucp2p bootstrap node** (FUTURE: may use public IPFS bootstrap nodes)
  - In both cases, `getRelayListenAddrs()`:
    1. Uses delegated routing to query each peer ID
    2. Gets current multiaddrs for that peer (which may change over time)
    3. Filters for WebSocket addresses with TLS (`wss://`)
    4. Converts them to circuit relay v2 listen addresses (`/p2p/{peerId}/p2p-circuit`)
  - These relay listen addresses are then added to the libp2p `listen` array
  - This allows the node to be dialable via those relays

  **Key Differences from Old Approach**:
  - ❌ **NO bootstrap() in peerDiscovery** - ucp2p uses delegated routing instead
  - ✅ **Delegated routing service** - Discovers relay multiaddrs from bootstrap peers
  - ✅ **Dynamic relay listen addresses** - Resolved at runtime, not hardcoded
  - ✅ **WebRTC multiaddr filtering** - Only dial WebRTC addresses for browser-to-browser
  - ✅ **Sequential dialing** - Try one multiaddr at a time to avoid duplicate connections

  **Critical Requirements**:
  - **MUST use delegated routing** - This is how ucp2p discovers relays
  - **MUST get relay listen addresses** - Call `getRelayListenAddrs()` before creating libp2p
  - **MUST filter WebRTC multiaddrs** - Use `dialWebRTCMaddrs()` in peer:discovery handler
  - **MUST use same msgIdFn** - Ensures message deduplication across network

- **Reference implementation**: Follow `libp2p/universal-connectivity` `js-peer/src/lib/libp2p.ts` EXACTLY
- if there are pendingFriendRequests, send friendRequest messages for them
- if there are invites, send approveFriendRequest messages for them

## 📨 Message Transport Layer

### LibP2P Stream-Based Communication

**Transport Mechanism**: Direct LibP2P streams (custom libp2p service) and GossipSub pubsub
- **Protocol identifier**: `/hollow-world/dm/1.0.0` (direct messaging)
- **Communication pattern**: Unicast peer-to-peer messaging with request-response
- **Stream type**: Bidirectional streams for request-response patterns
- **Message format**: JSON objects (NOT plain text like ucp2p demo)
- **Implementation pattern**: Custom libp2p service (following ucp2p's `DirectMessage` service)

### How ucp2p Does It

**ucp2p uses a custom libp2p service** (`DirectMessage`) that:
1. Registers as a libp2p service with protocol `/universal-connectivity/dm/1.0.0`
2. Uses protobuf streaming (`pbStream`) for message serialization
3. Implements request-response pattern (every send gets a response)
4. Uses `connection.newStream()` instead of `dialProtocol()`
5. Opens/reuses connections via `connectionManager.openConnection()`
6. Dispatches events for received messages
7. Includes metadata (timestamp, client version) in all messages

### How Messages Are Sent (Following ucp2p Pattern)

```typescript
// Hollow World adaptation of ucp2p's send method
async sendMessage(peerId: string, message: P2PMessage): Promise<void> {
  // 1. Open or reuse connection to target peer
  const connection = await this.libp2p.connectionManager.openConnection(
    peerId,
    { signal: AbortSignal.timeout(5000) }
  );

  // 2. Create new stream for this message
  const stream = await connection.newStream('/hollow-world/dm/1.0.0', {
    negotiateFully: false  // Single protocol, skip full negotiation
  });

  // 3. Serialize message to JSON
  const messageJson = JSON.stringify(message);
  const messageBytes = new TextEncoder().encode(messageJson);

  try {
    // 4. Send message with length prefix
    await pipe(
      [messageBytes],
      lp.encode,
      stream
    );

    // 5. Wait for acknowledgment response (optional for reliability)
    const ackData = await pipe(
      stream,
      lp.decode,
      async (source: any) => {
        const chunks: Uint8Array[] = [];
        for await (const chunk of source) {
          chunks.push(chunk.subarray());
        }
        return chunks;
      }
    );

    console.log(`✅ Message sent and acknowledged`);
  } finally {
    await stream.close({ signal: AbortSignal.timeout(5000) });
  }
}
```

### How Messages Are Received (Following ucp2p Pattern)

```typescript
// Register stream handler as part of service initialization
// In afterStart() method of custom service
async afterStart(): Promise<void> {
  await this.components.registrar.handle(
    '/hollow-world/dm/1.0.0',
    async ({ stream, connection }) => {
      await this.receive(stream, connection);
    }
  );
}

// Receive method (adapted from ucp2p)
async receive(stream: Stream, connection: Connection): Promise<void> {
  try {
    // 1. Read incoming message with length prefix
    const data = await pipe(
      stream,
      lp.decode,
      async (source: any) => {
        const chunks: Uint8Array[] = [];
        for await (const chunk of source) {
          chunks.push(chunk.subarray());
        }
        return chunks;
      }
    );

    // 2. Decode message
    if (data.length > 0) {
      const messageText = new TextDecoder().decode(data[0]);
      const message: P2PMessage = JSON.parse(messageText);

      // 3. Send acknowledgment response
      const ackBytes = new TextEncoder().encode(JSON.stringify({ status: 'OK' }));
      await pipe([ackBytes], lp.encode, stream);

      // 4. Get sender's peer ID
      const senderPeerId = connection.remotePeer.toString();

      // 5. Dispatch event or call handler
      this.dispatchEvent(new CustomEvent('message', {
        detail: { message, peerId: senderPeerId, connection }
      }));
    }
  } finally {
    await stream.close({ signal: AbortSignal.timeout(5000) });
  }
}
```

### Message Delivery Behavior

**Unicast (Peer-to-Peer)**:
- All P2P messages are sent directly to specific peers
- Messages are NOT broadcast to all connected peers
- Each message requires knowing the recipient's peer ID

**Connection Requirements**:
- Peer must be connected (or connection will be established automatically)
- If direct connection fails, circuit relay fallback is attempted
- No message queuing - failed sends must be retried by caller

**Error Handling**:
- **Peer not found**: Dial fails, throws error
- **Stream creation fails**: Throws error, caller should retry
- **Message too large**: No size limit enforced, but practical limit is ~1MB
- **Invalid JSON**: Receiver logs error and ignores message
- **Unknown method**: Receiver logs error and ignores message

### Implementation Guidance (Following ucp2p)

**Custom LibP2P Service**:
- Create a custom service class extending `TypedEventEmitter<Events>` and implementing `Startable`
- Register service with libp2p in the `services` config object
- Implement `start()`, `afterStart()`, and `stop()` lifecycle methods
- Use `registrar.register()` for topology management
- Use `registrar.handle()` for stream handling

**Stream Management** (Following ucp2p):
- One stream per message (short-lived)
- Use `connection.newStream()` not `dialProtocol()`
- Set `negotiateFully: false` for single protocol
- Always close streams in `finally` blocks
- Use `AbortSignal.timeout()` for timeouts (5 seconds)
- Abort streams on errors with `stream.abort(error)`

**Connection Management** (Following ucp2p):
- Use `connectionManager.openConnection()` to open/reuse connections
- Connection manager handles connection pooling automatically
- Track connected peers via topology `onConnect`/`onDisconnect` callbacks
- Don't create multiple connections to same peer

**Message Framing**:
- Messages are length-prefixed using `it-length-prefixed` (`lp.encode`/`lp.decode`)
- JSON serialization for all messages (NOT protobuf like ucp2p)
- TextEncoder/TextDecoder for UTF-8 encoding
- Include metadata: timestamp, message type, etc.

**Request-Response Pattern** (Following ucp2p):
- Every message gets an acknowledgment response
- Sender waits for ack before closing stream
- Receiver sends ack after processing message
- Request includes `messageId` for application-level correlation
- See "Request-Response Messages" section for details

**Event Dispatching** (Following ucp2p):
- Dispatch events for received messages
- Use `CustomEvent` with typed detail object
- Allows multiple listeners for same message type
- Clean separation between transport and application logic

**Error Handling** (Following ucp2p):
- Always use try/finally for stream cleanup
- Abort streams on error
- Use AbortSignal timeouts to prevent hangs
- Log errors but don't crash on single message failure

## 👥 Friends

### Friend Data Structure

**TypeScript Interface**:
```typescript
interface Friend {
  peerId: string;       // LibP2P peer ID (unique identifier)
  playerName: string;   // Display name for the friend
  notes: string;        // Private notes (not transmitted in messages)
  pending?: boolean;    // Optional: true when friend request is sent but not yet acknowledged
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
- No length limits
- Can be edited by user after friend is added
- Validation: Non-empty, trimmed string

**`notes`** (required, can be empty string):
- Private notes about the friend
- No length limits
- Never transmitted in P2P messages
- For user's reference only
- Validation: Any string (including empty)

**`pending`** (optional):
- When `true`: Friend request has been accepted but not yet acknowledged by original requester
- When `false` or `undefined`: Friendship is fully established
- Set to `true` when accepting a `requestFriend` message
- Cleared to `false` when receiving `acceptFriend` ack
- UI should display pending status (e.g., "Pending..." badge or icon)

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

### New Invitations (Peer Discovery-Based)

**Storage Items**:
- **`pendingNewInvitations`** (Object): keyed by Peer ID user wants to add as friend with value of [state, friend]
  - state is "resend" (the starting value) or "sent"
  - friend is the friend being requested
- **`pendingNewFriendRequests`** (Object): Incoming new friend requests, keyed by peer ID
- **`declinedFriendRequests`** (Object): Declined peer IDs, keyed by peer ID with value `true`

**Behavior**:
- When a peer from `pendingNewInvitations` appears in a broadcast/discovery event:
  - Attempt to connect to the peer
  - Send a `newFriendRequest` message
  - Keep peer ID in `pendingNewInvitations` until accepted
- When receiving a `newFriendRequest` message:
  - immediately send a `friendRequestReceived` message back to the sender
  - If sending peer ID is in `declinedFriendRequests`: ignore silently
  - If sending peer ID is already in friends list: ignore
  - If sending peer ID is not in `pendingNewFriendRequests`: add it and create a newFriendRequest event
- When receiving a `friendRequestReceived` message:
  - add friend to friend list and remove peer from pendingNewInvitations
- All storage items are persisted to localStorage

### Peer connections
don't log peer connections since the peer count display handles that.

#### if a peer connects and its peerId is not in the friends map, add its peerId to the quarantined set

#### when connecting to another peer that has the same external IP as this one, use the internal IP instead

## 🏗️ Deployment Architecture

**Production Deployment**
- **Browser-only application**: Served as static files (HTML, CSS, JS)
- **P2P connectivity**: Direct browser-to-browser via WebRTC and public libp2p infrastructure
- **Bootstrap nodes**: Uses public IPFS bootstrap nodes
- **Circuit relays**: Uses public libp2p relays
- **No custom servers required**: App functions fully without dedicated infrastructure
- **Static hosting**: Can be deployed to any static file host (GitHub Pages, Netlify, S3, etc.)

**Development Environment**
- **Application Server** (Vite dev server)
  - Serves the web application on port 3000 (HTTPS)
  - No P2P infrastructure dependencies
  - Lightweight and focused on app delivery

**No Go Servers Required**
- Previous architecture used Go servers for local testing
- New architecture uses only public infrastructure
- Simpler deployment, maintenance, and testing
- Universal connectivity approach handles NAT traversal via public relays

## 🔧 API Methods

### Core Network Functions
- **`getPeerId()`**: Returns persistent peer ID
- **`addFriend(name, friendPeerId)`**: Adds friend's name and peer ID to persistent storage
- **`getConnectedPeers()`**: Returns array of connected peer ID strings
- **`getConnectedPeerCount()`**: Returns number of currently connected peers

### Implementation Details
- **Network provider interface**: `src/p2p/LibP2PNetworkProvider.ts`
- **Storage integration**: Uses LocalStorageProvider for persistence
- **Error handling**: Graceful degradation when network fails

## P2P App protocol

### How it works
- Peers send messages to each other (see P2P Communication Procedure)
- Connections are authenticated and encrypted (libp2p defaults)
- Connection establishment follows universal-connectivity pattern:
  - WebRTC for direct browser-to-browser connections
  - WebTransport for QUIC-based connections
  - Circuit relay fallback when direct connection fails
  - DCUtR for hole punching and relay upgrade
- DHT for peer discovery
- AutoNAT for NAT detection

### Universal Connectivity Strategy

**Connection Establishment Priority** (following universal-connectivity pattern):
1. **Direct WebRTC**: Try direct peer-to-peer via WebRTC
2. **Direct WebTransport**: Try direct connection via QUIC/WebTransport
3. **Circuit Relay**: Fall back to public circuit relay
4. **Relay Upgrade (DCUtR)**: Attempt to upgrade relay to direct connection

**Peer Discovery Strategy**:
1. **Bootstrap nodes**: Connect to public IPFS bootstrap nodes
2. **DHT**: Use Kademlia DHT for peer routing
3. **Peer exchange**: Learn about peers from connected peers
4. **Manual addresses**: Support direct connection via shared multiaddrs

### Structure of app messages
#### `specs/p2p-messages.md` has the JSON specification for messages.

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

### Resendable Messages

Messages that require reliable delivery with automatic retry until acknowledged.

**Structure** (minimum required fields):
- `messageId`: UUID for tracking (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)
- `sender`: Peer ID of sender
- `target`: Peer ID of recipient
- `method`: The message type/method name
- Additional method-specific fields

**Behavior**:
- Stored in resend storage object indexed by `messageId`
- Periodically resent (e.g., every 10 seconds) until ack received
- Maximum retry attempts or timeout should be configurable
- On receiving ack message:
  1. Call the ack handler function (if provided)
  2. Remove from resend storage **only if handler doesn't fail**
  3. If handler fails, message remains in storage for retry

**Implementation Requirements**:
- Sender maintains resend queue in memory (not persisted)
- Retry timer runs in background
- Ack messages must include the `messageId` from original message
- Message deduplication on receiver side (ignore duplicates with same `messageId`)

**Storage**:
- Resend storage is in-memory only (cleared on page reload)
- Uses `messageId` as key
- Value includes: original message, retry count, next retry time, ack handler

#### P2P Messages

**Friend Request Flow** (using resendable messages):

- **requestFriend** (resendable)
  - Message properties:
    - `messageId`: UUID for tracking
    - `sender`: Sender's peer ID
    - `target`: Target peer ID
    - `method`: "requestFriend"
    - `playerName`: Sender's player name from settings
  - Behavior on sending peer:
    - **CRITICAL: Prevent duplicate resendable messages**
      - Before creating new resendable message, check if one already exists for this target peer
      - Check all existing resendable messages in the resend queue
      - If a `requestFriend` message for the same target peer already exists, skip creating duplicate
      - This prevents multiple retry timers and peer discovery handlers from creating duplicate messages
    - Send requestFriend message to target peer
    - Add to resend storage for automatic retry
  - Behavior on receiving peer:
    1. Check if sender is in ignore list - if yes, silently ignore
    2. **Check for duplicate events** - if there's already a friend request event for this peer (by peerId, not messageId), silently ignore
    3. Check for duplicate messageId - if yes, silently ignore
    4. if the peer is already a friend, continue
    5. if the peer is not yet a friend and there is not already a friend request event for it, create one with three action buttons:
       - **Ignore button**: Removes event, adds peer name and ID to user-editable ignore list
       - **Decline button**: Removes event, sends `declineFriend` message (resendable)
       - **Accept button**: Sends `acceptFriend` message (resendable), adds friend to list with "pending" flag, removes event
    6. Send ack message (with `messageId`) **unless step 5 throws exception**
  - Behavior on receiving ack:
    1. Call ack handler (if provided)
    2. Remove from resend storage **only if handler doesn't fail**
  - **Duplicate Prevention Strategy:**
    - **Sender-side:** Check resend queue before creating new requestFriend message (prevents root cause)
    - **Receiver-side:** Check for existing events by peerId (defense in depth)
    - Together these prevent duplicate events even when multiple discovery mechanisms trigger simultaneously

- **acceptFriend** (resendable)
  - Message properties:
    - `messageId`: UUID for tracking
    - `sender`: Sender's peer ID
    - `target`: Target peer ID (original requester)
    - `method`: "acceptFriend"
  - Behavior on sending peer:
    - Send acceptFriend message
    - Add to resend storage for automatic retry
    - Friend remains marked as "pending" until ack received
  - Behavior on receiving peer:
    1. If friend is in list, clear "pending" flag
    2. Send ack message (with `messageId`) **unless step 1 throws exception**
  - Behavior on receiving ack:
    1. Call ack handler (if provided)
    2. Clear "pending" flag on friend in friends list
    3. Remove from resend storage **only if handler doesn't fail**

- **declineFriend** (resendable)
  - Message properties:
    - `messageId`: UUID for tracking
    - `sender`: Sender's peer ID
    - `target`: Target peer ID (original requester)
    - `method`: "declineFriend"
  - Behavior on sending peer:
    - Send declineFriend message
    - Add to resend storage for automatic retry
  - Behavior on receiving peer:
    1. If friend is in friends list: remove friend, add event notification ("Friend declined your request")
    2. Remove friend from list
    3. Send ack message (with `messageId`) **unless step 1 throws exception**
  - Behavior on receiving ack:
    1. Call ack handler (if provided)
    2. Remove from resend storage **only if handler doesn't fail**

- **ack** (acknowledgment message)
  - Message properties:
    - `messageId`: The messageId from the original resendable message being acknowledged
    - `method`: "ack"
  - Behavior on receiving peer:
    - Look up messageId in resend storage
    - Call ack handler (if provided)
    - Remove from resend storage if handler succeeds
    - If messageId not found, log warning (may be duplicate or late ack)

**Storage Items**:
- **`ignoredPeers`** (Object): Keyed by peer ID, value is `{ peerId: string, peerName: string }`
  - User-editable list shown in settings
  - Can be manually removed by user
  - Checked when receiving `requestFriend` messages

**Connectivity Testing**:

- **ping** (timestamp, messageId)
  - message properties
    - timestamp: Unix timestamp (milliseconds) when ping was sent
    - messageId: Unique message identifier for request-response correlation
  - behavior on receiving peer
    - immediately respond with pong message containing the same timestamp and messageId
    - log the ping receipt (for debugging)
- **pong** (timestamp, messageId)
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

## 📁 File Organization

Following the universal-connectivity reference and SOLID principles:

```
src/p2p/
  ├── index.ts                      # Main exports
  ├── HollowPeer.ts                 # Main HollowPeer class (high-level API)
  ├── LibP2PNetworkProvider.ts      # LibP2P network implementation
  ├── FriendsManager.ts             # Friends management (Single Responsibility)
  ├── LocalStorageProvider.ts       # Storage abstraction (Dependency Inversion)
  ├── IPAddressDetector.ts          # IP detection utilities
  ├── types.ts                      # TypeScript interfaces and types
  └── constants.ts                  # Protocol constants and config

specs/cache/universal-connectivity/  # Reference implementation cache
```

## 🧪 Testing Strategy

**Unit Tests**:
- Test each component in isolation
- Mock dependencies (storage, network)
- Test message handling logic
- Test friend management
- Test invitation generation/validation

**Integration Tests** (Playwright):
- Test multi-tab P2P connectivity
- Test peer discovery via public infrastructure
- Test message exchange between peers
- Test friend request flow
- Test circuit relay fallback
- See `specs/main.tests.md` for detailed test requirements

**Public Infrastructure Testing**:
- Verify connection to public bootstrap nodes
- Verify peer discovery via DHT
- Verify circuit relay fallback
- Verify WebRTC direct connections
- No custom server infrastructure needed

## 🔄 Migration from Previous Architecture

**Changes from previous specs/p2p.md**:
- ✅ **Removed**: Local Go server dependency
- ✅ **Removed**: Custom TURN/STUN servers (not needed with universal-connectivity)
- ✅ **Removed**: Custom circuit relay servers
- ✅ **Removed**: WebTransport dev server configuration
- ✅ **Added**: Public circuit relay usage (via delegated routing)
- ✅ **Added**: Universal connectivity patterns
- ✅ **Added**: DHT-based peer discovery
- ✅ **Added**: DCUtR hole punching
- ✅ **Simplified**: Development and deployment workflow

**Code Migration Path**:
1. Update libp2p configuration to follow universal-connectivity pattern
2. Remove local relay detection/connection code
3. Remove STUN/TURN server configuration (not needed)
4. Add delegated routing for relay discovery
5. Update tests to work without local servers
6. Verify connectivity via public infrastructure
7. Remove Go server code from repository

**Benefits**:
- ✅ No custom server infrastructure required
- ✅ Simpler deployment (static files only)
- ✅ Better scalability (leverage public infrastructure)
- ✅ Easier testing (no local server setup)
- ✅ Lower maintenance burden
- ✅ More reliable (public infrastructure has high uptime)

## 📚 Reference Implementation Details

**Cache the universal-connectivity repository**:
```bash
# Clone to specs/cache for offline reference
cd specs/cache
git clone https://github.com/libp2p/universal-connectivity.git
```

**Key files to reference**:
- `js-peer/src/lib/libp2p.ts` - LibP2P configuration
- `js-peer/src/lib/store.ts` - Message handling
- `js-peer/src/lib/constants.ts` - Protocol constants

**Adapt for Hollow World**:
- Message format: JSON objects (not plain text)
- Protocol: `/hollow-world/1.0.0` (not `/universal-connectivity/...`)
- Storage: localStorage with profile support
- UI: Integrate with existing Hollow World UI
- Testing: Playwright multi-tab tests

## ✅ Implementation Checklist

- [x] Clone universal-connectivity to `specs/cache/` ✅
- [ ] Create `src/p2p/` directory structure
- [ ] Implement LibP2PNetworkProvider following universal-connectivity pattern
- [ ] Configure public bootstrap nodes
- [ ] Add delegated routing for relay discovery
- [ ] Configure WebRTC transport (no STUN config needed)
- [ ] Configure WebTransport transport
- [ ] Configure circuit relay transport
- [ ] Implement JSON message serialization
- [ ] Implement stream handlers
- [ ] Migrate friend management code
- [ ] Update tests for public infrastructure
- [ ] Remove Go server dependencies
- [ ] Verify connectivity via public infrastructure
- [ ] Document deployment process for static hosting
