# Game Worlds

Hollow World integrates TextCraft's MUD engine for text-based adventure mode alongside graphical character sheets.

## Integration

TextCraft uses `IPeer` abstraction for networking. `HollowIPeer` implements this interface using Hollow's existing p2p-webapp infrastructure. **Must** use the app's existing `P2PWebAppNetworkProvider` instance to avoid duplicate peer IDs.

**Components:**
- **TextCraft Engine**: World/Thing model, command system
- **HollowIPeer**: IPeer adapter for p2p-webapp
- **AdventureView**: Text UI with command input/output, history

### Approach: Clean Layer Integration

**DO:**
- ✅ Implement `IPeer` interface using Hollow's existing p2p-webapp infrastructure
- ✅ Import Textcraft's core engine (`model.ts`, `mudcontrol.ts`) as separate modules
- ✅ Create new "Adventure Mode" UI component
- ✅ Sync Hollow character data with Textcraft Thing properties
- ✅ Use Hollow's profile/storage system for World persistence

**DON'T:**
- ❌ Modify Textcraft's core engine code (keep it pristine for updates)
- ❌ Replace Hollow's existing p2p-webapp setup
- ❌ Mix Textcraft GUI directly into character sheet
- ❌ Duplicate P2P infrastructure - **CRITICAL**: HollowIPeer MUST use Hollow World's existing `P2PWebAppNetworkProvider` instance (same peer as the rest of the app), NOT create a new one

### Why This Approach Works

1. **Textcraft's IPeer abstraction** was designed for exactly this - custom protocol implementations
2. **Hollow already has p2p-webapp** - we just need to adapt it to IPeer interface
3. **Separate concerns** - Character sheet and text adventure are distinct modes
4. **Data sync** - Hollow character stats flow into Textcraft Things as properties

### Peer Instance Usage

**CRITICAL**: HollowIPeer must use Hollow World's existing peer instance:

```typescript
// ✅ CORRECT: Use existing network provider from HollowPeer
import { hollowPeer } from './p2p/HollowPeer'
import { HollowIPeer } from './textcraft/hollow-peer'

// Get the EXISTING network provider (do this once at app startup)
const networkProvider = hollowPeer.getNetworkProvider()
const hollowIPeer = new HollowIPeer(networkProvider)

// ❌ WRONG: Creating a new network provider
const wrongProvider = new P2PWebAppNetworkProvider() // DON'T DO THIS!
const wrongPeer = new HollowIPeer(wrongProvider)     // Creates duplicate peer!
```

**Why this matters:**
- Each `P2PWebAppNetworkProvider` instance = separate peer ID
- Creating multiple instances breaks friend connections and P2P messaging
- TextCraft must share the same peer ID as the rest of the application
- The app should only have ONE peer ID per profile

## Foundation

Imported TextCraft modules (`model.ts`, `mudcontrol.ts`, `peer.ts`) unmodified.

`HollowIPeer` adapter implementing IPeer methods using Hollow's network provider.

## Adventure Mode UI -- the textcraft connection
Managed by AdventureMode class

Switches between two views
- a world list view that shows a list of available worlds
- an adventure view that lets the player interact with an adventure

**Initial Navigation:**
- If an active world exists (persisted from previous session): Resume that world automatically
- If no active world: Show the world list

### AdventureView component:
Managed by AdventureView class
- Banner shows
  - world name
  - a Worlds button
  - a checkbox to switch between the world view and the character view
  - Connection status display
  - a menu button that returns to the splash screen
