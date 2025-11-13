/**
 * World Settings Modal - Dialog for editing world settings
 *
 * CRC: crc-WorldSettingsModal.md
 * Spec: game-worlds.md (line 127)
 * Sequences:
 * - seq-edit-world-settings.md
 * UI Spec: ui-world-settings-modal.md
 */

import type { MudStorage, World } from '../textcraft/model.js';
import type { TemplateEngine } from '../utils/TemplateEngine.js';

/**
 * IWorldSettingsModal interface
 * CRC: crc-WorldSettingsModal.md
 */
export interface IWorldSettingsModal {
    show(worldId: string): Promise<void>;
    hide(): void;
    destroy(): void;
}

/**
 * WorldSettingsModal class - World settings editing dialog
 * CRC: crc-WorldSettingsModal.md
 */
export class WorldSettingsModal implements IWorldSettingsModal {
    private modal: HTMLDivElement | null = null;
    private mudStorage: MudStorage;
    private templateEngine: TemplateEngine;
    private worldId: string = '';
    private world: World | null = null;
    private editedName: string = '';
    private editedDescription: string = '';
    private allowedUsers: string[] = [];
    private originalName: string = '';
    private onSuccess?: () => void;

    constructor(mudStorage: MudStorage, templateEngine: TemplateEngine, onSuccess?: () => void) {
        this.mudStorage = mudStorage;
        this.templateEngine = templateEngine;
        this.onSuccess = onSuccess;
    }

    /**
     * show implementation - Display settings modal for specified world
     *
     * CRC: crc-WorldSettingsModal.md
     * Sequences:
     * - seq-edit-world-settings.md
     */
    async show(worldId: string): Promise<void> {
        this.worldId = worldId;

        // Load world data
        await this.loadWorld(worldId);

        // Render modal
        await this.render();

        if (!this.modal) {
            throw new Error('Failed to render world settings modal');
        }

        // Add to DOM
        document.body.appendChild(this.modal);

        // Show modal
        this.modal.style.display = 'flex';

        // Focus on name input
        const nameInput = this.modal.querySelector<HTMLInputElement>('#edit-world-name');
        nameInput?.focus();
    }

