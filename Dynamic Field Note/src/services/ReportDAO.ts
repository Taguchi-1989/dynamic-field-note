/**
 * ReportDAO
 * 報告書データアクセスオブジェクト
 *
 * 責務:
 * - 報告書のCRUD操作
 * - 案件別の報告書取得
 * - データマッピング
 */

import { databaseService } from './DatabaseService';
import type { Report, CreateReportInput, UpdateReportInput } from '../types/case';

/**
 * ReportDAOクラス
 */
class ReportDAO {
  /**
   * 報告書を作成
   */
  async create(input: CreateReportInput): Promise<Report> {
    const db = databaseService.getDatabase();

    const result = await db.runAsync(
      `
      INSERT INTO reports (case_id, title, content, voice_buffer, summary_json, processing_time)
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        input.case_id,
        input.title,
        input.content ?? null,
        input.voice_buffer ?? null,
        input.summary_json ?? null,
        input.processing_time ?? null,
      ]
    );

    const insertedId = result.lastInsertRowId;

    // 作成した報告書を取得
    const createdReport = await this.findById(insertedId);

    if (!createdReport) {
      throw new Error('Failed to create report');
    }

    return createdReport;
  }

  /**
   * IDで報告書を取得
   */
  async findById(id: number): Promise<Report | null> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<Report>(
      `
      SELECT * FROM reports
      WHERE id = ? AND is_deleted = 0
      `,
      [id]
    );

    return result ?? null;
  }

  /**
   * 案件IDで報告書一覧を取得
   */
  async findByCaseId(caseId: number, options?: { limit?: number }): Promise<Report[]> {
    const db = databaseService.getDatabase();

    let query = `
      SELECT * FROM reports
      WHERE case_id = ? AND is_deleted = 0
      ORDER BY created_at DESC
    `;

    const params: number[] = [caseId];

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const results = await db.getAllAsync<Report>(query, params);

    return results;
  }

  /**
   * 全報告書を取得
   */
  async findAll(options?: { limit?: number }): Promise<Report[]> {
    const db = databaseService.getDatabase();

    let query = 'SELECT * FROM reports WHERE is_deleted = 0 ORDER BY created_at DESC';
    const params: number[] = [];

    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const results = await db.getAllAsync<Report>(query, params);

    return results;
  }

  /**
   * 報告書を更新
   */
  async update(id: number, input: UpdateReportInput): Promise<Report> {
    const db = databaseService.getDatabase();

    // 更新フィールドを動的に構築
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }

    if (input.content !== undefined) {
      updates.push('content = ?');
      params.push(input.content ?? null);
    }

    if (input.voice_buffer !== undefined) {
      updates.push('voice_buffer = ?');
      params.push(input.voice_buffer ?? null);
    }

    if (input.summary_json !== undefined) {
      updates.push('summary_json = ?');
      params.push(input.summary_json ?? null);
    }

    if (input.processing_time !== undefined) {
      updates.push('processing_time = ?');
      params.push(input.processing_time ?? null);
    }

    // updated_atを常に更新
    updates.push("updated_at = datetime('now', 'localtime')");

    if (updates.length === 1) {
      // updated_atのみの場合は何も更新しない
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`Report not found: ${id}`);
      }
      return existing;
    }

    // IDをパラメータに追加
    params.push(id);

    await db.runAsync(
      `
      UPDATE reports
      SET ${updates.join(', ')}
      WHERE id = ? AND is_deleted = 0
      `,
      params
    );

    const updatedReport = await this.findById(id);

    if (!updatedReport) {
      throw new Error(`Failed to update report: ${id}`);
    }

    return updatedReport;
  }

  /**
   * 報告書を削除（論理削除）
   */
  async delete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync(
      `
      UPDATE reports
      SET is_deleted = 1, updated_at = datetime('now', 'localtime')
      WHERE id = ?
      `,
      [id]
    );
  }

  /**
   * 報告書を完全削除（物理削除）
   * 注意: テスト用途のみ
   */
  async hardDelete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('DELETE FROM reports WHERE id = ?', [id]);
  }

  /**
   * 案件の報告書数を取得
   */
  async countByCaseId(caseId: number): Promise<number> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(*) as count
      FROM reports
      WHERE case_id = ? AND is_deleted = 0
      `,
      [caseId]
    );

    return result?.count ?? 0;
  }

  /**
   * 全報告書を削除（テスト用）
   */
  async deleteAll(): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('DELETE FROM reports');
  }
}

/**
 * シングルトンインスタンス
 */
export const reportDAO = new ReportDAO();