- Either
  - A world View
    - Text output (scrollable, western-themed)
    - Command input with history (arrow key navigation)
  - A Character View
    - display the character sheet for your character

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ world name (🌵 Worlds)       (✓ Tim Bradley) [connection status] (Menu) │
├─────────────────────────────────────────────────────────────────────────┤
│┌───────────────────────────────────────────────────────────────────────┐│
│|   Textcraft output                                                    │|
│|                                                                       │|
│|                                                                       │|
│|                                                                       │|
│|                                                                       │|
│└───────────────────────────────────────────────────────────────────────┘|
│┌───────────────────────────────────────────────────────────────────────┐│
│| > "type a command" input                                          (➤) │|
│└───────────────────────────────────────────────────────────────────────┘|
└─────────────────────────────────────────────────────────────────────────┘
```

Integrated with view manager and router using templates.

### World list view
Managed by WorldListView class
Full-screen overlay for managing game worlds. Accessed via "🌵 Worlds" button in adventure view.

**Layout:**
```
┌─────────────────────────────────────────┐
│ 🌵 Your Worlds         ➕ New World     │
├─────────────────────────────────────────┤
│ ⭐  Dusty Creek            📜 ⚙️ 💀     │
│ ⭐  The Badlands           📜 ⚙️ 💀     │
│ ⭐  Sheriff's Office       📜 ⚙️ 💀     │
└─────────────────────────────────────────┘
```

**Behavior:**
- **⭐ Start**: Switch to world, navigate to `/adventure`
- **📜 Character**: Dropdown that lets you link your characters to the world; button shows the name of the default
  - You can choose the default character to log in with
  - Shows characters in alphabetical order by name, those linked to the world and those that are unlinked
    - Linkes are with world connections (a connection between a world and a character)
    - You can unlink linked characters
    - You can link unlinked characters
- **⚙️ Edit**: Open settings modal (name, description, users)
- **💀 Delete**: Confirmation modal, auto-switch to another world
- **➕ New World**: Create new world with default settings
- **Routing**: `/adventure/worlds` shows overlay, browser back/forward integrated

## Active World State Management

### Definition

The **active world** is the currently running game world that the user is playing in. It represents a world that has been loaded into memory and is ready for interaction.

**Key Properties:**
- `activeWorldId` **persisted to localStorage** (survives page reload, browser navigation, and app restart)
- TextCraft engine state is runtime only (in-memory, recreated on world activation)
- One active world at a time (or none)
- Active world ID cleared **only** when explicitly leaving adventure mode (navigating to splash/characters/friends/settings)
- Active world ID **preserved** during page unload/reload (cleanup does not clear it)
- Independent of world storage (worlds in MudStorage can exist without being active)

### State Lifecycle

```
No Active World
    ↓
  [Activate World]
    ↓
World Active (Running) ←─────┐
    ↓                        │
  [Page Reload] ─────────────┘ (activeWorldId persisted)
    ↓
  [Explicit Navigation Away]
    ↓
