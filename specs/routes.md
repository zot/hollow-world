# Application Routes

**Centralized route reference for Hollow World SPA**

All routes in the application are listed here. When adding new routes or referencing existing routes in documentation, refer to this file.

**📋 Documentation Guidelines:**
- **Spec files** (other than this file) should use **view names** (e.g., "Friends view", "Settings view") instead of hard-coded routes
- To reference a route in documentation, link to this file: `(see [routes.md](routes.md) for route)`
- **Only this file** (`routes.md`) should contain hard-coded route paths
- **Test files** should also use view names instead of hard-coded routes
  - Exception: Parameterized routes (e.g., `/character/:id`, `/world/:worldId`) may show the hard-coded route to document parameter syntax
  - Simple routes (e.g., `/settings`, `/friends`, `/characters`) should use view names: "Navigate to Settings view"
  - Always reference this file for route documentation

## Development Server

**Base URL:** `https://localhost:3000` (NOT port 5173)

See [`../CLAUDE.md#development-server`](../CLAUDE.md#development-server) for details.

## Route List

### Main Routes

| Route | View | Description | Spec | Handler |
|-------|------|-------------|------|---------|
| `/` | Splash Screen | Main menu with navigation buttons | [`ui.splash.md`](ui.splash.md) | `renderSplashScreen()` |
| `/characters` | Character Manager | List of all characters | [`ui.characters.md`](ui.characters.md) | `renderCharactersView()` |
| `/character/:id` | Character Editor | Edit specific character by UUID | [`ui.characters.md`](ui.characters.md) | `renderEditorView()` |
| `/friends` | Friends View | Manage P2P friends | [`ui.friends.md`](ui.friends.md) | `renderFriendsView()` |
| `/settings` | Settings View | Application settings, peer ID, profiles | [`ui.settings.md`](ui.settings.md) | `renderSettingsView()` |
| `/settings/log` | Log View | System log viewer with filtering | [`ui.settings.md`](ui.settings.md) | `renderLogView()` |
| `/game` | Game View | Legacy game view (may be deprecated) | - | `renderGameView()` |

### World/Adventure Routes

| Route | View | Description | Spec | Handler |
|-------|------|-------------|------|---------|
| `/worlds` | World List | List/manage worlds, create/edit/delete | [`ui-world-list-view.md`](../design/ui-world-list-view.md) | `renderWorldListView()` |
| `/world/:worldId` | Adventure Mode | TextCraft MUD adventure in specific world | [`ui-adventure-view.md`](../design/ui-adventure-view.md) | `renderAdventureMode()` |

**Route Selection Logic**:

The application uses **active world state** (runtime only, not persisted) to determine which route to navigate to:

- **`/worlds`** - Used when:
  - No active world (first time entering adventure mode)
  - User explicitly clicks "🌵 Worlds" button
  - User wants to switch to a different world

- **`/world/:worldId`** - Used when:
  - An active world exists (returning to gameplay)
  - User activates a world from world list
  - User navigates from splash screen with active world
  - User clicks active world in world list (returns without reset)

**Navigation Pattern**:

```typescript
// From splash screen
const route = adventureMode.getDefaultRoute();
// Returns '/worlds' if no active world
// Returns '/world/:worldId' if active world exists

// From world list
// Click inactive world → activate → navigate to '/world/:worldId'
// Click active world → navigate to '/world/:worldId' (no reset)
// Click different world when one is active → confirm → terminate → activate → navigate
```

See [`game-worlds.md`](game-worlds.md#active-world-state-management) for complete active world lifecycle documentation.

## Route Parameters

### Dynamic Parameters

- `:id` - Character UUID (used in `/character/:id`)
- `:worldId` - TextCraft world ID (used in `/world/:worldId`)

### URL Fragments (Hash)

Some routes may use URL fragments for sub-navigation:

- `/settings#friend={peerId}` - Select specific friend in settings (deprecated, now use `/friends`)

## Asset Loading

**Critical:** All asset paths MUST be absolute from origin to work correctly across all routes.

**Correct:**
- `https://localhost:3000/assets/audio/...`
- `https://localhost:3000/templates/...`

**Incorrect:**
- `https://localhost:3000/settings/log/assets/...` ❌
- `https://localhost:3000/character/{uuid}/templates/...` ❌

See [`../CLAUDE.md#asset-url-management`](../CLAUDE.md#asset-url-management) for implementation details.

## Navigation

### Button Navigation

Buttons trigger route navigation via router:

```typescript
router.navigate('/friends');
```

### Browser History

All routes support:
- Direct navigation: `browser_navigate('https://localhost:3000/friends')`
- Page refresh: F5 on any route
- Back/forward buttons: Browser history is managed automatically

### Testing Routes

See [`main.tests.md#complete-route-test-suite`](main.tests.md#complete-route-test-suite) for comprehensive route testing requirements.

Each route MUST work with:
1. Direct navigation
2. Page refresh (F5)
3. Browser back/forward buttons

## Adding New Routes

When adding a new route:

1. **Update `src/main.ts`:**
   ```typescript
   router.addRoute({
       path: '/newroute',
       title: "Don't Go Hollow - New Route",
       handler: () => renderNewRouteView()
   });
   ```

2. **Update this file** (`specs/routes.md`):
   - Add route to appropriate table with hard-coded path
   - Link to spec file in "Spec" column
   - Document any parameters
   - Document navigation entry points

3. **Update `specs/main.tests.md`:**
   - Add route to "Complete Route Test Suite"
   - Add to audio control visibility tests
   - Add asset loading tests if needed

4. **Create route-specific spec file:**
   - Example: `specs/ui.newroute.md`
   - Follow existing spec format
   - **IMPORTANT**: Use view names (e.g., "New Route view") instead of hard-coded routes in descriptions
   - Reference this file (`routes.md`) when documenting the route
   - Example: "**Route:** See [`routes.md`](routes.md) for the New Route view route"

5. **Update navigation buttons:**
   - Add button to Splash Screen if primary route
   - Update callback handlers in `main.ts`

## Route Deprecation

When deprecating a route:
1. Mark as deprecated in this file
2. Update spec files to reflect deprecation
3. Add redirect or fallback behavior
4. Maintain route for backward compatibility (if needed)
5. Remove from main navigation buttons
