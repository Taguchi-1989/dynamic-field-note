/**
 * markdownGenerator ユニットテスト
 */

import {
  jsonToMarkdown,
  finalSummaryToMarkdown,
  markdownToPlainText,
  formatMarkdownForExport,
} from '../markdownGenerator';
import type { SummaryJSON, FinalSummary } from '../../types/summary';

describe('markdownGenerator', () => {
  describe('jsonToMarkdown', () => {
    it('should generate basic markdown with default options', () => {
      const summary: SummaryJSON = {
        decisions: ['新機能の実装を承認'],
        todos: ['設計書を作成する'],
        issues: ['リソース不足'],
        raw_text: 'テスト用の元テキスト',
      };

      const result = jsonToMarkdown(summary);

      expect(result).toContain('# 現場報告');
      expect(result).toContain('## ✅ 決定事項');
      expect(result).toContain('- 新機能の実装を承認');
      expect(result).toContain('## 📋 ToDo');
      expect(result).toContain('- 設計書を作成する');
      expect(result).toContain('## ⚠️ 課題');
      expect(result).toContain('- リソース不足');
      expect(result).toContain('🤖 このレポートは Dynamic Field Note により自動生成されました');
    });

    it('should include custom title', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary, { title: 'カスタムタイトル' });

      expect(result).toContain('# カスタムタイトル');
    });

    it('should include subtitle when provided', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary, { subtitle: 'サブタイトル' });

      expect(result).toContain('**サブタイトル**');
    });

    it('should include date by default', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary);

      expect(result).toContain('📅 **作成日時**:');
    });

    it('should not include date when includeDate is false', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary, { includeDate: false });

      expect(result).not.toContain('📅 **作成日時**:');
    });

    it('should use created_at from summary if provided', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: '',
        created_at: '2025-10-18T10:30:00.000Z',
      };

      const result = jsonToMarkdown(summary);

      expect(result).toContain('📅 **作成日時**:');
      // Note: Exact format depends on timezone and locale
      expect(result).toMatch(/2025/);
      expect(result).toMatch(/10/);
      expect(result).toMatch(/18/);
    });

    it('should show "なし" for empty decisions', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: ['タスク1'],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary);

      expect(result).toContain('## ✅ 決定事項');
      expect(result).toContain('_なし_');
    });

    it('should show "なし" for empty todos', () => {
      const summary: SummaryJSON = {
        decisions: ['決定1'],
        todos: [],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary);

      expect(result).toContain('## 📋 ToDo');
      expect(result).toContain('_なし_');
    });

    it('should show "なし" for empty issues', () => {
      const summary: SummaryJSON = {
        decisions: ['決定1'],
        todos: ['タスク1'],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary);

      expect(result).toContain('## ⚠️ 課題');
      expect(result).toContain('_なし_');
    });

    it('should include raw text when includeRawText is true', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: 'これは元のテキストです',
      };

      const result = jsonToMarkdown(summary, { includeRawText: true });

      expect(result).toContain('## 📝 元のテキスト');
      expect(result).toContain('```');
      expect(result).toContain('これは元のテキストです');
    });

    it('should not include raw text when includeRawText is false', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: 'これは元のテキストです',
      };

      const result = jsonToMarkdown(summary, { includeRawText: false });

      expect(result).not.toContain('## 📝 元のテキスト');
      expect(result).not.toContain('これは元のテキストです');
    });

    it('should respect custom heading level', () => {
      const summary: SummaryJSON = {
        decisions: ['決定1'],
        todos: [],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary, { headingLevel: 3 });

      expect(result).toContain('### ✅ 決定事項');
    });

    it('should handle multiple decisions', () => {
      const summary: SummaryJSON = {
        decisions: ['決定1', '決定2', '決定3'],
        todos: [],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary);

      expect(result).toContain('- 決定1');
      expect(result).toContain('- 決定2');
      expect(result).toContain('- 決定3');
    });

    it('should handle multiple todos', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: ['タスク1', 'タスク2', 'タスク3'],
        issues: [],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary);

      expect(result).toContain('- タスク1');
      expect(result).toContain('- タスク2');
      expect(result).toContain('- タスク3');
    });

    it('should handle multiple issues', () => {
      const summary: SummaryJSON = {
        decisions: [],
        todos: [],
        issues: ['課題1', '課題2', '課題3'],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary);

      expect(result).toContain('- 課題1');
      expect(result).toContain('- 課題2');
      expect(result).toContain('- 課題3');
    });

    it('should handle special characters in content', () => {
      const summary: SummaryJSON = {
        decisions: ['<script>alert("XSS")</script>'],
        todos: ['**太字**のタスク'],
        issues: ['_イタリック_の課題'],
        raw_text: '',
      };

      const result = jsonToMarkdown(summary);

      // Special characters should be preserved as-is in markdown
      expect(result).toContain('<script>alert("XSS")</script>');
      expect(result).toContain('**太字**のタスク');
      expect(result).toContain('_イタリック_の課題');
    });
  });

  describe('finalSummaryToMarkdown', () => {
    it('should include basic summary', () => {
      const summary: FinalSummary = {
        decisions: ['決定1'],
        todos: ['タスク1'],
        issues: ['課題1'],
        raw_text: '',
        sections: [],
        prioritized_decisions: [],
        scheduled_todos: [],
      };

      const result = finalSummaryToMarkdown(summary);

      expect(result).toContain('## ✅ 決定事項');
      expect(result).toContain('- 決定1');
    });

    it('should include sections when provided', () => {
      const summary: FinalSummary = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: '',
        sections: [
          { order: 1, title: '第1章', content: '第1章の内容' },
          { order: 2, title: '第2章', content: '第2章の内容' },
        ],
        prioritized_decisions: [],
        scheduled_todos: [],
      };

      const result = finalSummaryToMarkdown(summary);

      expect(result).toContain('## 📖 詳細');
      expect(result).toContain('### 第1章');
      expect(result).toContain('第1章の内容');
      expect(result).toContain('### 第2章');
      expect(result).toContain('第2章の内容');
    });

    it('should sort sections by order', () => {
      const summary: FinalSummary = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: '',
        sections: [
          { order: 3, title: '第3章', content: '内容3' },
          { order: 1, title: '第1章', content: '内容1' },
          { order: 2, title: '第2章', content: '内容2' },
        ],
        prioritized_decisions: [],
        scheduled_todos: [],
      };

      const result = finalSummaryToMarkdown(summary);

      const indexOf1 = result.indexOf('### 第1章');
      const indexOf2 = result.indexOf('### 第2章');
      const indexOf3 = result.indexOf('### 第3章');

      expect(indexOf1).toBeLessThan(indexOf2);
      expect(indexOf2).toBeLessThan(indexOf3);
    });

    it('should include prioritized decisions', () => {
      const summary: FinalSummary = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: '',
        sections: [],
        prioritized_decisions: [
          { content: '高優先度の決定', priority: 1 },
          { content: '中優先度の決定', priority: 2 },
          { content: '低優先度の決定', priority: 3 },
        ],
        scheduled_todos: [],
      };

      const result = finalSummaryToMarkdown(summary);

      expect(result).toContain('## 🎯 優先度別決定事項');
      expect(result).toContain('**高優先度** 🔴');
      expect(result).toContain('- 高優先度の決定');
      expect(result).toContain('**中優先度** 🟡');
      expect(result).toContain('- 中優先度の決定');
      expect(result).toContain('**低優先度** 🟢');
      expect(result).toContain('- 低優先度の決定');
    });

    it('should include scheduled todos', () => {
      const summary: FinalSummary = {
        decisions: [],
        todos: [],
        issues: [],
        raw_text: '',
        sections: [],
        prioritized_decisions: [],
        scheduled_todos: [
          {
            content: 'タスク1',
            estimated_deadline: '2025-10-20T10:00:00.000Z',
            assignee: '田中',
          },
          { content: 'タスク2', estimated_deadline: undefined, assignee: '佐藤' },
          {
            content: 'タスク3',
            estimated_deadline: '2025-10-21T15:00:00.000Z',
            assignee: undefined,
          },
        ],
      };

      const result = finalSummaryToMarkdown(summary);

      expect(result).toContain('## 📅 スケジュール');
      expect(result).toContain('- タスク1');
      expect(result).toContain('[担当: 田中]');
      expect(result).toContain('- タスク2');
      expect(result).toContain('[担当: 佐藤]');
      expect(result).toContain('- タスク3');
    });
  });

  describe('markdownToPlainText', () => {
    it('should remove headings', () => {
      const markdown = '# 見出し1\n## 見出し2\n### 見出し3';
      const result = markdownToPlainText(markdown);

      expect(result).toBe('見出し1\n見出し2\n見出し3');
    });

    it('should remove bold formatting', () => {
      const markdown = 'これは**太字**のテキストです';
      const result = markdownToPlainText(markdown);

      expect(result).toBe('これは太字のテキストです');
    });

    it('should remove italic formatting', () => {
      const markdown = 'これは_イタリック_のテキストです';
      const result = markdownToPlainText(markdown);

      expect(result).toBe('これはイタリックのテキストです');
    });

    it('should convert links to plain text', () => {
      const markdown = 'これは[リンク](https://example.com)です';
      const result = markdownToPlainText(markdown);

      expect(result).toBe('これはリンクです');
    });

    it('should remove code blocks', () => {
      const markdown = 'テキスト\n```javascript\nconst x = 1;\n```\nテキスト';
      const result = markdownToPlainText(markdown);

      expect(result).toBe('テキスト\n\nテキスト');
    });

    it('should remove inline code', () => {
      const markdown = 'これは`code`です';
      const result = markdownToPlainText(markdown);

      expect(result).toBe('これはcodeです');
    });

    it('should format list markers', () => {
      const markdown = '- アイテム1\n- アイテム2\n* アイテム3\n+ アイテム4';
      const result = markdownToPlainText(markdown);

      expect(result).toContain('• アイテム1');
      expect(result).toContain('• アイテム2');
      expect(result).toContain('• アイテム3');
      expect(result).toContain('• アイテム4');
    });

    it('should format numbered lists', () => {
      const markdown = '1. アイテム1\n2. アイテム2\n3. アイテム3';
      const result = markdownToPlainText(markdown);

      expect(result).toContain('• アイテム1');
      expect(result).toContain('• アイテム2');
      expect(result).toContain('• アイテム3');
    });

    it('should clean up multiple newlines', () => {
      const markdown = 'テキスト\n\n\n\nテキスト';
      const result = markdownToPlainText(markdown);

      expect(result).toBe('テキスト\n\nテキスト');
    });

    it('should trim whitespace', () => {
      const markdown = '  \nテキスト\n  ';
      const result = markdownToPlainText(markdown);

      expect(result).toBe('テキスト');
    });

    it('should handle empty string', () => {
      const markdown = '';
      const result = markdownToPlainText(markdown);

      expect(result).toBe('');
    });

    it('should handle complex markdown', () => {
      const markdown = `
# タイトル

これは**太字**と_イタリック_のテキストです。

- リスト1
- リスト2

\`\`\`javascript
const x = 1;
\`\`\`

[リンク](https://example.com)
      `.trim();

      const result = markdownToPlainText(markdown);

      expect(result).not.toContain('#');
      expect(result).not.toContain('**');
      expect(result).not.toContain('_');
      expect(result).not.toContain('```');
      expect(result).not.toContain('[');
      expect(result).not.toContain('](');
    });
  });

  describe('formatMarkdownForExport', () => {
    it('should add metadata header', () => {
      const markdown = '# タイトル\n\n内容';
      const metadata = {
        author: '田中太郎',
        version: '1.0.0',
      };

      const result = formatMarkdownForExport(markdown, metadata);

      expect(result).toContain('---');
      expect(result).toContain('author: 田中太郎');
      expect(result).toContain('version: 1.0.0');
      expect(result).toContain('generated:');
      expect(result).toContain('# タイトル');
    });

    it('should work without metadata', () => {
      const markdown = '# タイトル\n\n内容';

      const result = formatMarkdownForExport(markdown);

      expect(result).toBe(markdown);
    });

    it('should include only author when provided', () => {
      const markdown = '# タイトル';
      const metadata = { author: '田中太郎' };

      const result = formatMarkdownForExport(markdown, metadata);

      expect(result).toContain('author: 田中太郎');
      expect(result).not.toContain('version:');
    });

    it('should include only version when provided', () => {
      const markdown = '# タイトル';
      const metadata = { version: '2.0.0' };

      const result = formatMarkdownForExport(markdown, metadata);

      expect(result).toContain('version: 2.0.0');
      expect(result).not.toContain('author:');
    });

    it('should include generated timestamp', () => {
      const markdown = '# タイトル';
      const metadata = { author: '田中' };

      const result = formatMarkdownForExport(markdown, metadata);

      expect(result).toMatch(/generated: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });
});
