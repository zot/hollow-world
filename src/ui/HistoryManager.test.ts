// Unit tests for HistoryManager following SOLID principles

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserHistoryManager, HistoryState, ViewStateFactory } from './HistoryManager.js';

// Mock DOM environment for testing
class MockHistory {
    private states: any[] = [];
    private currentIndex: number = -1;
    state: any = null;

    pushState(data: any, title: string, url: string): void {
        this.currentIndex++;
        this.states = this.states.slice(0, this.currentIndex);
        this.states.push({ data, title, url });
        this.state = data;
    }

    replaceState(data: any, title: string, url: string): void {
        if (this.currentIndex >= 0) {
            this.states[this.currentIndex] = { data, title, url };
        }
        this.state = data;
    }

    back(): void {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.state = this.states[this.currentIndex]?.data || null;
        }
    }

    forward(): void {
        if (this.currentIndex < this.states.length - 1) {
            this.currentIndex++;
            this.state = this.states[this.currentIndex]?.data || null;
        }
    }
}

class MockWindow {
    history: MockHistory;
    location: { href: string };
    private listeners: Map<string, Function[]> = new Map();

    constructor() {
        this.history = new MockHistory();
        this.location = { href: 'http://localhost' };
    }

    addEventListener(event: string, listener: Function): void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(listener);
    }

    removeEventListener(event: string, listener: Function): void {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            const index = eventListeners.indexOf(listener);
            if (index >= 0) {
                eventListeners.splice(index, 1);
            }
        }
    }

    triggerPopState(state: any): void {
        const listeners = this.listeners.get('popstate') || [];
        listeners.forEach(listener => {
            listener({ state });
        });
    }
}

class MockDocument {
    title: string = '';
    body: HTMLElement;

    constructor() {
        this.body = this.createElement('div') as HTMLElement;
    }

    createElement(tagName: string): Element {
        return {
            tagName: tagName.toUpperCase(),
            innerHTML: '',
            textContent: '',
            addEventListener: () => {},
            removeEventListener: () => {},
            appendChild: () => {},
            removeChild: () => {},
            querySelector: () => null,
            querySelectorAll: () => [],
        } as any;
    }
}

