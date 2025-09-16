import { SplashScreen } from './ui/SplashScreen.js';
import { LibP2PNetworkProvider } from './p2p.js';
import { AudioManager } from './audio/AudioManager.js';

async function createApp(): Promise<void> {
    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found');
        return;
    }

    try {
        const networkProvider = new LibP2PNetworkProvider();

        // Initialize audio manager (gracefully handle missing audio files)
        let audioManager: AudioManager | undefined;
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

        const splashScreen = new SplashScreen(networkProvider, undefined, audioManager);
        await splashScreen.initialize();

        // Set up button callbacks
        splashScreen.onJoinGame = () => {
            console.log('Join Game clicked - placeholder functionality');
            // TODO: Implement join game functionality
        };

        splashScreen.onStartGame = () => {
            console.log('Start Game clicked - placeholder functionality');
            // TODO: Implement start game functionality
        };

        splashScreen.render(app);

        console.log('HollowWorld splash screen initialized successfully');
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

document.addEventListener('DOMContentLoaded', createApp);