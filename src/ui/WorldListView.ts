/**
 * World List View - World management interface (list, create, edit, delete)
 *
 * CRC: specs-crc/crc-WorldListView.md
 * Spec: specs/game-worlds.md (lines 110-136)
 * Sequences:
 * - specs-crc/seq-start-adventure-mode.md
 * - specs-crc/seq-select-world.md
 * - specs-crc/seq-create-world.md
 * - specs-crc/seq-edit-world-settings.md
 * - specs-crc/seq-delete-world.md
 * - specs-crc/seq-switch-to-world-list.md
 * UI Spec: specs-ui/ui-world-list-view.md
 */

import type { MudStorage } from '../textcraft/model.js';
import type { TemplateEngine } from '../utils/TemplateEngine.js';
import type { Router } from '../utils/Router.js';
import { CreateWorldModal } from './CreateWorldModal.js';
import { WorldSettingsModal } from './WorldSettingsModal.js';
import { DeleteWorldModal } from './DeleteWorldModal.js';

/**
 * IWorldListView interface
 * CRC: specs-crc/crc-WorldListView.md
 */
export interface IWorldListView {
    render(): Promise<HTMLElement>;
    show(): void;
    hide(): void;
    loadWorlds(): Promise<void>;
    refresh(): Promise<void>;
    cleanup(): void;
}

/**
 * IAdventureModeQuery interface - For querying active world state
 * Minimal interface to avoid circular dependencies
 */
export interface IAdventureModeQuery {
    getActiveWorldId(): string | null;
}

/**
 * WorldListView class - World management view
 * CRC: specs-crc/crc-WorldListView.md
 */
export class WorldListView implements IWorldListView {
    private container: HTMLElement | null = null;
    private mudStorage: MudStorage;
    private templateEngine: TemplateEngine;
    private router: Router;
    private worlds: string[] = [];
    private selectedWorldId: string = '';
    private createWorldModal: CreateWorldModal;
    private worldSettingsModal: WorldSettingsModal;
    private deleteWorldModal: DeleteWorldModal;
    private onWorldSelected?: (worldId: string) => void;
    private adventureMode?: IAdventureModeQuery;
    private switchWorldTargetId: string = ''; // Target world when switching

    constructor(
        mudStorage: MudStorage,
        templateEngine: TemplateEngine,
        router: Router,
        onWorldSelected?: (worldId: string) => void,
        adventureMode?: IAdventureModeQuery
    ) {
        this.mudStorage = mudStorage;
        this.templateEngine = templateEngine;
        this.router = router;
        this.onWorldSelected = onWorldSelected;
        this.adventureMode = adventureMode;

        // Create modals
        this.createWorldModal = new CreateWorldModal(mudStorage, templateEngine, () => {
            this.loadWorlds();
        });
        this.worldSettingsModal = new WorldSettingsModal(mudStorage, templateEngine, () => {
            this.loadWorlds();
        });
        this.deleteWorldModal = new DeleteWorldModal(mudStorage, templateEngine, () => {
            this.loadWorlds();
        });
    }

    /**
     * render implementation - Display world list overlay with header and world items
     *
     * CRC: specs-crc/crc-WorldListView.md
     * Sequences:
     * - specs-crc/seq-start-adventure-mode.md
     * - specs-crc/seq-switch-to-world-list.md
     */
    async render(): Promise<HTMLElement> {
        // Load worlds
        await this.loadWorlds();

        // Get active world ID
        const activeWorldId = this.adventureMode?.getActiveWorldId() || null;

        // Prepare world data with active indicator
        const worldData = this.worlds.map(worldId => ({
            worldId,
            worldName: worldId,
            isActive: worldId === activeWorldId
        }));

        // Render template
        const html = await this.templateEngine.renderTemplateFromFile('world-list-view', {
            worlds: worldData,
            hasActiveWorld: activeWorldId !== null,
            activeWorldId
        });

        // Create container
        const temp = document.createElement('div');
        temp.innerHTML = html;
        this.container = temp.firstElementChild as HTMLElement;

        // Attach event listeners
        this.attachEventListeners();

        // Render world items dynamically (for better control over active indicator)
        await this.renderWorldItems();

        return this.container;
    }

