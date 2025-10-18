/**
 * Smoke Test: Phase 3 DAO Integration
 * CI/CD: Quick validation of DAO layer integrity
 *
 * 目的: 1分以内で完了する軽量テスト
 * 対象: CaseDAO, ReportDAO, PhotoDAO, DatabaseService の基本動作
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { DatabaseService } from '../../src/services/DatabaseService';
import { CaseDAO } from '../../src/services/CaseDAO';
import { ReportDAO } from '../../src/services/ReportDAO';
import { PhotoDAO } from '../../src/services/PhotoDAO';

describe('Smoke Test: DAO Integration', () => {
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

  describe('DatabaseService', () => {
    it('should initialize successfully', async () => {
      expect(databaseService).toBeDefined();
      expect(databaseService.getDatabase).toBeDefined();
    });

    it('should have correct migration version', async () => {
      const version = await databaseService.getMigrationVersion();
      expect(version).toBeGreaterThanOrEqual(2);
    });

    it('should support transactions', async () => {
      const result = await databaseService.transaction(async (db) => {
        return 'transaction-test';
      });
      expect(result).toBe('transaction-test');
    });
  });

  describe('CaseDAO CRUD', () => {
    it('should create and retrieve a case', async () => {
      const testCase = await caseDAO.create({
        title: 'スモークテスト案件',
        location: '東京都',
      });

      expect(testCase.id).toBeDefined();
      expect(testCase.title).toBe('スモークテスト案件');
      expect(testCase.is_deleted).toBe(0);

      const retrieved = await caseDAO.findById(testCase.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.title).toBe('スモークテスト案件');
    });

    it('should list all cases', async () => {
      const cases = await caseDAO.findAll();
      expect(Array.isArray(cases)).toBe(true);
      expect(cases.length).toBeGreaterThan(0);
    });
  });

  describe('ReportDAO CRUD', () => {
    it('should create report linked to case', async () => {
      const testCase = await caseDAO.create({
        title: '報告書テスト案件',
        location: '大阪府',
      });

      const report = await reportDAO.create({
        case_id: testCase.id,
        title: 'スモークテスト報告書',
        content: 'テスト内容',
      });

      expect(report.id).toBeDefined();
      expect(report.case_id).toBe(testCase.id);
      expect(report.title).toBe('スモークテスト報告書');
    });

    it('should find reports by case_id', async () => {
      const testCase = await caseDAO.create({
        title: '複数報告書案件',
        location: '福岡県',
      });

      await reportDAO.create({
        case_id: testCase.id,
        title: '報告書1',
        content: '内容1',
      });

      await reportDAO.create({
        case_id: testCase.id,
        title: '報告書2',
        content: '内容2',
      });

      const reports = await reportDAO.findByCaseId(testCase.id);
      expect(reports.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('PhotoDAO CRUD', () => {
    it('should create photo linked to case', async () => {
      const testCase = await caseDAO.create({
        title: '写真テスト案件',
        location: '北海道',
      });

      const photo = await photoDAO.create({
        case_id: testCase.id,
        file_path: '/photos/smoke-test.jpg',
        caption: 'スモークテスト写真',
      });

      expect(photo.id).toBeDefined();
      expect(photo.case_id).toBe(testCase.id);
      expect(photo.file_path).toBe('/photos/smoke-test.jpg');
    });

    it('should find photos by case_id', async () => {
      const testCase = await caseDAO.create({
        title: '複数写真案件',
        location: '沖縄県',
      });

      await photoDAO.create({
        case_id: testCase.id,
        file_path: '/photos/photo1.jpg',
      });

      const photos = await photoDAO.findByCaseId(testCase.id);
      expect(photos.length).toBeGreaterThan(0);
    });
  });

  describe('Cross-DAO Integration', () => {
    it('should handle complete workflow: Case → Report → Photo', async () => {
      // 案件作成
      const testCase = await caseDAO.create({
        title: '統合ワークフローテスト',
        location: '神奈川県',
        description: '完全な業務フロー',
      });

      // 報告書作成
      const report = await reportDAO.create({
        case_id: testCase.id,
        title: 'ワークフロー報告書',
        content: '調査結果',
      });

      // 写真作成（報告書に紐付け）
      const photo = await photoDAO.create({
        case_id: testCase.id,
        report_id: report.id,
        file_path: '/photos/workflow-test.jpg',
        caption: 'ワークフロー写真',
      });

      // 検証
      const retrievedCase = await caseDAO.findById(testCase.id);
      const retrievedReports = await reportDAO.findByCaseId(testCase.id);
      const retrievedPhotos = await photoDAO.findByReportId(report.id);

      expect(retrievedCase).toBeDefined();
      expect(retrievedReports.length).toBeGreaterThan(0);
      expect(retrievedPhotos.length).toBeGreaterThan(0);

      // report_idが正しく設定されていることを確認
      const photoWithReport = retrievedPhotos.find((p) => p.id === photo.id);
      expect(photoWithReport).toBeDefined();
      expect(photoWithReport?.report_id).toBe(report.id);
    });

    it('should support logical deletion', async () => {
      // 案件作成
      const testCase = await caseDAO.create({
        title: '論理削除テスト案件',
        location: '京都府',
      });

      const caseId = testCase.id;

      // 報告書作成
      const report = await reportDAO.create({
        case_id: caseId,
        title: '削除テスト報告書',
        content: '内容',
      });

      // 案件を論理削除
      await caseDAO.delete(caseId);

      // 削除された案件は取得できない
      const deletedCase = await caseDAO.findById(caseId);
      expect(deletedCase).toBeNull();

      // 注: 現在の実装では自動カスケード削除は未実装
      // 関連データは手動で削除する必要がある
      await reportDAO.delete(report.id);

      const reports = await reportDAO.findByCaseId(caseId);
      expect(reports.length).toBe(0);
    });
  });

  describe('Transaction Integrity', () => {
    it('should rollback on error in transaction', async () => {
      const casesBefore = await caseDAO.findAll();
      const countBefore = casesBefore.length;

      await expect(
        databaseService.transaction(async (db) => {
          await db.runAsync('INSERT INTO cases (title, location) VALUES (?, ?)', [
            'トランザクションテスト',
            '愛知県',
          ]);
          throw new Error('Intentional error');
        })
      ).rejects.toThrow('Intentional error');

      const casesAfter = await caseDAO.findAll();
      expect(casesAfter.length).toBe(countBefore);
    });
  });

  describe('Performance Check', () => {
    it('should handle batch operations efficiently', async () => {
      const startTime = Date.now();

      const testCase = await caseDAO.create({
        title: 'バッチ処理テスト案件',
        location: '広島県',
      });

      // 10件の報告書を作成
      for (let i = 0; i < 10; i++) {
        await reportDAO.create({
          case_id: testCase.id,
          title: `報告書${i + 1}`,
          content: `内容${i + 1}`,
        });
      }

      const reports = await reportDAO.findByCaseId(testCase.id);
      expect(reports.length).toBe(10);

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeLessThan(5000); // 5秒以内
    });
  });
});
