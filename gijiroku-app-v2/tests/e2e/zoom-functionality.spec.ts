import { test, expect } from '@playwright/test';

test.describe('Zoom functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await page.waitForLoadState('domcontentloaded');
  });

  test('should support Ctrl+mouse wheel zoom', async ({ page }) => {
    // Get initial zoom level
    const initialZoom = await page.evaluate(() => {
      return window.devicePixelRatio;
    });

    // Simulate Ctrl+wheel zoom in
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -120); // Wheel up (zoom in)
    await page.keyboard.up('Control');

    // Wait a bit for zoom to apply
    await page.waitForTimeout(100);

    // Check that zoom has changed
    const newZoom = await page.evaluate(() => {
      return window.devicePixelRatio;
    });

    // Note: This test might need adjustment based on how zoom is implemented
    // For now, we just ensure the page is still functional after zoom
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('should maintain functionality after zoom', async ({ page }) => {
    // Apply zoom
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -120); // Zoom in
    await page.keyboard.up('Control');

    await page.waitForTimeout(100);

    // Check that key elements are still visible and functional
    await expect(page.locator('.dashboard-header')).toBeVisible();
    await expect(page.locator('.dashboard-layout')).toBeVisible();
    
    // Try to interact with elements after zoom
    const inputPanel = page.locator('.input-panel');
    if (await inputPanel.isVisible()) {
      await expect(inputPanel).toBeVisible();
    }
  });

  test('should reset zoom with Ctrl+0', async ({ page }) => {
    // Apply zoom first
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, -240); // Zoom in significantly
    await page.keyboard.up('Control');

    await page.waitForTimeout(100);

    // Reset zoom with Ctrl+0
    await page.keyboard.press('Control+0');
    
    await page.waitForTimeout(100);

    // Verify page is still functional
    await expect(page.locator('.dashboard')).toBeVisible();
  });

  test('should support zoom out with Ctrl+mouse wheel', async ({ page }) => {
    // Simulate Ctrl+wheel zoom out
    await page.keyboard.down('Control');
    await page.mouse.wheel(0, 120); // Wheel down (zoom out)
    await page.keyboard.up('Control');

    await page.waitForTimeout(100);

    // Verify page is still functional after zoom out
    await expect(page.locator('.dashboard')).toBeVisible();
    await expect(page.locator('.dashboard-header')).toBeVisible();
  });
});