# AdventureMode

**Source Spec:** specs/game-worlds.md (lines 66-73, Active World State Management)
**Existing Code:** src/ui/AdventureMode.ts
**Test Code:** (none - Phase 7)

## Responsibilities

### Knows
- `currentView: 'worldList' | 'adventure' | null` - Which view is active (world list or adventure)
- `selectedWorldId: string` - Currently selected world ID
- `activeWorldId: string | null` - Active world state (runtime, restored from storage)
- `router: IRouter` - Router instance for navigation
- `viewManager?: IViewManager` - ViewManager for coordinating visibility with other views
- `worldListView: WorldListView | null` - World list view instance
- `adventureView: AdventureView | null` - Adventure view instance
- `mudStorage: MudStorage` - Storage for TextCraft worlds
- `templateEngine: TemplateEngine` - Template rendering engine
- `container: HTMLElement | null` - Container for adventure mode views
- `hollowPeer?: HollowPeer` - P2P coordinator for multiplayer

### Does
- **View Coordinator Interface (IView):**
  - `show()` - Make adventure mode visible
  - `hide()` - Make adventure mode invisible
  - `getContainer()` - Get root container element

- **Adventure Mode Lifecycle:**
  - `initialize()` - Set up router integration, create child views, restore activeWorldId
  - `cleanup()` - Dispose of UI resources (preserves activeWorldId for page reload)
  - `terminateActiveWorld()` - Explicitly clear active world state (for navigation away)

- **View Management:**
  - `showWorldList()` - Display world list overlay
  - `showAdventure(worldId)` - Display adventure view for specified world (activates world)
  - `handleWorldSelection(worldId)` - Switch from world list to adventure view
  - `handleBackToList()` - Switch from adventure view to world list

- **Active World State:**
  - `getDefaultRoute()` - Determine route based on activeWorldId (resume or list)
  - `getActiveWorldId()` - Get currently active world ID

## Collaborators

- **WorldListView** (src/ui/WorldListView.js) - Manages world list display and world CRUD operations
- **AdventureView** (src/ui/AdventureView.js) - Manages active adventure gameplay (text output, command input, session controls)
- **Router** (src/utils/Router.js) - Coordinates URL navigation and browser history
- **ViewManager** (src/utils/ViewManager.js) - Coordinates visibility with other views
- **MudStorage** (src/textcraft/model.js) - Loads and persists world data via IndexedDB
- **ProfileService** (src/services/ProfileService.js) - Persists activeWorldId to localStorage
- **TemplateEngine** (src/utils/TemplateEngine.js) - Renders HTML templates
- **HollowPeer** (src/p2p/HollowPeer.js) - P2P coordinator for multiplayer

## Code Review Notes

### ✅ Working well
- **Active World Persistence**: activeWorldId persisted across page reloads
- **Clean Separation**: cleanup() vs terminateActiveWorld() for different scenarios
- **View Coordination**: Uses ViewManager for single-active-view pattern
- **Router Integration**: Routes registered during initialize()
- **State Management**: Clear distinction between selectedWorldId and activeWorldId

### ✅ Matches spec perfectly
- **Active World Resumption**: Restores activeWorldId from ProfileService on startup
- **View Switching**: Coordinates between world list and adventure views
- **Route Registration**: Adds `/worlds` and `/world/:worldId` routes
- **Persistence Rules**: activeWorldId survives page reload, cleared on explicit navigation away
- **Output History**: Cleared when switching worlds or terminating

### 📝 Implementation details
- **Storage Key**: `activeWorldId` stored in ProfileService
- **View Container**: Creates own container (`adventure-mode-container`) separate from #app
- **Route Handlers**: Registered during initialize(), must happen before router.initialize()
- **View Reuse**: AdventureView and WorldListView instances reused across navigation
- **Skip Initialization**: When returning to same active world, skips re-initialization

## Sequences

- seq-app-startup.md - Application startup with adventure mode initialization
- seq-start-adventure-mode.md - App launch → world list
- seq-select-world.md - World list → start world → adventure view
- seq-switch-to-world-list.md - Adventure view → world list overlay

## Related CRC Cards

- crc-WorldListView.md - World list display and management
- crc-AdventureView.md - Adventure gameplay view
- crc-Router.md - Client-side routing
- crc-ViewManager.md - View visibility coordination
- crc-Application.md - Application lifecycle and startup

## Design Patterns

**Coordinator Pattern**: Manages two child views (WorldListView, AdventureView)
**State Pattern**: Different behavior based on activeWorldId state
**Facade Pattern**: Simplifies TextCraft integration for main application
**IView Interface**: Implements standard view lifecycle (show/hide/getContainer)

## Key Design Decisions

1. **Persistent Active World**: activeWorldId survives page reload (stored in localStorage)
2. **Two Cleanup Methods**: cleanup() for page unload, terminateActiveWorld() for navigation away
3. **Route Registration Timing**: Routes registered in initialize() before router.initialize()
4. **Skip Re-initialization**: Returning to same active world preserves state
5. **Separate Container**: Uses own container outside #app for independent lifecycle
6. **View Coordinator**: Registered as single logical view with ViewManager
7. **Output History**: Cleared on world switch/termination, preserved on page reload
