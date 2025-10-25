/**
 * Friends Manager - Friends management (Single Responsibility Principle)
 */

import type { IFriend, IFriendsManager, IStorageProvider } from './types';
import { STORAGE_KEY_FRIENDS } from './constants';

export class FriendsManager implements IFriendsManager {
    private friends: Map<string, IFriend> = new Map(); // peerId -> IFriend
    private storageProvider: IStorageProvider;
    private updateListeners: Array<(peerId: string, friend: IFriend) => void> = [];

    constructor(storageProvider: IStorageProvider) {
        this.storageProvider = storageProvider;
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

    async loadFriends(): Promise<void> {
        const friendsData = await this.storageProvider.load<Record<string, IFriend>>(STORAGE_KEY_FRIENDS);
        if (friendsData) {
            this.friends = new Map(Object.entries(friendsData));
        }
    }

    addFriend(friend: IFriend): void {
        this.friends.set(friend.peerId, friend);
        this.persistFriends();
    }

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
}
