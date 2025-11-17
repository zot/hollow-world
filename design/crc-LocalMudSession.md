# LocalMudSession

**Source Spec:** integrate-textcraft.md
**Existing Code:** src/textcraft/local-session.ts
**Test Code:** (none - Phase 6)

## Responsibilities

### Knows
- `mudConnection: MudConnection | null` - Active MUD connection
- `world: World | null` - Loaded world
- `outputCallback: (text: string) => void` - Callback for MUD output

### Does
- **Session Management:**
  - `loadWorld(world)` - Load world and create local MudConnection
  - `executeCommand(cmd)` - Execute MUD command locally
  - `getWorld()` - Get current world
  - `getMudConnection()` - Get current connection

- **Output Handling:**
  - `handleOutput(text)` - Process MUD output and send to callback

- **Connection Setup:**
  - Creates MudConnection directly (bypasses network)
  - Initializes connection with world and output callback
  - Sets remote = false for local play

## Collaborators

- **MudConnection** (src/textcraft/mudcontrol.ts) - TextCraft command system
- **World** (src/textcraft/model.ts) - TextCraft world model
- **WorldLoader** (src/textcraft/world-loader.ts) - World creation/loading

## Code Review Notes

### ✅ Working well
- **Solo play support**: Manages single-player MUD session without networking
- **Clean API**: Simple load/execute interface
- **Callback pattern**: Output delivered via callback
- **Direct connection**: Bypasses createConnection() to avoid activeWorld issues
- **SOLID Principles**:
  - Single Responsibility: Local session management only
  - Dependency Injection: Output callback injected

### ✅ Matches spec perfectly
- Single-player MUD session management
- No network dependencies
- Clean command execution
- Output callback pattern

### 📝 Implementation details
- **Phase**: Phase 2.5 implementation
- **Connection mode**: remote = false (local play)
- **Initialization**: Sets mudConnectionConstructor on world
- **Direct creation**: Uses `new MudConnection()` instead of `createConnection()`

## Sequences

- seq-textcraft-solo-play.md (TBD - single-player session flow)
- seq-textcraft-execute-command.md (TBD - command execution)

## Related CRC Cards

- crc-WorldLoader.md - Loads worlds for session
- crc-HollowIPeer.md - Multiplayer alternative
- crc-MudConnection.md - Command processing

## Design Patterns

**Facade Pattern**: Simplifies local MUD session management
**Callback Pattern**: Output delivered via callback
**Template Method**: Follows MudConnection initialization pattern

## Key Design Decisions

1. **Solo Mode Only**: Designed for single-player gameplay (no networking)
2. **Direct Connection**: Creates MudConnection directly to avoid activeWorld conflicts
3. **Callback Output**: Output delivered via constructor-injected callback
4. **World Ownership**: Session owns the world reference
5. **Simple API**: Load world, execute commands - that's it
6. **Phase-Scoped**: Phase 2.5 implementation for early solo play
