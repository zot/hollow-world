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
    ICompanion
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
            dust: 0,
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
            totalXP: 0,
            currentXP: 0,
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

    private removeGunshot(audio: HTMLAudioElement): void {
        const index = this.activeGunshots.indexOf(audio);
        if (index > -1) {
            this.activeGunshots.splice(index, 1);
        }
    }
}

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
                                            <h3>${char.name}</h3>
                                            <div class="character-stats">
                                                <span class="rank">Rank ${char.rank}</span>
                                                <span class="xp">${char.currentXP}/${char.totalXP} XP</span>
                                                <span class="damage-cap">DC: ${char.damageCapacity}</span>
                                                <span class="dust">Dust: ${char.hollow.dust}</span>
                                                ${char.hollow.hollowInfluence > 0 ? `<span class="hollow-influence warning">Hollow: -${char.hollow.hollowInfluence}</span>` : ''}
                                            </div>
                                            <div class="character-attributes">
                                                <span>DEX: ${char.attributes[AttributeType.DEX]}</span>
                                                <span>STR: ${char.attributes[AttributeType.STR]}</span>
                                                <span>CON: ${char.attributes[AttributeType.CON]}</span>
                                                <span>CHA: ${char.attributes[AttributeType.CHA]}</span>
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

        const audioManager = new SimpleAudioManager();

        if (joinBtn) {
            joinBtn.addEventListener('click', async () => {
                await audioManager.playRandomGunshot();
                console.log('Join Game clicked');
                // TODO: Implement join game functionality
            });
        }

        if (startBtn) {
            startBtn.addEventListener('click', async () => {
                await audioManager.playRandomGunshot();
                console.log('Start Game clicked');
                // TODO: Implement start game functionality
            });
        }

        if (charactersBtn) {
            charactersBtn.addEventListener('click', async () => {
                await audioManager.playRandomGunshot();
                this.navigate('/characters', "Don't Go Hollow - Characters");
            });
        }

        if (peerIdDisplay) {
            peerIdDisplay.addEventListener('click', () => {
                this.selectAllText(peerIdDisplay);
            });
        }
    }

    private setupCharacterManagerEventListeners(): void {
        const backBtn = document.getElementById('back-to-menu-btn');
        const addBtn = document.getElementById('add-character-btn');
        const deleteButtons = document.querySelectorAll('.delete-btn');
        const characterItems = document.querySelectorAll('.character-item');

        const audioManager = new SimpleAudioManager();

        if (backBtn) {
            backBtn.addEventListener('click', async () => {
                await audioManager.playRandomGunshot();
                this.navigate('/', "Don't Go Hollow");
            });
        }

        if (addBtn) {
            addBtn.addEventListener('click', async () => {
                await audioManager.playRandomGunshot();
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

                await audioManager.playRandomGunshot();
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

                await audioManager.playRandomGunshot();

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
                        const audioManager = new SimpleAudioManager();
                        await audioManager.playRandomGunshot();
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
                            <!-- CharacterSheet component will be rendered here -->
                            <div class="character-preview">
                                <h2>${character.name}</h2>
                                <p><strong>Rank:</strong> ${character.rank}</p>
                                <p><strong>XP:</strong> ${character.currentXP}/${character.totalXP}</p>
                                <p><strong>Damage Capacity:</strong> ${character.damageCapacity}</p>

                                <div class="attributes-preview">
                                    <h3>Attributes</h3>
                                    <div class="attributes-grid-preview">
                                        <span>DEX: ${character.attributes[AttributeType.DEX]}</span>
                                        <span>STR: ${character.attributes[AttributeType.STR]}</span>
                                        <span>CON: ${character.attributes[AttributeType.CON]}</span>
                                        <span>CHA: ${character.attributes[AttributeType.CHA]}</span>
                                        <span>WIS: ${character.attributes[AttributeType.WIS]}</span>
                                        <span>GRI: ${character.attributes[AttributeType.GRI]}</span>
                                        <span>INT: ${character.attributes[AttributeType.INT]}</span>
                                        <span>PER: ${character.attributes[AttributeType.PER]}</span>
                                    </div>
                                </div>

                                <div class="hollow-preview">
                                    <h3>Hollow Status</h3>
                                    <p>Dust: ${character.hollow.dust}</p>
                                    <p>Burned: ${character.hollow.burned}</p>
                                    ${character.hollow.hollowInfluence > 0 ? `<p class="warning">Hollow Influence: -${character.hollow.hollowInfluence}</p>` : ''}
                                </div>

                                <p class="character-desc-preview">${character.description}</p>

                                <p class="integration-note" style="color: #666; font-style: italic; margin-top: 20px;">
                                    Full character sheet integration coming next...
                                </p>
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
                    const audioManager = new SimpleAudioManager();
                    await audioManager.playRandomGunshot();
                    this.navigate('/characters', "Don't Go Hollow - Characters");
                });
            }
        }
    }

    private setupCharacterEditorEventListeners(): void {
        const nopeBtn = document.querySelector('#nope-btn');
        const yepBtn = document.querySelector('#yep-btn');
        const backBtn = document.querySelector('#back-to-characters-btn');

        const audioManager = new SimpleAudioManager();

        if (nopeBtn) {
            nopeBtn.addEventListener('click', async () => {
                await audioManager.playRandomGunshot();
                console.log('Nope clicked - revert changes');
                // TODO: Implement revert functionality
                this.navigate('/characters', "Don't Go Hollow - Characters");
            });
        }

        if (yepBtn) {
            yepBtn.addEventListener('click', async () => {
                await audioManager.playRandomGunshot();
                console.log('Yep clicked - save changes');
                // TODO: Implement save functionality
                this.navigate('/characters', "Don't Go Hollow - Characters");
            });
        }

        if (backBtn) {
            backBtn.addEventListener('click', async () => {
                await audioManager.playRandomGunshot();
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

    @media (max-width: 768px) {
        .splash-buttons {
            flex-direction: column;
            align-items: center;
        }

        .splash-button {
            min-width: 250px;
        }

        .character-attributes {
            grid-template-columns: repeat(2, 1fr);
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