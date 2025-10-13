/**
 * Direct Message Service - Custom libp2p service for peer-to-peer messaging
 * Following universal-connectivity's DirectMessage service pattern
 */

import { TypedEventEmitter, type PeerId, type Stream, type Connection, type Startable } from '@libp2p/interface';
import { serviceCapabilities, serviceDependencies } from '@libp2p/interface';
import type { ConnectionManager, Registrar } from '@libp2p/interface-internal';
import { pipe } from 'it-pipe';
import * as lp from 'it-length-prefixed';
import {
    DIRECT_MESSAGE_PROTOCOL,
    CLIENT_VERSION,
    CONNECTION_TIMEOUT,
    STREAM_TIMEOUT
} from './constants';
import type {
    P2PMessage,
    IDirectMessageEvent,
    IDirectMessageEvents,
    IMessageRequest,
    IMessageResponse
} from './types';

const ERRORS = {
    EMPTY_MESSAGE: 'Message cannot be empty',
    NO_CONNECTION: 'Failed to create connection',
    NO_STREAM: 'Failed to create stream',
    NO_RESPONSE: 'No response received',
    STATUS_NOT_OK: (status: string) => `Received status: ${status}, expected OK`,
};

export interface DirectMessageComponents {
    registrar: Registrar;
    connectionManager: ConnectionManager;
}

export class DirectMessageService extends TypedEventEmitter<IDirectMessageEvents> implements Startable {
    readonly [serviceDependencies]: string[] = [
        '@libp2p/identify',
        '@libp2p/connection-encryption',
        '@libp2p/transport',
        '@libp2p/stream-multiplexing',
    ];

    readonly [serviceCapabilities]: string[] = ['@hollow-world/direct-message'];

    private topologyId?: string;
    private readonly components: DirectMessageComponents;
    private dmPeers: Set<string> = new Set();

    constructor(components: DirectMessageComponents) {
        super();
        this.components = components;
    }

    async start(): Promise<void> {
        this.topologyId = await this.components.registrar.register(DIRECT_MESSAGE_PROTOCOL, {
            onConnect: this.handleConnect.bind(this),
            onDisconnect: this.handleDisconnect.bind(this),
        });
    }

    async afterStart(): Promise<void> {
        await this.components.registrar.handle(DIRECT_MESSAGE_PROTOCOL, async (data: any) => {
            await this.receive(data.stream, data.connection);
        });
    }

    stop(): void {
        if (this.topologyId != null) {
            this.components.registrar.unregister(this.topologyId);
        }
    }

    private handleConnect(peerId: PeerId): void {
        this.dmPeers.add(peerId.toString());
    }

    private handleDisconnect(peerId: PeerId): void {
        this.dmPeers.delete(peerId.toString());
    }

    isDMPeer(peerId: PeerId): boolean {
        return this.dmPeers.has(peerId.toString());
    }

    async send(peerId: PeerId, message: P2PMessage): Promise<boolean> {
        if (!message) {
            throw new Error(ERRORS.EMPTY_MESSAGE);
        }

        let stream: Stream | undefined;

        try {
            // Open or reuse connection to target peer
            const connection = await this.components.connectionManager.openConnection(
                peerId,
                { signal: AbortSignal.timeout(CONNECTION_TIMEOUT) }
            );

            if (!connection) {
                throw new Error(ERRORS.NO_CONNECTION);
            }

            // Create new stream for this message (single protocol, skip full negotiation)
            stream = await connection.newStream(DIRECT_MESSAGE_PROTOCOL, {
                negotiateFully: false,
            });

            if (!stream) {
                throw new Error(ERRORS.NO_STREAM);
            }

            // Create request with metadata
            const request: IMessageRequest = {
                message,
                metadata: {
                    clientVersion: CLIENT_VERSION,
                    timestamp: Date.now(),
                },
            };

            const signal = AbortSignal.timeout(STREAM_TIMEOUT);

            // Send message with length prefix
            const requestJson = JSON.stringify(request);
            const requestBytes = new TextEncoder().encode(requestJson);

            // Write request and read response using pipe
            const responseChunks: Uint8Array[] = [];

            await pipe(
                [requestBytes],
                (source) => lp.encode(source),
                (stream as any),
                (source: any) => lp.decode(source),
                async (source: any) => {
                    for await (const chunk of source) {
                        responseChunks.push(chunk.subarray());
                        break; // Only need first message
                    }
                }
            );

            if (responseChunks.length === 0) {
                throw new Error(ERRORS.NO_RESPONSE);
            }

            const responseText = new TextDecoder().decode(responseChunks[0]);
            const response: IMessageResponse = JSON.parse(responseText);

            if (response.status !== 'OK') {
                throw new Error(ERRORS.STATUS_NOT_OK(response.status));
            }

            return true;
        } catch (e: any) {
            stream?.abort(e);
            throw e;
        } finally {
            try {
                await stream?.close({
                    signal: AbortSignal.timeout(STREAM_TIMEOUT),
                });
            } catch (err: any) {
                stream?.abort(err);
                throw err;
            }
        }
    }

    async receive(stream: Stream, connection: Connection): Promise<void> {
        try {
            const signal = AbortSignal.timeout(STREAM_TIMEOUT);

            // Read incoming message and send response using pipe
            const requestChunks: Uint8Array[] = [];

            await pipe(
                (stream as any),
                (source: any) => lp.decode(source),
                async function* (source: any) {
                    for await (const chunk of source) {
                        requestChunks.push(chunk.subarray());
                    }

                    // Send acknowledgment response
                    const response: IMessageResponse = {
                        status: 'OK',
                        metadata: {
                            clientVersion: CLIENT_VERSION,
                            timestamp: Date.now(),
                        },
                    };

                    const responseJson = JSON.stringify(response);
                    const responseBytes = new TextEncoder().encode(responseJson);
                    yield responseBytes;
                },
                (source: any) => lp.encode(source),
                (stream as any)
            );

            if (requestChunks.length === 0) {
                return;
            }

            const requestText = new TextDecoder().decode(requestChunks[0]);
            const request: IMessageRequest = JSON.parse(requestText);

            // Dispatch event for received message
            const detail: IDirectMessageEvent = {
                message: request.message,
                peerId: connection.remotePeer.toString(),
                stream: stream,
                connection: connection,
            };

            this.dispatchEvent(new CustomEvent('message', { detail }));
        } catch (e: any) {
            stream?.abort(e);
            throw e;
        } finally {
            try {
                await stream?.close({
                    signal: AbortSignal.timeout(STREAM_TIMEOUT),
                });
            } catch (err: any) {
                stream?.abort(err);
                throw err;
            }
        }
    }
}

export function directMessage() {
    return (components: DirectMessageComponents) => {
        return new DirectMessageService(components);
    };
}
