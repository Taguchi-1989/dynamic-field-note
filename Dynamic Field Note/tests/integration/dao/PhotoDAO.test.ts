/**
 * PhotoDAO Integration Tests
 *
 * テスト範囲:
 * - CRUD操作の完全性
 * - 案件・報告書との関連性（外部キー制約）
 * - トランザクションの整合性
 * - エラーハンドリング
 * - フィルタリング機能
 * - 論理削除の動作
 * - CASCADE DELETE動作
 */

import { describe, it, expect, beforeAll, afterEach, beforeEach } from '@jest/globals';
import { databaseService } from '../../../src/services/DatabaseService';
import { caseDAO } from '../../../src/dao/CaseDAO';
import { reportDAO } from '../../../src/dao/ReportDAO';
import { photoDAO } from '../../../src/dao/PhotoDAO';
import type { CreatePhotoInput, UpdatePhotoInput } from '../../../src/types/case';

describe('PhotoDAO Integration Tests', () => {
  let testCaseId: number;
  let testReportId: number;

  // テスト前にデータベースを初期化
  beforeAll(async () => {
    await databaseService.initialize();
  });

  // 各テスト前にテスト用の案件と報告書を作成
  beforeEach(async () => {
    const testCase = await caseDAO.create({ title: 'テスト案件' });
    testCaseId = testCase.id;

    const testReport = await reportDAO.create({
      case_id: testCaseId,
      title: 'テスト報告書',
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
        report_id: testReportId,
        file_path: '/path/to/photo.jpg',
        thumbnail_path: '/path/to/thumbnail.jpg',
        caption: 'テスト写真のキャプション',
        exif_data: '{"camera": "iPhone 12", "date": "2025-01-01"}',
        annotation_data: '{"circles": [], "arrows": []}',
        width: 1920,
        height: 1080,
        file_size: 2048576,
      };

      const created = await photoDAO.create(input);

      expect(created.id).toBeGreaterThan(0);
      expect(created.case_id).toBe(testCaseId);
      expect(created.report_id).toBe(testReportId);
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
        file_path: '/path/to/minimal.jpg',
      };

      const created = await photoDAO.create(input);

      expect(created.id).toBeGreaterThan(0);
      expect(created.case_id).toBe(testCaseId);
      expect(created.report_id).toBeNull();
      expect(created.file_path).toBe(input.file_path);
      expect(created.thumbnail_path).toBeNull();
      expect(created.caption).toBeNull();
      expect(created.exif_data).toBeNull();
      expect(created.annotation_data).toBeNull();
      expect(created.width).toBeNull();
      expect(created.height).toBeNull();
      expect(created.file_size).toBeNull();
      expect(created.is_deleted).toBe(0);
    });

    it('should create photo without report_id', async () => {
      const input: CreatePhotoInput = {
        case_id: testCaseId,
        file_path: '/path/to/no-report.jpg',
      };

      const created = await photoDAO.create(input);

      expect(created.case_id).toBe(testCaseId);
      expect(created.report_id).toBeNull();
    });

    it('should create multiple photos for the same case', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo3.jpg' });

      const photos = await photoDAO.findByCaseId(testCaseId);

      expect(photos).toHaveLength(3);
    });

    it('should fail when creating photo with non-existent case_id', async () => {
      const input: CreatePhotoInput = {
        case_id: 99999,
        file_path: '/invalid-case.jpg',
      };

      await expect(photoDAO.create(input)).rejects.toThrow(); // 外部キー制約違反
    });

    it('should fail when creating photo with non-existent report_id', async () => {
      const input: CreatePhotoInput = {
        case_id: testCaseId,
        report_id: 99999,
        file_path: '/invalid-report.jpg',
      };

      await expect(photoDAO.create(input)).rejects.toThrow(); // 外部キー制約違反
    });
  });

  describe('findById()', () => {
    it('should find an existing photo by ID', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/find-by-id.jpg',
      });

      const found = await photoDAO.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.file_path).toBe('/find-by-id.jpg');
    });

    it('should return null for non-existent ID', async () => {
      const found = await photoDAO.findById(99999);

      expect(found).toBeNull();
    });

    it('should not find logically deleted photo', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/deleted.jpg',
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
      await photoDAO.create({ case_id: testCaseId, file_path: '/photoA.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photoB.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photoC.jpg' });

      const photos = await photoDAO.findAll();

      expect(photos).toHaveLength(3);
      expect(photos[0].file_path).toBe('/photoC.jpg'); // DESC順なので最新が先
      expect(photos[1].file_path).toBe('/photoB.jpg');
      expect(photos[2].file_path).toBe('/photoA.jpg');
    });

    it('should not return logically deleted photos', async () => {
      const photo1 = await photoDAO.create({ case_id: testCaseId, file_path: '/active.jpg' });
      const photo2 = await photoDAO.create({ case_id: testCaseId, file_path: '/deleted.jpg' });
      await photoDAO.delete(photo2.id);

      const photos = await photoDAO.findAll();

      expect(photos).toHaveLength(1);
      expect(photos[0].id).toBe(photo1.id);
    });
  });

  describe('findByCaseId()', () => {
    it('should find all photos for a specific case', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/case1-photo1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/case1-photo2.jpg' });

      const case2 = await caseDAO.create({ title: '案件2' });
      await photoDAO.create({ case_id: case2.id, file_path: '/case2-photo.jpg' });

      const photos = await photoDAO.findByCaseId(testCaseId);

      expect(photos).toHaveLength(2);
      expect(photos.every((p) => p.case_id === testCaseId)).toBe(true);
    });

    it('should return empty array for case with no photos', async () => {
      const case2 = await caseDAO.create({ title: '空の案件' });

      const photos = await photoDAO.findByCaseId(case2.id);

      expect(photos).toEqual([]);
    });

    it('should not return logically deleted photos', async () => {
      const photo1 = await photoDAO.create({ case_id: testCaseId, file_path: '/active.jpg' });
      const photo2 = await photoDAO.create({ case_id: testCaseId, file_path: '/deleted.jpg' });
      await photoDAO.delete(photo2.id);

      const photos = await photoDAO.findByCaseId(testCaseId);

      expect(photos).toHaveLength(1);
      expect(photos[0].id).toBe(photo1.id);
    });
  });

  describe('findByReportId()', () => {
    it('should find all photos for a specific report', async () => {
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/report1-photo1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/report1-photo2.jpg',
      });

      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '報告書2',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: report2.id,
        file_path: '/report2-photo.jpg',
      });

      const photos = await photoDAO.findByReportId(testReportId);

      expect(photos).toHaveLength(2);
      expect(photos.every((p) => p.report_id === testReportId)).toBe(true);
    });

    it('should return empty array for report with no photos', async () => {
      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '空の報告書',
      });

      const photos = await photoDAO.findByReportId(report2.id);

      expect(photos).toEqual([]);
    });
  });

  describe('update()', () => {
    it('should update caption field', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photo.jpg',
      });

      const updated = await photoDAO.update(created.id, { caption: '新しいキャプション' });

      expect(updated.caption).toBe('新しいキャプション');
    });

    it('should update annotation_data field', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photo.jpg',
      });

      const annotationData = '{"circles": [{"x": 100, "y": 200}]}';
      const updated = await photoDAO.update(created.id, { annotation_data: annotationData });

      expect(updated.annotation_data).toBe(annotationData);
    });

    it('should update multiple fields at once', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photo.jpg',
      });

      const input: UpdatePhotoInput = {
        caption: 'キャプション',
        annotation_data: '{"arrows": []}',
      };

      const updated = await photoDAO.update(created.id, input);

      expect(updated.caption).toBe(input.caption);
      expect(updated.annotation_data).toBe(input.annotation_data);
    });

    it('should return existing photo when no fields to update', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/photo.jpg',
        caption: '元のキャプション',
      });

      const updated = await photoDAO.update(created.id, {});

      expect(updated.id).toBe(created.id);
      expect(updated.caption).toBe(created.caption);
    });

    it('should throw error when updating non-existent photo', async () => {
      await expect(photoDAO.update(99999, { caption: '新キャプション' })).rejects.toThrow(
        'Photo #99999 not found'
      );
    });

    it('should throw error when updating logically deleted photo', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/deleted.jpg',
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
        file_path: '/delete-me.jpg',
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
        file_path: '/photo.jpg',
      });
      await photoDAO.delete(created.id);

      await expect(photoDAO.delete(created.id)).rejects.toThrow(`Photo #${created.id} not found`);
    });
  });

  describe('countByCaseId()', () => {
    it('should count photos for a specific case', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo3.jpg' });

      const count = await photoDAO.countByCaseId(testCaseId);

      expect(count).toBe(3);
    });

    it('should return 0 for case with no photos', async () => {
      const case2 = await caseDAO.create({ title: '空の案件' });

      const count = await photoDAO.countByCaseId(case2.id);

      expect(count).toBe(0);
    });

    it('should not count logically deleted photos', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo1.jpg' });
      const photo2 = await photoDAO.create({ case_id: testCaseId, file_path: '/photo2.jpg' });
      await photoDAO.delete(photo2.id);

      const count = await photoDAO.countByCaseId(testCaseId);

      expect(count).toBe(1);
    });
  });

  describe('countByReportId()', () => {
    it('should count photos for a specific report', async () => {
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photo1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photo2.jpg',
      });

      const count = await photoDAO.countByReportId(testReportId);

      expect(count).toBe(2);
    });

    it('should return 0 for report with no photos', async () => {
      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '空の報告書',
      });

      const count = await photoDAO.countByReportId(report2.id);

      expect(count).toBe(0);
    });
  });

  describe('count()', () => {
    it('should return 0 when no photos exist', async () => {
      const count = await photoDAO.count();

      expect(count).toBe(0);
    });

    it('should return correct count of active photos', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo3.jpg' });

      const count = await photoDAO.count();

      expect(count).toBe(3);
    });

    it('should not count logically deleted photos', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo1.jpg' });
      const photo2 = await photoDAO.create({ case_id: testCaseId, file_path: '/photo2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo3.jpg' });
      await photoDAO.delete(photo2.id);

      const count = await photoDAO.count();

      expect(count).toBe(2);
    });
  });

  describe('deleteByCaseId()', () => {
    it('should delete all photos for a specific case', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo3.jpg' });

      await photoDAO.deleteByCaseId(testCaseId);

      const photos = await photoDAO.findByCaseId(testCaseId);
      expect(photos).toEqual([]);
    });

    it('should not affect photos from other cases', async () => {
      const case2 = await caseDAO.create({ title: '案件2' });

      await photoDAO.create({ case_id: testCaseId, file_path: '/case1-photo.jpg' });
      await photoDAO.create({ case_id: case2.id, file_path: '/case2-photo.jpg' });

      await photoDAO.deleteByCaseId(testCaseId);

      const case1Photos = await photoDAO.findByCaseId(testCaseId);
      const case2Photos = await photoDAO.findByCaseId(case2.id);

      expect(case1Photos).toEqual([]);
      expect(case2Photos).toHaveLength(1);
    });
  });

  describe('deleteByReportId()', () => {
    it('should delete all photos for a specific report', async () => {
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photo1.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photo2.jpg',
      });

      await photoDAO.deleteByReportId(testReportId);

      const photos = await photoDAO.findByReportId(testReportId);
      expect(photos).toEqual([]);
    });

    it('should not affect photos from other reports', async () => {
      const report2 = await reportDAO.create({
        case_id: testCaseId,
        title: '報告書2',
      });

      await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/report1-photo.jpg',
      });
      await photoDAO.create({
        case_id: testCaseId,
        report_id: report2.id,
        file_path: '/report2-photo.jpg',
      });

      await photoDAO.deleteByReportId(testReportId);

      const report1Photos = await photoDAO.findByReportId(testReportId);
      const report2Photos = await photoDAO.findByReportId(report2.id);

      expect(report1Photos).toEqual([]);
      expect(report2Photos).toHaveLength(1);
    });
  });

  describe('hardDelete()', () => {
    it('should physically delete a photo from database', async () => {
      const created = await photoDAO.create({
        case_id: testCaseId,
        file_path: '/hard-delete.jpg',
      });

      await photoDAO.hardDelete(created.id);

      // 論理削除チェックを回避して直接SQLで確認
      const db = databaseService.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM photos WHERE id = ?',
        [created.id]
      );

      expect(result?.count).toBe(0);
    });
  });

  describe('truncate()', () => {
    it('should delete all photos from database', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo2.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo3.jpg' });

      await photoDAO.truncate();

      const count = await photoDAO.count();
      expect(count).toBe(0);
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should cascade delete photos when parent case is deleted', async () => {
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo1.jpg' });
      await photoDAO.create({ case_id: testCaseId, file_path: '/photo2.jpg' });

      // 案件を物理削除（CASCADE DELETE発動）
      await caseDAO.hardDelete(testCaseId);

      // 論理削除チェックを回避して直接SQLで確認
      const db = databaseService.getDatabase();
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM photos WHERE case_id = ?',
        [testCaseId]
      );

      expect(result?.count).toBe(0);
    });

    it('should set report_id to NULL when parent report is deleted (SET NULL)', async () => {
      const photo = await photoDAO.create({
        case_id: testCaseId,
        report_id: testReportId,
        file_path: '/photo-with-report.jpg',
      });

      // 報告書を物理削除（SET NULL発動）
      await reportDAO.hardDelete(testReportId);

      // 論理削除チェックを回避して直接SQLで確認
      const db = databaseService.getDatabase();
      const result = await db.getFirstAsync<{ report_id: number | null }>(
        'SELECT report_id FROM photos WHERE id = ?',
        [photo.id]
      );

      expect(result?.report_id).toBeNull();
    });
  });
});
