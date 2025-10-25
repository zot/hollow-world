/**
 * TypeScript types and interfaces for Hollow World P2P system
 * Following SOLID principles and universal-connectivity patterns
 */

import type { Stream, Connection } from '@libp2p/interface';

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

export interface IFriend {
    peerId: string;       // LibP2P peer ID (unique identifier)
    playerName: string;   // Display name for the friend
    notes: string;        // Private notes (not transmitted in messages)
    pending?: boolean;    // Optional: true when friend request is sent but not yet acknowledged
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
    addFriend(friend: IFriend): void;
    removeFriend(peerId: string): boolean;
    getFriend(peerId: string): IFriend | undefined;
    getAllFriends(): Map<string, IFriend>;
    updateFriend(peerId: string, friend: IFriend): void;
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
