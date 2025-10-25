// Main CharacterSheet component following SOLID principles
// Open/Closed: extensible through sub-components
// Single Responsibility: manages overall character sheet state and layout

import {
    ICharacter,
    ICharacterSheetProps,
    ICharacterSheetCallbacks,
    AttributeType,
    IBenefit,
    IDrawback,
    IHollowData
} from './types.js';
import { CharacterUpdater, CharacterValidation, CharacterCalculations } from './CharacterUtils.js';
import '../styles/CharacterSheet.css';

// Interface for UI components (Interface Segregation Principle)
export interface ICharacterSheetComponent {
    render(container: HTMLElement): void;
    destroy(): void;
}

// Interface for character sheet specific functionality
export interface ICharacterSheet extends ICharacterSheetComponent {
    getCharacter(): ICharacter;
    updateCharacter(updates: Partial<ICharacter>): void;
    exportCharacter(): string;
    importCharacter(data: string): boolean;
    validateCharacter(): string[];
}

// Character sheet configuration
export interface ICharacterSheetConfig {
    containerClass: string;
    headerClass: string;
    attributesClass: string;
    skillsClass: string;
    benefitsClass: string;
    hollowClass: string;
    equipmentClass: string;
    readOnly: boolean;
    showCreationMode: boolean;
}

// Default configuration
const DEFAULT_CONFIG: ICharacterSheetConfig = {
    containerClass: 'character-sheet-container',
    headerClass: 'character-header',
    attributesClass: 'character-attributes',
    skillsClass: 'character-skills',
    benefitsClass: 'character-benefits',
    hollowClass: 'character-hollow',
    equipmentClass: 'character-equipment',
    readOnly: false,
    showCreationMode: false
};

// Main CharacterSheet implementation
export class CharacterSheet implements ICharacterSheet {
    private character: ICharacter;
    private config: ICharacterSheetConfig;
    private callbacks: ICharacterSheetCallbacks;
    private container: HTMLElement | null = null;

    // Sub-components
    private headerComponent: ICharacterSheetComponent | null = null;
    private attributesComponent: ICharacterSheetComponent | null = null;
    private skillsComponent: ICharacterSheetComponent | null = null;
    private benefitsComponent: ICharacterSheetComponent | null = null;
    private hollowComponent: ICharacterSheetComponent | null = null;
    private equipmentComponent: ICharacterSheetComponent | null = null;

    constructor(
        character: ICharacter,
        config: Partial<ICharacterSheetConfig> = {},
        callbacks?: Partial<ICharacterSheetCallbacks>
    ) {
        this.character = { ...character };
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.callbacks = this.createDefaultCallbacks(callbacks);
    }

    getCharacter(): ICharacter {
        return { ...this.character };
    }

    updateCharacter(updates: Partial<ICharacter>): void {
        this.character = CharacterUpdater.updateCharacter(this.character, updates);
        // Fire-and-forget async refresh
        this.refreshComponents().catch(error => {
            console.error('Failed to refresh components:', error);
        });
    }

    async render(container: HTMLElement): Promise<void> {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        const sheetHtml = await this.createCharacterSheetHTML();
        container.innerHTML = sheetHtml;

        await this.initializeSubComponents();
        this.applyStyles();
    }

    destroy(): void {
        this.destroySubComponents();
        if (this.container) {
            this.container.innerHTML = '';
            this.container = null;
        }
    }

    exportCharacter(): string {
        return JSON.stringify(this.character, null, 2);
    }

    importCharacter(data: string): boolean {
        try {
            const importedCharacter = JSON.parse(data) as ICharacter;

            // Basic validation
            if (!importedCharacter.id || !importedCharacter.name) {
                return false;
            }

            this.character = CharacterUpdater.updateCharacter(this.character, importedCharacter);
            // Fire-and-forget async refresh
            this.refreshComponents().catch(error => {
                console.error('Failed to refresh components:', error);
            });
            return true;
        } catch (error) {
            console.error('Failed to import character:', error);
            return false;
        }
    }

    validateCharacter(): string[] {
        const errors: string[] = [];
        errors.push(...CharacterValidation.validateCharacterCreation(this.character));
        errors.push(...CharacterValidation.validateSkillPrerequisites(this.character));
        errors.push(...CharacterValidation.validateFields(this.character));
        return errors;
    }

