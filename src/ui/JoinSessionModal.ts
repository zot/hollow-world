/**
 * Join Session Modal - Dialog for joining multiplayer MUD sessions
 *
 * CRC: specs-crc/crc-JoinSessionModal.md
 * Spec: specs/game-worlds.md (line 138)
 * Sequences:
 * - specs-crc/seq-join-session.md
 * UI Spec: specs-ui/ui-join-session-modal.md
 */

import type { TemplateEngine } from '../utils/TemplateEngine.js';
import type { ICharacter } from '../character/types.js';

/**
 * IJoinSessionModal interface
 * CRC: specs-crc/crc-JoinSessionModal.md
 */
export interface IJoinSessionModal {
    show(): Promise<void>;
    hide(): void;
    destroy(): void;
}

/**
 * JoinSessionModal class - Multiplayer session join dialog
 * CRC: specs-crc/crc-JoinSessionModal.md
 */
export class JoinSessionModal implements IJoinSessionModal {
    private modal: HTMLDivElement | null = null;
    private templateEngine: TemplateEngine;
    private hostPeerId: string = '';
    private worldId: string = '';
    private selectedCharacter: ICharacter | null = null;
    private characters: ICharacter[] = [];
    private friends: Array<{peerId: string, name: string}> = [];
    private onSuccess?: (hostPeerId: string, characterId: string) => void;

    constructor(
        templateEngine: TemplateEngine,
        characters: ICharacter[],
        friends: Array<{peerId: string, name: string}> = [],
        onSuccess?: (hostPeerId: string, characterId: string) => void
    ) {
        this.templateEngine = templateEngine;
        this.characters = characters;
        this.friends = friends;
        this.onSuccess = onSuccess;
    }

    /**
     * show implementation - Display join session modal dialog
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     * Sequences:
     * - specs-crc/seq-join-session.md
     */
    async show(): Promise<void> {
        // Render modal
        await this.render();

        if (!this.modal) {
            throw new Error('Failed to render join session modal');
        }

        // Add to DOM
        document.body.appendChild(this.modal);

        // Show modal
        this.modal.style.display = 'flex';

        // Focus on peer ID input
        const peerInput = this.modal.querySelector<HTMLInputElement>('#host-peer-id');
        peerInput?.focus();
    }

