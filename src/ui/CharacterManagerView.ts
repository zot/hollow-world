// Character Manager View following SOLID principles
// Interface for managing multiple characters in the game

import { ICharacter, AttributeType } from '../character/types.js';
// CharacterSheet import removed - handled by separate CharacterEditorView
import { IUIComponent } from './SplashScreen.js';
import { templateEngine } from '../utils/TemplateEngine.js';
import { CharacterCalculations } from '../character/CharacterUtils.js';
import { characterStorageService } from '../services/CharacterStorageService.js';
import { IAudioManager } from '../audio/AudioManager.js';
import { AudioControlUtils, IEnhancedAudioControlSupport } from '../utils/AudioControlUtils.js';
import '../styles/EnhancedAudioControl.css';
import '../styles/CharacterManager.css';

export interface ICharacterManager extends IUIComponent {
    getCharacters(): ICharacter[];
    createNewCharacter(): void;
    deleteCharacter(characterId: string): void;
    onBackToMenu?: () => void;
    onCharacterSelected?: (character: ICharacter) => void;
    onNewCharacterCreated?: (character: ICharacter) => void;
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
        rank: 3, // totalXP computed dynamically from rank
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
                costMultiplier: 1,
                prerequisite: undefined
            },
            {
                id: 'perception',
                name: 'Perception',
                level: 3,
                isListed: true,
                isSpecialized: false,
                costMultiplier: 1,
                prerequisite: undefined
            }
        ],
        fields: [
            {
                id: 'gunfighter',
                name: 'Gunfighter',
                level: 2,
                skills: ['firearms'],
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
                type: 'fine_weapon',
                description: 'Well-maintained six-shooter with ivory grips',
                level: 1
            }
        ],
        companions: [],
        attributeChipsSpent: { positive: 0, negative: 0 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    },
    {
        id: 'char-2',
        name: 'Sarah "Doc" Winchester',
        description: 'Traveling physician with a keen interest in the supernatural',
        rank: 2, // totalXP computed dynamically from rank
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
                costMultiplier: 1,
                prerequisite: undefined
            },
            {
                id: 'occult',
                name: 'Occult',
                level: 2,
                isListed: true,
                isSpecialized: false,
                costMultiplier: 1,
                prerequisite: undefined
            }
        ],
        fields: [
            {
                id: 'physician',
                name: 'Physician',
                level: 2,
                skills: ['medicine'],
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
                type: 'gadget',
                description: 'Well-stocked physician\'s kit with surgical tools',
                level: 2
            }
        ],
        companions: [],
        attributeChipsSpent: { positive: 0, negative: 0 },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
    }
];

export class CharacterManagerView implements ICharacterManager, IEnhancedAudioControlSupport {
    private config: ICharacterManagerConfig;
    public container: HTMLElement | null = null;
    private characters: ICharacter[] = [];
    public audioManager?: IAudioManager;
    public musicButtonElement: HTMLElement | null = null;

    // Performance optimization properties
    private renderCache = new Map<string, string>();
    private isRendering = false;
    private pendingUpdate = false;

    public onBackToMenu?: () => void;
    public onCharacterSelected?: (character: ICharacter) => void;
    public onNewCharacterCreated?: (character: ICharacter) => void;

