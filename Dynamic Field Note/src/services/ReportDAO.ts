/**
 * ReportDAO - 報告書データアクセスオブジェクト
 * SQLiteデータベースへの報告書CRUD操作を提供
 *
 * 責務:
 * - 報告書の作成・読取・更新・削除（論理削除）
 * - 案件との紐付け管理
 * - エラーハンドリング
 */

import type { DatabaseService } from './DatabaseService';
import type { Report, CreateReportInput, UpdateReportInput } from '../types/case';

export class ReportDAO {
  constructor(private databaseService: DatabaseService) {}

  /**
   * 報告書を作成
   */
  async create(input: CreateReportInput): Promise<Report> {
    // バリデーション
    if (!input.case_id) {
      throw new Error('Case ID is required');
    }

    if (!input.title || input.title.trim() === '') {
      throw new Error('Title is required');
    }

    // 案件が存在するか確認
    const caseExists = await this.databaseService.executeOne<{ id: number }>(
      'SELECT id FROM cases WHERE id = ? AND is_deleted = 0',
      [input.case_id]
    );

    if (!caseExists) {
      throw new Error('Case not found');
    }

    const sql = `
      INSERT INTO reports (
        case_id,
        title,
        content,
        voice_buffer,
        summary_json
      ) VALUES (?, ?, ?, ?, ?)
    `;

    const params = [
      input.case_id,
      input.title,
      input.content ?? null,
      input.voice_buffer ?? null,
      input.summary_json ?? null,
    ];

    await this.databaseService.execute(sql, params);

    // 作成されたレコードを取得
    const created = await this.databaseService.executeOne<Report>(
      'SELECT * FROM reports WHERE id = last_insert_rowid()'
    );

    if (!created) {
      throw new Error('Failed to create report');
    }

    return created;
  }

  /**
   * IDで報告書を取得
   */
  async findById(id: number): Promise<Report | null> {
    const sql = `
      SELECT * FROM reports
      WHERE id = ? AND is_deleted = 0
    `;

    const result = await this.databaseService.executeOne<Report>(sql, [id]);
    return result;
  }

  /**
   * 案件IDで報告書を取得（更新日時降順）
   */
  async findByCaseId(caseId: number): Promise<Report[]> {
    const sql = `
      SELECT * FROM reports
      WHERE case_id = ? AND is_deleted = 0
      ORDER BY updated_at DESC
    `;

    const results = await this.databaseService.executeRaw<Report>(sql, [caseId]);
    return results;
  }

  /**
   * 報告書を更新
   */
  async update(id: number, input: UpdateReportInput): Promise<void> {
    // 報告書が存在するか確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Report not found');
    }

    // 更新するフィールドのみをSQLに含める
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.title !== undefined) {
      updates.push('title = ?');
      params.push(input.title);
    }

    if (input.content !== undefined) {
      updates.push('content = ?');
      params.push(input.content);
    }

    if (input.voice_buffer !== undefined) {
      updates.push('voice_buffer = ?');
      params.push(input.voice_buffer);
    }

    if (input.summary_json !== undefined) {
      updates.push('summary_json = ?');
      params.push(input.summary_json);
    }

    if (input.processing_time !== undefined) {
      updates.push('processing_time = ?');
      params.push(input.processing_time);
    }

    // updated_at は常に更新
    updates.push("updated_at = datetime('now', 'localtime')");

    // 更新するフィールドがない場合は何もしない
    if (params.length === 0) {
      return;
    }

    params.push(id); // WHERE句のID

    const sql = `
      UPDATE reports
      SET ${updates.join(', ')}
      WHERE id = ? AND is_deleted = 0
    `;

    await this.databaseService.execute(sql, params);
  }

  /**
   * 報告書を論理削除
   */
  async delete(id: number): Promise<void> {
    // 報告書が存在するか確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Report not found');
    }

    const sql = `
      UPDATE reports
      SET is_deleted = 1,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `;

    await this.databaseService.execute(sql, [id]);
  }
}
