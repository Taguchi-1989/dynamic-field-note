/**
 * AIProcessingService - オフライン・ローカル統合AI処理サービス
 * 
 * バックエンド・外部API依存を排除し、設定可能なAI処理環境を提供
 * - フォールバックモード（オフライン完全対応）
 * - 設定可能なAPI統合（Gemini、OpenAI等）
 * - プロンプトテンプレート管理統合
 * - エラーハンドリング・リトライ機能
 */

import axios from 'axios';
import { SecureStorageService } from './SecureStorageService';
import { WorkspaceService } from './WorkspaceService';
import { DbService } from './DbService';
import { ChunkingService, ChunkingConfig, ChunkingResult, ProcessingProgress } from './ChunkingService';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface AIProcessingOptions {
  provider: 'gemini' | 'openai' | 'offline' | 'mock';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  enableChunking?: boolean;  // 分割処理の有効化
  chunkingConfig?: Partial<ChunkingConfig>;  // 分割設定
  onProgress?: (progress: ProcessingProgress) => void;  // 進捗コールバック
}

export interface AIProcessingResult {
  processedText: string;
  provider: string;
  model?: string;
  tokens?: number;
  processingTime: number;
  warnings?: string[];
  chunkingResult?: ChunkingResult;  // 分割処理結果
  totalChunks?: number;  // 処理されたチャンク数
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  is_active: boolean;
  content: string;
}

export class AIProcessingService {
  private static instance: AIProcessingService;
  private secureStorage: SecureStorageService;
  private workspaceService: WorkspaceService;
  private dbService: DbService;
  private chunkingService: ChunkingService;
  private defaultOptions: AIProcessingOptions = {
    provider: 'offline',
    temperature: 0.7,
    maxTokens: 8192,
    timeout: 60000,
    enableChunking: false
  };

  private constructor() {
    this.secureStorage = SecureStorageService.getInstance();
    this.workspaceService = WorkspaceService.getInstance();
    this.dbService = DbService.getInstance();
    this.chunkingService = ChunkingService.getInstance();
  }

  public static getInstance(): AIProcessingService {
    if (!AIProcessingService.instance) {
      AIProcessingService.instance = new AIProcessingService();
    }
    return AIProcessingService.instance;
  }

  /**
   * テキスト処理のメインAPI（分割処理対応）
   */
  async processText(
    inputText: string, 
    templateId: string, 
    customPrompt?: string,
    options?: Partial<AIProcessingOptions>
  ): Promise<AIProcessingResult> {
    const startTime = Date.now();
    const processingOptions = { ...this.defaultOptions, ...options };
    const warnings: string[] = [];

    try {
      console.log(`🤖 AI処理開始 - Provider: ${processingOptions.provider}`);
      console.log(`📊 入力テキスト: ${inputText.length}文字`);

      // プロンプトテンプレートの取得
      const template = await this.getPromptTemplate(templateId);
      const prompt = customPrompt || template?.content || this.getDefaultPrompt();

      // 分割処理の判定
      const shouldUseChunking = processingOptions.enableChunking && inputText.length > 500;
      
      let result: AIProcessingResult;

      if (shouldUseChunking) {
        console.log('🔄 分割処理を実行します...');
        result = await this.processWithChunking(inputText, prompt, processingOptions);
      } else {
        console.log('🔄 通常処理を実行します...');
        result = await this.processSingle(inputText, prompt, processingOptions);
      }

      result.processingTime = Date.now() - startTime;
      result.warnings = warnings;

      console.log(`✅ AI処理完了 - ${result.processingTime}ms`);
      return result;

    } catch (error) {
      console.error('❌ AI処理エラー:', error);
      
      // フォールバック処理
      if (processingOptions.provider !== 'offline') {
        console.log('🔄 オフライン処理にフォールバック...');
        warnings.push(`${processingOptions.provider}処理失敗、オフライン処理に切り替え`);
        
        return await this.processOffline(
          inputText, 
          customPrompt || this.getDefaultPrompt(), 
          { ...processingOptions, provider: 'offline' }
        );
      }
      
      throw error;
    }
  }

