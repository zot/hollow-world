/**
 * Application Entry Point - Main orchestrator for Hollow World
 * Facade Pattern: Coordinates all subsystems (audio, P2P, views, routing)
 *
 * CRC: crc-Application.md
 * Spec: main.md
 * Sequences: seq-app-startup.md, seq-view-transition.md
 */

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
import { AdventureMode } from './ui/AdventureMode.js';
import { HollowPeer, LocalStorageProvider, P2PWebAppNetworkProvider } from './p2p/index.js';
import { TemplateEngine } from './utils/TemplateEngine.js';
import { getStorage } from './textcraft/model.js';
import { AudioManager } from './audio/AudioManager.js';
import { router } from './utils/Router.js';
import { ViewManager } from './utils/ViewManager.js';
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
let viewManager: ViewManager;
let splashScreen: SplashScreen;
let characterManager: CharacterManagerView;
let characterEditor: CharacterEditorView;
let friendsView: FriendsView;
let settingsView: SettingsView;
let adventureMode: AdventureMode | undefined;
let eventNotificationButton: EventNotificationButton | undefined;
let eventModal: EventModal | undefined;
let appContainer: HTMLElement;

// Current view components
let currentView: 'splash' | 'characters' | 'editor' | 'friends' | 'game' | 'settings' | 'adventure' = 'splash';

/**
 * initializeAudio function - Initialize audio system in background (non-blocking)
 *
 * CRC: crc-Application.md
 * Sequences: seq-app-startup.md
 */
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

/**
 * initializeHollowPeer function - Initialize P2P system with retry logic (non-blocking)
 *
 * CRC: crc-Application.md
 * Sequences: seq-app-startup.md
 */
