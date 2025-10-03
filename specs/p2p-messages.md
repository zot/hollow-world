# 📨 P2P Message Protocol Specification

**JSON message format for Hollow World P2P communication**

*Based on [`p2p.md`](p2p.md)*

## 📋 Message Structure

All P2P messages are JSON objects with the following base structure:

```json
{
  "method": "string",
  ...additional properties
}
```

- `method` (required): String indicating which method to execute
- Additional properties are method-specific

## 🔧 Message Methods

### `identify`

Sent automatically when a peer connection is established. Identifies the peer and their current state.

```json
{
  "method": "identify",
  "peerId": "string",
  "nickname": "string",
  "timestamp": number
}
```

**Fields:**
- `peerId`: The sender's libp2p peer ID
- `nickname`: Display name for the peer (optional)
- `timestamp`: Unix timestamp when message was sent

**Purpose:** Allows peers to identify each other and establish initial connection state.

---

### `requestFriend`

Sent to request adding the recipient as a friend.

```json
{
  "method": "requestFriend",
  "peerId": "string",
  "nickname": "string",
  "message": "string"
}
```

**Fields:**
- `peerId`: The requester's libp2p peer ID
- `nickname`: Display name of the requester
- `message`: Optional personal message with the friend request

**Purpose:** Initiates a friend request that the recipient can approve or deny.

---

### `approveFriendRequest`

Sent in response to a friend request to approve it.

```json
{
  "method": "approveFriendRequest",
  "peerId": "string",
  "nickname": "string",
  "approved": boolean
}
```

**Fields:**
- `peerId`: The approver's libp2p peer ID
- `nickname`: Display name of the approver
- `approved`: `true` to approve, `false` to deny

**Purpose:** Responds to a friend request, establishing a bidirectional friend relationship if approved.

---

## 🔒 Security Notes

- All messages are transmitted over encrypted libp2p streams (Noise protocol)
- Peer authentication is handled by the libp2p security layer
- Message signing can be enabled for pubsub messages via GossipSub configuration
- Validate all incoming message fields before processing
- Reject malformed or invalid messages

## 📝 Implementation Requirements

1. **Validation**: Each message handler MUST validate all required fields
2. **Type Safety**: Use TypeScript interfaces for all message types
3. **Error Handling**: Gracefully handle invalid or malformed messages
4. **Logging**: Log all received messages for debugging
5. **Immutability**: Message structures are immutable - do not modify without updating this spec
