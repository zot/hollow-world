# CRC Card: HollowPeer

**Source Spec:** p2p.md, p2p-messages.md, friends.md
**Existing Code:** src/p2p/HollowPeer.ts

## Class Responsibilities

### Knows About (Data)
- `networkProvider: INetworkProvider` - Network abstraction (p2p-webapp or mock)
- `friendsManager: IFriendsManager` - Friend data management
- `storageProvider: IStorageProvider` - Storage abstraction
- `eventService: EventService` - Event notification system
- `nickname: string` - User's display name
- `quarantined: Set<string>` - Peers not yet in friends list
- `unsentFriends: Set<string>` - Ephemeral set of peer IDs with unsent friend requests
- `refreshFriendsViewCallback?: callback` - Callback to refresh friends UI
- `messagePrefix: string` - Random prefix for message IDs
- `messageCount: number` - Sequential counter for message IDs
- `pendingResponses: Map<string, callback>` - Request-response correlation
- `resendableMessages: Map<string, storage>` - Queue for reliable message delivery
- `receivedMessageIds: Set<string>` - Deduplication tracker
- `ignoredPeers: Record<string, IIgnoredPeer>` - Peers to ignore

### Does (Behavior)

**Initialization:**
- `initialize()` - Initialize network, load friends, set up handlers, populate unsent set
- `populateUnsentFriendsSet()` - Rebuild unsentFriends from persisted friends with 'unsent' status
- `initializeFriendPresence()` - Set initial online/offline status for all friends

**Friend Management:**
- `addFriend(name, peerId, notes, pending, sendRequest)` - Add friend and optionally send request
- `removeFriend(peerId)` - Remove friend from list
- `getFriend(peerId)` - Get friend data
- `getAllFriends()` - Get all friends
- `getFriendsManager()` - Get FriendsManager instance

**Presence Tracking:**
- `updateFriendPresence(peerId, isOnline)` - Update friend's online/offline status
- `handlePeerConnection(peerId)` - Handle peer joining (update presence, retry unsent requests)
- `handlePeerDisconnection(peerId)` - Handle peer leaving (update presence)

**Message Handling:**
- `handleMessage(peerId, message)` - Route incoming messages by method
- `handleRequestFriend(peerId, message)` - Process friend request (ban check, mutual acceptance, event creation)
- `handlePing(peerId, message)` - Respond to ping with pong
- `handlePong(peerId, message)` - Process pong response (calculate RTT, invoke handler)

**Message Sending:**
- `sendMessage(peerId, message)` - Send P2P message via network provider
- `sendRequestFriend(peerId, playerName)` - Send friend request (resendable)
- `sendFriendResponse(peerId, accept)` - Accept friend request (send mutual requestFriend)

**Request-Response Pattern:**
- `generateMessageId()` - Generate unique message ID
- `generateRandomPrefix()` - Generate random prefix for message IDs

**Resendable Messages (Stubborn Delivery):**
- `loadResendableMessages()` - Load queued messages from storage
- `persistResendableMessages()` - Save queue to storage
- `addResendableMessage(message, ackHandler)` - Add message to retry queue
- `startResendTimer()` - Start periodic retry processor
- `processResendQueue()` - Retry messages that are due
- `handleAckMessage(peerId, message)` - Process ack, invoke handler, remove from queue
- `sendAck(peerId, messageId)` - Send ack for received resendable message
- `isMessageDuplicate(messageId)` - Check if message already received

**Quarantine Management:**
- `getQuarantined()` - Get quarantined peers (not in friends list)
- `isQuarantined(peerId)` - Check if peer is quarantined
- `removeFromQuarantine(peerId)` - Remove peer from quarantine

**Ignored Peers:**
- `getIgnoredPeers()` - Get ignored peers
- `addIgnoredPeer(peerId, name)` - Add peer to ignore list
- `removeIgnoredPeer(peerId)` - Remove peer from ignore list
- `persistIgnoredPeers()` - Save ignore list to storage

**Accessors:**
- `getPeerId()` - Get own peer ID
- `getNetworkProvider()` - Get network provider
- `getConnectedPeers()` - Get list of connected peers
- `getConnectedPeerCount()` - Get count of connected peers
- `getNickname()` / `setNickname()` - Get/set user nickname
- `getEventService()` - Get event service
- `setRefreshFriendsViewCallback(callback)` - Set UI refresh callback

## Collaborators

**Uses:**
- **INetworkProvider** (src/p2p/P2PWebAppNetworkProvider.ts) - Network abstraction for sending/receiving messages
- **FriendsManager** (src/p2p/FriendsManager.ts) - Friend data storage and retrieval
- **IStorageProvider** (src/p2p/LocalStorageProvider.ts) - Persistent storage
- **EventService** (src/services/EventService.ts) - Friend request event creation

**Used By:**
- **main.ts** - Initializes HollowPeer on app startup
- **FriendsView** (src/ui/FriendsView.ts) - Friend UI operations
- **CharacterEditorView** (src/ui/CharacterEditorView.ts) - World sharing operations

## Design Patterns

**Facade Pattern**: Provides high-level API hiding P2P complexity
**Strategy Pattern**: INetworkProvider allows swapping P2P implementations
**Observer Pattern**: Event callbacks for UI reactivity
**Dependency Inversion**: Depends on interfaces (INetworkProvider, IFriendsManager, IStorageProvider)
**Single Responsibility**: Coordinates P2P operations, delegates data to FriendsManager

## Key Design Decisions

1. **Stubborn Friend Requests**: Auto-retry unsent requests when peer comes online
2. **Ephemeral unsentFriends Set**: Rebuilt from persisted data on startup (avoids cache inconsistency)
3. **Single Source of Truth**: Always fetch friend data from FriendsManager, not from cache
4. **Request-Response Pattern**: Message correlation via messageId for ping/pong
5. **Resendable Messages**: Reliable delivery with retry queue and ack mechanism
6. **Ban Check First**: handleRequestFriend checks ban list before processing
7. **Mutual Acceptance**: When both peers send requestFriend, both clear pending flags
8. **Presence Tracking**: Non-persisted runtime field updated on peer join/leave
9. **Quarantine for Non-Friends**: Peers not in friends list are tracked separately
10. **Peer Unreachability is Normal**: Failed sends log info, not errors (don't throw)

## Testing

**Test File:** test/HollowIPeer.test.ts (interface tests)

**Key Tests:**
- Initialize with mock network provider
- Add/remove friends
- Send/receive friend requests
- Mutual friend acceptance
- Ban peer handling (silently ignore requests)
- Stubborn request retry on peer connect
- Presence updates on peer join/leave
- Message routing (ping/pong, requestFriend)
- Resendable message queue
- Quarantine management
