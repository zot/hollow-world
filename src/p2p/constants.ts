/**
 * Constants for Hollow World P2P system
 */

// Client version
export const CLIENT_VERSION = '0.1.0';

// Timeouts (in milliseconds)
export const PEER_DISCOVERY_TIMEOUT = 120000; // 2 minutes for background peer resolution

// Storage keys
export const STORAGE_KEY_FRIENDS = 'hollowPeerFriends';
export const STORAGE_KEY_NICKNAME = 'hollowPeerNickname';
export const STORAGE_KEY_PENDING_NEW_FRIEND_REQUESTS = 'hollowPeerPendingNewFriendRequests';
export const STORAGE_KEY_DECLINED_FRIEND_REQUESTS = 'hollowPeerDeclinedFriendRequests';
export const STORAGE_KEY_IGNORED_PEERS = 'hollowPeerIgnoredPeers';
export const STORAGE_KEY_RESENDABLE_MESSAGES = 'hollowPeerResendableMessages';
export const STORAGE_KEY_BAN_LIST = 'hollow-banned-peers';

// Resendable messages
export const RESENDABLE_MESSAGE_RETRY_INTERVAL = 10000; // 10 seconds
export const RESENDABLE_MESSAGE_MAX_RETRIES = 12; // 12 retries = 2 minutes total

// P2P Network defaults
export const DEFAULT_PUBSUB_TOPIC = 'hollow-world';
export const DEFAULT_PEER_PROTOCOL = '/hollow-world/1.0.0';
