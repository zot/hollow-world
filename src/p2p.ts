import { Libp2p } from 'libp2p';
import { createHelia, libp2pDefaults } from 'helia';
import type { PeerId, Stream } from '@libp2p/interface';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { webRTC } from '@libp2p/webrtc';
import { webSockets } from '@libp2p/websockets';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { bootstrap } from '@libp2p/bootstrap';
import { multiaddr } from '@multiformats/multiaddr';
import { pipe } from 'it-pipe';
import * as lp from 'it-length-prefixed';
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { EventService } from './services/EventService';

// P2P Message interfaces (from specs/p2p-messages.md)
export interface IP2PMessage {
    method: string;
}

export interface IRequestFriendMessage extends IP2PMessage {
    method: 'requestFriend';
    inviteCode: string;
}

export interface IApproveFriendRequestMessage extends IP2PMessage {
    method: 'approveFriendRequest';
    peerId: string;
    nickname: string;
    approved: boolean;
}

export interface IPingMessage extends IP2PMessage {
    method: 'ping';
    timestamp: number;
    messageId: string;
}

export interface IPongMessage extends IP2PMessage {
    method: 'pong';
    timestamp: number;
    messageId: string;
}

export type P2PMessage = IRequestFriendMessage | IApproveFriendRequestMessage | IPingMessage | IPongMessage;

// Friend object structure
export interface IFriend {
    peerId: string;
    playerName: string;
    notes: string;
}

// Invitation structure
export interface IInvitation {
    inviteCode: string;
    peerId: string;
    addresses: {
        external?: string[];  // External/public IP addresses
        internal?: string[];  // Internal/LAN IP addresses (excluding localhost)
    };
}

// Active invitation entry (for receiver side validation)
export interface IActiveInvitation {
    friendName: string;
    friendId: string | null;
}

// STUN server entry
export interface IStunServer {
    url: string;
    responseTime: number;
}

// Interfaces for SOLID principles (Dependency Inversion)
export interface IStorageProvider {
    save(key: string, data: any): Promise<void>;
    load<T>(key: string): Promise<T | null>;
}

export interface IFriendsManager {
    addFriend(friend: IFriend): void;
    removeFriend(peerId: string): boolean;
    getFriend(peerId: string): IFriend | undefined;
    getAllFriends(): Map<string, IFriend>;
}

export interface INetworkProvider {
    initialize(stunServers?: IStunServer[]): Promise<void>;
    getPeerId(): string;
    getConnectedPeers(): string[];
    destroy(): Promise<void>;
    sendMessage(peerId: string, message: P2PMessage): Promise<void>;
    sendMessageWithAddresses?(
        peerId: string,
        addresses: { external?: string[], internal?: string[] },
        message: P2PMessage,
        ourExternalIp?: string
    ): Promise<void>;
    onMessage(handler: (peerId: string, message: P2PMessage) => void): void;
    onPeerConnect(handler: (peerId: string) => void): void;
}

// Storage implementation (Single Responsibility)
export class LocalStorageProvider implements IStorageProvider {
    private profileService?: any; // IProfileService - avoiding circular dependency

    constructor(profileService?: any) {
        this.profileService = profileService;
    }

    private getKey(key: string): string {
        if (this.profileService) {
            return this.profileService.getStorageKey(key);
        }
        return key;
    }

    async save(key: string, data: any): Promise<void> {
        try {
            const storageKey = this.getKey(key);
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn(`Failed to save ${key}:`, error);
            throw new Error(`Storage save failed: ${error}`);
        }
    }

    async load<T>(key: string): Promise<T | null> {
        try {
            const storageKey = this.getKey(key);
            const stored = localStorage.getItem(storageKey);
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.warn(`Failed to load ${key}:`, error);
            return null;
        }
    }
}

// Friends management (Single Responsibility)
export class FriendsManager implements IFriendsManager {
    private friends: Map<string, IFriend> = new Map(); // peerId -> IFriend
    private storageProvider: IStorageProvider;
    private readonly storageKey = 'hollowPeerFriends';

    constructor(storageProvider: IStorageProvider) {
        this.storageProvider = storageProvider;
    }

    async loadFriends(): Promise<void> {
        const friendsData = await this.storageProvider.load<Record<string, IFriend>>(this.storageKey);
        if (friendsData) {
            this.friends = new Map(Object.entries(friendsData));
        }
    }

    addFriend(friend: IFriend): void {
        this.friends.set(friend.peerId, friend);
        this.persistFriends();
    }

    removeFriend(peerId: string): boolean {
        const removed = this.friends.delete(peerId);
        if (removed) {
            this.persistFriends();
        }
        return removed;
    }

    getFriend(peerId: string): IFriend | undefined {
        return this.friends.get(peerId);
    }

    getAllFriends(): Map<string, IFriend> {
        return new Map(this.friends);
    }

    private persistFriends(): void {
        const friendsObject = Object.fromEntries(this.friends);
        this.storageProvider.save(this.storageKey, friendsObject).catch(error => {
            console.warn('Failed to persist friends:', error);
        });
    }
}

