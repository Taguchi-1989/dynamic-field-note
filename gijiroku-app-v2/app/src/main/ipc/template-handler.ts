/**
 * Template IPC Handler
 * CODEX_REVIEW.md準拠のDB中心テンプレート管理
 */

import { ipcMain } from 'electron';
import { DbService } from '../services/DbService';
import { WorkspaceService } from '../services/WorkspaceService';
import * as fs from 'fs/promises';
import * as path from 'path';
import { app } from 'electron';
import { v4 as uuidv4 } from 'uuid';

// IPCレスポンス型
interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// テンプレート型（フロントエンドとの互換性のため）
interface TemplateData {
  id: string;
  title: string;
  content: string;
  description?: string;
  category?: string;
  is_active?: boolean;
}

/**
 * テンプレートIPCハンドラーを登録
 */
export function registerTemplateHandlers(): void {
  const dbService = DbService.getInstance();
  const workspaceService = WorkspaceService.getInstance();

  /**
   * テンプレート一覧取得
   */
  ipcMain.handle('templates:list', async (): Promise<IPCResponse<TemplateData[]>> => {
    try {
      console.log('📋 Templates: リスト取得開始');
      
      // DBから取得を試みる
      const templates = dbService.getPromptTemplates(true); // activeOnlyフラグをtrueに
      
      // DBにテンプレートがない場合、初期シードを実行
      if (templates.length === 0) {
        console.log('📋 Templates: DBが空のため初期シード実行');
        await seedInitialTemplates();
        const seededTemplates = dbService.getPromptTemplates(true);
        return {
          success: true,
          data: seededTemplates
        };
      }
      
      console.log(`📋 Templates: ${templates.length}件取得完了`);
      return {
        success: true,
        data: templates
      };
    } catch (error) {
      console.error('❌ Templates: リスト取得エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'テンプレート一覧の取得に失敗しました'
      };
    }
  });

  /**
   * テンプレート個別取得
   */
  ipcMain.handle('templates:get', async (_, id: string): Promise<IPCResponse<TemplateData>> => {
    try {
      console.log('📋 Templates: 個別取得:', id);
      
      const template = dbService.getPromptTemplateById(id);
      
      if (!template) {
        return {
          success: false,
          error: `テンプレート(ID: ${id})が見つかりません`
        };
      }
      
      return {
        success: true,
        data: template
      };
    } catch (error) {
      console.error('❌ Templates: 個別取得エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'テンプレートの取得に失敗しました'
      };
    }
  });

  /**
   * テンプレート作成・更新
   */
  ipcMain.handle('templates:upsert', async (_, template: TemplateData): Promise<IPCResponse<TemplateData>> => {
    try {
      console.log('📋 Templates: 作成/更新:', template.title);
      
      const result = dbService.upsertPromptTemplate({
        ...template,
        is_active: template.is_active !== false // デフォルトはtrue
      });
      
      console.log('✅ Templates: 作成/更新完了:', result.id);
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('❌ Templates: 作成/更新エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'テンプレートの保存に失敗しました'
      };
    }
  });

  /**
   * テンプレート削除
   */
  ipcMain.handle('templates:delete', async (_, id: string): Promise<IPCResponse<boolean>> => {
    try {
      console.log('📋 Templates: 削除:', id);
      
      const success = dbService.deletePromptTemplate(id);
      
      if (!success) {
        return {
          success: false,
          error: `テンプレート(ID: ${id})の削除に失敗しました`
        };
      }
      
      console.log('✅ Templates: 削除完了');
      return {
        success: true,
        data: true
      };
    } catch (error) {
      console.error('❌ Templates: 削除エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'テンプレートの削除に失敗しました'
      };
    }
  });

  /**
   * 旧API互換性のためのハンドラー（段階的廃止予定）
   * file:load-promptsをtemplates:listにリダイレクト
   */
  ipcMain.handle('file:load-prompts', async (): Promise<IPCResponse<any[]>> => {
    console.log('⚠️ Legacy API: file:load-prompts → templates:list にリダイレクト');
    
    try {
      const response = await ipcMain.emit('templates:list') as any;
      
      // 旧形式に変換（互換性のため）
      if (response?.success && response.data) {
        const legacyFormat = response.data.map((t: TemplateData) => ({
          id: t.id,
          name: t.title, // 旧APIではnameフィールド
          prompt: t.content, // 旧APIではpromptフィールド
          description: t.description || '',
          category: t.category || 'general'
        }));
        
        return {
          success: true,
          data: legacyFormat
        };
      }
      
      // DBから直接取得
      const templates = dbService.getPromptTemplates(true);
      const legacyFormat = templates.map(t => ({
        id: t.id,
        name: t.title,
        prompt: t.content,
        description: t.description || '',
        category: t.category || 'general'
      }));
      
      return {
        success: true,
        data: legacyFormat
      };
    } catch (error) {
      console.error('❌ Legacy API エラー:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'プロンプトの読み込みに失敗しました'
      };
    }
  });
}

