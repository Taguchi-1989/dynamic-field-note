/**
 * ReportDAO Test Suite
 * TDD Approach - Red Phase
 *
 * 報告書CRUD操作のテスト
 */

import { DatabaseService } from '../DatabaseService';
import { CaseDAO } from '../CaseDAO';
import { ReportDAO } from '../ReportDAO';
import type { CreateReportInput, UpdateReportInput } from '../../types/case';

describe('ReportDAO', () => {
  let databaseService: DatabaseService;
  let caseDAO: CaseDAO;
  let reportDAO: ReportDAO;
  let testCaseId: number;

  beforeAll(async () => {
    databaseService = new DatabaseService();
    await databaseService.initialize();
    caseDAO = new CaseDAO(databaseService);
    reportDAO = new ReportDAO(databaseService);

    // テスト用案件を作成
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    testCaseId = testCase.id;
  });

  afterAll(async () => {
    await databaseService.close();
  });

  beforeEach(async () => {
    // 各テスト前に reports テーブルをクリア
    await databaseService.execute('DELETE FROM reports');
  });

  describe('create - 報告書作成', () => {
    test('正常系: 報告書を作成できる', async () => {
      const input: CreateReportInput = {
        case_id: testCaseId,
        title: '点検報告書',
        content: '# 点検結果\n\n異常なし',
        voice_buffer: '音声テキスト',
        summary_json: '{"result": "OK"}',
      };

      const result = await reportDAO.create(input);

      expect(result.id).toBeGreaterThan(0);
      expect(result.case_id).toBe(testCaseId);
      expect(result.title).toBe(input.title);
      expect(result.content).toBe(input.content);
      expect(result.voice_buffer).toBe(input.voice_buffer);
      expect(result.summary_json).toBe(input.summary_json);
      expect(result.is_deleted).toBe(0);
      expect(result.created_at).toBeTruthy();
      expect(result.updated_at).toBeTruthy();
    });

    test('正常系: 最小限の情報で作成（content省略）', async () => {
      const input: CreateReportInput = {
        case_id: testCaseId,
        title: '簡易報告',
      };

      const result = await reportDAO.create(input);

      expect(result.id).toBeGreaterThan(0);
      expect(result.case_id).toBe(testCaseId);
      expect(result.title).toBe(input.title);
      expect(result.content).toBeNull();
      expect(result.voice_buffer).toBeNull();
      expect(result.summary_json).toBeNull();
    });

    test('異常系: case_idが未指定の場合はエラー', async () => {
      const input = {
        title: '報告書',
      } as CreateReportInput;

      await expect(reportDAO.create(input)).rejects.toThrow('Case ID is required');
    });

    test('異常系: タイトルが空の場合はエラー', async () => {
      const input: CreateReportInput = {
        case_id: testCaseId,
        title: '',
      };

      await expect(reportDAO.create(input)).rejects.toThrow('Title is required');
    });

    test('異常系: 存在しないcase_idの場合はエラー', async () => {
      const input: CreateReportInput = {
        case_id: 99999,
        title: '報告書',
      };

      await expect(reportDAO.create(input)).rejects.toThrow('Case not found');
    });

    test('エッジケース: 最大長のタイトル（100文字）', async () => {
      const longTitle = 'あ'.repeat(100);
      const input: CreateReportInput = {
        case_id: testCaseId,
        title: longTitle,
      };

      const result = await reportDAO.create(input);

      expect(result.title).toBe(longTitle);
    });

    test('エッジケース: Markdownコンテンツの保存', async () => {
      const markdown = `# 点検報告書

## 1. 概要
テスト点検を実施しました。

## 2. 結果
- 項目1: OK
- 項目2: NG

## 3. 所感
**問題あり**
`;
      const input: CreateReportInput = {
        case_id: testCaseId,
        title: 'Markdown報告書',
        content: markdown,
      };

      const result = await reportDAO.create(input);

      expect(result.content).toBe(markdown);
    });
  });

  describe('findById - ID検索', () => {
    test('正常系: IDで報告書を取得できる', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '検索テスト',
      });

      const found = await reportDAO.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.title).toBe('検索テスト');
    });

    test('正常系: 論理削除された報告書は取得できない', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '削除予定',
      });

      await reportDAO.delete(created.id);
      const found = await reportDAO.findById(created.id);

      expect(found).toBeNull();
    });

    test('異常系: 存在しないIDの場合はnull', async () => {
      const found = await reportDAO.findById(99999);

      expect(found).toBeNull();
    });
  });

  describe('findByCaseId - 案件別検索', () => {
    test('正常系: 案件に紐付く全報告書を取得できる', async () => {
      // 複数の報告書を作成
      await reportDAO.create({ case_id: testCaseId, title: '報告書1' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書2' });
      await reportDAO.create({ case_id: testCaseId, title: '報告書3' });

      const reports = await reportDAO.findByCaseId(testCaseId);

      expect(reports.length).toBe(3);
      expect(reports.map((r) => r.title)).toContain('報告書1');
      expect(reports.map((r) => r.title)).toContain('報告書2');
      expect(reports.map((r) => r.title)).toContain('報告書3');
    });

    test('正常系: 更新日時降順でソート', async () => {
      const report1 = await reportDAO.create({
        case_id: testCaseId,
        title: '最古',
      });
      // 少し待機
      await new Promise((resolve) => setTimeout(resolve, 10));

      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '中間',
      });
      await new Promise((resolve) => setTimeout(resolve, 10));

      const report3 = await reportDAO.create({
        case_id: testCaseId,
        title: '最新',
      });

      const reports = await reportDAO.findByCaseId(testCaseId);

      expect(reports[0].id).toBe(report3.id); // 最新
      expect(reports[1].id).toBe(report2.id);
      expect(reports[2].id).toBe(report1.id); // 最古
    });

    test('正常系: 論理削除された報告書は除外', async () => {
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

      await reportDAO.delete(report2.id); // 報告書2を削除

      const reports = await reportDAO.findByCaseId(testCaseId);

      expect(reports.length).toBe(2);
      expect(reports.map((r) => r.id)).toContain(report1.id);
      expect(reports.map((r) => r.id)).not.toContain(report2.id);
      expect(reports.map((r) => r.id)).toContain(report3.id);
    });

    test('エッジケース: 該当案件に報告書が0件の場合は空配列', async () => {
      // 別案件を作成
      const anotherCase = await caseDAO.create({ title: '別案件' });

      const reports = await reportDAO.findByCaseId(anotherCase.id);

      expect(reports).toEqual([]);
    });
  });

  describe('update - 報告書更新', () => {
    test('正常系: 報告書を更新できる', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '更新前',
        content: '初期コンテンツ',
      });
      const originalUpdatedAt = created.updated_at;

      // 少し待機してから更新
      await new Promise((resolve) => setTimeout(resolve, 10));

      await reportDAO.update(created.id, {
        title: '更新後',
        content: '更新後コンテンツ',
        voice_buffer: '音声追加',
        summary_json: '{"summary": "要約データ"}',
        processing_time: 1500,
      });

      const updated = await reportDAO.findById(created.id);

      expect(updated).not.toBeNull();
      expect(updated!.title).toBe('更新後');
      expect(updated!.content).toBe('更新後コンテンツ');
      expect(updated!.voice_buffer).toBe('音声追加');
      expect(updated!.summary_json).toBe('{"summary": "要約データ"}');
      expect(updated!.processing_time).toBe(1500);
      expect(updated!.updated_at > originalUpdatedAt).toBe(true); // 更新日時が変わっている
    });

    test('正常系: 一部フィールドのみ更新', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: 'テスト',
        content: 'コンテンツ',
        voice_buffer: '音声',
      });

      await reportDAO.update(created.id, {
        title: '変更後タイトル',
      });

      const updated = await reportDAO.findById(created.id);

      expect(updated!.title).toBe('変更後タイトル');
      expect(updated!.content).toBe('コンテンツ'); // 変更なし
      expect(updated!.voice_buffer).toBe('音声'); // 変更なし
    });

    test('異常系: 存在しないIDの場合はエラー', async () => {
      await expect(reportDAO.update(99999, { title: '更新試行' })).rejects.toThrow(
        'Report not found'
      );
    });

    test('異常系: 論理削除された報告書は更新できない', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: 'テスト',
      });

      await reportDAO.delete(created.id);

      await expect(reportDAO.update(created.id, { title: '更新試行' })).rejects.toThrow(
        'Report not found'
      );
    });
  });

  describe('delete - 論理削除', () => {
    test('正常系: 報告書を論理削除できる', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '削除対象',
      });

      await reportDAO.delete(created.id);

      const deleted = await reportDAO.findById(created.id);
      expect(deleted).toBeNull(); // 論理削除されたので取得不可
    });

    test('正常系: 論理削除後もデータベースにはレコードが残る', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: '削除対象',
      });

      await reportDAO.delete(created.id);

      // 直接SQLで確認（is_deleted = 1を含む）
      const result = await databaseService.executeRaw<{ is_deleted: number }>(
        'SELECT * FROM reports WHERE id = ?',
        [created.id]
      );

      expect(result).toHaveLength(1);
      expect(result[0].is_deleted).toBe(1); // 論理削除フラグが立っている
    });

    test('異常系: 存在しないIDの場合はエラー', async () => {
      await expect(reportDAO.delete(99999)).rejects.toThrow('Report not found');
    });

    test('異常系: すでに論理削除された報告書は削除できない', async () => {
      const created = await reportDAO.create({
        case_id: testCaseId,
        title: 'テスト',
      });

      await reportDAO.delete(created.id);

      await expect(reportDAO.delete(created.id)).rejects.toThrow('Report not found');
    });
  });
});
