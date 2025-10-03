import { createLibp2p, Libp2p } from 'libp2p';
import { createHelia } from 'helia';
import type { PeerId, Stream } from '@libp2p/interface';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { webRTC } from '@libp2p/webrtc';
import { noise } from '@libp2p/noise';
import { yamux } from '@libp2p/yamux';
import { identify } from '@libp2p/identify';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { pipe } from 'it-pipe';
import * as lp from 'it-length-prefixed';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';

// P2P Message interfaces (from specs/p2p-messages.md)
export interface IP2PMessage {
    method: string;
}

export interface IIdentifyMessage extends IP2PMessage {
    method: 'identify';
    peerId: string;
    nickname?: string;
    timestamp: number;
}

export interface IRequestFriendMessage extends IP2PMessage {
    method: 'requestFriend';
    peerId: string;
    nickname: string;
    message?: string;
}

export interface IApproveFriendRequestMessage extends IP2PMessage {
    method: 'approveFriendRequest';
    peerId: string;
    nickname: string;
    approved: boolean;
}

export type P2PMessage = IIdentifyMessage | IRequestFriendMessage | IApproveFriendRequestMessage;

// Interfaces for SOLID principles (Dependency Inversion)
export interface IStorageProvider {
    save(key: string, data: any): Promise<void>;
    load<T>(key: string): Promise<T | null>;
}

export interface IFriendsManager {
    addFriend(name: string, peerId: string): void;
    removeFriend(name: string): boolean;
    getFriend(name: string): string | undefined;
    getAllFriends(): Map<string, string>;
}

export interface INetworkProvider {
    initialize(): Promise<void>;
    getPeerId(): string;
    destroy(): Promise<void>;
    sendMessage(peerId: string, message: P2PMessage): Promise<void>;
    onMessage(handler: (peerId: string, message: P2PMessage) => void): void;
}

// Storage implementation (Single Responsibility)
export class LocalStorageProvider implements IStorageProvider {
    async save(key: string, data: any): Promise<void> {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.warn(`Failed to save ${key}:`, error);
            throw new Error(`Storage save failed: ${error}`);
        }
    }

    async load<T>(key: string): Promise<T | null> {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn(`Failed to load ${key}:`, error);
            return null;
        }
    }
}

// Friends management (Single Responsibility)
export class FriendsManager implements IFriendsManager {
    private friends: Map<string, string> = new Map();
    private storageProvider: IStorageProvider;
    private readonly storageKey = 'hollowPeerFriends';

    constructor(storageProvider: IStorageProvider) {
        this.storageProvider = storageProvider;
    }

    async loadFriends(): Promise<void> {
        const friendsData = await this.storageProvider.load<Record<string, string>>(this.storageKey);
        if (friendsData) {
            this.friends = new Map(Object.entries(friendsData));
        }
    }

    addFriend(name: string, peerId: string): void {
        this.friends.set(name, peerId);
        this.persistFriends();
    }

    removeFriend(name: string): boolean {
        const removed = this.friends.delete(name);
        if (removed) {
            this.persistFriends();
        }
        return removed;
    }

    getFriend(name: string): string | undefined {
        return this.friends.get(name);
    }

    getAllFriends(): Map<string, string> {
        return new Map(this.friends);
    }

    private persistFriends(): void {
        const friendsObject = Object.fromEntries(this.friends);
        this.storageProvider.save(this.storageKey, friendsObject).catch(error => {
            console.warn('Failed to persist friends:', error);
        });
    }
}

// Network provider implementation (Single Responsibility)
export class LibP2PNetworkProvider implements INetworkProvider {
    private libp2p: Libp2p | null = null;
    private helia: any;
    private peerId: string = '';
    private storageProvider: IStorageProvider;
    private readonly peerIdStorageKey = 'hollowPeerID';
    private readonly protocol = '/hollow-world/1.0.0';
    private messageHandlers: Array<(peerId: string, message: P2PMessage) => void> = [];

    constructor(storageProvider: IStorageProvider = new LocalStorageProvider()) {
        this.storageProvider = storageProvider;
    }

