import { EventEmitter } from 'events';
import { 
  IStorageService, 
  StorageMetadata, 
  SearchCriteria, 
  SyncStatus, 
  StorageConfig, 
  StorageMode,
  StorageEvent,
  StorageEventHandler,
  COLLECTIONS 
} from './StorageInterface';
import { LocalStorageManager } from './localStorageManager';
import { HybridStorageManager } from './hybridStorageManager';

/**
 * Electron環境でのストレージアダプター
 * IndexedDBとElectron IPC APIを組み合わせてストレージ機能を提供
 */
export class ElectronStorageAdapter extends EventEmitter implements IStorageService {
  private localStorage: LocalStorageManager;
  private hybridManager: HybridStorageManager;
  private electronAPI: any;
  private mode: StorageMode = 'local';

  constructor() {
    super();
    
    this.localStorage = new LocalStorageManager();
    this.hybridManager = new HybridStorageManager({ mode: 'local' });
    
    // Electron API取得
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      this.electronAPI = (window as any).electronAPI;
    }
  }

  // ================== 初期化 ==================

  async initialize(config?: StorageConfig): Promise<void> {
    try {
      // ローカルストレージ初期化
      await this.localStorage.initialize();
      
      // ハイブリッドマネージャー初期化
      await this.hybridManager.initialize(config);
      
      // モード設定
      if (config?.mode) {
        this.mode = config.mode;
        await this.hybridManager.setMode(config.mode);
      }

      // Electron設定の読み込み
      if (this.electronAPI) {
        await this.loadElectronSettings();
      }

      console.log(`🔧 ElectronStorageAdapter initialized in ${this.mode} mode`);
    } catch (error) {
      console.error('ElectronStorageAdapter initialization failed:', error);
      throw error;
    }
  }

  private async loadElectronSettings(): Promise<void> {
    try {
      const settings = await this.electronAPI.storage.getAll();
      
      // 設定をローカルストレージに反映
      if (settings.storageMode) {
        this.mode = settings.storageMode;
        await this.hybridManager.setMode(this.mode);
      }
    } catch {
      console.log('No existing Electron settings found, using defaults');
    }
  }

  // ================== 基本操作 ==================

  async get<T>(collection: string, id: string): Promise<T | null> {
    try {
      // Electronストレージから取得を試行
      if (this.electronAPI && collection === COLLECTIONS.SETTINGS) {
        const value = await this.electronAPI.storage.get(`${collection}:${id}`);
        if (value !== null) return value;
      }

      // IndexedDBから取得
      return await this.hybridManager.get<T>(collection, id);
    } catch (error) {
      console.error('Get operation failed:', error);
      throw error;
    }
  }

  async set<T>(collection: string, id: string, value: T): Promise<void> {
    try {
      // IndexedDBに保存
      await this.hybridManager.set<T>(collection, id, value);

      // 設定類はElectronストレージにも保存
      if (this.electronAPI && collection === COLLECTIONS.SETTINGS) {
        await this.electronAPI.storage.set(`${collection}:${id}`, value);
      }

      this.emit('document-created', { collection, id, data: value });
    } catch (error) {
      console.error('Set operation failed:', error);
      throw error;
    }
  }

  async update<T>(collection: string, id: string, updates: Partial<T>): Promise<void> {
    try {
      await this.hybridManager.update<T>(collection, id, updates);

      // 設定の場合はElectronストレージも更新
      if (this.electronAPI && collection === COLLECTIONS.SETTINGS) {
        const existing = await this.electronAPI.storage.get(`${collection}:${id}`) || {};
        const updated = { ...existing, ...updates };
        await this.electronAPI.storage.set(`${collection}:${id}`, updated);
      }

      this.emit('document-updated', { collection, id, updates });
    } catch (error) {
      console.error('Update operation failed:', error);
      throw error;
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    try {
      await this.hybridManager.delete(collection, id);

      if (this.electronAPI && collection === COLLECTIONS.SETTINGS) {
        await this.electronAPI.storage.delete(`${collection}:${id}`);
      }

      this.emit('document-deleted', { collection, id });
    } catch (error) {
      console.error('Delete operation failed:', error);
      throw error;
    }
  }

  // ================== コレクション操作 ==================

  async getAll<T>(collection: string): Promise<T[]> {
    return await this.hybridManager.getAll<T>(collection);
  }

  async clear(collection: string): Promise<void> {
    await this.hybridManager.clear(collection);
    
    // Electronストレージの該当データも削除
    if (this.electronAPI) {
      const allSettings = await this.electronAPI.storage.getAll();
      const keysToDelete = Object.keys(allSettings).filter(key => 
        key.startsWith(`${collection}:`)
      );
      
      for (const key of keysToDelete) {
        await this.electronAPI.storage.delete(key);
      }
    }
  }

  async clearAll(): Promise<void> {
    await this.hybridManager.clearAll();
    
    if (this.electronAPI) {
      await this.electronAPI.storage.clear();
    }
  }

  // ================== バッチ操作 ==================

  async getMany<T>(collection: string, ids: string[]): Promise<T[]> {
    return await this.hybridManager.getMany<T>(collection, ids);
  }

  async setMany<T>(collection: string, items: Map<string, T>): Promise<void> {
    await this.hybridManager.setMany<T>(collection, items);
  }

  async deleteMany(collection: string, ids: string[]): Promise<void> {
    await this.hybridManager.deleteMany(collection, ids);
  }

  // ================== 検索・フィルタ ==================

  async search<T>(collection: string, criteria: SearchCriteria): Promise<T[]> {
    return await this.hybridManager.search<T>(collection, criteria);
  }

  async filter<T>(collection: string, predicate: (item: T) => boolean): Promise<T[]> {
    return await this.hybridManager.filter<T>(collection, predicate);
  }

  async count(collection: string, criteria?: SearchCriteria): Promise<number> {
    return await this.hybridManager.count(collection, criteria);
  }

  // ================== メタデータ ==================

  async getMetadata(): Promise<StorageMetadata> {
    const baseMetadata = await this.hybridManager.getMetadata();
    
    return {
      ...baseMetadata,
      mode: this.mode,
      capabilities: [...baseMetadata.capabilities, 'electron-integration', 'file-system-access'],
      isOnline: this.electronAPI ? await this.checkOnlineStatus() : true
    };
  }

  async getSize(collection?: string): Promise<number> {
    return await this.hybridManager.getSize(collection);
  }

  getCapabilities(): string[] {
    const baseCapabilities = this.hybridManager.getCapabilities();
    return [...baseCapabilities, 'electron-integration', 'file-system-access', 'native-dialogs'];
  }

  // ================== イベント処理 ==================

  on(event: StorageEvent, handler: StorageEventHandler): void {
    super.on(event, handler);
  }

  off(event: StorageEvent, handler: StorageEventHandler): void {
    super.off(event, handler);
  }

  // ================== 同期機能 ==================

  async sync(): Promise<SyncStatus> {
    return await this.hybridManager.sync();
  }

  getSyncStatus(): SyncStatus {
    // プレースホルダー実装
    return {
      isSyncing: false,
      progress: 100,
      message: 'Sync not active in local mode',
      lastSyncTime: new Date(),
      pendingChanges: 0
    };
  }

  async resolveConflict<T>(collection: string, id: string, resolution: T): Promise<void> {
    await this.hybridManager.set<T>(collection, id, resolution);
  }

  // ================== Electron固有機能 ==================

  async exportToFile(): Promise<string | null> {
    if (!this.electronAPI) return null;

    try {
      // ファイル保存ダイアログを表示
      const result = await this.electronAPI.file.saveDialog({
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: 'storage-export.json'
      });

      if (result.canceled) return null;

      // 全データをエクスポート
      const allData: any = {};
      for (const collection of Object.values(COLLECTIONS)) {
        allData[collection] = await this.getAll(collection);
      }

      // ファイルに保存
      await this.electronAPI.file.writeFile(
        result.filePath, 
        JSON.stringify(allData, null, 2)
      );

      return result.filePath;
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  async importFromFile(): Promise<boolean> {
    if (!this.electronAPI) return false;

    try {
      // ファイル選択ダイアログを表示
      const result = await this.electronAPI.file.selectFile({
        filters: [
          { name: 'JSON Files', extensions: ['json'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (result.canceled) return false;

      // ファイルを読み込み
      const fileContent = await this.electronAPI.file.readFile(result.filePath);
      const importData = JSON.parse(fileContent.content);

      // データをインポート
      for (const [collection, items] of Object.entries(importData)) {
        if (Array.isArray(items)) {
          for (const item of items) {
            if (item.id) {
              await this.set(collection, item.id, item);
            }
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  // ================== プライベートヘルパー ==================

  private async checkOnlineStatus(): Promise<boolean> {
    if (typeof navigator !== 'undefined') {
      return navigator.onLine;
    }
    return true; // Electronでは基本的にオンライン
  }

  // ================== クリーンアップ ==================

  async cleanup(): Promise<void> {
    await this.hybridManager.cleanup();
    this.removeAllListeners();
    console.log('🧹 ElectronStorageAdapter cleaned up');
  }
}