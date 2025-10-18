/**
 * CaseDAO Test
 * テスト駆動開発（TDD）アプローチ
 *
 * Test-First: このテストファイルを先に作成し、CaseDAO.tsはこのテストを通すために実装する
 */

import { CaseDAO } from '../CaseDAO';
import { DatabaseService } from '../DatabaseService';
import type { CreateCaseInput, UpdateCaseInput } from '../../types/case';

describe('CaseDAO', () => {
  let caseDAO: CaseDAO;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    databaseService = new DatabaseService();
    await databaseService.initialize();
    caseDAO = new CaseDAO(databaseService);
  });

  afterAll(async () => {
    await databaseService.close();
  });

  beforeEach(async () => {
    // 各テスト前にテーブルをクリア
    await databaseService.execute('DELETE FROM cases');
  });

  describe('create - 案件作成', () => {
    test('正常系: 案件を作成できる', async () => {
      const input: CreateCaseInput = {
        title: '現場調査A',
        client_name: '株式会社テスト',
        location: '東京都渋谷区',
        description: '設備点検',
        status: 'active',
      };

      const result = await caseDAO.create(input);

      expect(result.id).toBeGreaterThan(0);
      expect(result.title).toBe(input.title);
      expect(result.client_name).toBe(input.client_name);
      expect(result.location).toBe(input.location);
      expect(result.description).toBe(input.description);
      expect(result.status).toBe('active');
      expect(result.is_deleted).toBe(0);
      expect(result.created_at).toBeTruthy();
      expect(result.updated_at).toBeTruthy();
      expect(result.synced_at).toBeNull();
    });

    test('正常系: 最小限の情報で作成（statusデフォルト）', async () => {
      const input: CreateCaseInput = {
        title: 'テスト案件',
      };

      const result = await caseDAO.create(input);

      expect(result.id).toBeGreaterThan(0);
      expect(result.title).toBe('テスト案件');
      expect(result.status).toBe('active'); // デフォルト
      expect(result.client_name).toBeNull();
      expect(result.location).toBeNull();
      expect(result.description).toBeNull();
    });

    test('異常系: タイトルが空の場合はエラー', async () => {
      const input: CreateCaseInput = {
        title: '',
      };

      await expect(caseDAO.create(input)).rejects.toThrow('Title is required');
    });

    test('エッジケース: 最大長のタイトル（100文字）', async () => {
      const longTitle = 'あ'.repeat(100);
      const input: CreateCaseInput = {
        title: longTitle,
      };

      const result = await caseDAO.create(input);

      expect(result.title).toBe(longTitle);
      expect(result.title.length).toBe(100);
    });

    test('エッジケース: NULL許容フィールドがundefined', async () => {
      const input: CreateCaseInput = {
        title: 'テスト',
        client_name: undefined,
        location: undefined,
        description: undefined,
      };

      const result = await caseDAO.create(input);

      expect(result.client_name).toBeNull();
      expect(result.location).toBeNull();
      expect(result.description).toBeNull();
    });
  });

  describe('findById - ID検索', () => {
    test('正常系: IDで案件を取得できる', async () => {
      const created = await caseDAO.create({ title: 'テスト案件' });

      const found = await caseDAO.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe('テスト案件');
    });

    test('正常系: 論理削除された案件は取得できない', async () => {
      const created = await caseDAO.create({ title: '削除予定' });
      await caseDAO.delete(created.id);

      const found = await caseDAO.findById(created.id);

      expect(found).toBeNull();
    });

    test('異常系: 存在しないIDの場合はnull', async () => {
      const found = await caseDAO.findById(99999);

      expect(found).toBeNull();
    });
  });

  describe('findAll - 全件取得', () => {
    test('正常系: 全案件を取得できる', async () => {
      await caseDAO.create({ title: '案件1' });
      await caseDAO.create({ title: '案件2' });
      await caseDAO.create({ title: '案件3' });

      const cases = await caseDAO.findAll();

      expect(cases.length).toBe(3);
      expect(cases.map((c) => c.title)).toContain('案件1');
      expect(cases.map((c) => c.title)).toContain('案件2');
      expect(cases.map((c) => c.title)).toContain('案件3');
    });

    test('正常系: 作成日時降順でソート', async () => {
      const case1 = await caseDAO.create({ title: '案件1' });
      await new Promise((resolve) => setTimeout(resolve, 10)); // 10ms待機
      const case2 = await caseDAO.create({ title: '案件2' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const case3 = await caseDAO.create({ title: '案件3' });

      const cases = await caseDAO.findAll();

      expect(cases[0].id).toBe(case3.id); // 最新
      expect(cases[1].id).toBe(case2.id);
      expect(cases[2].id).toBe(case1.id); // 最古
    });

    test('正常系: 論理削除された案件は除外', async () => {
      const case1 = await caseDAO.create({ title: '案件1' });
      const case2 = await caseDAO.create({ title: '案件2（削除）' });
      const case3 = await caseDAO.create({ title: '案件3' });

      await caseDAO.delete(case2.id);

      const cases = await caseDAO.findAll();

      expect(cases.length).toBe(2);
      expect(cases.map((c) => c.id)).toContain(case1.id);
      expect(cases.map((c) => c.id)).toContain(case3.id);
      expect(cases.map((c) => c.id)).not.toContain(case2.id);
    });

    test('エッジケース: データが0件の場合は空配列', async () => {
      const cases = await caseDAO.findAll();

      expect(cases).toEqual([]);
      expect(cases.length).toBe(0);
    });
  });

  describe('update - 案件更新', () => {
    test('正常系: 案件を更新できる', async () => {
      const created = await caseDAO.create({
        title: '更新前',
        client_name: '旧クライアント',
        location: '旧住所',
        description: '旧説明',
      });

      const originalUpdatedAt = created.updated_at;
      await new Promise((resolve) => setTimeout(resolve, 10)); // updated_atの変化を確認

      await caseDAO.update(created.id, {
        title: '更新後',
        client_name: '新クライアント',
        location: '新住所',
        description: '新説明',
        status: 'completed',
      });

      const updated = await caseDAO.findById(created.id);

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe('更新後');
      expect(updated!.client_name).toBe('新クライアント');
      expect(updated!.status).toBe('completed');
      expect(updated!.updated_at > originalUpdatedAt).toBe(true); // 更新日時が変わっている
    });

    test('正常系: 一部フィールドのみ更新', async () => {
      const created = await caseDAO.create({
        title: 'テスト',
        client_name: 'クライアント',
        location: '東京',
      });

      await caseDAO.update(created.id, {
        title: '変更後タイトル',
        // client_name, location は変更しない
      });

      const updated = await caseDAO.findById(created.id);

      expect(updated!.title).toBe('変更後タイトル');
      expect(updated!.client_name).toBe('クライアント'); // 変更なし
      expect(updated!.location).toBe('東京'); // 変更なし
    });

    test('異常系: 存在しないIDの場合はエラー', async () => {
      await expect(caseDAO.update(99999, { title: '存在しない' })).rejects.toThrow(
        'Case not found'
      );
    });

    test('異常系: 論理削除された案件は更新できない', async () => {
      const created = await caseDAO.create({ title: '削除予定' });
      await caseDAO.delete(created.id);

      await expect(caseDAO.update(created.id, { title: '更新試行' })).rejects.toThrow(
        'Case not found'
      );
    });
  });

  describe('delete - 論理削除', () => {
    test('正常系: 案件を論理削除できる', async () => {
      const created = await caseDAO.create({ title: '削除対象' });

      await caseDAO.delete(created.id);

      const deleted = await caseDAO.findById(created.id);
      expect(deleted).toBeNull(); // 論理削除されたので取得不可
    });

    test('正常系: 論理削除後もデータベースにはレコードが残る', async () => {
      const created = await caseDAO.create({ title: '削除対象' });

      await caseDAO.delete(created.id);

      // 論理削除フラグを無視して直接クエリ
      const result = await databaseService.executeRaw<{
        id: number;
        is_deleted: number;
      }>('SELECT id, is_deleted FROM cases WHERE id = ?', [created.id]);

      expect(result).toHaveLength(1);
      expect(result[0].is_deleted).toBe(1); // 論理削除フラグが立っている
    });

    test('異常系: 存在しないIDの場合はエラー', async () => {
      await expect(caseDAO.delete(99999)).rejects.toThrow('Case not found');
    });

    test('異常系: すでに論理削除された案件は削除できない', async () => {
      const created = await caseDAO.create({ title: '削除対象' });
      await caseDAO.delete(created.id);

      await expect(caseDAO.delete(created.id)).rejects.toThrow('Case not found');
    });
  });
});