// Network provider implementation (Single Responsibility)
export class LibP2PNetworkProvider implements INetworkProvider {
    private libp2p: Libp2p | null = null;
    private helia: any;
    private peerId: string = '';
    private storageProvider: IStorageProvider;
    private readonly peerIdStorageKey = 'hollowPeerID';
    private readonly protocol = '/hollow-world/1.0.0';
    private messageHandlers: Array<(peerId: string, message: P2PMessage) => void> = [];
    private peerConnectHandlers: Array<(peerId: string) => void> = [];

    constructor(storageProvider: IStorageProvider = new LocalStorageProvider()) {
        this.storageProvider = storageProvider;
    }

    async initialize(stunServers?: IStunServer[]): Promise<void> {
        try {
            console.log('🔗 Starting peer ID initialization...');

            // Try to restore peer ID from stored private key first
            let peerId;
            let privateKey;
            const storedPrivateKey = await this.storageProvider.load<any>('privateKeyData');

            if (storedPrivateKey) {
                try {
                    console.log('🔑 Found stored private key, restoring peer ID...');
                    const privateKeyBytes = new Uint8Array(storedPrivateKey.rawBytes || storedPrivateKey.privateKey);
                    const { privateKeyFromProtobuf } = await import('@libp2p/crypto/keys');
                    privateKey = await privateKeyFromProtobuf(privateKeyBytes);

                    const { peerIdFromPrivateKey } = await import('@libp2p/peer-id');
                    peerId = await peerIdFromPrivateKey(privateKey);
                    console.log('🔑 Successfully restored peer ID from stored private key:', peerId.toString());
                } catch (error: any) {
                    console.warn('Failed to restore peer ID from private key:', error.message);
                    peerId = null;
                    privateKey = null;
                }
            }

            // If no stored data or restoration failed, create new one
            if (!peerId) {
                console.log('🔑 Creating new peer ID...');
                peerId = await createEd25519PeerId();
                const rawPrivateKey = peerId.privateKey;
                console.log('🔑 New peer ID created:', peerId.toString());

                // Convert raw private key bytes to PrivateKey object for libp2p
                if (rawPrivateKey) {
                    try {
                        const { privateKeyFromProtobuf } = await import('@libp2p/crypto/keys');
                        privateKey = await privateKeyFromProtobuf(rawPrivateKey);

                        // Save the raw private key for future sessions
                        const privateKeyData = {
                            rawBytes: Array.from(rawPrivateKey)
                        };
                        await this.storageProvider.save('privateKeyData', privateKeyData);
                        console.log('🔑 Private key saved to storage for persistence');
                    } catch (saveError) {
                        console.warn('Failed to save private key:', saveError);
                    }
                }
            }

            // Store the peer ID
            this.peerId = peerId.toString();
            console.log('🔗 P2P network initialized with peer ID:', this.peerId);

            // Ensure we have a private key
            if (!privateKey) {
                throw new Error('Failed to obtain private key for libp2p initialization');
            }

            // Local test relay server address (when running test/local-servers.js)
            // Using LAN IP instead of localhost to avoid browser security restrictions
            const localRelayAddr = '/ip4/192.168.1.103/tcp/9090/ws/p2p/12D3KooWDe4PMnvGqvk8vmCAC99NuybEUcPzHpv8WRcHM4txBBqm';

            // Prepare WebRTC configuration with STUN servers
            const iceServers: any[] = [];

            // Add local TURN/STUN server for testing (when running test/local-servers.js)
            // Using LAN IP instead of localhost to avoid browser security restrictions
            iceServers.push({
                urls: ['stun:192.168.1.103:3478', 'turn:192.168.1.103:3478'],
                username: 'testuser',
                credential: 'testpass'
            });

            if (stunServers && stunServers.length > 0) {
                // Use first 10 STUN servers (spec: use first working out of first 10)
                const stunServerList = stunServers.slice(0, 10);
                iceServers.push(...stunServerList.map(server => ({ urls: server.url })));
                console.log(`📡 Configured WebRTC with local TURN + ${stunServerList.length} STUN servers`);
            } else {
                console.log('📡 Configured WebRTC with local TURN server only');
            }

            // Get Helia's default libp2p configuration with our private key
            console.log('🔗 Creating libp2p configuration using Helia defaults...');
            const defaults = libp2pDefaults({ privateKey });

            // Customize for browser: filter out TCP transport (not supported in browsers)
            // Keep: webRTC, webSockets, circuitRelay (all browser-compatible)
            const browserTransports = defaults.transports?.filter((t: any) => {
                const transportName = t.constructor?.name || t.toString();
                // Filter out TCP transport (TCP requires Node.js, not available in browsers)
                return !transportName.toLowerCase().includes('tcp') || transportName.toLowerCase().includes('webtransport');
            }) || [];

            // Add our STUN/TURN servers to WebRTC transport
            const webRTCWithStun = webRTC({ rtcConfiguration: { iceServers } });
            const transportsWithCustomWebRTC = browserTransports.map((t: any) => {
                const transportName = t.constructor?.name || t.toString();
                if (transportName.toLowerCase().includes('webrtc') && !transportName.toLowerCase().includes('direct')) {
                    return webRTCWithStun;
                }
                return t;
            });

            // Add local relay to bootstrap nodes
            const defaultBootstrap = defaults.peerDiscovery?.find((pd: any) =>
                pd.constructor?.name?.toLowerCase().includes('bootstrap')
            );

            let bootstrapList = [localRelayAddr];
            if (defaultBootstrap && typeof defaultBootstrap === 'object' && 'list' in defaultBootstrap) {
                bootstrapList = [...bootstrapList, ...(defaultBootstrap as any).list];
            }

            const customPeerDiscovery = [
                bootstrap({ list: bootstrapList }),
                ...(defaults.peerDiscovery?.filter((pd: any) =>
                    !pd.constructor?.name?.toLowerCase().includes('bootstrap')
                ) || [])
            ];

            console.log('🔗 Initializing Helia/IPFS with browser-compatible libp2p configuration...');
            console.log('🔗 Transports:', transportsWithCustomWebRTC.map((t: any) => t.constructor?.name || t.toString()).join(', '));
            console.log('🔗 Bootstrap nodes:', bootstrapList.length);

            // Create Helia with customized libp2p options
            this.helia = await createHelia({
                libp2p: {
                    ...defaults,
                    transports: transportsWithCustomWebRTC,
                    peerDiscovery: customPeerDiscovery,
                    connectionGater: {
                        // Allow all connections for local development/testing
                        // This permits connections to private IPs like 192.168.x.x
                        denyDialPeer: async () => false,
                        denyDialMultiaddr: async () => false,
                        denyInboundConnection: async () => false,
                        denyOutboundConnection: async () => false,
                        denyInboundEncryptedConnection: async () => false,
                        denyOutboundEncryptedConnection: async () => false,
                        denyInboundUpgradedConnection: async () => false,
                        denyOutboundUpgradedConnection: async () => false,
                        filterMultiaddrForPeer: async () => true
                    }
                }
            });

            console.log('🌐 Helia/IPFS initialized successfully');

            // Get the libp2p instance that Helia created
            this.libp2p = this.helia.libp2p as Libp2p;
            console.log('🔗 LibP2P node created by Helia');

            // Set up stream handler for incoming messages
            await this.libp2p.handle(this.protocol, this.handleIncomingStream.bind(this));

            // Listen for peer connections
            this.libp2p.addEventListener('peer:connect', this.handlePeerConnect.bind(this));

            // Clean up old persistence data
            await this.loadSerializedPeerId();

            console.log('🔗 Peer ID initialization completed successfully');

        } catch (initError: any) {
            console.error('🚨 Peer ID initialization failed:', initError);
            console.error('🚨 Error details:', {
                name: initError.name,
                message: initError.message,
                stack: initError.stack
            });
            throw initError;
        }
    }

