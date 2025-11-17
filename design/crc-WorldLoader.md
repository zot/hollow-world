# WorldLoader

**Source Spec:** integrate-textcraft.md
**Existing Code:** src/textcraft/world-loader.ts
**Test Code:** (none - Phase 6)

## Responsibilities

### Knows
- How to create new worlds programmatically
- How to load existing worlds by name

### Does
- **World Creation:**
  - `createTestWorld()` - Create simple test world (default)
  - `createWorld(worldName)` - Create new world with given name

- **World Loading:**
  - `loadWorld(worldName)` - Load existing world by name

- **Storage Integration:**
  - Gets MudStorage instance
  - Opens worlds through storage layer
  - Handles world initialization

## Collaborators

- **MudStorage** (src/textcraft/model.ts) - TextCraft storage system
- **World** (src/textcraft/model.ts) - TextCraft world model
- **getStorage()** (src/textcraft/model.ts) - Storage singleton accessor

## Code Review Notes

### ✅ Working well
- **Simple API**: Three clear methods for world management
- **Storage abstraction**: Uses MudStorage for all persistence
- **Error handling**: Throws clear errors for missing worlds
- **Phase-appropriate**: Simple implementation for Phase 2.5
- **SOLID Principles**:
  - Single Responsibility: World creation/loading only
  - Dependency Inversion: Depends on MudStorage interface

### ✅ Matches spec perfectly
- Creates test world for solo play
- Supports named world creation
- Loads existing worlds
- Delegates initialization to MudConnection

### 📝 Implementation details
- **Test world name**: "Test Room"
- **Storage**: Uses IndexedDB via MudStorage
- **Initialization**: World setup happens in MudConnection.start()
- **Phase note**: Full world building deferred to Phase 3

## Sequences

- seq-textcraft-create-world.md (TBD - world creation flow)
- seq-textcraft-load-world.md (TBD - world loading flow)

## Related CRC Cards

- crc-LocalMudSession.md - Uses WorldLoader for solo play
- crc-HollowIPeer.md - Uses worlds for multiplayer

## Design Patterns

**Factory Pattern**: Creates World instances
**Facade Pattern**: Simplifies world creation/loading
**Singleton**: Accesses shared MudStorage instance

## Key Design Decisions

1. **Simple Interface**: Three methods cover all world management needs
2. **Storage Delegation**: All persistence through MudStorage
3. **Lazy Initialization**: World content setup deferred to MudConnection
4. **Named Worlds**: Worlds identified by string names
5. **Phase-Scoped**: Simple implementation for early phase, can be enhanced later
6. **Error Clarity**: Clear error messages for missing worlds
