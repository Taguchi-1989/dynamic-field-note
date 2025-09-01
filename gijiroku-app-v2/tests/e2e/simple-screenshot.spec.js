import { test, expect } from '@playwright/test';

test.describe('Simple UI Screenshots', () => {
  test('Light Mode - Main Dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.dashboard', { timeout: 15000 });
    await page.waitForTimeout(2000); // レンダリング完了を待つ
    
    await page.screenshot({ 
      path: 'screenshots/light-mode-dashboard.png',
      fullPage: true 
    });
  });

  test('Light Mode - Settings Modal All Tabs', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.dashboard', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // 設定ボタンを探してクリック
    const settingsButton = page.locator('button').filter({ hasText: '⚙️' }).first();
    await settingsButton.click();
    await page.waitForSelector('.settings-modal-content', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // ワークスペースタブ
    await page.screenshot({ 
      path: 'screenshots/light-settings-workspace.png'
    });
    
    // APIタブ
    await page.click('button:has-text("APIキー")');
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'screenshots/light-settings-api.png'
    });
    
    // プロンプトタブ
    await page.click('button:has-text("プロンプト")');
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'screenshots/light-settings-prompt.png'
    });
    
    // 分割設定タブ
    await page.click('button:has-text("分割設定")');
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'screenshots/light-settings-chunking.png'
    });
    
    // サポートタブ
    await page.click('button:has-text("サポート")');
    await page.waitForTimeout(500);
    await page.screenshot({ 
      path: 'screenshots/light-settings-support.png'
    });
  });

  test('Light Mode - Prompt Selector', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.dashboard', { timeout: 15000 });
    await page.waitForTimeout(2000);
    
    // プロンプト選択部分をスクリーンショット
    await page.locator('.prompt-selector').scrollIntoViewIfNeeded();
    
    // 概要ボタンをクリックして展開
    const toggleButton = page.locator('.toggle-overview-btn').first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ 
      path: 'screenshots/light-prompt-selector.png',
      clip: { x: 0, y: 300, width: 1280, height: 400 }
    });
  });
});