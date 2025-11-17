# Test Design: TextCraftIntegration

**Component:** TextCraft MUD Integration (LocalMudSession, TemplateEngine, AdventureMode, AdventureView)
**CRC References:** crc-LocalMudSession.md, crc-TemplateEngine.md, crc-AdventureMode.md, crc-AdventureView.md, crc-CharacterSync.md
**Spec Reference:** specs/integrate-textcraft.md, specs/characters.md
**Implementation Test:** test/TemplateEngine.test.ts, test/character-sync.test.ts

## Component Overview

TextCraft Integration enables text-based MUD gameplay within HollowWorld. Includes world creation/loading, command processing, character synchronization, and multiplayer sessions. Uses Thing property persistence pattern.

## Test Categories

### Unit Tests - TemplateEngine

#### Template Compilation Tests

**Test Case: Compile Simple Template**
- Purpose: Verify template compilation
- Setup: Template string with variables
- Input: Compile template with `{{variable}}`
- Expected: Function returned that accepts data
- Related CRC: crc-TemplateEngine.md (compileTemplate)
- Implementation: test/TemplateEngine.test.ts (line 15-25)

**Test Case: Render Compiled Template**
- Purpose: Verify template rendering with data
- Setup: Compiled template
- Input: Render with { name: 'Alice' }
- Expected: Returns HTML with 'Alice' inserted
- Related CRC: crc-TemplateEngine.md (render)
- Implementation: test/TemplateEngine.test.ts (line 27-40)

