#!/bin/bash

# Script to convert Phase 3 & 4 P2P sequence diagrams to PlantUML ASCII format
# Uses the plantuml skill to generate proper ASCII art
#
# NOTE: This is a FALLBACK approach for batch conversions without Claude interaction.
#
# RECOMMENDED APPROACH: Use the diagram-converter agent instead:
#   - Properly invokes plantuml skill via Claude's Skill tool
#   - Has reasoning capabilities for complex conversions
#   - Integrated with Claude Code tooling
#   - See .claude/agents/diagram-converter.md
#
# USE THIS SCRIPT ONLY WHEN:
#   - You need batch conversion without Claude interaction
#   - Agent approach is unavailable
#   - You're running in CI/CD or automation
#
# This script directly calls plantuml.sh, bypassing the skill system.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SPECS_CRC_DIR="$PROJECT_ROOT/design"
SCRATCH_DIR="$PROJECT_ROOT/.claude/scratch"

echo "=== Converting P2P Sequence Diagrams to PlantUML ASCII ==="
echo ""

# Create scratch directory if it doesn't exist
mkdir -p "$SCRATCH_DIR"

# Function to generate PlantUML ASCII and save to file
generate_diagram() {
    local puml_file="$1"
    local output_file="$2"

    "$SCRIPT_DIR/../skills/plantuml.sh" sequence < "$puml_file" > "$output_file"
}

# ============================================================================
# seq-send-receive-p2p-message.md (ALREADY DONE)
# ============================================================================
echo "✅ seq-send-receive-p2p-message.md (already converted)"
echo ""

# ============================================================================
# seq-friend-presence-update.md
# ============================================================================
echo "Converting seq-friend-presence-update.md..."

# Diagram 1: Initial Presence Initialization
cat > "$SCRATCH_DIR/presence-init.puml" << 'EOF'
@startuml
participant "main.ts" as Main
participant "HollowPeer" as HP
participant "P2PWebAppNetworkProvider" as Provider
participant "P2PWebAppClient" as Client
participant "FriendsManager" as FM

Main -> HP: initialize()
HP -> Provider: initialize()
note right of Provider: WebSocket connected, peer initialized, subscribed to topic

Provider -> Client: listPeers(topic)
Client --> Provider: Array of peer IDs
Provider -> Provider: connectedPeers = new Set(peers)

HP -> HP: initializeFriendPresence()
HP -> Provider: getConnectedPeers()
Provider --> HP: Array of connected peer IDs

HP -> FM: getAllFriends()
FM --> HP: Map<peerId, IFriend>

loop For each friend in friends list
    HP -> HP: Check if friend.peerId in connectedPeers array
    alt Peer is online
        HP -> HP: Log "Friend ${playerName} is online"
        HP -> FM: updateFriend(peerId, {...friend, presence: true})
        FM -> FM: friends.set(peerId, updatedFriend)
        note right of FM: NOT persisted - runtime only
        FM -> FM: notifyUpdateListeners(peerId, updatedFriend)
    else Peer is offline
        HP -> HP: Log "Friend ${playerName} is offline"
        HP -> FM: updateFriend(peerId, {...friend, presence: false})
        FM -> FM: friends.set(peerId, updatedFriend)
        note right of FM: NOT persisted - runtime only
        FM -> FM: notifyUpdateListeners(peerId, updatedFriend)
    end
end

note over HP,FM: All friends now have presence field initialized (true or false)
@enduml
EOF

# Diagram 2: Peer Join Event
cat > "$SCRATCH_DIR/presence-join.puml" << 'EOF'
@startuml
participant "P2PWebAppClient" as Client
participant "P2PWebAppNetworkProvider" as Provider
participant "HollowPeer" as HP
participant "FriendsManager" as FM
participant "EventService" as ES
participant "FriendsView" as FV

note over Client,FV: Remote peer joins the 'hollow-world' pubsub topic

Client -> Client: Detect peer joined event
Client -> Provider: peerChangeHandler(peerId, true)
Provider -> Provider: handlePeerJoined(peerId)
Provider -> Provider: connectedPeers.add(peerId)
Provider -> Provider: Log "Peer joined: ${peerId}"

Provider -> HP: peerConnectHandler(peerId)
HP -> HP: handlePeerConnection(peerId)

