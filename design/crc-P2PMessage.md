# CRC Card: P2PMessage Types

**Source Spec:** p2p-messages.md
**Existing Code:** src/p2p/types.ts

## Type Definitions

### IP2PMessage (Base Interface)
```typescript
interface IP2PMessage {
    method: string;  // Message type identifier
}
```

### IPingMessage
**Purpose:** Test peer connectivity and measure round-trip latency

```typescript
interface IPingMessage extends IP2PMessage {
    method: 'ping';
    timestamp: number;    // Unix timestamp (ms) when ping sent
    messageId: string;    // Unique ID for matching pong response
}
```

**Behavior on Receive:**
- Immediately respond with pong
- Include received timestamp and messageId in response

### IPongMessage
**Purpose:** Response to ping message

```typescript
interface IPongMessage extends IP2PMessage {
    method: 'pong';
    timestamp: number;    // Original timestamp from ping (echo back)
    messageId: string;    // MessageId from ping (for correlation)
}
```

**Behavior on Receive:**
- Calculate round-trip time: `Date.now() - timestamp`
- Look up handler in pendingResponses using messageId
- Execute handler and remove from pendingResponses
- Log connectivity success

### IRequestFriendMessage
**Purpose:** Send friend request or accept friend request (mutual acceptance pattern)

```typescript
interface IRequestFriendMessage extends IP2PMessage {
    method: 'requestFriend';
    playerName: string;   // Sender's display name
}
```

**Stubborn Delivery (Automatic Retry):**
- When sent, friend marked `pending: 'unsent'` and added to unsentFriends set
- Ack handler changes to `pending: 'pending'` on delivery
- If peer offline, stays 'unsent' and auto-retries when peer connects
- System rebuilds unsentFriends set on app initialization

**Behavior on Receive:**
1. Check if sender is banned → silently ignore if banned
2. Check if sender already in friends list with pending flag:
   - If pending exists → clear pending (mutual acceptance), create friendAccepted event
3. If not in list → create friendRequest event

### IMudMessage
**Purpose:** TextCraft MUD integration (world/character sync)

```typescript
interface IMudMessage extends IP2PMessage {
    method: 'mud';
    payload: any;  // MudMessage payload from textcraft
}
```

### P2PMessage Union Type
```typescript
type P2PMessage =
    | IPingMessage
    | IPongMessage
    | IRequestFriendMessage
    | IMudMessage;
```

## Message Flow Patterns

### Request-Response Pattern (ping/pong)
```
1. Send ping with messageId
2. Store callback in pendingResponses[messageId]
3. Receive pong with same messageId
4. Look up and invoke callback
5. Remove from pendingResponses
```

### Stubborn Request Pattern (requestFriend)
```
1. Add friend with pending: 'unsent', add to unsentFriends set
2. Try send requestFriend
3. On ack: Change to pending: 'pending', remove from set
4. On failure: Stay 'unsent', remain in set
5. When peer connects: Auto-retry if still 'unsent'
6. On app restart: Rebuild set from persisted friends
```

### Mutual Acceptance Pattern (requestFriend)
```
Peer A sends requestFriend → Peer B receives → Peer B has pending
Peer B sends requestFriend → Peer A receives → Peer A has pending
Both clear pending flags → Friendship established
```

## Key Design Decisions

1. **Method-Based Routing**: `method` field determines message handler
2. **TypeScript Discriminated Unions**: Type-safe message handling
3. **Request-Response via messageId**: Correlate responses to requests
4. **Stubborn Delivery**: Friend requests auto-retry until delivered
5. **Ephemeral Tracking**: unsentFriends set rebuilt from persisted data
6. **No Decline Message**: Ignoring request is friendlier than explicit decline
7. **Mutual Acceptance**: Both peers sending requestFriend clears pending
8. **Silent Ban Handling**: Banned peers get no response or notification

## Validation Requirements

1. **All Messages**: Validate `method` field exists and is string
2. **Ping/Pong**: Validate `timestamp` is number, `messageId` is string
3. **RequestFriend**: Validate `playerName` is string (can be empty)
4. **Type Safety**: Use TypeScript interfaces to enforce structure

## Testing

**Test File:** test/HollowIPeer.test.ts

**Key Test Cases:**
- Ping/pong round-trip
- Friend request creation and acceptance
- Mutual friend request (both send)
- Banned peer silent ignore
- Message ID correlation
- Stubborn retry on peer connect
