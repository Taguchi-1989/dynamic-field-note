import { ipcMain, dialog, BrowserWindow, app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export function setupFileHandler(): void {
  // ファイル選択ダイアログ
  ipcMain.handle('file:select', async (event, options) => {
    try {
      const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender)!, {
        properties: ['openFile'],
        filters: [
          { name: 'VTT Files', extensions: ['vtt'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        ...options
      });

      if (result.canceled) {
        return { canceled: true };
      }

      return { 
        canceled: false, 
        filePaths: result.filePaths,
        filePath: result.filePaths[0] 
      };
    } catch (error) {
      console.error('File selection error:', error);
      throw new Error(`File selection failed: ${error}`);
    }
  });

  // ファイル読み込み
  ipcMain.handle('file:read', async (event, filePath: string) => {
    try {
      if (!filePath) {
        throw new Error('File path is required');
      }

      // セキュリティチェック：危険なパスを拒否
      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.includes('..')) {
        throw new Error('Invalid file path');
      }

      const content = await fs.readFile(normalizedPath, 'utf-8');
      const stats = await fs.stat(normalizedPath);
      
      return {
        content,
        size: stats.size,
        lastModified: stats.mtime,
        filename: path.basename(normalizedPath)
      };
    } catch (error) {
      console.error('File read error:', error);
      throw new Error(`Failed to read file: ${error}`);
    }
  });

  // ファイル書き込み
  ipcMain.handle('file:write', async (event, filePath: string, content: string) => {
    try {
      if (!filePath || content === undefined) {
        throw new Error('File path and content are required');
      }

      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.includes('..')) {
        throw new Error('Invalid file path');
      }

      // ディレクトリが存在しない場合は作成
      const directory = path.dirname(normalizedPath);
      await fs.mkdir(directory, { recursive: true });

      await fs.writeFile(normalizedPath, content, 'utf-8');
      
      return { 
        success: true, 
        filePath: normalizedPath,
        size: Buffer.byteLength(content, 'utf-8')
      };
    } catch (error) {
      console.error('File write error:', error);
      throw new Error(`Failed to write file: ${error}`);
    }
  });

  // ファイル保存ダイアログ
  ipcMain.handle('file:save-dialog', async (event, options) => {
    try {
      const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender)!, {
        filters: [
          { name: 'PDF Files', extensions: ['pdf'] },
          { name: 'Text Files', extensions: ['txt'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: options?.defaultPath || 'document',
        ...options
      });

      const saveResult = {
        canceled: result.canceled,
        filePath: result.filePath
      };

      return {
        success: true,
        data: saveResult
      };
    } catch (error) {
      console.error('Save dialog error:', error);
      return {
        success: false,
        error: {
          message: `Save dialog failed: ${error}`,
          code: 'SAVE_DIALOG_ERROR'
        }
      };
    }
  });

  // ファイル存在チェック
  ipcMain.handle('file:exists', async (event, filePath: string) => {
    try {
      const normalizedPath = path.normalize(filePath);
      await fs.access(normalizedPath);
      return true;
    } catch {
      return false;
    }
  });

  // ファイルコピー
  ipcMain.handle('file:copy', async (event, srcPath: string, destPath: string) => {
    try {
      if (!srcPath || !destPath) {
        throw new Error('Source and destination paths are required');
      }

      const normalizedSrc = path.normalize(srcPath);
      const normalizedDest = path.normalize(destPath);

      // セキュリティチェック：危険なパスを拒否
      if (normalizedSrc.includes('..') || normalizedDest.includes('..')) {
        throw new Error('Invalid file path');
      }

      // コピー先ディレクトリが存在しない場合は作成
      const destDirectory = path.dirname(normalizedDest);
      await fs.mkdir(destDirectory, { recursive: true });

      // ファイルをコピー
      await fs.copyFile(normalizedSrc, normalizedDest);

      const stats = await fs.stat(normalizedDest);
      
      return {
        success: true,
        data: {
          srcPath: normalizedSrc,
          destPath: normalizedDest,
          size: stats.size
        }
      };
    } catch (error) {
      console.error('File copy error:', error);
      return {
        success: false,
        error: {
          message: `Failed to copy file: ${error}`,
          code: 'FILE_COPY_ERROR'
        }
      };
    }
  });

  // プロンプトテンプレートの読み込み（旧実装 - template-handler.tsに移行済み）
  // REMOVED: file:load-prompts handler - now handled by template-handler.ts

  // Downloadsフォルダにファイルをコピー
  ipcMain.handle('file:copy-to-downloads', async (event, srcPath: string, filename: string) => {
    try {
      if (!srcPath || !filename) {
        throw new Error('Source path and filename are required');
      }

      const normalizedSrc = path.normalize(srcPath);
      
      // セキュリティチェック：危険なパスを拒否
      if (normalizedSrc.includes('..')) {
        throw new Error('Invalid source file path');
      }

      // Downloadsフォルダのパスを取得
      const downloadsPath = path.join(os.homedir(), 'Downloads', filename);
      
      // ファイルロック対策: 少し待ってからコピー
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 既存ファイルがある場合は削除
      try {
        await fs.access(downloadsPath);
        await fs.unlink(downloadsPath);
        console.log('🗑️ Existing file removed:', downloadsPath);
      } catch (error) {
        // ファイルが存在しない場合は無視
      }
      
      // ファイルをコピー（リトライ機能付き）
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          await fs.copyFile(normalizedSrc, downloadsPath);
          console.log('✅ File copied successfully:', downloadsPath);
          break;
        } catch (error) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw error;
          }
          console.log(`⚠️ Copy retry ${retryCount}/${maxRetries}:`, error);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const stats = await fs.stat(downloadsPath);
      
      return {
        success: true,
        data: {
          destPath: downloadsPath,
          size: stats.size
        }
      };
    } catch (error) {
      console.error('Copy to Downloads error:', error);
      return {
        success: false,
        error: {
          message: `Failed to copy to Downloads: ${error}`,
          code: 'DOWNLOADS_COPY_ERROR'
        }
      };
    }
  });

  console.log('📂 File handler IPC registered');
}