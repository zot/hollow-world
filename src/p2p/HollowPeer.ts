/**
 * HollowPeer - Main P2P interface for Hollow World
 * High-level API following SOLID principles
 */

import { EventService } from '../services/EventService';
import { LibP2PNetworkProvider } from './LibP2PNetworkProvider';
import { FriendsManager } from './FriendsManager';
import { LocalStorageProvider } from './LocalStorageProvider';
import {
    STORAGE_KEY_NICKNAME,
    STORAGE_KEY_PENDING_NEW_INVITATIONS,
    STORAGE_KEY_PENDING_NEW_FRIEND_REQUESTS,
    STORAGE_KEY_DECLINED_FRIEND_REQUESTS,
    STORAGE_KEY_IGNORED_PEERS,
    STORAGE_KEY_RESENDABLE_MESSAGES,
    PEER_DISCOVERY_TIMEOUT,
    RESENDABLE_MESSAGE_RETRY_INTERVAL,
    RESENDABLE_MESSAGE_MAX_RETRIES
} from './constants';
import type {
    INetworkProvider,
    IFriendsManager,
    IStorageProvider,
    IFriend,
    P2PMessage,
    IPingMessage,
    IPongMessage,
    IRequestFriendMessage,
    IAcceptFriendMessage,
    IDeclineFriendMessage,
    IAckMessage,
    IFriendRequestReceivedMessage,
    IResendableMessage,
    IResendableMessageStorage,
    IIgnoredPeer,
    IPendingInvitation
} from './types';

export class HollowPeer {
    private networkProvider: INetworkProvider;
    private friendsManager: IFriendsManager;
    private storageProvider: IStorageProvider;
    private eventService: EventService;
    private nickname: string = '';
    private quarantined: Set<string> = new Set();

    // Peer Discovery-Based Invitations
    private pendingNewInvitations: Record<string, IPendingInvitation> = {}; // Object mapping peer IDs to invitation data
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
        this.networkProvider = networkProvider || new LibP2PNetworkProvider(storageProvider);
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