    /**
     * refresh implementation - Re-render world list to update active indicator
     *
     * CRC: specs-crc/crc-WorldListView.md
     * Spec: specs-ui/ui-world-list-view.md
     */
    async refresh(): Promise<void> {
        if (!this.container) return;

        // Re-render world items
        await this.renderWorldItems();
    }

    /**
     * renderWorldItems implementation - Render individual world items into container
     *
     * CRC: specs-crc/crc-WorldListView.md
     * UI Spec: specs-ui/ui-world-list-view.md
     */
    private async renderWorldItems(): Promise<void> {
        if (!this.container) return;

        const worldListContainer = this.container.querySelector('#world-list-container');
        if (!worldListContainer) return;

        // Get active world ID
        const activeWorldId = this.adventureMode?.getActiveWorldId() || null;

        // Clear existing items
        worldListContainer.innerHTML = '';

        // Render each world item
        for (const worldId of this.worlds) {
            const isActive = (worldId === activeWorldId);

            const worldItem = document.createElement('div');
            worldItem.className = `world-list-item${isActive ? ' world-list-item--active' : ''}`;
            worldItem.setAttribute('data-world-id', worldId);

            worldItem.innerHTML = `
                <button class="adventure-btn world-item-start-btn" data-action="startWorld" data-world-id="${worldId}">⭐</button>
                <div class="world-item-name">
                    ${worldId}
                    ${isActive ? '<span class="world-item-active-indicator">⚡</span>' : ''}
                </div>
                <button class="adventure-btn world-item-edit-btn" data-action="editWorld" data-world-id="${worldId}">⚙️ Edit</button>
                <button class="adventure-btn world-item-delete-btn" data-action="deleteWorld" data-world-id="${worldId}" data-world-name="${worldId}">💀 Delete</button>
            `;

            worldListContainer.appendChild(worldItem);
        }

        // Re-attach event listeners for world items
        this.attachEventListeners();
    }

