import { createLibp2p } from 'libp2p';
import { createHelia } from 'helia';
import type { PeerId } from '@libp2p/interface';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';

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
    private libp2p: any;
    private helia: any;
    private peerId: string = '';
    private storageProvider: IStorageProvider;
    private readonly peerIdStorageKey = 'hollowPeerID';

    constructor(storageProvider: IStorageProvider = new LocalStorageProvider()) {
        this.storageProvider = storageProvider;
    }

    async initialize(): Promise<void> {
        try {
            console.log('🔗 Starting peer ID initialization...');
            
            // Try to restore peer ID from stored private key first
            let peerId;
            const storedPrivateKey = await this.storageProvider.load<any>('privateKeyData');

            if (storedPrivateKey) {
                try {
                    console.log('🔑 Found stored private key, restoring peer ID...');
                    const privateKeyBytes = new Uint8Array(storedPrivateKey.rawBytes || storedPrivateKey.privateKey);
                    const { privateKeyFromProtobuf } = await import('@libp2p/crypto/keys');
                    const privateKey = await privateKeyFromProtobuf(privateKeyBytes);

                    const { peerIdFromPrivateKey } = await import('@libp2p/peer-id');
                    peerId = await peerIdFromPrivateKey(privateKey);
                    console.log('🔑 Successfully restored peer ID from stored private key:', peerId.toString());
                } catch (error: any) {
                    console.warn('Failed to restore peer ID from private key:', error.message);
                    peerId = null;
                }
            }

            // If no stored data or restoration failed, create new one
            if (!peerId) {
                console.log('🔑 Creating new peer ID...');
                peerId = await createEd25519PeerId();
                console.log('🔑 New peer ID created:', peerId.toString());

                // Save the private key for future sessions
                if (peerId.privateKey) {
                    try {
                        const privateKeyData = {
                            rawBytes: Array.from(peerId.privateKey)
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

    getLibP2P(): any {
        return this.libp2p;
    }

    getHelia(): any {
        return this.helia;
    }
}

// Main HollowPeer class (Open/Closed principle - extensible through composition)
export class HollowPeer {
    private networkProvider: INetworkProvider;
    private friendsManager: IFriendsManager;
    private storageProvider: IStorageProvider;

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
}
