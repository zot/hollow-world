# 🌐 P2P Networking Specification

**Peer-to-peer API for the Hollow World game**

*Based on [`../CLAUDE.md`](../CLAUDE.md)*

## 🎯 Core Requirements
- Use **SOLID principles** in all implementations
- Create comprehensive **unit tests** for all components
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*

## 🔧 Technology Stack
- **LibP2P** - Decentralized networking protocol
  - gossipsub - For Pubsub communication, info [here](https://libp2p.github.io/js-libp2p/modules/_libp2p_gossipsub.html)
  - js-libp2p's webrtc - for direct communication
- **Helia** - IPFS implementation for data storage

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

## Communications

see coms.md for details

## Friends
### each friend has
- peer id
- player name
- notes: private notes on that friend (not sent in any messages)

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
#### if a peer connects and its peerId is not in the friends map, add its peerId to the quarantined set
#### when connecting to another peer that has the same external IP as this one, use the internal IP instead
#### STUN servers
- copy validated-public-servers.json to public/assets
  - just the STUN list
    - URL and responseTime only

## 🔧 API Methods

### Core Network Functions
- **`getPeerId()`**: Returns persistent peer ID
- **`addFriend(name, friendPeerId)`**: Adds friend's name and peer ID to persistent storage
- **`getConnectedPeers()`**: Returns array of connected peer ID strings
- **`getConnectedPeerCount()`**: Returns number of currently connected peers

### Peer Connection Monitoring
- **Startup Logging**: After initialization, HollowPeer logs connected peers
  - Logs immediately after initialization
  - Logs every 10 seconds for the first minute
  - Console format: `🔗 Connected peers (N): [peer IDs...]` or `🔗 Connected peers (0): None`
- **Purpose**: Helps debugging peer connectivity issues and monitoring network health

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
