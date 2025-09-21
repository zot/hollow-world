// Character Manager View following SOLID principles
// Interface for managing multiple characters in the game

import { ICharacter, AttributeType } from '../character/types.js';
import { CharacterSheet } from '../character/CharacterSheet.js';
import { IUIComponent } from './SplashScreen.js';
import { templateEngine } from '../utils/TemplateEngine.js';

export interface ICharacterManager extends IUIComponent {
    getCharacters(): ICharacter[];
    createNewCharacter(): void;
    editCharacter(characterId: string): void;
    deleteCharacter(characterId: string): void;
    onBackToMenu?: () => void;
    onCharacterSelected?: (character: ICharacter) => void;
}

export interface ICharacterManagerConfig {
    containerClass: string;
    headerClass: string;
    listClass: string;
    actionsClass: string;
    characterItemClass: string;
    backButtonClass: string;
    newCharacterButtonClass: string;
}

const DEFAULT_CONFIG: ICharacterManagerConfig = {
    containerClass: 'character-manager-container',
    headerClass: 'character-manager-header',
    listClass: 'character-list',
    actionsClass: 'character-manager-actions',
    characterItemClass: 'character-item',
    backButtonClass: 'back-to-menu-button',
    newCharacterButtonClass: 'new-character-button'
};

// Sample character data for demonstration
const SAMPLE_CHARACTERS: ICharacter[] = [
    {
        id: 'char-1',
        name: 'Jack "Dead-Eye" Malone',
        description: 'A weathered gunslinger with a mysterious past',
        rank: 3,
        currentXP: 45,
        totalXP: 120,
        damageCapacity: 12,
        attributes: {
            [AttributeType.DEX]: 4,
            [AttributeType.STR]: 3,
            [AttributeType.CON]: 3,
            [AttributeType.CHA]: 2,
            [AttributeType.WIS]: 2,
            [AttributeType.GRI]: 1,
            [AttributeType.INT]: 2,
            [AttributeType.PER]: 5
        },
        skills: [
            {
                id: 'firearms',
                name: 'Firearms',
                level: 4,
                isListed: true,
                isSpecialized: true,
                attribute: 'coordination',
                costMultiplier: 1,
                prerequisites: []
            },
            {
                id: 'perception',
                name: 'Perception',
                level: 3,
                isListed: true,
                isSpecialized: false,
                attribute: 'sense',
                costMultiplier: 1,
                prerequisites: []
            }
        ],
        fields: [
            {
                id: 'gunfighter',
                name: 'Gunfighter',
                level: 2,
                isFrozen: true
            }
        ],
        benefits: [
            {
                id: 'quickdraw',
                name: 'Quick Draw',
                level: 2,
                condition: 'Initiative rolls with firearms',
                description: 'Lightning-fast draw when danger strikes'
            }
        ],
        drawbacks: [
            {
                id: 'haunted',
                name: 'Haunted Past',
                level: 1,
                condition: 'Social situations in civilized areas',
                description: 'Reputation precedes him in most towns'
            }
        ],
        hollow: {
            dust: 2,
            burned: 0,
            hollowInfluence: 2,
            glimmerDebt: 0,
            glimmerDebtTotal: 0,
            newMoonMarks: 0
        },
        items: [
            {
                id: 'revolver',
                name: 'Colt Peacemaker',
                description: 'Well-maintained six-shooter with ivory grips',
                level: 1
            }
        ],
        companions: []
    },
    {
        id: 'char-2',
        name: 'Sarah "Doc" Winchester',
        description: 'Traveling physician with a keen interest in the supernatural',
        rank: 2,
        currentXP: 25,
        totalXP: 75,
        damageCapacity: 8,
        attributes: {
            [AttributeType.DEX]: 2,
            [AttributeType.STR]: 1,
            [AttributeType.CON]: 1,
            [AttributeType.CHA]: 3,
            [AttributeType.WIS]: 3,
            [AttributeType.GRI]: 3,
            [AttributeType.INT]: 5,
            [AttributeType.PER]: 4
        },
        skills: [
            {
                id: 'medicine',
                name: 'Medicine',
                level: 3,
                isListed: true,
                isSpecialized: true,
                attribute: 'mind',
                costMultiplier: 1,
                prerequisites: []
            },
            {
                id: 'occult',
                name: 'Occult',
                level: 2,
                isListed: true,
                isSpecialized: false,
                attribute: 'mind',
                costMultiplier: 1,
                prerequisites: []
            }
        ],
        fields: [
            {
                id: 'physician',
                name: 'Physician',
                level: 2,
                isFrozen: true
            }
        ],
        benefits: [
            {
                id: 'healer',
                name: 'Natural Healer',
                level: 1,
                condition: 'Medical treatment rolls',
                description: 'Instinctive understanding of anatomy and healing'
            }
        ],
        drawbacks: [],
        hollow: {
            dust: 1,
            burned: 0,
            hollowInfluence: 1,
            glimmerDebt: 0,
            glimmerDebtTotal: 0,
            newMoonMarks: 0
        },
        items: [
            {
                id: 'medical-bag',
                name: 'Medical Bag',
                description: 'Well-stocked physician\'s kit with surgical tools',
                level: 2
            }
        ],
        companions: []
    }
];