    private createDefaultCallbacks(provided?: Partial<ICharacterSheetCallbacks>): ICharacterSheetCallbacks {
        return {
            onAttributeChange: (attribute: AttributeType, value: number) => {
                this.character = CharacterUpdater.updateAttribute(this.character, attribute, value);
                // Fire-and-forget async refresh
                this.refreshComponents().catch(error => {
                    console.error('Failed to refresh components:', error);
                });
            },
            onSkillChange: (skillId: string, level: number) => {
                const skills = this.character.skills.map(skill =>
                    skill.id === skillId ? { ...skill, level } : skill
                );
                this.updateCharacter({ skills });
            },
            onFieldChange: (fieldId: string, level: number) => {
                const fields = this.character.fields.map(field =>
                    field.id === fieldId ? { ...field, level, isFrozen: level > 1 } : field
                );
                this.updateCharacter({ fields });
            },
            onBenefitChange: (benefitId: string, benefit: IBenefit) => {
                const benefits = this.character.benefits.map(b =>
                    b.id === benefitId ? benefit : b
                );
                this.updateCharacter({ benefits });
            },
            onDrawbackChange: (drawbackId: string, drawback: IDrawback) => {
                const drawbacks = this.character.drawbacks.map(d =>
                    d.id === drawbackId ? drawback : d
                );
                this.updateCharacter({ drawbacks });
            },
            onHollowChange: (hollow: Partial<IHollowData>) => {
                this.updateCharacter({ hollow: { ...this.character.hollow, ...hollow } });
            },
            onExport: () => this.exportCharacter(),
            onImport: (data: string) => this.importCharacter(data),
            ...provided
        };
    }

    private async createCharacterSheetHTML(): Promise<string> {
        const { TemplateEngine } = await import('../utils/TemplateEngine.js');
        const templateEngine = new TemplateEngine();
        
        return await templateEngine.renderTemplateFromFile('character-sheet', {
            containerClass: this.config.containerClass,
            headerClass: this.config.headerClass,
            attributesClass: this.config.attributesClass,
            skillsClass: this.config.skillsClass,
            benefitsClass: this.config.benefitsClass,
            hollowClass: this.config.hollowClass,
            equipmentClass: this.config.equipmentClass,
            showActions: !this.config.readOnly
        });
    }

    private async initializeSubComponents(): Promise<void> {
        if (!this.container) return;

        // Initialize each sub-component (will be implemented in separate files)
        // For now, add placeholder content
        await this.initializePlaceholderContent();
        this.setupActionButtons();

        // Ensure proper appearance when first showing the editor
        this.updateDisplay();
    }

    private async initializePlaceholderContent(): Promise<void> {
        if (!this.container) return;

        const { TemplateEngine } = await import('../utils/TemplateEngine.js');
        const templateEngine = new TemplateEngine();

        // Character Header placeholder
        const headerEl = this.container.querySelector('#character-header');
        if (headerEl) {
            const availableXP = CharacterCalculations.calculateAvailableXP(this.character);
            const totalXP = CharacterCalculations.calculateTotalXPForRank(this.character.rank);
            const availableChips = CharacterCalculations.calculateAvailableAttributeChips(this.character);
            const totalChips = CharacterCalculations.calculateTotalAttributeChipsForRank(this.character.rank);
            
            headerEl.innerHTML = await templateEngine.renderTemplateFromFile('character-header-section', {
                name: this.character.name,
                description: this.character.description,
                rank: this.character.rank,
                damageCapacity: this.character.damageCapacity,
                dust: this.character.hollow.dust,
                totalXP,
                availableXP,
                totalChips,
                availableChips
            });
        }

        // Attributes placeholder
        const attributesEl = this.container.querySelector('#character-attributes');
        if (attributesEl) {
            await this.renderAttributes(attributesEl, templateEngine);
        }

        // Hollow tracker placeholder
        const hollowEl = this.container.querySelector('#character-hollow');
        if (hollowEl) {
            hollowEl.innerHTML = await templateEngine.renderTemplateFromFile('hollow-tracker-section', {
                dust: this.character.hollow.dust,
                burned: this.character.hollow.burned,
                hollowInfluence: this.character.hollow.hollowInfluence,
                glimmerDebt: this.character.hollow.glimmerDebt || 0,
                glimmerDebtTotal: this.character.hollow.glimmerDebtTotal || 0,
                newMoonMarks: this.character.hollow.newMoonMarks > 0 ? this.character.hollow.newMoonMarks : ''
            });
        }

        // Skills placeholder
        const skillsEl = this.container.querySelector('#character-skills');
        if (skillsEl) {
            await this.renderSkills(skillsEl, templateEngine);
        }

        // Benefits/Drawbacks placeholder
        const benefitsEl = this.container.querySelector('#character-benefits');
        if (benefitsEl) {
            await this.renderBenefits(benefitsEl, templateEngine);
        }

        // Equipment placeholder
        const equipmentEl = this.container.querySelector('#character-equipment');
        if (equipmentEl) {
            await this.renderEquipment(equipmentEl, templateEngine);
        }
    }

