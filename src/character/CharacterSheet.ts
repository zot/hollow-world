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
import { CharacterUpdater, CharacterValidation } from './CharacterUtils.js';

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
                    <span class="xp">XP: ${this.character.currentXP}/${this.character.totalXP}</span>
                    <span class="damage-capacity">Damage Capacity: ${this.character.damageCapacity}</span>
                </div>
            `;
        }

        // Attributes placeholder
        const attributesEl = this.container.querySelector('#character-attributes');
        if (attributesEl) {
            attributesEl.innerHTML = `
                <h2>Attributes</h2>
                <div class="attributes-grid">
                    ${Object.entries(this.character.attributes).map(([attr, value]) => `
                        <div class="attribute-item">
                            <label>${attr}</label>
                            <input type="number" value="${value}"
                                   min="-2" max="15"
                                   data-attribute="${attr}"
                                   ${this.config.readOnly ? 'disabled' : ''}>
                        </div>
                    `).join('')}
                </div>
            `;

            // Add attribute change listeners
            if (!this.config.readOnly) {
                attributesEl.querySelectorAll('input[data-attribute]').forEach(input => {
                    input.addEventListener('change', (e) => {
                        const target = e.target as HTMLInputElement;
                        const attribute = target.dataset.attribute as AttributeType;
                        const value = parseInt(target.value);
                        this.callbacks.onAttributeChange(attribute, value);
                    });
                });
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
                                <label>${skill.isListed ? '🞐' : ''} ${skill.name}</label>
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

    private applyStyles(): void {
        if (!document.getElementById('character-sheet-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'character-sheet-styles';
            styleSheet.textContent = `
                @import url('https://fonts.googleapis.com/css2?family=Sancreek&family=Rye&display=swap');

                .character-sheet-container {
                    font-family: 'Rye', 'Times New Roman', serif;
                    background: linear-gradient(45deg, #f4e4bc, #e6d7b7);
                    border: 4px solid #8b4513;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px;
                    box-shadow:
                        inset 0 0 20px rgba(139,69,19,0.1),
                        0 0 30px rgba(0,0,0,0.3);
                    position: relative;
                    color: #3d2914;
                }

                .character-sheet-container::before {
                    content: '';
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    right: 10px;
                    bottom: 10px;
                    border: 2px solid rgba(139,69,19,0.3);
                    border-radius: 4px;
                    pointer-events: none;
                }

                .character-header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: rgba(222,184,135,0.5);
                    border: 2px solid #cd853f;
                    border-radius: 4px;
                }

                .character-header h1 {
                    font-family: 'Sancreek', 'Rye', serif;
                    font-size: 2.5rem;
                    color: #8b4513;
                    margin: 0 0 10px 0;
                    text-shadow: 2px 2px 0px rgba(0,0,0,0.3);
                }

                .character-description {
                    font-style: italic;
                    color: #654321;
                    margin: 10px 0;
                }

                .character-stats {
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    margin-top: 15px;
                }

                .character-stats span {
                    background: rgba(139,69,19,0.1);
                    padding: 5px 10px;
                    border-radius: 4px;
                    border: 1px solid #cd853f;
                    font-weight: bold;
                }

                .character-main-content {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                }

                .character-left-column,
                .character-right-column {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .character-attributes,
                .character-hollow,
                .character-skills,
                .character-benefits,
                .character-equipment {
                    background: rgba(255,248,220,0.7);
                    border: 2px solid #deb887;
                    border-radius: 4px;
                    padding: 20px;
                    position: relative;
                }

                .character-attributes h2,
                .character-hollow h2,
                .character-skills h2,
                .character-benefits h2,
                .character-equipment h2 {
                    font-family: 'Sancreek', serif;
                    color: #8b4513;
                    margin: 0 0 15px 0;
                    text-align: center;
                    font-size: 1.8rem;
                }

                .attributes-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }

                .attribute-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    background: rgba(222,184,135,0.3);
                    border: 1px solid #cd853f;
                    border-radius: 4px;
                }

                .attribute-item label {
                    font-weight: bold;
                    color: #654321;
                }

                .attribute-item input {
                    width: 50px;
                    padding: 4px;
                    border: 1px solid #8b4513;
                    border-radius: 2px;
                    background: rgba(255,248,220,0.9);
                    text-align: center;
                    font-family: inherit;
                }

                .hollow-stats {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .hollow-stats > div {
                    padding: 8px;
                    background: rgba(222,184,135,0.3);
                    border: 1px solid #cd853f;
                    border-radius: 4px;
                    text-align: center;
                }

                .warning {
                    background: rgba(255,69,0,0.2) !important;
                    border-color: #ff4500 !important;
                    color: #ff4500;
                    font-weight: bold;
                }

                .skills-list,
                .benefits-drawbacks,
                .equipment-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .field-item,
                .skill-item,
                .benefit-item,
                .drawback-item,
                .item-entry,
                .companion-entry {
                    padding: 10px;
                    margin-bottom: 8px;
                    background: rgba(222,184,135,0.2);
                    border: 1px solid #cd853f;
                    border-radius: 4px;
                }

                .benefit-item {
                    border-left: 4px solid #228b22;
                }

                .drawback-item {
                    border-left: 4px solid #dc143c;
                }

                .condition {
                    font-style: italic;
                    color: #666;
                    margin: 5px 0;
                    font-size: 0.9rem;
                }

                .character-actions {
                    text-align: center;
                    border-top: 2px solid #cd853f;
                    padding-top: 20px;
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                }

                .export-btn,
                .import-btn,
                .validate-btn {
                    font-family: 'Rye', serif;
                    background: linear-gradient(45deg, #deb887, #cd853f);
                    border: 2px solid #8b4513;
                    color: #3d2914;
                    padding: 10px 20px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: bold;
                }

                .export-btn:hover,
                .import-btn:hover,
                .validate-btn:hover {
                    background: linear-gradient(45deg, #f4a460, #daa520);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                }

                @media (max-width: 768px) {
                    .character-main-content {
                        grid-template-columns: 1fr;
                    }

                    .attributes-grid {
                        grid-template-columns: 1fr;
                    }

                    .character-stats {
                        flex-direction: column;
                        gap: 10px;
                    }

                    .character-actions {
                        flex-direction: column;
                        align-items: center;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
}