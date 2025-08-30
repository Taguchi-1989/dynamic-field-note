// Gemini API + Chunking統合テストスクリプト
import { readFileSync, writeFileSync } from 'fs';
import axios from 'axios';

// 簡易版のChunkingService（テスト用）
class TestChunkingService {
  constructor() {
    this.defaultConfig = {
      maxChunkSize: 300,
      overlapSize: 50,
      splitOnSentence: true,
      preserveSpeakers: true
    };
  }

  async chunkText(text, config = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };
    const cleanText = text.trim();
    const chunks = await this.performChunking(cleanText, finalConfig);
    
    return {
      chunks,
      totalChunks: chunks.length,
      totalCharacters: cleanText.length,
      processingTime: 0,
      config: finalConfig
    };
  }

  async performChunking(text, config) {
    const chunks = [];
    const { maxChunkSize, overlapSize } = config;
    
    let currentPosition = 0;
    let chunkIndex = 0;

    while (currentPosition < text.length) {
      const chunkId = `chunk-${chunkIndex.toString().padStart(3, '0')}`;
      const baseEndPosition = Math.min(currentPosition + maxChunkSize, text.length);
      let actualEndPosition = baseEndPosition;
      
      if (actualEndPosition < text.length) {
        actualEndPosition = this.adjustForSentenceBoundary(text, currentPosition, actualEndPosition);
      }
      
      let chunkText = text.substring(currentPosition, actualEndPosition);
      const speakers = this.extractSpeakers(chunkText);
      
      const overlapInfo = this.calculateOverlap(
        text, 
        currentPosition, 
        actualEndPosition, 
        overlapSize,
        chunks.length > 0 ? chunks[chunks.length - 1] : null
      );
      
      const chunk = {
        id: chunkId,
        text: chunkText,
        startPosition: currentPosition,
        endPosition: actualEndPosition,
        speakers,
        overlapStart: overlapInfo.overlapStart,
        overlapEnd: overlapInfo.overlapEnd
      };
      
      chunks.push(chunk);
      currentPosition = Math.max(currentPosition + 1, actualEndPosition - overlapSize);
      chunkIndex++;
      
      if (actualEndPosition >= text.length) break;
    }

    return chunks;
  }

  adjustForSentenceBoundary(text, startPos, endPos) {
    const sentenceEndings = /[。！？．!?]/g;
    const searchText = text.substring(startPos, endPos + 50);
    const matches = Array.from(searchText.matchAll(sentenceEndings));
    
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      const adjustedEnd = startPos + lastMatch.index + 1;
      
      if (adjustedEnd >= startPos + (endPos - startPos) * 0.7) {
        return Math.min(adjustedEnd, text.length);
      }
    }
    
    return endPos;
  }

  extractSpeakers(text) {
    const speakers = new Set();
    const speakerPattern = /^([^：:]+)[：:]\s*/gm;
    const matches = text.matchAll(speakerPattern);
    
    for (const match of matches) {
      const speaker = match[1].trim();
      if (speaker && speaker.length <= 20) {
        speakers.add(speaker);
      }
    }
    
    return Array.from(speakers);
  }

  calculateOverlap(fullText, startPos, endPos, overlapSize, previousChunk) {
    const result = {};
    
    if (previousChunk && startPos > 0) {
      const overlapStart = Math.max(0, startPos - overlapSize);
      result.overlapStart = fullText.substring(overlapStart, startPos);
    }
    
    if (endPos < fullText.length) {
      const overlapEnd = Math.min(fullText.length, endPos + overlapSize);
      result.overlapEnd = fullText.substring(endPos, overlapEnd);
    }
    
    return result;
  }

  mergeChunks(processedChunks, originalChunks) {
    if (processedChunks.length === 0) return '';
    
    const sortedProcessed = processedChunks.sort((a, b) => 
      a.chunkId.localeCompare(b.chunkId)
    );
    
    let mergedText = '';
    
    for (let i = 0; i < sortedProcessed.length; i++) {
      const processed = sortedProcessed[i];
      const originalChunk = originalChunks.find(c => c.id === processed.chunkId);
      
      if (!originalChunk) {
        console.warn(`⚠️ Original chunk not found: ${processed.chunkId}`);
        continue;
      }
      
      let chunkText = processed.processedText;
      
      if (i > 0 && originalChunk.overlapStart) {
        chunkText = this.removeOverlapFromStart(chunkText, originalChunk.overlapStart);
      }
      
      mergedText += chunkText;
      
      if (i < sortedProcessed.length - 1) {
        if (!chunkText.endsWith('\n') && !chunkText.endsWith('\n\n')) {
          mergedText += '\n';
        }
      }
    }
    
    return mergedText.trim();
  }

  removeOverlapFromStart(text, overlapText) {
    if (!overlapText) return text;
    
    const overlapLength = overlapText.length;
    const textStart = text.substring(0, Math.min(text.length, overlapLength * 2));
    
    if (textStart.startsWith(overlapText)) {
      return text.substring(overlapLength);
    }
    
    const threshold = Math.floor(overlapLength * 0.7);
    for (let i = threshold; i <= overlapLength; i++) {
      const partialOverlap = overlapText.substring(0, i);
      if (textStart.startsWith(partialOverlap)) {
        return text.substring(i);
      }
    }
    
    return text;
  }
}

