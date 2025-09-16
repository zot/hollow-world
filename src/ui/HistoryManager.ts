// History management interfaces following SOLID principles

export interface IHistoryState {
    id: string;
    title: string;
    data: any;
    render(container: HTMLElement): Promise<void>;
}

export interface IHistoryManager {
    pushState(state: IHistoryState): void;
    canGoBack(): boolean;
    canGoForward(): boolean;
    goBack(): Promise<void>;
    goForward(): Promise<void>;
    getCurrentState(): IHistoryState | null;
    initialize(container: HTMLElement): void;
    destroy(): void;
}

// History state implementation
export class HistoryState implements IHistoryState {
    public id: string;
    public title: string;
    public data: any;
    private renderFunction: (container: HTMLElement, data: any) => Promise<void>;

    constructor(
        id: string,
        title: string,
        data: any,
        renderFunction: (container: HTMLElement, data: any) => Promise<void>
    ) {
        this.id = id;
        this.title = title;
        this.data = data;
        this.renderFunction = renderFunction;
    }

    async render(container: HTMLElement): Promise<void> {
        await this.renderFunction(container, this.data);
    }
}

// Browser history manager implementation
export class BrowserHistoryManager implements IHistoryManager {
    private historyStack: IHistoryState[] = [];
    private currentIndex: number = -1;
    private container: HTMLElement | null = null;
    private isNavigating: boolean = false;

    constructor() {
        this.handlePopState = this.handlePopState.bind(this);
    }

    initialize(container: HTMLElement): void {
        if (!container) {
            throw new Error('Container element is required for HistoryManager');
        }

        this.container = container;
        window.addEventListener('popstate', this.handlePopState);

        // Initialize browser history if it's empty
        if (!history.state) {
            history.replaceState({ historyIndex: -1 }, '', window.location.href);
        }
    }

    destroy(): void {
        window.removeEventListener('popstate', this.handlePopState);
        this.container = null;
        this.historyStack = [];
        this.currentIndex = -1;
    }

    pushState(state: IHistoryState): void {
        // If we're not at the end of the stack, truncate future states
        if (this.currentIndex < this.historyStack.length - 1) {
            this.historyStack = this.historyStack.slice(0, this.currentIndex + 1);
        }

        this.historyStack.push(state);
        this.currentIndex = this.historyStack.length - 1;

        // Update browser history
        const historyData = {
            historyIndex: this.currentIndex,
            stateId: state.id
        };

        history.pushState(historyData, state.title, window.location.href);
        document.title = state.title;
    }

    canGoBack(): boolean {
        return this.currentIndex > 0;
    }

    canGoForward(): boolean {
        return this.currentIndex < this.historyStack.length - 1;
    }

    async goBack(): Promise<void> {
        if (!this.canGoBack()) {
            console.warn('Cannot go back: no previous state available');
            return;
        }

        this.currentIndex--;
        const state = this.historyStack[this.currentIndex];

        this.isNavigating = true;
        const historyData = {
            historyIndex: this.currentIndex,
            stateId: state.id
        };
        history.pushState(historyData, state.title, window.location.href);

        await this.renderCurrentState();
        this.isNavigating = false;
    }

    async goForward(): Promise<void> {
        if (!this.canGoForward()) {
            console.warn('Cannot go forward: no next state available');
            return;
        }

        this.currentIndex++;
        const state = this.historyStack[this.currentIndex];

        this.isNavigating = true;
        const historyData = {
            historyIndex: this.currentIndex,
            stateId: state.id
        };
        history.pushState(historyData, state.title, window.location.href);

        await this.renderCurrentState();
        this.isNavigating = false;
    }

    getCurrentState(): IHistoryState | null {
        if (this.currentIndex >= 0 && this.currentIndex < this.historyStack.length) {
            return this.historyStack[this.currentIndex];
        }
        return null;
    }

    private async handlePopState(event: PopStateEvent): Promise<void> {
        if (this.isNavigating) {
            return;
        }

        const historyData = event.state;
        if (historyData && typeof historyData.historyIndex === 'number') {
            const targetIndex = historyData.historyIndex;

            if (targetIndex >= 0 && targetIndex < this.historyStack.length) {
                this.currentIndex = targetIndex;
                await this.renderCurrentState();
            } else {
                console.warn('Invalid history index:', targetIndex);
            }
        }
    }

    private async renderCurrentState(): Promise<void> {
        if (!this.container) {
            console.error('No container available for rendering');
            return;
        }

        const currentState = this.getCurrentState();
        if (currentState) {
            try {
                await currentState.render(this.container);
                document.title = currentState.title;
            } catch (error) {
                console.error('Failed to render history state:', error);
            }
        }
    }
}

// View state factory for common views
export class ViewStateFactory {
    static createSplashState(
        renderFunction: (container: HTMLElement, data: any) => Promise<void>,
        data: any = {}
    ): HistoryState {
        return new HistoryState(
            'splash',
            "Don't Go Hollow - Main Menu",
            data,
            renderFunction
        );
    }

    static createCharactersState(
        renderFunction: (container: HTMLElement, data: any) => Promise<void>,
        data: any = {}
    ): HistoryState {
        return new HistoryState(
            'characters',
            "Don't Go Hollow - Characters",
            data,
            renderFunction
        );
    }

    static createGameState(
        renderFunction: (container: HTMLElement, data: any) => Promise<void>,
        data: any = {}
    ): HistoryState {
        return new HistoryState(
            'game',
            "Don't Go Hollow - Game",
            data,
            renderFunction
        );
    }
}