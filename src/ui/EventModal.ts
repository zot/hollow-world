/**
 * Event Modal - Displays event cards with actions
 */

import type { EventService } from '../services/EventService';
import type { IEvent, IFriendRequestEvent, IFriendApprovedEvent } from '../types/events';
import type { HollowPeer } from '../p2p/HollowPeer';

export interface IEventModal {
    render(): HTMLElement;
    show(): void;
    hide(): void;
    destroy(): void;
}

export class EventModal implements IEventModal {
    private modal: HTMLDivElement | null = null;
    private eventService: EventService;
    private hollowPeer?: HollowPeer;

    constructor(eventService: EventService, hollowPeer?: HollowPeer) {
        this.eventService = eventService;
        this.hollowPeer = hollowPeer;

        // Listen for event changes to update display
        this.eventService.onChange(() => {
            this.updateEventList();
        });
    }

    render(): HTMLElement {
        // Create modal overlay
        this.modal = document.createElement('div');
        this.modal.className = 'event-modal-overlay';
        this.modal.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 2000;
            justify-content: center;
            align-items: center;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'event-modal-content';
        modalContent.style.cssText = `
            background: #2C1810;
            border: 3px solid #8B4513;
            border-radius: 8px;
            padding: 20px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 8px 16px rgba(0,0,0,0.5);
        `;

        // Modal header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #654321;
            padding-bottom: 10px;
        `;

        const title = document.createElement('h2');
        title.textContent = '📯 Events';
        title.style.cssText = `
            color: #D4AF37;
            margin: 0;
            font-family: 'Western', serif;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.title = 'Close';
        closeBtn.style.cssText = `
            background: #8B4513;
            border: 2px solid #654321;
            color: #F5DEB3;
            width: 36px;
            height: 36px;
            border-radius: 4px;
            font-size: 20px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.2s ease;
        `;

        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.background = '#654321';
        });

        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.background = '#8B4513';
        });

        closeBtn.addEventListener('click', () => {
            this.hide();
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Event list container
        const eventList = document.createElement('div');
        eventList.className = 'event-list';

        modalContent.appendChild(header);
        modalContent.appendChild(eventList);
        this.modal.appendChild(modalContent);

        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hide();
            }
        });

        // Initial event list
        this.updateEventList();

        return this.modal;
    }

    private updateEventList(): void {
        if (!this.modal) return;

        const eventList = this.modal.querySelector('.event-list');
        if (!eventList) return;

        const events = this.eventService.getEvents();

        if (events.length === 0) {
            eventList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #8B7355;">
                    <p style="font-size: 18px; margin: 0;">No events</p>
                </div>
            `;
            return;
        }

        // Render event cards
        eventList.innerHTML = events.map(event => this.renderEventCard(event)).join('');

        // Attach event listeners
        this.attachEventCardListeners();
    }

    private renderEventCard(event: IEvent): string {
        const timestamp = new Date(event.timestamp).toLocaleString();

        if (event.type === 'friendRequest') {
            const friendReqEvent = event as IFriendRequestEvent;
            return `
                <div class="event-card" style="
                    background: #3A2817;
                    border: 2px solid #654321;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="color: #D4AF37; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                                🤝 Friend Request
                            </div>
                            <div style="color: #F5DEB3; margin-bottom: 5px;">
                                <strong>${friendReqEvent.data.friendName}</strong> wants to be friends
                            </div>
                            <div style="color: #8B7355; font-size: 12px;">
                                ${timestamp}
                            </div>
                            <div style="margin-top: 10px;">
                                <button
                                    class="event-action-accept"
                                    data-event-id="${event.id}"
                                    data-peer-id="${friendReqEvent.data.remotePeerId}"
                                    data-friend-name="${friendReqEvent.data.friendName}"
                                    data-invite-code="${friendReqEvent.data.inviteCode}"
                                    style="
                                        background: #228B22;
                                        border: 2px solid #1F7A1F;
                                        color: white;
                                        padding: 8px 16px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        margin-right: 10px;
                                        font-weight: bold;
                                    ">
                                    Accept
                                </button>
                                <button
                                    class="event-action-ignore"
                                    data-event-id="${event.id}"
                                    style="
                                        background: #8B4513;
                                        border: 2px solid #654321;
                                        color: #F5DEB3;
                                        padding: 8px 16px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-weight: bold;
                                    ">
                                    Ignore
                                </button>
                            </div>
                        </div>
                        <button
                            class="event-remove-btn"
                            data-event-id="${event.id}"
                            title="Remove event"
                            style="
                                background: transparent;
                                border: none;
                                color: #8B7355;
                                font-size: 24px;
                                cursor: pointer;
                                padding: 0;
                                width: 30px;
                                height: 30px;
                                line-height: 1;
                            ">
                            💀
                        </button>
                    </div>
                </div>
            `;
        } else if (event.type === 'friendApproved') {
            const friendApprEvent = event as IFriendApprovedEvent;
            return `
                <div class="event-card" style="
                    background: #3A2817;
                    border: 2px solid #654321;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 15px;
                    position: relative;
                ">
                    <div style="display: flex; justify-content: space-between; align-items: start;">
                        <div style="flex: 1;">
                            <div style="color: #D4AF37; font-weight: bold; font-size: 16px; margin-bottom: 8px;">
                                ✅ Friend Approved
                            </div>
                            <div style="color: #F5DEB3; margin-bottom: 5px;">
                                <strong>${friendApprEvent.data.playerName}</strong> accepted your friend request!
                            </div>
                            <div style="color: #8B7355; font-size: 12px;">
                                ${timestamp}
                            </div>
                            <div style="margin-top: 10px;">
                                <button
                                    class="event-action-view-friend"
                                    data-peer-id="${friendApprEvent.data.remotePeerId}"
                                    style="
                                        background: #4169E1;
                                        border: 2px solid #3659C5;
                                        color: white;
                                        padding: 8px 16px;
                                        border-radius: 4px;
                                        cursor: pointer;
                                        font-weight: bold;
                                    ">
                                    View Friend
                                </button>
                            </div>
                        </div>
                        <button
                            class="event-remove-btn"
                            data-event-id="${event.id}"
                            title="Remove event"
                            style="
                                background: transparent;
                                border: none;
                                color: #8B7355;
                                font-size: 24px;
                                cursor: pointer;
                                padding: 0;
                                width: 30px;
                                height: 30px;
                                line-height: 1;
                            ">
                            💀
                        </button>
                    </div>
                </div>
            `;
        }

        // Fallback for unknown event types
        return `
            <div class="event-card" style="
                background: #3A2817;
                border: 2px solid #654321;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 15px;
                color: #F5DEB3;
            ">
                <div>Unknown event type: ${event.type}</div>
                <button
                    class="event-remove-btn"
                    data-event-id="${event.id}"
                    style="margin-top: 10px; background: #8B4513; border: 2px solid #654321; color: #F5DEB3; padding: 5px 10px; cursor: pointer;">
                    Remove
                </button>
            </div>
        `;
    }

    private attachEventCardListeners(): void {
        if (!this.modal) return;

        // Remove event buttons
        this.modal.querySelectorAll('.event-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const eventId = (e.currentTarget as HTMLElement).getAttribute('data-event-id');
                if (eventId) {
                    this.eventService.removeEvent(eventId);
                    console.log(`🗑️  Event ${eventId} removed`);
                }
            });
        });

        // Event action buttons are handled by SettingsView.setupEventCardHandlers()
        // via event delegation on document, so we don't need to attach them here
    }

    show(): void {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.updateEventList();
        }
    }

    hide(): void {
        if (this.modal) {
            this.modal.style.display = 'none';
        }
    }

    destroy(): void {
        if (this.modal) {
            this.modal.remove();
        }
        this.modal = null;
    }
}
