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
    IPongMessage
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

        // Set up message handler
        this.networkProvider.onMessage(this.handleMessage.bind(this));

        // Set up peer connect handler
        this.networkProvider.onPeerConnect(this.handlePeerConnection.bind(this));

        // Session restoration: resend pending friend requests
        await this.resendPendingRequests();

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

    private handlePeerConnection(remotePeerId: string): void {
        const isFriend = this.friendsManager.getFriend(remotePeerId);
        if (!isFriend) {
            this.quarantined.add(remotePeerId);
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