HP -> HP: updateFriendPresence(peerId, true)
HP -> FM: getFriend(peerId)
FM --> HP: friend or undefined

alt Peer is a friend
    HP -> HP: Log "Friend ${playerName} came online"
    HP -> FM: updateFriend(peerId, {...friend, presence: true})
    FM -> FM: friends.set(peerId, updatedFriend)
    note right of FM: NOT persisted - runtime only
    FM -> FM: notifyUpdateListeners(peerId, updatedFriend)

    FM -> FV: Update listener callback
    FV -> FV: refreshView()
    FV -> FV: Re-render with 🟢 online indicator
    note right of FV: UI now shows friend as online

    HP -> ES: emit('friendPresenceChanged', {peerId, presence: true})
    note right of ES: Other components can subscribe to this event
else Peer is not a friend
    HP -> HP: Log "Non-friend peer connected: ${peerId}"
    note right of HP: No presence update needed
end

HP -> HP: Check if peerId in unsentFriends set
alt Peer has unsent friend request
    HP -> HP: Auto-retry sending friend request
    note right of HP: Stubborn delivery - retry when peer comes online
end
@enduml
EOF

# Diagram 3: Peer Leave Event
cat > "$SCRATCH_DIR/presence-leave.puml" << 'EOF'
@startuml
participant "P2PWebAppClient" as Client
participant "P2PWebAppNetworkProvider" as Provider
participant "HollowPeer" as HP
participant "FriendsManager" as FM
participant "EventService" as ES
participant "FriendsView" as FV

note over Client,FV: Remote peer leaves the 'hollow-world' pubsub topic

Client -> Client: Detect peer left event
Client -> Provider: peerChangeHandler(peerId, false)
Provider -> Provider: handlePeerLeft(peerId)
Provider -> Provider: connectedPeers.delete(peerId)
Provider -> Provider: Log "Peer left: ${peerId}"

Provider -> HP: peerDisconnectHandler(peerId)
HP -> HP: handlePeerDisconnection(peerId)

HP -> HP: updateFriendPresence(peerId, false)
HP -> FM: getFriend(peerId)
FM --> HP: friend or undefined

alt Peer is a friend
    HP -> HP: Log "Friend ${playerName} went offline"
    HP -> FM: updateFriend(peerId, {...friend, presence: false})
    FM -> FM: friends.set(peerId, updatedFriend)
    note right of FM: NOT persisted - runtime only
    FM -> FM: notifyUpdateListeners(peerId, updatedFriend)

    FM -> FV: Update listener callback
    FV -> FV: refreshView()
    FV -> FV: Re-render with ⚫ offline indicator
    note right of FV: UI now shows friend as offline

    HP -> ES: emit('friendPresenceChanged', {peerId, presence: false})
else Peer is not a friend
    HP -> HP: Log "Non-friend peer disconnected: ${peerId}"
    note right of HP: No presence update needed
end

HP -> HP: Clean up any in-flight messages to this peer
note right of HP: Remove from resendable queue if present
@enduml
EOF

echo "  - Generating diagram 1: Initial Presence Initialization..."
generate_diagram "$SCRATCH_DIR/presence-init.puml" "$SCRATCH_DIR/presence-init.txt"

echo "  - Generating diagram 2: Peer Join Event..."
generate_diagram "$SCRATCH_DIR/presence-join.puml" "$SCRATCH_DIR/presence-join.txt"

echo "  - Generating diagram 3: Peer Leave Event..."
generate_diagram "$SCRATCH_DIR/presence-leave.puml" "$SCRATCH_DIR/presence-leave.txt"

echo "  - Assembling file..."
cat > "$SPECS_CRC_DIR/seq-friend-presence-update.md" << 'HEADER'
# Sequence: Friend Presence Update

**Source Spec:** specs/friends.md, specs/p2p.md
**Existing Code:** src/p2p/HollowPeer.ts, src/p2p/P2PWebAppNetworkProvider.ts

## Participants

- **P2PWebAppClient** (src/p2p/client/client.js)
- **P2PWebAppNetworkProvider** (src/p2p/P2PWebAppNetworkProvider.ts)
- **HollowPeer** (src/p2p/HollowPeer.ts)
- **FriendsManager** (src/p2p/FriendsManager.ts)
- **EventService** (src/services/EventService.ts)
- **FriendsView** (src/ui/FriendsView.ts)

