/**
 * @fileoverview Markdown to PDF conversion tool with live preview
 * @module components/MarkdownPdfTool
 */

import React, { useMemo, useState, useEffect, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { generatePdf } from '../services/pdfApi';

/**
 * Sample markdown content
 */
const SAMPLE_MARKDOWN = `# 議事録サンプル\n\n- 日時: 2025-08-27\n- 参加者: 山田, 田中\n\n## 決定事項\n- 次回までにドラフト作成\n\n## メモ\n日本語テキストの表示とPDF化を確認します。\n\n> 引用の例\n\n1. 箇条書き\n2. 番号付きリスト\n\n`;

/**
 * Default document title
 */
const DEFAULT_TITLE = '議事録';

/**
 * Default filename for PDF download
 */
const DEFAULT_FILENAME = 'document';

/**
 * Default error message for PDF generation failure
 */
const ERROR_MESSAGE_DEFAULT = 'PDF生成に失敗しました';

/**
 * LocalStorage keys for saved content
 */
const STORAGE_KEYS = {
  OUTPUT_TEXT: 'gijiroku_outputText',
  UPLOADED_TEXT: 'gijiroku_uploadedText',
  DIRECT_INPUT: 'gijiroku_directTextInput',
} as const;

/**
 * Button text constants
 */
const BUTTON_TEXT = {
  GENERATING: '生成中…',
  GENERATE: 'PDFを生成',
  BACK_TO_DASHBOARD: '← ダッシュボードへ',
} as const;

/**
 * Props for MarkdownPdfTool component
 */
interface MarkdownPdfToolProps {
  /** Optional callback when closing the tool */
  onClose?: () => void;
  /** Optional initial markdown content */
  initialContent?: string;
}

/**
 * Markdown to PDF conversion tool component
 *
 * Provides a split-pane interface for editing Markdown and previewing the result.
 * Automatically loads saved content from localStorage if no initial content is provided.
 * Supports PDF generation and download.
 *
 * @example
 * ```tsx
 * <MarkdownPdfTool
 *   onClose={() => setShowPdfTool(false)}
 *   initialContent="# My Document"
 * />
 * ```
 */
const MarkdownPdfTool: React.FC<MarkdownPdfToolProps> = memo(({ onClose, initialContent }) => {
  /**
   * Document title state
   */
  const [title, setTitle] = useState<string>(DEFAULT_TITLE);

  /**
   * Markdown content state
   */
  const [markdown, setMarkdown] = useState<string>(initialContent || SAMPLE_MARKDOWN);

  /**
   * Loading state for PDF generation
   */
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Error message state
   */
  const [error, setError] = useState<string | null>(null);

  /**
   * Load saved content from localStorage on mount
   */
  useEffect(() => {
    if (initialContent) {
      return;
    }

    const savedContent =
      localStorage.getItem(STORAGE_KEYS.OUTPUT_TEXT) ||
      localStorage.getItem(STORAGE_KEYS.UPLOADED_TEXT) ||
      localStorage.getItem(STORAGE_KEYS.DIRECT_INPUT);

    if (savedContent) {
      setMarkdown(savedContent);
    }
  }, [initialContent]);

  /**
   * Memoized preview content
   */
  const preview = useMemo((): string => markdown, [markdown]);

  /**
   * Handle title input change
   */
  const handleTitleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setTitle(event.target.value);
  }, []);

  /**
   * Handle markdown textarea change
   */
  const handleMarkdownChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    setMarkdown(event.target.value);
  }, []);

  /**
   * Generate and download PDF
   */
  const handleGenerate = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const blob = await generatePdf({
        content: markdown,
        title,
        content_type: 'markdown',
      });

      const url = URL.createObjectURL(blob);

      // Create download link
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${title || DEFAULT_FILENAME}.pdf`;
      anchor.click();

      // Cleanup
      URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : ERROR_MESSAGE_DEFAULT;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [markdown, title]);

  /**
   * Handle close button click
   */
  const handleClose = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      onClose?.();
    },
    [onClose]
  );

  /**
   * Handle generate button click
   */
  const handleGenerateClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      void handleGenerate();
    },
    [handleGenerate]
  );

  const buttonText = loading ? BUTTON_TEXT.GENERATING : BUTTON_TEXT.GENERATE;
  const previewTitle = title || 'プレビュー';

  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        height: 'calc(100vh - 40px)',
        padding: 16,
      }}
      role="main"
      aria-label="Markdown PDF変換ツール"
    >
      <div style={{ position: 'fixed', top: 8, right: 8, display: 'flex', gap: 8 }}>
        {onClose && (
          <button
            onClick={handleClose}
            style={{ padding: '8px 12px' }}
            type="button"
            aria-label="ダッシュボードに戻る"
          >
            {BUTTON_TEXT.BACK_TO_DASHBOARD}
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
          <input
            value={title}
            onChange={handleTitleChange}
            placeholder="タイトル"
            style={{ flex: 1, padding: 8 }}
            aria-label="ドキュメントタイトル"
            type="text"
          />
          <button
            onClick={handleGenerateClick}
            disabled={loading}
            style={{ padding: '8px 12px' }}
            type="button"
            aria-busy={loading}
          >
            {buttonText}
          </button>
          <div style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }} aria-live="polite">
            💾 保存済み入力内容を自動読み込み
          </div>
        </div>

        <textarea
          value={markdown}
          onChange={handleMarkdownChange}
          style={{
            flex: 1,
            width: '100%',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
            fontSize: 14,
            padding: 12,
          }}
          aria-label="Markdown入力欄"
        />

        {error && (
          <div style={{ color: 'tomato', marginTop: 8 }} role="alert">
            {error}
          </div>
        )}
      </div>

      <div
        style={{
          flex: 1,
          borderLeft: '1px solid #eee',
          paddingLeft: 16,
          overflow: 'auto',
        }}
        role="region"
        aria-label="Markdownプレビュー"
      >
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ borderBottom: '1px solid #ddd', paddingBottom: 8 }}>
            {previewTitle}
          </h2>
          <div
            style={{
              fontFamily: 'Noto Sans JP, system-ui, -apple-system, Segoe UI, Meiryo, sans-serif',
              lineHeight: 1.7,
            }}
          >
            <ReactMarkdown>{preview}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
});

MarkdownPdfTool.displayName = 'MarkdownPdfTool';

export default MarkdownPdfTool;
export type { MarkdownPdfToolProps };

