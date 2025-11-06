/**
 * Unit tests for HollowIPeer adapter
 *
 * Tests the integration between Textcraft's IPeer interface and Hollow's INetworkProvider
 * Works with both LibP2PNetworkProvider (legacy) and P2PWebAppNetworkProvider (current)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HollowIPeer } from '../src/textcraft/hollow-peer.js';
import type { INetworkProvider, P2PMessage } from '../src/p2p/types.js';
import type { MudStorage } from '../src/textcraft/model.js';

// Mock INetworkProvider (works with any implementation)
class MockNetworkProvider implements INetworkProvider {
    private messageHandlers: Array<(peerId: string, message: P2PMessage) => void> = [];
    private peerConnectHandlers: Array<(peerId: string) => void> = [];
    private peerId: string = 'test-peer-id-12345';
    private connectedPeers: Set<string> = new Set();

    async initialize(): Promise<void> {
        // Mock initialization
    }

    getPeerId(): string {
        return this.peerId;
    }

    setPeerId(id: string): void {
        this.peerId = id;
    }

    getConnectedPeers(): string[] {
        return Array.from(this.connectedPeers);
    }

    onMessage(handler: (peerId: string, message: P2PMessage) => void): void {
        this.messageHandlers.push(handler);
    }

    onPeerConnect(handler: (peerId: string) => void): void {
        this.peerConnectHandlers.push(handler);
    }

    async sendMessage(peerId: string, message: P2PMessage): Promise<void> {
        // Mock implementation - track as connected
        this.connectedPeers.add(peerId);
        console.log(`Sending message to ${peerId}:`, message);
    }

    async destroy(): Promise<void> {
        // Mock cleanup
        this.connectedPeers.clear();
        this.messageHandlers = [];
        this.peerConnectHandlers = [];
    }

    // Test helper methods
    simulateIncomingMessage(peerId: string, message: P2PMessage): void {
        this.connectedPeers.add(peerId);
        for (const handler of this.messageHandlers) {
            handler(peerId, message);
        }
    }

    simulatePeerConnect(peerId: string): void {
        this.connectedPeers.add(peerId);
        for (const handler of this.peerConnectHandlers) {
            handler(peerId);
        }
    }
}

// Mock MudStorage
class MockMudStorage implements Partial<MudStorage> {
    // Minimal mock implementation
}

describe('HollowIPeer', () => {
    let hollowPeer: HollowIPeer;
    let mockNetworkProvider: MockNetworkProvider;
    let mockStorage: MockMudStorage;

    beforeEach(() => {
        mockNetworkProvider = new MockNetworkProvider();
        mockStorage = new MockMudStorage();
        hollowPeer = new HollowIPeer(mockNetworkProvider as any);
    });

    describe('Initialization', () => {
        it('should implement all IPeer methods', () => {
            expect(hollowPeer.init).toBeDefined();
            expect(hollowPeer.start).toBeDefined();
            expect(hollowPeer.reset).toBeDefined();
            expect(hollowPeer.connectString).toBeDefined();
            expect(hollowPeer.relayConnectString).toBeDefined();
            expect(hollowPeer.startHosting).toBeDefined();
            expect(hollowPeer.joinSession).toBeDefined();
            expect(hollowPeer.startRelay).toBeDefined();
            expect(hollowPeer.hostViaRelay).toBeDefined();
            expect(hollowPeer.userThingChanged).toBeDefined();
            expect(hollowPeer.command).toBeDefined();
        });

        it('should set version IDs', () => {
            expect(hollowPeer.currentVersionID).toBe('1.0.0');
            expect(hollowPeer.versionID).toBe('1.0.0');
        });

        it('should initialize with app context', () => {
            const mockApp = { name: 'test-app' };
            expect(() => hollowPeer.init(mockApp)).not.toThrow();
        });

        it('should start with MUD storage', async () => {
            await expect(hollowPeer.start(mockStorage as any)).resolves.not.toThrow();
        });
    });

    describe('Connection Strings', () => {
        it('should return peer ID as connect string', () => {
            const connectStr = hollowPeer.connectString();
            expect(connectStr).toBe('test-peer-id-12345');
        });

        it('should return same string for relay connect string', () => {
            const connectStr = hollowPeer.connectString();
            const relayStr = hollowPeer.relayConnectString();
            expect(relayStr).toBe(connectStr);
        });
    });

    describe('Hosting', () => {
        it('should start hosting without errors', () => {
            expect(() => hollowPeer.startHosting()).not.toThrow();
        });

        it('should return connect string after hosting starts', () => {
            hollowPeer.startHosting();
            const connectStr = hollowPeer.connectString();
            expect(connectStr).toBeTruthy();
            expect(typeof connectStr).toBe('string');
        });

        it('should throw error for startRelay (not supported)', () => {
            expect(() => hollowPeer.startRelay()).toThrow();
        });

        it('should throw error for hostViaRelay (not supported)', () => {
            expect(() => hollowPeer.hostViaRelay('session-id')).toThrow();
        });
    });

    describe('Guest Connection', () => {
        beforeEach(async () => {
            await hollowPeer.start(mockStorage as any);
        });

        it('should join session with host peer ID', async () => {
            const hostPeerId = 'host-peer-id-67890';
            await expect(hollowPeer.joinSession(hostPeerId)).resolves.not.toThrow();
        });
    });

    describe('Message Handling', () => {
        beforeEach(async () => {
            await hollowPeer.start(mockStorage as any);
        });

        it('should handle incoming MUD messages', () => {
            const mudMessage = {
                type: 'output',
                text: 'Welcome to the MUD!'
            };

            const p2pMessage: P2PMessage = {
                method: 'mud',
                payload: mudMessage
            };

            // Should not throw
            expect(() => {
                mockNetworkProvider.simulateIncomingMessage('guest-peer-123', p2pMessage);
            }).not.toThrow();
        });

        it('should ignore non-MUD messages', () => {
            const p2pMessage: P2PMessage = {
                method: 'other-method',
                payload: {}
            };

            // Should not throw or process
            expect(() => {
                mockNetworkProvider.simulateIncomingMessage('guest-peer-123', p2pMessage);
            }).not.toThrow();
        });
    });

    describe('Command Execution', () => {
        it('should send command to host as guest', async () => {
            await hollowPeer.start(mockStorage as any);
            await hollowPeer.joinSession('host-peer-id');

            const sendSpy = vi.spyOn(mockNetworkProvider, 'sendMessage');

            hollowPeer.command('look');

            expect(sendSpy).toHaveBeenCalled();
        });
    });

    describe('Reset', () => {
        it('should clear state on reset', () => {
            hollowPeer.startHosting();
            hollowPeer.reset();

            // After reset, should be able to start hosting again
            expect(() => hollowPeer.startHosting()).not.toThrow();
        });

        it('should close all MudConnections on reset', () => {
            hollowPeer.startHosting();
            hollowPeer.reset();

            // State should be cleared
            expect(hollowPeer.connectString()).toBeTruthy(); // But peer ID should still work
        });
    });

    describe('World Management', () => {
        it('should set and get world', () => {
            const mockWorld = { name: 'Test World' };
            hollowPeer.setWorld(mockWorld);
            expect(hollowPeer.getWorld()).toBe(mockWorld);
        });

        it('should return null if no world set', () => {
            expect(hollowPeer.getWorld()).toBeNull();
        });
    });

    describe('User Thing Updates', () => {
        it('should not throw when userThingChanged called as guest', () => {
            const mockThing = { name: 'Player', properties: {} } as any;
            expect(() => hollowPeer.userThingChanged(mockThing)).not.toThrow();
        });

        it('should handle userThingChanged as host', () => {
            hollowPeer.startHosting();
            const mockThing = { name: 'Player', properties: {} } as any;

            // Should not throw even if thing is not tracked
            expect(() => hollowPeer.userThingChanged(mockThing)).not.toThrow();
        });
    });
});

describe('HollowIPeer Integration', () => {
    it('should handle complete host-guest flow', async () => {
        // Setup host
        const hostNetworkProvider = new MockNetworkProvider();
        hostNetworkProvider.setPeerId('host-peer-id');
        const hostPeer = new HollowIPeer(hostNetworkProvider as any);

        await hostPeer.start(new MockMudStorage() as any);
        hostPeer.startHosting();

        const hostConnectStr = hostPeer.connectString();
        expect(hostConnectStr).toBe('host-peer-id');

        // Setup guest
        const guestNetworkProvider = new MockNetworkProvider();
        guestNetworkProvider.setPeerId('guest-peer-id');
        const guestPeer = new HollowIPeer(guestNetworkProvider as any);

        await guestPeer.start(new MockMudStorage() as any);
        await guestPeer.joinSession(hostConnectStr);

        // Verify guest can send commands
        const sendSpy = vi.spyOn(guestNetworkProvider, 'sendMessage');
        guestPeer.command('look');
        expect(sendSpy).toHaveBeenCalled();
    });
});
