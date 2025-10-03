# Integration Testing Requirements

*Cross-view testing specifications for Hollow World application*

See also:
- [`CLAUDE.md`](../CLAUDE.md#testing) for testing principles
- [`ui.splash.testing.md`](ui.splash.testing.md) for splash screen tests
- [`ui.characters.testing.md`](ui.characters.testing.md) for character management tests
- [`ui.settings.testing.md`](ui.settings.testing.md) for settings view tests

## SPA Routing Integration Tests

### Complete Route Test Suite
Test ALL routes work with both direct navigation and page refresh:

- [ ] **`/` (splash screen)**
  - Direct: `browser_navigate('http://localhost:3000/')`
  - Refresh: F5 or `location.reload()`
  - Verify: Splash screen renders, buttons visible

- [ ] **`/characters` (character manager)**
  - Direct: `browser_navigate('http://localhost:3000/characters')`
  - Refresh: F5 on `/characters`
  - Verify: Character list renders, Add Character button visible

- [ ] **`/character/:id` (character editor with UUID)**
  - Direct: `browser_navigate('http://localhost:3000/character/{uuid}')`
  - Refresh: F5 on `/character/{uuid}`
  - Verify: Editor renders, character data loads correctly

- [ ] **`/settings` (settings view)**
  - Direct: `browser_navigate('http://localhost:3000/settings')`
  - Refresh: F5 on `/settings`
  - Verify: Settings view renders, peer ID displays

- [ ] **`/settings/log` (log view)**
  - Direct: `browser_navigate('http://localhost:3000/settings/log')`
  - Refresh: F5 on `/settings/log`
  - Verify: Log table renders, filter field present

- [ ] **`/game` (game view)**
  - Direct: `browser_navigate('http://localhost:3000/game')`
  - Refresh: F5 on `/game`
  - Verify: Game view renders (or fallback)

### Vite Dev Server Configuration Test
- [ ] **SPA fallback middleware present**
  - Check `vite.config.ts` has `spa-fallback` plugin
  - Verify middleware serves `index.html` for non-file requests
  - Verify excludes file requests (contains `.`)
  - Verify excludes Vite internal requests (starts with `/@`)

## Cross-View Navigation Tests

### Navigation Flow Testing
- [ ] **Splash → Characters → Editor → Characters → Splash**
  - Start at `/`
  - Navigate to `/characters`
  - Click character → `/character/{uuid}`
  - Back to `/characters`
  - Back to `/`
  - Verify each transition works
  - Verify browser URL updates correctly

- [ ] **Splash → Settings → Log → Settings → Splash**
  - Start at `/`
  - Navigate to `/settings`
  - Click Log button → `/settings/log`
  - Back to `/settings`
  - Back to `/`
  - Verify each transition works

### Browser History Integration
- [ ] **Back button works at each level**
  - Navigate through multiple views
  - Click back repeatedly
  - Verify each back navigates to previous view
  - Verify URL updates correctly

- [ ] **Forward button works**
  - Navigate forward, then back
  - Click forward
  - Verify returns to next view
  - Verify URL updates correctly

- [ ] **History state preserved**
  - Navigate to editor with character
  - Go back, go forward
  - Verify character data intact
  - Verify editor state restored

## Asset Loading Integration Tests

### Base URL Verification Across All Routes
Critical: Assets must load from origin on ALL routes

- [ ] **Audio assets from root `/`**
  - Navigate to `/`
  - Check console for audio 404s
  - Verify loads from: `http://localhost:3000/assets/audio/...`

- [ ] **Audio assets from `/characters`**
  - Navigate to `/characters`
  - Verify loads from: `http://localhost:3000/assets/audio/...`
  - NOT from: `http://localhost:3000/characters/assets/...`

- [ ] **Audio assets from `/character/{uuid}`**
  - Navigate to `/character/{uuid}`
  - Verify loads from: `http://localhost:3000/assets/audio/...`
  - NOT from: `http://localhost:3000/character/{uuid}/assets/...`

- [ ] **Audio assets from `/settings`**
  - Navigate to `/settings`
  - Verify loads from: `http://localhost:3000/assets/audio/...`

- [ ] **Audio assets from `/settings/log`** ⚠️ CRITICAL
  - Navigate to `/settings/log`
  - Verify loads from: `http://localhost:3000/assets/audio/...`
  - NOT from: `http://localhost:3000/settings/log/assets/...`
  - This was the bug that required Base URL fix

### Template Loading Across All Routes

- [ ] **Templates from root `/`**
  - Navigate to `/`
  - Verify template loads from: `http://localhost:3000/templates/...`

- [ ] **Templates from `/settings/log`** ⚠️ CRITICAL
  - Navigate to `/settings/log`
  - Verify template loads from: `http://localhost:3000/templates/...`
  - NOT from: `http://localhost:3000/settings/log/templates/...`
  - This was the bug that required TemplateEngine.ts fix

- [ ] **Templates from all other nested routes**
  - Test `/characters`, `/character/{uuid}`, `/settings`, `/game`
  - Verify all templates load from origin

### Console Error Monitoring
- [ ] **No 404 errors across all routes**
  - Navigate to each route
  - Check `browser_console_messages({ onlyErrors: true })`
  - Verify no asset or template 404s

## Audio System Integration Tests

### Music Persistence Across Views
- [ ] **Music continues playing across navigation**
  - Start music on splash screen
  - Navigate to `/characters` → verify still playing
  - Navigate to `/character/{uuid}` → verify still playing
  - Navigate to `/settings` → verify still playing
  - Navigate to `/settings/log` → verify still playing
  - Return to `/` → verify still playing

- [ ] **Music state persists across refresh**
  - Start music on splash
  - Navigate to `/settings/log`
  - Refresh page
  - Verify music state maintained (playing/paused)

### Music Cycling Across Views
- [ ] **Track cycling works across views**
  - Start music on splash
  - Wait for track to end or skip to next
  - Navigate to different view
  - Verify track cycling continues
  - Verify smooth fade-out on transitions

### Audio Control Visibility
- [ ] **Audio control appears on all views**
  - Verify music button visible at bottom-right on:
    - `/` (splash)
    - `/characters` (manager)
    - `/character/{uuid}` (editor)
    - `/settings` (settings)
    - `/settings/log` (log)
    - `/game` (game view)

## Data Persistence Integration Tests

### LocalStorage Across Sessions
- [ ] **Characters persist**
  - Create characters
  - Close browser/tab
  - Reopen application
  - Navigate to `/characters`
  - Verify characters still present

- [ ] **Log entries persist**
  - Add log entries
  - Close browser/tab
  - Reopen application
  - Navigate to `/settings/log`
  - Verify log entries present

- [ ] **Settings persist**
  - Modify settings
  - Close browser/tab
  - Reopen application
  - Navigate to `/settings`
  - Verify settings unchanged

## Error Handling Integration Tests

### Invalid Routes
- [ ] **Non-existent route**
  - Navigate to `/nonexistent`
  - Verify fallback behavior
  - Verify no crash

### Network Errors
- [ ] **Asset load failure**
  - Simulate audio file unavailable
  - Verify graceful degradation
  - Verify music button hidden
  - Verify app continues functioning

### LocalStorage Errors
- [ ] **Storage quota exceeded**
  - Simulate storage full
  - Verify error handling
  - Verify user notification

## Performance Integration Tests

### Route Transition Speed
- [ ] **Navigation is fast**
  - Time navigation between views
  - Should be < 100ms for same-view navigation
  - Should be < 500ms for cross-view navigation

### Asset Caching
- [ ] **Assets cached after first load**
  - Navigate to view
  - Navigate away and back
  - Verify assets served from cache (304 Not Modified)

## Playwright Test Patterns

### Route Test Template
```typescript
// Test pattern for any route
const route = '/settings/log';

// 1. Direct navigation
await browser_navigate(`http://localhost:3000${route}`);
const snapshot1 = await browser_snapshot();
// Verify view renders

// 2. Page refresh
await browser_navigate(`http://localhost:3000${route}`);
const snapshot2 = await browser_snapshot();
// Verify view still renders

// 3. Check for errors
const errors = await browser_console_messages({ onlyErrors: true });
// Verify no 404s or errors
```

### Asset Loading Test Template
```typescript
// Test pattern for asset loading on route
const route = '/settings/log';

await browser_navigate(`http://localhost:3000${route}`);

// Check network requests
const requests = await browser_network_requests();
const audioRequests = requests.filter(r => r.url.includes('/assets/audio/'));

// Verify all audio requests are to origin path
audioRequests.forEach(req => {
  expect(req.url).toMatch(/^http:\/\/localhost:3000\/assets\/audio\//);
  expect(req.url).not.toMatch(/settings\/log\/assets/);
});
```
