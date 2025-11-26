/**
 * ReportDAO Integration Tests
 *
 * テスト範囲:
 * - CRUD操作の完全性
 * - 案件との紐付け
 * - 論理削除の動作
 * - エラーハンドリング
 * - 検索機能
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import { nodeDatabaseService } from '../../services/DatabaseService.node';
import { reportDAO } from '../ReportDAO';
import { caseDAO } from '../CaseDAO';
import type { CreateReportInput, UpdateReportInput } from '../../types/case';

// DatabaseServiceのモック
jest.mock('../../services/DatabaseService', () => ({
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
        title: 'テスト報告書',
        content: '報告書の内容です。',
        voice_buffer: '音声データ',
        summary_json: '{"summary":"要約内容"}',
        processing_time: 1500,
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
    });
  });

  describe('findById()', () => {
    it('should find an existing report by ID', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: 'FindById報告書',
        content: '内容',
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
        content: '内容',
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
      await reportDAO.create({ case_id: testCaseId, title: '報告書A', content: 'A' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書B', content: 'B' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書C', content: 'C' });

      const reports = await reportDAO.findAll();

      expect(reports).toHaveLength(3);
    });

    it('should not return logically deleted reports', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '有効報告書', content: 'A' });
      const deleted = await reportDAO.create({
        case_id: testCaseId,
        title: '削除報告書',
        content: 'B',
      });
      await reportDAO.delete(deleted.id);

      const reports = await reportDAO.findAll();

      expect(reports).toHaveLength(1);
      expect(reports[0].title).toBe('有効報告書');
    });

    it('should return reports ordered by created_at DESC', async () => {
      const report1 = await reportDAO.create({
        case_id: testCaseId,
        title: '最古の報告書',
        content: 'A',
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '中間の報告書',
        content: 'B',
      });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const report3 = await reportDAO.create({
        case_id: testCaseId,
        title: '最新の報告書',
        content: 'C',
      });

      const reports = await reportDAO.findAll();

      expect(reports[0].id).toBe(report3.id); // 最新
      expect(reports[1].id).toBe(report2.id);
      expect(reports[2].id).toBe(report1.id); // 最古
    });
  });

  describe('findByCaseId()', () => {
    it('should find reports by case ID', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1', content: 'A' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2', content: 'B' });

      // 別の案件の報告書
      const otherCase = await caseDAO.create({ title: '別の案件' });
      await reportDAO.create({ case_id: otherCase.id, title: '報告書3', content: 'C' });

      const reports = await reportDAO.findByCaseId(testCaseId);

      expect(reports).toHaveLength(2);
      expect(reports.every((r) => r.case_id === testCaseId)).toBe(true);
    });

    it('should return empty array for case with no reports', async () => {
      const reports = await reportDAO.findByCaseId(testCaseId);

      expect(reports).toEqual([]);
    });
  });

  describe('update()', () => {
    it('should update title', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '旧タイトル',
        content: '内容',
      });

      const updated = await reportDAO.update(created.id, { title: '新タイトル' });

      expect(updated.title).toBe('新タイトル');
      expect(updated.updated_at).not.toBe(created.updated_at);
    });

    it('should update content', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: 'タイトル',
        content: '旧内容',
      });

      const updated = await reportDAO.update(created.id, { content: '新内容' });

      expect(updated.content).toBe('新内容');
    });

    it('should update voice_buffer', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: 'タイトル',
        content: '内容',
      });

      const updated = await reportDAO.update(created.id, { voice_buffer: '音声バッファ' });

      expect(updated.voice_buffer).toBe('音声バッファ');
    });

    it('should update summary_json', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: 'タイトル',
        content: '内容',
      });

      const summaryJson = '{"summary":"AI要約結果"}';
      const updated = await reportDAO.update(created.id, { summary_json: summaryJson });

      expect(updated.summary_json).toBe(summaryJson);
    });

    it('should update processing_time', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: 'タイトル',
        content: '内容',
      });

      const updated = await reportDAO.update(created.id, { processing_time: 2500 });

      expect(updated.processing_time).toBe(2500);
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
        voice_buffer: '音声',
        summary_json: '{"summary":"要約"}',
        processing_time: 3000,
      };

      const updated = await reportDAO.update(created.id, input);

      expect(updated.title).toBe(input.title);
      expect(updated.content).toBe(input.content);
      expect(updated.voice_buffer).toBe(input.voice_buffer);
      expect(updated.summary_json).toBe(input.summary_json);
      expect(updated.processing_time).toBe(input.processing_time);
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
        content: '内容',
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
        content: '内容',
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
        content: '内容',
      });
      await reportDAO.delete(created.id);

      await expect(reportDAO.delete(created.id)).rejects.toThrow(`Report #${created.id} not found`);
    });
  });

  describe('searchByTitle()', () => {
    beforeEach(async () => {
      await reportDAO.create({
        case_id: testCaseId,
        title: '東京オフィス改修報告書',
        content: '内容A',
      });
      await reportDAO.create({
        case_id: testCaseId,
        title: '大阪支店新設プロジェクト報告',
        content: '内容B',
      });
      await reportDAO.create({
        case_id: testCaseId,
        title: '名古屋ビル点検報告',
        content: '内容C',
      });
    });

    it('should search reports by partial title match', async () => {
      const results = await reportDAO.searchByTitle('オフィス');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('東京オフィス改修報告書');
    });

    it('should search reports with multiple matches', async () => {
      const results = await reportDAO.searchByTitle('報告');

      expect(results.length).toBeGreaterThanOrEqual(2);
      const titles = results.map((r) => r.title);
      expect(titles).toContain('東京オフィス改修報告書');
      expect(titles).toContain('名古屋ビル点検報告');
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
        title: '報告書A',
        content: '東京オフィスの状況について',
      });
      await reportDAO.create({
        case_id: testCaseId,
        title: '報告書B',
        content: '大阪支店のプロジェクト進捗',
      });
      await reportDAO.create({
        case_id: testCaseId,
        title: '報告書C',
        content: '名古屋ビルの点検結果について',
      });
    });

    it('should search reports by partial content match', async () => {
      const results = await reportDAO.searchByContent('オフィス');

      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('東京オフィス');
    });

    it('should search reports with multiple matches', async () => {
      const results = await reportDAO.searchByContent('について');

      expect(results.length).toBeGreaterThanOrEqual(2);
      const contents = results.map((r) => r.content);
      expect(contents.some((c) => c?.includes('東京オフィス'))).toBe(true);
      expect(contents.some((c) => c?.includes('名古屋ビル'))).toBe(true);
    });

    it('should return empty array when no match found', async () => {
      const results = await reportDAO.searchByContent('存在しないキーワード');

      expect(results).toEqual([]);
    });
  });

  describe('count()', () => {
    it('should return 0 when no reports exist', async () => {
      const count = await reportDAO.count();

      expect(count).toBe(0);
    });

    it('should return correct count of active reports', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1', content: 'A' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2', content: 'B' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3', content: 'C' });

      const count = await reportDAO.count();

      expect(count).toBe(3);
    });

    it('should not count logically deleted reports', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1', content: 'A' });
      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '報告書2',
        content: 'B',
      });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3', content: 'C' });
      await reportDAO.delete(report2.id);

      const count = await reportDAO.count();

      expect(count).toBe(2);
    });
  });

  describe('countByCaseId()', () => {
    it('should count reports by case ID', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1', content: 'A' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2', content: 'B' });

      const count = await reportDAO.countByCaseId(testCaseId);

      expect(count).toBe(2);
    });

    it('should return 0 for case with no reports', async () => {
      const count = await reportDAO.countByCaseId(testCaseId);

      expect(count).toBe(0);
    });
  });

  describe('deleteByCaseId()', () => {
    it('should delete all reports for a case', async () => {
      await reportDAO.create({ case_id: testCaseId, title: '報告書1', content: 'A' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2', content: 'B' });

      // 別の案件の報告書
      const otherCase = await caseDAO.create({ title: '別の案件' });
      await reportDAO.create({ case_id: otherCase.id, title: '報告書3', content: 'C' });

      await reportDAO.deleteByCaseId(testCaseId);

      const caseReports = await reportDAO.findByCaseId(testCaseId);
      const otherReports = await reportDAO.findByCaseId(otherCase.id);

      expect(caseReports).toHaveLength(0);
      expect(otherReports).toHaveLength(1);
    });
  });

  describe('hardDelete()', () => {
    it('should physically delete a report from database', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '物理削除予定',
        content: '内容',
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
      await reportDAO.create({ case_id: testCaseId, title: '報告書1', content: 'A' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2', content: 'B' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3', content: 'C' });

      await reportDAO.truncate();

      const count = await reportDAO.count();
      expect(count).toBe(0);
    });
  });
});
