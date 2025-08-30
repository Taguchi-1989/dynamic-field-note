/**
 * Workspace IPC Handler
 * WorkspaceServiceのIPC通信を処理
 */

import { ipcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { WorkspaceService } from '../services/WorkspaceService';
import { 
  WorkspaceInfoSchema,
  WorkspaceSelectDirectoryResultSchema,
  WorkspaceSwitchResultSchema,
  WorkspaceInitializeResultSchema,
  WorkspaceBackupResultSchema
} from '../../shared/ipc-schemas';

export function setupWorkspaceHandler(): void {
  const workspaceService = WorkspaceService.getInstance();

  // ワークスペース情報取得
  ipcMain.handle('workspace:getInfo', async () => {
    try {
      const workspace = await workspaceService.resolve();
      const workspacePath = workspace.root;
      const stats = await fs.stat(workspacePath);
      
      // ディスク使用量の計算
      const diskUsage = await calculateDiskUsage(workspacePath);
      
      // ポータブルかどうかの判定
      const isPortable = workspacePath.includes('portable') || 
                        process.env.GIJIROKU_WORKSPACE_PATH !== undefined;
      
      // 書き込み権限チェック
      const canWrite = await checkWritePermission(workspacePath);
      
      // バージョン情報の取得
      const version = await getWorkspaceVersion(workspacePath);
      
      const info = {
        root: workspacePath,
        paths: workspace.paths || {
          attachments: path.join(workspacePath, 'attachments'),
          exports: path.join(workspacePath, 'exports'),
          templates: path.join(workspacePath, 'templates'),
          data: path.join(workspacePath, 'data')
        },
        currentPath: workspacePath,
        isPortable,
        canWrite,
        diskUsage,
        version: String(version), // 文字列として確実に変換
        lastModified: stats.mtime.toISOString()
      };

      return WorkspaceInfoSchema.parse(info);
    } catch (error) {
      console.error('Workspace getInfo error:', error);
      throw new Error(`Failed to get workspace info: ${(error as Error).message}`);
    }
  });

  // ディレクトリ選択
  ipcMain.handle('workspace:selectDirectory', async (event) => {
    try {
      const result = await dialog.showOpenDialog({
        title: '新しいワークスペースディレクトリを選択',
        properties: ['openDirectory', 'createDirectory'],
        buttonLabel: '選択'
      });

      if (result.canceled || !result.filePaths.length) {
        return WorkspaceSelectDirectoryResultSchema.parse({
          success: false
        });
      }

      return WorkspaceSelectDirectoryResultSchema.parse({
        success: true,
        path: result.filePaths[0]
      });
    } catch (error) {
      console.error('Workspace selectDirectory error:', error);
      return WorkspaceSelectDirectoryResultSchema.parse({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // ワークスペース切り替え
  ipcMain.handle('workspace:switchTo', async (event, newPath: string) => {
    try {
      // パスの検証
      const resolvedPath = path.resolve(newPath);
      
      // ディレクトリの存在確認
      try {
        await fs.access(resolvedPath);
      } catch {
        // ディレクトリが存在しない場合は作成
        await fs.mkdir(resolvedPath, { recursive: true });
      }

      // 新しいワークスペースとして設定（環境変数または設定ファイル更新）
      process.env.GIJIROKU_WORKSPACE_PATH = resolvedPath;
      
      // ワークスペースの初期化
      await workspaceService.initIfNeeded();

      return WorkspaceSwitchResultSchema.parse({
        success: true
      });
    } catch (error) {
      console.error('Workspace switchTo error:', error);
      return WorkspaceSwitchResultSchema.parse({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // ワークスペース初期化
  ipcMain.handle('workspace:initialize', async () => {
    try {
      await workspaceService.initIfNeeded();

      return WorkspaceInitializeResultSchema.parse({
        success: true
      });
    } catch (error) {
      console.error('Workspace initialize error:', error);
      return WorkspaceInitializeResultSchema.parse({
        success: false,
        error: (error as Error).message
      });
    }
  });

  // ワークスペースバックアップ
  ipcMain.handle('workspace:backup', async () => {
    try {
      const workspace = await workspaceService.resolve();
      const workspacePath = workspace.root;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `workspace-backup-${timestamp}`;
      
      // バックアップ先の選択
      const result = await dialog.showSaveDialog({
        title: 'バックアップ先を選択',
        defaultPath: backupName,
        filters: [
          { name: 'ZIP Files', extensions: ['zip'] }
        ]
      });

      if (result.canceled || !result.filePath) {
        return WorkspaceBackupResultSchema.parse({
          success: false,
          error: 'バックアップがキャンセルされました'
        });
      }

      // バックアップの実行（シンプルなフォルダコピー）
      const backupPath = result.filePath.replace(/\.zip$/, '');
      await copyDirectory(workspacePath, backupPath);

      return WorkspaceBackupResultSchema.parse({
        success: true,
        backupPath
      });
    } catch (error) {
      console.error('Workspace backup error:', error);
      return WorkspaceBackupResultSchema.parse({
        success: false,
        error: (error as Error).message
      });
    }
  });
}

// ヘルパー関数

async function calculateDiskUsage(dirPath: string): Promise<{ used: number; available: number }> {
  try {
    const used = await getDirectorySize(dirPath);
    const stats = await fs.statfs(dirPath);
    const available = stats.bavail * stats.bsize;
    
    return { used, available };
  } catch {
    return { used: 0, available: 0 };
  }
}

async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        totalSize += await getDirectorySize(itemPath);
      } else if (item.isFile()) {
        const stats = await fs.stat(itemPath);
        totalSize += stats.size;
      }
    }
  } catch {
    // エラーは無視（権限不足など）
  }

  return totalSize;
}

async function checkWritePermission(dirPath: string): Promise<boolean> {
  try {
    const testFile = path.join(dirPath, '.write-test');
    await fs.writeFile(testFile, 'test');
    await fs.unlink(testFile);
    return true;
  } catch {
    return false;
  }
}

async function getWorkspaceVersion(workspacePath: string): Promise<string> {
  try {
    const configPath = path.join(workspacePath, 'config', 'workspace.json');
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    return config.version || '1.0.0';
  } catch {
    return '1.0.0';
  }
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  
  const items = await fs.readdir(src, { withFileTypes: true });
  
  for (const item of items) {
    const srcPath = path.join(src, item.name);
    const destPath = path.join(dest, item.name);
    
    if (item.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (item.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}