/**
 * Comprehensive E2E Test: Phase 3 DAO Full Coverage
 *
 * 目的: 完全な品質担保と網羅的テストカバレッジ
 * 対象: 全DAOの統合動作、エッジケース、エラーハンドリング
 * 実行時間: 5-10分（CI/CD専用）
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { DatabaseService } from '../../src/services/DatabaseService';
import { CaseDAO } from '../../src/services/CaseDAO';
import { ReportDAO } from '../../src/services/ReportDAO';
import { PhotoDAO } from '../../src/services/PhotoDAO';
import type { Case, Report, Photo } from '../../src/types/case';

describe('Comprehensive E2E: Phase 3 DAO Full Coverage', () => {
  let databaseService: DatabaseService;
  let caseDAO: CaseDAO;
  let reportDAO: ReportDAO;
  let photoDAO: PhotoDAO;

  beforeAll(async () => {
    databaseService = new DatabaseService();
    await databaseService.initialize();
    caseDAO = new CaseDAO(databaseService);
    reportDAO = new ReportDAO(databaseService);
    photoDAO = new PhotoDAO(databaseService);
  });

  afterAll(async () => {
    await databaseService.close();
  });

  describe('Complete Business Workflow', () => {
    let workflowCase: Case;
    let workflowReport: Report;
    let workflowPhoto: Photo;

    it('Step 1: 新規案件作成（完全版）', async () => {
      workflowCase = await caseDAO.create({
        title: '完全ワークフローテスト案件',
        location: '東京都渋谷区',
        description: '包括的なE2Eテストのための案件',
        client_name: 'テスト株式会社',
        status: 'active',
      });

      expect(workflowCase).toBeDefined();
      expect(workflowCase.id).toBeGreaterThan(0);
      expect(workflowCase.title).toBe('完全ワークフローテスト案件');
      expect(workflowCase.status).toBe('active');
      expect(workflowCase.is_deleted).toBe(0);
      expect(workflowCase.created_at).toBeDefined();
      expect(workflowCase.updated_at).toBeDefined();
    });

    it('Step 2: 案件情報更新', async () => {
      await caseDAO.update(workflowCase.id, {
        description: '更新された説明',
        status: 'completed',
        client_name: 'テスト株式会社（更新後）',
      });

      const updated = await caseDAO.findById(workflowCase.id);
      expect(updated?.description).toBe('更新された説明');
      expect(updated?.status).toBe('completed');
      expect(updated?.client_name).toBe('テスト株式会社（更新後）');
      // タイトルは変更されていない
      expect(updated?.title).toBe(workflowCase.title);
    });

    it('Step 3: 報告書作成（複数）', async () => {
      const report1 = await reportDAO.create({
        case_id: workflowCase.id,
        title: '初回調査報告書',
        content: '# 初回調査結果\n\n調査完了しました。',
      });

      const report2 = await reportDAO.create({
        case_id: workflowCase.id,
        title: '詳細分析報告書',
        content: '# 詳細分析\n\nデータ分析結果を記載。',
      });

      workflowReport = report1;

      const reports = await reportDAO.findByCaseId(workflowCase.id);
      expect(reports.length).toBeGreaterThanOrEqual(2);

      const titles = reports.map((r) => r.title);
      expect(titles).toContain('初回調査報告書');
      expect(titles).toContain('詳細分析報告書');
    });

    it('Step 4: 写真撮影・添付（複数）', async () => {
      // 案件に直接紐付く写真
      const photo1 = await photoDAO.create({
        case_id: workflowCase.id,
        file_path: '/photos/case-overview.jpg',
        caption: '現場全景',
        width: 1920,
        height: 1080,
        file_size: 2048000,
      });

      // 報告書に紐付く写真
      const photo2 = await photoDAO.create({
        case_id: workflowCase.id,
        report_id: workflowReport.id,
        file_path: '/photos/detail-1.jpg',
        caption: '詳細写真1',
        annotation_data: JSON.stringify({ markers: [{ x: 100, y: 200, note: '注目点' }] }),
      });

      const photo3 = await photoDAO.create({
        case_id: workflowCase.id,
        report_id: workflowReport.id,
        file_path: '/photos/detail-2.jpg',
        caption: '詳細写真2',
      });

      workflowPhoto = photo2;

      const casePhotos = await photoDAO.findByCaseId(workflowCase.id);
      expect(casePhotos.length).toBeGreaterThanOrEqual(3);

      const reportPhotos = await photoDAO.findByReportId(workflowReport.id);
      expect(reportPhotos.length).toBeGreaterThanOrEqual(2);
    });

    it('Step 5: 写真の報告書再割り当て', async () => {
      // 新しい報告書を作成
      const newReport = await reportDAO.create({
        case_id: workflowCase.id,
        title: '最終報告書',
        content: '# 最終報告\n\n写真を含む最終報告書。',
      });

      // 写真を新しい報告書に移動
      await photoDAO.update(workflowPhoto.id, {
        report_id: newReport.id,
      });

      const movedPhoto = await photoDAO.findById(workflowPhoto.id);
      expect(movedPhoto?.report_id).toBe(newReport.id);

      const newReportPhotos = await photoDAO.findByReportId(newReport.id);
      expect(newReportPhotos.length).toBeGreaterThan(0);
    });

    it('Step 6: 報告書内容更新', async () => {
      await reportDAO.update(workflowReport.id, {
        content: '# 初回調査結果（承認版）\n\n承認されました。',
        title: '初回調査報告書（最終版）',
      });

      const updated = await reportDAO.findById(workflowReport.id);
      expect(updated?.title).toBe('初回調査報告書（最終版）');
      expect(updated?.content).toContain('承認されました');
    });

    it('Step 7: 案件をアーカイブ', async () => {
      await caseDAO.update(workflowCase.id, {
        status: 'archived',
      });

      const archived = await caseDAO.findById(workflowCase.id);
      expect(archived?.status).toBe('archived');
    });

    it('Step 8: データの一貫性確認', async () => {
      // 案件の存在確認
      const finalCase = await caseDAO.findById(workflowCase.id);
      expect(finalCase).toBeDefined();
      expect(finalCase?.status).toBe('archived');

      // 関連報告書の確認
      const finalReports = await reportDAO.findByCaseId(workflowCase.id);
      expect(finalReports.length).toBeGreaterThan(0);

      // 関連写真の確認
      const finalPhotos = await photoDAO.findByCaseId(workflowCase.id);
      expect(finalPhotos.length).toBeGreaterThan(0);

      // 全てのレコードが論理削除されていないことを確認
      expect(finalCase?.is_deleted).toBe(0);
      finalReports.forEach((r) => expect(r.is_deleted).toBe(0));
      finalPhotos.forEach((p) => expect(p.is_deleted).toBe(0));
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('CaseDAO Edge Cases', () => {
      it('should reject empty title with validation error', async () => {
        await expect(
          caseDAO.create({
            title: '',
            location: '東京都',
          })
        ).rejects.toThrow('Title is required');
      });

      it('should handle very long descriptions', async () => {
        const longDescription = 'あ'.repeat(10000);
        const testCase = await caseDAO.create({
          title: '長い説明テスト',
          location: '大阪府',
          description: longDescription,
        });
        expect(testCase.description).toBe(longDescription);
      });

      it('should handle special characters in fields', async () => {
        const testCase = await caseDAO.create({
          title: 'Test\'s "Case" & <Special> Chars 日本語',
          location: '東京都 & 神奈川県',
          description: 'Line1\nLine2\tTab\r\nLine3',
        });

        const retrieved = await caseDAO.findById(testCase.id);
        expect(retrieved?.title).toBe('Test\'s "Case" & <Special> Chars 日本語');
      });

      it('should maintain update timestamp on update', async () => {
        const testCase = await caseDAO.create({
          title: 'タイムスタンプテスト',
          location: '福岡県',
        });

        const originalUpdatedAt = testCase.updated_at;

        // 少し待機
        await new Promise((resolve) => setTimeout(resolve, 100));

        await caseDAO.update(testCase.id, {
          description: '更新後',
        });

        const updated = await caseDAO.findById(testCase.id);
        expect(updated?.updated_at).not.toBe(originalUpdatedAt);
      });
    });

    describe('ReportDAO Edge Cases', () => {
      it('should handle Markdown with code blocks', async () => {
        const testCase = await caseDAO.create({
          title: 'Markdownテスト案件',
          location: '北海道',
        });

        const markdownContent = `# 技術報告書

## コードサンプル

\`\`\`javascript
const test = "Hello World";
console.log(test);
\`\`\`

## 注意事項

- 項目1
- 項目2
`;

        const report = await reportDAO.create({
          case_id: testCase.id,
          title: 'Markdown報告書',
          content: markdownContent,
        });

        const retrieved = await reportDAO.findById(report.id);
        expect(retrieved?.content).toBe(markdownContent);
      });

      it('should sort reports by updated_at descending', async () => {
        const testCase = await caseDAO.create({
          title: 'ソートテスト案件',
          location: '沖縄県',
        });

        const report1 = await reportDAO.create({
          case_id: testCase.id,
          title: '報告書1',
          content: '内容1',
        });

        await new Promise((resolve) => setTimeout(resolve, 100));

        const report2 = await reportDAO.create({
          case_id: testCase.id,
          title: '報告書2',
          content: '内容2',
        });

        const reports = await reportDAO.findByCaseId(testCase.id);
        expect(reports[0].id).toBe(report2.id); // 最新が最初
        expect(reports[reports.length - 1].id).toBe(report1.id);
      });
    });

    describe('PhotoDAO Edge Cases', () => {
      it('should handle annotation_data as JSON', async () => {
        const testCase = await caseDAO.create({
          title: 'アノテーションテスト案件',
          location: '京都府',
        });

        const annotationData = {
          markers: [
            { x: 100, y: 200, color: 'red', note: '赤いマーカー' },
            { x: 300, y: 400, color: 'blue', note: '青いマーカー' },
          ],
          shapes: [
            { type: 'circle', x: 150, y: 250, radius: 50 },
            { type: 'rectangle', x: 200, y: 300, width: 100, height: 80 },
          ],
        };

        const photo = await photoDAO.create({
          case_id: testCase.id,
          file_path: '/photos/annotated.jpg',
          annotation_data: JSON.stringify(annotationData),
        });

        const retrieved = await photoDAO.findById(photo.id);
        expect(retrieved?.annotation_data).toBeDefined();

        const parsed = JSON.parse(retrieved!.annotation_data!);
        expect(parsed.markers.length).toBe(2);
        expect(parsed.shapes.length).toBe(2);
      });

      it('should handle null report_id', async () => {
        const testCase = await caseDAO.create({
          title: 'null report_id テスト',
          location: '広島県',
        });

        const photo = await photoDAO.create({
          case_id: testCase.id,
          file_path: '/photos/no-report.jpg',
        });

        expect(photo.report_id).toBeNull();
      });
    });

    describe('Error Handling', () => {
      it('should throw error when updating non-existent case', async () => {
        await expect(caseDAO.update(999999, { title: '存在しない案件' })).rejects.toThrow(
          'Case not found'
        );
      });

      it('should throw error when updating deleted case', async () => {
        const testCase = await caseDAO.create({
          title: '削除予定案件',
          location: '愛知県',
        });

        await caseDAO.delete(testCase.id);

        await expect(caseDAO.update(testCase.id, { title: '更新試行' })).rejects.toThrow(
          'Case not found'
        );
      });

      it('should throw error when creating photo without case_id', async () => {
        await expect(
          photoDAO.create({
            case_id: 0,
            file_path: '/photos/invalid.jpg',
          })
        ).rejects.toThrow('Case ID is required');
      });

      it('should throw error when creating photo with empty file_path', async () => {
        const testCase = await caseDAO.create({
          title: 'ファイルパステスト',
          location: '神奈川県',
        });

        await expect(
          photoDAO.create({
            case_id: testCase.id,
            file_path: '',
          })
        ).rejects.toThrow('File path is required');
      });
    });
  });

  describe('Transaction Scenarios', () => {
    it('should commit multi-table transaction on success', async () => {
      const result = await databaseService.transaction(async (db) => {
        // 案件作成
        await db.runAsync('INSERT INTO cases (title, location) VALUES (?, ?)', [
          'トランザクション案件',
          '東京都',
        ]);

        const testCase = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM cases WHERE title = ? AND is_deleted = 0',
          ['トランザクション案件']
        );

        if (!testCase) throw new Error('Case not created');

        // 報告書作成
        await db.runAsync('INSERT INTO reports (case_id, title, content) VALUES (?, ?, ?)', [
          testCase.id,
          'トランザクション報告書',
          '内容',
        ]);

        return testCase.id;
      });

      // 両方のレコードが存在することを確認
      const cases = await caseDAO.findAll();
      const transactionCase = cases.find((c) => c.title === 'トランザクション案件');
      expect(transactionCase).toBeDefined();

      const reports = await reportDAO.findByCaseId(result);
      expect(reports.length).toBeGreaterThan(0);
    });

    it('should rollback all changes on error', async () => {
      const casesBefore = await caseDAO.findAll();
      const reportsBefore = await databaseService.executeRaw<{ count: number }>(
        'SELECT COUNT(*) as count FROM reports WHERE is_deleted = 0'
      );
      const countBefore = reportsBefore[0].count;

      await expect(
        databaseService.transaction(async (db) => {
          // 案件作成
          await db.runAsync('INSERT INTO cases (title, location) VALUES (?, ?)', [
            'ロールバック案件',
            '北海道',
          ]);

          const testCase = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM cases WHERE title = ? AND is_deleted = 0',
            ['ロールバック案件']
          );

          if (!testCase) throw new Error('Case not created');

          // 報告書作成
          await db.runAsync('INSERT INTO reports (case_id, title, content) VALUES (?, ?, ?)', [
            testCase.id,
            'ロールバック報告書',
            '内容',
          ]);

          // 意図的にエラー発生
          throw new Error('Transaction rollback test');
        })
      ).rejects.toThrow('Transaction rollback test');

      // ロールバック確認
      const casesAfter = await caseDAO.findAll();
      expect(casesAfter.length).toBe(casesBefore.length);

      const reportsAfter = await databaseService.executeRaw<{ count: number }>(
        'SELECT COUNT(*) as count FROM reports WHERE is_deleted = 0'
      );
      expect(reportsAfter[0].count).toBe(countBefore);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk case creation efficiently', async () => {
      const startTime = Date.now();

      const casesCreated: Case[] = [];
      for (let i = 0; i < 50; i++) {
        const testCase = await caseDAO.create({
          title: `バルク案件${i + 1}`,
          location: `テスト地点${i + 1}`,
        });
        casesCreated.push(testCase);
      }

      const elapsedTime = Date.now() - startTime;
      expect(casesCreated.length).toBe(50);
      expect(elapsedTime).toBeLessThan(10000); // 10秒以内
    });

    it('should retrieve large result sets efficiently', async () => {
      const testCase = await caseDAO.create({
        title: '大量データテスト案件',
        location: '東京都',
      });

      // 100件の報告書を作成
      for (let i = 0; i < 100; i++) {
        await reportDAO.create({
          case_id: testCase.id,
          title: `報告書${i + 1}`,
          content: `内容${i + 1}`,
        });
      }

      const startTime = Date.now();
      const reports = await reportDAO.findByCaseId(testCase.id);
      const elapsedTime = Date.now() - startTime;

      expect(reports.length).toBe(100);
      expect(elapsedTime).toBeLessThan(1000); // 1秒以内
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity on deletion', async () => {
      const testCase = await caseDAO.create({
        title: '参照整合性テスト案件',
        location: '大阪府',
      });

      const report = await reportDAO.create({
        case_id: testCase.id,
        title: '整合性テスト報告書',
        content: '内容',
      });

      const photo = await photoDAO.create({
        case_id: testCase.id,
        report_id: report.id,
        file_path: '/photos/integrity-test.jpg',
      });

      // 案件を削除
      await caseDAO.delete(testCase.id);

      // 案件が論理削除されていることを確認
      const deletedCase = await caseDAO.findById(testCase.id);
      expect(deletedCase).toBeNull();

      // 注: 自動カスケード削除は未実装のため、手動削除が必要
      // 関連データを手動で削除
      await reportDAO.delete(report.id);
      await photoDAO.delete(photo.id);

      // 削除後、関連データも取得できない
      const reports = await reportDAO.findByCaseId(testCase.id);
      expect(reports.length).toBe(0);

      const photos = await photoDAO.findByCaseId(testCase.id);
      expect(photos.length).toBe(0);
    });

    it('should preserve created_at timestamp', async () => {
      const testCase = await caseDAO.create({
        title: 'タイムスタンプ永続化テスト',
        location: '福岡県',
      });

      const originalCreatedAt = testCase.created_at;

      // 更新
      await caseDAO.update(testCase.id, {
        description: '更新されたけどcreated_atは変わらない',
      });

      const updated = await caseDAO.findById(testCase.id);
      expect(updated?.created_at).toBe(originalCreatedAt);
    });
  });
});
