/**
 * Character Access System (Phase 3)
 * Provides access to Hollow World character data from TextCraft Things
 *
 * CRC: crc-CharacterSync.md
 * Spec: integrate-textcraft.md
 * Sequences: seq-textcraft-character-sync.md
 *
 * Design principle: Things only store characterId, NOT character data
 * Character data is retrieved from the world's characters store when needed
 */

import type { World, Thing } from './model.js';
import type { ICharacter } from '../character/types.js';
import type { IWorldCharacter } from './world-types.js';
import { getWorldCharacter, updateWorldCharacter } from './world-connections.js';

// ==================== Character Access ====================

/**
 * Get character data for a thing
 * The thing's character property holds the characterId
 * Character data is retrieved from the world's characters store
 *
 * CRC: crc-CharacterSync.md → getCharacterForThing()
 * Seq: seq-textcraft-character-sync.md
 *
 * @param world - The world instance
 * @param thing - The thing (must have character property)
 * @returns Promise resolving to character data or null
 */
export async function getCharacterForThing(
  world: World,
  thing: Thing
): Promise<ICharacter | null> {
  if (!thing.character) {
    return null;
  }

  const worldChar = await getWorldCharacter(world, thing.character);
  return worldChar ? worldChar.character : null;
}

/**
 * Create thing for character
 * The thing only stores the characterId in its character property
 * All character data remains in the characters store
 *
 * CRC: crc-CharacterSync.md → createThingForCharacter()
 * Seq: seq-textcraft-character-sync.md
 *
 * @param world - The world instance
 * @param characterId - UUID of the character
 * @param displayName - Character name for the thing
 * @returns The created thing
 */
export function createThingForCharacter(
  world: World,
  characterId: string,
  displayName: string
): Thing {
  // Create thing using character prototype
  const thing = world.createCharacterThing(characterId, displayName);

  // Place in lobby by default
  thing.assoc.location = world.lobby;

  return thing;
}

/**
 * Update character data in world store
 * Called when character is modified (e.g., from character sheet)
 *
 * CRC: crc-CharacterSync.md → updateCharacterInWorld()
 * Seq: seq-textcraft-character-sync.md
 *
 * @param world - The world instance
 * @param character - Updated character data
 * @returns Promise resolving to updated world character
 */
export async function updateCharacterInWorld(
  world: World,
  character: ICharacter
): Promise<IWorldCharacter> {
  return updateWorldCharacter(world, character);
}

/**
 * Get all character things in world
 * Returns things that have the character property set
 *
 * CRC: crc-CharacterSync.md → getAllCharacterThings()
 *
 * @param world - The world instance
 * @returns Array of character things
 */
export function getAllCharacterThings(world: World): Thing[] {
  const characterThings: Thing[] = [];

  for (const thing of world.thingCache.values()) {
    if (thing.character) {
      characterThings.push(thing);
    }
  }

  return characterThings;
}

/**
 * Find thing by character ID
 * Searches for a thing with the given characterId
 *
 * CRC: crc-CharacterSync.md → findThingByCharacterId()
 *
 * @param world - The world instance
 * @param characterId - Character UUID to search for
 * @returns The thing or null if not found
 */
export function findThingByCharacterId(world: World, characterId: string): Thing | null {
  for (const thing of world.thingCache.values()) {
    if (thing.character === characterId) {
      return thing;
    }
  }
  return null;
}
