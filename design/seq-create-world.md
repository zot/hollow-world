# Sequence: Create World

**Source Spec:** game-worlds.md (lines 126-128)
**Use Case:** User creates a new MUD world from the world list

## Participants

- **User**: The person using the application
- **WorldListView**: World management overlay
- **CreateWorldModal**: New world creation dialog
- **MudStorage**: IndexedDB storage for worlds

## Sequence

```
       ┌─┐
       ║"│
       └┬┘
       ┌┼┐
        │             ┌─────────────┐          ┌────────────────┐           ┌──────────┐
       ┌┴┐            │WorldListView│          │CreateWorldModal│           │MudStorage│
      User            └──────┬──────┘          └────────┬───────┘           └─────┬────┘
        │ click "New World"  │                          │                         │
        │───────────────────>│                          │                         │
        │                    │                          │                         │
        │                    │         show()           │                         │
        │                    │─────────────────────────>│                         │
        │                    │                          │                         │
        │                    │                          │────┐                    │
        │                    │                          │    │ render()           │
        │                    │                          │<───┘                    │
        │                    │                          │                         │
        │                 display form                  │                         │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                         │
        │                    │                          │                         │
        │           enter name, click Create            │                         │
        │──────────────────────────────────────────────>│                         │
        │                    │                          │                         │
        │                    │                          │────┐                    │
        │                    │                          │    │ validateInputs()   │
        │                    │                          │<───┘                    │
        │                    │                          │                         │
        │                    │                          │createWorld(name, desc)  │
        │                    │                          │────────────────────────>│
        │                    │                          │                         │
        │                    │                          │        worldId          │
        │                    │                          │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
        │                    │                          │                         │
        │                    │                          │────┐                    │
        │                    │                          │    │ hide()             │
        │                    │                          │<───┘                    │
        │                    │                          │                         │
        │                    │   onSuccess(worldId)     │                         │
        │                    │<─────────────────────────│                         │
        │                    │                          │                         │
        │                    │────┐                     │                         │
        │                    │    │ loadWorlds()        │                         │
        │                    │<───┘                     │                         │
        │                    │                          │                         │
        │refresh world list  │                          │                         │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                          │                         │
      User            ┌──────┴──────┐          ┌────────┴───────┐           ┌─────┴────┐
       ┌─┐            │WorldListView│          │CreateWorldModal│           │MudStorage│
       ║"│            └─────────────┘          └────────────────┘           └──────────┘
       └┬┘
       ┌┼┐
        │
       ┌┴┐
```

## Notes

- **Default World**: Creates blank world with minimal starter content (single room)
- **YAML Import**: Modal optionally allows importing pre-built YAML world files
- **Validation**: Ensures world name is unique and non-empty
- **Auto-Select**: New world is NOT automatically selected after creation (user must click Start)
- **World List Refresh**: WorldListView reloads all worlds from storage to show new world
