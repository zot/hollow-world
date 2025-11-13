# Friends & P2P System

*See [`../CLAUDE.md`](../CLAUDE.md) for general development guidelines*

## Overview

The Friends system manages peer-to-peer relationships between Hollow World players. Each friend represents a peer connection and tracks shared worlds and characters across those worlds.

## 🤝 Friend Data Structure

### IFriend Interface

```typescript
interface IFriend {
    peerId: string;        // Peer ID (unique identifier)
    playerName: string;    // Display name for the friend
    notes: string;         // Private notes (not transmitted)
    pending?: 'unsent' | 'pending';  // Friend request status:
                                      // - 'unsent': Request not yet delivered (peer offline or unreachable)
                                      // - 'pending': Request delivered, awaiting mutual acceptance
                                      // - undefined: Mutual acceptance complete (both peers accepted)
    worlds: IFriendWorld[];  // List of shared worlds
}
```

### IFriendWorld Interface

```typescript
interface IFriendWorld {
    worldId: string;                    // TextCraft world ID
    characters: IFriendCharacter[];     // Friend's characters in this world
}
```

### IFriendCharacter Interface

```typescript
interface IFriendCharacter {
    characterId: string;           // UUID of the Hollow World character
    character: ICharacter;         // Full copy of character as it exists in the world
    characterHash: string;         // SHA-256 hash for integrity verification
    // Note: Each character can only be in ONE world
    // This represents the friend's character instance in this specific world
}
```

## 🔄 Integration with TextCraft

### World Connections

Instead of TextCraft's user list, each world should maintain a connections list:

```typescript
interface IWorldConnection {
    peer?: string;         // LibP2P peer ID (optional - missing means owner)
    characterId: string;   // UUID of Hollow World character
    thingId: string;       // TextCraft Thing ID for this character
}
```

### World Characters

Each world maintains its own character storage:

```typescript
interface IWorldCharacter {
    characterId: string;       // UUID of Hollow World character
    character: ICharacter;     // Version of character in this world
    characterHash: string;     // SHA-256 hash for integrity
}
```

## 📊 Data Flow

### Friend Request Flow

**Stubborn Friend Requests**: Friend requests are persistent and automatically retry when peers come online. This ensures delivery even when peers are offline or unreachable.

**Ephemeral Tracking**: The system maintains an in-memory set (`Set<string>`) of peer IDs with unsent friend requests. This set is rebuilt on app initialization by scanning all friends with `pending: 'unsent'` status. The set only tracks peer IDs - actual friend data is always fetched from FriendsManager (single source of truth) to avoid cache inconsistency.

**Auto-Retry Triggers**:
- When a peer connects to the network (peer comes online)
- Happens while the user's app is running
- Works across app restarts (set rebuilt from persisted friend data)

1. **Player A sends friend request:**
   - Player A adds Player B to their friends list with `pending: 'unsent'`
   - Peer ID added to ephemeral `unsentFriends` set
   - `requestFriend` message sent to Player B with ack handler
   - **If message is acked**: Change `pending: 'unsent'` to `pending: 'pending'`, remove from set
   - **If peer is offline**: Stays as `pending: 'unsent'`, remains in set
   - **When Player B comes online (while A is online)**: Automatically resend requestFriend if still 'unsent' (friend data fetched from FriendsManager)
   - **When A restarts app**: Rebuilds `unsentFriends` set from persisted friends with `pending: 'unsent'`

2. **Player B receives friend request:**
   - Check if Player A is in Player B's ban list:
     - **If banned**: Silently ignore (no event created, no response)
   - Check if Player A is already in Player B's friends list:
     - **If already has pending status**: Clear the `pending` field (mutual friend request = automatic acceptance)
     - **If not in list**: Create a friend request event

3. **Player B has three options:**
   - **Accept**:
     - Add Player A to friends list with `pending: 'unsent'`
     - Send `requestFriend` back to Player A (mutual acceptance) with ack handler
     - **If acked**: Change to `pending: 'pending'`
     - Remove event
   - **Ignore**:
     - Remove event without adding friend or sending message
     - Leaves Player A's entry in pending state ('unsent' or 'pending')
     - Player A can manually remove the pending friend if desired
   - **Ban**:
     - Add Player A to ban list (persisted)
     - Remove event without adding friend or sending message
     - Future friend requests from Player A will be silently ignored

4. **If Player B accepts:**
   - Player A receives `requestFriend` from Player B
   - Player A clears `pending` field for Player B (mutual acceptance complete)
   - Both players now have each other in friends lists without `pending` fields

5. **If Player B ignores:**
   - No message sent
   - Player A's friend entry for Player B remains with pending status
   - Player A can see the pending status and remove the friend entry manually if desired
   - **Automatic retry**: System will keep retrying delivery when Player B comes online

6. **If Player B bans:**
   - No message sent
   - Player A's friend entry for Player B remains with pending status
   - Player A has no way to know they've been banned (silent protection)
   - All future friend requests from Player A will be ignored
   - **Automatic retry**: System will keep retrying delivery (which will be silently ignored)

7. **Players can now share world invitations** (if accepted)

**Note on Declining:** There is no explicit decline mechanism. Ignoring a friend request is friendlier and less confrontational. The requester can see their friend is pending and remove it themselves when they choose.

### Banning an Existing Friend

Users can ban existing friends from the Friends view:

1. User clicks "Ban" button on friend card
2. Confirmation dialog appears: "Are you sure you want to ban [PlayerName]? This will remove them from your friends list and prevent future friend requests."
3. If confirmed:
   - Friend removed from friends list
   - Peer ID added to ban list (persisted)
   - Future friend requests from banned peer silently ignored
