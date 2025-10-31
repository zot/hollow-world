/**
 * Unit tests for Phase 2: World Connections and Characters
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStorage, World } from '../src/textcraft/model.js';
import type { IWorldConnection, IWorldCharacter } from '../src/textcraft/world-types.js';
import type { ICharacter } from '../src/character/types.js';
import {
    addConnection,
    getAllConnections,
    getConnectionsByPeer,
    getConnectionsByCharacter,
    removeConnection,
    addWorldCharacter,
    getWorldCharacter,
    getAllWorldCharacters,
    updateWorldCharacter,
    removeWorldCharacter,
    verifyWorldCharacterIntegrity
} from '../src/textcraft/world-connections.js';
import { calculateCharacterHash } from '../src/utils/characterHash.js';

describe('Phase 2: World Connections and Characters', () => {
    let testWorld: World;
    const testWorldName = 'test-phase2-world';

    beforeEach(async () => {
        // Initialize storage and create test world
        const storage = await getStorage();

        // Use unique world name for each test to avoid conflicts
        const uniqueWorldName = `${testWorldName}-${Date.now()}`;
        testWorld = await storage.openWorld(uniqueWorldName);
    });

    afterEach(async () => {
        // Clean up test world
        if (testWorld) {
            testWorld.close();
        }
    });

    describe('World Connections', () => {
        it('should add a connection to the world', async () => {
            const connection: IWorldConnection = {
                peer: null,
                characterId: 'char-123',
                thingId: 1,
                displayName: 'Test Character',
                connectedAt: Date.now()
            };

            await testWorld.doTransaction(async () => {
                const connectionId = await addConnection(testWorld, connection);
                expect(connectionId).toBeGreaterThan(0);
            });
        });

        it('should get all connections', async () => {
            const connection1: IWorldConnection = {
                peer: null,
                characterId: 'char-1',
                thingId: 1,
                displayName: 'Character 1',
                connectedAt: Date.now()
            };

            const connection2: IWorldConnection = {
                peer: 'peer-123',
                characterId: 'char-2',
                thingId: 2,
                displayName: 'Character 2',
                connectedAt: Date.now()
            };

            await testWorld.doTransaction(async () => {
                await addConnection(testWorld, connection1);
                await addConnection(testWorld, connection2);

                const connections = await getAllConnections(testWorld);
                expect(connections.length).toBe(2);
            });
        });

        it('should get connections by peer', async () => {
            const ownerConnection: IWorldConnection = {
                peer: null,
                characterId: 'char-owner',
                thingId: 1,
                displayName: 'Owner Character',
                connectedAt: Date.now()
            };

            const peerConnection: IWorldConnection = {
                peer: 'peer-123',
                characterId: 'char-peer',
                thingId: 2,
                displayName: 'Peer Character',
                connectedAt: Date.now()
            };

            await testWorld.doTransaction(async () => {
                await addConnection(testWorld, ownerConnection);
                await addConnection(testWorld, peerConnection);

                const ownerConnections = await getConnectionsByPeer(testWorld, null);
                expect(ownerConnections.length).toBe(1);
                expect(ownerConnections[0].characterId).toBe('char-owner');

                const peerConnections = await getConnectionsByPeer(testWorld, 'peer-123');
                expect(peerConnections.length).toBe(1);
                expect(peerConnections[0].characterId).toBe('char-peer');
            });
        });

        it('should get connections by character', async () => {
            const connection: IWorldConnection = {
                peer: null,
                characterId: 'char-123',
                thingId: 1,
                displayName: 'Test Character',
                connectedAt: Date.now()
            };

            await testWorld.doTransaction(async () => {
                await addConnection(testWorld, connection);

                const connections = await getConnectionsByCharacter(testWorld, 'char-123');
                expect(connections.length).toBe(1);
                expect(connections[0].thingId).toBe(1);
            });
        });

        it('should remove a connection', async () => {
            const connection: IWorldConnection = {
                peer: null,
                characterId: 'char-123',
                thingId: 1,
                displayName: 'Test Character',
                connectedAt: Date.now()
            };

            await testWorld.doTransaction(async () => {
                const connectionId = await addConnection(testWorld, connection);

                let connections = await getAllConnections(testWorld);
                expect(connections.length).toBe(1);

                await removeConnection(testWorld, connectionId);

                connections = await getAllConnections(testWorld);
                expect(connections.length).toBe(0);
            });
        });
    });

    describe('World Characters', () => {
        const mockCharacter: ICharacter = {
            id: 'char-123',
            version: 1,
            worldId: testWorldName,
            name: 'Test Character',
            attributes: {
                brawn: 3,
                finesse: 4,
                grit: 3,
                wits: 4,
                moxie: 3,
                luck: 2
            },
            hollow: {
                current: 15,
                max: 19
            },
            skills: {},
            hindrances: [],
            edges: [],
            gear: [],
            wounds: 0,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        it('should add a character to the world', async () => {
            await testWorld.doTransaction(async () => {
                const worldChar = await addWorldCharacter(testWorld, mockCharacter);

                expect(worldChar.characterId).toBe(mockCharacter.id);
                expect(worldChar.character.name).toBe(mockCharacter.name);
                expect(worldChar.characterHash).toBeTruthy();
                expect(worldChar.addedAt).toBeTruthy();
                expect(worldChar.updatedAt).toBeTruthy();
            });
        });

        it('should get a character from the world', async () => {
            await testWorld.doTransaction(async () => {
                await addWorldCharacter(testWorld, mockCharacter);

                const worldChar = await getWorldCharacter(testWorld, mockCharacter.id);
                expect(worldChar).not.toBeNull();
                expect(worldChar?.character.name).toBe(mockCharacter.name);
            });
        });

        it('should get all characters in the world', async () => {
            const character2: ICharacter = {
                ...mockCharacter,
                id: 'char-456',
                name: 'Another Character'
            };

            await testWorld.doTransaction(async () => {
                await addWorldCharacter(testWorld, mockCharacter);
                await addWorldCharacter(testWorld, character2);

                const characters = await getAllWorldCharacters(testWorld);
                expect(characters.length).toBe(2);
            });
        });

        it('should update a character in the world', async () => {
            await testWorld.doTransaction(async () => {
                const originalWorldChar = await addWorldCharacter(testWorld, mockCharacter);
                const originalAddedAt = originalWorldChar.addedAt;

                // Update character
                const updatedCharacter: ICharacter = {
                    ...mockCharacter,
                    attributes: {
                        ...mockCharacter.attributes,
                        brawn: 5  // Changed from 3
                    }
                };

                // Wait a bit to ensure timestamps differ
                await new Promise(resolve => setTimeout(resolve, 10));

                const updatedWorldChar = await updateWorldCharacter(testWorld, updatedCharacter);

                expect(updatedWorldChar.character.attributes.brawn).toBe(5);
                expect(updatedWorldChar.addedAt).toBe(originalAddedAt);  // Should preserve
                expect(updatedWorldChar.updatedAt).toBeGreaterThan(originalWorldChar.updatedAt);
                expect(updatedWorldChar.characterHash).not.toBe(originalWorldChar.characterHash);
            });
        });

        it('should remove a character from the world', async () => {
            await testWorld.doTransaction(async () => {
                await addWorldCharacter(testWorld, mockCharacter);

                let characters = await getAllWorldCharacters(testWorld);
                expect(characters.length).toBe(1);

                await removeWorldCharacter(testWorld, mockCharacter.id);

                characters = await getAllWorldCharacters(testWorld);
                expect(characters.length).toBe(0);
            });
        });

        it('should verify character integrity', async () => {
            await testWorld.doTransaction(async () => {
                const worldChar = await addWorldCharacter(testWorld, mockCharacter);

                // Verify integrity of original
                const isValid = await verifyWorldCharacterIntegrity(worldChar);
                expect(isValid).toBe(true);

                // Tamper with character
                const tamperedWorldChar = { ...worldChar };
                tamperedWorldChar.character = {
                    ...worldChar.character,
                    attributes: {
                        ...worldChar.character.attributes,
                        brawn: 999  // Tampered value
                    }
                };

                // Verify tampered character fails
                const isTamperedValid = await verifyWorldCharacterIntegrity(tamperedWorldChar);
                expect(isTamperedValid).toBe(false);
            });
        });

        it('should calculate consistent hash for character', async () => {
            await testWorld.doTransaction(async () => {
                const worldChar1 = await addWorldCharacter(testWorld, mockCharacter);

                // Create same character again (in memory)
                const hash2 = await calculateCharacterHash(mockCharacter);

                expect(worldChar1.characterHash).toBe(hash2);
            });
        });
    });

    describe('Integration: Connections + Characters', () => {
        it('should link connection to character in world', async () => {
            const mockCharacter: ICharacter = {
                id: 'char-integration',
                version: 1,
                worldId: testWorldName,
                name: 'Integration Character',
                attributes: {
                    brawn: 3,
                    finesse: 4,
                    grit: 3,
                    wits: 4,
                    moxie: 3,
                    luck: 2
                },
                hollow: {
                    current: 15,
                    max: 19
                },
                skills: {},
                hindrances: [],
                edges: [],
                gear: [],
                wounds: 0,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            await testWorld.doTransaction(async () => {
                // Add character to world
                await addWorldCharacter(testWorld, mockCharacter);

                // Create connection for character
                const connection: IWorldConnection = {
                    peer: null,
                    characterId: mockCharacter.id,
                    thingId: 1,
                    displayName: mockCharacter.name,
                    connectedAt: Date.now()
                };

                await addConnection(testWorld, connection);

                // Verify connection exists
                const connections = await getConnectionsByCharacter(testWorld, mockCharacter.id);
                expect(connections.length).toBe(1);
                expect(connections[0].displayName).toBe(mockCharacter.name);

                // Verify character exists
                const worldChar = await getWorldCharacter(testWorld, mockCharacter.id);
                expect(worldChar).not.toBeNull();
                expect(worldChar?.character.name).toBe(mockCharacter.name);
            });
        });
    });
});
