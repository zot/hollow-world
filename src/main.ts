console.log('Main.ts starting to load...');

// Set Base URL as specified in specs/ui.splash.md
const Base = new URL(location.toString());
console.log('Base URL set to:', Base);

import { SplashScreen } from './ui/SplashScreen.js';
import { CharacterManagerView } from './ui/CharacterManagerView.js';
import { CharacterEditorView } from './ui/CharacterEditorView.js';
import { LibP2PNetworkProvider } from './p2p.js';
import { AudioManager } from './audio/AudioManager.js';
import { router } from './utils/Router.js';
import { characterStorageService } from './services/CharacterStorageService.js';
import { ICharacter } from './character/types.js';

console.log('All imports loaded successfully');

// Global app state
let networkProvider: LibP2PNetworkProvider;
let audioManager: AudioManager | undefined;
let splashScreen: SplashScreen;
let characterManager: CharacterManagerView;
let characterEditor: CharacterEditorView;
let appContainer: HTMLElement;

// Current view components
let currentView: 'splash' | 'characters' | 'editor' | 'game' = 'splash';

async function createApp(): Promise<void> {
    console.log('createApp called');

    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found');
        return;
    }

    console.log('App container found');
    appContainer = app;

    // Initialize enhanced audio manager FIRST - as early as possible per CLAUDE.md
    try {
        console.log('🎶 Initializing audio system as early as possible...');
        console.log('🎶 AudioManager class available:', typeof AudioManager);

        // List of all available background music tracks for cycling
        const musicTracks = [
            new URL('src/assets/audio/western-adventure-cinematic-spaghetti-loop-385618.mp3', Base).toString(),
            new URL('src/assets/audio/cinematic-spaghetti-western-music-tales-from-the-west-207360.mp3', Base).toString(),
            new URL('src/assets/audio/picker_s-grove-folk.mp3', Base).toString(),
            new URL('src/assets/audio/picker_s-grove-shanty.mp3', Base).toString(),
            new URL('src/assets/audio/picker_s-grove-western.mp3', Base).toString(),
            new URL('src/assets/audio/picker_s-grove-western-ballad.mp3', Base).toString(),
            new URL('src/assets/audio/mining-incident-waltz-hoedown.mp3', Base).toString(),
            new URL('src/assets/audio/mining-incident-waltz-polka.mp3', Base).toString()
        ];

        console.log('🎶 Creating AudioManager with', musicTracks.length, 'tracks');
        audioManager = new AudioManager(
            musicTracks,
            new URL('src/assets/audio/single-gunshot-54-40780.mp3', Base).toString()
        );
        console.log('🎶 AudioManager created:', !!audioManager);

        console.log('🎶 Starting AudioManager initialization...');
        await audioManager.initialize();
        console.log('🎶 AudioManager initialization completed successfully');

        console.log('🎶 Enhanced audio system initialized successfully');
    } catch (error) {
        console.error('🚨 Audio system failed to initialize:', error);
        console.error('🚨 Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        audioManager = undefined;
    }

    try {
        // Initialize network provider after audio system
        networkProvider = new LibP2PNetworkProvider();

        // Initialize views
        console.log('🎵 main.ts audioManager debug before SplashScreen creation:');
        console.log('  - audioManager exists:', !!audioManager);
        console.log('  - audioManager type:', typeof audioManager);
        console.log('  - audioManager:', audioManager);

        splashScreen = new SplashScreen(networkProvider, undefined, audioManager);
        await splashScreen.initialize();

        characterManager = new CharacterManagerView(undefined, audioManager);
        characterEditor = new CharacterEditorView(undefined, audioManager);

        // Set up route-based navigation
        setupRoutes();
        setupComponentCallbacks();

        // Initialize router
        router.initialize();

        // Start background music after splash screen is initialized
        if (audioManager) {
            try {
                await audioManager.playBackgroundMusic();
                const trackInfo = audioManager.getCurrentTrackInfo();
                console.log('🎵 Background music started with cycling enabled');
                if (trackInfo) {
                    console.log(`🎵 Now playing track ${trackInfo.index + 1}/${trackInfo.total}: ${trackInfo.name}`);
                    console.log(`🔄 Music cycling: ${audioManager.isCyclingEnabled() ? 'ON' : 'OFF'}`);
                }
                
                // Wait a brief moment for audio state to settle, then update button
                setTimeout(() => {
                    splashScreen.refreshMusicButtonState();
                    console.log('🎵 Button state refreshed, isPlaying:', audioManager!.isMusicPlaying());
                }, 100);
            } catch (musicError) {
                console.warn('Failed to start background music (user interaction may be required):', musicError);
            }
        }

        console.log('HollowWorld application initialized successfully');
        console.log('App should now be visible');
    } catch (error) {
        console.error('Failed to initialize HollowWorld:', error);
        app.innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                <h1>Error</h1>
                <p>Failed to initialize HollowWorld: ${error}</p>
            </div>
        `;
    }
}

function setupRoutes(): void {
    // Add route definitions
    router.addRoute({
        path: '/',
        title: "Don't Go Hollow",
        handler: () => renderSplashScreen()
    });

    router.addRoute({
        path: '/characters',
        title: "Don't Go Hollow - Characters",
        handler: () => renderCharacterManager()
    });

    router.addRoute({
        path: '/character/:id',
        title: "Don't Go Hollow - Edit Character",
        handler: (params) => renderCharacterEditor(params?.id || '')
    });

    router.addRoute({
        path: '/game',
        title: "Don't Go Hollow - Game",
        handler: () => renderGameView()
    });
}

function setupComponentCallbacks(): void {
    // Splash screen callbacks
    splashScreen.onJoinGame = () => {
        console.log('Join Game clicked - placeholder functionality');
        // TODO: Implement join game functionality
    };

    splashScreen.onStartGame = () => {
        console.log('Start Game clicked - placeholder functionality');
        // TODO: Implement start game functionality
    };

    splashScreen.onCharacters = () => {
        router.navigate('/characters');
    };

    // Character manager callbacks (list only)
    characterManager.onBackToMenu = () => {
        router.navigate('/');
    };

    characterManager.onCharacterSelected = (character: ICharacter) => {
        router.navigate(`/character/${character.id}`);
    };

    characterManager.onNewCharacterCreated = (character: ICharacter) => {
        console.log('New character created:', character);
        router.navigate(`/character/${character.id}`);
    };

    // Character editor callbacks
    characterEditor.onBackToCharacters = () => {
        router.navigate('/characters');
    };

    characterEditor.onCharacterSaved = async (character: ICharacter) => {
        console.log('Character saved:', character);
        try {
            await characterStorageService.saveCharacter(character);
            router.navigate('/characters');
        } catch (error) {
            console.error('Failed to save character:', error);
        }
    };
}

async function renderSplashScreen(): Promise<void> {
    currentView = 'splash';
    await splashScreen.render(appContainer);
}

async function renderCharacterManager(): Promise<void> {
    currentView = 'characters';
    characterManager.render(appContainer);
}

async function renderCharacterEditor(characterId: string): Promise<void> {
    currentView = 'editor';

    try {
        const character = await characterStorageService.getCharacter(characterId);
        if (character) {
            characterEditor.setCharacter(character);
            characterEditor.render(appContainer);
        } else {
            console.error('Character not found:', characterId);
            router.navigate('/characters'); // Redirect to character list
        }
    } catch (error) {
        console.error('Failed to load character for editing:', error);
        router.navigate('/characters'); // Redirect to character list on error
    }
}

async function renderGameView(): Promise<void> {
    currentView = 'game';

    try {
        const { templateEngine } = await import('./utils/TemplateEngine.js');
        const gameHtml = await templateEngine.renderTemplateFromFile('game-view', {});
        appContainer.innerHTML = gameHtml;

        // Setup back button
        const backBtn = appContainer.querySelector('#back-to-menu-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                router.navigate('/');
            });
        }
    } catch (error) {
        console.error('Failed to render game view:', error);
        appContainer.innerHTML = '<div><h1>Game View</h1><p>Failed to load template</p></div>';
    }
}

// Cleanup function for when the page is unloaded
function cleanup(): void {
    if (router) {
        router.destroy();
    }
    if (splashScreen) {
        splashScreen.destroy();
    }
    if (characterManager) {
        characterManager.destroy();
    }
    if (characterEditor) {
        characterEditor.destroy();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', createApp);
window.addEventListener('beforeunload', cleanup);