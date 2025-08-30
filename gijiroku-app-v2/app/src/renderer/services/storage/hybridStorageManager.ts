import { EventEmitter } from 'events';
import { IStorageService, StorageMode, StorageConfig, StorageEventHandler, StorageEvent } from './StorageInterface';
import { LocalStorageManager } from './localStorageManager';

/**
 * ハイブリッドストレージマネージャー
 * ローカル（IndexedDB）とリモート（Supabase）の切り替えを管理
 */
export class HybridStorageManager extends EventEmitter implements IStorageService {
  private currentMode: StorageMode = 'local';
  private localStorage: LocalStorageManager;
  private remoteStorage?: IStorageService;
  private config: StorageConfig;
  private autoSyncInterval?: NodeJS.Timeout;

  constructor(config?: Partial<StorageConfig>) {
    super();
    
    this.config = {
      mode: 'local',
      autoSync: false,
      syncInterval: 300000, // 5分
      conflictResolution: 'newest',
      ...config
    };

    this.currentMode = this.config.mode;
    this.localStorage = new LocalStorageManager();
  }

  // ================== 初期化 ==================

  async initialize(config?: StorageConfig): Promise<void> {
    if (config) {
      this.config = { ...this.config, ...config };
      this.currentMode = this.config.mode;
    }

    // ローカルストレージ初期化
    await this.localStorage.initialize();

    // リモートストレージ初期化（web/hybridモードの場合）
    if (this.currentMode === 'web' && typeof window !== 'undefined') {
      // ブラウザ環境でのSupabase初期化
      await this.initializeRemoteStorage();
    }

    // 自動同期設定
    if (this.config.autoSync && this.currentMode !== 'local') {
      this.enableAutoSync(this.config.syncInterval!);
    }

    console.log(`🔧 HybridStorageManager initialized in ${this.currentMode} mode`);
  }

  private async initializeRemoteStorage(): Promise<void> {
    // TODO: Supabaseクライアント初期化（既存実装を使用）
    // この部分は既存のSupabaseサービスを組み込み
    console.log('📡 Remote storage initialization (placeholder)');
  }

  // ================== モード管理 ==================

  async setMode(mode: StorageMode): Promise<void> {
    if (this.currentMode === mode) return;

    const previousMode = this.currentMode;
    this.currentMode = mode;
    
    // 自動同期停止
    this.disableAutoSync();
    
    // モード切り替え時の同期処理
    if (previousMode === 'local' && mode === 'web') {
      await this.syncLocalToRemote();
    } else if (previousMode === 'web' && mode === 'local') {
      await this.syncRemoteToLocal();
    }

    // 新しいモードでの自動同期設定
    if (this.config.autoSync && mode !== 'local') {
      this.enableAutoSync(this.config.syncInterval!);
    }

    this.emit('mode-changed', { mode, previousMode });
    console.log(`🔄 Storage mode changed: ${previousMode} → ${mode}`);
  }

  getMode(): StorageMode {
    return this.currentMode;
  }

  // ================== 基本操作 ==================

  async get<T>(collection: string, id: string): Promise<T | null> {
    return this.getCurrentProvider().get<T>(collection, id);
  }

  async set<T>(collection: string, id: string, value: T): Promise<void> {
    await this.getCurrentProvider().set<T>(collection, id, value);
    this.emit('document-created', { collection, id, data: value });
  }

  async update<T>(collection: string, id: string, updates: Partial<T>): Promise<void> {
    await this.getCurrentProvider().update<T>(collection, id, updates);
    this.emit('document-updated', { collection, id, updates });
  }

  async delete(collection: string, id: string): Promise<void> {
    await this.getCurrentProvider().delete(collection, id);
    this.emit('document-deleted', { collection, id });
  }

  // ================== コレクション操作 ==================

  async getAll<T>(collection: string): Promise<T[]> {
    return this.getCurrentProvider().getAll<T>(collection);
  }

  async clear(collection: string): Promise<void> {
    return this.getCurrentProvider().clear(collection);
  }

  async clearAll(): Promise<void> {
    return this.getCurrentProvider().clearAll();
  }

  // ================== バッチ操作 ==================

