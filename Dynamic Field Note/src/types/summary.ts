/**
 * 要約データの型定義
 * Phase 1: PoC で使用
 */

/**
 * Gemini APIから返される要約データのJSON構造
 */
export interface SummaryJSON {
  /** 決定事項のリスト */
  decisions: string[];
  /** ToDoのリスト */
  todos: string[];
  /** 課題・問題点のリスト */
  issues: string[];
  /** 元のテキスト（参照用） */
  raw_text: string;
  /** 要約作成日時 */
  created_at?: string;
}

/**
 * GPT-5で整形された最終要約データ（Phase 5で使用）
 */
export interface FinalSummary extends SummaryJSON {
  /** 章立て構成 */
  sections: SummarySection[];
  /** 優先順位付き決定事項 */
  prioritized_decisions: PrioritizedItem[];
  /** 期限付きToDo */
  scheduled_todos: ScheduledTodo[];
}

/**
 * 要約のセクション
 */
export interface SummarySection {
  /** セクションタイトル */
  title: string;
  /** セクション内容 */
  content: string;
  /** セクション順序 */
  order: number;
}

/**
 * 優先順位付きアイテム
 */
export interface PrioritizedItem {
  /** アイテム内容 */
  content: string;
  /** 優先度 (1=高, 2=中, 3=低) */
  priority: 1 | 2 | 3;
}

/**
 * 期限付きToDo
 */
export interface ScheduledTodo {
  /** ToDo内容 */
  content: string;
  /** 推定期限（ISO 8601形式） */
  estimated_deadline?: string;
  /** 担当者（オプション） */
  assignee?: string;
}

/**
 * API エラーレスポンス
 */
export interface APIError {
  /** エラーメッセージ */
  message: string;
  /** エラーコード */
  code: string;
  /** 詳細情報 */
  details?: string;
}

/**
 * 要約リクエスト
 */
export interface SummarizeRequest {
  /** 要約対象のテキスト */
  text: string;
  /** 案件ID（オプション） */
  case_id?: string;
  /** 言語設定 */
  language?: 'ja' | 'en';
}

/**
 * 要約レスポンス
 */
export interface SummarizeResponse {
  /** 要約データ */
  summary: SummaryJSON;
  /** 処理時間（ミリ秒） */
  processing_time: number;
  /** 使用モデル */
  model: 'gemini-2.5-pro' | 'gpt-5';
}
