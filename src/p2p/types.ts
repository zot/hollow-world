/**
 * TypeScript types and interfaces for Hollow World P2P system
 * Following SOLID principles and universal-connectivity patterns
 */

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

// Friend request message (also used for mutual acceptance)
export interface IRequestFriendMessage extends IP2PMessage {
    method: 'requestFriend';
    playerName: string;   // Sender's player name from settings
}

export interface IMudMessage extends IP2PMessage {
    method: 'mud';
    payload: any;  // MudMessage payload from textcraft integration
}

export type P2PMessage =
    | IPingMessage
    | IPongMessage
    | IRequestFriendMessage
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
    pending?: 'unsent' | 'pending';  // Optional: Friend request status
                                      // - 'unsent': Request not yet delivered (peer offline/unreachable)
                                      // - 'pending': Request delivered, awaiting mutual acceptance
                                      // - undefined: Mutual acceptance complete
    presence?: boolean;   // Optional: Online presence indicator (NON-PERSISTED - runtime only)
                          // - true: Friend is currently online (in connected peers list)
                          // - false: Friend is currently offline
                          // - undefined: Presence not yet initialized
                          // This field is NOT saved to storage, rebuilt on app startup
    worlds?: IFriendWorld[];  // NEW - optional for backward compatibility
    // Worlds can be:
    //   - Hosted by friend (I join their world)
    //   - Hosted by me (friend joins my world)
    // Both scenarios tracked in same array, distinguished by hostPeerId
}

// ==================== Ban List Types ====================

export interface IBannedPeerEntry {
    friend: IFriend;      // Full friend data including notes
    bannedAt: string;     // ISO 8601 timestamp
}

// Ban list is a map: peerId -> IBannedPeerEntry
export type BanList = Record<string, IBannedPeerEntry>;

// ==================== Storage Types ====================

export interface IIgnoredPeer {
    peerId: string;
    peerName: string;
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

    // ==================== Ban List Methods ====================

    /**
     * Ban a peer (adds to ban list, removes from friends)
     * @param peerId - Peer ID to ban
     * @param friend - Friend data to preserve (including notes)
     */
    banPeer(peerId: string, friend: IFriend): void;

    /**
     * Unban a peer (removes from ban list only, does NOT add to friends)
     * @param peerId - Peer ID to unban
     */
    unbanPeer(peerId: string): void;

    /**
     * Check if a peer is banned
     * @param peerId - Peer ID to check
     * @returns true if peer is banned
     */
    isBanned(peerId: string): boolean;

    /**
     * Get banned peer entry
     * @param peerId - Peer ID
     * @returns Banned peer entry or undefined
     */
    getBannedPeer(peerId: string): IBannedPeerEntry | undefined;

    /**
     * Get all banned peers
     * @returns Map of peerId to banned peer entry
     */
    getAllBannedPeers(): BanList;

    /**
     * Update banned peer data (e.g., edit notes or player name)
     * @param peerId - Peer ID
     * @param friend - Updated friend data
     */
    updateBannedPeer(peerId: string, friend: IFriend): void;
}

// ==================== Network Provider Interface ====================

export interface INetworkProvider {
    initialize(): Promise<void>;
    getPeerId(): string;
    getConnectedPeers(): string[];
    destroy(): Promise<void>;
    sendMessage(peerId: string, message: P2PMessage, onAck?: () => void | Promise<void>): Promise<void>;
    onMessage(handler: (peerId: string, message: P2PMessage) => void): void;
    onPeerConnect(handler: (peerId: string) => void): void;
    onPeerDisconnect(handler: (peerId: string) => void): void;
}
