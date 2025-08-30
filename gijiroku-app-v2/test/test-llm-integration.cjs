/**
 * LLM API連携統合テスト
 * マークダウン直接入力 → LLM処理 → PDF生成の一連の流れをテスト
 */

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

async function testLLMIntegration() {
  console.log('🤖 LLM API連携統合テスト開始');
  
  try {
    await app.whenReady();
    console.log('✅ Electron app ready');

    // テストマークダウンファイルを読み込み
    const testMdPath = path.join(__dirname, 'markdown-test-data.md');
    const originalMarkdown = fs.readFileSync(testMdPath, 'utf-8');
    console.log(`📄 テストファイル読み込み: ${originalMarkdown.length}文字`);

    // サービスの取得
    const { AIProcessingService, PdfGenerationService } = require('../dist-electron/main.cjs');
    
    console.log('🧪 テストケース1: Mock AIプロバイダーでの処理');
    const aiService = AIProcessingService.getInstance();
    const pdfService = PdfGenerationService.getInstance();
    
    // Mock AIでマークダウンを処理
    console.log('🤖 AI処理開始 (Mock provider)...');
    const aiResult = await aiService.processText(
      originalMarkdown,
      'revision', // プロンプトテンプレートID
      undefined,  // カスタムプロンプト
      {
        provider: 'mock',
        enableChunking: false
      }
    );
    
    console.log(`✅ AI処理完了: ${aiResult.processedText.length}文字`);
    console.log(`⏱️ 処理時間: ${aiResult.processingTime}ms`);
    console.log(`🔧 使用プロバイダー: ${aiResult.provider}`);
    
    // AI処理結果をPDF化
    console.log('📄 PDF生成開始...');
    const pdfResult = await pdfService.generatePdfFromMarkdown({
      mdContent: aiResult.processedText,
      options: {
        title: 'LLM統合テスト結果',
        toc: true,
        theme: 'default'
      }
    });
    
    console.log('✅ PDF生成完了');
    console.log(`📁 保存先: ${pdfResult.pdfPath}`);
    console.log(`📊 PDFサイズ: ${pdfResult.sizeBytes} bytes`);
    console.log(`📖 ページ数: ${pdfResult.pages}`);
    
    // テストケース2: Gemini APIが利用可能かテスト
    console.log('\\n🧪 テストケース2: 利用可能なプロバイダー確認');
    const availableProviders = await aiService.getAvailableProviders();
    console.log('📋 利用可能プロバイダー:', availableProviders);
    
    // Gemini API がある場合のテスト
    if (availableProviders.includes('gemini')) {
      console.log('🚀 Gemini API利用可能 - 実際のAPI処理テスト');
      try {
        const geminiResult = await aiService.processText(
          '# テスト\\n\\nこれは短いテストです。',
          'revision',
          undefined,
          {
            provider: 'gemini',
            timeout: 10000,
            temperature: 0.7
          }
        );
        console.log('✅ Gemini API処理成功');
        console.log(`📝 結果: ${geminiResult.processedText.substring(0, 100)}...`);
      } catch (error) {
        console.log('⚠️ Gemini API処理失敗:', error.message);
      }
    } else {
      console.log('💡 Gemini API未設定 - Mock結果のみ');
    }
    
    // 結果の評価
    console.log('\\n🎯 テスト結果評価:');
    const success = 
      aiResult.processedText.length > 0 &&
      pdfResult.sizeBytes > 1000 &&
      availableProviders.length > 0;
    
    if (success) {
      console.log('🎉 LLM統合テスト: SUCCESS');
      console.log('  - AI処理: ✅');
      console.log('  - PDF生成: ✅');
      console.log('  - プロバイダー確認: ✅');
    } else {
      console.log('❌ LLM統合テスト: FAILED');
    }
    
    return { success, aiResult, pdfResult, availableProviders };
    
  } catch (error) {
    console.error('❌ LLM統合テスト失敗:', error);
    return { success: false, error: error.message };
  } finally {
    setTimeout(() => app.quit(), 2000);
  }
}

// テスト実行
testLLMIntegration().then(result => {
  console.log('\\n📊 最終テスト結果:');
  console.log(JSON.stringify({
    success: result.success,
    aiProcessingTime: result.aiResult?.processingTime,
    pdfSize: result.pdfResult?.sizeBytes,
    providers: result.availableProviders
  }, null, 2));
});