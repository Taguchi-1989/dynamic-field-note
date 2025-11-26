/**
 * PhotoDAO Integration Tests
 *
 * テスト範囲:
 * - CRUD操作の完全性
 * - 案件・報告書との紐付け
 * - 論理削除の動作
 * - エラーハンドリング
 */

import { describe, it, expect, beforeAll, afterEach, afterAll, beforeEach } from '@jest/globals';
import { nodeDatabaseService } from '../../services/DatabaseService.node';
import { photoDAO } from '../PhotoDAO';
import { caseDAO } from '../CaseDAO';
import { reportDAO } from '../ReportDAO';
import type { CreatePhotoInput, UpdatePhotoInput } from '../../types/case';

// DatabaseServiceのモック
jest.mock('../../services/DatabaseService', () => ({
  databaseService: {
    initialize: () => nodeDatabaseService.initialize(),
    getDatabase: () => nodeDatabaseService.getDatabase(),
  },
}));

describe('PhotoDAO Integration Tests', () => {
  let testCaseId: number;
  let testReportId: number;

  // テスト前にデータベースを初期化
  beforeAll(async () => {
    await nodeDatabaseService.initialize();
  });

  // 全テスト終了後にデータベースをクローズ
  afterAll(() => {
    nodeDatabaseService.close();
  });

  // 各テスト前にテスト用の案件と報告書を作成
  beforeEach(async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    testCaseId = testCase.id;

    const testReport = await reportDAO.create({
      case_id: testCaseId,
      title: 'テスト報告書',
      content: 'テスト内容',
    });
    testReportId = testReport.id;
  });

  // 各テスト後にテーブルをクリーンアップ
  afterEach(async () => {
    await photoDAO.truncate();
    await reportDAO.truncate();
    await caseDAO.truncate();
  });

  describe('create()', () => {
    it('should create a new photo with all fields', async () => {
      const input: CreatePhotoInput = {
        case_id: testCaseId,
        file_path: '/photos/test001.jpg',
        thumbnail_path: '/thumbnails/test001_thumb.jpg',
        caption: 'テスト写真',
        exif_data: '{"camera":"Canon EOS R5"}',
        annotation_data: '{"arrows":[]}',
        width: 1920,
        height: 1080,
        file_size: 2048576,
      };

      const created = await photoDAO.create(input);

      expect(created.id).toBeGreaterThan(0);
      expect(created.case_id).toBe(testCaseId);
      expect(created.file_path).toBe(input.file_path);
      expect(created.thumbnail_path).toBe(input.thumbnail_path);
      expect(created.caption).toBe(input.caption);
      expect(created.exif_data).toBe(input.exif_data);
      expect(created.annotation_data).toBe(input.annotation_data);
      expect(created.width).toBe(input.width);
      expect(created.height).toBe(input.height);
      expect(created.file_size).toBe(input.file_size);
      expect(created.is_deleted).toBe(0);
      expect(created.created_at).toBeDefined();
    });

    it('should create a photo with only required fields', async () => {
      const input: CreatePhotoInput = {
        case_id: testCaseId,
        file_path: '/photos/minimal.jpg',
      };

      const created = await photoDAO.create(input);

      expect(created.id).toBeGreaterThan(0);
      expect(created.case_id).toBe(testCaseId);
      expect(created.file_path).toBe(input.file_path);
      expect(created.report_id).toBeNull();
      expect(created.thumbnail_path).toBeNull();
      expect(created.caption).toBeNull();
      expect(created.exif_data).toBeNull();
      expect(created.annotation_data).toBeNull();
      expect(created.width).toBeNull();
      expect(created.height).toBeNull();
      expect(created.file_size).toBeNull();
    });

    it('should create a photo with report_id', async () => {
      const input: CreatePhotoInput = {
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/report_photo.jpg',
      };

      const created = await photoDAO.create(input);

      expect(created.report_id).toBe(testReportId);
    });
  });

  describe('findById()', () => {
    it('should find an existing photo by ID', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/findbyid.jpg',
      });

      const found = await photoDAO.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.file_path).toBe('/photos/findbyid.jpg');
    });

    it('should return null for non-existent ID', async () => {
      const found = await photoDAO.findById(99999);

      expect(found).toBeNull();
    });

    it('should not find logically deleted photo', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/deleted.jpg',
      });
      await photoDAO.delete(created.id);

      const found = await photoDAO.findById(created.id);

      expect(found).toBeNull();
    });
  });

  describe('findAll()', () => {
    it('should return empty array when no photos exist', async () => {
      const photos = await photoDAO.findAll();

      expect(photos).toEqual([]);
    });

    it('should return all active photos', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/photo1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/photo2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/photo3.jpg' });

      const photos = await photoDAO.findAll();

      expect(photos).toHaveLength(3);
    });

    it('should not return logically deleted photos', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/active.jpg' });
      const deleted = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/deleted.jpg',
      });
      await photoDAO.delete(deleted.id);

      const photos = await photoDAO.findAll();

      expect(photos).toHaveLength(1);
      expect(photos[0].file_path).toBe('/photos/active.jpg');
    });

    it('should return photos ordered by created_at DESC', async () => {
      const photo1 = await photoDAO.create({ case_id: testCaseId, file_path: '/photos/old.jpg' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const photo2 = await photoDAO.create({ case_id: testCaseId, file_path: '/photos/mid.jpg' });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const photo3 = await photoDAO.create({ case_id: testCaseId, file_path: '/photos/new.jpg' });

      const photos = await photoDAO.findAll();

      expect(photos[0].id).toBe(photo3.id); // 最新
      expect(photos[1].id).toBe(photo2.id);
      expect(photos[2].id).toBe(photo1.id); // 最古
    });
  });

  describe('findByCaseId()', () => {
    it('should find photos by case ID', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/case1_1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/case1_2.jpg' });

      // 別の案件の写真
      const otherCase = await caseDAO.create({ title: '別の案件' });
      await photoDAO.create({ case_id: otherCase.id, file_path: '/photos/case2_1.jpg' });

      const photos = await photoDAO.findByCaseId(testCaseId);

      expect(photos).toHaveLength(2);
      expect(photos.every((p) => p.case_id === testCaseId)).toBe(true);
    });

    it('should return empty array for case with no photos', async () => {
      const photos = await photoDAO.findByCaseId(testCaseId);

      expect(photos).toEqual([]);
    });
  });

  describe('findByReportId()', () => {
    it('should find photos by report ID', async () => {
      // testReportIdに紐づく写真
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/report1_1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/report1_2.jpg',
      });

      // 別の報告書を作成して写真を追加
      const anotherReport = await reportDAO.create({
        case_id: testCaseId,
        title: '別の報告書',
        content: '別の内容',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: anotherReport.id,
        file_path: '/photos/report2_1.jpg',
      });

      const photos = await photoDAO.findByReportId(testReportId);

      expect(photos).toHaveLength(2);
      expect(photos.every((p) => p.report_id === testReportId)).toBe(true);
    });

    it('should return empty array for report with no photos', async () => {
      // 別の報告書を作成（写真なし）
      const emptyReport = await reportDAO.create({
        case_id: testCaseId,
        title: '空の報告書',
        content: '内容',
      });

      const photos = await photoDAO.findByReportId(emptyReport.id);

      expect(photos).toEqual([]);
    });
  });

  describe('update()', () => {
    it('should update caption', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/update_test.jpg',
        caption: '旧キャプション',
      });

      const updated = await photoDAO.update(created.id, { caption: '新キャプション' });

      expect(updated.caption).toBe('新キャプション');
    });

    it('should update annotation_data', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/annotation_test.jpg',
      });

      const annotationData = '{"arrows":[{"x":100,"y":200}]}';
      const updated = await photoDAO.update(created.id, { annotation_data: annotationData });

      expect(updated.annotation_data).toBe(annotationData);
    });

    it('should update both caption and annotation_data', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/both_test.jpg',
      });

      const input: UpdatePhotoInput = {
        caption: '新しいキャプション',
        annotation_data: '{"arrows":[]}',
      };
      const updated = await photoDAO.update(created.id, input);

      expect(updated.caption).toBe(input.caption);
      expect(updated.annotation_data).toBe(input.annotation_data);
    });

    it('should return existing photo when no updates provided', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/no_update.jpg',
        caption: '変更なし',
      });

      const updated = await photoDAO.update(created.id, {});

      expect(updated.caption).toBe('変更なし');
    });

    it('should throw error when updating non-existent photo', async () => {
      await expect(photoDAO.update(99999, { caption: '新キャプション' })).rejects.toThrow(
        'Photo #99999 not found'
      );
    });

    it('should throw error when updating logically deleted photo', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/deleted_update.jpg',
      });
      await photoDAO.delete(created.id);

      await expect(photoDAO.update(created.id, { caption: '更新' })).rejects.toThrow(
        `Photo #${created.id} not found`
      );
    });
  });

  describe('delete()', () => {
    it('should logically delete a photo', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/delete_test.jpg',
      });

      await photoDAO.delete(created.id);

      const found = await photoDAO.findById(created.id);
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent photo', async () => {
      await expect(photoDAO.delete(99999)).rejects.toThrow('Photo #99999 not found');
    });

    it('should throw error when deleting already deleted photo', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/double_delete.jpg',
      });
      await photoDAO.delete(created.id);

      await expect(photoDAO.delete(created.id)).rejects.toThrow(`Photo #${created.id} not found`);
    });
  });

  describe('count()', () => {
    it('should return 0 when no photos exist', async () => {
      const count = await photoDAO.count();

      expect(count).toBe(0);
    });

    it('should return correct count of active photos', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/3.jpg' });

      const count = await photoDAO.count();

      expect(count).toBe(3);
    });

    it('should not count logically deleted photos', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/1.jpg' });
      const photo2 = await photoDAO.create({ case_id: testCaseId, file_path: '/photos/2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/3.jpg' });
      await photoDAO.delete(photo2.id);

      const count = await photoDAO.count();

      expect(count).toBe(2);
    });
  });

  describe('countByCaseId()', () => {
    it('should count photos by case ID', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/case1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/case2.jpg' });

      const count = await photoDAO.countByCaseId(testCaseId);

      expect(count).toBe(2);
    });

    it('should return 0 for case with no photos', async () => {
      const count = await photoDAO.countByCaseId(testCaseId);

      expect(count).toBe(0);
    });
  });

  describe('countByReportId()', () => {
    it('should count photos by report ID', async () => {
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/report1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/report2.jpg',
      });

      const count = await photoDAO.countByReportId(testReportId);

      expect(count).toBe(2);
    });

    it('should return 0 for report with no photos', async () => {
      const emptyReport = await reportDAO.create({
        case_id: testCaseId,
        title: '空の報告書',
        content: '内容',
      });

      const count = await photoDAO.countByReportId(emptyReport.id);

      expect(count).toBe(0);
    });
  });

  describe('deleteByCaseId()', () => {
    it('should delete all photos for a case', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/case1_1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/case1_2.jpg' });

      // 別の案件の写真
      const otherCase = await caseDAO.create({ title: '別の案件' });
      await photoDAO.create({ case_id: otherCase.id, file_path: '/photos/case2_1.jpg' });

      await photoDAO.deleteByCaseId(testCaseId);

      const casePhotos = await photoDAO.findByCaseId(testCaseId);
      const otherPhotos = await photoDAO.findByCaseId(otherCase.id);

      expect(casePhotos).toHaveLength(0);
      expect(otherPhotos).toHaveLength(1);
    });
  });

  describe('deleteByReportId()', () => {
    it('should delete all photos for a report', async () => {
      // testReportIdに紐づく写真
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/report1_1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photos/report1_2.jpg',
      });

      // 別の報告書を作成して写真を追加
      const anotherReport = await reportDAO.create({
        case_id: testCaseId,
        title: '別の報告書',
        content: '別の内容',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: anotherReport.id,
        file_path: '/photos/report2_1.jpg',
      });

      await photoDAO.deleteByReportId(testReportId);

      const report1Photos = await photoDAO.findByReportId(testReportId);
      const report2Photos = await photoDAO.findByReportId(anotherReport.id);

      expect(report1Photos).toHaveLength(0);
      expect(report2Photos).toHaveLength(1);
    });
  });

  describe('hardDelete()', () => {
    it('should physically delete a photo from database', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photos/hard_delete.jpg',
      });

      await photoDAO.hardDelete(created.id);

      // 論理削除チェックを回避して直接SQLで確認
      const db = nodeDatabaseService.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM photos WHERE id = ?',
        [created.id]
      );

      expect(result?.count).toBe(0);
    });
  });

  describe('truncate()', () => {
    it('should delete all photos from database', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photos/3.jpg' });

      await photoDAO.truncate();

      const count = await photoDAO.count();
      expect(count).toBe(0);
    });
  });
});
