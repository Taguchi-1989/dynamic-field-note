/**
 * 要約実行フック
 * Phase 1: PoC で使用
 *
 * 音声バッファ → Gemini API → Markdown の統合フロー
 */

import { useState, useCallback } from 'react';
import { summarizeText } from '../services/geminiService';
import { jsonToMarkdown } from '../utils/markdownGenerator';
import type { SummaryJSON } from '../types/summary';

/**
 * 要約状態
 */
interface SummarizeState {
  /** 要約中かどうか */
  isLoading: boolean;
  /** エラーメッセージ */
  error: string | null;
  /** 要約結果（JSON） */
  summary: SummaryJSON | null;
  /** Markdown形式の要約 */
  markdown: string;
  /** 処理時間（ミリ秒） */
  processingTime: number;
}

/**
 * フックオプション
 */
interface UseSummarizeOptions {
  /** 進捗コールバック（0-1の値） */
  onProgress?: (progress: number) => void;
}

/**
 * フックの戻り値
 */
interface UseSummarizeReturn extends SummarizeState {
  /** 要約を実行 */
  executeSummarize: (text: string) => Promise<void>;
  /** 状態をクリア */
  clearSummary: () => void;
  /** 再試行 */
  retry: () => Promise<void>;
  /** 進捗率（0-1） */
  progress: number;
}

/**
 * 要約実行フック
 *
 * @param options - フックオプション
 * @returns 要約実行機能と状態
 *
 * @example
 * ```tsx
 * const {
 *   isLoading,
 *   error,
 *   markdown,
 *   progress,
 *   executeSummarize
 * } = useSummarize({
 *   onProgress: (p) => console.log(`進捗: ${p * 100}%`)
 * });
 *
 * const handleSummarize = async () => {
 *   await executeSummarize(fullText);
 * };
 * ```
 */
export const useSummarize = (options?: UseSummarizeOptions): UseSummarizeReturn => {
  const [state, setState] = useState<SummarizeState>({
    isLoading: false,
    error: null,
    summary: null,
    markdown: '',
    processingTime: 0,
  });

  const [lastText, setLastText] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  /**
   * 要約を実行
   */
  const executeSummarize = useCallback(
    async (text: string) => {
      if (!text || text.trim() === '') {
        setState((prev) => ({
          ...prev,
          error: 'テキストが空です',
        }));
        return;
      }

      setLastText(text);
      setProgress(0);
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      try {
        // 進捗シミュレーション: API呼び出し準備
        setProgress(0.1);
        options?.onProgress?.(0.1);

        // 進捗: API呼び出し中
        setProgress(0.3);
        options?.onProgress?.(0.3);

        // Gemini API で要約
        const response = await summarizeText({
          text,
          language: 'ja',
        });

        // 進捗: レスポンス受信完了
        setProgress(0.7);
        options?.onProgress?.(0.7);

        // Markdown に変換
        const markdown = jsonToMarkdown(response.summary, {
          title: '現場報告',
          includeDate: true,
          includeRawText: false,
        });

        // 進捗: 完了
        setProgress(1.0);
        options?.onProgress?.(1.0);

        setState({
          isLoading: false,
          error: null,
          summary: response.summary,
          markdown,
          processingTime: response.processing_time,
        });
      } catch (error) {
        if (__DEV__) {
          console.error('要約エラー:', error);
        }
        setProgress(0);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : '要約に失敗しました',
        }));
      }
    },
    [options]
  );

  /**
   * 状態をクリア
   */
  const clearSummary = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      summary: null,
      markdown: '',
      processingTime: 0,
    });
    setLastText('');
  }, []);

  /**
   * 再試行
   */
  const retry = useCallback(async () => {
    if (lastText) {
      await executeSummarize(lastText);
    }
  }, [lastText, executeSummarize]);

  return {
    ...state,
    executeSummarize,
    clearSummary,
    retry,
    progress,
  };
};