No Active World (terminated)
```

**States:**
- **No Active World**: Default state at fresh app startup or after explicit termination
- **World Active**: A world is loaded and running (persisted activeWorldId in localStorage)
- **Page Reload**: Active world preserved, engine state recreated from persisted world data
- **Terminated**: World is shut down cleanly when leaving adventure mode

### World Activation Rules

**Activating an inactive world:**
- Load world from MudStorage
- Initialize TextCraft engine with world data
- Set as active world (runtime state)
- Navigate to `/world/:worldId`

**Activating the currently active world:**
- Do NOT reload/reset the world
- Simply navigate to `/world/:worldId` (return to gameplay)
- Preserves current game state

**Activating a different world when one is already active:**
1. Warn user: "Switching worlds will end your current session in [Current World Name]. Continue?"
2. If user confirms:
   - Terminate current active world (cleanup, save state if needed)
   - Activate new world (load, initialize)
   - Navigate to `/world/:worldId`
3. If user cancels:
   - Keep current world active
   - Do nothing

### World Termination

**Two types of cleanup:**

1. **UI Cleanup (page unload/reload):**
   - Triggered by: Page refresh, browser navigation, tab close
   - Behavior: Cleanup UI resources but **preserve** `activeWorldId` in localStorage
   - Enables seamless resume after page reload

2. **World Termination (explicit navigation away):**
   - Triggered by: Router navigation to splash/characters/friends/settings views
   - Behavior:
     - Clean up TextCraft engine resources
     - Clear `activeWorldId` from localStorage
     - Clear output history
     - Reset to "no active world" state
   - User must explicitly re-enter adventure mode to play again

**NOT considered termination:**
- Page reload (activeWorldId persists)
- Browser navigation within adventure mode (activeWorldId persists)
- Switching between world list and adventure view (activeWorldId persists)

### Adventure Output History Persistence

**Purpose**: Preserve command output and scrollback across page reloads for seamless adventure experience.

**Requirements:**
- Output history survives page refresh and browser navigation
- Maximum ~1000 lines of scrollback (reasonable for typical sessions)
- Session-scoped (not per-world): represents current adventure output
- Profile-aware storage
- Lightweight storage mechanism (simple key-value, not relational)

**Behavior:**
- Output accumulates during adventure gameplay
- History cleared when switching to a different world
- History cleared when deleting the active world
- History restored when returning to same world after navigation

**Active World Persistence:**
- `activeWorldId` **always persisted** to localStorage during gameplay
- **Survives**: Page reload, browser refresh, app restart, tab close/reopen
- **Cleared only on**: Explicit navigation to splash/characters/friends/settings views
- **Implementation**: Two separate methods:
  - `cleanup()`: Called on page unload, preserves activeWorldId
  - `terminateActiveWorld()`: Called on explicit navigation away, clears activeWorldId
- **App Startup Behavior**:
  - If activeWorldId exists: Navigate directly to `/world/:worldId` (resume gameplay)
  - If no activeWorldId: Navigate to `/worlds` (show world list)
- **Router Integration**: `getDefaultRoute()` returns appropriate route based on activeWorldId

**Design Goals:**
- Page refresh maintains immersion (no lost context)
- Clean separation: presentation state vs. world data
- Minimal storage overhead
- Simple lifecycle management

## Startup Sequence

**Critical Initialization Order:**

The application startup sequence is carefully ordered to ensure active world resumption works correctly:

1. **ProfileService** - Initialize early (needed by all profile-aware services)
2. **Background Services** - Audio and P2P initialize asynchronously (non-blocking)
3. **SplashScreen** - Create splash view
4. **ViewManager** - Create centralized view coordinator
5. **Views** - Create and register all basic views (splash, characters, friends, settings)
6. **AdventureMode** - Initialize adventure mode coordinator
   - Restores `activeWorldId` from ProfileService
   - Registers adventure routes (`/worlds`, `/world/:worldId`)
   - Creates container for adventure views
7. **ViewManager Registration** - Register AdventureMode as a view
8. **Active World Check** - Check if activeWorldId exists and currentPath is `/`
   - If yes: Update browser history and router's currentPath to `/world/:worldId`
   - If no: Keep currentPath as is (usually `/`)
9. **Router.initialize()** - Start router and process currentPath
   - Router sees updated path and routes to active world
   - Or routes to splash screen if no active world

**Why This Order Matters:**

- **AdventureMode BEFORE Router**: Adventure routes must be registered before router.initialize()
- **Path Update BEFORE Router**: Pre-setting currentPath ensures router processes the active world route
- **ViewManager BEFORE Router**: Ensures views are ready for router-triggered transitions

**Implementation Notes:**

```typescript
// main.ts startup sequence (simplified)

// 1. Early initialization
const profileService = getProfileService();

// 2. Background initialization (async, non-blocking)
initializeAudio();
initializeHollowPeer();

// 3. Create views
const splashScreen = new SplashScreen(...);
const viewManager = new ViewManager();
viewManager.registerView('splash', splashScreen);
// ... register other basic views

// 4. Initialize AdventureMode (registers routes, restores activeWorldId)
await initializeAdventureMode();
viewManager.registerView('adventure', adventureMode);

// 5. Check for active world resumption
const currentPath = router.getCurrentPath();
if (currentPath === '/' && adventureMode) {
    const defaultRoute = adventureMode.getDefaultRoute();
    if (defaultRoute !== '/worlds') {
        // Active world exists - pre-set path
        window.history.replaceState({ path: defaultRoute }, document.title, defaultRoute);
        (router as any).currentPath = defaultRoute;
    }
}

// 6. Initialize router (processes currentPath with all routes available)
router.initialize();
```

See: `design/seq-app-startup.md` for detailed sequence diagram

## Play Modes

**Solo**: Local adventures from YAML worlds. No networking.

**Multiplayer**: Host shares world P2P. Guest commands → host engine → output to all.

## Character Sync

Character attributes ↔ Thing properties. Bidirectional event-driven sync maintains consistency between character sheet and MUD world.
