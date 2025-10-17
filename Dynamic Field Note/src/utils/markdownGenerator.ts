/**
 * Markdown生成ユーティリティ
 * Phase 1: PoC で使用
 *
 * 機能:
 * - JSON形式の要約データをMarkdownに変換
 * - 見出し構造の自動生成
 * - 日付・時刻の自動挿入
 */

import type { SummaryJSON, FinalSummary } from '../types/summary';

/**
 * Markdown生成オプション
 */
interface MarkdownOptions {
  /** タイトル */
  title?: string;
  /** サブタイトル */
  subtitle?: string;
  /** 日付を含めるか */
  includeDate?: boolean;
  /** 元のテキストを含めるか */
  includeRawText?: boolean;
  /** 見出しレベル（1-6） */
  headingLevel?: number;
}

/**
 * 日付をフォーマット
 */
const formatDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}年${month}月${day}日 ${hours}:${minutes}`;
};

/**
 * 見出しを生成
 */
const generateHeading = (text: string, level: number = 2): string => {
  const hashes = '#'.repeat(Math.min(Math.max(level, 1), 6));
  return `${hashes} ${text}\n\n`;
};

/**
 * リストアイテムを生成
 */
const generateListItem = (item: string, level: number = 0): string => {
  const indent = '  '.repeat(level);
  return `${indent}- ${item}\n`;
};

/**
 * セクション区切りを生成
 */
const generateSeparator = (): string => {
  return '\n---\n\n';
};

/**
 * JSON形式の要約データをMarkdownに変換
 *
 * @param summary - 要約データ
 * @param options - Markdown生成オプション
 * @returns Markdown形式の文字列
 *
 * @example
 * ```typescript
 * const markdown = jsonToMarkdown({
 *   decisions: ['新機能の実装を承認'],
 *   todos: ['設計書を作成する', 'テストケースを準備する'],
 *   issues: ['リソース不足'],
 *   raw_text: '...'
 * }, {
 *   title: '現場報告',
 *   includeDate: true
 * });
 * ```
 */
export const jsonToMarkdown = (
  summary: SummaryJSON,
  options: MarkdownOptions = {}
): string => {
  const {
    title = '現場報告',
    subtitle,
    includeDate = true,
    includeRawText = false,
    headingLevel = 2,
  } = options;

  let markdown = '';

  // タイトル
  markdown += generateHeading(title, 1);

  // サブタイトル
  if (subtitle) {
    markdown += `**${subtitle}**\n\n`;
  }

  // 日付
  if (includeDate) {
    const dateStr = summary.created_at ? formatDate(new Date(summary.created_at)) : formatDate();
    markdown += `📅 **作成日時**: ${dateStr}\n\n`;
  }

  markdown += generateSeparator();

  // 決定事項
  if (summary.decisions && summary.decisions.length > 0) {
    markdown += generateHeading('✅ 決定事項', headingLevel);
    summary.decisions.forEach(decision => {
      markdown += generateListItem(decision);
    });
    markdown += '\n';
  } else {
    markdown += generateHeading('✅ 決定事項', headingLevel);
    markdown += '_なし_\n\n';
  }

  // ToDo
  if (summary.todos && summary.todos.length > 0) {
    markdown += generateHeading('📋 ToDo', headingLevel);
    summary.todos.forEach(todo => {
      markdown += generateListItem(todo);
    });
    markdown += '\n';
  } else {
    markdown += generateHeading('📋 ToDo', headingLevel);
    markdown += '_なし_\n\n';
  }

  // 課題
  if (summary.issues && summary.issues.length > 0) {
    markdown += generateHeading('⚠️ 課題', headingLevel);
    summary.issues.forEach(issue => {
      markdown += generateListItem(issue);
    });
    markdown += '\n';
  } else {
    markdown += generateHeading('⚠️ 課題', headingLevel);
    markdown += '_なし_\n\n';
  }

  // 元のテキスト（オプション）
  if (includeRawText && summary.raw_text) {
    markdown += generateSeparator();
    markdown += generateHeading('📝 元のテキスト', headingLevel);
    markdown += `\`\`\`\n${summary.raw_text}\n\`\`\`\n\n`;
  }

  // フッター
  markdown += generateSeparator();
  markdown += '_🤖 このレポートは Dynamic Field Note により自動生成されました_\n';

  return markdown;
};

