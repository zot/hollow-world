# Hollow World project

# written in typescript

## 🎯 Core Principles
- Use **SOLID principles** in all implementations
- **🔒 Strict TypeScript typing** - All function parameters, return values, and object properties must use explicit TypeScript types. Never use `any` type except for truly dynamic content. Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes` *(Type your code tighter than a hangman's noose)*
- Create comprehensive **unit tests** for all components
- Use **HTML templates** instead of JavaScript template literals *(Separate your concerns like a good sheriff)*
- Follow specifications for consistent western frontier theme
- html templates are in public/templates

## 📋 TODO Items
- [x] **Refactor EventModal to use HTML templates** - Move event card HTML from `src/ui/EventModal.ts` to template files ✅ **COMPLETED**
  - [x] Create `public/templates/event-card-friend-request.html` ✅
  - [x] Create `public/templates/event-card-friend-declined.html` ✅
  - [x] Move inline styles to CSS files ✅
  - [x] Refactor `EventModal.renderEventCard()` to use TemplateEngine ✅
- [x] **Refactor CharacterSheet to use HTML templates** - Move all HTML strings from `src/character/CharacterSheet.ts` to template files ✅ **COMPLETED**
  - [x] Fixed `character-sheet.html` template ✅
  - [x] Removed inline styles from `attribute-box.html` and added styles to CharacterSheet.css ✅
  - [x] Fixed all template conditionals to work with TemplateEngine (removed `{{else}}` clauses) ✅
  - [x] Refactored `createCharacterSheetHTML()` to use TemplateEngine ✅
  - [x] Refactored `initializePlaceholderContent()` to use templates ✅
  - [x] Created helper methods: `renderAttributes()`, `renderSkills()`, `renderBenefits()`, `renderEquipment()` ✅
  - [x] All sections now use templates: attributes, hollow tracker, skills, benefits, equipment ✅
- [ ] **Refactor SettingsView pending invitations to use HTML template** - Move pending invitation item HTML from `src/ui/SettingsView.ts` (lines 686-693) to template file
  - Create `public/templates/pending-invitation-item.html`
  - Refactor `SettingsView.renderPendingNewInvitations()` to use TemplateEngine

## UI principles
- **REQUIRED**: Audio control **MUST** be visible on all pages at the bottom-right
  - The audio control must be rendered and visible at all times when AudioManager exists
  - Position: fixed at bottom-right corner (z-index high enough to appear above other content)
  - Must include play/pause toggle and be accessible on every view/route
  - Must display current track information and provide next/previous track controls
- use Milkdown crepe for markdown editing
  - use `crepe.on` for events like in the docs about using Crepe
  - don't put padding around the editor content
  - support all available crepe features

### P2P User Experience
- **NO DIALOGS for P2P operations** - Never use `alert()` or modal dialogs for P2P status updates
  - Friend requests, peer discovery, connection status should use visual badges and the event system
  - Errors that require user action can use dialogs, but informational updates must not
  - Use the EventService to notify users of P2P events (friend requests, connections, etc.)
  - Use status badges (e.g., "⏳ Pending") in the UI to show current state
  - Keep P2P operations non-intrusive and seamless

### Events
- there is a persisted list of events
- whenever the event list is not empty
  - there is an event notification button with a bugle on it and a red count of pending events
  - it appears at the screen's upper right
  - clicking it opens a modal dialog with the event view
    - a list shows cards for the events with skull buttons at the right to remove them
      - each event is presented according to its type
- **Testing**: EventService is accessible via `window.__HOLLOW_WORLD_TEST__.eventService` in dev/test environments
  - Get events: `eventService.getEvents()`
  - Add/remove events for testing
  - See [Testing section](#test-api-for-singleton-access) for usage examples

### URL-Based Navigation
- **Single-page app location** represented by browser URL
- **Each view** gets its own URL path

### Browser History Integration
- **History array of objects** for browser back/forward navigation
- **Forward/back buttons** enabled only when history objects are available
- **Self-rendering objects**: Each history object knows what view to display

### Navigation Behavior
- **Going back**: User can navigate backward through history
  - **Forward navigation**: Can advance through existing history
  - **New navigation**: Can navigate to different object
    - **Future deletion**: Removes "future" history objects
    - **New object**: Pushes new object to history array

## Log
- keep a persistent log in local storage
  - keep a running serial number for log lines, incremented with each log entry
  - keep a running total of log message characters
  - each log entry is a JSON object with a date and a message
  - when log exceeds 512K characters after storing a log message, trim it
    - start with the oldest messages
    - continue until it is below 256K characters
      - however, if there is only one message left, if is allowed to be larger than 256K characters

## Testing

### General Principles
- **Test organization**:
  - **TypeScript/JavaScript**: Tests should be in a top-level `test` directory
  - **Go**: Follow normal Go conventions (`*_test.go` files alongside code)
- use playwright for integration tests
- each spec should have a corresponding `.tests.md` file with specific test requirements
- specs are in the `specs` directory
  - testing specs are named SPEC.tests.md
- see [`specs/main.tests.md`](specs/main.tests.md) for integration test requirements
  - main.tests.md is also for global or cross-cut tests
- unit tests must be accounted for in the SPEC.tests.md file that makes the most sense

### SPA Routing Requirements
**Critical**: All routes must work on both direct navigation AND page refresh
- **Vite dev server configuration**: Must include SPA fallback middleware
  ```typescript
  // In vite.config.ts
  {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Serve index.html for all non-file requests
        if (req.url && !req.url.includes('.') && !req.url.startsWith('/@')) {
          req.url = '/index.html';
        }
        next();
      });
    }
  }
  ```
- **Router implementation**: Must use browser History API
  - `window.history.pushState()` for navigation
  - `popstate` event listener for back/forward buttons
- **Test all routes**: `/`, `/settings`, `/settings/log`, `/characters`, `/character/:id`, `/game`
  - Navigate to route programmatically
  - Refresh page (F5 or browser refresh button)
  - Verify view renders correctly

### Base URL Construction Requirements
**Critical**: Asset and template paths must resolve from origin, not current route
- **Correct pattern**: `new URL(window.location.origin + '/')`
  - ✅ Works on all routes: `/`, `/settings`, `/settings/log`
  - ✅ Assets load from: `http://localhost:3000/assets/...`
