# WorldSettingsModal

**Source Spec:** specs/game-worlds.md (line 127)

## Responsibilities

### Knows
- worldId: ID of world being edited
- world: World instance being edited
- modalContainer: DOM element for modal overlay
- templateEngine: TemplateEngine instance for rendering
- editedName: Modified world name
- editedDescription: Modified world description
- allowedUsers: List of peer IDs allowed to join (for multiplayer)

### Does
- show(worldId): Display settings modal for specified world
- hide(): Close modal and remove overlay
- render(): Display form with name, description, user access controls
- loadWorld(worldId): Fetch world data from storage
- handleSave(): Validate and persist changes to world
- handleCancel(): Close modal without saving changes
- handleAddUser(peerId): Add peer to allowed users list
- handleRemoveUser(peerId): Remove peer from allowed users list
- validateSettings(): Ensure name is non-empty and unique

## Collaborators

- **MudStorage**: Loads world for editing, persists changes
- **TemplateEngine**: Renders modal HTML template
- **WorldListView**: Refreshes world list after edit, receives success callback
- **FriendsManager**: Lists available friends for user access controls

## Sequences

- seq-edit-world-settings.md: User edits world settings from world list

## Notes

- **Single Responsibility**: World settings editing dialog ONLY
- **User Access**: Controls which peers can join multiplayer sessions (allowlist)
- **Validation**: Ensures world name remains unique and valid
- **Modal Pattern**: Blocks interaction until closed
- **Change Detection**: Only persists if settings actually changed
- **Success Callback**: Notifies WorldListView when settings are saved
