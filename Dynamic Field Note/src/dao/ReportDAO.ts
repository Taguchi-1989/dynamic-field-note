/**
 * ReportDAO
 * 報告書データアクセスオブジェクト
 *
 * 責務:
 * - 報告書のCRUD操作
 * - 案件に紐づく報告書の取得
 * - 論理削除の管理
 */

import { databaseService } from '../services/DatabaseService';
import type { Report, CreateReportInput, UpdateReportInput } from '../types/case';
import type { SQLiteBindValue } from 'expo-sqlite';

/**
 * 報告書DAOクラス
 */
class ReportDAO {
  /**
   * 全ての有効な報告書を取得
   */
  async findAll(): Promise<Report[]> {
    const db = databaseService.getDatabase();
    return await db.getAllAsync<Report>(
      'SELECT * FROM reports WHERE is_deleted = 0 ORDER BY created_at DESC'
    );
  }

  /**
   * 案件IDで報告書を取得
   */
  async findByCaseId(caseId: number): Promise<Report[]> {
    const db = databaseService.getDatabase();
    return await db.getAllAsync<Report>(
      'SELECT * FROM reports WHERE case_id = ? AND is_deleted = 0 ORDER BY created_at DESC',
      [caseId]
    );
  }

  /**
   * IDで報告書を取得
   */
  async findById(id: number): Promise<Report | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync<Report>(
      'SELECT * FROM reports WHERE id = ? AND is_deleted = 0',
      [id]
    );
    return result ?? null;
  }

  /**
   * 報告書を作成
   */
  async create(input: CreateReportInput): Promise<Report> {
    const db = databaseService.getDatabase();

    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO reports (case_id, title, content, voice_buffer, summary_json, processing_time, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.case_id,
        input.title,
        input.content ?? null,
        input.voice_buffer ?? null,
        input.summary_json ?? null,
        input.processing_time ?? null,
        now,
        now,
      ]
    );

    const insertedId = result.lastInsertRowId;

    const created = await this.findById(insertedId);
    if (!created) {
      throw new Error('Failed to retrieve created report');
    }

    console.log(`[ReportDAO] Created report #${insertedId}: ${input.title}`);
    return created;
  }

  /**
   * 報告書を更新
   */
  async update(id: number, input: UpdateReportInput): Promise<Report> {
    const db = databaseService.getDatabase();

    // 既存の報告書を確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Report #${id} not found`);
    }

    const now = new Date().toISOString();

    // 更新するフィールドを動的に構築
    const updates: string[] = [];
    const params: SQLiteBindValue[] = [];

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

    // updated_atは常に更新
    updates.push('updated_at = ?');
    params.push(now);

    // WHERE句のパラメータ
    params.push(id);

    const query = `UPDATE reports SET ${updates.join(', ')} WHERE id = ? AND is_deleted = 0`;

    await db.runAsync(query, params);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated report');
    }

    console.log(`[ReportDAO] Updated report #${id}`);
    return updated;
  }

  /**
   * 報告書を論理削除
   */
  async delete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    // 既存の報告書を確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Report #${id} not found`);
    }

    await db.runAsync('UPDATE reports SET is_deleted = 1 WHERE id = ?', [id]);

    console.log(`[ReportDAO] Deleted report #${id}`);
  }

  /**
   * 報告書を物理削除（テスト用）
   */
  async hardDelete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('DELETE FROM reports WHERE id = ?', [id]);

    console.log(`[ReportDAO] Hard deleted report #${id}`);
  }

  /**
   * タイトルで検索
   */
  async searchByTitle(query: string): Promise<Report[]> {
    const db = databaseService.getDatabase();

    return await db.getAllAsync<Report>(
      'SELECT * FROM reports WHERE title LIKE ? AND is_deleted = 0 ORDER BY created_at DESC',
      [`%${query}%`]
    );
  }

  /**
   * 内容で検索
   */
  async searchByContent(query: string): Promise<Report[]> {
    const db = databaseService.getDatabase();

    return await db.getAllAsync<Report>(
      'SELECT * FROM reports WHERE content LIKE ? AND is_deleted = 0 ORDER BY created_at DESC',
      [`%${query}%`]
    );
  }

  /**
   * 案件の報告書件数を取得
   */
  async countByCaseId(caseId: number): Promise<number> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM reports WHERE case_id = ? AND is_deleted = 0',
      [caseId]
    );

    return result?.count ?? 0;
  }

  /**
   * 報告書の件数を取得
   */
  async count(): Promise<number> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM reports WHERE is_deleted = 0'
    );

    return result?.count ?? 0;
  }

  /**
   * 案件に紐づく全ての報告書を削除
   */
  async deleteByCaseId(caseId: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('UPDATE reports SET is_deleted = 1 WHERE case_id = ?', [caseId]);

    console.log(`[ReportDAO] Deleted all reports for case #${caseId}`);
  }

  /**
   * 全てのデータを削除（テスト用）
   */
  async truncate(): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM reports');
    console.log('[ReportDAO] Truncated reports table');
  }
}

/**
 * シングルトンインスタンス
 */
export const reportDAO = new ReportDAO();
