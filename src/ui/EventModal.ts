/**
 * Event Modal - Displays event cards with actions
 */

import type { EventService, IEvent, IFriendRequestEvent, IFriendDeclinedEvent } from '../services/EventService';
import type { HollowPeer } from '../p2p/HollowPeer';
import '../styles/EventModal.css';

export interface IEventModal {
    render(): Promise<HTMLElement>;
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

    async render(): Promise<HTMLElement> {
        // Load template
        const { TemplateEngine } = await import('../utils/TemplateEngine.js');
        const templateEngine = new TemplateEngine();
        const html = await templateEngine.renderTemplateFromFile('event-modal', {});

        // Create container from template
        const temp = document.createElement('div');
        temp.innerHTML = html;
        this.modal = temp.firstElementChild as HTMLDivElement;

        // Setup event listeners
        const closeBtn = this.modal.querySelector('.event-modal-close');
        closeBtn?.addEventListener('click', () => {
            this.hide();
        });

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

    private async updateEventList(): Promise<void> {
        if (!this.modal) return;

        const eventList = this.modal.querySelector('.event-list');
        if (!eventList) return;

        const events = this.eventService.getEvents();

        if (events.length === 0) {
            eventList.innerHTML = `
                <div class="no-events">
                    <p>No events</p>
                </div>
            `;
            return;
        }

        // Render event cards asynchronously
        const cardPromises = events.map(event => this.renderEventCard(event));
        const cards = await Promise.all(cardPromises);
        eventList.innerHTML = cards.join('');

        // Attach event listeners
        this.attachEventCardListeners();
    }

    private async renderEventCard(event: IEvent): Promise<string> {
        const timestamp = new Date(event.timestamp).toLocaleString();
        const { TemplateEngine } = await import('../utils/TemplateEngine.js');
        const templateEngine = new TemplateEngine();

        if (event.type === 'friendRequest') {
            const friendReqEvent = event as IFriendRequestEvent;
            const truncatedPeerId = friendReqEvent.data.remotePeerId.substring(0, 20) + '...';
            
            return await templateEngine.renderTemplateFromFile('event-card-friend-request', {
                eventId: event.id,
                playerName: friendReqEvent.data.playerName,
                remotePeerId: friendReqEvent.data.remotePeerId,
                truncatedPeerId: truncatedPeerId,
                timestamp: timestamp
            });
        }

        if (event.type === 'friendDeclined') {
            const friendDeclinedEvent = event as IFriendDeclinedEvent;
            
            return await templateEngine.renderTemplateFromFile('event-card-friend-declined', {
                eventId: event.id,
                playerName: friendDeclinedEvent.data.playerName,
                timestamp: timestamp
            });
        }

        // Fallback for unknown event types
        return `
            <div class="event-card">
                <div class="event-card-message">Unknown event type: ${event.type}</div>
                <button
                    class="event-remove-btn"
                    data-event-id="${event.id}"
                    style="margin-top: 10px;">
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