  /**
   * 分割処理を使用したAI処理
   */
  private async processWithChunking(
    inputText: string,
    prompt: string,
    options: AIProcessingOptions
  ): Promise<AIProcessingResult> {
    const chunkingConfig = {
      maxChunkSize: options.provider === 'mock' ? 300 : 5000,  // モック用300文字、本番用5000文字
      overlapSize: options.provider === 'mock' ? 50 : 100,
      splitOnSentence: true,
      preserveSpeakers: true,
      ...options.chunkingConfig
    };

    // 1. テキストを分割
    console.log('🔄 Step 1: テキスト分割中...');
    const chunkingResult = await this.chunkingService.chunkText(inputText, chunkingConfig);
    
    // 進捗状況の初期化
    const progress: ProcessingProgress = {
      totalChunks: chunkingResult.totalChunks,
      processedChunks: 0,
      currentChunk: 0,
      status: 'processing',
      estimatedTimeLeft: 0,
      errorCount: 0
    };

    options.onProgress?.(progress);

    // 2. 各チャンクをLLMで処理
    console.log(`🔄 Step 2: ${chunkingResult.totalChunks}個のチャンクをLLM処理中...`);
    const processedChunks: Array<{ chunkId: string; processedText: string }> = [];
    const chunkStartTime = Date.now();
    
    for (let i = 0; i < chunkingResult.chunks.length; i++) {
      const chunk = chunkingResult.chunks[i];
      
      // 進捗更新
      progress.currentChunk = i + 1;
      progress.estimatedTimeLeft = this.calculateEstimatedTime(i, chunkingResult.totalChunks, chunkStartTime);
      progress.currentChunkText = chunk.text.substring(0, 50) + '...';
      options.onProgress?.(progress);

      try {
        console.log(`🔄 チャンク ${i + 1}/${chunkingResult.totalChunks} を処理中...`);
        
        const singleResult = await this.processSingle(chunk.text, prompt, options);
        
        processedChunks.push({
          chunkId: chunk.id,
          processedText: singleResult.processedText
        });

        progress.processedChunks = i + 1;
        options.onProgress?.(progress);

        // API制限を考慮した遅延
        if (options.provider === 'gemini' || options.provider === 'openai') {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒待機
        }

      } catch (error) {
        console.error(`❌ チャンク ${i + 1} の処理エラー:`, error);
        progress.errorCount++;
        
        // エラー時は元のテキストを使用（フォールバック）
        processedChunks.push({
          chunkId: chunk.id,
          processedText: chunk.text
        });
      }
    }

    // 3. 結果を統合
    console.log('🔄 Step 3: 結果統合中...');
    progress.status = 'merging';
    options.onProgress?.(progress);

    const mergedText = this.chunkingService.mergeChunks(processedChunks, chunkingResult.chunks);

    progress.status = 'completed';
    options.onProgress?.(progress);

    return {
      processedText: mergedText,
      provider: options.provider,
      model: options.model,
      processingTime: 0, // 後で設定
      chunkingResult,
      totalChunks: chunkingResult.totalChunks
    };
  }

  /**
   * 通常の単一処理
   */
  private async processSingle(
    inputText: string,
    prompt: string,
    options: AIProcessingOptions
  ): Promise<AIProcessingResult> {
    switch (options.provider) {
      case 'gemini':
        return await this.processWithGemini(inputText, prompt, options);
      case 'openai':
        return await this.processWithOpenAI(inputText, prompt, options);
      case 'mock':
        return await this.processWithMock(inputText, prompt, options);
      default:
        return await this.processOffline(inputText, prompt, options);
    }
  }

  /**
   * 残り時間の推定計算
   */
  private calculateEstimatedTime(processed: number, total: number, startTime: number): number {
    if (processed === 0) return 0;
    
    const elapsed = Date.now() - startTime;
    const averageTime = elapsed / processed;
    const remaining = total - processed;
    
    return Math.round((remaining * averageTime) / 1000); // 秒単位で返す
  }

