/**
 * DatabaseService Integration Tests
 *
 * テスト範囲:
 * - データベース初期化
 * - マイグレーション実行
 * - バージョン管理
 * - テーブル作成の検証
 * - エラーハンドリング
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { databaseService } from '../../../src/services/DatabaseService';

describe('DatabaseService Integration Tests', () => {
  // テスト前にデータベースを初期化
  beforeAll(async () => {
    await databaseService.initialize();
  });

  describe('initialize()', () => {
    it('should initialize database successfully', async () => {
      // 既に初期化済みなので、再度呼んでもエラーにならないことを確認
      await expect(databaseService.initialize()).resolves.not.toThrow();
    });

    it('should return a valid database instance', () => {
      const db = databaseService.getDatabase();

      expect(db).toBeDefined();
      expect(db).not.toBeNull();
    });

    it('should be idempotent (safe to call multiple times)', async () => {
      await databaseService.initialize();
      await databaseService.initialize();
      await databaseService.initialize();

      const db = databaseService.getDatabase();
      expect(db).toBeDefined();
    });
  });

  describe('Database Schema - Migration v1', () => {
    it('should create cases table with correct schema', async () => {
      const db = databaseService.getDatabase();

      // テーブルの存在確認
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='cases'"
      );

      expect(tableInfo).toHaveLength(1);
      expect(tableInfo[0].name).toBe('cases');

      // カラム情報の確認
      const columns = await db.getAllAsync<{ name: string; type: string; notnull: number }>(
        'PRAGMA table_info(cases)'
      );

      const columnNames = columns.map((c) => c.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('client_name');
      expect(columnNames).toContain('location');
      expect(columnNames).toContain('description');
      expect(columnNames).toContain('status');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
      expect(columnNames).toContain('is_deleted');
    });

    it('should create reports table with correct schema', async () => {
      const db = databaseService.getDatabase();

      // テーブルの存在確認
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='reports'"
      );

      expect(tableInfo).toHaveLength(1);
      expect(tableInfo[0].name).toBe('reports');

      // カラム情報の確認
      const columns = await db.getAllAsync<{ name: string; type: string }>(
        'PRAGMA table_info(reports)'
      );

      const columnNames = columns.map((c) => c.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('case_id');
      expect(columnNames).toContain('title');
      expect(columnNames).toContain('content');
      expect(columnNames).toContain('voice_buffer');
      expect(columnNames).toContain('summary_json');
      expect(columnNames).toContain('processing_time');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('updated_at');
      expect(columnNames).toContain('is_deleted');
    });

    it('should create indexes on cases table', async () => {
      const db = databaseService.getDatabase();

      const indexes = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='cases'"
      );

      const indexNames = indexes.map((i) => i.name);
      expect(indexNames).toContain('idx_cases_status');
      expect(indexNames).toContain('idx_cases_created_at');
      expect(indexNames).toContain('idx_cases_is_deleted');
    });

    it('should create indexes on reports table', async () => {
      const db = databaseService.getDatabase();

      const indexes = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='reports'"
      );

      const indexNames = indexes.map((i) => i.name);
      expect(indexNames).toContain('idx_reports_case_id');
      expect(indexNames).toContain('idx_reports_created_at');
      expect(indexNames).toContain('idx_reports_is_deleted');
    });
  });

  describe('Database Schema - Migration v2', () => {
    it('should create photos table with correct schema', async () => {
      const db = databaseService.getDatabase();

      // テーブルの存在確認
      const tableInfo = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='photos'"
      );

      expect(tableInfo).toHaveLength(1);
      expect(tableInfo[0].name).toBe('photos');

      // カラム情報の確認
      const columns = await db.getAllAsync<{ name: string; type: string }>(
        'PRAGMA table_info(photos)'
      );

      const columnNames = columns.map((c) => c.name);
      expect(columnNames).toContain('id');
      expect(columnNames).toContain('case_id');
      expect(columnNames).toContain('report_id');
      expect(columnNames).toContain('file_path');
      expect(columnNames).toContain('thumbnail_path');
      expect(columnNames).toContain('caption');
      expect(columnNames).toContain('exif_data');
      expect(columnNames).toContain('annotation_data');
      expect(columnNames).toContain('width');
      expect(columnNames).toContain('height');
      expect(columnNames).toContain('file_size');
      expect(columnNames).toContain('created_at');
      expect(columnNames).toContain('is_deleted');
    });

    it('should create indexes on photos table', async () => {
      const db = databaseService.getDatabase();

      const indexes = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='photos'"
      );

      const indexNames = indexes.map((i) => i.name);
      expect(indexNames).toContain('idx_photos_case_id');
      expect(indexNames).toContain('idx_photos_report_id');
      expect(indexNames).toContain('idx_photos_created_at');
      expect(indexNames).toContain('idx_photos_is_deleted');
    });

    it('should have foreign key constraints on photos table', async () => {
      const db = databaseService.getDatabase();

      const foreignKeys = await db.getAllAsync<{
        table: string;
        from: string;
        to: string;
        on_delete: string;
      }>('PRAGMA foreign_key_list(photos)');

      // case_id外部キー
      const caseFk = foreignKeys.find((fk) => fk.from === 'case_id');
      expect(caseFk).toBeDefined();
      expect(caseFk?.table).toBe('cases');
      expect(caseFk?.on_delete).toBe('CASCADE');

      // report_id外部キー
      const reportFk = foreignKeys.find((fk) => fk.from === 'report_id');
      expect(reportFk).toBeDefined();
      expect(reportFk?.table).toBe('reports');
      expect(reportFk?.on_delete).toBe('SET NULL');
    });
  });

  describe('Database Version Management', () => {
    it('should have current version set to 2', async () => {
      const db = databaseService.getDatabase();

      const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');

      expect(result?.user_version).toBe(2);
    });

    it('should have all tables from all migrations', async () => {
      const db = databaseService.getDatabase();

      const tables = await db.getAllAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain('cases');
      expect(tableNames).toContain('reports');
      expect(tableNames).toContain('photos');
    });
  });

  describe('Foreign Key Enforcement', () => {
    it('should have foreign keys enabled', async () => {
      const db = databaseService.getDatabase();

      const result = await db.getFirstAsync<{ foreign_keys: number }>('PRAGMA foreign_keys');

      expect(result?.foreign_keys).toBe(1);
    });

    it('should enforce foreign key constraints on reports table', async () => {
      const db = databaseService.getDatabase();

      // 存在しない case_id で報告書を作成しようとする
      await expect(
        db.runAsync(
          'INSERT INTO reports (case_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [99999, 'Invalid Report', new Date().toISOString(), new Date().toISOString()]
        )
      ).rejects.toThrow();
    });

    it('should enforce foreign key constraints on photos table', async () => {
      const db = databaseService.getDatabase();

      // 存在しない case_id で写真を作成しようとする
      await expect(
        db.runAsync('INSERT INTO photos (case_id, file_path, created_at) VALUES (?, ?, ?)', [
          99999,
          '/invalid.jpg',
          new Date().toISOString(),
        ])
      ).rejects.toThrow();
    });
  });

  describe('Check Constraints', () => {
    it('should enforce CHECK constraint on cases.status', async () => {
      const db = databaseService.getDatabase();

      const now = new Date().toISOString();

      // 無効なステータスで案件を作成しようとする
      await expect(
        db.runAsync(
          'INSERT INTO cases (title, status, created_at, updated_at) VALUES (?, ?, ?, ?)',
          ['Test Case', 'invalid_status', now, now]
        )
      ).rejects.toThrow();
    });

    it('should accept valid status values for cases', async () => {
      const db = databaseService.getDatabase();

      const now = new Date().toISOString();
      const validStatuses = ['active', 'completed', 'archived'];

      for (const status of validStatuses) {
        await expect(
          db.runAsync(
            'INSERT INTO cases (title, status, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [`Test Case ${status}`, status, now, now]
          )
        ).resolves.not.toThrow();
      }

      // クリーンアップ
      await db.runAsync('DELETE FROM cases WHERE title LIKE ?', ['Test Case %']);
    });

    it('should enforce CHECK constraint on is_deleted (0 or 1)', async () => {
      const db = databaseService.getDatabase();

      const now = new Date().toISOString();

      // is_deleted に 2 を設定しようとする
      await expect(
        db.runAsync(
          'INSERT INTO cases (title, status, is_deleted, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          ['Test Case', 'active', 2, now, now]
        )
      ).rejects.toThrow();
    });
  });

  describe('Default Values', () => {
    it('should set default created_at for cases', async () => {
      const db = databaseService.getDatabase();

      const result = await db.runAsync(
        'INSERT INTO cases (title, status, updated_at) VALUES (?, ?, ?)',
        ['Default Test', 'active', new Date().toISOString()]
      );

      const inserted = await db.getFirstAsync<{ created_at: string }>(
        'SELECT created_at FROM cases WHERE id = ?',
        [result.lastInsertRowId]
      );

      expect(inserted?.created_at).toBeDefined();
      expect(inserted?.created_at).not.toBe('');

      // クリーンアップ
      await db.runAsync('DELETE FROM cases WHERE id = ?', [result.lastInsertRowId]);
    });

    it('should set default is_deleted to 0 for cases', async () => {
      const db = databaseService.getDatabase();

      const now = new Date().toISOString();
      const result = await db.runAsync(
        'INSERT INTO cases (title, status, created_at, updated_at) VALUES (?, ?, ?, ?)',
        ['Default Test', 'active', now, now]
      );

      const inserted = await db.getFirstAsync<{ is_deleted: number }>(
        'SELECT is_deleted FROM cases WHERE id = ?',
        [result.lastInsertRowId]
      );

      expect(inserted?.is_deleted).toBe(0);

      // クリーンアップ
      await db.runAsync('DELETE FROM cases WHERE id = ?', [result.lastInsertRowId]);
    });
  });

  describe('Transaction Support', () => {
    it('should support basic transaction operations', async () => {
      const db = databaseService.getDatabase();

      const now = new Date().toISOString();

      // トランザクション内で複数操作を実行
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          'INSERT INTO cases (title, status, created_at, updated_at) VALUES (?, ?, ?, ?)',
          ['Transaction Test 1', 'active', now, now]
        );
        await db.runAsync(
          'INSERT INTO cases (title, status, created_at, updated_at) VALUES (?, ?, ?, ?)',
          ['Transaction Test 2', 'active', now, now]
        );
      });

      // 挿入されたことを確認
      const result = await db.getAllAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM cases WHERE title LIKE 'Transaction Test%'"
      );

      expect(result[0].count).toBe(2);

      // クリーンアップ
      await db.runAsync("DELETE FROM cases WHERE title LIKE 'Transaction Test%'");
    });
  });
});
