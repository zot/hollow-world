/**
 * TypeScript types and interfaces for Hollow World P2P system
 * Following SOLID principles and universal-connectivity patterns
 */

import type { Stream, Connection } from '@libp2p/interface';

// ==================== P2P Message Types ====================

export interface IP2PMessage {
    method: string;
}

export interface IRequestFriendMessage extends IP2PMessage {
    method: 'requestFriend';
    inviteCode: string;
}

export interface IApproveFriendRequestMessage extends IP2PMessage {
    method: 'approveFriendRequest';
    peerId: string;
    nickname: string;
    approved: boolean;
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

export interface INewFriendRequestMessage extends IP2PMessage {
    method: 'newFriendRequest';
}

export type P2PMessage =
    | IRequestFriendMessage
    | IApproveFriendRequestMessage
    | IPingMessage
    | IPongMessage
    | INewFriendRequestMessage;

// ==================== Friend Types ====================

export interface IFriend {
    peerId: string;       // LibP2P peer ID (unique identifier)
    playerName: string;   // Display name for the friend
    notes: string;        // Private notes (not transmitted in messages)
}

// ==================== Invitation Types ====================

export interface IInvitation {
    inviteCode: string;
    peerId: string;
    addresses: {
        external?: string[];  // External/public IP addresses
        internal?: string[];  // Internal/LAN IP addresses (excluding localhost)
    };
}

export interface IActiveInvitation {
    friendName: string;
    friendId: string | null;
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
