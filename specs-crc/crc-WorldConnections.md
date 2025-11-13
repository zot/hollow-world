# WorldConnections

**Source Spec:** specs/integrate-textcraft.md
**Existing Code:** src/textcraft/world-connections.ts
**Test Code:** (none - Phase 6)

## Responsibilities

### Knows
- CRUD operations for world connections
- CRUD operations for world characters
- IndexedDB store access patterns

### Does
- **Connection Management:**
  - `addConnection(world, connection)` - Add connection to world
  - `getAllConnections(world)` - Get all connections for world
  - `getConnectionsByPeer(world, peerId)` - Get connections for specific peer
  - `deleteConnection(world, id)` - Delete connection by ID

- **Character Management:**
  - `addWorldCharacter(world, worldCharacter)` - Add character to world
  - `getWorldCharacter(world, characterId)` - Get character by ID
  - `getAllWorldCharacters(world)` - Get all characters in world
  - `getWorldCharactersByPeer(world, peerId)` - Get characters for peer
  - `updateWorldCharacter(world, characterId, worldCharacter)` - Update character
  - `deleteWorldCharacter(world, characterId)` - Delete character

- **Storage Operations:**
  - Wraps IndexedDB promises for clean async/await
  - Handles missing stores gracefully (returns empty arrays)
  - Validates world has required stores

## Collaborators

- **World** (src/textcraft/model.ts) - World instance with IndexedDB stores
- **IWorldConnection** (src/textcraft/world-types.ts) - Connection data structure
- **IWorldCharacter** (src/textcraft/world-types.ts) - Character data structure
- **ICharacter** (src/character/types.ts) - Hollow character data
- **calculateCharacterHash** (src/utils/characterHash.ts) - Character change detection

## Code Review Notes

### ✅ Working well
- **CRUD completeness**: Full create/read/update/delete for both entities
- **Promise wrapping**: Clean async/await over IndexedDB callbacks
- **Graceful degradation**: Returns empty arrays if stores missing
- **Peer filtering**: Can filter by peer ID (null = owner)
- **Hash integration**: Uses character hashing for change detection
- **SOLID Principles**:
  - Single Responsibility: Storage operations only
  - Interface Segregation: Separate functions for each operation
  - Open/Closed**: Easy to extend with new operations

### ✅ Matches spec perfectly
- CRUD operations for connections and characters
- IndexedDB integration
- Peer-based filtering
- Character hash support

### 📝 Implementation details
- **Phase**: Phase 2 helper functions
- **Stores**: Uses world.connectionsStore and world.charactersStore
- **IDs**: Connections use auto-increment IDs, characters use characterId
- **Peer owner**: null peerId = world owner
- **Hashes**: Character updates include hash calculation

## Sequences

- seq-textcraft-save-character.md (TBD - saving character to world)
- seq-textcraft-load-character.md (TBD - loading character from world)

## Related CRC Cards

- crc-CharacterSync.md - Uses WorldConnections for character access
- crc-Character.md - Character data structure
- crc-WorldLoader.md - Creates worlds with stores

## Design Patterns

**Repository Pattern**: Provides data access abstraction over IndexedDB
**Promise Wrapper**: Wraps IndexedDB callbacks in Promises
**Facade Pattern**: Simplifies IndexedDB operations

## Key Design Decisions

1. **Function-based**: Module of functions, not a class (simpler for this use case)
2. **Promise Wrapping**: All IndexedDB operations return Promises
3. **Graceful Degradation**: Returns empty arrays if stores don't exist
4. **Peer Filtering**: Supports filtering by peer ID for multiplayer
5. **Hash Integration**: Automatically calculates character hashes on update
6. **Separate Stores**: Connections and characters in separate IndexedDB stores
7. **Type Safety**: Full TypeScript types for all operations
