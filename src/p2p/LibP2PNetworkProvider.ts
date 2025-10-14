/**
 * LibP2P Network Provider - Network implementation following universal-connectivity
 */

import { createLibp2p, type Libp2p } from 'libp2p';
import { noise } from '@chainsafe/libp2p-noise';
import { yamux } from '@chainsafe/libp2p-yamux';
import { identify } from '@libp2p/identify';
import { webSockets } from '@libp2p/websockets';
import { webTransport } from '@libp2p/webtransport';
import { webRTC, webRTCDirect } from '@libp2p/webrtc';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
import { ping } from '@libp2p/ping';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import type { PeerId, Message, SignedMessage } from '@libp2p/interface';
import type { Multiaddr } from '@multiformats/multiaddr';
import { sha256 } from 'multiformats/hashes/sha2';
import { peerIdFromString } from '@libp2p/peer-id';
import { createDelegatedRoutingV1HttpApiClient, type DelegatedRoutingV1HttpApiClient } from '@helia/delegated-routing-v1-http-api-client';
import first from 'it-first';
import { DirectMessageService, directMessage } from './DirectMessageService';
import {
    BOOTSTRAP_PEER_IDS,
    PUBSUB_PEER_DISCOVERY_TOPIC,
    PEER_DISCOVERY_INTERVAL,
    STORAGE_KEY_PRIVATE_KEY,
    DELEGATED_ROUTING_ENDPOINT
} from './constants';
import type { INetworkProvider, IStorageProvider, P2PMessage, IDirectMessageEvent } from './types';

// Message ID function for gossipsub (from ucp2p) - prevents duplicate messages
async function msgIdFnStrictNoSign(msg: Message): Promise<Uint8Array> {
    const enc = new TextEncoder();
    const signedMessage = msg as SignedMessage;
    const encodedSeqNum = enc.encode(signedMessage.sequenceNumber.toString());
    return await sha256.encode(encodedSeqNum);
}

// Function which resolves PeerIDs of bootstrap nodes to multiaddrs dialable from the browser
// Returns relay listen addresses that can be used in the libp2p listen array
async function getRelayListenAddrs(client: DelegatedRoutingV1HttpApiClient): Promise<string[]> {
    // IMPORTANT: Only use the first bootstrap peer (ucp2p) to avoid initialization hangs
    // Using too many relay addresses (100+) causes createLibp2p() to hang
    const ucp2pPeerId = BOOTSTRAP_PEER_IDS[0]; // The ucp2p bootstrap peer
    const peer = await first(client.getPeers(peerIdFromString(ucp2pPeerId)));

    const relayListenAddrs: string[] = [];
    if (peer && peer.Addrs.length > 0) {
        for (const maddr of peer.Addrs) {
            const protos = maddr.protoNames();
            // Note: narrowing to Secure WebSockets and avoiding ipv6 issues
            if (protos.includes('tls') && protos.includes('ws')) {
                if (maddr.nodeAddress().address === '127.0.0.1') continue; // skip loopback
                relayListenAddrs.push(`${maddr.toString()}/p2p/${peer.ID.toString()}/p2p-circuit`);
            }
        }
    }
    return relayListenAddrs;
}

// Function which dials one maddr at a time to avoid establishing multiple connections to the same peer
async function dialWebRTCMaddrs(libp2p: Libp2p, multiaddrs: Multiaddr[]): Promise<void> {
    console.log('🔗 Peer discovered with', multiaddrs.length, 'addresses');

    // Filter for circuit relay addresses (p2p-circuit protocol)
    // These are the addresses we can actually dial from the browser
    const circuitAddrs = multiaddrs.filter(ma => {
        const protos = ma.protoNames();
        return protos.includes('p2p-circuit');
    });

    console.log(`🔗 Found ${circuitAddrs.length} circuit relay addresses to dial`);

    if (circuitAddrs.length === 0) {
        console.log('⚠️  No circuit relay addresses found - cannot dial peer');
        return;
    }

    // Try to dial the first circuit relay address
    // Only dial one at a time to avoid multiple connections to the same peer
    try {
        const addr = circuitAddrs[0];
        console.log(`📞 Dialing circuit relay address: ${addr.toString()}`);
        await libp2p.dial(addr);
        console.log(`✅ Successfully dialed peer via circuit relay`);
    } catch (error: any) {
        console.error(`❌ Failed to dial circuit relay address:`, error.message);
    }
}

