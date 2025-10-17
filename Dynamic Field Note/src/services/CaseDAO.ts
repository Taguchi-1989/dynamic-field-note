/**
 * CaseDAO
 * 案件データアクセスオブジェクト
 *
 * 責務:
 * - 案件のCRUD操作
 * - クエリ実行
 * - データマッピング
 */

import { databaseService } from './DatabaseService';
import type { Case, CreateCaseInput, UpdateCaseInput, CaseStatus } from '../types/case';

/**
 * CaseDAOクラス
 */
class CaseDAO {
  /**
   * 案件を作成
   */
  async create(input: CreateCaseInput): Promise<Case> {
    const db = databaseService.getDatabase();

    const result = await db.runAsync(
      `
      INSERT INTO cases (title, client_name, location, description, status)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        input.title,
        input.client_name ?? null,
        input.location ?? null,
        input.description ?? null,
        input.status ?? 'active',
      ]
    );

    const insertedId = result.lastInsertRowId;

    // 作成した案件を取得
    const createdCase = await this.findById(insertedId);

    if (!createdCase) {
      throw new Error('Failed to create case');
    }

    return createdCase;
  }

  /**
   * IDで案件を取得
   */
  async findById(id: number): Promise<Case | null> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<Case>(
      `
      SELECT * FROM cases
      WHERE id = ? AND is_deleted = 0
      `,
      [id]
    );

    return result ?? null;
  }

  /**
   * 全案件を取得
   */
  async findAll(options?: { status?: CaseStatus; limit?: number }): Promise<Case[]> {
    const db = databaseService.getDatabase();

    let query = 'SELECT * FROM cases WHERE is_deleted = 0';
    const params: (string | number)[] = [];

    // ステータスフィルタ
    if (options?.status) {
      query += ' AND status = ?';
      params.push(options.status);
    }

    // ソート
    query += ' ORDER BY created_at DESC';

    // リミット
    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const results = await db.getAllAsync<Case>(query, params);

    return results;
  }

  /**
   * 案件を更新
   */
  async update(id: number, input: UpdateCaseInput): Promise<Case> {
    const db = databaseService.getDatabase();

    // 更新フィールドを動的に構築
    const updates: string[] = [];
    const params: (string | number)[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }

    if (input.client_name !== undefined) {
      updates.push('client_name = ?');
      params.push(input.client_name ?? null);
    }

    if (input.location !== undefined) {
      updates.push('location = ?');
      params.push(input.location ?? null);
    }

    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description ?? null);
    }

    if (input.status !== undefined) {
      updates.push('status = ?');
      params.push(input.status);
    }

    // updated_atを常に更新
    updates.push("updated_at = datetime('now', 'localtime')");

    if (updates.length === 1) {
      // updated_atのみの場合は何も更新しない
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`Case not found: ${id}`);
      }
      return existing;
    }

    // IDをパラメータに追加
    params.push(id);

    await db.runAsync(
      `
      UPDATE cases
      SET ${updates.join(', ')}
      WHERE id = ? AND is_deleted = 0
      `,
      params
    );

    const updatedCase = await this.findById(id);

    if (!updatedCase) {
      throw new Error(`Failed to update case: ${id}`);
    }

    return updatedCase;
  }

  /**
   * 案件を削除（論理削除）
   */
  async delete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync(
      `
      UPDATE cases
      SET is_deleted = 1, updated_at = datetime('now', 'localtime')
      WHERE id = ?
      `,
      [id]
    );
  }

  /**
   * 案件を完全削除（物理削除）
   * 注意: テスト用途のみ
   */
  async hardDelete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('DELETE FROM cases WHERE id = ?', [id]);
  }

  /**
   * ステータス別の案件数を取得
   */
  async countByStatus(): Promise<Record<CaseStatus, number>> {
    const db = databaseService.getDatabase();

    const results = await db.getAllAsync<{ status: CaseStatus; count: number }>(
      `
      SELECT status, COUNT(*) as count
      FROM cases
      WHERE is_deleted = 0
      GROUP BY status
      `
    );

    const counts: Record<CaseStatus, number> = {
      active: 0,
      completed: 0,
      archived: 0,
    };

    for (const result of results) {
      counts[result.status] = result.count;
    }

    return counts;
  }

  /**
   * 全案件を削除（テスト用）
   */
  async deleteAll(): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('DELETE FROM cases');
  }
}

/**
 * シングルトンインスタンス
 */
export const caseDAO = new CaseDAO();