    /**
     * show implementation - Display world list overlay
     *
     * CRC: specs-crc/crc-WorldListView.md
     */
    show(): void {
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * hide implementation - Hide world list overlay
     *
     * CRC: specs-crc/crc-WorldListView.md
     */
    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * loadWorlds implementation - Fetch all worlds from MudStorage
     *
     * CRC: specs-crc/crc-WorldListView.md
     * Sequences:
     * - specs-crc/seq-start-adventure-mode.md
     */
    async loadWorlds(): Promise<void> {
        this.worlds = this.mudStorage.worlds || [];
    }

    /**
     * attachEventListeners implementation - Attach handlers for world list actions
     *
     * CRC: specs-crc/crc-WorldListView.md
     */
    private attachEventListeners(): void {
        if (!this.container) return;

        // New world button
        const newWorldBtn = this.container.querySelector('[data-action="createWorld"]');
        newWorldBtn?.addEventListener('click', () => {
            this.handleNewWorld();
        });

        // World item buttons
        const startButtons = this.container.querySelectorAll('[data-action="startWorld"]');
        startButtons.forEach(btn => {
            const worldId = btn.getAttribute('data-world-id');
            if (worldId) {
                btn.addEventListener('click', () => {
                    this.handleStartWorld(worldId);
                });
            }
        });

        const editButtons = this.container.querySelectorAll('[data-action="editWorld"]');
        editButtons.forEach(btn => {
            const worldId = btn.getAttribute('data-world-id');
            if (worldId) {
                btn.addEventListener('click', () => {
                    this.handleEditWorld(worldId);
                });
            }
        });

        const deleteButtons = this.container.querySelectorAll('[data-action="deleteWorld"]');
        deleteButtons.forEach(btn => {
            const worldId = btn.getAttribute('data-world-id');
            const worldName = btn.getAttribute('data-world-name');
            if (worldId && worldName) {
                btn.addEventListener('click', () => {
                    this.handleDeleteWorld(worldId, worldName);
                });
            }
        });
    }

    /**
     * handleStartWorld implementation - Load world and navigate to adventure view
     *
     * CRC: specs-crc/crc-WorldListView.md
     * Sequences:
     * - specs-crc/seq-select-world.md
     * Spec: specs-ui/ui-world-list-view.md (Start Button Behavior)
     *
     * Behavior:
     * - If no active world: Activate and navigate to world
     * - If clicking active world: Navigate to world (no reset)
     * - If clicking different world when one is active: Show confirmation modal
     */
    private handleStartWorld(worldId: string): void {
        this.selectedWorldId = worldId;

        // Check if switching from a different active world
        const activeWorldId = this.adventureMode?.getActiveWorldId() || null;

        if (activeWorldId && activeWorldId !== worldId) {
            // Switching worlds - show confirmation modal
            this.switchWorldTargetId = worldId;
            this.showSwitchWorldConfirmation(activeWorldId, worldId);
            return;
        }

        // No active world, or clicking active world - proceed normally
        this.proceedToWorld(worldId);
    }

    /**
     * proceedToWorld implementation - Navigate to world (after confirmation if needed)
     *
     * CRC: specs-crc/crc-WorldListView.md
     */
    private proceedToWorld(worldId: string): void {
        // Notify callback
        if (this.onWorldSelected) {
            this.onWorldSelected(worldId);
        }

        // Navigate to adventure view
        this.router.navigate(`/world/${worldId}`);
    }

    /**
     * showSwitchWorldConfirmation implementation - Show modal warning before switching worlds
     *
     * CRC: specs-crc/crc-WorldListView.md
     * UI Spec: specs-ui/ui-world-list-view.md (Switch World Confirmation Modal)
     */
    private showSwitchWorldConfirmation(currentWorldId: string, targetWorldId: string): void {
        // Create modal container
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'switch-world-modal-overlay';
        modalOverlay.innerHTML = `
            <div class="switch-world-modal">
                <div class="switch-world-modal-content">
                    <h3 class="switch-world-modal-title">Switch Worlds?</h3>
                    <p class="switch-world-modal-message">
                        Switching worlds will end your current session in "${currentWorldId}".
                    </p>
                    <p class="switch-world-modal-question">Continue?</p>
                    <div class="switch-world-modal-actions">
                        <button class="modal-btn modal-btn--cancel" data-action="cancelSwitch">Cancel</button>
                        <button class="modal-btn modal-btn--confirm" data-action="confirmSwitch">Continue</button>
                    </div>
                </div>
            </div>
        `;

        // Add modal to container
        this.container?.appendChild(modalOverlay);

        // Attach event listeners
        const cancelBtn = modalOverlay.querySelector('[data-action="cancelSwitch"]');
        const confirmBtn = modalOverlay.querySelector('[data-action="confirmSwitch"]');

        cancelBtn?.addEventListener('click', () => {
            modalOverlay.remove();
        });

        confirmBtn?.addEventListener('click', () => {
            modalOverlay.remove();
            // Proceed to target world (AdventureMode will terminate current world)
            this.proceedToWorld(this.switchWorldTargetId);
        });

        // Close on Escape key
        const handleEscape = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') {
                modalOverlay.remove();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * handleNewWorld implementation - Open create world modal
     *
     * CRC: specs-crc/crc-WorldListView.md
     * Sequences:
     * - specs-crc/seq-create-world.md
     */
    private async handleNewWorld(): Promise<void> {
        await this.createWorldModal.show();
    }

    /**
     * handleEditWorld implementation - Open world settings modal
     *
     * CRC: specs-crc/crc-WorldListView.md
     * Sequences:
     * - specs-crc/seq-edit-world-settings.md
     */
    private async handleEditWorld(worldId: string): Promise<void> {
        await this.worldSettingsModal.show(worldId);
    }

    /**
     * handleDeleteWorld implementation - Open delete confirmation modal
     *
     * CRC: specs-crc/crc-WorldListView.md
     * Sequences:
     * - specs-crc/seq-delete-world.md
     */
    private async handleDeleteWorld(worldId: string, worldName: string): Promise<void> {
        await this.deleteWorldModal.show(worldId, worldName);
    }

    /**
     * cleanup implementation - Dispose of resources
     *
     * CRC: specs-crc/crc-WorldListView.md
     */
    cleanup(): void {
        this.createWorldModal.destroy();
        this.worldSettingsModal.destroy();
        this.deleteWorldModal.destroy();

        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        this.onWorldSelected = undefined;
    }
}
