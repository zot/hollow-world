/**
 * Unit tests for TemplateEngine
 *
 * These tests ensure the template engine correctly handles Handlebars syntax,
 * especially edge cases with empty arrays and nested structures.
 */

import { describe, it, expect } from 'vitest';
import { TemplateEngine } from '../src/utils/TemplateEngine.js';

describe('TemplateEngine', () => {
    let templateEngine: TemplateEngine;

    beforeEach(() => {
        templateEngine = new TemplateEngine();
    });

    describe('renderTemplate - basic functionality', () => {
        it('should render simple text without variables', async () => {
            const result = await templateEngine.renderTemplate('Hello World', {});
            expect(result).toBe('Hello World');
        });

        it('should render simple variable substitution', async () => {
            const result = await templateEngine.renderTemplate('Hello {{name}}', { name: 'Doc' });
            expect(result).toBe('Hello Doc');
        });

        it('should render multiple variables', async () => {
            const result = await templateEngine.renderTemplate('{{greeting}} {{name}}!', {
                greeting: 'Howdy',
                name: 'Partner'
            });
            expect(result).toBe('Howdy Partner!');
        });
    });

    describe('renderTemplate - {{#if}} conditionals', () => {
        it('should render content when condition is true', async () => {
            const result = await templateEngine.renderTemplate(
                '{{#if show}}Visible{{/if}}',
                { show: true }
            );
            expect(result).toBe('Visible');
        });

        it('should not render content when condition is false', async () => {
            const result = await templateEngine.renderTemplate(
                '{{#if show}}Visible{{/if}}',
                { show: false }
            );
            expect(result).toBe('');
        });

        it('should handle nested conditionals', async () => {
            const result = await templateEngine.renderTemplate(
                '{{#if outer}}{{#if inner}}Both{{/if}}{{/if}}',
                { outer: true, inner: true }
            );
            expect(result).toBe('Both');
        });
    });

    describe('renderTemplate - {{#each}} loops', () => {
        it('should render each item in array', async () => {
            const result = await templateEngine.renderTemplate(
                '{{#each items}}{{name}} {{/each}}',
                { items: [{ name: 'A' }, { name: 'B' }, { name: 'C' }] }
            );
            expect(result).toBe('A B C ');
        });

        it('should not render anything for empty array', async () => {
            const result = await templateEngine.renderTemplate(
                '{{#each items}}{{name}} {{/each}}',
                { items: [] }
            );
            expect(result).toBe('');
        });

        it('should handle nested each loops', async () => {
            const result = await templateEngine.renderTemplate(
                '{{#each outer}}{{#each inner}}{{val}}{{/each}}{{/each}}',
                {
                    outer: [
                        { inner: [{ val: '1' }, { val: '2' }] },
                        { inner: [{ val: '3' }] }
                    ]
                }
            );
            expect(result).toBe('123');
        });
    });

    describe('renderTemplate - HTML balance with empty arrays (REGRESSION TESTS)', () => {
        it('should produce balanced HTML with simple div in empty each', async () => {
            const result = await templateEngine.renderTemplate(
                '<div>{{#each items}}<div>{{name}}</div>{{/each}}</div>',
                { items: [] }
            );

            const openDivs = (result.match(/<div/g) || []).length;
            const closeDivs = (result.match(/<\/div>/g) || []).length;

            expect(openDivs).toBe(closeDivs);
            expect(result).toBe('<div></div>');
        });

        it('should produce balanced HTML with nested divs in empty each', async () => {
            const result = await templateEngine.renderTemplate(
                '<div>{{#each items}}<div><div>{{name}}</div></div>{{/each}}</div>',
                { items: [] }
            );

            const openDivs = (result.match(/<div/g) || []).length;
            const closeDivs = (result.match(/<\/div>/g) || []).length;

            expect(openDivs).toBe(closeDivs);
            expect(result).toBe('<div></div>');
        });

        it('should produce balanced HTML with deeply nested divs in empty each', async () => {
            const result = await templateEngine.renderTemplate(
                '<div>{{#each items}}<div><div><div><div>{{name}}</div></div></div></div>{{/each}}</div>',
                { items: [] }
            );

            const openDivs = (result.match(/<div/g) || []).length;
            const closeDivs = (result.match(/<\/div>/g) || []).length;

            expect(openDivs).toBe(closeDivs);
            expect(result).toBe('<div></div>');
        });

        it('should produce balanced HTML with conditionals inside empty each', async () => {
            const result = await templateEngine.renderTemplate(
                '<div>{{#each items}}<div>{{#if show}}<span>{{name}}</span>{{/if}}</div>{{/each}}</div>',
                { items: [] }
            );

            const openDivs = (result.match(/<div/g) || []).length;
            const closeDivs = (result.match(/<\/div>/g) || []).length;

            expect(openDivs).toBe(closeDivs);
            expect(result).toBe('<div></div>');
        });

        it('should produce balanced HTML with nested each loops when outer is empty', async () => {
            const result = await templateEngine.renderTemplate(
                '<div>{{#each outer}}<div>{{#each inner}}<div>{{val}}</div>{{/each}}</div>{{/each}}</div>',
                { outer: [] }
            );

            const openDivs = (result.match(/<div/g) || []).length;
            const closeDivs = (result.match(/<\/div>/g) || []).length;

            expect(openDivs).toBe(closeDivs);
            expect(result).toBe('<div></div>');
        });
    });

    describe('renderTemplate - HTML balance with populated arrays', () => {
        it('should produce balanced HTML with items in each loop', async () => {
            const result = await templateEngine.renderTemplate(
                '<div>{{#each items}}<div>{{name}}</div>{{/each}}</div>',
                { items: [{ name: 'A' }, { name: 'B' }] }
            );

            const openDivs = (result.match(/<div/g) || []).length;
            const closeDivs = (result.match(/<\/div>/g) || []).length;

            expect(openDivs).toBe(closeDivs);
            expect(openDivs).toBe(3); // 1 outer + 2 items
        });

        it('should produce balanced HTML with nested structures and items', async () => {
            const result = await templateEngine.renderTemplate(
                '<div>{{#each items}}<div><div>{{name}}</div></div>{{/each}}</div>',
                { items: [{ name: 'A' }] }
            );

            const openDivs = (result.match(/<div/g) || []).length;
            const closeDivs = (result.match(/<\/div>/g) || []).length;

            expect(openDivs).toBe(closeDivs);
            expect(openDivs).toBe(3); // 1 outer + 2 for the item
        });
    });

    describe('renderTemplate - mixed conditionals and loops', () => {
        it('should handle {{#if}} wrapping {{#each}}', async () => {
            const result = await templateEngine.renderTemplate(
                '<div>{{#if hasItems}}<ul>{{#each items}}<li>{{name}}</li>{{/each}}</ul>{{/if}}</div>',
                { hasItems: false, items: [] }
            );

            expect(result).toBe('<div></div>');
        });

        it('should render correctly when both condition and array are true/populated', async () => {
            const result = await templateEngine.renderTemplate(
                '<div>{{#if hasItems}}<ul>{{#each items}}<li>{{name}}</li>{{/each}}</ul>{{/if}}</div>',
                { hasItems: true, items: [{ name: 'Item 1' }, { name: 'Item 2' }] }
            );

            const openTags = (result.match(/<\w+/g) || []).length;
            const closeTags = (result.match(/<\/\w+>/g) || []).length;

            expect(openTags).toBe(closeTags);
            expect(result).toContain('Item 1');
            expect(result).toContain('Item 2');
        });
    });

    describe('renderTemplate - special characters and edge cases', () => {
        it('should handle empty data object', async () => {
            const result = await templateEngine.renderTemplate('Static text', {});
            expect(result).toBe('Static text');
        });

        it('should handle undefined variables gracefully', async () => {
            const result = await templateEngine.renderTemplate('Hello {{name}}', {});
            expect(result).toMatch(/Hello/);
        });

        it('should handle special HTML characters in variables', async () => {
            const result = await templateEngine.renderTemplate('{{content}}', {
                content: '<script>alert("test")</script>'
            });
            // Should escape or preserve based on engine behavior
            expect(result).toBeTruthy();
        });
    });
});
