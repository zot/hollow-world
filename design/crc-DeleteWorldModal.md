# DeleteWorldModal

**Source Spec:** game-worlds.md (line 127)

## Responsibilities

### Knows
- worldId: ID of world being deleted
- worldName: Name of world (for confirmation message)
- modalContainer: DOM element for modal overlay
- templateEngine: TemplateEngine instance for rendering

### Does
- show(worldId, worldName): Display delete confirmation modal
- hide(): Close modal and remove overlay
- render(): Display confirmation message with world name
- handleConfirmDelete(): Delete world from storage
- handleCancel(): Close modal without deleting world

## Collaborators

- **MudStorage**: Deletes world from IndexedDB
- **TemplateEngine**: Renders modal HTML template
- **WorldListView**: Refreshes world list after deletion, receives success callback
- **Router**: Switches to another world if deleted world was active

## Sequences

- seq-delete-world.md: User deletes world with confirmation

## Notes

- **Single Responsibility**: World deletion confirmation ONLY
- **Confirmation Required**: Shows world name and requires explicit confirmation
- **Auto-Switch**: If deleted world was active, automatically switches to another world
- **Modal Pattern**: Blocks interaction until user chooses
- **Destructive Action**: Uses clear warning language and confirmation button
- **Success Callback**: Notifies WorldListView when deletion completes
