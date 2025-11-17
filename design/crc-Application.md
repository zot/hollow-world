# Application

**Source Spec:** main.md
**Existing Code:** src/main.ts
**Test Code:** (none - Phase 7)

## Responsibilities

### Knows
- `hollowPeer: HollowPeer | undefined` - P2P coordinator instance
- `audioManager: AudioManager | undefined` - Audio system instance
- `globalAudioControl: GlobalAudioControl | undefined` - Global audio controls
- `viewManager: ViewManager` - Centralized view visibility coordinator
- `splashScreen: SplashScreen` - Main menu view
- `characterManager: CharacterManagerView` - Character list view
- `characterEditor: CharacterEditorView` - Character editor view
- `friendsView: FriendsView` - Friends management view
- `settingsView: SettingsView` - Settings and log view
- `adventureMode: AdventureMode | undefined` - Adventure mode coordinator (wraps WorldListView and AdventureView)
- `eventNotificationButton: EventNotificationButton | undefined` - Event badge
- `eventModal: EventModal | undefined` - Event details modal
- `appContainer: HTMLElement` - Main app container

### Does
- **Application Lifecycle:**
  - `createApp()` - Initialize application and all views
  - `cleanup()` - Clean up resources on page unload
  - `DOMContentLoaded` handler - Start application when DOM ready

- **Background Initialization:**
  - `initializeAudio()` - Initialize audio system asynchronously (non-blocking)
  - `initializeHollowPeer()` - Initialize P2P system with retry logic (non-blocking)
  - `initializeAdventureMode()` - Initialize TextCraft adventure mode coordinator

- **View Management:**
  - Create and register all views with ViewManager
  - **Critical Order**: ViewManager → Views → AdventureMode → Router.initialize()
  - Resume active world before router initialization if activeWorldId exists

- **Routing:**
  - `setupRoutes()` - Register basic application routes (splash, characters, friends, settings)
  - `setupComponentCallbacks()` - Wire up view navigation callbacks
  - Pre-router initialization: Check for active world and update currentPath before router.initialize()

- **View Rendering:**
  - `renderSplashScreen()` - Render main menu (terminates active world)
  - `renderCharacterManager()` - Render character list (terminates active world)
  - `renderCharacterEditor(id)` - Render character editor for specific character (terminates active world)
  - `renderGameView()` - Render game view (placeholder, terminates active world)
  - `renderFriendsView()` - Render friends management (terminates active world)
  - `renderSettingsView()` - Render settings with peer info (terminates active world)
  - `renderLogView()` - Render log view (terminates active world)

- **Test API:**
  - Expose `window.__HOLLOW_WORLD_TEST__` in dev/test environments
  - Provides access to profileService, hollowPeer, audioManager, eventService

## Collaborators

- **Router** (src/utils/Router.js) - Client-side routing
- **ViewManager** (src/utils/ViewManager.js) - Centralized view visibility coordinator
- **SplashScreen** (src/ui/SplashScreen.js) - Main menu
- **CharacterManagerView** (src/ui/CharacterManagerView.js) - Character list
- **CharacterEditorView** (src/ui/CharacterEditorView.js) - Character editor
- **FriendsView** (src/ui/FriendsView.js) - Friends management
- **SettingsView** (src/ui/SettingsView.js) - Settings and log
- **AdventureMode** (src/ui/AdventureMode.js) - Adventure mode coordinator (manages WorldListView and AdventureView)
- **HollowPeer** (src/p2p/HollowPeer.js) - P2P coordinator
- **AudioManager** (src/audio/AudioManager.js) - Audio system
- **GlobalAudioControl** (src/ui/GlobalAudioControl.js) - Global audio controls
- **EventNotificationButton** (src/ui/EventNotificationButton.js) - Event badge
- **EventModal** (src/ui/EventModal.js) - Event modal
- **ProfileService** (src/services/ProfileService.js) - Profile management
- **CharacterStorageService** (src/services/CharacterStorageService.js) - Character persistence

## Code Review Notes

### ✅ Working well
- **Non-blocking initialization**: Audio and P2P initialize in background
- **Retry logic**: P2P initialization retries with exponential backoff
- **Error handling**: Graceful degradation when audio or P2P fail
- **Profile-aware**: Uses ProfileService for multi-profile support
- **Test API**: Exposes singletons for testing
- **Route-based navigation**: Clean separation via Router
- **View lifecycle**: Proper cleanup on page unload
- **Callback pattern**: Views use callbacks for navigation

### ✅ Matches spec perfectly
- Background music starts automatically (with autoplay fallback)
- Profile selection at startup
- P2P connection with retry
- All routes defined per specs/routes.md
- Test API exposed in dev/test environments

### 📝 Implementation details
- **Base URL**: Initialized in index.html, accessed via window.Base
- **Music tracks**: 8-track cycling with automatic transitions
- **P2P retry**: 3 attempts with exponential backoff (1s, 2s, 4s)
- **Audio timeout**: 15-second timeout for initialization
- **View state**: Managed by ViewManager (single-active-view pattern)
- **Autoplay workaround**: One-time click handler to start music
- **Initialization Order**: ProfileService → Audio (async) → P2P (async) → SplashScreen → ViewManager → Views → AdventureMode → Active World Check → Router.initialize()
- **Active World Resumption**: If activeWorldId exists and currentPath is '/', update path to `/world/:worldId` before router.initialize()
- **World Termination**: All non-adventure routes terminate active world via AdventureMode.terminateActiveWorld()

## Sequences

- seq-app-startup.md (already exists from Phase 3)
- seq-navigate-from-splash.md (already exists from Phase 3)
- seq-view-transition.md (TBD - route-based view transitions)

## Related CRC Cards

- crc-Router.md - Client-side routing (Phase 2)
- crc-SplashScreen.md - Main menu (Phase 3)
- crc-AudioManager.md - Audio system (Phase 3)
- crc-HollowPeer.md - P2P coordinator (Phase 4)
- crc-ProfileService.md - Profile management (Phase 1)

## Design Patterns

**Facade Pattern**: Application provides high-level interface to subsystems
**Mediator Pattern**: Application coordinates between views and services
**Singleton**: Global access to audioManager, hollowPeer, profileService
**Callback Pattern**: Views use callbacks for navigation
**Retry Pattern**: P2P initialization with exponential backoff

## Key Design Decisions

1. **Non-blocking Initialization**: Audio and P2P initialize via setTimeout (true async)
2. **Retry with Backoff**: P2P retries 3 times with exponential backoff
3. **Graceful Degradation**: App works without audio or P2P
4. **Profile-Aware**: All services use ProfileService
5. **Route-Based Navigation**: Router manages all view transitions
6. **Test API**: Singletons exposed via window.__HOLLOW_WORLD_TEST__ for testing
7. **Cleanup**: Resources released on page unload
8. **Autoplay Workaround**: Music starts on first user click (browser policy)
9. **ViewManager Pattern**: Single-active-view pattern for clean UI state
10. **Initialization Order**: ViewManager and AdventureMode MUST be initialized before router.initialize()
11. **Active World Resumption**: Pre-set router path before initialize() to resume active world
12. **Explicit World Termination**: Non-adventure routes explicitly terminate active world
