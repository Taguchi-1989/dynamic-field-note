import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { performance } from 'perf_hooks';
import * as dotenv from 'dotenv';

// 環境変数を確実に読み込む
dotenv.config();
console.log('📋 Environment loaded:', {
  GEMINI_KEY: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set',
  OPENAI_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Not set'
});
import { WindowManager } from './services/window-manager';
// Backend manager removed - using direct services
import { WorkspaceService } from './services/WorkspaceService';
import { DbService } from './services/DbService';
import { MarkdownCompilerService } from './services/MarkdownCompilerService';
import { MermaidRenderWorker } from './services/MermaidRenderWorker';
import { PdfGenerationService } from './services/PdfGenerationService';
import { SecureStorageService } from './services/SecureStorageService';
import { PdfJobService } from './services/PdfJobService';
import { SyncService } from './services/SyncService';
import { SearchService } from './services/SearchService';
import { AIProcessingService } from './services/AIProcessingService';
import { SecurityPolicy } from './security/security-policy';
import { setupFileHandler } from './ipc/file-handler';
import { setupStorageHandler } from './ipc/storage-handler';
import { setupWorkspaceHandler } from './ipc/workspace-handler';
import { registerTemplateHandlers } from './ipc/template-handler';

// パフォーマンス測定
const startTime = performance.now();

// マネージャー・サービス初期化
const windowManager = new WindowManager();
// Backend manager removed
const workspaceService = WorkspaceService.getInstance();
const dbService = DbService.getInstance();
const markdownCompiler = MarkdownCompilerService.getInstance();
const mermaidWorker = MermaidRenderWorker.getInstance();
const pdfGenerationService = PdfGenerationService.getInstance();
const secureStorageService = SecureStorageService.getInstance();
const pdfJobService = PdfJobService.getInstance();
const syncService = SyncService.getInstance();
const searchService = SearchService.getInstance();
const aiProcessingService = AIProcessingService.getInstance();
const securityPolicy = SecurityPolicy.getInstance();

// Phase 0: セキュリティポリシー事前初期化（app.ready前に必須）
console.log('🔒 Pre-initializing security protocols...');
securityPolicy.setupProtocolsBeforeReady();

// アプリケーションの準備完了
app.whenReady().then(async () => {
  console.log('🚀 Electron application starting...');
  
  try {
    // Phase 0: セキュリティポリシー初期化（残り部分）
    console.log('🔒 Completing security policy initialization...');
    await securityPolicy.initialize();
    
    // Phase 1: ワークスペース初期化
    console.log('📁 Initializing workspace...');
    await workspaceService.initIfNeeded();
    
    // Phase 2: データベース初期化
    console.log('🗄️ Initializing database...');
    await dbService.initialize();
    
    // Phase 2.5: セキュアストレージ初期化
    console.log('🔐 Initializing secure storage...');
    await secureStorageService.initialize();
    
    // Phase 2.7: ジョブサービス初期化
    console.log('🏭 Initializing job service...');
    await pdfJobService.initialize();
    
    // Phase 2.8: 同期サービス初期化（任意）
    console.log('🔄 Initializing sync service...');
    await syncService.initialize();
    
    // Phase 2.9: 検索サービス初期化
    console.log('🔍 Initializing search service...');
    await searchService.initialize();
    
    // Phase 3: Skip backend services (using direct APIs)
    console.log('⚙️ Backend services disabled (using direct APIs)...');
    
    // Phase 4: IPC ハンドラーセットアップ
    console.log('🔌 Setting up IPC handlers...');
    setupFileHandler();
    setupStorageHandler();
    // setupBackendBridge(backendManager); // Removed
    setupWorkspaceHandler();
    registerTemplateHandlers(); // テンプレート管理ハンドラー登録
    setupDatabaseHandlers();
    setupMarkdownHandlers();
    setupSecureStorageHandlers();
    setupJobsHandlers();
    setupSyncHandlers();
    setupSearchHandlers();
    setupAIHandlers();
    
    // Phase 5: メインウィンドウ作成
    console.log('🪟 Creating main window...');
    await windowManager.createMainWindow();
    
    // パフォーマンス測定
    const totalTime = performance.now() - startTime;
    console.log(`✅ Application ready in ${totalTime.toFixed(2)}ms`);
    
  } catch (error) {
    console.error('❌ Application startup failed:', error);
    app.quit();
  }

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await windowManager.createMainWindow();
    }
  });
});

