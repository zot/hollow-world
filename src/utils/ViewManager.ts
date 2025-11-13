/**
 * ViewManager - Centralized view visibility coordinator
 *
 * Spec: view-management.md
 *
 * Implements single-active-view pattern where only one view is visible at a time.
 * Manages view registration, switching, and visibility coordination.
 */

/**
 * IView interface - All views must implement this interface
 *
 * Spec: view-management.md (View Interface section)
 */
export interface IView {
    /**
     * Get the root container element for this view
     * Returns null if view hasn't been rendered yet
     */
    getContainer(): HTMLElement | null;

    /**
     * Show this view (make visible)
     */
    show(): void;

    /**
     * Hide this view (make invisible but keep in DOM)
     */
    hide(): void;

    /**
     * Optional: cleanup resources when view is destroyed
     */
    destroy?(): void;
}

/**
 * IViewManager interface
 *
 * Spec: view-management.md (ViewManager Class section)
 */
export interface IViewManager {
    /**
     * Register a view with the manager
     * @param name Unique identifier for the view (e.g., 'splash', 'characters')
     * @param view View instance implementing IView interface
     */
    registerView(name: string, view: IView): void;

    /**
     * Show a view (hides all others)
     * @param name Name of the view to show
     * @throws Error if view is not registered
     */
    showView(name: string): void;

    /**
     * Get currently active view name
     * @returns Name of active view, or null if no view is active
     */
    getActiveView(): string | null;

    /**
     * Hide all views
     */
    hideAll(): void;

    /**
     * Check if a view is registered
     * @param name Name of the view to check
     * @returns True if view is registered
     */
    hasView(name: string): boolean;
}

/**
 * ViewManager - Centralized view visibility coordinator
 *
 * Spec: view-management.md
 *
 * Responsibilities:
 * - Maintain registry of all application views
 * - Track currently active view
 * - Coordinate view visibility (hide all except active)
 * - Ensure single-active-view pattern
 */
export class ViewManager implements IViewManager {
    private views: Map<string, IView> = new Map();
    private activeView: string | null = null;

    /**
     * registerView implementation
     *
     * Spec: view-management.md (ViewManager Class section)
     */
    registerView(name: string, view: IView): void {
        if (this.views.has(name)) {
            console.warn(`ViewManager: View "${name}" is already registered, replacing...`);
        }
        this.views.set(name, view);
        console.log(`ViewManager: Registered view "${name}"`);
    }

    /**
     * showView implementation
     *
     * Spec: view-management.md (ViewManager Class section)
     *
     * Algorithm:
     * 1. Validate view exists
     * 2. Hide currently active view (if different from requested)
     * 3. Show requested view
     * 4. Update active view tracking
     */
    showView(name: string): void {
        console.log(`ViewManager: showView("${name}") called, current active: "${this.activeView}"`);

        const view = this.views.get(name);
        if (!view) {
            throw new Error(`ViewManager: View not registered: "${name}"`);
        }

        // Hide currently active view if switching to different view
        if (this.activeView && this.activeView !== name) {
            const currentView = this.views.get(this.activeView);
            if (currentView) {
                console.log(`ViewManager: Hiding previous view "${this.activeView}"`);
                currentView.hide();
            }
        }

        // Show requested view
        console.log(`ViewManager: Showing view "${name}"`);
        view.show();
        this.activeView = name;

        console.log(`ViewManager: Active view is now "${this.activeView}"`);
    }

    /**
     * getActiveView implementation
     *
     * Spec: view-management.md (ViewManager Class section)
     */
    getActiveView(): string | null {
        return this.activeView;
    }

    /**
     * hideAll implementation
     *
     * Spec: view-management.md (ViewManager Class section)
     */
    hideAll(): void {
        console.log('ViewManager: Hiding all views');
        this.views.forEach((view, name) => {
            console.log(`ViewManager: Hiding view "${name}"`);
            view.hide();
        });
        this.activeView = null;
    }

    /**
     * hasView implementation
     *
     * Spec: view-management.md (ViewManager Class section)
     */
    hasView(name: string): boolean {
        return this.views.has(name);
    }
}