## Initial Presence Initialization (App Startup)

```
HEADER

cat "$SCRATCH_DIR/presence-init.txt" >> "$SPECS_CRC_DIR/seq-friend-presence-update.md"

cat >> "$SPECS_CRC_DIR/seq-friend-presence-update.md" << 'MIDDLE1'
```

## Peer Join Event (Friend Comes Online)

```
MIDDLE1

cat "$SCRATCH_DIR/presence-join.txt" >> "$SPECS_CRC_DIR/seq-friend-presence-update.md"

cat >> "$SPECS_CRC_DIR/seq-friend-presence-update.md" << 'MIDDLE2'
```

## Peer Leave Event (Friend Goes Offline)

```
MIDDLE2

cat "$SCRATCH_DIR/presence-leave.txt" >> "$SPECS_CRC_DIR/seq-friend-presence-update.md"

cat >> "$SPECS_CRC_DIR/seq-friend-presence-update.md" << 'FOOTER'
```

## App Restart (Presence Reset)

**Flow:**
- User closes browser tab → All presence data LOST (non-persisted)
- User reopens browser tab → `main.ts` calls `HollowPeer.initialize()`
- `FriendsManager.loadFriends()` loads friends WITHOUT presence field (undefined)
- `HollowPeer.initializeFriendPresence()` rebuilds presence from current connectedPeers set

## Presence Field Characteristics

**Key Properties:**
- **Runtime Only**: NEVER persisted to storage
- **Initialized on Startup**: Set based on connectedPeers at init time
- **Updated on Events**: Changed when peers join/leave topic
- **Stale-Proof**: Always reflects current network state (no stale data)
- **Optional Field**: Can be undefined before initialization
- **Three States**: undefined (not initialized) | true (online) | false (offline)

## Spec Intent

Matches spec requirements:
- **Non-Persistent Presence**: Runtime-only field avoids stale data
- **Initialization on Startup**: Set from connectedPeers at init
- **Event-Driven Updates**: Updated on peer join/leave events
- **UI Reactivity**: Observer pattern notifies FriendsView
- **Event Emission**: friendPresenceChanged for other components
- **Friend-Only Tracking**: Only update presence for actual friends
- **Stale-Free Design**: Always reflects current network state

## Analysis

### Correctly Implemented ✅

1. **Non-Persistent Design**: Presence NOT saved to storage (avoids stale data)
2. **Initialization on Startup**: initializeFriendPresence() rebuilds from network
3. **Event-Driven Updates**: Peer join/leave events trigger presence changes
4. **Observer Pattern**: Update listeners notify UI of changes
5. **Event Service**: friendPresenceChanged event for decoupled components
6. **Friend Filtering**: Only track presence for actual friends
7. **Three-State Logic**: undefined, true, false (clear semantics)
8. **UI Indicators**: 🟢 online, ⚫ offline badges in FriendsView

### Key Design Decision

**Why Non-Persistent?**
- If persisted, could show stale online/offline status
- Network state changes while app is closed
- Rebuilding from live network state ensures accuracy
- Small performance cost (one listPeers call at startup)
- Big reliability gain (no stale presence indicators)

### No Issues Found

Presence tracking design is excellent - non-persistent field prevents stale state issues.
FOOTER

echo "  ✅ seq-friend-presence-update.md updated"
echo ""

# ============================================================================
# seq-friend-status-change.md
# ============================================================================
echo "Converting seq-friend-status-change.md..."

# Diagram 1: One-Way Friend Request
cat > "$SCRATCH_DIR/friend-request.puml" << 'EOF'
@startuml
participant "Peer A\n(Alice)" as A
participant "HollowPeer A" as HPA
participant "FriendsManager A" as FMA
participant "P2PWebAppNetworkProvider A" as ProviderA
participant "P2PWebAppClient A" as ClientA
participant "Peer B\n(Bob)" as B

A -> HPA: addFriend("Bob", bobPeerId, "notes")
HPA -> FMA: addFriend({playerName: "Bob", peerId: bobPeerId, pending: 'unsent'})
FMA -> FMA: friends.set(bobPeerId, friend)
FMA -> FMA: persistFriends()
FMA --> HPA: Friend added