// Test setup
describe('HistoryManager', () => {
    let historyManager: BrowserHistoryManager;
    let mockWindow: MockWindow;
    let mockDocument: MockDocument;
    let mockContainer: HTMLElement;

    beforeEach(() => {
        mockWindow = new MockWindow();
        mockDocument = new MockDocument();
        mockContainer = mockDocument.createElement('div') as HTMLElement;

        // Mock global objects
        (global as any).window = mockWindow;
        (global as any).history = mockWindow.history;
        (global as any).document = mockDocument;

        historyManager = new BrowserHistoryManager();
    });

    afterEach(() => {
        if (historyManager) {
            historyManager.destroy();
        }
    });

    describe('HistoryState', () => {
        test('should create a history state with correct properties', () => {
            const renderFn = vi.fn().mockResolvedValue(undefined);
            const state = new HistoryState('test-id', 'Test Title', { test: 'data' }, renderFn);

            expect(state.id).toBe('test-id');
            expect(state.title).toBe('Test Title');
            expect(state.data).toEqual({ test: 'data' });
        });

        test('should call render function when render is called', async () => {
            const renderFn = vi.fn().mockResolvedValue(undefined);
            const state = new HistoryState('test-id', 'Test Title', { test: 'data' }, renderFn);

            await state.render(mockContainer);

            expect(renderFn).toHaveBeenCalledWith(mockContainer, { test: 'data' });
        });
    });

    describe('BrowserHistoryManager', () => {
        test('should initialize correctly', () => {
            expect(() => historyManager.initialize(mockContainer)).not.toThrow();
            expect(historyManager.getCurrentState()).toBeNull();
            expect(historyManager.canGoBack()).toBe(false);
            expect(historyManager.canGoForward()).toBe(false);
        });

        test('should throw error when initialized without container', () => {
            expect(() => historyManager.initialize(null as any)).toThrow('Container element is required for HistoryManager');
        });

        test('should push states correctly', () => {
            historyManager.initialize(mockContainer);

            const renderFn = vi.fn().mockResolvedValue(undefined);
            const state1 = new HistoryState('state1', 'State 1', {}, renderFn);
            const state2 = new HistoryState('state2', 'State 2', {}, renderFn);

            historyManager.pushState(state1);
            expect(historyManager.getCurrentState()).toBe(state1);
            expect(historyManager.canGoBack()).toBe(false);
            expect(historyManager.canGoForward()).toBe(false);

            historyManager.pushState(state2);
            expect(historyManager.getCurrentState()).toBe(state2);
            expect(historyManager.canGoBack()).toBe(true);
            expect(historyManager.canGoForward()).toBe(false);
        });

        test('should handle navigation correctly', async () => {
            historyManager.initialize(mockContainer);

            const renderFn1 = vi.fn().mockResolvedValue(undefined);
            const renderFn2 = vi.fn().mockResolvedValue(undefined);
            const state1 = new HistoryState('state1', 'State 1', {}, renderFn1);
            const state2 = new HistoryState('state2', 'State 2', {}, renderFn2);

            historyManager.pushState(state1);
            historyManager.pushState(state2);

            // Go back
            await historyManager.goBack();
            expect(historyManager.getCurrentState()).toBe(state1);
            expect(historyManager.canGoBack()).toBe(false);
            expect(historyManager.canGoForward()).toBe(true);
            expect(renderFn1).toHaveBeenCalledWith(mockContainer, {});

            // Go forward
            await historyManager.goForward();
            expect(historyManager.getCurrentState()).toBe(state2);
            expect(historyManager.canGoBack()).toBe(true);
            expect(historyManager.canGoForward()).toBe(false);
            expect(renderFn2).toHaveBeenCalledWith(mockContainer, {});
        });

        test('should not navigate when no states available', async () => {
            historyManager.initialize(mockContainer);

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

            await historyManager.goBack();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot go back: no previous state available');

            await historyManager.goForward();
            expect(consoleSpy).toHaveBeenCalledWith('Cannot go forward: no next state available');

            consoleSpy.mockRestore();
        });

        test('should truncate future states when pushing after going back', () => {
            historyManager.initialize(mockContainer);

            const renderFn = vi.fn().mockResolvedValue(undefined);
            const state1 = new HistoryState('state1', 'State 1', {}, renderFn);
            const state2 = new HistoryState('state2', 'State 2', {}, renderFn);
            const state3 = new HistoryState('state3', 'State 3', {}, renderFn);

            historyManager.pushState(state1);
            historyManager.pushState(state2);
            historyManager.goBack();

            expect(historyManager.canGoForward()).toBe(true);

            // Push new state should truncate future
            historyManager.pushState(state3);
            expect(historyManager.getCurrentState()).toBe(state3);
            expect(historyManager.canGoForward()).toBe(false);
        });

        test('should clean up properly on destroy', () => {
            historyManager.initialize(mockContainer);

            const renderFn = vi.fn().mockResolvedValue(undefined);
            const state = new HistoryState('state1', 'State 1', {}, renderFn);
            historyManager.pushState(state);

            historyManager.destroy();

            expect(historyManager.getCurrentState()).toBeNull();
            expect(historyManager.canGoBack()).toBe(false);
            expect(historyManager.canGoForward()).toBe(false);
        });
    });

    describe('ViewStateFactory', () => {
        test('should create splash state correctly', () => {
            const renderFn = vi.fn().mockResolvedValue(undefined);
            const data = { test: 'data' };
            const state = ViewStateFactory.createSplashState(renderFn, data);

            expect(state.id).toBe('splash');
            expect(state.title).toBe("Don't Go Hollow - Main Menu");
            expect(state.data).toBe(data);
        });

        test('should create characters state correctly', () => {
            const renderFn = vi.fn().mockResolvedValue(undefined);
            const data = { test: 'data' };
            const state = ViewStateFactory.createCharactersState(renderFn, data);

            expect(state.id).toBe('characters');
            expect(state.title).toBe("Don't Go Hollow - Characters");
            expect(state.data).toBe(data);
        });

        test('should create game state correctly', () => {
            const renderFn = vi.fn().mockResolvedValue(undefined);
            const data = { test: 'data' };
            const state = ViewStateFactory.createGameState(renderFn, data);

            expect(state.id).toBe('game');
            expect(state.title).toBe("Don't Go Hollow - Game");
            expect(state.data).toBe(data);
        });

        test('should use empty object as default data', () => {
            const renderFn = vi.fn().mockResolvedValue(undefined);
            const state = ViewStateFactory.createSplashState(renderFn);

            expect(state.data).toEqual({});
        });
    });
});