    private async loadSerializedPeerId(): Promise<any> {
        // Peer ID persistence is disabled - always return null
        // Clear any old data from previous attempts
        try {
            const peerData = await this.storageProvider.load<any>(this.peerIdStorageKey);
            if (peerData) {
                console.log('Clearing old peer data from localStorage (persistence not supported)');
                await this.storageProvider.save(this.peerIdStorageKey, null);
            }
        } catch (error) {
            // Ignore errors when cleaning up
        }
        return null;
    }

    private async persistPeerId(): Promise<void> {
        // Peer ID persistence is not supported in libp2p@2.10.0
        // This method is kept for backward compatibility but does nothing
    }

    getPeerId(): string {
        if (!this.peerId) {
            throw new Error('Network provider not initialized');
        }
        return this.peerId;
    }

    getConnectedPeers(): string[] {
        if (!this.libp2p) {
            return [];
        }
        return this.libp2p.getPeers().map(peer => peer.toString());
    }

    async destroy(): Promise<void> {
        if (this.helia) {
            await this.helia.stop();
        }
        if (this.libp2p) {
            await this.libp2p.stop();
        }
    }

    getLibP2P(): Libp2p | null {
        return this.libp2p;
    }

    getHelia(): any {
        return this.helia;
    }

    async sendMessage(peerIdStr: string, message: P2PMessage): Promise<void> {
        if (!this.libp2p) {
            throw new Error('LibP2P not initialized');
        }

        try {
            console.log(`📤 Sending message to ${peerIdStr}:`, message);

            // Convert peer ID string to PeerId object
            const { peerIdFromString } = await import('@libp2p/peer-id');
            const targetPeerId = peerIdFromString(peerIdStr);

            let stream;

            try {
                // Try direct dial first
                stream = await this.libp2p.dialProtocol(targetPeerId, this.protocol);
                console.log(`✅ Direct connection established to ${peerIdStr}`);
            } catch (directDialError: any) {
                // Direct dial failed, try circuit relay fallback using configured relays
                console.log(`⚠️ Direct dial failed, trying circuit relay fallback...`);

                // Try each configured relay server
                const relayAddresses = [
                    '/ip4/192.168.1.103/tcp/9090/ws/p2p/12D3KooWDe4PMnvGqvk8vmCAC99NuybEUcPzHpv8WRcHM4txBBqm',
                    '/dns4/relay.libp2p.io/tcp/443/wss/p2p/QmWDn2LY8nannvSWJzruUYoLZ4vV83vfCBwd8DipvdgQc3'
                ];

                let lastError: any;
                for (const relayAddr of relayAddresses) {
                    try {
                        const relayMultiaddr = multiaddr(`${relayAddr}/p2p-circuit/p2p/${peerIdStr}`);
                        console.log(`🔄 Trying relay address: ${relayMultiaddr.toString()}`);

                        stream = await this.libp2p.dialProtocol(relayMultiaddr, this.protocol);
                        console.log(`✅ Circuit relay connection established to ${peerIdStr} via ${relayAddr}`);
                        break; // Success, exit loop
                    } catch (relayError: any) {
                        console.log(`❌ Relay ${relayAddr} failed:`, relayError.message);
                        lastError = relayError;
                        // Continue to next relay
                    }
                }

                // If no relay worked, throw the last error
                if (!stream) {
                    throw lastError || new Error('All relay attempts failed');
                }
            }

            // Encode message as JSON
            const messageData = JSON.stringify(message);
            const messageBytes = uint8ArrayFromString(messageData);

            // Send message with length prefix
            await pipe(
                [messageBytes],
                lp.encode,
                stream
            );

            console.log(`✅ Message sent to ${peerIdStr}`);
        } catch (error: any) {
            console.error(`❌ Failed to send message to ${peerIdStr}:`, error);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    /**
     * Send message using specific addresses (for manual address exchange)
     * @param peerIdStr Target peer ID
     * @param addresses External and internal IP addresses
     * @param message The message to send
     * @param ourExternalIp Our external IP (to decide which addresses to use)
     */
    async sendMessageWithAddresses(
        peerIdStr: string,
        addresses: { external?: string[], internal?: string[] },
        message: P2PMessage,
        ourExternalIp?: string
    ): Promise<void> {
        if (!this.libp2p) {
            throw new Error('LibP2P not initialized');
        }

        const { peerIdFromString } = await import('@libp2p/peer-id');
        const targetPeerId = peerIdFromString(peerIdStr);

        // Decide which addresses to use based on external IP comparison
        let addressesToTry: string[] = [];

        if (ourExternalIp && addresses.external?.includes(ourExternalIp) && addresses.internal) {
            // Same external IP - use internal addresses
            console.log('🌐 Same external IP detected, using internal addresses');
            addressesToTry = addresses.internal;
        } else if (addresses.external) {
            // Different external IPs - use external addresses
            console.log('🌐 Different external IPs, using external addresses');
            addressesToTry = addresses.external;
        } else if (addresses.internal) {
            // No external, try internal
            console.log('🌐 No external addresses, trying internal');
            addressesToTry = addresses.internal;
        }

        // Try each address
        for (const ip of addressesToTry) {
            try {
                // Construct multiaddr with WebTransport (primary browser transport)
                const addr = multiaddr(`/ip4/${ip}/udp/4001/quic-v1/webtransport/p2p/${peerIdStr}`);
                console.log(`🔗 Trying direct connection to ${addr.toString()}`);

                const stream = await this.libp2p.dialProtocol(addr, this.protocol);
                console.log(`✅ Connected via direct address: ${ip}`);

                // Send message
                const messageData = JSON.stringify(message);
                const messageBytes = uint8ArrayFromString(messageData);
                await pipe([messageBytes], lp.encode, stream);
                console.log(`✅ Message sent via direct address`);
                return; // Success!
            } catch (error: any) {
                console.log(`⚠️ Failed to connect to ${ip}: ${error.message}`);
                // Continue to next address
            }
        }

        // All direct addresses failed, fall back to normal sendMessage
        console.log('⚠️ All direct addresses failed, falling back to DHT/relay');
        await this.sendMessage(peerIdStr, message);
    }

    onMessage(handler: (peerId: string, message: P2PMessage) => void): void {
        this.messageHandlers.push(handler);
    }

    onPeerConnect(handler: (peerId: string) => void): void {
        this.peerConnectHandlers.push(handler);
    }

    private async handleIncomingStream({ stream, connection }: { stream: Stream; connection: any }): Promise<void> {
        try {
            const remotePeerId = connection.remotePeer.toString();
            console.log(`📥 Incoming stream from ${remotePeerId}`);

            // Read message with length prefix
            const data = await pipe(
                stream,
                lp.decode,
                async (source: any) => {
                    const chunks: Uint8Array[] = [];
                    for await (const chunk of source) {
                        chunks.push(chunk.subarray());
                    }
                    return chunks;
                }
            );

            if (data.length > 0) {
                const messageStr = uint8ArrayToString(data[0]);
                const message = JSON.parse(messageStr) as P2PMessage;

                console.log(`📨 Received message from ${remotePeerId}:`, message);

                // Validate message has required method field
                if (!message.method) {
                    console.warn('⚠️ Received invalid message without method field');
                    return;
                }

                // Notify all handlers
                for (const handler of this.messageHandlers) {
                    try {
                        handler(remotePeerId, message);
                    } catch (handlerError) {
                        console.error('❌ Error in message handler:', handlerError);
                    }
                }
            }
        } catch (error: any) {
            console.error('❌ Error handling incoming stream:', error);
        }
    }

    private async handlePeerConnect(event: any): Promise<void> {
        const remotePeerId = event.detail.toString();

        // Notify all handlers (don't log peer connections - peer count display handles that)
        for (const handler of this.peerConnectHandlers) {
            try {
                handler(remotePeerId);
            } catch (handlerError) {
                console.error('❌ Error in peer connect handler:', handlerError);
            }
        }
    }
}

// IP Address Detection Utilities
export class IPAddressDetector {
    /**
     * Detect external and internal IP addresses using WebRTC and STUN
     * @returns Promise with external and internal IP addresses
     */
    static async detectIPAddresses(): Promise<{ external: string[], internal: string[] }> {
        const external: string[] = [];
        const internal: string[] = [];

        try {
            // Create RTCPeerConnection with STUN servers for IP detection
            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            });

            // Create a dummy data channel to trigger ICE gathering
            pc.createDataChannel('');

            // Create offer to start ICE gathering
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // Wait for ICE candidates with timeout
            await new Promise<void>((resolve) => {
                const timeout = setTimeout(() => {
                    resolve();
                }, 5000); // 5 second timeout

                pc.onicecandidate = (event) => {
                    if (!event.candidate) {
                        // ICE gathering complete
                        clearTimeout(timeout);
                        resolve();
                        return;
                    }

                    const candidate = event.candidate.candidate;
                    if (!candidate) return;

                    // Parse ICE candidate to extract IP
                    const parts = candidate.split(' ');
                    if (parts.length < 5) return;

                    const ip = parts[4];
                    const type = event.candidate.type;

                    // Filter out localhost addresses only
                    if (ip.startsWith('127.') || ip === '::1' || ip === 'localhost') {
                        return;
                    }

                    // Allow .local mDNS hostnames - they may be useful for local network discovery
                    // Only filter out non-IP, non-.local hostnames
                    // Valid: IPv4 (contains .), IPv6 (contains :), or .local hostnames
                    if (!ip.includes('.') && !ip.includes(':')) {
                        return;
                    }

                    // Categorize by candidate type
                    if (type === 'host') {
                        // Local network IP
                        if (!internal.includes(ip)) {
                            internal.push(ip);
                        }
                    } else if (type === 'srflx' || type === 'prflx') {
                        // Server reflexive (external) IP from STUN
                        if (!external.includes(ip)) {
                            external.push(ip);
                        }
                    }
                };
            });

            // Clean up
            pc.close();

            console.log('🌐 Detected IPs - External:', external, 'Internal:', internal);
        } catch (error) {
            console.warn('⚠️ IP address detection failed:', error);
        }

        return { external, internal };
    }

