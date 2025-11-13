/**
 * HollowPeer - Main P2P coordinator for Hollow World
 * High-level API: message routing, friend requests, presence tracking, stubborn delivery
 *
 * CRC: crc-HollowPeer.md
 * Spec: p2p.md, friends.md, p2p-messages.md
 * Sequences: seq-establish-p2p-connection.md, seq-send-receive-p2p-message.md,
 *            seq-friend-presence-update.md, seq-friend-status-change.md,
 *            seq-add-friend-by-peerid.md
 */

import { EventService } from '../services/EventService.js';
import { P2PWebAppNetworkProvider } from './P2PWebAppNetworkProvider.js';
import { FriendsManager } from './FriendsManager.js';
import { LocalStorageProvider } from './LocalStorageProvider.js';
import {
    STORAGE_KEY_NICKNAME,
    STORAGE_KEY_PENDING_NEW_FRIEND_REQUESTS,
    STORAGE_KEY_DECLINED_FRIEND_REQUESTS,
    STORAGE_KEY_IGNORED_PEERS,
    STORAGE_KEY_RESENDABLE_MESSAGES,
    PEER_DISCOVERY_TIMEOUT,
    RESENDABLE_MESSAGE_RETRY_INTERVAL,
    RESENDABLE_MESSAGE_MAX_RETRIES
} from './constants.js';
import type {
    INetworkProvider,
    IFriendsManager,
    IStorageProvider,
    IFriend,
    P2PMessage,
    IPingMessage,
    IPongMessage,
    IRequestFriendMessage,
    IIgnoredPeer
} from './types.js';

/**
 * HollowPeer class - P2P orchestrator with stubborn delivery and presence tracking
 * CRC: crc-HollowPeer.md
 */
export class HollowPeer {
    private networkProvider: INetworkProvider;
    private friendsManager: IFriendsManager;
    private storageProvider: IStorageProvider;
    private eventService: EventService;
    private nickname: string = '';
    private quarantined: Set<string> = new Set();

    // Callback for refreshing friends view
    private refreshFriendsViewCallback?: () => Promise<void>;

    // Ephemeral tracking of unsent friend requests (peer IDs only, use FriendsManager for data)
    private unsentFriends: Set<string> = new Set();

    // Peer Discovery-Based Friend Requests
    private pendingNewFriendRequests: Record<string, boolean> = {}; // peer ID -> true
    private declinedFriendRequests: Record<string, boolean> = {}; // peer ID -> true

    // Request-Response Infrastructure
    private messagePrefix: string;
    private messageCount: number = 0;
    private pendingResponses: Map<string, () => void> = new Map();

    // Resendable Messages Infrastructure
    private resendableMessages: Map<string, IResendableMessageStorage> = new Map();
    private resendTimer: ReturnType<typeof setInterval> | null = null;
    private receivedMessageIds: Set<string> = new Set(); // For deduplication
    private ignoredPeers: Record<string, IIgnoredPeer> = {}; // peerId -> IIgnoredPeer

