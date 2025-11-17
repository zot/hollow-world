# HollowIPeer

**Source Spec:** integrate-textcraft.md
**Existing Code:** src/textcraft/hollow-peer.ts
**Test Code:** (none - Phase 6)

## Responsibilities

### Knows
- `currentVersionID: string` - Current protocol/storage version
- `versionID: string` - Expected version for compatibility
- `networkProvider: INetworkProvider | null` - Hollow's P2P network provider (shared with rest of app)
- `mudConnections: Map<PeerID, MudConnection>` - Active MUD connections per peer
- `isHost: boolean` - Whether this peer is hosting a world
- `hostPeerID: PeerID | null` - ID of the host peer (if guest)
- `currentWorld: World | null` - Currently hosted world
- `storage: MudStorage | null` - MUD storage instance
- `app: any` - Application context
- `soloConnection: MudConnection | null` - Connection for solo play (no network)
- `thingToPeerMap: Map<Thing, PeerID>` - Maps character Things to peer IDs

### Does
- **Initialization:**
  - `init(app)` - Initialize peer with application context
  - `start(storage)` - Start peer with MUD storage

- **Solo Mode:**
  - `createConnection(output, remote)` - Create solo MUD connection (no network)
  - `soloCreateConnection(world, output)` - Internal solo connection creation

- **Host Mode:**
  - `startHosting(world)` - Start hosting a world
  - `handleMudMessage(peerId, message)` - Route incoming MUD messages from guests
  - `sendToGuest(peerId, message)` - Send message to specific guest

- **Guest Mode:**
  - `connectToHost(hostPeerId, output)` - Connect to a host's world as guest
  - `sendToHost(message)` - Send command/message to host

- **User Management:**
  - `getUsers()` - Get list of connected users
  - `updateUserList()` - Notify all peers of user changes
  - `removeUser(peerId)` - Remove disconnected user

- **Utilities:**
  - `getPeerID()` - Get current peer ID
  - `isConnected()` - Check if network is active

## Collaborators

- **INetworkProvider** (src/p2p/types.ts) - Hollow's P2P network abstraction
- **MudConnection** (src/textcraft/mudcontrol.ts) - TextCraft command/connection system
- **World** (src/textcraft/model.ts) - TextCraft world model
- **Thing** (src/textcraft/model.ts) - TextCraft entity model
- **MudStorage** (src/textcraft/model.ts) - TextCraft storage system

## Code Review Notes

### ✅ Working well
- **Adapter Pattern**: Cleanly implements IPeer interface for Hollow's P2P
- **Shared Peer Instance**: Uses existing networkProvider (no duplicate peer)
- **Solo Mode Support**: Works without network provider for single-player
- **Message Routing**: Clear host/guest command routing
- **SOLID Principles**:
  - Single Responsibility: P2P adapter only
  - Dependency Injection: NetworkProvider injected
  - Interface Segregation: Implements IPeer interface

### ✅ Matches spec perfectly
- Uses existing P2P infrastructure (no duplication)
- Implements all 12 IPeer interface methods
- Supports host/guest/solo modes
- Routes MUD messages via P2P message protocol
- Shares peer ID with rest of application

### 📝 Implementation details
- **Protocol**: Uses 'mud' method in P2P messages
- **Message types**: command, output, userUpdate, login, welcome
- **Solo mode**: Creates local MudConnection when no network provider
- **Version**: Protocol version 1.0.0

## Sequences

- seq-textcraft-start-hosting.md (TBD - host mode initialization)
- seq-textcraft-connect-guest.md (TBD - guest connecting to host)
- seq-textcraft-send-command.md (TBD - command routing)

## Related CRC Cards

- crc-P2PWebAppNetworkProvider.md - Network provider implementation
- crc-HollowPeer.md - Main P2P coordinator
- crc-LocalMudSession.md - Solo session manager
- crc-WorldLoader.md - World loading

## Design Patterns

**Adapter Pattern**: Adapts Hollow's INetworkProvider to TextCraft's IPeer interface
**Bridge Pattern**: Bridges TextCraft MUD engine to Hollow's P2P infrastructure
**Singleton**: Shares single network provider instance with rest of app
**Strategy Pattern**: Different message routing strategies for host/guest/solo modes

## Key Design Decisions

1. **Shared Peer Instance**: Uses existing networkProvider from HollowPeer (CRITICAL - no duplicate peers)
2. **Solo Mode Fallback**: Works without network for single-player gameplay
3. **Protocol Separation**: MUD messages use 'mud' method, don't conflict with friend requests etc.
4. **Map-based Routing**: mudConnections map routes messages to correct MudConnection per peer
5. **Thing-to-Peer Tracking**: thingToPeerMap associates character Things with owning peers
6. **Version Compatibility**: Includes version checking for protocol compatibility
7. **No Direct libp2p**: Uses Hollow's P2P abstractions, not direct libp2p streams