/**
 * 最終要約をMarkdownに変換（Phase 5で使用）
 *
 * @param summary - 最終要約データ
 * @param options - Markdown生成オプション
 * @returns Markdown形式の文字列
 */
export const finalSummaryToMarkdown = (
  summary: FinalSummary,
  options: MarkdownOptions = {}
): string => {
  const { headingLevel = 2 } = options;

  // 基本部分を生成
  let markdown = jsonToMarkdown(summary, options);

  // セクション（章立て）を追加
  if (summary.sections && summary.sections.length > 0) {
    markdown += '\n';
    markdown += generateHeading('📖 詳細', headingLevel);

    summary.sections
      .sort((a, b) => a.order - b.order)
      .forEach(section => {
        markdown += generateHeading(section.title, headingLevel + 1);
        markdown += `${section.content}\n\n`;
      });
  }

  // 優先順位付き決定事項
  if (summary.prioritized_decisions && summary.prioritized_decisions.length > 0) {
    markdown += generateHeading('🎯 優先度別決定事項', headingLevel);

    const high = summary.prioritized_decisions.filter(d => d.priority === 1);
    const medium = summary.prioritized_decisions.filter(d => d.priority === 2);
    const low = summary.prioritized_decisions.filter(d => d.priority === 3);

    if (high.length > 0) {
      markdown += '**高優先度** 🔴\n';
      high.forEach(item => markdown += generateListItem(item.content));
      markdown += '\n';
    }

    if (medium.length > 0) {
      markdown += '**中優先度** 🟡\n';
      medium.forEach(item => markdown += generateListItem(item.content));
      markdown += '\n';
    }

    if (low.length > 0) {
      markdown += '**低優先度** 🟢\n';
      low.forEach(item => markdown += generateListItem(item.content));
      markdown += '\n';
    }
  }

  // 期限付きToDo
  if (summary.scheduled_todos && summary.scheduled_todos.length > 0) {
    markdown += generateHeading('📅 スケジュール', headingLevel);

    summary.scheduled_todos.forEach(todo => {
      const deadline = todo.estimated_deadline
        ? ` (期限: ${formatDate(new Date(todo.estimated_deadline))})`
        : '';
      const assignee = todo.assignee ? ` [担当: ${todo.assignee}]` : '';
      markdown += generateListItem(`${todo.content}${deadline}${assignee}`);
    });
    markdown += '\n';
  }

  return markdown;
};

/**
 * Markdownをプレーンテキストに変換（簡易版）
 */
export const markdownToPlainText = (markdown: string): string => {
  return markdown
    .replace(/^#{1,6}\s+/gm, '') // 見出しを削除
    .replace(/\*\*(.+?)\*\*/g, '$1') // 太字を削除
    .replace(/_(.+?)_/g, '$1') // イタリックを削除
    .replace(/\[(.+?)\]\(.+?\)/g, '$1') // リンクをテキストのみに
    .replace(/```[\s\S]*?```/g, '') // コードブロックを削除
    .replace(/`(.+?)`/g, '$1') // インラインコードを削除
    .replace(/^\s*[-*+]\s+/gm, '• ') // リストマーカーを整形
    .replace(/^\s*\d+\.\s+/gm, '• ') // 番号付きリストを整形
    .replace(/\n{3,}/g, '\n\n') // 連続改行を整理
    .trim();
};

/**
 * Markdownをエクスポート用にフォーマット
 */
export const formatMarkdownForExport = (
  markdown: string,
  metadata?: { author?: string; version?: string }
): string => {
  let result = '';

  // メタデータ
  if (metadata) {
    result += '---\n';
    if (metadata.author) result += `author: ${metadata.author}\n`;
    if (metadata.version) result += `version: ${metadata.version}\n`;
    result += `generated: ${new Date().toISOString()}\n`;
    result += '---\n\n';
  }

  result += markdown;

  return result;
};