**Test Case: Template with Loops**
- Purpose: Verify {{#each}} loops
- Setup: Template with `{{#each items}}`
- Input: Render with array data
- Expected: Items rendered in loop
- Related CRC: crc-TemplateEngine.md
- Implementation: test/TemplateEngine.test.ts (line 42-60)

**Test Case: Template with Conditionals**
- Purpose: Verify {{#if}} conditionals
- Setup: Template with `{{#if condition}}`
- Input: Render with boolean data
- Expected: Conditional content rendered correctly
- Related CRC: crc-TemplateEngine.md
- Implementation: test/TemplateEngine.test.ts (line 62-85)

**Test Case: Load Template from File**
- Purpose: Verify loading template from filesystem
- Setup: Template file exists
- Input: Call loadTemplate('character-card.html')
- Expected: Template loaded and compiled
- Related CRC: crc-TemplateEngine.md (loadTemplateFromFile)
- Implementation: test/TemplateEngine.test.ts (line 87-100)

**Test Case: Template Caching**
- Purpose: Verify templates cached after load
- Setup: Template file
- Input: Load same template twice
- Expected: Second load uses cache
- Related CRC: crc-TemplateEngine.md
- Implementation: test/TemplateEngine.test.ts (line 102-115)

**Test Case: HTML Escaping**
- Purpose: Verify XSS protection
- Setup: Template with variable
- Input: Render with data containing `<script>`
- Expected: HTML escaped (not executed)
- Related CRC: crc-TemplateEngine.md
- Implementation: test/TemplateEngine.test.ts (line 117-130)

### Unit Tests - LocalMudSession

#### Session Creation Tests

**Test Case: Create New World**
- Purpose: Verify world creation
- Setup: None
- Input: Call createWorld(name, description)
- Expected: World created with ID, saved to storage
- Related CRC: crc-LocalMudSession.md (createWorld)
- Related Sequence: seq-create-world.md

**Test Case: Load Existing World**
- Purpose: Verify world loading from storage
- Setup: World in MudStorage
- Input: Call loadWorld(worldId)
- Expected: World loaded with state
- Related CRC: crc-LocalMudSession.md (loadWorld)

**Test Case: Delete World**
- Purpose: Verify world deletion
- Setup: World exists
- Input: Call deleteWorld(worldId)
- Expected: World removed from storage
- Related CRC: crc-LocalMudSession.md (deleteWorld)
- Related Sequence: seq-delete-world.md

**Test Case: List All Worlds**
- Purpose: Verify world enumeration
- Setup: Multiple worlds in storage
- Input: Call listWorlds()
- Expected: Array of world metadata
- Related CRC: crc-LocalMudSession.md (listWorlds)

#### Command Processing Tests

**Test Case: Process Simple Command**
- Purpose: Verify command execution
- Setup: World loaded
- Input: Send command "look"
- Expected: Room description returned
- Related CRC: crc-LocalMudSession.md (processCommand)
- Related Sequence: seq-textcraft-solo-command.md

**Test Case: Process Multi-Word Command**
- Purpose: Verify complex commands
- Setup: World loaded
- Input: Send command "get rusty key"
- Expected: Item picked up, confirmation message
- Related CRC: crc-LocalMudSession.md

**Test Case: Invalid Command**
- Purpose: Verify error handling
- Setup: World loaded
- Input: Send command "invalidcommand"
- Expected: Error message returned
- Related CRC: crc-LocalMudSession.md

**Test Case: Command History**
- Purpose: Verify command history tracking
- Setup: Send multiple commands
- Input: Retrieve command history
- Expected: Previous commands available
- Related CRC: crc-LocalMudSession.md

#### Character Synchronization Tests

**Test Case: Load Character into World**
- Purpose: Verify character loaded as Thing
- Setup: Character in storage, world loaded
- Input: Call loadCharacterIntoWorld(characterId, worldId)
- Expected: Character Thing created with attributes
- Related CRC: crc-LocalMudSession.md (loadCharacter)
- Related Sequence: seq-load-character.md
- Implementation: test/character-sync.test.ts (line 30-50)

**Test Case: Sync Character Changes to Storage**
- Purpose: Verify character updates saved
- Setup: Character Thing in world
- Input: Modify character Thing, trigger sync
- Expected: Character storage updated
- Related CRC: crc-CharacterSync.md (syncCharacterToStorage)
- Related Sequence: seq-textcraft-character-sync.md
- Implementation: test/character-sync.test.ts (line 52-75)

**Test Case: Thing Property Persistence**
- Purpose: Verify only `_` and `!` properties persist
- Setup: Character Thing with various properties
- Input: Save Thing to storage
- Expected: Only `_data` and `!functions` saved, not transient props
- Related CRC: crc-CharacterSync.md
- Related Spec: specs/coding-standards.md (TextCraft Thing Storage)
- Implementation: test/character-sync.test.ts (line 77-100)

**Test Case: Character Accessor Pattern**
- Purpose: Verify `thing.character` → `thing._character`
- Setup: Character Thing
- Input: Access thing.character
- Expected: Returns thing._character (storage property)
- Related CRC: crc-CharacterSync.md
- Related Spec: specs/coding-standards.md (Accessor Pattern)
- Implementation: test/character-sync.test.ts (line 102-115)

**Test Case: Character Damage Tracking**
- Purpose: Verify wounds sync to storage
- Setup: Character Thing in combat
- Input: Modify thing.character.wounds
- Expected: Wounds updated in storage
- Related CRC: crc-CharacterSync.md
- Implementation: test/character-sync.test.ts (line 117-135)

### Integration Tests

**Test Case: Create World and Enter**
- Purpose: Verify complete world creation flow
- Setup: None
- Input: Create world, load world, send "look" command
- Expected: World created, room description shown
- Related CRC: crc-LocalMudSession.md, crc-AdventureMode.md
- Related Sequence: seq-create-world.md

**Test Case: Character in World Gameplay**
- Purpose: Verify character moves, interacts, takes damage
- Setup: World with character
- Input: Send movement/combat commands
- Expected: Character state updates, syncs to storage
- Related CRC: crc-LocalMudSession.md, crc-CharacterSync.md

**Test Case: Multiplayer Session**
- Purpose: Verify multiple players in same world
- Setup: World hosted, multiple clients connected
- Input: Players send commands
- Expected: All players see world state updates
- Related CRC: crc-LocalMudSession.md, crc-HollowPeer.md
- Related Sequence: seq-textcraft-multiplayer-command.md

**Test Case: Save and Load World State**
- Purpose: Verify world persistence
- Setup: Active world with state
- Input: Save world, reload world
- Expected: World state restored
- Related CRC: crc-LocalMudSession.md, crc-WorldLoader.md

### E2E Tests

**Test Case: Create World Flow**
- Purpose: Verify UI world creation
- Setup: World list view
- Input: Click New World, enter name/description, create
- Expected: World created, adventure view opens
- Test Type: Playwright E2E
- Related: test/e2e/world.test.js (line 20-40)

**Test Case: Enter World and Play**
- Purpose: Verify gameplay workflow
- Setup: World exists
- Input: Click world, send commands, verify responses
- Expected: Commands processed, output displayed
- Test Type: Playwright E2E

**Test Case: Character Sync in World**
- Purpose: Verify character damage persists
- Setup: Character in world
- Input: Take damage in world, exit world, check character
- Expected: Character wounds saved
- Test Type: Playwright E2E

### Edge Cases

**Test Case: Empty World Name**
- Purpose: Verify validation
- Setup: Create world form
- Input: Empty name
- Expected: Error or default name
- Related CRC: crc-LocalMudSession.md

**Test Case: Duplicate World Name**
- Purpose: Verify handling of name collision
- Setup: World named "Test" exists
- Input: Create another "Test" world
- Expected: Allowed (IDs unique) or name modified
- Related CRC: crc-LocalMudSession.md

**Test Case: Very Long Command**
- Purpose: Verify command length limits
- Setup: World loaded
- Input: Send 10,000 character command
- Expected: Truncated or error
- Related CRC: crc-LocalMudSession.md

**Test Case: Rapid Command Sending**
- Purpose: Verify handling of command spam
- Setup: World loaded
- Input: Send 100 commands rapidly
- Expected: All processed or rate limited
- Related CRC: crc-LocalMudSession.md

**Test Case: Character Without worldId**
- Purpose: Verify validation when character not in world
- Setup: Character with worldId = null
- Input: Attempt to sync
- Expected: Error or skipped
- Related CRC: crc-CharacterSync.md

**Test Case: Missing Character Data**
- Purpose: Verify handling of corrupted character
- Setup: Thing with missing _character property
- Input: Attempt sync
- Expected: Error handled gracefully
- Related CRC: crc-CharacterSync.md

**Test Case: MudStorage Full**
- Purpose: Verify handling of storage quota
- Setup: IndexedDB near quota
- Input: Save large world
- Expected: Error message, cleanup or compression
- Related CRC: crc-LocalMudSession.md

**Test Case: Template Not Found**
- Purpose: Verify handling of missing template
- Setup: None
- Input: Load nonexistent template
- Expected: Error message, fallback content
- Related CRC: crc-TemplateEngine.md

**Test Case: Circular Template References**
- Purpose: Verify handling of template loops
- Setup: Template A includes Template B, B includes A
- Input: Render Template A
- Expected: Error or recursion limit
- Related CRC: crc-TemplateEngine.md

**Test Case: Thing Property Conflicts**
- Purpose: Verify accessor pattern with naming conflicts
- Setup: Thing with both `character` and `_character`
- Input: Access thing.character
- Expected: Accessor returns `_character`, no confusion
- Related CRC: crc-CharacterSync.md

## Coverage Goals

- Test TemplateEngine (compile, render, cache, escape, file loading)
- Test LocalMudSession (world create/load/delete, commands, character sync)
- Test CharacterSync (Thing property persistence, accessor pattern, damage tracking)
- Test AdventureMode/AdventureView (UI integration)
- Test Thing storage pattern (`_` and `!` properties)
- Test multiplayer sessions
- Test world persistence
- Test edge cases (empty names, large data, missing templates, storage quota)
- E2E tests for world creation and gameplay

## Notes

- TextCraft MUD is embedded text-based game engine
- Thing property persistence: `_` for data, `!` for functions
- Character accessor pattern: `thing.character` → `thing._character`
- World storage uses IndexedDB (MudStorage)
- Character storage uses LocalStorage (CharacterStorageService)
- Multiplayer via P2P (HollowPeer)
- Template engine supports loops, conditionals, escaping
- Implementation tests exist: test/TemplateEngine.test.ts, test/character-sync.test.ts
- E2E test exists: test/e2e/world.test.js
