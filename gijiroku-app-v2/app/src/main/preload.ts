import { contextBridge, ipcRenderer } from 'electron';

// zodスキーマと型定義をインポート
import {
  // 型定義
  FileSelectOptions,
  FileSelectResult,
  SaveDialogOptions,
  SaveDialogResult,
  BackendRequestOptions,
  WorkspaceInfo,
  WorkspaceConfig,
  AppLocalConfig,
  AppLocalConfigUpdate,
  MarkdownCompileOptions,
  MarkdownCompileInput,
  MarkdownCompileResult,
  MarkdownTestResult,
  JobCreateInput,
  JobCreateResult,
  JobStatusResult,
  DatabaseHealthCheck,
  DatabaseStats,
  MermaidCacheStats,
  MermaidClearResult,
  SecureCredentialInput,
  SecureCredentialList,
  ApiKeyConfig,
  SecureStorageHealth,
  AppVersion,
  AppPathName,
  IPCResponse,
  // スキーマ
  FileSelectOptionsSchema,
  SaveDialogOptionsSchema,
  StorageKeySchema,
  StorageValueSchema,
  BackendRequestOptionsSchema,
  AppLocalConfigUpdateSchema,
  MarkdownCompileInputSchema,
  JobCreateInputSchema,
  SecureCredentialInputSchema,
  ApiKeyConfigSchema,
  AppPathNameSchema,
  // ヘルパー関数
  validateInput,
  createSuccessResponse,
  createErrorResponse
} from '../shared/ipc-schemas';

// JobStatusResult\u306f\u30b9\u30ad\u30fc\u30de\u30d5\u30a1\u30a4\u30eb\u304b\u3089\u30a4\u30f3\u30dd\u30fc\u30c8\u6e08\u307f

