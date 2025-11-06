# Storage Specifications

*See [`../CLAUDE.md`](../CLAUDE.md) for general development guidelines*

## Overview

The Hollow World application uses multiple storage systems for different purposes:
- **MudStorage**: IndexedDB-backed storage for TextCraft MUD worlds
- **LocalStorage**: Browser localStorage for character data, profiles, and application state

## 🗄️ MudStorage Access Patterns

**CRITICAL**: MudStorage is the IndexedDB-backed storage system for TextCraft MUD worlds. Follow these patterns:

### Getting MudStorage Instance

```typescript
import { getStorage } from '../textcraft/model';

// ✅ CORRECT: Use async getStorage() function
const storage = await getStorage();

// ❌ WRONG: Don't try to use MudStorage as static class
MudStorage.deleteWorld('world'); // This will fail!
```

### Common MudStorage Operations

```typescript
const storage = await getStorage();

// Get list of world names (property, not method!)
const worldNames = storage.worlds; // ✅ Property access
const worldNames = await storage.worldNames(); // ❌ Not a method

// Delete a world
await storage.deleteWorld(worldName); // ✅ Instance method

// Open/load a world
const world = await storage.openWorld(worldName); // ✅ Instance method

// Create new world
const world = new World();
await world.initDb();
world.name = 'My World';
world.description = 'A new frontier...';
```

### World Transactions

All world modifications should use `doTransaction()` for database consistency:

```typescript
const world = await storage.openWorld('My World');

// Modify world data within transaction
await world.doTransaction(async (store, users, txn) => {
    // Make your changes here
    world.name = 'Updated Name';

    // Persist changes
    await world.store();
});
```

### MudStorage Rules of Thumb
- **Always `await`**: Both `getStorage()` and world operations are async
- **Instance methods**: MudStorage methods are instance methods, not static
- **Property access**: `storage.worlds` is a property (array), not a method
- **Transactions**: Use `world.doTransaction()` for atomic database operations
- **Error handling**: Wrap storage operations in try/catch blocks

## 👤 Character Storage (LocalStorage)

### Character Structure
- **UUID-based storage**: Each character has a unique identifier
- **Version field**: Stores current app version (from VERSION file)
- **XP and Attribute Chips**: Computed dynamically based on rank
  - Total XP: rank 1 = 10 XP, +10 per additional rank
  - Total Attribute Chips: rank 1 = 16 chips, +1 per additional rank
  - Available chips = total chips - total attribute costs
  - Available XP = total XP - costs exceeding attribute chips

### Character Version Compatibility

#### Character Schemas
- Keep an array of objects, each with its version (from VERSION file) and schema (based on the storage format)
- The array is given in sorted order by version number

#### Upgrading Characters
- When the character structure changes, add the new character schema to the character schemas object
  - The version number in the VERSION file is increasing so appending to the array will maintain sort order
- Add a function that converts characters for the previous version to the new version, supplying default values for new items
- There is an upgrade function that upgrades a character based on its version to the current version
  - Use the character schema array to upgrade to the next version until the character reaches the final (most recent) version

### Character Save/Load Workflow

#### Loading Characters
- **From character manager**: Load character from storage using UUID in URL path
- **From browser navigation**: Edit history item live as "current" character
- **Live editing**: Make changes without persistence until "Yep" button clicked

#### "Nope" Button (Revert)
- **Revert changes**: Reload character from storage
- **Update fields**: Display original stats in all fields
- **History update**: Overwrite history item with retrieved object
- Enable only if there are changes to revert

#### "Yep" Button (Save)
- Enable only if there are changes that have not been saved
- **Save workflow**:
  1. Load original character from storage → temporary variable (backup)
  2. Save current (edited) character to storage (permanent)
  3. Replace history object with original from temporary variable
  4. Remove any "future" history items
  5. Add newly saved character to history
  6. Advance internal history for proper back button behavior

### Error Handling
- **LocalStorage failures**: Graceful degradation when storage is unavailable
- **Character validation**: Validate data structure before loading
- **Corrupted data recovery**: Attempt to restore or provide clear error messages
- **User-friendly notifications**: Clear feedback when storage operations fail

## 📦 Named Profiles (LocalStorage)

### Profile System
- Each profile has a different storage prefix used by the app
- All storage uses storage prefix
- Selecting a profile:
  - Chooses which storage profile the app uses
  - Applies only to the current tab (selection is not persisted)
  - Reconnects to libp2p using profile's peerID

### Profile Initialization
- At startup:
  - If storage exists but does not use profiles, remove it
  - If storage is empty (including if it was just removed), create the Default profile

### Ban List Storage
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
- Notes remain editable in banned peers section (UI in Friends view)

**Behavior**:
- Friend requests from banned peers are silently ignored (no events created)
- Banning a peer removes them from friends list but preserves their data
- Ban list persists across sessions
- Ban can be reversed via UI in Friends view
- Sending friend request to banned peer automatically unbans and adds to friends (preserving notes)

**Access Pattern**:
```typescript
// Read ban list
const banListJson = profileService.getItem('hollow-banned-peers');
const banList = banListJson ? JSON.parse(banListJson) : {};

// Add banned peer (map structure)
banList[peerId] = {
  friend: {
    peerId: '12D3KooW...',
    playerName: 'Troublemaker',
    notes: 'Spam and harassment',
    worlds: []
  },
  bannedAt: new Date().toISOString()
};
profileService.setItem('hollow-banned-peers', JSON.stringify(banList));

// Remove banned peer
delete banList[targetPeerId];
profileService.setItem('hollow-banned-peers', JSON.stringify(banList));

// Check if peer is banned
const isBanned = targetPeerId in banList;
```

**Related Specs**: See [`friends.md`](friends.md#ban-list-storage-localstorage) for ban system details

### Testing
- **Testing**: ProfileService is exposed via `window.__HOLLOW_WORLD_TEST__.profileService` in dev/test environments
  - Access profile-aware storage: `profileService.getItem(key)`
  - Get current profile: `profileService.getCurrentProfile()`
  - See [`testing.md`](testing.md#test-api-for-singleton-access) for usage examples

## 🔍 Storage Best Practices

### General Guidelines
- **Always validate data** before reading from or writing to storage
- **Handle errors gracefully** - storage can fail, be full, or be unavailable
- **Use appropriate storage type**:
  - IndexedDB (MudStorage) for large, structured data (worlds)
  - LocalStorage for small, simple data (characters, profiles, settings)
- **Version your data structures** to allow for future migrations
- **Test storage operations** thoroughly, including failure scenarios

### Performance Considerations
- **Minimize storage operations** - batch writes when possible
- **Cache frequently accessed data** - don't read from storage repeatedly
- **Use transactions** for atomic operations (IndexedDB)
- **Avoid storing large objects** in localStorage - use IndexedDB instead
