// Character Manager View following SOLID principles
// Interface for managing multiple characters in the game

import { ICharacter, AttributeType } from '../character/types.js';
import { CharacterSheet } from '../character/CharacterSheet.js';
import { IUIComponent } from './SplashScreen.js';

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

    public onBackToMenu?: () => void;
    public onCharacterSelected?: (character: ICharacter) => void;

    constructor(config: Partial<ICharacterManagerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.characters = [...SAMPLE_CHARACTERS];
    }

    render(container: HTMLElement): void {
        if (!container) {
            throw new Error('Container element is required');
        }

        this.container = container;

        if (this.currentView === 'list') {
            this.renderCharacterList();
        } else if (this.currentView === 'edit' && this.selectedCharacter) {
            this.renderCharacterEditor();
        }

        this.applyStyles();
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
        const newCharacter: ICharacter = {
            id: crypto.randomUUID(),
            name: 'New Character',
            description: 'A mysterious newcomer to the frontier',
            rank: 1,
            currentXP: 0,
            totalXP: 0,
            damageCapacity: 6,
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
                dust: 0,
                burned: 0,
                hollowInfluence: 0,
                newMoonMarks: 0
            },
            items: [],
            companions: []
        };

        this.characters.push(newCharacter);
        this.editCharacter(newCharacter.id);
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
            this.characters = this.characters.filter(c => c.id !== characterId);

            if (this.selectedCharacter?.id === characterId) {
                this.selectedCharacter = null;
                this.currentView = 'list';
            }

            if (this.currentView === 'list') {
                this.render(this.container!);
            }
        }
    }

    private renderCharacterList(): void {
        if (!this.container) return;

        const listHtml = `
            <div class="${this.config.containerClass}">
                <div class="${this.config.headerClass}">
                    <h1>Character Manager</h1>
                    <p class="header-description">Manage your characters for the frontier</p>
                </div>

                <div class="${this.config.listClass}">
                    ${this.characters.length > 0 ? `
                        <div class="character-cards">
                            ${this.characters.map(character => this.renderCharacterCard(character)).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <p>No characters created yet</p>
                            <p class="empty-subtitle">Create your first frontier character to begin your journey</p>
                        </div>
                    `}
                </div>

                <div class="${this.config.actionsClass}">
                    <button class="${this.config.newCharacterButtonClass}" id="add-character-btn">Add Character</button>
                </div>

                <div class="bottom-actions">
                    <button class="${this.config.backButtonClass}" id="back-to-menu-btn">Back to Menu</button>
                </div>
            </div>
        `;

        this.container.innerHTML = listHtml;
        this.setupListEventListeners();
    }

    private renderCharacterCard(character: ICharacter): string {
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

        return `
            <div class="${this.config.characterItemClass}" data-character-id="${character.id}">
                <div class="character-card-content" data-action="edit" data-character-id="${character.id}">
                    <div class="character-name">
                        <h3>${character.name}</h3>
                    </div>
                    <div class="character-stats">
                        <div class="primary-stats">${primaryStats}</div>
                        <div class="attributes">${attributes}</div>
                    </div>
                </div>
                <div class="character-delete">
                    <button class="delete-btn" data-action="delete" data-character-id="${character.id}" title="Delete Character">💀</button>
                </div>
            </div>
        `;
    }

    private renderCharacterEditor(): void {
        if (!this.container || !this.selectedCharacter) return;

        const editorHtml = `
            <div class="${this.config.containerClass}">
                <div class="${this.config.headerClass}">
                    <h1>Editing: ${this.selectedCharacter.name}</h1>
                    <div class="editor-actions">
                        <button class="nope-btn" id="nope-character-btn">Nope</button>
                        <button class="yep-btn" id="yep-character-btn">Yep</button>
                    </div>
                </div>

                <div id="character-sheet-container">
                    <!-- Character sheet will be rendered here -->
                </div>
            </div>
        `;

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
                    const updatedCharacter = this.characterSheet.getCharacter();
                    const index = this.characters.findIndex(c => c.id === this.selectedCharacter!.id);
                    if (index >= 0) {
                        this.characters[index] = updatedCharacter;
                    }

                    const errors = this.characterSheet.validateCharacter();
                    if (errors.length > 0) {
                        alert('Character validation failed:\n\n' + errors.join('\n'));
                    } else {
                        this.currentView = 'list';
                        this.render(this.container!);
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
                @import url('https://fonts.googleapis.com/css2?family=Rye&family=Sancreek&display=swap');

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
                    background: rgba(255,248,220,0.95);
                    border: 3px solid #cd853f;
                    border-radius: 8px;
                    padding: 0;
                    transition: all 0.3s ease;
                    position: relative;
                    box-shadow:
                        inset 0 0 20px rgba(222,184,135,0.5),
                        0 0 15px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: stretch;
                    cursor: pointer;
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

                #character-sheet-container {
                    position: relative;
                    z-index: 10;
                }

                @media (max-width: 768px) {
                    .editor-actions {
                        flex-direction: column;
                        align-items: center;
                    }

                    .character-item {
                        flex-direction: column;
                    }

                    .character-delete {
                        border-left: none;
                        border-top: 2px solid #cd853f;
                        justify-content: center;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
}