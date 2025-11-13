/**
 * Network provider implementation using p2p-webapp
 * Replaces browser libp2p implementation with p2p-webapp Go server + TypeScript client
 * Implements INetworkProvider interface for compatibility with HollowPeer
 *
 * CRC: crc-P2PWebAppNetworkProvider.md
 * Spec: p2p.md
 * Sequences: seq-establish-p2p-connection.md
 */

import { P2PWebAppClient } from './client/client.js';
import type { INetworkProvider, P2PMessage } from './types.js';
import type { IProfileService } from '../services/ProfileService.js';
import { DEFAULT_PUBSUB_TOPIC, DEFAULT_PEER_PROTOCOL } from './constants.js';

/**
 * Storage key for p2p-webapp peer key
 */
const PEER_KEY_STORAGE = 'p2p-webapp-peer-key';

/**
 * Storage key for settings (includes pubsub topic and peer protocol)
 */
const SETTINGS_STORAGE_KEY = 'hollowWorldSettings';

/**
 * Network provider using p2p-webapp for P2P communication
 */
/**
 * P2PWebAppNetworkProvider class - Adapter for p2p-webapp client
 * CRC: crc-P2PWebAppNetworkProvider.md
 */
export class P2PWebAppNetworkProvider implements INetworkProvider {
    private client: P2PWebAppClient;
    private protocol: string;
    private topic: string;
    private messageHandler?: (peerId: string, message: P2PMessage) => void;
    private peerConnectHandler?: (peerId: string) => void;
    private peerDisconnectHandler?: (peerId: string) => void;
    private connectedPeers: Set<string> = new Set();
    private peerKey?: string;
    private peerID?: string;
    private profileService?: IProfileService;

    constructor(profileService?: IProfileService) {
        this.client = new P2PWebAppClient();
        this.profileService = profileService;

        // Load protocol and topic from settings (or use defaults)
        const settings = this.loadSettings();
        this.protocol = settings.peerProtocol || DEFAULT_PEER_PROTOCOL;
        this.topic = settings.pubsubTopic || DEFAULT_PUBSUB_TOPIC;

        console.log('[P2PWebApp] Using protocol:', this.protocol);
        console.log('[P2PWebApp] Using topic:', this.topic);
    }

    /**
     * Initialize the network provider
     *
     * Connects to p2p-webapp WebSocket and initializes peer
     */
    /**
     * Initialize P2P connection (WebSocket + peer + protocol + topic)
     * Sequence: seq-establish-p2p-connection.md (initialization)
     */
    async initialize(): Promise<void> {
        try {
            // Load or generate peer key
            const storedKey = this.loadPeerKey();

            // Connect to p2p-webapp WebSocket AND initialize peer in one call
            // Auto-detects WebSocket URL from window.location.host
            const [peerID, peerKey] = await this.client.connect(storedKey);
            this.peerID = peerID;
            this.peerKey = peerKey;

            console.log('[P2PWebApp] Connected to WebSocket, peer initialized:', peerID);

            // Store peer key for session persistence
            if (!storedKey) {
                this.storePeerKey(peerKey);
            }

            // Start protocol with message handler
            await this.client.start(this.protocol, (peer, data) => {
                this.handleMessage(peer, data);
            });

            console.log('[P2PWebApp] Protocol started:', this.protocol);

            // Subscribe to hollow-world topic with peer change monitoring
            // The third parameter handles peer join/leave events automatically
            await this.client.subscribe(
                this.topic,
                (senderId, data) => {
                    // Handle any topic messages if needed
                    console.log('[P2PWebApp] Topic message from', senderId);
                },
                (peerId, joined) => {
                    // Handle peer join/leave events
                    if (joined) {
                        this.handlePeerJoined(peerId);
                    } else {
                        this.handlePeerLeft(peerId);
                    }
                }
            );

            console.log('[P2PWebApp] Subscribed to topic with peer monitoring:', this.topic);

            // Initialize peer list with currently connected peers
            const peers = await this.client.listPeers(this.topic);
            this.connectedPeers = new Set(peers);
            console.log('[P2PWebApp] Initial peer list:', peers.length, 'peers');

        } catch (error) {
            console.error('[P2PWebApp] Initialization failed:', error);
            throw error;
        }
    }


