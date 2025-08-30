/**
 * WorkspaceService - ワークスペース管理サービス
 * 
 * masterfile.md 仕様に基づくローカルファースト・ポータブル対応
 * - ワークスペース解決（環境変数 → ポータブル → ユーザーデータ）
 * - 初回セットアップ（resources/ → workspace/ コピー）
 * - 設定ファイル管理
 */

import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { z } from 'zod';

// 設定ファイルスキーマ
const WorkspaceConfigSchema = z.object({
  name: z.string(),
  version: z.number(),
  createdAt: z.string(),
  paths: z.object({
    attachments: z.string(),
    exports: z.string(),
    cache: z.string(),
    db: z.string(),
  }),
});

const AppLocalConfigSchema = z.object({
  pdf: z.object({
    pageSize: z.enum(['A4', 'Letter']).default('A4'),
    marginMm: z.number().default(15),
  }),
  markdown: z.object({
    theme: z.enum(['default', 'corporate']).default('default'),
    toc: z.boolean().default(true),
    latex: z.enum(['katex', 'tectonic']).default('katex'),
  }),
  mermaid: z.object({
    themePath: z.string().default('../../resources/themes/mermaid/mermaid-theme.css'),
  }),
});

export type WorkspaceConfig = z.infer<typeof WorkspaceConfigSchema>;
export type AppLocalConfig = z.infer<typeof AppLocalConfigSchema>;

export interface WorkspaceInfo {
  root: string;
  paths: Record<string, string>;
  config: WorkspaceConfig;
  appConfig: AppLocalConfig;
}

export class WorkspaceService {
  private static instance: WorkspaceService;
  private workspaceRoot: string | null = null;
  private workspaceInfo: WorkspaceInfo | null = null;

  private constructor() {}

  public static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  /**
   * ワークスペースディレクトリを解決
   * 優先順位: 1) 環境変数 → 2) ポータブル（実行ファイル直下） → 3) ユーザーデータ
   */
  public async resolve(): Promise<{ root: string; paths: Record<string, string> }> {
    if (this.workspaceRoot) {
      const info = await this.getWorkspaceInfo(this.workspaceRoot);
      return {
        root: this.workspaceRoot,
        paths: this.resolvePaths(this.workspaceRoot, info.config.paths),
      };
    }

    // 1. 環境変数チェック
    const envWorkspace = process.env.GIJIROKU_WORKSPACE_DIR;
    if (envWorkspace) {
      try {
        const resolved = path.resolve(envWorkspace);
        if (await this.isValidWorkspace(resolved)) {
          this.workspaceRoot = resolved;
          const info = await this.getWorkspaceInfo(resolved);
          return {
            root: resolved,
            paths: this.resolvePaths(resolved, info.config.paths),
          };
        }
      } catch (error) {
        console.warn('環境変数のワークスペースが無効:', error);
      }
    }

    // 2. ポータブルディレクトリ（実行ファイル直下/workspace）
    const execPath = process.execPath;
    const portableWorkspace = path.join(path.dirname(execPath), 'workspace');
    
    try {
      if (await this.isValidWorkspace(portableWorkspace)) {
        this.workspaceRoot = portableWorkspace;
        const info = await this.getWorkspaceInfo(portableWorkspace);
        return {
          root: portableWorkspace,
          paths: this.resolvePaths(portableWorkspace, info.config.paths),
        };
      }
    } catch (error) {
      console.warn('ポータブルワークスペースが無効:', error);
    }

    // 3. ユーザーデータディレクトリ
    const userDataWorkspace = path.join(app.getPath('userData'), 'workspace');
    this.workspaceRoot = userDataWorkspace;

    // 初回作成の場合は初期化
    if (!await this.isValidWorkspace(userDataWorkspace)) {
      await this.initializeWorkspace(userDataWorkspace);
    }

    const info = await this.getWorkspaceInfo(userDataWorkspace);
    return {
      root: userDataWorkspace,
      paths: this.resolvePaths(userDataWorkspace, info.config.paths),
    };
  }

  /**
   * 必要に応じてワークスペースを初期化
   */
  public async initIfNeeded(): Promise<{ initialized: boolean }> {
    const { root } = await this.resolve();
    
    if (!await this.isValidWorkspace(root)) {
      await this.initializeWorkspace(root);
      return { initialized: true };
    }

    // テンプレートの更新チェック（resources/ が新しい場合）
    const templatesUpdated = await this.updateTemplatesIfNeeded(root);
    
    return { initialized: templatesUpdated };
  }

  /**
   * ワークスペースを初期化
   */
  private async initializeWorkspace(workspaceRoot: string): Promise<void> {
    console.log('ワークスペース初期化開始:', workspaceRoot);

    // ディレクトリ構造作成
    const dirs = [
      'config',
      'data',
      'attachments',
      'templates',
      'cache',
      'cache/mermaid',
      'exports',
      'logs',
    ];

    for (const dir of dirs) {
      await fs.mkdir(path.join(workspaceRoot, dir), { recursive: true });
    }

    // 設定ファイル作成
    await this.createWorkspaceConfig(workspaceRoot);
    await this.createAppLocalConfig(workspaceRoot);

    // resources/ から templates/ をコピー
    await this.copyResourceTemplates(workspaceRoot);

    console.log('ワークスペース初期化完了');
  }