// Gemini API処理クラス
class TestGeminiProcessor {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  }

  async processText(text, prompt, options = {}) {
    const request = {
      contents: [{
        parts: [{ text: `${prompt}\n\n${text}` }]
      }],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2048
      }
    };

    const maxRetries = options.maxRetries || 3;
    const retryDelay = options.retryDelay || 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📤 Gemini API呼び出し中... (${text.length}文字${attempt > 1 ? ` - 試行${attempt}/${maxRetries}` : ''})`);
        
        const response = await axios.post(
          `${this.baseUrl}?key=${this.apiKey}`,
          request,
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: options.timeout || 30000
          }
        );

        if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error('Invalid Gemini API response');
        }

        const processedText = response.data.candidates[0].content.parts[0].text.trim();
        console.log(`✅ Gemini API処理完了 (${processedText.length}文字${attempt > 1 ? ` - 試行${attempt}で成功` : ''})`);
        
        return {
          processedText,
          provider: 'gemini',
          model: 'gemini-2.0-flash',
          processingTime: 0
        };

      } catch (error) {
        console.error(`❌ Gemini API エラー (試行${attempt}/${maxRetries}):`, error.response?.data?.error?.message || error.message);
        
        if (attempt === maxRetries) {
          throw error; // 最終試行で失敗した場合はエラーを投げる
        }
        
        // リトライする前に待機
        console.log(`⏳ ${retryDelay}ms待機後、リトライします...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
}

// 統合AI処理サービス（テスト版）
class TestAIProcessingService {
  constructor(apiKey) {
    this.chunkingService = new TestChunkingService();
    this.geminiProcessor = new TestGeminiProcessor(apiKey);
  }

  async processWithChunking(inputText, prompt, options = {}) {
    const chunkingConfig = {
      maxChunkSize: 300,
      overlapSize: 50,
      splitOnSentence: true,
      preserveSpeakers: true,
      ...options.chunkingConfig
    };

    // 1. テキストを分割
    console.log('🔄 Step 1: テキスト分割中...');
    const chunkingResult = await this.chunkingService.chunkText(inputText, chunkingConfig);
    console.log(`📊 分割結果: ${chunkingResult.totalChunks}個のチャンク`);
    
    // 2. 各チャンクをGemini APIで処理
    console.log(`🔄 Step 2: ${chunkingResult.totalChunks}個のチャンクをGemini処理中...`);
    const processedChunks = [];
    const startTime = Date.now();
    
    for (let i = 0; i < chunkingResult.chunks.length; i++) {
      const chunk = chunkingResult.chunks[i];
      
      try {
        console.log(`🔄 チャンク ${i + 1}/${chunkingResult.totalChunks} を処理中... (${chunk.text.length}文字)`);
        
        const result = await this.geminiProcessor.processText(chunk.text, prompt, {
          ...options,
          maxRetries: 3,
          retryDelay: 2000
        });
        
        processedChunks.push({
          chunkId: chunk.id,
          processedText: result.processedText
        });

        // API制限を考慮した遅延（Gemini Proは1分間に60リクエスト）
        if (i < chunkingResult.chunks.length - 1) {
          console.log('⏳ API制限対応のため1秒待機...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error(`❌ チャンク ${i + 1} の処理エラー:`, error.message);
        
        // エラー時は元のテキストを使用（フォールバック）
        // 重複を避けるため、オーバーラップ部分を考慮
        let fallbackText = chunk.text;
        
        // 前のチャンクとのオーバーラップがある場合、それを除去
        if (chunk.overlapStart && chunk.overlapStart.length > 0) {
          const overlapLength = chunk.overlapStart.length;
          const threshold = Math.floor(overlapLength * 0.7);
          
          for (let len = overlapLength; len >= threshold; len--) {
            const checkText = chunk.overlapStart.substring(0, len);
            if (fallbackText.startsWith(checkText)) {
              fallbackText = fallbackText.substring(len);
              break;
            }
          }
        }
        
        processedChunks.push({
          chunkId: chunk.id,
          processedText: `【API障害のため元テキスト使用】${fallbackText}`
        });
      }
    }

    // 3. 結果を統合
    console.log('🔄 Step 3: 結果統合中...');
    const mergedText = this.chunkingService.mergeChunks(processedChunks, chunkingResult.chunks);
    const processingTime = Date.now() - startTime;

    return {
      processedText: mergedText,
      provider: 'gemini',
      totalChunks: chunkingResult.totalChunks,
      processingTime,
      chunkingResult
    };
  }
}

// VTT解析関数
function extractVttTextOnly(content) {
  const lines = content.replace(/\r\n?/g, "\n").split("\n");
  const entries = [];
  let i = 0;
  
  while (i < lines.length && !lines[i].includes("-->")) i++;
  
  while (i < lines.length) {
    const tline = lines[i++] || "";
    if (!tline.includes("-->")) continue;
    
    const textLines = [];
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i++]);
    }
    while (i < lines.length && lines[i].trim() === "") i++;

