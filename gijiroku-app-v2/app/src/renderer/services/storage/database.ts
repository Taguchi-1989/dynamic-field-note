import Dexie, { type EntityTable } from 'dexie';

export interface DocumentRecord {
  id?: number;
  remoteId?: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
  conflictStatus: 'none' | 'newest_wins' | 'manual_required';
  version: number;
  checksum: string;
}

export interface SyncMetadata {
  id?: number;
  documentId: number;
  localVersion: number;
  remoteVersion: number;
  lastSyncAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  conflictData?: string; // JSON string of conflict details
}

export interface ConflictRecord {
  id?: number;
  documentId: number;
  localContent: string;
  remoteContent: string;
  localUpdatedAt: Date;
  remoteUpdatedAt: Date;
  resolutionStrategy: 'newest_wins' | 'manual';
  resolvedAt?: Date;
  resolvedBy: 'system' | 'user';
}

const db = new Dexie('GijirokuLocalDB') as Dexie & {
  documents: EntityTable<DocumentRecord, 'id'>;
  syncMetadata: EntityTable<SyncMetadata, 'id'>;
  conflicts: EntityTable<ConflictRecord, 'id'>;
};

// データベーススキーマ定義
db.version(1).stores({
  documents: '++id, remoteId, title, updatedAt, lastSyncAt, conflictStatus',
  syncMetadata: '++id, documentId, syncStatus, lastSyncAt',
  conflicts: '++id, documentId, resolvedAt'
});

export { db };

// チェックサム計算用のユーティリティ
export function calculateChecksum(content: string): string {
  // 簡易的なハッシュ計算（本番ではcrypto.subtle使用推奨）
  let hash = 0;
  if (content.length === 0) return '0';
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash).toString(16);
}