async function initializeHollowPeer(): Promise<void> {
    try {
        console.log('🤝 Initializing HollowPeer (in background)...');

        // Create profile-aware storage provider
        const profileAwareStorage = new LocalStorageProvider(profileService);

        // Create profile-aware network provider
        const networkProvider = new P2PWebAppNetworkProvider(profileService);

        // Create HollowPeer with profile-aware providers
        hollowPeer = new HollowPeer(networkProvider, profileAwareStorage);

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

        // Update friends view with hollowPeer reference
        if (friendsView && hollowPeer) {
            try {
                console.log('🤝 Updating friends view with hollowPeer reference');
                await friendsView.updateHollowPeer(hollowPeer);
                console.log('🤝 Friends view updated with hollowPeer reference');

                // Set up refresh callback for friend acceptance
                hollowPeer.setRefreshFriendsViewCallback(async () => {
                    console.log('🔄 Refreshing friends view...');
                    await friendsView.refreshView();
                });
                console.log('🤝 Refresh callback set for friends view');
            } catch (e) {
                console.warn('Failed to update friends view:', e);
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

/**
 * createApp function - Initialize application and all views
 *
 * CRC: crc-Application.md
 * Sequences: seq-app-startup.md
 */
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

        // Create ViewManager before initializing views
        console.log('🪟 Creating ViewManager...');
        viewManager = new ViewManager();
        viewManager.registerView('splash', splashScreen);
        viewManager.registerView('characters', characterManager);
        viewManager.registerView('character-editor', characterEditor);
        viewManager.registerView('friends', friendsView);
        viewManager.registerView('settings', settingsView);
        console.log('🪟 ViewManager created with basic views registered');

        // Initialize Adventure Mode coordinator (with viewManager)
        // IMPORTANT: Must happen BEFORE router.initialize() so adventure routes are registered
        await initializeAdventureMode();

        // Register adventure mode with ViewManager
        if (adventureMode) {
            viewManager.registerView('adventure', adventureMode);
            console.log('🪟 Adventure Mode registered with ViewManager');
        }

        // Note: Removed automatic active world restoration on home route
        // Users must explicitly navigate to their world from the splash screen or world list
        // This allows proper navigation to the splash screen via the home URL

        // Initialize router AFTER all routes (including adventure mode) are registered
        // This ensures the router can properly handle the initial URL on page load
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
                get eventService() { return hollowPeer?.getEventService(); }
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

/**
 * initializeAdventureMode function - Create and initialize Adventure Mode coordinator
 *
 * CRC: crc-Application.md
 * Spec: game-worlds.md
 */
async function initializeAdventureMode(): Promise<void> {
    try {
        console.log('🎮 Initializing Adventure Mode...');

        const mudStorage = await getStorage();
        const templateEngine = new TemplateEngine();

        adventureMode = new AdventureMode(
            mudStorage,
            templateEngine,
            router,
            hollowPeer,
            viewManager  // Pass viewManager so AdventureMode can notify it
        );

        // Register Adventure Mode routes (/worlds and /world/:worldId)
        adventureMode.initialize();

        console.log('✅ Adventure Mode initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize Adventure Mode:', error);
        // Non-fatal error - app can still function without adventure mode
    }
}

/**
 * setupRoutes function - Register all application routes
 *
 * CRC: crc-Application.md
 * Sequences: seq-view-transition.md
 */
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

    // Adventure Mode routes are registered by AdventureMode.initialize()
    // which handles /worlds and /world/:worldId internally
}

/**
 * setupComponentCallbacks function - Wire up view navigation callbacks
 *
 * CRC: crc-Application.md
 * Sequences: seq-navigate-from-splash.md
 */
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
        // Delegate route selection to AdventureMode based on active world state
        // Spec: ui.splash.md (Adventure Mode Navigation)
        if (adventureMode) {
            const route = adventureMode.getDefaultRoute();
            router.navigate(route);
        } else {
            // Fallback if adventure mode not initialized
            router.navigate('/worlds');
        }
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

/**
 * renderSplashScreen function - Render main menu
 *
 * CRC: crc-Application.md
 */
async function renderSplashScreen(): Promise<void> {
    currentView = 'splash';

    // Terminate active world when leaving adventure mode
    if (adventureMode) {
        adventureMode.terminateActiveWorld();
    }

    await splashScreen.render(appContainer);
    viewManager.showView('splash');
}

/**
 * renderCharacterManager function - Render character list
 *
 * CRC: crc-Application.md
 */
async function renderCharacterManager(): Promise<void> {
    currentView = 'characters';

    // Terminate active world when leaving adventure mode
    if (adventureMode) {
        adventureMode.terminateActiveWorld();
    }

    characterManager.render(appContainer);
    viewManager.showView('characters');
}

/**
 * renderCharacterEditor function - Render character editor for specific character
 *
 * CRC: crc-Application.md
 */
async function renderCharacterEditor(characterId: string): Promise<void> {
    currentView = 'editor';

    try {
        const character = await characterStorageService.getCharacter(characterId);
        if (character) {
            characterEditor.setCharacter(character);
            characterEditor.render(appContainer);
            viewManager.showView('character-editor');
        } else {
            console.error('Character not found:', characterId);
            router.navigate('/characters'); // Redirect to character list
        }
    } catch (error) {
        console.error('Failed to load character for editing:', error);
        router.navigate('/characters'); // Redirect to character list on error
    }
}

/**
 * renderGameView function - Render game view (placeholder)
 *
 * CRC: crc-Application.md
 */
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

/**
 * renderFriendsView function - Render friends management
 *
 * CRC: crc-Application.md
 */
async function renderFriendsView(): Promise<void> {
    currentView = 'friends';

    // Terminate active world when leaving adventure mode
    if (adventureMode) {
        adventureMode.terminateActiveWorld();
    }

    try {
        await friendsView.render(appContainer);
        viewManager.showView('friends');
    } catch (error) {
        console.error('Failed to render friends view:', error);
        // Fallback: navigate back to splash on error
        router.navigate('/');
    }
}

/**
 * renderSettingsView function - Render settings with peer info
 *
 * CRC: crc-Application.md
 */
async function renderSettingsView(): Promise<void> {
    currentView = 'settings';

    // Terminate active world when leaving adventure mode
    if (adventureMode) {
        adventureMode.terminateActiveWorld();
    }

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
        viewManager.showView('settings');
    } catch (error) {
        console.error('Failed to render settings view:', error);
        // Fallback: navigate back to splash on error
        router.navigate('/');
    }
}

/**
 * renderLogView function - Render log view
 *
 * CRC: crc-Application.md
 */
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

// Adventure mode rendering is now handled by AdventureMode coordinator
// Routes /worlds and /world/:worldId are registered in initializeAdventureMode()

/**
 * cleanup function - Clean up resources on page unload
 *
 * CRC: crc-Application.md
 */
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
    if (adventureMode) {
        adventureMode.cleanup();
    }
    if (globalAudioControl) {
        globalAudioControl.destroy();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', createApp);
window.addEventListener('beforeunload', cleanup);
