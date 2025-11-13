/**
 * Character hashing utilities for integrity verification
 * Uses SHA-256 hashing with recursive key sorting for consistent hashes
 *
 * CRC: crc-CharacterHash.md
 * Spec: storage.md
 * Sequences: seq-save-character.md, seq-validate-character.md
 */

import type { ICharacter } from '../character/types.js';

/**
 * JSON.stringify replacer function that ensures keys are recursively sorted
 * This provides consistent hashing regardless of property order
 */
function sortedReplacer(key: string, value: any): any {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Sort object keys
        const sorted: any = {};
        Object.keys(value).sort().forEach(k => {
            sorted[k] = value[k];
        });
        return sorted;
    }
    return value;
}

/**
 * Calculate SHA-256 hash of a character for integrity verification
 * Uses normalized JSON with recursively sorted keys for consistent hashing
 *
 * IMPORTANT: Excludes the characterHash field itself to prevent circular dependency
 *
 * Sequences:
 * - seq-save-character.md (hash calculation for save optimization)
 * - seq-load-character.md (lines 68-72, hash initialization)
 *
 * @param character - Character to hash
 * @returns Promise that resolves to hex-encoded hash string
 */
export async function calculateCharacterHash(character: ICharacter): Promise<string> {
    // Exclude characterHash field to prevent circular dependency
    const { characterHash, ...dataToHash } = character;

    // CRITICAL: Use replacer to recursively sort all object keys
    const jsonString = JSON.stringify(dataToHash, sortedReplacer);

    // Calculate SHA-256 hash using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify character integrity by comparing hashes
 *
 * @param character - Character to verify
 * @param expectedHash - Expected hash value
 * @returns Promise that resolves to true if hashes match
 */
export async function verifyCharacterIntegrity(
    character: ICharacter,
    expectedHash: string
): Promise<boolean> {
    const actualHash = await calculateCharacterHash(character);
    return actualHash === expectedHash;
}
