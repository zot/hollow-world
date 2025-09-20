console.log('Updated main.ts loading...');

import { LibP2PNetworkProvider } from './p2p.js';
import {
    ICharacter,
    IAttributes,
    AttributeType,
    IHollowData,
    ISkill,
    IField,
    IBenefit,
    IDrawback,
    IItem,
    ICompanion,
    CHARACTER_CREATION_RULES
} from './character/types.js';
import { CharacterCalculations } from './character/CharacterUtils.js';

// Use the existing comprehensive character interface

// Character storage service
class CharacterStorageService {
    private readonly STORAGE_KEY = 'hollowWorldCharacters';

    generateUUID(): string {
        return 'char-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
    }

    async saveCharacter(character: ICharacter): Promise<void> {
        try {
            const characters = await this.getAllCharacters();
            const existingIndex = characters.findIndex(c => c.id === character.id);

            character.updatedAt = new Date();

            if (existingIndex >= 0) {
                characters[existingIndex] = character;
            } else {
                characters.push(character);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(characters));
        } catch (error) {
            console.error('Failed to save character:', error);
            throw error;
        }
    }

    async getCharacter(id: string): Promise<ICharacter | null> {
        try {
            const characters = await this.getAllCharacters();
            return characters.find(c => c.id === id) || null;
        } catch (error) {
            console.error('Failed to get character:', error);
            return null;
        }
    }

    async getAllCharacters(): Promise<ICharacter[]> {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Failed to get characters:', error);
            return [];
        }
    }

    async deleteCharacter(id: string): Promise<boolean> {
        try {
            const characters = await this.getAllCharacters();
            const filteredCharacters = characters.filter(c => c.id !== id);

            if (filteredCharacters.length === characters.length) {
                return false; // Character not found
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredCharacters));
            return true;
        } catch (error) {
            console.error('Failed to delete character:', error);
            return false;
        }
    }

    createNewCharacter(name: string = 'New Outlaw'): ICharacter {
        const now = new Date();

        const attributes: IAttributes = {
            [AttributeType.DEX]: 0,
            [AttributeType.STR]: 0,
            [AttributeType.CON]: 0,
            [AttributeType.CHA]: 0,
            [AttributeType.WIS]: 0,
            [AttributeType.GRI]: 0,
            [AttributeType.INT]: 0,
            [AttributeType.PER]: 0
        };

        const hollow: IHollowData = {
            dust: CHARACTER_CREATION_RULES.startingDust,
            burned: 0,
            hollowInfluence: 0,
            glimmerDebt: 0,
            glimmerDebtTotal: 0,
            newMoonMarks: 0
        };

        return {
            id: this.generateUUID(),
            name,
            description: 'A mysterious newcomer to the frontier',
            rank: 1,
            totalXP: CHARACTER_CREATION_RULES.startingXP,
            currentXP: CHARACTER_CREATION_RULES.startingXP,
            attributes,
            skills: [],
            fields: [],
            benefits: [],
            drawbacks: [],
            items: [],
            companions: [],
            hollow,
            damageCapacity: CharacterCalculations.calculateDamageCapacity(attributes[AttributeType.CON]),
            attributeChipsSpent: {
                positive: 0,
                negative: 0
            },
            createdAt: now,
            updatedAt: now
        };
    }
}

// Simple URL-based routing and audio implementation
class SimpleAudioManager {
    private gunshotAudio: HTMLAudioElement | null = null;
    private backgroundMusic: HTMLAudioElement | null = null;
    private activeGunshots: HTMLAudioElement[] = [];

    constructor() {
        // Initialize gunshot audio
        this.gunshotAudio = new Audio('./src/assets/audio/single-gunshot-54-40780.mp3');

        // Initialize background music
        this.backgroundMusic = new Audio('./src/assets/audio/western-adventure-cinematic-spaghetti-loop-385618.mp3');
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.3;

        // Try to start background music (may be blocked by browser)
        this.startBackgroundMusic();
    }

    async startBackgroundMusic(): Promise<void> {
        try {
            await this.backgroundMusic?.play();
            console.log('Background music started');
        } catch (error) {
            console.log('Background music blocked by browser, waiting for user interaction');
        }
    }

    async playRandomGunshot(): Promise<void> {
        try {
            // Stop any currently playing gunshots
            this.activeGunshots.forEach(audio => {
                audio.pause();
                audio.currentTime = 0;
            });
            this.activeGunshots = [];

            // Create new audio instance for this gunshot
            const audio = new Audio('./src/assets/audio/single-gunshot-54-40780.mp3');

            // Random variations
            const volumeVariation = 0.5 + Math.random() * 0.4; // 0.5 to 0.9
            audio.volume = 0.7 * volumeVariation;

            const pitchVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
            audio.playbackRate = pitchVariation;

            this.activeGunshots.push(audio);

            // Clean up when done
            audio.addEventListener('ended', () => {
                this.removeGunshot(audio);
            });

            await audio.play();
        } catch (error) {
            console.warn('Failed to play gunshot:', error);
        }
    }

    toggleMusic(): void {
        if (!this.backgroundMusic) return;

        if (this.backgroundMusic.paused) {
            this.backgroundMusic.play().catch(error => {
                console.warn('Failed to resume music:', error);
            });
        } else {
            this.backgroundMusic.pause();
        }
    }

    isMusicPlaying(): boolean {
        return this.backgroundMusic ? !this.backgroundMusic.paused : false;
    }

    private removeGunshot(audio: HTMLAudioElement): void {
        const index = this.activeGunshots.indexOf(audio);
        if (index > -1) {
            this.activeGunshots.splice(index, 1);
        }
    }
}

// Global audio manager instance
let globalAudioManager: SimpleAudioManager;

// Simple router
class SimpleRouter {
    private currentPath: string = '/';
    private history: { path: string; title: string; data?: any }[] = [];
    private currentIndex: number = -1;
    private networkProvider: LibP2PNetworkProvider;
    private peerId: string = 'Initializing...';
    private characterStorage: CharacterStorageService;
    private currentCharacter: ICharacter | null = null;

