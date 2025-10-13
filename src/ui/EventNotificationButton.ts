/**
 * Event Notification Button - Shows pending events count with bugle icon
 */

import type { EventService } from '../services/EventService';

export interface IEventNotificationButton {
    render(): HTMLElement;
    destroy(): void;
    updateCount(): void;
}

export class EventNotificationButton implements IEventNotificationButton {
    private button: HTMLButtonElement | null = null;
    private badge: HTMLSpanElement | null = null;
    private eventService: EventService;
    private onClickHandler: () => void;

    constructor(eventService: EventService, onClickHandler: () => void) {
        this.eventService = eventService;
        this.onClickHandler = onClickHandler;

        // Listen for event changes
        this.eventService.onChange(() => {
            this.updateCount();
        });
    }

    render(): HTMLElement {
        // Create button container
        const container = document.createElement('div');
        container.className = 'event-notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        `;

        // Create button
        this.button = document.createElement('button');
        this.button.className = 'event-notification-btn';
        this.button.innerHTML = '📯'; // Bugle emoji
        this.button.title = 'View Events';
        this.button.style.cssText = `
            position: relative;
            background: #8B4513;
            border: 2px solid #654321;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            font-size: 28px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            transition: all 0.2s ease;
        `;

        // Hover effect
        this.button.addEventListener('mouseenter', () => {
            if (this.button) {
                this.button.style.transform = 'scale(1.1)';
                this.button.style.boxShadow = '0 6px 12px rgba(0,0,0,0.4)';
            }
        });

        this.button.addEventListener('mouseleave', () => {
            if (this.button) {
                this.button.style.transform = 'scale(1)';
                this.button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
            }
        });

        // Click handler
        this.button.addEventListener('click', () => {
            this.onClickHandler();
        });

        // Create badge for count
        this.badge = document.createElement('span');
        this.badge.className = 'event-notification-badge';
        this.badge.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: #DC143C;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;

        this.button.appendChild(this.badge);
        container.appendChild(this.button);

        // Initial count update
        this.updateCount();

        // Hide if no events
        const events = this.eventService.getEvents();
        if (events.length === 0) {
            container.style.display = 'none';
        }

        return container;
    }

    updateCount(): void {
        const events = this.eventService.getEvents();
        const count = events.length;

        if (this.badge) {
            this.badge.textContent = count.toString();
        }

        // Show/hide button based on event count
        if (this.button && this.button.parentElement) {
            this.button.parentElement.style.display = count > 0 ? 'block' : 'none';
        }
    }

    destroy(): void {
        if (this.button && this.button.parentElement) {
            this.button.parentElement.remove();
        }
        this.button = null;
        this.badge = null;
    }
}
