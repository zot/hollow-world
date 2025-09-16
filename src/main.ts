console.log('Main.ts starting to load...');

import { SplashScreen } from './ui/SplashScreen.js';
import { CharacterManagerView } from './ui/CharacterManagerView.simple.js';
import { LibP2PNetworkProvider } from './p2p.js';
import { AudioManager } from './audio/AudioManager.js';
import { BrowserHistoryManager, ViewStateFactory } from './ui/HistoryManager.js';

console.log('All imports loaded successfully');

// Global app state
let historyManager: BrowserHistoryManager;
let networkProvider: LibP2PNetworkProvider;
let audioManager: AudioManager | undefined;
let splashScreen: SplashScreen;
let characterManager: CharacterManagerView;

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

    try {
        // Initialize history manager
        historyManager = new BrowserHistoryManager();
        historyManager.initialize(app);

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

        // Set up navigation callbacks
        setupSplashScreenCallbacks();
        setupCharacterManagerCallbacks();

        // Start with splash screen
        await showSplashScreen();

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

function setupSplashScreenCallbacks(): void {
    splashScreen.onJoinGame = () => {
        console.log('Join Game clicked - placeholder functionality');
        // TODO: Implement join game functionality
    };

    splashScreen.onStartGame = () => {
        console.log('Start Game clicked - placeholder functionality');
        // TODO: Implement start game functionality
    };

    splashScreen.onCharacters = () => {
        showCharacterManager();
    };
}

function setupCharacterManagerCallbacks(): void {
    characterManager.onBackToMenu = () => {
        showSplashScreen();
    };

    characterManager.onCharacterSelected = (character: any) => {
        console.log('Character selected:', character);
        // TODO: Start game with selected character
        showSplashScreen(); // For now, return to splash
    };
}

async function showSplashScreen(): Promise<void> {
    currentView = 'splash';

    const state = ViewStateFactory.createSplashState(async (container) => {
        splashScreen.render(container);
    });

    historyManager.pushState(state);
}

function showCharacterManager(): void {
    currentView = 'characters';

    const state = ViewStateFactory.createCharactersState(async (container) => {
        characterManager.render(container);
    });

    historyManager.pushState(state);
}

function showGameView(): void {
    currentView = 'game';

    const state = ViewStateFactory.createGameState(async (container) => {
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: #8b4513;">
                <h1>Game View</h1>
                <p>Game functionality coming soon...</p>
                <button onclick="window.history.back()">Back</button>
            </div>
        `;
    });

    historyManager.pushState(state);
}

// Cleanup function for when the page is unloaded
function cleanup(): void {
    if (historyManager) {
        historyManager.destroy();
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