    async initialize(): Promise<void> {
        try {
            console.log('🔗 Starting peer ID initialization...');

            // Try to restore peer ID from stored private key first
            let peerId;
            let privateKey;
            const storedPrivateKey = await this.storageProvider.load<any>('privateKeyData');

            if (storedPrivateKey) {
                try {
                    console.log('🔑 Found stored private key, restoring peer ID...');
                    const privateKeyBytes = new Uint8Array(storedPrivateKey.rawBytes || storedPrivateKey.privateKey);
                    const { privateKeyFromProtobuf } = await import('@libp2p/crypto/keys');
                    privateKey = await privateKeyFromProtobuf(privateKeyBytes);

                    const { peerIdFromPrivateKey } = await import('@libp2p/peer-id');
                    peerId = await peerIdFromPrivateKey(privateKey);
                    console.log('🔑 Successfully restored peer ID from stored private key:', peerId.toString());
                } catch (error: any) {
                    console.warn('Failed to restore peer ID from private key:', error.message);
                    peerId = null;
                    privateKey = null;
                }
            }

            // If no stored data or restoration failed, create new one
            if (!peerId) {
                console.log('🔑 Creating new peer ID...');
                peerId = await createEd25519PeerId();
                privateKey = peerId.privateKey;
                console.log('🔑 New peer ID created:', peerId.toString());

                // Save the private key for future sessions
                if (privateKey) {
                    try {
                        const privateKeyData = {
                            rawBytes: Array.from(privateKey)
                        };
                        await this.storageProvider.save('privateKeyData', privateKeyData);
                        console.log('🔑 Private key saved to storage for persistence');
                    } catch (saveError) {
                        console.warn('Failed to save private key:', saveError);
                    }
                }
            }

            // Store the peer ID
            this.peerId = peerId.toString();
            console.log('🔗 P2P network initialized with peer ID:', this.peerId);

            // Create libp2p node with WebRTC transport for browser
            console.log('🔗 Creating libp2p node with WebRTC...');
            this.libp2p = await createLibp2p({
                privateKey: privateKey,
                addresses: {
                    listen: [
                        '/webrtc'
                    ]
                },
                transports: [
                    webRTC() as any,
                    circuitRelayTransport() as any
                ],
                connectionEncrypters: [
                    noise() as any
                ],
                streamMuxers: [
                    yamux() as any
                ],
                services: {
                    identify: identify() as any
                }
            });

            // Set up stream handler for incoming messages
            await this.libp2p.handle(this.protocol, this.handleIncomingStream.bind(this));

            // Start the libp2p node
            await this.libp2p.start();
            console.log('🔗 LibP2P node started successfully');

            // Listen for new peer connections to send identify
            this.libp2p.addEventListener('peer:connect', this.handlePeerConnect.bind(this));

            // Clean up old persistence data
            await this.loadSerializedPeerId();

            console.log('🔗 Peer ID initialization completed successfully');

        } catch (initError: any) {
            console.error('🚨 Peer ID initialization failed:', initError);
            console.error('🚨 Error details:', {
                name: initError.name,
                message: initError.message,
                stack: initError.stack
            });
            throw initError;
        }
    }

    private async loadSerializedPeerId(): Promise<any> {
        // Peer ID persistence is disabled - always return null
        // Clear any old data from previous attempts
        try {
            const peerData = await this.storageProvider.load<any>(this.peerIdStorageKey);
            if (peerData) {
                console.log('Clearing old peer data from localStorage (persistence not supported)');
                await this.storageProvider.save(this.peerIdStorageKey, null);
            }
        } catch (error) {
            // Ignore errors when cleaning up
        }
        return null;
    }

    private async persistPeerId(): Promise<void> {
        // Peer ID persistence is not supported in libp2p@2.10.0
        // This method is kept for backward compatibility but does nothing
    }

    getPeerId(): string {
        if (!this.peerId) {
            throw new Error('Network provider not initialized');
        }
        return this.peerId;
    }

    async destroy(): Promise<void> {
        if (this.helia) {
            await this.helia.stop();
        }
        if (this.libp2p) {
            await this.libp2p.stop();
        }
    }

    getLibP2P(): Libp2p | null {
        return this.libp2p;
    }

    getHelia(): any {
        return this.helia;
    }

