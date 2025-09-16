// Character Manager View following SOLID principles
// Interface for managing multiple characters in the game

import { ICharacter } from '../character/types.js';
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
            body: 3,
            coordination: 4,
            sense: 5,
            mind: 2,
            command: 1,
            charm: 2
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
            body: 1,
            coordination: 2,
            sense: 4,
            mind: 5,
            command: 3,
            charm: 3
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
        this.characters = [...SAMPLE_CHARACTERS]; // Load from storage in real implementation
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
        // Create a basic new character template
        const newCharacter: ICharacter = {
            id: `char-${Date.now()}`,
            name: 'New Character',
            description: 'A mysterious newcomer to the frontier',
            rank: 1,
            currentXP: 0,
            totalXP: 0,
            damageCapacity: 6,
            attributes: {
                body: 0,
                coordination: 0,
                sense: 0,
                mind: 0,
                command: 0,
                charm: 0
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
                        <div class="character-grid">
                            ${this.characters.map(character => `
                                <div class="${this.config.characterItemClass}" data-character-id="${character.id}">
                                    <div class="character-portrait">
                                        <div class="character-avatar">${character.name.charAt(0)}</div>
                                    </div>
                                    <div class="character-info">
                                        <h3>${character.name}</h3>
                                        <p class="character-desc">${character.description}</p>
                                        <div class="character-stats-preview">
                                            <span class="rank">Rank ${character.rank}</span>
                                            <span class="xp">${character.currentXP}/${character.totalXP} XP</span>
                                            ${character.hollow.dust > 0 ? `<span class="dust warning">${character.hollow.dust} Dust</span>` : ''}
                                        </div>
                                    </div>
                                    <div class="character-actions">
                                        <button class="edit-btn" data-action="edit" data-character-id="${character.id}">Edit</button>
                                        <button class="select-btn" data-action="select" data-character-id="${character.id}">Select</button>
                                        <button class="delete-btn" data-action="delete" data-character-id="${character.id}">Delete</button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="empty-state">
                            <p>No characters created yet</p>
                            <p class="empty-subtitle">Create your first frontier character to begin your journey</p>
                        </div>
                    `}
                </div>

                <div class="${this.config.actionsClass}">
                    <button class="${this.config.newCharacterButtonClass}" id="new-character-btn">Create New Character</button>
                    <button class="${this.config.backButtonClass}" id="back-to-menu-btn">Back to Menu</button>
                </div>
            </div>
        `;

        this.container.innerHTML = listHtml;
        this.setupListEventListeners();
    }

    private renderCharacterEditor(): void {
        if (!this.container || !this.selectedCharacter) return;

        const editorHtml = `
            <div class="${this.config.containerClass}">
                <div class="${this.config.headerClass}">
                    <h1>Editing: ${this.selectedCharacter.name}</h1>
                    <div class="editor-actions">
                        <button class="save-btn" id="save-character-btn">Save Character</button>
                        <button class="back-to-list-btn" id="back-to-list-btn">Back to List</button>
                    </div>
                </div>

                <div id="character-sheet-container">
                    <!-- Character sheet will be rendered here -->
                </div>
            </div>
        `;

        this.container.innerHTML = editorHtml;

        // Initialize character sheet
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

        // Character action buttons
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
                    case 'select':
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
        });

        // New character button
        const newCharacterBtn = this.container.querySelector('#new-character-btn');
        if (newCharacterBtn) {
            newCharacterBtn.addEventListener('click', () => {
                this.createNewCharacter();
            });
        }

        // Back to menu button
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

        // Save character button
        const saveBtn = this.container.querySelector('#save-character-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                if (this.characterSheet && this.selectedCharacter) {
                    // Update the character from the sheet
                    const updatedCharacter = this.characterSheet.getCharacter();
                    const index = this.characters.findIndex(c => c.id === this.selectedCharacter!.id);
                    if (index >= 0) {
                        this.characters[index] = updatedCharacter;
                    }

                    // Validate the character
                    const errors = this.characterSheet.validateCharacter();
                    if (errors.length > 0) {
                        alert('Character validation failed:\n\n' + errors.join('\n'));
                    } else {
                        alert('Character saved successfully!');
                        this.currentView = 'list';
                        this.render(this.container!);
                    }
                }
            });
        }

        // Back to list button
        const backBtn = this.container.querySelector('#back-to-list-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.currentView = 'list';
                this.render(this.container!);
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
                    justify-content: center;
                    gap: 15px;
                }

                .character-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 20px;
                    margin-bottom: 40px;
                }

                .character-item {
                    background: rgba(255,248,220,0.95);
                    border: 3px solid #cd853f;
                    border-radius: 8px;
                    padding: 20px;
                    transition: all 0.3s ease;
                    position: relative;
                    box-shadow:
                        inset 0 0 20px rgba(222,184,135,0.5),
                        0 0 15px rgba(0,0,0,0.3);
                }

                .character-item:hover {
                    background: rgba(255,248,220,1);
                    border-color: #8b4513;
                    transform: translateY(-2px);
                    box-shadow:
                        inset 0 0 25px rgba(222,184,135,0.7),
                        0 5px 20px rgba(0,0,0,0.4);
                }

                .character-portrait {
                    text-align: center;
                    margin-bottom: 15px;
                }

                .character-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: linear-gradient(45deg, #cd853f, #daa520);
                    border: 3px solid #8b4513;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: bold;
                    color: #3d2914;
                    margin: 0 auto;
                    text-shadow: 1px 1px 0px rgba(255,255,255,0.5);
                }

                .character-info {
                    text-align: center;
                    margin-bottom: 20px;
                }

                .character-info h3 {
                    font-family: 'Sancreek', serif;
                    color: #8b4513;
                    margin: 0 0 8px 0;
                    font-size: 1.5rem;
                }

                .character-desc {
                    color: #654321;
                    font-style: italic;
                    margin: 0 0 15px 0;
                    font-size: 0.9rem;
                }

                .character-stats-preview {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }

                .character-stats-preview span {
                    background: rgba(139,69,19,0.1);
                    padding: 4px 8px;
                    border-radius: 4px;
                    border: 1px solid #cd853f;
                    font-size: 0.85rem;
                    font-weight: bold;
                }

                .warning {
                    background: rgba(255,69,0,0.2) !important;
                    border-color: #ff4500 !important;
                    color: #ff4500;
                }

                .character-actions {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                }

                .edit-btn,
                .select-btn,
                .delete-btn,
                .save-btn,
                .back-to-list-btn,
                .new-character-button,
                .back-to-menu-button {
                    font-family: 'Rye', serif;
                    padding: 8px 16px;
                    border-radius: 4px;
                    border: 2px solid;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    font-weight: bold;
                    font-size: 0.9rem;
                }

                .edit-btn,
                .save-btn {
                    background: linear-gradient(45deg, #228b22, #32cd32);
                    border-color: #006400;
                    color: white;
                }

                .edit-btn:hover,
                .save-btn:hover {
                    background: linear-gradient(45deg, #32cd32, #00ff00);
                    transform: translateY(-1px);
                }

                .select-btn {
                    background: linear-gradient(45deg, #4169e1, #6495ed);
                    border-color: #000080;
                    color: white;
                }

                .select-btn:hover {
                    background: linear-gradient(45deg, #6495ed, #87ceeb);
                    transform: translateY(-1px);
                }

                .delete-btn {
                    background: linear-gradient(45deg, #dc143c, #ff6347);
                    border-color: #8b0000;
                    color: white;
                }

                .delete-btn:hover {
                    background: linear-gradient(45deg, #ff6347, #ff4500);
                    transform: translateY(-1px);
                }

                .back-to-list-btn,
                .back-to-menu-button {
                    background: linear-gradient(45deg, #696969, #808080);
                    border-color: #2f4f4f;
                    color: white;
                }

                .back-to-list-btn:hover,
                .back-to-menu-button:hover {
                    background: linear-gradient(45deg, #808080, #a9a9a9);
                    transform: translateY(-1px);
                }

                .new-character-button {
                    background: linear-gradient(45deg, #deb887, #f4a460);
                    border-color: #8b4513;
                    color: #3d2914;
                    padding: 15px 30px;
                    font-size: 1.2rem;
                }

                .new-character-button:hover {
                    background: linear-gradient(45deg, #f4a460, #ffd700);
                    transform: translateY(-1px);
                    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }

                .character-manager-actions {
                    text-align: center;
                    display: flex;
                    justify-content: center;
                    gap: 20px;
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
                    .character-grid {
                        grid-template-columns: 1fr;
                    }

                    .character-actions {
                        flex-direction: column;
                    }

                    .character-manager-actions {
                        flex-direction: column;
                        align-items: center;
                    }

                    .editor-actions {
                        flex-direction: column;
                        align-items: center;
                    }
                }
            `;
            document.head.appendChild(styleSheet);
        }
    }
}
