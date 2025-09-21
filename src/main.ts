console.log('Main.ts starting to load...');

import { SplashScreen } from './ui/SplashScreen.js';
import { CharacterManagerView } from './ui/CharacterManagerView.js';
import { LibP2PNetworkProvider } from './p2p.js';
import { AudioManager } from './audio/AudioManager.js';
import { router } from './utils/Router.js';

console.log('All imports loaded successfully');

// Global app state
let networkProvider: LibP2PNetworkProvider;
let audioManager: AudioManager | undefined;
let splashScreen: SplashScreen;
let characterManager: CharacterManagerView;
let appContainer: HTMLElement;

// Current view components
let currentView: 'splash' | 'characters' | 'game' = 'splash';

async function createApp(): Promise<void> {
    console.log('createApp called');

    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found');
        return;
    }

    console.log('App container found');
    appContainer = app;

    try {
        networkProvider = new LibP2PNetworkProvider();

        // Initialize audio manager (gracefully handle missing audio files)
        try {
            audioManager = new AudioManager(
                './src/assets/audio/western-adventure-cinematic-spaghetti-loop-385618.mp3',
                './src/assets/audio/single-gunshot-54-40780.mp3'
            );
            await audioManager.initialize();

            // Start background music automatically
            try {
                await audioManager.playBackgroundMusic();
                console.log('Background music started');
            } catch (musicError) {
                console.warn('Failed to start background music (user interaction may be required):', musicError);
            }

            console.log('Audio system initialized successfully');
        } catch (error) {
            console.warn('Audio system failed to initialize, continuing without audio:', error);
            audioManager = undefined;
        }

        // Initialize views
        splashScreen = new SplashScreen(networkProvider, undefined, audioManager);
        await splashScreen.initialize();

        characterManager = new CharacterManagerView();

        // Set up route-based navigation
        setupRoutes();
        setupComponentCallbacks();

        // Initialize router
        router.initialize();

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

    characterManager.onBackToMenu = () => {
        router.navigate('/');
    };

    characterManager.onBackToCharacters = () => {
        router.navigate('/characters');
    };

    characterManager.onCharacterSelected = (character: any) => {
        console.log('Character selected:', character);
        router.navigate(`/character/${character.id}`);
    };
}

async function renderSplashScreen(): Promise<void> {
    currentView = 'splash';
    splashScreen.render(appContainer);
}

async function renderCharacterManager(): Promise<void> {
    currentView = 'characters';
    characterManager.render(appContainer);
}

async function renderCharacterEditor(characterId: string): Promise<void> {
    currentView = 'characters'; // Still using character manager for editing
    if (characterId) {
        characterManager.editCharacter(characterId);
    }
    characterManager.render(appContainer);
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
}

// Initialize the application
document.addEventListener('DOMContentLoaded', createApp);
window.addEventListener('beforeunload', cleanup);