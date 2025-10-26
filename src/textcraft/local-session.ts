import { World, Thing } from './model.js';
import * as mudcontrol from './mudcontrol.js';

/**
 * LocalMudSession manages a single-player MUD session without networking
 * Phase 2.5 implementation for solo gameplay
 */
export class LocalMudSession {
    private mudConnection: mudcontrol.MudConnection | null = null;
    private world: World | null = null;
    private outputCallback: (text: string) => void;

    constructor(outputCallback: (text: string) => void) {
        this.outputCallback = outputCallback;
    }

    /**
     * Load a world and create a local MudConnection
     */
    async loadWorld(world: World): Promise<void> {
        this.world = world;

        // Set the mudConnectionConstructor on the world (required by MudConnection)
        this.world.mudConnectionConstructor = mudcontrol.MudConnection;

        // Create MudConnection directly (bypass createConnection to avoid activeWorld issue)
        this.mudConnection = new mudcontrol.MudConnection();

        // Initialize the connection with our world
        this.mudConnection.init(
            this.world,
            (output: string) => this.handleOutput(output),
            false // remote = false (local play)
        );

        // Start the connection
        await this.mudConnection.start();
    }

    /**
     * Execute a MUD command locally
     */
    executeCommand(cmd: string): void {
        if (!this.mudConnection) {
            throw new Error('No world loaded - call loadWorld() first');
        }

        this.mudConnection.toplevelCommand(cmd);
    }

    /**
     * Get the current world
     */
    getWorld(): World | null {
        return this.world;
    }

    /**
     * Get the current MudConnection
     */
    getMudConnection(): mudcontrol.MudConnection | null {
        return this.mudConnection;
    }

    /**
     * Close the session
     */
    close(): void {
        if (this.mudConnection) {
            this.mudConnection.close();
            this.mudConnection = null;
        }
        this.world = null;
    }

    /**
     * Handle output from MudConnection and send to callback
     */
    private handleOutput(text: string): void {
        this.outputCallback(text);
    }
}
