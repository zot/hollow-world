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

## 🎉 P2P Migration Complete (Phase 1-5)

**Status**: ✅ Migration complete, ready for testing

**Summary**: Successfully migrated from browser libp2p to p2p-webapp
- ✅ **591 packages removed** (all libp2p/helia dependencies)
- ✅ **Zero TypeScript errors** (all compilation issues fixed)
- ✅ **Production build ready** (`npm run build` succeeds)
- ✅ **New provider**: `P2PWebAppNetworkProvider` implements `INetworkProvider`

**Documentation**:
- **Progress tracking**: [`specs/p2p-migration-progress.md`](specs/p2p-migration-progress.md)
- **Master plan**: [`specs/new-p2p.md`](specs/new-p2p.md)

**Next Steps**:
- Phase 6: End-to-end testing (requires `npm run p2p:start`)
- Phase 7+: Documentation updates, deployment configuration

**Key Changes**:
- `src/p2p/P2PWebAppNetworkProvider.ts` - New provider using p2p-webapp
- `src/p2p/HollowPeer.ts` - Now uses P2PWebAppNetworkProvider by default
- `package.json` - All libp2p/helia dependencies removed
- Build automatically copies to `hollow-world-p2p/html/` for p2p-webapp

---

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
- **[`p2p.md`](specs/p2p.md)** - P2P system architecture (p2p-webapp, WebSocket, multi-peer)
- **[`p2p-messages.md`](specs/p2p-messages.md)** - P2P message types and protocols
- **[`friends.md`](specs/friends.md)** - Friends system data structures and flows
- **[`new-p2p.md`](specs/new-p2p.md)** - P2P migration plan (libp2p → p2p-webapp)
- **[`p2p-migration-progress.md`](specs/p2p-migration-progress.md)** - Migration implementation progress
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

## 💡 Daily Reminders
- **Skills Opportunity**: Once per day, suggest creating new skills (`.claude/skills/*.md`) for repetitive tasks that could benefit from pre-approved scripts or commands (e.g., build/test runners, code formatting checks, log parsing). Currently available: `ascii-analyze`

## 🎨 ASCII Art & Diagrams
- **ALWAYS use the artist agent** for creating or fixing ASCII art diagrams with box-drawing characters
- When creating/editing ASCII art in markdown files (especially in `specs/*.md`), invoke the artist agent proactively
- The artist agent has pre-approved analysis scripts in `.claude/scripts/ascii-*.sh` and won't require permission prompts
- Common use cases:
  - Creating architecture diagrams with box-drawing characters
  - Fixing alignment issues in existing ASCII art
  - Ensuring consistent line widths and vertical borders
  - Validating nested box corner alignment
- **Example**: "I need to add a diagram showing the P2P architecture" → Use artist agent to create it
- **Example**: After creating ASCII art manually → Use artist agent to validate/fix alignment

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

### 📊 Diagrams with d2
**Use d2 for all architecture/flow diagrams** - Never hand-craft ASCII art diagrams
- **Source files**: `.claude/diagrams/sources/*.d2` (version controlled)
- **Generate**: `./.claude/scripts/diagrams-generate.sh` (outputs to `.claude/diagrams/output/`)
- **Embed in markdown**: Copy generated ASCII with source markers
- **Example**:
  ```markdown
  <!-- BEGIN DIAGRAM: my-diagram -->
  <!-- Generated from .claude/diagrams/sources/my-diagram.d2 -->
  <!-- Regenerate with: ./.claude/scripts/diagrams-generate.sh -->
  ```
  <ascii art here>
  ```
  <!-- END DIAGRAM: my-diagram -->
  ```
- **Benefits**: Clean source, automatic layout, no alignment headaches, regenerable
- **See**: `.claude/diagrams/README.md` for full documentation

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

## Updating p2p-webapp

When the p2p-webapp binary or client library is updated in `../p2p-webapp/`, update local copies:

```bash
# 1. Copy updated binary
cp ../p2p-webapp/p2p-webapp bin/p2p-webapp

# 2. Copy updated client library files
bin/p2p-webapp cp client.js client.d.ts types.d.ts src/p2p/client/

# 3. Verify version
bin/p2p-webapp version
```

