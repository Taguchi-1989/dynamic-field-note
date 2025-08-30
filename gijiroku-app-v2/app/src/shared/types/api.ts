/**
 * API型定義
 * バックエンドのPydanticモデルと同期して管理
 */

// ============== 共通型 ==============

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown> | string | null;
  timestamp: string;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// ============== テキスト処理関連 ==============

export interface ProcessTextRequest {
  text: string;
  user_id: string | null;
  prompt_template: string;
  custom_prompt?: string;
  use_custom_dictionary: boolean;
}

export interface Correction {
  original: string;
  corrected: string;
  reason: string;
  step?: string;
  count?: number;
}

export interface ProcessTextResponse {
  original_text: string;
  corrected_text: string;
  corrections: Correction[];
}

export interface ReviseTextRequest {
  original_text: string;
  revision_notes: string;
}

export interface ReviseTextResponse {
  revised_text: string;
}

// ============== 辞書管理関連 ==============

export interface DictionaryEntryBase {
  original: string;
  corrected: string;
  category?: string;
  description?: string;
  is_active?: boolean;
}

export interface DictionaryEntryCreate extends DictionaryEntryBase {
  user_id?: string;
}

export type DictionaryEntryUpdate = Partial<DictionaryEntryBase>;

export interface DictionaryEntryResponse extends DictionaryEntryBase {
  id: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface DictionaryCountResponse {
  total: number;
}

// ============== ファイル処理関連 ==============

export interface VTTEntry {
  speaker: string;
  text: string;
  timestamp: string;
  start_time: string;
  end_time: string;
}

export interface VTTUploadResponse {
  filename: string;
  status: 'success' | 'error';
  data: {
    entries_count: number;
    text_only: string;
    formatted_text: string;
    speaker_texts: Record<string, string[]>;
    entries: VTTEntry[];
  };
  error?: string;
}

// ============== PDF生成関連 ==============

export interface GeneratePDFRequest {
  content: string;
  title: string;
}

// ============== API使用状況関連 ==============

export interface APIUsageResponse {
  ip_address: string;
  current_count: number;
  daily_limit: number;
  remaining: number;
  last_access: string | null;
  date: string;
}

export interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Current': string;
  'X-RateLimit-Reset'?: string;
  'Retry-After'?: string;
}

// ============== プロンプト・テンプレート関連 ==============

export interface PromptTemplate {
  name: string;
  description: string;
  prompt: string;
}

export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  user_id?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomTemplateCreate {
  name: string;
  description: string;
  prompt: string;
  user_id?: string;
  is_public: boolean;
}

// ============== ヘルスチェック ==============

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp?: string;
  version?: string;
}

// ============== 型ガード関数 ==============

export function isAPIError(obj: unknown): obj is APIError {
  return obj !== null && typeof obj === 'object' && 'code' in obj && 'message' in obj;
}

export function isAPIResponse<T>(obj: unknown): obj is APIResponse<T> {
  return obj !== null && typeof obj === 'object' && 'success' in obj && typeof (obj as Record<string, unknown>).success === 'boolean';
}

// ============== API エンドポイント型マッピング ==============

export interface APIEndpoints {
  // テキスト処理
  '/process-text': {
    method: 'POST';
    request: ProcessTextRequest;
    response: ProcessTextResponse;
  };
  '/revise-text': {
    method: 'POST';
    request: ReviseTextRequest;
    response: ReviseTextResponse;
  };
  
  // ファイル処理
  '/upload-vtt': {
    method: 'POST';
    request: FormData;
    response: VTTUploadResponse;
  };
  
  // 辞書管理
  '/dictionary': {
    method: 'GET' | 'POST';
    request: DictionaryEntryCreate;
    response: DictionaryEntryResponse[] | DictionaryEntryResponse;
  };
  '/dictionary/{id}': {
    method: 'GET' | 'PUT' | 'DELETE';
    request: DictionaryEntryUpdate;
    response: DictionaryEntryResponse | { id: string; status: string };
  };
  '/dictionary/count': {
    method: 'GET';
    response: DictionaryCountResponse;
  };
  
  // PDF生成
  '/generate-pdf': {
    method: 'POST';
    request: GeneratePDFRequest;
    response: Blob;
  };
  
  // API使用状況
  '/api-usage': {
    method: 'GET';
    response: APIUsageResponse;
  };
  
  // ヘルスチェック
  '/health': {
    method: 'GET';
    response: HealthCheckResponse;
  };
}

// ============== 型安全なAPIクライアント用ヘルパー ==============

export type APIMethod<T extends keyof APIEndpoints> = APIEndpoints[T]['method'];
export type APIRequest<T extends keyof APIEndpoints> = APIEndpoints[T] extends { request: infer R } ? R : never;
export type APIResponseType<T extends keyof APIEndpoints> = APIEndpoints[T]['response'];
