# Sequence: Send Command

**Source Spec:** game-worlds.md (lines 85-87)
**Use Case:** User types a command and presses Enter to interact with the MUD world

## Participants

- **User**: The person playing the game
- **AdventureView**: Adventure gameplay interface (text output, command input)
- **MudControl**: TextCraft MUD engine coordinator
- **World**: MUD world state container
- **Thing**: MUD entity (player, room, object, etc.)

## Sequence

```
       ┌─┐
       ║"│
       └┬┘
       ┌┼┐
        │                   ┌─────────────┐               ┌──────────┐           ┌─────┐          ┌─────┐
       ┌┴┐                  │AdventureView│               │MudControl│           │World│          │Thing│
      User                  └──────┬──────┘               └─────┬────┘           └──┬──┘          └──┬──┘
        │type command, press Enter │                            │                   │                │
        │─────────────────────────>│                            │                   │                │
        │                          │                            │                   │                │
        │                          │────┐                       │                   │                │
        │                          │    │ addToHistory(command) │                   │                │
        │                          │<───┘                       │                   │                │
        │                          │                            │                   │                │
        │                          │  processCommand(command)   │                   │                │
        │                          │───────────────────────────>│                   │                │
        │                          │                            │                   │                │
        │                          │                            │findThing(player)  │                │
        │                          │                            │──────────────────>│                │
        │                          │                            │                   │                │
        │                          │                            │   playerThing     │                │
        │                          │                            │<─ ─ ─ ─ ─ ─ ─ ─ ─ │                │
        │                          │                            │                   │                │
        │                          │                            │        executeCommand(cmd)         │
        │                          │                            │───────────────────────────────────>│
        │                          │                            │                   │                │
        │                          │                            │                   │                │────┐
        │                          │                            │                   │                │    │ parse and execute
        │                          │                            │                   │                │<───┘
        │                          │                            │                   │                │
        │                          │                            │            output text             │
        │                          │                            │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
        │                          │                            │                   │                │
        │                          │        result text         │                   │                │
        │                          │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                   │                │
        │                          │                            │                   │                │
        │                          │────┐                       │                   │                │
        │                          │    │ displayOutput(text)   │                   │                │
        │                          │<───┘                       │                   │                │
        │                          │                            │                   │                │
        │   show output, scroll    │                            │                   │                │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                            │                   │                │
      User                  ┌──────┴──────┐               ┌─────┴────┐           ┌──┴──┐          ┌──┴──┐
       ┌─┐                  │AdventureView│               │MudControl│           │World│          │Thing│
       ║"│                  └─────────────┘               └──────────┘           └─────┘          └─────┘
       └┬┘
       ┌┼┐
        │
       ┌┴┐
```

## Notes

- **Command History**: AdventureView maintains command history for arrow key navigation
- **Text Parsing**: MudControl parses command and routes to appropriate Thing
- **Thing Execution**: Player Thing executes command, may interact with other Things
- **Output Display**: Result text appended to output area, auto-scrolls to bottom
- **Multiplayer**: In host/guest mode, commands sent via HollowIPeer to sync state
