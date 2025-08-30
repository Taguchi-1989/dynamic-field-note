/**
 * ChunkingService - VTT分割処理専用サービス
 * 
 * LLMの「lost in the middle」問題を防ぐため、テキストを適切に分割
 * - オーバーラップ処理で内容欠落防止
 * - 話者情報の保持
 * - 進捗管理機能
 */

export interface ChunkingConfig {
  maxChunkSize: number;        // デフォルト: 300文字（テスト用）
  overlapSize: number;         // デフォルト: 50文字（テスト用）
  splitOnSentence: boolean;    // 文単位分割
  preserveSpeakers: boolean;   // 話者情報保持
}

export interface TextChunk {
  id: string;                  // チャンクID
  text: string;                // 分割されたテキスト
  startPosition: number;       // 元テキスト内の開始位置
  endPosition: number;         // 元テキスト内の終了位置
  speakers: string[];          // このチャンクに含まれる話者
  overlapStart?: string;       // 前のチャンクとの重複部分（先頭）
  overlapEnd?: string;         // 次のチャンクとの重複部分（末尾）
}

export interface ChunkingResult {
  chunks: TextChunk[];         // 分割されたテキスト配列
  totalChunks: number;         // 総分割数
  totalCharacters: number;     // 元テキスト総文字数
  processingTime: number;      // 分割処理時間
  config: ChunkingConfig;      // 使用された設定
}

export interface ProcessingProgress {
  totalChunks: number;         // 総分割数
  processedChunks: number;     // 完了数
  currentChunk: number;        // 現在処理中
  status: 'chunking' | 'processing' | 'merging' | 'completed' | 'error';
  estimatedTimeLeft: number;   // 残り時間(秒)
  errorCount: number;          // エラー数
  currentChunkText?: string;   // 現在処理中のチャンクテキスト（最初の50文字）
}

export class ChunkingService {
  private static instance: ChunkingService;
  
  // テスト用デフォルト設定
  private defaultConfig: ChunkingConfig = {
    maxChunkSize: 300,         // テスト用: 300文字
    overlapSize: 50,           // テスト用: 50文字
    splitOnSentence: true,     // 文単位分割を優先
    preserveSpeakers: true     // 話者情報を保持
  };

  private constructor() {}

  public static getInstance(): ChunkingService {
    if (!ChunkingService.instance) {
      ChunkingService.instance = new ChunkingService();
    }
    return ChunkingService.instance;
  }

