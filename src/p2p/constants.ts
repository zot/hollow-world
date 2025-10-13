/**
 * Constants for Hollow World P2P system
 * Following universal-connectivity pattern
 */

// Protocol identifiers
export const DIRECT_MESSAGE_PROTOCOL = '/hollow-world/dm/1.0.0';
// Using the universal-connectivity topic for peer discovery to benefit from existing bootstrap subscribers
// This allows discovery between HollowWorld instances and interoperability with other libp2p browser apps
// Note: Custom topics fail because the relay doesn't subscribe, creating a chicken-and-egg problem
export const PUBSUB_PEER_DISCOVERY_TOPIC = 'universal-connectivity-browser-peer-discovery';

// Client version
export const CLIENT_VERSION = '0.1.0';

// Timeouts (in milliseconds)
export const CONNECTION_TIMEOUT = 5000;
export const STREAM_TIMEOUT = 5000;
export const PEER_DISCOVERY_TIMEOUT = 120000; // 2 minutes for background peer resolution

// Peer discovery
export const PEER_DISCOVERY_INTERVAL = 10000; // 10 seconds

// Public IPFS bootstrap nodes (peer IDs only - used with delegated routing to discover relay addresses)
// NOTE: These are resolved via delegated routing to get dialable relay multiaddrs
export const BOOTSTRAP_PEER_IDS = [
    // Universal-connectivity bootstrap peer (from ucp2p - has known working relay addresses)
    '12D3KooWFhXabKDwALpzqMbto94sB7rvmZ6M28hs9Y9xSopDKwQr',
    // Public IPFS bootstrap nodes
    //'QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    //'QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    //'QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    //'QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
];

// Delegated routing endpoint (for relay discovery)
export const DELEGATED_ROUTING_ENDPOINT = 'https://delegated-ipfs.dev';

// Storage keys
export const STORAGE_KEY_PRIVATE_KEY = 'hollowPeerPrivateKey';
export const STORAGE_KEY_FRIENDS = 'hollowPeerFriends';
export const STORAGE_KEY_NICKNAME = 'hollowPeerNickname';
export const STORAGE_KEY_ACTIVE_INVITATIONS = 'hollowPeerActiveInvitations';
export const STORAGE_KEY_PENDING_REQUESTS = 'hollowPeerPendingFriendRequests';

// MIME type
export const MIME_APPLICATION_JSON = 'application/json';