/**
 * 初期テンプレートをDBにシード
 */
async function seedInitialTemplates(): Promise<void> {
  const workspaceService = WorkspaceService.getInstance();
  const dbService = DbService.getInstance();
  
  try {
    const { paths } = await workspaceService.resolve();
    const templatesDir = paths.templates;
    
    // まずworkspace/templatesから読み込みを試みる
    let templateFiles: string[] = [];
    try {
      templateFiles = await fs.readdir(templatesDir);
      console.log(`📁 workspace/templates から ${templateFiles.length} ファイル検出`);
    } catch (error) {
      console.log('📁 workspace/templates が存在しないため、resources/templates を使用');
      
      // resources/templatesから読み込み
      const resourcesDir = app.isPackaged
        ? path.join(process.resourcesPath, 'app.asar', 'resources', 'templates')
        : path.join(app.getAppPath(), 'resources', 'templates');
      
      try {
        templateFiles = await fs.readdir(resourcesDir);
        console.log(`📁 resources/templates から ${templateFiles.length} ファイル検出`);
        
        // workspace/templatesにコピー
        await fs.mkdir(templatesDir, { recursive: true });
        for (const file of templateFiles) {
          if (file.endsWith('.json')) {
            const srcPath = path.join(resourcesDir, file);
            const destPath = path.join(templatesDir, file);
            await fs.copyFile(srcPath, destPath);
          }
        }
      } catch (err) {
        console.error('❌ resources/templates の読み込みエラー:', err);
        // デフォルトテンプレートを使用
        await seedDefaultTemplates();
        return;
      }
    }
    
    // JSONファイルを読み込んでDBに投入
    const templates: any[] = [];
    for (const file of templateFiles) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(templatesDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const template = JSON.parse(content);
        
        templates.push({
          title: template.name || template.title,
          content: template.prompt || template.content,
          description: template.description || '',
          category: template.category || 'general',
          is_active: true
        });
      } catch (error) {
        console.error(`⚠️ テンプレートファイル読み込みエラー: ${file}`, error);
      }
    }
    
    if (templates.length > 0) {
      await dbService.seedPromptTemplates(templates);
    } else {
      // テンプレートが見つからない場合はデフォルトを使用
      await seedDefaultTemplates();
    }
  } catch (error) {
    console.error('❌ 初期シードエラー:', error);
    // エラー時はデフォルトテンプレートを使用
    await seedDefaultTemplates();
  }
}

/**
 * デフォルトテンプレートをDBにシード（フォールバック用）
 */
async function seedDefaultTemplates(): Promise<void> {
  const dbService = DbService.getInstance();
  
  const defaultTemplates = [
    {
      title: '一般的な会議',
      content: '以下の会議記録を、正確で読みやすい議事録形式に修正してください。\n\n要件：\n1. 誤字脱字を修正\n2. 話し言葉を書き言葉に変換\n3. 重要なポイントを箇条書きで整理\n4. 決定事項とアクションアイテムを明確に記載\n\n会議記録：\n',
      description: '一般的な会議の議事録作成用テンプレート',
      category: 'general',
      is_active: true
    },
    {
      title: '技術会議',
      content: '以下の技術会議の記録を、構造化された議事録に変換してください。\n\n要件：\n1. 技術的な用語は正確に記載\n2. コード例やコマンドは適切にフォーマット\n3. 議論された技術的な課題と解決策を整理\n4. 実装タスクとデッドラインを明記\n\n会議記録：\n',
      description: '技術的な内容を含む会議用テンプレート',
      category: 'technical',
      is_active: true
    },
    {
      title: '要約のみ',
      content: '以下の会議記録を簡潔に要約してください。\n\n要件：\n1. 200文字以内で要約\n2. 最も重要な決定事項のみ記載\n3. 次のアクションを1-2点に絞って記載\n\n会議記録：\n',
      description: '簡潔な要約を作成するテンプレート',
      category: 'summary',
      is_active: true
    }
  ];
  
  await dbService.seedPromptTemplates(defaultTemplates);
  console.log('✅ デフォルトテンプレートをシード完了');
}