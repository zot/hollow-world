# Sequence: Start Adventure Mode

**Source Spec:** game-worlds.md (line 73)
**Use Case:** User navigates from Splash Screen to world list to begin playing

## Participants

- **User**: The person using the application
- **SplashScreen**: Main menu view with navigation buttons
- **Router**: URL routing and navigation coordinator
- **AdventureMode**: Coordinator managing world list and adventure views
- **WorldListView**: World management overlay (list, create, edit, delete)
- **MudStorage**: IndexedDB storage for MUD world data

## Sequence

```
       ┌─┐
       ║"│
       └┬┘
       ┌┼┐
        │             ┌────────────┐           ┌──────┐           ┌─────────────┐          ┌─────────────┐                    ┌──────────┐
       ┌┴┐            │SplashScreen│           │Router│           │AdventureMode│          │WorldListView│                    │MudStorage│
      User            └──────┬─────┘           └───┬──┘           └──────┬──────┘          └──────┬──────┘                    └─────┬────┘
        │   click "Games"    │                     │                     │                        │                                 │
        │───────────────────>│                     │                     │                        │                                 │
        │                    │                     │                     │                        │                                 │
        │                    │navigate("/worlds")  │                     │                        │                                 │
        │                    │────────────────────>│                     │                        │                                 │
        │                    │                     │                     │                        │                                 │
        │                    │                     │    initialize()     │                        │                                 │
        │                    │                     │────────────────────>│                        │                                 │
        │                    │                     │                     │                        │                                 │
        │                    │                     │                     │  new WorldListView()   │                                 │
        │                    │                     │                     │───────────────────────>│                                 │
        │                    │                     │                     │                        │                                 │
        │                    │                     │                     │       render()         │                                 │
        │                    │                     │                     │───────────────────────>│                                 │
        │                    │                     │                     │                        │                                 │
        │                    │                     │                     │                        │          loadWorlds()           │
        │                    │                     │                     │                        │────────────────────────────────>│
        │                    │                     │                     │                        │                                 │
        │                    │                     │                     │                        │            worlds[]             │
        │                    │                     │                     │                        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
        │                    │                     │                     │                        │                                 │
        │                    │                     │                     │                        │────┐                            │
        │                    │                     │                     │                        │    │ renderWorldItem() for each │
        │                    │                     │                     │                        │<───┘                            │
        │                    │                     │                     │                        │                                 │
        │                    │              display world list           │                        │                                 │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                                 │
      User            ┌──────┴─────┐           ┌───┴──┐           ┌──────┴──────┐          ┌──────┴──────┐                    ┌─────┴────┐
       ┌─┐            │SplashScreen│           │Router│           │AdventureMode│          │WorldListView│                    │MudStorage│
       ║"│            └────────────┘           └──────┘           └─────────────┘          └─────────────┘                    └──────────┘
       └┬┘
       ┌┼┐
        │
       ┌┴┐
```

## Notes

- **Router Integration**: `/worlds` route triggers AdventureMode initialization
- **Current Implementation**: AdventureMode does not exist - this functionality is embedded in AdventureView
- **View Creation**: AdventureMode creates WorldListView instance and delegates rendering
- **Data Loading**: WorldListView loads all worlds from MudStorage via IndexedDB
- **Display**: Each world rendered with Start, Character, Edit, Delete controls
