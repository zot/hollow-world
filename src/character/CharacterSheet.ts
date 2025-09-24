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
        this.refreshComponents();
    }

    render(container: HTMLElement): void {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;
        const sheetHtml = this.createCharacterSheetHTML();
        container.innerHTML = sheetHtml;

        this.initializeSubComponents();
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
            this.refreshComponents();
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
                this.refreshComponents();
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

    private createCharacterSheetHTML(): string {
        return `
            <div class="${this.config.containerClass}">
                <div class="${this.config.headerClass}" id="character-header">
                    <!-- Character Header will be populated by sub-component -->
                </div>

                <div class="character-main-content">
                    <div class="character-left-column">
                        <div class="${this.config.attributesClass}" id="character-attributes">
                            <!-- Attributes Grid will be populated by sub-component -->
                        </div>

                        <div class="${this.config.hollowClass}" id="character-hollow">
                            <!-- Hollow Tracker will be populated by sub-component -->
                        </div>
                    </div>

                    <div class="character-right-column">
                        <div class="${this.config.skillsClass}" id="character-skills">
                            <!-- Skills Panel will be populated by sub-component -->
                        </div>

                        <div class="${this.config.benefitsClass}" id="character-benefits">
                            <!-- Benefits/Drawbacks will be populated by sub-component -->
                        </div>

                        <div class="${this.config.equipmentClass}" id="character-equipment">
                            <!-- Equipment will be populated by sub-component -->
                        </div>
                    </div>
                </div>

                <div class="character-actions">
                    ${!this.config.readOnly ? `
                        <button class="export-btn" id="export-character">Export Character</button>
                        <button class="import-btn" id="import-character">Import Character</button>
                        <button class="validate-btn" id="validate-character">Validate</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    private initializeSubComponents(): void {
        if (!this.container) return;

        // Initialize each sub-component (will be implemented in separate files)
        // For now, add placeholder content
        this.initializePlaceholderContent();
        this.setupActionButtons();

        // Ensure proper appearance when first showing the editor
        this.updateDisplay();
    }

    private initializePlaceholderContent(): void {
        if (!this.container) return;

        // Character Header placeholder
        const headerEl = this.container.querySelector('#character-header');
        if (headerEl) {
            headerEl.innerHTML = `
                <h1>${this.character.name}</h1>
                <p class="character-description">${this.character.description}</p>
                <div class="character-stats">
                    <span class="rank">Rank ${this.character.rank}</span>
                    <span class="damage-capacity">Damage Capacity: ${this.character.damageCapacity}</span>
                    <span class="dust">Dust: ${this.character.hollow.dust}</span>
                </div>
                <div class="resource-displays">
                    <span class="available-xp">Available XP (${CharacterCalculations.calculateTotalXPForRank(this.character.rank)}): ${CharacterCalculations.calculateAvailableXP(this.character)}</span>
                    <span class="available-chips">Attribute Chips (${CharacterCalculations.calculateTotalAttributeChipsForRank(this.character.rank)}): ${CharacterCalculations.calculateAvailableAttributeChips(this.character)}</span>
                </div>
            `;
        }

        // Attributes placeholder
        const attributesEl = this.container.querySelector('#character-attributes');
        if (attributesEl) {
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

            const createAttributeBox = ({ type, cost }: { type: AttributeType; cost: number }) => `
                <div class="attribute-box" data-attribute="${type}" style="
                    border: 1px solid #8b7355; 
                    border-radius: 5px; 
                    padding: 8px; 
                    margin-right: 5px; 
                    background: rgba(139, 115, 85, 0.1);
                    min-width: 120px;
                    text-align: center;
                ">
                    <div class="attribute-line" style="display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <span class="attribute-name" style="font-weight: bold;">${type}</span>
                        <span class="attribute-cost">(${cost})</span>
                        <span class="attribute-value" id="attr-${type}" style="
                            min-width: 25px; 
                            text-align: center; 
                            font-weight: bold; 
                            font-size: 16px;
                        ">${this.character.attributes[type]}</span>
                        <div class="attribute-spinner" style="display: flex; flex-direction: column;">
                            <button class="attr-btn inc-btn" data-action="inc" data-attribute="${type}" data-cost="${cost}"
                                    ${this.config.readOnly ? 'disabled' : ''} style="
                                        background: #8b7355; 
                                        color: white; 
                                        border: none; 
                                        border-radius: 2px; 
                                        width: 16px; 
                                        height: 16px; 
                                        cursor: pointer;
                                        font-size: 10px;
                                        line-height: 1;
                                        margin-bottom: 1px;
                                    ">▲</button>
                            <button class="attr-btn dec-btn" data-action="dec" data-attribute="${type}" data-cost="${cost}"
                                    ${this.config.readOnly ? 'disabled' : ''} style="
                                        background: #8b7355; 
                                        color: white; 
                                        border: none; 
                                        border-radius: 2px; 
                                        width: 16px; 
                                        height: 16px; 
                                        cursor: pointer;
                                        font-size: 10px;
                                        line-height: 1;
                                    ">▼</button>
                        </div>
                    </div>
                </div>
            `;

            const createAttributeRow = (emoji: string, attrs: any[]) => `
                <div class="attribute-category-row" style="
                    display: flex; 
                    align-items: center; 
                    margin-bottom: 15px;
                    gap: 5px;
                ">
                    <span class="category-emoji" style="
                        margin-right: 10px; 
                        font-size: 20px;
                        min-width: 30px;
                    ">${emoji}</span>
                    ${attrs.map(createAttributeBox).join('')}
                </div>
            `;

            attributesEl.innerHTML = `
                <h2>Attributes</h2>
                
                <div class="attributes-container" style="padding: 0 5px;">
                    ${createAttributeRow('💪', physicalAttrs)}
                    ${createAttributeRow('🗣️', socialAttrs)}  
                    ${createAttributeRow('🧠', mentalAttrs)}
                </div>
            `;

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
                        target.style.cursor = 'ns-resize';
                        target.style.backgroundColor = 'rgba(139, 115, 85, 0.2)'; // Slightly darker on hover
                        target.title = 'Use mouse wheel to increment/decrement';
                    });

                    attributeBox.addEventListener('mouseleave', (e) => {
                        const target = e.target as HTMLElement;
                        target.style.cursor = '';
                        target.style.backgroundColor = 'rgba(139, 115, 85, 0.1)'; // Back to original
                        target.title = '';
                    });
                });

                // Update button states based on current resources
                this.updateAttributeButtonStates(attributesEl);
            }
        }

        // Hollow tracker placeholder
        const hollowEl = this.container.querySelector('#character-hollow');
        if (hollowEl) {
            hollowEl.innerHTML = `
                <h2>Hollow Tracker</h2>
                <div class="hollow-stats">
                    <div class="dust-counter">
                        <label>Dust: ${this.character.hollow.dust}</label>
                    </div>
                    <div class="burned-counter">
                        <label>Burned: ${this.character.hollow.burned}</label>
                    </div>
                    <div class="hollow-influence">
                        <label>Hollow Influence: -${this.character.hollow.hollowInfluence}</label>
                    </div>
                    <div class="glimmer-debt">
                        <label>Glimmer Debt: ${this.character.hollow.glimmerDebt || 0}</label>
                    </div>
                    <div class="glimmer-debt-total">
                        <label>Total Debt: ${this.character.hollow.glimmerDebtTotal || 0}</label>
                    </div>
                    ${this.character.hollow.newMoonMarks > 0 ? `
                        <div class="new-moon-marks warning">
                            New Moon Marks: ${this.character.hollow.newMoonMarks}/3
                        </div>
                    ` : ''}
                </div>
            `;
        }

        // Skills placeholder
        const skillsEl = this.container.querySelector('#character-skills');
        if (skillsEl) {
            skillsEl.innerHTML = `
                <h2>Skills & Fields</h2>
                <div class="skills-list">
                    ${this.character.fields.length > 0 ? `
                        <h3>Fields</h3>
                        ${this.character.fields.map(field => `
                            <div class="field-item">
                                <label>${field.name}</label>
                                <span class="level">Level ${field.level}</span>
                                ${field.isFrozen ? '<span class="frozen">🔒</span>' : ''}
                            </div>
                        `).join('')}
                    ` : '<p>No fields defined</p>'}

                    ${this.character.skills.length > 0 ? `
                        <h3>Skills</h3>
                        ${this.character.skills.map(skill => `
                            <div class="skill-item">
                                <label>${skill.isListed ? '⭐' : ''} ${skill.name}</label>
                                <span class="level">Level ${skill.level}</span>
                                ${skill.isSpecialized ? '<span class="specialized">✓</span>' : ''}
                                ${skill.costMultiplier === 2 ? '<span class="x2">x2</span>' : ''}
                            </div>
                        `).join('')}
                    ` : '<p>No skills defined</p>'}
                </div>
            `;
        }

        // Benefits/Drawbacks placeholder
        const benefitsEl = this.container.querySelector('#character-benefits');
        if (benefitsEl) {
            benefitsEl.innerHTML = `
                <h2>Benefits & Drawbacks</h2>
                <div class="benefits-drawbacks">
                    ${this.character.benefits.length > 0 ? `
                        <h3>Benefits</h3>
                        ${this.character.benefits.map(benefit => `
                            <div class="benefit-item">
                                <strong>${benefit.name} +${benefit.level}</strong>
                                <p class="condition">${benefit.condition}</p>
                                <p class="description">${benefit.description}</p>
                            </div>
                        `).join('')}
                    ` : '<p>No benefits defined</p>'}

                    ${this.character.drawbacks.length > 0 ? `
                        <h3>Drawbacks</h3>
                        ${this.character.drawbacks.map(drawback => `
                            <div class="drawback-item">
                                <strong>${drawback.name} -${drawback.level}</strong>
                                <p class="condition">${drawback.condition}</p>
                                <p class="description">${drawback.description}</p>
                            </div>
                        `).join('')}
                    ` : '<p>No drawbacks defined</p>'}
                </div>
            `;
        }

        // Equipment placeholder
        const equipmentEl = this.container.querySelector('#character-equipment');
        if (equipmentEl) {
            equipmentEl.innerHTML = `
                <h2>Equipment & Companions</h2>
                <div class="equipment-list">
                    ${this.character.items.length > 0 ? `
                        <h3>Items</h3>
                        ${this.character.items.map(item => `
                            <div class="item-entry">
                                <strong>${item.name}</strong>
                                ${item.level ? `<span class="item-level">+${item.level}</span>` : ''}
                                <p class="item-description">${item.description}</p>
                            </div>
                        `).join('')}
                    ` : '<p>No items</p>'}

                    ${this.character.companions.length > 0 ? `
                        <h3>Companions</h3>
                        ${this.character.companions.map(companion => `
                            <div class="companion-entry">
                                <strong>${companion.name}</strong>
                                <span class="companion-type">(${companion.type})</span>
                                <span class="xp-spent">XP: ${companion.xpSpent}</span>
                                <p class="companion-description">${companion.description}</p>
                            </div>
                        `).join('')}
                    ` : '<p>No companions</p>'}
                </div>
            `;
        }
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

    private refreshComponents(): void {
        if (this.container) {
            this.initializePlaceholderContent();
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