/**
 * CaseDAO Integration Tests
 *
 * テスト範囲:
 * - CRUD操作の完全性
 * - トランザクションの整合性
 * - エラーハンドリング
 * - 検索・フィルタリング機能
 * - 論理削除の動作
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from '@jest/globals';
import { nodeDatabaseService } from '../../../src/services/DatabaseService.node';
import { caseDAO } from '../../../src/dao/CaseDAO';
import type { CreateCaseInput, UpdateCaseInput, CaseStatus } from '../../../src/types/case';

// DatabaseServiceのモック
jest.mock('../../../src/services/DatabaseService', () => ({
  databaseService: {
    initialize: () => nodeDatabaseService.initialize(),
    getDatabase: () => nodeDatabaseService.getDatabase(),
  },
}));

describe('CaseDAO Integration Tests', () => {
  // テスト前にデータベースを初期化
  beforeAll(async () => {
    await nodeDatabaseService.initialize();
  });

  // 全テスト終了後にデータベースをクローズ
  afterAll(() => {
    nodeDatabaseService.close();
  });

  // 各テスト後にテーブルをクリーンアップ
  afterEach(async () => {
    await caseDAO.truncate();
  });

  describe('create()', () => {
    it('should create a new case with all required fields', async () => {
      const input: CreateCaseInput = {
        title: 'テスト案件001',
        client_name: '株式会社テスト',
        location: '東京都渋谷区',
        description: 'これはテスト案件です',
        status: 'active',
      };

      const created = await caseDAO.create(input);

      expect(created.id).toBeGreaterThan(0);
      expect(created.title).toBe(input.title);
      expect(created.client_name).toBe(input.client_name);
      expect(created.location).toBe(input.location);
      expect(created.description).toBe(input.description);
      expect(created.status).toBe('active');
      expect(created.is_deleted).toBe(0);
      expect(created.created_at).toBeDefined();
      expect(created.updated_at).toBeDefined();
    });

    it('should create a case with only required fields', async () => {
      const input: CreateCaseInput = {
        title: 'ミニマル案件',
      };

      const created = await caseDAO.create(input);

      expect(created.id).toBeGreaterThan(0);
      expect(created.title).toBe(input.title);
      expect(created.client_name).toBeNull();
      expect(created.location).toBeNull();
      expect(created.description).toBeNull();
      expect(created.status).toBe('active'); // デフォルト値
      expect(created.is_deleted).toBe(0);
    });

    it('should create cases with different statuses', async () => {
      const statuses: CaseStatus[] = ['active', 'completed', 'archived'];

      for (const status of statuses) {
        const input: CreateCaseInput = {
          title: `案件-${status}`,
          status,
        };

        const created = await caseDAO.create(input);
        expect(created.status).toBe(status);
      }
    });
  });

  describe('findById()', () => {
    it('should find an existing case by ID', async () => {
      const created = await caseDAO.create({ title: 'FindById案件' });

      const found = await caseDAO.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.title).toBe('FindById案件');
    });

    it('should return null for non-existent ID', async () => {
      const found = await caseDAO.findById(99999);

      expect(found).toBeNull();
    });

    it('should not find logically deleted case', async () => {
      const created = await caseDAO.create({ title: '削除予定案件' });
      await caseDAO.delete(created.id);

      const found = await caseDAO.findById(created.id);

      expect(found).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('should return empty array when no cases exist', async () => {
      const cases = await caseDAO.findAll();

      expect(cases).toEqual([]);
    });

    it('should return all active cases', async () => {
      await caseDAO.create({ title: '案件A' });
      await caseDAO.create({ title: '案件B' });
      await caseDAO.create({ title: '案件C' });

      const cases = await caseDAO.findAll();

      expect(cases).toHaveLength(3);
      const titles = cases.map((c) => c.title);
      expect(titles).toContain('案件A');
      expect(titles).toContain('案件B');
      expect(titles).toContain('案件C');
    });

    it('should not return logically deleted cases', async () => {
      const case1 = await caseDAO.create({ title: '有効案件' });
      const case2 = await caseDAO.create({ title: '削除案件' });
      await caseDAO.delete(case2.id);

      const cases = await caseDAO.findAll();

      expect(cases).toHaveLength(1);
      expect(cases[0].id).toBe(case1.id);
    });

    it('should return cases ordered by created_at DESC', async () => {
      // わずかな遅延を入れて作成時刻を異なるものにする
      const case1 = await caseDAO.create({ title: '最古の案件' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const case2 = await caseDAO.create({ title: '中間の案件' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const case3 = await caseDAO.create({ title: '最新の案件' });

      const cases = await caseDAO.findAll();

      expect(cases[0].id).toBe(case3.id); // 最新
      expect(cases[1].id).toBe(case2.id);
      expect(cases[2].id).toBe(case1.id); // 最古
    });
  });

  describe('findByStatus()', () => {
    beforeEach(async () => {
      await caseDAO.create({ title: 'アクティブ1', status: 'active' });
      await caseDAO.create({ title: 'アクティブ2', status: 'active' });
      await caseDAO.create({ title: '完了1', status: 'completed' });
      await caseDAO.create({ title: 'アーカイブ1', status: 'archived' });
    });

    it('should find cases by active status', async () => {
      const cases = await caseDAO.findByStatus('active');

      expect(cases).toHaveLength(2);
      expect(cases.every((c) => c.status === 'active')).toBe(true);
    });

    it('should find cases by completed status', async () => {
      const cases = await caseDAO.findByStatus('completed');

      expect(cases).toHaveLength(1);
      expect(cases[0].status).toBe('completed');
    });

    it('should find cases by archived status', async () => {
      const cases = await caseDAO.findByStatus('archived');

      expect(cases).toHaveLength(1);
      expect(cases[0].status).toBe('archived');
    });

    it('should return empty array for status with no cases', async () => {
      await caseDAO.truncate();
      const cases = await caseDAO.findByStatus('active');

      expect(cases).toEqual([]);
    });
  });

  describe('update()', () => {
    it('should update title field', async () => {
      const created = await caseDAO.create({ title: '旧タイトル' });

      const updated = await caseDAO.update(created.id, { title: '新タイトル' });

      expect(updated.title).toBe('新タイトル');
      expect(updated.updated_at).toBeDefined();
    });

    it('should update multiple fields at once', async () => {
      const created = await caseDAO.create({
        title: '旧タイトル',
        client_name: '旧クライアント',
        location: '旧所在地',
      });

      const input: UpdateCaseInput = {
        title: '新タイトル',
        client_name: '新クライアント',
        location: '新所在地',
        description: '追加された説明',
      };

      const updated = await caseDAO.update(created.id, input);

      expect(updated.title).toBe(input.title);
      expect(updated.client_name).toBe(input.client_name);
      expect(updated.location).toBe(input.location);
      expect(updated.description).toBe(input.description);
    });

    it('should update status field', async () => {
      const created = await caseDAO.create({ title: '案件', status: 'active' });

      const updated = await caseDAO.update(created.id, { status: 'completed' });

      expect(updated.status).toBe('completed');
    });

    it('should update only specified fields', async () => {
      const created = await caseDAO.create({
        title: '案件',
        client_name: 'クライアント',
        location: '所在地',
      });

      const updated = await caseDAO.update(created.id, { title: '新タイトル' });

      expect(updated.title).toBe('新タイトル');
      expect(updated.client_name).toBe(created.client_name); // 変更なし
      expect(updated.location).toBe(created.location); // 変更なし
    });

    it('should throw error when updating non-existent case', async () => {
      await expect(caseDAO.update(99999, { title: '新タイトル' })).rejects.toThrow(
        'Case #99999 not found'
      );
    });

    it('should throw error when updating logically deleted case', async () => {
      const created = await caseDAO.create({ title: '削除予定' });
      await caseDAO.delete(created.id);

      await expect(caseDAO.update(created.id, { title: '更新' })).rejects.toThrow(
        `Case #${created.id} not found`
      );
    });
  });

  describe('delete()', () => {
    it('should logically delete a case', async () => {
      const created = await caseDAO.create({ title: '削除予定案件' });

      await caseDAO.delete(created.id);

      const found = await caseDAO.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent case', async () => {
      await expect(caseDAO.delete(99999)).rejects.toThrow('Case #99999 not found');
    });

    it('should throw error when deleting already deleted case', async () => {
      const created = await caseDAO.create({ title: '案件' });
      await caseDAO.delete(created.id);

      await expect(caseDAO.delete(created.id)).rejects.toThrow(`Case #${created.id} not found`);
    });
  });

  describe('searchByTitle()', () => {
    beforeEach(async () => {
      await caseDAO.create({ title: '東京オフィス改修工事' });
      await caseDAO.create({ title: '大阪支店新設プロジェクト' });
      await caseDAO.create({ title: '名古屋ビル点検作業' });
      await caseDAO.create({ title: '福岡事務所移転' });
    });

    it('should search cases by partial title match', async () => {
      const results = await caseDAO.searchByTitle('オフィス');

      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('東京オフィス改修工事');
    });

    it('should search cases with multiple matches', async () => {
      const results = await caseDAO.searchByTitle('事');

      expect(results.length).toBeGreaterThanOrEqual(2);
      const titles = results.map((r) => r.title);
      expect(titles).toContain('東京オフィス改修工事');
      expect(titles).toContain('福岡事務所移転');
    });

    it('should return empty array when no match found', async () => {
      const results = await caseDAO.searchByTitle('存在しないキーワード');

      expect(results).toEqual([]);
    });

    it('should be case-insensitive for ASCII characters', async () => {
      await caseDAO.create({ title: 'ABC Project' });

      const results = await caseDAO.searchByTitle('abc');

      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('updateStatus()', () => {
    it('should update status using dedicated method', async () => {
      const created = await caseDAO.create({ title: '案件', status: 'active' });

      const updated = await caseDAO.updateStatus(created.id, 'completed');

      expect(updated.status).toBe('completed');
    });

    it('should update status from active to archived', async () => {
      const created = await caseDAO.create({ title: '案件', status: 'active' });

      const updated = await caseDAO.updateStatus(created.id, 'archived');

      expect(updated.status).toBe('archived');
    });
  });

  describe('count()', () => {
    it('should return 0 when no cases exist', async () => {
      const count = await caseDAO.count();

      expect(count).toBe(0);
    });

    it('should return correct count of active cases', async () => {
      await caseDAO.create({ title: '案件1' });
      await caseDAO.create({ title: '案件2' });
      await caseDAO.create({ title: '案件3' });

      const count = await caseDAO.count();

      expect(count).toBe(3);
    });

    it('should not count logically deleted cases', async () => {
      await caseDAO.create({ title: '案件1' });
      const case2 = await caseDAO.create({ title: '案件2' });
      await caseDAO.create({ title: '案件3' });
      await caseDAO.delete(case2.id);

      const count = await caseDAO.count();

      expect(count).toBe(2);
    });
  });

  describe('countByStatus()', () => {
    beforeEach(async () => {
      await caseDAO.create({ title: 'アクティブ1', status: 'active' });
      await caseDAO.create({ title: 'アクティブ2', status: 'active' });
      await caseDAO.create({ title: '完了1', status: 'completed' });
    });

    it('should count cases by active status', async () => {
      const count = await caseDAO.countByStatus('active');

      expect(count).toBe(2);
    });

    it('should count cases by completed status', async () => {
      const count = await caseDAO.countByStatus('completed');

      expect(count).toBe(1);
    });

    it('should return 0 for status with no cases', async () => {
      const count = await caseDAO.countByStatus('archived');

      expect(count).toBe(0);
    });
  });

  describe('hardDelete()', () => {
    it('should physically delete a case from database', async () => {
      const created = await caseDAO.create({ title: '物理削除予定' });

      await caseDAO.hardDelete(created.id);

      // 論理削除チェックを回避して直接SQLで確認
      const db = nodeDatabaseService.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM cases WHERE id = ?',
        [created.id]
      );

      expect(result?.count).toBe(0);
    });
  });

  describe('truncate()', () => {
    it('should delete all cases from database', async () => {
      await caseDAO.create({ title: '案件1' });
      await caseDAO.create({ title: '案件2' });
      await caseDAO.create({ title: '案件3' });

      await caseDAO.truncate();

      const count = await caseDAO.count();
      expect(count).toBe(0);
    });
  });
});
