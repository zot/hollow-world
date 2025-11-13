# Sequence: TextCraft Multiplayer Command Execution

**CRC Cards:** crc-HollowIPeer.md, crc-P2PWebAppNetworkProvider.md
**Spec:** specs/integrate-textcraft.md

## Overview

This sequence shows how commands are executed in multiplayer mode with a host/guest architecture.
The guest sends commands over the P2P network, the host executes them, and returns output.

## Participants

- **Guest** - Player connecting to a hosted world
- **Guest Adventure View** - TextCraft UI on guest's machine
- **HollowIPeer** - Guest's P2P adapter
- **p2p-webapp Network** - P2P infrastructure layer
- **Host HollowIPeer** - Host's P2P adapter
- **Host MudConnection** - Host's MudConnection (authoritative)
- **World** - TextCraft world state (on host)

## Flow

1. Guest types a command in their Adventure View
2. Guest's HollowIPeer sends command via P2P network using /hollow-mud/1.0.0 protocol
3. Network routes message to host's HollowIPeer
4. Host's HollowIPeer forwards command to appropriate MudConnection
5. Host's MudConnection executes command against World
6. World returns data
7. Host's MudConnection generates output text
8. Output flows back through host's HollowIPeer to P2P network
9. Network routes output to guest's HollowIPeer
10. Guest's HollowIPeer delivers output to Adventure View
11. View displays text to Guest

## Sequence Diagram

```
     ┌─────┐          ┌────────────────────┐           ┌───────────┐           ┌──────────────────┐           ┌────────────────┐           ┌──────────────────┐           ┌─────┐
     │Guest│          │Guest Adventure View│           │HollowIPeer│           │p2p-webapp Network│           │Host HollowIPeer│           │Host MudConnection│           │World│
     └──┬──┘          └──────────┬─────────┘           └─────┬─────┘           └─────────┬────────┘           └────────┬───────┘           └─────────┬────────┘           └──┬──┘
        │      Type "look"       │                           │                           │                             │                             │                       │
        │───────────────────────>│                           │                           │                             │                             │                       │
        │                        │                           │                           │                             │                             │                       │
        │                        │     command("look")       │                           │                             │                             │                       │
        │                        │──────────────────────────>│                           │                             │                             │                       │
        │                        │                           │                           │                             │                             │                       │
        │                        │                           │Send via /hollow-mud/1.0.0 │                             │                             │                       │
        │                        │                           │──────────────────────────>│                             │                             │                       │
        │                        │                           │                           │                             │                             │                       │
        │                        │                           │                           │      Receive command        │                             │                       │
        │                        │                           │                           │────────────────────────────>│                             │                       │
        │                        │                           │                           │                             │                             │                       │
        │                        │                           │                           │                             │  toplevelCommand("look")    │                       │
        │                        │                           │                           │                             │────────────────────────────>│                       │
        │                        │                           │                           │                             │                             │                       │
        │                        │                           │                           │                             │                             │      Query room       │
        │                        │                           │                           │                             │                             │──────────────────────>│
        │                        │                           │                           │                             │                             │                       │
        │                        │                           │                           │                             │                             │     Description       │
        │                        │                           │                           │                             │                             │<─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │
        │                        │                           │                           │                             │                             │                       │
        │                        │                           │                           │                             │        output(text)         │                       │
        │                        │                           │                           │                             │<────────────────────────────│                       │
        │                        │                           │                           │                             │                             │                       │
        │                        │                           │                           │        Send output          │                             │                       │
        │                        │                           │                           │<────────────────────────────│                             │                       │
        │                        │                           │                           │                             │                             │                       │
        │                        │                           │      Receive output       │                             │                             │                       │
        │                        │                           │<──────────────────────────│                             │                             │                       │
        │                        │                           │                           │                             │                             │                       │
        │                        │      Display output       │                           │                             │                             │                       │
        │                        │<──────────────────────────│                           │                             │                             │                       │
        │                        │                           │                           │                             │                             │                       │
        │       Show text        │                           │                           │                             │                             │                       │
        │<───────────────────────│                           │                           │                             │                             │                       │
     ┌──┴──┐          ┌──────────┴─────────┐           ┌─────┴─────┐           ┌─────────┴────────┐           ┌────────┴───────┐           ┌─────────┴────────┐           ┌──┴──┐
     │Guest│          │Guest Adventure View│           │HollowIPeer│           │p2p-webapp Network│           │Host HollowIPeer│           │Host MudConnection│           │World│
     └─────┘          └────────────────────┘           └───────────┘           └──────────────────┘           └────────────────┘           └──────────────────┘           └─────┘
```

## Key Points

- **Protocol**: Uses /hollow-mud/1.0.0 method in P2P messages
- **Authoritative host**: Only the host has the authoritative World state
- **Round-trip**: Command goes guest → host → world → host → guest
- **Shared peer**: Both TextCraft and Hollow use the same P2PWebAppNetworkProvider instance
- **Message routing**: HollowIPeer routes messages to correct MudConnection per peer
