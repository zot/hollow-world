/**
 * Hollow World P2P Module - Main exports
 * Following universal-connectivity patterns with serverless architecture
 */

// Main API
export { HollowPeer } from './HollowPeer.js';

// Network components
export { P2PWebAppNetworkProvider } from './P2PWebAppNetworkProvider.js';
export { FriendsManager } from './FriendsManager.js';
export { LocalStorageProvider } from './LocalStorageProvider.js';

// Types
export type {
    // Message types
    IP2PMessage,
    IPingMessage,
    IPongMessage,
    IRequestFriendMessage,
    IAcceptFriendMessage,
    IDeclineFriendMessage,
    IAckMessage,
    IFriendRequestReceivedMessage,
    P2PMessage,
    // Friend types
    IFriend,
    // Service interfaces
    IStorageProvider,
    IFriendsManager,
    INetworkProvider
} from './types.js';

// Constants
export {
    CLIENT_VERSION,
    PEER_DISCOVERY_TIMEOUT,
    STORAGE_KEY_FRIENDS,
    STORAGE_KEY_NICKNAME,
    STORAGE_KEY_PENDING_NEW_INVITATIONS,
    STORAGE_KEY_PENDING_NEW_FRIEND_REQUESTS,
    STORAGE_KEY_DECLINED_FRIEND_REQUESTS,
    STORAGE_KEY_IGNORED_PEERS,
    STORAGE_KEY_RESENDABLE_MESSAGES,
    RESENDABLE_MESSAGE_RETRY_INTERVAL,
    RESENDABLE_MESSAGE_MAX_RETRIES
} from './constants.js';
