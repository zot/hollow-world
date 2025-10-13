/**
 * Friends Manager - Friends management (Single Responsibility Principle)
 */

import type { IFriend, IFriendsManager, IStorageProvider } from './types';
import { STORAGE_KEY_FRIENDS } from './constants';

export class FriendsManager implements IFriendsManager {
    private friends: Map<string, IFriend> = new Map(); // peerId -> IFriend
    private storageProvider: IStorageProvider;

    constructor(storageProvider: IStorageProvider) {
        this.storageProvider = storageProvider;
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
