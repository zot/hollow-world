# Friends & P2P System

*See [`../CLAUDE.md`](../CLAUDE.md) for general development guidelines*

## Overview

The Friends system manages peer-to-peer relationships between Hollow World players. Each friend represents a LibP2P peer connection and tracks shared worlds and characters across those worlds.

## 🤝 Friend Data Structure

### IFriend Interface

```typescript
interface IFriend {
    peerId: string;        // LibP2P peer ID (unique identifier)
    playerName: string;    // Display name for the friend
    notes: string;         // Private notes (not transmitted)
    pending?: boolean;     // True when request sent but not acknowledged
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

1. Player A sends friend request to Player B
2. Friend added to A's list with `pending: true`
3. Player B receives friend request event
4. Player B accepts → Friend added to both lists
5. Players can now share world invitations

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
