import { test, expect } from '@playwright/test';

test.describe('UI Screenshots - Light and Dark Mode', () => {
  test.beforeEach(async ({ page }) => {
    // 開発サーバーが起動していることを前提
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.dashboard', { timeout: 15000 });
  });

  test('Light Mode - Main Dashboard', async ({ page }) => {
    await page.screenshot({ 
      path: 'screenshots/light-mode-dashboard.png',
      fullPage: true 
    });
  });

  test('Light Mode - Prompt Selector with Preview', async ({ page }) => {
    // プロンプト選択セクションまでスクロール
    await page.locator('.prompt-selector').scrollIntoViewIfNeeded();
    
    // プロンプト概要を展開
    const toggleButton = page.locator('.toggle-overview-btn').first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ 
      path: 'screenshots/light-mode-prompt-selector.png',
      clip: { x: 0, y: 200, width: 1280, height: 400 }
    });
  });

  test('Light Mode - Settings Modal', async ({ page }) => {
    // 設定ボタンをクリック
    await page.click('[data-testid="settings-button"], button:has-text("⚙️")');
    await page.waitForSelector('.settings-modal-content', { timeout: 5000 });
    
    await page.screenshot({ 
      path: 'screenshots/light-mode-settings-modal.png'
    });
    
    // 各タブのスクリーンショット
    const tabs = ['api', 'prompt', 'dictionary', 'appearance', 'chunking', 'support'];
    for (const tab of tabs) {
      await page.click(`.tab-btn:has-text("${getTabText(tab)}")`);
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: `screenshots/light-mode-settings-${tab}.png`
      });
    }
    
    // モーダルを閉じる
    await page.click('.close-btn, button:has-text("✕")');
  });

  test('Dark Mode - Main Dashboard', async ({ page }) => {
    // ダークモードに切り替え（設定から）
    await page.click('[data-testid="settings-button"], button:has-text("⚙️")');
    await page.waitForSelector('.settings-modal-content', { timeout: 5000 });
    
    // 外観タブに移動
    await page.click('.tab-btn:has-text("外観")');
    await page.waitForTimeout(500);
    
    // ダークモードトグルをクリック
    const darkModeToggle = page.locator('input[type="checkbox"]').first();
    if (!(await darkModeToggle.isChecked())) {
      await darkModeToggle.click();
      await page.waitForTimeout(1000);
    }
    
    // モーダルを閉じる
    await page.click('.close-btn, button:has-text("✕")');
    await page.waitForTimeout(500);
    
    await page.screenshot({ 
      path: 'screenshots/dark-mode-dashboard.png',
      fullPage: true 
    });
  });

  test('Dark Mode - Settings Modal', async ({ page }) => {
    // 前のテストでダークモードが有効になっていることを前提
    await page.click('[data-testid="settings-button"], button:has-text("⚙️")');
    await page.waitForSelector('.settings-modal-content', { timeout: 5000 });
    
    await page.screenshot({ 
      path: 'screenshots/dark-mode-settings-modal.png'
    });
    
    // 各タブのスクリーンショット
    const tabs = ['api', 'prompt', 'chunking', 'support'];
    for (const tab of tabs) {
      await page.click(`.tab-btn:has-text("${getTabText(tab)}")`);
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: `screenshots/dark-mode-settings-${tab}.png`
      });
    }
  });

  test('Popup Modal - Template Preview', async ({ page }) => {
    // プロンプト選択セクションまでスクロール
    await page.locator('.prompt-selector').scrollIntoViewIfNeeded();
    
    // プロンプト概要を展開
    const toggleButton = page.locator('.toggle-overview-btn').first();
    if (await toggleButton.isVisible()) {
      await toggleButton.click();
      await page.waitForTimeout(500);
    }
    
    // プレビューエリアをクリックしてポップアップを開く
    const previewArea = page.locator('.prompt-preview-compact').first();
    if (await previewArea.isVisible()) {
      await previewArea.click();
      await page.waitForSelector('.template-popup-overlay', { timeout: 3000 });
      
      await page.screenshot({ 
        path: 'screenshots/popup-template-preview.png'
      });
    }
  });

  test('Editor Section - Text Check Feature', async ({ page }) => {
    // エディターセクションまでスクロール
    await page.locator('.editor-preview-panel').scrollIntoViewIfNeeded();
    
    // サンプルテキストを入力（もしエディターが空の場合）
    const textarea = page.locator('.markdown-editor-vertical');
    await textarea.fill('これは文章チェック機能のテストです。この文章は長すぎる文章の例として作成されており、百文字を超える非常に長い文章となっているため、文章チェック機能により検出されるはずです。');
    
    // 文章チェックボタンをクリック
    await page.click('button:has-text("文章チェック")');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'screenshots/editor-text-check.png',
      clip: { x: 0, y: 400, width: 1280, height: 500 }
    });
  });
});

function getTabText(tab) {
  const tabMap = {
    'api': 'APIキー',
    'prompt': 'プロンプト', 
    'dictionary': 'カスタム辞書',
    'appearance': '外観',
    'chunking': '分割設定',
    'support': 'サポート'
  };
  return tabMap[tab] || tab;
}