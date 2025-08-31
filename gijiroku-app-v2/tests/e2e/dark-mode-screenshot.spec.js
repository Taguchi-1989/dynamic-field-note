import { test, expect } from '@playwright/test';

test.describe('Dark Mode Screenshots', () => {
  test('Dark Mode - Main Dashboard and Settings', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.dashboard', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // 設定を開いて外観タブに移動
    const settingsButton = page.locator('button').filter({ hasText: '⚙️' }).first();
    await settingsButton.click();
    await page.waitForSelector('.settings-modal-content', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    // 外観タブをクリック
    await page.click('button:has-text("外観")');
    await page.waitForTimeout(500);
    
    // ダークモードトグルを見つけてONにする
    const toggles = page.locator('input[type="checkbox"]');
    const count = await toggles.count();
    console.log('Found toggles:', count);
    
    // 最初のトグルをクリック（ダークモードと仮定）
    if (count > 0) {
      const firstToggle = toggles.first();
      const isChecked = await firstToggle.isChecked();
      console.log('Toggle is checked:', isChecked);
      
      if (!isChecked) {
        await firstToggle.click();
        await page.waitForTimeout(1000);
      }
    }
    
    // モーダルを閉じる
    await page.click('button:has-text("✕")');
    await page.waitForTimeout(1000);
    
    // ダークモードのダッシュボードスクリーンショット
    await page.screenshot({ 
      path: 'screenshots/dark-mode-dashboard.png',
      fullPage: true 
    });
    
    // 設定を再度開いてダークモード設定画面
    await settingsButton.click();
    await page.waitForSelector('.settings-modal-content', { timeout: 5000 });
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'screenshots/dark-mode-settings.png'
    });
    
    // APIタブ
    await page.click('button:has-text("APIキー")');
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'screenshots/dark-settings-api.png'
    });
  });
});