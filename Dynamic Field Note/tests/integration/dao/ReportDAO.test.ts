/**
 * ReportDAO Integration Tests
 *
 * テスト範囲:
 * - CRUD操作の完全性
 * - 案件との関連性（外部キー制約）
 * - トランザクションの整合性
 * - エラーハンドリング
 * - 検索・フィルタリング機能
 * - 論理削除の動作
 */

import { describe, it, expect, beforeAll, afterEach, beforeEach, afterAll } from '@jest/globals';
import { nodeDatabaseService } from '../../../src/services/DatabaseService.node';
import { caseDAO } from '../../../src/dao/CaseDAO';
import { reportDAO } from '../../../src/dao/ReportDAO';
import type { CreateReportInput, UpdateReportInput } from '../../../src/types/case';

// DatabaseServiceのモック
jest.mock('../../../src/services/DatabaseService', () => ({
  databaseService: {
    initialize: () => nodeDatabaseService.initialize(),
    getDatabase: () => nodeDatabaseService.getDatabase(),
  },
}));

describe('ReportDAO Integration Tests', () => {
  let testCaseId: number;

  // テスト前にデータベースを初期化
  beforeAll(async () => {
    await nodeDatabaseService.initialize();
  });

  // 全テスト終了後にデータベースをクローズ
  afterAll(() => {
    nodeDatabaseService.close();
  });

  // 各テスト前にテスト用の案件を作成
  beforeEach(async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    testCaseId = testCase.id;
  });

  // 各テスト後にテーブルをクリーンアップ
  afterEach(async () => {
    await reportDAO.truncate();
    await caseDAO.truncate();
  });

  describe('create()', () => {
    it('should create a new report with all fields', async () => {
      const input: CreateReportInput = {
        case_id: testCaseId,
        title: 'テスト報告書001',
        content: 'これは報告書の内容です',
        voice_buffer: 'VTTデータ...',
        summary_json: '{"summary": "要約データ"}',
        processing_time: 12.5,
      };

      const created = await reportDAO.create(input);

      expect(created.id).toBeGreaterThan(0);
      expect(created.case_id).toBe(testCaseId);
      expect(created.title).toBe(input.title);
      expect(created.content).toBe(input.content);
      expect(created.voice_buffer).toBe(input.voice_buffer);
      expect(created.summary_json).toBe(input.summary_json);
      expect(created.processing_time).toBe(input.processing_time);
      expect(created.is_deleted).toBe(0);
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
    });

    it('should create a report with only required fields', async () => {
      const input: CreateReportInput = {
        case_id: testCaseId,
        title: 'ミニマル報告書',
      };

      const created = await reportDAO.create(input);

      expect(created.id).toBeGreaterThan(0);
      expect(created.case_id).toBe(testCaseId);
      expect(created.title).toBe(input.title);
      expect(created.content).toBeNull();
      expect(created.voice_buffer).toBeNull();
      expect(created.summary_json).toBeNull();
      expect(created.processing_time).toBeNull();
      expect(created.is_deleted).toBe(0);
    });

    it('should create multiple reports for the same case', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3' });

      const reports = await reportDAO.findByCaseId(testCaseId);

      expect(reports).toHaveLength(3);
    });

    it('should fail when creating report with non-existent case_id', async () => {
      const input: CreateReportInput = {
        case_id: 99999,
        title: '無効な案件の報告書',
      };

      await expect(reportDAO.create(input)).rejects.toThrow(); // 外部キー制約違反
    });
  });

  describe('findById()', () => {
    it('should find an existing report by ID', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: 'FindById報告書',
      });

      const found = await reportDAO.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('FindById報告書');
    });

    it('should return null for non-existent ID', async () => {
      const found = await reportDAO.findById(99999);

      expect(found).toBeNull();
    });

    it('should not find logically deleted report', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '削除予定報告書',
      });
      await reportDAO.delete(created.id);

      const found = await reportDAO.findById(created.id);

      expect(found).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('should return empty array when no reports exist', async () => {
      const reports = await reportDAO.findAll();

      expect(reports).toEqual([]);
    });

    it('should return all active reports', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書A' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書B' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書C' });

      const reports = await reportDAO.findAll();

      expect(reports).toHaveLength(3);
      const titles = reports.map((r) => r.title);
      expect(titles).toContain('報告書A');
      expect(titles).toContain('報告書B');
      expect(titles).toContain('報告書C');
    });

    it('should not return logically deleted reports', async () => {
      const report1 = await reportDAO.create({ case_id: testCaseId, title: '有効報告書' });
      const report2 = await reportDAO.create({ case_id: testCaseId, title: '削除報告書' });
      await reportDAO.delete(report2.id);

      const reports = await reportDAO.findAll();

      expect(reports).toHaveLength(1);
      expect(reports[0].id).toBe(report1.id);
    });

    it('should return reports from multiple cases', async () => {
      const case2 = await caseDAO.create({ title: '案件2' });

      await reportDAO.create({ case_id: testCaseId, title: '案件1の報告書' });
      await reportDAO.create({ case_id: case2.id, title: '案件2の報告書' });

      const reports = await reportDAO.findAll();

      expect(reports).toHaveLength(2);
    });
  });

  describe('findByCaseId()', () => {
    it('should find all reports for a specific case', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2' });

      const case2 = await caseDAO.create({ title: '案件2' });
      await reportDAO.create({ case_id: case2.id, title: '他の案件の報告書' });

      const reports = await reportDAO.findByCaseId(testCaseId);

      expect(reports).toHaveLength(2);
      expect(reports.every((r) => r.case_id === testCaseId)).toBe(true);
    });

    it('should return empty array for case with no reports', async () => {
      const case2 = await caseDAO.create({ title: '空の案件' });

      const reports = await reportDAO.findByCaseId(case2.id);

      expect(reports).toEqual([]);
    });

    it('should not return logically deleted reports', async () => {
      const report1 = await reportDAO.create({ case_id: testCaseId, title: '有効報告書' });
      const report2 = await reportDAO.create({ case_id: testCaseId, title: '削除報告書' });
      await reportDAO.delete(report2.id);

      const reports = await reportDAO.findByCaseId(testCaseId);

      expect(reports).toHaveLength(1);
      expect(reports[0].id).toBe(report1.id);
    });
  });

  describe('update()', () => {
    it('should update title field', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '旧タイトル',
      });

      const updated = await reportDAO.update(created.id, { title: '新タイトル' });

      expect(updated.title).toBe('新タイトル');
      expect(updated.updated_at).toBeDefined();
    });

    it('should update multiple fields at once', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '旧タイトル',
        content: '旧内容',
      });

      const input: UpdateReportInput = {
        title: '新タイトル',
        content: '新内容',
        voice_buffer: '新VTTデータ',
        summary_json: '{"new": "data"}',
        processing_time: 15.3,
      };

      const updated = await reportDAO.update(created.id, input);

      expect(updated.title).toBe(input.title);
      expect(updated.content).toBe(input.content);
      expect(updated.voice_buffer).toBe(input.voice_buffer);
      expect(updated.summary_json).toBe(input.summary_json);
      expect(updated.processing_time).toBe(input.processing_time);
    });

    it('should update only specified fields', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '報告書',
        content: '元の内容',
      });

      const updated = await reportDAO.update(created.id, { title: '新タイトル' });

      expect(updated.title).toBe('新タイトル');
      expect(updated.content).toBe(created.content); // 変更なし
    });

    it('should throw error when updating non-existent report', async () => {
      await expect(reportDAO.update(99999, { title: '新タイトル' })).rejects.toThrow(
        'Report #99999 not found'
      );
    });

    it('should throw error when updating logically deleted report', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '削除予定',
      });
      await reportDAO.delete(created.id);

      await expect(reportDAO.update(created.id, { title: '更新' })).rejects.toThrow(
        `Report #${created.id} not found`
      );
    });
  });

  describe('delete()', () => {
    it('should logically delete a report', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '削除予定報告書',
      });

      await reportDAO.delete(created.id);

      const found = await reportDAO.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent report', async () => {
      await expect(reportDAO.delete(99999)).rejects.toThrow('Report #99999 not found');
    });

    it('should throw error when deleting already deleted report', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '報告書',
      });
      await reportDAO.delete(created.id);

      await expect(reportDAO.delete(created.id)).rejects.toThrow(`Report #${created.id} not found`);
    });
  });

  describe('searchByTitle()', () => {
    beforeEach(async () => {
      await reportDAO.create({ case_id: testCaseId, title: '東京オフィス調査報告' });
      await reportDAO.create({ case_id: testCaseId, title: '大阪支店点検レポート' });
      await reportDAO.create({ case_id: testCaseId, title: '名古屋ビル検査結果' });
      await reportDAO.create({ case_id: testCaseId, title: '福岡事務所評価報告書' });
    });

    it('should search reports by partial title match', async () => {
      const results = await reportDAO.searchByTitle('調査');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('東京オフィス調査報告');
    });

    it('should search reports with multiple matches', async () => {
      const results = await reportDAO.searchByTitle('報告');

      expect(results.length).toBeGreaterThanOrEqual(2);
      const titles = results.map((r) => r.title);
      expect(titles).toContain('東京オフィス調査報告');
      expect(titles).toContain('福岡事務所評価報告書');
    });

    it('should return empty array when no match found', async () => {
      const results = await reportDAO.searchByTitle('存在しないキーワード');

      expect(results).toEqual([]);
    });
  });

  describe('searchByContent()', () => {
    beforeEach(async () => {
      await reportDAO.create({
        case_id: testCaseId,
        title: '報告書1',
        content: 'この報告書には重要な情報が含まれています',
      });
      await reportDAO.create({
        case_id: testCaseId,
        title: '報告書2',
        content: '調査結果の詳細を記載しています',
      });
      await reportDAO.create({
        case_id: testCaseId,
        title: '報告書3',
        content: '重要な発見事項について報告します',
      });
    });

    it('should search reports by content', async () => {
      const results = await reportDAO.searchByContent('重要');

      expect(results.length).toBeGreaterThanOrEqual(2);
    });

    it('should return empty array when no content match found', async () => {
      const results = await reportDAO.searchByContent('存在しない文字列');

      expect(results).toEqual([]);
    });
  });

  describe('countByCaseId()', () => {
    it('should count reports for a specific case', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3' });

      const count = await reportDAO.countByCaseId(testCaseId);

      expect(count).toBe(3);
    });

    it('should return 0 for case with no reports', async () => {
      const case2 = await caseDAO.create({ title: '空の案件' });

      const count = await reportDAO.countByCaseId(case2.id);

      expect(count).toBe(0);
    });

    it('should not count logically deleted reports', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      const report2 = await reportDAO.create({ case_id: testCaseId, title: '報告書2' });
      await reportDAO.delete(report2.id);

      const count = await reportDAO.countByCaseId(testCaseId);

      expect(count).toBe(1);
    });
  });

  describe('count()', () => {
    it('should return 0 when no reports exist', async () => {
      const count = await reportDAO.count();

      expect(count).toBe(0);
    });

    it('should return correct count of active reports', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3' });

      const count = await reportDAO.count();

      expect(count).toBe(3);
    });

    it('should not count logically deleted reports', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      const report2 = await reportDAO.create({ case_id: testCaseId, title: '報告書2' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3' });
      await reportDAO.delete(report2.id);

      const count = await reportDAO.count();

      expect(count).toBe(2);
    });
  });

  describe('deleteByCaseId()', () => {
    it('should delete all reports for a specific case', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3' });

      await reportDAO.deleteByCaseId(testCaseId);

      const reports = await reportDAO.findByCaseId(testCaseId);
      expect(reports).toEqual([]);
    });

    it('should not affect reports from other cases', async () => {
      const case2 = await caseDAO.create({ title: '案件2' });

      await reportDAO.create({ case_id: testCaseId, title: '案件1の報告書' });
      await reportDAO.create({ case_id: case2.id, title: '案件2の報告書' });

      await reportDAO.deleteByCaseId(testCaseId);

      const case1Reports = await reportDAO.findByCaseId(testCaseId);
      const case2Reports = await reportDAO.findByCaseId(case2.id);

      expect(case1Reports).toEqual([]);
      expect(case2Reports).toHaveLength(1);
    });
  });

  describe('hardDelete()', () => {
    it('should physically delete a report from database', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '物理削除予定',
      });

      await reportDAO.hardDelete(created.id);

      // 論理削除チェックを回避して直接SQLで確認
      const db = nodeDatabaseService.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM reports WHERE id = ?',
        [created.id]
      );

      expect(result?.count).toBe(0);
    });
  });

  describe('truncate()', () => {
    it('should delete all reports from database', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3' });

      await reportDAO.truncate();

      const count = await reportDAO.count();
      expect(count).toBe(0);
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should cascade delete reports when parent case is deleted', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2' });

      // 案件を物理削除（CASCADE DELETE発動）
      await caseDAO.hardDelete(testCaseId);

      // 論理削除チェックを回避して直接SQLで確認
      const db = nodeDatabaseService.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM reports WHERE case_id = ?',
        [testCaseId]
      );

      expect(result?.count).toBe(0);
    });
  });
});
