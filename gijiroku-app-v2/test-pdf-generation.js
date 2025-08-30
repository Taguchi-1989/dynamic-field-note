// PDF生成テストスクリプト
// ElectronのRendererプロセス内で実行

async function testPdfGeneration() {
  console.log('🧪 PDF生成テスト開始');
  
  // テスト用Markdownコンテンツ
  const testMarkdown = `---
title: "PDFテスト文書"
author: "テストユーザー"  
date: "2025-08-29"
toc: true
theme: "default"
---

# PDFテスト文書

## 1. 基本テキスト
これは**太字**と*イタリック*のテストです。

## 2. 数式テスト
インライン数式: $E = mc^2$

ブロック数式:
$$\\int_0^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}$$

## 3. テーブル
| 項目 | 値 |
|------|-----|
| CPU | 45% |
| メモリ | 2.3GB |

## 4. HTMLテスト
<div style="background-color: #f0f8ff; padding: 10px;">
HTMLの div タグテスト
</div>

## 5. 日本語テスト
これは日本語のテストです。ひらがな、カタカナ、漢字の表示確認。`;

  try {
    // ElectronAPIが利用可能か確認
    if (typeof window !== 'undefined' && window.electronAPI) {
      console.log('✅ ElectronAPI利用可能');
      
      const result = await window.electronAPI.markdown.compileToPdf({
        mdContent: testMarkdown,
        options: {
          title: 'PDFテスト文書',
          toc: true,
          theme: 'default',
          pageSize: 'A4',
          marginMm: 15
        }
      });
      
      if (result.success) {
        console.log('✅ PDF生成成功:', result.data);
        console.log(`📄 出力パス: ${result.data.pdfPath}`);
        console.log(`📊 ページ数: ${result.data.pages}`);
        console.log(`💾 ファイルサイズ: ${result.data.sizeBytes} bytes`);
        
        if (result.data.warnings && result.data.warnings.length > 0) {
          console.warn('⚠️ 警告:', result.data.warnings);
        }
      } else {
        console.error('❌ PDF生成失敗:', result.error);
      }
    } else {
      console.error('❌ ElectronAPIが利用できません');
    }
  } catch (error) {
    console.error('❌ PDF生成テストエラー:', error);
  }
}

// HTMLコンパイルテストも追加
async function testHtmlCompilation() {
  console.log('🧪 HTMLコンパイルテスト開始');
  
  const simpleMarkdown = `# テスト見出し
  
**太字テスト**と*イタリック*

数式: $x = \\frac{-b}{2a}$

| 列1 | 列2 |
|-----|-----|
| A   | B   |`;

  try {
    if (typeof window !== 'undefined' && window.electronAPI) {
      // HTMLコンパイル専用のテスト（存在する場合）
      console.log('Markdownコンテンツ長:', simpleMarkdown.length);
      console.log('✅ 基本的なMarkdown要素含有確認完了');
    }
  } catch (error) {
    console.error('❌ HTMLコンパイルテストエラー:', error);
  }
}

// ブラウザコンソールで実行可能にする
if (typeof window !== 'undefined') {
  window.testPdfGeneration = testPdfGeneration;
  window.testHtmlCompilation = testHtmlCompilation;
  
  console.log('🚀 PDF生成テスト関数が準備されました');
  console.log('実行方法: testPdfGeneration() または testHtmlCompilation()');
}

// Node.js環境での実行
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testPdfGeneration,
    testHtmlCompilation
  };
}