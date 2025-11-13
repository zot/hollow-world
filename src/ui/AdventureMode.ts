/**
 * Adventure Mode - Coordinator managing world list and adventure views
 *
 * CRC: crc-AdventureMode.md
 * Spec: game-worlds.md (lines 66-73)
 * Sequences:
 * - seq-start-adventure-mode.md
 * - seq-select-world.md
 * - seq-switch-to-world-list.md
 * UI Spec: ui-adventure-mode.md
 */

import type { MudStorage } from '../textcraft/model.js';
import type { TemplateEngine } from '../utils/TemplateEngine.js';
import type { IRouter } from '../utils/Router.js';
import type { IViewManager } from '../utils/ViewManager.js';
import { WorldListView } from './WorldListView.js';
import { AdventureView } from './AdventureView.js';
import type { HollowPeer } from '../p2p/HollowPeer.js';
import { getProfileService } from '../services/ProfileService.js';

// Storage constant
const ACTIVE_WORLD_ID_KEY = 'activeWorldId';

/**
 * IAdventureMode interface
 * CRC: crc-AdventureMode.md
 */
export interface IAdventureMode {
    initialize(): void;
    showWorldList(): Promise<void>;
    showAdventure(worldId: string): Promise<void>;
    handleWorldSelection(worldId: string): void;
    handleBackToList(): void;
    getDefaultRoute(): string;
    getActiveWorldId(): string | null;
    cleanup(): void;
    terminateActiveWorld(): void;
}

/**
 * AdventureMode class - View coordinator for TextCraft MUD integration
 * CRC: crc-AdventureMode.md
 */
export class AdventureMode implements IAdventureMode {
    private currentView: 'worldList' | 'adventure' | null = null;
    private selectedWorldId: string = '';
    private activeWorldId: string | null = null; // Active world state (runtime only, not persisted)
    private router: IRouter;
    private viewManager?: IViewManager;
    private worldListView: WorldListView | null = null;
    private adventureView: AdventureView | null = null;
    private mudStorage: MudStorage;
    private templateEngine: TemplateEngine;
    private container: HTMLElement | null = null;
    private hollowPeer?: HollowPeer;

    constructor(
        mudStorage: MudStorage,
        templateEngine: TemplateEngine,
        router: IRouter,
        hollowPeer?: HollowPeer,
        viewManager?: IViewManager
    ) {
        this.mudStorage = mudStorage;
        this.templateEngine = templateEngine;
        this.router = router;
        this.hollowPeer = hollowPeer;
        this.viewManager = viewManager;
    }

    /**
     * initialize implementation - Set up router integration and create child views
     *
     * CRC: crc-AdventureMode.md
     * Sequences:
     * - seq-start-adventure-mode.md
     * Spec: game-worlds.md (Adventure Output History Persistence)
     */
    initialize(): void {
        // Load persisted activeWorldId
        try {
            const profileService = getProfileService();
            const savedWorldId = profileService.getItem(ACTIVE_WORLD_ID_KEY);
            if (savedWorldId) {
                this.activeWorldId = savedWorldId;
                console.log('📖 Restored active world:', savedWorldId);
            }
        } catch (error) {
            console.error('Failed to load active world ID:', error);
        }

        // Add routes to router
        this.router.addRoute({
            path: '/worlds',
            title: 'Worlds',
            handler: () => this.showWorldList()
        });

        this.router.addRoute({
            path: '/world/:worldId',
            title: 'Adventure',
            handler: (params) => {
                const worldId = params?.worldId || '';
                this.showAdventure(worldId);
            }
        });

        // Create container for views
        this.container = document.createElement('div');
        this.container.className = 'adventure-mode-container';
        document.body.appendChild(this.container);
    }

    /**
     * showWorldList implementation - Display world list overlay
     *
     * CRC: crc-AdventureMode.md
     * Sequences:
     * - seq-start-adventure-mode.md
     * - seq-switch-to-world-list.md
     */
    async showWorldList(): Promise<void> {
        // Create WorldListView if not exists
        if (!this.worldListView) {
            this.worldListView = new WorldListView(
                this.mudStorage,
                this.templateEngine,
                this.router,
                (worldId) => this.handleWorldSelection(worldId),
                this // Pass AdventureMode instance for active world queries
            );
            const worldListElement = await this.worldListView.render();
            this.container?.appendChild(worldListElement);
        } else {
            // Re-render to update active world indicator
            await this.worldListView.refresh();
        }

        // Hide adventure view
        if (this.adventureView) {
            this.adventureView.hide?.();
        }

        // Show world list view
        this.worldListView.show();
        this.currentView = 'worldList';

        // Notify ViewManager to show adventure mode
        if (this.viewManager) {
            this.viewManager.showView('adventure');
        }
    }

