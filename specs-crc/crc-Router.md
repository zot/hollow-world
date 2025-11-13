# Router

**Source Spec:** specs/ui.md, specs/routes.md
**Existing Code:** src/utils/Router.ts

## Responsibilities

### Knows
- `routes: IRoute[]` - Registered route patterns and handlers
- `currentPath: string` - Current URL path (can be pre-set before initialize())

### Does
- `addRoute(pattern, handler)` - Register route pattern with handler function
- `navigate(path)` - Navigate to path (adds to history)
- `replace(path)` - Navigate to path (replaces current history entry)
- `initialize()` - Start listening for navigation events and handle current path
- `getCurrentPath()` - Get current URL path
- `handleRoute(path)` - Match path to route and execute handler
- `findRoute(path)` - Find matching route for path pattern
- `matchesPattern(pattern, path)` - Check if path matches route pattern
- `extractParams(pattern, path)` - Extract URL parameters from path
- `handlePopState()` - Handle browser back/forward navigation
- `destroy()` - Remove event listeners

## Collaborators

- **window.history**: Browser history API (pushState, replaceState)
- **window**: popstate event for back/forward buttons
- **All Views**: Route handlers registered by main app
- **Route patterns**: Support for dynamic segments (e.g., /character/:id)

## Code Review Notes

✅ **Working well:**
- Clean routing API (addRoute, navigate, replace)
- URL parameter extraction (e.g., :id in /character/:id)
- Browser history integration (back/forward buttons work)
- Pattern matching for dynamic routes
- Singleton pattern (exported instance `router`)

✅ **Matches spec:**
- URL-based navigation (per ui.md) ✓
- Browser history integration ✓
- Single-page app routing ✓
- Dynamic route parameters ✓

⚠️ **Critical requirements:**
- **MUST call initialize() AFTER all routes are registered** - Router immediately processes currentPath when initialized
- Routes added after initialize() may not be available for initial page load
- Can pre-set currentPath before initialize() for startup navigation control

⚠️ **Potential issues:**
- No route validation (can add conflicting patterns)
- No 404/default route handling
- No query string parsing
- Pattern matching might be fragile for complex routes
- No route guards/middleware support

📝 **Design pattern:**
- Singleton pattern: Exported instance `router`
- Observer pattern: Listens to popstate events
- Strategy pattern: Route handlers as callbacks
- Pattern matching: Dynamic route segments

📝 **Route pattern syntax:**
```typescript
// Static routes
router.addRoute('/', handleHome);
router.addRoute('/characters', handleCharacterList);

// Dynamic routes (with parameters)
router.addRoute('/character/:id', handleCharacterEdit);
router.addRoute('/friend/:peerId', handleFriendView);

// Parameters extracted and passed to handler
function handleCharacterEdit(params: { id: string }) {
    const characterId = params.id;
    // ...
}
```

## Implementation Notes

**⚠️ CRITICAL: Initialization Order**
```typescript
// ❌ WRONG: Routes added after initialize() may not work for initial load
router.initialize();
router.addRoute('/world/:worldId', handleWorld);

// ✅ CORRECT: Register ALL routes before initialize()
router.addRoute('/', handleSplash);
router.addRoute('/world/:worldId', handleWorld);
router.initialize(); // Now processes currentPath with all routes available
```

**Pre-setting Path Before Initialize:**
```typescript
// Get current path
const currentPath = router.getCurrentPath(); // e.g., '/'

// Check if we need to change it (e.g., resume active world)
if (currentPath === '/' && shouldResumeWorld) {
    const targetPath = '/world/MyWorld';

    // Update browser history without triggering navigation
    window.history.replaceState({ path: targetPath }, document.title, targetPath);

    // Update router's internal state
    (router as any).currentPath = targetPath;
}

// Now initialize - will process the updated path
router.initialize();
```

**Navigation Methods:**
```typescript
// navigate() - Adds to history (user can go back)
router.navigate('/character/123');

// replace() - Replaces current history entry (no back)
router.replace('/character/123');
```

**Route Registration (per specs/routes.md):**
```typescript
// Basic application routes (registered in main.ts setupRoutes())
router.addRoute('/', handleSplashScreen);
router.addRoute('/characters', handleCharacterList);
router.addRoute('/character/:id', handleCharacterEdit);
router.addRoute('/friends', handleFriendsView);
router.addRoute('/settings', handleSettingsView);

// Adventure routes (registered in AdventureMode.initialize())
router.addRoute('/worlds', handleWorldList);
router.addRoute('/world/:worldId', handleAdventureView);
```

**Browser History Integration:**
- Uses `history.pushState()` for navigate()
- Uses `history.replaceState()` for replace()
- Listens to `popstate` event for back/forward buttons
- Updates view when URL changes

**URL Parameter Extraction:**
```typescript
// Pattern: /character/:id
// URL: /character/abc-123
// Result: { id: 'abc-123' }

// Pattern: /friend/:peerId/message/:messageId
// URL: /friend/peer1/message/msg1
// Result: { peerId: 'peer1', messageId: 'msg1' }
```

## Sequences

- seq-navigate-to-route.md
- seq-browser-back-navigation.md
- seq-register-routes.md
- seq-extract-route-params.md

## Type A/B/C Issues

**To be identified during CRC review**