    constructor(config: Partial<ICharacterManagerConfig> = {}, audioManager?: IAudioManager) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.audioManager = audioManager;
        this.loadCharacters();
    }

    private async loadCharacters(): Promise<void> {
        try {
            this.characters = await characterStorageService.getAllCharacters();
            if (this.container) {
                this.render(this.container);
            }
        } catch (error) {
            console.error('Failed to load characters:', error);
            this.characters = [...SAMPLE_CHARACTERS];
        }
    }

    async render(container: HTMLElement): Promise<void> {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        this.debouncedRender();
    }

    // CharacterManagerView now only handles character list (no async render needed)

    private debouncedRender(): void {
        if (this.isRendering) {
            this.pendingUpdate = true;
            return;
        }

        this.isRendering = true;

        // Use requestAnimationFrame for smooth rendering
        requestAnimationFrame(async () => {
            try {
                // CharacterManagerView now only handles list view
                await this.renderCharacterListWithFallback();
                this.applyStyles();
            } catch (error) {
                console.error('Render failed:', error);
                this.showErrorMessage('Failed to render interface. Please refresh the page.');
                await this.renderFallbackUI();
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

    private async renderCharacterListWithFallback(): Promise<void> {
        try {
            await this.renderCharacterList();
        } catch (error) {
            console.warn('Template rendering failed, using fallback:', error);
            await this.renderCharacterListFallback();
        }
    }

    // renderCharacterEditor methods removed - now handled by separate CharacterEditorView

    private async renderFallbackUI(): Promise<void> {
        if (!this.container) return;

        try {
            const fallbackHtml = await templateEngine.renderTemplateFromFile('error-fallback', {});
            this.container.innerHTML = fallbackHtml;
            this.setupFallbackEventListeners();
        } catch (error) {
            // Ultimate fallback - just text
            this.container.innerHTML = '<div><h1>Character Manager</h1><p>Error loading interface</p></div>';
            console.error('Even fallback template failed:', error);
        }
    }

    private async renderCharacterListFallback(): Promise<void> {
        if (!this.container) return;

        try {
            const listHtml = await templateEngine.renderTemplateFromFile('character-list-fallback', {});
            this.container.innerHTML = listHtml;

            const cardsContainer = this.container.querySelector('.character-list');
            if (cardsContainer) {
                if (this.characters.length > 0) {
                    const cardPromises = this.characters.map(async (char) => {
                        const availableXP = CharacterCalculations.calculateAvailableXP(char);
                        const totalXP = CharacterCalculations.calculateTotalXPForRank(char.rank);
                        return templateEngine.renderTemplateFromFile('character-card-fallback', {
                            id: char.id,
                            name: char.name,
                            rank: char.rank,
                            availableXP: availableXP,
                            totalXP: totalXP,
                            damageCapacity: char.damageCapacity,
                            dust: char.hollow.dust
                        });
                    });
                    const cards = await Promise.all(cardPromises);
                    cardsContainer.innerHTML = cards.join('');
                } else {
                    const emptyHtml = await templateEngine.renderTemplateFromFile('empty-state', {});
                    cardsContainer.innerHTML = emptyHtml;
                }
            }

            this.setupListEventListeners();
        } catch (error) {
            // Ultimate fallback
            this.container.innerHTML = '<div><h1>Character Manager</h1><p>Failed to load templates</p></div>';
            console.error('Fallback template failed:', error);
        }
    }

    // Character editor fallback methods removed - handled by separate CharacterEditorView

    private setupFallbackEventListeners(): void {
        if (!this.container) return;

        const backBtn = this.container.querySelector('#back-to-menu-btn');
        if (backBtn && this.onBackToMenu) {
            backBtn.addEventListener('click', this.onBackToMenu);
        }
    }

    destroy(): void {
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }

        this.characters = [];
        this.renderCache.clear();
        this.musicButtonElement = null;
    }

    getCharacters(): ICharacter[] {
        return [...this.characters];
    }

    async createNewCharacter(): Promise<void> {
        try {
            const newCharacter = characterStorageService.createNewCharacter();
            await characterStorageService.saveCharacter(newCharacter);

            this.characters.push(newCharacter);
            this.clearRenderCache();

            // Trigger callback for route-based navigation to editor
            if (this.onNewCharacterCreated) {
                this.onNewCharacterCreated(newCharacter);
            }
        } catch (error) {
            console.error('Failed to create new character:', error);
            this.showErrorMessage('Failed to create new character. Please try again.');
        }
    }

    // editCharacter removed - now handled by separate CharacterEditorView

    async deleteCharacter(characterId: string): Promise<void> {
        if (confirm('Are you sure you want to delete this character? This action cannot be undone.')) {
            try {
                const success = await characterStorageService.deleteCharacter(characterId);
                if (success) {
                    this.characters = this.characters.filter(c => c.id !== characterId);
                    this.clearRenderCache();
                    this.render(this.container!);
                } else {
                    this.showErrorMessage('Character not found.');
                }
            } catch (error) {
                console.error('Failed to delete character:', error);
                this.showErrorMessage('Failed to delete character. Please try again.');
            }
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

    private async showErrorMessage(message: string): Promise<void> {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        
        try {
            const errorHtml = await templateEngine.renderTemplateFromFile('error-notification', {
                message: message
            });
            errorDiv.innerHTML = errorHtml;
        } catch (error) {
            console.error('Failed to render error notification template:', error);
            // Fallback to minimal HTML
            errorDiv.innerHTML = `<div class="error-content"><span class="error-icon">⚠️</span><span class="error-text">${message}</span><button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button></div>`;
        }

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
                characterCount: this.characters.length,
                hasAudioManager: !!this.audioManager
            });

            this.container.innerHTML = listHtml;

            // Inject enhanced audio control after the header
            if (this.audioManager) {
                const audioControlHtml = await AudioControlUtils.renderEnhancedAudioControl(this);
                const headerEl = this.container.querySelector('.character-manager-header');
                
                if (headerEl) {
                    headerEl.insertAdjacentHTML('afterend', audioControlHtml);
                }
            }

            // Set up music button reference (for legacy compatibility)
            this.musicButtonElement = this.container.querySelector('#music-toggle-btn');

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
            AudioControlUtils.setupEnhancedAudioControls(this);
            AudioControlUtils.updateEnhancedAudioState(this);
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

        const availableXP = CharacterCalculations.calculateAvailableXP(character);
        const totalXP = CharacterCalculations.calculateTotalXPForRank(character.rank);

        const primaryStats = [
            `Rank: ${character.rank}`,
            `XP: ${availableXP}/${totalXP}`,
            `DC: ${character.damageCapacity}`,
            `Dust: ${character.hollow.dust}`
        ].join(' • ');

        // Organize attributes by category and cost order per spec
        const physicalAttrs = `💪 Physical: DEX: ${character.attributes[AttributeType.DEX]}, STR: ${character.attributes[AttributeType.STR]}, CON: ${character.attributes[AttributeType.CON]}`;
        const socialAttrs = `🗣️ Social: CHA: ${character.attributes[AttributeType.CHA]}, WIS: ${character.attributes[AttributeType.WIS]}, GRI: ${character.attributes[AttributeType.GRI]}`;
        const mentalAttrs = `🧠 Mental: INT: ${character.attributes[AttributeType.INT]}, PER: ${character.attributes[AttributeType.PER]}`;

        const attributes = [physicalAttrs, socialAttrs, mentalAttrs].join(' | ');

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
                if (firstKey) {
                    this.renderCache.delete(firstKey);
                }
            }

            return cardHtml;
        } catch (error) {
            console.error('Failed to render character card:', error);
            return `<div class="error">Failed to render character: ${character.name}</div>`;
        }
    }

    private createCharacterCacheKey(character: ICharacter): string {
        // Create a hash-like key from character's critical data using computed values
        const keyData = {
            id: character.id,
            name: character.name,
            rank: character.rank,
            availableXP: CharacterCalculations.calculateAvailableXP(character),
            totalXP: CharacterCalculations.calculateTotalXPForRank(character.rank),
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
            // Use template for load more button
            try {
                const loadMoreHtml = await templateEngine.renderTemplateFromFile('load-more-button', {
                    remaining: this.characters.length - CHUNK_SIZE
                });
                html += loadMoreHtml;
            } catch (error) {
                console.error('Failed to render load-more template:', error);
                // Fallback to minimal HTML
                html += `<div class="lazy-load-more"><button class="load-more-btn" data-remaining="${this.characters.length - CHUNK_SIZE}">Load ${this.characters.length - CHUNK_SIZE} more characters...</button></div>`;
            }
        }

        return html;
    }

    // User Experience Testing Methods
    public async validateUserWorkflows(): Promise<string[]> {
        const issues: string[] = [];

        try {
            // Test 1: Character creation workflow
            const originalCount = this.characters.length;
            await this.createNewCharacter();
            if (this.characters.length !== originalCount + 1) {
                issues.push('Character creation workflow failed: Character count did not increase');
            }

            // Test 2: Storage functionality
            try {
                const testChar = this.characters[0];
                if (testChar) {
                    await characterStorageService.saveCharacter(testChar);
                    const loaded = await characterStorageService.getCharacter(testChar.id);
                    if (!loaded || loaded.id !== testChar.id) {
                        issues.push('Storage workflow failed: Save/load character mismatch');
                    }
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

    public async generateUXReport(): Promise<string> {
        const workflowIssues = await this.validateUserWorkflows();
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
- View: Character List (route-based navigation)

## Recommendations
${workflowIssues.length === 0 && accessibilityIssues.length === 0 ?
    '✅ Character manager is working well! Consider adding more characters to test performance at scale.' :
    '⚠️ Address the issues above to improve user experience.'}
        `;

        return report.trim();
    }

    // renderCharacterEditor method removed - handled by separate CharacterEditorView

    private setupListEventListeners(): void {
        if (!this.container) return;

        this.container.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', async (e) => {
                // Find the element with data-action (might be parent/child)
                let target = e.target as HTMLElement;
                let actionElement = target;

                // Walk up the DOM tree to find the element with data-action
                while (actionElement && !actionElement.dataset.action) {
                    actionElement = actionElement.parentElement as HTMLElement;
                }

                if (!actionElement) return;

                const action = actionElement.dataset.action;
                const characterId = actionElement.dataset.characterId || actionElement.getAttribute('data-character-id');

                // Play gunshot sound for all button clicks
                await AudioControlUtils.playButtonSound(this.audioManager);

                if (!characterId) return;

                switch (action) {
                    case 'edit':
                        const character = this.characters.find(c => c.id === characterId);
                        if (character && this.onCharacterSelected) {
                            this.onCharacterSelected(character);
                        }
                        break;
                    case 'delete':
                        this.deleteCharacter(characterId);
                        break;
                }
            });

            // Add keyboard support
            button.addEventListener('keydown', (e: Event) => {
                const keyEvent = e as KeyboardEvent;
                if (keyEvent.key === 'Enter' || keyEvent.key === ' ') {
                    keyEvent.preventDefault();
                    (button as HTMLElement).click();
                }
            });
        });

        // Add keyboard navigation for character items
        this.container.querySelectorAll('.character-item').forEach((item, index) => {
            item.addEventListener('keydown', (e: Event) => {
                const keyEvent = e as KeyboardEvent;
                const items = Array.from(this.container!.querySelectorAll('.character-item'));
                switch (keyEvent.key) {
                    case 'ArrowDown':
                        keyEvent.preventDefault();
                        const nextItem = items[index + 1] as HTMLElement;
                        nextItem?.focus();
                        break;
                    case 'ArrowUp':
                        keyEvent.preventDefault();
                        const prevItem = items[index - 1] as HTMLElement;
                        prevItem?.focus();
                        break;
                    case 'Home':
                        keyEvent.preventDefault();
                        (items[0] as HTMLElement)?.focus();
                        break;
                    case 'End':
                        keyEvent.preventDefault();
                        (items[items.length - 1] as HTMLElement)?.focus();
                        break;
                }
            });
        });

        const addCharacterBtn = this.container.querySelector('#add-character-btn');
        if (addCharacterBtn) {
            addCharacterBtn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                this.createNewCharacter();
            });
        }

        const backBtn = this.container.querySelector('#back-to-menu-btn');
        if (backBtn) {
            backBtn.addEventListener('click', async () => {
                await AudioControlUtils.playButtonSound(this.audioManager);
                if (this.onBackToMenu) {
                    this.onBackToMenu();
                }
            });
        }

        // Set up music button event listener using shared utility
        AudioControlUtils.setupMusicButtonEventListener(this);
    }

    

    

    private applyStyles(): void {
        // Styles now loaded via CSS import - no longer embedded in TypeScript
    }
}