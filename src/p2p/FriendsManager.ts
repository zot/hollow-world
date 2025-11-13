/**
 * Friends Manager - Friend data management, persistence, and ban list
 * Single Responsibility: Manages friend data only (no P2P logic, no UI)
 *
 * CRC: crc-FriendsManager.md
 * Spec: friends.md, p2p.md
 * Sequences: seq-add-friend-by-peerid.md, seq-friend-status-change.md
 */

import type { IFriend, IFriendsManager, IStorageProvider, IFriendWorld, IFriendCharacter, ICharacter, BanList, IBannedPeerEntry } from './types.js';
import { STORAGE_KEY_FRIENDS, STORAGE_KEY_BAN_LIST } from './constants.js';
import { calculateCharacterHash } from '../utils/characterHash.js';

/**
 * FriendsManager class - Friend data management with observer pattern
 * CRC: crc-FriendsManager.md
 */
export class FriendsManager implements IFriendsManager {
    private friends: Map<string, IFriend> = new Map(); // peerId -> IFriend
    private banList: BanList = {}; // peerId -> IBannedPeerEntry
    private storageProvider: IStorageProvider;
    private updateListeners: Array<(peerId: string, friend: IFriend) => void> = [];
    private networkProvider: any; // Will be injected for getting myPeerId

    constructor(storageProvider: IStorageProvider, networkProvider?: any) {
        this.storageProvider = storageProvider;
        this.networkProvider = networkProvider;
    }

    onFriendUpdate(callback: (peerId: string, friend: IFriend) => void): void {
        this.updateListeners.push(callback);
    }

    removeUpdateListener(callback: (peerId: string, friend: IFriend) => void): void {
        const index = this.updateListeners.indexOf(callback);
        if (index > -1) {
            this.updateListeners.splice(index, 1);
        }
    }

    private notifyUpdateListeners(peerId: string, friend: IFriend): void {
        this.updateListeners.forEach(listener => {
            try {
                listener(peerId, friend);
            } catch (error) {
                console.error('Error in friend update listener:', error);
            }
        });
    }

    /**
     * Load friends from storage
     * Sequence: seq-add-friend-by-peerid.md (initialization)
     */
    async loadFriends(): Promise<void> {
        const friendsData = await this.storageProvider.load<Record<string, IFriend>>(STORAGE_KEY_FRIENDS);
        if (friendsData) {
            // Initialize worlds array for backward compatibility
            Object.values(friendsData).forEach(friend => {
                if (!friend.worlds) {
                    friend.worlds = [];
                }
            });
            this.friends = new Map(Object.entries(friendsData));
        }

        // Load ban list
        const banListData = await this.storageProvider.load<BanList>(STORAGE_KEY_BAN_LIST);
        if (banListData) {
            this.banList = banListData;
        }
    }

    /**
     * Add friend to list and persist
     * Sequence: seq-add-friend-by-peerid.md (lines TBD)
     */
    addFriend(friend: IFriend): void {
        this.friends.set(friend.peerId, friend);
        this.persistFriends();
    }

    /**
     * Update friend data and persist
     * Sequence: seq-friend-status-change.md (lines TBD)
     */
    updateFriend(peerId: string, friend: IFriend): void {
        if (this.friends.has(peerId)) {
            this.friends.set(peerId, friend);
            this.persistFriends();
            this.notifyUpdateListeners(peerId, friend);
        }
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
        this.storageProvider.save(STORAGE_KEY_FRIENDS, friendsObject).catch(error => {
            console.warn('Failed to persist friends:', error);
        });
    }

    private persistBanList(): void {
        this.storageProvider.save(STORAGE_KEY_BAN_LIST, this.banList).catch(error => {
            console.warn('Failed to persist ban list:', error);
        });
    }

    // ==================== World Tracking Methods ====================

    addFriendWorld(peerId: string, world: IFriendWorld): void {
        const friend = this.friends.get(peerId);
        if (!friend) {
            throw new Error(`Friend with peerId ${peerId} not found`);
        }

        // Initialize worlds array if it doesn't exist
        if (!friend.worlds) {
            friend.worlds = [];
        }

        // Check if world already exists
        const existingWorld = friend.worlds.find(w => w.worldId === world.worldId);
        if (existingWorld) {
            throw new Error(`World ${world.worldId} already exists for friend ${peerId}`);
        }

        friend.worlds.push(world);
        this.persistFriends();
    }

