# Sequence: Join Session

**Source Spec:** specs/game-worlds.md (line 138)
**Use Case:** User joins a multiplayer session hosted by another peer

## Participants

- **User**: The person joining the game
- **SessionControls**: Session mode control buttons
- **JoinSessionModal**: Join session dialog
- **AdventureView**: Adventure gameplay interface
- **HollowIPeer**: TextCraft IPeer adapter for P2P
- **P2PWebAppNetworkProvider**: Existing Hollow P2P infrastructure

## Sequence

```
       ┌─┐
       ║"│
       └┬┘
       ┌┼┐
        │             ┌───────────────┐          ┌────────────────┐               ┌─────────────┐                ┌───────────┐          ┌────────────────────────┐
       ┌┴┐            │SessionControls│          │JoinSessionModal│               │AdventureView│                │HollowIPeer│          │P2PWebAppNetworkProvider│
      User            └───────┬───────┘          └────────┬───────┘               └──────┬──────┘                └─────┬─────┘          └────────────┬───────────┘
        │click "Join Session" │                           │                              │                             │                             │
        │────────────────────>│                           │                              │                             │                             │
        │                     │                           │                              │                             │                             │
        │                     │          show()           │                              │                             │                             │
        │                     │──────────────────────────>│                              │                             │                             │
        │                     │                           │                              │                             │                             │
        │                     │                           │────┐                         │                             │                             │
        │                     │                           │    │ render()                │                             │                             │
        │                     │                           │<───┘                         │                             │                             │
        │                     │                           │                              │                             │                             │
        │               display join form                 │                              │                             │                             │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                              │                             │                             │
        │                     │                           │                              │                             │                             │
        │  enter peer ID, select character, click Join    │                              │                             │                             │
        │────────────────────────────────────────────────>│                              │                             │                             │
        │                     │                           │                              │                             │                             │
        │                     │                           │────┐                         │                             │                             │
        │                     │                           │    │ validateInputs()        │                             │                             │
        │                     │                           │<───┘                         │                             │                             │
        │                     │                           │                              │                             │                             │
        │                     │                           │                   connectToHost(peerId)                    │                             │
        │                     │                           │───────────────────────────────────────────────────────────>│                             │
        │                     │                           │                              │                             │                             │
        │                     │                           │                              │                             │  establish P2P connection   │
        │                     │                           │                              │                             │────────────────────────────>│
        │                     │                           │                              │                             │                             │
        │                     │                           │                              │                             │   connection established    │
        │                     │                           │                              │                             │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
        │                     │                           │                              │                             │                             │
        │                     │                           │                         connected                          │                             │
        │                     │                           │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                             │
        │                     │                           │                              │                             │                             │
        │                     │                           │────┐                         │                             │                             │
        │                     │                           │    │ hide()                  │                             │                             │
        │                     │                           │<───┘                         │                             │                             │
        │                     │                           │                              │                             │                             │
        │                     │                           │startSession("guest", peerId) │                             │                             │
        │                     │                           │─────────────────────────────>│                             │                             │
        │                     │                           │                              │                             │                             │
        │                     │                           │                              │────┐                        │                             │
        │                     │                           │                              │    │ updateSessionDisplay() │                             │
        │                     │                           │                              │<───┘                        │                             │
        │                     │                           │                              │                             │                             │
        │                     │         show "Guest" mode │                              │                             │                             │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                             │                             │
      User            ┌───────┴───────┐          ┌────────┴───────┐               ┌──────┴──────┐                ┌─────┴─────┐          ┌────────────┴───────────┐
       ┌─┐            │SessionControls│          │JoinSessionModal│               │AdventureView│                │HollowIPeer│          │P2PWebAppNetworkProvider│
       ║"│            └───────────────┘          └────────────────┘               └─────────────┘                └───────────┘          └────────────────────────┘
       └┬┘
       ┌┼┐
        │
       ┌┴┐
```

## Notes

- **Peer ID Entry**: User enters host's peer ID manually or selects from friends list
- **Character Selection**: Guest selects which character to play with in session
- **Existing P2P**: Uses app's existing P2PWebAppNetworkProvider (same peer ID as rest of app)
- **Guest Commands**: Commands sent to host via P2P, processed by host's MUD engine
- **Output Sync**: Host sends output to all guests, everyone sees same game state
- **Status Display**: Header shows "● Guest" with yellow dot indicator
- **Connection Feedback**: Modal shows loading state during connection attempt
- **Error Handling**: If connection fails, modal displays error message
