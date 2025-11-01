// Simple HTML Template Engine for Character Management
// Replaces JavaScript template literals with external HTML files

export interface ITemplateEngine {
    loadTemplate(templateName: string): Promise<string>;
    renderTemplate(template: string, data: Record<string, any>): string;
    renderTemplateFromFile(templateName: string, data: Record<string, any>): Promise<string>;
}

export class TemplateEngine implements ITemplateEngine {
    private templateCache = new Map<string, string>();
    private base: URL;

    constructor(base: URL = new URL(window.location.origin + '/')) {
        this.base = base;
    }

    async loadTemplate(templateName: string): Promise<string> {
        // Check cache first
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName)!;
        }

        try {
            const url = new URL(`templates/${templateName}.html`, this.base).toString();
            console.log('TemplateEngine fetching URL:', url);
            const response = await fetch(url);
            console.log('Template fetch response:', response.status, response.url);
            if (!response.ok) {
                throw new Error(`Template ${templateName} not found`);
            }

            const template = await response.text();
            this.templateCache.set(templateName, template);
            return template;
        } catch (error) {
            console.error(`Failed to load template ${templateName}:`, error);
            throw error;
        }
    }

    renderTemplate(template: string, data: Record<string, any>): string {
        let result = template;

        // Handle {{#each}} blocks with proper nesting support
        // Process all {{#each}} blocks by finding matching closing tags via depth counting
        while (true) {
            const eachMatch = result.match(/\{\{#each\s+([^}]+)\}\}/);
            if (!eachMatch) break;

            const startIndex = eachMatch.index!;
            const arrayKey = eachMatch[1].trim();
            const openTag = eachMatch[0];
            
            // Find the matching {{/each}} by counting nesting depth
            let depth = 1;
            let pos = startIndex + openTag.length;
            let endIndex = -1;

            while (pos < result.length && depth > 0) {
                const nextOpen = result.indexOf('{{#each', pos);
                const nextClose = result.indexOf('{{/each}}', pos);

                if (nextClose === -1) {
                    throw new Error(`Unclosed {{#each}} block for "${arrayKey}"`);
                }

                if (nextOpen !== -1 && nextOpen < nextClose) {
                    // Found nested {{#each}} before next {{/each}}
                    depth++;
                    pos = nextOpen + 7; // length of '{{#each'
                } else {
                    // Found {{/each}}
                    depth--;
                    if (depth === 0) {
                        endIndex = nextClose;
                    }
                    pos = nextClose + 9; // length of '{{/each}}'
                }
            }

            if (endIndex === -1) {
                throw new Error(`Unclosed {{#each}} block for "${arrayKey}"`);
            }

            // Extract the content between opening and closing tags
            const itemTemplate = result.substring(startIndex + openTag.length, endIndex);
            const array = data[arrayKey];

            let replacement = '';
            if (Array.isArray(array)) {
                replacement = array.map(item => {
                    return this.renderTemplate(itemTemplate, { ...data, ...item });
                }).join('');
            }

            // Replace the entire {{#each}}...{{/each}} block with the rendered content
            result = result.substring(0, startIndex) + replacement + result.substring(endIndex + 9);
        }

        // Handle basic conditional blocks {{#if condition}}...{{/if}}
        // Use the same depth-counting approach for proper nesting
        while (true) {
            const ifMatch = result.match(/\{\{#if\s+([^}]+)\}\}/);
            if (!ifMatch) break;

            const startIndex = ifMatch.index!;
            const conditionKey = ifMatch[1].trim();
            const openTag = ifMatch[0];
            
            // Find the matching {{/if}} by counting nesting depth
            let depth = 1;
            let pos = startIndex + openTag.length;
            let endIndex = -1;

            while (pos < result.length && depth > 0) {
                const nextOpen = result.indexOf('{{#if', pos);
                const nextClose = result.indexOf('{{/if}}', pos);

                if (nextClose === -1) {
                    throw new Error(`Unclosed {{#if}} block for "${conditionKey}"`);
                }

                if (nextOpen !== -1 && nextOpen < nextClose) {
                    // Found nested {{#if}} before next {{/if}}
                    depth++;
                    pos = nextOpen + 5; // length of '{{#if'
                } else {
                    // Found {{/if}}
                    depth--;
                    if (depth === 0) {
                        endIndex = nextClose;
                    }
                    pos = nextClose + 7; // length of '{{/if}}'
                }
            }

            if (endIndex === -1) {
                throw new Error(`Unclosed {{#if}} block for "${conditionKey}"`);
            }

            // Extract the content between opening and closing tags
            const content = result.substring(startIndex + openTag.length, endIndex);
            const value = data[conditionKey];

            let replacement = '';
            // Show content if value is truthy
            if (value && value !== '0' && value !== 'false') {
                replacement = this.renderTemplate(content, data);
            }

            // Replace the entire {{#if}}...{{/if}} block with the rendered content
            result = result.substring(0, startIndex) + replacement + result.substring(endIndex + 7);
        }

        // Replace {{variable}} with data values LAST
        result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : '';
        });

        return result;
    }

    async renderTemplateFromFile(templateName: string, data: Record<string, any>): Promise<string> {
        const template = await this.loadTemplate(templateName);
        return this.renderTemplate(template, data);
    }

    // Clear template cache (useful for development)
    clearCache(): void {
        this.templateCache.clear();
    }

    // Pre-load commonly used templates for better performance
    async preloadTemplates(templateNames: string[]): Promise<void> {
        const promises = templateNames.map(name => this.loadTemplate(name));
        await Promise.all(promises);
    }
}

// Singleton instance for the application
export const templateEngine = new TemplateEngine(window.Base);
