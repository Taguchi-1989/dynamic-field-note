import { db, type DocumentRecord, type ConflictRecord, calculateChecksum } from './database.js';

export class LocalStorageManager {
  
  // ドキュメントの保存
  async saveDocument(doc: Omit<DocumentRecord, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'checksum'>): Promise<number> {
    const now = new Date();
    const content = doc.content;
    const checksum = calculateChecksum(content);
    
    const documentRecord: Omit<DocumentRecord, 'id'> = {
      ...doc,
      createdAt: now,
      updatedAt: now,
      version: 1,
      checksum,
      conflictStatus: 'none'
    };
    
    const id = await db.documents.add(documentRecord);
    console.log(`Document saved locally with ID: ${id}`);
    return id;
  }

  // ドキュメントの更新
  async updateDocument(id: number, updates: Partial<DocumentRecord>): Promise<void> {
    const existing = await db.documents.get(id);
    if (!existing) {
      throw new Error(`Document with ID ${id} not found`);
    }

    const now = new Date();
    const updatedContent = updates.content ?? existing.content;
    const newChecksum = calculateChecksum(updatedContent);
    
    await db.documents.update(id, {
      ...updates,
      updatedAt: now,
      version: existing.version + 1,
      checksum: newChecksum
    });
    
    console.log(`Document ${id} updated locally`);
  }

  // ドキュメント取得
  async getDocument(id: number): Promise<DocumentRecord | undefined> {
    return await db.documents.get(id);
  }

  // 全ドキュメント取得
  async getAllDocuments(): Promise<DocumentRecord[]> {
    return await db.documents.orderBy('updatedAt').reverse().toArray();
  }

  // NEWEST_WINS 競合解決
  async resolveConflictNewestWins(
    localDoc: DocumentRecord,
    remoteDoc: Partial<DocumentRecord> & { updatedAt: Date }
  ): Promise<DocumentRecord> {
    const localTime = localDoc.updatedAt.getTime();
    const remoteTime = remoteDoc.updatedAt.getTime();
    
    console.log(`Resolving conflict: Local(${localTime}) vs Remote(${remoteTime})`);
    
    if (remoteTime > localTime) {
      // リモートが新しい場合
      console.log('Remote is newer - applying remote changes');
      
      const resolvedDoc: DocumentRecord = {
        ...localDoc,
        ...remoteDoc,
        conflictStatus: 'newest_wins',
        lastSyncAt: new Date()
      };
      
      await db.documents.update(localDoc.id!, resolvedDoc);
      return resolvedDoc;
    } else {
      // ローカルが新しいか同じ場合
      console.log('Local is newer or equal - keeping local changes');
      
      const resolvedDoc: DocumentRecord = {
        ...localDoc,
        conflictStatus: 'newest_wins',
        lastSyncAt: new Date()
      };
      
      await db.documents.update(localDoc.id!, { 
        conflictStatus: 'newest_wins', 
        lastSyncAt: new Date() 
      });
      return resolvedDoc;
    }
  }

  // MANUAL 競合解決のための競合記録保存
  async saveConflictForManualResolution(
    documentId: number,
    localContent: string,
    remoteContent: string,
    localUpdatedAt: Date,
    remoteUpdatedAt: Date
  ): Promise<number> {
    const conflictRecord: Omit<ConflictRecord, 'id'> = {
      documentId,
      localContent,
      remoteContent,
      localUpdatedAt,
      remoteUpdatedAt,
      resolutionStrategy: 'manual',
      resolvedBy: 'system'
    };
    
    const conflictId = await db.conflicts.add(conflictRecord);
    
    // ドキュメントの競合ステータスを更新
    await db.documents.update(documentId, {
      conflictStatus: 'manual_required'
    });
    
    console.log(`Conflict saved for manual resolution: ${conflictId}`);
    return conflictId;
  }

  // 手動競合解決
  async resolveConflictManually(
    conflictId: number,
    resolvedContent: string,
    resolvedBy: 'user' = 'user'
  ): Promise<void> {
    const conflict = await db.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict with ID ${conflictId} not found`);
    }

    // 解決済みとしてマーク
    await db.conflicts.update(conflictId, {
      resolvedAt: new Date(),
      resolvedBy
    });

    // ドキュメントを更新
    await db.documents.update(conflict.documentId, {
      content: resolvedContent,
      updatedAt: new Date(),
      conflictStatus: 'none',
      lastSyncAt: new Date()
    });

    console.log(`Conflict ${conflictId} resolved manually`);
  }

  // 未解決の競合を取得
  async getUnresolvedConflicts(): Promise<ConflictRecord[]> {
    return await db.conflicts.where('resolvedAt').equals(undefined as any).toArray();
  }

  // データベースクリア（テスト用）
  async clearAllData(): Promise<void> {
    await db.documents.clear();
    await db.syncMetadata.clear();
    await db.conflicts.clear();
    console.log('All local data cleared');
  }

  // データベース統計
  async getStats(): Promise<{
    documentsCount: number;
    conflictsCount: number;
    unresolvedConflictsCount: number;
  }> {
    const documentsCount = await db.documents.count();
    const conflictsCount = await db.conflicts.count();
    const unresolvedConflictsCount = await db.conflicts.where('resolvedAt').equals(undefined as any).count();
    
    return {
      documentsCount,
      conflictsCount,
      unresolvedConflictsCount
    };
  }
}