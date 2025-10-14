/**
 * HollowPeer - Main P2P interface for Hollow World
 * High-level API following SOLID principles
 */

import { EventService } from '../services/EventService';
import { LibP2PNetworkProvider } from './LibP2PNetworkProvider';
import { FriendsManager } from './FriendsManager';
import { LocalStorageProvider } from './LocalStorageProvider';
import { IPAddressDetector } from './IPAddressDetector';
import {
    STORAGE_KEY_NICKNAME,
    STORAGE_KEY_ACTIVE_INVITATIONS,
    STORAGE_KEY_PENDING_REQUESTS,
    STORAGE_KEY_PENDING_NEW_INVITATIONS,
    STORAGE_KEY_PENDING_NEW_FRIEND_REQUESTS,
    STORAGE_KEY_DECLINED_FRIEND_REQUESTS,
    PEER_DISCOVERY_TIMEOUT
} from './constants';
import type {
    INetworkProvider,
    IFriendsManager,
    IStorageProvider,
    IFriend,
    IInvitation,
    IActiveInvitation,
    P2PMessage,
    IRequestFriendMessage,
    IApproveFriendRequestMessage,
    IPingMessage,
    IPongMessage,
    INewFriendRequestMessage
} from './types';

export class HollowPeer {
    private networkProvider: INetworkProvider;
    private friendsManager: IFriendsManager;
    private storageProvider: IStorageProvider;
    private eventService: EventService;
    private nickname: string = '';
    private activeInvitations: Record<string, IActiveInvitation> = {};
    private quarantined: Set<string> = new Set();
    private pendingFriendRequests: Record<string, IInvitation> = {};

    // New Invitations (Peer Discovery-Based)
    private pendingNewInvitations: string[] = []; // Array of peer IDs
    private pendingNewFriendRequests: Record<string, boolean> = {}; // peer ID -> true
    private declinedFriendRequests: Record<string, boolean> = {}; // peer ID -> true

    // Request-Response Infrastructure
    private messagePrefix: string;
    private messageCount: number = 0;
    private pendingResponses: Map<string, () => void> = new Map();

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

        // Load active invitations
        const storedInvitations = await this.storageProvider.load<Record<string, IActiveInvitation>>(STORAGE_KEY_ACTIVE_INVITATIONS);
        if (storedInvitations) {
            this.activeInvitations = storedInvitations;
        }

        // Load pending friend requests
        const storedPendingRequests = await this.storageProvider.load<Record<string, IInvitation>>(STORAGE_KEY_PENDING_REQUESTS);
        if (storedPendingRequests) {
            this.pendingFriendRequests = storedPendingRequests;
        }

        // Load pending new invitations
        const storedPendingNewInvitations = await this.storageProvider.load<string[]>(STORAGE_KEY_PENDING_NEW_INVITATIONS);
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

        // Set up message handler
        this.networkProvider.onMessage(this.handleMessage.bind(this));

        // Set up peer connect handler
        this.networkProvider.onPeerConnect(this.handlePeerConnection.bind(this));

        // Session restoration: resend pending friend requests
        await this.resendPendingRequests();

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

    private async resendPendingRequests(): Promise<void> {
        const pendingPeerIds = Object.keys(this.pendingFriendRequests);

        if (pendingPeerIds.length === 0) {
            return;
        }

        console.log(`🔄 Found ${pendingPeerIds.length} pending friend request(s)`);
        console.log('🔍 Starting background peer discovery (up to 2 minutes)...');

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
        const retryInterval = 10000;
        let attemptCount = 0;

        const tryConnect = async () => {
            const elapsed = Date.now() - startTime;

            if (elapsed >= PEER_DISCOVERY_TIMEOUT) {
                console.warn(`⏱️  Peer discovery timeout for ${peerId.substring(0, 20)}... (${attemptCount} attempts)`);
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
                console.log(`✅ Successfully sent friend request to ${peerId.substring(0, 20)}... (attempt ${attemptCount})`);
                return;
            } catch (error: any) {
                setTimeout(tryConnect, retryInterval);
            }
        };

        tryConnect();
    }

