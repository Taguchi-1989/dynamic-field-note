/**
 * DatabaseService - テストスイート
 *
 * トランザクション管理・マイグレーション機能のテスト
 */

import { DatabaseService } from '../DatabaseService';
import { CaseDAO } from '../CaseDAO';
import { ReportDAO } from '../ReportDAO';

describe('DatabaseService - トランザクション管理', () => {
  let databaseService: DatabaseService;
  let caseDAO: CaseDAO;
  let reportDAO: ReportDAO;

  beforeAll(async () => {
    databaseService = new DatabaseService();
    await databaseService.initialize();
    caseDAO = new CaseDAO(databaseService);
    reportDAO = new ReportDAO(databaseService);
  });

  afterAll(async () => {
    await databaseService.close();
  });

  describe('transaction - トランザクション実行', () => {
    test('正常系: 成功時は全操作がコミットされる', async () => {
      const result = await databaseService.transaction(async (db) => {
        // 案件を作成
        await db.runAsync('INSERT INTO cases (title, location) VALUES (?, ?)', [
          'トランザクションテスト案件',
          '東京都',
        ]);

        // 作成された案件を取得
        const testCase = await db.getFirstAsync<{ id: number; title: string }>(
          'SELECT * FROM cases WHERE title = ? AND is_deleted = 0',
          ['トランザクションテスト案件']
        );

        return testCase;
      });

      // トランザクション成功確認
      expect(result).toBeDefined();
      expect(result?.title).toBe('トランザクションテスト案件');

      // データベースに永続化されていることを確認
      const cases = await caseDAO.findAll();
      const created = cases.find((c) => c.title === 'トランザクションテスト案件');
      expect(created).toBeDefined();
    });

    test('異常系: エラー時は全操作がロールバックされる', async () => {
      // トランザクション前の案件数を取得
      const casesBefore = await caseDAO.findAll();
      const countBefore = casesBefore.length;

      await expect(
        databaseService.transaction(async (db) => {
          // 操作1: 案件を作成（成功）
          await db.runAsync('INSERT INTO cases (title, location) VALUES (?, ?)', [
            'ロールバックテスト案件',
            '大阪府',
          ]);

          // 操作2: 意図的にエラーを発生
          throw new Error('Transaction rollback test');
        })
      ).rejects.toThrow('Transaction rollback test');

      // トランザクション後の案件数を確認（変化なし）
      const casesAfter = await caseDAO.findAll();
      const countAfter = casesAfter.length;

      expect(countAfter).toBe(countBefore);

      // 作成した案件が存在しないことを確認
      const rollbackCase = casesAfter.find((c) => c.title === 'ロールバックテスト案件');
      expect(rollbackCase).toBeUndefined();
    });

    test('正常系: 複数テーブルへの操作がアトミックに実行される', async () => {
      const result = await databaseService.transaction(async (db) => {
        // 案件作成
        await db.runAsync('INSERT INTO cases (title, location) VALUES (?, ?)', [
          '複数テーブルテスト案件',
          '福岡県',
        ]);

        const testCase = await db.getFirstAsync<{ id: number }>(
          'SELECT id FROM cases WHERE title = ? AND is_deleted = 0',
          ['複数テーブルテスト案件']
        );

        if (!testCase) {
          throw new Error('Case not created');
        }

        // 報告書作成
        await db.runAsync('INSERT INTO reports (case_id, title, content) VALUES (?, ?, ?)', [
          testCase.id,
          '複数テーブルテスト報告書',
          'テスト内容',
        ]);

        return testCase.id;
      });

      // 両方のレコードが存在することを確認
      const cases = await caseDAO.findAll();
      const testCase = cases.find((c) => c.title === '複数テーブルテスト案件');
      expect(testCase).toBeDefined();

      const reports = await reportDAO.findByCaseId(result);
      expect(reports.length).toBeGreaterThan(0);
      expect(reports[0].title).toBe('複数テーブルテスト報告書');
    });

    test('異常系: ネストしたエラーもロールバックされる', async () => {
      const casesBefore = await caseDAO.findAll();
      const reportsBefore = await databaseService.executeRaw(
        'SELECT COUNT(*) as count FROM reports WHERE is_deleted = 0'
      );
      const reportCountBefore = (reportsBefore[0] as { count: number }).count;

      await expect(
        databaseService.transaction(async (db) => {
          // 案件作成
          await db.runAsync('INSERT INTO cases (title, location) VALUES (?, ?)', [
            'ネストエラーテスト案件',
            '北海道',
          ]);

          const testCase = await db.getFirstAsync<{ id: number }>(
            'SELECT id FROM cases WHERE title = ? AND is_deleted = 0',
            ['ネストエラーテスト案件']
          );

          if (!testCase) {
            throw new Error('Case not created');
          }

          // 報告書作成
          await db.runAsync('INSERT INTO reports (case_id, title, content) VALUES (?, ?, ?)', [
            testCase.id,
            'ネストエラーテスト報告書',
            'テスト内容',
          ]);

          // エラー発生
          throw new Error('Nested transaction error');
        })
      ).rejects.toThrow('Nested transaction error');

      // 案件も報告書も作成されていないことを確認
      const casesAfter = await caseDAO.findAll();
      expect(casesAfter.length).toBe(casesBefore.length);

      const reportsAfter = await databaseService.executeRaw(
        'SELECT COUNT(*) as count FROM reports WHERE is_deleted = 0'
      );
      const reportCountAfter = (reportsAfter[0] as { count: number }).count;
      expect(reportCountAfter).toBe(reportCountBefore);
    });
  });

  describe('getMigrationVersion - マイグレーションバージョン取得', () => {
    test('正常系: 現在のマイグレーションバージョンを取得できる', async () => {
      const version = await databaseService.getMigrationVersion();

      // バージョンは1以上（v1, v2マイグレーション適用済み）
      expect(version).toBeGreaterThanOrEqual(2);
      expect(typeof version).toBe('number');
    });

    test('正常系: バージョンは整数値である', async () => {
      const version = await databaseService.getMigrationVersion();

      expect(Number.isInteger(version)).toBe(true);
    });
  });

  describe('エラーハンドリング', () => {
    test('異常系: 初期化前のgetDatabaseは例外を投げる', () => {
      const uninitializedService = new DatabaseService();

      expect(() => uninitializedService.getDatabase()).toThrow('Database not initialized');
    });

    test('異常系: 不正なSQLはエラーを投げる', async () => {
      await expect(databaseService.execute('INVALID SQL SYNTAX')).rejects.toThrow();
    });

    test('異常系: トランザクション内の不正なSQLでロールバック', async () => {
      const casesBefore = await caseDAO.findAll();

      await expect(
        databaseService.transaction(async (db) => {
          // 正常な操作
          await db.runAsync('INSERT INTO cases (title, location) VALUES (?, ?)', [
            '不正SQL テスト案件',
            '沖縄県',
          ]);

          // 不正なSQL（エラー発生）
          await db.runAsync('INVALID SQL');
        })
      ).rejects.toThrow();

      // ロールバック確認
      const casesAfter = await caseDAO.findAll();
      expect(casesAfter.length).toBe(casesBefore.length);
    });
  });

  describe('データベース初期化', () => {
    test('正常系: 二重初期化は安全に処理される', async () => {
      const service = new DatabaseService();

      await service.initialize();
      await service.initialize(); // 2回目の初期化

      // エラーなく実行できることを確認
      const version = await service.getMigrationVersion();
      expect(version).toBeGreaterThanOrEqual(2);

      await service.close();
    });
  });
});