HPA -> HPA: unsentFriends.add(bobPeerId)
note right of HPA: {method: 'requestFriend', playerName: 'Alice'}
HPA -> HPA: Create IRequestFriendMessage

HPA -> ProviderA: sendMessage(bobPeerId, requestFriendMessage, onAck)
ProviderA -> ClientA: client.send(bobPeerId, protocol, message, ackHandler)
ClientA -> B: Send requestFriend via libp2p

alt Message delivered successfully
    ClientA -> ProviderA: Ack handler fires
    ProviderA -> HPA: onAck() callback
    HPA -> FMA: getFriend(bobPeerId)
    FMA --> HPA: current friend data
    HPA -> HPA: Check if pending still 'unsent'
    HPA -> FMA: updateFriend(bobPeerId, {..., pending: 'pending'})
    FMA -> FMA: persistFriends()
    FMA -> FMA: notifyUpdateListeners()
    HPA -> HPA: unsentFriends.delete(bobPeerId)
    note right of HPA: Status changed to 'pending' ⏳
else Message not delivered
    note right of HPA: Friend stays pending: 'unsent' 📤\nWill auto-retry when Bob comes online
end
@enduml
EOF

# Diagram 2: Bob Receives Friend Request
cat > "$SCRATCH_DIR/friend-receive.puml" << 'EOF'
@startuml
participant "P2PWebAppClient B" as ClientB
participant "P2PWebAppNetworkProvider B" as ProviderB
participant "HollowPeer B" as HPB
participant "FriendsManager B" as FMB

ClientB -> ProviderB: messageHandler(alicePeerId, data)
ProviderB -> HPB: messageHandler callback
HPB -> HPB: handleMessage(alicePeerId, requestFriendMessage)
HPB -> HPB: Validate message.method === 'requestFriend'

HPB -> FMB: isBanned(alicePeerId)
FMB --> HPB: false

