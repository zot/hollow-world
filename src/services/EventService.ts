/**
 * EventService - Manages persistent event notifications
 * Based on CLAUDE.md UI principles for events
 */

import { getProfileService } from './ProfileService.js';

export type EventType = 'friendRequest' | 'friendDeclined';

export interface IEvent {
    id: string;
    type: EventType;
    timestamp: Date;
    data: any; // Event-specific data
}

// Removed: INewFriendRequestEvent (replaced by IFriendRequestEvent with playerName)

export interface IFriendRequestEvent extends IEvent {
    type: 'friendRequest';
    data: {
        remotePeerId: string;
        playerName: string;
    };
}

export interface IFriendDeclinedEvent extends IEvent {
    type: 'friendDeclined';
    data: {
        remotePeerId: string;
        playerName: string;
    };
}

export class EventService {
    private events: IEvent[] = [];
    private readonly storageKey = 'hollowWorldEvents';
    private changeListeners: Array<() => void> = [];

    constructor() {
        this.loadEvents();
    }

    private loadEvents(): void {
        try {
            const stored = getProfileService().getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                // Restore Date objects
                this.events = parsed.map((event: any) => ({
                    ...event,
                    timestamp: new Date(event.timestamp)
                }));
            }
        } catch (error) {
            console.warn('Failed to load events:', error);
            this.events = [];
        }
    }

    private persistEvents(): void {
        try {
            getProfileService().setItem(this.storageKey, JSON.stringify(this.events));
        } catch (error) {
            console.warn('Failed to persist events:', error);
        }
    }

    private notifyListeners(): void {
        for (const listener of this.changeListeners) {
            try {
                listener();
            } catch (error) {
                console.error('Error in event change listener:', error);
            }
        }
    }

    addEvent(event: IEvent): void {
        this.events.push(event);
        this.persistEvents();
        this.notifyListeners();
    }

    removeEvent(eventId: string): boolean {
        const initialLength = this.events.length;
        this.events = this.events.filter(e => e.id !== eventId);

        if (this.events.length !== initialLength) {
            this.persistEvents();
            this.notifyListeners();
            return true;
        }
        return false;
    }

    removeEventsByPeerIdAndType(peerId: string, eventType: EventType): number {
        const initialLength = this.events.length;
        this.events = this.events.filter(e => {
            if (e.type !== eventType) {
                return true;
            }
            // Check if this event is related to the peer
            if (e.type === 'friendRequest' && (e as IFriendRequestEvent).data.remotePeerId === peerId) {
                return false;
            }
            if (e.type === 'friendDeclined' && (e as IFriendDeclinedEvent).data.remotePeerId === peerId) {
                return false;
            }
            return true;
        });

        const removedCount = initialLength - this.events.length;
        if (removedCount > 0) {
            this.persistEvents();
            this.notifyListeners();
        }
        return removedCount;
    }

    getEvents(): IEvent[] {
        return [...this.events];
    }

    getEventCount(): number {
        return this.events.length;
    }

    clearAll(): void {
        this.events = [];
        this.persistEvents();
        this.notifyListeners();
    }

    onChange(listener: () => void): void {
        this.changeListeners.push(listener);
    }

    removeListener(listener: () => void): void {
        this.changeListeners = this.changeListeners.filter(l => l !== listener);
    }

    // Helper to create friend request event
    createFriendRequestEvent(remotePeerId: string, playerName: string): IFriendRequestEvent {
        return {
            id: `friend-request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'friendRequest',
            timestamp: new Date(),
            data: {
                remotePeerId,
                playerName
            }
        };
    }

    // Helper to create friend declined event
    createFriendDeclinedEvent(remotePeerId: string, playerName: string): IFriendDeclinedEvent {
        return {
            id: `friend-declined-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type: 'friendDeclined',
            timestamp: new Date(),
            data: {
                remotePeerId,
                playerName
            }
        };
    }
}
