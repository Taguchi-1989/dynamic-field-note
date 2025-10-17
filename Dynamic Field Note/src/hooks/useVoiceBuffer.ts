/**
 * 音声入力バッファ管理フック
 * Phase 1: PoC で使用
 *
 * 機能:
 * - 5秒間隔でテキストをバッファに蓄積
 * - 5分または無音30秒で自動送信トリガー
 * - 手動送信・クリア機能
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * バッファ設定
 */
interface VoiceBufferConfig {
  /** バッファ更新間隔（ミリ秒） */
  bufferInterval?: number;
  /** 自動送信時間（ミリ秒） */
  autoSendInterval?: number;
  /** 無音検知時間（ミリ秒） */
  silenceThreshold?: number;
}

/**
 * バッファ状態
 * (内部使用のみ - 現在は未使用)
 */
// interface VoiceBufferState {
//   /** 現在のバッファ内容 */
//   buffer: string[];
//   /** 最後の入力からの経過時間 */
//   timeSinceLastInput: number;
//   /** 送信準備完了フラグ */
//   isReadyToSend: boolean;
//   /** 送信理由 */
//   sendReason: 'auto' | 'silence' | 'manual' | null;
// }

/**
 * フックの戻り値
 */
interface UseVoiceBufferReturn {
  /** バッファ配列 */
  buffer: string[];
  /** バッファの全テキスト */
  fullText: string;
  /** テキストを追加 */
  addText: (text: string) => void;
  /** バッファをクリア */
  clearBuffer: () => void;
  /** 手動送信 */
  triggerSend: () => void;
  /** 送信準備完了フラグ */
  isReadyToSend: boolean;
  /** 送信理由 */
  sendReason: 'auto' | 'silence' | 'manual' | null;
  /** 最後の入力からの経過時間（秒） */
  timeSinceLastInput: number;
}

/**
 * 音声入力バッファ管理フック
 *
 * @param config - バッファ設定
 * @param onSendReady - 送信準備完了時のコールバック
 * @returns バッファ管理機能
 *
 * @example
 * ```tsx
 * const { buffer, fullText, addText, clearBuffer, triggerSend, isReadyToSend } = useVoiceBuffer({
 *   bufferInterval: 5000,
 *   autoSendInterval: 300000, // 5分
 *   silenceThreshold: 30000,  // 30秒
 * }, (text, reason) => {
 *   console.log('送信準備完了:', text, '理由:', reason);
 *   // API呼び出しなど
 * });
 *
 * // テキスト入力時
 * <TextInput onChangeText={addText} />
 * ```
 */
export const useVoiceBuffer = (
  config: VoiceBufferConfig = {},
  onSendReady?: (text: string, reason: 'auto' | 'silence' | 'manual') => void
): UseVoiceBufferReturn => {
  // デフォルト設定
  const bufferInterval = config.bufferInterval ?? 5000; // 5秒
  const autoSendInterval = config.autoSendInterval ?? 300000; // 5分
  const silenceThreshold = config.silenceThreshold ?? 30000; // 30秒

  // State
  const [buffer, setBuffer] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState<string>('');
  const [timeSinceLastInput, setTimeSinceLastInput] = useState<number>(0);
  const [isReadyToSend, setIsReadyToSend] = useState<boolean>(false);
  const [sendReason, setSendReason] = useState<'auto' | 'silence' | 'manual' | null>(null);

  // Refs
  const lastInputTime = useRef<number>(0);
  const bufferStartTime = useRef<number>(0);
  const bufferTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * テキストをバッファに追加
   */
  const addText = useCallback(
    (text: string) => {
      if (!text || text.trim() === '') return;

      setCurrentText(text);
      lastInputTime.current = Date.now();
      setTimeSinceLastInput(0);

      // 無音タイマーをリセット
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // 新しい無音タイマーを開始
      silenceTimerRef.current = setTimeout(() => {
        // 無音30秒で送信トリガー
        setSendReason('silence');
        setIsReadyToSend(true);
      }, silenceThreshold);
    },
    [silenceThreshold]
  );

  /**
   * バッファをクリア
   */
  const clearBuffer = useCallback(() => {
    setBuffer([]);
    setCurrentText('');
    setIsReadyToSend(false);
    setSendReason(null);
    bufferStartTime.current = Date.now();
    lastInputTime.current = Date.now();
    setTimeSinceLastInput(0);

    // タイマーをクリア
    if (bufferTimerRef.current) clearTimeout(bufferTimerRef.current);
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current);
  }, []);

  /**
   * 手動送信トリガー
   */
  const triggerSend = useCallback(() => {
    if (buffer.length === 0 && currentText.trim() === '') return;

    setSendReason('manual');
    setIsReadyToSend(true);
  }, [buffer, currentText]);

  /**
   * バッファ更新タイマー（5秒ごと）
   */
  useEffect(() => {
    bufferTimerRef.current = setInterval(() => {
      if (currentText.trim() !== '') {
        setBuffer((prev) => [...prev, currentText.trim()]);
        setCurrentText('');
      }
    }, bufferInterval);

    return () => {
      if (bufferTimerRef.current) {
        clearInterval(bufferTimerRef.current);
      }
    };
  }, [currentText, bufferInterval]);

  /**
   * 自動送信タイマー（5分）
   */
  useEffect(() => {
    autoSendTimerRef.current = setTimeout(() => {
      if (buffer.length > 0 || currentText.trim() !== '') {
        setSendReason('auto');
        setIsReadyToSend(true);
      }
    }, autoSendInterval);

    return () => {
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
    };
  }, [buffer, currentText, autoSendInterval]);

  /**
   * 経過時間更新（1秒ごと）
   */
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastInputTime.current) / 1000);
      setTimeSinceLastInput(elapsed);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /**
   * 送信準備完了時のコールバック実行
   */
  useEffect(() => {
    if (isReadyToSend && sendReason && onSendReady) {
      const fullText = [...buffer, currentText].filter((t) => t.trim() !== '').join(' ');
      if (fullText.trim() !== '') {
        onSendReady(fullText, sendReason);
      }
    }
  }, [isReadyToSend, sendReason, buffer, currentText, onSendReady]);

  /**
   * 全テキストを取得
   */
  const fullText = [...buffer, currentText].filter((t) => t.trim() !== '').join(' ');

  return {
    buffer,
    fullText,
    addText,
    clearBuffer,
    triggerSend,
    isReadyToSend,
    sendReason,
    timeSinceLastInput,
  };
};
