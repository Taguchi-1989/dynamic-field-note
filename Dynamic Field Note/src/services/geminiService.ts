/**
 * Gemini API サービス
 * Phase 1: PoC で使用
 *
 * 機能:
 * - テキストの要約
 * - JSON形式での構造化出力
 * - エラーハンドリング・リトライ
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SummaryJSON, SummarizeRequest, SummarizeResponse, APIError } from '../types/summary';

/**
 * Gemini API 設定
 */
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const MODEL_NAME = 'gemini-2.0-flash-exp';
// const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000', 10); // Future use
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1秒

/**
 * Gemini API インスタンス
 */
let genAI: GoogleGenerativeAI | null = null;

/**
 * Gemini API を初期化
 */
const initializeGemini = (): GoogleGenerativeAI => {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'EXPO_PUBLIC_GEMINI_API_KEY が設定されていません。.env.local を確認してください。'
    );
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  }

  return genAI;
};

/**
 * 要約プロンプトを生成
 */
const createSummarizePrompt = (text: string, language: 'ja' | 'en' = 'ja'): string => {
  const prompts = {
    ja: `
以下の現場メモを要約してください。

【要求事項】
1. 決定事項（decisions）: 確定した内容を箇条書きで抽出
2. ToDo（todos）: 実行すべきタスクを箇条書きで抽出
3. 課題（issues）: 問題点や懸念事項を箇条書きで抽出
4. 元のテキスト（raw_text）: 入力テキストをそのまま保持

【出力形式】
以下のJSON形式で返してください：
\`\`\`json
{
  "decisions": ["決定事項1", "決定事項2"],
  "todos": ["ToDo1", "ToDo2"],
  "issues": ["課題1", "課題2"],
  "raw_text": "元のテキスト",
  "created_at": "ISO 8601形式の日時"
}
\`\`\`

【現場メモ】
${text}
`,
    en: `
Please summarize the following field notes.

【Requirements】
1. Decisions: Extract confirmed items in bullet points
2. ToDos: Extract tasks to be executed in bullet points
3. Issues: Extract problems and concerns in bullet points
4. Raw text: Keep the original text as is

【Output Format】
Please return in the following JSON format:
\`\`\`json
{
  "decisions": ["Decision 1", "Decision 2"],
  "todos": ["ToDo 1", "ToDo 2"],
  "issues": ["Issue 1", "Issue 2"],
  "raw_text": "Original text",
  "created_at": "ISO 8601 datetime"
}
\`\`\`

【Field Notes】
${text}
`,
  };

  return prompts[language];
};

/**
 * JSONレスポンスをパース
 */
const parseJSONResponse = (text: string): SummaryJSON => {
  try {
    // コードブロックを除去
    const jsonText = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(jsonText);

    // 必須フィールドの検証
    if (!parsed.decisions || !parsed.todos || !parsed.issues) {
      throw new Error('必須フィールドが不足しています');
    }

    return {
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      todos: Array.isArray(parsed.todos) ? parsed.todos : [],
      issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      raw_text: parsed.raw_text || '',
      created_at: parsed.created_at || new Date().toISOString(),
    };
  } catch (error) {
    console.error('JSON parse error:', error);
    throw new Error('Gemini APIのレスポンスをパースできませんでした');
  }
};

/**
 * リトライ付きAPI呼び出し
 */
const callWithRetry = async <T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn(`API call failed, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) =>
        setTimeout(resolve, RETRY_DELAY * (MAX_RETRIES - retries + 1))
      );
      return callWithRetry(fn, retries - 1);
    }
    throw error;
  }
};

/**
 * テキストを要約
 *
 * @param request - 要約リクエスト
 * @returns 要約レスポンス
 * @throws APIError
 *
 * @example
 * ```typescript
 * const response = await summarizeText({
 *   text: '現場での打ち合わせ内容...',
 *   language: 'ja'
 * });
 * console.log(response.summary.decisions);
 * ```
 */
export const summarizeText = async (request: SummarizeRequest): Promise<SummarizeResponse> => {
  const startTime = Date.now();

  try {
    // API初期化
    const genAI = initializeGemini();
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // プロンプト生成
    const prompt = createSummarizePrompt(request.text, request.language || 'ja');

    // API呼び出し（リトライ付き）
    const result = await callWithRetry(async () => {
      const response = await model.generateContent(prompt);
      return response.response.text();
    });

    // レスポンスをパース
    const summary = parseJSONResponse(result);

    const processingTime = Date.now() - startTime;

    return {
      summary,
      processing_time: processingTime,
      model: 'gemini-2.5-pro',
    };
  } catch (error) {
    console.error('Gemini API error:', error);

    const apiError: APIError = {
      message: error instanceof Error ? error.message : 'Gemini API呼び出しに失敗しました',
      code: 'GEMINI_API_ERROR',
      details: error instanceof Error ? error.stack : undefined,
    };

    throw apiError;
  }
};

/**
 * APIキーが設定されているか確認
 */
export const isGeminiConfigured = (): boolean => {
  return GEMINI_API_KEY !== '';
};

/**
 * API接続テスト
 */
export const testGeminiConnection = async (): Promise<boolean> => {
  try {
    const response = await summarizeText({
      text: 'これはテストです。',
      language: 'ja',
    });
    return response.summary !== null;
  } catch (error) {
    console.error('Gemini connection test failed:', error);
    return false;
  }
};
