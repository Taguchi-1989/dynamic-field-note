/**
 * Case型定義
 * 案件（プロジェクト）に関する型
 */

/**
 * 案件ステータス
 */
export type CaseStatus = 'active' | 'completed' | 'archived';

/**
 * 案件エンティティ
 */
export interface Case {
  id: number;
  title: string;
  client_name: string | null;
  location: string | null;
  description: string | null;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_deleted: number; // 0 or 1
}

/**
 * 案件作成用データ
 */
export interface CreateCaseInput {
  title: string;
  client_name?: string;
  location?: string;
  description?: string;
  status?: CaseStatus;
}

/**
 * 案件更新用データ
 */
export interface UpdateCaseInput {
  title?: string;
  client_name?: string;
  location?: string;
  description?: string;
  status?: CaseStatus;
}

/**
 * 報告書エンティティ
 */
export interface Report {
  id: number;
  case_id: number;
  title: string;
  content: string | null;
  voice_buffer: string | null;
  summary_json: string | null;
  processing_time: number | null;
  created_at: string;
  updated_at: string;
  is_deleted: number; // 0 or 1
}

/**
 * 報告書作成用データ
 */
export interface CreateReportInput {
  case_id: number;
  title: string;
  content?: string;
  voice_buffer?: string;
  summary_json?: string;
  processing_time?: number;
}

/**
 * 報告書更新用データ
 */
export interface UpdateReportInput {
  title?: string;
  content?: string;
  voice_buffer?: string;
  summary_json?: string;
  processing_time?: number;
}

/**
 * 写真エンティティ
 */
export interface Photo {
  id: number;
  case_id: number;
  report_id: number | null;
  file_path: string;
  thumbnail_path: string | null;
  caption: string | null;
  exif_data: string | null; // JSON
  annotation_data: string | null; // JSON
  width: number | null;
  height: number | null;
  file_size: number | null;
  created_at: string;
  is_deleted: number; // 0 or 1
}

/**
 * 写真作成用データ
 */
export interface CreatePhotoInput {
  case_id: number;
  report_id?: number;
  file_path: string;
  thumbnail_path?: string;
  caption?: string;
  exif_data?: string;
  annotation_data?: string;
  width?: number;
  height?: number;
  file_size?: number;
}

/**
 * 写真更新用データ
 */
export interface UpdatePhotoInput {
  report_id?: number;
  caption?: string;
  annotation_data?: string;
}
