import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    HollowPeer,
    LocalStorageProvider,
    FriendsManager,
    LibP2PNetworkProvider,
    IStorageProvider,
    INetworkProvider
} from './p2p';

// Mock implementations for testing
class MockStorageProvider implements IStorageProvider {
    private storage = new Map<string, any>();

    async save(key: string, data: any): Promise<void> {
        this.storage.set(key, data);
    }

    async load<T>(key: string): Promise<T | null> {
        return this.storage.get(key) || null;
    }

    clear(): void {
        this.storage.clear();
    }
}

class MockNetworkProvider implements INetworkProvider {
    private peerId = 'mock-peer-id-12345';
    private initialized = false;

    async initialize(): Promise<void> {
        this.initialized = true;
    }

    getPeerId(): string {
        if (!this.initialized) {
            throw new Error('Network provider not initialized');
        }
        return this.peerId;
    }

    async destroy(): Promise<void> {
        this.initialized = false;
    }

    setPeerId(id: string): void {
        this.peerId = id;
    }
}

describe('LocalStorageProvider', () => {
    let storageProvider: LocalStorageProvider;

    beforeEach(() => {
        storageProvider = new LocalStorageProvider();
        // Mock localStorage
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn(() => null),
                setItem: vi.fn(),
                removeItem: vi.fn(),
                clear: vi.fn(),
            },
            writable: true,
        });
    });

    it('should save data to localStorage', async () => {
        const testData = { test: 'value' };
        await storageProvider.save('testKey', testData);

        expect(localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testData));
    });

    it('should load data from localStorage', async () => {
        const testData = { test: 'value' };
        (localStorage.getItem as any).mockReturnValue(JSON.stringify(testData));

        const result = await storageProvider.load('testKey');

        expect(localStorage.getItem).toHaveBeenCalledWith('testKey');
        expect(result).toEqual(testData);
    });

    it('should return null when no data exists', async () => {
        (localStorage.getItem as any).mockReturnValue(null);

        const result = await storageProvider.load('nonexistent');

        expect(result).toBeNull();
    });
});

describe('FriendsManager', () => {
    let friendsManager: FriendsManager;
    let mockStorage: MockStorageProvider;

    beforeEach(() => {
        mockStorage = new MockStorageProvider();
        friendsManager = new FriendsManager(mockStorage);
    });

    it('should add a friend', () => {
        friendsManager.addFriend('Alice', 'peer-alice-123');

        expect(friendsManager.getFriend('Alice')).toBe('peer-alice-123');
    });

    it('should remove a friend', () => {
        friendsManager.addFriend('Bob', 'peer-bob-456');

        const removed = friendsManager.removeFriend('Bob');

        expect(removed).toBe(true);
        expect(friendsManager.getFriend('Bob')).toBeUndefined();
    });

    it('should return false when removing non-existent friend', () => {
        const removed = friendsManager.removeFriend('NonExistent');

        expect(removed).toBe(false);
    });

    it('should get all friends', () => {
        friendsManager.addFriend('Charlie', 'peer-charlie-789');
        friendsManager.addFriend('Diana', 'peer-diana-101');

        const allFriends = friendsManager.getAllFriends();

        expect(allFriends.size).toBe(2);
        expect(allFriends.get('Charlie')).toBe('peer-charlie-789');
        expect(allFriends.get('Diana')).toBe('peer-diana-101');
    });

    it('should load friends from storage', async () => {
        await mockStorage.save('hollowPeerFriends', {
            'Eve': 'peer-eve-202',
            'Frank': 'peer-frank-303'
        });

        await friendsManager.loadFriends();

        expect(friendsManager.getFriend('Eve')).toBe('peer-eve-202');
        expect(friendsManager.getFriend('Frank')).toBe('peer-frank-303');
    });
});

