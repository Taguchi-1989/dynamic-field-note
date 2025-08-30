/**
 * DbService - SQLiteデータベース管理サービス
 * 
 * masterfile.md 仕様に基づくローカルファーストデータベース
 * - better-sqlite3 使用
 * - DDL自動マイグレーション
 * - DAO（Data Access Object）パターン
 * - 監査ログ・change_log対応
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import { WorkspaceService } from './WorkspaceService';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// エンティティスキーマ定義
export const UserSchema = z.object({
  id: z.string().uuid(),
  external_id: z.string().nullable().optional(),
  display_name: z.string(),
  email: z.string().email().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const MeetingSchema = z.object({
  id: z.string().uuid(),
  owner_id: z.string().uuid(),
  title: z.string(),
  started_at: z.string().nullable().optional(),
  ended_at: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  status: z.enum(['draft', 'processing', 'done', 'archived']).default('draft'),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});

export const DocumentSchema = z.object({
  id: z.string().uuid(),
  meeting_id: z.string().uuid(),
  type: z.enum(['minutes', 'summary', 'todo', 'markdown', 'pdf_meta']),
  title: z.string().nullable().optional(),
  current_version_id: z.string().uuid().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const DocumentVersionSchema = z.object({
  id: z.string().uuid(),
  document_id: z.string().uuid(),
  content_md: z.string().nullable().optional(),
  content_hash: z.string(),
  created_by: z.string().uuid(),
  created_at: z.string(),
});

export const TaskSchema = z.object({
  id: z.string().uuid(),
  meeting_id: z.string().uuid(),
  title: z.string(),
  assignee: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: z.enum(['open', 'in_progress', 'blocked', 'done']).default('open'),
  source_segment_id: z.number().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AttachmentSchema = z.object({
  id: z.string().uuid(),
  meeting_id: z.string().uuid(),
  type: z.enum(['source_vtt', 'audio', 'pdf', 'image', 'other']),
  storage_path: z.string(),
  content_hash: z.string(),
  mime: z.string().nullable().optional(),
  bytes: z.number().nullable().optional(),
  created_at: z.string(),
});

export const JobSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  payload: z.string(), // JSON string
  status: z.enum(['queued', 'running', 'succeeded', 'failed', 'canceled']).default('queued'),
  progress: z.number().default(0),
  result: z.string().nullable().optional(), // JSON string
  error: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

// 型定義
export type User = z.infer<typeof UserSchema>;
export type Meeting = z.infer<typeof MeetingSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type DocumentVersion = z.infer<typeof DocumentVersionSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type Job = z.infer<typeof JobSchema>;

export interface AuditLogEntry {
  actor_id?: string;
  action: string;
  entity: string;
  entity_id: string;
  detail?: string; // JSON string
}

export interface ChangeLogEntry {
  entity: string;
  entity_id: string;
  op: 'insert' | 'update' | 'delete';
  version: number;
  vector_clock?: string; // JSON string
  patch?: string; // JSON patch or after image
  actor_device_id?: string;
}

export class DbService {
  private static instance: DbService;
  private db: Database.Database | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DbService {
    if (!DbService.instance) {
      DbService.instance = new DbService();
    }
    return DbService.instance;
  }

  /**
   * データベースを初期化
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const workspaceService = WorkspaceService.getInstance();
    const { paths } = await workspaceService.resolve();
    
    const dbPath = paths.db;
    console.log('SQLiteデータベース初期化:', dbPath);

    // データベースファイルのディレクトリを作成
    const dbDir = path.dirname(dbPath);
    await import('fs/promises').then(fs => fs.mkdir(dbDir, { recursive: true }));

    // SQLite接続
    this.db = new Database(dbPath);
    
    // SQLiteオプション設定
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('temp_store = memory');

    // スキーママイグレーション実行
    await this.runMigrations();

    this.isInitialized = true;
    console.log('SQLiteデータベース初期化完了');
  }

  /**
   * データベースを閉じる
   */
  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  /**
   * データベースインスタンスを取得（内部用）
   */
  private getDb(): Database.Database {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * DDLマイグレーションを実行
   */
  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error('Database connection not established');
    }
    const db = this.db;
    
    console.log('SQLiteスキーママイグレーション開始');

    // masterfile.md の DDL を実行
    const migrations = [
      // users テーブル
      `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        external_id TEXT,
        display_name TEXT,
        email TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,

      // meetings テーブル
      `
      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        owner_id TEXT REFERENCES users(id),
        title TEXT NOT NULL,
        started_at TEXT,
        ended_at TEXT,
        location TEXT,
        status TEXT CHECK (status IN ('draft','processing','done','archived')) DEFAULT 'draft',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        deleted_at TEXT
      )`,
      `CREATE INDEX IF NOT EXISTS idx_meetings_owner ON meetings(owner_id)`,

      // participants テーブル
      `
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        email TEXT,
        external_id TEXT
      )`,

      // meeting_participants テーブル
      `
      CREATE TABLE IF NOT EXISTS meeting_participants (
        meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
        participant_id TEXT REFERENCES participants(id) ON DELETE RESTRICT,
        role TEXT,
        PRIMARY KEY (meeting_id, participant_id)
      )`,

      // transcript_segments テーブル
      `
      CREATE TABLE IF NOT EXISTS transcript_segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        meeting_id TEXT NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
        start_ms INTEGER NOT NULL,
        end_ms INTEGER NOT NULL,
        speaker_label TEXT,
        text TEXT NOT NULL,
        confidence REAL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_segments_meeting_time ON transcript_segments(meeting_id, start_ms)`,

      // documents テーブル
      `
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('minutes','summary','todo','markdown','pdf_meta')) NOT NULL,
        title TEXT,
        current_version_id TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,

      // document_versions テーブル
      `
      CREATE TABLE IF NOT EXISTS document_versions (
        id TEXT PRIMARY KEY,
        document_id TEXT REFERENCES documents(id) ON DELETE CASCADE,
        content_md TEXT,
        content_hash TEXT,
        created_by TEXT REFERENCES users(id),
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_doc_versions_doc ON document_versions(document_id, created_at)`,

      // tasks テーブル
      `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        assignee TEXT,
        due_date TEXT,
        status TEXT CHECK (status IN ('open','in_progress','blocked','done')) DEFAULT 'open',
        source_segment_id INTEGER REFERENCES transcript_segments(id),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_tasks_meeting ON tasks(meeting_id, status, due_date)`,

      // attachments テーブル
      `
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        meeting_id TEXT REFERENCES meetings(id) ON DELETE CASCADE,
        type TEXT CHECK (type IN ('source_vtt','audio','pdf','image','other')) NOT NULL,
        storage_path TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        mime TEXT,
        bytes INTEGER,
        created_at TEXT DEFAULT (datetime('now'))
      )`,

      // dictionary_entries テーブル
      `
      CREATE TABLE IF NOT EXISTS dictionary_entries (
        id TEXT PRIMARY KEY,
        owner_id TEXT REFERENCES users(id),
        term TEXT NOT NULL,
        canonical TEXT,
        kind TEXT CHECK (kind IN ('person','org','tech','alias','stopword')) DEFAULT 'alias',
        notes TEXT,
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_dict_unique ON dictionary_entries(owner_id, term)`,

      // prompt_templates テーブル
      `
      CREATE TABLE IF NOT EXISTS prompt_templates (
        id TEXT PRIMARY KEY,
        owner_id TEXT REFERENCES users(id),
        name TEXT NOT NULL,
        purpose TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        template_json TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_prompt_version ON prompt_templates(owner_id, name, version)`,

      // embeddings テーブル
      `
      CREATE TABLE IF NOT EXISTS embeddings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        model TEXT NOT NULL,
        dim INTEGER NOT NULL,
        vector BLOB NOT NULL,
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_emb_entity ON embeddings(entity_type, entity_id)`,

      // audit_log テーブル
      `
      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_id TEXT REFERENCES users(id),
        action TEXT NOT NULL,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        detail TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,

      // change_log テーブル
      `
      CREATE TABLE IF NOT EXISTS change_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        op TEXT CHECK (op IN ('insert','update','delete')) NOT NULL,
        version INTEGER NOT NULL,
        vector_clock TEXT,
        patch TEXT,
        actor_device_id TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_changelog_entity ON change_log(entity, entity_id, version)`,

      // costs テーブル
      `
      CREATE TABLE IF NOT EXISTS costs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider TEXT,
        model TEXT,
        input_tokens INTEGER,
        output_tokens INTEGER,
        cost_jpy REAL,
        meta TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      )`,

      // jobs テーブル
      `
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT CHECK (status IN ('queued','running','succeeded','failed','canceled')) DEFAULT 'queued',
        progress REAL DEFAULT 0,
        result TEXT,
        error TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )`,
      `CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status, created_at)`,
    ];

    // トランザクション内でマイグレーション実行
    const migration = db.transaction(() => {
      for (const sql of migrations) {
        db.exec(sql);
      }
    });

    migration();
    console.log('SQLiteスキーママイグレーション完了');
  }

  /**
   * 監査ログを記録
   */
  public addAuditLog(entry: AuditLogEntry): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO audit_log (actor_id, action, entity, entity_id, detail)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      entry.actor_id || null,
      entry.action,
      entry.entity,
      entry.entity_id,
      entry.detail || null
    );
  }

  /**
   * change_logエントリを追加
   */
  public addChangeLog(entry: ChangeLogEntry): void {
    const db = this.getDb();
    const stmt = db.prepare(`
      INSERT INTO change_log (entity, entity_id, op, version, vector_clock, patch, actor_device_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      entry.entity,
      entry.entity_id,
      entry.op,
      entry.version,
      entry.vector_clock || null,
      entry.patch || null,
      entry.actor_device_id || null
    );
  }

  // === User DAO ===
  
  public createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const db = this.getDb();
    const now = new Date().toISOString();
    const user: User = {
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      ...userData,
    };

    const stmt = db.prepare(`
      INSERT INTO users (id, external_id, display_name, email, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(user.id, user.external_id, user.display_name, user.email, user.created_at, user.updated_at);
    
    this.addAuditLog({
      action: 'create',
      entity: 'user',
      entity_id: user.id,
      detail: JSON.stringify({ display_name: user.display_name }),
    });

    return user;
  }

  public getUserById(id: string): User | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? UserSchema.parse(row) : null;
  }

  // === Meeting DAO ===
  
  public createMeeting(meetingData: Omit<Meeting, 'id' | 'created_at' | 'updated_at'>): Meeting {
    const db = this.getDb();
    const now = new Date().toISOString();
    const meeting: Meeting = {
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      status: 'draft',
      ...meetingData,
    };

    const stmt = db.prepare(`
      INSERT INTO meetings (id, owner_id, title, started_at, ended_at, location, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      meeting.id,
      meeting.owner_id,
      meeting.title,
      meeting.started_at,
      meeting.ended_at,
      meeting.location,
      meeting.status,
      meeting.created_at,
      meeting.updated_at
    );

    this.addAuditLog({
      action: 'create',
      entity: 'meeting',
      entity_id: meeting.id,
      detail: JSON.stringify({ title: meeting.title }),
    });

    return meeting;
  }

  public getMeetingById(id: string): Meeting | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM meetings WHERE id = ? AND deleted_at IS NULL');
    const row = stmt.get(id) as any;
    return row ? MeetingSchema.parse(row) : null;
  }

  public getMeetingsByOwner(ownerId: string): Meeting[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM meetings WHERE owner_id = ? AND deleted_at IS NULL ORDER BY created_at DESC');
    const rows = stmt.all(ownerId) as any[];
    return rows.map(row => MeetingSchema.parse(row));
  }

  // === Job DAO ===
  
  public createJob(jobData: Omit<Job, 'id' | 'created_at' | 'updated_at'>): Job {
    const db = this.getDb();
    const now = new Date().toISOString();
    const job: Job = {
      id: uuidv4(),
      created_at: now,
      updated_at: now,
      status: 'queued',
      progress: 0,
      ...jobData,
    };

    const stmt = db.prepare(`
      INSERT INTO jobs (id, type, payload, status, progress, result, error, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      job.id,
      job.type,
      job.payload,
      job.status,
      job.progress,
      job.result,
      job.error,
      job.created_at,
      job.updated_at
    );

    return job;
  }

  public updateJob(id: string, updates: Partial<Omit<Job, 'id' | 'created_at'>>): boolean {
    const db = this.getDb();
    const now = new Date().toISOString();
    
    const fields = [];
    const values = [];
    
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.progress !== undefined) {
      fields.push('progress = ?');
      values.push(updates.progress);
    }
    if (updates.result !== undefined) {
      fields.push('result = ?');
      values.push(updates.result);
    }
    if (updates.error !== undefined) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    
    fields.push('updated_at = ?');
    values.push(now, id);

    const stmt = db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    
    return result.changes > 0;
  }

  public getJobById(id: string): Job | null {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? JobSchema.parse(row) : null;
  }

  public getJobsByStatus(status: Job['status']): Job[] {
    const db = this.getDb();
    const stmt = db.prepare('SELECT * FROM jobs WHERE status = ? ORDER BY created_at ASC');
    const rows = stmt.all(status) as any[];
    return rows.map(row => JobSchema.parse(row));
  }

  /**
   * 統計情報を取得
   */
  public getStats(): {
    users: number;
    meetings: number;
    documents: number;
    jobs: { [status: string]: number };
  } {
    const db = this.getDb();
    
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const meetingCount = db.prepare('SELECT COUNT(*) as count FROM meetings WHERE deleted_at IS NULL').get() as { count: number };
    const documentCount = db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number };
    
    const jobStats = db.prepare('SELECT status, COUNT(*) as count FROM jobs GROUP BY status').all() as { status: string; count: number }[];
    const jobsByStatus = jobStats.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {} as { [status: string]: number });

    return {
      users: userCount.count,
      meetings: meetingCount.count,
      documents: documentCount.count,
      jobs: jobsByStatus,
    };
  }

  /**
   * データベースの健康状態をチェック
   */
  public healthCheck(): { ok: boolean; message: string } {
    try {
      const db = this.getDb();
      
      // 簡単なクエリを実行してデータベースが応答するかテスト
      db.prepare('SELECT 1').get();
      
      // WALモードの確認
      const walMode = db.pragma('journal_mode', { simple: true });
      if (walMode !== 'wal') {
        console.warn('SQLite journal mode is not WAL:', walMode);
      }

      return { ok: true, message: 'Database is healthy' };
    } catch (error) {
      return { ok: false, message: `Database error: ${error}` };
    }
  }


  /**
   * 古いジョブを削除（クリーンアップ用）
   */
  public cleanupOldJobs(olderThanDays: number = 30): number {
    try {
      const db = this.getDb();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);
      const cutoffIso = cutoffDate.toISOString();

      const stmt = db.prepare(`
        DELETE FROM jobs 
        WHERE created_at < ? 
        AND status IN ('succeeded', 'failed', 'canceled')
      `);

      const result = stmt.run(cutoffIso);
      
      if (result.changes > 0) {
        console.log(`🧹 Cleaned up ${result.changes} old jobs`);
      }
      
      return result.changes;
    } catch (error) {
      console.error('Failed to cleanup old jobs:', error);
      return 0;
    }
  }

  /**
   * 失敗したジョブを再キュー（管理用）
   */
  public requeueFailedJobs(maxRetries: number = 3): number {
    try {
      const db = this.getDb();
      const now = new Date().toISOString();

      // 失敗したジョブを再キューに入れる
      const stmt = db.prepare(`
        UPDATE jobs 
        SET status = 'queued', progress = 0, error = NULL, updated_at = ?
        WHERE status = 'failed' 
        AND (
          payload NOT LIKE '%"retries":%' 
          OR json_extract(payload, '$.retries') < ?
        )
      `);

      const result = stmt.run(now, maxRetries);
      
      if (result.changes > 0) {
        console.log(`🔄 Requeued ${result.changes} failed jobs`);
      }
      
      return result.changes;
    } catch (error) {
      console.error('Failed to requeue failed jobs:', error);
      return 0;
    }
  }
}