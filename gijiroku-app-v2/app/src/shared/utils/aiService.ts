// 直接AI APIを呼び出すためのユーティリティ
import axios from 'axios';

interface GeminiRequest {
  contents: Array<{
    parts: Array<{
      text: string;
    }>;
  }>;
  generationConfig: {
    temperature: number;
    maxOutputTokens: number;
  };
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

export class DirectAIService {
  private geminiApiKey: string;
  private geminiBaseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor() {
    this.geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    
    if (!this.geminiApiKey) {
      console.warn('⚠️ VITE_GEMINI_API_KEY not found in environment variables');
    }
  }

  /**
   * Gemini APIを直接呼び出してテキストを処理
   */
  async processTextWithGemini(text: string, promptTemplate: string, customPrompt?: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // プロンプトを構築
    const systemPrompt = customPrompt || this.getDefaultPrompt(promptTemplate);
    const fullPrompt = `${systemPrompt}\n\n以下のテキストを修正してください：\n\n${text}`;

    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: fullPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    };

    try {
      console.log('🔗 Gemini APIを直接呼び出し中...');
      
      const response = await axios.post<GeminiResponse>(
        `${this.geminiBaseUrl}/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
        request,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      const correctedText = response.data.candidates[0].content.parts[0].text.trim();
      console.log('✅ Gemini APIから応答を受信');
      
      return correctedText;

    } catch (error) {
      console.error('❌ Gemini API呼び出しエラー:', error);
      throw error;
    }
  }

  /**
   * テキスト再修正をGemini APIで実行
   */
  async reviseTextWithGemini(originalText: string, revisionNotes: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const revisionPrompt = `以下のテキストを、追加の指示に従って修正してください。

修正指示: ${revisionNotes}

修正対象のテキスト:
${originalText}

修正指示に従って、テキストを適切に修正し、Markdown形式で出力してください。余計な説明は含めず、修正されたテキストのみを返してください。`;

    const request: GeminiRequest = {
      contents: [
        {
          parts: [
            {
              text: revisionPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192
      }
    };

    try {
      console.log('🔄 Gemini APIで再修正を実行中...');
      
      const response = await axios.post<GeminiResponse>(
        `${this.geminiBaseUrl}/gemini-2.0-flash:generateContent?key=${this.geminiApiKey}`,
        request,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      if (!response.data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error('Invalid response from Gemini API');
      }

      const revisedText = response.data.candidates[0].content.parts[0].text.trim();
      console.log('✅ Gemini APIで再修正完了');
      
      return revisedText;

    } catch (error) {
      console.error('❌ Gemini API再修正エラー:', error);
      throw error;
    }
  }

  /**
   * プロンプトテンプレートに基づいてデフォルトプロンプトを取得
   */
  private getDefaultPrompt(template: string): string {
    const prompts = {
      general_meeting: `あなたはプロの議事録編集者です。以下のテキストは会議の音声認識結果です。
以下のルールに従って、テキストを修正し、Markdown形式で出力してください。

# ルール
- 誤字脱字を修正してください
- 文脈に合わない単語を修正してください
- 話し言葉（「えーと」「あのー」など）を削除し、自然で読みやすい文章にしてください
- 話者情報は変更しないでください
- 出力はMarkdown形式のみとし、余計な説明は含めないでください

# Markdown書式要件
- 見出しには必ず「#」を使用して構造化してください
- 箇条書きには必ず「-」を使用してください
- 議題や決定事項は適切な見出しレベルで構造化してください`,
      
      custom: `カスタムプロンプトが指定されていません。一般的な議事録修正を行います。`
    };

    return prompts[template as keyof typeof prompts] || prompts.general_meeting;
  }

  /**
   * API利用可能性をチェック
   */
  isAvailable(): boolean {
    return Boolean(this.geminiApiKey);
  }
}

// シングルトンインスタンス
export const directAIService = new DirectAIService();