    async initialize(): Promise<void> {
        // Initialize network provider
        console.log('🤝 Calling networkProvider.initialize()...');
        await this.networkProvider.initialize();
        console.log('🤝 networkProvider.initialize() completed');

        // Load friends
        await (this.friendsManager as FriendsManager).loadFriends();

        // Load nickname
        const storedNickname = await this.storageProvider.load<string>(STORAGE_KEY_NICKNAME);
        if (storedNickname) {
            this.nickname = storedNickname;
        }

        // Load pending new invitations
        const storedPendingNewInvitations = await this.storageProvider.load<Record<string, IPendingInvitation>>(STORAGE_KEY_PENDING_NEW_INVITATIONS);
        if (storedPendingNewInvitations) {
            this.pendingNewInvitations = storedPendingNewInvitations;
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

        // Start resendable message timer
        this.startResendTimer();

        // Session restoration: retry pending new invitations
        await this.resendPendingNewInvitations();

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

    private async resendPendingNewInvitations(): Promise<void> {
        const peerIds = Object.keys(this.pendingNewInvitations);
        if (peerIds.length === 0) {
            return;
        }

        console.log(`🔄 Found ${peerIds.length} pending new invitation(s)`);
        console.log('🔍 Starting background peer resolution for new invitations (up to 2 minutes)...');

        for (const peerId of peerIds) {
            this.startBackgroundNewInvitationResolution(peerId);
        }
    }

    private startBackgroundNewInvitationResolution(peerId: string): void {
        const startTime = Date.now();
        const retryInterval = 10000;
        let attemptCount = 0;

        const tryConnect = async () => {
            const elapsed = Date.now() - startTime;

            if (elapsed >= PEER_DISCOVERY_TIMEOUT) {
                console.warn(`⏱️  New invitation peer discovery timeout for ${peerId.substring(0, 20)}... (${attemptCount} attempts)`);
                return;
            }

            attemptCount++;
            console.log(`🔍 Attempt ${attemptCount}: Trying to send requestFriend to ${peerId.substring(0, 20)}...`);

            try {
                await this.sendNewFriendRequest(peerId);
                console.log(`✅ Successfully sent requestFriend to ${peerId.substring(0, 20)}... (attempt ${attemptCount})`);
                return;
            } catch (error: any) {
                setTimeout(tryConnect, retryInterval);
            }
        };

        tryConnect();
    }

    private handlePeerConnection(remotePeerId: string): void {
        const isFriend = this.friendsManager.getFriend(remotePeerId);
        if (!isFriend) {
            this.quarantined.add(remotePeerId);
        }

        // Check if this peer is in pendingNewInvitations
        if (this.pendingNewInvitations[remotePeerId]) {
            console.log(`📤 Peer ${remotePeerId.substring(0, 20)}... from pendingNewInvitations discovered! Sending requestFriend...`);
            this.sendNewFriendRequest(remotePeerId).catch(error => {
                console.error(`❌ Failed to send requestFriend to ${remotePeerId.substring(0, 20)}...:`, error);
            });
        }
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

    addFriend(playerName: string, peerId: string, notes: string = '', pending?: boolean): void {
        const trimmedName = playerName.trim();
        if (!trimmedName) {
            throw new Error('Friend name cannot be empty');
        }

        if (!peerId.trim()) {
            throw new Error('Friend peer ID cannot be empty');
        }

        const friend: IFriend = {
            playerName: trimmedName,
            peerId,
            notes,
            pending
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
            case 'acceptFriend':
                this.handleAcceptFriend(remotePeerId, message as IAcceptFriendMessage);
                break;
            case 'declineFriend':
                this.handleDeclineFriend(remotePeerId, message as IDeclineFriendMessage);
                break;
            case 'friendRequestReceived':
                this.handleFriendRequestReceived(remotePeerId, message as IFriendRequestReceivedMessage);
                break;
            case 'ack':
                this.handleAckMessage(remotePeerId, message as IAckMessage);
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

    private handleRequestFriend(remotePeerId: string, message: IRequestFriendMessage): void {
        console.log(`👥 Received requestFriend from ${remotePeerId.substring(0, 20)}...`);

        // Check for duplicate message
        if (this.isMessageDuplicate(message.messageId)) {
            console.log(`ℹ️  Ignoring duplicate requestFriend ${message.messageId}`);
            return;
        }

        // Immediately send friendRequestReceived acknowledgment
        const ackMessage: IFriendRequestReceivedMessage = {
            method: 'friendRequestReceived'
        };
        this.networkProvider.sendMessage(remotePeerId, ackMessage)
            .then(() => {
                console.log(`✅ Sent friendRequestReceived to ${remotePeerId.substring(0, 20)}...`);
            })
            .catch((error) => {
                console.error(`❌ Failed to send friendRequestReceived:`, error);
            });

        // Check if sender is in ignore list
        if (this.ignoredPeers[remotePeerId]) {
            console.log(`⚠️  Ignoring requestFriend from ignored peer ${remotePeerId.substring(0, 20)}...`);
            return;
        }

        // Check if sender is already a friend
        if (this.friendsManager.getFriend(remotePeerId)) {
            console.log(`ℹ️  Peer ${remotePeerId.substring(0, 20)}... is already a friend`);
            // Send ack anyway
            this.sendAck(remotePeerId, message.messageId);
            return;
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

            // Send ack
            this.sendAck(remotePeerId, message.messageId);
        } catch (error) {
            console.error(`❌ Failed to process requestFriend:`, error);
            // Don't send ack if processing failed
        }
    }

    private handleFriendRequestReceived(remotePeerId: string, message: IFriendRequestReceivedMessage): void {
        console.log(`✅ Received friendRequestReceived from ${remotePeerId.substring(0, 20)}...`);

        // Check if this peer is in pending new invitations
        const pending = this.pendingNewInvitations[remotePeerId];
        if (pending) {
            // Add friend to friend list (from the stored invitation data)
            try {
                const friend = pending.friend;
                this.addFriend(friend.playerName, friend.peerId, friend.notes, true);  // pending = true until they accept
                console.log(`✅ Added friend ${friend.playerName} (${remotePeerId.substring(0, 20)}...) from pending invitation`);

                // Remove from pending new invitations
                this.removePendingNewInvitation(remotePeerId);
            } catch (error) {
                console.error(`❌ Failed to add friend from friendRequestReceived:`, error);
            }
        } else {
            console.warn(`⚠️  Received friendRequestReceived from ${remotePeerId.substring(0, 20)}... but no pending invitation found`);
        }
    }

    private handleAcceptFriend(remotePeerId: string, message: IAcceptFriendMessage): void {
        console.log(`✅ Received acceptFriend from ${remotePeerId.substring(0, 20)}...`);

        // Check for duplicate message
        if (this.isMessageDuplicate(message.messageId)) {
            console.log(`ℹ️  Ignoring duplicate acceptFriend ${message.messageId}`);
            return;
        }

        try {
            // Check if friend exists and has pending flag
            const friend = this.friendsManager.getFriend(remotePeerId);
            if (friend && friend.pending) {
                // Clear pending flag
                const updatedFriend: IFriend = {
                    ...friend,
                    pending: false
                };
                this.friendsManager.updateFriend(remotePeerId, updatedFriend);
                console.log(`✅ Cleared pending flag for ${remotePeerId.substring(0, 20)}...`);
            } else if (!friend) {
                console.warn(`⚠️  Received acceptFriend for non-friend ${remotePeerId.substring(0, 20)}...`);
            }

            // Send ack
            this.sendAck(remotePeerId, message.messageId);
        } catch (error) {
            console.error(`❌ Failed to process acceptFriend:`, error);
            // Don't send ack if processing failed
        }
    }

    private handleDeclineFriend(remotePeerId: string, message: IDeclineFriendMessage): void {
        console.log(`❌ Received declineFriend from ${remotePeerId.substring(0, 20)}...`);

        // Check for duplicate message
        if (this.isMessageDuplicate(message.messageId)) {
            console.log(`ℹ️  Ignoring duplicate declineFriend ${message.messageId}`);
            return;
        }

        try {
            // Check if friend exists in list
            const friend = this.friendsManager.getFriend(remotePeerId);
            if (friend) {
                // Remove friend
                this.friendsManager.removeFriend(remotePeerId);

                // Create event notification
                const event = this.eventService.createFriendDeclinedEvent(remotePeerId, friend.playerName);
                this.eventService.addEvent(event);
                console.log(`✅ Created friendDeclined event for ${remotePeerId.substring(0, 20)}...`);
            } else {
                console.warn(`⚠️  Received declineFriend for non-friend ${remotePeerId.substring(0, 20)}...`);
            }

            // Send ack
            this.sendAck(remotePeerId, message.messageId);
        } catch (error) {
            console.error(`❌ Failed to process declineFriend:`, error);
            // Don't send ack if processing failed
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

    async sendAcceptFriend(targetPeerId: string): Promise<void> {
        const message: IAcceptFriendMessage = {
            method: 'acceptFriend',
            messageId: this.generateUUID(),
            sender: this.getPeerId(),
            target: targetPeerId
        };

        // Add to resendable queue with ack handler to clear pending flag
        const ackHandler = () => {
            const friend = this.friendsManager.getFriend(targetPeerId);
            if (friend && friend.pending) {
                const updatedFriend: IFriend = {
                    ...friend,
                    pending: false
                };
                this.friendsManager.updateFriend(targetPeerId, updatedFriend);
                console.log(`✅ Cleared pending flag after ack for ${targetPeerId.substring(0, 20)}...`);
            }
        };

        this.addResendableMessage(message, ackHandler);

        // Send initial message
        try {
            await this.networkProvider.sendMessage(targetPeerId, message);
            console.log(`📤 Sent acceptFriend to ${targetPeerId.substring(0, 20)}...`);
        } catch (error) {
            console.error(`❌ Failed to send initial acceptFriend:`, error);
            // Will be retried by resend timer
        }
    }

    async sendDeclineFriend(targetPeerId: string): Promise<void> {
        const message: IDeclineFriendMessage = {
            method: 'declineFriend',
            messageId: this.generateUUID(),
            sender: this.getPeerId(),
            target: targetPeerId
        };

        // Add to resendable queue
        this.addResendableMessage(message);

        // Send initial message
        try {
            await this.networkProvider.sendMessage(targetPeerId, message);
            console.log(`📤 Sent declineFriend to ${targetPeerId.substring(0, 20)}...`);
        } catch (error) {
            console.error(`❌ Failed to send initial declineFriend:`, error);
            // Will be retried by resend timer
        }
    }

    // ==================== Peer Discovery-Based Invitations ====================

    addPendingNewInvitation(peerId: string, playerName: string, notes: string): void {
        if (!this.pendingNewInvitations[peerId]) {
            const friend: IFriend = {
                peerId,
                playerName,
                notes,
                pending: true
            };

            this.pendingNewInvitations[peerId] = {
                state: 'resend',
                friend
            };

            this.persistPendingNewInvitations();
            console.log(`✅ Added ${peerId.substring(0, 20)}... to pending new invitations`);

            // Start background retry logic
            this.startBackgroundNewInvitationResolution(peerId);
        }
    }

    removePendingNewInvitation(peerId: string): boolean {
        if (this.pendingNewInvitations[peerId]) {
            delete this.pendingNewInvitations[peerId];
            this.persistPendingNewInvitations();
            console.log(`🗑️  Removed ${peerId.substring(0, 20)}... from pending new invitations`);
            return true;
        }
        return false;
    }

    getPendingNewInvitations(): string[] {
        return Object.keys(this.pendingNewInvitations);
    }

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

        // Remove from pending new invitations if present
        this.removePendingNewInvitation(remotePeerId);

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

    private persistPendingNewInvitations(): void {
        this.storageProvider.save(STORAGE_KEY_PENDING_NEW_INVITATIONS, this.pendingNewInvitations).catch(error => {
            console.warn('Failed to persist pending new invitations:', error);
        });
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