    /**
     * Convert IP addresses to libp2p multiaddrs
     * @param ips IP addresses to convert
     * @param port Port number (optional)
     * @returns Array of multiaddr strings
     */
    static ipsToMultiaddrs(ips: string[], port?: number): string[] {
        const multiaddrs: string[] = [];

        for (const ip of ips) {
            // Detect IPv4 vs IPv6
            const isIPv6 = ip.includes(':');
            const protocol = isIPv6 ? 'ip6' : 'ip4';

            // Create multiaddr with or without port
            if (port) {
                multiaddrs.push(`/${protocol}/${ip}/tcp/${port}`);
            } else {
                multiaddrs.push(`/${protocol}/${ip}`);
            }
        }

        return multiaddrs;
    }
}

// Main HollowPeer class (Open/Closed principle - extensible through composition)
export class HollowPeer {
    private networkProvider: INetworkProvider;
    private friendsManager: IFriendsManager;
    private storageProvider: IStorageProvider;
    private eventService: EventService;
    private nickname: string = '';
    private activeInvitations: Record<string, IActiveInvitation> = {}; // inviteCode -> {friendName, friendId}
    private quarantined: Set<string> = new Set(); // Set of untrusted peer IDs (not persisted)
    private pendingFriendRequests: Record<string, IInvitation> = {}; // peerID -> invitation (persisted - outgoing requests)
    private stunServers: IStunServer[] = []; // Array of STUN servers (persisted)

