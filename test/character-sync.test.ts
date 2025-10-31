/**
 * Phase 3: Character Access System Tests
 * Tests character prototype, thing-character linking, and access functions
 *
 * Note: These tests require browser environment with IndexedDB support.
 * Run with Playwright for integration testing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { getStorage, World } from '../src/textcraft/model.js';
import type { ICharacter } from '../src/character/types.js';
import {
  getCharacterForThing,
  createThingForCharacter,
  updateCharacterInWorld,
  getAllCharacterThings,
  findThingByCharacterId
} from '../src/textcraft/character-sync.js';
import { addWorldCharacter } from '../src/textcraft/world-connections.js';

describe('Phase 3: Character Access System', () => {
  let testWorld: World;
  const testWorldBaseName = 'test-character-sync';

  beforeEach(async () => {
    const storage = await getStorage();
    const uniqueWorldName = `${testWorldBaseName}-${Date.now()}`;
    testWorld = await storage.openWorld(uniqueWorldName);
  });

  describe('Character Prototype', () => {
    it('should have character prototype defined', () => {
      expect(testWorld.characterProto).toBeDefined();
      expect(testWorld.characterProto.name).toBe('character');
    });

    it('character prototype should inherit from person prototype', () => {
      expect(testWorld.characterProto.prototype).toBe(testWorld.personProto);
    });

    it('should create character thing with prototype', () => {
      const thing = testWorld.createCharacterThing('char-test-1', 'Test Hero');

      expect(thing).toBeDefined();
      expect(thing.name).toBe('Test Hero');
      expect(thing.character).toBe('char-test-1');
      expect(thing.prototype).toBe(testWorld.characterProto);
    });

    it('character thing should NOT store character data properties', () => {
      const thing = testWorld.createCharacterThing('char-test-2', 'Test Gunslinger');

      // Thing should ONLY have characterId, not character data
      expect(thing.character).toBe('char-test-2');
      expect((thing as any)._hp).toBeUndefined();
      expect((thing as any)._brawn).toBeUndefined();
      expect((thing as any)._finesse).toBeUndefined();
      expect((thing as any).attributes).toBeUndefined();
    });
  });

  describe('Character-Thing Linking', () => {
    it('should create thing for character with only characterId', async () => {
      const mockCharacter: ICharacter = {
        id: 'char-link-1',
        version: 1,
        worldId: testWorld.name,
        name: 'Link Test Character',
        attributes: {
          brawn: 3,
          finesse: 4,
          grit: 3,
          wits: 4,
          moxie: 3,
          luck: 2
        },
        hollow: { current: 15, max: 19 },
        skills: {},
        hindrances: [],
        edges: [],
        gear: [],
        wounds: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await testWorld.doTransaction(async () => {
        // Add character to world store
        await addWorldCharacter(testWorld, mockCharacter);

        // Create thing for character
        const thing = createThingForCharacter(
          testWorld,
          mockCharacter.id,
          mockCharacter.name
        );

        expect(thing.character).toBe(mockCharacter.id);
        expect(thing.fullName).toBe(mockCharacter.name);
        expect(thing.assoc.location).toBe(testWorld.lobby);

        // Verify thing does NOT have character properties
        expect((thing as any)._hp).toBeUndefined();
        expect((thing as any).attributes).toBeUndefined();
      });
    });

    it('should get character data from thing via characterId', async () => {
      const mockCharacter: ICharacter = {
        id: 'char-link-2',
        version: 1,
        worldId: testWorld.name,
        name: 'Data Access Test',
        attributes: {
          brawn: 4,
          finesse: 3,
          grit: 4,
          wits: 3,
          moxie: 4,
          luck: 2
        },
        hollow: { current: 18, max: 22 },
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

        // Create thing for character
        const thing = createThingForCharacter(
          testWorld,
          mockCharacter.id,
          mockCharacter.name
        );

        // Get character data from thing
        const character = await getCharacterForThing(testWorld, thing);

        expect(character).not.toBeNull();
        expect(character?.id).toBe(mockCharacter.id);
        expect(character?.name).toBe(mockCharacter.name);
        expect(character?.hollow.current).toBe(18);
        expect(character?.attributes.brawn).toBe(4);
      });
    });

    it('should return null for thing without character property', async () => {
      await testWorld.doTransaction(async () => {
        // Create regular thing (not a character thing)
        const regularThing = testWorld.createThing('A Rock', 'This is a rock');

        const character = await getCharacterForThing(testWorld, regularThing);

        expect(character).toBeNull();
      });
    });
  });

  describe('Character Updates', () => {
    it('should update character in world store', async () => {
      const mockCharacter: ICharacter = {
        id: 'char-update-1',
        version: 1,
        worldId: testWorld.name,
        name: 'Update Test Character',
        attributes: {
          brawn: 3,
          finesse: 3,
          grit: 3,
          wits: 3,
          moxie: 3,
          luck: 2
        },
        hollow: { current: 15, max: 17 },
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

        // Update character data
        const updatedCharacter: ICharacter = {
          ...mockCharacter,
          hollow: { current: 10, max: 17 },
          wounds: 1,
          updatedAt: Date.now()
        };

        // Update in world store
        await updateCharacterInWorld(testWorld, updatedCharacter);

        // Create thing and verify it gets updated data
        const thing = createThingForCharacter(
          testWorld,
          updatedCharacter.id,
          updatedCharacter.name
        );

        const character = await getCharacterForThing(testWorld, thing);

        expect(character?.hollow.current).toBe(10);
        expect(character?.wounds).toBe(1);
      });
    });
  });

  describe('Character Thing Queries', () => {
    it('should get all character things in world', async () => {
      await testWorld.doTransaction(async () => {
        const char1: ICharacter = {
          id: 'char-query-1',
          version: 1,
          worldId: testWorld.name,
          name: 'Query Test 1',
          attributes: {
            brawn: 3,
            finesse: 3,
            grit: 3,
            wits: 3,
            moxie: 3,
            luck: 2
          },
          hollow: { current: 15, max: 17 },
          skills: {},
          hindrances: [],
          edges: [],
          gear: [],
          wounds: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        const char2: ICharacter = {
          ...char1,
          id: 'char-query-2',
          name: 'Query Test 2'
        };

        // Add characters to world
        await addWorldCharacter(testWorld, char1);
        await addWorldCharacter(testWorld, char2);

        // Create things for characters
        createThingForCharacter(testWorld, char1.id, char1.name);
        createThingForCharacter(testWorld, char2.id, char2.name);

        // Create a non-character thing
        testWorld.createThing('A Cactus', 'Prickly');

        // Get all character things
        const characterThings = getAllCharacterThings(testWorld);

        expect(characterThings.length).toBe(2);
        expect(characterThings[0].character).toBeDefined();
        expect(characterThings[1].character).toBeDefined();
      });
    });

    it('should find thing by characterId', async () => {
      await testWorld.doTransaction(async () => {
        const mockCharacter: ICharacter = {
          id: 'char-find-1',
          version: 1,
          worldId: testWorld.name,
          name: 'Find Test Character',
          attributes: {
            brawn: 3,
            finesse: 3,
            grit: 3,
            wits: 3,
            moxie: 3,
            luck: 2
          },
          hollow: { current: 15, max: 17 },
          skills: {},
          hindrances: [],
          edges: [],
          gear: [],
          wounds: 0,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        // Add character to world
        await addWorldCharacter(testWorld, mockCharacter);

        // Create thing for character
        const originalThing = createThingForCharacter(
          testWorld,
          mockCharacter.id,
          mockCharacter.name
        );

        // Find thing by characterId
        const foundThing = findThingByCharacterId(testWorld, mockCharacter.id);

        expect(foundThing).not.toBeNull();
        expect(foundThing?.id).toBe(originalThing.id);
        expect(foundThing?.character).toBe(mockCharacter.id);
      });
    });

    it('should return null when characterId not found', () => {
      const notFoundThing = findThingByCharacterId(testWorld, 'non-existent-char-id');

      expect(notFoundThing).toBeNull();
    });
  });

  describe('Integration with CharacterEditorView', () => {
    it('should support character save flow when worldId is set', async () => {
      // This test verifies the design pattern used in CharacterEditorView
      const mockCharacter: ICharacter = {
        id: 'char-editor-1',
        version: 1,
        worldId: testWorld.name,  // Character is associated with world
        name: 'Editor Test Character',
        attributes: {
          brawn: 3,
          finesse: 4,
          grit: 3,
          wits: 4,
          moxie: 3,
          luck: 2
        },
        hollow: { current: 15, max: 19 },
        skills: {},
        hindrances: [],
        edges: [],
        gear: [],
        wounds: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await testWorld.doTransaction(async () => {
        // Simulate CharacterEditorView save flow
        // 1. Save to LocalStorage (not tested here)
        // 2. If worldId is set, update world store
        if (mockCharacter.worldId) {
          await updateCharacterInWorld(testWorld, mockCharacter);
        }

        // Verify character is in world store
        const thing = createThingForCharacter(
          testWorld,
          mockCharacter.id,
          mockCharacter.name
        );

        const character = await getCharacterForThing(testWorld, thing);

        expect(character).not.toBeNull();
        expect(character?.id).toBe(mockCharacter.id);
      });
    });
  });
});
