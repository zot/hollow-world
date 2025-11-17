# Test Design: P2PSystem

**Component:** P2P System (HollowPeer, P2PWebAppNetworkProvider, FriendsManager)
**CRC References:** crc-HollowPeer.md, crc-P2PWebAppNetworkProvider.md, crc-FriendsManager.md, crc-HollowIPeer.md
**Spec Reference:** specs/p2p.md, specs/p2p-messages.md, specs/friends.md
**Implementation Test:** test/HollowIPeer.test.ts, test/FriendsManager.test.ts, test/world-connections.test.ts

## Component Overview

P2P System enables peer-to-peer communication via WebSocket server. Supports multi-peer connections, friend management, presence tracking, and world sharing. Uses event-driven architecture with NO dialogs for P2P operations.

## Test Categories

### Unit Tests - HollowPeer

#### Initialization Tests

**Test Case: Initialize Peer**
- Purpose: Verify peer initialization
- Setup: P2P server running
- Input: Create new HollowPeer instance
- Expected: Peer initialized with unique ID
- Related CRC: crc-HollowPeer.md (constructor)
- Implementation: test/HollowIPeer.test.ts (line 14-20)

**Test Case: Get Peer ID**
- Purpose: Verify peer ID retrieval
- Setup: Peer initialized
- Input: Call getPeerId()
- Expected: Returns unique peer ID string
- Related CRC: crc-HollowPeer.md (getPeerId)
- Implementation: test/HollowIPeer.test.ts (line 22-28)

#### Connection Tests

**Test Case: Connect to Server**
- Purpose: Verify WebSocket connection
- Setup: P2P server running
- Input: Call connect()
- Expected: WebSocket connected, connection event fired
- Related CRC: crc-HollowPeer.md (connect)
- Related Sequence: seq-establish-p2p-connection.md

**Test Case: Disconnect from Server**
- Purpose: Verify clean disconnection
- Setup: Connected peer
- Input: Call disconnect()
- Expected: WebSocket closed, disconnection event fired
- Related CRC: crc-HollowPeer.md (disconnect)

**Test Case: Auto-Reconnect**
- Purpose: Verify reconnection on connection loss
- Setup: Connected peer, server disconnects
- Input: Server closes connection
- Expected: Peer attempts reconnection
- Related CRC: crc-HollowPeer.md (handleDisconnect)

**Test Case: Connection Timeout**
- Purpose: Verify handling of connection timeout
- Setup: P2P server unavailable
- Input: Attempt connection
- Expected: Timeout error, connection failed event
- Related CRC: crc-HollowPeer.md

#### Message Sending Tests

**Test Case: Send Message to Peer**
- Purpose: Verify peer-to-peer messaging
- Setup: Two connected peers
- Input: Peer A sends message to Peer B
- Expected: Peer B receives message
- Related CRC: crc-HollowPeer.md (sendToPeer)
- Related Sequence: seq-send-receive-p2p-message.md
- Implementation: test/HollowIPeer.test.ts (line 30-45)

**Test Case: Broadcast Message**
- Purpose: Verify broadcast to all peers
- Setup: Multiple connected peers
- Input: Peer A broadcasts message
- Expected: All peers receive message
- Related CRC: crc-HollowPeer.md (broadcast)

**Test Case: Send to Offline Peer**
- Purpose: Verify handling of offline peer
- Setup: Peer A connected, Peer B offline
- Input: Send message to Peer B
- Expected: Error or queued message
- Related CRC: crc-HollowPeer.md

**Test Case: Message Serialization**
- Purpose: Verify message JSON serialization
- Setup: Connected peers
- Input: Send complex message object
- Expected: Message serialized and deserialized correctly
- Related CRC: crc-HollowPeer.md
- Related Spec: specs/p2p-messages.md

#### Message Receiving Tests

**Test Case: Receive Message**
- Purpose: Verify message reception
- Setup: Two connected peers
- Input: Receive message from peer
- Expected: Message event fired with correct data
- Related CRC: crc-HollowPeer.md (handleMessage)
- Implementation: test/HollowIPeer.test.ts (line 47-65)

**Test Case: Message Event Listener**
- Purpose: Verify event listener registration
- Setup: Peer initialized
- Input: Register onMessage listener
- Expected: Listener called when message received
- Related CRC: crc-HollowPeer.md (on)

**Test Case: Multiple Message Handlers**
- Purpose: Verify multiple listeners work
- Setup: Peer initialized
- Input: Register 3 message handlers
- Expected: All 3 called when message received
- Related CRC: crc-HollowPeer.md

### Unit Tests - P2PWebAppNetworkProvider

