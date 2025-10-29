/**
 * PhotoDAO
 * 写真データアクセスオブジェクト
 *
 * 責務:
 * - 写真のCRUD操作
 * - 案件・報告書に紐づく写真の取得
 * - 論理削除の管理
 */

import { databaseService } from '../services/DatabaseService';
import type { Photo, CreatePhotoInput, UpdatePhotoInput } from '../types/case';
import type { SQLiteBindValue } from 'expo-sqlite';

/**
 * 写真DAOクラス
 */
class PhotoDAO {
  /**
   * 全ての有効な写真を取得
   */
  async findAll(): Promise<Photo[]> {
    const db = databaseService.getDatabase();
    return await db.getAllAsync<Photo>(
      'SELECT * FROM photos WHERE is_deleted = 0 ORDER BY created_at DESC'
    );
  }

  /**
   * 案件IDで写真を取得
   */
  async findByCaseId(caseId: number): Promise<Photo[]> {
    const db = databaseService.getDatabase();
    return await db.getAllAsync<Photo>(
      'SELECT * FROM photos WHERE case_id = ? AND is_deleted = 0 ORDER BY created_at DESC',
      [caseId]
    );
  }

  /**
   * 報告書IDで写真を取得
   */
  async findByReportId(reportId: number): Promise<Photo[]> {
    const db = databaseService.getDatabase();
    return await db.getAllAsync<Photo>(
      'SELECT * FROM photos WHERE report_id = ? AND is_deleted = 0 ORDER BY created_at DESC',
      [reportId]
    );
  }

  /**
   * IDで写真を取得
   */
  async findById(id: number): Promise<Photo | null> {
    const db = databaseService.getDatabase();
    const result = await db.getFirstAsync<Photo>(
      'SELECT * FROM photos WHERE id = ? AND is_deleted = 0',
      [id]
    );
    return result ?? null;
  }

  /**
   * 写真を作成
   */
  async create(input: CreatePhotoInput): Promise<Photo> {
    const db = databaseService.getDatabase();

    const now = new Date().toISOString();

    const result = await db.runAsync(
      `INSERT INTO photos (case_id, report_id, file_path, thumbnail_path, caption, exif_data, annotation_data, width, height, file_size, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.case_id,
        input.report_id ?? null,
        input.file_path,
        input.thumbnail_path ?? null,
        input.caption ?? null,
        input.exif_data ?? null,
        input.annotation_data ?? null,
        input.width ?? null,
        input.height ?? null,
        input.file_size ?? null,
        now,
      ]
    );

    const insertedId = result.lastInsertRowId;

    const created = await this.findById(insertedId);
    if (!created) {
      throw new Error('Failed to retrieve created photo');
    }

    if (__DEV__) {
      console.log(`[PhotoDAO] Created photo #${insertedId}: ${input.file_path}`);
    }
    return created;
  }

  /**
   * 写真を更新（キャプション・注釈のみ）
   */
  async update(id: number, input: UpdatePhotoInput): Promise<Photo> {
    const db = databaseService.getDatabase();

    // 既存の写真を確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Photo #${id} not found`);
    }

    // 更新するフィールドを動的に構築
    const updates: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (input.caption !== undefined) {
      updates.push('caption = ?');
      params.push(input.caption);
    }
    if (input.annotation_data !== undefined) {
      updates.push('annotation_data = ?');
      params.push(input.annotation_data);
    }

    if (updates.length === 0) {
      // 更新なし
      return existing;
    }

    // WHERE句のパラメータ
    params.push(id);

    const query = `UPDATE photos SET ${updates.join(', ')} WHERE id = ? AND is_deleted = 0`;

    await db.runAsync(query, params);

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error('Failed to retrieve updated photo');
    }

    if (__DEV__) {
      console.log(`[PhotoDAO] Updated photo #${id}`);
    }
    return updated;
  }

  /**
   * 写真を論理削除
   */
  async delete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    // 既存の写真を確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Photo #${id} not found`);
    }

    await db.runAsync('UPDATE photos SET is_deleted = 1 WHERE id = ?', [id]);

    if (__DEV__) {
      console.log(`[PhotoDAO] Deleted photo #${id}`);
    }
  }

  /**
   * 写真を物理削除（テスト用）
   */
  async hardDelete(id: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('DELETE FROM photos WHERE id = ?', [id]);

    if (__DEV__) {
      console.log(`[PhotoDAO] Hard deleted photo #${id}`);
    }
  }

  /**
   * 案件の写真件数を取得
   */
  async countByCaseId(caseId: number): Promise<number> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM photos WHERE case_id = ? AND is_deleted = 0',
      [caseId]
    );

    return result?.count ?? 0;
  }

  /**
   * 報告書の写真件数を取得
   */
  async countByReportId(reportId: number): Promise<number> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM photos WHERE report_id = ? AND is_deleted = 0',
      [reportId]
    );

    return result?.count ?? 0;
  }

  /**
   * 写真の件数を取得
   */
  async count(): Promise<number> {
    const db = databaseService.getDatabase();

    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM photos WHERE is_deleted = 0'
    );

    return result?.count ?? 0;
  }

  /**
   * 案件に紐づく全ての写真を削除
   */
  async deleteByCaseId(caseId: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('UPDATE photos SET is_deleted = 1 WHERE case_id = ?', [caseId]);

    if (__DEV__) {
      console.log(`[PhotoDAO] Deleted all photos for case #${caseId}`);
    }
  }

  /**
   * 報告書に紐づく全ての写真を削除
   */
  async deleteByReportId(reportId: number): Promise<void> {
    const db = databaseService.getDatabase();

    await db.runAsync('UPDATE photos SET is_deleted = 1 WHERE report_id = ?', [reportId]);

    if (__DEV__) {
      console.log(`[PhotoDAO] Deleted all photos for report #${reportId}`);
    }
  }

  /**
   * 全てのデータを削除（テスト用）
   */
  async truncate(): Promise<void> {
    const db = databaseService.getDatabase();
    await db.runAsync('DELETE FROM photos');
    if (__DEV__) {
      console.log('[PhotoDAO] Truncated photos table');
    }
  }
}

/**
 * シングルトンインスタンス
 */
export const photoDAO = new PhotoDAO();