// すべてのウィンドウが閉じられた時の処理
app.on('window-all-closed', async () => {
  console.log('🪟 All windows closed, cleaning up...');
  await cleanupServices();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// アプリケーション終了前のクリーンアップ
app.on('before-quit', async () => {
  console.log('🛑 Application shutting down...');
  await cleanupServices();
});

/**
 * サービスのクリーンアップ
 */
async function cleanupServices(): Promise<void> {
  try {
    await syncService.shutdown();
    await pdfJobService.shutdown();
    // Backend services stop - removed
    dbService.close();
    mermaidWorker.destroy();
    console.log('✅ Services cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// セキュリティ強化：外部URLからの読み込みを制限
app.on('web-contents-created', (event, contents) => {
  contents.setWindowOpenHandler(({ url }) => {
    console.warn('Blocked external navigation:', url);
    return { action: 'deny' };
  });
});

/**
 * Workspace API IPCハンドラー
 */
function setupWorkspaceHandlers(): void {
  // ワークスペース解決
  ipcMain.handle('workspace:resolve', async () => {
    try {
      return await workspaceService.resolve();
    } catch (error) {
      console.error('Workspace resolve error:', error);
      throw new Error(`Failed to resolve workspace: ${error}`);
    }
  });

  // 初期化チェック
  ipcMain.handle('workspace:init-if-needed', async () => {
    try {
      return await workspaceService.initIfNeeded();
    } catch (error) {
      console.error('Workspace init error:', error);
      throw new Error(`Failed to initialize workspace: ${error}`);
    }
  });

  // ワークスペース設定取得
  ipcMain.handle('workspace:get-config', async () => {
    try {
      return await workspaceService.getWorkspaceConfig();
    } catch (error) {
      console.error('Get workspace config error:', error);
      throw new Error(`Failed to get workspace config: ${error}`);
    }
  });

  // アプリケーション設定取得
  ipcMain.handle('workspace:get-app-config', async () => {
    try {
      return await workspaceService.getAppConfig();
    } catch (error) {
      console.error('Get app config error:', error);
      throw new Error(`Failed to get app config: ${error}`);
    }
  });

  // アプリケーション設定更新
  ipcMain.handle('workspace:update-app-config', async (event, updates) => {
    try {
      await workspaceService.updateAppConfig(updates);
    } catch (error) {
      console.error('Update app config error:', error);
      throw new Error(`Failed to update app config: ${error}`);
    }
  });

  console.log('✅ Workspace IPC handlers registered');
}

/**
 * Database API IPCハンドラー
 */
function setupDatabaseHandlers(): void {
  // ヘルスチェック
  ipcMain.handle('database:health-check', () => {
    try {
      return dbService.healthCheck();
    } catch (error) {
      console.error('Database health check error:', error);
      return { ok: false, message: `Health check failed: ${error}` };
    }
  });

  // 統計情報取得
  ipcMain.handle('database:get-stats', () => {
    try {
      return dbService.getStats();
    } catch (error) {
      console.error('Database stats error:', error);
      throw new Error(`Failed to get database stats: ${error}`);
    }
  });

  console.log('✅ Database IPC handlers registered');
}

/**
 * Jobs API IPCハンドラー（Phase 4実装完了）
 */
function setupJobsHandlers(): void {
  // ジョブエンキュー
  ipcMain.handle('jobs:enqueue', async (event, job) => {
    try {
      const result = await pdfJobService.enqueue(job);
      return { success: true, data: result };
    } catch (error) {
      console.error('Job enqueue error:', error);
      return {
        success: false,
        error: {
          name: 'JobEnqueueError',
          message: error instanceof Error ? error.message : 'Failed to enqueue job'
        }
      };
    }
  });

  // ジョブステータス取得
  ipcMain.handle('jobs:get-status', async (event, id) => {
    try {
      const status = await pdfJobService.getStatus(id);
      return { success: true, data: status };
    } catch (error) {
      console.error('Get job status error:', error);
      return {
        success: false,
        error: {
          name: 'GetJobStatusError',
          message: error instanceof Error ? error.message : 'Failed to get job status'
        }
      };
    }
  });

  // ジョブキャンセル
  ipcMain.handle('jobs:cancel', async (event, id) => {
    try {
      await pdfJobService.cancel(id);
      return { success: true };
    } catch (error) {
      console.error('Cancel job error:', error);
      return {
        success: false,
        error: {
          name: 'CancelJobError',
          message: error instanceof Error ? error.message : 'Failed to cancel job'
        }
      };
    }
  });

  // ジョブ統計取得
  ipcMain.handle('jobs:get-stats', async (event) => {
    try {
      const stats = pdfJobService.getJobStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('Get job stats error:', error);
      return {
        success: false,
        error: {
          name: 'GetJobStatsError',
          message: error instanceof Error ? error.message : 'Failed to get job stats'
        }
      };
    }
  });

  console.log('✅ Jobs IPC handlers registered (Phase 4 complete)');
}

/**
 * Markdown API IPCハンドラー（Phase 2実装完了）
 */
function setupMarkdownHandlers(): void {
  ipcMain.handle('markdown:compile-to-pdf', async (event, input) => {
    try {
      console.log('📄 PDF generation requested:', { inputLength: input?.mdContent?.length });
      const result = await pdfGenerationService.generatePdfFromMarkdown(input);
      console.log('✅ PDF generated successfully:', result);
      
      // 成功レスポンスを明示的に返す
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Markdown compile error:', error);
      // エラーレスポンスを明示的に返す
      return {
        success: false,
        error: {
          name: 'PDFGenerationError',
          message: error instanceof Error ? error.message : 'Failed to compile markdown'
        }
      };
    }
  });

  // テスト用エンドポイント
  ipcMain.handle('markdown:test-pdf', async (event) => {
    try {
      return await pdfGenerationService.testPdfGeneration();
    } catch (error) {
      console.error('PDF test error:', error);
      throw new Error(`Failed to test PDF generation: ${error}`);
    }
  });

  // Mermaidキャッシュ管理
  ipcMain.handle('mermaid:clear-cache', async (event) => {
    try {
      await mermaidWorker.clearCache();
      return { success: true };
    } catch (error) {
      console.error('Mermaid cache clear error:', error);
      throw new Error(`Failed to clear Mermaid cache: ${error}`);
    }
  });

  ipcMain.handle('mermaid:get-cache-stats', async (event) => {
    try {
      return await mermaidWorker.getCacheStats();
    } catch (error) {
      console.error('Mermaid cache stats error:', error);
      throw new Error(`Failed to get Mermaid cache stats: ${error}`);
    }
  });

  console.log('✅ Markdown IPC handlers registered (Phase 2 complete)');
}

/**
 * Secure Storage API IPCハンドラー（Phase 3実装完了）
 */
function setupSecureStorageHandlers(): void {
  // 認証情報設定
  ipcMain.handle('secure:set-credential', async (event, input) => {
    try {
      await secureStorageService.setCredential(
        input.id,
        input.type,
        input.service,
        input.account,
        input.value,
        {
          encrypted: input.encrypted,
          metadata: input.metadata
        }
      );
      return { success: true };
    } catch (error) {
      console.error('Set credential error:', error);
      return {
        success: false,
        error: {
          name: 'SetCredentialError',
          message: error instanceof Error ? error.message : 'Failed to set credential'
        }
      };
    }
  });

  // 認証情報取得
  ipcMain.handle('secure:get-credential', async (event, id, account) => {
    try {
      const credential = await secureStorageService.getCredential(id, account);
      return { success: true, data: credential };
    } catch (error) {
      console.error('Get credential error:', error);
      return {
        success: false,
        error: {
          name: 'GetCredentialError',
          message: error instanceof Error ? error.message : 'Failed to get credential'
        }
      };
    }
  });

  // 認証情報削除
  ipcMain.handle('secure:delete-credential', async (event, id, account) => {
    try {
      const deleted = await secureStorageService.deleteCredential(id, account);
      return { success: true, data: deleted };
    } catch (error) {
      console.error('Delete credential error:', error);
      return {
        success: false,
        error: {
          name: 'DeleteCredentialError',
          message: error instanceof Error ? error.message : 'Failed to delete credential'
        }
      };
    }
  });

  // 認証情報一覧取得
  ipcMain.handle('secure:list-credentials', async (event) => {
    try {
      const credentials = await secureStorageService.listCredentials();
      return { success: true, data: credentials };
    } catch (error) {
      console.error('List credentials error:', error);
      return {
        success: false,
        error: {
          name: 'ListCredentialsError',
          message: error instanceof Error ? error.message : 'Failed to list credentials'
        }
      };
    }
  });

  // API設定
  ipcMain.handle('secure:set-api-config', async (event, config) => {
    try {
      await secureStorageService.setApiConfig(config);
      return { success: true };
    } catch (error) {
      console.error('Set API config error:', error);
      return {
        success: false,
        error: {
          name: 'SetApiConfigError',
          message: error instanceof Error ? error.message : 'Failed to set API config'
        }
      };
    }
  });

  // API設定ステータス取得
  ipcMain.handle('secure:get-api-config-status', async (event) => {
    try {
      const status = await secureStorageService.getApiConfigStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error('Get API config status error:', error);
      return {
        success: false,
        error: {
          name: 'GetApiConfigStatusError',
          message: error instanceof Error ? error.message : 'Failed to get API config status'
        }
      };
    }
  });

  // ヘルスチェック
  ipcMain.handle('secure:health-check', async (event) => {
    try {
      const health = await secureStorageService.healthCheck();
      return { success: true, data: health };
    } catch (error) {
      console.error('Secure storage health check error:', error);
      return {
        success: false,
        error: {
          name: 'SecureStorageHealthError',
          message: error instanceof Error ? error.message : 'Health check failed'
        }
      };
    }
  });

  console.log('✅ Secure Storage IPC handlers registered (Phase 3 complete)');
}

/**
 * Sync API IPCハンドラー（Phase 5実装完了）
 */
function setupSyncHandlers(): void {
  // 手動同期実行
  ipcMain.handle('sync:synchronize', async (event) => {
    try {
      const result = await syncService.synchronize();
      return { success: true, data: result };
    } catch (error) {
      console.error('Sync error:', error);
      return {
        success: false,
        error: {
          name: 'SyncError',
          message: error instanceof Error ? error.message : 'Sync failed'
        }
      };
    }
  });

  // 同期状態取得
  ipcMain.handle('sync:get-status', async (event) => {
    try {
      const status = syncService.getSyncStatus();
      return { success: true, data: status };
    } catch (error) {
      console.error('Get sync status error:', error);
      return {
        success: false,
        error: {
          name: 'GetSyncStatusError',
          message: error instanceof Error ? error.message : 'Failed to get sync status'
        }
      };
    }
  });

  // 同期設定更新
  ipcMain.handle('sync:update-config', async (event, updates) => {
    try {
      await syncService.updateSyncConfig(updates);
      return { success: true };
    } catch (error) {
      console.error('Update sync config error:', error);
      return {
        success: false,
        error: {
          name: 'UpdateSyncConfigError',
          message: error instanceof Error ? error.message : 'Failed to update sync config'
        }
      };
    }
  });

  // 変更記録
  ipcMain.handle('sync:record-change', async (event, entity, entity_id, operation, data) => {
    try {
      await syncService.recordChange(entity, entity_id, operation, data);
      return { success: true };
    } catch (error) {
      console.error('Record change error:', error);
      return {
        success: false,
        error: {
          name: 'RecordChangeError',
          message: error instanceof Error ? error.message : 'Failed to record change'
        }
      };
    }
  });

  console.log('✅ Sync IPC handlers registered (Phase 5 complete)');
}

/**
 * Search API IPCハンドラー（Phase 5実装完了）
 */
function setupSearchHandlers(): void {
  // 検索実行
  ipcMain.handle('search:search', async (event, query) => {
    try {
      const result = await searchService.search(query);
      return { success: true, data: result };
    } catch (error) {
      console.error('Search error:', error);
      return {
        success: false,
        error: {
          name: 'SearchError',
          message: error instanceof Error ? error.message : 'Search failed'
        }
      };
    }
  });

  // 埋め込み生成
  ipcMain.handle('search:generate-embedding', async (event, entity, entity_id, content, force = false) => {
    try {
      const result = await searchService.generateEmbedding(entity, entity_id, content, force);
      return { success: true, data: result };
    } catch (error) {
      console.error('Generate embedding error:', error);
      return {
        success: false,
        error: {
          name: 'GenerateEmbeddingError',
          message: error instanceof Error ? error.message : 'Failed to generate embedding'
        }
      };
    }
  });

  // インデックス再構築
  ipcMain.handle('search:rebuild-indexes', async (event) => {
    try {
      const result = await searchService.rebuildIndexes();
      return { success: true, data: result };
    } catch (error) {
      console.error('Rebuild indexes error:', error);
      return {
        success: false,
        error: {
          name: 'RebuildIndexesError',
          message: error instanceof Error ? error.message : 'Failed to rebuild indexes'
        }
      };
    }
  });

  // 検索統計取得
  ipcMain.handle('search:get-stats', async (event) => {
    try {
      const stats = await searchService.getSearchStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('Get search stats error:', error);
      return {
        success: false,
        error: {
          name: 'GetSearchStatsError',
          message: error instanceof Error ? error.message : 'Failed to get search stats'
        }
      };
    }
  });

  console.log('✅ Search IPC handlers registered (Phase 5 complete)');
}

/**
 * AI Processing API IPCハンドラー（オフライン統合完了）
 */
function setupAIHandlers(): void {
  // テキスト処理
  ipcMain.handle('ai:process-text', async (event, inputText, templateId, customPrompt, options) => {
    try {
      const result = await aiProcessingService.processText(inputText, templateId, customPrompt, options);
      return { success: true, data: result };
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        success: false,
        error: {
          name: 'AIProcessingError',
          message: error instanceof Error ? error.message : 'AI processing failed'
        }
      };
    }
  });

  // テキスト再修正
  ipcMain.handle('ai:revise-text', async (event, originalText, revisionNotes, options) => {
    try {
      const result = await aiProcessingService.reviseText(originalText, revisionNotes, options);
      return { success: true, data: result };
    } catch (error) {
      console.error('AI revision error:', error);
      return {
        success: false,
        error: {
          name: 'AIRevisionError',
          message: error instanceof Error ? error.message : 'AI revision failed'
        }
      };
    }
  });

  // 利用可能プロバイダー取得
  ipcMain.handle('ai:get-providers', async (event) => {
    try {
      const providers = await aiProcessingService.getAvailableProviders();
      return { success: true, data: providers };
    } catch (error) {
      console.error('Get AI providers error:', error);
      return {
        success: false,
        error: {
          name: 'GetProvidersError',
          message: error instanceof Error ? error.message : 'Failed to get providers'
        }
      };
    }
  });

  console.log('✅ AI Processing IPC handlers registered (完全オフライン対応完了)');
}

export { windowManager, workspaceService, dbService, secureStorageService, syncService, searchService, aiProcessingService };