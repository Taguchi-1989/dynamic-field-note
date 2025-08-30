// ChunkingServiceのテスト実行スクリプト
import { readFileSync } from 'fs';

// テスト用のチューリングサービス（簡易版）
class TestChunkingService {
  constructor() {
    this.defaultConfig = {
      maxChunkSize: 300,     // テスト用: 300文字
      overlapSize: 50,       // テスト用: 50文字
      splitOnSentence: true,
      preserveSpeakers: true
    };
  }

  async chunkText(text, config = {}) {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    
    console.log('🔄 Starting text chunking...', {
      textLength: text.length,
      maxChunkSize: finalConfig.maxChunkSize,
      overlapSize: finalConfig.overlapSize
    });

    const cleanText = text.trim();
    const totalCharacters = cleanText.length;

    const chunks = await this.performChunking(cleanText, finalConfig);
    
    const processingTime = Date.now() - startTime;
    
    console.log('✅ Chunking completed', {
      totalChunks: chunks.length,
      totalCharacters,
      processingTime: `${processingTime}ms`
    });

    return {
      chunks,
      totalChunks: chunks.length,
      totalCharacters,
      processingTime,
      config: finalConfig
    };
  }

  async performChunking(text, config) {
    const chunks = [];
    const { maxChunkSize, overlapSize, splitOnSentence, preserveSpeakers } = config;
    
    let currentPosition = 0;
    let chunkIndex = 0;

    while (currentPosition < text.length) {
      const chunkId = `chunk-${chunkIndex.toString().padStart(3, '0')}`;
      
      const baseEndPosition = Math.min(currentPosition + maxChunkSize, text.length);
      let actualEndPosition = baseEndPosition;
      
      if (splitOnSentence && actualEndPosition < text.length) {
        actualEndPosition = this.adjustForSentenceBoundary(text, currentPosition, actualEndPosition);
      }
      
      let chunkText = text.substring(currentPosition, actualEndPosition);
      
      const speakers = preserveSpeakers ? this.extractSpeakers(chunkText) : [];
      
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
      
      if (actualEndPosition >= text.length) {
        break;
      }
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
    console.log('🔄 Starting chunk merging...');
    
    if (processedChunks.length === 0) {
      return '';
    }
    
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
    
    console.log('✅ Chunk merging completed');
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

  displayChunkingResult(result) {
    console.log('\n🔍 Chunking Result Analysis:');
    console.log(`Total characters: ${result.totalCharacters}`);
    console.log(`Total chunks: ${result.totalChunks}`);
    console.log(`Processing time: ${result.processingTime}ms`);
    console.log(`Config:`, result.config);
    
    result.chunks.forEach((chunk, index) => {
      console.log(`\n--- Chunk ${index + 1} (${chunk.id}) ---`);
      console.log(`Length: ${chunk.text.length} chars`);
      console.log(`Position: ${chunk.startPosition}-${chunk.endPosition}`);
      console.log(`Speakers: [${chunk.speakers.join(', ')}]`);
      console.log(`Text preview: "${chunk.text.substring(0, 100)}..."`);
      
      if (chunk.overlapStart) {
        console.log(`Overlap start: "${chunk.overlapStart.substring(0, 30)}..."`);
      }
      if (chunk.overlapEnd) {
        console.log(`Overlap end: "${chunk.overlapEnd.substring(0, 30)}..."`);
      }
    });
  }
}

// テスト実行
async function runTest() {
  try {
    console.log('🚀 ChunkingService Test Starting...\n');

    // VTTファイルを読み込み
    const vttContent = readFileSync('./test-chunking-1000chars.vtt', 'utf-8');
    const textOnly = extractVttTextOnly(vttContent);
    
    console.log('📄 Original VTT Text:');
    console.log(`Length: ${textOnly.length} characters`);
    console.log(`Preview: "${textOnly.substring(0, 200)}..."`);
    console.log();

    // ChunkingServiceのテスト
    const chunkingService = new TestChunkingService();
    const result = await chunkingService.chunkText(textOnly, {
      maxChunkSize: 300,
      overlapSize: 50
    });

    // 結果の表示
    chunkingService.displayChunkingResult(result);

    // 統合テスト（模擬LLM処理結果）
    console.log('\n🔄 Testing chunk merging...');
    const mockProcessedChunks = result.chunks.map(chunk => ({
      chunkId: chunk.id,
      processedText: `【処理済み】${chunk.text}` // 模擬処理
    }));

    const mergedText = chunkingService.mergeChunks(mockProcessedChunks, result.chunks);
    console.log('\n📄 Merged Result:');
    console.log(`Length: ${mergedText.length} characters`);
    console.log(`Preview: "${mergedText.substring(0, 300)}..."`);

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// VTT解析関数（簡易版）
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

// テスト実行
runTest().catch(console.error);