**Test Case: Initialize Network Provider**
- Purpose: Verify provider initialization
- Setup: None
- Input: Create provider with server URL
- Expected: Provider ready to connect
- Related CRC: crc-P2PWebAppNetworkProvider.md (constructor)

**Test Case: Get Server URL**
- Purpose: Verify server URL configuration
- Setup: Provider initialized
- Input: Get server URL
- Expected: Returns configured WebSocket URL
- Related CRC: crc-P2PWebAppNetworkProvider.md

**Test Case: Create Peer Instance**
- Purpose: Verify peer creation through provider
- Setup: Provider initialized
- Input: Call createPeer()
- Expected: HollowPeer instance created
- Related CRC: crc-P2PWebAppNetworkProvider.md (createPeer)

**Test Case: Get Network Status**
- Purpose: Verify network status reporting
- Setup: Provider connected
- Input: Call getStatus()
- Expected: Returns connection status (connected/disconnected)
- Related CRC: crc-P2PWebAppNetworkProvider.md

### Unit Tests - FriendsManager

**Test Case: Add Friend**
- Purpose: Verify adding friend by peer ID
- Setup: FriendsManager initialized
- Input: Call addFriend(peerId, playerName, notes)
- Expected: Friend added to list
- Related CRC: crc-FriendsManager.md (addFriend)
- Implementation: test/FriendsManager.test.ts (line 89-105)

**Test Case: Get Friend**
- Purpose: Verify retrieving friend by peer ID
- Setup: Friends in storage
- Input: Call getFriend(peerId)
- Expected: Returns friend object
- Related CRC: crc-FriendsManager.md (getFriend)
- Implementation: test/FriendsManager.test.ts (line 103-105)

**Test Case: Get All Friends**
- Purpose: Verify retrieving all friends
- Setup: Multiple friends
- Input: Call getFriends()
- Expected: Returns array of all friends
- Related CRC: crc-FriendsManager.md (getFriends)

**Test Case: Delete Friend**
- Purpose: Verify removing friend
- Setup: Friend in list
- Input: Call deleteFriend(peerId)
- Expected: Friend removed from list
- Related CRC: crc-FriendsManager.md (deleteFriend)

**Test Case: Update Friend Presence**
- Purpose: Verify presence tracking
- Setup: Friend in list
- Input: Update presence to online
- Expected: Friend status updated
- Related CRC: crc-FriendsManager.md (updateFriendPresence)
- Related Sequence: seq-friend-presence-update.md

**Test Case: Add Friend World**
- Purpose: Verify tracking friend's worlds
- Setup: Friend in list
- Input: Call addFriendWorld(peerId, world)
- Expected: World added to friend's worlds array
- Related CRC: crc-FriendsManager.md (addFriendWorld)
- Implementation: test/FriendsManager.test.ts (line 92-106)

**Test Case: Get Friend Worlds**
- Purpose: Verify retrieving friend's worlds
- Setup: Friend with worlds
- Input: Call getFriendWorlds(peerId)
- Expected: Returns array of friend's worlds
- Related CRC: crc-FriendsManager.md (getFriendWorlds)
- Implementation: test/FriendsManager.test.ts (line 329-356)

**Test Case: Friends Persistence**
- Purpose: Verify friends saved to storage
- Setup: Add friends
- Input: Create new FriendsManager instance
- Expected: Friends loaded from storage
- Related CRC: crc-FriendsManager.md (loadFriends, saveFriends)
- Implementation: test/FriendsManager.test.ts (line 484-527)

### Integration Tests

**Test Case: Peer-to-Peer Message Exchange**
- Purpose: Verify complete message flow
- Setup: Two connected peers
- Input: Peer A sends message to Peer B, Peer B replies
- Expected: Both messages received correctly
- Related CRC: crc-HollowPeer.md, crc-P2PWebAppNetworkProvider.md
- Related Sequence: seq-send-receive-p2p-message.md

**Test Case: Friend Connection Workflow**
- Purpose: Verify adding and connecting to friend
- Setup: Two peers with peer IDs
- Input: Peer A adds Peer B as friend, sends message
- Expected: Friend added, message sent successfully
- Related CRC: crc-FriendsManager.md, crc-HollowPeer.md
- Related Sequence: seq-add-friend-by-peerid.md

**Test Case: World Sharing Workflow**
- Purpose: Verify sharing world with friend
- Setup: Peer A hosting world, Peer B is friend
- Input: Peer A shares world, Peer B receives notification
- Expected: World appears in Peer B's friend worlds list
- Related CRC: crc-FriendsManager.md, crc-WorldConnections.md
- Implementation: test/world-connections.test.ts

