/**
 * 自動保存フック
 * Phase 3.4 Refactoring: ReportFormScreenから抽出
 */

import { useState, useEffect, useRef } from 'react';

export interface UseAutoSaveOptions<T> {
  /** 保存するデータ */
  data: T;
  /** 保存処理 */
  onSave: (data: T) => Promise<void>;
  /** 遅延時間 (ミリ秒) */
  delay?: number;
  /** 有効/無効 */
  enabled?: boolean;
}

export interface UseAutoSaveReturn {
  /** 保存中フラグ */
  isSaving: boolean;
  /** 最終保存日時 */
  lastSaved: Date | null;
  /** エラー */
  error: Error | null;
}

/**
 * 自動保存フック
 *
 * データ変更から指定時間後に自動的に保存処理を実行します。
 *
 * @example
 * ```tsx
 * const { isSaving } = useAutoSave({
 *   data: { title, content },
 *   onSave: async (data) => {
 *     await reportDAO.update(id, data);
 *   },
 *   delay: 5000,
 *   enabled: isModified && !!title,
 * });
 * ```
 */
export const useAutoSave = <T>({
  data,
  onSave,
  delay = 5000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 既存のタイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // 新しいタイマーをセット
    timerRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        setError(null);
        await onSave(data);
        setLastSaved(new Date());
      } catch (err) {
        const error = err as Error;
        if (__DEV__) {
          console.error('[useAutoSave] Auto-save failed:', error);
        }
        setError(error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    // クリーンアップ
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [data, onSave, delay, enabled]);

  return { isSaving, lastSaved, error };
};
