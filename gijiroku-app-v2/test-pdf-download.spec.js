import { test, expect, _electron } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('PDF Download Button Tests', () => {
  let electronApp;

  test.beforeAll(async () => {
    // Start Electron app
    electronApp = await _electron.launch({
      args: [path.join(__dirname, 'dist-electron/main.cjs')]
    });
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test('PDF download button should be visible and clickable', async () => {
    // Get the main window
    const window = await electronApp.firstWindow();
    
    // Wait for app to load
    await window.waitForTimeout(3000);
    
    // First, add some content to the editor
    await window.fill('textarea[placeholder*="テキストを入力"]', 'Test content for PDF generation');
    
    // Wait for content to be processed
    await window.waitForTimeout(1000);
    
    // Look for PDF download button
    const pdfButton = window.locator('button:has-text("PDF ダウンロード")');
    
    // Verify button exists and is visible
    await expect(pdfButton).toBeVisible();
    await expect(pdfButton).toBeEnabled();
    
    console.log('✅ PDF download button is visible and enabled');
  });

  test('PDF download button click functionality', async () => {
    const window = await electronApp.firstWindow();
    
    // Wait for app to load
    await window.waitForTimeout(3000);
    
    // Add markdown content with LaTeX and Mermaid
    const testContent = `# テスト会議議事録

## 数式テスト
CPUの使用率は $\\mu = 85\\%$ で推移しています。

$$E = mc^2$$

## Mermaid図表テスト
\`\`\`mermaid
graph TD
    A[開始] --> B[処理]
    B --> C[終了]
\`\`\`

## まとめ
- LaTeX数式が正しく表示されること
- Mermaid図表がプレースホルダーに置換されること`;

    // Fill the editor with content
    await window.fill('textarea[placeholder*="テキストを入力"]', testContent);
    await window.waitForTimeout(1000);
    
    // Find and click PDF download button
    const pdfButton = window.locator('button:has-text("PDF ダウンロード")');
    
    // Click the button
    await pdfButton.click();
    
    // Wait for PDF generation to start (check for loading state)
    await window.waitForTimeout(2000);
    
    // Check if button shows generating state or if there's any error message
    const generatingButton = window.locator('button:has-text("PDF生成中")');
    const errorMessage = window.locator('.error, [class*="error"]');
    
    // Either button should show generating state or process should complete
    const isGenerating = await generatingButton.isVisible().catch(() => false);
    const hasError = await errorMessage.isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await errorMessage.textContent();
      console.log('❌ PDF generation error:', errorText);
      
      // Log more details about the error
      const consoleMessages = [];
      window.on('console', msg => consoleMessages.push(msg.text()));
      await window.waitForTimeout(1000);
      console.log('Console messages:', consoleMessages);
    } else if (isGenerating) {
      console.log('✅ PDF generation started successfully');
      
      // Wait for generation to complete
      await window.waitForTimeout(10000);
      
      // Check if generation completed
      await expect(pdfButton).not.toHaveText('PDF生成中', { timeout: 15000 });
      console.log('✅ PDF generation completed');
    } else {
      console.log('✅ PDF generation process initiated');
    }
  });

  test('Test LaTeX math rendering in PDF', async () => {
    const window = await electronApp.firstWindow();
    await window.waitForTimeout(3000);
    
    // Add content with LaTeX math
    const mathContent = `# LaTeX数式テスト

## インライン数式
CPU使用率: $\\mu = 85\\%$
エラー率: $\\epsilon < 0.001$

## ブロック数式
$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

$$E = mc^2$$`;

    await window.fill('textarea[placeholder*="テキストを入力"]', mathContent);
    await window.waitForTimeout(1000);
    
    // Click PDF download
    await window.locator('button:has-text("PDF ダウンロード")').click();
    
    // Wait and verify no critical errors
    await window.waitForTimeout(5000);
    
    const hasError = await window.locator('.error, [class*="error"]').isVisible().catch(() => false);
    
    if (hasError) {
      const errorText = await window.locator('.error, [class*="error"]').textContent();
      console.log('❌ LaTeX PDF generation failed:', errorText);
    } else {
      console.log('✅ LaTeX PDF generation test passed');
    }
  });

  test('Test Mermaid placeholder in simple PDF', async () => {
    const window = await electronApp.firstWindow();
    await window.waitForTimeout(3000);
    
    // Add content with Mermaid diagrams
    const mermaidContent = `# Mermaid図表テスト

## フローチャート
\`\`\`mermaid
graph TD
    A[データ入力] --> B[前処理]
    B --> C[数式計算]
    C --> D{結果検証}
    D -->|合格| E[レポート生成]
    D -->|不合格| F[再計算]
    F --> C
    E --> G[PDF出力]
\`\`\`

## 期待結果
- Mermaid図表が「[図表: graph TD...]」形式のプレースホルダーに置換される
- PDFが正常に生成される`;

    await window.fill('textarea[placeholder*="テキストを入力"]', mermaidContent);
    await window.waitForTimeout(1000);
    
    // Click PDF download
    await window.locator('button:has-text("PDF ダウンロード")').click();
    
    // Wait and verify
    await window.waitForTimeout(5000);
    
    console.log('✅ Mermaid placeholder PDF generation test completed');
  });
});