    private async renderAttributes(attributesEl: Element, templateEngine: any): Promise<void> {
        // Organize attributes by category and cost order per spec - group them in rows
        const physicalAttrs = [
            { type: AttributeType.DEX, cost: 4 },
            { type: AttributeType.STR, cost: 3 },
            { type: AttributeType.CON, cost: 1 }
        ];
        const socialAttrs = [
            { type: AttributeType.CHA, cost: 4 },
            { type: AttributeType.WIS, cost: 3 },
            { type: AttributeType.GRI, cost: 1 }
        ];
        const mentalAttrs = [
            { type: AttributeType.INT, cost: 4 },
            { type: AttributeType.PER, cost: 4 }
        ];

        const createAttributeBoxHtml = async (attr: { type: AttributeType; cost: number }) => {
            const disabledAttr = this.config.readOnly ? 'disabled' : '';
            return await templateEngine.renderTemplateFromFile('attribute-box', {
                type: attr.type,
                cost: attr.cost,
                value: this.character.attributes[attr.type],
                disabledAttr
            });
        };

        const createAttributeRow = async (emoji: string, attrs: any[]) => {
            const attributeBoxesPromises = attrs.map(createAttributeBoxHtml);
            const attributeBoxes = await Promise.all(attributeBoxesPromises);
            const attributeBoxesHtml = attributeBoxes.join('');
            
            return await templateEngine.renderTemplateFromFile('attribute-category-row', {
                emoji,
                attributeBoxesHtml
            });
        };

        const physicalRow = await createAttributeRow('💪', physicalAttrs);
        const socialRow = await createAttributeRow('🗣️', socialAttrs);
        const mentalRow = await createAttributeRow('🧠', mentalAttrs);
        const attributeRowsHtml = physicalRow + socialRow + mentalRow;

        attributesEl.innerHTML = await templateEngine.renderTemplateFromFile('attributes-section', {
            attributeRowsHtml
        });

        // Add increment/decrement button listeners per specs
        if (!this.config.readOnly) {
            attributesEl.querySelectorAll('.attr-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const target = e.target as HTMLButtonElement;
                    const action = target.dataset.action;
                    const attribute = target.dataset.attribute as AttributeType;
                    const cost = parseInt(target.dataset.cost || '1');

                    if (action === 'inc') {
                        this.incrementAttribute(attribute, cost);
                    } else if (action === 'dec') {
                        this.decrementAttribute(attribute, cost);
                    }
                });
            });

            // Add mouse wheel support per specs - make the whole attribute box responsive
            attributesEl.querySelectorAll('.attribute-box').forEach(attributeBox => {
                attributeBox.addEventListener('wheel', (e: Event) => {
                    const wheelEvent = e as WheelEvent;

                    // Prevent page scroll - must be called before any other logic
                    wheelEvent.preventDefault();
                    wheelEvent.stopPropagation();

                    console.log('Mouse wheel on attribute box:', wheelEvent.deltaY);

                    const attributeBoxElement = attributeBox as HTMLElement;

                    const attribute = attributeBoxElement.dataset.attribute as AttributeType;
                    const costElement = attributeBoxElement.querySelector('.attribute-cost');
                    const costText = costElement?.textContent || '(1)';
                    const cost = parseInt(costText.match(/\((\d+)\)/)?.[1] || '1');

                    console.log('Wheel event - Attribute:', attribute, 'Cost:', cost, 'Delta:', wheelEvent.deltaY);

                    // Determine direction (negative deltaY = wheel up = increment)
                    if (wheelEvent.deltaY < 0) {
                        console.log('Incrementing attribute');
                        this.incrementAttribute(attribute, cost);
                    } else {
                        console.log('Decrementing attribute');
                        this.decrementAttribute(attribute, cost);
                    }
                }, { passive: false }); // Explicitly set passive to false for preventDefault to work

                // Add visual feedback for mouse wheel interaction
                attributeBox.addEventListener('mouseenter', (e) => {
                    const target = e.target as HTMLElement;
                    target.title = 'Use mouse wheel to increment/decrement';
                });
            });

            // Update button states based on current resources
            this.updateAttributeButtonStates(attributesEl);
        }
    }

    private async renderSkills(skillsEl: Element, templateEngine: any): Promise<void> {
        const hasFields = this.character.fields.length > 0;
        const noFields = !hasFields;
        const hasSkills = this.character.skills.length > 0;
        const noSkills = !hasSkills;

        let fieldsHtml = '';
        if (hasFields) {
            const fieldPromises = this.character.fields.map(field =>
                templateEngine.renderTemplateFromFile('field-item', {
                    name: field.name,
                    level: field.level,
                    isFrozen: field.isFrozen
                })
            );
            const fieldItems = await Promise.all(fieldPromises);
            fieldsHtml = fieldItems.join('');
        }

        let skillsHtml = '';
        if (hasSkills) {
            const skillPromises = this.character.skills.map(skill =>
                templateEngine.renderTemplateFromFile('skill-item', {
                    skillTypeIndicator: skill.isListed ? '⭐' : '',
                    skillName: skill.name,
                    skillLevel: CharacterCalculations.calculateSkillLevel(skill.id, this.character.fields),
                    isX2: skill.costMultiplier === 2
                })
            );
            const skillItems = await Promise.all(skillPromises);
            skillsHtml = skillItems.join('');
        }

        skillsEl.innerHTML = await templateEngine.renderTemplateFromFile('skills-fields-section', {
            hasFields,
            noFields,
            fieldsHtml,
            hasSkills,
            noSkills,
            skillsHtml
        });
    }

    private async renderBenefits(benefitsEl: Element, templateEngine: any): Promise<void> {
        const hasBenefits = this.character.benefits.length > 0;
        const noBenefits = !hasBenefits;
        const hasDrawbacks = this.character.drawbacks.length > 0;
        const noDrawbacks = !hasDrawbacks;

        let benefitsHtml = '';
        if (hasBenefits) {
            const benefitPromises = this.character.benefits.map(benefit =>
                templateEngine.renderTemplateFromFile('benefit-item', {
                    name: benefit.name,
                    level: benefit.level,
                    condition: benefit.condition,
                    description: benefit.description
                })
            );
            const benefitItems = await Promise.all(benefitPromises);
            benefitsHtml = benefitItems.join('');
        }

        let drawbacksHtml = '';
        if (hasDrawbacks) {
            const drawbackPromises = this.character.drawbacks.map(drawback =>
                templateEngine.renderTemplateFromFile('drawback-item', {
                    name: drawback.name,
                    level: drawback.level,
                    condition: drawback.condition,
                    description: drawback.description
                })
            );
            const drawbackItems = await Promise.all(drawbackPromises);
            drawbacksHtml = drawbackItems.join('');
        }

        benefitsEl.innerHTML = await templateEngine.renderTemplateFromFile('benefits-drawbacks-section', {
            hasBenefits,
            noBenefits,
            benefitsHtml,
            hasDrawbacks,
            noDrawbacks,
            drawbacksHtml
        });
    }

    private async renderEquipment(equipmentEl: Element, templateEngine: any): Promise<void> {
        const hasItems = this.character.items.length > 0;
        const noItems = !hasItems;
        const hasCompanions = this.character.companions.length > 0;
        const noCompanions = !hasCompanions;

        let itemsHtml = '';
        if (hasItems) {
            const itemPromises = this.character.items.map(item =>
                templateEngine.renderTemplateFromFile('item-entry', {
                    name: item.name,
                    level: item.level,
                    description: item.description
                })
            );
            const itemEntries = await Promise.all(itemPromises);
            itemsHtml = itemEntries.join('');
        }

        let companionsHtml = '';
        if (hasCompanions) {
            const companionPromises = this.character.companions.map(companion =>
                templateEngine.renderTemplateFromFile('companion-entry', {
                    name: companion.name,
                    type: companion.type,
                    xpSpent: companion.xpSpent,
                    description: companion.description
                })
            );
            const companionEntries = await Promise.all(companionPromises);
            companionsHtml = companionEntries.join('');
        }

        equipmentEl.innerHTML = await templateEngine.renderTemplateFromFile('equipment-section', {
            hasItems,
            noItems,
            itemsHtml,
            hasCompanions,
            noCompanions,
            companionsHtml
        });
    }

    private setupActionButtons(): void {
        if (!this.container || this.config.readOnly) return;

        const exportBtn = this.container.querySelector('#export-character');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = this.callbacks.onExport();
                this.downloadCharacterData(data);
            });
        }

        const importBtn = this.container.querySelector('#import-character');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.openImportDialog();
            });
        }

        const validateBtn = this.container.querySelector('#validate-character');
        if (validateBtn) {
            validateBtn.addEventListener('click', () => {
                const errors = this.validateCharacter();
                this.showValidationResults(errors);
            });
        }
    }

    private downloadCharacterData(data: string): void {
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.character.name.replace(/[^a-zA-Z0-9]/g, '_')}_character.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    private openImportDialog(): void {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const data = e.target?.result as string;
                    const success = this.callbacks.onImport(data);
                    if (success) {
                        alert('Character imported successfully!');
                    } else {
                        alert('Failed to import character. Please check the file format.');
                    }
                };
                reader.readAsText(file);
            }
        });
        input.click();
    }

    private showValidationResults(errors: string[]): void {
        if (errors.length === 0) {
            alert('Character validation passed! No errors found.');
        } else {
            const errorMessage = 'Character validation failed:\n\n' + errors.join('\n');
            alert(errorMessage);
        }
    }

    private async refreshComponents(): Promise<void> {
        if (this.container) {
            await this.initializePlaceholderContent();
        }
    }

    private destroySubComponents(): void {
        this.headerComponent?.destroy();
        this.attributesComponent?.destroy();
        this.skillsComponent?.destroy();
        this.benefitsComponent?.destroy();
        this.hollowComponent?.destroy();
        this.equipmentComponent?.destroy();

        this.headerComponent = null;
        this.attributesComponent = null;
        this.skillsComponent = null;
        this.benefitsComponent = null;
        this.hollowComponent = null;
        this.equipmentComponent = null;
    }

    private incrementAttribute(attribute: AttributeType, cost: number): void {
        const currentValue = this.character.attributes[attribute];

        // Check attribute range maximum
        if (currentValue >= 15) {
            return; // Cannot increment above maximum
        }

        // Check resource availability per spec: chips first, then XP
        const availableChips = CharacterCalculations.calculateAvailableAttributeChips(this.character);
        const availableXP = CharacterCalculations.calculateAvailableXP(this.character);

        if (availableChips >= cost) {
            // Use attribute chips (automatically tracked by total cost calculation)
            this.character.attributes[attribute] = currentValue + 1;
            console.log(`Incremented ${attribute} using ${cost} attribute chips`);
        } else if (availableXP >= cost) {
            // Use XP when no attribute chips left
            this.character.attributes[attribute] = currentValue + 1;
            console.log(`Incremented ${attribute} using ${cost} XP`);
            // Note: XP spending is handled automatically by calculateAvailableXP()
        } else {
            console.warn(`Cannot increment ${attribute}: insufficient resources (chips: ${availableChips}, XP: ${availableXP}, cost: ${cost})`);
            return;
        }

        // Update displayed available XP and available Attribute Chips per spec
        this.updateDisplay();
        console.log(`After increment - Available chips: ${CharacterCalculations.calculateAvailableAttributeChips(this.character)}, Available XP: ${CharacterCalculations.calculateAvailableXP(this.character)}`);
    }

    private decrementAttribute(attribute: AttributeType, cost: number): void {
        const currentValue = this.character.attributes[attribute];

        // Don't allow decrement if attribute would be out of range per spec
        if (currentValue <= -2) {
            console.warn(`Cannot decrement ${attribute}: already at minimum (-2)`);
            return; // Cannot decrement below minimum
        }

        console.log(`Decrementing ${attribute} from ${currentValue} (cost: ${cost})`);

        // Implement smart restoration logic per spec
        const currentTotalCosts = CharacterCalculations.calculateTotalAttributeCosts(this.character.attributes);

        // Decrease the attribute
        this.character.attributes[attribute] = currentValue - 1;

        // Calculate restoration logic per spec
        const maxAttributeChipsForRank = CharacterCalculations.calculateTotalAttributeChipsForRank(this.character.rank);

        if (currentTotalCosts > maxAttributeChipsForRank) {
            // Some points go to XP (slop-over), some become available as chips
            // This is handled automatically by our computed functions
            console.log(`Decrement with slop-over: total costs ${currentTotalCosts} > max chips ${maxAttributeChipsForRank}`);
        } else {
            console.log(`Standard decrement: all ${cost} points restored to available chips`);
        }

        // Update available XP and Attribute Chips after decrement per spec
        this.updateDisplay();
        console.log(`After decrement - Available chips: ${CharacterCalculations.calculateAvailableAttributeChips(this.character)}, Available XP: ${CharacterCalculations.calculateAvailableXP(this.character)}`);
    }

    private updateDisplay(): void {
        // Update all attribute value displays
        Object.entries(this.character.attributes).forEach(([attrType, value]) => {
            const element = document.getElementById(`attr-${attrType}`); // Use actual enum value, not uppercase
            console.log(`Updating element attr-${attrType} with value ${value}`, element);
            if (element) {
                element.textContent = value.toString();
                console.log(`Updated attr-${attrType} textContent to:`, element.textContent);
            } else {
                console.warn(`Element attr-${attrType} not found in DOM`);
            }
        });

        // Update resource displays
        this.updateResourceDisplays();

        // Update button states
        const attributesEl = this.container?.querySelector('#character-attributes');
        if (attributesEl) {
            this.updateAttributeButtonStates(attributesEl);
        }
    }

    private updateResourceDisplays(): void {
        const availableXPEl = this.container?.querySelector('.available-xp');
        const availableChipsEl = this.container?.querySelector('.available-chips');

        if (availableXPEl) {
            const totalXP = CharacterCalculations.calculateTotalXPForRank(this.character.rank);
            const spentXP = CharacterCalculations.calculateSpentXP(this.character);
            const availableXP = totalXP - spentXP; // Don't clamp to 0 here to detect negatives

            const newText = `Available XP (${totalXP}): ${availableXP}`;
            availableXPEl.textContent = newText;

            // Show negative XP in red per spec
            if (availableXP < 0) {
                (availableXPEl as HTMLElement).style.color = '#dc143c'; // Red for negative
                (availableXPEl as HTMLElement).style.fontWeight = 'bold';
                (availableXPEl as HTMLElement).title = 'Character has overspent XP budget!';
                console.log(`XP OVERSPENT: ${newText} (showing in red)`);
            } else {
                (availableXPEl as HTMLElement).style.color = ''; // Reset to default
                (availableXPEl as HTMLElement).style.fontWeight = '';
                (availableXPEl as HTMLElement).title = '';
                console.log(`Updated XP display: ${newText}`);
            }
        } else {
            console.warn('Available XP display element not found');
        }

        if (availableChipsEl) {
            const totalChips = CharacterCalculations.calculateTotalAttributeChipsForRank(this.character.rank);
            const availableChips = CharacterCalculations.calculateAvailableAttributeChips(this.character);
            const newText = `Attribute Chips (${totalChips}): ${availableChips}`;
            availableChipsEl.textContent = newText;
            console.log(`Updated Chips display: ${newText}`);
        } else {
            console.warn('Available Chips display element not found');
        }
    }

    private updateAttributeButtonStates(attributesEl: Element): void {
        attributesEl.querySelectorAll('.attr-btn').forEach(button => {
            const target = button as HTMLButtonElement;
            const action = target.dataset.action;
            const attribute = target.dataset.attribute as AttributeType;
            const cost = parseInt(target.dataset.cost || '1');
            const currentValue = this.character.attributes[attribute];

            if (action === 'inc') {
                // Disable increment if at maximum OR insufficient resources
                const atMaximum = currentValue >= 15;
                const availableChips = CharacterCalculations.calculateAvailableAttributeChips(this.character);
                const availableXP = CharacterCalculations.calculateAvailableXP(this.character);
                const canAfford = (availableChips >= cost) || (availableXP >= cost);

                const shouldDisable = atMaximum || !canAfford;
                target.disabled = shouldDisable;
                target.classList.toggle('disabled', shouldDisable);
            } else if (action === 'dec') {
                // Disable decrement if at minimum
                const atMinimum = currentValue <= -2;
                target.disabled = atMinimum;
                target.classList.toggle('disabled', atMinimum);
            }
        });
    }

    private applyStyles(): void {
        // Styles now loaded via CSS import - no longer embedded in TypeScript
    }
}