    async sendMessage(peerIdStr: string, message: P2PMessage): Promise<void> {
        if (!this.libp2p) {
            throw new Error('LibP2P not initialized');
        }

        try {
            console.log(`📤 Sending message to ${peerIdStr}:`, message);

            // Convert peer ID string to PeerId object
            const { peerIdFromString } = await import('@libp2p/peer-id');
            const targetPeerId = peerIdFromString(peerIdStr);

            // Open a stream to the peer
            const stream = await this.libp2p.dialProtocol(targetPeerId, this.protocol);

            // Encode message as JSON
            const messageData = JSON.stringify(message);
            const messageBytes = uint8ArrayFromString(messageData);

            // Send message with length prefix
            await pipe(
                [messageBytes],
                lp.encode,
                stream
            );

            console.log(`✅ Message sent to ${peerIdStr}`);
        } catch (error: any) {
            console.error(`❌ Failed to send message to ${peerIdStr}:`, error);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    onMessage(handler: (peerId: string, message: P2PMessage) => void): void {
        this.messageHandlers.push(handler);
    }

    private async handleIncomingStream({ stream, connection }: { stream: Stream; connection: any }): Promise<void> {
        try {
            const remotePeerId = connection.remotePeer.toString();
            console.log(`📥 Incoming stream from ${remotePeerId}`);

            // Read message with length prefix
            const data = await pipe(
                stream,
                lp.decode,
                async (source: any) => {
                    const chunks: Uint8Array[] = [];
                    for await (const chunk of source) {
                        chunks.push(chunk.subarray());
                    }
                    return chunks;
                }
            );

            if (data.length > 0) {
                const messageStr = uint8ArrayToString(data[0]);
                const message = JSON.parse(messageStr) as P2PMessage;

                console.log(`📨 Received message from ${remotePeerId}:`, message);

                // Validate message has required method field
                if (!message.method) {
                    console.warn('⚠️ Received invalid message without method field');
                    return;
                }

                // Notify all handlers
                for (const handler of this.messageHandlers) {
                    try {
                        handler(remotePeerId, message);
                    } catch (handlerError) {
                        console.error('❌ Error in message handler:', handlerError);
                    }
                }
            }
        } catch (error: any) {
            console.error('❌ Error handling incoming stream:', error);
        }
    }

    private async handlePeerConnect(event: any): Promise<void> {
        const remotePeerId = event.detail.toString();
        console.log(`🤝 Peer connected: ${remotePeerId}`);

        // Send identify message to new peer
        const identifyMessage: IIdentifyMessage = {
            method: 'identify',
            peerId: this.peerId,
            timestamp: Date.now()
        };

        try {
            await this.sendMessage(remotePeerId, identifyMessage);
        } catch (error) {
            console.warn(`Failed to send identify message to ${remotePeerId}:`, error);
        }
    }
}

// Main HollowPeer class (Open/Closed principle - extensible through composition)
export class HollowPeer {
    private networkProvider: INetworkProvider;
    private friendsManager: IFriendsManager;
    private storageProvider: IStorageProvider;
    private nickname: string = '';
    private pendingFriendRequests: Map<string, IRequestFriendMessage> = new Map();

    constructor(
        networkProvider?: INetworkProvider,
        storageProvider: IStorageProvider = new LocalStorageProvider()
    ) {
        this.storageProvider = storageProvider;
        this.networkProvider = networkProvider || new LibP2PNetworkProvider(storageProvider);
        this.friendsManager = new FriendsManager(storageProvider);
    }

    async initialize(): Promise<void> {
        await this.networkProvider.initialize();
        await (this.friendsManager as FriendsManager).loadFriends();

        // Load nickname from storage
        const storedNickname = await this.storageProvider.load<string>('hollowPeerNickname');
        if (storedNickname) {
            this.nickname = storedNickname;
        }

        // Set up message handler
        this.networkProvider.onMessage(this.handleMessage.bind(this));
    }

    setNickname(nickname: string): void {
        this.nickname = nickname;
        this.storageProvider.save('hollowPeerNickname', nickname).catch(error => {
            console.warn('Failed to save nickname:', error);
        });
    }

    getNickname(): string {
        return this.nickname;
    }

    getPeerId(): string {
        return this.networkProvider.getPeerId();
    }

    addFriend(name: string, friendPeerId: string): void {
        if (!name.trim()) {
            throw new Error('Friend name cannot be empty');
        }
        if (!friendPeerId.trim()) {
            throw new Error('Friend peer ID cannot be empty');
        }
        this.friendsManager.addFriend(name, friendPeerId);
    }

    removeFriend(name: string): boolean {
        return this.friendsManager.removeFriend(name);
    }

    getFriendPeerId(name: string): string | undefined {
        return this.friendsManager.getFriend(name);
    }

    getAllFriends(): Map<string, string> {
        return this.friendsManager.getAllFriends();
    }

    async destroy(): Promise<void> {
        await this.networkProvider.destroy();
    }

    // P2P Message Handling
    private handleMessage(remotePeerId: string, message: P2PMessage): void {
        console.log(`🔔 Handling message from ${remotePeerId}:`, message);

        switch (message.method) {
            case 'identify':
                this.handleIdentify(remotePeerId, message as IIdentifyMessage);
                break;
            case 'requestFriend':
                this.handleRequestFriend(remotePeerId, message as IRequestFriendMessage);
                break;
            case 'approveFriendRequest':
                this.handleApproveFriendRequest(remotePeerId, message as IApproveFriendRequestMessage);
                break;
            default:
                // This should never happen if our types are correct
                console.warn(`⚠️ Unknown message method: ${(message as any).method}`);
        }
    }

    private handleIdentify(remotePeerId: string, message: IIdentifyMessage): void {
        console.log(`👋 Peer ${remotePeerId} identified as:`, message.nickname || 'Anonymous');
        // Could store peer info here if needed
    }

    private handleRequestFriend(remotePeerId: string, message: IRequestFriendMessage): void {
        console.log(`👥 Friend request from ${message.nickname} (${remotePeerId})`);
        console.log(`   Message: ${message.message || '(none)'}`);

        // Store pending friend request
        this.pendingFriendRequests.set(remotePeerId, message);

        // TODO: Trigger UI notification for friend request
        // For now, just log it
        console.log(`📋 Friend request stored. Use approveFriendRequest() to respond.`);
    }

    private handleApproveFriendRequest(remotePeerId: string, message: IApproveFriendRequestMessage): void {
        if (message.approved) {
            console.log(`✅ ${message.nickname} (${remotePeerId}) approved your friend request!`);

            // Add them to friends list
            this.friendsManager.addFriend(message.nickname, remotePeerId);
        } else {
            console.log(`❌ ${message.nickname} (${remotePeerId}) declined your friend request`);
        }

        // TODO: Trigger UI notification
    }

    // P2P Protocol Methods
    async sendIdentify(targetPeerId: string): Promise<void> {
        const message: IIdentifyMessage = {
            method: 'identify',
            peerId: this.getPeerId(),
            nickname: this.nickname,
            timestamp: Date.now()
        };

        await this.networkProvider.sendMessage(targetPeerId, message);
    }

    async requestFriend(targetPeerId: string, message?: string): Promise<void> {
        const friendRequest: IRequestFriendMessage = {
            method: 'requestFriend',
            peerId: this.getPeerId(),
            nickname: this.nickname || 'Anonymous',
            message: message
        };

        await this.networkProvider.sendMessage(targetPeerId, friendRequest);
        console.log(`📤 Friend request sent to ${targetPeerId}`);
    }

    async approveFriendRequest(remotePeerId: string, approved: boolean): Promise<void> {
        const response: IApproveFriendRequestMessage = {
            method: 'approveFriendRequest',
            peerId: this.getPeerId(),
            nickname: this.nickname || 'Anonymous',
            approved: approved
        };

        await this.networkProvider.sendMessage(remotePeerId, response);

        if (approved) {
            // Get the request details to get their nickname
            const request = this.pendingFriendRequests.get(remotePeerId);
            if (request) {
                this.friendsManager.addFriend(request.nickname, remotePeerId);
                console.log(`✅ Added ${request.nickname} as friend`);
            }

            // Remove from pending
            this.pendingFriendRequests.delete(remotePeerId);
        }

        console.log(`📤 Friend request ${approved ? 'approved' : 'declined'} for ${remotePeerId}`);
    }

    getPendingFriendRequests(): Map<string, IRequestFriendMessage> {
        return new Map(this.pendingFriendRequests);
    }
}
