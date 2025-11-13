/**
 * World Connections and Characters Management
 * Helper functions for Phase 2 implementation
 *
 * CRC: crc-WorldConnections.md
 * Spec: integrate-textcraft.md
 *
 * These functions provide CRUD operations for world connections and characters
 */

import type { World } from './model.js';
import type { IWorldConnection, IWorldCharacter } from './world-types.js';
import type { ICharacter } from '../character/types.js';
import { calculateCharacterHash } from '../utils/characterHash.js';

// ==================== Connection Management ====================

/**
 * Add a connection to the world
 * CRC: crc-WorldConnections.md → addConnection()
 * Seq: seq-textcraft-solo-command.md, seq-textcraft-multiplayer-command.md
 * @param world - The world instance
 * @param connection - Connection data
 * @returns Promise resolving to the connection ID
 */
export async function addConnection(world: World, connection: IWorldConnection): Promise<number> {
    if (!world.connectionsStore) {
        throw new Error('Connections store not available for this world');
    }

    return new Promise((resolve, reject) => {
        const request = world.connectionsStore!.add(connection);
        request.onsuccess = () => resolve(request.result as number);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all connections for a world
 * CRC: crc-WorldConnections.md → getAllConnections()
 * @param world - The world instance
 * @returns Promise resolving to array of connections
 */
export async function getAllConnections(world: World): Promise<IWorldConnection[]> {
    if (!world.connectionsStore) {
        return [];
    }

    return new Promise((resolve, reject) => {
        const request = world.connectionsStore!.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get connections for a specific peer
 * CRC: crc-WorldConnections.md → getConnectionsByPeer()
 * @param world - The world instance
 * @param peerId - Peer ID (null for owner)
 * @returns Promise resolving to array of connections
 */
export async function getConnectionsByPeer(world: World, peerId: string | null): Promise<IWorldConnection[]> {
    if (!world.connectionsStore) {
        return [];
    }

    return new Promise((resolve, reject) => {
        const index = world.connectionsStore!.index('peer');
        const request = index.getAll(peerId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get connections for a specific character
 * CRC: crc-WorldConnections.md → getConnectionsByCharacter()
 * @param world - The world instance
 * @param characterId - Character UUID
 * @returns Promise resolving to array of connections
 */
export async function getConnectionsByCharacter(world: World, characterId: string): Promise<IWorldConnection[]> {
    if (!world.connectionsStore) {
        return [];
    }

    return new Promise((resolve, reject) => {
        const index = world.connectionsStore!.index('characterId');
        const request = index.getAll(characterId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Remove a connection from the world
 * CRC: crc-WorldConnections.md → removeConnection()
 * @param world - The world instance
 * @param connectionId - Connection ID to remove
 * @returns Promise resolving when complete
 */
export async function removeConnection(world: World, connectionId: number): Promise<void> {
    if (!world.connectionsStore) {
        throw new Error('Connections store not available for this world');
    }

    return new Promise((resolve, reject) => {
        const request = world.connectionsStore!.delete(connectionId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

// ==================== Character Management ====================

/**
 * Add a character to the world
 * CRC: crc-WorldConnections.md → addWorldCharacter()
 * Seq: seq-textcraft-character-sync.md
 * @param world - The world instance
 * @param character - Character data
 * @returns Promise resolving to the world character data
 */
export async function addWorldCharacter(world: World, character: ICharacter): Promise<IWorldCharacter> {
    if (!world.charactersStore) {
        throw new Error('Characters store not available for this world');
    }

    const hash = await calculateCharacterHash(character);
    const worldCharacter: IWorldCharacter = {
        characterId: character.id,
        character,
        characterHash: hash,
        addedAt: Date.now(),
        updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
        const request = world.charactersStore!.put(worldCharacter);
        request.onsuccess = () => resolve(worldCharacter);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get a character from the world
 * CRC: crc-WorldConnections.md → getWorldCharacter()
 * Seq: seq-textcraft-character-sync.md
 * @param world - The world instance
 * @param characterId - Character UUID
 * @returns Promise resolving to the world character data or null
 */
export async function getWorldCharacter(world: World, characterId: string): Promise<IWorldCharacter | null> {
    if (!world.charactersStore) {
        return null;
    }

    return new Promise((resolve, reject) => {
        const request = world.charactersStore!.get(characterId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all characters in the world
 * CRC: crc-WorldConnections.md → getAllWorldCharacters()
 * @param world - The world instance
 * @returns Promise resolving to array of world characters
 */
export async function getAllWorldCharacters(world: World): Promise<IWorldCharacter[]> {
    if (!world.charactersStore) {
        return [];
    }

    return new Promise((resolve, reject) => {
        const request = world.charactersStore!.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update a character in the world
 * CRC: crc-WorldConnections.md → updateWorldCharacter()
 * Seq: seq-textcraft-character-sync.md
 * @param world - The world instance
 * @param character - Updated character data
 * @returns Promise resolving to the updated world character data
 */
export async function updateWorldCharacter(world: World, character: ICharacter): Promise<IWorldCharacter> {
    if (!world.charactersStore) {
        throw new Error('Characters store not available for this world');
    }

    // Get existing world character to preserve addedAt
    const existing = await getWorldCharacter(world, character.id);
    const addedAt = existing?.addedAt || Date.now();

    const hash = await calculateCharacterHash(character);
    const worldCharacter: IWorldCharacter = {
        characterId: character.id,
        character,
        characterHash: hash,
        addedAt,
        updatedAt: Date.now()
    };

    return new Promise((resolve, reject) => {
        const request = world.charactersStore!.put(worldCharacter);
        request.onsuccess = () => resolve(worldCharacter);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Remove a character from the world
 * CRC: crc-WorldConnections.md → removeWorldCharacter()
 * @param world - The world instance
 * @param characterId - Character UUID to remove
 * @returns Promise resolving when complete
 */
export async function removeWorldCharacter(world: World, characterId: string): Promise<void> {
    if (!world.charactersStore) {
        throw new Error('Characters store not available for this world');
    }

    return new Promise((resolve, reject) => {
        const request = world.charactersStore!.delete(characterId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Verify character integrity by comparing hash
 * CRC: crc-WorldConnections.md → verifyWorldCharacterIntegrity()
 * @param worldCharacter - World character data with hash
 * @returns Promise resolving to true if valid, false if tampered
 */
export async function verifyWorldCharacterIntegrity(worldCharacter: IWorldCharacter): Promise<boolean> {
    const currentHash = await calculateCharacterHash(worldCharacter.character);
    return currentHash === worldCharacter.characterHash;
}
