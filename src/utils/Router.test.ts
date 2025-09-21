// Unit tests for Router utility following SOLID principles

import { Router } from './Router.js';
import { vi } from 'vitest';

// Mock window object
const mockWindow = {
    location: { pathname: '/' },
    history: {
        pushState: vi.fn(),
        replaceState: vi.fn()
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
};

// Mock document object
const mockDocument = {
    title: 'Test App'
};

describe('Router', () => {
    let router: Router;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Mock globals
        (global as any).window = mockWindow;
        (global as any).document = mockDocument;

        router = new Router();
    });

    afterEach(() => {
        if (router) {
            router.destroy();
        }
    });

    describe('Initialization', () => {
        test('should initialize with current path', () => {
            expect(router.getCurrentPath()).toBe('/');
        });

        test('should set up popstate listener', () => {
            expect(mockWindow.addEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
        });

        test('should replace initial state', () => {
            expect(mockWindow.history.replaceState).toHaveBeenCalledWith(
                { path: '/' },
                'Test App',
                '/'
            );
        });
    });

    describe('Route Management', () => {
        test('should add routes', () => {
            const mockHandler = vi.fn();

            router.addRoute({
                path: '/test',
                title: 'Test Page',
                handler: mockHandler
            });

            // Routes are stored internally, test via navigation
            router.navigate('/test');
            expect(mockHandler).toHaveBeenCalled();
        });

        test('should handle parameterized routes', () => {
            const mockHandler = vi.fn();

            router.addRoute({
                path: '/character/:id',
                title: 'Character Editor',
                handler: mockHandler
            });

            router.navigate('/character/123');
            expect(mockHandler).toHaveBeenCalledWith({ id: '123' });
        });

        test('should navigate to new paths', () => {
            router.navigate('/test', 'Test Title');

            expect(mockWindow.history.pushState).toHaveBeenCalledWith(
                { path: '/test' },
                'Test Title',
                '/test'
            );
            expect(router.getCurrentPath()).toBe('/test');
        });

        test('should handle navigation to non-existent routes', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            router.navigate('/non-existent');

            expect(consoleSpy).toHaveBeenCalledWith('No route found for path:', '/non-existent');
            consoleSpy.mockRestore();
        });
    });

    describe('Parameter Extraction', () => {
        test('should extract single parameter', () => {
            const mockHandler = vi.fn();

            router.addRoute({
                path: '/user/:id',
                title: 'User Profile',
                handler: mockHandler
            });

            router.navigate('/user/456');
            expect(mockHandler).toHaveBeenCalledWith({ id: '456' });
        });

        test('should extract multiple parameters', () => {
            const mockHandler = vi.fn();

            router.addRoute({
                path: '/user/:userId/post/:postId',
                title: 'User Post',
                handler: mockHandler
            });

            router.navigate('/user/123/post/789');
            expect(mockHandler).toHaveBeenCalledWith({ userId: '123', postId: '789' });
        });

        test('should handle routes without parameters', () => {
            const mockHandler = vi.fn();

            router.addRoute({
                path: '/about',
                title: 'About',
                handler: mockHandler
            });

            router.navigate('/about');
            expect(mockHandler).toHaveBeenCalledWith({});
        });
    });

    describe('Browser Integration', () => {
        test('should handle popstate events', () => {
            const mockHandler = vi.fn();

            router.addRoute({
                path: '/test',
                title: 'Test',
                handler: mockHandler
            });

            // Simulate popstate event
            const popstateEvent = new Event('popstate') as PopStateEvent;
            (popstateEvent as any).state = { path: '/test' };

            // Get the popstate handler from addEventListener call
            const popstateHandler = mockWindow.addEventListener.mock.calls
                .find(call => call[0] === 'popstate')?.[1];

            if (popstateHandler) {
                popstateHandler(popstateEvent);
                expect(mockHandler).toHaveBeenCalled();
            }
        });
    });

    describe('Cleanup', () => {
        test('should remove event listeners on destroy', () => {
            router.destroy();
            expect(mockWindow.removeEventListener).toHaveBeenCalledWith('popstate', expect.any(Function));
        });
    });
});