# Sequence: TextCraft Solo Mode Command Execution

**CRC Cards:** crc-LocalMudSession.md, crc-WorldLoader.md
**Spec:** specs/integrate-textcraft.md

## Overview

This sequence shows how commands are executed in solo (single-player) mode without networking.
The LocalMudSession directly manages the MudConnection and routes output back to the UI.

## Participants

- **User** - Player interacting with the UI
- **Adventure View** - TextCraft UI component
- **LocalMudSession** - Solo session manager
- **MudConnection** - TextCraft command processor
- **World** - TextCraft world state

## Flow

1. User types a command in the Adventure View
2. View passes command to LocalMudSession
3. LocalMudSession forwards to MudConnection
4. MudConnection queries the World
5. World returns data
6. MudConnection generates output text
7. Output flows back through LocalMudSession to View
8. View displays text to User

## Sequence Diagram

```
     ┌────┐           ┌──────────────┐             ┌───────────────┐          ┌─────────────┐          ┌─────┐
     │User│           │Adventure View│             │LocalMudSession│          │MudConnection│          │World│
     └──┬─┘           └───────┬──────┘             └───────┬───────┘          └──────┬──────┘          └──┬──┘
        │    Type "look"      │                            │                         │                    │
        │────────────────────>│                            │                         │                    │
        │                     │                            │                         │                    │
        │                     │  executeCommand("look")    │                         │                    │
        │                     │───────────────────────────>│                         │                    │
        │                     │                            │                         │                    │
        │                     │                            │toplevelCommand("look")  │                    │
        │                     │                            │────────────────────────>│                    │
        │                     │                            │                         │                    │
        │                     │                            │                         │Query current room  │
        │                     │                            │                         │───────────────────>│
        │                     │                            │                         │                    │
        │                     │                            │                         │ Room description   │
        │                     │                            │                         │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
        │                     │                            │                         │                    │
        │                     │                            │  output(description)    │                    │
        │                     │                            │<────────────────────────│                    │
        │                     │                            │                         │                    │
        │                     │outputCallback(description) │                         │                    │
        │                     │<───────────────────────────│                         │                    │
        │                     │                            │                         │                    │
        │    Display text     │                            │                         │                    │
        │<────────────────────│                            │                         │                    │
     ┌──┴─┐           ┌───────┴──────┐             ┌───────┴───────┐          ┌──────┴──────┐          ┌──┴──┐
     │User│           │Adventure View│             │LocalMudSession│          │MudConnection│          │World│
     └────┘           └──────────────┘             └───────────────┘          └─────────────┘          └─────┘
```

## Key Points

- **No networking**: All communication is local function calls
- **Callback pattern**: Output delivered via callback function
- **Synchronous flow**: Each step waits for previous to complete
- **Direct connection**: LocalMudSession owns the MudConnection