    /**
     * Handle peer joining the topic
     */
    private handlePeerJoined(peerId: string): void {
        console.log('[P2PWebApp] Peer joined:', peerId);
        this.connectedPeers.add(peerId);

        // Notify peer connect handler
        if (this.peerConnectHandler) {
            this.peerConnectHandler(peerId);
        }
    }

    /**
     * Handle peer leaving the topic
     */
    private handlePeerLeft(peerId: string): void {
        console.log('[P2PWebApp] Peer left:', peerId);
        this.connectedPeers.delete(peerId);

        // Notify peer disconnect handler
        if (this.peerDisconnectHandler) {
            this.peerDisconnectHandler(peerId);
        }
    }

    /**
     * Handle incoming message from peer
     */
    private handleMessage(peer: string, data: any): void {
        // Deliver message to application handler
        if (this.messageHandler) {
            try {
                this.messageHandler(peer, data as P2PMessage);
            } catch (error) {
                console.error('[P2PWebApp] Error in message handler:', error);
            }
        }
    }

    /**
     * Load peer key from LocalStorage (profile-aware)
     */
    private loadPeerKey(): string | undefined {
        const key = this.profileService
            ? this.profileService.getItem(PEER_KEY_STORAGE)
            : localStorage.getItem(PEER_KEY_STORAGE);
        if (key) {
            console.log('[P2PWebApp] Loaded existing peer key');
        }
        return key || undefined;
    }

    /**
     * Store peer key in LocalStorage (profile-aware)
     */
    private storePeerKey(peerKey: string): void {
        if (this.profileService) {
            this.profileService.setItem(PEER_KEY_STORAGE, peerKey);
        } else {
            localStorage.setItem(PEER_KEY_STORAGE, peerKey);
        }
        console.log('[P2PWebApp] Peer key stored');
    }

    /**
     * Load settings from LocalStorage (profile-aware)
     */
    private loadSettings(): { pubsubTopic?: string; peerProtocol?: string } {
        try {
            const settingsJson = this.profileService
                ? this.profileService.getItem(SETTINGS_STORAGE_KEY)
                : localStorage.getItem(SETTINGS_STORAGE_KEY);

            if (settingsJson) {
                const settings = JSON.parse(settingsJson);
                return {
                    pubsubTopic: settings.pubsubTopic,
                    peerProtocol: settings.peerProtocol
                };
            }
        } catch (error) {
            console.warn('[P2PWebApp] Failed to load settings:', error);
        }
        return {};
    }

    /**
     * Get current peer ID
     */
    getPeerId(): string {
        return this.peerID || '';
    }

    /**
     * Get list of connected peers
     *
     * Note: p2p-webapp doesn't expose connection list, so we track peers
     * we've communicated with
     */
    getConnectedPeers(): string[] {
        return Array.from(this.connectedPeers);
    }

    /**
     * Send message to peer
     */
    async sendMessage(peerId: string, message: P2PMessage, onAck?: () => void | Promise<void>): Promise<void> {
        try {
            await this.client.send(peerId, this.protocol, message, onAck);
        } catch (error) {
            console.error(`[P2PWebApp] Failed to send message to ${peerId}:`, error);
            throw error;
        }
    }

    /**
     * Register message handler
     */
    onMessage(handler: (peerId: string, message: P2PMessage) => void): void {
        this.messageHandler = handler;
    }

    /**
     * Register peer connect handler
     */
    onPeerConnect(handler: (peerId: string) => void): void {
        this.peerConnectHandler = handler;
    }

    /**
     * Register peer disconnect handler
     */
    onPeerDisconnect(handler: (peerId: string) => void): void {
        this.peerDisconnectHandler = handler;
    }

    /**
     * Destroy the network provider
     */
    async destroy(): Promise<void> {
        try {
            // Unsubscribe from topic (automatically stops peer change monitoring)
            await this.client.unsubscribe(this.topic);

            // Stop protocol (removes listener, prevents sending)
            await this.client.stop(this.protocol);

            // Close WebSocket connection
            this.client.close();

            // Clear tracked peers
            this.connectedPeers.clear();

            console.log('[P2PWebApp] Provider destroyed');

        } catch (error) {
            console.error('[P2PWebApp] Error during destroy:', error);
            throw error;
        }
    }
}
