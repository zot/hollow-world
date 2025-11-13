# Sequence: Switch to World List

**Source Spec:** specs/game-worlds.md (lines 111-112, 128)
**Use Case:** User navigates from adventure view back to world list overlay

## Participants

- **User**: The person playing the game
- **AdventureView**: Adventure gameplay interface
- **Router**: URL routing coordinator
- **AdventureMode**: Coordinator between views
- **WorldListView**: World management overlay

## Sequence

```
       ┌─┐
       ║"│
       └┬┘
       ┌┼┐
        │               ┌─────────────┐          ┌──────┐           ┌─────────────┐          ┌─────────────┐
       ┌┴┐              │AdventureView│          │Router│           │AdventureMode│          │WorldListView│
      User              └──────┬──────┘          └───┬──┘           └──────┬──────┘          └──────┬──────┘
        │click "Worlds" button │                     │                     │                        │
        │─────────────────────>│                     │                     │                        │
        │                      │                     │                     │                        │
        │                      │navigate("/worlds")  │                     │                        │
        │                      │────────────────────>│                     │                        │
        │                      │                     │                     │                        │
        │                      │                     │  showWorldList()    │                        │
        │                      │                     │────────────────────>│                        │
        │                      │                     │                     │                        │
        │                      │                     │                     │       render()         │
        │                      │                     │                     │───────────────────────>│
        │                      │                     │                     │                        │
        │                      │         display world list overlay        │                        │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
      User              ┌──────┴──────┐          ┌───┴──┐           ┌──────┴──────┐          ┌──────┴──────┐
       ┌─┐              │AdventureView│          │Router│           │AdventureMode│          │WorldListView│
       ║"│              └─────────────┘          └──────┘           └─────────────┘          └─────────────┘
       └┬┘
       ┌┼┐
        │
       ┌┴┐
```

## Notes

- **Full-Screen Overlay**: World list appears as overlay over adventure view
- **Browser History**: Router integration supports browser back/forward buttons
- **Route**: Navigates to `/worlds` route (not `/adventure/worlds` as spec originally suggested)
- **View Preservation**: AdventureView remains in memory while world list is displayed
- **Return**: User can start a different world or click Back to return to current adventure