    constructor() {
        this.currentPath = window.location.pathname || '/';
        console.log('Router initialized with path:', this.currentPath);

        this.networkProvider = new LibP2PNetworkProvider();
        this.characterStorage = new CharacterStorageService();

        // Initialize global audio manager
        globalAudioManager = new SimpleAudioManager();

        this.initializeNetwork();

        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });

        // Set initial state
        window.history.replaceState({
            path: this.currentPath,
            title: "Don't Go Hollow"
        }, "Don't Go Hollow", this.currentPath);
    }

    private async initializeNetwork(): Promise<void> {
        try {
            console.log('Initializing P2P network...');
            await this.networkProvider.initialize();
            this.peerId = this.networkProvider.getPeerId();
            console.log('Network initialized with peer ID:', this.peerId);

            // Re-render if we're on the splash screen to show the real peer ID
            if (this.currentPath === '/' || this.currentPath === '/splash') {
                this.render();
            }
        } catch (error) {
            console.error('Failed to initialize network:', error);
            this.peerId = 'Network failed to initialize';

            // Still re-render to show the error state
            if (this.currentPath === '/' || this.currentPath === '/splash') {
                this.render();
            }
        }
    }

    navigate(path: string, title: string, data?: any): void {
        // Truncate forward history when navigating to new path
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        this.history.push({ path, title, data });
        this.currentIndex = this.history.length - 1;

        this.currentPath = path;
        window.history.pushState({ path, title, data }, title, path);
        document.title = title;

        this.render();
    }

    private handlePopState(event: PopStateEvent): void {
        const state = event.state;

        // Get path from state or current URL
        const newPath = (state && state.path) ? state.path : window.location.pathname;
        const newTitle = (state && state.title) ? state.title : "Don't Go Hollow";

        console.log('PopState event:', { newPath, currentPath: this.currentPath, state });

        this.currentPath = newPath;
        document.title = newTitle;
        this.render();
    }

    render(): void {
        const app = document.getElementById('app');
        if (!app) return;

        console.log('Rendering view for path:', this.currentPath);

        if (this.currentPath === '/' || this.currentPath === '/splash') {
            console.log('Rendering splash screen');
            this.renderSplashScreen(app);
        } else if (this.currentPath === '/characters') {
            console.log('Rendering character manager');
            this.renderCharacterManager(app);
        } else if (this.currentPath.startsWith('/character/')) {
            const id = this.currentPath.replace('/character/', '');
            console.log('Rendering character editor for ID:', id);
            this.renderCharacterEditor(app, id);
        } else {
            console.log('Rendering default (splash) screen');
            this.renderSplashScreen(app);
        }
    }

    private renderSplashScreen(app: HTMLElement): void {
        // Use real peer ID from network provider
        const peerId = this.peerId;

        app.innerHTML = `
            <div class="splash-container">
                <div class="splash-title">
                    Don't Go <span class="hollow-word">Hollow</span>
                </div>

                <div class="splash-peer-id" id="peer-id-display">
                    Peer ID: ${peerId}
                </div>

                <div class="splash-buttons">
                    <button class="splash-button" id="join-btn">Join Game</button>
                    <button class="splash-button" id="start-btn">Start Game</button>
                    <button class="splash-button" id="characters-btn">Characters</button>
                </div>
            </div>
        `;

        this.setupSplashEventListeners();

        // Add global music button
        this.addGlobalMusicButton(app);
    }

    private async renderCharacterManager(app: HTMLElement): Promise<void> {
        try {
            const characters = await this.characterStorage.getAllCharacters();

            app.innerHTML = `
                <div class="character-manager-container">
                    <div class="character-manager-header">
                        <h1>Character Manager</h1>
                        <p>Manage your frontier outlaws</p>
                    </div>

                    <div class="character-manager-content">
                        ${characters.length > 0 ? `
                            <div class="character-list">
                                ${characters.map(char => `
                                    <div class="character-item" data-id="${char.id}">
                                        <div class="character-info">
                                            <div class="character-stats">
                                                <span class="character-name">${char.name}</span>
                                                <span class="rank">Rank ${char.rank}</span>
                                                <span class="xp">${char.currentXP}/${char.totalXP} XP</span>
                                                <span class="damage-cap">DC: ${char.damageCapacity}</span>
                                                <span class="dust">Dust: ${char.hollow.dust}</span>
                                                ${char.hollow.hollowInfluence > 0 ? `<span class="hollow-influence warning">Hollow: -${char.hollow.hollowInfluence}</span>` : ''}
                                            </div>
                                            <div class="character-attributes-by-category">
                                                <div class="attr-category-group">
                                                    <span class="category-label">Physical:</span>
                                                    <span>DEX: ${char.attributes[AttributeType.DEX]}</span>
                                                    <span>STR: ${char.attributes[AttributeType.STR]}</span>
                                                    <span>CON: ${char.attributes[AttributeType.CON]}</span>
                                                </div>
                                                <div class="attr-category-group">
                                                    <span class="category-label">Social:</span>
                                                    <span>CHA: ${char.attributes[AttributeType.CHA]}</span>
                                                    <span>WIS: ${char.attributes[AttributeType.WIS]}</span>
                                                    <span>GRI: ${char.attributes[AttributeType.GRI]}</span>
                                                </div>
                                                <div class="attr-category-group">
                                                    <span class="category-label">Mental:</span>
                                                    <span>INT: ${char.attributes[AttributeType.INT]}</span>
                                                    <span>PER: ${char.attributes[AttributeType.PER]}</span>
                                                </div>
                                            </div>
                                            <p class="character-desc">${char.description}</p>
                                        </div>
                                        <div class="character-actions">
                                            <button class="delete-btn" data-id="${char.id}" title="Delete Character">💀</button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <h2>No Characters Yet</h2>
                                <p>Create your first outlaw to begin your journey on the frontier.</p>
                            </div>
                        `}

                        <div class="add-character-section">
                            <button class="splash-button" id="add-character-btn">Add Character</button>
                        </div>
                    </div>

                    <div class="character-manager-actions">
                        <button class="splash-button secondary" id="back-to-menu-btn">Back to Menu</button>
                    </div>
                </div>
            `;

            this.setupCharacterManagerEventListeners();

            // Add global music button
            this.addGlobalMusicButton(app);
        } catch (error) {
            console.error('Failed to render character manager:', error);
            app.innerHTML = `
                <div class="character-manager-container">
                    <div class="character-manager-header">
                        <h1>Character Manager</h1>
                        <p style="color: red;">Failed to load characters</p>
                    </div>
                    <div class="character-manager-actions">
                        <button class="splash-button secondary" id="back-to-menu-btn">Back to Menu</button>
                    </div>
                </div>
            `;
            this.setupCharacterManagerEventListeners();
        }
    }

    private setupSplashEventListeners(): void {
        const joinBtn = document.getElementById('join-btn');
        const startBtn = document.getElementById('start-btn');
        const charactersBtn = document.getElementById('characters-btn');
        const peerIdDisplay = document.getElementById('peer-id-display');

        if (joinBtn) {
            joinBtn.addEventListener('click', async () => {
                await globalAudioManager.playRandomGunshot();
                console.log('Join Game clicked');
                // TODO: Implement join game functionality
            });
        }

        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                await globalAudioManager.playRandomGunshot();
                console.log('Start Game clicked');
                // TODO: Implement start game functionality
            });
        }

        if (charactersBtn) {
            charactersBtn.addEventListener('click', async () => {
                await globalAudioManager.playRandomGunshot();
                this.navigate('/characters', "Don't Go Hollow - Characters");
            });
        }

        if (peerIdDisplay) {
            peerIdDisplay.addEventListener('click', () => {
                this.selectAllText(peerIdDisplay);
            });
        }

    }

    private updateMusicButtonState(button: HTMLElement, audioManager: SimpleAudioManager): void {
        const isPlaying = audioManager.isMusicPlaying();
        button.textContent = isPlaying ? '🎵' : '🔇';
        button.title = isPlaying ? 'Pause Music' : 'Play Music';
    }

    private addGlobalMusicButton(container: HTMLElement): void {
        // Remove any existing music button first
        const existingButton = document.querySelector('.music-toggle-button');
        if (existingButton) {
            existingButton.remove();
        }

        // Create new music button
        const musicButton = document.createElement('button');
        musicButton.className = 'music-toggle-button';
        musicButton.id = 'global-music-toggle';
        musicButton.title = 'Toggle Music';

        // Set initial state
        const isPlaying = globalAudioManager.isMusicPlaying();
        musicButton.textContent = isPlaying ? '🎵' : '🔇';
        musicButton.title = isPlaying ? 'Pause Music' : 'Play Music';

        // Add event listener
        musicButton.addEventListener('click', () => {
            globalAudioManager.toggleMusic();
            this.updateMusicButtonState(musicButton, globalAudioManager);
        });

        // Add to document body (not container) for fixed positioning
        document.body.appendChild(musicButton);
    }

    private setupCharacterManagerEventListeners(): void {
        const backBtn = document.getElementById('back-to-menu-btn');
        const addBtn = document.getElementById('add-character-btn');
        const deleteButtons = document.querySelectorAll('.delete-btn');
        const characterItems = document.querySelectorAll('.character-item');

        if (backBtn) {
            backBtn.addEventListener('click', async () => {
                await globalAudioManager.playRandomGunshot();
                this.navigate('/', "Don't Go Hollow");
            });
        }

        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                await globalAudioManager.playRandomGunshot();
                // Create new character and navigate to editor
                const newCharacter = this.characterStorage.createNewCharacter();
                await this.characterStorage.saveCharacter(newCharacter);
                this.navigate(`/character/${newCharacter.id}`, `Don't Go Hollow - Edit ${newCharacter.name}`);
            });
        }

        // Character item click handlers (edit character)
        characterItems.forEach(item => {
            item.addEventListener('click', async (e) => {
                // Don't navigate if delete button was clicked
                if ((e.target as HTMLElement).classList.contains('delete-btn')) {
                    return;
                }

                await globalAudioManager.playRandomGunshot();
                const id = (item as HTMLElement).dataset.id;
                if (id) {
                    this.navigate(`/character/${id}`, `Don't Go Hollow - Edit Character`);
                }
            });
        });

        // Delete button handlers
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevent triggering the item click

                await globalAudioManager.playRandomGunshot();

                const id = (btn as HTMLElement).dataset.id;
                if (id && confirm('Are you sure you want to delete this character? This cannot be undone.')) {
                    await this.characterStorage.deleteCharacter(id);
                    // Re-render the character manager
                    this.render();
                }
            });
        });
    }

    private async renderCharacterEditor(app: HTMLElement, characterId: string): Promise<void> {
        try {
            const character = await this.characterStorage.getCharacter(characterId);

            if (!character) {
                app.innerHTML = `
                    <div class="character-editor-container">
                        <div class="character-editor-header">
                            <h1>Character Not Found</h1>
                            <p style="color: red;">The requested character could not be loaded.</p>
                        </div>
                        <div class="character-editor-actions">
                            <button class="splash-button secondary" id="back-to-characters-btn">Back to Characters</button>
                        </div>
                    </div>
                `;

                const backBtn = app.querySelector('#back-to-characters-btn');
                if (backBtn) {
                    backBtn.addEventListener('click', async () => {
                        await globalAudioManager.playRandomGunshot();
                        this.navigate('/characters', "Don't Go Hollow - Characters");
                    });
                }
                return;
            }

            // Store current character for editing session
            this.currentCharacter = { ...character };

            app.innerHTML = `
                <div class="character-editor-container">
                    <div class="character-editor-header">
                        <h1>Editing: ${character.name}</h1>
                        <p>Make changes to your frontier outlaw</p>
                    </div>

                    <div class="character-editor-content">
                        <div class="character-sheet-wrapper" id="character-sheet-container">
                            <div class="character-editor-form">
                                <div class="character-name-section">
                                    <label for="character-name">Character Name:</label>
                                    <input type="text" id="character-name" value="${character.name}" />
                                </div>

                                <div class="character-core-stats">
                                    <div class="core-stat-item">
                                        <label for="character-rank-input" class="core-stat-label">Rank:</label>
                                        <input type="number" id="character-rank-input" value="${character.rank}" min="1" max="15" />
                                    </div>
                                    <div class="core-stat-item">
                                        <span class="core-stat-label">Damage Capacity:</span>
                                        <span id="damage-capacity">${character.damageCapacity}</span>
                                    </div>
                                    <div class="core-stat-item">
                                        <span class="core-stat-label">Dust:</span>
                                        <span id="character-dust">${character.hollow.dust}</span>
                                    </div>
                                    <div class="core-stat-item">
                                        <span class="core-stat-label">Available XP (${this.getTotalXPForRank(character.rank)}):</span>
                                        <span id="available-xp">${character.currentXP}</span>
                                    </div>
                                    <div class="core-stat-item">
                                        <span class="core-stat-label">Attribute Chips (${this.getTotalChipsForRank(character.rank)}):</span>
                                        <span id="available-chips">${this.getAvailableAttributeChips()}</span>
                                    </div>
                                </div>

                                <div class="attributes-editor">
                                    <h3>Attributes</h3>

                                    <div class="attribute-category">
                                        <h4>Physical</h4>
                                        <div class="attribute-category-row">
                                            ${this.renderAttributeEditor('DEX', character.attributes[AttributeType.DEX], 4)}
                                            ${this.renderAttributeEditor('STR', character.attributes[AttributeType.STR], 3)}
                                            ${this.renderAttributeEditor('CON', character.attributes[AttributeType.CON], 1)}
                                        </div>
                                    </div>

                                    <div class="attribute-category">
                                        <h4>Social</h4>
                                        <div class="attribute-category-row">
                                            ${this.renderAttributeEditor('CHA', character.attributes[AttributeType.CHA], 4)}
                                            ${this.renderAttributeEditor('WIS', character.attributes[AttributeType.WIS], 3)}
                                            ${this.renderAttributeEditor('GRI', character.attributes[AttributeType.GRI], 1)}
                                        </div>
                                    </div>

                                    <div class="attribute-category">
                                        <h4>Mental</h4>
                                        <div class="attribute-category-row">
                                            ${this.renderAttributeEditor('INT', character.attributes[AttributeType.INT], 4)}
                                            ${this.renderAttributeEditor('PER', character.attributes[AttributeType.PER], 4)}
                                        </div>
                                    </div>
                                </div>


                                <div class="character-desc-section">
                                    <label for="character-desc">Description:</label>
                                    <textarea id="character-desc" rows="3">${character.description}</textarea>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="character-editor-actions">
                        <button class="splash-button secondary" id="nope-btn">Nope</button>
                        <button class="splash-button" id="yep-btn">Yep</button>
                        <button class="splash-button secondary" id="back-to-characters-btn">Back to Characters</button>
                    </div>
                </div>
            `;

            this.setupCharacterEditorEventListeners();

            // Add global music button
            this.addGlobalMusicButton(app);
        } catch (error) {
            console.error('Failed to render character editor:', error);
            app.innerHTML = `
                <div class="character-editor-container">
                    <div class="character-editor-header">
                        <h1>Error Loading Character</h1>
                        <p style="color: red;">Failed to load character: ${error}</p>
                    </div>
                    <div class="character-editor-actions">
                        <button class="splash-button secondary" id="back-to-characters-btn">Back to Characters</button>
                    </div>
                </div>
            `;

            const backBtn = app.querySelector('#back-to-characters-btn');
            if (backBtn) {
                backBtn.addEventListener('click', async () => {
                    await globalAudioManager.playRandomGunshot();
                    this.navigate('/characters', "Don't Go Hollow - Characters");
                });
            }
        }
    }

    private renderAttributeEditor(attrName: string, currentValue: number, cost: number): string {
        const wouldBeBelowMin = (currentValue - 1) < CHARACTER_CREATION_RULES.attributeMinimum;
        const isAtMaximum = currentValue >= CHARACTER_CREATION_RULES.attributeMaximum;

        // Check if increment is possible (not at max AND have resources)
        const availableChips = this.getAvailableAttributeChips();
        const availableXP = this.currentCharacter?.currentXP || 0;
        const canAffordIncrement = (availableChips >= cost) || (availableXP >= cost);
        const canIncrement = !isAtMaximum && canAffordIncrement;

        return `
            <div class="attribute-editor-row" data-attribute="${attrName}">
                <div class="attribute-info">
                    <span class="attribute-name">${attrName}</span>
                    <span class="attribute-cost">(${cost})</span>
                </div>
                <div class="attribute-controls">
                    <button class="attr-btn dec-btn ${wouldBeBelowMin ? 'disabled' : ''}"
                            data-action="dec" data-attribute="${attrName}" data-cost="${cost}"
                            ${wouldBeBelowMin ? 'disabled' : ''}>−</button>
                    <span class="attribute-value" id="attr-${attrName}">${currentValue}</span>
                    <button class="attr-btn inc-btn ${!canIncrement ? 'disabled' : ''}"
                            data-action="inc" data-attribute="${attrName}" data-cost="${cost}"
                            ${!canIncrement ? 'disabled' : ''}>+</button>
                </div>
            </div>
        `;
    }

    private incrementAttribute(attrName: string, cost: number): void {
        if (!this.currentCharacter) return;

        const attrKey = AttributeType[attrName as keyof typeof AttributeType];
        const currentValue = this.currentCharacter.attributes[attrKey];

        // Check attribute range maximum
        if (currentValue >= CHARACTER_CREATION_RULES.attributeMaximum) {
            console.warn('Cannot increase attribute above maximum of', CHARACTER_CREATION_RULES.attributeMaximum);
            return;
        }

        // Check if we can afford it
        const availableChips = this.getAvailableAttributeChips();
        const availableXP = this.currentCharacter.currentXP;

        if (availableChips >= cost) {
            // Use attribute chips (automatically tracked by total cost calculation)
            this.currentCharacter.attributes[attrKey] = currentValue + 1;
        } else if (availableXP >= cost) {
            // Use XP when no attribute chips left
            this.currentCharacter.attributes[attrKey] = currentValue + 1;
            this.currentCharacter.currentXP -= cost;
        } else {
            // Can't afford it
            console.warn('Not enough points to increase attribute');
            return;
        }

        this.updateCharacterDisplay();
    }

    private decrementAttribute(attrName: string, cost: number): void {
        if (!this.currentCharacter) return;

        const attrKey = AttributeType[attrName as keyof typeof AttributeType];
        const currentValue = this.currentCharacter.attributes[attrKey];

        // Check attribute range minimum - prevent going below minimum
        if (currentValue - 1 < CHARACTER_CREATION_RULES.attributeMinimum) {
            console.warn('Cannot decrease attribute below minimum of', CHARACTER_CREATION_RULES.attributeMinimum);
            return;
        }

        // Current total is the sum of all attribute costs before this decrement
        const currentTotalCosts = this.calculateTotalAttributeCosts(this.currentCharacter.attributes);

        // Decrease the attribute
        this.currentCharacter.attributes[attrKey] = currentValue - 1;

        // Next total is the sum of all attribute costs after this decrement
        const nextTotalCosts = this.calculateTotalAttributeCosts(this.currentCharacter.attributes);

        // Points to restore is the cost of the attribute (1, 3, or 4 points)
        const decPointsToRestore = cost;

        // Max attribute chips for the rank
        const maxAttributeChipsForRank = this.getTotalChipsForRank(this.currentCharacter.rank);

        if (currentTotalCosts > maxAttributeChipsForRank) {
            // Some points need to go to XP, some are automatically available as attribute chips
            const slopOverAmount = Math.min(decPointsToRestore, currentTotalCosts - maxAttributeChipsForRank);

            // Restore the slop over portion to XP
            if (slopOverAmount > 0) {
                this.currentCharacter.currentXP += slopOverAmount;
            }

            // The non-slop portion is automatically available as attribute chips
            // since we calculate available chips as total chips - total costs
        } else {
            // All points automatically become available as attribute chips
            // since we calculate available chips as total chips - total costs
        }

        this.updateCharacterDisplay();
    }

    private getAvailableAttributeChips(): number {
        if (!this.currentCharacter) return 0;
        const totalChips = this.getTotalChipsForRank(this.currentCharacter.rank);
        const totalAttributeCosts = this.calculateTotalAttributeCosts(this.currentCharacter.attributes);
        // Show negatives as 0 because the excess points are automatically removed from XP anyway
        return Math.max(0, totalChips - totalAttributeCosts);
    }

    private getTotalXPForRank(rank: number): number {
        // Rank 1 has 10 XP, +10 for each additional rank
        return 10 + (rank - 1) * 10;
    }

    private getTotalChipsForRank(rank: number): number {
        // Rank 1 has 16 Attribute Chips, +1 for each additional rank
        return 16 + (rank - 1);
    }

    private getAttributeCost(attrType: AttributeType): number {
        const attributeCosts = {
            [AttributeType.DEX]: 4,
            [AttributeType.STR]: 3,
            [AttributeType.CON]: 1,
            [AttributeType.CHA]: 4,
            [AttributeType.WIS]: 3,
            [AttributeType.GRI]: 1,
            [AttributeType.INT]: 4,
            [AttributeType.PER]: 4
        };
        return attributeCosts[attrType];
    }

    private calculateTotalAttributeCosts(attributes: IAttributes): number {
        let totalCost = 0;
        Object.entries(attributes).forEach(([attrType, value]) => {
            const cost = this.getAttributeCost(attrType as AttributeType);
            totalCost += value * cost;
        });

        return totalCost;
    }

    private updateCharacterRank(newRank: number): void {
        if (!this.currentCharacter) return;

        const oldRank = this.currentCharacter.rank;
        this.currentCharacter.rank = newRank;

        // Update total XP based on rank
        const newTotalXP = this.getTotalXPForRank(newRank);
        const oldTotalXP = this.getTotalXPForRank(oldRank);

        // Adjust current XP by the difference in total XP
        this.currentCharacter.currentXP += (newTotalXP - oldTotalXP);
        this.currentCharacter.totalXP = newTotalXP;

        this.updateCharacterDisplay();
    }

    private updateCharacterDisplay(): void {
        if (!this.currentCharacter) return;

        // Update attribute values
        Object.entries(this.currentCharacter.attributes).forEach(([key, value]) => {
            const attrName = key.toUpperCase();
            const element = document.getElementById(`attr-${attrName}`);
            if (element) {
                element.textContent = value.toString();
            }
        });

        // Update resource displays
        const xpElement = document.getElementById('available-xp');
        if (xpElement) {
            xpElement.textContent = this.currentCharacter.currentXP.toString();
        }

        const chipsElement = document.getElementById('available-chips');
        if (chipsElement) {
            chipsElement.textContent = this.getAvailableAttributeChips().toString();
        }

        // Update labels with totals - find the labels by looking for the specific text patterns
        const allLabels = document.querySelectorAll('.core-stat-label');
        allLabels.forEach(label => {
            if (label.textContent?.includes('Available XP')) {
                label.textContent = `Available XP (${this.getTotalXPForRank(this.currentCharacter.rank)}):`;
            } else if (label.textContent?.includes('Attribute Chips')) {
                label.textContent = `Attribute Chips (${this.getTotalChipsForRank(this.currentCharacter.rank)}):`;
            }
        });

        // Update derived stats
        const dcElement = document.getElementById('damage-capacity');
        if (dcElement) {
            // Recalculate damage capacity based on CON (10 + CON per game rules)
            const newDC = 10 + this.currentCharacter.attributes[AttributeType.CON];
            this.currentCharacter.damageCapacity = newDC;
            dcElement.textContent = newDC.toString();
        }

        // Update button states based on attribute ranges and resource availability
        Object.entries(this.currentCharacter.attributes).forEach(([attrType, value]) => {
            const attrName = attrType.toUpperCase();
            const attrCost = this.getAttributeCost(attrType as AttributeType);

            const wouldBeBelowMin = (value - 1) < CHARACTER_CREATION_RULES.attributeMinimum;
            const isAtMaximum = value >= CHARACTER_CREATION_RULES.attributeMaximum;

            // Check if increment is possible (not at max AND have resources)
            const availableChips = this.getAvailableAttributeChips();
            const availableXP = this.currentCharacter.currentXP;
            const canAffordIncrement = (availableChips >= attrCost) || (availableXP >= attrCost);
            const canIncrement = !isAtMaximum && canAffordIncrement;

            // Find the buttons for this attribute
            const decBtn = document.querySelector(`[data-attribute="${attrName}"][data-action="dec"]`) as HTMLButtonElement;
            const incBtn = document.querySelector(`[data-attribute="${attrName}"][data-action="inc"]`) as HTMLButtonElement;

            if (decBtn) {
                decBtn.disabled = wouldBeBelowMin;
                decBtn.classList.toggle('disabled', wouldBeBelowMin);
            }

            if (incBtn) {
                incBtn.disabled = !canIncrement;
                incBtn.classList.toggle('disabled', !canIncrement);
            }
        });
    }

    private setupCharacterEditorEventListeners(): void {
        const nopeBtn = document.querySelector('#nope-btn');
        const yepBtn = document.querySelector('#yep-btn');
        const backBtn = document.querySelector('#back-to-characters-btn');

        // Attribute increment/decrement buttons
        const attrButtons = document.querySelectorAll('.attr-btn');
        attrButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                await globalAudioManager.playRandomGunshot();
                const target = e.target as HTMLElement;
                const action = target.dataset.action;
                const attribute = target.dataset.attribute;
                const cost = parseInt(target.dataset.cost || '1');

                if (action === 'inc') {
                    this.incrementAttribute(attribute!, cost);
                } else if (action === 'dec') {
                    this.decrementAttribute(attribute!, cost);
                }
            });
        });

        // Character name input
        const nameInput = document.querySelector('#character-name') as HTMLInputElement;
        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                if (this.currentCharacter) {
                    this.currentCharacter.name = (e.target as HTMLInputElement).value;
                }
            });
        }

        // Character description textarea
        const descInput = document.querySelector('#character-desc') as HTMLTextAreaElement;
        if (descInput) {
            descInput.addEventListener('input', (e) => {
                if (this.currentCharacter) {
                    this.currentCharacter.description = (e.target as HTMLTextAreaElement).value;
                }
            });
        }

        // Rank input
        const rankInput = document.querySelector('#character-rank-input') as HTMLInputElement;
        if (rankInput) {
            rankInput.addEventListener('blur', (e) => {
                if (this.currentCharacter) {
                    const newRank = parseInt((e.target as HTMLInputElement).value);
                    if (newRank >= 1 && newRank <= 15) {
                        this.updateCharacterRank(newRank);
                    } else {
                        // Reset to current rank if invalid
                        (e.target as HTMLInputElement).value = this.currentCharacter.rank.toString();
                    }
                }
            });
        }

        if (nopeBtn) {
            nopeBtn.addEventListener('click', async () => {
                await globalAudioManager.playRandomGunshot();
                console.log('Nope clicked - revert changes');
                // Revert changes: Reload character from storage
                if (this.currentCharacter) {
                    const originalCharacter = await this.characterStorage.getCharacter(this.currentCharacter.id);
                    if (originalCharacter) {
                        this.currentCharacter = { ...originalCharacter };
                        // Re-render the editor with reverted data
                        this.render();
                    }
                }
            });
        }

        if (yepBtn) {
            yepBtn.addEventListener('click', async () => {
                await globalAudioManager.playRandomGunshot();
                console.log('Yep clicked - save changes');
                // Save workflow per specifications
                if (this.currentCharacter) {
                    // Save current (edited) character to storage
                    await this.characterStorage.saveCharacter(this.currentCharacter);
                    console.log('Character saved successfully');
                }
                this.navigate('/characters', "Don't Go Hollow - Characters");
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', async () => {
                await globalAudioManager.playRandomGunshot();
                this.navigate('/characters', "Don't Go Hollow - Characters");
            });
        }
    }

    private selectAllText(element: HTMLElement): void {
        const selection = window.getSelection();
        const range = document.createRange();

        try {
            range.selectNodeContents(element);
            selection?.removeAllRanges();
            selection?.addRange(range);
        } catch (error) {
            console.warn('Failed to select text:', error);
        }
    }
}