    // Request-Response Infrastructure (not persisted)
    private messagePrefix: string;
    private messageCount: number = 0;
    private pendingResponses: Map<string, () => void> = new Map(); // messageId -> handler function

    constructor(
        networkProvider?: INetworkProvider,
        storageProvider: IStorageProvider = new LocalStorageProvider(),
        eventService?: EventService
    ) {
        this.storageProvider = storageProvider;
        this.networkProvider = networkProvider || new LibP2PNetworkProvider(storageProvider);
        this.friendsManager = new FriendsManager(storageProvider);
        this.eventService = eventService || new EventService();

        // Generate random message prefix for request-response correlation
        this.messagePrefix = this.generateRandomPrefix();
    }

    private generateRandomPrefix(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let prefix = '';
        for (let i = 0; i < 8; i++) {
            prefix += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return prefix + '-';
    }

    private generateMessageId(): string {
        return `${this.messagePrefix}${this.messageCount++}`;
    }

    getEventService(): EventService {
        return this.eventService;
    }

    async initialize(): Promise<void> {
        // Load STUN servers from storage or fetch from assets FIRST
        const storedStunServers = await this.storageProvider.load<IStunServer[]>('hollowPeerStunServers');
        if (storedStunServers && storedStunServers.length > 0) {
            this.stunServers = storedStunServers;
            console.log(`📡 Loaded ${this.stunServers.length} STUN servers from storage`);
        } else {
            // Fetch from assets/validated-public-servers.json
            try {
                const response = await fetch(new URL('/assets/validated-public-servers.json', window.location.origin).toString());
                const data = await response.json();
                this.stunServers = data.stun || [];
                // Persist to storage
                await this.storageProvider.save('hollowPeerStunServers', this.stunServers);
                console.log(`📡 Loaded ${this.stunServers.length} STUN servers from assets and saved to storage`);
            } catch (error) {
                console.warn('⚠️ Failed to load STUN servers from assets:', error);
                this.stunServers = [];
            }
        }

        // Initialize network provider with STUN servers
        await this.networkProvider.initialize(this.stunServers);
        await (this.friendsManager as FriendsManager).loadFriends();

        // Load nickname from storage
        const storedNickname = await this.storageProvider.load<string>('hollowPeerNickname');
        if (storedNickname) {
            this.nickname = storedNickname;
        }

        // Load active invitations from storage
        const storedInvitations = await this.storageProvider.load<Record<string, IActiveInvitation>>('hollowPeerActiveInvitations');
        if (storedInvitations) {
            this.activeInvitations = storedInvitations;
        }

        // Load pending friend requests from storage
        const storedPendingRequests = await this.storageProvider.load<Record<string, IInvitation>>('hollowPeerPendingFriendRequests');
        if (storedPendingRequests) {
            this.pendingFriendRequests = storedPendingRequests;
        }

        // Set up message handler
        this.networkProvider.onMessage(this.handleMessage.bind(this));

        // Set up peer connect handler
        this.networkProvider.onPeerConnect(this.handlePeerConnection.bind(this));

        // Session restoration: resend pending friend requests
        await this.resendPendingRequests();
    }

    private async resendPendingRequests(): Promise<void> {
        const pendingPeerIds = Object.keys(this.pendingFriendRequests);

        if (pendingPeerIds.length === 0) {
            return;
        }

        console.log(`🔄 Found ${pendingPeerIds.length} pending friend request(s)`);
        console.log('🔍 Starting background peer discovery (up to 2 minutes)...');

        // Start background resolution for each peer
        for (const peerId of pendingPeerIds) {
            this.startBackgroundPeerResolution(peerId);
        }
    }

    private startBackgroundPeerResolution(peerId: string): void {
        const invitation = this.pendingFriendRequests[peerId];
        if (!invitation) {
            return;
        }

        const startTime = Date.now();
        const maxDuration = 120000; // 2 minutes
        const retryInterval = 10000; // Try every 10 seconds
        let attemptCount = 0;

        const tryConnect = async () => {
            const elapsed = Date.now() - startTime;

            // Stop if we've exceeded 2 minutes
            if (elapsed >= maxDuration) {
                console.warn(`⏱️ Peer discovery timeout for ${peerId.substring(0, 20)}... (${attemptCount} attempts over 2 minutes)`);
                return;
            }

            attemptCount++;
            console.log(`🔍 Attempt ${attemptCount}: Trying to connect to ${peerId.substring(0, 20)}...`);

            try {
                const friendRequest: IRequestFriendMessage = {
                    method: 'requestFriend',
                    inviteCode: invitation.inviteCode
                };

                await this.networkProvider.sendMessage(peerId, friendRequest);
                console.log(`✅ Successfully connected and sent friend request to ${peerId.substring(0, 20)}... (attempt ${attemptCount})`);
                // Success - don't schedule another retry
                return;
            } catch (error: any) {
                // Peer not reachable yet, schedule next retry
                setTimeout(tryConnect, retryInterval);
            }
        };

        // Start immediately (attempt 1)
        tryConnect();
    }

    private handlePeerConnection(remotePeerId: string): void {
        // If peer is not in friends map, add to quarantined set
        // (Don't log peer connections - peer count display handles that)
        const isFriend = this.friendsManager.getFriend(remotePeerId);
        if (!isFriend) {
            this.quarantined.add(remotePeerId);
        }
    }

    setNickname(nickname: string): void {
        this.nickname = nickname;
        this.storageProvider.save('hollowPeerNickname', nickname).catch(error => {
            console.warn('Failed to save nickname:', error);
        });
    }

    getNickname(): string {
        return this.nickname;
    }

    getPeerId(): string {
        return this.networkProvider.getPeerId();
    }

    getConnectedPeers(): string[] {
        return this.networkProvider.getConnectedPeers();
    }

    getConnectedPeerCount(): number {
        return this.networkProvider.getConnectedPeers().length;
    }

    addFriend(playerName: string, peerId: string, notes: string = ''): void {
        if (!playerName.trim()) {
            throw new Error('Friend name cannot be empty');
        }
        if (!peerId.trim()) {
            throw new Error('Friend peer ID cannot be empty');
        }
        const friend: IFriend = {
            playerName,
            peerId,
            notes
        };
        this.friendsManager.addFriend(friend);
    }

    removeFriend(peerId: string): boolean {
        return this.friendsManager.removeFriend(peerId);
    }

    getFriend(peerId: string): IFriend | undefined {
        return this.friendsManager.getFriend(peerId);
    }

    getAllFriends(): Map<string, IFriend> {
        return this.friendsManager.getAllFriends();
    }

    // Quarantine management
    getQuarantined(): Set<string> {
        return new Set(this.quarantined);
    }

    isQuarantined(peerId: string): boolean {
        return this.quarantined.has(peerId);
    }

    removeFromQuarantine(peerId: string): boolean {
        return this.quarantined.delete(peerId);
    }

    // Invitation management
    generateInviteCode(): string {
        // Generate random 8-character invite code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async createInvitation(friendName: string, friendId: string | null = null): Promise<string> {
        const inviteCode = this.generateInviteCode();
        this.activeInvitations[inviteCode] = { friendName, friendId };
        this.persistInvitations();

        // Detect IP addresses
        const { external, internal } = await IPAddressDetector.detectIPAddresses();

        // Create invitation object
        const invitation: IInvitation = {
            inviteCode,
            peerId: this.getPeerId(),
            addresses: {
                external: external.length > 0 ? external : undefined,
                internal: internal.length > 0 ? internal : undefined
            }
        };

        // Encode as base64 JSON
        const invitationJson = JSON.stringify(invitation);
        const invitationBase64 = btoa(invitationJson);

        console.log('📋 Created invitation:', invitation);
        console.log('📋 Encoded invitation:', invitationBase64);

        return invitationBase64;
    }

    getActiveInvitations(): Record<string, IActiveInvitation> {
        return { ...this.activeInvitations };
    }

    private persistInvitations(): void {
        this.storageProvider.save('hollowPeerActiveInvitations', this.activeInvitations).catch(error => {
            console.warn('Failed to persist invitations:', error);
        });
    }

    private persistPendingRequests(): void {
        this.storageProvider.save('hollowPeerPendingFriendRequests', this.pendingFriendRequests).catch(error => {
            console.warn('Failed to persist pending friend requests:', error);
        });
    }

    async destroy(): Promise<void> {
        await this.networkProvider.destroy();
    }

    // P2P Message Handling
    private handleMessage(remotePeerId: string, message: P2PMessage): void {
        console.log(`🔔 Handling message from ${remotePeerId}:`, message);

        switch (message.method) {
            case 'requestFriend':
                this.handleRequestFriend(remotePeerId, message as IRequestFriendMessage);
                break;
            case 'approveFriendRequest':
                this.handleApproveFriendRequest(remotePeerId, message as IApproveFriendRequestMessage);
                break;
            case 'ping':
                this.handlePing(remotePeerId, message as IPingMessage);
                break;
            case 'pong':
                this.handlePong(remotePeerId, message as IPongMessage);
                break;
            default:
                // This should never happen if our types are correct
                console.warn(`⚠️ Unknown message method: ${(message as any).method}`);
        }
    }

    private handleRequestFriend(remotePeerId: string, message: IRequestFriendMessage): void {
        console.log(`👥 Friend request from ${remotePeerId} with invite code: ${message.inviteCode}`);

        // Check activeInvitations for invite code
        const invitation = this.activeInvitations[message.inviteCode];

        if (!invitation) {
            console.warn(`⚠️ Invalid friend request: invite code ${message.inviteCode} not found`);
            return;
        }

        // If invitation has a friendId, verify it matches the sender
        if (invitation.friendId && invitation.friendId !== remotePeerId) {
            console.warn(`⚠️ Invalid friend request: peer ID ${remotePeerId} does not match invited ID ${invitation.friendId}`);
            return;
        }

        // Valid request - create event
        const event = this.eventService.createFriendRequestEvent(
            remotePeerId,
            message.inviteCode,
            invitation.friendName
        );
        this.eventService.addEvent(event);

        console.log(`✅ Valid friend request from ${remotePeerId}. Event created with ID: ${event.id}`);
    }

    private handleApproveFriendRequest(remotePeerId: string, message: IApproveFriendRequestMessage): void {
        // If peerId is already in friends map, ignore it
        if (this.friendsManager.getFriend(remotePeerId)) {
            console.log(`ℹ️ Peer ${remotePeerId} is already a friend, ignoring approveFriendRequest`);
            return;
        }

        // If peerId is NOT in pendingFriendRequests, log error
        if (!this.pendingFriendRequests[remotePeerId]) {
            console.error(`⚠️ Received approveFriendRequest from ${remotePeerId} but no pending request found`);
            return;
        }

        if (message.approved) {
            console.log(`✅ ${message.nickname} (${remotePeerId}) approved your friend request!`);

            // Remove entry from pendingFriendRequests
            delete this.pendingFriendRequests[remotePeerId];
            this.persistPendingRequests();

            // Add entry to friends map
            const friend: IFriend = {
                playerName: message.nickname,
                peerId: remotePeerId,
                notes: ''
            };
            this.friendsManager.addFriend(friend);

            // Remove from quarantine if present
            if (this.quarantined.has(remotePeerId)) {
                this.quarantined.delete(remotePeerId);
                console.log(`✅ Removed ${remotePeerId} from quarantine`);
            }

            // Add accepted event to event list
            const event = this.eventService.createFriendApprovedEvent(remotePeerId, message.nickname);
            this.eventService.addEvent(event);
            console.log(`✅ Friend approved event created with ID: ${event.id}`);
        } else {
            console.log(`❌ ${message.nickname} (${remotePeerId}) declined your friend request`);

            // Remove from pendingFriendRequests
            delete this.pendingFriendRequests[remotePeerId];
            this.persistPendingRequests();
        }
    }

    private handlePing(remotePeerId: string, message: IPingMessage): void {
        console.log(`🏓 Received ping from ${remotePeerId.substring(0, 20)}... (messageId: ${message.messageId})`);

        // Immediately respond with pong containing the same timestamp and messageId
        const pongMessage: IPongMessage = {
            method: 'pong',
            timestamp: message.timestamp,
            messageId: message.messageId
        };

        this.networkProvider.sendMessage(remotePeerId, pongMessage)
            .then(() => {
                console.log(`🏓 Sent pong response to ${remotePeerId.substring(0, 20)}... (messageId: ${message.messageId})`);
            })
            .catch((error) => {
                console.error(`❌ Failed to send pong to ${remotePeerId.substring(0, 20)}...:`, error);
            });
    }

    private handlePong(remotePeerId: string, message: IPongMessage): void {
        const now = Date.now();
        const roundTripTime = now - message.timestamp;

        console.log(`🏓 Received pong from ${remotePeerId.substring(0, 20)}... (messageId: ${message.messageId})`);
        console.log(`⏱️  Round-trip time: ${roundTripTime}ms`);

        // Look up and execute handler from pendingResponses
        const handler = this.pendingResponses.get(message.messageId);
        if (handler) {
            console.log(`🔔 Executing response handler for messageId: ${message.messageId}`);
            this.pendingResponses.delete(message.messageId);
            handler();
        } else {
            console.warn(`⚠️ Received pong with unknown or already-processed messageId: ${message.messageId}`);
        }

        // Mark peer as reachable (already in friends or pending, otherwise would be quarantined)
        console.log(`✅ Peer ${remotePeerId.substring(0, 20)}... is reachable`);
    }

    // P2P Protocol Methods
    async sendRequestFriend(invitationString: string): Promise<void> {
        // Decode base64-encoded invitation JSON
        let invitation: IInvitation;
        try {
            const decodedJson = atob(invitationString);
            invitation = JSON.parse(decodedJson) as IInvitation;
        } catch (error) {
            throw new Error('Invalid invitation format. Expected base64-encoded JSON with {inviteCode, peerId, addresses}');
        }

        // Validate invitation structure
        if (!invitation.inviteCode || !invitation.peerId) {
            throw new Error('Invalid invitation: missing inviteCode or peerId');
        }

        const targetPeerId = invitation.peerId;

        // Add to pendingFriendRequests before sending
        this.pendingFriendRequests[targetPeerId] = invitation;
        this.persistPendingRequests();

        const friendRequest: IRequestFriendMessage = {
            method: 'requestFriend',
            inviteCode: invitation.inviteCode
        };

        // If invitation has addresses, try direct connection first
        if ((invitation.addresses.external || invitation.addresses.internal) &&
            this.networkProvider.sendMessageWithAddresses) {
            console.log('📍 Invitation contains addresses, attempting direct connection');

            // Detect our external IP to determine routing strategy
            let ourExternalIp: string | undefined;
            try {
                const { external } = await IPAddressDetector.detectIPAddresses();
                ourExternalIp = external[0]; // Use first external IP
            } catch (error) {
                console.warn('⚠️ Failed to detect our external IP:', error);
            }

            await this.networkProvider.sendMessageWithAddresses(
                targetPeerId,
                invitation.addresses,
                friendRequest,
                ourExternalIp
            );
        } else {
            // No addresses in invitation, use normal DHT/relay discovery
            console.log('📍 No addresses in invitation, using DHT/relay discovery');
            await this.networkProvider.sendMessage(targetPeerId, friendRequest);
        }

        console.log(`📤 Friend request sent to ${targetPeerId} with invite code ${invitation.inviteCode}`);
    }

    async approveFriendRequest(remotePeerId: string, friendName: string, inviteCode: string, approved: boolean): Promise<void> {
        const response: IApproveFriendRequestMessage = {
            method: 'approveFriendRequest',
            peerId: this.getPeerId(),
            nickname: this.nickname || 'Anonymous',
            approved: approved
        };

        await this.networkProvider.sendMessage(remotePeerId, response);

        if (approved) {
            // Add the friend to the local friend list
            const friend: IFriend = {
                playerName: friendName,
                peerId: remotePeerId,
                notes: ''
            };
            this.friendsManager.addFriend(friend);
            console.log(`✅ Added ${friendName} as friend`);

            // Remove from quarantine if present
            if (this.quarantined.has(remotePeerId)) {
                this.quarantined.delete(remotePeerId);
                console.log(`✅ Removed ${remotePeerId} from quarantine`);
            }

            // Remove the invitation since it's been used
            delete this.activeInvitations[inviteCode];
            this.persistInvitations();
        }

        console.log(`📤 Friend request ${approved ? 'approved' : 'declined'} for ${remotePeerId}`);
    }

    getPendingFriendRequests(): Record<string, IInvitation> {
        return { ...this.pendingFriendRequests };
    }

    /**
     * Send a message to a peer (for testing purposes)
     * @param peerId The peer ID to send to
     * @param message The message to send
     */
    async sendMessage(peerId: string, message: P2PMessage): Promise<void> {
        return this.networkProvider.sendMessage(peerId, message);
    }

    /**
     * Send a ping message to a peer with a response handler
     * @param peerId The peer ID to ping
     * @param handler Zero-arg function to execute when pong response arrives
     */
    async sendPing(peerId: string, handler: () => void): Promise<void> {
        const messageId = this.generateMessageId();
        
        const pingMessage: IPingMessage = {
            method: 'ping',
            timestamp: Date.now(),
            messageId: messageId
        };

        // Register handler for response
        this.pendingResponses.set(messageId, handler);
        console.log(`📤 Sending ping to ${peerId.substring(0, 20)}... (messageId: ${messageId})`);

        try {
            await this.networkProvider.sendMessage(peerId, pingMessage);
        } catch (error) {
            // Remove handler if send failed
            this.pendingResponses.delete(messageId);
            throw error;
        }
    }
}
