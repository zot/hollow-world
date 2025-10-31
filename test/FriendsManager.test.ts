/**
 * Unit tests for FriendsManager world tracking methods
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FriendsManager } from '../src/p2p/FriendsManager.js';
import type { IFriend, IFriendWorld, IFriendCharacter, IStorageProvider } from '../src/p2p/types.js';
import type { ICharacter } from '../src/character/types.js';
import { calculateCharacterHash } from '../src/utils/characterHash.js';

// Mock storage provider
class MockStorageProvider implements IStorageProvider {
    private storage: Map<string, any> = new Map();

    async save(key: string, data: any): Promise<void> {
        this.storage.set(key, JSON.parse(JSON.stringify(data))); // Deep copy
    }

    async load<T>(key: string): Promise<T | null> {
        const data = this.storage.get(key);
        return data ? JSON.parse(JSON.stringify(data)) : null; // Deep copy
    }

    clear(): void {
        this.storage.clear();
    }
}

// Mock network provider
class MockNetworkProvider {
    private peerId: string;

    constructor(peerId: string) {
        this.peerId = peerId;
    }

    getPeerId(): string {
        return this.peerId;
    }
}

describe('FriendsManager - World Tracking', () => {
    let friendsManager: FriendsManager;
    let mockStorage: MockStorageProvider;
    let mockNetwork: MockNetworkProvider;
    let testFriend: IFriend;
    let testCharacter: ICharacter;
    let testCharacterHash: string;

    beforeEach(async () => {
        mockStorage = new MockStorageProvider();
        mockNetwork = new MockNetworkProvider('my-peer-id');
        friendsManager = new FriendsManager(mockStorage, mockNetwork);

        testFriend = {
            peerId: 'peer-123',
            playerName: 'Doc Holiday',
            notes: 'Friend from Tombstone',
            worlds: []
        };

        testCharacter = {
            id: 'char-456',
            version: 1,
            worldId: null,
            name: 'Wyatt Earp',
            attributes: {
                strength: 6,
                agility: 8,
                vigor: 5,
                smarts: 7,
                spirit: 6
            },
            skills: {
                shooting: 12,
                intimidation: 10
            },
            hindrances: ['Code of Honor'],
            edges: ['Lawman', 'Quick Draw'],
            gear: ['Badge', 'Peacemaker'],
            wounds: 0
        } as ICharacter;

        testCharacterHash = await calculateCharacterHash(testCharacter);

        friendsManager.addFriend(testFriend);
    });

    describe('addFriendWorld', () => {
        it('should add world to friend', () => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Tombstone Saloon',
                hostPeerId: 'peer-123',
                characters: []
            };

            friendsManager.addFriendWorld('peer-123', world);

            const friend = friendsManager.getFriend('peer-123');
            expect(friend?.worlds).toHaveLength(1);
            expect(friend?.worlds?.[0]).toEqual(world);
        });

        it('should throw error if friend not found', () => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Test World',
                hostPeerId: 'peer-123',
                characters: []
            };

            expect(() => {
                friendsManager.addFriendWorld('nonexistent-peer', world);
            }).toThrow('Friend with peerId nonexistent-peer not found');
        });

        it('should throw error if world already exists', () => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Test World',
                hostPeerId: 'peer-123',
                characters: []
            };

            friendsManager.addFriendWorld('peer-123', world);

            expect(() => {
                friendsManager.addFriendWorld('peer-123', world);
            }).toThrow('World world-1 already exists for friend peer-123');
        });

        it('should initialize worlds array if it does not exist', () => {
            const friendWithoutWorlds: IFriend = {
                peerId: 'peer-999',
                playerName: 'Billy the Kid',
                notes: ''
            };

            friendsManager.addFriend(friendWithoutWorlds);

            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Test',
                hostPeerId: 'peer-999',
                characters: []
            };

            friendsManager.addFriendWorld('peer-999', world);

            const friend = friendsManager.getFriend('peer-999');
            expect(friend?.worlds).toBeDefined();
            expect(friend?.worlds).toHaveLength(1);
        });
    });

    describe('removeFriendWorld', () => {
        beforeEach(() => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Tombstone',
                hostPeerId: 'peer-123',
                characters: []
            };
            friendsManager.addFriendWorld('peer-123', world);
        });

        it('should remove world from friend', () => {
            friendsManager.removeFriendWorld('peer-123', 'world-1');

            const friend = friendsManager.getFriend('peer-123');
            expect(friend?.worlds).toHaveLength(0);
        });

        it('should do nothing if friend not found', () => {
            expect(() => {
                friendsManager.removeFriendWorld('nonexistent-peer', 'world-1');
            }).not.toThrow();
        });

        it('should do nothing if world not found', () => {
            friendsManager.removeFriendWorld('peer-123', 'nonexistent-world');

            const friend = friendsManager.getFriend('peer-123');
            expect(friend?.worlds).toHaveLength(1); // Original world still there
        });
    });

    describe('getFriendWorld', () => {
        beforeEach(() => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Tombstone',
                hostPeerId: 'peer-123',
                characters: []
            };
            friendsManager.addFriendWorld('peer-123', world);
        });

        it('should return world if it exists', () => {
            const world = friendsManager.getFriendWorld('peer-123', 'world-1');

            expect(world).toBeDefined();
            expect(world?.worldId).toBe('world-1');
            expect(world?.worldName).toBe('Tombstone');
        });

        it('should return undefined if friend not found', () => {
            const world = friendsManager.getFriendWorld('nonexistent-peer', 'world-1');
            expect(world).toBeUndefined();
        });

        it('should return undefined if world not found', () => {
            const world = friendsManager.getFriendWorld('peer-123', 'nonexistent-world');
            expect(world).toBeUndefined();
        });
    });

    describe('addFriendCharacter', () => {
        beforeEach(() => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Tombstone',
                hostPeerId: 'peer-123',
                characters: []
            };
            friendsManager.addFriendWorld('peer-123', world);
        });

        it('should add character to world', () => {
            const friendCharacter: IFriendCharacter = {
                character: testCharacter,
                characterHash: testCharacterHash
            };

            friendsManager.addFriendCharacter('peer-123', 'world-1', friendCharacter);

            const world = friendsManager.getFriendWorld('peer-123', 'world-1');
            expect(world?.characters).toHaveLength(1);
            expect(world?.characters[0].character.id).toBe('char-456');
            expect(world?.characters[0].characterHash).toBe(testCharacterHash);
        });

        it('should throw error if world not found', () => {
            const friendCharacter: IFriendCharacter = {
                character: testCharacter,
                characterHash: testCharacterHash
            };

            expect(() => {
                friendsManager.addFriendCharacter('peer-123', 'nonexistent-world', friendCharacter);
            }).toThrow('World nonexistent-world not found for friend peer-123');
        });

        it('should throw error if character already exists', () => {
            const friendCharacter: IFriendCharacter = {
                character: testCharacter,
                characterHash: testCharacterHash
            };

            friendsManager.addFriendCharacter('peer-123', 'world-1', friendCharacter);

            expect(() => {
                friendsManager.addFriendCharacter('peer-123', 'world-1', friendCharacter);
            }).toThrow('Character char-456 already exists in world world-1');
        });
    });

    describe('updateFriendCharacter', () => {
        beforeEach(() => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Tombstone',
                hostPeerId: 'peer-123',
                characters: []
            };
            friendsManager.addFriendWorld('peer-123', world);

            const friendCharacter: IFriendCharacter = {
                character: testCharacter,
                characterHash: testCharacterHash
            };
            friendsManager.addFriendCharacter('peer-123', 'world-1', friendCharacter);
        });

        it('should update character and recalculate hash', async () => {
            const updatedCharacter: ICharacter = {
                ...testCharacter,
                wounds: 2 // Modified
            };

            await friendsManager.updateFriendCharacter('peer-123', 'world-1', updatedCharacter);

            const world = friendsManager.getFriendWorld('peer-123', 'world-1');
            expect(world?.characters[0].character.wounds).toBe(2);

            // Hash should be different
            const newHash = await calculateCharacterHash(updatedCharacter);
            expect(world?.characters[0].characterHash).toBe(newHash);
            expect(world?.characters[0].characterHash).not.toBe(testCharacterHash);
        });

        it('should warn if world not found', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            await friendsManager.updateFriendCharacter('peer-123', 'nonexistent-world', testCharacter);

            expect(consoleWarnSpy).toHaveBeenCalledWith('World nonexistent-world not found for friend peer-123');

            consoleWarnSpy.mockRestore();
        });

        it('should warn if character not found', async () => {
            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const otherCharacter: ICharacter = { ...testCharacter, id: 'char-999' };

            await friendsManager.updateFriendCharacter('peer-123', 'world-1', otherCharacter);

            expect(consoleWarnSpy).toHaveBeenCalledWith('Character char-999 not found in world world-1');

            consoleWarnSpy.mockRestore();
        });
    });

    describe('getFriendWorlds', () => {
        it('should return all worlds for friend', () => {
            const world1: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Tombstone',
                hostPeerId: 'peer-123',
                characters: []
            };
            const world2: IFriendWorld = {
                worldId: 'world-2',
                worldName: 'Dodge City',
                hostPeerId: 'my-peer-id',
                characters: []
            };

            friendsManager.addFriendWorld('peer-123', world1);
            friendsManager.addFriendWorld('peer-123', world2);

            const worlds = friendsManager.getFriendWorlds('peer-123');

            expect(worlds).toHaveLength(2);
            expect(worlds[0].worldId).toBe('world-1');
            expect(worlds[1].worldId).toBe('world-2');
        });

        it('should return empty array if friend not found', () => {
            const worlds = friendsManager.getFriendWorlds('nonexistent-peer');
            expect(worlds).toEqual([]);
        });

        it('should return copy to prevent external mutation', () => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Tombstone',
                hostPeerId: 'peer-123',
                characters: []
            };
            friendsManager.addFriendWorld('peer-123', world);

            const worlds = friendsManager.getFriendWorlds('peer-123');
            worlds.push({
                worldId: 'world-2',
                worldName: 'Fake',
                hostPeerId: 'peer-123',
                characters: []
            });

            const originalWorlds = friendsManager.getFriendWorlds('peer-123');
            expect(originalWorlds).toHaveLength(1); // Not affected by external mutation
        });
    });

    describe('getFriendHostedWorlds', () => {
        beforeEach(() => {
            const friendHostedWorld: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Friend World',
                hostPeerId: 'peer-123', // Friend hosts
                characters: []
            };
            const myHostedWorld: IFriendWorld = {
                worldId: 'world-2',
                worldName: 'My World',
                hostPeerId: 'my-peer-id', // I host
                characters: []
            };

            friendsManager.addFriendWorld('peer-123', friendHostedWorld);
            friendsManager.addFriendWorld('peer-123', myHostedWorld);
        });

        it('should return only worlds hosted by friend', () => {
            const worlds = friendsManager.getFriendHostedWorlds('peer-123');

            expect(worlds).toHaveLength(1);
            expect(worlds[0].worldId).toBe('world-1');
            expect(worlds[0].hostPeerId).toBe('peer-123');
        });

        it('should return empty array if friend not found', () => {
            const worlds = friendsManager.getFriendHostedWorlds('nonexistent-peer');
            expect(worlds).toEqual([]);
        });
    });

    describe('getMyWorldsWithFriend', () => {
        beforeEach(() => {
            const friendHostedWorld: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Friend World',
                hostPeerId: 'peer-123', // Friend hosts
                characters: []
            };
            const myHostedWorld: IFriendWorld = {
                worldId: 'world-2',
                worldName: 'My World',
                hostPeerId: 'my-peer-id', // I host
                characters: []
            };

            friendsManager.addFriendWorld('peer-123', friendHostedWorld);
            friendsManager.addFriendWorld('peer-123', myHostedWorld);
        });

        it('should return only worlds hosted by me', () => {
            const worlds = friendsManager.getMyWorldsWithFriend('peer-123');

            expect(worlds).toHaveLength(1);
            expect(worlds[0].worldId).toBe('world-2');
            expect(worlds[0].hostPeerId).toBe('my-peer-id');
        });

        it('should return empty array if friend not found', () => {
            const worlds = friendsManager.getMyWorldsWithFriend('nonexistent-peer');
            expect(worlds).toEqual([]);
        });

        it('should return empty array if network provider not available', () => {
            const managerWithoutNetwork = new FriendsManager(mockStorage);
            managerWithoutNetwork.addFriend(testFriend);

            const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            const worlds = managerWithoutNetwork.getMyWorldsWithFriend('peer-123');

            expect(worlds).toEqual([]);
            expect(consoleWarnSpy).toHaveBeenCalledWith('NetworkProvider not available for getMyWorldsWithFriend');

            consoleWarnSpy.mockRestore();
        });
    });

    describe('Backward Compatibility', () => {
        it('should initialize worlds array when loading old friends data', async () => {
            // Create a fresh storage and manager for this test
            const freshStorage = new MockStorageProvider();
            const freshManager = new FriendsManager(freshStorage, mockNetwork);

            // Simulate old friend data without worlds array
            await freshStorage.save('hollowPeerFriends', {
                'peer-old': {
                    peerId: 'peer-old',
                    playerName: 'Old Friend',
                    notes: 'From before worlds feature'
                }
            });

            await freshManager.loadFriends();

            const friend = freshManager.getFriend('peer-old');
            expect(friend?.worlds).toBeDefined();
            expect(friend?.worlds).toEqual([]);
        });
    });

    describe('Persistence', () => {
        it('should persist worlds when adding', async () => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Tombstone',
                hostPeerId: 'peer-123',
                characters: []
            };

            friendsManager.addFriendWorld('peer-123', world);

            // Create new manager and load
            const newManager = new FriendsManager(mockStorage, mockNetwork);
            await newManager.loadFriends();

            const friend = newManager.getFriend('peer-123');
            expect(friend?.worlds).toHaveLength(1);
            expect(friend?.worlds?.[0].worldId).toBe('world-1');
        });

        it('should persist character additions', async () => {
            const world: IFriendWorld = {
                worldId: 'world-1',
                worldName: 'Tombstone',
                hostPeerId: 'peer-123',
                characters: []
            };
            friendsManager.addFriendWorld('peer-123', world);

            const friendCharacter: IFriendCharacter = {
                character: testCharacter,
                characterHash: testCharacterHash
            };
            friendsManager.addFriendCharacter('peer-123', 'world-1', friendCharacter);

            // Create new manager and load
            const newManager = new FriendsManager(mockStorage, mockNetwork);
            await newManager.loadFriends();

            const loadedWorld = newManager.getFriendWorld('peer-123', 'world-1');
            expect(loadedWorld?.characters).toHaveLength(1);
            expect(loadedWorld?.characters[0].character.id).toBe('char-456');
        });
    });
});
