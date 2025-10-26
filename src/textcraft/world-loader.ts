import { World, Thing, getStorage } from './model.js';

/**
 * WorldLoader creates and loads worlds programmatically
 * Phase 2.5 implementation for solo mode
 *
 * For now, this creates simple worlds.
 * Full world loading from files will be implemented in Phase 3.
 */
export class WorldLoader {
    /**
     * Create a simple test world programmatically (default world)
     */
    async createTestWorld(): Promise<World> {
        // Get the MudStorage (creates IndexedDB connection if needed)
        const storage = await getStorage();

        // Open the world through storage (this handles all initialization)
        const world = await storage.openWorld('Test Room');

        // The MudConnection.start() will handle setting up the initial world state
        // Full world building will be implemented in Phase 3

        return world;
    }

    /**
     * Create a new world with a given name
     */
    async createWorld(worldName: string): Promise<World> {
        // Get the MudStorage (creates IndexedDB connection if needed)
        const storage = await getStorage();

        // Open/create the world through storage (this handles all initialization)
        const world = await storage.openWorld(worldName);

        // The MudConnection.start() will handle setting up the initial world state

        return world;
    }

    /**
     * Load an existing world by name
     */
    async loadWorld(worldName: string): Promise<World> {
        // Get the MudStorage
        const storage = await getStorage();

        // Check if world exists
        if (!storage.hasWorld(worldName)) {
            throw new Error(`World "${worldName}" not found`);
        }

        // Open the world through storage
        const world = await storage.openWorld(worldName);

        return world;
    }

    /**
     * Placeholder for future JSON loading
     * Currently just returns a test world
     */
    async loadFromJSON(jsonText: string): Promise<World> {
        console.log('JSON world loading not yet implemented - using test world');
        return this.createTestWorld();
    }
}
