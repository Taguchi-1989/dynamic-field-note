import { test, expect } from '@playwright/test';

test.describe('Input Section Fix Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('Uploaded Text Visibility Fix', async ({ page }) => {
    // テストファイル内容をシミュレート
    const testContent = `# テスト議事録
開始時刻: 10:00
参加者: 田中、佐藤、鈴木

## 議題1: プロジェクトの進捗確認
田中: 今月の進捗はどうでしょうか？
佐藤: 80%完了しています。
鈴木: 来月には完成予定です。

## 議題2: 次回ミーティング
次回は来週火曜日10:00から開催予定。

終了時刻: 11:30`;

    // 直接テキスト入力エリアにコンテンツを入力
    await page.fill('textarea.direct-text-input', testContent);
    
    // テキスト適用ボタンをクリック
    await page.click('button:has-text("テキスト適用")');
    
    // 少し待機してDOM更新を確認
    await page.waitForTimeout(500);

    // 入力パネル全体のスクリーンショット（修正後）
    const inputPanel = page.locator('.input-panel');
    await inputPanel.screenshot({ 
      path: './test-results/11-input-section-fixed.png' 
    });

    // 適応済みテキストプレビューが表示されているかチェック
    const uploadedPreview = page.locator('.uploaded-text-preview');
    await expect(uploadedPreview).toBeVisible();
    
    // プレビュー部分の詳細スクリーンショット
    await uploadedPreview.screenshot({ 
      path: './test-results/12-uploaded-text-preview-fixed.png' 
    });

    // スクロール可能かどうかをテスト
    const textPreview = page.locator('.text-preview');
    await expect(textPreview).toBeVisible();
    
    // 文字数表示の確認
    const textLength = page.locator('.text-length');
    await expect(textLength).toBeVisible();
    await expect(textLength).toContainText('文字');

    console.log('✅ Input section visibility fix verified successfully');
  });

  test('All Implemented Features Screenshot', async ({ page }) => {
    // ダッシュボード全体（修正後の最終版）
    await page.screenshot({ 
      path: './test-results/13-final-dashboard-overview.png',
      fullPage: true 
    });

    // ヘッダー（新規作成・リフレッシュボタン）
    const header = page.locator('.dashboard-header');
    await header.screenshot({ 
      path: './test-results/14-final-header-buttons.png' 
    });

    // AI実行エリア（拡張ボタン）
    const aiSection = page.locator('.ai-execution-panel');
    await aiSection.screenshot({ 
      path: './test-results/15-final-ai-execution-section.png' 
    });

    // 修正された入力パネル
    const inputSection = page.locator('.input-panel');
    await inputSection.screenshot({ 
      path: './test-results/16-final-input-section.png' 
    });

    // 編集エリア（画像機能付き）
    const editorSection = page.locator('.editor-preview-panel');
    await editorSection.screenshot({ 
      path: './test-results/17-final-editor-section.png' 
    });

    console.log('✅ All implemented features screenshot captured');
  });
});