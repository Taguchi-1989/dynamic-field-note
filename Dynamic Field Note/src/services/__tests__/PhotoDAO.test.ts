/**
 * PhotoDAO Test Suite
 * TDD Approach - Red Phase
 *
 * 写真CRUD操作 + 報告書紐付けのテスト
 */

import { DatabaseService } from '../DatabaseService';
import { CaseDAO } from '../CaseDAO';
import { ReportDAO } from '../ReportDAO';
import { PhotoDAO } from '../PhotoDAO';
import type { CreatePhotoInput, UpdatePhotoInput } from '../../types/case';

describe('PhotoDAO', () => {
  let databaseService: DatabaseService;
  let caseDAO: CaseDAO;
  let reportDAO: ReportDAO;
  let photoDAO: PhotoDAO;
  let testCaseId: number;
  let testReportId: number;

  beforeAll(async () => {
    databaseService = new DatabaseService();
    await databaseService.initialize();
    caseDAO = new CaseDAO(databaseService);
    reportDAO = new ReportDAO(databaseService);
    photoDAO = new PhotoDAO(databaseService);

    // テスト用案件と報告書を作成
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    testCaseId = testCase.id;

    const testReport = await reportDAO.create({
      case_id: testCaseId,
      title: 'テスト報告書',
    });
    testReportId = testReport.id;
  });

  afterAll(async () => {
    await databaseService.close();
  });

  beforeEach(async () => {
    // 各テスト前に photos テーブルをクリア
    await databaseService.execute('DELETE FROM photos');
  });

  describe('create - 写真作成', () => {
    test('正常系: 写真を作成できる', async () => {
      const input: CreatePhotoInput = {
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/test.jpg',
        caption: 'テスト写真',
      };

      const result = await photoDAO.create(input);

      expect(result.id).toBeGreaterThan(0);
      expect(result.case_id).toBe(testCaseId);
      expect(result.report_id).toBe(testReportId);
      expect(result.file_path).toBe(input.file_path);
      expect(result.caption).toBe(input.caption);
      expect(result.is_deleted).toBe(0);
      expect(result.created_at).toBeTruthy();
    });

    test('正常系: report_id省略で作成', async () => {
      const input: CreatePhotoInput = {
        case_id: testCaseId,
        file_path: '/photos/no-report.jpg',
      };

      const result = await photoDAO.create(input);

      expect(result.case_id).toBe(testCaseId);
      expect(result.report_id).toBeNull();
      expect(result.file_path).toBe(input.file_path);
    });

    test('異常系: case_idが未指定の場合はエラー', async () => {
      const input = {
        file_path: '/photos/test.jpg',
      } as CreatePhotoInput;

      await expect(photoDAO.create(input)).rejects.toThrow('Case ID is required');
    });

    test('異常系: file_pathが空の場合はエラー', async () => {
      const input: CreatePhotoInput = {
        case_id: testCaseId,
        file_path: '',
      };

      await expect(photoDAO.create(input)).rejects.toThrow('File path is required');
    });
  });

  describe('findById - ID検索', () => {
    test('正常系: IDで写真を取得できる', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/find-test.jpg',
      });

      const found = await photoDAO.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    test('正常系: 論理削除された写真は取得できない', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/delete-test.jpg',
      });

      await photoDAO.delete(created.id);
      const found = await photoDAO.findById(created.id);

      expect(found).toBeNull();
    });

    test('異常系: 存在しないIDの場合はnull', async () => {
      const found = await photoDAO.findById(99999);

      expect(found).toBeNull();
    });
  });

  describe('findByCaseId - 案件別検索', () => {
    test('正常系: 案件に紐付く全写真を取得できる', async () => {
      await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/2.jpg',
      });

      const photos = await photoDAO.findByCaseId(testCaseId);

      expect(photos.length).toBe(2);
    });

    test('正常系: 論理削除された写真は除外', async () => {
      const photo1 = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/2.jpg',
      });

      await photoDAO.delete(photo1.id);

      const photos = await photoDAO.findByCaseId(testCaseId);

      expect(photos.length).toBe(1);
    });
  });

  describe('findByReportId - 報告書別検索', () => {
    test('正常系: 報告書に紐付く全写真を取得できる', async () => {
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/2.jpg',
      });

      const photos = await photoDAO.findByReportId(testReportId);

      expect(photos.length).toBe(2);
      expect(photos[0].report_id).toBe(testReportId);
    });

    test('正常系: 論理削除された写真は除外', async () => {
      const photo1 = await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/2.jpg',
      });

      await photoDAO.delete(photo1.id);

      const photos = await photoDAO.findByReportId(testReportId);

      expect(photos.length).toBe(1);
    });

    test('エッジケース: 報告書に写真が0件の場合は空配列', async () => {
      // 別の報告書を作成
      const anotherReport = await reportDAO.create({
        case_id: testCaseId,
        title: '別報告書',
      });

      const photos = await photoDAO.findByReportId(anotherReport.id);

      expect(photos).toEqual([]);
    });
  });

  describe('update - 写真更新', () => {
    test('正常系: キャプションを更新できる', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/update-test.jpg',
        caption: '更新前',
      });

      await photoDAO.update(created.id, {
        caption: '更新後',
      });

      const updated = await photoDAO.findById(created.id);

      expect(updated!.caption).toBe('更新後');
    });

    test('正常系: report_idを変更できる', async () => {
      // 別の報告書を作成
      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '報告書2',
      });

      const created = await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/reassign-test.jpg',
      });

      await photoDAO.update(created.id, {
        report_id: report2.id,
      });

      const updated = await photoDAO.findById(created.id);

      expect(updated!.report_id).toBe(report2.id);
    });

    test('正常系: annotation_dataを更新できる', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/annotation-test.jpg',
      });

      const annotationData = JSON.stringify({
        markers: [{ x: 100, y: 200, label: 'エラー箇所' }],
      });

      await photoDAO.update(created.id, {
        annotation_data: annotationData,
      });

      const updated = await photoDAO.findById(created.id);

      expect(updated!.annotation_data).toBe(annotationData);
    });

    test('異常系: 存在しないIDの場合はエラー', async () => {
      await expect(photoDAO.update(99999, { caption: '更新試行' })).rejects.toThrow(
        'Photo not found'
      );
    });

    test('異常系: 論理削除された写真は更新できない', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/deleted.jpg',
      });

      await photoDAO.delete(created.id);

      await expect(photoDAO.update(created.id, { caption: '更新試行' })).rejects.toThrow(
        'Photo not found'
      );
    });
  });

  describe('delete - 論理削除', () => {
    test('正常系: 写真を論理削除できる', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/delete-target.jpg',
      });

      await photoDAO.delete(created.id);

      const deleted = await photoDAO.findById(created.id);
      expect(deleted).toBeNull();
    });

    test('正常系: 論理削除後もデータベースにはレコードが残る', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/soft-delete.jpg',
      });

      await photoDAO.delete(created.id);

      // 直接SQLで確認
      const result = await databaseService.executeRaw<{ is_deleted: number }>(
        'SELECT * FROM photos WHERE id = ?',
        [created.id]
      );

      expect(result).toHaveLength(1);
      expect(result[0].is_deleted).toBe(1);
    });

    test('異常系: 存在しないIDの場合はエラー', async () => {
      await expect(photoDAO.delete(99999)).rejects.toThrow('Photo not found');
    });

    test('異常系: すでに論理削除された写真は削除できない', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/double-delete.jpg',
      });

      await photoDAO.delete(created.id);

      await expect(photoDAO.delete(created.id)).rejects.toThrow('Photo not found');
    });
  });
});
