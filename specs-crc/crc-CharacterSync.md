# CharacterSync

**Source Spec:** specs/integrate-textcraft.md
**Existing Code:** src/textcraft/character-sync.ts
**Test Code:** (none - Phase 6)

## Responsibilities

### Knows
- Character access pattern: Things store `characterId`, data comes from world's characters store
- Character-to-Thing mapping logic

### Does
- **Character Access:**
  - `getCharacterForThing(world, thing)` - Retrieve character data for a Thing
  - `createThingForCharacter(world, characterId, displayName)` - Create Thing for character

- **Synchronization:**
  - Retrieves character data from world's characters store on demand
  - No character data stored in Thing (only characterId reference)
  - Places new character Things in lobby by default

## Collaborators

- **World** (src/textcraft/model.ts) - World instance with characters store
- **Thing** (src/textcraft/model.ts) - Character entity
- **ICharacter** (src/character/types.ts) - Hollow character data structure
- **IWorldCharacter** (src/textcraft/world-types.ts) - Character wrapper for world storage
- **WorldConnections** (src/textcraft/world-connections.ts) - CRUD operations for characters

## Code Review Notes

### ✅ Working well
- **Clean separation**: Thing only stores characterId, not full character data
- **Single source of truth**: Character data stays in characters store
- **On-demand retrieval**: Character data fetched when needed
- **Simple API**: Two clear functions for character-Thing integration
- **SOLID Principles**:
  - Single Responsibility: Character-Thing bridging only
  - Dependency Inversion: Depends on interfaces, not implementations

### ✅ Matches spec perfectly
- Character sync without data duplication
- Clean integration between Hollow characters and TextCraft Things
- Lobby placement for new character Things

### 📝 Implementation details
- **Storage pattern**: `thing.character` holds characterId (string)
- **Default location**: New Things placed in `world.lobby`
- **Character prototype**: Uses `world.createCharacterThing()`
- **Async retrieval**: Character data retrieved via promises

## Sequences

- seq-textcraft-load-character.md (TBD - loading character into Thing)
- seq-textcraft-sync-character.md (TBD - syncing character changes)

## Related CRC Cards

- crc-Character.md - Hollow character data structure
- crc-WorldConnections.md - Character storage operations
- crc-WorldLoader.md - World initialization

## Design Patterns

**Facade Pattern**: Simplifies character-Thing integration
**Repository Pattern**: Character data retrieved from characters store
**Lazy Loading**: Character data loaded on demand, not stored in Thing

## Key Design Decisions

1. **Reference-Only Storage**: Things store characterId, not character data (prevents data duplication)
2. **Single Source of Truth**: Character data always comes from world.charactersStore
3. **Async Access**: Character retrieval is asynchronous (IndexedDB)
4. **Lobby Default**: New character Things automatically placed in lobby
5. **No Data Sync**: Changes to character in one place automatically visible everywhere (single source)
6. **Simple API**: Two functions cover most character-Thing needs
