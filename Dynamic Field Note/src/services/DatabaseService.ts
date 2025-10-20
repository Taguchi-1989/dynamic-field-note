/**
 * DatabaseService
 * SQLiteデータベース管理サービス
 *
 * 責務:
 * - データベース初期化・マイグレーション
 * - トランザクション管理
 * - エラーハンドリング
 */

import { Platform } from 'react-native';

// Web版ではexpo-sqliteのWASM問題があるため、動的import
let SQLite: typeof import('expo-sqlite') | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  SQLite = require('expo-sqlite');
}

/**
 * データベース名
 */
const DB_NAME = 'dynamic_field_note.db';

/**
 * 型エイリアス（Web版でのnull対応）
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SQLiteDatabase = SQLite extends null ? any : import('expo-sqlite').SQLiteDatabase;

/**
 * マイグレーション定義
 */
interface Migration {
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * データベースサービスクラス
 */
export class DatabaseService {
  private db: SQLiteDatabase | null = null;
  private initialized = false;

  /**
   * データベースを初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Web環境ではデータベースをスキップ（IndexedDBフォールバック未実装）
    if (Platform.OS === 'web' || !SQLite) {
      console.warn(
        '[DatabaseService] SQLite not supported on Web. Skipping database initialization.'
      );
      this.initialized = true;
      return;
    }

    try {
      // データベースを開く
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // マイグレーション実行
      await this.runMigrations();

      this.initialized = true;
      console.log('[DatabaseService] Database initialized successfully');
    } catch (error) {
      console.error('[DatabaseService] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * データベースインスタンスを取得
   */
  getDatabase(): SQLiteDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * マイグレーションを実行
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // 現在のバージョンを取得
    const currentVersion = await this.getCurrentVersion();

    console.log(`[DatabaseService] Current DB version: ${currentVersion}`);

    // 実行すべきマイグレーションをフィルタ
    const pendingMigrations = migrations.filter((m) => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      console.log('[DatabaseService] No pending migrations');
      return;
    }

    console.log(`[DatabaseService] Running ${pendingMigrations.length} migration(s)`);

    // マイグレーションを順次実行
    for (const migration of pendingMigrations) {
      console.log(`[DatabaseService] Applying migration v${migration.version}`);
      await migration.up(this.db);
      await this.setCurrentVersion(migration.version);
    }

    console.log('[DatabaseService] All migrations completed');
  }

  /**
   * 現在のデータベースバージョンを取得
   */
  private async getCurrentVersion(): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
      return result?.user_version ?? 0;
    } catch (error) {
      console.error('[DatabaseService] Failed to get current version:', error);
      return 0;
    }
  }

  /**
   * マイグレーションバージョンを取得（公開API）
   */
  async getMigrationVersion(): Promise<number> {
    return this.getCurrentVersion();
  }

  /**
   * データベースバージョンを設定
   */
  private async setCurrentVersion(version: number): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.execAsync(`PRAGMA user_version = ${version}`);
  }

  /**
   * トランザクション実行
   */
  async transaction<T>(callback: (db: SQLiteDatabase) => Promise<T>): Promise<T> {
    const db = this.getDatabase();

    try {
      await db.execAsync('BEGIN TRANSACTION');
      const result = await callback(db);
      await db.execAsync('COMMIT');
      return result;
    } catch (error) {
      await db.execAsync('ROLLBACK');
      throw error;
    }
  }

  /**
   * SQL実行（結果なし）
   */
  async execute(sql: string, params?: (string | number | null)[]): Promise<void> {
    const db = this.getDatabase();
    await db.runAsync(sql, params ?? []);
  }

  /**
   * SQL実行（結果あり）
   */
  async executeRaw<T = unknown>(sql: string, params?: (string | number | null)[]): Promise<T[]> {
    const db = this.getDatabase();
    const result = await db.getAllAsync<T>(sql, params ?? []);
    return result;
  }

  /**
   * 単一行取得
   */
  async executeOne<T = unknown>(
    sql: string,
    params?: (string | number | null)[]
  ): Promise<T | null> {
    const db = this.getDatabase();
    const result = await db.getFirstAsync<T>(sql, params ?? []);
    return result ?? null;
  }

  /**
   * データベースをクローズ（テスト用）
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initialized = false;
    }
  }

  /**
   * データベースを削除（テスト用）
   */
  async drop(): Promise<void> {
    if (this.db) {
      await this.close();
    }
    if (SQLite) {
      await SQLite.deleteDatabaseAsync(DB_NAME);
      console.log('[DatabaseService] Database dropped');
    }
  }
}

/**
 * マイグレーション定義
 */
const migrations: Migration[] = [
  {
    version: 1,
    up: async (db: SQLiteDatabase) => {
      // cases テーブル作成
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS cases (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          client_name TEXT,
          location TEXT,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          synced_at TEXT,
          is_deleted INTEGER NOT NULL DEFAULT 0,

          CHECK (status IN ('active', 'completed', 'archived')),
          CHECK (is_deleted IN (0, 1))
        );
      `);

      // reports テーブル作成
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          case_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          voice_buffer TEXT,
          summary_json TEXT,
          processing_time INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          is_deleted INTEGER NOT NULL DEFAULT 0,

          FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
          CHECK (is_deleted IN (0, 1))
        );
      `);

      // インデックス作成
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at DESC);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cases_is_deleted ON cases(is_deleted);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_reports_case_id ON reports(case_id);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_reports_is_deleted ON reports(is_deleted);
      `);

      console.log('[Migration v1] Tables and indexes created successfully');
    },
  },
  {
    version: 2,
    up: async (db: SQLiteDatabase) => {
      // photos テーブル作成
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS photos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          case_id INTEGER NOT NULL,
          report_id INTEGER,
          file_path TEXT NOT NULL,
          thumbnail_path TEXT,
          caption TEXT,
          exif_data TEXT,
          annotation_data TEXT,
          width INTEGER,
          height INTEGER,
          file_size INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          is_deleted INTEGER NOT NULL DEFAULT 0,

          FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
          FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL,
          CHECK (is_deleted IN (0, 1))
        );
      `);

      // インデックス作成
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_photos_case_id ON photos(case_id);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_photos_report_id ON photos(report_id);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
      `);

      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_photos_is_deleted ON photos(is_deleted);
      `);

      console.log('[Migration v2] Photos table and indexes created successfully');
    },
  },
];

/**
 * シングルトンインスタンス
 */
export const databaseService = new DatabaseService();

/**
 * 型エクスポート
 */
export type { Migration };
