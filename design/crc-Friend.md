# CRC Card: Friend (Data Type)

**Source Spec:** specs/friends.md
**Existing Code:** src/p2p/types.ts

## Data Structure

### IFriend Interface
```typescript
interface IFriend {
    peerId: string;                       // LibP2P peer ID (unique identifier)
    playerName: string;                    // Display name for the friend
    notes: string;                         // Private notes (not transmitted)
    pending?: 'unsent' | 'pending';        // Optional: Friend request status
    presence?: boolean;                    // Optional: Online presence (NON-PERSISTED)
    worlds?: IFriendWorld[];               // Optional: Shared worlds
}
```

### IFriendWorld Interface
```typescript
interface IFriendWorld {
    worldId: string;                       // TextCraft world ID
    worldName: string;                     // Human-readable world name
    hostPeerId: string;                    // Who hosts (me or friend)
    characters: IFriendCharacter[];        // Characters in this world
}
```

### IFriendCharacter Interface
```typescript
interface IFriendCharacter {
    character: ICharacter;                 // Full character data (includes character.id)
    characterHash: string;                 // SHA-256 hash for integrity
}
```

## Field Descriptions

### peerId (Required)
- **Type:** string
- **Purpose:** Unique identifier from libp2p
- **Format:** Base58-encoded multihash (e.g., `12D3KooW...`)
- **Immutable:** Cannot change once friend is added

### playerName (Required)
- **Type:** string
- **Purpose:** Human-readable display name
- **Source:** From friend's profile settings or provided when adding
- **Mutable:** Can be edited by user
- **Not Unique:** Multiple friends can have same name

### notes (Required)
- **Type:** string
- **Purpose:** Private notes about the friend
- **Visibility:** Not transmitted to friend (local only)
- **Format:** Markdown (edited via Milkdown in UI)
- **Mutable:** Can be edited by user

### pending (Optional)
- **Type:** `'unsent' | 'pending' | undefined`
- **Purpose:** Friend request delivery status
- **Values:**
  - `'unsent'`: Request not yet delivered (peer offline/unreachable)
  - `'pending'`: Request delivered, awaiting mutual acceptance
  - `undefined`: Mutual acceptance complete (both accepted)
- **Auto-Managed:** Changed by HollowPeer based on delivery status
- **Persistent:** Saved to storage

### presence (Optional)
- **Type:** `boolean | undefined`
- **Purpose:** Real-time online/offline indicator
- **Values:**
  - `true`: Friend currently online (in connected peers list)
  - `false`: Friend currently offline
  - `undefined`: Presence not yet initialized
- **NON-PERSISTENT:** Runtime-only field, rebuilt on app startup
- **Auto-Managed:** Updated by HollowPeer on peer join/leave

### worlds (Optional)
- **Type:** `IFriendWorld[] | undefined`
- **Purpose:** Track shared TextCraft worlds with this friend
- **Scenarios:**
  - Friend hosts world → I can join their world
  - I host world → Friend joins my world
- **Persistent:** Saved to storage
- **Backward Compatible:** Initialized as empty array for existing friends

## State Machine

### Friend Request States
```
[No Friend] → Add Friend → [pending: 'unsent']
                              ↓ (peer comes online OR message delivered)
                          [pending: 'pending']
                              ↓ (mutual requestFriend received)
                          [no pending field] = Accepted
```

### Presence States
```
[presence: undefined] → Initialize → [presence: true/false]
                                        ↓ (peer join/leave events)
                                    [presence: true/false]
```

## Usage Patterns

### Add Friend Flow
```typescript
const friend: IFriend = {
    peerId: '12D3KooW...',
    playerName: 'Doc Holiday',
    notes: 'Met at the Silver Dollar',
    pending: 'unsent',
    worlds: []
};
friendsManager.addFriend(friend);
```

### Update Friend Name
```typescript
const friend = friendsManager.getFriend(peerId);
if (friend) {
    friend.playerName = 'New Name';
    friendsManager.updateFriend(peerId, friend);
}
```

### Track World
```typescript
const world: IFriendWorld = {
    worldId: 'dusty-creek',
    worldName: 'Dusty Creek Saloon',
    hostPeerId: friend.peerId,  // Friend hosts
    characters: []
};
friendsManager.addFriendWorld(peerId, world);
```

## Key Design Decisions

1. **peerId as Primary Key**: Unique, immutable identifier
2. **Optional pending Field**: Only present during friend request flow
3. **Non-Persistent presence**: Runtime-only to avoid stale data
4. **Markdown Notes**: Rich text editing via Milkdown
5. **World Tracking**: NEW feature for TextCraft integration (Phase 1)
6. **Backward Compatibility**: worlds array initialized for existing friends
7. **Two-State Pending**: 'unsent' (not delivered) vs 'pending' (delivered, awaiting acceptance)

## Storage

**LocalStorage Key:** `hollow-friends` (per profile)

**Format:**
```json
{
  "friends": {
    "12D3KooW...": {
      "peerId": "12D3KooW...",
      "playerName": "Doc Holiday",
      "notes": "Met at the Silver Dollar",
      "pending": "pending",
      "worlds": [
        {
          "worldId": "dusty-creek",
          "worldName": "Dusty Creek Saloon",
          "hostPeerId": "12D3KooW...",
          "characters": []
        }
      ]
    }
  }
}
```

**Note:** `presence` field NOT saved (runtime only)

## Testing

**Test File:** test/FriendsManager.test.ts

**Key Tests:**
- Create friend with required fields
- Update friend name and notes
- Add/remove worlds
- Pending flag transitions
- Presence updates (runtime only)
- Backward compatibility (missing worlds array)