HPB -> FMB: getFriend(alicePeerId)
FMB --> HPB: undefined (Alice not in Bob's list yet)

alt Alice not in Bob's friends list
    HPB -> HPB: Fire friendRequest event
    HPB -> HPB: eventService.emit('friendRequest', {peerId: alicePeerId, playerName: 'Alice'})
    note right of HPB: UI can show notification/toast

    HPB -> FMB: addFriend({playerName: 'Alice', peerId: alicePeerId, pending: 'pending'})
    FMB -> FMB: persistFriends()
    FMB -> FMB: notifyUpdateListeners()
    note right of FMB: Alice added to Bob's list with pending: 'pending' ⏳
end
@enduml
EOF

# Diagram 3: Mutual Acceptance
cat > "$SCRATCH_DIR/friend-mutual.puml" << 'EOF'
@startuml
participant "Peer B\n(Bob)" as B
participant "HollowPeer B" as HPB
participant "FriendsManager B" as FMB
participant "P2PWebAppNetworkProvider B" as ProviderB
participant "P2PWebAppClient B" as ClientB
participant "Peer A\n(Alice)" as A
participant "P2PWebAppClient A" as ClientA
participant "P2PWebAppNetworkProvider A" as ProviderA
participant "HollowPeer A" as HPA
participant "FriendsManager A" as FMA

B -> HPB: User clicks "Accept Friend Request" (or manually adds Alice)
HPB -> FMB: getFriend(alicePeerId)
FMB --> HPB: friend (with pending: 'pending')

note right of HPB: {method: 'requestFriend', playerName: 'Bob'}
HPB -> HPB: Create IRequestFriendMessage

HPB -> ProviderB: sendMessage(alicePeerId, requestFriendMessage)
ProviderB -> ClientB: client.send(alicePeerId, protocol, message)
ClientB -> A: Send requestFriend

note over A,FMA: Alice receives Bob's requestFriend message

ClientA -> ProviderA: messageHandler(bobPeerId, data)
ProviderA -> HPA: messageHandler callback
HPA -> HPA: handleMessage(bobPeerId, requestFriendMessage)

HPA -> FMA: isBanned(bobPeerId)
FMA --> HPA: false

HPA -> FMA: getFriend(bobPeerId)
FMA --> HPA: friend (with pending: 'pending')

alt Friend exists with pending flag
    HPA -> HPA: MUTUAL ACCEPTANCE DETECTED!
    HPA -> FMA: updateFriend(bobPeerId, {..., pending: undefined})
    note right of FMA: Clear pending flag → friendship established ✅
    FMA -> FMA: persistFriends()
    FMA -> FMA: notifyUpdateListeners()

    HPA -> HPA: Fire friendAccepted event
    HPA -> HPA: eventService.emit('friendAccepted', {peerId: bobPeerId, playerName: 'Bob'})
    note right of HPA: UI can show success notification
end

note over A,B: Bob receives ack from Alice, also clears his pending flag

ClientB -> HPB: Ack handler from Alice's response
HPB -> FMB: getFriend(alicePeerId)
FMB --> HPB: friend (with pending: 'pending')

HPB -> HPB: Check if Alice already sent requestFriend
note right of HPB: Alice DID send requestFriend (that's why Bob accepted)
HPB -> FMB: updateFriend(alicePeerId, {..., pending: undefined})
note right of FMB: Clear pending flag → mutual acceptance complete ✅
FMB -> FMB: persistFriends()
FMB -> FMB: notifyUpdateListeners()

HPB -> HPB: Fire friendAccepted event
HPB -> HPB: eventService.emit('friendAccepted', {peerId: alicePeerId, playerName: 'Alice'})
@enduml
EOF

# Diagram 4: Simultaneous Friend Requests
cat > "$SCRATCH_DIR/friend-simultaneous.puml" << 'EOF'
@startuml
participant "Peer A\n(Alice)" as A
participant "HollowPeer A" as HPA
participant "FriendsManager A" as FMA
participant "Peer B\n(Bob)" as B
participant "HollowPeer B" as HPB
participant "FriendsManager B" as FMB

note over A,FMB: Alice and Bob both add each other at same time (race condition)

A -> HPA: addFriend("Bob", bobPeerId)
B -> HPB: addFriend("Alice", alicePeerId)

note over A,FMB: Both create friends with pending: 'unsent'\nBoth add to unsentFriends set\nBoth try to send requestFriend

HPA -> HPA: sendMessage(bobPeerId, requestFriendMessage)
HPB -> HPB: sendMessage(alicePeerId, requestFriendMessage)

note over A,FMB: Both messages cross in flight

alt Both messages delivered
    HPA -> HPA: Ack received → Change to pending: 'pending'
    HPB -> HPB: Ack received → Change to pending: 'pending'

    HPA -> HPA: Receive Bob's requestFriend
    HPA -> HPA: Friend exists with pending flag → MUTUAL ACCEPTANCE
    HPA -> FMA: updateFriend(bobPeerId, {..., pending: undefined})

    HPB -> HPB: Receive Alice's requestFriend
    HPB -> HPB: Friend exists with pending flag → MUTUAL ACCEPTANCE
    HPB -> FMB: updateFriend(alicePeerId, {..., pending: undefined})

    note over A,FMB: Friendship established for both! ✅
end
@enduml
EOF

echo "  - Generating diagram 1: One-Way Friend Request..."
generate_diagram "$SCRATCH_DIR/friend-request.puml" "$SCRATCH_DIR/friend-request.txt"

echo "  - Generating diagram 2: Bob Receives Friend Request..."
generate_diagram "$SCRATCH_DIR/friend-receive.puml" "$SCRATCH_DIR/friend-receive.txt"

echo "  - Generating diagram 3: Mutual Acceptance..."
generate_diagram "$SCRATCH_DIR/friend-mutual.puml" "$SCRATCH_DIR/friend-mutual.txt"

echo "  - Generating diagram 4: Simultaneous Friend Requests..."
generate_diagram "$SCRATCH_DIR/friend-simultaneous.puml" "$SCRATCH_DIR/friend-simultaneous.txt"

echo "  - Assembling file..."
cat > "$SPECS_CRC_DIR/seq-friend-status-change.md" << 'HEADER'
# Sequence: Friend Status Change (Mutual Acceptance)

**Source Spec:** specs/friends.md, specs/p2p-messages.md
**Existing Code:** src/p2p/HollowPeer.ts, src/p2p/FriendsManager.ts

## Participants

- **Peer A** (Alice)
- **HollowPeer A** (Alice's HollowPeer instance)
- **FriendsManager A** (Alice's FriendsManager)
- **P2PWebAppNetworkProvider A**
- **P2PWebAppClient A**
- **Peer B** (Bob)
- **HollowPeer B** (Bob's HollowPeer instance)
- **FriendsManager B** (Bob's FriendsManager)
- **P2PWebAppNetworkProvider B**
- **P2PWebAppClient B**

## Scenario 1: One-Way Friend Request

```
HEADER

cat "$SCRATCH_DIR/friend-request.txt" >> "$SPECS_CRC_DIR/seq-friend-status-change.md"

cat >> "$SPECS_CRC_DIR/seq-friend-status-change.md" << 'MIDDLE1'
```

## Scenario 2: Bob Receives Friend Request

```
MIDDLE1

cat "$SCRATCH_DIR/friend-receive.txt" >> "$SPECS_CRC_DIR/seq-friend-status-change.md"

cat >> "$SPECS_CRC_DIR/seq-friend-status-change.md" << 'MIDDLE2'
```

## Scenario 3: Mutual Acceptance (Bob Sends Friend Request Back)

```
MIDDLE2

cat "$SCRATCH_DIR/friend-mutual.txt" >> "$SPECS_CRC_DIR/seq-friend-status-change.md"

cat >> "$SPECS_CRC_DIR/seq-friend-status-change.md" << 'MIDDLE3'
```

## Scenario 4: Both Peers Send Friend Request Simultaneously

```
MIDDLE3

cat "$SCRATCH_DIR/friend-simultaneous.txt" >> "$SPECS_CRC_DIR/seq-friend-status-change.md"

cat >> "$SPECS_CRC_DIR/seq-friend-status-change.md" << 'FOOTER'
```

## State Transitions

```
[No Friend Entry] → addFriend() → [pending: 'unsent' 📤]
                                      ↓ sendMessage ack received
                                  [pending: 'pending' ⏳]
                                      ↓ requestFriend received (mutual)
                                  [pending: undefined ✅]
                                      ↓ friendship established
                                  [Accepted Friend]
```

## Spec Intent

Matches spec requirements:
- **Stubborn Delivery**: Auto-retry unsent requests when peer connects
- **Two-State Pending**: 'unsent' (not delivered) vs 'pending' (delivered, awaiting mutual)
- **Mutual Acceptance**: Both peers must send requestFriend to establish friendship
- **No Explicit Accept**: Sending requestFriend IS the acceptance
- **Idempotent**: Simultaneous requests handled gracefully (race condition safe)
- **Event Emission**: friendRequest and friendAccepted events for UI
- **Ban Checking**: Silently ignore requests from banned peers
- **Persistent**: Pending status saved to storage

## Analysis

### Correctly Implemented ✅

1. **Two-State Pending**: 'unsent' (not delivered) and 'pending' (awaiting mutual)
2. **Stubborn Delivery**: Ack handler pattern with auto-retry
3. **Mutual Acceptance Detection**: Check for existing friend with pending flag
4. **Event Emission**: friendRequest and friendAccepted events
5. **Ban Handling**: Check isBanned() before processing
6. **Race Condition Safe**: Simultaneous requests both clear pending flags
7. **Storage Persistence**: All state changes persisted immediately
8. **Update Listeners**: UI reactivity via observer pattern

### No Issues Found

Implementation correctly handles all mutual acceptance scenarios including race conditions.
FOOTER

echo "  ✅ seq-friend-status-change.md updated"
echo ""

# ============================================================================
# seq-add-friend-by-peerid.md
# ============================================================================
echo "Converting seq-add-friend-by-peerid.md..."

# Diagram 1: Current Implementation
cat > "$SCRATCH_DIR/add-friend-main.puml" << 'EOF'
@startuml
participant "User" as User
participant "FriendsView" as FV
participant "MilkdownUtils" as MU
participant "HollowPeer" as HP
participant "FriendsManager" as FM
participant "P2PWebAppNetworkProvider" as Provider
participant "LogService" as LS

User -> FV: Click "Add Friend by Peer ID" button
FV -> FV: showAddFriendModal()
FV -> MU: createEditor(notesContainer, '')
MU --> FV: newFriendNotesEditor
FV --> User: Modal displayed

User -> FV: Enter name, peer ID, notes
User -> FV: Click "Add Friend" button
FV -> FV: handleAddFriend()
FV -> FV: Validate name not empty
FV -> FV: Validate peer ID not empty
FV -> FV: isValidPeerId(friendPeerId)
FV -> FV: Check base58 format (alphanumeric only)

alt Invalid peer ID format
    FV --> User: Alert "Invalid peer ID format"
    FV --> FV: Return early
else Valid peer ID format
    FV -> MU: getMarkdown(newFriendNotesEditor)
    MU --> FV: notes

    FV -> HP: addFriend(friendName, friendPeerId, notes)
    HP -> HP: Validate name and peer ID not empty
    HP -> FM: addFriend({playerName, peerId, notes, pending: 'unsent'})
    FM -> FM: friends.set(peerId, friend)
    FM -> FM: persistFriends()
    FM --> HP: Friend added

    HP -> HP: Add peerId to unsentFriends set
    note right of HP: Ephemeral tracking - peer IDs only, fetch data from FriendsManager

    HP -> HP: Load hollowWorldSettings from storage
    HP -> HP: myPlayerName = settings?.playerName || ''

    HP -> Provider: sendMessage(peerId, requestFriendMessage)
    Provider -> Provider: client.send(peerId, protocol, message, onAck)

    alt Peer is reachable
        Provider -> Provider: Message sent successfully
        Provider -> Provider: Ack handler fires
        Provider -> HP: onAck() callback executed
        HP -> FM: getFriend(peerId)
        FM --> HP: current friend data
        HP -> HP: Check if pending still 'unsent'
        HP -> FM: updateFriend(peerId, {..., pending: 'pending'})
        FM -> FM: friends.set(peerId, updatedFriend)
        FM -> FM: persistFriends()
        FM -> FM: notifyUpdateListeners(peerId, updatedFriend)
        HP -> HP: unsentFriends.delete(peerId)
        note right of HP: Friend request delivered! Status changed to 'pending'
        Provider --> HP: Message sent
    else Peer is unreachable
        Provider --> HP: throw Error
        HP -> HP: Catch error
        note right of HP: Peer unreachable is NORMAL in P2P - don't throw\nFriend stays pending:'unsent', will auto-retry when peer comes online
        HP --> HP: Log info (not error)
    end

    HP --> FV: addFriend complete

    FV -> LS: log(`Added friend: ${friendName} (${friendPeerId})`)
    FV -> FV: hideAddFriendModal()
    FV -> FV: Clear modal inputs
    FV -> FV: render(container)
    FV --> User: Friends list refreshed with new friend (📤 Unsent or ⏳ Pending badge)
end
@enduml
EOF

# Diagram 2: Stubborn Delivery (Auto-Retry)
cat > "$SCRATCH_DIR/add-friend-retry.puml" << 'EOF'
@startuml
participant "P2PWebAppNetworkProvider" as Provider
participant "HollowPeer" as HP
participant "FriendsManager" as FM

note over Provider,FM: If peer was unreachable (pending: 'unsent')\nLater: Peer comes online (while user's app is running)

Provider -> Provider: handlePeerJoined(peerId)
Provider -> Provider: connectedPeers.add(peerId)
Provider -> HP: peerConnectHandler(peerId)
HP -> HP: handlePeerConnection(peerId)
HP -> HP: Check if peerId in unsentFriends set

alt Peer in unsentFriends set
    HP -> FM: getFriend(peerId)
    FM --> HP: friend data (single source of truth)

    HP -> HP: Check friend.pending === 'unsent'
    alt Friend has unsent request
        HP -> HP: Log "Auto-retrying friend request to ${playerName}"
        HP -> HP: Create IRequestFriendMessage
        HP -> Provider: sendMessage(peerId, requestFriendMessage, onAck)

        alt Message delivered successfully
            Provider -> HP: onAck() callback
            HP -> FM: updateFriend(peerId, {..., pending: 'pending'})
            FM -> FM: persistFriends()
            FM -> FM: notifyUpdateListeners()
            HP -> HP: unsentFriends.delete(peerId)
            note right of HP: Status changed to 'pending' ⏳\nStubborn delivery succeeded!
        else Message still unreachable
            note right of HP: Friend stays pending: 'unsent' 📤\nWill retry on next peer connection
        end
    end
end
@enduml
EOF

echo "  - Generating diagram 1: Current Implementation..."
generate_diagram "$SCRATCH_DIR/add-friend-main.puml" "$SCRATCH_DIR/add-friend-main.txt"

echo "  - Generating diagram 2: Stubborn Delivery (Auto-Retry)..."
generate_diagram "$SCRATCH_DIR/add-friend-retry.puml" "$SCRATCH_DIR/add-friend-retry.txt"

echo "  - Assembling file..."
cat > "$SPECS_CRC_DIR/seq-add-friend-by-peerid.md" << 'HEADER'
# Sequence: Add Friend by Peer ID

**Source Spec:** specs/friends.md, specs/ui.friends.md
**Existing Code:** src/ui/FriendsView.ts, src/p2p/HollowPeer.ts

## Participants

- **User**
- **FriendsView** (src/ui/FriendsView.ts)
- **MilkdownUtils** (src/utils/MilkdownUtils.ts)
- **HollowPeer** (src/p2p/HollowPeer.ts)
- **FriendsManager** (src/p2p/FriendsManager.ts)
- **P2PWebAppNetworkProvider** (src/p2p/P2PWebAppNetworkProvider.ts)
- **LogService** (src/services/LogService.ts)

## Current Implementation

```
HEADER

cat "$SCRATCH_DIR/add-friend-main.txt" >> "$SPECS_CRC_DIR/seq-add-friend-by-peerid.md"

cat >> "$SPECS_CRC_DIR/seq-add-friend-by-peerid.md" << 'MIDDLE'
```

## Stubborn Delivery (Auto-Retry)

```
MIDDLE

cat "$SCRATCH_DIR/add-friend-retry.txt" >> "$SPECS_CRC_DIR/seq-add-friend-by-peerid.md"

cat >> "$SPECS_CRC_DIR/seq-add-friend-by-peerid.md" << 'FOOTER'
```

## Spec Intent

Matches spec requirements:
- **Peer ID Validation**: Check base58 format before adding
- **Notes Support**: Milkdown editor for rich markdown notes
- **Stubborn Delivery**: Auto-retry unsent requests when peer connects
- **Two-State Pending**: 'unsent' (not delivered) vs 'pending' (delivered)
- **Non-Blocking**: Peer unreachable is normal, not an error
- **Ephemeral Tracking**: unsentFriends set for retry logic
- **Friend Badge**: UI shows 📤 Unsent or ⏳ Pending status
- **Log Integration**: Record friend additions to application log

## Analysis

### Correctly Implemented ✅

1. **Peer ID Validation**: Base58 format check prevents invalid IDs
2. **Rich Notes**: Milkdown editor with markdown support
3. **Stubborn Delivery**: Auto-retry via unsentFriends set
4. **Ack Handler Pattern**: Change pending status only after delivery
5. **Non-Blocking**: Peer unreachable logged as info, not error
6. **Ephemeral Set**: unsentFriends stores peer IDs only (data from FriendsManager)
7. **Friend Data Source**: Single source of truth pattern with FriendsManager
8. **Auto-Retry on Connect**: Peer connection event triggers retry
9. **Status Badges**: UI shows delivery status (📤 unsent, ⏳ pending)
10. **Log Integration**: Friend additions recorded for audit trail

### No Issues Found

Implementation follows spec exactly with proper stubborn delivery pattern.
FOOTER

echo "  ✅ seq-add-friend-by-peerid.md updated"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo "=== Conversion Complete ==="
echo ""
echo "All P2P sequence diagrams converted to PlantUML ASCII format:"
echo "  ✅ seq-establish-p2p-connection.md (done manually)"
echo "  ✅ seq-send-receive-p2p-message.md"
echo "  ✅ seq-friend-presence-update.md"
echo "  ✅ seq-friend-status-change.md"
echo "  ✅ seq-add-friend-by-peerid.md"
echo ""
echo "Total: 5 files, 16 diagrams converted"
echo ""
echo "Temporary files saved to: $SCRATCH_DIR/"
echo "  - *.puml (PlantUML source)"
echo "  - *.txt (Generated ASCII diagrams)"
