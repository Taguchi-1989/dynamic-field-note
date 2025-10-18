/**
 * CaseDAO - 案件データアクセスオブジェクト
 * SQLiteデータベースへの案件CRUD操作を提供
 *
 * 責務:
 * - 案件の作成・読取・更新・削除（論理削除）
 * - データベーストランザクションの管理
 * - エラーハンドリング
 */

import type { DatabaseService } from './DatabaseService';
import type { Case, CreateCaseInput, UpdateCaseInput } from '../types/case';

export class CaseDAO {
  constructor(private databaseService: DatabaseService) {}

  /**
   * 案件を作成
   */
  async create(input: CreateCaseInput): Promise<Case> {
    // バリデーション
    if (!input.title || input.title.trim() === '') {
      throw new Error('Title is required');
    }

    const sql = `
      INSERT INTO cases (
        title,
        client_name,
        location,
        description,
        status
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      input.title,
      input.client_name ?? null,
      input.location ?? null,
      input.description ?? null,
      input.status ?? 'active',
    ];

    await this.databaseService.execute(sql, params);

    // 作成されたレコードを取得
    const created = await this.databaseService.executeOne<Case>(
      'SELECT * FROM cases WHERE id = last_insert_rowid()'
    );

    if (!created) {
      throw new Error('Failed to create case');
    }

    return created;
  }

  /**
   * IDで案件を取得
   */
  async findById(id: number): Promise<Case | null> {
    const sql = `
      SELECT * FROM cases
      WHERE id = ? AND is_deleted = 0
    `;

    const result = await this.databaseService.executeOne<Case>(sql, [id]);
    return result;
  }

  /**
   * 全案件を取得（作成日時降順）
   */
  async findAll(): Promise<Case[]> {
    const sql = `
      SELECT * FROM cases
      WHERE is_deleted = 0
      ORDER BY created_at DESC
    `;

    const results = await this.databaseService.executeRaw<Case>(sql);
    return results;
  }

  /**
   * 案件を更新
   */
  async update(id: number, input: UpdateCaseInput): Promise<void> {
    // 案件が存在するか確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Case not found');
    }

    // 更新するフィールドのみをSQLに含める
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

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

    // updated_at は常に更新
    updates.push("updated_at = datetime('now', 'localtime')");

    // 更新するフィールドがない場合は何もしない
    if (params.length === 0) {
      return;
    }

    params.push(id); // WHERE句のID

    const sql = `
      UPDATE cases
      SET ${updates.join(', ')}
      WHERE id = ? AND is_deleted = 0
    `;

    await this.databaseService.execute(sql, params);
  }

  /**
   * 案件を論理削除
   */
  async delete(id: number): Promise<void> {
    // 案件が存在するか確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Case not found');
    }

    const sql = `
      UPDATE cases
      SET is_deleted = 1,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `;

    await this.databaseService.execute(sql, [id]);
  }
}
