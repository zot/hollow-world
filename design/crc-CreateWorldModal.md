# CreateWorldModal

**Source Spec:** game-worlds.md (lines 127-128, implicit from world list behavior)

## Responsibilities

### Knows
- modalContainer: DOM element for modal overlay
- templateEngine: TemplateEngine instance for rendering
- worldName: User-entered name for new world
- worldDescription: User-entered description
- isYamlImport: Whether creating from YAML or blank template

### Does
- show(): Display create world modal dialog
- hide(): Close modal and remove overlay
- render(): Display form with name, description, YAML option
- handleCreate(): Validate input and create new world with default settings
- handleCancel(): Close modal without creating world
- handleYamlSelect(): Allow user to select YAML file for import
- createDefaultWorld(): Create blank world with minimal starter content
- importYamlWorld(file): Parse YAML and create world from file

## Collaborators

- **MudStorage**: Persists new world to IndexedDB
- **TemplateEngine**: Renders modal HTML template
- **WorldListView**: Refreshes world list after creation, receives success callback

## Sequences

- seq-create-world.md: User creates new world from world list

## Notes

- **Single Responsibility**: New world creation dialog ONLY
- **Default Settings**: Creates worlds with sensible defaults (empty room, basic setup)
- **YAML Import**: Supports importing pre-built YAML world files
- **Validation**: Ensures world name is unique and non-empty
- **Modal Pattern**: Blocks interaction with world list until closed
- **Success Callback**: Notifies WorldListView when world is created
