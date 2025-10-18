/**
 * DatabaseService for Node.js Testing
 * better-sqlite3を使用したテスト環境用アダプター
 *
 * expo-sqlite互換のインターフェースを提供し、
 * 統合テストをNode.js環境で実行可能にする
 */

import Database from 'better-sqlite3';
import type { SQLiteBindValue } from 'expo-sqlite';

/**
 * RunResult型 (expo-sqlite互換)
 */
interface RunResult {
  lastInsertRowId: number;
  changes: number;
}

/**
 * SQLiteDatabase型 (expo-sqlite互換)
 */
interface SQLiteDatabaseNode {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: SQLiteBindValue[]): Promise<RunResult>;
  getFirstAsync<T>(source: string, params?: SQLiteBindValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, params?: SQLiteBindValue[]): Promise<T[]>;
  withTransactionAsync<T>(task: () => Promise<T>): Promise<T>;
}

/**
 * better-sqlite3ラッパークラス
 * expo-sqliteと同じAPIを提供
 */
class BetterSqliteAdapter implements SQLiteDatabaseNode {
  private db: Database.Database;

  constructor(filename: string = ':memory:') {
    this.db = new Database(filename);
    // 外部キー制約を有効化
    this.db.pragma('foreign_keys = ON');
  }

  async execAsync(source: string): Promise<void> {
    this.db.exec(source);
  }

  async runAsync(source: string, params: SQLiteBindValue[] = []): Promise<RunResult> {
    const stmt = this.db.prepare(source);
    const info = stmt.run(...params);

    return {
      lastInsertRowId: Number(info.lastInsertRowid),
      changes: info.changes,
    };
  }

  async getFirstAsync<T>(source: string, params: SQLiteBindValue[] = []): Promise<T | null> {
    const stmt = this.db.prepare(source);
    const result = stmt.get(...params) as T | undefined;
    return result ?? null;
  }

  async getAllAsync<T>(source: string, params: SQLiteBindValue[] = []): Promise<T[]> {
    const stmt = this.db.prepare(source);
    return stmt.all(...params) as T[];
  }

  async withTransactionAsync<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(() => {
        task()
          .then(resolve)
          .catch(reject);
      });

      try {
        transaction();
      } catch (error) {
        reject(error);
      }
    });
  }

  close(): void {
    this.db.close();
  }
}

/**
 * データベース名
 */
const DB_NAME = ':memory:'; // テストではインメモリDB使用

/**
 * マイグレーション定義
 */
interface Migration {
  version: number;
  up: (db: SQLiteDatabaseNode) => Promise<void>;
}

/**
 * データベースサービスクラス (Node.js版)
 */
class NodeDatabaseService {
  private db: BetterSqliteAdapter | null = null;
  private initialized = false;

  /**
   * データベースを初期化
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // better-sqlite3でデータベースを開く
      this.db = new BetterSqliteAdapter(DB_NAME);

      // マイグレーション実行
      await this.runMigrations();

      this.initialized = true;
      console.log('[NodeDatabaseService] Database initialized successfully');
    } catch (error) {
      console.error('[NodeDatabaseService] Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * データベースインスタンスを取得
   */
  getDatabase(): SQLiteDatabaseNode {
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

    console.log(`[NodeDatabaseService] Current DB version: ${currentVersion}`);

    // 実行すべきマイグレーションをフィルタ
    const pendingMigrations = migrations.filter((m) => m.version > currentVersion);

    if (pendingMigrations.length === 0) {
      console.log('[NodeDatabaseService] No pending migrations');
      return;
    }

    console.log(`[NodeDatabaseService] Running ${pendingMigrations.length} migration(s)`);

    // マイグレーションを順次実行
    for (const migration of pendingMigrations) {
      console.log(`[NodeDatabaseService] Applying migration v${migration.version}`);
      await migration.up(this.db);
      await this.setCurrentVersion(migration.version);
    }

    console.log('[NodeDatabaseService] All migrations completed');
  }

  /**
   * 現在のデータベースバージョンを取得
   */
  private async getCurrentVersion(): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.getFirstAsync<{ user_version: number }>(
      'PRAGMA user_version'
    );

    return result?.user_version ?? 0;
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
   * データベースをクローズ (テスト後のクリーンアップ用)
   */
  close(): void {
    if (this.db instanceof BetterSqliteAdapter) {
      this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

/**
 * マイグレーション定義 (本番のDatabaseService.tsと同じ)
 */
const migrations: Migration[] = [
  // Migration v1: 案件・報告書テーブル
  {
    version: 1,
    up: async (db: SQLiteDatabaseNode) => {
      // 案件テーブル
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
          is_deleted INTEGER NOT NULL DEFAULT 0,

          CHECK (status IN ('active', 'completed', 'archived')),
          CHECK (is_deleted IN (0, 1))
        )
      `);

      // 案件テーブルのインデックス
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_cases_is_deleted ON cases(is_deleted);
      `);

      // 報告書テーブル
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS reports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          case_id INTEGER NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          voice_buffer TEXT,
          summary_json TEXT,
          processing_time REAL,
          created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
          is_deleted INTEGER NOT NULL DEFAULT 0,

          FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
          CHECK (is_deleted IN (0, 1))
        )
      `);

      // 報告書テーブルのインデックス
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_reports_case_id ON reports(case_id);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_reports_is_deleted ON reports(is_deleted);
      `);

      console.log('[Migration v1] Tables and indexes created successfully');
    },
  },

  // Migration v2: 写真テーブル
  {
    version: 2,
    up: async (db: SQLiteDatabaseNode) => {
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
        )
      `);

      // 写真テーブルのインデックス
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_photos_case_id ON photos(case_id);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_photos_report_id ON photos(report_id);
      `);
      await db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at);
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
export const nodeDatabaseService = new NodeDatabaseService();
