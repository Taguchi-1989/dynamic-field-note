/**
 * 報告書フォームフック
 * Phase 3.4 Refactoring: ReportFormScreenのビジネスロジックを分離
 */

import { useState, useEffect, useCallback } from 'react';
import { reportDAO } from '../dao/ReportDAO';
import { validateReport } from '../utils/validators/reportValidator';

export interface UseReportFormOptions {
  caseId: number;
  reportId?: number;
}

export interface UseReportFormReturn {
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  loading: boolean;
  saving: boolean;
  isModified: boolean;
  error: Error | null;
  save: () => Promise<void>;
  loadReport: () => Promise<void>;
}

/**
 * 報告書フォームフック
 *
 * 報告書の作成・編集に関するビジネスロジックを管理します。
 *
 * @example
 * ```tsx
 * const {
 *   title,
 *   setTitle,
 *   content,
 *   setContent,
 *   loading,
 *   saving,
 *   save,
 * } = useReportForm({ caseId, reportId });
 * ```
 */
export const useReportForm = ({ caseId, reportId }: UseReportFormOptions): UseReportFormReturn => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 報告書読み込み
   */
  const loadReport = useCallback(async () => {
    if (!reportId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const report = await reportDAO.findById(reportId);

      if (!report) {
        const notFoundError = new Error('Report not found');
        setError(notFoundError);
        return;
      }

      setTitle(report.title);
      setContent(report.content || '');
      setIsModified(false); // 読み込み直後は未変更
    } catch (err) {
      const error = err as Error;
      if (__DEV__) {
        console.error('[useReportForm] Failed to load report:', error);
      }
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [reportId]);

  /**
   * 保存
   */
  const save = useCallback(async () => {
    // バリデーション
    const validationResult = validateReport(title, content);
    if (!validationResult.isValid) {
      const error = new Error(validationResult.errors[0].message);
      setError(error);
      return; // エラーを throw せずに return
    }

    try {
      setSaving(true);
      setError(null);

      if (reportId) {
        // 更新
        await reportDAO.update(reportId, {
          title: title.trim(),
          content: content.trim() || undefined,
        });
      } else {
        // 新規作成
        await reportDAO.create({
          case_id: caseId,
          title: title.trim(),
          content: content.trim() || undefined,
        });
      }

      setIsModified(false);
    } catch (err) {
      const error = err as Error;
      if (__DEV__) {
        console.error('[useReportForm] Failed to save report:', error);
      }
      setError(error);
      // エラーを throw せずに状態のみ設定
    } finally {
      setSaving(false);
    }
  }, [caseId, reportId, title, content]);

  /**
   * 初期ロード
   */
  useEffect(() => {
    if (reportId) {
      loadReport();
    }
  }, [reportId, loadReport]);

  /**
   * 変更検知
   */
  useEffect(() => {
    setIsModified(true);
  }, [title, content]);

  return {
    title,
    setTitle,
    content,
    setContent,
    loading,
    saving,
    isModified,
    error,
    save,
    loadReport,
  };
};
