/**
 * @fileoverview Sample VTT file component for testing
 * @module components/SampleVTT
 */

import React, { useCallback, useMemo, memo } from 'react';
import './SampleVTT.css';

/**
 * Sample VTT file content with intentional errors for testing
 */
const SAMPLE_VTT_CONTENT = `WEBVTT

1
00:00:00.000 --> 00:00:05.000
田中: おはようございます。きょうの会儀を始めさせてもらいます。

2
00:00:05.000 --> 00:00:12.000
佐藤: よろしくお願いします。まず議だいの確認からお願いします。

3
00:00:12.000 --> 00:00:18.000
田中: 承知いたしました。えー、本日は3つのぎだいがあります。

4
00:00:18.000 --> 00:00:25.000
佐藤: ありがとうございます。それでは1つめのぎだいから進めてください。

5
00:00:25.000 --> 00:00:32.000
田中: 1つ目は、新しいプロダクトの件について話し合います。

6
00:00:32.000 --> 00:00:38.000
佐藤: はい。開発スケジュールはどうなっていますでしょうか。

7
00:00:38.000 --> 00:00:45.000
田中: 来月の中旬には、プロトタイプを完成させる予定です。

8
00:00:45.000 --> 00:00:52.000
佐藤: 分かりました。テストも並行して進めていきましょう。`;

/**
 * Default filename for downloaded VTT file
 */
const DEFAULT_FILENAME = 'sample_meeting.vtt';

/**
 * MIME type for VTT files
 */
const VTT_MIME_TYPE = 'text/vtt';

/**
 * Number of preview lines to display
 */
const PREVIEW_LINES = 10;

/**
 * Correction examples in the sample
 */
const CORRECTION_EXAMPLES = [
  { before: '会儀', after: '会議' },
  { before: '議だい', after: '議題' },
  { before: 'ぎだい', after: '議題' },
  { before: 'きょう', after: '今日' },
  { before: 'フィラー「えー」', after: '除去' },
] as const;

/**
 * Usage instructions
 */
const USAGE_STEPS = [
  '「VTTファイルをダウンロード」をクリック',
  '保存されたファイルを上記のドロップエリアにドラッグ',
  '自動修正結果を確認',
] as const;

/**
 * Sample VTT file component
 *
 * Provides a downloadable sample VTT file with intentional errors for testing
 * the correction functionality. Includes preview and copy-to-clipboard features.
 *
 * @example
 * ```tsx
 * <SampleVTT />
 * ```
 */
const SampleVTT: React.FC = memo(() => {
  /**
   * Generate preview text (first N lines)
   */
  const previewText = useMemo((): string => {
    return SAMPLE_VTT_CONTENT.split('\n').slice(0, PREVIEW_LINES).join('\n') + '...';
  }, []);

  /**
   * Download sample VTT file
   */
  const downloadSampleVTT = useCallback((): void => {
    const blob = new Blob([SAMPLE_VTT_CONTENT], { type: VTT_MIME_TYPE });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = DEFAULT_FILENAME;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    URL.revokeObjectURL(url);
  }, []);

  /**
   * Copy sample VTT content to clipboard
   */
  const copySampleVTT = useCallback((): void => {
    void navigator.clipboard.writeText(SAMPLE_VTT_CONTENT);
    // Success handling is performed by parent component
  }, []);

  /**
   * Handle download button click
   */
  const handleDownloadClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      downloadSampleVTT();
    },
    [downloadSampleVTT]
  );

  /**
   * Handle copy button click
   */
  const handleCopyClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      copySampleVTT();
    },
    [copySampleVTT]
  );

  return (
    <div className="sample-vtt" role="region" aria-label="サンプルVTTファイル">
      <div className="sample-header">
        <h3>📄 サンプルVTTファイル</h3>
        <p>テスト用のサンプルファイルをダウンロードできます</p>
      </div>

      <div className="sample-content">
        <div className="sample-preview">
          <h4>プレビュー</h4>
          <div className="vtt-preview">
            <pre aria-label="VTTファイルプレビュー">{previewText}</pre>
          </div>

          <div className="sample-features">
            <h5>このサンプルに含まれる誤字・修正候補：</h5>
            <ul>
              {CORRECTION_EXAMPLES.map((example) => (
                <li key={example.before}>
                  「{example.before}」→「{example.after}」
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="sample-actions">
          <button
            className="download-btn"
            onClick={handleDownloadClick}
            type="button"
            aria-label="VTTファイルをダウンロード"
          >
            📥 VTTファイルをダウンロード
          </button>

          <button
            className="copy-btn"
            onClick={handleCopyClick}
            type="button"
            aria-label="テキストをクリップボードにコピー"
          >
            📋 テキストをコピー
          </button>

          <div className="usage-tip">
            <strong>使い方：</strong>
            <ol>
              {USAGE_STEPS.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
});

SampleVTT.displayName = 'SampleVTT';

export default SampleVTT;