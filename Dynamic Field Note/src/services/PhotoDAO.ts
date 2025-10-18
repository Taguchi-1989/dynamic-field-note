/**
 * PhotoDAO - 写真データアクセスオブジェクト
 * SQLiteデータベースへの写真CRUD操作を提供
 *
 * 責務:
 * - 写真の作成・読取・更新・削除（論理削除）
 * - 案件別・報告書別の写真検索
 * - データベーストランザクションの管理
 * - エラーハンドリング
 */

import type { DatabaseService } from './DatabaseService';
import type { Photo, CreatePhotoInput, UpdatePhotoInput } from '../types/case';

export class PhotoDAO {
  constructor(private databaseService: DatabaseService) {}

  /**
   * 写真を作成
   */
  async create(input: CreatePhotoInput): Promise<Photo> {
    // バリデーション
    if (!input.case_id) {
      throw new Error('Case ID is required');
    }

    if (!input.file_path || input.file_path.trim() === '') {
      throw new Error('File path is required');
    }

    const sql = `
      INSERT INTO photos (
        case_id,
        report_id,
        file_path,
        thumbnail_path,
        caption,
        exif_data,
        annotation_data,
        width,
        height,
        file_size
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
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
    ];

    await this.databaseService.execute(sql, params);

    // 作成されたレコードを取得
    const created = await this.databaseService.executeOne<Photo>(
      'SELECT * FROM photos WHERE id = last_insert_rowid()'
    );

    if (!created) {
      throw new Error('Failed to create photo');
    }

    return created;
  }

  /**
   * IDで写真を取得
   */
  async findById(id: number): Promise<Photo | null> {
    const sql = `
      SELECT * FROM photos
      WHERE id = ? AND is_deleted = 0
    `;

    const result = await this.databaseService.executeOne<Photo>(sql, [id]);
    return result;
  }

  /**
   * 案件に紐付く全写真を取得
   */
  async findByCaseId(caseId: number): Promise<Photo[]> {
    const sql = `
      SELECT * FROM photos
      WHERE case_id = ? AND is_deleted = 0
      ORDER BY created_at ASC
    `;

    const results = await this.databaseService.executeRaw<Photo>(sql, [caseId]);
    return results;
  }

  /**
   * 報告書に紐付く全写真を取得
   */
  async findByReportId(reportId: number): Promise<Photo[]> {
    const sql = `
      SELECT * FROM photos
      WHERE report_id = ? AND is_deleted = 0
      ORDER BY created_at ASC
    `;

    const results = await this.databaseService.executeRaw<Photo>(sql, [reportId]);
    return results;
  }

  /**
   * 写真を更新
   */
  async update(id: number, input: UpdatePhotoInput): Promise<void> {
    // 写真が存在するか確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Photo not found');
    }

    // 更新するフィールドのみをSQLに含める
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (input.report_id !== undefined) {
      updates.push('report_id = ?');
      params.push(input.report_id);
    }

    if (input.caption !== undefined) {
      updates.push('caption = ?');
      params.push(input.caption);
    }

    if (input.annotation_data !== undefined) {
      updates.push('annotation_data = ?');
      params.push(input.annotation_data);
    }

    // updated_at は常に更新
    updates.push("updated_at = datetime('now', 'localtime')");

    // 更新するフィールドがない場合は何もしない
    if (params.length === 0) {
      return;
    }

    params.push(id); // WHERE句のID

    const sql = `
      UPDATE photos
      SET ${updates.join(', ')}
      WHERE id = ? AND is_deleted = 0
    `;

    await this.databaseService.execute(sql, params);
  }

  /**
   * 写真を論理削除
   */
  async delete(id: number): Promise<void> {
    // 写真が存在するか確認
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error('Photo not found');
    }

    const sql = `
      UPDATE photos
      SET is_deleted = 1,
          updated_at = datetime('now', 'localtime')
      WHERE id = ?
    `;

    await this.databaseService.execute(sql, [id]);
  }
}