  /**
   * workspace.json を作成
   */
  private async createWorkspaceConfig(workspaceRoot: string): Promise<void> {
    const config: WorkspaceConfig = {
      name: 'Default Workspace',
      version: 2,
      createdAt: new Date().toISOString(),
      paths: {
        attachments: 'attachments',
        exports: 'exports',
        cache: 'cache',
        db: 'data/gijiroku.db',
      },
    };

    const configPath = path.join(workspaceRoot, 'config', 'workspace.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * app.local.json を作成
   */
  private async createAppLocalConfig(workspaceRoot: string): Promise<void> {
    const config: AppLocalConfig = {
      pdf: { pageSize: 'A4', marginMm: 15 },
      markdown: { theme: 'default', toc: true, latex: 'katex' },
      mermaid: { themePath: '../../resources/themes/mermaid/mermaid-theme.css' },
    };

    const configPath = path.join(workspaceRoot, 'config', 'app.local.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * resources/templates/ → workspace/templates/ をコピー
   */
  private async copyResourceTemplates(workspaceRoot: string): Promise<void> {
    const resourcesDir = this.getResourcesDir();
    const sourceTemplatesDir = path.join(resourcesDir, 'templates');
    const targetTemplatesDir = path.join(workspaceRoot, 'templates');

    if (await this.pathExists(sourceTemplatesDir)) {
      await this.copyDirectory(sourceTemplatesDir, targetTemplatesDir);
      console.log('テンプレートコピー完了:', sourceTemplatesDir, '->', targetTemplatesDir);
    }
  }

  /**
   * 必要に応じてテンプレートを更新
   */
  private async updateTemplatesIfNeeded(workspaceRoot: string): Promise<boolean> {
    const resourcesDir = this.getResourcesDir();
    const sourceTemplatesDir = path.join(resourcesDir, 'templates');
    const targetTemplatesDir = path.join(workspaceRoot, 'templates');

    if (!await this.pathExists(sourceTemplatesDir)) {
      return false;
    }

    // 更新が必要かチェック（簡単なファイル数比較）
    try {
      const sourceFiles = await fs.readdir(sourceTemplatesDir, { recursive: true });
      const targetFiles = await fs.readdir(targetTemplatesDir, { recursive: true });
      
      if (sourceFiles.length !== targetFiles.length) {
        await this.copyDirectory(sourceTemplatesDir, targetTemplatesDir);
        console.log('テンプレート更新完了');
        return true;
      }
    } catch (error) {
      console.warn('テンプレート更新チェック失敗:', error);
      return false;
    }

    return false;
  }

  /**
   * ワークスペースが有効かチェック
   */
  private async isValidWorkspace(workspaceRoot: string): Promise<boolean> {
    try {
      const configPath = path.join(workspaceRoot, 'config', 'workspace.json');
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ワークスペース情報を取得
   */
  private async getWorkspaceInfo(workspaceRoot: string): Promise<WorkspaceInfo> {
    if (this.workspaceInfo && this.workspaceRoot === workspaceRoot) {
      return this.workspaceInfo;
    }

    const configPath = path.join(workspaceRoot, 'config', 'workspace.json');
    const appConfigPath = path.join(workspaceRoot, 'config', 'app.local.json');

    const configData = await fs.readFile(configPath, 'utf8');
    const appConfigData = await fs.readFile(appConfigPath, 'utf8');

    const config = WorkspaceConfigSchema.parse(JSON.parse(configData));
    const appConfig = AppLocalConfigSchema.parse(JSON.parse(appConfigData));

    this.workspaceInfo = {
      root: workspaceRoot,
      paths: this.resolvePaths(workspaceRoot, config.paths),
      config,
      appConfig,
    };

    return this.workspaceInfo;
  }

  /**
   * 相対パスを絶対パスに解決
   */
  private resolvePaths(workspaceRoot: string, paths: Record<string, string>): Record<string, string> {
    const resolved: Record<string, string> = {};
    for (const [key, relativePath] of Object.entries(paths)) {
      resolved[key] = path.resolve(workspaceRoot, relativePath);
    }
    return resolved;
  }

  /**
   * resources/ ディレクトリのパスを取得
   */
  private getResourcesDir(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'resources');
    } else {
      return path.join(__dirname, '../../resources');
    }
  }

  /**
   * ディレクトリをコピー（再帰的）
   */
  private async copyDirectory(source: string, target: string): Promise<void> {
    await fs.mkdir(target, { recursive: true });
    
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }

  /**
   * パスが存在するかチェック
   */
  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * ワークスペース設定を取得
   */
  public async getWorkspaceConfig(): Promise<WorkspaceConfig> {
    const { root } = await this.resolve();
    const info = await this.getWorkspaceInfo(root);
    return info.config;
  }

  /**
   * アプリケーション設定を取得
   */
  public async getAppConfig(): Promise<AppLocalConfig> {
    const { root } = await this.resolve();
    const info = await this.getWorkspaceInfo(root);
    return info.appConfig;
  }

  /**
   * アプリケーション設定を更新
   */
  public async updateAppConfig(updates: Partial<AppLocalConfig>): Promise<void> {
    const { root } = await this.resolve();
    const currentConfig = await this.getAppConfig();
    
    const newConfig = {
      ...currentConfig,
      ...updates,
      pdf: { ...currentConfig.pdf, ...updates.pdf },
      markdown: { ...currentConfig.markdown, ...updates.markdown },
      mermaid: { ...currentConfig.mermaid, ...updates.mermaid },
    };

    const configPath = path.join(root, 'config', 'app.local.json');
    await fs.writeFile(configPath, JSON.stringify(newConfig, null, 2), 'utf8');

    // キャッシュ更新
    if (this.workspaceInfo) {
      this.workspaceInfo.appConfig = newConfig;
    }
  }
}