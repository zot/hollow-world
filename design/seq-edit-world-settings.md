# Sequence: Edit World Settings

**Source Spec:** game-worlds.md (line 127)
**Use Case:** User edits world settings (name, description, allowed users)

## Participants

- **User**: The person using the application
- **WorldListView**: World management overlay
- **WorldSettingsModal**: World settings editor dialog
- **MudStorage**: IndexedDB storage for worlds

## Sequence

```
       ┌─┐
       ║"│
       └┬┘
       ┌┼┐
        │             ┌─────────────┐          ┌──────────────────┐           ┌──────────┐
       ┌┴┐            │WorldListView│          │WorldSettingsModal│           │MudStorage│
      User            └──────┬──────┘          └─────────┬────────┘           └─────┬────┘
        │  click Edit (⚙️)   │                           │                          │
        │───────────────────>│                           │                          │
        │                    │                           │                          │
        │                    │      show(worldId)        │                          │
        │                    │──────────────────────────>│                          │
        │                    │                           │                          │
        │                    │                           │   loadWorld(worldId)     │
        │                    │                           │─────────────────────────>│
        │                    │                           │                          │
        │                    │                           │          world           │
        │                    │                           │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
        │                    │                           │                          │
        │                    │                           │────┐                     │
        │                    │                           │    │ render()            │
        │                    │                           │<───┘                     │
        │                    │                           │                          │
        │             display settings form              │                          │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                          │
        │                    │                           │                          │
        │          edit name/desc, click Save            │                          │
        │───────────────────────────────────────────────>│                          │
        │                    │                           │                          │
        │                    │                           │────┐                     │
        │                    │                           │    │ validateSettings()  │
        │                    │                           │<───┘                     │
        │                    │                           │                          │
        │                    │                           │   updateWorld(world)     │
        │                    │                           │─────────────────────────>│
        │                    │                           │                          │
        │                    │                           │────┐                     │
        │                    │                           │    │ hide()              │
        │                    │                           │<───┘                     │
        │                    │                           │                          │
        │                    │       onSuccess()         │                          │
        │                    │<──────────────────────────│                          │
        │                    │                           │                          │
        │                    │────┐                      │                          │
        │                    │    │ loadWorlds()         │                          │
        │                    │<───┘                      │                          │
        │                    │                           │                          │
        │refresh world list  │                           │                          │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                           │                          │
      User            ┌──────┴──────┐          ┌─────────┴────────┐           ┌─────┴────┐
       ┌─┐            │WorldListView│          │WorldSettingsModal│           │MudStorage│
       ║"│            └─────────────┘          └──────────────────┘           └──────────┘
       └┬┘
       ┌┼┐
        │
       ┌┴┐
```

## Notes

- **User Access Controls**: Modal allows managing which peer IDs can join multiplayer sessions
- **Validation**: Ensures world name remains unique and non-empty
- **Change Detection**: Only persists if settings actually changed
- **Active World**: If editing the currently active world, AdventureView reflects changes immediately