export class CharacterManagerView implements ICharacterManager {
    private config: ICharacterManagerConfig;
    private container: HTMLElement | null = null;
    private characters: ICharacter[] = [];
    private selectedCharacter: ICharacter | null = null;
    private currentView: 'list' | 'edit' = 'list';
    private characterSheet: CharacterSheet | null = null;

    // Performance optimization properties
    private renderCache = new Map<string, string>();
    private isRendering = false;
    private pendingUpdate = false;

    public onBackToMenu?: () => void;
    public onCharacterSelected?: (character: ICharacter) => void;

    constructor(config: Partial<ICharacterManagerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.characters = this.loadCharactersFromStorage() || [...SAMPLE_CHARACTERS];
    }

    render(container: HTMLElement): void {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        this.debouncedRender();
    }

    private debouncedRender(): void {
        if (this.isRendering) {
            this.pendingUpdate = true;
            return;
        }

        this.isRendering = true;

        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(async () => {
            try {
                if (this.currentView === 'list') {
                    await this.renderCharacterList();
                } else if (this.currentView === 'edit' && this.selectedCharacter) {
                    await this.renderCharacterEditor();
                }

                this.applyStyles();
            } catch (error) {
                console.error('Render failed:', error);
                this.showErrorMessage('Failed to render interface. Please refresh the page.');
            } finally {
                this.isRendering = false;

                // If there's a pending update, render again
                if (this.pendingUpdate) {
                    this.pendingUpdate = false;
                    this.debouncedRender();
                }
            }
        });
    }

    destroy(): void {
        if (this.characterSheet) {
            this.characterSheet.destroy();
            this.characterSheet = null;
        }

        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }

        this.selectedCharacter = null;
        this.currentView = 'list';
    }

    getCharacters(): ICharacter[] {
        return [...this.characters];
    }

    createNewCharacter(): void {
        try {
            const newCharacter: ICharacter = {
                id: crypto.randomUUID(),
                name: 'New Character',
                description: 'A mysterious newcomer to the frontier',
                rank: 1,
                currentXP: 10,  // Starting XP from game rules
                totalXP: 10,
                damageCapacity: 10,  // 10 + CON (0) = 10
                attributes: {
                    [AttributeType.DEX]: 0,
                    [AttributeType.STR]: 0,
                    [AttributeType.CON]: 0,
                    [AttributeType.CHA]: 0,
                    [AttributeType.WIS]: 0,
                    [AttributeType.GRI]: 0,
                    [AttributeType.INT]: 0,
                    [AttributeType.PER]: 0
                },
                skills: [],
                fields: [],
                benefits: [],
                drawbacks: [],
                hollow: {
                    dust: 10,  // Starting dust from game rules
                    burned: 0,
                    hollowInfluence: 0,
                    glimmerDebt: 0,
                    glimmerDebtTotal: 0,
                    newMoonMarks: 0
                },
                items: [],
                companions: []
            };

            this.characters.push(newCharacter);
            this.saveCharactersToStorage();
            this.editCharacter(newCharacter.id);
        } catch (error) {
            console.error('Failed to create new character:', error);
            this.showErrorMessage('Failed to create new character. Please try again.');
        }
    }

    editCharacter(characterId: string): void {
        const character = this.characters.find(c => c.id === characterId);
        if (!character) {
            console.error('Character not found:', characterId);
            return;
        }

        this.selectedCharacter = character;
        this.currentView = 'edit';
        this.render(this.container!);
    }

    deleteCharacter(characterId: string): void {
        if (confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
            try {
                this.characters = this.characters.filter(c => c.id !== characterId);
                this.saveCharactersToStorage();

                if (this.selectedCharacter?.id === characterId) {
                    this.selectedCharacter = null;
                    this.currentView = 'list';
                }

                if (this.currentView === 'list') {
                    this.render(this.container!);
                }
            } catch (error) {
                console.error('Failed to delete character:', error);
                this.showErrorMessage('Failed to delete character. Please try again.');
            }
        }
    }

    private loadCharactersFromStorage(): ICharacter[] | null {
        try {
            const stored = localStorage.getItem('hollow-world-characters');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    return parsed.map(char => this.validateAndFixCharacter(char));
                }
            }
            return null;
        } catch (error) {
            console.error('Failed to load characters from storage:', error);
            this.showErrorMessage('Failed to load saved characters. Using default characters.');
            return null;
        }
    }

    private saveCharactersToStorage(): void {
        try {
            localStorage.setItem('hollow-world-characters', JSON.stringify(this.characters));
            // Clear render cache when saving as character data may have changed
            this.clearRenderCache();
        } catch (error) {
            console.error('Failed to save characters to storage:', error);
            if (error instanceof Error && error.name === 'QuotaExceededError') {
                this.showErrorMessage('Storage quota exceeded. Please delete some characters to free up space.');
            } else {
                this.showErrorMessage('Failed to save characters. Changes may not be preserved.');
            }
            throw error;
        }
    }

    private clearRenderCache(characterId?: string): void {
        if (characterId) {
            // Clear cache for specific character
            const keysToDelete = Array.from(this.renderCache.keys()).filter(key =>
                key.includes(`"id":"${characterId}"`));
            keysToDelete.forEach(key => this.renderCache.delete(key));
        } else {
            // Clear entire cache
            this.renderCache.clear();
        }
    }

    private validateAndFixCharacter(character: any): ICharacter {
        try {
            // Basic validation and fixing of character data
            const validatedCharacter: ICharacter = {
                id: character.id || crypto.randomUUID(),
                name: character.name || 'Unknown Character',
                description: character.description || '',
                rank: Math.max(1, Math.min(15, parseInt(character.rank) || 1)),
                currentXP: Math.max(0, parseInt(character.currentXP) || 0),
                totalXP: Math.max(0, parseInt(character.totalXP) || 0),
                damageCapacity: Math.max(1, parseInt(character.damageCapacity) || 10),
                attributes: {
                    [AttributeType.DEX]: Math.max(-2, Math.min(15, parseInt(character.attributes?.[AttributeType.DEX]) || 0)),
                    [AttributeType.STR]: Math.max(-2, Math.min(15, parseInt(character.attributes?.[AttributeType.STR]) || 0)),
                    [AttributeType.CON]: Math.max(-2, Math.min(15, parseInt(character.attributes?.[AttributeType.CON]) || 0)),
                    [AttributeType.CHA]: Math.max(-2, Math.min(15, parseInt(character.attributes?.[AttributeType.CHA]) || 0)),
                    [AttributeType.WIS]: Math.max(-2, Math.min(15, parseInt(character.attributes?.[AttributeType.WIS]) || 0)),
                    [AttributeType.GRI]: Math.max(-2, Math.min(15, parseInt(character.attributes?.[AttributeType.GRI]) || 0)),
                    [AttributeType.INT]: Math.max(-2, Math.min(15, parseInt(character.attributes?.[AttributeType.INT]) || 0)),
                    [AttributeType.PER]: Math.max(-2, Math.min(15, parseInt(character.attributes?.[AttributeType.PER]) || 0)),
                },
                skills: Array.isArray(character.skills) ? character.skills : [],
                fields: Array.isArray(character.fields) ? character.fields : [],
                benefits: Array.isArray(character.benefits) ? character.benefits : [],
                drawbacks: Array.isArray(character.drawbacks) ? character.drawbacks : [],
                hollow: {
                    dust: Math.max(0, parseInt(character.hollow?.dust) || 0),
                    burned: Math.max(0, parseInt(character.hollow?.burned) || 0),
                    hollowInfluence: Math.max(0, parseInt(character.hollow?.hollowInfluence) || 0),
                    glimmerDebt: Math.max(0, parseInt(character.hollow?.glimmerDebt) || 0),
                    glimmerDebtTotal: Math.max(0, parseInt(character.hollow?.glimmerDebtTotal) || 0),
                    newMoonMarks: Math.max(0, parseInt(character.hollow?.newMoonMarks) || 0)
                },
                items: Array.isArray(character.items) ? character.items : [],
                companions: Array.isArray(character.companions) ? character.companions : []
            };
            return validatedCharacter;
        } catch (error) {
            console.error('Failed to validate character:', error);
            // Return a minimal valid character if validation fails completely
            return {
                id: crypto.randomUUID(),
                name: 'Corrupted Character',
                description: 'This character data was corrupted and has been reset',
                rank: 1,
                currentXP: 0,
                totalXP: 0,
                damageCapacity: 10,
                attributes: {
                    [AttributeType.DEX]: 0,
                    [AttributeType.STR]: 0,
                    [AttributeType.CON]: 0,
                    [AttributeType.CHA]: 0,
                    [AttributeType.WIS]: 0,
                    [AttributeType.GRI]: 0,
                    [AttributeType.INT]: 0,
                    [AttributeType.PER]: 0
                },
                skills: [],
                fields: [],
                benefits: [],
                drawbacks: [],
                hollow: { dust: 0, burned: 0, hollowInfluence: 0, glimmerDebt: 0, glimmerDebtTotal: 0, newMoonMarks: 0 },
                items: [],
                companions: []
            };
        }
    }

    private showErrorMessage(message: string): void {
        // Create a temporary error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        document.body.appendChild(errorDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    private async renderCharacterList(): Promise<void> {
        if (!this.container) return;

        try {
            const listHtml = await templateEngine.renderTemplateFromFile('character-list', {
                characterCount: this.characters.length
            });

            this.container.innerHTML = listHtml;

            // Populate character cards or empty state
            const cardsContainer = this.container.querySelector('.character-cards');
            if (cardsContainer) {
                if (this.characters.length > 0) {
                    cardsContainer.setAttribute('aria-label', `Your characters (${this.characters.length} total)`);
                    cardsContainer.innerHTML = await this.renderCharacterList_Virtual();
                } else {
                    const emptyHtml = await templateEngine.renderTemplateFromFile('empty-state', {});
                    cardsContainer.innerHTML = emptyHtml;
                }
            }

            this.setupListEventListeners();
        } catch (error) {
            console.error('Failed to render character list:', error);
            this.showErrorMessage('Failed to render character list. Please refresh the page.');
        }
    }

    private async renderCharacterCard(character: ICharacter): Promise<string> {
        // Create a cache key based on character data
        const cacheKey = this.createCharacterCacheKey(character);

        // Check if we have a cached version
        if (this.renderCache.has(cacheKey)) {
            return this.renderCache.get(cacheKey)!;
        }

        const primaryStats = [
            `Rank: ${character.rank}`,
            `XP: ${character.currentXP}/${character.totalXP}`,
            `DC: ${character.damageCapacity}`,
            `Dust: ${character.hollow.dust}`
        ].join(' • ');

        const attributes = [
            `DEX: ${character.attributes[AttributeType.DEX]}`,
            `STR: ${character.attributes[AttributeType.STR]}`,
            `CON: ${character.attributes[AttributeType.CON]}`,
            `CHA: ${character.attributes[AttributeType.CHA]}`,
            `WIS: ${character.attributes[AttributeType.WIS]}`,
            `GRI: ${character.attributes[AttributeType.GRI]}`,
            `INT: ${character.attributes[AttributeType.INT]}`,
            `PER: ${character.attributes[AttributeType.PER]}`
        ].join(' • ');

        try {
            const cardHtml = await templateEngine.renderTemplateFromFile('character-card', {
                id: character.id,
                name: character.name,
                primaryStats: primaryStats,
                attributes: attributes
            });

            // Cache the rendered HTML
            this.renderCache.set(cacheKey, cardHtml);

            // Limit cache size to prevent memory leaks
            if (this.renderCache.size > 100) {
                const firstKey = this.renderCache.keys().next().value;
                this.renderCache.delete(firstKey);
            }

            return cardHtml;
        } catch (error) {
            console.error('Failed to render character card:', error);
            return `<div class="error">Failed to render character: ${character.name}</div>`;
        }
    }

    private createCharacterCacheKey(character: ICharacter): string {
        // Create a hash-like key from character's critical data
        const keyData = {
            id: character.id,
            name: character.name,
            rank: character.rank,
            currentXP: character.currentXP,
            totalXP: character.totalXP,
            damageCapacity: character.damageCapacity,
            dust: character.hollow.dust,
            attributes: character.attributes
        };

        return JSON.stringify(keyData);
    }

    private async renderCharacterList_Virtual(): Promise<string> {
        // For small lists (< 20 characters), render all at once
        if (this.characters.length <= 20) {
            const cardPromises = this.characters.map(character => this.renderCharacterCard(character));
            const cards = await Promise.all(cardPromises);
            return cards.join('');
        }

        // For larger lists, implement basic chunking
        // In a real implementation, this would include proper virtual scrolling
        const CHUNK_SIZE = 20;
        const chunks = [];

        for (let i = 0; i < this.characters.length; i += CHUNK_SIZE) {
            const chunk = this.characters.slice(i, i + CHUNK_SIZE);
            chunks.push(chunk);
        }

        // Render first chunk immediately, lazy load others
        const firstChunkPromises = chunks[0].map(character => this.renderCharacterCard(character));
        const firstChunkCards = await Promise.all(firstChunkPromises);
        let html = firstChunkCards.join('');

        if (chunks.length > 1) {
            // For larger lists, we'll implement a simpler load more button
            html += `
                <div id="lazy-load-trigger" class="lazy-load-more">
                    <button class="load-more-btn" data-remaining="${this.characters.length - CHUNK_SIZE}">
                        Load ${this.characters.length - CHUNK_SIZE} more characters...
                    </button>
                </div>
            `;
        }

        return html;
    }

    // User Experience Testing Methods
    public validateUserWorkflows(): string[] {
        const issues: string[] = [];

        try {
            // Test 1: Character creation workflow
            const originalCount = this.characters.length;
            this.createNewCharacter();
            if (this.characters.length !== originalCount + 1) {
                issues.push('Character creation workflow failed: Character count did not increase');
            }
            if (this.currentView !== 'edit') {
                issues.push('Character creation workflow failed: Did not navigate to edit view');
            }

            // Test 2: Character validation
            if (this.selectedCharacter) {
                const testCharacter = { ...this.selectedCharacter };
                testCharacter.rank = -1; // Invalid rank
                const validatedChar = this.validateAndFixCharacter(testCharacter);
                if (validatedChar.rank !== 1) {
                    issues.push('Character validation failed: Invalid rank not corrected');
                }
            }

            // Test 3: Storage functionality
            try {
                this.saveCharactersToStorage();
                const loaded = this.loadCharactersFromStorage();
                if (!loaded || loaded.length !== this.characters.length) {
                    issues.push('Storage workflow failed: Save/load character count mismatch');
                }
            } catch (error) {
                issues.push('Storage workflow failed: Exception during save/load');
            }

            // Test 4: UI Responsiveness check
            const containerTest = document.createElement('div');
            try {
                this.render(containerTest);
                if (!containerTest.innerHTML) {
                    issues.push('UI rendering failed: Empty container after render');
                }
            } catch (error) {
                issues.push('UI rendering failed: Exception during render');
            }

            // Test 5: Cache performance
            if (this.characters.length > 0) {
                const startTime = performance.now();
                this.renderCharacterCard(this.characters[0]);
                const firstRenderTime = performance.now() - startTime;

                const cacheStartTime = performance.now();
                this.renderCharacterCard(this.characters[0]);
                const cachedRenderTime = performance.now() - cacheStartTime;

                if (cachedRenderTime >= firstRenderTime) {
                    issues.push('Performance issue: Cached rendering not faster than initial render');
                }
            }

            // Clean up test character
            if (this.characters.length > originalCount) {
                this.characters.pop();
                this.selectedCharacter = null;
                this.currentView = 'list';
            }

        } catch (error) {
            issues.push(`Workflow testing failed with exception: ${error}`);
        }

        return issues;
    }

    public runAccessibilityAudit(): string[] {
        const issues: string[] = [];

        if (!this.container) {
            issues.push('No container available for accessibility audit');
            return issues;
        }

        // Check for proper ARIA labels
        const buttons = this.container.querySelectorAll('button');
        buttons.forEach((button, index) => {
            const hasLabel = button.getAttribute('aria-label') || button.getAttribute('title') || button.textContent?.trim();
            if (!hasLabel) {
                issues.push(`Button ${index + 1} missing accessibility label`);
            }
        });

        // Check for proper heading structure
        const headings = this.container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
            issues.push('No heading elements found for screen reader navigation');
        }

        // Check for proper form labels (if any inputs exist)
        const inputs = this.container.querySelectorAll('input, select, textarea');
        inputs.forEach((input, index) => {
            const hasLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby') ||
                            this.container!.querySelector(`label[for="${input.id}"]`);
            if (!hasLabel) {
                issues.push(`Input field ${index + 1} missing accessibility label`);
            }
        });

        // Check for keyboard navigation support
        const focusableElements = this.container.querySelectorAll('[tabindex], button, input, select, textarea, a[href]');
        if (focusableElements.length === 0) {
            issues.push('No focusable elements found for keyboard navigation');
        }

        return issues;
    }

    public generateUXReport(): string {
        const workflowIssues = this.validateUserWorkflows();
        const accessibilityIssues = this.runAccessibilityAudit();

        const report = `
# Character Manager UX Test Report

## Workflow Testing Results
${workflowIssues.length === 0 ? '✅ All workflow tests passed!' : '❌ Issues found:'}
${workflowIssues.map(issue => `- ${issue}`).join('\n')}

## Accessibility Audit Results
${accessibilityIssues.length === 0 ? '✅ No accessibility issues found!' : '❌ Issues found:'}
${accessibilityIssues.map(issue => `- ${issue}`).join('\n')}

## Performance Metrics
- Render cache size: ${this.renderCache.size} entries
- Character count: ${this.characters.length}
- Current view: ${this.currentView}

## Recommendations
${workflowIssues.length === 0 && accessibilityIssues.length === 0 ?
    '✅ Character manager is working well! Consider adding more characters to test performance at scale.' :
    '⚠️ Address the issues above to improve user experience.'}
        `;

        return report.trim();
    }

    private async renderCharacterEditor(): Promise<void> {
        if (!this.container || !this.selectedCharacter) return;

        try {
            const editorHtml = await templateEngine.renderTemplateFromFile('character-editor', {
                characterName: this.selectedCharacter.name
            });

            this.container.innerHTML = editorHtml;

            const sheetContainer = this.container.querySelector('#character-sheet-container') as HTMLElement;
            if (sheetContainer) {
                this.characterSheet = new CharacterSheet(this.selectedCharacter, {
                    readOnly: false,
                    showCreationMode: true
                });

                this.characterSheet.render(sheetContainer);
            }

            this.setupEditorEventListeners();
        } catch (error) {
            console.error('Failed to render character editor:', error);
            this.showErrorMessage('Failed to render character editor. Please try again.');
        }
    }

    private setupListEventListeners(): void {
        if (!this.container) return;

        this.container.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const action = target.dataset.action;
                const characterId = target.dataset.characterId;

                if (!characterId) return;

                switch (action) {
                    case 'edit':
                        this.editCharacter(characterId);
                        break;
                    case 'delete':
                        this.deleteCharacter(characterId);
                        break;
                }
            });

            // Add keyboard support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    button.click();
                }
            });
        });

        // Add keyboard navigation for character items
        this.container.querySelectorAll('.character-item').forEach((item, index) => {
            item.addEventListener('keydown', (e) => {
                const items = Array.from(this.container!.querySelectorAll('.character-item'));
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextItem = items[index + 1] as HTMLElement;
                        nextItem?.focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevItem = items[index - 1] as HTMLElement;
                        prevItem?.focus();
                        break;
                    case 'Home':
                        e.preventDefault();
                        (items[0] as HTMLElement)?.focus();
                        break;
                    case 'End':
                        e.preventDefault();
                        (items[items.length - 1] as HTMLElement)?.focus();
                        break;
                }
            });
        });

        const addCharacterBtn = this.container.querySelector('#add-character-btn');
        if (addCharacterBtn) {
            addCharacterBtn.addEventListener('click', () => {
                this.createNewCharacter();
            });
        }

        const backBtn = this.container.querySelector('#back-to-menu-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.onBackToMenu) {
                    this.onBackToMenu();
                }
            });
        }
    }

    private setupEditorEventListeners(): void {
        if (!this.container) return;

        const nopeBtn = this.container.querySelector('#nope-character-btn');
        if (nopeBtn) {
            nopeBtn.addEventListener('click', () => {
                this.currentView = 'list';
                this.render(this.container!);
            });
        }

        const yepBtn = this.container.querySelector('#yep-character-btn');
        if (yepBtn) {
            yepBtn.addEventListener('click', () => {
                if (this.characterSheet && this.selectedCharacter) {
                    try {
                        const updatedCharacter = this.characterSheet.getCharacter();
                        const errors = this.characterSheet.validateCharacter();

                        if (errors.length > 0) {
                            this.showErrorMessage('Character validation failed:\n\n' + errors.join('\n'));
                            return;
                        }

                        const index = this.characters.findIndex(c => c.id === this.selectedCharacter!.id);
                        if (index >= 0) {
                            this.characters[index] = updatedCharacter;
                            this.saveCharactersToStorage();
                            this.currentView = 'list';
                            this.render(this.container!);
                        } else {
                            throw new Error('Character not found in list');
                        }
                    } catch (error) {
                        console.error('Failed to save character:', error);
                        this.showErrorMessage('Failed to save character changes. Please try again.');
                    }
                }
            });
        }
    }

    private applyStyles(): void {
        if (!document.getElementById('character-manager-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'character-manager-styles';
            styleSheet.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Rye&family=Sancreek&family=Creepster&display=swap');

                /* Screen reader only content */
                .sr-only {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    padding: 0;
                    margin: -1px;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    white-space: nowrap;
                    border: 0;
                }

                /* Focus styles for accessibility */
                .character-item:focus,
                .character-card-content:focus,
                button:focus,
                input:focus {
                    outline: 3px solid #ff6347;
                    outline-offset: 2px;
                    box-shadow: 0 0 0 2px white, 0 0 0 5px #ff6347;
                }

                /* Error notification styles */
                .error-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    background: linear-gradient(45deg, #dc143c, #b22222);
                    border: 3px solid #8b0000;
                    border-radius: 8px;
                    box-shadow:
                        0 4px 20px rgba(0,0,0,0.5),
                        inset 0 0 10px rgba(255,255,255,0.1);
                    animation: errorSlideIn 0.3s ease-out;
                    max-width: 400px;
                    font-family: 'Rye', serif;
                }

                .error-content {
                    display: flex;
                    align-items: center;
                    padding: 15px;
                    color: white;
                    gap: 10px;
                }

                .error-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .error-text {
                    flex: 1;
                    font-size: 0.9rem;
                    line-height: 1.3;
                }

                .error-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background-color 0.2s;
                }

                .error-close:hover {
                    background: rgba(255,255,255,0.2);
                }

                @keyframes errorSlideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }

                .character-manager-container {
                    font-family: 'Rye', 'Times New Roman', serif;
                    background:
                        radial-gradient(circle at center, rgba(255,248,220,0.1) 0%, transparent 50%),
                        linear-gradient(45deg, #8b4513 0%, #deb887 25%, #f4a460 50%, #deb887 75%, #8b4513 100%);
                    min-height: 100vh;
                    padding: 20px;
                    color: #3d2914;
                    position: relative;
                }

                .character-manager-container::before {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                    border: 4px solid #8b4513;
                    pointer-events: none;
                    border-image: repeating-linear-gradient(
                        45deg,
                        #8b4513,
                        #8b4513 10px,
                        #654321 10px,
                        #654321 20px
                    ) 4;
                }

                .character-manager-container::after {
                    content: '🤠';
                    position: absolute;
                    top: 20px;
                    right: 30px;
                    font-size: 2rem;
                    z-index: 1;
                    opacity: 0.6;
                    pointer-events: none;
                }

                .character-manager-header {
                    text-align: center;
                    margin-bottom: 40px;
                    padding: 20px;
                    background: rgba(222,184,135,0.9);
                    border: 3px solid #8b4513;
                    border-radius: 8px;
                    position: relative;
                    z-index: 10;
                }

                .character-manager-header h1 {
                    font-family: 'Sancreek', serif;
                    font-size: 3rem;
                    color: #8b4513;
                    margin: 0 0 10px 0;
                    text-shadow:
                        2px 2px 0px #000,
                        3px 3px 0px #654321,
                        4px 4px 0px #4a2c1a;
                }

                .header-description {
                    color: #654321;
                    font-style: italic;
                    margin: 0;
                    font-size: 1.1rem;
                }

                .editor-actions {
                    margin-top: 20px;
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                    max-width: 400px;
                    margin-left: auto;
                    margin-right: auto;
                }

                .character-cards {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    margin-bottom: 40px;
                    position: relative;
                    z-index: 10;
                }

                .character-item {
                    background:
                        repeating-linear-gradient(
                            90deg,
                            rgba(222,184,135,0.1) 0px,
                            transparent 1px,
                            transparent 3px,
                            rgba(222,184,135,0.1) 4px
                        ),
                        radial-gradient(ellipse at top left, rgba(255,248,220,0.9) 0%, transparent 50%),
                        radial-gradient(ellipse at top right, rgba(222,184,135,0.7) 0%, transparent 50%),
                        radial-gradient(ellipse at bottom left, rgba(210,180,140,0.6) 0%, transparent 50%),
                        rgba(255,248,220,0.95);
                    border: 3px solid #cd853f;
                    border-radius: 8px;
                    padding: 0;
                    transition: all 0.3s ease;
                    position: relative;
                    box-shadow:
                        inset 0 0 20px rgba(222,184,135,0.5),
                        inset 2px 2px 10px rgba(139,69,19,0.1),
                        0 0 15px rgba(0,0,0,0.3),
                        0 3px 6px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: stretch;
                    cursor: pointer;
                    overflow: hidden;
                }

                .character-item:hover {
                    background: rgba(255,248,220,1);
                    border-color: #8b4513;
                    transform: translateY(-2px);
                    box-shadow:
                        inset 0 0 25px rgba(222,184,135,0.7),
                        0 5px 20px rgba(0,0,0,0.4);
                }

                .character-card-content {
                    flex: 1;
                    padding: 20px;
                    cursor: pointer;
                }

                .character-name h3 {
                    font-family: 'Sancreek', serif;
                    color: #8b4513;
                    margin: 0 0 15px 0;
                    font-size: 1.5rem;
                }

                .character-stats {
                    color: #654321;
                    font-size: 0.9rem;
                    line-height: 1.4;
                }

                .primary-stats {
                    font-weight: bold;
                    margin-bottom: 8px;
                    color: #8b4513;
                }

                .attributes {
                    font-size: 0.85rem;
                }

                .character-delete {
                    display: flex;
                    align-items: center;
                    padding: 20px;
                    border-left: 2px solid #cd853f;
                }

                .delete-btn {
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 10px;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                    color: #8b4513;
                }

                .delete-btn:hover {
                    background: rgba(255,0,0,0.1);
                    transform: scale(1.1);
                }

                .nope-btn,
                .yep-btn,
                .new-character-button,
                .back-to-menu-button {
                    font-family: 'Rye', serif;
                    padding: 15px 30px;
                    border-radius: 4px;
                    border: 2px solid;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: bold;
                    font-size: 1.2rem;
                }

                .nope-btn {
                    background: linear-gradient(45deg, #dc143c, #ff6347);
                    border-color: #8b0000;
                    color: white;
                }

                .nope-btn:hover {
                    background: linear-gradient(45deg, #ff6347, #ff4500);
                    transform: translateY(-1px);
                }

                .yep-btn {
                    background: linear-gradient(45deg, #228b22, #32cd32);
                    border-color: #006400;
                    color: white;
                }

                .yep-btn:hover {
                    background: linear-gradient(45deg, #32cd32, #00ff00);
                    transform: translateY(-1px);
                }

                .new-character-button {
                    background: linear-gradient(45deg, #deb887, #f4a460);
                    border-color: #8b4513;
                    color: #3d2914;
                }

                .new-character-button:hover {
                    background: linear-gradient(45deg, #f4a460, #ffd700);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }

                .back-to-menu-button {
                    background: linear-gradient(45deg, #696969, #808080);
                    border-color: #2f4f4f;
                    color: white;
                }

                .back-to-menu-button:hover {
                    background: linear-gradient(45deg, #808080, #a9a9a9);
                    transform: translateY(-1px);
                }

                .character-manager-actions {
                    text-align: center;
                    margin-bottom: 20px;
                    position: relative;
                    z-index: 10;
                }

                .bottom-actions {
                    text-align: center;
                    position: relative;
                    z-index: 10;
                }

                .empty-state {
                    text-align: center;
                    padding: 60px 20px;
                    background: rgba(255,248,220,0.7);
                    border: 2px dashed #cd853f;
                    border-radius: 8px;
                    margin-bottom: 40px;
                    position: relative;
                    z-index: 10;
                }

                .empty-state p {
                    color: #8b4513;
                    font-size: 1.2rem;
                    margin: 0 0 10px 0;
                }

                .empty-subtitle {
                    color: #654321;
                    font-style: italic;
                    font-size: 1rem !important;
                }

                .lazy-load-more {
                    text-align: center;
                    padding: 20px;
                    background: rgba(255,248,220,0.5);
                    border: 2px dashed #cd853f;
                    border-radius: 8px;
                    margin: 20px 0;
                }

                .load-more-btn {
                    font-family: 'Rye', serif;
                    background: linear-gradient(45deg, #deb887, #cd853f);
                    border: 2px solid #8b4513;
                    color: #3d2914;
                    padding: 12px 25px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: bold;
                    font-size: 1rem;
                }

                .load-more-btn:hover {
                    background: linear-gradient(45deg, #f4a460, #daa520);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }

                #character-sheet-container {
                    position: relative;
                    z-index: 10;
                }

                @media (max-width: 768px) {
                    .character-manager-container {
                        padding: 10px;
                        margin: 0;
                    }

                    .character-manager-container::after {
                        right: 15px;
                        top: 15px;
                        font-size: 1.5rem;
                    }

                    .character-manager-header h1 {
                        font-size: 2rem;
                    }

                    .editor-actions {
                        flex-direction: column;
                        align-items: center;
                        gap: 10px;
                    }

                    .character-item {
                        flex-direction: column;
                        margin-bottom: 10px;
                    }

                    .character-card-content {
                        padding: 15px;
                    }

                    .character-name h3 {
                        font-size: 1.3rem;
                    }

                    .character-stats {
                        font-size: 0.8rem;
                    }

                    .primary-stats {
                        font-size: 0.85rem;
                    }

                    .attributes {
                        font-size: 0.75rem;
                        line-height: 1.3;
                    }

                    .character-delete {
                        border-left: none;
                        border-top: 2px solid #cd853f;
                        justify-content: center;
                        padding: 15px;
                    }

                    .delete-btn {
                        font-size: 1.3rem;
                        padding: 8px;
                    }

                    .nope-btn, .yep-btn, .new-character-button, .back-to-menu-button {
                        padding: 12px 25px;
                        font-size: 1rem;
                        width: 100%;
                        max-width: 300px;
                    }

                    .empty-state {
                        padding: 40px 15px;
                    }

                    .character-manager-header {
                        padding: 15px;
                        margin-bottom: 20px;
                    }
                }

                @media (max-width: 480px) {
                    .character-manager-container {
                        padding: 5px;
                    }

                    .character-manager-header h1 {
                        font-size: 1.8rem;
                    }

                    .character-name h3 {
                        font-size: 1.2rem;
                    }

                    .primary-stats, .attributes {
                        word-break: break-word;
                    }

                    .nope-btn, .yep-btn, .new-character-button, .back-to-menu-button {
                        font-size: 0.9rem;
                        padding: 10px 20px;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
}