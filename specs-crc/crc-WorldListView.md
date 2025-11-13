# WorldListView

**Source Spec:** specs/game-worlds.md (lines 110-136)

## Responsibilities

### Knows
- worlds: Array of available MUD worlds
- selectedWorldId: ID of world user has selected
- templateEngine: TemplateEngine instance for rendering
- mudStorage: MudStorage instance for persistence

### Does
- render(): Display world list overlay with header and world items
- renderWorldItem(world): Display single world row with controls
- renderCharacterDropdown(world): Display character selection dropdown for world
- handleStartWorld(worldId): Load world and navigate to adventure view
- handleNewWorld(): Open create world modal
- handleEditWorld(worldId): Open world settings modal
- handleDeleteWorld(worldId): Open delete confirmation modal
- handleCharacterSelection(worldId, characterId): Link character to world connection
- handleUnlinkCharacter(worldId, characterId): Remove character from world connection
- loadWorlds(): Fetch all worlds from MudStorage
- cleanup(): Dispose of resources

## Collaborators

- **MudStorage**: Loads and persists world data via IndexedDB
- **CreateWorldModal**: Handles new world creation dialog
- **WorldSettingsModal**: Handles world settings editing dialog
- **DeleteWorldModal**: Handles world deletion confirmation
- **Character**: Hollow character data for character-world linking
- **TemplateEngine**: Renders HTML templates for UI
- **Router**: Navigation to adventure view when world is started

## Sequences

- seq-start-adventure-mode.md: Initial world list display
- seq-create-world.md: Create new world flow
- seq-edit-world-settings.md: Edit world settings flow
- seq-delete-world.md: Delete world confirmation flow
- seq-select-world.md: Start world and navigate to adventure

## Notes

- **Single Responsibility**: World management ONLY (list, create, edit, delete, character linking)
- **No Gameplay**: Does NOT handle adventure gameplay (that's AdventureView)
- **Full-Screen Overlay**: Accessed via "🌵 Worlds" button in AdventureView
- **Character Linking**: Manages world connections (character-to-world associations)
- **Default Character**: Shows default character for each world, allows selection
- **Alphabetical Ordering**: Characters sorted by name, linked characters first
- **Browser Integration**: Supports browser back/forward navigation
