import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';

// アプリケーション設定の保存先
const getConfigPath = () => path.join(app.getPath('userData'), 'config');
const getStorageFilePath = (filename: string) => path.join(getConfigPath(), filename);

export function setupStorageHandler(): void {
  // 設定値取得
  ipcMain.handle('storage:get', async (event, key: string) => {
    try {
      const configPath = getStorageFilePath('app-config.json');
      
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content);
        return config[key] || null;
      } catch (error) {
        // ファイルが存在しない場合はnullを返す
        if ((error as any).code === 'ENOENT') {
          return null;
        }
        throw error;
      }
    } catch (error) {
      console.error('Storage get error:', error);
      throw new Error(`Failed to get storage value: ${error}`);
    }
  });

  // 設定値保存
  ipcMain.handle('storage:set', async (event, key: string, value: any) => {
    try {
      const configPath = getStorageFilePath('app-config.json');
      const configDir = path.dirname(configPath);
      
      // 設定ディレクトリを作成
      await fs.mkdir(configDir, { recursive: true });
      
      // 既存設定を読み込み
      let config = {};
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(content);
      } catch (error) {
        // ファイルが存在しない場合は空のオブジェクトで開始
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }
      
      // 値を更新
      (config as any)[key] = value;
      
      // ファイルに保存
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      
      return { success: true };
    } catch (error) {
      console.error('Storage set error:', error);
      throw new Error(`Failed to set storage value: ${error}`);
    }
  });

  // 設定値削除
  ipcMain.handle('storage:delete', async (event, key: string) => {
    try {
      const configPath = getStorageFilePath('app-config.json');
      
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(content);
        
        if (key in config) {
          delete config[key];
          await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
        }
        
        return { success: true };
      } catch (error) {
        if ((error as any).code === 'ENOENT') {
          return { success: true }; // ファイルが存在しない場合も成功扱い
        }
        throw error;
      }
    } catch (error) {
      console.error('Storage delete error:', error);
      throw new Error(`Failed to delete storage value: ${error}`);
    }
  });

  // 全設定値取得
  ipcMain.handle('storage:get-all', async (event) => {
    try {
      const configPath = getStorageFilePath('app-config.json');
      
      try {
        const content = await fs.readFile(configPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        if ((error as any).code === 'ENOENT') {
          return {}; // ファイルが存在しない場合は空オブジェクト
        }
        throw error;
      }
    } catch (error) {
      console.error('Storage get-all error:', error);
      throw new Error(`Failed to get all storage values: ${error}`);
    }
  });

  // 全設定値削除
  ipcMain.handle('storage:clear', async (event) => {
    try {
      const configPath = getStorageFilePath('app-config.json');
      
      try {
        await fs.unlink(configPath);
      } catch (error) {
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Storage clear error:', error);
      throw new Error(`Failed to clear storage: ${error}`);
    }
  });

  console.log('💾 Storage handler IPC registered');
}