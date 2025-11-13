# CRC Card: FriendsManager

**Source Spec:** specs/friends.md
**Existing Code:** src/p2p/FriendsManager.ts

## Class Responsibilities

### Knows About (Data)
- `friends: Map<string, IFriend>` - Map of peer IDs to friend data
- `banList: BanList` - Map of banned peer IDs to banned peer entries
- `storageProvider: IStorageProvider` - Storage abstraction for persistence
- `updateListeners: Array<callback>` - List of update listeners for UI reactivity
- `networkProvider: any` - Network provider for getting own peer ID

### Does (Behavior)

**Friend Management:**
- `addFriend(friend)` - Add a new friend to the friends list
- `removeFriend(peerId)` - Remove a friend from the list
- `getFriend(peerId)` - Get a specific friend by peer ID
- `getAllFriends()` - Get all friends as a Map
- `updateFriend(peerId, friend)` - Update friend data

**Update Notification:**
- `onFriendUpdate(callback)` - Register listener for friend updates
- `removeUpdateListener(callback)` - Remove update listener
- `notifyUpdateListeners(peerId, friend)` - Notify all listeners of friend update

**World Tracking (NEW - TextCraft Integration):**
- `addFriendWorld(peerId, world)` - Add a world to friend's world list
- `removeFriendWorld(peerId, worldId)` - Remove a world from friend
- `getFriendWorld(peerId, worldId)` - Get specific world for a friend
- `addFriendCharacter(peerId, worldId, character)` - Add character to friend's world
- `updateFriendCharacter(peerId, worldId, character)` - Update friend's character in world
- `getFriendWorlds(peerId)` - Get all worlds for a friend
- `getFriendHostedWorlds(peerId)` - Get worlds hosted by friend (where I can join)
- `getMyWorldsWithFriend(peerId)` - Get my worlds where friend has characters

**Ban List Management:**
- `banPeer(peerId, friend)` - Ban a peer (adds to ban list, removes from friends)
- `unbanPeer(peerId)` - Unban a peer (removes from ban list only)
- `isBanned(peerId)` - Check if a peer is banned
- `getBannedPeer(peerId)` - Get banned peer entry
- `getAllBannedPeers()` - Get all banned peers
- `updateBannedPeer(peerId, friend)` - Update banned peer data (e.g., edit notes)

**Storage:**
- `loadFriends()` - Load friends and ban list from storage
- `persistFriends()` - Persist friends to storage
- `persistBanList()` - Persist ban list to storage

## Collaborators

**Uses:**
- **IStorageProvider** (src/p2p/LocalStorageProvider.ts) - For persisting friends and ban list data
- **calculateCharacterHash** (src/utils/characterHash.ts) - For updating character hashes

**Used By:**
- **HollowPeer** (src/p2p/HollowPeer.ts) - Main P2P coordinator uses FriendsManager for friend data
- **FriendsView** (src/ui/FriendsView.ts) - Friends UI component displays friend data

## Design Patterns

**Single Responsibility**: Manages friend data and persistence only
**Observer Pattern**: Update listeners for UI reactivity
**Dependency Inversion**: Depends on IStorageProvider interface, not concrete implementation
**Open/Closed**: Can extend with new world/character methods without modifying core friend management

## Key Design Decisions

1. **Map<string, IFriend> for Friends**: O(1) lookups by peer ID
2. **BanList as Record**: Simple key-value for banned peer entries
3. **Update Listeners**: Observer pattern enables UI reactivity without tight coupling
4. **Backward Compatibility**: Initializes `worlds` array for existing friends
5. **Persistence**: All mutations trigger persistence (fire-and-forget with error logging)
6. **World Tracking**: New feature for TextCraft integration (Phase 1 of migration path)

## Testing

**Test File:** test/FriendsManager.test.ts

**Key Tests:**
- Friend CRUD operations
- Ban list management
- World tracking (add/remove worlds, characters)
- Update listener notifications
- Storage persistence
- Backward compatibility (friends without worlds array)
