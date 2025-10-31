# Hollow World project

# written in typescript

**📋 Main Specification**: See [`specs/main.md`](specs/main.md) for comprehensive project specifications

## pending operations on this file
- move the TODO section into specs/todo.md and remove redundant info from todo.md

## 🎯 Core Principles
- Use **SOLID principles** in all implementations
- **🔒 Strict TypeScript typing** - All function parameters, return values, and object properties must use explicit TypeScript types. Never use `any` type except for truly dynamic content. Interface types like `AttributeType` must be used when indexing typed objects like `IAttributes` *(Type your code tighter than a hangman's noose)*
- **Hash-based change detection** - Use cryptographic hashes (SHA-256) to detect changes instead of storing object copies
  - Calculate and store hash of original state
  - Compare current hash to stored hash to detect changes
  - Avoids shallow copy issues with nested objects (spread operator only copies references)
  - More efficient than deep object comparison
  - Applies to: UI change detection, storage integrity verification, P2P data synchronization
  - Example: CharacterEditorView stores `originalCharacterHash` instead of `originalCharacter`
  - See: `src/utils/characterHash.ts` for hash calculation utilities
- Create comprehensive **unit tests** for all components
- Follow specifications for consistent western frontier theme

### TextCraft Thing Storage Guidelines
- **Property Persistence**: Only Thing properties starting with `_` (data) or `!` (functions) are persisted to storage
- **Accessor Pattern**: Use getter/setter accessors for clean API while storing with underscore prefix
  - Example: `thing.character` (accessor) → `thing._character` (storage)
  - Follows same pattern as `thing.name` → `thing._name`, `thing.description` → `thing._description`
- **Adding New Properties**: When adding persistent properties to Things:
  1. Add storage property with `_` prefix (e.g., `_character?: string`)
  2. Add getter/setter accessor without prefix (e.g., `get character()` / `set character()`)
  3. Use the accessor in all code for clean, consistent API

### 🚫 NO HTML Strings in TypeScript/JavaScript
**CRITICAL**: Never use template literals or string concatenation for HTML in `.ts` or `.js` files.
All HTML must be in template files under `public/templates/`

❌ **FORBIDDEN:**
```typescript
// Direct HTML strings
const html = `<div class="foo">${bar}</div>`;
element.innerHTML = '<span>text</span>';

// Functions returning HTML strings
function createCard(name: string): string {
    return `<div class="card"><h2>${name}</h2></div>`;
}

// String concatenation for HTML
let html = '<ul>';
items.forEach(item => html += `<li>${item}</li>`);
html += '</ul>';
```

✅ **REQUIRED:**
```typescript
// Use TemplateEngine for all HTML
const html = await templateEngine.renderTemplateFromFile('foo', { bar });

// For functions that need to return HTML, return template results
async function createCard(name: string): Promise<string> {
    return await templateEngine.renderTemplateFromFile('card', { name });
}

// Use templates with loops
const itemsHtml = items.map(item =>
    templateEngine.renderTemplateFromFile('list-item', { item })
);
const html = await templateEngine.renderTemplateFromFile('list', {
    itemsHtml: (await Promise.all(itemsHtml)).join('')
});
```

**Exceptions (RARE):**
- Single-tag empty elements: `document.createElement('div')`
- Test files that verify HTML output
- Fallback error messages (keep minimal, single line max)

**Enforcement:** All HTML belongs in `public/templates/` *(Separate your concerns like a good sheriff)*


## 🗄️ Storage Systems

**See [`specs/storage.md`](specs/storage.md) for comprehensive storage specifications**

The application uses multiple storage systems:
- **MudStorage**: IndexedDB-backed storage for TextCraft MUD worlds
  - Must use `await getStorage()` to get instance (not static access)
  - Use `doTransaction()` for atomic database operations
- **LocalStorage**: Character data, profiles, and application state
  - Character storage uses UUID-based identification
  - Character version compatibility system for data migration
  - Named profiles with storage prefixes (see [`specs/storage.md`](specs/storage.md#-named-profiles-localstorage))

Key guidelines:
- Always validate data before reading/writing
- Handle storage failures gracefully
- Use appropriate storage type for data size
- See [`specs/storage.md`](specs/storage.md) for complete patterns and best practices

**Note**: Character storage details (save/load workflow, version compatibility) are also documented in [`specs/storage.md`](specs/storage.md#-character-storage-localstorage)

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
- **NEVER block saves due to validation errors** - Users must not lose their work
  - Always save data, even if invalid
  - Show validation warnings but allow save to complete
  - Invalid data can be prevented from being used (e.g., entering worlds) but never from being saved
  - Example: CharacterEditorView saves invalid characters and shows validation warning notification
  - Rationale: Preventing saves risks data loss during intermediate work states
- **REQUIRED**: Audio control **MUST** be visible on all pages at the bottom-right
  - The audio control must be rendered and visible at all times when AudioManager exists
  - Position: fixed at bottom-right corner (z-index high enough to appear above other content)
  - Must include play/pause toggle and be accessible on every view/route
  - Must display current track information and provide next/previous track controls
- **UI polling threshold**: Use 250ms for human UI interaction polling (e.g., change detection)
  - This provides responsive feedback without excessive CPU usage
  - Example: CharacterEditorView uses 250ms intervals to detect character changes for enabling save/cancel buttons
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

**See [`specs/testing.md`](specs/testing.md) for comprehensive testing specifications**

Key testing requirements:
- Use Playwright for integration tests
- Test organization: `test/` directory for TypeScript/JavaScript tests
- Each spec should have a corresponding `.tests.md` file
- All routes must work on both direct navigation AND page refresh
- Asset URLs must resolve correctly from all routes
- See [`specs/main.tests.md`](specs/main.tests.md) for integration test requirements

### 🚀 App Initialization
- [x] important: this is in a script element at the top of body ✅ **IMPLEMENTED**
  - [x] `window.Base = new URL('', document.location)`

### CORS
- allow requests from current host, localhost, and zotimer.itch.io

### 🌐 Asset URL Management
- [x] **Pervasively**: use Base as parent URL for all assets, including templates ✅ **IMPLEMENTED**
- [x] Use `new URL(asset, Base).toString()` for the asset URL ✅ **IMPLEMENTED**

## 🎵 Audio System

**See [`specs/audio.md`](specs/audio.md) for comprehensive audio system specifications**

The audio system provides western-themed immersive ambiance with:
- **Background Music**: 8-track cycling system with smooth transitions
  - Sequential playback with auto-advance
  - Fade-out transitions (1 second)
  - Volume set to 0.3 for background ambiance
  - Music persists across view navigation
- **Button Sound Effects**: Gunshot sound with pitch/duration variation
- **Audio Controls**: Fixed bottom-right position, visible on all routes
  - Western frontier theme styling
  - Collapse/expand functionality
  - Track navigation and cycling control

Key requirements:
- [ ] AudioManager must initialize successfully on startup
- [ ] All audio files must be accessible via HTTP
- **REQUIRED**: Audio controls **MUST be visible** on all pages/routes
- Audio files located in `public/assets/audio/`
- See [`specs/audio.md`](specs/audio.md) for complete specifications and testing details