**Files to update:**
- **Binary**: `bin/p2p-webapp` - The Go server executable
- **Client library**: `src/p2p/client/` - TypeScript client files
  - `client.js` - Compiled client library
  - `client.d.ts` - TypeScript definitions for client
  - `types.d.ts` - TypeScript type definitions

**When to update:**
- p2p-webapp protocol changes
- Bug fixes in client library
- New features in p2p-webapp API

## Development Server

### p2p-webapp Server (Primary)
The application is served by **p2p-webapp** (no Vite):
- **Binary location**: `bin/p2p-webapp`
- **Start command**: `npm run serve`
- **Build command**: `npm run build` (or `./build.sh`)
- **Watch command**: `npm run watch` (auto-recompile on save)
- **Port**: Random (p2p-webapp prints URL on startup, typically `http://localhost:XXXXX`)

**Multi-Peer Architecture**: One p2p-webapp server supports multiple browser clients
- Each browser tab/window gets a unique peer identity
- Server handles P2P message routing between all connected peers
- Example: 5 browser tabs = 5 peer IDs, 1 server
- See [`specs/new-p2p.md`](specs/new-p2p.md#-faq) for details

**⚠️ Multiple Tabs & Profiles**:
- **Same profile in multiple tabs**: Will cause "peer ID already in use" error (expected behavior)
  - Each profile stores its peer key in LocalStorage
  - Multiple tabs using same profile try to use the same peer ID
  - p2p-webapp server rejects duplicate peer IDs
  - **Solution**: Use different profiles for each tab (Settings → Profiles → switch profile)
- **Different profiles in multiple tabs**: Works correctly, each tab gets unique peer ID
  - Useful for testing P2P features locally (friends, messaging, etc.)
  - Example: Tab 1 with "Default" profile, Tab 2 with "Alice" profile

### Build Process
- **Build script**: `./build.sh`
- **Bundler**: esbuild (replaced Vite for lightweight bundling)
- **Steps**:
  1. Creates `index.html` entry point with CSS `<link>` tags
  2. Bundles TypeScript with esbuild (handles npm packages like Milkdown)
  3. Copies CSS files from `src/styles/`
  4. Copies JavaScript files from `src/` (non-TypeScript files)
  5. Copies `public/` assets (templates, audio)
  6. Copies `VERSION` file
- **Output directory**: `hollow-world-p2p/html/`
- **Directory structure**:
  ```
  hollow-world-p2p/
  ├── html/       # Built application (tsc output + assets)
  │   ├── index.html   # Entry point
  │   ├── main.js      # Compiled TypeScript
  │   ├── templates/   # UI templates
  │   ├── assets/      # Static files
  │   └── ...
  ├── ipfs/       # IPFS content (optional)
  └── storage/    # p2p-webapp storage (auto-created)
  ```

### Development Workflow

**Recommended: Integrated Dev Mode**
```bash
# Run watch + serve in single command
npm run dev

# This will:
# 1. Build the application
# 2. Start esbuild watch (auto-recompile on changes)
# 3. Start p2p-webapp server
# 4. Clean up both processes on Ctrl+C

# Browser: Open URL from terminal (e.g., http://localhost:54321)
# Edit files → esbuild rebundles → refresh browser to see changes
```

**Manual Control (Advanced)**
```bash
# Terminal 1: esbuild watch only
npm run watch

# Terminal 2: Serve only
npm run serve
```

**Build Only**
```bash
# Just build (no watch, no serve)
npm run build
```

### WebSocket Connection
- **Endpoint**: Auto-detected from browser URL (e.g., `ws://localhost:PORT/ws`)
- **Port**: Shown in terminal when p2p-webapp starts
- **P2P Protocol**: `/hollow-world/1.0.0`
- **Peer ID**: Generated and stored in localStorage on first run

## Testing

### Playwright Testing with p2p-webapp

**IMPORTANT**: When testing with Playwright, use `--noopen` flag with p2p-webapp:

```bash
# Start p2p-webapp for testing (no browser auto-open)
cd hollow-world-p2p && ../bin/p2p-webapp serve -v --noopen

# In another terminal, run Playwright tests
npm run test:e2e
```

The `--noopen` flag prevents p2p-webapp from launching its own browser window, which would interfere with Playwright's browser automation.

### Key Testing Requirements
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
