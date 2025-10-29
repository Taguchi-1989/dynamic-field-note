/**
 * CaseDAO
 * 案件（プロジェクト）データアクセスオブジェクト
 *
 * 責務:
 * - 案件のCRUD操作
 * - 案件一覧の取得・フィルタリング
 * - 論理削除の管理
 */

import { databaseService } from '../services/DatabaseService';
import type { Case, CreateCaseInput, UpdateCaseInput, CaseStatus } from '../types/case';
import type { SQLiteBindValue } from 'expo-sqlite';

/**
 * 案件DAOクラス
 */
class CaseDAO {
  /**
   * 全ての有効な案件を取得
   */
  async findAll(): Promise<Case[]> {
    const db = databaseService.getDatabase();
    return await db.getAllAsync<Case>(
      'SELECT * FROM cases WHERE is_deleted = 0 ORDER BY created_at DESC'
    );
  }

  /**
   * ステータスでフィルタして案件を取得
   */
  async findByStatus(status: CaseStatus): Promise<Case[]> {
    const db = databaseService.getDatabase();
    return await db.getAllAsync<Case>(
      'SELECT * FROM cases WHERE status = ? AND is_deleted = 0 ORDER BY created_at DESC',
      [status]
    );
  }

  /**
   * IDで案件を取得
   */
  async findById(id: number): Promise<Case | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync<Case>(
      'SELECT * FROM cases WHERE id = ? AND is_deleted = 0',
      [id]
    );
    return result ?? null;
  }

  /**
   * 案件を作成
   */
  async create(input: CreateCaseInput): Promise<Case> {
    const db = databaseService.getDatabase();

    const now = new Date().toISOString();
    const status = input.status ?? 'active';

    const result = await db.runAsync(
      `INSERT INTO cases (title, client_name, location, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        input.title,
        input.client_name ?? null,
        input.location ?? null,
        input.description ?? null,
        status,
        now,
        now,
      ]
    );

    const insertedId = result.lastInsertRowId;

    const created = await this.findById(insertedId);
    if (!created) {
      throw new Error('Failed to retrieve created case');
    }

    if (__DEV__) {
      console.log(`[CaseDAO] Created case #${insertedId}: ${input.title}`);
    }
    return created;
  }

  /**
   * 案件を更新
   */
  async update(id: number, input: UpdateCaseInput): Promise<Case> {
    const db = databaseService.getDatabase();

    // 既存の案件を確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Case #${id} not found`);
    }

    const now = new Date().toISOString();

    // 更新するフィールドを動的に構築
    const updates: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }
    if (input.client_name !== undefined) {
      updates.push('client_name = ?');
      params.push(input.client_name);
    }
    if (input.location !== undefined) {
      updates.push('location = ?');
      params.push(input.location);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }

    // updated_atは常に更新
    updates.push('updated_at = ?');
    params.push(now);

    // WHERE句のパラメータ
    params.push(id);

    const query = `UPDATE cases SET ${updates.join(', ')} WHERE id = ? AND is_deleted = 0`;

    await db.runAsync(query, params);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated case');
    }

    if (__DEV__) {
      console.log(`[CaseDAO] Updated case #${id}`);
    }
    return updated;
  }

  /**
   * 案件を論理削除
   */
  async delete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    // 既存の案件を確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Case #${id} not found`);
    }

    await db.runAsync('UPDATE cases SET is_deleted = 1 WHERE id = ?', [id]);

    if (__DEV__) {
      console.log(`[CaseDAO] Deleted case #${id}`);
    }
  }

  /**
   * 案件を物理削除（テスト用）
   */
  async hardDelete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('DELETE FROM cases WHERE id = ?', [id]);

    if (__DEV__) {
      console.log(`[CaseDAO] Hard deleted case #${id}`);
    }
  }

  /**
   * タイトルで検索
   */
  async searchByTitle(query: string): Promise<Case[]> {
    const db = databaseService.getDatabase();

    return await db.getAllAsync<Case>(
      'SELECT * FROM cases WHERE title LIKE ? AND is_deleted = 0 ORDER BY created_at DESC',
      [`%${query}%`]
    );
  }

  /**
   * 案件のステータスを変更
   */
  async updateStatus(id: number, status: CaseStatus): Promise<Case> {
    return await this.update(id, { status });
  }

  /**
   * 案件の件数を取得
   */
  async count(): Promise<number> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM cases WHERE is_deleted = 0'
    );

    return result?.count ?? 0;
  }

  /**
   * ステータス別の件数を取得
   */
  async countByStatus(status: CaseStatus): Promise<number> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM cases WHERE status = ? AND is_deleted = 0',
      [status]
    );

    return result?.count ?? 0;
  }

  /**
   * 全てのデータを削除（テスト用）
   */
  async truncate(): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM cases');
    if (__DEV__) {
      console.log('[CaseDAO] Truncated cases table');
    }
  }
}

/**
 * シングルトンインスタンス
 */
export const caseDAO = new CaseDAO();
