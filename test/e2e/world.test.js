import { test, expect } from '@playwright/test';

/**
 * World Management Integration Tests
 *
 * Tests the complete world creation, activation, navigation, and deletion flow
 * in the HollowWorld adventure mode.
 */

test.describe('World Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the worlds list
    await page.goto('/worlds');

    // Wait for the world list view to load
    await page.waitForSelector('#world-list-view', { state: 'visible', timeout: 10000 });
  });

  test('should navigate to world list', async ({ page }) => {
    // Should be on /worlds route
    expect(page.url()).toContain('/worlds');

    // Verify we're on the world list view
    await expect(page.getByRole('heading', { name: '🌵 Your Worlds' })).toBeVisible();
    await expect(page.getByRole('button', { name: '➕ New World' })).toBeVisible();
  });

  test('should create a new world', async ({ page }) => {
    // Click "New World" button
    await page.getByRole('button', { name: '➕ New World' }).click();

    // Wait for modal to appear
    await expect(page.locator('#create-world-modal')).toBeVisible();

    // Fill in world name
    const testWorldName = `Test World ${Date.now()}`;
    await page.locator('#new-world-name').fill(testWorldName);

    // Fill in world description
    await page.locator('#new-world-desc').fill('A test world created by automated tests');

    // Click create button
    await page.getByRole('button', { name: 'Create World' }).click();

    // Wait for modal to close
    await expect(page.locator('#create-world-modal')).not.toBeVisible();

    // Verify the world appears in the list
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).toBeVisible();
  });

  test('should activate a world and display it', async ({ page }) => {
    // Create a test world first
    const testWorldName = `Activation Test ${Date.now()}`;
    await page.getByRole('button', { name: '➕ New World' }).click();
    await page.locator('#new-world-name').fill(testWorldName);
    await page.locator('#new-world-desc').fill('Test world for activation');
    await page.getByRole('button', { name: 'Create World' }).click();

    // Wait for world to appear in list
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).toBeVisible();

    // Click the star button to activate the world
    const worldItem = page.locator('.world-list-item', { has: page.getByText(testWorldName) });
    await worldItem.getByRole('button', { name: '⭐' }).click();

    // Verify we navigated to the world view
    await page.waitForURL(new RegExp(`/world/${encodeURIComponent(testWorldName)}`));

    // Verify the world name is displayed in the header
    await expect(page.getByText(testWorldName).first()).toBeVisible();

    // Verify we see the welcome message for the world
    await expect(page.getByText(`Welcome to ${testWorldName}`)).toBeVisible();
  });

  test('should navigate back to world list from active world', async ({ page }) => {
    // Create and activate a world
    const testWorldName = `Navigation Test ${Date.now()}`;
    await page.getByRole('button', { name: '➕ New World' }).click();
    await page.locator('#new-world-name').fill(testWorldName);
    await page.getByRole('button', { name: 'Create World' }).click();
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).toBeVisible();

    // Activate the world
    const worldItem = page.locator('.world-list-item', { has: page.getByText(testWorldName) });
    await worldItem.getByRole('button', { name: '⭐' }).click();
    await page.waitForURL(new RegExp(`/world/${encodeURIComponent(testWorldName)}`));

    // Click on the Worlds button to return to world list
    await page.getByRole('button', { name: '🌵 Worlds' }).click();

    // Verify we're back on the world list
    await page.waitForURL(/\/worlds/);
    await expect(page.getByRole('heading', { name: '🌵 Your Worlds' })).toBeVisible();

    // Verify the world name changed to "Select World"
    await expect(page.getByText('🌵 Select World')).toBeVisible();
  });

  test('should delete a world', async ({ page }) => {
    // Create a test world
    const testWorldName = `Delete Test ${Date.now()}`;
    await page.getByRole('button', { name: '➕ New World' }).click();
    await page.locator('#new-world-name').fill(testWorldName);
    await page.getByRole('button', { name: 'Create World' }).click();
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).toBeVisible();

    // Click the delete button
    const worldItem = page.locator('.world-list-item', { has: page.getByText(testWorldName) });
    await worldItem.getByRole('button', { name: '💀 Delete' }).click();

    // Wait for confirmation modal
    await expect(page.locator('#delete-world-confirmation-modal')).toBeVisible();

    // Confirm deletion
    await page.locator('#delete-world-confirm-btn').click();

    // Wait for modal to close
    await expect(page.locator('#delete-world-confirmation-modal')).not.toBeVisible();

    // Verify the world is gone from the list
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).not.toBeVisible();
  });

  test('should handle deleting all worlds gracefully', async ({ page }) => {
    // Get all existing delete buttons
    const deleteButtons = page.getByRole('button', { name: '💀 Delete' });
    const count = await deleteButtons.count();

    // Delete all worlds
    for (let i = 0; i < count; i++) {
      // Always click the first delete button (as they shift after deletion)
      await page.getByRole('button', { name: '💀 Delete' }).first().click();
      await page.locator('#delete-world-confirm-btn').click();

      // Wait a bit for the deletion to complete
      await page.waitForTimeout(500);
    }

    // Verify we're still on the world list
    expect(page.url()).toContain('/worlds');

    // Verify "No worlds" message appears (or empty list)
    const worldListContainer = page.locator('#world-list-container');
    const items = worldListContainer.locator('.world-list-item');
    await expect(items).toHaveCount(0);
  });

  test('should work with browser back button after navigation', async ({ page }) => {
    // Create and activate a world
    const testWorldName = `Back Button Test ${Date.now()}`;
    await page.getByRole('button', { name: '➕ New World' }).click();
    await page.locator('#new-world-name').fill(testWorldName);
    await page.getByRole('button', { name: 'Create World' }).click();

    const worldItem = page.locator('.world-list-item', { has: page.getByText(testWorldName) });
    await worldItem.getByRole('button', { name: '⭐' }).click();
    await page.waitForURL(new RegExp(`/world/${encodeURIComponent(testWorldName)}`));

    // Use browser back button
    await page.goBack();

    // Should be back on world list
    await page.waitForURL(/\/worlds/);
    await expect(page.getByRole('heading', { name: '🌵 Your Worlds' })).toBeVisible();
  });

  test('should refresh world list after creation', async ({ page }) => {
    // Get initial world count
    const worldListContainer = page.locator('#world-list-container');
    const initialCount = await worldListContainer.locator('.world-list-item').count();

    // Create a new world
    const testWorldName = `Refresh Test ${Date.now()}`;
    await page.getByRole('button', { name: '➕ New World' }).click();
    await page.locator('#new-world-name').fill(testWorldName);
    await page.getByRole('button', { name: 'Create World' }).click();

    // Wait for the new world to appear
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).toBeVisible();

    // Verify count increased
    const newCount = await worldListContainer.locator('.world-list-item').count();
    expect(newCount).toBe(initialCount + 1);
  });

  test('should refresh world list after deletion', async ({ page }) => {
    // Create a world to delete
    const testWorldName = `Deletion Refresh Test ${Date.now()}`;
    await page.getByRole('button', { name: '➕ New World' }).click();
    await page.locator('#new-world-name').fill(testWorldName);
    await page.getByRole('button', { name: 'Create World' }).click();
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).toBeVisible();

    // Get world count before deletion
    const worldListContainer = page.locator('#world-list-container');
    const beforeCount = await worldListContainer.locator('.world-list-item').count();

    // Delete the world
    const worldItem = page.locator('.world-list-item', { has: page.getByText(testWorldName) });
    await worldItem.getByRole('button', { name: '💀 Delete' }).click();
    await page.locator('#delete-world-confirm-btn').click();

    // Verify the world is removed from the list
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).not.toBeVisible();

    // Verify count decreased
    const afterCount = await worldListContainer.locator('.world-list-item').count();
    expect(afterCount).toBe(beforeCount - 1);
  });

  test('complete flow: create, activate, return, delete', async ({ page }) => {
    // This test runs through the complete workflow we tested manually

    // 1. Verify we're on the world list
    await expect(page.getByRole('heading', { name: '🌵 Your Worlds' })).toBeVisible();

    // 2. Create a new world
    const testWorldName = `Complete Flow Test ${Date.now()}`;
    await page.getByRole('button', { name: '➕ New World' }).click();
    await page.locator('#new-world-name').fill(testWorldName);
    await page.locator('#new-world-desc').fill('Testing complete workflow');
    await page.getByRole('button', { name: 'Create World' }).click();
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).toBeVisible();

    // 3. Activate the world (open it)
    const worldItem = page.locator('.world-list-item', { has: page.getByText(testWorldName) });
    await worldItem.getByRole('button', { name: '⭐' }).click();
    await page.waitForURL(new RegExp(`/world/${encodeURIComponent(testWorldName)}`));
    await expect(page.getByText(testWorldName).first()).toBeVisible();

    // 4. Click Worlds button to return to list
    await page.getByRole('button', { name: '🌵 Worlds' }).click();
    await page.waitForURL(/\/worlds/);
    await expect(page.getByRole('heading', { name: '🌵 Your Worlds' })).toBeVisible();
    await expect(page.getByText('🌵 Select World')).toBeVisible();

    // 5. Delete the world
    const worldItemAgain = page.locator('.world-list-item', { has: page.getByText(testWorldName) });
    await worldItemAgain.getByRole('button', { name: '💀 Delete' }).click();
    await page.locator('#delete-world-confirm-btn').click();
    await expect(page.locator('.world-list-item').filter({ hasText: testWorldName })).not.toBeVisible();
  });
});
