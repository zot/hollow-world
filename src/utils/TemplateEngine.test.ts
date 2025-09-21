// Unit tests for TemplateEngine utility

import { TemplateEngine } from './TemplateEngine.js';
import { vi } from 'vitest';

// Mock fetch for testing
const mockFetch = vi.fn();
(global as any).fetch = mockFetch;

describe('TemplateEngine', () => {
    let templateEngine: TemplateEngine;
    const testBaseUrl = new URL('http://localhost:3000/');

    beforeEach(() => {
        // Use consistent base URL for testing
        templateEngine = new TemplateEngine(testBaseUrl);
        mockFetch.mockClear();
    });

    describe('Template Loading', () => {
        test('should load template from file', async () => {
            const mockTemplate = '<div>{{name}}</div>';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTemplate)
            });

            const result = await templateEngine.loadTemplate('test-template');

            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/templates/test-template.html');
            expect(result).toBe(mockTemplate);
        });

        test('should cache loaded templates', async () => {
            const mockTemplate = '<div>{{name}}</div>';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTemplate)
            });

            // Load twice
            await templateEngine.loadTemplate('test-template');
            await templateEngine.loadTemplate('test-template');

            // Should only fetch once due to caching
            expect(mockFetch).toHaveBeenCalledTimes(1);
        });

        test('should handle template not found', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404
            });

            await expect(templateEngine.loadTemplate('non-existent'))
                .rejects.toThrow('Template non-existent not found');
        });

        test('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(templateEngine.loadTemplate('test-template'))
                .rejects.toThrow('Network error');
        });
    });

    describe('Template Rendering', () => {
        test('should replace simple variables', () => {
            const template = '<div>Hello {{name}}!</div>';
            const data = { name: 'World' };

            const result = templateEngine.renderTemplate(template, data);

            expect(result).toBe('<div>Hello World!</div>');
        });

        test('should handle multiple variables', () => {
            const template = '<div>{{greeting}} {{name}}, you have {{count}} messages</div>';
            const data = { greeting: 'Hello', name: 'John', count: 5 };

            const result = templateEngine.renderTemplate(template, data);

            expect(result).toBe('<div>Hello John, you have 5 messages</div>');
        });

        test('should handle missing variables', () => {
            const template = '<div>{{missing}} variable</div>';
            const data = {};

            const result = templateEngine.renderTemplate(template, data);

            expect(result).toBe('<div> variable</div>');
        });

        test('should handle conditional blocks - truthy', () => {
            const template = '<div>{{#if show}}Content shown{{/if}}</div>';
            const data = { show: true };

            const result = templateEngine.renderTemplate(template, data);

            expect(result).toBe('<div>Content shown</div>');
        });

        test('should handle conditional blocks - falsy', () => {
            const template = '<div>{{#if show}}Content shown{{/if}}</div>';
            const data = { show: false };

            const result = templateEngine.renderTemplate(template, data);

            expect(result).toBe('<div></div>');
        });

        test('should handle conditional blocks with numbers', () => {
            const template = '<div>{{#if count}}You have {{count}} items{{/if}}</div>';
            const data = { count: 3 };

            const result = templateEngine.renderTemplate(template, data);

            expect(result).toBe('<div>You have 3 items</div>');
        });

        test('should handle loops', () => {
            const template = '<ul>{{#each items}}<li>{{name}}</li>{{/each}}</ul>';
            const data = {
                items: [
                    { name: 'Item 1' },
                    { name: 'Item 2' }
                ]
            };

            const result = templateEngine.renderTemplate(template, data);

            expect(result).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
        });

        test('should handle empty arrays in loops', () => {
            const template = '<ul>{{#each items}}<li>{{name}}</li>{{/each}}</ul>';
            const data = { items: [] };

            const result = templateEngine.renderTemplate(template, data);

            expect(result).toBe('<ul></ul>');
        });
    });

    describe('Template File Rendering', () => {
        test('should load and render template from file', async () => {
            const mockTemplate = '<div>Hello {{name}}!</div>';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTemplate)
            });

            const result = await templateEngine.renderTemplateFromFile('greeting', { name: 'World' });

            expect(result).toBe('<div>Hello World!</div>');
        });

        test('should handle file loading errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('File not found'));

            await expect(templateEngine.renderTemplateFromFile('missing', {}))
                .rejects.toThrow('File not found');
        });
    });

    describe('Cache Management', () => {
        test('should clear cache', async () => {
            const mockTemplate = '<div>{{name}}</div>';
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTemplate)
            });

            // Load template to cache it
            await templateEngine.loadTemplate('test-template');

            // Clear cache
            templateEngine.clearCache();

            // Load again - should fetch again
            mockFetch.mockResolvedValueOnce({
                ok: true,
                text: () => Promise.resolve(mockTemplate)
            });

            await templateEngine.loadTemplate('test-template');

            expect(mockFetch).toHaveBeenCalledTimes(2);
        });

        test('should preload templates', async () => {
            const mockTemplate1 = '<div>Template 1</div>';
            const mockTemplate2 = '<div>Template 2</div>';

            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    text: () => Promise.resolve(mockTemplate1)
                })
                .mockResolvedValueOnce({
                    ok: true,
                    text: () => Promise.resolve(mockTemplate2)
                });

            await templateEngine.preloadTemplates(['template1', 'template2']);

            expect(mockFetch).toHaveBeenCalledTimes(2);
            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/templates/template1.html');
            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/templates/template2.html');
        });
    });
});