- **Incorrect pattern**: `new URL(location.toString())`
  - ❌ Breaks on nested routes like `/settings/log`
  - ❌ Assets try to load from: `http://localhost:3000/settings/log/assets/...`
- **Apply to**:
  - `src/main.ts`: Base URL initialization
  - `src/utils/TemplateEngine.ts`: Template path resolution
  - Any component that constructs asset URLs
- **Test from all routes**:
  - Verify audio files load correctly
  - Verify templates load correctly
  - Verify images/other assets load correctly

### Playwright Testing Guidance
- Use Playwright MCP for manual integration testing
- Test patterns:
  - **Navigation**: Use `browser_navigate` to visit routes
  - **Verification**: Use `browser_snapshot` to check page state
  - **Interaction**: Use `browser_click`, `browser_type` for UI interactions
- **Routing test pattern**:
  ```typescript
  // 1. Navigate to route
  await browser_navigate('/settings/log');
  // 2. Take snapshot to verify render
  const snapshot = await browser_snapshot();
  // 3. Refresh page
  await browser_navigate('/settings/log'); // or use refresh
  // 4. Verify still works
  const afterRefresh = await browser_snapshot();
  ```
- **Asset loading test pattern**:
  ```typescript
  // 1. Navigate to nested route
  await browser_navigate('/settings/log');
  // 2. Check console for 404 errors
  const messages = await browser_console_messages({ onlyErrors: true });
  // Should be empty or not contain asset 404s
  ```