    /**
     * hide implementation - Close modal and remove overlay
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     * Sequences:
     * - specs-crc/seq-join-session.md
     */
    hide(): void {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.remove();
            this.modal = null;
        }
        // Reset state
        this.hostPeerId = '';
        this.worldId = '';
        this.selectedCharacter = null;
    }

    /**
     * render implementation - Display form with host peer ID input, character selection
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     * Sequences:
     * - specs-crc/seq-join-session.md
     */
    private async render(): Promise<void> {
        // Prepare template data
        const data = {
            friends: this.friends,
            characters: this.characters
        };

        // Load template
        const html = await this.templateEngine.renderTemplateFromFile('join-session-modal', data);

        // Create container from template
        const temp = document.createElement('div');
        temp.innerHTML = html;
        this.modal = temp.firstElementChild as HTMLDivElement;

        // Setup event listeners
        this.attachEventListeners();
    }

    /**
     * attachEventListeners implementation - Attach handlers for modal actions
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     */
    private attachEventListeners(): void {
        if (!this.modal) return;

        // Close buttons
        const closeButtons = this.modal.querySelectorAll('[data-action="closeJoinSessionModal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleCancel();
            });
        });

        // Join button
        const joinButton = this.modal.querySelector('[data-action="joinSession"]');
        joinButton?.addEventListener('click', () => {
            this.handleJoin();
        });

        // Friend selector
        const friendSelector = this.modal.querySelector<HTMLSelectElement>('#friend-selector');
        friendSelector?.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            if (target.value) {
                const peerInput = this.modal?.querySelector<HTMLInputElement>('#host-peer-id');
                if (peerInput) {
                    peerInput.value = target.value;
                }
            }
        });

        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.handleCancel();
            }
        });

        // Close on ESC key
        const escHandler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.handleCancel();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    /**
     * handleJoin implementation - Validate inputs and initiate guest session connection
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     * Sequences:
     * - specs-crc/seq-join-session.md
     */
    private async handleJoin(): Promise<void> {
        if (!this.modal) return;

        // Get form values
        const peerInput = this.modal.querySelector<HTMLInputElement>('#host-peer-id');
        const characterSelect = this.modal.querySelector<HTMLSelectElement>('#character-select');

        this.hostPeerId = peerInput?.value.trim() || '';
        const characterId = characterSelect?.value || '';

        // Validate inputs
        const validationError = this.validateInputs();
        if (validationError) {
            this.showError(validationError);
            return;
        }

        try {
            // Show loading state
            this.setLoadingState(true);

            // Connect to host
            await this.connectToHost();

            // Close modal
            this.hide();

            // Notify success callback
            if (this.onSuccess) {
                this.onSuccess(this.hostPeerId, characterId);
            }
        } catch (error) {
            console.error('Failed to join session:', error);
            this.setLoadingState(false);
            this.showError(`Failed to connect: ${error}`);
        }
    }

    /**
     * handleCancel implementation - Close modal without joining session
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     * Sequences:
     * - specs-crc/seq-join-session.md
     */
    private handleCancel(): void {
        this.hide();
    }

    /**
     * validateInputs implementation - Ensure peer ID is valid format and character is selected
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     * Sequences:
     * - specs-crc/seq-join-session.md
     */
    private validateInputs(): string | null {
        // Check if peer ID is provided
        if (!this.hostPeerId) {
            return 'Host peer ID is required';
        }

        // Check if character is selected
        if (!this.modal) return 'Modal not initialized';

        const characterSelect = this.modal.querySelector<HTMLSelectElement>('#character-select');
        if (!characterSelect?.value) {
            return 'Please select a character';
        }

        // TODO: Validate peer ID format (length, valid characters, etc.)

        return null;
    }

    /**
     * connectToHost implementation - Establish P2P connection to host peer
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     * Sequences:
     * - specs-crc/seq-join-session.md
     */
    private async connectToHost(): Promise<void> {
        // TODO: Use HollowIPeer to connect to host
        // For now, just simulate connection
        console.log('Connecting to host:', this.hostPeerId);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // TODO: Actual P2P connection via HollowIPeer
        // throw new Error('Not yet implemented');
    }

    /**
     * setLoadingState implementation - Show/hide loading spinner
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     */
    private setLoadingState(loading: boolean): void {
        if (!this.modal) return;

        // Get state containers
        const formState = this.modal.querySelector('[data-state="form"]');
        const loadingState = this.modal.querySelector('[data-state="loading"]');
        const joinButton = this.modal.querySelector('[data-action="joinSession"]');
        const retryButton = this.modal.querySelector('[data-action="retryJoinSession"]');

        if (loading) {
            formState?.setAttribute('style', 'display: none;');
            loadingState?.setAttribute('style', 'display: block;');
            joinButton?.setAttribute('style', 'display: none;');
        } else {
            formState?.setAttribute('style', 'display: block;');
            loadingState?.setAttribute('style', 'display: none;');
            joinButton?.setAttribute('style', 'display: inline-block;');
            retryButton?.setAttribute('style', 'display: inline-block;');
        }
    }

    /**
     * showError implementation - Display inline error message
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     */
    private showError(message: string): void {
        if (!this.modal) return;

        // Remove existing error
        const existingError = this.modal.querySelector('.error-message');
        existingError?.remove();

        // Create error message
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        error.style.color = 'red';
        error.style.marginTop = '10px';

        // Insert before footer
        const footer = this.modal.querySelector('.modal-footer');
        footer?.parentNode?.insertBefore(error, footer);
    }

    /**
     * destroy implementation - Cleanup resources
     *
     * CRC: specs-crc/crc-JoinSessionModal.md
     */
    destroy(): void {
        this.hide();
        this.onSuccess = undefined;
        this.selectedCharacter = null;
        this.characters = [];
        this.friends = [];
    }
}