    removeFriendWorld(peerId: string, worldId: string): void {
        const friend = this.friends.get(peerId);
        if (!friend || !friend.worlds) {
            return; // Nothing to remove
        }

        const initialLength = friend.worlds.length;
        friend.worlds = friend.worlds.filter(w => w.worldId !== worldId);

        // Only save if something was actually removed
        if (friend.worlds.length !== initialLength) {
            this.persistFriends();
        }
    }

    getFriendWorld(peerId: string, worldId: string): IFriendWorld | undefined {
        const friend = this.friends.get(peerId);
        if (!friend || !friend.worlds) {
            return undefined;
        }

        return friend.worlds.find(w => w.worldId === worldId);
    }

    addFriendCharacter(peerId: string, worldId: string, character: IFriendCharacter): void {
        const world = this.getFriendWorld(peerId, worldId);
        if (!world) {
            throw new Error(`World ${worldId} not found for friend ${peerId}`);
        }

        // Check if character already exists in this world (using character.id)
        const existingChar = world.characters.find(c => c.character.id === character.character.id);
        if (existingChar) {
            throw new Error(`Character ${character.character.id} already exists in world ${worldId}`);
        }

        world.characters.push(character);
        this.persistFriends();
    }

    async updateFriendCharacter(
        peerId: string,
        worldId: string,
        updatedCharacter: ICharacter
    ): Promise<void> {
        const world = this.getFriendWorld(peerId, worldId);
        if (!world) {
            console.warn(`World ${worldId} not found for friend ${peerId}`);
            return;
        }

        // Find character by character.id
        const charIndex = world.characters.findIndex(c => c.character.id === updatedCharacter.id);
        if (charIndex < 0) {
            console.warn(`Character ${updatedCharacter.id} not found in world ${worldId}`);
            return;
        }

        // Update character and recalculate hash
        world.characters[charIndex].character = updatedCharacter;
        world.characters[charIndex].characterHash = await calculateCharacterHash(updatedCharacter);

        this.persistFriends();
    }

    getFriendWorlds(peerId: string): IFriendWorld[] {
        const friend = this.friends.get(peerId);
        if (!friend || !friend.worlds) {
            return [];
        }
        return [...friend.worlds]; // Return copy to prevent external mutation
    }

    getFriendHostedWorlds(peerId: string): IFriendWorld[] {
        const friend = this.friends.get(peerId);
        if (!friend || !friend.worlds) {
            return [];
        }
        // Return only worlds where friend is the host
        return friend.worlds.filter(w => w.hostPeerId === peerId);
    }

    getMyWorldsWithFriend(peerId: string): IFriendWorld[] {
        if (!this.networkProvider) {
            console.warn('NetworkProvider not available for getMyWorldsWithFriend');
            return [];
        }

        const myPeerId = this.networkProvider.getPeerId();
        const friend = this.friends.get(peerId);
        if (!friend || !friend.worlds) {
            return [];
        }
        // Return only worlds where I am the host
        return friend.worlds.filter(w => w.hostPeerId === myPeerId);
    }

    // ==================== Ban List Methods ====================

    banPeer(peerId: string, friend: IFriend): void {
        // Add to ban list with full friend data
        this.banList[peerId] = {
            friend: { ...friend, worlds: friend.worlds || [] },
            bannedAt: new Date().toISOString()
        };

        // Remove from friends list
        this.friends.delete(peerId);

        // Persist both changes
        this.persistBanList();
        this.persistFriends();

        console.log(`Banned peer: ${friend.playerName} (${peerId})`);
    }

    unbanPeer(peerId: string): void {
        if (this.banList[peerId]) {
            delete this.banList[peerId];
            this.persistBanList();
            console.log(`Unbanned peer: ${peerId}`);
        }
    }

    isBanned(peerId: string): boolean {
        return peerId in this.banList;
    }

    getBannedPeer(peerId: string): IBannedPeerEntry | undefined {
        return this.banList[peerId];
    }

    getAllBannedPeers(): BanList {
        return { ...this.banList }; // Return copy to prevent external mutation
    }

    updateBannedPeer(peerId: string, friend: IFriend): void {
        const entry = this.banList[peerId];
        if (entry) {
            entry.friend = { ...friend, worlds: friend.worlds || [] };
            this.persistBanList();
        }
    }
}
