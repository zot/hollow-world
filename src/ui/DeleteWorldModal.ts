/**
 * Delete World Modal - Confirmation dialog for deleting MUD worlds
 *
 * CRC: specs-crc/crc-DeleteWorldModal.md
 * Spec: specs/game-worlds.md (line 127)
 * Sequences:
 * - specs-crc/seq-delete-world.md
 * UI Spec: specs-ui/ui-delete-world-modal.md
 */

import type { MudStorage } from '../textcraft/model.js';
import type { TemplateEngine } from '../utils/TemplateEngine.js';

/**
 * IDeleteWorldModal interface
 * CRC: specs-crc/crc-DeleteWorldModal.md
 */
export interface IDeleteWorldModal {
    show(worldId: string, worldName: string): Promise<void>;
    hide(): void;
    destroy(): void;
}

/**
 * DeleteWorldModal class - World deletion confirmation modal
 * CRC: specs-crc/crc-DeleteWorldModal.md
 */
export class DeleteWorldModal implements IDeleteWorldModal {
    private modal: HTMLDivElement | null = null;
    private mudStorage: MudStorage;
    private templateEngine: TemplateEngine;
    private worldId: string = '';
    private worldName: string = '';
    private onSuccess?: () => void;

    constructor(mudStorage: MudStorage, templateEngine: TemplateEngine, onSuccess?: () => void) {
        this.mudStorage = mudStorage;
        this.templateEngine = templateEngine;
        this.onSuccess = onSuccess;
    }

    /**
     * show implementation - Display delete confirmation modal
     *
     * CRC: specs-crc/crc-DeleteWorldModal.md
     * Sequences:
     * - specs-crc/seq-delete-world.md
     */
    async show(worldId: string, worldName: string): Promise<void> {
        this.worldId = worldId;
        this.worldName = worldName;

        // Render modal
        await this.render();

        if (!this.modal) {
            throw new Error('Failed to render delete world modal');
        }

        // Add to DOM
        document.body.appendChild(this.modal);

        // Show modal
        this.modal.style.display = 'flex';
    }

    /**
     * hide implementation - Close modal and remove overlay
     *
     * CRC: specs-crc/crc-DeleteWorldModal.md
     * Sequences:
     * - specs-crc/seq-delete-world.md
     */
    hide(): void {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.remove();
            this.modal = null;
        }
    }

    /**
     * render implementation - Display confirmation message with world name
     *
     * CRC: specs-crc/crc-DeleteWorldModal.md
     * Sequences:
     * - specs-crc/seq-delete-world.md
     */
    private async render(): Promise<void> {
        // Load template
        const html = await this.templateEngine.renderTemplateFromFile('delete-world-modal', {
            worldName: this.worldName,
            worldId: this.worldId
        });

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
     * CRC: specs-crc/crc-DeleteWorldModal.md
     */
    private attachEventListeners(): void {
        if (!this.modal) return;

        // Close buttons
        const closeButtons = this.modal.querySelectorAll('[data-action="closeDeleteWorldModal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleCancel();
            });
        });

        // Confirm delete button
        const confirmButton = this.modal.querySelector('[data-action="confirmDeleteWorld"]');
        confirmButton?.addEventListener('click', () => {
            this.handleConfirmDelete();
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
     * handleConfirmDelete implementation - Delete world from storage
     *
     * CRC: specs-crc/crc-DeleteWorldModal.md
     * Sequences:
     * - specs-crc/seq-delete-world.md
     */
    private async handleConfirmDelete(): Promise<void> {
        try {
            // Delete world from MudStorage
            await this.mudStorage.deleteWorld(this.worldName);

            // Close modal
            this.hide();

            // Notify success callback
            if (this.onSuccess) {
                this.onSuccess();
            }
        } catch (error) {
            console.error('Failed to delete world:', error);
            // TODO: Show error message to user
            alert(`Failed to delete world: ${error}`);
        }
    }

    /**
     * handleCancel implementation - Close modal without deleting world
     *
     * CRC: specs-crc/crc-DeleteWorldModal.md
     * Sequences:
     * - specs-crc/seq-delete-world.md
     */
    private handleCancel(): void {
        this.hide();
    }

    /**
     * destroy implementation - Cleanup resources
     *
     * CRC: specs-crc/crc-DeleteWorldModal.md
     */
    destroy(): void {
        this.hide();
        this.onSuccess = undefined;
    }
}
