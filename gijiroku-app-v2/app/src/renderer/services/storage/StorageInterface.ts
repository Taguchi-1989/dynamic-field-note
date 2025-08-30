/**
 * ストレージサービス共通インターフェース
 * ローカルとウェブの両方のストレージ実装が準拠する
 */

// ================== 基本型定義 ==================

export type StorageMode = 'local' | 'web';

export interface StorageMetadata {
  mode: StorageMode;
  lastSync?: Date;
  version: string;
  capabilities: string[];
  isOnline: boolean;
  dataSize?: number;
}

export interface SearchCriteria {
  field?: string;
  value?: any;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SyncStatus {
  isSyncing: boolean;
  progress?: number;
  message?: string;
  lastSyncTime?: Date;
  pendingChanges?: number;
}

export interface StorageConfig {
  mode: StorageMode;
  autoSync?: boolean;
  syncInterval?: number;
  conflictResolution?: 'local' | 'remote' | 'newest' | 'manual';
  encryption?: boolean;
  compression?: boolean;
  maxSize?: string;
}

// ================== データモデル ==================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  version?: number;
  syncStatus?: 'synced' | 'pending' | 'conflict';
}

export interface Dictionary extends BaseEntity {
  original: string;
  corrected: string;
  category?: string;
  priority: number;
  isActive: boolean;
  userId?: string;
}

export interface PromptTemplate extends BaseEntity {
  name: string;
  description: string;
  template: string;
  isDefault: boolean;
  tags: string[];
  userId?: string;
}

export interface MeetingRecord extends BaseEntity {
  title: string;
  originalText: string;
  correctedText: string;
  meetingDate?: string;
  participants?: string[];
  userId?: string;
}

export interface UserSettings extends BaseEntity {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  autoSave: boolean;
  useCustomDictionary: boolean;
  defaultModel: string;
}

// ================== ストレージインターフェース ==================

export interface IStorageService {
  // 初期化
  initialize(config?: StorageConfig): Promise<void>;
  
  // 基本操作
  get<T>(collection: string, id: string): Promise<T | null>;
  set<T>(collection: string, id: string, value: T): Promise<void>;
  update<T>(collection: string, id: string, updates: Partial<T>): Promise<void>;
  delete(collection: string, id: string): Promise<void>;
  
  // コレクション操作
  getAll<T>(collection: string): Promise<T[]>;
  clear(collection: string): Promise<void>;
  clearAll(): Promise<void>;
  
  // バッチ操作
  getMany<T>(collection: string, ids: string[]): Promise<T[]>;
  setMany<T>(collection: string, items: Map<string, T>): Promise<void>;
  deleteMany(collection: string, ids: string[]): Promise<void>;
  
  // 検索・フィルタ
  search<T>(collection: string, criteria: SearchCriteria): Promise<T[]>;
  filter<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]>;
  count(collection: string, criteria?: SearchCriteria): Promise<number>;
  
  // メタデータ
  getMetadata(): Promise<StorageMetadata>;
  getSize(collection?: string): Promise<number>;
  getCapabilities(): string[];
  
  // イベント
  on(event: StorageEvent, handler: StorageEventHandler): void;
  off(event: StorageEvent, handler: StorageEventHandler): void;
  
  // 同期（オプション）
  sync?(): Promise<SyncStatus>;
  getSyncStatus?(): SyncStatus;
  resolveConflict?<T>(collection: string, id: string, resolution: T): Promise<void>;
}

// ================== イベント定義 ==================

export type StorageEvent = 
  | 'change'
  | 'sync:start'
  | 'sync:complete'
  | 'sync:error'
  | 'conflict'
  | 'storage:full'
  | 'connection:change';

export interface StorageEventData {
  event: StorageEvent;
  collection?: string;
  id?: string;
  data?: Record<string, unknown> | null;
  error?: Error;
  timestamp: Date;
}

export type StorageEventHandler = (data: StorageEventData) => void;

// ================== エラー定義 ==================

export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown> | string | null
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class StorageQuotaError extends StorageError {
  constructor(message: string, details?: Record<string, unknown> | string | null) {
    super(message, 'QUOTA_EXCEEDED', details);
    this.name = 'StorageQuotaError';
  }
}

export class StorageConnectionError extends StorageError {
  constructor(message: string, details?: Record<string, unknown> | string | null) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'StorageConnectionError';
  }
}

export class StorageSyncError extends StorageError {
  constructor(message: string, details?: Record<string, unknown> | string | null) {
    super(message, 'SYNC_ERROR', details);
    this.name = 'StorageSyncError';
  }
}

// ================== ユーティリティ型 ==================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type StorageResult<T> = {
  success: boolean;
  data?: T;
  error?: StorageError;
};

export type BatchOperation<T> = {
  operation: 'create' | 'update' | 'delete';
  collection: string;
  id: string;
  data?: T;
};

// ================== コレクション名定義 ==================

export const COLLECTIONS = {
  DICTIONARY: 'dictionary',
  PROMPTS: 'prompts',
  MEETINGS: 'meetings',
  SETTINGS: 'settings',
  CACHE: 'cache',
} as const;

export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];