    constructor(
        networkProvider?: INetworkProvider,
        storageProvider: IStorageProvider = new LocalStorageProvider(),
        eventService?: EventService
    ) {
        this.storageProvider = storageProvider;
        this.networkProvider = networkProvider || new P2PWebAppNetworkProvider();
        this.friendsManager = new FriendsManager(storageProvider);
        this.eventService = eventService || new EventService();

        // Generate random message prefix
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

    setRefreshFriendsViewCallback(callback: () => Promise<void>): void {
        this.refreshFriendsViewCallback = callback;
    }

    async initialize(): Promise<void> {
        // Initialize network provider
        console.log('🤝 Calling networkProvider.initialize()...');
        await this.networkProvider.initialize();
        console.log('🤝 networkProvider.initialize() completed');

        // Load friends
        await (this.friendsManager as FriendsManager).loadFriends();

        // Populate unsentFriends set from friends with pending: 'unsent'
        this.populateUnsentFriendsSet();

        // Load nickname
        const storedNickname = await this.storageProvider.load<string>(STORAGE_KEY_NICKNAME);
        if (storedNickname) {
            this.nickname = storedNickname;
        }

        // Load pending new friend requests
        const storedPendingNewFriendRequests = await this.storageProvider.load<Record<string, boolean>>(STORAGE_KEY_PENDING_NEW_FRIEND_REQUESTS);
        if (storedPendingNewFriendRequests) {
            this.pendingNewFriendRequests = storedPendingNewFriendRequests;
        }

        // Load declined friend requests
        const storedDeclinedFriendRequests = await this.storageProvider.load<Record<string, boolean>>(STORAGE_KEY_DECLINED_FRIEND_REQUESTS);
        if (storedDeclinedFriendRequests) {
            this.declinedFriendRequests = storedDeclinedFriendRequests;
        }

        // Load ignored peers
        const storedIgnoredPeers = await this.storageProvider.load<Record<string, IIgnoredPeer>>(STORAGE_KEY_IGNORED_PEERS);
        if (storedIgnoredPeers) {
            this.ignoredPeers = storedIgnoredPeers;
        }

        // Load resendable messages
        await this.loadResendableMessages();

        // Set up message handler
        this.networkProvider.onMessage(this.handleMessage.bind(this));

        // Set up peer connect handler
        this.networkProvider.onPeerConnect(this.handlePeerConnection.bind(this));

        // Set up peer disconnect handler
        this.networkProvider.onPeerDisconnect(this.handlePeerDisconnection.bind(this));

        // Initialize friend presence
        this.initializeFriendPresence();

        // Start resendable message timer
        this.startResendTimer();

        // Log connected peers periodically
        this.logConnectedPeers();
        let logCount = 0;
        const logInterval = setInterval(() => {
            logCount++;
            this.logConnectedPeers();
            if (logCount >= 6) {
                clearInterval(logInterval);
            }
        }, 10000);
    }

    private populateUnsentFriendsSet(): void {
        const allFriends = this.friendsManager.getAllFriends();
        let unsentCount = 0;

        allFriends.forEach((friend, peerId) => {
            if (friend.pending === 'unsent') {
                this.unsentFriends.add(peerId);
                unsentCount++;
            }
        });

        if (unsentCount > 0) {
            console.log(`📤 Rebuilt unsentFriends set with ${unsentCount} peer(s) pending delivery`);
        }
    }

    /**
     * Initialize friend presence based on currently connected peers
     */
    private initializeFriendPresence(): void {
        const connectedPeers = new Set(this.networkProvider.getConnectedPeers());
        const allFriends = this.friendsManager.getAllFriends();
        let onlineCount = 0;

        allFriends.forEach((friend, peerId) => {
            const isOnline = connectedPeers.has(peerId);
            if (friend.presence !== isOnline) {
                const updatedFriend: IFriend = {
                    ...friend,
                    presence: isOnline
                };
                this.friendsManager.updateFriend(peerId, updatedFriend);
                if (isOnline) {
                    onlineCount++;
                }
            }
        });

        console.log(`🟢 Initialized friend presence: ${onlineCount}/${allFriends.size} friends online`);
    }

    /**
     * Update friend presence when peer connects
     */
    private async updateFriendPresence(remotePeerId: string, isOnline: boolean): Promise<void> {
        const friend = this.friendsManager.getFriend(remotePeerId);
        if (friend && friend.presence !== isOnline) {
            const updatedFriend: IFriend = {
                ...friend,
                presence: isOnline
            };
            this.friendsManager.updateFriend(remotePeerId, updatedFriend);

            const status = isOnline ? '🟢 online' : '⚫ offline';
            console.log(`${status} Friend ${remotePeerId.substring(0, 20)}... is now ${isOnline ? 'online' : 'offline'}`);

            // Refresh friends view if callback is set
            if (this.refreshFriendsViewCallback) {
                await this.refreshFriendsViewCallback();
            }
        }
    }

    private async handlePeerConnection(remotePeerId: string): Promise<void> {
        // Update friend presence
        await this.updateFriendPresence(remotePeerId, true);
        const isFriend = this.friendsManager.getFriend(remotePeerId);
        if (!isFriend) {
            this.quarantined.add(remotePeerId);
        }

        // Check if this peer is in unsentFriends set (stubborn friend requests)
        if (this.unsentFriends.has(remotePeerId)) {
            console.log(`📤 Peer ${remotePeerId.substring(0, 20)}... from unsentFriends connected! Retrying friend request...`);
            // Get current friend data from FriendsManager (single source of truth)
            const friend = this.friendsManager.getFriend(remotePeerId);
            if (friend && friend.pending === 'unsent') {
                // Retry sending the friend request
                this.storageProvider.load<any>('hollowWorldSettings').then(settings => {
                    const myPlayerName = settings?.playerName || '';
                    const message: IRequestFriendMessage = {
                        method: 'requestFriend',
                        playerName: myPlayerName
                    };

                    return this.sendMessage(remotePeerId, message);
                }).then(() => {
                    console.log(`📤 Retry: Sent friend request to ${remotePeerId.substring(0, 20)}...`);

                    // Message sent successfully - change 'unsent' to 'pending'
                    const currentFriend = this.friendsManager.getFriend(remotePeerId);
                    if (currentFriend && currentFriend.pending === 'unsent') {
                        const updatedFriend: IFriend = {
                            ...currentFriend,
                            pending: 'pending'
                        };
                        this.friendsManager.updateFriend(remotePeerId, updatedFriend);
                        this.unsentFriends.delete(remotePeerId);
                        console.log(`✅ Retry successful, changed status to 'pending' for ${remotePeerId.substring(0, 20)}...`);
                    }
                }).catch(error => {
                    console.error(`❌ Failed to retry friend request to ${remotePeerId.substring(0, 20)}...:`, error);
                });
            } else {
                // Friend was updated elsewhere, remove from unsent set
                this.unsentFriends.delete(remotePeerId);
            }
        }
    }

    /**
     * Handle peer disconnection
     */
    private async handlePeerDisconnection(remotePeerId: string): Promise<void> {
        // Update friend presence
        await this.updateFriendPresence(remotePeerId, false);
    }

    setNickname(nickname: string): void {
        this.nickname = nickname;
        this.storageProvider.save(STORAGE_KEY_NICKNAME, nickname).catch(error => {
            console.warn('Failed to save nickname:', error);
        });
    }

    getNickname(): string {
        return this.nickname;
    }

    getPeerId(): string {
        return this.networkProvider.getPeerId();
    }

    getNetworkProvider(): INetworkProvider | undefined {
        return this.networkProvider;
    }

    getConnectedPeers(): string[] {
        return this.networkProvider.getConnectedPeers();
    }

    getConnectedPeerCount(): number {
        return this.networkProvider.getConnectedPeers().length;
    }

    private logConnectedPeers(): void {
        const peers = this.getConnectedPeers();
        console.log(`🔗 Connected peers (${peers.length}):`, peers.length > 0 ? peers : 'None');
    }

    /**
     * Add friend and optionally send friend request
     * Sequence: seq-add-friend-by-peerid.md (lines TBD)
     */
    async addFriend(playerName: string, peerId: string, notes: string = '', pending?: 'unsent' | 'pending', sendRequest: boolean = true): Promise<void> {
        const trimmedName = playerName.trim();
        if (!trimmedName) {
            throw new Error('Friend name cannot be empty');
        }

        if (!peerId.trim()) {
            throw new Error('Friend peer ID cannot be empty');
        }

        // Add friend with pending flag (default to 'unsent' unless explicitly set)
        const friend: IFriend = {
            playerName: trimmedName,
            peerId,
            notes,
            pending: pending !== undefined ? (pending as any) : 'unsent'
        };
        this.friendsManager.addFriend(friend);

        // Add to unsent friends set if pending is 'unsent'
        if (friend.pending === 'unsent') {
            this.unsentFriends.add(peerId);
        }

        // Send requestFriend message only if requested (default true for backward compat)
        if (sendRequest) {
            // Load our player name from settings and send requestFriend message
            const settings = await this.storageProvider.load<any>('hollowWorldSettings');
            const myPlayerName = settings?.playerName || '';

            const message: IRequestFriendMessage = {
                method: 'requestFriend',
                playerName: myPlayerName
            };

            try {
                await this.sendMessage(peerId, message);
                console.log(`📤 Sent friend request to ${peerId} (as ${myPlayerName})`);

                // Message sent successfully - change 'unsent' to 'pending'
                const currentFriend = this.friendsManager.getFriend(peerId);
                if (currentFriend && currentFriend.pending === 'unsent') {
                    const updatedFriend: IFriend = {
                        ...currentFriend,
                        pending: 'pending'
                    };
                    this.friendsManager.updateFriend(peerId, updatedFriend);
                    this.unsentFriends.delete(peerId);
                    console.log(`✅ Friend request delivered, changed status to 'pending' for ${peerId.substring(0, 20)}...`);
                }
            } catch (error) {
                // Peer unreachable is normal in P2P - log and continue
                // Friend stays in list with pending:'unsent' until peer comes online
                console.log(`ℹ️  Could not reach peer ${peerId}, friend will stay 'unsent' until they come online`);
                // DO NOT throw - this is not an error condition
            }
        }
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

    getFriendsManager(): IFriendsManager {
        return this.friendsManager;
    }

    getQuarantined(): Set<string> {
        return new Set(this.quarantined);
    }

    isQuarantined(peerId: string): boolean {
        return this.quarantined.has(peerId);
    }

    removeFromQuarantine(peerId: string): boolean {
        return this.quarantined.delete(peerId);
    }

    async destroy(): Promise<void> {
        // Stop resend timer
        if (this.resendTimer) {
            clearInterval(this.resendTimer);
            this.resendTimer = null;
        }
        await this.networkProvider.destroy();
    }

    // ==================== Resendable Messages System ====================

    private async loadResendableMessages(): Promise<void> {
        try {
            // Load serialized messages as array of [messageId, storage] tuples
            const stored = await this.storageProvider.load<Array<[string, IResendableMessageStorage]>>(STORAGE_KEY_RESENDABLE_MESSAGES);
            if (stored && Array.isArray(stored)) {
                this.resendableMessages = new Map(stored);
                console.log(`📦 Loaded ${this.resendableMessages.size} resendable message(s) from storage`);
            }
        } catch (error) {
            console.warn('Failed to load resendable messages:', error);
            this.resendableMessages = new Map();
        }
    }

    private persistResendableMessages(): void {
        try {
            // Serialize Map as array of [messageId, storage] tuples
            const serialized = Array.from(this.resendableMessages.entries());
            this.storageProvider.save(STORAGE_KEY_RESENDABLE_MESSAGES, serialized).catch(error => {
                console.warn('Failed to persist resendable messages:', error);
            });
        } catch (error) {
            console.warn('Failed to serialize resendable messages:', error);
        }
    }

    private generateUUID(): string {
        // Use crypto.randomUUID() if available, otherwise fallback
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback UUID v4 generation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    private startResendTimer(): void {
        this.resendTimer = setInterval(() => {
            this.processResendQueue();
        }, RESENDABLE_MESSAGE_RETRY_INTERVAL);
    }

    private processResendQueue(): void {
        const now = Date.now();
        let queueModified = false;

        for (const [messageId, storage] of this.resendableMessages.entries()) {
            // Check if it's time to retry
            if (now >= storage.nextRetryTime) {
                // Check if max retries exceeded
                if (storage.retryCount >= RESENDABLE_MESSAGE_MAX_RETRIES) {
                    console.warn(`❌ Max retries exceeded for message ${messageId}, removing from queue`);
                    this.resendableMessages.delete(messageId);
                    queueModified = true;
                    continue;
                }

                // Retry sending
                storage.retryCount++;
                storage.nextRetryTime = now + RESENDABLE_MESSAGE_RETRY_INTERVAL;
                queueModified = true;

                console.log(`🔄 Retrying message ${messageId} (attempt ${storage.retryCount}/${RESENDABLE_MESSAGE_MAX_RETRIES})`);

                this.networkProvider.sendMessage(storage.message.target, storage.message as P2PMessage)
                    .catch(error => {
                        console.error(`❌ Failed to resend message ${messageId}:`, error);
                    });
            }
        }

        // Persist if queue was modified
        if (queueModified) {
            this.persistResendableMessages();
        }
    }

    private addResendableMessage(message: IResendableMessage, ackHandler?: () => void): void {
        const storage: IResendableMessageStorage = {
            message,
            retryCount: 0,
            nextRetryTime: Date.now() + RESENDABLE_MESSAGE_RETRY_INTERVAL,
            ackHandler
        };

        this.resendableMessages.set(message.messageId, storage);
        console.log(`📝 Added resendable message ${message.messageId} to queue`);

        // Persist to storage
        this.persistResendableMessages();
    }

    private handleAckMessage(remotePeerId: string, message: IAckMessage): void {
        const storage = this.resendableMessages.get(message.messageId);

        if (!storage) {
            console.warn(`⚠️  Received ack for unknown message ${message.messageId}`);
            return;
        }

        console.log(`✅ Received ack for message ${message.messageId}`);

        // Call ack handler if provided
        if (storage.ackHandler) {
            try {
                storage.ackHandler();
                // Remove from queue only if handler succeeds
                this.resendableMessages.delete(message.messageId);
                this.persistResendableMessages();
            } catch (error) {
                console.error(`❌ Ack handler failed for message ${message.messageId}:`, error);
                // Keep in queue for retry
            }
        } else {
            // No handler, just remove from queue
            this.resendableMessages.delete(message.messageId);
            this.persistResendableMessages();
        }
    }

    private sendAck(targetPeerId: string, messageId: string): void {
        const ackMessage: IAckMessage = {
            method: 'ack',
            messageId
        };

        this.networkProvider.sendMessage(targetPeerId, ackMessage)
            .then(() => {
                console.log(`✅ Sent ack for message ${messageId}`);
            })
            .catch(error => {
                console.error(`❌ Failed to send ack for message ${messageId}:`, error);
            });
    }

    private isMessageDuplicate(messageId: string): boolean {
        if (this.receivedMessageIds.has(messageId)) {
            return true;
        }
        this.receivedMessageIds.add(messageId);
        return false;
    }

    // Ignored Peers Management
    getIgnoredPeers(): Record<string, IIgnoredPeer> {
        return { ...this.ignoredPeers };
    }

    addIgnoredPeer(peerId: string, peerName: string): void {
        this.ignoredPeers[peerId] = { peerId, peerName };
        this.persistIgnoredPeers();
        console.log(`🚫 Added ${peerId.substring(0, 20)}... to ignored peers`);
    }

    removeIgnoredPeer(peerId: string): boolean {
        if (this.ignoredPeers[peerId]) {
            delete this.ignoredPeers[peerId];
            this.persistIgnoredPeers();
            console.log(`✅ Removed ${peerId.substring(0, 20)}... from ignored peers`);
            return true;
        }
        return false;
    }

    private persistIgnoredPeers(): void {
        this.storageProvider.save(STORAGE_KEY_IGNORED_PEERS, this.ignoredPeers).catch(error => {
            console.warn('Failed to persist ignored peers:', error);
        });
    }

    // P2P Message Handling
    private handleMessage(remotePeerId: string, message: P2PMessage): void {
        console.log(`🔔 Handling message from ${remotePeerId}:`, message);

        switch (message.method) {
            case 'requestFriend':
                this.handleRequestFriend(remotePeerId, message as IRequestFriendMessage);
                break;
            case 'ping':
                this.handlePing(remotePeerId, message as IPingMessage);
                break;
            case 'pong':
                this.handlePong(remotePeerId, message as IPongMessage);
                break;
            default:
                console.warn(`⚠️  Unknown message method: ${(message as any).method}`);
        }
    }

    private handlePing(remotePeerId: string, message: IPingMessage): void {
        console.log(`🏓 Received ping from ${remotePeerId.substring(0, 20)}...`);

        const pongMessage: IPongMessage = {
            method: 'pong',
            timestamp: message.timestamp,
            messageId: message.messageId
        };

        this.networkProvider.sendMessage(remotePeerId, pongMessage)
            .then(() => {
                console.log(`🏓 Sent pong response to ${remotePeerId.substring(0, 20)}...`);
            })
            .catch((error) => {
                console.error(`❌ Failed to send pong:`, error);
            });
    }

    private handlePong(remotePeerId: string, message: IPongMessage): void {
        const now = Date.now();
        const roundTripTime = now - message.timestamp;

        console.log(`🏓 Received pong from ${remotePeerId.substring(0, 20)}...`);
        console.log(`⏱️  Round-trip time: ${roundTripTime}ms`);

        const handler = this.pendingResponses.get(message.messageId);
        if (handler) {
            this.pendingResponses.delete(message.messageId);
            handler();
        } else {
            console.warn(`⚠️  Received pong with unknown messageId: ${message.messageId}`);
        }
    }

    // ==================== Friend Request Flow (Resendable Messages) ====================

    /**
     * Process friend request (ban check, mutual acceptance, event creation)
     * Sequence: seq-friend-status-change.md (receive request)
     */
    private async handleRequestFriend(remotePeerId: string, message: IRequestFriendMessage): Promise<void> {
        console.log(`👥 Received requestFriend from ${remotePeerId.substring(0, 20)}... (${message.playerName})`);

        // Check if sender is banned
        if (this.friendsManager.isBanned(remotePeerId)) {
            console.log(`🚫 Ignored request from banned peer ${remotePeerId.substring(0, 20)}...`);
            return;
        }

        // Check if sender is in ignore list
        if (this.ignoredPeers[remotePeerId]) {
            console.log(`⚠️  Ignoring requestFriend from ignored peer ${remotePeerId.substring(0, 20)}...`);
            return;
        }

        // Check if sender is already a friend with pending flag
        const existingFriend = this.friendsManager.getFriend(remotePeerId);
        if (existingFriend) {
            if (existingFriend.pending) {
                // Mutual friend request - clear pending flag (both peers have accepted)
                console.log(`✅ Mutual friend request detected - clearing pending flag for ${remotePeerId.substring(0, 20)}...`);
                const updatedFriend: IFriend = {
                    ...existingFriend,
                    playerName: message.playerName, // Update player name from their request
                    pending: undefined
                };
                this.friendsManager.updateFriend(remotePeerId, updatedFriend);

                // Remove from unsent friends set
                this.unsentFriends.delete(remotePeerId);

                // Create friend accepted event
                const displayName = message.playerName || `Peer ${remotePeerId.substring(0, 8)}`;
                const event = this.eventService.createFriendAcceptedEvent(remotePeerId, displayName);
                this.eventService.addEvent(event);
                console.log(`✅ Created friendAccepted event for ${remotePeerId.substring(0, 20)}...`);

                // Refresh friends view if callback is set
                if (this.refreshFriendsViewCallback) {
                    await this.refreshFriendsViewCallback();
                }
                return;
            } else {
                console.log(`ℹ️  Peer ${remotePeerId.substring(0, 20)}... is already a friend`);
                return;
            }
        }

        try {
            // Check if there's already a friend request event for this peer
            const existingEvents = this.eventService.getEvents();
            const hasPendingRequest = existingEvents.some(event =>
                event.type === 'friendRequest' &&
                event.data?.peerId === remotePeerId
            );

            if (!hasPendingRequest) {
                // Create friend request event
                const event = this.eventService.createFriendRequestEvent(remotePeerId, message.playerName);
                this.eventService.addEvent(event);
                console.log(`✅ Created friendRequest event for ${remotePeerId.substring(0, 20)}...`);
            } else {
                console.log(`ℹ️  Friend request event already exists for ${remotePeerId.substring(0, 20)}...`);
            }
        } catch (error) {
            console.error(`❌ Failed to process requestFriend:`, error);
        }
    }

    // Public methods for sending friend requests

    async sendRequestFriend(targetPeerId: string, playerName: string): Promise<void> {
        // Check if there's already a pending requestFriend message for this peer
        for (const [messageId, storage] of this.resendableMessages.entries()) {
            if (storage.message.method === 'requestFriend' &&
                (storage.message as IRequestFriendMessage).target === targetPeerId) {
                console.log(`ℹ️  Already have pending requestFriend for ${targetPeerId.substring(0, 20)}..., skipping duplicate`);
                return;
            }
        }

        const message: IRequestFriendMessage = {
            method: 'requestFriend',
            messageId: this.generateUUID(),
            sender: this.getPeerId(),
            target: targetPeerId,
            playerName
        };

        // Add to resendable queue
        this.addResendableMessage(message);

        // Send initial message
        try {
            await this.networkProvider.sendMessage(targetPeerId, message);
            console.log(`📤 Sent requestFriend to ${targetPeerId.substring(0, 20)}...`);
        } catch (error) {
            console.error(`❌ Failed to send initial requestFriend:`, error);
            // Will be retried by resend timer
        }
    }

    async sendFriendResponse(targetPeerId: string, accept: boolean): Promise<void> {
        if (!accept) {
            // Ignore - no message sent, user just ignores the request
            console.log(`ℹ️  Ignoring friend request from ${targetPeerId.substring(0, 20)}... (no message sent)`);
            return;
        }

        // Load our player name from settings
        const settings = await this.storageProvider.load<any>('hollowWorldSettings');
        const myPlayerName = settings?.playerName || '';

        // Send requestFriend (mutual acceptance)
        const message: IRequestFriendMessage = {
            method: 'requestFriend',
            playerName: myPlayerName
        };

        try {
            await this.networkProvider.sendMessage(targetPeerId, message, async () => {
                // Ack received - friend request accepted by original requester
                // Clear pending flag (friendship established!)
                const currentFriend = this.friendsManager.getFriend(targetPeerId);
                if (currentFriend && currentFriend.pending) {
                    const updatedFriend: IFriend = {
                        ...currentFriend,
                        pending: undefined
                    };
                    this.friendsManager.updateFriend(targetPeerId, updatedFriend);
                    this.unsentFriends.delete(targetPeerId);
                    console.log(`✅ Friend accepted! Cleared pending for ${targetPeerId.substring(0, 20)}...`);

                    // Refresh friends view if callback is set
                    if (this.refreshFriendsViewCallback) {
                        await this.refreshFriendsViewCallback();
                    }
                }
            });
            console.log(`📤 Sent requestFriend (mutual acceptance) to ${targetPeerId.substring(0, 20)}... (as ${myPlayerName})`);
        } catch (error) {
            console.error(`❌ Failed to send requestFriend (accept):`, error);
            throw error;
        }
    }

    // ==================== Peer Discovery-Based Friend Requests ====================

    getPendingNewFriendRequests(): Record<string, boolean> {
        return { ...this.pendingNewFriendRequests };
    }

    private async sendNewFriendRequest(peerId: string): Promise<void> {
        // Use sendRequestFriend with the nickname as the player name
        await this.sendRequestFriend(peerId, this.nickname || 'Anonymous');
    }

    private handleNewFriendRequest(remotePeerId: string, message: IRequestFriendMessage): void {
        console.log(`👥 New friend request from ${remotePeerId.substring(0, 20)}...`);

        // Check if sender is in declined list
        if (this.declinedFriendRequests[remotePeerId]) {
            console.log(`⚠️  Ignoring new friend request from declined peer ${remotePeerId.substring(0, 20)}...`);
            return;
        }

        // Check if sender is already a friend
        if (this.friendsManager.getFriend(remotePeerId)) {
            console.log(`ℹ️  Peer ${remotePeerId.substring(0, 20)}... is already a friend`);
            return;
        }

        // Check if request already pending
        if (this.pendingNewFriendRequests[remotePeerId]) {
            console.log(`ℹ️  New friend request from ${remotePeerId.substring(0, 20)}... already pending`);
            return;
        }

        // Add to pending requests
        this.pendingNewFriendRequests[remotePeerId] = true;
        this.persistPendingNewFriendRequests();

        // Create event (using 'Anonymous' as player name since old newFriendRequest didn't include it)
        const event = this.eventService.createFriendRequestEvent(remotePeerId, 'Anonymous');
        this.eventService.addEvent(event);

        console.log(`✅ Created friendRequest event for ${remotePeerId.substring(0, 20)}...`);
    }

    async acceptNewFriendRequest(remotePeerId: string): Promise<void> {
        // Add as friend with peer ID as initial name
        const friend: IFriend = {
            playerName: remotePeerId.substring(0, 20) + '...',
            peerId: remotePeerId,
            notes: ''
        };
        this.friendsManager.addFriend(friend);

        // Remove from pending requests
        delete this.pendingNewFriendRequests[remotePeerId];
        this.persistPendingNewFriendRequests();

        // Remove from quarantine
        if (this.quarantined.has(remotePeerId)) {
            this.quarantined.delete(remotePeerId);
        }

        // Remove all friendRequest events for this peer
        const removedCount = this.eventService.removeEventsByPeerIdAndType(remotePeerId, 'friendRequest');
        console.log(`🗑️  Removed ${removedCount} friendRequest event(s) for ${remotePeerId.substring(0, 20)}...`);

        console.log(`✅ Accepted new friend request from ${remotePeerId.substring(0, 20)}...`);
    }

    declineNewFriendRequest(remotePeerId: string): void {
        // Add to declined list
        this.declinedFriendRequests[remotePeerId] = true;
        this.persistDeclinedFriendRequests();

        // Remove from pending requests
        delete this.pendingNewFriendRequests[remotePeerId];
        this.persistPendingNewFriendRequests();

        // Remove all friendRequest events for this peer
        const removedCount = this.eventService.removeEventsByPeerIdAndType(remotePeerId, 'friendRequest');
        console.log(`🗑️  Removed ${removedCount} friendRequest event(s) for ${remotePeerId.substring(0, 20)}...`);

        console.log(`❌ Declined new friend request from ${remotePeerId.substring(0, 20)}...`);
    }

    ignoreNewFriendRequest(remotePeerId: string): void {
        // Just remove the event, keep in pending requests
        const removedCount = this.eventService.removeEventsByPeerIdAndType(remotePeerId, 'friendRequest');
        console.log(`🗑️  Removed ${removedCount} friendRequest event(s) for ${remotePeerId.substring(0, 20)}...`);

        console.log(`ℹ️  Ignored new friend request from ${remotePeerId.substring(0, 20)}... (still pending)`);
    }

    private persistPendingNewFriendRequests(): void {
        this.storageProvider.save(STORAGE_KEY_PENDING_NEW_FRIEND_REQUESTS, this.pendingNewFriendRequests).catch(error => {
            console.warn('Failed to persist pending new friend requests:', error);
        });
    }

    private persistDeclinedFriendRequests(): void {
        this.storageProvider.save(STORAGE_KEY_DECLINED_FRIEND_REQUESTS, this.declinedFriendRequests).catch(error => {
            console.warn('Failed to persist declined friend requests:', error);
        });
    }

    async sendMessage(peerId: string, message: P2PMessage): Promise<void> {
        return this.networkProvider.sendMessage(peerId, message);
    }

    async sendPing(peerId: string, handler: () => void): Promise<void> {
        const messageId = this.generateMessageId();

        const pingMessage: IPingMessage = {
            method: 'ping',
            timestamp: Date.now(),
            messageId: messageId
        };

        this.pendingResponses.set(messageId, handler);
        console.log(`📤 Sending ping to ${peerId.substring(0, 20)}...`);

        try {
            await this.networkProvider.sendMessage(peerId, pingMessage);
        } catch (error) {
            this.pendingResponses.delete(messageId);
            throw error;
        }
    }
}
