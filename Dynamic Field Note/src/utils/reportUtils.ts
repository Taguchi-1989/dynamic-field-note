/**
 * Report Utility Functions
 * 報告書ユーティリティ
 * Phase 3.5.5: 報告書統合
 */

import { Photo } from '../types/case';

/**
 * Markdownに写真を埋め込む
 * @param content 元のMarkdownコンテンツ
 * @param photos 写真リスト
 * @returns 写真が埋め込まれたMarkdown
 */
export const embedPhotosInMarkdown = (content: string, photos: Photo[]): string => {
  if (photos.length === 0) {
    return content;
  }

  const photoSection = photos
    .map((photo, index) => {
      const caption = photo.caption || `写真${index + 1}`;
      return `![${caption}](${photo.file_path})`;
    })
    .join('\n\n');

  return `${content}\n\n## 現場写真\n\n${photoSection}`;
};

/**
 * 写真ファイルを報告書フォルダに整理
 * （将来の実装用プレースホルダー）
 * @param reportId 報告書ID
 * @param photos 写真リスト
 */
export const organizePhotoFiles = async (reportId: number, photos: Photo[]): Promise<void> => {
  // TODO: Phase 4 でファイルシステム統合時に実装
  // - 報告書専用フォルダ作成
  // - 写真ファイルをコピー
  // - PhotoDAO で report_id を更新
  console.log('[reportUtils] organizePhotoFiles:', reportId, photos.length);
};
