console.log('Main.ts starting to load...');

// Base URL is initialized in index.html at top of body
// Access it via window.Base
declare global {
    interface Window {
        Base: URL;
    }
}
const Base = window.Base;
import { SplashScreen } from './ui/SplashScreen.js';
import { CharacterManagerView } from './ui/CharacterManagerView.js';
import { CharacterEditorView } from './ui/CharacterEditorView.js';
import { FriendsView } from './ui/FriendsView.js';
import { SettingsView } from './ui/SettingsView.js';
import { EventNotificationButton } from './ui/EventNotificationButton.js';
import { EventModal } from './ui/EventModal.js';
import { GlobalAudioControl } from './ui/GlobalAudioControl.js';
import { AdventureView } from './ui/AdventureView.js';
import { HollowPeer, LocalStorageProvider } from './p2p/index.js';
import { AudioManager } from './audio/AudioManager.js';
import { router } from './utils/Router.js';
import { characterStorageService } from './services/CharacterStorageService.js';
import { ICharacter } from './character/types.js';
import { getProfileService } from './services/ProfileService.js';

console.log('All imports loaded successfully');

// Initialize ProfileService early (handles migration if needed)
const profileService = getProfileService();
console.log('📁 Profile service initialized. Current profile:', profileService.getCurrentProfile().name);

// Global app state
let hollowPeer: HollowPeer | undefined;
let audioManager: AudioManager | undefined;
let globalAudioControl: GlobalAudioControl | undefined;
let splashScreen: SplashScreen;
let characterManager: CharacterManagerView;
let characterEditor: CharacterEditorView;
let friendsView: FriendsView;
let settingsView: SettingsView;
let adventureView: AdventureView | undefined;
let eventNotificationButton: EventNotificationButton | undefined;
let eventModal: EventModal | undefined;
let appContainer: HTMLElement;

// Current view components
let currentView: 'splash' | 'characters' | 'editor' | 'friends' | 'game' | 'settings' | 'adventure' = 'splash';

// Initialize audio manager in background (non-blocking)
async function initializeAudio(): Promise<void> {
    try {
        console.log('🎶 Initializing audio system (in background)...');
        console.log('🎶 AudioManager class available:', typeof AudioManager);

        // List of all available background music tracks for cycling
        const musicTracks = [
            new URL('assets/audio/western-adventure-cinematic-spaghetti-loop-385618.mp3', Base).toString(),
            new URL('assets/audio/cinematic-spaghetti-western-music-tales-from-the-west-207360.mp3', Base).toString(),
            new URL('assets/audio/picker_s-grove-folk.mp3', Base).toString(),
            new URL('assets/audio/picker_s-grove-shanty.mp3', Base).toString(),
            new URL('assets/audio/picker_s-grove-western.mp3', Base).toString(),
            new URL('assets/audio/picker_s-grove-western-ballad.mp3', Base).toString(),
            new URL('assets/audio/mining-incident-waltz-hoedown.mp3', Base).toString(),
            new URL('assets/audio/mining-incident-waltz-polka.mp3', Base).toString()
        ];

        console.log('🎶 Creating AudioManager with', musicTracks.length, 'tracks');
        audioManager = new AudioManager(
            musicTracks,
            new URL('assets/audio/single-gunshot-54-40780.mp3', Base).toString()
        );
        console.log('🎶 AudioManager created:', !!audioManager);

        console.log('🎶 Starting AudioManager initialization...');

        // Add overall timeout for entire audio init (15 seconds max)
        const initPromise = audioManager.initialize();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Audio initialization timeout')), 15000)
        );

        await Promise.race([initPromise, timeoutPromise]);
        console.log('🎶 AudioManager initialization completed successfully');

        // Start background music after initialization
        if (audioManager) {
            try {
                await audioManager.playBackgroundMusic();
                const trackInfo = audioManager.getCurrentTrackInfo();
                console.log('🎵 Background music started with cycling enabled');
                if (trackInfo) {
                    console.log(`🎵 Now playing track ${trackInfo.index + 1}/${trackInfo.total}: ${trackInfo.name}`);
                    console.log(`🔄 Music cycling: ${audioManager.isCyclingEnabled() ? 'ON' : 'OFF'}`);
                }

                // Update button state if splash screen exists
                if (splashScreen) {
                    setTimeout(() => {
                        splashScreen.refreshMusicButtonState();
                        console.log('🎵 Button state refreshed, isPlaying:', audioManager!.isMusicPlaying());
                    }, 100);
                }
            } catch (musicError) {
                console.log('🎵 Background music will start on first user interaction (browser autoplay policy)');
            }
        }

        console.log('🎶 Enhanced audio system initialized successfully');

        // Create and render global audio control if audioManager is available
        if (audioManager) {
            try {
                console.log('🎛️ Creating global audio control...');
                globalAudioControl = new GlobalAudioControl(audioManager);
                const audioControlElement = await globalAudioControl.render();
                document.body.appendChild(audioControlElement);
                console.log('🎛️ Global audio control added to page');
            } catch (audioControlError) {
                console.error('🚨 Failed to create global audio control:', audioControlError);
            }
        }
    } catch (error) {
        console.error('🚨 Audio system failed to initialize:', error);
        console.error('🚨 Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        audioManager = undefined;
    }
}