    private async resendPendingNewInvitations(): Promise<void> {
        if (this.pendingNewInvitations.length === 0) {
            return;
        }

        console.log(`🔄 Found ${this.pendingNewInvitations.length} pending new invitation(s)`);
        console.log('🔍 Starting background peer resolution for new invitations (up to 2 minutes)...');

        for (const peerId of this.pendingNewInvitations) {
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
            console.log(`🔍 Attempt ${attemptCount}: Trying to send newFriendRequest to ${peerId.substring(0, 20)}...`);

            try {
                await this.sendNewFriendRequest(peerId);
                console.log(`✅ Successfully sent newFriendRequest to ${peerId.substring(0, 20)}... (attempt ${attemptCount})`);
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
        if (this.pendingNewInvitations.includes(remotePeerId)) {
            console.log(`📤 Peer ${remotePeerId.substring(0, 20)}... from pendingNewInvitations discovered! Sending newFriendRequest...`);
            this.sendNewFriendRequest(remotePeerId).catch(error => {
                console.error(`❌ Failed to send newFriendRequest to ${remotePeerId.substring(0, 20)}...:`, error);
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

    addFriend(playerName: string, peerId: string, notes: string = ''): void {
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

    generateInviteCode(): string {
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

        const { external, internal } = await IPAddressDetector.detectIPAddresses();

        const invitation: IInvitation = {
            inviteCode,
            peerId: this.getPeerId(),
            addresses: {
                external: external.length > 0 ? external : undefined,
                internal: internal.length > 0 ? internal : undefined
            }
        };

        const invitationJson = JSON.stringify(invitation);
        const invitationBase64 = btoa(invitationJson);

        console.log('📋 Created invitation:', invitation);
        return invitationBase64;
    }

    getActiveInvitations(): Record<string, IActiveInvitation> {
        return { ...this.activeInvitations };
    }

    private persistInvitations(): void {
        this.storageProvider.save(STORAGE_KEY_ACTIVE_INVITATIONS, this.activeInvitations).catch(error => {
            console.warn('Failed to persist invitations:', error);
        });
    }

    private persistPendingRequests(): void {
        this.storageProvider.save(STORAGE_KEY_PENDING_REQUESTS, this.pendingFriendRequests).catch(error => {
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
            case 'newFriendRequest':
                this.handleNewFriendRequest(remotePeerId, message as INewFriendRequestMessage);
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

    private handleRequestFriend(remotePeerId: string, message: IRequestFriendMessage): void {
        console.log(`👥 Friend request from ${remotePeerId} with invite code: ${message.inviteCode}`);

        const invitation = this.activeInvitations[message.inviteCode];

        if (!invitation) {
            console.warn(`⚠️  Invalid friend request: invite code ${message.inviteCode} not found`);
            return;
        }

        if (invitation.friendId && invitation.friendId !== remotePeerId) {
            console.warn(`⚠️  Invalid friend request: peer ID mismatch`);
            return;
        }

        const event = this.eventService.createFriendRequestEvent(
            remotePeerId,
            message.inviteCode,
            invitation.friendName
        );
        this.eventService.addEvent(event);

        console.log(`✅ Valid friend request from ${remotePeerId}. Event created with ID: ${event.id}`);
    }

    private handleApproveFriendRequest(remotePeerId: string, message: IApproveFriendRequestMessage): void {
        if (this.friendsManager.getFriend(remotePeerId)) {
            console.log(`ℹ️  Peer ${remotePeerId} is already a friend`);
            return;
        }

        if (!this.pendingFriendRequests[remotePeerId]) {
            console.error(`⚠️  Received approveFriendRequest from ${remotePeerId} but no pending request found`);
            return;
        }

        if (message.approved) {
            const trimmedNickname = message.nickname.trim();
            if (!trimmedNickname) {
                console.error(`⚠️  Received approveFriendRequest with empty nickname`);
                return;
            }

            console.log(`✅ ${trimmedNickname} (${remotePeerId}) approved your friend request!`);

            delete this.pendingFriendRequests[remotePeerId];
            this.persistPendingRequests();

            const friend: IFriend = {
                playerName: trimmedNickname,
                peerId: remotePeerId,
                notes: ''
            };
            this.friendsManager.addFriend(friend);

            if (this.quarantined.has(remotePeerId)) {
                this.quarantined.delete(remotePeerId);
            }

            const event = this.eventService.createFriendApprovedEvent(remotePeerId, message.nickname);
            this.eventService.addEvent(event);
        } else {
            console.log(`❌ ${message.nickname} (${remotePeerId}) declined your friend request`);
            delete this.pendingFriendRequests[remotePeerId];
            this.persistPendingRequests();
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

    async sendRequestFriend(invitationString: string): Promise<void> {
        let invitation: IInvitation;
        try {
            const decodedJson = atob(invitationString);
            invitation = JSON.parse(decodedJson) as IInvitation;
        } catch (error) {
            throw new Error('Invalid invitation format');
        }

        if (!invitation.inviteCode || !invitation.peerId) {
            throw new Error('Invalid invitation: missing inviteCode or peerId');
        }

        const targetPeerId = invitation.peerId;

        this.pendingFriendRequests[targetPeerId] = invitation;
        this.persistPendingRequests();

        const friendRequest: IRequestFriendMessage = {
            method: 'requestFriend',
            inviteCode: invitation.inviteCode
        };

        await this.networkProvider.sendMessage(targetPeerId, friendRequest);
        console.log(`📤 Friend request sent to ${targetPeerId}`);
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
            const friend: IFriend = {
                playerName: friendName,
                peerId: remotePeerId,
                notes: ''
            };
            this.friendsManager.addFriend(friend);

            if (this.quarantined.has(remotePeerId)) {
                this.quarantined.delete(remotePeerId);
            }

            delete this.activeInvitations[inviteCode];
            this.persistInvitations();
        }

        // Remove all friend request events for this peer (whether approved or declined)
        const removedCount = this.eventService.removeEventsByPeerIdAndType(remotePeerId, 'friendRequest');
        console.log(`🗑️  Removed ${removedCount} friend request event(s) for ${remotePeerId.substring(0, 20)}...`);

        console.log(`📤 Friend request ${approved ? 'approved' : 'declined'}`);
    }

    getPendingFriendRequests(): Record<string, IInvitation> {
        return { ...this.pendingFriendRequests };
    }

    // ==================== New Invitations (Peer Discovery-Based) ====================

    addPendingNewInvitation(peerId: string): void {
        if (!this.pendingNewInvitations.includes(peerId)) {
            this.pendingNewInvitations.push(peerId);
            this.persistPendingNewInvitations();
            console.log(`✅ Added ${peerId.substring(0, 20)}... to pending new invitations`);

            // Start background retry logic
            this.startBackgroundNewInvitationResolution(peerId);
        }
    }

    removePendingNewInvitation(peerId: string): boolean {
        const index = this.pendingNewInvitations.indexOf(peerId);
        if (index !== -1) {
            this.pendingNewInvitations.splice(index, 1);
            this.persistPendingNewInvitations();
            console.log(`🗑️  Removed ${peerId.substring(0, 20)}... from pending new invitations`);
            return true;
        }
        return false;
    }

    getPendingNewInvitations(): string[] {
        return [...this.pendingNewInvitations];
    }

    getPendingNewFriendRequests(): Record<string, boolean> {
        return { ...this.pendingNewFriendRequests };
    }

    private async sendNewFriendRequest(peerId: string): Promise<void> {
        const message: INewFriendRequestMessage = {
            method: 'newFriendRequest'
        };

        await this.networkProvider.sendMessage(peerId, message);
        console.log(`📤 Sent newFriendRequest to ${peerId.substring(0, 20)}...`);
    }

    private handleNewFriendRequest(remotePeerId: string, message: INewFriendRequestMessage): void {
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

        // Create event
        const event = this.eventService.createNewFriendRequestEvent(remotePeerId);
        this.eventService.addEvent(event);

        console.log(`✅ Created newFriendRequest event for ${remotePeerId.substring(0, 20)}...`);
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

        // Remove all newFriendRequest events for this peer
        const removedCount = this.eventService.removeEventsByPeerIdAndType(remotePeerId, 'newFriendRequest');
        console.log(`🗑️  Removed ${removedCount} newFriendRequest event(s) for ${remotePeerId.substring(0, 20)}...`);

        console.log(`✅ Accepted new friend request from ${remotePeerId.substring(0, 20)}...`);
    }

    declineNewFriendRequest(remotePeerId: string): void {
        // Add to declined list
        this.declinedFriendRequests[remotePeerId] = true;
        this.persistDeclinedFriendRequests();

        // Remove from pending requests
        delete this.pendingNewFriendRequests[remotePeerId];
        this.persistPendingNewFriendRequests();

        // Remove all newFriendRequest events for this peer
        const removedCount = this.eventService.removeEventsByPeerIdAndType(remotePeerId, 'newFriendRequest');
        console.log(`🗑️  Removed ${removedCount} newFriendRequest event(s) for ${remotePeerId.substring(0, 20)}...`);

        console.log(`❌ Declined new friend request from ${remotePeerId.substring(0, 20)}...`);
    }

    ignoreNewFriendRequest(remotePeerId: string): void {
        // Just remove the event, keep in pending requests
        const removedCount = this.eventService.removeEventsByPeerIdAndType(remotePeerId, 'newFriendRequest');
        console.log(`🗑️  Removed ${removedCount} newFriendRequest event(s) for ${remotePeerId.substring(0, 20)}...`);

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
