/**
 * シンプルなMermaid機能 E2Eテスト - Playwright
 * React SPAの基本動作確認とMermaid無効状態の検証
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// テストファイルのパス
const sampleMdPath = path.join(__dirname, '../../test/mermaid/mermaid-sample-content.md');

test.describe('Mermaid機能 基本動作テスト', () => {
  
  test.beforeEach(async ({ page }) => {
    // アプリケーションを起動
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // React アプリが読み込まれるまで少し待機
    await page.waitForTimeout(3000);
  });

  test('React アプリケーションの基本動作確認', async ({ page }) => {
    test.setTimeout(60000); // 60秒タイムアウト
    
    console.log('🧪 Test: React App Basic Functionality');
    
    // ページのタイトルを確認
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // 基本的な要素が存在するかチェック
    const hasBody = await page.locator('body').count();
    const hasReactRoot = await page.locator('#root').count();
    
    console.log(`🎯 Body elements: ${hasBody}`);
    console.log(`⚛️ React root: ${hasReactRoot}`);
    
    expect(hasBody).toBeGreaterThan(0);
    expect(hasReactRoot).toBeGreaterThan(0);
    
    // ページの基本的なコンテンツを確認
    const pageContent = await page.textContent('body');
    const hasBasicContent = pageContent && pageContent.length > 0;
    
    console.log(`📝 Page has content: ${hasBasicContent}`);
    console.log(`📊 Content length: ${pageContent ? pageContent.length : 0} characters`);
    
    expect(hasBasicContent).toBe(true);
  });

  test('テキストエリアの基本機能確認', async ({ page }) => {
    test.setTimeout(60000);
    
    console.log('🧪 Test: Text Editor Basic Functionality');
    
    // テキストエリアを探す（複数の可能性を考慮）
    const textareaSelectors = [
      'textarea',
      '[contenteditable="true"]',
      'input[type="text"]',
      '.text-editor',
      '[data-testid*="editor"]'
    ];
    
    let textareaFound = false;
    let activeTextarea = null;
    
    for (const selector of textareaSelectors) {
      const count = await page.locator(selector).count();
      console.log(`🔍 Selector '${selector}': ${count} elements found`);
      
      if (count > 0) {
        activeTextarea = page.locator(selector).first();
        textareaFound = true;
        break;
      }
    }
    
    if (textareaFound && activeTextarea) {
      console.log('✅ Text input element found');
      
      // サンプルテキストを入力
      const sampleText = '# テスト文書\n\nこれはテスト用の文書です。';
      await activeTextarea.fill(sampleText);
      console.log('📝 Sample text inserted');
      
      // 入力されたテキストを確認
      const inputValue = await activeTextarea.inputValue();
      console.log(`📄 Input value: ${inputValue.substring(0, 50)}...`);
      
      expect(inputValue).toContain('テスト文書');
    } else {
      console.log('⚠️ No text input element found - checking page structure');
      
      // ページの構造を調べる
      const allElements = await page.locator('*').count();
      console.log(`🔍 Total elements on page: ${allElements}`);
      
      // 主要なタグをチェック
      const divs = await page.locator('div').count();
      const inputs = await page.locator('input').count();
      const buttons = await page.locator('button').count();
      
      console.log(`📊 Page structure - divs: ${divs}, inputs: ${inputs}, buttons: ${buttons}`);
    }
  });

  test('Mermaid無効状態の確認', async ({ page }) => {
    test.setTimeout(90000);
    
    console.log('🧪 Test: Mermaid Disabled State Verification');
    
    // サンプルMermaidコンテンツを読み込み
    let sampleContent;
    try {
      sampleContent = fs.readFileSync(sampleMdPath, 'utf-8');
      console.log(`📄 Sample content loaded: ${sampleContent.length} characters`);
    } catch (error) {
      console.log(`❌ Could not load sample file: ${error.message}`);
      sampleContent = `# テスト

\`\`\`mermaid
flowchart TD
    A[開始] --> B[終了]
\`\`\`

Mermaidテスト完了。`;
    }
    
    // テキストエリアを探して入力
    const textareas = await page.locator('textarea').count();
    console.log(`📝 Textareas found: ${textareas}`);
    
    if (textareas > 0) {
      const textarea = page.locator('textarea').first();
      await textarea.fill(sampleContent);
      console.log('✅ Sample Mermaid content inserted');
      
      // 少し待機してレンダリングを確認
      await page.waitForTimeout(3000);
      
      // ページ全体のコンテンツを確認
      const pageText = await page.textContent('body');
      
      // Mermaidコードブロックが含まれているかチェック
      const hasMermaidCode = pageText.includes('```mermaid') || pageText.includes('flowchart');
      console.log(`🔍 Mermaid code present: ${hasMermaidCode}`);
      
      // SVG画像が生成されていないことを確認（無効状態）
      const svgImages = await page.locator('img[src*="data:image/svg"]').count();
      const mermaidImages = await page.locator('img[alt*="Mermaid"]').count();
      
      console.log(`🖼️ SVG images: ${svgImages}`);
      console.log(`🔍 Mermaid images: ${mermaidImages}`);
      
      // 期待値: コードは存在するが、画像は生成されない（機能無効）
      expect(hasMermaidCode).toBe(true);
      expect(svgImages + mermaidImages).toBe(0);
      
      console.log('✅ Mermaid correctly disabled - code preserved, no rendering');
      
    } else {
      console.log('⚠️ No textarea found - checking alternative input methods');
      
      // 代替の入力要素をチェック
      const contentEditables = await page.locator('[contenteditable="true"]').count();
      const textInputs = await page.locator('input[type="text"]').count();
      
      console.log(`📝 Contenteditable elements: ${contentEditables}`);
      console.log(`📝 Text inputs: ${textInputs}`);
      
      if (contentEditables > 0) {
        const editor = page.locator('[contenteditable="true"]').first();
        await editor.fill(sampleContent);
        console.log('✅ Content inserted via contenteditable');
      }
    }
  });

  test('コンソールエラーチェック', async ({ page }) => {
    test.setTimeout(30000);
    
    console.log('🧪 Test: Console Error Monitoring');
    
    const errors = [];
    const warnings = [];
    
    // コンソールメッセージを監視
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        errors.push(text);
        console.log(`❌ Console Error: ${text}`);
      } else if (type === 'warning') {
        warnings.push(text);
        console.log(`⚠️ Console Warning: ${text}`);
      }
    });
    
    // ページを再読み込みしてエラーを監視
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(5000);
    
    console.log(`📊 Total errors: ${errors.length}`);
    console.log(`📊 Total warnings: ${warnings.length}`);
    
    // Mermaid関連のエラーがないことを確認
    const mermaidErrors = errors.filter(error => 
      error.toLowerCase().includes('mermaid') || 
      error.toLowerCase().includes('svg') ||
      error.toLowerCase().includes('render')
    );
    
    console.log(`🔍 Mermaid-related errors: ${mermaidErrors.length}`);
    
    if (mermaidErrors.length > 0) {
      console.log('Mermaid errors found:');
      mermaidErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    // クリティカルエラーがないことを確認（警告は許容）
    expect(mermaidErrors.length).toBe(0);
    
    console.log('✅ No Mermaid-related console errors detected');
  });

});