// Styles
const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Rye&family=Sancreek&display=swap');

    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    body {
        font-family: 'Rye', 'Times New Roman', serif;
        background:
            radial-gradient(circle at center, rgba(255,248,220,0.1) 0%, transparent 50%),
            linear-gradient(45deg, #8b4513 0%, #deb887 25%, #f4a460 50%, #deb887 75%, #8b4513 100%);
        min-height: 100vh;
        color: #8B7355; /* medium-light brown as specified */
        overflow-x: hidden;
    }

    .splash-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 40px;
        text-align: center;
        position: relative;
    }

    .splash-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background:
            repeating-linear-gradient(
                90deg,
                transparent 0px,
                rgba(139,69,19,0.1) 1px,
                rgba(139,69,19,0.1) 2px,
                transparent 3px,
                transparent 20px
            ),
            repeating-linear-gradient(
                0deg,
                transparent 0px,
                rgba(139,69,19,0.05) 1px,
                rgba(139,69,19,0.05) 2px,
                transparent 3px,
                transparent 20px
            );
        pointer-events: none;
    }

    .splash-container::after {
        content: '';
        position: absolute;
        top: 10px;
        left: 10px;
        right: 10px;
        bottom: 10px;
        border: 8px solid #8b4513;
        border-image: repeating-linear-gradient(
            45deg,
            #8b4513,
            #8b4513 10px,
            #654321 10px,
            #654321 20px
        ) 8;
        pointer-events: none;
        box-shadow:
            inset 0 0 50px rgba(0,0,0,0.3),
            0 0 50px rgba(0,0,0,0.5);
    }

    .splash-title {
        font-family: 'Sancreek', 'Rye', serif;
        font-size: clamp(2.5rem, 8vw, 6rem);
        font-weight: 900;
        text-shadow:
            1px 1px 0px #000,
            2px 2px 0px #654321,
            3px 3px 0px #4a2c1a,
            4px 4px 0px #2d1810,
            5px 5px 0px #1a0f08,
            6px 6px 15px rgba(0,0,0,0.8);
        margin: 0 0 3rem 0;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        color: #8B7355; /* medium-light brown */
        text-stroke: 3px #000;
        -webkit-text-stroke: 3px #000;
        transform: perspective(300px) rotateX(-8deg) scaleY(1.2);
        filter:
            drop-shadow(0 0 20px rgba(139, 115, 85, 0.8))
            drop-shadow(0 0 40px rgba(139, 115, 85, 0.4));
        z-index: 10;
        position: relative;
        animation: flicker 3s ease-in-out infinite alternate;
    }

    .hollow-word {
        font-family: 'Sancreek', 'Rye', serif;
        color: #004a00;
        background: linear-gradient(45deg, #008000, #228b22, #32cd32, #00ff00);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow:
            2px 2px 0px #000,
            3px 3px 0px #003300,
            4px 4px 0px #001a00,
            5px 5px 0px #000d00,
            6px 6px 20px rgba(0, 255, 0, 0.8);
        filter:
            drop-shadow(0 0 30px rgba(0, 255, 0, 0.9))
            drop-shadow(0 0 60px rgba(34, 139, 34, 0.6));
        animation: spookyGreenGlow 2s ease-in-out infinite alternate;
    }

    @keyframes spookyGreenGlow {
        0%, 100% {
            filter:
                drop-shadow(0 0 30px rgba(0, 255, 0, 0.9))
                drop-shadow(0 0 60px rgba(34, 139, 34, 0.6));
        }
        50% {
            filter:
                drop-shadow(0 0 40px rgba(0, 255, 0, 1))
                drop-shadow(0 0 80px rgba(34, 139, 34, 0.8));
        }
    }

    @keyframes flicker {
        0%, 100% {
            filter:
                drop-shadow(0 0 20px rgba(139, 115, 85, 0.8))
                drop-shadow(0 0 40px rgba(139, 115, 85, 0.4));
        }
        50% {
            filter:
                drop-shadow(0 0 30px rgba(139, 115, 85, 1))
                drop-shadow(0 0 60px rgba(139, 115, 85, 0.6));
        }
    }

    .splash-peer-id {
        font-size: 1rem;
        background: linear-gradient(45deg, rgba(222,184,135,0.9), rgba(244,164,96,0.9));
        padding: 12px 20px;
        border: 3px solid #8b4513;
        border-radius: 0;
        font-family: 'Courier New', monospace;
        word-break: break-all;
        max-width: 70%;
        color: #8B7355; /* medium-light brown */
        font-weight: bold;
        text-shadow: 1px 1px 0px rgba(255,255,255,0.5);
        box-shadow:
            inset 0 0 10px rgba(139,69,19,0.3),
            3px 3px 0px #654321,
            6px 6px 10px rgba(0,0,0,0.5);
        transform: perspective(200px) rotateX(5deg);
        transition: all 0.3s ease;
        position: relative;
        z-index: 10;
        cursor: pointer;
        user-select: text;
        margin-bottom: 3rem;
    }

    .splash-peer-id::before {
        content: '★ OUTLAW CODE ★';
        position: absolute;
        top: -25px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 0.8rem;
        color: #8b4513;
        font-weight: bold;
        text-shadow: 1px 1px 0px rgba(255,248,220,0.8);
    }

    .splash-peer-id:hover {
        background: linear-gradient(45deg, rgba(255,248,220,0.95), rgba(222,184,135,0.95));
        border-color: #654321;
        transform: perspective(200px) rotateX(5deg) scale(1.02);
    }

    .splash-buttons {
        display: flex;
        gap: 2rem;
        justify-content: center;
        z-index: 10;
        position: relative;
        flex-wrap: wrap;
    }

    .splash-button {
        font-family: 'Rye', 'Impact', 'Arial Black', sans-serif;
        font-size: 1.4rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 15px 30px;
        border: 4px solid #654321;
        background:
            linear-gradient(45deg, #deb887, #f4a460, #daa520, #deb887),
            radial-gradient(circle at center, rgba(255,248,220,0.3), transparent);
        color: #8B7355; /* medium-light brown */
        text-shadow:
            1px 1px 0px rgba(255,255,255,0.8),
            2px 2px 0px rgba(139,69,19,0.3);
        box-shadow:
            inset 0 0 15px rgba(255,248,220,0.5),
            3px 3px 0px #654321,
            6px 6px 0px #4a2c1a,
            8px 8px 15px rgba(0,0,0,0.4);
        border-radius: 0;
        cursor: pointer;
        transition: all 0.2s ease;
        transform: perspective(150px) rotateX(-5deg);
        position: relative;
        overflow: hidden;
    }

    .splash-button.secondary {
        background:
            linear-gradient(45deg, #696969, #808080),
            radial-gradient(circle at center, rgba(255,248,220,0.3), transparent);
        color: white;
        border-color: #2f4f4f;
    }

    .splash-button::before {
        content: '';
        position: absolute;
        top: 5px;
        left: 5px;
        right: 5px;
        bottom: 5px;
        border: 2px solid rgba(139,69,19,0.3);
        pointer-events: none;
    }

    .splash-button::after {
        content: '★';
        position: absolute;
        top: 2px;
        right: 8px;
        font-size: 0.8rem;
        color: #8b4513;
        opacity: 0.7;
    }

    .splash-button:hover {
        background:
            linear-gradient(45deg, #f4a460, #ffd700, #ffb347, #f4a460),
            radial-gradient(circle at center, rgba(255,248,220,0.5), transparent);
        box-shadow:
            inset 0 0 20px rgba(255,248,220,0.7),
            3px 3px 0px #654321,
            6px 6px 0px #4a2c1a,
            10px 10px 20px rgba(0,0,0,0.5),
            0 0 25px rgba(255,215,0,0.4);
        transform: perspective(150px) rotateX(-5deg) translateY(-2px);
    }

    .splash-button.secondary:hover {
        background:
            linear-gradient(45deg, #808080, #a9a9a9),
            radial-gradient(circle at center, rgba(255,248,220,0.5), transparent);
    }

    .splash-button:active {
        transform: perspective(150px) rotateX(-5deg) translateY(1px);
    }

    .character-manager-container {
        min-height: 100vh;
        padding: 40px;
        color: #8B7355; /* medium-light brown */
        position: relative;
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

    .character-manager-content {
        position: relative;
        z-index: 10;
        margin-bottom: 40px;
    }

    .empty-state {
        text-align: center;
        padding: 60px 20px;
        background: rgba(255,248,220,0.7);
        border: 2px dashed #cd853f;
        border-radius: 8px;
    }

    .empty-state h2 {
        color: #8b4513;
        font-size: 1.5rem;
        margin: 0 0 20px 0;
    }

    .empty-state p {
        color: #8B7355; /* medium-light brown */
        margin: 0 0 30px 0;
        font-size: 1.1rem;
    }

    .character-manager-actions {
        text-align: center;
        position: relative;
        z-index: 10;
    }

    /* Character List Styling */
    .character-list {
        margin-bottom: 40px;
    }

    .character-item {
        display: flex;
        align-items: stretch;
        background: rgba(255,248,220,0.9);
        border: 3px solid #cd853f;
        border-radius: 8px;
        margin-bottom: 15px;
        transition: all 0.3s ease;
        cursor: pointer;
        box-shadow: 0 0 15px rgba(0,0,0,0.2);
    }

    .character-item:hover {
        background: rgba(255,248,220,1);
        border-color: #8b4513;
        transform: translateY(-2px);
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
    }

    .character-info {
        flex: 1;
        padding: 20px;
    }

    .character-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 15px;
        align-items: flex-end;
    }

    .character-stats span {
        background: rgba(139,69,19,0.1);
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #cd853f;
        font-size: 0.85rem;
        font-weight: bold;
        color: #654321;
    }

    .character-name {
        font-family: 'Sancreek', serif !important;
        color: #8b4513 !important;
        font-size: 1.1rem !important;
        background: rgba(222,184,135,0.7) !important;
        border: 2px solid #8b4513 !important;
        text-shadow: 1px 1px 0px rgba(0,0,0,0.3) !important;
        padding: 6px 12px !important;
        align-self: flex-start;
    }

    .character-stats span:not(.character-name) {
        align-self: flex-end;
    }

    .character-desc {
        color: #654321;
        font-style: italic;
        margin: 0;
        font-size: 0.9rem;
    }

    .character-actions {
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

    .character-attributes-by-category {
        margin: 15px 0;
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .attr-category-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }

    .category-label {
        font-family: 'Rye', serif;
        font-weight: bold;
        color: #8b4513;
        font-size: 0.85rem;
        min-width: 60px;
        text-transform: uppercase;
    }

    .attr-category-group span:not(.category-label) {
        background: rgba(139,69,19,0.1);
        padding: 3px 8px;
        border-radius: 4px;
        border: 1px solid rgba(139,69,19,0.3);
        font-size: 0.8rem;
        font-weight: bold;
        color: #654321;
    }

    .character-attributes {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin: 10px 0;
        font-size: 0.85rem;
    }

    .character-attributes span {
        background: rgba(139,69,19,0.1);
        padding: 2px 6px;
        border-radius: 3px;
        border: 1px solid rgba(139,69,19,0.3);
        text-align: center;
        font-weight: bold;
    }

    .hollow-influence.warning {
        color: #ff4500 !important;
        font-weight: bold;
    }

    /* Character Editor Styles */
    .character-editor-container {
        min-height: 100vh;
        padding: 40px;
        color: #8B7355; /* medium-light brown */
        position: relative;
    }

    .character-editor-header {
        text-align: center;
        margin-bottom: 40px;
        padding: 20px;
        background: rgba(222,184,135,0.9);
        border: 3px solid #8b4513;
        border-radius: 8px;
        position: relative;
        z-index: 10;
    }

    .character-editor-header h1 {
        font-family: 'Sancreek', serif;
        font-size: 2.5rem;
        color: #8b4513;
        margin: 0 0 10px 0;
        text-shadow:
            2px 2px 0px #000,
            3px 3px 0px #654321;
    }

    .character-editor-content {
        position: relative;
        z-index: 10;
        margin-bottom: 40px;
    }

    .character-sheet-wrapper {
        background: rgba(255,248,220,0.9);
        border: 3px solid #8b4513;
        border-radius: 8px;
        padding: 30px;
        margin: 0 auto;
        max-width: 800px;
    }

    .character-preview h2 {
        font-family: 'Sancreek', serif;
        color: #8b4513;
        font-size: 2rem;
        margin: 0 0 20px 0;
        text-align: center;
    }

    .character-preview h3 {
        font-family: 'Rye', serif;
        color: #654321;
        font-size: 1.3rem;
        margin: 20px 0 10px 0;
        border-bottom: 2px solid #cd853f;
        padding-bottom: 5px;
    }

    .attributes-grid-preview {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        margin: 15px 0;
    }

    .attributes-grid-preview span {
        background: rgba(222,184,135,0.5);
        padding: 8px 12px;
        border: 2px solid #cd853f;
        border-radius: 4px;
        text-align: center;
        font-weight: bold;
        color: #654321;
    }

    .hollow-preview {
        margin: 20px 0;
    }

    .hollow-preview p.warning {
        color: #ff4500;
        font-weight: bold;
    }

    .character-desc-preview {
        font-style: italic;
        color: #654321;
        margin: 20px 0;
        padding: 15px;
        background: rgba(139,69,19,0.1);
        border-left: 4px solid #cd853f;
        border-radius: 4px;
    }

    .character-editor-actions {
        text-align: center;
        display: flex;
        justify-content: center;
        gap: 20px;
        position: relative;
        z-index: 10;
    }

    .integration-note {
        text-align: center;
        background: rgba(139,69,19,0.05);
        border: 1px dashed #cd853f;
        border-radius: 4px;
        padding: 15px;
    }

    /* Character Editor Styles */
    .character-editor-form {
        max-width: 800px;
        margin: 0 auto;
    }

    .character-name-section,
    .character-desc-section {
        margin: 20px 0;
    }

    .character-core-stats {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin: 25px 0;
        padding: 15px;
        background: rgba(139,69,19,0.08);
        border: 2px solid #cd853f;
        border-radius: 8px;
    }

    .core-stat-item {
        text-align: center;
    }

    .core-stat-label {
        display: block;
        font-family: 'Rye', serif;
        font-weight: bold;
        color: #8b4513;
        font-size: 0.9rem;
        margin-bottom: 5px;
    }

    .core-stat-item span:last-child,
    .core-stat-item input[type="number"] {
        display: block;
        font-size: 1.3rem;
        font-weight: bold;
        color: #654321;
        background: rgba(255,248,220,0.9);
        padding: 6px 14px;
        border: 2px solid #cd853f;
        border-radius: 4px;
        min-width: 50px;
        text-align: center;
        font-family: 'Rye', serif;
    }

    .core-stat-item input[type="number"] {
        transition: all 0.2s ease;
        width: 70px;
    }

    .core-stat-item input[type="number"]:focus {
        outline: none;
        border-color: #8b4513;
        background: rgba(255,248,220,1);
        box-shadow: 0 0 8px rgba(139,69,19,0.3);
    }

    .core-stat-item input[type="number"]::-webkit-outer-spin-button,
    .core-stat-item input[type="number"]::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }

    .core-stat-item input[type="number"] {
        -moz-appearance: textfield;
    }

    .character-name-section label,
    .character-desc-section label {
        display: block;
        font-family: 'Rye', serif;
        font-weight: bold;
        color: #8b4513;
        margin-bottom: 8px;
        font-size: 1.1rem;
    }

    .character-name-section input,
    .character-desc-section textarea {
        width: 100%;
        padding: 12px;
        border: 3px solid #cd853f;
        background: rgba(255,248,220,0.9);
        font-family: 'Rye', serif;
        font-size: 1rem;
        color: #654321;
        border-radius: 4px;
        transition: all 0.2s ease;
    }

    .character-name-section input:focus,
    .character-desc-section textarea:focus {
        outline: none;
        border-color: #8b4513;
        background: rgba(255,248,220,1);
        box-shadow: 0 0 10px rgba(139,69,19,0.3);
    }

    .character-resources {
        display: flex;
        justify-content: center;
        gap: 40px;
        margin: 30px 0;
        padding: 20px;
        background: rgba(139,69,19,0.1);
        border: 2px solid #cd853f;
        border-radius: 8px;
    }

    .resource-display {
        text-align: center;
    }

    .resource-label {
        display: block;
        font-family: 'Rye', serif;
        font-weight: bold;
        color: #8b4513;
        font-size: 1rem;
        margin-bottom: 5px;
    }

    .resource-display span:last-child {
        display: block;
        font-size: 1.5rem;
        font-weight: bold;
        color: #654321;
        background: rgba(255,248,220,0.8);
        padding: 8px 16px;
        border: 2px solid #cd853f;
        border-radius: 4px;
        min-width: 60px;
    }

    .attributes-editor {
        margin: 30px 0;
    }

    .attributes-editor h3 {
        font-family: 'Sancreek', serif;
        color: #8b4513;
        font-size: 1.5rem;
        text-align: center;
        margin-bottom: 20px;
        text-shadow: 1px 1px 0px rgba(0,0,0,0.5);
    }

    .attribute-category {
        margin: 25px 0;
    }

    .attribute-category h4 {
        font-family: 'Sancreek', serif;
        color: #8b4513;
        font-size: 1.2rem;
        text-align: center;
        margin-bottom: 15px;
        text-shadow: 1px 1px 0px rgba(0,0,0,0.3);
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }

    .attribute-category-row {
        display: flex;
        justify-content: center;
        gap: 15px;
        flex-wrap: wrap;
    }

    .attributes-grid-editor {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        max-width: 600px;
        margin: 0 auto;
    }

    .attribute-editor-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: rgba(255,248,220,0.9);
        border: 2px solid #cd853f;
        border-radius: 6px;
        padding: 12px 16px;
        transition: all 0.2s ease;
    }

    .attribute-editor-row:hover {
        background: rgba(255,248,220,1);
        border-color: #8b4513;
        transform: translateY(-1px);
        box-shadow: 0 3px 8px rgba(0,0,0,0.2);
    }

    .attribute-info {
        display: flex;
        align-items: baseline;
        gap: 8px;
    }

    .attribute-name {
        font-family: 'Rye', serif;
        font-weight: bold;
        font-size: 1rem;
        color: #8b4513;
    }

    .attribute-cost {
        font-size: 0.85rem;
        color: #654321;
        font-style: italic;
    }

    .attribute-controls {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .attr-btn {
        width: 32px;
        height: 32px;
        border: 2px solid #8b4513;
        background: linear-gradient(45deg, #deb887, #f4a460);
        color: #654321;
        font-size: 1.2rem;
        font-weight: bold;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .attr-btn:hover {
        background: linear-gradient(45deg, #f4a460, #ffd700);
        transform: scale(1.1);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    .attr-btn:active {
        transform: scale(0.95);
    }

    .attr-btn.disabled,
    .attr-btn:disabled {
        background: linear-gradient(45deg, #999, #bbb);
        color: #666;
        cursor: not-allowed;
        opacity: 0.6;
        transform: none;
    }

    .attr-btn.disabled:hover,
    .attr-btn:disabled:hover {
        background: linear-gradient(45deg, #999, #bbb);
        transform: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }

    .attribute-value {
        font-family: 'Rye', serif;
        font-weight: bold;
        font-size: 1.2rem;
        color: #654321;
        min-width: 30px;
        text-align: center;
        background: rgba(139,69,19,0.1);
        padding: 6px 10px;
        border: 1px solid #cd853f;
        border-radius: 3px;
    }

    .character-stats-display {
        margin: 30px 0;
        padding: 20px;
        background: rgba(139,69,19,0.05);
        border: 2px dashed #cd853f;
        border-radius: 8px;
    }

    .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 10px 0;
        padding: 8px 16px;
        background: rgba(255,248,220,0.7);
        border: 1px solid #cd853f;
        border-radius: 4px;
    }

    .stat-label {
        font-family: 'Rye', serif;
        font-weight: bold;
        color: #8b4513;
    }

    .stat-row span:last-child {
        font-weight: bold;
        color: #654321;
        background: rgba(255,248,220,0.9);
        padding: 4px 12px;
        border: 1px solid #cd853f;
        border-radius: 3px;
    }

    @media (max-width: 768px) {
        .attributes-grid-editor {
            grid-template-columns: 1fr;
        }

        .attribute-category-row {
            flex-direction: column;
            align-items: center;
        }

        .character-core-stats {
            flex-direction: column;
            gap: 15px;
        }

        .character-resources {
            flex-direction: column;
            gap: 20px;
        }

        .attribute-editor-row {
            flex-direction: column;
            gap: 10px;
            text-align: center;
            max-width: 280px;
        }

        .attribute-controls {
            justify-content: center;
        }

        .character-item {
            flex-direction: column;
        }

        .character-actions {
            border-left: none;
            border-top: 2px solid #cd853f;
            justify-content: center;
        }
    }

    /* Music Toggle Button - Lower Right Position */
    .music-toggle-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 3px solid #654321;
        background:
            radial-gradient(circle, #deb887, #b8860b),
            radial-gradient(circle at 30% 30%, rgba(255,248,220,0.8), transparent);
        font-size: 1.8rem;
        color: #2d1810;
        cursor: pointer;
        box-shadow:
            inset 0 0 10px rgba(255,248,220,0.5),
            3px 3px 0px #654321,
            6px 6px 10px rgba(0,0,0,0.4);
        transition: all 0.2s ease;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        text-shadow: 1px 1px 0px rgba(0,0,0,0.5);
    }

    .music-toggle-button:hover {
        background:
            radial-gradient(circle, #ffd700, #daa520),
            radial-gradient(circle at 30% 30%, rgba(255,248,220,0.9), transparent);
        box-shadow:
            inset 0 0 15px rgba(255,248,220,0.7),
            3px 3px 0px #654321,
            8px 8px 15px rgba(0,0,0,0.5),
            0 0 20px rgba(255,215,0,0.4);
        transform: scale(1.05);
    }

    .music-toggle-button:active {
        transform: scale(0.95);
        box-shadow:
            inset 0 0 15px rgba(139,69,19,0.3),
            2px 2px 0px #654321,
            4px 4px 8px rgba(0,0,0,0.6);
    }

    @media (max-width: 768px) {
        .splash-buttons {
            flex-direction: column;
            align-items: center;
        }

        .splash-button {
            min-width: 250px;
        }

        .character-attributes {
            grid-template-columns: repeat(4, 1fr);
        }

        .attributes-grid-preview {
            grid-template-columns: repeat(2, 1fr);
        }

        .character-editor-actions {
            flex-direction: column;
            align-items: center;
        }
    }
`;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    // Add styles
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);

    // Initialize router
    const router = new SimpleRouter();
    router.render();

    console.log('App initialized with URL routing');
});