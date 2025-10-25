/**
 * Textcraft MUD Engine Integration
 *
 * This module provides the Textcraft text-based MUD engine integration
 * for Hollow World. It includes:
 * - IPeer interface and implementations
 * - Thing/World model
 * - MUD command system and connection management
 */

// Peer interface and types
export {
    IPeer,
    PeerID,
    UserInfo,
    current as currentPeer,
    setCurrent as setCurrentPeer
} from './peer';

// Model exports (Thing/World model)
export {
    Thing,
    World,
    MudStorage,
    Extension,
    thingId,
    storage as mudStorage
} from './model';

// MudControl exports (Command system)
export {
    MudConnection,
    createConnection,
    connection as mudConnection,
    activeWorld,
    currentVersion
} from './mudcontrol';

// Hollow-specific adapter
export { HollowIPeer } from './hollow-peer';