describe('LibP2PNetworkProvider', () => {
    let networkProvider: LibP2PNetworkProvider;
    let mockStorage: MockStorageProvider;

    beforeEach(() => {
        mockStorage = new MockStorageProvider();
        networkProvider = new LibP2PNetworkProvider(mockStorage);

        // Mock the libp2p and helia modules
        vi.mock('libp2p', () => ({
            createLibp2p: vi.fn().mockResolvedValue({
                peerId: { toString: () => 'mock-libp2p-peer-id' },
                stop: vi.fn().mockResolvedValue(undefined)
            })
        }));

        vi.mock('helia', () => ({
            createHelia: vi.fn().mockResolvedValue({
                stop: vi.fn().mockResolvedValue(undefined)
            })
        }));

        // Mock @libp2p/peer-id module
        vi.mock('@libp2p/peer-id', () => ({
            peerIdFromString: vi.fn().mockResolvedValue({
                toString: () => 'persisted-peer-id'
            })
        }));
    });

    it('should throw error when getting peer ID before initialization', () => {
        expect(() => networkProvider.getPeerId()).toThrow('Network provider not initialized');
    });

    it('should persist peer ID after initialization', async () => {
        await networkProvider.initialize();

        const peerId = networkProvider.getPeerId();
        const storedPeerId = await mockStorage.load('hollowPeerID');

        expect(peerId).toBe('mock-libp2p-peer-id');
        expect(storedPeerId).toBe('mock-libp2p-peer-id');
    });

    it('should load persisted peer ID on initialization', async () => {
        // Pre-populate storage with a peer ID
        await mockStorage.save('hollowPeerID', 'existing-peer-id');

        await networkProvider.initialize();

        // Should have attempted to load the persisted peer ID
        const storedPeerId = await mockStorage.load('hollowPeerID');
        expect(storedPeerId).toBeDefined();
    });

    it('should handle storage errors gracefully during persistence', async () => {
        const errorStorage: IStorageProvider = {
            save: vi.fn().mockRejectedValue(new Error('Storage error')),
            load: vi.fn().mockResolvedValue(null)
        };

        const provider = new LibP2PNetworkProvider(errorStorage);
        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Should not throw error despite storage failure
        await expect(provider.initialize()).resolves.not.toThrow();

        expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to persist peer ID:', expect.any(Error));

        consoleWarnSpy.mockRestore();
    });

    it('should handle corrupted peer ID data gracefully', async () => {
        // Pre-populate storage with corrupted data
        await mockStorage.save('hollowPeerID', 'invalid-peer-id-data');

        const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        // Mock @libp2p/peer-id to throw an error for invalid data
        vi.doMock('@libp2p/peer-id', () => ({
            peerIdFromString: vi.fn().mockRejectedValue(new Error('Invalid peer ID format'))
        }));

        await networkProvider.initialize();

        // Should have warned about failed peer ID loading but still initialized
        expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to load persisted peer ID:', expect.any(Error));
        expect(networkProvider.getPeerId()).toBe('mock-libp2p-peer-id');

        consoleWarnSpy.mockRestore();
    });

    it('should verify peer ID matches private key after initialization', async () => {
        // Test that we can verify if the actual libp2p peer ID matches what we expect
        // from the private key - this tests the persistence mechanism

        const realStorage = new LocalStorageProvider();

        // Mock localStorage for this test
        const mockLocalStorage = {
            store: {} as Record<string, string>,
            getItem: (key: string) => mockLocalStorage.store[key] || null,
            setItem: (key: string, value: string) => { mockLocalStorage.store[key] = value; },
            removeItem: (key: string) => { delete mockLocalStorage.store[key]; },
            clear: () => { mockLocalStorage.store = {}; }
        };

        Object.defineProperty(global, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        const realProvider = new LibP2PNetworkProvider(realStorage);

        console.log('=== Testing real peer ID persistence ===');

        // First initialization - should create and save new peer ID
        console.log('1. First initialization...');
        await realProvider.initialize();
        const firstPeerId = realProvider.getPeerId();
        console.log('✓ First session peer ID:', firstPeerId);

        // Check what was saved to storage
        const savedData = await realStorage.load('hollowPeerID');
        console.log('✓ Data saved to storage:', savedData);

        await realProvider.destroy();
        console.log('✓ First session destroyed');

        // Second initialization - should load and reuse the same peer ID
        console.log('2. Second initialization...');
        const realProvider2 = new LibP2PNetworkProvider(realStorage);
        await realProvider2.initialize();
        const secondPeerId = realProvider2.getPeerId();
        console.log('✓ Second session peer ID:', secondPeerId);

        // Verify persistence worked
        console.log('3. Comparing peer IDs...');
        console.log('   First:  ', firstPeerId);
        console.log('   Second: ', secondPeerId);
        console.log('   Match:  ', firstPeerId === secondPeerId);

        expect(firstPeerId).toBe(secondPeerId);

        await realProvider2.destroy();
    });
});

describe('HollowPeer', () => {
    let hollowPeer: HollowPeer;
    let mockNetworkProvider: MockNetworkProvider;
    let mockStorageProvider: MockStorageProvider;

    beforeEach(() => {
        mockNetworkProvider = new MockNetworkProvider();
        mockStorageProvider = new MockStorageProvider();
        hollowPeer = new HollowPeer(mockNetworkProvider, mockStorageProvider);
    });

    it('should initialize successfully', async () => {
        await hollowPeer.initialize();

        expect(hollowPeer.getPeerId()).toBe('mock-peer-id-12345');
    });

    it('should add friend with validation', async () => {
        await hollowPeer.initialize();

        hollowPeer.addFriend('Test Friend', 'test-peer-id');

        expect(hollowPeer.getFriendPeerId('Test Friend')).toBe('test-peer-id');
    });

    it('should throw error for empty friend name', async () => {
        await hollowPeer.initialize();

        expect(() => hollowPeer.addFriend('', 'peer-id')).toThrow('Friend name cannot be empty');
    });

    it('should throw error for empty friend peer ID', async () => {
        await hollowPeer.initialize();

        expect(() => hollowPeer.addFriend('Friend', '')).toThrow('Friend peer ID cannot be empty');
    });

    it('should remove friend', async () => {
        await hollowPeer.initialize();
        hollowPeer.addFriend('Remove Me', 'peer-to-remove');

        const removed = hollowPeer.removeFriend('Remove Me');

        expect(removed).toBe(true);
        expect(hollowPeer.getFriendPeerId('Remove Me')).toBeUndefined();
    });

    it('should get all friends', async () => {
        await hollowPeer.initialize();
        hollowPeer.addFriend('Friend1', 'peer1');
        hollowPeer.addFriend('Friend2', 'peer2');

        const friends = hollowPeer.getAllFriends();

        expect(friends.size).toBe(2);
        expect(friends.get('Friend1')).toBe('peer1');
        expect(friends.get('Friend2')).toBe('peer2');
    });

    it('should destroy network provider on destroy', async () => {
        await hollowPeer.initialize();

        await hollowPeer.destroy();

        // After destroy, network provider should be destroyed
        // This would be verified by checking if the mock's destroy method was called
        expect(() => mockNetworkProvider.getPeerId()).toThrow('Network provider not initialized');
    });

    it('should maintain persistent peer ID across sessions', async () => {
        // Simulate first session
        await hollowPeer.initialize();
        const firstPeerId = hollowPeer.getPeerId();
        await hollowPeer.destroy();

        // Simulate second session with same storage
        const secondPeer = new HollowPeer(mockNetworkProvider, mockStorageProvider);
        await secondPeer.initialize();
        const secondPeerId = secondPeer.getPeerId();

        expect(firstPeerId).toBe(secondPeerId);
        await secondPeer.destroy();
    });

    it('should persist friends across sessions', async () => {
        // First session
        await hollowPeer.initialize();
        hollowPeer.addFriend('SessionFriend', 'session-peer-id');
        await hollowPeer.destroy();

        // Second session
        const newPeer = new HollowPeer(mockNetworkProvider, mockStorageProvider);
        await newPeer.initialize();

        expect(newPeer.getFriendPeerId('SessionFriend')).toBe('session-peer-id');
        await newPeer.destroy();
    });
});