**Test Case: Multi-Peer Session**
- Purpose: Verify multiple peers in same session
- Setup: 3 connected peers
- Input: All peers send messages
- Expected: All messages routed correctly
- Related CRC: crc-HollowPeer.md
- Related Spec: specs/p2p.md (Multi-peer support)

### E2E Tests

**Test Case: Multi-Tab P2P Communication**
- Purpose: Verify P2P between browser tabs
- Setup: Two browser tabs with different profiles
- Input: Tab 1 sends message to Tab 2
- Expected: Message received in Tab 2
- Test Type: Playwright E2E (multi-tab)

**Test Case: Add Friend in UI**
- Purpose: Verify complete add friend workflow
- Setup: Two tabs with peer IDs
- Input: Tab 1 adds Tab 2's peer ID via UI
- Expected: Friend appears in Tab 1's friends list
- Test Type: Playwright E2E

**Test Case: Friend Presence in UI**
- Purpose: Verify presence badge updates
- Setup: Two tabs, Tab 1 has Tab 2 as friend
- Input: Tab 2 connects/disconnects
- Expected: Presence badge updates in Tab 1
- Test Type: Playwright E2E

**Test Case: World Sharing in UI**
- Purpose: Verify world sharing via UI
- Setup: Two tabs, Tab 1 hosting world
- Input: Tab 1 shares world, Tab 2 sees notification
- Expected: World notification badge in Tab 2
- Test Type: Playwright E2E

### Edge Cases

**Test Case: Server Unavailable**
- Purpose: Verify handling when server down
- Setup: P2P server stopped
- Input: Attempt connection
- Expected: Error handled gracefully, retry logic
- Related CRC: crc-HollowPeer.md

**Test Case: Invalid Peer ID**
- Purpose: Verify handling of malformed peer ID
- Setup: Connected peer
- Input: Send message to invalid peer ID
- Expected: Error returned, no crash
- Related CRC: crc-HollowPeer.md

**Test Case: Large Message**
- Purpose: Verify handling of large messages
- Setup: Connected peers
- Input: Send 1MB message
- Expected: Message sent successfully or error if too large
- Related CRC: crc-HollowPeer.md

**Test Case: Rapid Message Sending**
- Purpose: Verify handling of message flooding
- Setup: Connected peers
- Input: Send 100 messages rapidly
- Expected: All messages delivered or rate limited
- Related CRC: crc-HollowPeer.md

**Test Case: Peer Disconnects During Message**
- Purpose: Verify handling of mid-message disconnect
- Setup: Peers connected
- Input: Peer B disconnects while Peer A sending
- Expected: Error handled, message lost gracefully
- Related CRC: crc-HollowPeer.md

**Test Case: Duplicate Friend**
- Purpose: Verify handling of duplicate friend addition
- Setup: Friend already exists
- Input: Add same peer ID again
- Expected: Error or friend updated
- Related CRC: crc-FriendsManager.md
- Implementation: test/FriendsManager.test.ts (implied)

**Test Case: Concurrent Friend Updates**
- Purpose: Verify handling of simultaneous updates
- Setup: Friends in multiple tabs
- Input: Update friend in both tabs
- Expected: Last update wins, no corruption
- Related CRC: crc-FriendsManager.md

**Test Case: Network Partition**
- Purpose: Verify handling of network split
- Setup: Connected peers, network interrupted
- Input: Attempt communication during partition
- Expected: Messages queued or error, reconnect after
- Related CRC: crc-HollowPeer.md

## Coverage Goals

- Test HollowPeer (connect, disconnect, send, receive, events)
- Test P2PWebAppNetworkProvider (initialization, peer creation, status)
- Test FriendsManager (add, delete, presence, worlds, persistence)
- Test message serialization and protocols
- Test integration between components
- Test multi-peer scenarios
- Test NO dialogs for P2P operations (event badges only)
- E2E multi-tab tests for real P2P scenarios
- Test edge cases (server down, invalid IDs, large messages, network issues)

## Notes

- P2P uses WebSocket server (p2p-webapp binary)
- Multi-peer support (one server, many clients)
- Each browser tab = unique peer with unique ID
- NO dialogs for P2P operations (per UI spec - use badges/events)
- Event-driven architecture (presence updates, world notifications)
- Friends data isolated per profile
- Message protocol defined in specs/p2p-messages.md
- Multi-tab testing requires Playwright E2E tests
- Server CLI documented in specs/p2p-webapp-cli.md
- Implementation tests exist: test/HollowIPeer.test.ts, test/FriendsManager.test.ts, test/world-connections.test.ts