export class LibP2PNetworkProvider implements INetworkProvider {
    private libp2p: Libp2p | null = null;
    private peerId: string = '';
    private storageProvider: IStorageProvider;
    private messageHandlers: Array<(peerId: string, message: P2PMessage) => void> = [];
    private peerConnectHandlers: Array<(peerId: string) => void> = [];
    private dmService: DirectMessageService | null = null;

    constructor(storageProvider: IStorageProvider) {
        this.storageProvider = storageProvider;
    }

    async initialize(): Promise<void> {
        try {
            console.log('🔗 Starting peer ID initialization...');

            // Load or create peer ID
            let peerId: PeerId;
            let privateKey: any;
            const storedPrivateKey = await this.storageProvider.load<any>(STORAGE_KEY_PRIVATE_KEY);

            if (storedPrivateKey) {
                console.log('🔑 Found stored private key, restoring peer ID...');
                const privateKeyBytes = new Uint8Array(storedPrivateKey.rawBytes || storedPrivateKey.privateKey);
                const { privateKeyFromProtobuf } = await import('@libp2p/crypto/keys');
                privateKey = await privateKeyFromProtobuf(privateKeyBytes);

                const { peerIdFromPrivateKey } = await import('@libp2p/peer-id');
                peerId = await peerIdFromPrivateKey(privateKey);
                console.log('🔑 Successfully restored peer ID:', peerId.toString());
            } else {
                console.log('🔑 Creating new peer ID...');
                const newPeerId = await createEd25519PeerId();
                peerId = newPeerId as any; // Type mismatch between peer-id-factory and interface versions
                const rawPrivateKey = (newPeerId as any).privateKey;
                console.log('🔑 New peer ID created:', peerId.toString());

                if (rawPrivateKey) {
                    const { privateKeyFromProtobuf } = await import('@libp2p/crypto/keys');
                    privateKey = await privateKeyFromProtobuf(rawPrivateKey);

                    const privateKeyData = {
                        rawBytes: Array.from(rawPrivateKey)
                    };
                    await this.storageProvider.save(STORAGE_KEY_PRIVATE_KEY, privateKeyData);
                    console.log('🔑 Private key saved to storage');
                }
            }

            this.peerId = peerId.toString();

            if (!privateKey) {
                throw new Error('Failed to obtain private key for libp2p initialization');
            }

            // Create delegated routing client (following ucp2p pattern)
            console.log('🌐 Creating delegated routing client...');
            const delegatedClient = createDelegatedRoutingV1HttpApiClient(DELEGATED_ROUTING_ENDPOINT);

            // Get relay listen addresses from bootstrap peers via delegated routing (following ucp2p pattern)
            console.log('🌐 Fetching relay listen addresses from bootstrap peers...');
            const relayListenAddrs = await getRelayListenAddrs(delegatedClient);
            console.log('🔗 Relay listen addresses:', relayListenAddrs);

            // Create libp2p node (following ucp2p pattern exactly)
            console.log('🌐 Initializing libp2p...');

            this.libp2p = await createLibp2p({
                privateKey: privateKey,
                addresses: {
                    listen: [
                        '/webrtc',           // Listen for WebRTC connections
                        ...relayListenAddrs  // Listen via discovered circuit relays
                    ]
                },
                transports: [
                    webTransport(),        // QUIC-based browser transport
                    webSockets(),          // For connecting to relays (wss://)
                    webRTC(),              // Browser-to-browser direct P2P
                    webRTCDirect(),        // For peers supporting WebRTC-direct (e.g. Rust peers)
                    circuitRelayTransport() // Required to create relay reservations for hole punching
                ],
                connectionEncrypters: [noise()],
                streamMuxers: [yamux()],
                connectionGater: {
                    denyDialMultiaddr: async () => false,
                    // Allow local network connections (localhost, private IPs)
                    denyInboundConnection: async () => false,
                    denyOutboundConnection: async () => false,
                    denyInboundEncryptedConnection: async () => false,
                    denyOutboundEncryptedConnection: async () => false,
                    denyInboundUpgradedConnection: async () => false,
                    denyOutboundUpgradedConnection: async () => false,
                },
                peerDiscovery: [
                    pubsubPeerDiscovery({
                        interval: PEER_DISCOVERY_INTERVAL,
                        topics: [PUBSUB_PEER_DISCOVERY_TOPIC],
                        listenOnly: false,
                    })
                ],
                services: {
                    pubsub: gossipsub({
                        allowPublishToZeroTopicPeers: true,
                        msgIdFn: msgIdFnStrictNoSign,
                        ignoreDuplicatePublishError: true,
                    }) as any,
                    // Delegated routing helps discover ephemeral multiaddrs of bootstrap peers
                    delegatedRouting: () => delegatedClient,
                    identify: identify(),
                    directMessage: directMessage(),
                    ping: ping()
                }
            });

            console.log('🌐 LibP2P node created successfully');

            // DEBUG: Check pubsub subscription status
            const pubsub = (this.libp2p.services.pubsub as any);
            console.log('🔍 DEBUG: Checking pubsub topic subscriptions...');
            console.log('🔍 DEBUG: Pubsub topics:', pubsub?.getTopics?.());
            console.log('🔍 DEBUG: Discovery topic subscribers:', pubsub?.getSubscribers?.(PUBSUB_PEER_DISCOVERY_TOPIC));

            // Get the direct message service
            this.dmService = this.libp2p.services.directMessage as DirectMessageService;

            // Listen for direct messages
            this.dmService.addEventListener('message', (event: CustomEvent<IDirectMessageEvent>) => {
                const { message, peerId } = event.detail;
                this.handleIncomingMessage(peerId, message);
            });

            // Listen for peer connections
            this.libp2p.addEventListener('peer:connect', (evt) => {
                const remotePeerId = evt.detail.toString();
                for (const handler of this.peerConnectHandlers) {
                    try {
                        handler(remotePeerId);
                    } catch (error) {
                        console.error('❌ Error in peer connect handler:', error);
                    }
                }
            });

            // CRITICAL: Subscribe to pubsub peer discovery topic
            // This is REQUIRED for peers to receive gossipsub messages
            // The pubsubPeerDiscovery module publishes but does NOT subscribe
            console.log('🔍 Subscribing to pubsub peer discovery topic:', PUBSUB_PEER_DISCOVERY_TOPIC);
            pubsub.subscribe(PUBSUB_PEER_DISCOVERY_TOPIC);
            console.log('✅ Subscribed to peer discovery topic');

            // DEBUG: Listen for pubsub messages to see what's being received
            console.log('🔍 DEBUG: Adding pubsub message listener for debugging...');
            pubsub?.addEventListener?.('message', async (evt: any) => {
                const msg = evt.detail;
                const senderPeerId = msg.from?.toString();

                // Try to get sender's multiaddrs from peerStore
                let senderAddrs: string[] = [];
                if (senderPeerId && this.libp2p) {
                    try {
                        const peer = await this.libp2p.peerStore.get(msg.from);
                        senderAddrs = peer.addresses.map(addr => addr.multiaddr.toString());
                    } catch (e) {
                        // Peer not in peerStore yet
                    }
                }

                console.log('🔍 DEBUG: Received pubsub message:', {
                    topic: msg.topic,
                    from: senderPeerId,
                    senderAddrs: senderAddrs.length > 0 ? senderAddrs : 'not in peerStore',
                    dataLength: msg.data?.length
                }, msg);
            });

            // CRITICAL: Manually publish our multiaddrs to the peer discovery topic
            // The pubsubPeerDiscovery module should do this, but it seems to not be working reliably
            console.log('📢 Publishing our multiaddrs to peer discovery topic...');
            const publishOurAddrs = async () => {
                try {
                    const multiaddrs = this.libp2p!.getMultiaddrs();
                    if (multiaddrs.length > 0) {
                        // Encode multiaddrs as the peer discovery protocol expects
                        const addrsBytes = multiaddrs.map(ma => ma.bytes);
                        const encoder = new TextEncoder();
                        // Create a simple JSON payload with our multiaddrs
                        const payload = {
                            multiaddrs: multiaddrs.map(ma => ma.toString())
                        };
                        const payloadBytes = encoder.encode(JSON.stringify(payload));

                        await pubsub.publish(PUBSUB_PEER_DISCOVERY_TOPIC, payloadBytes);
                        console.log('📢 Published', multiaddrs.length, 'multiaddrs to discovery topic');
                    } else {
                        console.log('⚠️  No multiaddrs to publish yet');
                    }
                } catch (error) {
                    console.error('❌ Failed to publish multiaddrs:', error);
                }
            };

            // Publish immediately and then every 10 seconds
            await publishOurAddrs();
            setInterval(publishOurAddrs, 10000);

            // Dial discovered peers (following ucp2p pattern - dial WebRTC multiaddrs one at a time)
            this.libp2p.addEventListener('peer:discovery', async (event: any) => {
                const { id, multiaddrs } = event.detail;
                console.log('🔍 DEBUG: peer:discovery event fired for:', id.toString());
                console.log('🔍 DEBUG: Discovered multiaddrs:', multiaddrs.map((m: Multiaddr) => m.toString()));

                // CRITICAL: Add peer addresses to peerStore so they can be used for future connections
                // This is necessary because if dial attempts fail, the addresses would otherwise be lost
                try {
                    await this.libp2p!.peerStore.merge(id, {
                        multiaddrs: multiaddrs
                    });
                    console.log('✅ Added peer addresses to peerStore for:', id.toString());
                } catch (error) {
                    console.error('❌ Failed to add peer to peerStore:', error);
                }

                if (this.libp2p!.getConnections(id)?.length > 0) {
                    console.log(`🔗 Already connected to peer ${id}. Will not try dialling`);
                    return; // Already connected
                }

                // Dial WebRTC multiaddrs one at a time to avoid multiple connections to same peer
                dialWebRTCMaddrs(this.libp2p!, multiaddrs);
            });

            // DEBUG: Periodically log subscriber count
            setInterval(() => {
                const subscribers = pubsub?.getSubscribers?.(PUBSUB_PEER_DISCOVERY_TOPIC) || [];
                console.log('🔍 DEBUG: Subscriber count:', subscribers.length, 'Subscribers:', subscribers.map((p: any) => p.toString()));
            }, 15000); // Every 15 seconds

            console.log('🔗 P2P network initialized with peer ID:', this.peerId);
        } catch (error: any) {
            console.error('🚨 P2P initialization failed:', error);
            throw error;
        }
    }

