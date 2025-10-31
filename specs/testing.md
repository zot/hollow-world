# Testing Specifications

*See [`../CLAUDE.md`](../CLAUDE.md) for general development guidelines*

## General Principles

### Test Organization
- **TypeScript/JavaScript**: Tests should be in a top-level `test` directory
- **Go**: Follow normal Go conventions (`*_test.go` files alongside code)

### Test Requirements
- Use Playwright for integration tests
- Each spec should have a corresponding `.tests.md` file with specific test requirements
- Specs are in the `specs` directory
  - Testing specs are named `SPEC.tests.md`
- See [`main.tests.md`](main.tests.md) for integration test requirements
  - `main.tests.md` is also for global or cross-cut tests
- Unit tests must be accounted for in the `SPEC.tests.md` file that makes the most sense

## SPA Routing Requirements

**Critical**: All routes must work on both direct navigation AND page refresh

### Vite Dev Server Configuration
Must include SPA fallback middleware:

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

### Router Implementation
Must use browser History API:
- `window.history.pushState()` for navigation
- `popstate` event listener for back/forward buttons

### Test All Routes
Routes to test: `/`, `/settings`, `/settings/log`, `/characters`, `/character/:id`, `/game`

For each route:
1. Navigate to route programmatically
2. Refresh page (F5 or browser refresh button)
3. Verify view renders correctly

## Base URL Construction Requirements

**Critical**: Asset and template paths must resolve from origin, not current route

### Correct Pattern
```typescript
new URL(window.location.origin + '/')
```
- ✅ Works on all routes: `/`, `/settings`, `/settings/log`
- ✅ Assets load from: `http://localhost:3000/assets/...`

### Incorrect Pattern
```typescript
new URL(location.toString())
```
- ❌ Breaks on nested routes like `/settings/log`
- ❌ Assets try to load from: `http://localhost:3000/settings/log/assets/...`

### Apply To
- `src/main.ts`: Base URL initialization
- `src/utils/TemplateEngine.ts`: Template path resolution
- Any component that constructs asset URLs

### Test From All Routes
- Verify audio files load correctly
- Verify templates load correctly
- Verify images/other assets load correctly

## Playwright Testing Guidance

### General Usage
- Use Playwright MCP for manual integration testing
- Test patterns:
  - **Navigation**: Use `browser_navigate` to visit routes
  - **Verification**: Use `browser_snapshot` to check page state
  - **Interaction**: Use `browser_click`, `browser_type` for UI interactions

### Routing Test Pattern
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

### Asset Loading Test Pattern
```typescript
// 1. Navigate to nested route
await browser_navigate('/settings/log');
// 2. Check console for 404 errors
const messages = await browser_console_messages({ onlyErrors: true });
// Should be empty or not contain asset 404s
```

### Multi-tab P2P Testing
- Playwright **can handle multiple browser tabs/contexts** for P2P connectivity testing
- Use `browser_tabs` action to create, select, and manage tabs
- Each tab can have a different profile for testing P2P interactions
- Perfect for testing peer-to-peer messaging, friend requests, and connectivity
- See [`main.tests.md`](main.tests.md) "Peer Connectivity Tests" for examples

## Test API for Singleton Access

**Available in dev/test environments only** - Exposes `window.__HOLLOW_WORLD_TEST__`

### Overview
Provides type-safe access to application singletons for testing:
- See `src/types/window.d.ts` for TypeScript definitions
- Exposed in `src/main.ts` only when `import.meta.env.DEV` or `MODE === 'test'`

### Available Services
- **ProfileService**: Access profile-aware storage and current profile
- **HollowPeer**: Access peer ID and P2P functionality
- **EventService**: Access event list for testing
- **AudioManager**: Access audio playback state (optional, may be undefined)

### Test API Access Pattern
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

// Get track info
const trackInfo = await page.evaluate(() => {
  return window.__HOLLOW_WORLD_TEST__?.audioManager?.getCurrentTrackInfo();
});

// Control playback
await page.evaluate(() => {
  window.__HOLLOW_WORLD_TEST__?.audioManager?.playBackgroundMusic();
});

await page.evaluate(() => {
  window.__HOLLOW_WORLD_TEST__?.audioManager?.pauseBackgroundMusic();
});
```

### Usage in Component Tests
When testing specific components, use the test API to:
- Set up initial state (profiles, events, connections)
- Verify component behavior based on service state
- Simulate service interactions without full integration setup