4. If cancelled: No action taken

### World Sharing Flow

1. Player A hosts a TextCraft world
2. Player A invites Friend B to world
3. Friend B selects which Hollow World character to use
4. Character copied to world's character storage
5. Connection created linking B's peer + character + thing
6. Friend A's world list updated with B's character info

### Character Sync Flow

**IMPORTANT:** Sync direction is World → Player (automatic), NOT Player → World

1. Player creates/selects character to enter world
2. Character is **copied** to world storage (initial snapshot)
3. Within the world, character can be improved/changed
4. World character changes **automatically sync back** to player's LocalStorage:
   - Compare character hash to detect changes
   - If hash differs, world character has changed
   - Sync world character → LocalStorage (overwrite)
   - Update stored hash to new value
   - Skip sync if hash unchanged (no redundant syncs)
5. Player's LocalStorage always reflects latest world character state
6. World character is the authoritative version while in that world

## 🗄️ Storage

### Friends Storage (LocalStorage)

**Key:** `hollow-friends` (per profile)

### Ban List Storage (LocalStorage)

**Key:** `hollow-banned-peers` (per profile)

**Purpose**: Persisted map of banned peer IDs to friend data to prevent unwanted friend requests

**Structure**:
```json
{
  "12D3KooW...": {
    "friend": {
      "peerId": "12D3KooW...",
      "playerName": "Troublemaker",
      "notes": "Was spamming requests and being annoying",
      "worlds": []
    },
    "bannedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Key Points**:
- Map structure: `peerId -> { friend: IFriend, bannedAt: string }`
- Preserves full friend data including notes (important for context about why banned)
- `bannedAt` is ISO 8601 timestamp
- When banning, copy complete friend data from friends list
- Notes remain editable in banned peers section

**Behavior**:
- Friend requests from banned peers are silently ignored (no events created)
- Banning a peer removes them from friends list but preserves their data
- Ban list persists across sessions
- Ban can be reversed by removing from ban list (UI feature for unban in Friends view)

```json
{
  "friends": [
    {
      "peerId": "12D3KooW...",
      "playerName": "Doc Holiday",
      "notes": "Met at the Silver Dollar",
      "worlds": [
        {
          "worldId": "dusty-creek",
          "characters": [
            {
              "characterId": "550e8400-e29b-41d4-a716-446655440000",
              "character": { /* full ICharacter */ },
              "characterHash": "a7ffc6f8bf...",
              "isDefault": true
            }
          ]
        }
      ]
    }
  ]
}
```

### World Storage (MudStorage)

Each TextCraft world's database should store:

**Connections Store:**
```json
[
  {
    "peer": null,
    "characterId": "550e8400-e29b-41d4-a716-446655440000",
    "thingId": "player-thing-1"
  },
  {
    "peer": "12D3KooW...",
    "characterId": "660e9511-f39c-52e5-b827-557766551111",
    "thingId": "player-thing-2"
  }
]
```

**Characters Store:**
```json
[
  {
    "characterId": "550e8400-e29b-41d4-a716-446655440000",
    "character": { /* full ICharacter */ },
    "characterHash": "b8gfd7g9ch..."
  }
]
```

## 🔐 Security & Integrity

### Character Hashing

```typescript
function calculateCharacterHash(character: ICharacter): string {
    const json = JSON.stringify(character, Object.keys(character).sort());
    return sha256(json);
}
```

### Verification

- Hash stored with character to detect tampering
- On sync: recalculate hash and compare
- If mismatch: prompt user to resolve conflict

## 🎯 Benefits

### For Players
- Create character once, use in multiple worlds
- Each world maintains its own version of your character
- Character progression happens within each world independently
- World improvements automatically save back to your collection
- No manual export needed - automatic sync keeps it current
- Easy to track which friends play in which worlds
- Private notes about friends

### For Developers
- Clean separation: Friends (P2P layer) vs Users (World layer)
- Character integrity verification via hashing
- Automatic one-way sync (world → player)
- Hash comparison eliminates redundant syncs
- Clear ownership model (world owns its character instances)
- Backward compatible with existing systems

## 🔄 Migration Path

### Phase 1: Add Friend World Tracking
- Add `worlds` array to `IFriend`
- Store empty arrays initially
- Update when worlds are shared

### Phase 2: Add World Connections
- Create new connections store in worlds
- Populate from existing users
- Run both systems in parallel

### Phase 3: Add World Characters
- Create characters store in worlds
- Copy characters from LocalStorage
- Link via characterId

### Phase 4: Deprecate Old System
- Remove user store from worlds
- Friends become source of truth for P2P relationships
- Worlds become source of truth for character instances

## 🧪 Testing

### Friend Management Tests
- Add/remove friends
- Update friend data
- Track multiple worlds per friend
- Verify character copies

### World Connection Tests
- Create connections with/without peer
- Link characters to things
- Handle disconnections
- Verify integrity hashes

### Character Sync Tests
- Copy character to world on entry
- Update world character and verify automatic sync
- Test hash comparison (skip sync if unchanged)
- Verify sync triggers on character changes
- Verify LocalStorage changes don't affect world
- Test sync on world exit
- Test periodic sync while in world
- Handle sync conflicts gracefully

## 📚 Related Specifications

- [`storage.md`](storage.md) - Storage system details
- [`p2p.md`](p2p.md) - P2P networking protocols
- [`integrate-textcraft.md`](integrate-textcraft.md) - TextCraft integration
- [`ui.characters.md`](ui.characters.md) - Character management UI
