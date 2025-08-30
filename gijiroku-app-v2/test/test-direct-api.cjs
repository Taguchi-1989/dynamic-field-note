/**
 * 直接API通信テスト (Node.js環境)
 * Electronのservice経由ではなくAPIに直接通信してテスト
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// .envファイルから読み込み
require('dotenv').config();

async function testGeminiAPI() {
  console.log('🔍 Gemini API直接通信テスト');
  
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'なし'}`);
  
  if (!apiKey || apiKey === 'mock_gemini_api_key_for_development') {
    return { success: false, error: 'APIキーが設定されていません' };
  }
  
  const testText = `会議の内容を要約してください。
  
参加者: 田中、佐藤、山田
議題: プロジェクト進捗確認
決定事項:
- 来週までにドラフト完成  
- 次回会議は金曜日
- 各自タスク整理

以上です。`;

  try {
    const startTime = Date.now();
    
    const requestData = {
      contents: [{
        parts: [{ 
          text: `以下の会議録をより読みやすく、簡潔に要約してください。重要なポイントを整理し、箇条書きで出力してください。

${testText}` 
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 10
      }
    };

    console.log('📡 Gemini API 送信中...');
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000
      }
    );

    const duration = Date.now() - startTime;
    
    if (response.data && response.data.candidates && response.data.candidates[0]) {
      const generatedText = response.data.candidates[0].content.parts[0].text;
      
      console.log('✅ Gemini API 成功!');
      console.log(`⏱️ 応答時間: ${duration}ms`);
      console.log(`📊 出力長: ${generatedText.length}文字`);
      console.log('\n📝 生成結果:');
      console.log('=' .repeat(50));
      console.log(generatedText);
      console.log('=' .repeat(50));
      
      return {
        success: true,
        duration,
        outputLength: generatedText.length,
        generatedText,
        rawResponse: response.data
      };
    } else {
      return { success: false, error: '応答が空です', response: response.data };
    }
    
  } catch (error) {
    console.log('❌ Gemini API エラー:');
    if (error.response) {
      console.log(`  ステータス: ${error.response.status}`);
      console.log(`  エラー詳細: ${JSON.stringify(error.response.data, null, 2)}`);
      return { 
        success: false, 
        error: `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}` 
      };
    } else {
      console.log(`  エラー: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

async function testOpenAIAPI() {
  console.log('\n🔍 OpenAI API直接通信テスト');
  
  const apiKey = process.env.VITE_OPENAI_API_KEY;
  console.log(`🔑 API Key: ${apiKey ? apiKey.substring(0, 20) + '...' : 'なし'}`);
  
  if (!apiKey || apiKey === 'mock_openai_api_key_for_development') {
    return { success: false, error: 'APIキーが設定されていません' };
  }
  
  const testText = `会議の内容を要約してください。
  
参加者: 田中、佐藤、山田
議題: プロジェクト進捗確認
決定事項:
- 来週までにドラフト完成  
- 次回会議は金曜日
- 各自タスク整理

以上です。`;

  try {
    const startTime = Date.now();
    
    const requestData = {
      model: "gpt-3.5-turbo",
      messages: [{
        role: "user",
        content: `以下の会議録をより読みやすく、簡潔に要約してください。重要なポイントを整理し、箇条書きで出力してください。

${testText}`
      }],
      temperature: 0.7,
      max_tokens: 1000
    };

    console.log('📡 OpenAI API 送信中...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      requestData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      }
    );

    const duration = Date.now() - startTime;
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      const generatedText = response.data.choices[0].message.content;
      
      console.log('✅ OpenAI API 成功!');
      console.log(`⏱️ 応答時間: ${duration}ms`);
      console.log(`📊 出力長: ${generatedText.length}文字`);
      console.log(`🎯 使用トークン: ${response.data.usage?.total_tokens || '不明'}`);
      console.log('\n📝 生成結果:');
      console.log('=' .repeat(50));
      console.log(generatedText);
      console.log('=' .repeat(50));
      
      return {
        success: true,
        duration,
        outputLength: generatedText.length,
        generatedText,
        usage: response.data.usage,
        rawResponse: response.data
      };
    } else {
      return { success: false, error: '応答が空です', response: response.data };
    }
    
  } catch (error) {
    console.log('❌ OpenAI API エラー:');
    if (error.response) {
      console.log(`  ステータス: ${error.response.status}`);
      console.log(`  エラー詳細: ${JSON.stringify(error.response.data, null, 2)}`);
      return { 
        success: false, 
        error: `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}` 
      };
    } else {
      console.log(`  エラー: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

async function main() {
  console.log('🌐 LLM API 直接通信テスト開始');
  console.log('📅 実行日時:', new Date().toISOString());
  
  const results = {
    timestamp: new Date().toISOString(),
    gemini: null,
    openai: null
  };
  
  // Gemini APIテスト
  results.gemini = await testGeminiAPI();
  
  // OpenAI APIテスト  
  results.openai = await testOpenAIAPI();
  
  // 結果サマリー
  console.log('\n🎯 テスト結果サマリー:');
  console.log(`  Gemini API: ${results.gemini.success ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`  OpenAI API: ${results.openai.success ? '✅ 成功' : '❌ 失敗'}`);
  
  if (results.gemini.success) {
    console.log(`    - 応答時間: ${results.gemini.duration}ms`);
    console.log(`    - 出力長: ${results.gemini.outputLength}文字`);
  }
  
  if (results.openai.success) {
    console.log(`    - 応答時間: ${results.openai.duration}ms`);
    console.log(`    - 出力長: ${results.openai.outputLength}文字`);
    console.log(`    - トークン使用: ${results.openai.usage?.total_tokens || '不明'}`);
  }
  
  // 結果をファイルに保存
  const resultPath = path.join(__dirname, 'direct-api-test-results.json');
  fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
  console.log(`\n📋 詳細結果保存: ${resultPath}`);
  
  // 総合評価
  const overallSuccess = results.gemini.success || results.openai.success;
  console.log(`\n🏁 総合評価: ${overallSuccess ? '✅ 成功' : '❌ 失敗'}`);
  
  if (overallSuccess) {
    console.log('🎉 少なくとも1つのLLM APIが正常に動作しています');
    console.log('📊 実際のAI処理機能が利用可能です');
  } else {
    console.log('⚠️ どのLLM APIも接続できませんでした');
    console.log('💡 APIキーの設定やネットワーク接続を確認してください');
  }
}

main().catch(console.error);