  /**
   * VTTテキストを分割処理
   */
  public async chunkText(
    text: string,
    config: Partial<ChunkingConfig> = {}
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    
    console.log('🔄 Starting text chunking...', {
      textLength: text.length,
      maxChunkSize: finalConfig.maxChunkSize,
      overlapSize: finalConfig.overlapSize
    });

    // テキストの前処理（時刻除去は既に完了している前提）
    const cleanText = text.trim();
    const totalCharacters = cleanText.length;

    // 分割処理実行
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

  /**
   * 実際の分割処理
   */
  private async performChunking(
    text: string,
    config: ChunkingConfig
  ): Promise<TextChunk[]> {
    const chunks: TextChunk[] = [];
    const { maxChunkSize, overlapSize, splitOnSentence, preserveSpeakers } = config;
    
    let currentPosition = 0;
    let chunkIndex = 0;

    while (currentPosition < text.length) {
      const chunkId = `chunk-${chunkIndex.toString().padStart(3, '0')}`;
      
      // チャンクの基本範囲を決定
      const baseEndPosition = Math.min(currentPosition + maxChunkSize, text.length);
      let actualEndPosition = baseEndPosition;
      
      // 文単位分割が有効な場合、文の区切りで調整
      if (splitOnSentence && actualEndPosition < text.length) {
        actualEndPosition = this.adjustForSentenceBoundary(text, currentPosition, actualEndPosition);
      }
      
      // チャンクテキストを抽出
      let chunkText = text.substring(currentPosition, actualEndPosition);
      
      // 話者情報の抽出
      const speakers = preserveSpeakers ? this.extractSpeakers(chunkText) : [];
      
      // オーバーラップ処理
      const overlapInfo = this.calculateOverlap(
        text, 
        currentPosition, 
        actualEndPosition, 
        overlapSize,
        chunks.length > 0 ? chunks[chunks.length - 1] : null
      );
      
      // チャンク情報を作成
      const chunk: TextChunk = {
        id: chunkId,
        text: chunkText,
        startPosition: currentPosition,
        endPosition: actualEndPosition,
        speakers,
        overlapStart: overlapInfo.overlapStart,
        overlapEnd: overlapInfo.overlapEnd
      };
      
      chunks.push(chunk);
      
      // 次のチャンクの開始位置を計算（オーバーラップを考慮）
      currentPosition = Math.max(currentPosition + 1, actualEndPosition - overlapSize);
      chunkIndex++;
      
      // 最後のチャンクの場合は終了
      if (actualEndPosition >= text.length) {
        break;
      }
    }

    return chunks;
  }

  /**
   * 文の区切りでチャンク境界を調整
   */
  private adjustForSentenceBoundary(
    text: string,
    startPos: number,
    endPos: number
  ): number {
    // 文末記号で区切る
    const sentenceEndings = /[。！？．!?]/g;
    const searchText = text.substring(startPos, endPos + 50); // 少し余分に検索
    const matches = Array.from(searchText.matchAll(sentenceEndings));
    
    if (matches.length > 0) {
      // 最後の文末記号の位置を使用
      const lastMatch = matches[matches.length - 1];
      const adjustedEnd = startPos + lastMatch.index! + 1;
      
      // 元の終了位置より大幅に短くならないように制限
      if (adjustedEnd >= startPos + (endPos - startPos) * 0.7) {
        return Math.min(adjustedEnd, text.length);
      }
    }
    
    return endPos;
  }

  /**
   * 話者情報を抽出
   */
  private extractSpeakers(text: string): string[] {
    const speakers: Set<string> = new Set();
    
    // 「話者: 内容」形式の話者を抽出
    const speakerPattern = /^([^：:]+)[：:]\s*/gm;
    const matches = text.matchAll(speakerPattern);
    
    for (const match of matches) {
      const speaker = match[1].trim();
      if (speaker && speaker.length <= 20) { // 話者名として妥当な長さ
        speakers.add(speaker);
      }
    }
    
    return Array.from(speakers);
  }

  /**
   * オーバーラップ情報を計算
   */
  private calculateOverlap(
    fullText: string,
    startPos: number,
    endPos: number,
    overlapSize: number,
    previousChunk: TextChunk | null
  ): { overlapStart?: string; overlapEnd?: string } {
    const result: { overlapStart?: string; overlapEnd?: string } = {};
    
    // 前のチャンクとの重複（チャンクの開始部分）
    if (previousChunk && startPos > 0) {
      const overlapStart = Math.max(0, startPos - overlapSize);
      result.overlapStart = fullText.substring(overlapStart, startPos);
    }
    
    // 次のチャンクとの重複（チャンクの終了部分）
    if (endPos < fullText.length) {
      const overlapEnd = Math.min(fullText.length, endPos + overlapSize);
      result.overlapEnd = fullText.substring(endPos, overlapEnd);
    }
    
    return result;
  }

  /**
   * 分割結果をマージして元のテキストを復元
   * （LLM処理後の統合で使用）
   */
  public mergeChunks(
    processedChunks: Array<{ chunkId: string; processedText: string }>,
    originalChunks: TextChunk[]
  ): string {
    console.log('🔄 Starting chunk merging...');
    
    if (processedChunks.length === 0) {
      return '';
    }
    
    // チャンクIDでソート
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
      
      // 最初のチャンク以外では、重複部分を除去
      if (i > 0 && originalChunk.overlapStart) {
        chunkText = this.removeOverlapFromStart(chunkText, originalChunk.overlapStart);
      }
      
      // 最後のチャンク以外では、末尾の重複部分を保持
      // （次のチャンクで除去される）
      
      mergedText += chunkText;
      
      // チャンク間に改行を追加（必要に応じて）
      if (i < sortedProcessed.length - 1) {
        if (!chunkText.endsWith('\n') && !chunkText.endsWith('\n\n')) {
          mergedText += '\n';
        }
      }
    }
    
    console.log('✅ Chunk merging completed');
    return mergedText.trim();
  }

  /**
   * テキストの先頭からオーバーラップ部分を除去
   */
  private removeOverlapFromStart(text: string, overlapText: string): string {
    if (!overlapText) return text;
    
    // オーバーラップ部分を先頭から検索して除去
    const overlapLength = overlapText.length;
    const textStart = text.substring(0, Math.min(text.length, overlapLength * 2));
    
    // 完全一致での除去を試行
    if (textStart.startsWith(overlapText)) {
      return text.substring(overlapLength);
    }
    
    // 部分一致での除去を試行（70%以上一致）
    const threshold = Math.floor(overlapLength * 0.7);
    for (let i = threshold; i <= overlapLength; i++) {
      const partialOverlap = overlapText.substring(0, i);
      if (textStart.startsWith(partialOverlap)) {
        return text.substring(i);
      }
    }
    
    return text;
  }

  /**
   * テスト用: 分割結果の表示
   */
  public displayChunkingResult(result: ChunkingResult): void {
    console.log('\n🔍 Chunking Result Analysis:');
    console.log(`Total characters: ${result.totalCharacters}`);
    console.log(`Total chunks: ${result.totalChunks}`);
    console.log(`Processing time: ${result.processingTime}ms`);
    console.log(`Config: ${JSON.stringify(result.config, null, 2)}`);
    
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