    /**
     * showAdventure implementation - Display adventure view for specified world
     *
     * CRC: crc-AdventureMode.md
     * Sequences:
     * - seq-select-world.md
     *
     * Note: This activates the world (sets activeWorldId) or returns to active world
     */
    async showAdventure(worldId: string): Promise<void> {
        this.selectedWorldId = worldId;

        // Load world from storage
        const world = await this.mudStorage.openWorld(worldId);
        if (!world) {
            console.error(`World not found: ${worldId}`);
            // Navigate back to world list
            this.router.navigate('/worlds');
            return;
        }

        // Determine if we're activating a new world or returning to active world
        const skipInitialization = (this.activeWorldId === worldId);
        const isReturningToSameWorld = skipInitialization && this.adventureView;

        if (!skipInitialization) {
            // Activating a new world (or first time)
            this.activeWorldId = worldId;

            // Clear output history when switching worlds
            if (this.adventureView) {
                this.adventureView.clearHistory();
            }

            // Persist to storage
            try {
                const profileService = getProfileService();
                profileService.setItem(ACTIVE_WORLD_ID_KEY, worldId);
                console.log('💾 Saved active world:', worldId);
            } catch (error) {
                console.error('Failed to save active world ID:', error);
            }
        }

        // Create AdventureView if not exists
        if (!this.adventureView) {
            this.adventureView = new AdventureView({
                hollowPeer: this.hollowPeer,
                onBack: () => this.handleBackToList(),
                router: this.router
            });
            const adventureElement = await this.adventureView.render(worldId, skipInitialization);
            this.container?.appendChild(adventureElement);
        } else if (!isReturningToSameWorld) {
            // Switching to a different world - need to re-render
            const adventureElement = await this.adventureView.render(worldId, skipInitialization);
            // Replace old container with newly rendered one
            if (this.container) {
                const oldContainer = this.container.querySelector('.adventure-view-container');
                if (oldContainer) {
                    oldContainer.replaceWith(adventureElement);
                } else {
                    this.container.appendChild(adventureElement);
                }
            }
        }
        // If isReturningToSameWorld, we don't re-render - just show() below preserves state

        // Hide world list view
        if (this.worldListView) {
            this.worldListView.hide();
        }

        // Show adventure view
        this.adventureView.show?.();
        this.currentView = 'adventure';

        // Notify ViewManager to show adventure mode
        if (this.viewManager) {
            this.viewManager.showView('adventure');
        }
    }

    /**
     * handleWorldSelection implementation - Switch from world list to adventure view
     *
     * CRC: crc-AdventureMode.md
     * Sequences:
     * - seq-select-world.md
     */
    handleWorldSelection(worldId: string): void {
        // Navigation is handled by WorldListView clicking Start button
        // which calls router.navigate(`/world/${worldId}`)
        // This will trigger the route handler which calls showAdventure()
    }

    /**
     * handleBackToList implementation - Switch from adventure view to world list
     *
     * CRC: crc-AdventureMode.md
     * Sequences:
     * - seq-switch-to-world-list.md
     *
     * Note: Does NOT terminate active world - just shows world list overlay
     */
    handleBackToList(): void {
        // Navigate back to world list (keeps active world state)
        this.router.navigate('/worlds');
    }

    /**
     * getDefaultRoute implementation - Determine route based on active world state
     *
     * CRC: crc-AdventureMode.md
     * Spec: ui.splash.md (Adventure Mode Navigation)
     *
     * Returns the appropriate route for entering adventure mode:
     * - If active world exists: /world/:worldId (return to gameplay)
     * - If no active world: /worlds (show world list)
     */
    getDefaultRoute(): string {
        if (this.activeWorldId) {
            return `/world/${this.activeWorldId}`;
        } else {
            return '/worlds';
        }
    }

    /**
     * getContainer implementation - IView interface
     *
     * Spec: view-management.md
     */
    getContainer(): HTMLElement | null {
        return this.container;
    }

    /**
     * show implementation - IView interface
     *
     * Spec: view-management.md
     *
     * Shows the adventure mode container and ensures other views are hidden
     */
    show(): void {
        // Hide app container to hide splash/other views
        const appContainer = document.getElementById('app');
        if (appContainer) {
            appContainer.style.display = 'none';
        }

        // Show adventure mode container
        if (this.container) {
            this.container.style.display = 'block';
        }
    }

    /**
     * hide implementation - IView interface
     *
     * Spec: view-management.md
     */
    hide(): void {
        if (this.container) {
            this.container.style.display = 'none';
        }
    }

    /**
     * getActiveWorldId implementation - Get the currently active world ID
     *
     * CRC: crc-AdventureMode.md
     * Spec: game-worlds.md (Active World State Management)
     *
     * Returns the ID of the active world, or null if no world is active
     */
    getActiveWorldId(): string | null {
        return this.activeWorldId;
    }

    /**
     * cleanup implementation - Dispose of resources when leaving adventure mode
     *
     * CRC: crc-AdventureMode.md
     * Spec: game-worlds.md (Active World State Management - World Termination)
     *
     * Note: Cleans up UI resources but preserves activeWorldId for page reload persistence
     */
    cleanup(): void {
        // Note: activeWorldId is NOT cleared here - it persists across page reloads
        // It should only be cleared when explicitly leaving adventure mode

        // Cleanup world list view
        if (this.worldListView) {
            this.worldListView.cleanup();
            this.worldListView = null;
        }

        // Cleanup adventure view
        if (this.adventureView) {
            this.adventureView.destroy?.();
            this.adventureView = null;
        }

        // Remove container
        if (this.container) {
            this.container.remove();
            this.container = null;
        }

        this.currentView = null;
        this.selectedWorldId = '';
    }

    /**
     * terminateActiveWorld implementation - Explicitly terminate active world
     *
     * CRC: crc-AdventureMode.md
     * Spec: game-worlds.md (Active World State Management - World Termination)
     *
     * Call this when user explicitly leaves adventure mode (navigates to splash/characters/friends/settings)
     */
    terminateActiveWorld(): void {
        // Terminate active world
        this.activeWorldId = null;

        // Clear persisted activeWorldId
        try {
            const profileService = getProfileService();
            profileService.removeItem(ACTIVE_WORLD_ID_KEY);
            console.log('🧹 Terminated active world, cleared from storage');
        } catch (error) {
            console.error('Failed to clear active world ID:', error);
        }

        // Also clear output history when terminating
        if (this.adventureView) {
            this.adventureView.clearHistory();
        }
    }
}
