# Hollow World project: digital companion for the Hollow TTRPG

# written in typescript

**📋 Main Specification**: See [`specs/main.md`](specs/main.md) for comprehensive project specifications

**🗺️ Application Routes**: See [`specs/routes.md`](specs/routes.md) for centralized route reference
- All application routes (URLs/paths) are documented in `specs/routes.md`
- **IMPORTANT**: When documenting features in spec files, use **view names** (e.g., "Friends view", "Settings view") instead of hard-coded routes (e.g., `/friends`, `/settings`)
- To find the route for a view, refer to the route table in `specs/routes.md`
- Only `specs/routes.md` should contain hard-coded route paths
- When adding routes, referencing routes in docs, or working with navigation, refer to this file
- Ensures consistency across codebase and documentation

## 📚 Specification Files Quick Reference

### Core Specifications
- **[`main.md`](specs/main.md)** - Main project specification, architecture, and features
- **[`routes.md`](specs/routes.md)** - Centralized route reference for all application URLs
- **[`storage.md`](specs/storage.md)** - Storage systems (IndexedDB, LocalStorage), data patterns
- **[`testing.md`](specs/testing.md)** - Testing strategy, Playwright setup, test organization
- **[`audio.md`](specs/audio.md)** - Audio system (background music, sound effects, controls)
- **[`dependencies.md`](specs/dependencies.md)** - Project dependencies and version management

### UI Specifications
- **[`ui.md`](specs/ui.md)** - General UI principles (save behavior, audio controls, navigation, western theme)
- **[`ui.splash.md`](specs/ui.splash.md)** - Splash Screen (main menu)
- **[`ui.characters.md`](specs/ui.characters.md)** - Character Manager and Character Editor views
- **[`ui.friends.md`](specs/ui.friends.md)** - Friends view (P2P friend management)
- **[`ui.settings.md`](specs/ui.settings.md)** - Settings view (peer ID, profiles, log)

### UI Testing Specifications
- **[`main.tests.md`](specs/main.tests.md)** - Integration testing (routes, P2P, events, cross-view)
- **[`ui.splash.tests.md`](specs/ui.splash.tests.md)** - Splash Screen testing
- **[`ui.characters.tests.md`](specs/ui.characters.tests.md)** - Character management testing
- **[`ui.settings.tests.md`](specs/ui.settings.tests.md)** - Settings view testing

### P2P & Networking
- **[`p2p.md`](specs/p2p.md)** - P2P system architecture (libp2p, connections, discovery)
- **[`p2p-messages.md`](specs/p2p-messages.md)** - P2P message types and protocols
- **[`friends.md`](specs/friends.md)** - Friends system data structures and flows
- **[`coms.md`](specs/coms.md)** - Communication protocols and message handling

### Feature Specifications
- **[`characters.md`](specs/characters.md)** - Character system (attributes, skills, equipment)
- **[`integrate-textcraft.md`](specs/integrate-textcraft.md)** - TextCraft MUD integration

### Planning & Historical
- **[`todo.md`](specs/todo.md)** - Task tracking and pending work

### Other
- **[`itch-io.md`](specs/itch-io.md)** - Itch.io deployment and distribution
- **[`Hollow-summary.md`](specs/Hollow-summary.md)** - Summary of parts of the pencil & paper role playing game, Hollow
- **[`notes.md`](specs/notes.md)** - Development notes and scratchpad

**📝 Note**: CLAUDE.md should remain lean and focused on guidelines. Never add TODO items, scratch work, or temporary notes here. Use `specs/todo.md` for task tracking and `specs/notes.md` for development scratchpad.

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

## UI principles

Key UI requirements:
- HTML open and close elements MUST be balanced -- verify after every change
- NEVER block saves due to validation errors
- Audio controls MUST be visible on all pages
- Use 250ms polling for UI change detection
- NO DIALOGS for P2P operations (use badges and events)
- Western frontier theme throughout

## Log
- keep a persistent log in local storage
  - keep a running serial number for log lines, incremented with each log entry
  - keep a running total of log message characters
  - each log entry is a JSON object with a date and a message
  - when log exceeds 512K characters after storing a log message, trim it
    - start with the oldest messages
    - continue until it is below 256K characters
      - however, if there is only one message left, if is allowed to be larger than 256K characters

## Development Server

The development server runs on **https://localhost:3000** (NOT port 5173)
- Started with `npm run dev`
- Uses HTTPS with self-signed certificates
- Available on local network at `https://192.168.1.103:3000` and `https://10.10.10.2:3000`
- Always use `https://localhost:3000` when navigating to the application during development
- The dev server uses Vite and supports HMR (Hot Module Replacement)

## Testing

Key testing requirements:
- Use Playwright for integration tests
- Test organization: `test/` directory for TypeScript/JavaScript tests
- Each spec should have a corresponding `.tests.md` file
- All routes must work on both direct navigation AND page refresh
- Asset URLs must resolve correctly from all routes

### 🚀 App Initialization
- [x] important: this is in a script element at the top of body ✅ **IMPLEMENTED**
  - [x] `window.Base = new URL('', document.location)`

### CORS
- allow requests from current host, localhost, and zotimer.itch.io

### 🌐 Asset URL Management
- [x] **Pervasively**: use Base as parent URL for all assets, including templates ✅ **IMPLEMENTED**
- [x] Use `new URL(asset, Base).toString()` for the asset URL ✅ **IMPLEMENTED**

## 🎵 Audio System

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
