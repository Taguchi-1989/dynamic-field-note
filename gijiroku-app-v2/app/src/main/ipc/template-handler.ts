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
      // 直接DBから取得（emit()の代わりに直接呼び出し）
      const templates = dbService.getPromptTemplates(true);
      
      // DBが空の場合は初期シードを実行
      if (templates.length === 0) {
        console.log('📋 Legacy API: DBが空のため初期シード実行');
        await seedInitialTemplates();
        const seededTemplates = dbService.getPromptTemplates(true);
        
        // 旧形式に変換（互換性のため）
        const legacyFormat = seededTemplates.map(t => ({
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
      
      // 旧形式に変換（互換性のため）
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
    
    // 複数のパス候補を試行
    const resourcesPaths = [
      // 開発環境パス
      path.join(app.getAppPath(), 'resources', 'templates'),
      // パッケージ版パス候補1
      app.isPackaged ? path.join(process.resourcesPath, 'app.asar', 'resources', 'templates') : null,
      // パッケージ版パス候補2  
      app.isPackaged ? path.join(process.resourcesPath, 'resources', 'templates') : null,
      // パッケージ版パス候補3
      app.isPackaged ? path.join(path.dirname(app.getPath('exe')), 'resources', 'templates') : null
    ].filter(Boolean) as string[];
    
    let templateFiles: string[] = [];
    let sourceDir: string | null = null;
    
    // まずworkspace/templatesから読み込みを試みる
    try {
      templateFiles = await fs.readdir(templatesDir);
      if (templateFiles.length > 0) {
        console.log(`📁 workspace/templates から ${templateFiles.length} ファイル検出`);
        sourceDir = templatesDir;
      }
    } catch (error) {
      console.log('📁 workspace/templates が存在しないため、resources/templates を検索');
    }
    
    // workspace/templatesが空の場合、resources/templatesから読み込み
    if (templateFiles.length === 0) {
      console.log(`🔍 リソーステンプレートの検索開始（${resourcesPaths.length}パス候補）`);
      
      for (const resourcesDir of resourcesPaths) {
        try {
          console.log(`📁 パス試行: ${resourcesDir}`);
          const files = await fs.readdir(resourcesDir);
          const jsonFiles = files.filter(f => f.endsWith('.json'));
          
          console.log(`  └─ 見つかったファイル: ${files.length}個 (JSON: ${jsonFiles.length}個)`);
          
          if (jsonFiles.length > 0) {
            console.log(`✅ ${resourcesDir} から ${jsonFiles.length} ファイル検出`);
            console.log(`  └─ ファイル: ${jsonFiles.join(', ')}`);
            templateFiles = jsonFiles;
            sourceDir = resourcesDir;
            
            // workspace/templatesにコピー
            await fs.mkdir(templatesDir, { recursive: true });
            let copiedFiles = 0;
            
            for (const file of jsonFiles) {
              const srcPath = path.join(resourcesDir, file);
              const destPath = path.join(templatesDir, file);
              try {
                await fs.copyFile(srcPath, destPath);
                console.log(`📄 コピー完了: ${file}`);
                copiedFiles++;
              } catch (copyErr) {
                console.error(`❌ ファイルコピーエラー: ${file}`, copyErr instanceof Error ? copyErr.message : copyErr);
              }
            }
            
            console.log(`📋 コピー結果: ${copiedFiles}/${jsonFiles.length}ファイル成功`);
            break;
          } else {
            console.log(`  └─ JSONファイルが見つかりません`);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          console.log(`❌ パス ${resourcesDir} 読み込み失敗: ${errorMessage}`);
          if (err instanceof Error && err.code) {
            console.log(`  └─ エラーコード: ${(err as any).code}`);
          }
          continue;
        }
      }
    }
    
    // どのパスからもファイルが見つからない場合
    if (templateFiles.length === 0 || !sourceDir) {
      console.log('📁 すべてのパス候補でテンプレートファイルが見つからないため、デフォルトテンプレートを使用');
      await seedDefaultTemplates();
      return;
    }
    
    // JSONファイルを読み込んでDBに投入
    const templates: any[] = [];
    // 🔧 修正: workspace/templatesにコピー済みなのでtemplateDirを使用
    const readDir = templatesDir;
    
    console.log(`📋 テンプレートファイル処理開始: ${templateFiles.length}ファイル`);
    console.log(`📁 読み込み対象ディレクトリ: ${readDir}`);
    console.log(`📁 templatesDir: ${templatesDir}`);
    console.log(`📁 sourceDir: ${sourceDir}`);
    
    // 🔧 修正: readDirがnullでないことを事前確認
    if (!readDir) {
      console.error('❌ readDirがnullです。フォールバック処理に移行します。');
      await seedDefaultTemplates();
      return;
    }
    
    let processedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const file of templateFiles) {
      if (!file.endsWith('.json')) {
        console.log(`  └─ スキップ (非JSON): ${file}`);
        skippedCount++;
        continue;
      }
      
      try {
        const filePath = path.join(readDir, file);
        console.log(`📄 テンプレートファイル読み込み: ${filePath}`);
        
        const content = await fs.readFile(filePath, 'utf-8');
        
        // JSON パース前の基本検証
        if (!content.trim()) {
          console.warn(`⚠️ 空ファイルでスキップ: ${file}`);
          skippedCount++;
          continue;
        }
        
        const template = JSON.parse(content);
        
        // 複数の形式に対応
        const templateData = {
          id: template.id || file.replace('.json', ''),
          title: template.name || template.title || 'Unknown Template',
          content: template.prompt || template.content || '',
          description: template.description || '',
          category: template.category || 'general',
          is_active: template.is_active !== false // デフォルトはtrue
        };
        
        // 必要な情報が不足している場合はスキップ
        if (!templateData.title || !templateData.content) {
          console.warn(`⚠️ テンプレート情報不足でスキップ: ${file}`, {
            hasTitle: !!templateData.title,
            hasContent: !!templateData.content,
            titleValue: templateData.title || '<空>',
            contentLength: templateData.content?.length || 0
          });
          skippedCount++;
          continue;
        }
        
        templates.push(templateData);
        processedCount++;
        console.log(`✅ テンプレート追加: ${templateData.title} (${templateData.content.length}文字, カテゴリ: ${templateData.category})`);
      } catch (error) {
        errorCount++;
        if (error instanceof SyntaxError) {
          console.error(`❌ JSONパースエラー: ${file} - ${error.message}`);
        } else if (error instanceof Error && (error as any).code === 'ENOENT') {
          console.error(`❌ ファイル未発見: ${file}`);
        } else {
          console.error(`❌ テンプレートファイル読み込みエラー: ${file}`, error instanceof Error ? error.message : error);
        }
        continue;
      }
    }
    
    console.log(`📊 ファイル処理結果: 成功=${processedCount}, スキップ=${skippedCount}, エラー=${errorCount}`);
    
    if (templates.length > 0) {
      console.log(`🌱 DB に ${templates.length}件のテンプレートをシード開始`);
      await dbService.seedPromptTemplates(templates);
      console.log('✅ テンプレートシード完了');
    } else {
      // テンプレートが見つからない場合はデフォルトを使用
      console.log('📁 有効なテンプレートファイルが見つからないため、デフォルトテンプレートを使用');
      await seedDefaultTemplates();
    }
  } catch (error) {
    console.error('❌ 初期シードエラー:', error instanceof Error ? error.message : error);
    console.error('🔧 詳細:', error instanceof Error ? error.stack : 'No stack trace');
    
    // エラー時はデフォルトテンプレートを使用
    console.log('🚨 フォールバック: デフォルトテンプレートを使用');
    try {
      await seedDefaultTemplates();
    } catch (fallbackError) {
      console.error('💥 デフォルトテンプレートシードも失敗:', fallbackError);
    }
  }
}

/**
 * デフォルトテンプレートをDBにシード（フォールバック用）
 */
async function seedDefaultTemplates(): Promise<void> {
  const dbService = DbService.getInstance();
  
  const defaultTemplates = [
    {
      title: '一般会議用（Q&A重視）',
      content: 'あなたはプロの議事録編集者です。以下のテキストは会議の音声認識結果です。\n以下のルールに従って、**実務で使える一般的な議事録**に修正し、Markdown形式で出力してください。\n\n# ルール\n- 誤字脱字を修正してください\n- 文脈に合わない単語を修正してください\n- 「えーと」「あのー」など話し言葉は削除してください\n- **出席者情報は、VTTに記載されている名前やチーム名をそのまま使用してください（役職表記は不要）**\n- 「誰が発言したか」を会議内容に反映してください\n- **質疑応答は「Q:」「A:」形式で明確に記載してください**\n- **重要な決定事項は太字で強調してください**\n- **アクションアイテムは表形式（誰が／何を／いつまでに）で記載してください**\n- 出力はMarkdown形式のみとし、余計な説明は不要です\n\n# 出力フォーマット\n# 会議情報\n- **会議名**: [会議タイトル]\n- **開催日時**: [YYYY年MM月DD日 HH:MM-HH:MM]\n- **出席者**: [VTTに記載された名前／チーム名を全員列挙]\n- **欠席者**: [該当する場合]\n\n# 会議内容\n## 議題1: [議題タイトル]\n### 概要\n- [発言者名]: [発言の要点]\n- [発言者名]: [意見や提案内容]\n- [発言者名]: **[決定事項の場合は強調]**\n\n### 質疑応答\n**Q:** [質問者名]「質問内容」\n**A:** [回答者名]「回答内容」\n\n# アクションアイテム（TODO）\n| No | 担当者 | 内容（何を） | 期限（いつまでに） | 備考 |\n|---|---|---|---|---|\n| 1 | [氏名／チーム] | [具体的なタスク内容] | [YYYY/MM/DD or ASAP] | [補足があれば記載] |\n| 2 | [氏名／チーム] | [対応内容] | [期限] | [補足] |\n\n# 決定事項\n1. **[決定事項1]**\n2. **[決定事項2]**\n3. **[決定事項3]**',
      description: '質疑応答を重視した一般会議の議事録作成',
      category: '一般会議用',
      is_active: true
    },
    {
      title: '技術会議用（Q&A形式）',
      content: 'あなたはIT分野に精通した議事録編集者です。技術的な内容を正確に保ちながら、質疑応答を重視した読みやすい議事録を作成してください。\n\n# ルール\n- 技術用語は正確に保持してください（API、フレームワーク名、プログラミング言語名等）\n- コード片やコマンドは `code` 形式で記載してください\n- **技術的な質疑応答を詳細に記録**してください\n- 設計決定や技術的決定事項は明確に記載してください\n- アクションアイテムは責任者と期限を明記してください\n- バージョン情報、URL、設定値は正確に記載してください\n\n# 技術文書の書式\n- APIエンドポイント、関数名、クラス名は正確に記載\n- エラーメッセージやログは `code` 形式で囲む\n- 技術的な課題と解決策を構造化して記載\n- パフォーマンス指標や数値データは正確に保持\n- 質疑応答はQ&A形式で詳細に記録\n\n# 出力例\n## 技術検討事項\n### 議題1: API設計について\n#### 概要説明\n- 山田エンジニア: `GET /api/users/{id}` エンドポイントのレスポンス形式を検討\n- 鈴木リーダー: **JSON Schema v4 形式で統一する**ことを提案\n\n#### 技術的質疑応答\n**Q:** 佐藤様より「レート制限はどのように実装しますか？」\n**A:** 山田エンジニアより「`Redis`を使用して、`sliding window`方式で実装予定です。1分間に100リクエストを上限とします」\n\n**Q:** 田中様より「エラーハンドリングの標準化は？」\n**A:** 鈴木リーダーより「RFC 7807 Problem Details形式を採用し、以下の構造で統一します：\n```json\n{\n  \"type\": \"/errors/validation\",\n  \"title\": \"Validation Error\",\n  \"status\": 400,\n  \"detail\": \"詳細なエラーメッセージ\"\n}\n```\"\n\n**Q:** 高橋様より「認証トークンの有効期限は？」\n**A:** 山田エンジニアより「アクセストークン15分、リフレッシュトークン30日に設定予定です」\n\n### 技術的決定事項\n1. **フレームワーク選定**: Next.js 14.0.0 を使用\n2. **データベース**: PostgreSQL 15.2 + Prisma ORM\n3. **認証方式**: JWT トークン認証（RS256）\n4. **API仕様**: OpenAPI 3.0 準拠\n5. **レート制限**: Redis + sliding window（100req/min）\n\n### TODO表（技術タスク）\n| No | 担当者 | タスク内容 | 期限 | 技術要件 |\n| -- | ------ | ---------- | ---- | -------- |\n| 1 | 山田エンジニア | API仕様書作成 | 来週金曜 | OpenAPI 3.0形式、Swagger UI含む |\n| 2 | 佐藤エンジニア | レート制限実装 | 今月末 | Redis Cluster対応 |\n| 3 | 田中エンジニア | 認証システム構築 | 2週間後 | JWT RS256、refresh token対応 |\n| 4 | 鈴木リーダー | パフォーマンステスト | 来週水曜 | 目標: p99 < 200ms |\n\n### 技術的課題と対策\n- **課題**: データベースのN+1問題が懸念される\n  - **対策**: GraphQL DataLoaderまたはPrismaのinclude機能を使用\n- **課題**: マイクロサービス間の通信遅延\n  - **対策**: gRPCの導入を検討、プロトタイプを作成予定',
      description: '技術的な内容の会議の議事録をQ&A形式で作成',
      category: '技術会議用',
      is_active: true
    },
    {
      title: 'メモ・壁打ち用（シンプル）',
      content: 'あなたは思考整理が得意なアシスタントです。以下のテキストを、**シンプルで読みやすいメモ形式**に整理してください。\n\n# ルール\n- 冗長な表現は削除し、要点のみを抽出\n- 箇条書きを多用して読みやすくする\n- 思考のまとまりごとに見出しを付ける\n- アクションアイテムがあれば最後にまとめる\n- 敬語は使わず、親しみやすい文体で整理\n- 完璧な文章にする必要はなし（壁打ち・思考整理用）\n\n# 出力フォーマット\n# 📝 メモ - [日付]\n\n## 💭 主な話題・論点\n- [要点1]\n- [要点2] \n- [要点3]\n\n## 🤔 考えたこと・気づいたこと\n- [思考・アイデア1]\n- [疑問・課題1]\n- [新しい発見・気づき1]\n\n## ✅ やること・TODO\n- [ ] [タスク1] - [いつまでに]\n- [ ] [タスク2] - [期限]\n- [ ] [検討事項] - [次回まで]\n\n## 📎 参考・補足\n- [関連情報や参考になりそうなこと]\n- [追加で調べたいこと]',
      description: '思考整理やラフなメモ作成に特化した軽量テンプレート',
      category: 'メモ・壁打ち用',
      is_active: true
    },
    {
      title: '正式議事録（Q&A形式）',
      content: '📑 議事録作成プロンプト（質疑応答中心・TODO表付き）\n\n以下のテキストは会議逐語録（VTTファイルから変換された発言記録）です。これを基に、**正式な議事録**を作成してください。\nフォーマットに沿って整理し、冗長な発言は削除し、要点・決定事項・TODOを明確にまとめてください。\n特に **質疑応答（Q&A形式）を重視**し、誰が何を聞き、誰がどう回答したのかを明示してください。\nビジネス文書として適切な敬語表現を使用してください。\n\n---\n\n## 出力フォーマット\n\n### 1. 会議情報\n\n* **会議名**: [会議タイトル]\n* **開催日時**: [YYYY年MM月DD日 HH:MM-HH:MM]\n* **開催場所**: [会議室名／オンライン等]\n* **出席者**: [役職・氏名を正式に記載]\n* **欠席者**: [該当する場合]\n* **議事録作成者**: [作成者名]\n\n---\n\n### 2. 会議概要\n\n* 会議の目的: [簡潔に記載]\n* 議題の全体概要: [各議題の要点を短く列挙]\n\n---\n\n### 3. 決定事項\n\n1. [重要な決定事項1]\n2. [重要な決定事項2]\n3. [重要な決定事項3]\n\n---\n\n### 4. TODO（宿題事項／アクションアイテム）\n\n| No | 担当者（誰が） | 内容（何を） | 期限（いつまでに） | 備考 |\n| -- | -------------- | ------------ | ------------------ | ---- |\n| 1  | [氏名／役職]   | [具体的な対応内容] | [YYYY/MM/DD or ASAP] | [補足あれば記載] |\n| 2  | [氏名／役職]   | [対応内容]   | [期限]             | [補足] |\n| 3  | [氏名／役職]   | [対応内容]   | [期限]             | [補足] |\n\n---\n\n### 5. 会議詳細（議題ごとに整理・Q&A形式中心）\n\n#### 議題1: [タイトル]\n\n##### 討議概要\n\n* [概要を簡潔に記載]\n\n##### 質疑応答（Q&A）\n\n* **質問**: [役職・氏名]より、「〜についてご質問がありました」\n  * **回答**: [役職・氏名]より、「〜についてご説明いたしました」\n  \n* **質問**: [役職・氏名]より、「〜に関して懸念点の確認がございました」\n  * **回答**: [役職・氏名]より、「〜を今後の対応といたします」\n\n##### 決定事項\n\n* [正式に決定された内容を記載]\n\n##### TODO（当該議題関連）\n\n* [担当者／期限／内容を要約 → 上記TODO表にも反映]\n\n---\n\n#### 議題2: [タイトル]\n\n##### 討議概要\n\n* [概要を簡潔に記載]\n\n##### 質疑応答（Q&A）\n\n* **質問**: [役職・氏名]より、「〜についてのご確認がありました」\n  * **回答**: [役職・氏名]より、「〜という対応を予定しております」\n\n##### 決定事項\n\n* [正式に決定された内容を記載]\n\n##### TODO（当該議題関連）\n\n* [担当者／期限／内容を要約 → 上記TODO表にも反映]\n\n---\n\n### 6. 次回会議予定\n\n* **日時**: [予定日時]\n* **場所**: [予定場所]\n* **主な議題**: [予定議題]\n\n---\n\n**以上**\n\n議事録作成日: [作成日]\n作成者: [作成者名]\n承認者: [承認者名]\n\n---\n\n## 記載ルール\n\n💡 重要ポイント：\n\n* **決定事項／TODOを冒頭に集約** → 重要情報がすぐわかる\n* **詳細は質疑応答中心** → 誰が何を聞き、誰が答えたかが明確\n* **TODO表と議題ごとのTODOをリンク** → 抜け漏れ防止\n* **発言者は必ず役職付きで記載** （例：営業部長 田中様 → 研究開発部長 鈴木様に回答）\n* **敬語表現を統一** → ビジネス文書として適切な表現を使用',
      description: '質疑応答中心の正式な議事録形式で作成',
      category: 'formal',
      is_active: true
    }
  ];
  
  await dbService.seedPromptTemplates(defaultTemplates);
  console.log('✅ デフォルトテンプレートをシード完了（正式議事録を含む4件）');
}