/**
 * Session Controls - Host/Join/End session buttons for multiplayer
 *
 * CRC: specs-crc/crc-SessionControls.md
 * Spec: specs/game-worlds.md (lines 138-142)
 * Sequences:
 * - specs-crc/seq-host-session.md
 * - specs-crc/seq-join-session.md
 * UI Spec: specs-ui/ui-adventure-view.md (embedded)
 */

import type { TemplateEngine } from '../utils/TemplateEngine.js';

export type SessionMode = 'solo' | 'host' | 'guest';

/**
 * ISessionControls interface
 * CRC: specs-crc/crc-SessionControls.md
 */
export interface ISessionControls {
    render(): Promise<HTMLElement>;
    updateDisplay(): void;
    setSessionMode(mode: SessionMode): void;
    destroy(): void;
}

/**
 * SessionControls class - Session mode control buttons
 * CRC: specs-crc/crc-SessionControls.md
 */
export class SessionControls implements ISessionControls {
    private container: HTMLElement | null = null;
    private sessionMode: SessionMode = 'solo';
    private templateEngine: TemplateEngine;
    private onHostSession?: () => void;
    private onJoinSession?: () => void;
    private onEndSession?: () => void;

    constructor(
        templateEngine: TemplateEngine,
        onHostSession?: () => void,
        onJoinSession?: () => void,
        onEndSession?: () => void
    ) {
        this.templateEngine = templateEngine;
        this.onHostSession = onHostSession;
        this.onJoinSession = onJoinSession;
        this.onEndSession = onEndSession;
    }

    /**
     * render implementation - Display session control buttons based on current mode
     *
     * CRC: specs-crc/crc-SessionControls.md
     */
    async render(): Promise<HTMLElement> {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'adventure-session-controls';

        // Render buttons based on mode
        await this.updateDisplay();

        return this.container;
    }

    /**
     * updateDisplay implementation - Refresh buttons when session mode changes
     *
     * CRC: specs-crc/crc-SessionControls.md
     */
    async updateDisplay(): Promise<void> {
        if (!this.container) return;

        // Render based on mode
        let html = '';
        if (this.sessionMode === 'solo') {
            html = await this.renderSoloControls();
        } else if (this.sessionMode === 'host') {
            html = await this.renderHostControls();
        } else if (this.sessionMode === 'guest') {
            html = await this.renderGuestControls();
        }

        // Update container with rendered HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;

        // Clear and replace content
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        while (temp.firstChild) {
            this.container.appendChild(temp.firstChild);
        }

        // Attach event listeners
        this.attachEventListeners();
    }

    /**
     * setSessionMode implementation - Update session mode and refresh display
     *
     * CRC: specs-crc/crc-SessionControls.md
     */
    setSessionMode(mode: SessionMode): void {
        this.sessionMode = mode;
        this.updateDisplay();
    }

    /**
     * renderSoloControls implementation - Show Host/Join buttons
     *
     * CRC: specs-crc/crc-SessionControls.md
     * Sequences:
     * - specs-crc/seq-host-session.md
     * - specs-crc/seq-join-session.md
     */
    private async renderSoloControls(): Promise<string> {
        return await this.templateEngine.renderTemplateFromFile('session-controls-solo', {});
    }

    /**
     * renderHostControls implementation - Show connection info with copy button
     *
     * CRC: specs-crc/crc-SessionControls.md
     * Sequences:
     * - specs-crc/seq-host-session.md
     */
    private async renderHostControls(): Promise<string> {
        // TODO: Get actual peer ID from HollowIPeer
        const connectionString = 'your-peer-id-here';

        return await this.templateEngine.renderTemplateFromFile('session-controls-host', {
            connectionString
        });
    }

    /**
     * renderGuestControls implementation - Show end session button only
     *
     * CRC: specs-crc/crc-SessionControls.md
     */
    private async renderGuestControls(): Promise<string> {
        return await this.templateEngine.renderTemplateFromFile('session-controls-guest', {});
    }

    /**
     * attachEventListeners implementation - Attach handlers for control buttons
     *
     * CRC: specs-crc/crc-SessionControls.md
     */
    private attachEventListeners(): void {
        if (!this.container) return;

        // Host session button
        const hostButton = this.container.querySelector('[data-action="hostSession"]');
        hostButton?.addEventListener('click', () => {
            this.handleHostSession();
        });

        // Join session button
        const joinButton = this.container.querySelector('[data-action="joinSession"]');
        joinButton?.addEventListener('click', () => {
            this.handleJoinSession();
        });

        // End session button
        const endButton = this.container.querySelector('[data-action="endSession"]');
        endButton?.addEventListener('click', () => {
            this.handleEndSession();
        });

        // Copy connection button
        const copyButton = this.container.querySelector('[data-action="copyConnection"]');
        copyButton?.addEventListener('click', () => {
            this.handleCopyConnection();
        });
    }

    /**
     * handleHostSession implementation - Switch from solo to host mode
     *
     * CRC: specs-crc/crc-SessionControls.md
     * Sequences:
     * - specs-crc/seq-host-session.md
     */
    private handleHostSession(): void {
        if (this.onHostSession) {
            this.onHostSession();
        }
    }

    /**
     * handleJoinSession implementation - Open JoinSessionModal for guest mode
     *
     * CRC: specs-crc/crc-SessionControls.md
     * Sequences:
     * - specs-crc/seq-join-session.md
     */
    private handleJoinSession(): void {
        if (this.onJoinSession) {
            this.onJoinSession();
        }
    }

    /**
     * handleEndSession implementation - Return to solo mode from host/guest
     *
     * CRC: specs-crc/crc-SessionControls.md
     */
    private handleEndSession(): void {
        if (this.onEndSession) {
            this.onEndSession();
        }
    }

    /**
     * handleCopyConnection implementation - Copy connection string to clipboard
     *
     * CRC: specs-crc/crc-SessionControls.md
     */
    private async handleCopyConnection(): Promise<void> {
        if (!this.container) return;

        const connectionString = this.container.querySelector<HTMLElement>('.connection-string');
        if (connectionString) {
            try {
                await navigator.clipboard.writeText(connectionString.textContent || '');
                // TODO: Show success feedback
                console.log('Connection string copied to clipboard');
            } catch (error) {
                console.error('Failed to copy connection string:', error);
            }
        }
    }

    /**
     * destroy implementation - Cleanup resources
     *
     * CRC: specs-crc/crc-SessionControls.md
     */
    destroy(): void {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
        this.onHostSession = undefined;
        this.onJoinSession = undefined;
        this.onEndSession = undefined;
    }
}
