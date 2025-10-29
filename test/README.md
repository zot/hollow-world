# HollowWorld Tests

This directory contains integration tests for the HollowWorld application using Playwright.

## Test Files

### `world.test.js`

Comprehensive integration tests for world management functionality, covering:

- **Navigation**: Navigate to world list view
- **World Creation**: Create new worlds with name and description
- **World Activation**: Activate/open a world to play
- **World Navigation**: Navigate between world view and world list
- **World Deletion**: Delete worlds with confirmation
- **List Refresh**: Verify world list updates after create/delete operations
- **Browser History**: Test browser back/forward button integration
- **Edge Cases**: Handle deleting all worlds gracefully
- **Complete Flow**: End-to-end test of create → activate → return → delete

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test world.test.js
```

### Run specific test by name
```bash
npx playwright test -g "should create a new world"
```

## Prerequisites

1. **Dev server must be running** (or will be started automatically by Playwright)
   ```bash
   npm run dev
   ```

2. **Playwright browsers must be installed**
   ```bash
   npx playwright install
   ```

## Test Configuration

The Playwright configuration is in `playwright.config.js` at the project root.

Key settings:
- **Base URL**: `https://localhost:3000`
- **Ignore HTTPS errors**: Enabled (for self-signed certificates)
- **Web server**: Automatically starts `npm run dev` before tests
- **Browser**: Chromium (Firefox and WebKit available but commented out)
- **Reporters**: HTML report generated in `playwright-report/`

## Viewing Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## Test Structure

Each test follows this pattern:

1. **Setup** (`beforeEach`): Navigate to app and enter Adventure Mode
2. **Test**: Perform specific actions and verify results
3. **Assertions**: Use Playwright's `expect` API to verify state

Example:
```javascript
test('should create a new world', async ({ page }) => {
  await page.goto('/worlds');
  await page.getByRole('button', { name: '➕ New World' }).click();
  await page.locator('#world-name-input').fill('Test World');
  await page.getByRole('button', { name: 'Create World' }).click();
  await expect(page.getByText('Test World')).toBeVisible();
});
```

## Debugging Tips

1. **Run in headed mode**: See the browser while tests run
   ```bash
   npx playwright test --headed
   ```

2. **Run in debug mode**: Step through tests with inspector
   ```bash
   npm run test:e2e:debug
   ```

3. **Run in UI mode**: Interactive test runner
   ```bash
   npm run test:e2e:ui
   ```

4. **Take screenshots manually**: Add to test code
   ```javascript
   await page.screenshot({ path: 'debug.png' });
   ```

5. **Pause execution**: Add to test code
   ```javascript
   await page.pause();
   ```

## CI/CD Integration

The tests are configured to run in CI environments:
- Retries: 2 (only in CI)
- Workers: 1 (sequential execution in CI)
- `forbidOnly`: Fails build if `test.only` is accidentally left in code

## Known Issues

- Tests use self-signed SSL certificates (ignored via `ignoreHTTPSErrors`)
- World names include timestamps to avoid conflicts between test runs
- Tests clean up after themselves by deleting created worlds

## Adding New Tests

1. Add test to `world.test.js` or create new `.test.js` file in this directory
2. Follow the existing test structure with `beforeEach` setup
3. Use descriptive test names: `should [action] [expected result]`
4. Clean up test data when possible (delete created worlds, etc.)
5. Run tests locally before committing: `npm run test:e2e`

## Test Coverage

Current test coverage includes:
- ✅ World list navigation
- ✅ World creation with name and description
- ✅ World activation/opening
- ✅ Navigation between world and world list
- ✅ World deletion with confirmation
- ✅ List refresh after create/delete
- ✅ Browser back button integration
- ✅ Empty world list handling
- ✅ Complete end-to-end workflow

Future test coverage could include:
- World editing
- World settings modification
- Multiplayer session creation
- Joining multiplayer sessions
- Character creation and management
- Command execution in worlds
- P2P connectivity (multi-tab tests)
