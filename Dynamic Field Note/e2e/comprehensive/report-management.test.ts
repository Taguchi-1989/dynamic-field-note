/**
 * E2E Test: Report Management Functionality
 * Phase 3.4: 報告書作成・編集機能
 *
 * Tests:
 * 1. Report creation flow
 * 2. Report editing flow
 * 3. Report deletion
 * 4. Report listing by case
 * 5. Markdown content handling
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { nodeDatabaseService } from '../../src/services/DatabaseService.node';
import { caseDAO } from '../../src/dao/CaseDAO';
import { reportDAO } from '../../src/dao/ReportDAO';
import type { CreateReportInput, UpdateReportInput } from '../../src/types/case';

// DatabaseServiceのモック
jest.mock('../../src/services/DatabaseService', () => ({
  databaseService: {
    initialize: () => nodeDatabaseService.initialize(),
    getDatabase: () => nodeDatabaseService.getDatabase(),
  },
}));

describe('Report Management E2E', () => {
  let testCaseId: number;

  // テスト前にデータベースを初期化
  beforeAll(async () => {
    await nodeDatabaseService.initialize();
  });

  // 全テスト終了後にデータベースをクローズ
  afterAll(() => {
    nodeDatabaseService.close();
  });

  beforeEach(async () => {
    // Create a test case for report association
    const testCase = await caseDAO.create({
      title: 'E2Eテスト用案件',
      status: 'active',
      description: '報告書管理機能のE2Eテスト用案件',
    });
    testCaseId = testCase.id;
  });

  afterEach(async () => {
    // Cleanup
    await caseDAO.hardDelete(testCaseId);
  });

  describe('Report Creation Flow', () => {
    it('should create a new report with title only', async () => {
      // Arrange
      const reportInput: CreateReportInput = {
        case_id: testCaseId,
        title: 'テスト報告書 - タイトルのみ',
      };

      // Act
      const createdReport = await reportDAO.create(reportInput);
      const report = await reportDAO.findById(createdReport.id);

      // Assert
      expect(report).toBeDefined();
      expect(report!.id).toBe(createdReport.id);
      expect(report!.case_id).toBe(testCaseId);
      expect(report!.title).toBe(reportInput.title);
      expect(report!.content).toBeNull();
      expect(report!.is_deleted).toBe(0);
      expect(report!.created_at).toBeDefined();
      expect(report!.updated_at).toBeDefined();
    });

    it('should create a new report with title and content', async () => {
      // Arrange
      const markdownContent = `# 報告書見出し

## 概要
これはテスト報告書です。

## 詳細
- 項目1
- 項目2
- 項目3

### コードブロック
\`\`\`typescript
const test = "Hello, World!";
console.log(test);
\`\`\`

**太字テキスト** と *斜体テキスト*`;

      const reportInput: CreateReportInput = {
        case_id: testCaseId,
        title: 'テスト報告書 - Markdown付き',
        content: markdownContent,
      };

      // Act
      const createdReport = await reportDAO.create(reportInput);
      const report = await reportDAO.findById(createdReport.id);

      // Assert
      expect(report).toBeDefined();
      expect(report!.title).toBe(reportInput.title);
      expect(report!.content).toBe(markdownContent);
      expect(report!.content).toContain('# 報告書見出し');
      expect(report!.content).toContain('```typescript');
      expect(report!.content).toContain('**太字テキスト**');
    });

    it('should create multiple reports for the same case', async () => {
      // Arrange & Act
      const report1 = await reportDAO.create({
        case_id: testCaseId,
        title: '第1回報告書',
      });

      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '第2回報告書',
      });

      const report3 = await reportDAO.create({
        case_id: testCaseId,
        title: '第3回報告書',
      });

      // Assert
      const reports = await reportDAO.findByCaseId(testCaseId);
      expect(reports).toHaveLength(3);

      const reportIds = reports.map((r) => r.id);
      expect(reportIds).toContain(report1.id);
      expect(reportIds).toContain(report2.id);
      expect(reportIds).toContain(report3.id);
    });
  });

  describe('Report Editing Flow', () => {
    let reportId: number;

    beforeEach(async () => {
      // Create a report to edit
      const createdReport = await reportDAO.create({
        case_id: testCaseId,
        title: '編集前のタイトル',
        content: '編集前の内容',
      });
      reportId = createdReport.id;
    });

    it('should update report title only', async () => {
      // Arrange
      const updateInput: UpdateReportInput = {
        title: '編集後のタイトル',
      };

      // Act
      await reportDAO.update(reportId, updateInput);
      const updatedReport = await reportDAO.findById(reportId);

      // Assert
      expect(updatedReport).toBeDefined();
      expect(updatedReport!.title).toBe('編集後のタイトル');
      expect(updatedReport!.content).toBe('編集前の内容'); // Content unchanged
    });

    it('should update report content only', async () => {
      // Arrange
      const newContent = `# 更新された報告書

## 変更点
- 内容を大幅に更新
- 新しいセクションを追加`;

      const updateInput: UpdateReportInput = {
        content: newContent,
      };

      // Act
      await reportDAO.update(reportId, updateInput);
      const updatedReport = await reportDAO.findById(reportId);

      // Assert
      expect(updatedReport).toBeDefined();
      expect(updatedReport!.title).toBe('編集前のタイトル'); // Title unchanged
      expect(updatedReport!.content).toBe(newContent);
    });

    it('should update both title and content', async () => {
      // Arrange
      const updateInput: UpdateReportInput = {
        title: '完全に更新されたタイトル',
        content: '完全に更新された内容',
      };

      // Act
      await reportDAO.update(reportId, updateInput);
      const updatedReport = await reportDAO.findById(reportId);

      // Assert
      expect(updatedReport).toBeDefined();
      expect(updatedReport!.title).toBe(updateInput.title);
      expect(updatedReport!.content).toBe(updateInput.content);
    });

    it('should update updated_at timestamp', async () => {
      // Arrange
      const originalReport = await reportDAO.findById(reportId);
      const originalUpdatedAt = originalReport!.updated_at;

      // Wait 10ms to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Act
      await reportDAO.update(reportId, { title: '新しいタイトル' });
      const updatedReport = await reportDAO.findById(reportId);

      // Assert
      expect(updatedReport!.updated_at).not.toBe(originalUpdatedAt);
      expect(new Date(updatedReport!.updated_at).getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      );
    });
  });

  describe('Report Deletion Flow', () => {
    it('should soft delete a report', async () => {
      // Arrange
      const createdReport = await reportDAO.create({
        case_id: testCaseId,
        title: '削除予定の報告書',
      });

      // Act
      await reportDAO.delete(createdReport.id);

      // Assert
      const deletedReport = await reportDAO.findById(createdReport.id);
      expect(deletedReport).toBeNull(); // findById excludes soft-deleted records
    });

    it('should remove soft-deleted reports from findByCaseId results', async () => {
      // Arrange
      const report1 = await reportDAO.create({
        case_id: testCaseId,
        title: '報告書1',
      });

      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '報告書2',
      });

      const report3 = await reportDAO.create({
        case_id: testCaseId,
        title: '報告書3',
      });

      // Act - Delete report2
      await reportDAO.delete(report2.id);

      // Assert
      const reports = await reportDAO.findByCaseId(testCaseId);
      expect(reports).toHaveLength(2);

      const reportIds = reports.map((r) => r.id);
      expect(reportIds).toContain(report1.id);
      expect(reportIds).toContain(report3.id);
      expect(reportIds).not.toContain(report2.id); // Deleted report excluded
    });

    it('should not find soft-deleted report after deletion', async () => {
      // Arrange
      const createdReport = await reportDAO.create({
        case_id: testCaseId,
        title: '削除予定の報告書',
      });

      // Act
      await reportDAO.delete(createdReport.id);

      // Assert - findById returns null for soft-deleted records
      const deletedReport = await reportDAO.findById(createdReport.id);
      expect(deletedReport).toBeNull();

      // Note: Re-deletion would throw an error because findById excludes soft-deleted records
      // This is expected behavior - the DAO checks existence before deletion
    });
  });

  describe('Report Listing by Case', () => {
    it('should list all reports for a case', async () => {
      // Arrange
      await reportDAO.create({ case_id: testCaseId, title: '報告書A' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書B' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書C' });

      // Act
      const reports = await reportDAO.findByCaseId(testCaseId);

      // Assert
      expect(reports).toHaveLength(3);
      const titles = reports.map((r) => r.title);
      expect(titles).toContain('報告書A');
      expect(titles).toContain('報告書B');
      expect(titles).toContain('報告書C');
    });

    it('should return empty array if case has no reports', async () => {
      // Act
      const reports = await reportDAO.findByCaseId(testCaseId);

      // Assert
      expect(reports).toHaveLength(0);
      expect(reports).toEqual([]);
    });

    it('should not mix reports from different cases', async () => {
      // Arrange
      const case2 = await caseDAO.create({
        title: '別の案件',
        status: 'active',
      });

      await reportDAO.create({ case_id: testCaseId, title: '案件1の報告書' });
      await reportDAO.create({ case_id: case2.id, title: '案件2の報告書' });

      // Act
      const case1Reports = await reportDAO.findByCaseId(testCaseId);
      const case2Reports = await reportDAO.findByCaseId(case2.id);

      // Assert
      expect(case1Reports).toHaveLength(1);
      expect(case1Reports[0].title).toBe('案件1の報告書');

      expect(case2Reports).toHaveLength(1);
      expect(case2Reports[0].title).toBe('案件2の報告書');

      // Cleanup
      await caseDAO.hardDelete(case2.id);
    });
  });

  describe('Markdown Content Handling', () => {
    it('should preserve Markdown formatting', async () => {
      // Arrange
      const complexMarkdown = `# メイン見出し

## セクション1
通常のテキスト

### サブセクション
- リスト項目1
- リスト項目2
  - ネストされた項目

## セクション2
1. 番号付きリスト
2. 2番目の項目

### コードサンプル
\`\`\`javascript
function example() {
  return "Hello";
}
\`\`\`

### テーブル
| カラム1 | カラム2 |
|---------|---------|
| データ1 | データ2 |

### 強調
**太字** と *斜体* と ~~打ち消し線~~

### リンク
[Google](https://www.google.com)

### 画像
![代替テキスト](https://example.com/image.png)`;

      // Act
      const createdReport = await reportDAO.create({
        case_id: testCaseId,
        title: '複雑なMarkdown報告書',
        content: complexMarkdown,
      });

      const report = await reportDAO.findById(createdReport.id);

      // Assert
      expect(report).toBeDefined();
      expect(report!.content).toBe(complexMarkdown);

      // Verify all Markdown elements are preserved
      expect(report!.content).toContain('# メイン見出し');
      expect(report!.content).toContain('- リスト項目1');
      expect(report!.content).toContain('```javascript');
      expect(report!.content).toContain('| カラム1 | カラム2 |');
      expect(report!.content).toContain('**太字**');
      expect(report!.content).toContain('[Google](https://www.google.com)');
      expect(report!.content).toContain('![代替テキスト]');
    });

    it('should handle special characters in content', async () => {
      // Arrange
      const specialCharsContent = `特殊文字テスト:
- アポストロフィ: don't, can't
- 引用符: "quoted text" and 'single quotes'
- アンパサンド: A & B
- 小なり大なり: <tag> and x > y
- バックスラッシュ: C:\\Users\\Path
- 絵文字: 😀 🎉 ✅ ❌
- 日本語: これはテストです
- 記号: @#$%^&*()_+-=[]{}|;:,.<>?/~\``;

      // Act
      const createdReport = await reportDAO.create({
        case_id: testCaseId,
        title: '特殊文字テスト報告書',
        content: specialCharsContent,
      });

      const report = await reportDAO.findById(createdReport.id);

      // Assert
      expect(report).toBeDefined();
      expect(report!.content).toBe(specialCharsContent);
      expect(report!.content).toContain("don't");
      expect(report!.content).toContain('😀');
      expect(report!.content).toContain('C:\\Users\\Path');
    });

    it('should handle very long content', async () => {
      // Arrange
      const longContent = Array(1000).fill('これは長いコンテンツのテストです。').join('\n');

      // Act
      const createdReport = await reportDAO.create({
        case_id: testCaseId,
        title: '長文報告書',
        content: longContent,
      });

      const report = await reportDAO.findById(createdReport.id);

      // Assert
      expect(report).toBeDefined();
      expect(report!.content).toBe(longContent);
      expect(report!.content!.length).toBeGreaterThan(15000); // > 15KB (1000 lines)
      expect(report!.content!.split('\n')).toHaveLength(1000);
    });

    it('should handle empty content', async () => {
      // Arrange & Act
      const createdReport = await reportDAO.create({
        case_id: testCaseId,
        title: '空の内容の報告書',
        content: '',
      });

      const report = await reportDAO.findById(createdReport.id);

      // Assert
      expect(report).toBeDefined();
      expect(report!.content).toBe('');
    });
  });

  describe('Complete Report Management Workflow', () => {
    it('should complete full lifecycle: create → edit → delete', async () => {
      // Step 1: Create
      const createdReport = await reportDAO.create({
        case_id: testCaseId,
        title: '完全なライフサイクルテスト',
        content: '初期内容',
      });

      let report = await reportDAO.findById(createdReport.id);
      expect(report).toBeDefined();
      expect(report!.title).toBe('完全なライフサイクルテスト');

      // Step 2: Edit (multiple times)
      await reportDAO.update(createdReport.id, { content: '更新された内容1' });
      report = await reportDAO.findById(createdReport.id);
      expect(report!.content).toBe('更新された内容1');

      await reportDAO.update(createdReport.id, { title: '更新されたタイトル' });
      report = await reportDAO.findById(createdReport.id);
      expect(report!.title).toBe('更新されたタイトル');

      await reportDAO.update(createdReport.id, {
        title: '最終タイトル',
        content: '最終内容',
      });
      report = await reportDAO.findById(createdReport.id);
      expect(report!.title).toBe('最終タイトル');
      expect(report!.content).toBe('最終内容');

      // Step 3: Delete
      await reportDAO.delete(createdReport.id);
      const deletedReport = await reportDAO.findById(createdReport.id);
      expect(deletedReport).toBeNull();
    });

    it('should handle concurrent report creation for same case', async () => {
      // Arrange & Act
      const promises = Array(10)
        .fill(null)
        .map((_, index) =>
          reportDAO.create({
            case_id: testCaseId,
            title: `並行作成報告書 ${index + 1}`,
          })
        );

      const createdReports = await Promise.all(promises);

      // Assert
      expect(createdReports).toHaveLength(10);
      const reportIds = createdReports.map((r) => r.id);
      expect(new Set(reportIds).size).toBe(10); // All IDs are unique

      const reports = await reportDAO.findByCaseId(testCaseId);
      expect(reports).toHaveLength(10);
    });
  });
});