    private handleIncomingMessage(remotePeerId: string, message: P2PMessage): void {
        console.log(`📨 Received message from ${remotePeerId}:`, message);

        // Validate message has required method field
        if (!message.method) {
            console.warn('⚠️  Received invalid message without method field');
            return;
        }

        // Notify all handlers
        for (const handler of this.messageHandlers) {
            try {
                handler(remotePeerId, message);
            } catch (error) {
                console.error('❌ Error in message handler:', error);
            }
        }
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

    async sendMessage(peerIdStr: string, message: P2PMessage): Promise<void> {
        if (!this.libp2p || !this.dmService) {
            throw new Error('LibP2P not initialized');
        }

        try {
            const { peerIdFromString } = await import('@libp2p/peer-id');
            const targetPeerId = peerIdFromString(peerIdStr);

            // Log receiver's multiaddresses before sending (especially for ping/pong)
            if (message.method === 'ping' || message.method === 'pong') {
                try {
                    const peer = await this.libp2p.peerStore.get(targetPeerId);
                    const multiaddrs = peer.addresses.map(addr => addr.multiaddr.toString());
                    console.log(`📍 Sending ${message.method} to ${peerIdStr.substring(0, 20)}... with multiaddrs:`, multiaddrs);
                } catch (e) {
                    console.log(`📍 Sending ${message.method} to ${peerIdStr.substring(0, 20)}... (no stored multiaddrs)`);
                }
            }

            await this.dmService.send(targetPeerId, message);
            console.log(`✅ Message sent to ${peerIdStr}`);
        } catch (error: any) {
            console.error(`❌ Failed to send message to ${peerIdStr}:`, error);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    onMessage(handler: (peerId: string, message: P2PMessage) => void): void {
        this.messageHandlers.push(handler);
    }

    onPeerConnect(handler: (peerId: string) => void): void {
        this.peerConnectHandlers.push(handler);
    }

    async destroy(): Promise<void> {
        if (this.libp2p) {
            await this.libp2p.stop();
        }
    }

    getLibP2P(): Libp2p | null {
        return this.libp2p;
    }
}
