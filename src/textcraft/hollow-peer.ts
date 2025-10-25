/**
 * HollowIPeer - Adapter implementing Textcraft's IPeer interface using Hollow's LibP2P infrastructure
 *
 * This adapter bridges Textcraft's MUD engine with Hollow World's existing P2P networking layer.
 * It implements the IPeer interface to provide MUD networking capabilities without duplicating
 * the LibP2P setup.
 */

import { IPeer, PeerID, UserInfo } from './peer';
import { Thing, MudStorage } from './model';
import { createConnection, type MudConnection } from './mudcontrol';
import { LibP2PNetworkProvider } from '../p2p/LibP2PNetworkProvider';
import type { P2PMessage } from '../p2p/types';

/**
 * Message types for the /hollow-mud/1.0.0 protocol
 */
interface MudMessage {
    type: 'command' | 'output' | 'userUpdate' | 'login' | 'welcome';
    payload?: any;
    text?: string;
    peerID?: string;
    name?: string;
    properties?: any;
}

/**
 * HollowIPeer implements the Textcraft IPeer interface using Hollow's LibP2PNetworkProvider.
 *
 * Key responsibilities:
 * - Adapt LibP2P direct messages to Textcraft's command/output flow
 * - Manage MudConnection instances for each connected guest
 * - Route commands between guests and host
 * - Synchronize user Thing updates across the network
 */
export class HollowIPeer implements IPeer {
    currentVersionID: string = '1.0.0';
    versionID: string = '1.0.0';

    private networkProvider: LibP2PNetworkProvider;
    private mudConnections: Map<PeerID, MudConnection> = new Map();
    private isHost: boolean = false;
    private hostPeerID: PeerID | null = null;
    private currentWorld: any = null; // Will be set during startHosting
    private storage: MudStorage | null = null;
    private app: any = null;

    /**
     * Map from Thing to PeerID for tracking which peer owns which character
     */
    private thingToPeerMap: Map<Thing, PeerID> = new Map();

    constructor(networkProvider: LibP2PNetworkProvider) {
        this.networkProvider = networkProvider;
    }

    init(app: any): void {
        console.log('🎮 HollowIPeer initialized');
        this.app = app;
    }

    async start(storage: MudStorage): Promise<void> {
        console.log('🎮 HollowIPeer starting with MUD storage');
        this.storage = storage;

        // Register message handler for MUD messages
        this.networkProvider.onMessage((peerId: string, message: P2PMessage) => {
            if (message.method === 'mud') {
                this.handleMudMessage(peerId, message.payload as MudMessage);
            }
        });

        console.log('✅ HollowIPeer started and listening for MUD messages');
    }

    reset(): void {
        console.log('🔄 Resetting HollowIPeer');

        // Close all MudConnections
        const connections = Array.from(this.mudConnections.values());
        for (const mudcon of connections) {
            try {
                mudcon.close();
            } catch (error) {
                console.error('❌ Error closing MudConnection:', error);
            }
        }

        this.mudConnections.clear();
        this.thingToPeerMap.clear();
        this.isHost = false;
        this.hostPeerID = null;
        this.currentWorld = null;

        console.log('✅ HollowIPeer reset complete');
    }

    connectString(): string {
        // Return the peer ID as the connection string
        // In Hollow, peers connect via the friend system and peer discovery
        const peerId = this.networkProvider.getPeerId();
        return peerId;
    }

    relayConnectString(): string {
        // Hollow uses circuit relay by default, so the connect string is the same
        return this.connectString();
    }

    startHosting(): void {
        console.log('🏠 Starting MUD hosting...');
        this.isHost = true;

        // Load or create world from storage
        if (this.storage) {
            // TODO: Load world from storage
            // For now, we'll need the caller to provide the world
            console.log('📚 World will be loaded by caller');
        }

        console.log('✅ MUD hosting started. Connection string:', this.connectString());
        console.log('📋 Share this peer ID with guests to allow them to join');
    }

    async joinSession(session: string): Promise<void> {
        console.log('🚪 Joining MUD session:', session);
        this.isHost = false;
        this.hostPeerID = session; // The session string is the host's peer ID

        // Send login message to host
        const loginMessage: MudMessage = {
            type: 'login',
            text: 'Guest joining session'
        };

        await this.sendToHost(loginMessage);
        console.log('✅ Login message sent to host');
    }

    startRelay(): void {
        throw new Error('Relay mode not supported in Hollow (circuit relay is built-in)');
    }

    hostViaRelay(sessionID: string): void {
        throw new Error('Relay hosting not needed in Hollow (circuit relay is built-in)');
    }

    userThingChanged(thing: Thing): void {
        if (!this.isHost) return;

        console.log('👤 User thing changed:', thing.name);

        // Find peer ID for this thing
        const peerID = this.findPeerIDForThing(thing);
        if (!peerID) {
            console.warn('⚠️  Could not find peer ID for thing:', thing.name);
            return;
        }

        // Collect custom properties from the Thing
        // In Textcraft, custom properties are set directly on the Thing object
        const properties: any = {};
        for (const key in thing) {
            if (!key.startsWith('_') && typeof (thing as any)[key] !== 'function') {
                properties[key] = (thing as any)[key];
            }
        }

        // Broadcast user update to all other peers
        const message: MudMessage = {
            type: 'userUpdate',
            peerID,
            name: thing.name,
            properties
        };

        this.broadcast(message, peerID);
        console.log('📢 User update broadcasted for:', thing.name);
    }