    /**
     * hide implementation - Close modal and remove overlay
     *
     * CRC: crc-WorldSettingsModal.md
     * Sequences:
     * - seq-edit-world-settings.md
     */
    hide(): void {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.remove();
            this.modal = null;
        }
        // Reset state
        this.worldId = '';
        this.world = null;
        this.editedName = '';
        this.editedDescription = '';
        this.allowedUsers = [];
        this.originalName = '';
    }

    /**
     * render implementation - Display form with name, description, user access controls
     *
     * CRC: crc-WorldSettingsModal.md
     * Sequences:
     * - seq-edit-world-settings.md
     */
    private async render(): Promise<void> {
        if (!this.world) {
            throw new Error('World not loaded');
        }

        // Prepare template data
        const data = {
            world: {
                name: this.editedName,
                description: this.editedDescription,
                allowedUsers: this.allowedUsers.map(peerId => ({
                    peerId,
                    userName: this.getUserName(peerId)
                }))
            }
        };

        // Load template
        const html = await this.templateEngine.renderTemplateFromFile('world-settings-modal', data);

        // Create container from template
        const temp = document.createElement('div');
        temp.innerHTML = html;
        this.modal = temp.firstElementChild as HTMLDivElement;

        // Setup event listeners
        this.attachEventListeners();
    }

    /**
     * loadWorld implementation - Fetch world data from storage
     *
     * CRC: crc-WorldSettingsModal.md
     * Sequences:
     * - seq-edit-world-settings.md
     */
    private async loadWorld(worldId: string): Promise<void> {
        // Open world from storage
        this.world = await this.mudStorage.openWorld(worldId);

        if (!this.world) {
            throw new Error(`World not found: ${worldId}`);
        }

        // Load current settings
        this.originalName = this.world.name || worldId;
        this.editedName = this.originalName;
        this.editedDescription = (this.world as any).description || '';
        this.allowedUsers = (this.world as any).allowedUsers || [];
    }

    /**
     * attachEventListeners implementation - Attach handlers for modal actions
     *
     * CRC: crc-WorldSettingsModal.md
     */
    private attachEventListeners(): void {
        if (!this.modal) return;

        // Close buttons
        const closeButtons = this.modal.querySelectorAll('[data-action="closeWorldSettingsModal"]');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.handleCancel();
            });
        });

        // Save button
        const saveButton = this.modal.querySelector('[data-action="saveWorldSettings"]');
        saveButton?.addEventListener('click', () => {
            this.handleSave();
        });

        // Remove user buttons
        const removeButtons = this.modal.querySelectorAll('[data-action="removeAllowedUser"]');
        removeButtons.forEach(btn => {
            const peerId = btn.getAttribute('data-peer-id');
            if (peerId) {
                btn.addEventListener('click', () => {
                    this.handleRemoveUser(peerId);
                });
            }
        });

        // Add user button
        const addButton = this.modal.querySelector('[data-action="showAddUserDialog"]');
        addButton?.addEventListener('click', () => {
            this.handleAddUser();
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
     * handleSave implementation - Validate and persist changes to world
     *
     * CRC: crc-WorldSettingsModal.md
     * Sequences:
     * - seq-edit-world-settings.md
     */
    private async handleSave(): Promise<void> {
        if (!this.modal || !this.world) return;

        // Get form values
        const nameInput = this.modal.querySelector<HTMLInputElement>('#edit-world-name');
        const descInput = this.modal.querySelector<HTMLTextAreaElement>('#edit-world-description');

        this.editedName = nameInput?.value.trim() || '';
        this.editedDescription = descInput?.value.trim() || '';

        // Validate settings
        const validationError = this.validateSettings();
        if (validationError) {
            this.showError(validationError);
            nameInput?.focus();
            return;
        }

        try {
            // Save changes if name changed
            if (this.editedName !== this.originalName) {
                await this.mudStorage.renameWorld(this.originalName, this.editedName);
            }

            // Save description and allowed users
            // TODO: Store description and allowedUsers in world metadata
            // For now, just log the changes
            console.log('World settings saved:', {
                name: this.editedName,
                description: this.editedDescription,
                allowedUsers: this.allowedUsers
            });

            // Close modal
            this.hide();

            // Notify success callback
            if (this.onSuccess) {
                this.onSuccess();
            }
        } catch (error) {
            console.error('Failed to save world settings:', error);
            this.showError(`Failed to save settings: ${error}`);
        }
    }

    /**
     * handleCancel implementation - Close modal without saving changes
     *
     * CRC: crc-WorldSettingsModal.md
     * Sequences:
     * - seq-edit-world-settings.md
     */
    private handleCancel(): void {
        this.hide();
    }

    /**
     * handleAddUser implementation - Add peer to allowed users list
     *
     * CRC: crc-WorldSettingsModal.md
     */
    private async handleAddUser(): Promise<void> {
        // TODO: Show friend picker dialog
        // For now, prompt for peer ID
        const peerId = prompt('Enter peer ID to add:');
        if (peerId && !this.allowedUsers.includes(peerId)) {
            this.allowedUsers.push(peerId);
            // Re-render to show updated list
            await this.render();
            if (this.modal) {
                document.body.appendChild(this.modal);
                this.modal.style.display = 'flex';
            }
        }
    }

    /**
     * handleRemoveUser implementation - Remove peer from allowed users list
     *
     * CRC: crc-WorldSettingsModal.md
     */
    private async handleRemoveUser(peerId: string): Promise<void> {
        const index = this.allowedUsers.indexOf(peerId);
        if (index !== -1) {
            this.allowedUsers.splice(index, 1);
            // Re-render to show updated list
            await this.render();
            if (this.modal) {
                document.body.appendChild(this.modal);
                this.modal.style.display = 'flex';
            }
        }
    }

    /**
     * validateSettings implementation - Ensure name is non-empty and unique
     *
     * CRC: crc-WorldSettingsModal.md
     * Sequences:
     * - seq-edit-world-settings.md
     */
    private validateSettings(): string | null {
        // Check if name is empty
        if (!this.editedName) {
            return 'World name is required';
        }

        // Check if name is unique (except for current world)
        if (this.editedName !== this.originalName && this.mudStorage.hasWorld(this.editedName)) {
            return `A world named "${this.editedName}" already exists`;
        }

        return null;
    }

    /**
     * getUserName implementation - Get friend name for peer ID
     *
     * CRC: crc-WorldSettingsModal.md
     */
    private getUserName(peerId: string): string {
        // TODO: Look up friend name from FriendsManager
        // For now, return truncated peer ID
        return peerId.substring(0, 8) + '...';
    }

    /**
     * showError implementation - Display inline error message
     *
     * CRC: crc-WorldSettingsModal.md
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
     * CRC: crc-WorldSettingsModal.md
     */
    destroy(): void {
        this.hide();
        this.onSuccess = undefined;
        this.world = null;
    }
}