- **Multi-tab P2P testing**:
  - Playwright **can handle multiple browser tabs/contexts** for P2P connectivity testing
  - Use `browser_tabs` action to create, select, and manage tabs
  - Each tab can have a different profile for testing P2P interactions
  - Perfect for testing peer-to-peer messaging, friend requests, and connectivity
  - See `specs/main.tests.md` "Peer Connectivity Tests" for examples

### Test API for Singleton Access
**Available in dev/test environments only** - Exposes `window.__HOLLOW_WORLD_TEST__`

Provides type-safe access to application singletons for testing:
- See `src/types/window.d.ts` for TypeScript definitions
- Exposed in `src/main.ts` only when `import.meta.env.DEV` or `MODE === 'test'`

Example Playwright usage:
```typescript
// Access the test API
const api = await page.evaluate(() => window.__HOLLOW_WORLD_TEST__);

// Access ProfileService
const profile = await page.evaluate(() => {
  return window.__HOLLOW_WORLD_TEST__?.profileService.getCurrentProfile();
});

// Access profile-aware localStorage
const invitations = await page.evaluate(() => {
  const json = window.__HOLLOW_WORLD_TEST__?.profileService.getItem('activeInvitations');
  return json ? JSON.parse(json) : {};
});

// Access HollowPeer
const peerId = await page.evaluate(() => {
  return window.__HOLLOW_WORLD_TEST__?.hollowPeer.getPeerId();
});

// Access EventService
const events = await page.evaluate(() => {
  return window.__HOLLOW_WORLD_TEST__?.eventService.getEvents();
});

// Access AudioManager (optional, may be undefined)
const isPlaying = await page.evaluate(() => {
  return window.__HOLLOW_WORLD_TEST__?.audioManager?.isMusicPlaying();
});
```

### 🚀 App Initialization
- [x] important: this is in a script element at the top of body ✅ **IMPLEMENTED**
  - [x] `window.Base = new URL('', document.location)`

### CORS
- allow requests from current host, localhost, and zotimer.itch.io

### 🌐 Asset URL Management
- [x] **Pervasively**: use Base as parent URL for all assets, including templates ✅ **IMPLEMENTED**
- [x] Use `new URL(asset, Base).toString()` for the asset URL ✅ **IMPLEMENTED**

### 🔫 Button Audio Effects
- [ ] **No Random gunshot sound** on each button click
- [x] Use [`single-gunshot-54-40780.mp3`](../public/assets/audio/single-gunshot-54-40780.mp3) ✅ **IMPLEMENTED**
- [x] **Randomly vary** pitch and duration on each click ✅ **IMPLEMENTED**
- [x] **Interrupt functionality**: New gunshot stops any currently playing ✅ **IMPLEMENTED**

### 🎵 Audio System Initialization
- [ ] **AudioManager must initialize successfully** - App must create working AudioManager instance
  - **Required audio files present**: All 8 music tracks + gunshot sound effect must be loadable
  - **Graceful fallback**: If audio initialization fails, continue without audio (hide music button)
  - **Error logging**: Clear console messages when audio fails vs succeeds
  - **Validation**: AudioManager.initialize() must complete without throwing errors
  - **Music button visibility**: Button only appears when AudioManager exists and is functional
  - **Button state synchronization**: Music play/mute button must reflect actual audio state after initialization ✅ **IMPLEMENTED**
  - **Reliable audio state detection**: AudioProvider.isPlaying() must accurately detect playing state even when currentTime is 0 ✅ **IMPLEMENTED**
- [ ] AudioManager must be created on startup, as early as possible

### 🔧 Audio Asset Requirements
- [ ] **All audio files must be accessible via HTTP** - Audio files must be properly served by dev server
  - **File locations**: All audio files must exist in `public/assets/audio/` directory
  - **URL construction**: Audio URLs must resolve correctly with Base URL
  - **Network loading**: Audio files must be loadable without CORS or 404 errors
  - **File format support**: Browser must support MP3 format for all audio files
  - audio file HTTP requests must return audio content

