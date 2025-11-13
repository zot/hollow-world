/**
 * LocalMudSession manages a single-player MUD session without networking
 * Phase 2.5 implementation for solo gameplay
 *
 * CRC: specs-crc/crc-LocalMudSession.md
 * Spec: specs/integrate-textcraft.md
 * Sequences: specs-crc/seq-textcraft-solo-command.md
 */

import { World, Thing } from './model.js';
import * as mudcontrol from './mudcontrol.js';

/**
 * LocalMudSession - Solo session manager for single-player TextCraft
 *
 * CRC: specs-crc/crc-LocalMudSession.md
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
     * CRC: crc-LocalMudSession.md → loadWorld()
     * Seq: seq-textcraft-solo-command.md
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
     * CRC: crc-LocalMudSession.md → executeCommand()
     * Seq: seq-textcraft-solo-command.md
     */
    executeCommand(cmd: string): void {
        if (!this.mudConnection) {
            throw new Error('No world loaded - call loadWorld() first');
        }

        this.mudConnection.toplevelCommand(cmd);
    }

    /**
     * Get the current world
     * CRC: crc-LocalMudSession.md → getWorld()
     */
    getWorld(): World | null {
        return this.world;
    }

    /**
     * Get the current MudConnection
     * CRC: crc-LocalMudSession.md → getMudConnection()
     */
    getMudConnection(): mudcontrol.MudConnection | null {
        return this.mudConnection;
    }

    /**
     * Close the session
     * CRC: crc-LocalMudSession.md → close()
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
     * CRC: crc-LocalMudSession.md → handleOutput()
     */
    private handleOutput(text: string): void {
        this.outputCallback(text);
    }
}