    const full = textLines.join(" ").trim();
    let text = full;
    const colonIdx = full.indexOf(": ");
    if (colonIdx > 0 && colonIdx < 40) {
      const speaker = full.slice(0, colonIdx).trim();
      text = full.slice(colonIdx + 1).trim();
      entries.push(`${speaker}: ${text}`);
    } else if (full) {
      entries.push(text);
    }
  }
  
  return entries.join("\n");
}

// メインテスト実行
async function runGeminiChunkingTest() {
  try {
    console.log('🚀 Gemini + Chunking 統合テスト開始\n');

    // 1. Gemini APIキーの確認
    const geminiApiKey = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
    
    if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      console.log('❌ Gemini APIキーが設定されていません。');
      console.log('環境変数 GEMINI_API_KEY を設定するか、スクリプト内で直接設定してください。');
      console.log('\n例: export GEMINI_API_KEY="your-actual-api-key-here"');
      
      // モックモードでテスト継続
      console.log('🔄 モックモードでテストを継続します...\n');
      await runMockTest();
      return;
    }

    // 2. VTTファイルを読み込み
    const vttContent = readFileSync('./test-chunking-1000chars.vtt', 'utf-8');
    const textOnly = extractVttTextOnly(vttContent);
    
    console.log('📄 Original VTT Text:');
    console.log(`Length: ${textOnly.length} characters`);
    console.log(`Preview: "${textOnly.substring(0, 200)}..."`);
    console.log();

    // 3. AI処理サービスの初期化
    const aiService = new TestAIProcessingService(geminiApiKey);

    // 4. 議事録修正プロンプト
    const prompt = `あなたはプロの議事録編集者です。以下のテキストは会議の音声認識結果です。
以下のルールに従って、読みやすい議事録に修正し、Markdown形式で出力してください。

# ルール
- 誤字脱字を修正してください
- 「えーと」「あのー」など話し言葉は削除してください  
- 話者情報は保持してください
- 重要な決定事項は太字で強調してください
- 出力はMarkdown形式のみとし、余計な説明は含めないでください`;

    // 5. Gemini分割処理実行
    console.log('🤖 Gemini + Chunking処理開始...');
    const result = await aiService.processWithChunking(textOnly, prompt, {
      temperature: 0.3,
      maxTokens: 1024,
      chunkingConfig: {
        maxChunkSize: 300,
        overlapSize: 50
      }
    });

    // 6. 結果の表示・保存
    console.log('\n✅ 処理完了！');
    console.log(`📊 統計情報:`);
    console.log(`- 元テキスト: ${textOnly.length}文字`);
    console.log(`- 分割数: ${result.totalChunks}個`);
    console.log(`- 処理時間: ${result.processingTime}ms`);
    console.log(`- 結果テキスト: ${result.processedText.length}文字`);
    
    // 結果をファイルに保存
    const outputPath = './gemini-chunking-result.md';
    writeFileSync(outputPath, result.processedText, 'utf-8');
    console.log(`\n📝 結果を保存しました: ${outputPath}`);

    console.log('\n📄 処理結果プレビュー:');
    console.log('='.repeat(50));
    console.log(result.processedText.substring(0, 500));
    if (result.processedText.length > 500) {
      console.log('...(続く)');
    }
    console.log('='.repeat(50));

    console.log('\n🎉 Gemini + Chunking テスト成功！');

  } catch (error) {
    console.error('❌ テストに失敗しました:', error.message);
    console.log('\n🔄 デバッグ情報:');
    console.log('- Gemini APIキーが正しく設定されているか確認してください');
    console.log('- インターネット接続を確認してください');
    console.log('- API利用制限に達していないか確認してください');
  }
}

// モックテスト（APIキーなしでの動作確認）
async function runMockTest() {
  console.log('🧪 Mock Mode Test...');
  
  const vttContent = readFileSync('./test-chunking-1000chars.vtt', 'utf-8');
  const textOnly = extractVttTextOnly(vttContent);
  
  const chunkingService = new TestChunkingService();
  const result = await chunkingService.chunkText(textOnly, {
    maxChunkSize: 300,
    overlapSize: 50
  });

  console.log(`✅ Mock Test 完了:`);
  console.log(`- 元テキスト: ${textOnly.length}文字`);
  console.log(`- 分割数: ${result.totalChunks}個`);
  
  result.chunks.forEach((chunk, index) => {
    console.log(`  Chunk ${index + 1}: ${chunk.text.length}文字 [${chunk.speakers.join(', ')}]`);
  });
}

// テスト実行
runGeminiChunkingTest().catch(console.error);