### 🎵 Background Audio
- [x] **Mysterious western ghosttown music** plays continuously ✅ **IMPLEMENTED** (8-track cycling system)

### 🎵 Enhanced Background Music System
- [x] **Implement music cycling system** ✅ **IMPLEMENTED** - Now rotates through all 8 available music tracks
  - **Music files** (8 total, all in cycling rotation):
    1. `western-adventure-cinematic-spaghetti-loop-385618.mp3` ✅ **In rotation**
    2. `cinematic-spaghetti-western-music-tales-from-the-west-207360.mp3` ✅ **In rotation**
    3. `picker_s-grove-folk.mp3` ✅ **In rotation**
    4. `picker_s-grove-shanty.mp3` ✅ **In rotation**
    5. `picker_s-grove-western.mp3` ✅ **In rotation**
    6. `picker_s-grove-western-ballad.mp3` ✅ **In rotation**
    7. `mining-incident-waltz-hoedown.mp3` ✅ **In rotation**
    8. `mining-incident-waltz-polka.mp3` ✅ **In rotation**

- [x] **Enhancement tasks** ✅ **ALL COMPLETED**:
  - [x] Modify AudioManager to support multiple background tracks ✅ **IMPLEMENTED**
  - [x] Implement random or sequential cycling through music files ✅ **IMPLEMENTED** (sequential with auto-advance)
  - [x] Add smooth transitions between tracks ✅ **IMPLEMENTED** (1-second fade out)
  - [x] Ensure cycling works with play/pause/toggle functionality ✅ **IMPLEMENTED**
  - [x] Set appropriate low volume for background ambiance ✅ **IMPLEMENTED** (0.3 volume)
  - [x] Test music persistence across view navigation ✅ **IMPLEMENTED**

### 🎛️ **Audio Control UI Requirements**
- **REQUIRED**: Audio controls **MUST be visible** on all pages/routes
  - Position: Fixed at bottom-right corner of viewport
  - z-index: High enough to appear above all page content (9999+)
  - Persistence: Must remain visible during route navigation
  - Functionality available on every view: `/`, `/settings`, `/settings/log`, `/characters`, `/character/:id`, `/game`
- **Western Frontier Theme** (REQUIRED):
  - Background: Dark brown/wood texture (e.g., `#2C1810` with transparency)
  - Border: Saddle brown (`#8B4513`) with 2-3px solid border
  - Text colors: Gold (`#D4AF37`) for headers, Wheat (`#F5DEB3`) for content
  - Buttons: Western-style with brown/tan color scheme
  - Font: Western/frontier-appropriate styling where possible
  - Overall aesthetic must match the "Hollow World" western ghost town theme
- **Interaction Requirements**:
  - **Clicking the control header** (title area) **MUST** toggle collapse/expand state
  - Collapsed state: Shows compact play/pause indicator
  - Expanded state: Shows full controls (track info, navigation, cycling)
  - Smooth transition between states
- **Required Controls**:
  - Play/Pause toggle button (must reflect current playback state)
  - Next track button
  - Previous track button
  - Current track name display
  - Track position indicator (e.g., "Track 3 of 8")
  - Collapse/Expand toggle (clickable header)
- **Track Navigation**: Skip to next/previous track manually
- **Cycling Control**: Enable/disable automatic track cycling
- **Track Information**: Get current track name, index, and total tracks
- **Smooth Transitions**: Automatic fade-out when switching tracks
- **Enhanced Console Logging**: Detailed track information and cycling status

**Testing**: AudioManager is accessible via `window.__HOLLOW_WORLD_TEST__.audioManager` in dev/test environments (optional, may be undefined)
- Check playback state: `audioManager?.isMusicPlaying()`
- Get track info: `audioManager?.getCurrentTrackInfo()`
- Control playback: `audioManager?.playBackgroundMusic()`, `audioManager?.pauseBackgroundMusic()`
- See [Testing section](#test-api-for-singleton-access) for usage examples