// Initialize HollowPeer in background (non-blocking)
async function initializeHollowPeer(): Promise<void> {
    try {
        console.log('🤝 Initializing HollowPeer (in background)...');

        // Create profile-aware storage provider
        const profileAwareStorage = new LocalStorageProvider(profileService);

        // HollowPeer will create and manage its own network provider
        hollowPeer = new HollowPeer(undefined, profileAwareStorage);

        // Initialize P2P with retry logic and exponential backoff
        const maxRetries = 3;
        const baseDelay = 1000; // 1 second
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`🤝 P2P initialization attempt ${attempt}/${maxRetries}...`);
                await hollowPeer.initialize();
                console.log('🤝 HollowPeer initialized successfully');
                lastError = undefined;
                break; // Success, exit retry loop
            } catch (error) {
                lastError = error as Error;
                console.warn(`⚠️ P2P initialization attempt ${attempt} failed:`, error);

                if (attempt < maxRetries) {
                    const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
                    console.log(`🔄 Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('🚨 All P2P initialization attempts failed');
                    throw error; // Rethrow on final attempt
                }
            }
        }

        if (lastError) {
            throw lastError;
        }

        console.log('🤝 HollowPeer initialized successfully');

        // Update splash screen with peer ID now that initialization is complete
        if (splashScreen && hollowPeer) {
            try {
                const peerId = hollowPeer.getPeerId();
                console.log('🤝 Updating splash screen with peer ID:', peerId);
                splashScreen.updatePeerId(peerId);
                console.log('🤝 Splash screen peer ID update completed');
            } catch (e) {
                console.warn('Failed to update splash screen with peer ID:', e);
            }
        }

        // Update settings view with hollowPeer reference (always, not just when currently displayed)
        if (settingsView && hollowPeer) {
            try {
                const peerId = hollowPeer.getPeerId();
                console.log('🤝 Updating settings view with peer ID:', peerId);
                settingsView.updatePeerId(peerId);
                settingsView.updateHollowPeer(hollowPeer);
                console.log('🤝 Settings view updated with peer ID and hollowPeer reference');
            } catch (e) {
                console.warn('Failed to update settings view:', e);
            }
        }

        // Initialize event notification UI
        if (hollowPeer) {
            try {
                const eventService = hollowPeer.getEventService();
                console.log('📯 Initializing event notification UI...');

                // Create event modal
                eventModal = new EventModal(eventService, hollowPeer);
                const modalElement = await eventModal.render();
                document.body.appendChild(modalElement);

                // Create event notification button
                eventNotificationButton = new EventNotificationButton(eventService, () => {
                    if (eventModal) {
                        eventModal.show();
                    }
                });
                const buttonElement = eventNotificationButton.render();
                document.body.appendChild(buttonElement);

                console.log('📯 Event notification UI initialized successfully');
            } catch (e) {
                console.error('Failed to initialize event notification UI:', e);
            }
        }
    } catch (error) {
        console.error('🚨 Failed to initialize HollowPeer:', error);
        console.error('🚨 Network error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        hollowPeer = undefined;
    }
}

async function createApp(): Promise<void> {
    console.log('createApp called');

    const app = document.getElementById('app');
    if (!app) {
        console.error('App container not found');
        return;
    }

    console.log('App container found');
    appContainer = app;

    // Truly defer with setTimeout (async functions start executing synchronously until first await)
    console.log('🚀 Deferring background initialization with setTimeout...');
    setTimeout(() => {
        console.log('⏰ setTimeout fired, starting audio...');
        initializeAudio();
    }, 0);
    setTimeout(() => {
        console.log('⏰ setTimeout fired, starting P2P...');
        initializeHollowPeer();
    }, 0);

    try {
        // Initialize views
        console.log('🎵 main.ts audioManager debug before SplashScreen creation:');
        console.log('  - audioManager exists:', !!audioManager);
        console.log('  - audioManager type:', typeof audioManager);
        console.log('  - audioManager:', audioManager);

        splashScreen = new SplashScreen(undefined, audioManager);
        await splashScreen.initialize();

        // Update splash screen with peer ID from HollowPeer (might still be initializing)
        // We'll update it later when P2P initialization completes
        if (hollowPeer) {
            try {
                splashScreen.updatePeerId(hollowPeer.getPeerId());
            } catch (e) {
                console.log('Peer ID not yet available, will update when ready');
            }
        }

        characterManager = new CharacterManagerView(undefined, audioManager);
        characterEditor = new CharacterEditorView(undefined, audioManager);
        friendsView = new FriendsView(undefined, audioManager, hollowPeer);
        settingsView = new SettingsView(undefined, audioManager, hollowPeer);

        // Set up route-based navigation
        setupRoutes();
        setupComponentCallbacks();

        // Initialize router
        router.initialize();

        // Note: Audio and P2P initialization happens in background
        // Music will start automatically when audio initialization completes
        // However, browsers block autoplay until user interaction, so we add a one-time click handler
        let musicStartAttempted = false;
        const tryStartMusic = async () => {
            if (!musicStartAttempted && audioManager && !audioManager.isMusicPlaying()) {
                musicStartAttempted = true;
                try {
                    await audioManager.playBackgroundMusic();
                    console.log('🎵 Music started after user interaction');
                    splashScreen.refreshMusicButtonState();
                    // Remove the listener after successful start
                    document.removeEventListener('click', tryStartMusic);
                } catch (e) {
                    console.warn('Still unable to start music:', e);
                }
            }
        };
        document.addEventListener('click', tryStartMusic, { once: true });

        // Expose test API in dev/test environments
        if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
            window.__HOLLOW_WORLD_TEST__ = {
                profileService: getProfileService(),
                get hollowPeer() { return hollowPeer; },
                get audioManager() { return audioManager; },
                get eventService() { return hollowPeer?.getEventService(); },
            };
            console.log('🧪 Test API exposed on window.__HOLLOW_WORLD_TEST__');
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

    router.addRoute({
        path: '/friends',
        title: "Don't Go Hollow - Friends",
        handler: () => renderFriendsView()
    });

    router.addRoute({
        path: '/settings',
        title: "Don't Go Hollow - Settings",
        handler: () => renderSettingsView()
    });

    router.addRoute({
        path: '/settings/log',
        title: "Don't Go Hollow - Log",
        handler: () => renderLogView()
    });

    router.addRoute({
        path: '/worlds',
        title: "Don't Go Hollow - Select World",
        handler: () => {
            return renderAdventureWorldList();
        }
    });

    router.addRoute({
        path: '/world/:worldId',
        title: "Don't Go Hollow - Adventure Mode",
        handler: (params) => renderAdventureView(params?.worldId)
    });

    router.addRoute({
        path: '/world',
        title: "Don't Go Hollow - Adventure Mode",
        handler: () => renderAdventureDefaultWorld()
    });
}

function setupComponentCallbacks(): void {
    // Splash screen callbacks
    splashScreen.onJoinGame = () => {
        console.log('Join Game clicked - placeholder functionality');
        // TODO: Implement join game functionality
    };

    splashScreen.onCharacters = () => {
        router.navigate('/characters');
    };

    splashScreen.onFriends = () => {
        router.navigate('/friends');
    };

    splashScreen.onAdventure = () => {
        router.navigate('/world');
    };

    splashScreen.onSettings = () => {
        router.navigate('/settings');
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

    // Friends view callbacks
    friendsView.onBackToMenu = () => {
        router.navigate('/');
    };

    // Settings view callbacks
    settingsView.onBackToMenu = () => {
        router.navigate('/');
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
        try {
            const { templateEngine: fallbackTemplateEngine } = await import('./utils/TemplateEngine.js');
            const fallbackHtml = await fallbackTemplateEngine.renderTemplateFromFile('game-view-fallback', {});
            appContainer.innerHTML = fallbackHtml;
        } catch (templateError) {
            console.error('Even fallback template failed:', templateError);
            appContainer.innerHTML = '<div><h1>Game View</h1><p>Failed to load template</p></div>';
        }
    }
}

async function renderFriendsView(): Promise<void> {
    currentView = 'friends';

    try {
        await friendsView.render(appContainer);
    } catch (error) {
        console.error('Failed to render friends view:', error);
        // Fallback: navigate back to splash on error
        router.navigate('/');
    }
}

async function renderSettingsView(): Promise<void> {
    currentView = 'settings';

    try {
        // Update settings view with current peer ID if HollowPeer is available
        if (hollowPeer) {
            try {
                settingsView.updatePeerId(hollowPeer.getPeerId());
            } catch (peerIdError) {
                console.warn('Failed to get peer ID from HollowPeer:', peerIdError);
                settingsView.updatePeerId('Failed to load peer ID');
            }
        } else {
            console.warn('HollowPeer not available, using fallback peer ID');
            settingsView.updatePeerId('Network not initialized');
        }

        await settingsView.renderSettings(appContainer);
    } catch (error) {
        console.error('Failed to render settings view:', error);
        // Fallback: navigate back to splash on error
        router.navigate('/');
    }
}

async function renderLogView(): Promise<void> {
    currentView = 'settings'; // Still settings context

    try {
        await settingsView.renderLog(appContainer);
    } catch (error) {
        console.error('Failed to render log view:', error);
        // Fallback: navigate back to settings on error
        router.navigate('/settings');
    }
}

async function renderAdventureDefaultWorld(): Promise<void> {
    try {
        // Get list of available worlds
        const { getStorage } = await import('./textcraft/model.js');
        const storage = await getStorage();
        const worldNames = storage.worlds;

        if (worldNames.length === 0) {
            // No worlds available - redirect to world list (which will show create world UI)
            console.log('🌍 No worlds available, redirecting to world list');
            router.replace('/worlds');
        } else {
            // Redirect to the first available world
            const firstWorld = worldNames[0];
            console.log('🌍 Redirecting to default world:', firstWorld);
            router.replace(`/world/${encodeURIComponent(firstWorld)}`);
        }
    } catch (error) {
        console.error('Failed to get default world:', error);
        router.replace('/worlds');
    }
}

async function renderAdventureWorldList(): Promise<void> {
    currentView = 'adventure';

    try {
        // Create or reuse adventure view
        if (!adventureView) {
            adventureView = new AdventureView({
                hollowPeer: hollowPeer || undefined,
                onBack: () => {
                    router.navigate('/');
                },
                router: router
            });
        }

        const viewElement = await adventureView.render(undefined, true);
        appContainer.innerHTML = '';
        appContainer.appendChild(viewElement);

        // Show world list view
        await adventureView.showWorldListViewFromRoute();

        console.log('✅ World list view rendered successfully');
    } catch (error) {
        console.error('Failed to render world list view:', error);
        appContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #F5DEB3; background: #2C1810; height: 100vh;">
                <h1 style="color: #D4AF37;">Error</h1>
                <p>Failed to load world list: ${error}</p>
                <button onclick="window.location.href='/';" style="padding: 10px 20px; font-size: 1rem;">
                    Back to Menu
                </button>
            </div>
        `;
    }
}

async function renderAdventureView(worldId?: string): Promise<void> {
    currentView = 'adventure';

    try {
        // Validate that the world exists
        const { getStorage } = await import('./textcraft/model.js');
        const storage = await getStorage();

        if (!worldId) {
            // No worldId provided - redirect to default world handler
            console.warn('No worldId provided, redirecting to default');
            await renderAdventureDefaultWorld();
            return;
        }

        // Decode the world ID (URL may have encoded spaces, etc.)
        const decodedWorldId = decodeURIComponent(worldId);

        if (!storage.hasWorld(decodedWorldId)) {
            // World doesn't exist - redirect to world list
            console.warn('World not found:', decodedWorldId, '- redirecting to world list');
            router.navigate('/worlds');
            return;
        }

        console.log('🎮 Starting adventure mode with world:', decodedWorldId);

        // Create or reuse adventure view
        if (!adventureView) {
            adventureView = new AdventureView({
                hollowPeer: hollowPeer || undefined,
                onBack: () => {
                    router.navigate('/');
                },
                router: router
            });
        }

        const viewElement = await adventureView.render(decodedWorldId);
        appContainer.innerHTML = '';
        appContainer.appendChild(viewElement);

        console.log('✅ Adventure view rendered successfully');
    } catch (error) {
        console.error('Failed to render adventure view:', error);
        appContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #F5DEB3; background: #2C1810; height: 100vh;">
                <h1 style="color: #D4AF37;">Error</h1>
                <p>Failed to load adventure mode: ${error}</p>
                <button onclick="window.location.href='/';" style="padding: 10px 20px; font-size: 1rem;">
                    Back to Menu
                </button>
            </div>
        `;
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
    if (eventNotificationButton) {
        eventNotificationButton.destroy();
    }
    if (eventModal) {
        eventModal.destroy();
    }
    if (adventureView) {
        adventureView.destroy();
    }
    if (globalAudioControl) {
        globalAudioControl.destroy();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', createApp);
window.addEventListener('beforeunload', cleanup);