  /**
   * Gemini APIを使用した処理
   */
  private async processWithGemini(
    text: string, 
    prompt: string, 
    options: AIProcessingOptions
  ): Promise<AIProcessingResult> {
    let apiKey = await this.secureStorage.getCredential('gemini_api_key');
    
    // フォールバック: 環境変数からAPIキーを取得
    if (!apiKey) {
      apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      console.log('🔑 Using Gemini API key from environment variables');
    }
    
    if (!apiKey) {
      throw new Error('Gemini API key not found in SecureStorage or environment variables');
    }

    const request = {
      contents: [{
        parts: [{ text: `${prompt}\n\n${text}` }]
      }],
      generationConfig: {
        temperature: options.temperature,
        maxOutputTokens: options.maxTokens
      }
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      request,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: options.timeout
      }
    );

    if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid Gemini API response');
    }

    return {
      processedText: response.data.candidates[0].content.parts[0].text.trim(),
      provider: 'gemini',
      model: 'gemini-2.0-flash',
      processingTime: 0
    };
  }

  /**
   * OpenAI APIを使用した処理
   */
  private async processWithOpenAI(
    text: string, 
    prompt: string, 
    options: AIProcessingOptions
  ): Promise<AIProcessingResult> {
    let apiKey = await this.secureStorage.getCredential('openai_api_key');
    
    // フォールバック: 環境変数からAPIキーを取得
    if (!apiKey) {
      apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
      console.log('🔑 Using OpenAI API key from environment variables');
    }
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found in SecureStorage or environment variables');
    }

    const request = {
      model: options.model || 'gpt-5',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text }
      ],
      temperature: options.temperature,
      max_tokens: options.maxTokens
    };

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      request,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: options.timeout
      }
    );

    if (!response.data.choices?.[0]?.message?.content) {
      throw new Error('Invalid OpenAI API response');
    }

    return {
      processedText: response.data.choices[0].message.content.trim(),
      provider: 'openai',
      model: options.model || 'gpt-5',
      tokens: response.data.usage?.total_tokens,
      processingTime: 0
    };
  }

  /**
   * モック処理（デモ・テスト用）
   */
  private async processWithMock(
    text: string, 
    prompt: string, 
    options: AIProcessingOptions
  ): Promise<AIProcessingResult> {
    // 1-3秒の擬似処理時間
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const mockResult = this.generateMockResult(text);

    return {
      processedText: mockResult,
      provider: 'mock',
      model: 'mock-ai-v1',
      processingTime: 0
    };
  }

  /**
   * オフライン処理（ルールベース）
   */
  private async processOffline(
    text: string, 
    prompt: string, 
    options: AIProcessingOptions
  ): Promise<AIProcessingResult> {
    console.log('🔧 オフライン処理でテキストを修正中...');

    let processedText = text;

    // 基本的な音声認識修正
    processedText = this.applyBasicCorrections(processedText);

    // 議事録フォーマット化
    processedText = this.formatAsMinutes(processedText);

    return {
      processedText,
      provider: 'offline',
      model: 'rule-based-v1',
      processingTime: 0
    };
  }

  /**
   * 基本的なテキスト修正（音声認識エラー対応）
   */
  private applyBasicCorrections(text: string): string {
    let corrected = text;

    // 話し言葉の削除
    corrected = corrected.replace(/\b(えーと|あのー|そのー|まあ|ちょっと)\b/g, '');
    
    // 重複表現の簡素化
    corrected = corrected.replace(/(.{1,10}?)\1{2,}/g, '$1');
    
    // 一般的な音声認識誤り修正
    const corrections = [
      ['かんぎ', '会議'],
      ['ぎじろく', '議事録'],
      ['さんかしゃ', '参加者'],
      ['しつもん', '質問'],
      ['かいとう', '回答'],
      ['けってい', '決定'],
      ['つぎかい', '次回'],
    ];

    corrections.forEach(([wrong, correct]) => {
      corrected = corrected.replace(new RegExp(wrong, 'g'), correct);
    });

    // 改行・スペース正規化
    corrected = corrected.replace(/\n{3,}/g, '\n\n');
    corrected = corrected.replace(/[ ]{2,}/g, ' ');
    
    return corrected.trim();
  }

  /**
   * 議事録形式への変換
   */
  private formatAsMinutes(text: string): string {
    const lines = text.split('\n').filter(line => line.trim());
    let formatted = '';

    formatted += '# 会議議事録\n\n';
    formatted += `**作成日時**: ${new Date().toLocaleDateString('ja-JP')}\n`;
    formatted += `**処理方式**: オフライン処理\n\n`;
    formatted += '## 会議内容\n\n';

    // 簡単な構造化
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed.length > 10) {
        if (trimmed.includes('質問') || trimmed.includes('？')) {
          formatted += `**Q**: ${trimmed}\n\n`;
        } else if (trimmed.includes('回答') || trimmed.includes('答え')) {
          formatted += `**A**: ${trimmed}\n\n`;
        } else {
          formatted += `- ${trimmed}\n`;
        }
      }
    });

    formatted += '\n## 備考\n\n';
    formatted += 'この議事録はオフライン処理により自動生成されました。\n';
    formatted += '必要に応じて手動で修正してください。\n';

    return formatted;
  }

  /**
   * モック結果生成
   */
  private generateMockResult(originalText: string): string {
    const mockHeader = `# 会議議事録（モック処理）

**日時**: ${new Date().toLocaleDateString('ja-JP')}
**処理**: AI模擬処理
**元テキスト長**: ${originalText.length}文字

## 処理結果

`;

    const mockContent = originalText
      .replace(/えーと|あのー|そのー/g, '')
      .replace(/\n{2,}/g, '\n\n')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => `- ${line}`)
      .join('\n');

    return mockHeader + mockContent + '\n\n**注記**: これはモック処理による結果です。';
  }

  /**
   * プロンプトテンプレート取得
   */
  private async getPromptTemplate(templateId: string): Promise<PromptTemplate | null> {
    try {
      const { paths } = await this.workspaceService.resolve();
      console.log('🔍 Workspace paths:', JSON.stringify(paths, null, 2));
      
      if (!paths.templates) {
        console.error('❌ templates path is undefined:', paths);
        console.log('🔄 Using fallback template path...');
        
        // フォールバック: 直接パスを構築
        const { root } = await this.workspaceService.resolve();
        const fallbackTemplatePath = path.join(root, 'templates', `${templateId}.json`);
        console.log('📁 Fallback template path:', fallbackTemplatePath);
        
        const content = await fs.readFile(fallbackTemplatePath, 'utf-8');
        return JSON.parse(content) as PromptTemplate;
      }
      
      const templatePath = path.join(paths.templates, `${templateId}.json`);
      console.log('📁 Template path:', templatePath);
      
      const content = await fs.readFile(templatePath, 'utf-8');
      return JSON.parse(content) as PromptTemplate;
    } catch (error) {
      console.warn(`テンプレート ${templateId} が見つかりません:`, error);
      return null;
    }
  }

  /**
   * デフォルトプロンプト
   */
  private getDefaultPrompt(): string {
    return `あなたは専門的な議事録編集者です。以下のテキストを修正してください。

修正ルール:
- 誤字脱字を修正
- 話し言葉を自然な文章に変換
- 構造化された議事録形式に整理
- Markdown形式で出力

余計な説明は含めず、修正されたテキストのみを出力してください。`;
  }

  /**
   * テキスト再修正
   */
  async reviseText(
    originalText: string, 
    revisionNotes: string, 
    options?: Partial<AIProcessingOptions>
  ): Promise<AIProcessingResult> {
    const revisionPrompt = `以下のテキストを、指定された修正指示に従って修正してください。

修正指示: ${revisionNotes}

修正対象テキスト:
${originalText}

修正指示に正確に従い、Markdownフォーマットで出力してください。`;

    return await this.processText('', 'revision', revisionPrompt, options);
  }

  /**
   * 利用可能なプロバイダー一覧取得
   */
  async getAvailableProviders(): Promise<string[]> {
    const providers = ['offline', 'mock'];
    
    // API キーの存在確認
    try {
      const geminiKey = await this.secureStorage.getCredential('gemini_api_key');
      if (geminiKey) providers.push('gemini');
      
      const openaiKey = await this.secureStorage.getCredential('openai_api_key');
      if (openaiKey) providers.push('openai');
    } catch (error) {
      console.warn('API キー確認中にエラー:', error);
    }
    
    return providers;
  }
}