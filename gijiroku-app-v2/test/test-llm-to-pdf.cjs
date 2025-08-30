/**
 * LLM処理結果→PDF生成統合テスト
 * 実際のLLM APIで処理した結果をPDF化するテスト
 */

const { app, BrowserWindow } = require('electron');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function processWithGemini(text) {
  const apiKey = process.env.VITE_GEMINI_API_KEY;
  
  const requestData = {
    contents: [{
      parts: [{ 
        text: `以下の会議録を読みやすく整理してください。Markdown形式で出力し、見出しと箇条書きを適切に使用してください：

${text}` 
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500
    }
  };

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    requestData,
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    }
  );

  if (response.data && response.data.candidates && response.data.candidates[0]) {
    return response.data.candidates[0].content.parts[0].text;
  }
  throw new Error('Gemini API response is empty');
}

async function testLLMToPDF() {
  console.log('🤖📄 LLM処理結果→PDF生成統合テスト開始');
  
  try {
    await app.whenReady();
    console.log('✅ Electron app ready');

    // テスト用の議事録データ
    const rawMeetingText = `会議議事録
日時: 2024年8月30日 14:00-16:00
場所: オンライン会議室
参加者: 田中(プロジェクトマネージャー)、佐藤(開発リーダー)、山田(デザイナー)、鈴木(営業担当)

議題1: PDF生成機能の改善について
- MermaidWorkerのタイムアウト問題が解決された
- 見出しの文字間隔が修正された
- マークダウン直接入力に対応済み
- LLM API連携も正常に動作している

議題2: 次回リリースに向けて
田中: テスト結果はどうでしょうか？
佐藤: 基本的なPDF生成は355msで完了し、高度な設定でも707msと高速です
山田: UIも改善され、ユーザビリティが向上しました
鈴木: クライアントからの要望も満たせそうです

決定事項:
1. 来週までに最終テストを完了
2. 9月5日にリリース予定
3. ドキュメントの更新も並行して実施
4. 各自担当タスクを整理して進める

次回会議: 9月3日(火) 15:00〜

以上`;

    console.log('📝 元データ:', rawMeetingText.length, '文字');

    // Step 1: Gemini APIで処理
    console.log('\n🤖 Gemini APIで議事録を整理中...');
    const geminiStartTime = Date.now();
    const processedText = await processWithGemini(rawMeetingText);
    const geminiDuration = Date.now() - geminiStartTime;
    
    console.log('✅ Gemini処理完了');
    console.log(`⏱️ 処理時間: ${geminiDuration}ms`);
    console.log(`📊 出力長: ${processedText.length}文字`);
    console.log('\n📝 処理結果プレビュー:');
    console.log('='.repeat(60));
    console.log(processedText.substring(0, 300) + '...');
    console.log('='.repeat(60));

    // Step 2: 処理結果をPDF化
    console.log('\n📄 処理結果をPDF化中...');
    const pdfWindow = new BrowserWindow({ 
      show: false,
      width: 1200,
      height: 1600
    });

    // HTMLテンプレートを作成
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Noto Sans JP', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: none;
            margin: 0;
            padding: 20mm;
          }
          
          h1, h2, h3, h4, h5, h6 {
            letter-spacing: normal !important;
            word-spacing: normal !important;
            font-weight: 600;
            line-height: 1.3;
            margin: 0.8em 0 0.4em 0;
          }
          
          h1 { 
            font-size: 1.8em; 
            margin-top: 0;
            margin-bottom: 0.6em;
            border-bottom: 2px solid #333;
            padding-bottom: 0.3em;
          }
          
          h2 { 
            font-size: 1.5em; 
            margin-top: 1.2em;
            margin-bottom: 0.5em;
            color: #2c3e50;
          }
          
          h3 { 
            font-size: 1.3em;
            color: #34495e;
          }
          
          ul, ol {
            padding-left: 24px;
            margin: 12px 0;
          }
          
          li {
            margin: 6px 0;
          }
          
          p {
            margin: 12px 0;
          }
          
          .llm-processed {
            border: 2px solid #3498db;
            border-radius: 8px;
            padding: 16px;
            background: #f8f9fa;
            margin-bottom: 20px;
          }
          
          .metadata {
            font-size: 0.9em;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 16px;
            margin-top: 30px;
          }
        </style>
      </head>
      <body>
        <div class="llm-processed">
          <h1>🤖 LLM処理済み議事録</h1>
          <p><strong>処理エンジン:</strong> Gemini 1.5 Flash</p>
          <p><strong>処理時間:</strong> ${geminiDuration}ms</p>
          <p><strong>生成日時:</strong> ${new Date().toLocaleString('ja-JP')}</p>
        </div>
        
        <div id="content">
          ${processedText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}
        </div>
        
        <div class="metadata">
          <p><small>このドキュメントはLLM AI処理 → PDF生成統合テストにより生成されました</small></p>
        </div>
      </body>
      </html>
    `;

    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    const pdfStartTime = Date.now();
    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      format: 'A4',
      landscape: false,
      printBackground: true,
      scale: 1.0,
      margins: {
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5
      }
    });
    const pdfDuration = Date.now() - pdfStartTime;
    
    // PDFを保存
    const pdfPath = path.join(__dirname, 'llm-processed-meeting.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    console.log('✅ PDF生成完了');
    console.log(`📁 保存先: ${pdfPath}`);
    console.log(`📊 PDFサイズ: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    console.log(`⏱️ PDF生成時間: ${pdfDuration}ms`);
    
    pdfWindow.destroy();
    
    // 総合評価
    const totalDuration = geminiDuration + pdfDuration;
    console.log('\n🎯 統合テスト結果:');
    console.log(`  LLM処理: ✅ 成功 (${geminiDuration}ms)`);
    console.log(`  PDF生成: ✅ 成功 (${pdfDuration}ms)`);
    console.log(`  総合時間: ${totalDuration}ms`);
    console.log(`  最終出力: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
    
    // 結果をJSONで保存
    const resultData = {
      timestamp: new Date().toISOString(),
      llmProcessing: {
        provider: 'gemini',
        duration: geminiDuration,
        inputLength: rawMeetingText.length,
        outputLength: processedText.length
      },
      pdfGeneration: {
        duration: pdfDuration,
        sizeKB: Math.round(pdfBuffer.length / 1024),
        path: pdfPath
      },
      totalDuration,
      success: true
    };
    
    const resultPath = path.join(__dirname, 'llm-to-pdf-test-results.json');
    fs.writeFileSync(resultPath, JSON.stringify(resultData, null, 2));
    
    return resultData;
    
  } catch (error) {
    console.error('❌ テスト失敗:', error.message);
    return { success: false, error: error.message };
  } finally {
    setTimeout(() => app.quit(), 2000);
  }
}

testLLMToPDF().then(result => {
  console.log('\n🏁 最終結果:');
  if (result.success) {
    console.log('🎉 LLM処理→PDF生成統合テスト: SUCCESS');
    console.log('📊 実際のワークフロー全体が正常に動作しています');
    console.log(`⚡ 総処理時間: ${result.totalDuration}ms`);
    console.log(`📄 最終PDF: ${result.pdfGeneration.sizeKB}KB`);
  } else {
    console.log('❌ 統合テスト失敗');
    console.log(`エラー: ${result.error}`);
  }
});