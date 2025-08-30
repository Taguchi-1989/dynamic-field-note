/**
 * SyncService - ローカルファースト同期サービス
 * 
 * masterfile.md 345-352行の同期ポリシー準拠
 * - UUID使用・LWW（最後の書き込み優先）
 * - change_log差分イベント蓄積
 * - オンライン時バッチ同期
 * - soft delete（deleted_at）
 * - 添付ファイルのハッシュベース管理
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { WorkspaceService } from './WorkspaceService';
import { DbService } from './DbService';
import { SecureStorageService } from './SecureStorageService';
import { PdfJobService } from './PdfJobService';

// 同期状態定義
export type SyncStatus = 'offline' | 'connecting' | 'syncing' | 'online' | 'conflict' | 'error';

// エンティティタイプ定義
export type SyncEntityType = 
  | 'users'
  | 'meetings' 
  | 'documents'
  | 'document_versions'
  | 'tasks'
  | 'attachments'
  | 'participants'
  | 'dictionary_entries';

// 変更操作タイプ
export type ChangeOperation = 'insert' | 'update' | 'delete';

// 変更ログエントリ
export interface ChangeLogEntry {
  id?: number;
  entity: SyncEntityType;
  entity_id: string;
  op: ChangeOperation;
  version: number;
  vector_clock?: string;
  patch: string;
  actor_device_id?: string;
  created_at: string;
}

// 同期設定
export interface SyncConfig {
  endpoint?: string;
  apiKey?: string;
  enabled: boolean;
  syncIntervalMs: number;
  conflictResolution: 'lww' | 'manual' | 'merge';
  batchSize: number;
  attachmentSync: boolean;
}

// 同期結果
export interface SyncResult {
  success: boolean;
  totalChanges: number;
  uploadedChanges: number;
  downloadedChanges: number;
  conflicts: number;
  errors: string[];
  lastSyncTime: string;
}

// 競合データ
export interface ConflictData {
  id: string;
  entity: SyncEntityType;
  entity_id: string;
  local_version: any;
  remote_version: any;
  base_version?: any;
  conflict_type: 'content' | 'delete' | 'structure';
}

export class SyncService extends EventEmitter {
  private static instance: SyncService;
  private workspaceService: WorkspaceService;
  private dbService: DbService;
  private secureStorageService: SecureStorageService;
  private jobService: PdfJobService;
  private initialized = false;
  private syncStatus: SyncStatus = 'offline';
  private syncInterval?: NodeJS.Timeout;
  private deviceId: string;
  private vectorClock: Map<string, number> = new Map();

  private constructor() {
    super();
    this.workspaceService = WorkspaceService.getInstance();
    this.dbService = DbService.getInstance();
    this.secureStorageService = SecureStorageService.getInstance();
    this.jobService = PdfJobService.getInstance();
    this.deviceId = this.generateDeviceId();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * サービス初期化
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🔄 Initializing SyncService...');

    try {
      // デバイスIDの永続化チェック
      await this.ensureDeviceId();

      // ベクタークロック初期化
      await this.initializeVectorClock();

      // 同期設定の取得
      const config = await this.getSyncConfig();
      
      if (config.enabled) {
        // 自動同期開始
        this.startAutoSync(config);
      }

      // 監査ログ記録
      this.dbService.addAuditLog({
        action: 'sync_service_init',
        entity: 'system',
        entity_id: 'sync-service',
        detail: JSON.stringify({ 
          deviceId: this.deviceId,
          enabled: config.enabled 
        })
      });

      this.initialized = true;
      this.setSyncStatus('offline');
      console.log('✅ SyncService initialized successfully');

    } catch (error) {
      console.error('❌ SyncService initialization failed:', error);
      throw new Error(`SyncService initialization failed: ${error}`);
    }
  }

  /**
   * サービス停止
   */
  public async shutdown(): Promise<void> {
    console.log('🛑 Shutting down SyncService...');

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
    }

    this.setSyncStatus('offline');
    this.initialized = false;
    console.log('✅ SyncService shutdown completed');
  }

  /**
   * 手動同期実行
   */
  public async synchronize(): Promise<SyncResult> {
    if (!this.initialized) {
      throw new Error('SyncService not initialized');
    }

    console.log('🔄 Starting manual synchronization...');
    
    try {
      this.setSyncStatus('connecting');

      const config = await this.getSyncConfig();
      if (!config.enabled || !config.endpoint) {
        throw new Error('Sync not configured or disabled');
      }

      // 接続テスト
      const online = await this.testConnection(config);
      if (!online) {
        throw new Error('Unable to connect to sync server');
      }

      this.setSyncStatus('syncing');

      // 変更ログのアップロード
      const uploadResult = await this.uploadChanges(config);

      // リモート変更のダウンロード
      const downloadResult = await this.downloadChanges(config);

      // 競合の検出・解決
      const conflicts = await this.detectConflicts();

      const result: SyncResult = {
        success: true,
        totalChanges: uploadResult.count + downloadResult.count,
        uploadedChanges: uploadResult.count,
        downloadedChanges: downloadResult.count,
        conflicts: conflicts.length,
        errors: [],
        lastSyncTime: new Date().toISOString()
      };

      // 同期完了の記録
      await this.recordSyncCompletion(result);

      this.setSyncStatus('online');
      this.emit('sync:complete', result);

      console.log(`✅ Synchronization completed: ${result.totalChanges} changes`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      
      const result: SyncResult = {
        success: false,
        totalChanges: 0,
        uploadedChanges: 0,
        downloadedChanges: 0,
        conflicts: 0,
        errors: [errorMessage],
        lastSyncTime: new Date().toISOString()
      };

      this.setSyncStatus('error');
      this.emit('sync:error', errorMessage);

      // エラーログ記録
      this.dbService.addAuditLog({
        action: 'sync_failed',
        entity: 'system',
        entity_id: 'sync-service',
        detail: JSON.stringify({ error: errorMessage })
      });

      console.error('❌ Synchronization failed:', errorMessage);
      return result;
    }
  }

  /**
   * 変更ログへの記録（ローカル操作時に呼び出される）
   */
  public async recordChange(
    entity: SyncEntityType,
    entity_id: string,
    operation: ChangeOperation,
    data: any
  ): Promise<void> {
    try {
      const db = this.dbService['getDb']();
      
      // バージョン番号の取得・インクリメント
      const version = await this.getNextVersion(entity, entity_id);
      
      // ベクタークロック更新
      this.vectorClock.set(this.deviceId, (this.vectorClock.get(this.deviceId) || 0) + 1);

      const changeEntry: ChangeLogEntry = {
        entity,
        entity_id,
        op: operation,
        version,
        vector_clock: JSON.stringify(Object.fromEntries(this.vectorClock)),
        patch: JSON.stringify(data),
        actor_device_id: this.deviceId,
        created_at: new Date().toISOString()
      };

      const stmt = db.prepare(`
        INSERT INTO change_log (entity, entity_id, op, version, vector_clock, patch, actor_device_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        changeEntry.entity,
        changeEntry.entity_id,
        changeEntry.op,
        changeEntry.version,
        changeEntry.vector_clock,
        changeEntry.patch,
        changeEntry.actor_device_id,
        changeEntry.created_at
      );

      // 即座に同期が有効な場合はイベント発火
      const config = await this.getSyncConfig();
      if (config.enabled && this.syncStatus === 'online') {
        this.emit('change:recorded', changeEntry);
      }

      console.log(`📝 Change recorded: ${entity}:${entity_id} (${operation})`);

    } catch (error) {
      console.error('Failed to record change:', error);
      throw new Error(`Failed to record change: ${error}`);
    }
  }

  /**
   * 同期設定の取得
   */
  public async getSyncConfig(): Promise<SyncConfig> {
    try {
      const appConfig = await this.workspaceService.getAppConfig();
      
      // デフォルト設定
      const defaultConfig: SyncConfig = {
        enabled: false,
        syncIntervalMs: 300000, // 5分
        conflictResolution: 'lww',
        batchSize: 100,
        attachmentSync: true
      };

      // 設定ファイルから読み込み（拡張可能）
      return {
        ...defaultConfig,
        // 将来的にappConfig.syncで設定を上書き可能
      };

    } catch (error) {
      console.error('Failed to get sync config:', error);
      return {
        enabled: false,
        syncIntervalMs: 300000,
        conflictResolution: 'lww',
        batchSize: 100,
        attachmentSync: true
      };
    }
  }

  /**
   * 同期設定の更新
   */
  public async updateSyncConfig(updates: Partial<SyncConfig>): Promise<void> {
    try {
      // TODO: app.local.jsonまたは専用設定ファイルに保存
      // 現在は実装を簡略化

      if (updates.enabled !== undefined) {
        if (updates.enabled && !this.syncInterval) {
          const config = await this.getSyncConfig();
          this.startAutoSync({ ...config, ...updates });
        } else if (!updates.enabled && this.syncInterval) {
          this.stopAutoSync();
        }
      }

      // 監査ログ記録
      this.dbService.addAuditLog({
        action: 'sync_config_updated',
        entity: 'system',
        entity_id: 'sync-service',
        detail: JSON.stringify(updates)
      });

    } catch (error) {
      console.error('Failed to update sync config:', error);
      throw new Error(`Failed to update sync config: ${error}`);
    }
  }

  /**
   * 同期状態の取得
   */
  public getSyncStatus(): {
    status: SyncStatus;
    lastSync?: string;
    pendingChanges: number;
    conflicts: number;
  } {
    try {
      const db = this.dbService['getDb']();
      
      // 未同期変更数を取得
      const pendingStmt = db.prepare(`
        SELECT COUNT(*) as count FROM change_log 
        WHERE created_at > COALESCE(
          (SELECT MAX(created_at) FROM audit_log WHERE action = 'sync_completed'),
          '1970-01-01'
        )
      `);
      const pendingResult = pendingStmt.get() as { count: number };

      // 競合数を取得（簡易実装）
      const conflictCount = 0; // TODO: 実装が必要な場合

      // 最後の同期時刻
      const lastSyncStmt = db.prepare(`
        SELECT created_at FROM audit_log 
        WHERE action = 'sync_completed'
        ORDER BY created_at DESC LIMIT 1
      `);
      const lastSyncResult = lastSyncStmt.get() as { created_at: string } | undefined;

      return {
        status: this.syncStatus,
        lastSync: lastSyncResult?.created_at,
        pendingChanges: pendingResult.count,
        conflicts: conflictCount
      };

    } catch (error) {
      console.error('Failed to get sync status:', error);
      return {
        status: 'error',
        pendingChanges: 0,
        conflicts: 0
      };
    }
  }

  // === プライベートメソッド ===

  /**
   * 自動同期開始
   */
  private startAutoSync(config: SyncConfig): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      try {
        await this.synchronize();
      } catch (error) {
        console.error('Auto sync error:', error);
      }
    }, config.syncIntervalMs);

    console.log(`⏰ Auto sync started (interval: ${config.syncIntervalMs}ms)`);
  }

  /**
   * 自動同期停止
   */
  private stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      console.log('⏸️ Auto sync stopped');
    }
  }

  /**
   * 同期状態設定
   */
  private setSyncStatus(status: SyncStatus): void {
    if (this.syncStatus !== status) {
      this.syncStatus = status;
      this.emit('sync:status', status);
      console.log(`🔄 Sync status: ${status}`);
    }
  }

  /**
   * デバイスID生成・確保
   */
  private generateDeviceId(): string {
    const { platform, arch } = process;
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2);
    return `${platform}-${arch}-${timestamp}-${random}`;
  }

  /**
   * デバイスIDの永続化確保
   */
  private async ensureDeviceId(): Promise<void> {
    try {
      // ワークスペースから既存デバイスIDを取得試行
      const { paths } = await this.workspaceService.resolve();
      const devicePath = require('path').join(paths.cache, 'device.json');

      try {
        const deviceData = JSON.parse(
          await require('fs/promises').readFile(devicePath, 'utf-8')
        );
        if (deviceData.id && typeof deviceData.id === 'string') {
          this.deviceId = deviceData.id;
          return;
        }
      } catch (error) {
        // ファイルが存在しない、または読み込みエラー
      }

      // 新しいデバイスIDを生成・保存
      const deviceData = {
        id: this.deviceId,
        created_at: new Date().toISOString(),
        platform: process.platform,
        arch: process.arch
      };

      await require('fs/promises').writeFile(
        devicePath,
        JSON.stringify(deviceData, null, 2),
        'utf-8'
      );

      console.log(`📱 Device ID created: ${this.deviceId}`);

    } catch (error) {
      console.error('Failed to ensure device ID:', error);
      // フォールバック: セッション中のみ使用
    }
  }

  /**
   * ベクタークロック初期化
   */
  private async initializeVectorClock(): Promise<void> {
    try {
      const db = this.dbService['getDb']();
      
      // 最新のベクタークロックを取得
      const stmt = db.prepare(`
        SELECT vector_clock FROM change_log 
        WHERE actor_device_id = ?
        ORDER BY created_at DESC LIMIT 1
      `);
      
      const result = stmt.get(this.deviceId) as { vector_clock?: string } | undefined;
      
      if (result?.vector_clock) {
        const savedClock = JSON.parse(result.vector_clock);
        this.vectorClock = new Map(Object.entries(savedClock));
      }

      console.log(`⏱️ Vector clock initialized: ${this.vectorClock.size} devices`);

    } catch (error) {
      console.error('Failed to initialize vector clock:', error);
      // 空のベクタークロックで継続
    }
  }

  /**
   * 次のバージョン番号取得
   */
  private async getNextVersion(entity: SyncEntityType, entity_id: string): Promise<number> {
    try {
      const db = this.dbService['getDb']();
      
      const stmt = db.prepare(`
        SELECT MAX(version) as max_version FROM change_log
        WHERE entity = ? AND entity_id = ?
      `);
      
      const result = stmt.get(entity, entity_id) as { max_version?: number } | undefined;
      return (result?.max_version || 0) + 1;

    } catch (error) {
      console.error('Failed to get next version:', error);
      return 1; // フォールバック
    }
  }

  /**
   * 接続テスト（スタブ実装）
   */
  private async testConnection(config: SyncConfig): Promise<boolean> {
    try {
      // TODO: 実際のエンドポイントへの接続テスト
      // const response = await fetch(`${config.endpoint}/health`);
      // return response.ok;
      
      // スタブ: 常に成功
      await new Promise(resolve => setTimeout(resolve, 100));
      return true;

    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  /**
   * 変更のアップロード（スタブ実装）
   */
  private async uploadChanges(config: SyncConfig): Promise<{ count: number }> {
    try {
      // TODO: 実際のアップロード実装
      console.log('📤 Uploading changes...');
      
      const db = this.dbService['getDb']();
      
      // 未同期の変更を取得
      const stmt = db.prepare(`
        SELECT * FROM change_log 
        WHERE created_at > COALESCE(
          (SELECT MAX(created_at) FROM audit_log WHERE action = 'sync_completed'),
          '1970-01-01'
        )
        ORDER BY created_at ASC
        LIMIT ?
      `);
      
      const changes = stmt.all(config.batchSize) as ChangeLogEntry[];
      
      // スタブ: 処理済みとしてマーク
      console.log(`📤 Would upload ${changes.length} changes`);
      
      return { count: changes.length };

    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * 変更のダウンロード（スタブ実装）
   */
  private async downloadChanges(config: SyncConfig): Promise<{ count: number }> {
    try {
      // TODO: 実際のダウンロード実装
      console.log('📥 Downloading changes...');
      
      // スタブ: ダウンロードなし
      const count = 0;
      
      console.log(`📥 Downloaded ${count} changes`);
      return { count };

    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }

  /**
   * 競合検出（スタブ実装）
   */
  private async detectConflicts(): Promise<ConflictData[]> {
    try {
      // TODO: 実際の競合検出実装
      
      // スタブ: 競合なし
      return [];

    } catch (error) {
      console.error('Conflict detection failed:', error);
      return [];
    }
  }

  /**
   * 同期完了記録
   */
  private async recordSyncCompletion(result: SyncResult): Promise<void> {
    try {
      this.dbService.addAuditLog({
        action: 'sync_completed',
        entity: 'system',
        entity_id: 'sync-service',
        detail: JSON.stringify(result)
      });

    } catch (error) {
      console.error('Failed to record sync completion:', error);
    }
  }
}