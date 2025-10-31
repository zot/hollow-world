/**
 * TypeScript types and interfaces for Hollow World P2P system
 * Following SOLID principles and universal-connectivity patterns
 */

import type { Stream, Connection } from '@libp2p/interface';
import type { ICharacter } from '../character/types.js';

// Re-export ICharacter for convenience
export type { ICharacter };

// ==================== P2P Message Types ====================

export interface IP2PMessage {
    method: string;
}

export interface IPingMessage extends IP2PMessage {
    method: 'ping';
    timestamp: number;
    messageId: string;
}

export interface IPongMessage extends IP2PMessage {
    method: 'pong';
    timestamp: number;
    messageId: string;
}

// Resendable messages with UUID tracking
export interface IResendableMessage extends IP2PMessage {
    messageId: string;    // UUID for tracking
    sender: string;       // Sender's peer ID
    target: string;       // Target peer ID
}

export interface IRequestFriendMessage extends IResendableMessage {
    method: 'requestFriend';
    playerName: string;   // Sender's player name from settings
}

export interface IAcceptFriendMessage extends IResendableMessage {
    method: 'acceptFriend';
}

export interface IDeclineFriendMessage extends IResendableMessage {
    method: 'declineFriend';
}

export interface IAckMessage extends IP2PMessage {
    method: 'ack';
    messageId: string;    // The messageId from the original resendable message
}

export interface IFriendRequestReceivedMessage extends IP2PMessage {
    method: 'friendRequestReceived';
}

export interface IMudMessage extends IP2PMessage {
    method: 'mud';
    payload: any;  // MudMessage payload from textcraft integration
}

export type P2PMessage =
    | IPingMessage
    | IPongMessage
    | IRequestFriendMessage
    | IAcceptFriendMessage
    | IDeclineFriendMessage
    | IAckMessage
    | IFriendRequestReceivedMessage
    | IMudMessage;

// ==================== Friend Types ====================

export interface IFriendWorld {
    worldId: string;                    // TextCraft world ID
    worldName: string;                  // Human-readable world name
    hostPeerId: string;                 // Who hosts this world (could be me or friend)
    characters: IFriendCharacter[];     // Friend's characters in this world
    // Note: If hostPeerId === friend.peerId, friend hosts and I can join
    //       If hostPeerId === myPeerId, I host and friend can join
}

export interface IFriendCharacter {
    character: ICharacter;         // Full copy as it exists in the world (includes character.id)
    characterHash: string;         // SHA-256 hash for integrity verification
    // Note: character.id serves as the identifier - no need for separate characterId field
}

export interface IFriend {
    peerId: string;       // LibP2P peer ID (unique identifier)
    playerName: string;   // Display name for the friend
    notes: string;        // Private notes (not transmitted in messages)
    pending?: boolean;    // Optional: true when friend request is sent but not yet acknowledged
    worlds?: IFriendWorld[];  // NEW - optional for backward compatibility
    // Worlds can be:
    //   - Hosted by friend (I join their world)
    //   - Hosted by me (friend joins my world)
    // Both scenarios tracked in same array, distinguished by hostPeerId
}

// ==================== Storage Types ====================

export interface IIgnoredPeer {
    peerId: string;
    peerName: string;
}

export interface IPendingInvitation {
    state: 'resend' | 'sent';  // State tracking for retry logic
    friend: IFriend;           // The friend being requested
}

export interface IResendableMessageStorage {
    message: IResendableMessage;
    retryCount: number;
    nextRetryTime: number;
    ackHandler?: () => void;
}

// ==================== Storage Interface (Dependency Inversion) ====================

export interface IStorageProvider {
    save(key: string, data: any): Promise<void>;
    load<T>(key: string): Promise<T | null>;
}

// ==================== Friends Manager Interface ====================

export interface IFriendsManager {
    // ==================== Existing methods ====================
    addFriend(friend: IFriend): void;
    removeFriend(peerId: string): boolean;
    getFriend(peerId: string): IFriend | undefined;
    getAllFriends(): Map<string, IFriend>;
    updateFriend(peerId: string, friend: IFriend): void;

    // ==================== NEW - World tracking methods ====================

    /**
     * Add a world to a friend's world list
     * @param peerId - Friend's peer ID
     * @param world - World data with characters
     */
    addFriendWorld(peerId: string, world: IFriendWorld): void;

    /**
     * Remove a world from a friend's world list
     * @param peerId - Friend's peer ID
     * @param worldId - World ID to remove
     */
    removeFriendWorld(peerId: string, worldId: string): void;

    /**
     * Get a specific world for a friend
     * @param peerId - Friend's peer ID
     * @param worldId - World ID to retrieve
     * @returns World data or undefined if not found
     */
    getFriendWorld(peerId: string, worldId: string): IFriendWorld | undefined;

    /**
     * Add a character to a friend's world
     * @param peerId - Friend's peer ID
     * @param worldId - World ID
     * @param character - Character data with hash
     */
    addFriendCharacter(peerId: string, worldId: string, character: IFriendCharacter): void;

    /**
     * Update a friend's character in a specific world
     * @param peerId - Friend's peer ID
     * @param worldId - World ID
     * @param updatedCharacter - Updated character data (character.id used to find existing)
     */
    updateFriendCharacter(
        peerId: string,
        worldId: string,
        updatedCharacter: ICharacter
    ): Promise<void>;

    /**
     * Get all worlds for a friend
     * @param peerId - Friend's peer ID
     * @returns Array of worlds or empty array
     */
    getFriendWorlds(peerId: string): IFriendWorld[];

    /**
     * Get worlds hosted by friend (where I can join)
     * @param peerId - Friend's peer ID
     * @returns Array of worlds hosted by friend
     */
    getFriendHostedWorlds(peerId: string): IFriendWorld[];

    /**
     * Get my worlds where friend is a participant (friend joins my worlds)
     * @param peerId - Friend's peer ID
     * @returns Array of my worlds where friend has characters
     */
    getMyWorldsWithFriend(peerId: string): IFriendWorld[];
}

// ==================== Network Provider Interface ====================

export interface INetworkProvider {
    initialize(): Promise<void>;
    getPeerId(): string;
    getConnectedPeers(): string[];
    destroy(): Promise<void>;
    sendMessage(peerId: string, message: P2PMessage): Promise<void>;
    onMessage(handler: (peerId: string, message: P2PMessage) => void): void;
    onPeerConnect(handler: (peerId: string) => void): void;
}

// ==================== Direct Message Service Events ====================

export interface IDirectMessageEvent {
    message: P2PMessage;
    peerId: string;
    stream: Stream;
    connection: Connection;
}

export interface IDirectMessageEvents {
    message: CustomEvent<IDirectMessageEvent>;
}

// ==================== Message Metadata ====================

export interface IMessageMetadata {
    timestamp: number;
    clientVersion: string;
}

export interface IMessageRequest {
    message: P2PMessage;
    metadata: IMessageMetadata;
}

export interface IMessageResponse {
    status: 'OK' | 'ERROR';
    metadata: IMessageMetadata;
    error?: string;
}