  async getMany<T>(collection: string, ids: string[]): Promise<T[]> {
    return this.getCurrentProvider().getMany<T>(collection, ids);
  }

  async setMany<T>(collection: string, items: Map<string, T>): Promise<void> {
    return this.getCurrentProvider().setMany<T>(collection, items);
  }

  async deleteMany(collection: string, ids: string[]): Promise<void> {
    return this.getCurrentProvider().deleteMany(collection, ids);
  }

  // ================== 検索・フィルタ ==================

  async search<T>(collection: string, criteria: any): Promise<T[]> {
    return this.getCurrentProvider().search<T>(collection, criteria);
  }

  async filter<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    return this.getCurrentProvider().filter<T>(collection, predicate);
  }

  async count(collection: string, criteria?: any): Promise<number> {
    return this.getCurrentProvider().count(collection, criteria);
  }

  // ================== メタデータ ==================

  async getMetadata() {
    return this.getCurrentProvider().getMetadata();
  }

  async getSize(collection?: string): Promise<number> {
    return this.getCurrentProvider().getSize(collection);
  }

  getCapabilities(): string[] {
    const baseCapabilities = this.getCurrentProvider().getCapabilities();
    const hybridCapabilities = ['mode-switching', 'sync'];
    return [...baseCapabilities, ...hybridCapabilities];
  }

  // ================== イベント処理 ==================

  on(event: StorageEvent, handler: StorageEventHandler): void {
    super.on(event, handler);
  }

  off(event: StorageEvent, handler: StorageEventHandler): void {
    super.off(event, handler);
  }

  // ================== 同期機能 ==================

  async sync() {
    if (this.currentMode === 'local') {
      console.log('⚠️ Sync not available in local-only mode');
      return { isSyncing: false, message: 'Local-only mode' };
    }

    this.emit('sync:start');
    
    try {
      // TODO: 実際の同期処理実装
      const result = await this.performSync();
      
      this.emit('sync:complete', result);
      return result;
    } catch (error) {
      this.emit('sync:error', error);
      throw error;
    }
  }

  private async performSync() {
    // プレースホルダー実装
    return {
      isSyncing: false,
      progress: 100,
      message: 'Sync completed',
      lastSyncTime: new Date(),
      pendingChanges: 0
    };
  }

  // ================== 自動同期 ==================

  enableAutoSync(interval: number): void {
    this.disableAutoSync();
    
    if (this.currentMode === 'local') return;

    this.autoSyncInterval = setInterval(async () => {
      try {
        await this.sync();
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, interval);

    console.log(`🔄 Auto sync enabled (${interval}ms interval)`);
  }

  disableAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = undefined;
      console.log('🛑 Auto sync disabled');
    }
  }

  // ================== プライベートヘルパー ==================

  private getCurrentProvider(): IStorageService {
    switch (this.currentMode) {
      case 'local':
        return this.localStorage;
      case 'web':
        if (!this.remoteStorage) {
          console.warn('Remote storage not initialized, falling back to local');
          return this.localStorage;
        }
        return this.remoteStorage;
      default:
        return this.localStorage;
    }
  }

  private async syncLocalToRemote(): Promise<void> {
    // ローカル→リモート同期の実装
    console.log('📤 Syncing local data to remote...');
    // TODO: 実装
  }

  private async syncRemoteToLocal(): Promise<void> {
    // リモート→ローカル同期の実装
    console.log('📥 Syncing remote data to local...');
    // TODO: 実装
  }

  // ================== Electron統合 ==================

  async getElectronAPI() {
    // Electron環境でのAPI取得
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return (window as any).electronAPI;
    }
    return null;
  }

  isElectronEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           typeof (window as any).electronAPI !== 'undefined';
  }

  // ================== クリーンアップ ==================

  async cleanup(): Promise<void> {
    this.disableAutoSync();
    
    if (this.localStorage) {
      await this.localStorage.cleanup?.();
    }
    
    if (this.remoteStorage) {
      await this.remoteStorage.cleanup?.();
    }

    this.removeAllListeners();
    console.log('🧹 HybridStorageManager cleaned up');
  }
}