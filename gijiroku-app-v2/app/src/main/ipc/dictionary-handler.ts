/**
 * Dictionary IPC Handler
 * 成功プラクティス（template-handler.ts）準拠の辞書機能管理
 */

import { ipcMain } from 'electron';
import { DbService, DictionaryEntry } from '../services/DbService';
import { v4 as uuidv4 } from 'uuid';

// IPCレスポンス型
interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// 辞書エントリ型（フロントエンドとの互換性のため）
interface DictionaryEntryData {
  id?: string;
  original: string;
  corrected: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

/**
 * 辞書IPCハンドラーを登録
 */
export function registerDictionaryHandlers(): void {
  const dbService = DbService.getInstance();

  /**
   * 辞書エントリ一覧取得
   */
  ipcMain.handle('dictionary:list', async (): Promise<IPCResponse<DictionaryEntry[]>> => {
    try {
      console.log('📚 Dictionary: リスト取得開始');
      
      // DBから取得
      const entries = dbService.getDictionaryEntries(true); // activeOnlyフラグをtrueに
      
      // DBにエントリがない場合、初期シードを実行
      if (entries.length === 0) {
        console.log('📚 Dictionary: DBが空のため初期シード実行');
        await seedInitialDictionaryEntries();
        const seededEntries = dbService.getDictionaryEntries(true);
        return {
          success: true,
          data: seededEntries
        };
      }
      
      console.log(`📚 Dictionary: ${entries.length}件取得完了`);
      return {
        success: true,
        data: entries
      };
    } catch (error) {
      console.error('❌ Dictionary: リスト取得エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '辞書一覧の取得に失敗しました'
      };
    }
  });

  /**
   * 辞書エントリ個別取得
   */
  ipcMain.handle('dictionary:get', async (_, id: string): Promise<IPCResponse<DictionaryEntry>> => {
    try {
      console.log('📚 Dictionary: 個別取得:', id);
      
      const entry = dbService.getDictionaryEntryById(id);
      
      if (!entry) {
        return {
          success: false,
          error: `辞書エントリ(ID: ${id})が見つかりません`
        };
      }
      
      return {
        success: true,
        data: entry
      };
    } catch (error) {
      console.error('❌ Dictionary: 個別取得エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '辞書エントリの取得に失敗しました'
      };
    }
  });

  /**
   * 辞書エントリ作成・更新
   */
  ipcMain.handle('dictionary:upsert', async (_, entry: DictionaryEntryData): Promise<IPCResponse<DictionaryEntry>> => {
    try {
      console.log('📚 Dictionary: 作成/更新:', entry.original);
      
      const result = dbService.upsertDictionaryEntry({
        ...entry,
        id: entry.id || uuidv4(),
        is_active: entry.is_active !== false // デフォルトはtrue
      });
      
      console.log('✅ Dictionary: 作成/更新完了:', result.id);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Dictionary: 作成/更新エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '辞書エントリの保存に失敗しました'
      };
    }
  });

  /**
   * 辞書エントリ削除
   */
  ipcMain.handle('dictionary:delete', async (_, id: string): Promise<IPCResponse<boolean>> => {
    try {
      console.log('📚 Dictionary: 削除:', id);
      
      const success = dbService.deleteDictionaryEntry(id);
      
      if (!success) {
        return {
          success: false,
          error: `辞書エントリ(ID: ${id})の削除に失敗しました`
        };
      }
      
      console.log('✅ Dictionary: 削除完了');
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('❌ Dictionary: 削除エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '辞書エントリの削除に失敗しました'
      };
    }
  });

  /**
   * 辞書エクスポート（JSON形式）
   */
  ipcMain.handle('dictionary:export', async (): Promise<IPCResponse<DictionaryEntry[]>> => {
    try {
      console.log('📚 Dictionary: エクスポート開始');
      
      const entries = dbService.getDictionaryEntries(false); // 全エントリ取得
      
      console.log(`✅ Dictionary: エクスポート完了 ${entries.length}件`);
      return {
        success: true,
        data: entries
      };
    } catch (error) {
      console.error('❌ Dictionary: エクスポートエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '辞書のエクスポートに失敗しました'
      };
    }
  });

  /**
   * 辞書インポート（JSON形式）
   */
  ipcMain.handle('dictionary:import', async (_, data: { entries: DictionaryEntryData[]; overwrite: boolean }): Promise<IPCResponse<{ imported: number }>> => {
    try {
      console.log('📚 Dictionary: インポート開始:', data.entries.length, 'entries');
      
      let imported = 0;
      
      for (const entry of data.entries) {
        try {
          // 重複チェック（original + corrected の組み合わせ）
          const existing = dbService.getDictionaryEntries().find(
            e => e.original === entry.original && e.corrected === entry.corrected
          );
          
          if (existing && !data.overwrite) {
            console.log(`⚠️ スキップ（重複）: ${entry.original} → ${entry.corrected}`);
            continue;
          }
          
          await dbService.upsertDictionaryEntry({
            ...entry,
            id: existing?.id || uuidv4(),
            is_active: entry.is_active !== false
          });
          imported++;
        } catch (entryError) {
          console.error(`❌ エントリインポートエラー: ${entry.original}`, entryError);
        }
      }
      
      console.log(`✅ Dictionary: インポート完了 ${imported}/${data.entries.length}件`);
      return {
        success: true,
        data: { imported }
      };
    } catch (error) {
      console.error('❌ Dictionary: インポートエラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '辞書のインポートに失敗しました'
      };
    }
  });

  console.log('✅ Dictionary IPC handlers registered');
}

/**
 * 初期辞書エントリをDBにシード
 */
async function seedInitialDictionaryEntries(): Promise<void> {
  const dbService = DbService.getInstance();
  
  const defaultEntries: Array<Omit<DictionaryEntry, 'id' | 'created_at' | 'updated_at'>> = [
    {
      original: '会儀',
      corrected: '会議',
      description: '音声認識でよく発生する誤認識',
      category: '一般',
      is_active: true
    },
    {
      original: 'あのー',
      corrected: '',
      description: 'フィラー音（削除）',
      category: 'フィラー',
      is_active: true
    },
    {
      original: 'えーと',
      corrected: '',
      description: 'フィラー音（削除）',
      category: 'フィラー',
      is_active: true
    },
    {
      original: '議事録',
      corrected: '議事録',
      description: '専門用語として確認',
      category: '専門用語',
      is_active: true
    },
    {
      original: 'アプリケーション',
      corrected: 'アプリケーション',
      description: 'IT用語として確認',
      category: '専門用語',
      is_active: true
    }
  ];
  
  await dbService.seedDictionaryEntries(defaultEntries);
  console.log('✅ 初期辞書エントリをシード完了');
}