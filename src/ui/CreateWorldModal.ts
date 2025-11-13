/**
 * Create World Modal - Dialog for creating new MUD worlds
 *
 * CRC: specs-crc/crc-CreateWorldModal.md
 * Spec: specs/game-worlds.md (lines 126-128)
 * Sequences:
 * - specs-crc/seq-create-world.md
 * UI Spec: specs-ui/ui-create-world-modal.md
 */

import type { MudStorage } from '../textcraft/model.js';
import type { TemplateEngine } from '../utils/TemplateEngine.js';

/**
 * ICreateWorldModal interface
 * CRC: specs-crc/crc-CreateWorldModal.md
 */
export interface ICreateWorldModal {
    show(): Promise<void>;
    hide(): void;
    destroy(): void;
}

/**
 * CreateWorldModal class - New world creation dialog
 * CRC: specs-crc/crc-CreateWorldModal.md
 */
export class CreateWorldModal implements ICreateWorldModal {
    private modal: HTMLDivElement | null = null;
    private mudStorage: MudStorage;
    private templateEngine: TemplateEngine;
    private worldName: string = '';
    private worldDescription: string = '';
    private isYamlImport: boolean = false;
    private yamlFile: File | null = null;
    private onSuccess?: (worldName: string) => void;

    constructor(mudStorage: MudStorage, templateEngine: TemplateEngine, onSuccess?: (worldName: string) => void) {
        this.mudStorage = mudStorage;
        this.templateEngine = templateEngine;
        this.onSuccess = onSuccess;
    }

    /**
     * show implementation - Display create world modal dialog
     *
     * CRC: specs-crc/crc-CreateWorldModal.md
     * Sequences:
     * - specs-crc/seq-create-world.md
     */
    async show(): Promise<void> {
        // Render modal
        await this.render();

        if (!this.modal) {
            throw new Error('Failed to render create world modal');
        }

        // Add to DOM
        document.body.appendChild(this.modal);

        // Show modal
        this.modal.style.display = 'flex';

        // Focus on name input
        const nameInput = this.modal.querySelector<HTMLInputElement>('#world-name');
        nameInput?.focus();
    }

    /**
     * hide implementation - Close modal and remove overlay
     *
     * CRC: specs-crc/crc-CreateWorldModal.md
     * Sequences:
     * - specs-crc/seq-create-world.md
     */
    hide(): void {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.remove();
            this.modal = null;
        }
        // Reset state
        this.worldName = '';
        this.worldDescription = '';
        this.isYamlImport = false;
        this.yamlFile = null;
    }

    /**
     * render implementation - Display form with name, description, YAML option
     *
     * CRC: specs-crc/crc-CreateWorldModal.md
     * Sequences:
     * - specs-crc/seq-create-world.md
     */
    private async render(): Promise<void> {
        // Load template
        const html = await this.templateEngine.renderTemplateFromFile('create-world-modal', {});

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
     * CRC: specs-crc/crc-CreateWorldModal.md
     */
    private attachEventListeners(): void {
        if (!this.modal) return;

        // Close buttons
        const closeButtons = this.modal.querySelectorAll('[data-action="closeCreateWorldModal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleCancel();
            });
        });

        // Create world button
        const createButton = this.modal.querySelector('[data-action="createWorld"]');
        createButton?.addEventListener('click', () => {
            this.handleCreate();
        });

        // Toggle YAML import
        const yamlToggle = this.modal.querySelector('[data-action="toggleYamlImport"]');
        yamlToggle?.addEventListener('change', (e) => {
            this.handleYamlSelect(e as Event);
        });

        // YAML file input
        const fileInput = this.modal.querySelector<HTMLInputElement>('#yaml-file-input');
        fileInput?.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
                this.yamlFile = target.files[0];
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
     * handleCreate implementation - Validate input and create new world with default settings
     *
     * CRC: specs-crc/crc-CreateWorldModal.md
     * Sequences:
     * - specs-crc/seq-create-world.md
     */
    private async handleCreate(): Promise<void> {
        if (!this.modal) return;

        // Get form values
        const nameInput = this.modal.querySelector<HTMLInputElement>('#world-name');
        const descInput = this.modal.querySelector<HTMLTextAreaElement>('#world-description');

        this.worldName = nameInput?.value.trim() || '';
        this.worldDescription = descInput?.value.trim() || '';

        // Validate world name
        if (!this.worldName) {
            this.showError('World name is required');
            nameInput?.focus();
            return;
        }

        // Check if world name is unique
        if (this.mudStorage.hasWorld(this.worldName)) {
            this.showError(`A world named "${this.worldName}" already exists`);
            nameInput?.focus();
            return;
        }

        try {
            // Create world
            if (this.isYamlImport && this.yamlFile) {
                await this.importYamlWorld(this.yamlFile);
            } else {
                await this.createDefaultWorld();
            }

            // Close modal
            this.hide();

            // Notify success callback
            if (this.onSuccess) {
                this.onSuccess(this.worldName);
            }
        } catch (error) {
            console.error('Failed to create world:', error);
            this.showError(`Failed to create world: ${error}`);
        }
    }

    /**
     * handleCancel implementation - Close modal without creating world
     *
     * CRC: specs-crc/crc-CreateWorldModal.md
     * Sequences:
     * - specs-crc/seq-create-world.md
     */
    private handleCancel(): void {
        this.hide();
    }

    /**
     * handleYamlSelect implementation - Allow user to select YAML file for import
     *
     * CRC: specs-crc/crc-CreateWorldModal.md
     */
    private handleYamlSelect(event: Event): void {
        if (!this.modal) return;

        const checkbox = event.target as HTMLInputElement;
        this.isYamlImport = checkbox.checked;

        const fileInput = this.modal.querySelector<HTMLInputElement>('#yaml-file-input');
        if (fileInput) {
            fileInput.style.display = this.isYamlImport ? 'block' : 'none';
        }
    }

    /**
     * createDefaultWorld implementation - Create blank world with minimal starter content
     *
     * CRC: specs-crc/crc-CreateWorldModal.md
     * Sequences:
     * - specs-crc/seq-create-world.md
     */
    private async createDefaultWorld(): Promise<void> {
        // Create world using MudStorage.openWorld (creates if doesn't exist)
        const world = await this.mudStorage.openWorld(this.worldName);

        if (!world) {
            throw new Error('Failed to create world');
        }

        // Set world info/metadata if needed
        // World is automatically saved by openWorld
    }

    /**
     * importYamlWorld implementation - Parse YAML and create world from file
     *
     * CRC: specs-crc/crc-CreateWorldModal.md
     */
    private async importYamlWorld(file: File): Promise<void> {
        // Read YAML file
        const yamlText = await file.text();

        // TODO: Parse YAML and import world data
        // This requires integration with TextCraft's YAML import functionality
        // For now, just create a default world
        console.warn('YAML import not yet implemented, creating default world instead');

        await this.createDefaultWorld();
    }

    /**
     * showError implementation - Display inline error message
     *
     * CRC: specs-crc/crc-CreateWorldModal.md
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
     * CRC: specs-crc/crc-CreateWorldModal.md
     */
    destroy(): void {
        this.hide();
        this.onSuccess = undefined;
        this.yamlFile = null;
    }
}
