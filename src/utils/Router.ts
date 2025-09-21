// Route-based navigation system for Hollow World
// Replaces state-based HistoryManager with URL-based routing

export interface IRoute {
    path: string;
    title: string;
    handler: (params?: Record<string, string>) => Promise<void> | void;
}

export interface IRouter {
    addRoute(route: IRoute): void;
    navigate(path: string, title?: string): void;
    getCurrentPath(): string;
    initialize(): void;
    destroy(): void;
}

export class Router implements IRouter {
    private routes: IRoute[] = [];
    private currentPath: string = '/';

    constructor() {
        this.currentPath = window.location.pathname || '/';

        // Listen for browser back/forward
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });

        // Set initial state
        window.history.replaceState(
            { path: this.currentPath },
            document.title,
            this.currentPath
        );
    }

    addRoute(route: IRoute): void {
        this.routes.push(route);
    }

    navigate(path: string, title?: string): void {
        const pageTitle = title || document.title;

        this.currentPath = path;
        window.history.pushState({ path }, pageTitle, path);
        document.title = pageTitle;

        this.handleRoute(path);
    }

    getCurrentPath(): string {
        return this.currentPath;
    }

    initialize(): void {
        // Handle initial route
        this.handleRoute(this.currentPath);
    }

    destroy(): void {
        window.removeEventListener('popstate', this.handlePopState);
    }

    private handlePopState = (event: PopStateEvent): void => {
        const state = event.state;
        const newPath = (state && state.path) ? state.path : window.location.pathname;

        this.currentPath = newPath;
        this.handleRoute(newPath);
    };

    private handleRoute(path: string): void {
        // Find matching route
        const route = this.findRoute(path);

        if (route) {
            const params = this.extractParams(route.path, path);
            route.handler(params);
        } else {
            console.warn('No route found for path:', path);
            // Default to home route
            this.navigate('/');
        }
    }

    private findRoute(path: string): IRoute | null {
        // Find exact match first
        let route = this.routes.find(r => r.path === path);

        if (!route) {
            // Find parameterized route match
            route = this.routes.find(r => this.matchesPattern(r.path, path));
        }

        return route || null;
    }

    private matchesPattern(pattern: string, path: string): boolean {
        // Convert route pattern to regex
        // Example: /character/:id becomes /character/([^/]+)
        const regexPattern = pattern
            .replace(/:[^/]+/g, '([^/]+)')
            .replace(/\//g, '\\/');

        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
    }

    private extractParams(pattern: string, path: string): Record<string, string> {
        const params: Record<string, string> = {};

        const patternParts = pattern.split('/');
        const pathParts = path.split('/');

        if (patternParts.length !== pathParts.length) {
            return params;
        }

        patternParts.forEach((part, index) => {
            if (part.startsWith(':')) {
                const paramName = part.substring(1);
                params[paramName] = pathParts[index];
            }
        });

        return params;
    }
}

// Singleton router instance
export const router = new Router();