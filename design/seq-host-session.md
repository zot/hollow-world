# Sequence: Host Session

**Source Spec:** game-worlds.md (line 138)
**Use Case:** User starts hosting a multiplayer session for others to join

## Participants

- **User**: The person hosting the game
- **AdventureView**: Adventure gameplay interface
- **SessionControls**: Session mode control buttons
- **HollowIPeer**: TextCraft IPeer adapter for P2P
- **P2PWebAppNetworkProvider**: Existing Hollow P2P infrastructure

## Sequence

```
       ┌─┐
       ║"│
       └┬┘
       ┌┼┐
        │             ┌─────────────┐              ┌───────────────┐          ┌───────────┐          ┌────────────────────────┐
       ┌┴┐            │AdventureView│              │SessionControls│          │HollowIPeer│          │P2PWebAppNetworkProvider│
      User            └──────┬──────┘              └───────┬───────┘          └─────┬─────┘          └────────────┬───────────┘
        │              click "Host Session"                │                        │                             │
        │─────────────────────────────────────────────────>│                        │                             │
        │                    │                             │                        │                             │
        │                    │    startSession("host")     │                        │                             │
        │                    │<────────────────────────────│                        │                             │
        │                    │                             │                        │                             │
        │                    │                   startHosting()                     │                             │
        │                    │─────────────────────────────────────────────────────>│                             │
        │                    │                             │                        │                             │
        │                    │                             │                        │  advertise world session    │
        │                    │                             │                        │────────────────────────────>│
        │                    │                             │                        │                             │
        │                    │                             │                        │      hosting started        │
        │                    │                             │                        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
        │                    │                             │                        │                             │
        │                    │                  host mode active                    │                             │
        │                    │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                             │
        │                    │                             │                        │                             │
        │                    │────┐                        │                        │                             │
        │                    │    │ updateSessionDisplay() │                        │                             │
        │                    │<───┘                        │                        │                             │
        │                    │                             │                        │                             │
        │ show "Host" mode   │                             │                        │                             │
        │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                             │                        │                             │
      User            ┌──────┴──────┐              ┌───────┴───────┐          ┌─────┴─────┐          ┌────────────┴───────────┐
       ┌─┐            │AdventureView│              │SessionControls│          │HollowIPeer│          │P2PWebAppNetworkProvider│
       ║"│            └─────────────┘              └───────────────┘          └───────────┘          └────────────────────────┘
       └┬┘
       ┌┼┐
        │
       ┌┴┐
```

## Notes

- **Existing P2P**: MUST use app's existing P2PWebAppNetworkProvider instance (no duplicates)
- **Peer Discovery**: Host advertises world session via p2p-webapp pubsub topic
- **Guest Commands**: Guest commands are sent to host, processed by host's MUD engine, output synced to all
- **Status Display**: Header shows "● Host" with blue dot indicator
- **Session End**: Host can return to Solo mode, disconnecting all guests