// APIの型定義（zodスキーマ準拠）
interface ElectronAPI {
  file: {
    selectFile: (options: FileSelectOptions) => Promise<IPCResponse<FileSelectResult>>;
    readFile: (filePath: string) => Promise<IPCResponse<string>>;
    writeFile: (filePath: string, content: string) => Promise<IPCResponse<void>>;
    saveDialog: (options: SaveDialogOptions) => Promise<IPCResponse<SaveDialogResult>>;
    copyFile: (srcPath: string, destPath: string) => Promise<IPCResponse<void>>;
    copyToDownloads: (srcPath: string, filename: string) => Promise<IPCResponse<{destPath: string}>>;
    loadPrompts: () => Promise<IPCResponse<{ prompts: Array<{ id: string; title: string; content: string; description: string; category: string; is_active: boolean }> }>>;
  };
  storage: {
    get: <T = unknown>(key: string) => Promise<IPCResponse<T>>;
    set: <T = unknown>(key: string, value: T) => Promise<IPCResponse<void>>;
    delete: (key: string) => Promise<IPCResponse<void>>;
    clear: () => Promise<IPCResponse<void>>;
    getAll: () => Promise<IPCResponse<Record<string, unknown>>>;
  };
  backend: {
    request: <TResponse = unknown>(endpoint: string, options: BackendRequestOptions) => Promise<IPCResponse<TResponse>>;
    uploadFile: <TResponse = unknown>(filePath: string, endpoint: string) => Promise<IPCResponse<TResponse>>;
    getStatus: () => Promise<IPCResponse<boolean>>;
    getUrl: () => Promise<IPCResponse<string>>;
  };
  app: {
    getVersion: () => Promise<IPCResponse<AppVersion>>;
    isPackaged: () => Promise<IPCResponse<boolean>>;
    quit: () => Promise<IPCResponse<void>>;
    minimize: () => Promise<IPCResponse<void>>;
    maximize: () => Promise<IPCResponse<void>>;
    getPath: (name: AppPathName) => Promise<IPCResponse<string>>;
  };
  dev: {
    openDevTools: () => Promise<IPCResponse<void>>;
    reload: () => Promise<IPCResponse<void>>;
  };
  // === UPDATED: masterfile.md 準拠の新API（zodスキーマ統合） ===
  workspace: {
    resolve: () => Promise<IPCResponse<WorkspaceInfo>>;
    initIfNeeded: () => Promise<IPCResponse<{ initialized: boolean }>>;
    getConfig: () => Promise<IPCResponse<WorkspaceConfig>>;
    getAppConfig: () => Promise<IPCResponse<AppLocalConfig>>;
    updateAppConfig: (updates: AppLocalConfigUpdate) => Promise<IPCResponse<void>>;
    getInfo: () => Promise<IPCResponse<WorkspaceInfo>>;
    selectDirectory: () => Promise<IPCResponse<{ success: boolean; path?: string; error?: string }>>;
    switchTo: (path: string) => Promise<IPCResponse<{ success: boolean; error?: string }>>;
    initialize: () => Promise<IPCResponse<{ success: boolean; error?: string }>>;
    backup: () => Promise<IPCResponse<{ success: boolean; backupPath?: string; error?: string }>>;
  };
  markdown: {
    compileToPdf: (input: MarkdownCompileInput) => Promise<IPCResponse<MarkdownCompileResult>>;
    testPdf: () => Promise<IPCResponse<MarkdownTestResult>>;
  };
  mermaid: {
    clearCache: () => Promise<IPCResponse<MermaidClearResult>>;
    getCacheStats: () => Promise<IPCResponse<MermaidCacheStats>>;
  };
  jobs: {
    enqueue: (job: JobCreateInput) => Promise<IPCResponse<JobCreateResult>>;
    getStatus: (id: string) => Promise<IPCResponse<JobStatusResult>>;
    cancel: (id: string) => Promise<IPCResponse<void>>;
    getStats: () => Promise<IPCResponse<Record<string, number>>>;
  };
  database: {
    healthCheck: () => Promise<IPCResponse<DatabaseHealthCheck>>;
    getStats: () => Promise<IPCResponse<DatabaseStats>>;
  };
  // === NEW: AI Processing API (完全オフライン対応) ===
  ai: {
    processText: (inputText: string, templateId: string, customPrompt?: string, options?: Record<string, unknown>) => Promise<IPCResponse<{ processedText: string; metadata?: Record<string, unknown> }>>;
    reviseText: (originalText: string, revisionNotes: string, options?: Record<string, unknown>) => Promise<IPCResponse<{ revisedText: string; changes?: string[] }>>;
    getProviders: () => Promise<IPCResponse<string[]>>;
  };
  // === NEW: Secure Storage API (Phase 3) ===
  secure: {
    setCredential: (input: SecureCredentialInput) => Promise<IPCResponse<void>>;
    getCredential: (id: string, account: string) => Promise<IPCResponse<string | null>>;
    deleteCredential: (id: string, account: string) => Promise<IPCResponse<boolean>>;
    listCredentials: () => Promise<IPCResponse<SecureCredentialList>>;
    setApiConfig: (config: ApiKeyConfig) => Promise<IPCResponse<void>>;
    getApiConfigStatus: () => Promise<IPCResponse<{ gemini: boolean; openai: boolean; lastCheck?: string }>>;
    healthCheck: () => Promise<IPCResponse<SecureStorageHealth>>;
  };
  // === NEW: Templates API (CODEX_REVIEW.md準拠) ===
  templates: {
    list: () => Promise<IPCResponse<Array<{ id: string; title: string; content: string; description?: string; category?: string; is_active?: boolean }>>>;
    get: (id: string) => Promise<IPCResponse<{ id: string; title: string; content: string; description?: string; category?: string; is_active?: boolean }>>;
    upsert: (template: { id?: string; title: string; content: string; description?: string; category?: string; is_active?: boolean }) => Promise<IPCResponse<{ id: string; title: string; content: string; description?: string; category?: string; is_active?: boolean }>>;
    delete: (id: string) => Promise<IPCResponse<boolean>>;
  };
}

