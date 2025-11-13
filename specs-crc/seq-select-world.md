# Sequence: Select World

**Source Spec:** specs/game-worlds.md (lines 118-120)
**Use Case:** User selects a world from the world list to start playing

## Participants

- **User**: The person using the application
- **WorldListView**: World management overlay
- **Router**: URL routing coordinator
- **AdventureMode**: Coordinator between views
- **AdventureView**: Adventure gameplay interface
- **MudStorage**: IndexedDB storage for worlds
- **MudControl**: TextCraft MUD engine

## Sequence

```
       ┌─┐
       ║"│
       └┬┘
       ┌┼┐
        │             ┌─────────────┐                 ┌──────┐             ┌─────────────┐           ┌─────────────┐          ┌──────────┐           ┌──────────┐
       ┌┴┐            │WorldListView│                 │Router│             │AdventureMode│           │AdventureView│          │MudStorage│           │MudControl│
      User            └──────┬──────┘                 └───┬──┘             └──────┬──────┘           └──────┬──────┘          └─────┬────┘           └─────┬────┘
        │  click Start (⭐)   │                            │                       │                         │                       │                      │
        │───────────────────>│                            │                       │                         │                       │                      │
        │                    │                            │                       │                         │                       │                      │
        │                    │navigate("/world/:worldId") │                       │                         │                       │                      │
        │                    │───────────────────────────>│                       │                         │                       │                      │
        │                    │                            │                       │                         │                       │                      │
        │                    │                            │showAdventure(worldId) │                         │                       │                      │
        │                    │                            │──────────────────────>│                         │                       │                      │
        │                    │                            │                       │                         │                       │                      │
        │                    │                            │                       │               loadWorld(worldId)                │                      │
        │                    │                            │                       │────────────────────────────────────────────────>│                      │
        │                    │                            │                       │                         │                       │                      │
        │                    │                            │                       │                     world                       │                      │
        │                    │                            │                       │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                      │
        │                    │                            │                       │                         │                       │                      │
        │                    │                            │                       │new AdventureView(world) │                       │                      │
        │                    │                            │                       │────────────────────────>│                       │                      │
        │                    │                            │                       │                         │                       │                      │
        │                    │                            │                       │                         │            new MudControl(world)             │
        │                    │                            │                       │                         │─────────────────────────────────────────────>│
        │                    │                            │                       │                         │                       │                      │
        │                    │                            │                       │                         │────┐                  │                      │
        │                    │                            │                       │                         │    │ render()         │                      │
        │                    │                            │                       │                         │<───┘                  │                      │
        │                    │                            │                       │                         │                       │                      │
        │                    │                  display adventure UI              │                         │                       │                      │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                       │                      │
      User            ┌──────┴──────┐                 ┌───┴──┐             ┌──────┴──────┐           ┌──────┴──────┐          ┌─────┴────┐           ┌─────┴────┐
       ┌─┐            │WorldListView│                 │Router│             │AdventureMode│           │AdventureView│          │MudStorage│           │MudControl│
       ║"│            └─────────────┘                 └──────┘             └─────────────┘           └─────────────┘          └──────────┘           └──────────┘
       └┬┘
       ┌┼┐
        │
       ┌┴┐
```

## Notes

- **Router Integration**: Clicking Start navigates to `/world/:worldId` route
- **View Transition**: AdventureMode switches from WorldListView to AdventureView
- **MUD Engine**: AdventureView creates MudControl instance with loaded world
- **Character Context**: Selected character from world connection used in session
- **Solo Mode**: Default session mode when starting world (no P2P)
