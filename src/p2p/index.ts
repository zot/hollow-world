/**
 * Hollow World P2P Module - Main exports
 * Following universal-connectivity patterns with serverless architecture
 */

// Main API
export { HollowPeer } from './HollowPeer';

// Network components
export { LibP2PNetworkProvider } from './LibP2PNetworkProvider';
export { DirectMessageService, directMessage } from './DirectMessageService';
export { FriendsManager } from './FriendsManager';
export { LocalStorageProvider } from './LocalStorageProvider';
export { IPAddressDetector } from './IPAddressDetector';

// Types
export type {
    // Message types
    IP2PMessage,
    IRequestFriendMessage,
    IApproveFriendRequestMessage,
    IPingMessage,
    IPongMessage,
    P2PMessage,
    // Friend types
    IFriend,
    IInvitation,
    IActiveInvitation,
    // Service interfaces
    IStorageProvider,
    IFriendsManager,
    INetworkProvider,
    IDirectMessageEvent,
    IDirectMessageEvents,
    IMessageMetadata,
    IMessageRequest,
    IMessageResponse
} from './types';

// Constants
export {
    DIRECT_MESSAGE_PROTOCOL,
    PUBSUB_PEER_DISCOVERY_TOPIC,
    CLIENT_VERSION,
    CONNECTION_TIMEOUT,
    STREAM_TIMEOUT,
    PEER_DISCOVERY_TIMEOUT,
    PEER_DISCOVERY_INTERVAL,
    BOOTSTRAP_PEER_IDS,
    DELEGATED_ROUTING_ENDPOINT,
    STORAGE_KEY_PRIVATE_KEY,
    STORAGE_KEY_FRIENDS,
    STORAGE_KEY_NICKNAME,
    STORAGE_KEY_ACTIVE_INVITATIONS,
    STORAGE_KEY_PENDING_REQUESTS,
    MIME_APPLICATION_JSON
} from './constants';