// バリデーション付きAPIを公開
const createElectronAPI = (): ElectronAPI => ({
  // ファイルシステム操作（バリデーション付き）
  file: {
    selectFile: async (options: FileSelectOptions): Promise<IPCResponse<FileSelectResult>> => {
      try {
        validateInput(FileSelectOptionsSchema, options);
        return await ipcRenderer.invoke('file:select', options);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    readFile: async (filePath: string): Promise<IPCResponse<string>> => {
      try {
        if (!filePath || typeof filePath !== 'string') {
          throw new Error('Invalid file path');
        }
        return await ipcRenderer.invoke('file:read', filePath);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    writeFile: async (filePath: string, content: string): Promise<IPCResponse<void>> => {
      try {
        if (!filePath || typeof filePath !== 'string') {
          throw new Error('Invalid file path');
        }
        if (typeof content !== 'string') {
          throw new Error('Content must be a string');
        }
        return await ipcRenderer.invoke('file:write', filePath, content);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    saveDialog: async (options: SaveDialogOptions): Promise<IPCResponse<SaveDialogResult>> => {
      try {
        validateInput(SaveDialogOptionsSchema, options);
        return await ipcRenderer.invoke('file:save-dialog', options);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    copyFile: async (srcPath: string, destPath: string): Promise<IPCResponse<void>> => {
      try {
        return await ipcRenderer.invoke('file:copy', srcPath, destPath);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    copyToDownloads: async (srcPath: string, filename: string): Promise<IPCResponse<{destPath: string}>> => {
      try {
        return await ipcRenderer.invoke('file:copy-to-downloads', srcPath, filename);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    loadPrompts: async (): Promise<IPCResponse<{ prompts: Array<{ id: string; title: string; content: string; description: string; category: string; is_active: boolean }> }>> => {
      try {
        return await ipcRenderer.invoke('file:load-prompts');
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    }
  },

  // ストレージ操作（バリデーション付き）
  storage: {
    get: async <T = unknown>(key: string): Promise<IPCResponse<T>> => {
      try {
        validateInput(StorageKeySchema, key);
        return await ipcRenderer.invoke('storage:get', key);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    set: async <T = unknown>(key: string, value: T): Promise<IPCResponse<void>> => {
      try {
        validateInput(StorageKeySchema, key);
        validateInput(StorageValueSchema, value);
        return await ipcRenderer.invoke('storage:set', key, value);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    delete: async (key: string): Promise<IPCResponse<void>> => {
      try {
        validateInput(StorageKeySchema, key);
        return await ipcRenderer.invoke('storage:delete', key);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    clear: async (): Promise<IPCResponse<void>> => {
      try {
        return await ipcRenderer.invoke('storage:clear');
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    getAll: async (): Promise<IPCResponse<Record<string, unknown>>> => {
      try {
        return await ipcRenderer.invoke('storage:get-all');
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    }
  },

  // バックエンドAPI通信
  backend: {
    request: (endpoint: string, options: BackendRequestOptions) => 
      ipcRenderer.invoke('backend:request', endpoint, options),
    uploadFile: (filePath: string, endpoint: string) =>
      ipcRenderer.invoke('backend:upload', filePath, endpoint),
    getStatus: () => ipcRenderer.invoke('backend:status'),
    getUrl: () => ipcRenderer.invoke('backend:url')
  },

  // アプリケーション制御
  app: {
    getVersion: () => ipcRenderer.invoke('app:version'),
    isPackaged: () => ipcRenderer.invoke('app:isPackaged'),
    quit: () => ipcRenderer.invoke('app:quit'),
    minimize: () => ipcRenderer.invoke('app:minimize'),
    maximize: () => ipcRenderer.invoke('app:maximize'),
    getPath: (name: string) => ipcRenderer.invoke('app:get-path', name)
  },

  // 開発環境専用
  dev: {
    openDevTools: () => ipcRenderer.invoke('dev:open-devtools'),
    reload: () => ipcRenderer.invoke('dev:reload')
  },

  // === NEW: masterfile.md 準拠の新API実装 ===
  workspace: {
    resolve: () => ipcRenderer.invoke('workspace:resolve'),
    initIfNeeded: () => ipcRenderer.invoke('workspace:init-if-needed'),
    getConfig: () => ipcRenderer.invoke('workspace:get-config'),
    getAppConfig: () => ipcRenderer.invoke('workspace:get-app-config'),
    updateAppConfig: (updates: Partial<AppLocalConfig>) => ipcRenderer.invoke('workspace:update-app-config', updates),
    getInfo: () => ipcRenderer.invoke('workspace:getInfo'),
    selectDirectory: () => ipcRenderer.invoke('workspace:selectDirectory'),
    switchTo: (path: string) => ipcRenderer.invoke('workspace:switchTo', path),
    initialize: () => ipcRenderer.invoke('workspace:initialize'),
    backup: () => ipcRenderer.invoke('workspace:backup')
  },

  markdown: {
    compileToPdf: (input: MarkdownCompileInput) => ipcRenderer.invoke('markdown:compile-to-pdf', input),
    testPdf: () => ipcRenderer.invoke('markdown:test-pdf')
  },

  mermaid: {
    clearCache: () => ipcRenderer.invoke('mermaid:clear-cache'),
    getCacheStats: () => ipcRenderer.invoke('mermaid:get-cache-stats')
  },

  ai: {
    processText: (inputText: string, templateId: string, customPrompt?: string, options?: Record<string, unknown>) => 
      ipcRenderer.invoke('ai:process-text', inputText, templateId, customPrompt, options),
    reviseText: (originalText: string, revisionNotes: string, options?: Record<string, unknown>) => 
      ipcRenderer.invoke('ai:revise-text', originalText, revisionNotes, options),
    getProviders: () => ipcRenderer.invoke('ai:get-providers')
  },

  jobs: {
    enqueue: async (job: JobCreateInput): Promise<IPCResponse<JobCreateResult>> => {
      try {
        validateInput(JobCreateInputSchema, job);
        return await ipcRenderer.invoke('jobs:enqueue', job);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    getStatus: async (id: string): Promise<IPCResponse<JobStatusResult>> => {
      try {
        if (!id || typeof id !== 'string') {
          throw new Error('Job ID is required');
        }
        return await ipcRenderer.invoke('jobs:get-status', id);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    cancel: async (id: string): Promise<IPCResponse<void>> => {
      try {
        if (!id || typeof id !== 'string') {
          throw new Error('Job ID is required');
        }
        return await ipcRenderer.invoke('jobs:cancel', id);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    getStats: async (): Promise<IPCResponse<Record<string, number>>> => {
      try {
        return await ipcRenderer.invoke('jobs:get-stats');
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    }
  },

  database: {
    healthCheck: () => ipcRenderer.invoke('database:health-check'),
    getStats: () => ipcRenderer.invoke('database:get-stats')
  },

  // === NEW: Secure Storage API (Phase 3) ===
  secure: {
    setCredential: async (input: SecureCredentialInput): Promise<IPCResponse<void>> => {
      try {
        validateInput(SecureCredentialInputSchema, input);
        return await ipcRenderer.invoke('secure:set-credential', input);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    getCredential: async (id: string, account: string): Promise<IPCResponse<string | null>> => {
      try {
        if (!id || !account) {
          throw new Error('ID and account are required');
        }
        return await ipcRenderer.invoke('secure:get-credential', id, account);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    deleteCredential: async (id: string, account: string): Promise<IPCResponse<boolean>> => {
      try {
        if (!id || !account) {
          throw new Error('ID and account are required');
        }
        return await ipcRenderer.invoke('secure:delete-credential', id, account);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    listCredentials: async (): Promise<IPCResponse<SecureCredentialList>> => {
      try {
        return await ipcRenderer.invoke('secure:list-credentials');
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    setApiConfig: async (config: ApiKeyConfig): Promise<IPCResponse<void>> => {
      try {
        validateInput(ApiKeyConfigSchema, config);
        return await ipcRenderer.invoke('secure:set-api-config', config);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    getApiConfigStatus: async (): Promise<IPCResponse<{ gemini: boolean; openai: boolean; lastCheck?: string }>> => {
      try {
        return await ipcRenderer.invoke('secure:get-api-config-status');
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    healthCheck: async (): Promise<IPCResponse<SecureStorageHealth>> => {
      try {
        return await ipcRenderer.invoke('secure:health-check');
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    }
  },

  // === NEW: Templates API (CODEX_REVIEW.md準拠) ===
  templates: {
    list: async (): Promise<IPCResponse<Array<{ id: string; title: string; content: string; description?: string; category?: string; is_active?: boolean }>>> => {
      try {
        return await ipcRenderer.invoke('templates:list');
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    get: async (id: string): Promise<IPCResponse<{ id: string; title: string; content: string; description?: string; category?: string; is_active?: boolean }>> => {
      try {
        if (!id) {
          throw new Error('Template ID is required');
        }
        return await ipcRenderer.invoke('templates:get', id);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    upsert: async (template: { id?: string; title: string; content: string; description?: string; category?: string; is_active?: boolean }): Promise<IPCResponse<{ id: string; title: string; content: string; description?: string; category?: string; is_active?: boolean }>> => {
      try {
        if (!template.title || !template.content) {
          throw new Error('Template title and content are required');
        }
        return await ipcRenderer.invoke('templates:upsert', template);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    },
    delete: async (id: string): Promise<IPCResponse<boolean>> => {
      try {
        if (!id) {
          throw new Error('Template ID is required');
        }
        return await ipcRenderer.invoke('templates:delete', id);
      } catch (error) {
        return createErrorResponse(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
});

const electronAPI = createElectronAPI();

// データ同期API の型定義
interface SyncAPI {
  onSyncStart: (callback: () => void) => () => void;
  onSyncProgress: (callback: (progress: number) => void) => () => void;
  onSyncComplete: (callback: (result: { success: boolean; message?: string; data?: unknown }) => void) => () => void;
  onSyncError: (callback: (error: string) => void) => () => void;
}

// データ同期イベントリスナー
const createSyncAPI = (): SyncAPI => ({
  onSyncStart: (callback: () => void) => {
    ipcRenderer.on('sync:start', callback);
    return () => ipcRenderer.removeListener('sync:start', callback);
  },
  
  onSyncProgress: (callback: (progress: number) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, progress: number) => callback(progress);
    ipcRenderer.on('sync:progress', handler);
    return () => ipcRenderer.removeListener('sync:progress', handler);
  },
  
  onSyncComplete: (callback: (result: { success: boolean; message?: string; data?: unknown }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, result: { success: boolean; message?: string; data?: unknown }) => callback(result);
    ipcRenderer.on('sync:complete', handler);
    return () => ipcRenderer.removeListener('sync:complete', handler);
  },
  
  onSyncError: (callback: (error: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on('sync:error', handler);
    return () => ipcRenderer.removeListener('sync:error', handler);
  }
});

const syncAPI = createSyncAPI();

// プラットフォーム情報の型定義
interface PlatformInfo {
  isElectron: true;
  platform: string;
  arch: string;
  node: string;
  electron: string;
}

interface DebugAPI {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  versions: NodeJS.ProcessVersions;
}

// エラーハンドリング付きでAPIを公開
try {
  contextBridge.exposeInMainWorld('electronAPI', electronAPI);
  contextBridge.exposeInMainWorld('syncAPI', syncAPI);

  // 実行環境情報
  const platformInfo: PlatformInfo = {
    isElectron: true,
    platform: process.platform,
    arch: process.arch,
    node: process.versions.node,
    electron: process.versions.electron
  };
  
  contextBridge.exposeInMainWorld('platform', platformInfo);

  // デバッグ情報（開発環境のみ）
  if (process.env.NODE_ENV === 'development') {
    const debugAPI: DebugAPI = {
      log: (...args: unknown[]) => console.log('[Preload]', ...args),
      error: (...args: unknown[]) => console.error('[Preload]', ...args),
      versions: process.versions
    };
    
    contextBridge.exposeInMainWorld('debug', debugAPI);
  }
  
  console.log('[Preload] APIs successfully exposed');
} catch (error) {
  console.error('[Preload] Failed to expose APIs:', error);
}

// Global type declarations for renderer process
declare global {
  interface Window {
    electronAPI: ElectronAPI;
    syncAPI: SyncAPI;
    platform: PlatformInfo;
    debug?: DebugAPI;
  }
}

// Type exports for TypeScript modules
export type { 
  ElectronAPI, 
  SyncAPI, 
  PlatformInfo, 
  DebugAPI,
  FileSelectOptions,
  FileSelectResult,
  SaveDialogOptions,
  SaveDialogResult,
  BackendRequestOptions
};