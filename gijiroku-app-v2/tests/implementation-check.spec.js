import { test, expect } from '@playwright/test';

test.describe('Implementation Check', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('UI Implementation Screenshots - Light Mode', async ({ page }) => {
    // ダッシュボード全体のスクリーンショット
    await page.screenshot({ 
      path: './test-results/01-dashboard-overview-light.png',
      fullPage: true 
    });

    // ヘッダー部分（新規作成・リフレッシュボタン）のスクリーンショット
    const header = page.locator('.dashboard-header');
    await header.screenshot({ 
      path: './test-results/02-header-buttons-light.png' 
    });

    // AI実行エリア（拡張されたボタン）のスクリーンショット
    const aiSection = page.locator('.ai-execution-panel');
    await aiSection.screenshot({ 
      path: './test-results/03-ai-execution-section-light.png' 
    });

    // 編集エリア（画像機能ボタン）のスクリーンショット
    const editorSection = page.locator('.editor-preview-panel');
    await editorSection.screenshot({ 
      path: './test-results/04-editor-section-light.png' 
    });

    // 入力セクションのスクリーンショット（隠れてしまう問題を確認）
    const inputSection = page.locator('.input-panel');
    await inputSection.screenshot({ 
      path: './test-results/05-input-section-light.png' 
    });

    // 設定モーダルを開いて幅の確認
    await page.click('button:has-text("⚙️ 設定")');
    await page.waitForSelector('.settings-modal-content');
    await page.screenshot({ 
      path: './test-results/06-settings-modal-wide-light.png',
      fullPage: true 
    });
  });

  test('UI Implementation Screenshots - Dark Mode', async ({ page }) => {
    // ダークモードに切り替え
    await page.click('button:has-text("⚙️ 設定")');
    await page.waitForSelector('.settings-modal-content');
    await page.click('[data-testid="appearance-tab"], .tab-btn:has-text("外観")');
    await page.click('button:has-text("ダークモード")');
    await page.click('.close-btn, button:has-text("✕")');
    await page.waitForTimeout(500);

    // ダークモードでのスクリーンショット
    await page.screenshot({ 
      path: './test-results/07-dashboard-overview-dark.png',
      fullPage: true 
    });

    const header = page.locator('.dashboard-header');
    await header.screenshot({ 
      path: './test-results/08-header-buttons-dark.png' 
    });

    const aiSection = page.locator('.ai-execution-panel');
    await aiSection.screenshot({ 
      path: './test-results/09-ai-execution-section-dark.png' 
    });
  });

  test('Functional Tests', async ({ page }) => {
    // 新規作成ボタンのテスト
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("📝 議事録新規作成")');
    
    // リフレッシュボタンのテスト
    await page.click('button:has-text("🔄 リフレッシュ")');

    // 画像挿入機能のテスト準備
    await page.locator('textarea.markdown-editor-vertical').fill('# テスト議事録\n\n画像挿入テスト');
    
    // 編集エリアのスクリーンショット（画像ボタン含む）
    const editorSection = page.locator('.editor-preview-panel');
    await editorSection.screenshot({ 
      path: './test-results/10-image-buttons-test.png' 
    });

    console.log('✅ UI implementation tests completed - check test-results folder');
  });
});