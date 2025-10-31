/**
 * TypeScript types for TextCraft World Connections and Characters
 * Implements Phase 2: World connections linking P2P peers with characters and things
 */

import type { ICharacter } from '../character/types.js';

// ==================== World Connection Types ====================

/**
 * Represents a connection between a peer and a character/thing in a world
 * Replaces the old "user" concept with a more flexible connection model
 */
export interface IWorldConnection {
    /**
     * Peer ID from P2P network (null for world owner/local player)
     * null means this is the owner's connection (no peer required)
     */
    peer: string | null;

    /**
     * Character ID (UUID from Hollow World character system)
     * This is the character.id from ICharacter
     */
    characterId: string;

    /**
     * TextCraft Thing ID (the in-world representation)
     * This links to the Thing object in the TextCraft world database
     */
    thingId: number;

    /**
     * Display name for this connection (usually character name)
     * Denormalized for convenience
     */
    displayName?: string;

    /**
     * Timestamp when connection was created
     */
    connectedAt: number;

    /**
     * Optional: last activity timestamp for tracking active connections
     */
    lastActivity?: number;
}

// ==================== World Character Types ====================

/**
 * Represents a character stored in a world
 * This is the authoritative copy that syncs back to LocalStorage
 */
export interface IWorldCharacter {
    /**
     * Character ID (UUID) - primary identifier
     */
    characterId: string;

    /**
     * Full character data (the authoritative copy for this world)
     */
    character: ICharacter;

    /**
     * SHA-256 hash for integrity verification
     * Calculated from normalized character JSON (sorted keys)
     */
    characterHash: string;

    /**
     * Timestamp when character was added to world
     */
    addedAt: number;

    /**
     * Timestamp when character was last updated in world
     */
    updatedAt: number;
}

// ==================== Database Store Names ====================

/**
 * Suffix for connections object store
 * Store name format: "{worldName} connections"
 */
export const CONNECTIONS_SUFFIX = ' connections';

/**
 * Suffix for characters object store
 * Store name format: "{worldName} characters"
 */
export const CHARACTERS_SUFFIX = ' characters';

/**
 * Index name for peer connections
 */
export const PEER_INDEX = 'peer';

/**
 * Index name for character connections
 */
export const CHARACTER_INDEX = 'character';

// ==================== Helper Functions ====================

/**
 * Generate connections store name for a world
 */
export function connectionsStoreName(worldName: string): string {
    return worldName + CONNECTIONS_SUFFIX;
}

/**
 * Generate characters store name for a world
 */
export function charactersStoreName(worldName: string): string {
    return worldName + CHARACTERS_SUFFIX;
}

/**
 * Generate a unique connection ID
 * Format: "{peer}:{characterId}:{timestamp}"
 */
export function generateConnectionId(peer: string | null, characterId: string, timestamp: number): string {
    const peerPart = peer || 'owner';
    return `${peerPart}:${characterId}:${timestamp}`;
}
