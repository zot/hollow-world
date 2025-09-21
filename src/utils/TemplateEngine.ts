// Simple HTML Template Engine for Character Management
// Replaces JavaScript template literals with external HTML files

export interface ITemplateEngine {
    loadTemplate(templateName: string): Promise<string>;
    renderTemplate(template: string, data: Record<string, any>): string;
    renderTemplateFromFile(templateName: string, data: Record<string, any>): Promise<string>;
}

export class TemplateEngine implements ITemplateEngine {
    private templateCache = new Map<string, string>();

    async loadTemplate(templateName: string): Promise<string> {
        // Check cache first
        if (this.templateCache.has(templateName)) {
            return this.templateCache.get(templateName)!;
        }

        try {
            const response = await fetch(`/templates/${templateName}.html`);
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

        // Replace {{variable}} with data values
        result = result.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const trimmedKey = key.trim();
            return data[trimmedKey] !== undefined ? String(data[trimmedKey]) : '';
        });

        // Handle basic conditional blocks {{#if condition}}...{{/if}}
        result = result.replace(/\{\{#if\s+([^}]+)\}\}(.*?)\{\{\/if\}\}/gs, (match, condition, content) => {
            const trimmedCondition = condition.trim();
            const value = data[trimmedCondition];

            // Show content if value is truthy
            if (value && value !== '0' && value !== 'false') {
                return content;
            }
            return '';
        });

        // Handle basic loop blocks {{#each array}}...{{/each}}
        result = result.replace(/\{\{#each\s+([^}]+)\}\}(.*?)\{\{\/each\}\}/gs, (match, arrayKey, itemTemplate) => {
            const trimmedKey = arrayKey.trim();
            const array = data[trimmedKey];

            if (!Array.isArray(array)) {
                return '';
            }

            return array.map(item => {
                return this.renderTemplate(itemTemplate, { ...data, ...item });
            }).join('');
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
export const templateEngine = new TemplateEngine();