    command(cmd: string): void {
        if (this.isHost) {
            // For hosts, commands might be routed to their own MudConnection
            // This is an edge case - usually guests send commands
            console.log('🎮 Host command:', cmd);
            // TODO: Handle host commands if needed
        } else {
            // Send command to host
            console.log('📤 Sending command to host:', cmd);
            const message: MudMessage = {
                type: 'command',
                text: cmd
            };
            this.sendToHost(message);
        }
    }

    // ========== Private Helper Methods ==========

    /**
     * Handle incoming MUD message from a peer
     */
    private handleMudMessage(peerId: string, message: MudMessage): void {
        console.log('📨 Received MUD message from', peerId, ':', message.type);

        if (this.isHost) {
            this.handleHostMessage(peerId, message);
        } else {
            this.handleGuestMessage(peerId, message);
        }
    }

    /**
     * Handle messages received by the host
     */
    private handleHostMessage(peerId: string, message: MudMessage): void {
        switch (message.type) {
            case 'login':
                this.handleGuestLogin(peerId);
                break;

            case 'command':
                this.handleGuestCommand(peerId, message.text || '');
                break;

            default:
                console.warn('⚠️  Unknown message type from guest:', message.type);
        }
    }

    /**
     * Handle messages received by a guest
     */
    private handleGuestMessage(peerId: string, message: MudMessage): void {
        switch (message.type) {
            case 'output':
                this.handleHostOutput(message.text || '');
                break;

            case 'userUpdate':
                this.handleUserUpdate(message);
                break;

            case 'welcome':
                console.log('👋 Received welcome from host');
                break;

            default:
                console.warn('⚠️  Unknown message type from host:', message.type);
        }
    }

    /**
     * Handle a guest logging in (host side)
     */
    private handleGuestLogin(peerId: string): void {
        console.log('👤 Guest logging in:', peerId);

        if (!this.currentWorld) {
            console.error('❌ Cannot handle guest login: No world loaded');
            return;
        }

        // Create MudConnection for this guest
        const mudcon = createConnection(
            this.currentWorld,
            (text: string) => {
                // Output callback - send text back to guest
                this.sendOutputToGuest(peerId, text);
            },
            true // remote = true
        );

        this.mudConnections.set(peerId, mudcon);

        // Track the thing for this peer
        if (mudcon.thing) {
            this.thingToPeerMap.set(mudcon.thing, peerId);
        }

        // Send welcome message
        const welcomeMessage: MudMessage = {
            type: 'welcome',
            text: 'Connected to MUD'
        };

        this.sendMessageToPeer(peerId, welcomeMessage);
        console.log('✅ Guest MudConnection created for:', peerId);
    }

    /**
     * Handle a command from a guest (host side)
     */
    private handleGuestCommand(peerId: string, cmd: string): void {
        console.log('⚙️  Processing guest command:', cmd, 'from', peerId);

        const mudcon = this.mudConnections.get(peerId);
        if (!mudcon) {
            console.error('❌ No MudConnection for peer:', peerId);
            return;
        }

        try {
            mudcon.toplevelCommand(cmd);
        } catch (error) {
            console.error('❌ Error executing command:', error);
            this.sendOutputToGuest(peerId, `Error: ${error}`);
        }
    }

    /**
     * Handle output from host (guest side)
     */
    private handleHostOutput(text: string): void {
        console.log('📜 Received output from host:', text);

        // Display output in the adventure view
        // This will be handled by the adventure view component
        if (this.app && this.app.displayOutput) {
            this.app.displayOutput(text);
        }
    }

    /**
     * Handle user update from host (guest side)
     */
    private handleUserUpdate(message: MudMessage): void {
        console.log('👤 User update:', message.name);

        // Update the local representation of the user
        // This will be handled by the MudConnection on the guest side
        if (this.app && this.app.updateUser) {
            this.app.updateUser(message.peerID, message.name, message.properties);
        }
    }

    /**
     * Send output text to a specific guest
     */
    private sendOutputToGuest(peerId: string, text: string): void {
        const message: MudMessage = {
            type: 'output',
            text
        };

        this.sendMessageToPeer(peerId, message);
    }

    /**
     * Send a MUD message to a specific peer
     */
    private sendMessageToPeer(peerId: string, message: MudMessage): void {
        const p2pMessage: P2PMessage = {
            method: 'mud',
            payload: message
        };

        this.networkProvider.sendMessage(peerId, p2pMessage)
            .catch(error => {
                console.error('❌ Failed to send message to peer:', peerId, error);
            });
    }

    /**
     * Send a message to the host (guest side)
     */
    private sendToHost(message: MudMessage): void {
        if (!this.hostPeerID) {
            console.error('❌ Cannot send to host: No host peer ID set');
            return;
        }

        this.sendMessageToPeer(this.hostPeerID, message);
    }

    /**
     * Broadcast a message to all connected guests except one
     */
    private broadcast(message: MudMessage, excludePeerID?: PeerID): void {
        const peerIDs = Array.from(this.mudConnections.keys());
        for (const peerID of peerIDs) {
            if (peerID !== excludePeerID) {
                this.sendMessageToPeer(peerID, message);
            }
        }
    }

    /**
     * Find which peer owns a specific Thing
     */
    private findPeerIDForThing(thing: Thing): PeerID | null {
        return this.thingToPeerMap.get(thing) || null;
    }

    /**
     * Set the current world (called by host when loading a world)
     */
    setWorld(world: any): void {
        this.currentWorld = world;
        console.log('🌍 World set for HollowIPeer');
    }

    /**
     * Get the current world
     */
    getWorld(): any {
        return this.currentWorld;
    }
}
