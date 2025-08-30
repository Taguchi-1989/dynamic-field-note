/**
 * 実際のLLM API通信テスト
 * Gemini API と OpenAI API の実際の接続・処理テスト
 */

const { app } = require('electron');
const fs = require('fs');
const path = require('path');

async function testRealLLMAPIs() {
  console.log('🌐 実際のLLM API通信テスト開始');
  
  try {
    await app.whenReady();
    console.log('✅ Electron app ready');

    // 環境変数から実際のAPIキーを確認
    const geminiKey = process.env.VITE_GEMINI_API_KEY;
    const openaiKey = process.env.VITE_OPENAI_API_KEY;
    
    console.log('🔑 API キー確認:');
    console.log(`  Gemini: ${geminiKey ? geminiKey.substring(0, 20) + '...' : 'なし'}`);
    console.log(`  OpenAI: ${openaiKey ? openaiKey.substring(0, 20) + '...' : 'なし'}`);

    // AIProcessingServiceを取得
    console.log('🤖 AIProcessingService 初期化中...');
    const { AIProcessingService } = require('../dist-electron/main.cjs');
    const aiService = AIProcessingService.getInstance();

    // テスト用短文
    const testText = `会議の内容を要約してください。

参加者: 田中、佐藤、山田
議題: プロジェクト進捗確認
決定事項:
- 来週までにドラフト完成
- 次回会議は金曜日
- 各自タスク整理

以上です。`;

    console.log('\n📝 テストテキスト:');
    console.log(testText.substring(0, 100) + '...');

    const testResults = {
      gemini: null,
      openai: null,
      errors: []
    };

    // === Gemini API テスト ===
    if (geminiKey && geminiKey !== 'mock_gemini_api_key_for_development') {
      console.log('\n🧪 Gemini API テスト開始...');
      try {
        const geminiStartTime = Date.now();
        const geminiResult = await aiService.processText(
          testText,
          'revision', // プロンプトテンプレートID
          undefined,
          {
            provider: 'gemini',
            model: 'gemini-1.5-flash',
            temperature: 0.7,
            maxTokens: 1000,
            timeout: 30000
          }
        );
        const geminiDuration = Date.now() - geminiStartTime;

        console.log('✅ Gemini API 成功!');
        console.log(`⏱️ 処理時間: ${geminiDuration}ms`);
        console.log(`📊 使用プロバイダー: ${geminiResult.provider}`);
        console.log(`🎯 出力長: ${geminiResult.processedText.length}文字`);
        console.log('📝 処理結果プレビュー:');
        console.log(geminiResult.processedText.substring(0, 200) + '...');
        
        testResults.gemini = {
          success: true,
          duration: geminiDuration,
          outputLength: geminiResult.processedText.length,
          provider: geminiResult.provider,
          preview: geminiResult.processedText.substring(0, 100)
        };

      } catch (geminiError) {
        console.log('❌ Gemini API エラー:');
        console.log(`  エラー: ${geminiError.message}`);
        testResults.errors.push(`Gemini: ${geminiError.message}`);
        testResults.gemini = { success: false, error: geminiError.message };
      }
    } else {
      console.log('⚠️ Gemini API キーが設定されていません (Mock環境)');
      testResults.gemini = { success: false, error: 'API key not set' };
    }

    // === OpenAI API テスト ===
    if (openaiKey && openaiKey !== 'mock_openai_api_key_for_development') {
      console.log('\n🧪 OpenAI API テスト開始...');
      try {
        const openaiStartTime = Date.now();
        const openaiResult = await aiService.processText(
          testText,
          'revision',
          undefined,
          {
            provider: 'openai',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 1000,
            timeout: 30000
          }
        );
        const openaiDuration = Date.now() - openaiStartTime;

        console.log('✅ OpenAI API 成功!');
        console.log(`⏱️ 処理時間: ${openaiDuration}ms`);
        console.log(`📊 使用プロバイダー: ${openaiResult.provider}`);
        console.log(`🎯 出力長: ${openaiResult.processedText.length}文字`);
        console.log('📝 処理結果プレビュー:');
        console.log(openaiResult.processedText.substring(0, 200) + '...');
        
        testResults.openai = {
          success: true,
          duration: openaiDuration,
          outputLength: openaiResult.processedText.length,
          provider: openaiResult.provider,
          preview: openaiResult.processedText.substring(0, 100)
        };

      } catch (openaiError) {
        console.log('❌ OpenAI API エラー:');
        console.log(`  エラー: ${openaiError.message}`);
        testResults.errors.push(`OpenAI: ${openaiError.message}`);
        testResults.openai = { success: false, error: openaiError.message };
      }
    } else {
      console.log('⚠️ OpenAI API キーが設定されていません (Mock環境)');
      testResults.openai = { success: false, error: 'API key not set' };
    }

    // === 利用可能プロバイダー確認 ===
    console.log('\n📋 利用可能プロバイダー確認...');
    const availableProviders = await aiService.getAvailableProviders();
    console.log('🔌 利用可能プロバイダー:', availableProviders);

    // === 結果評価 ===
    console.log('\n🎯 テスト結果サマリー:');
    const geminiSuccess = testResults.gemini?.success || false;
    const openaiSuccess = testResults.openai?.success || false;
    
    console.log(`  Gemini API: ${geminiSuccess ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`  OpenAI API: ${openaiSuccess ? '✅ 成功' : '❌ 失敗'}`);
    console.log(`  利用可能プロバイダー数: ${availableProviders.length}`);
    
    if (testResults.errors.length > 0) {
      console.log('\n⚠️ 発生したエラー:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }

    // テスト結果をファイルに保存
    const resultPath = path.join(__dirname, 'llm-api-test-results.json');
    const resultData = {
      timestamp: new Date().toISOString(),
      testResults,
      availableProviders,
      success: geminiSuccess || openaiSuccess
    };
    fs.writeFileSync(resultPath, JSON.stringify(resultData, null, 2));
    console.log(`\n📋 詳細結果保存: ${resultPath}`);

    return resultData;

  } catch (error) {
    console.error('❌ テスト実行エラー:', error.message);
    return { success: false, error: error.message };
  } finally {
    setTimeout(() => app.quit(), 2000);
  }
}

// 環境変数の確認とテスト実行
console.log('🔍 環境変数確認:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  VITE_MOCK_MODE:', process.env.VITE_MOCK_MODE);

testRealLLMAPIs().then(result => {
  console.log('\n🏁 最終結果:');
  if (result.success) {
    console.log('🎉 少なくとも1つのLLM APIが正常に動作しています');
    console.log('📊 実際のAI処理 → PDF生成の流れが確立されました');
  } else {
    console.log('⚠️ LLM API接続に問題があります');
    console.log('💡 APIキーの設定やネットワーク接続を確認してください');
  }
});