/**
 * MermaidRenderWorker - Mermaid事前描画＋キャッシュシステム
 * 
 * masterfile.md 仕様に基づく高品質Mermaidレンダリング
 * - hidden BrowserWindow での描画
 * - SVG生成＋キャッシュ（workspace/cache/mermaid/）
 * - data URL埋め込み対応
 * - ハッシュベースキャッシュ管理
 */

import { BrowserWindow } from 'electron';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { WorkspaceService } from './WorkspaceService';

export interface MermaidRenderOptions {
  theme?: 'default' | 'dark' | 'forest' | 'neutral';
  width?: number;
  height?: number;
  backgroundColor?: string;
}

export interface MermaidRenderResult {
  svg: string;
  hash: string;
  cached: boolean;
  cachePath: string;
}

export class MermaidRenderWorker {
  private static instance: MermaidRenderWorker;
  private workspaceService: WorkspaceService;
  private renderWindow: BrowserWindow | null = null;
  private isInitialized = false;

  private constructor() {
    this.workspaceService = WorkspaceService.getInstance();
  }

  public static getInstance(): MermaidRenderWorker {
    if (!MermaidRenderWorker.instance) {
      MermaidRenderWorker.instance = new MermaidRenderWorker();
    }
    return MermaidRenderWorker.instance;
  }

  /**
   * レンダリング用hidden BrowserWindowを初期化
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧩 Initializing MermaidRenderWorker...');
    try {
      console.log('🪟 Creating render window...');
      this.renderWindow = new BrowserWindow({
        show: false,  // hidden window
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          offscreen: true  // オフスクリーンレンダリング
        },
        width: 1200,
        height: 800
      });

      // Mermaidライブラリを含むHTMLページを読み込み
      console.log('📄 Loading Mermaid HTML template...');
      const htmlContent = this.getMermaidHtmlTemplate();
      await this.renderWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // ページが読み込まれるまで待機（タイムアウト付き）
      console.log('⏱️ Waiting for Mermaid page load...');
      await Promise.race([
        new Promise<void>((resolve) => {
          this.renderWindow!.webContents.once('did-finish-load', () => {
            console.log('✅ Mermaid page loaded');
            resolve();
          });
        }),
        new Promise<void>((_, reject) => 
          setTimeout(() => reject(new Error('MermaidWorker page load timeout')), 15000)
        )
      ]);

      this.isInitialized = true;
      console.log('✅ MermaidRenderWorker initialized');

    } catch (error) {
      console.error('MermaidRenderWorker initialization failed:', error);
      throw new Error(`Failed to initialize MermaidRenderWorker: ${error}`);
    }
  }

  /**
   * MermaidコードをSVGにレンダリング
   */
  public async renderToSvg(
    mermaidCode: string, 
    options: MermaidRenderOptions = {}
  ): Promise<MermaidRenderResult> {
    // 初期化チェック
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.renderWindow || this.renderWindow.isDestroyed()) {
      throw new Error('Render window is not available');
    }

    try {
      // ハッシュ生成（キャッシュキー）
      const hash = this.generateHash(mermaidCode, options);
      
      // キャッシュチェック
      const cachedSvg = await this.getCachedSvg(hash);
      if (cachedSvg) {
        return {
          svg: cachedSvg.svg,
          hash,
          cached: true,
          cachePath: cachedSvg.path
        };
      }

      // Mermaidレンダリング実行
      const svg = await this.executeMermaidRendering(mermaidCode, options);

      // キャッシュに保存
      const cachePath = await this.saveSvgToCache(hash, svg);

      return {
        svg,
        hash,
        cached: false,
        cachePath
      };

    } catch (error) {
      console.error('Mermaid rendering failed:', error);
      throw new Error(`Failed to render Mermaid diagram: ${error}`);
    }
  }

  /**
   * 実際のMermaidレンダリングを実行
   */
  private async executeMermaidRendering(
    mermaidCode: string, 
    options: MermaidRenderOptions
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Mermaid rendering timeout'));
      }, 30000); // 30秒タイムアウト

      // レンダリング実行
      this.renderWindow!.webContents.executeJavaScript(`
        (async function() {
          try {
            // Mermaid設定
            mermaid.initialize({
              theme: '${options.theme || 'default'}',
              startOnLoad: false,
              securityLevel: 'loose',
              themeVariables: {
                primaryColor: '#2196f3',
                primaryTextColor: '#333',
                primaryBorderColor: '#333',
                lineColor: '#333',
                secondaryColor: '#f5f5f5',
                tertiaryColor: '#ffffff',
                background: '${options.backgroundColor || 'white'}',
                mainBkg: '${options.backgroundColor || 'white'}',
                fontFamily: 'Noto Sans JP, sans-serif',
                fontSize: '14px'
              },
              flowchart: {
                useMaxWidth: true,
                htmlLabels: true
              },
              sequence: {
                useMaxWidth: true,
                wrap: true
              }
            });

            // 一意IDを生成
            const diagramId = 'mermaid-diagram-' + Date.now();
            
            // SVG生成
            const { svg } = await mermaid.render(diagramId, \`${mermaidCode.replace(/`/g, '\\`')}\`);
            
            return svg;
          } catch (error) {
            throw new Error('Mermaid rendering error: ' + error.message);
          }
        })();
      `).then((svg: string) => {
        clearTimeout(timeout);
        resolve(svg);
      }).catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * キャッシュされたSVGを取得
   */
  private async getCachedSvg(hash: string): Promise<{ svg: string; path: string } | null> {
    try {
      const { paths } = await this.workspaceService.resolve();
      const cachePath = path.join(paths.cache, 'mermaid', `${hash}.svg`);
      
      const svg = await fs.readFile(cachePath, 'utf-8');
      return { svg, path: cachePath };
    } catch (error) {
      return null; // キャッシュが存在しない
    }
  }

  /**
   * SVGをキャッシュに保存
   */
  private async saveSvgToCache(hash: string, svg: string): Promise<string> {
    try {
      const { paths } = await this.workspaceService.resolve();
      const cacheDir = path.join(paths.cache, 'mermaid');
      const cachePath = path.join(cacheDir, `${hash}.svg`);

      // キャッシュディレクトリを作成
      await fs.mkdir(cacheDir, { recursive: true });

      // SVGファイルを保存
      await fs.writeFile(cachePath, svg, 'utf-8');

      console.log(`✅ Mermaid SVG cached: ${hash}.svg`);
      return cachePath;

    } catch (error) {
      console.warn('Failed to cache Mermaid SVG:', error);
      throw error;
    }
  }

  /**
   * ハッシュ値を生成（キャッシュキー用）
   */
  private generateHash(mermaidCode: string, options: MermaidRenderOptions): string {
    const content = JSON.stringify({ mermaidCode, options });
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Mermaidレンダリング用HTMLテンプレートを取得
   */
  private getMermaidHtmlTemplate(): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mermaid Renderer</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11.10.1/dist/mermaid.min.js"></script>
  <style>
    body {
      font-family: 'Noto Sans JP', sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
    }
    .mermaid {
      text-align: center;
    }
  </style>
</head>
<body>
  <div id="mermaid-container"></div>
  <script>
    // Mermaidを初期化（後でJavaScriptから設定される）
    console.log('Mermaid renderer page loaded');
  </script>
</body>
</html>`;
  }

  /**
   * キャッシュをクリア
   */
  public async clearCache(): Promise<void> {
    try {
      const { paths } = await this.workspaceService.resolve();
      const cacheDir = path.join(paths.cache, 'mermaid');
      
      try {
        const files = await fs.readdir(cacheDir);
        for (const file of files) {
          if (file.endsWith('.svg')) {
            await fs.unlink(path.join(cacheDir, file));
          }
        }
        console.log('✅ Mermaid cache cleared');
      } catch (error) {
        // キャッシュディレクトリが存在しない場合は無視
        if ((error as any).code !== 'ENOENT') {
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to clear Mermaid cache:', error);
      throw error;
    }
  }

  /**
   * キャッシュ統計情報を取得
   */
  public async getCacheStats(): Promise<{
    fileCount: number;
    totalSize: number;
    oldestFile: Date | null;
    newestFile: Date | null;
  }> {
    try {
      const { paths } = await this.workspaceService.resolve();
      const cacheDir = path.join(paths.cache, 'mermaid');
      
      try {
        const files = await fs.readdir(cacheDir);
        const svgFiles = files.filter(file => file.endsWith('.svg'));
        
        if (svgFiles.length === 0) {
          return { fileCount: 0, totalSize: 0, oldestFile: null, newestFile: null };
        }

        let totalSize = 0;
        let oldestFile: Date | null = null;
        let newestFile: Date | null = null;

        for (const file of svgFiles) {
          const filePath = path.join(cacheDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;

          if (!oldestFile || stats.mtime < oldestFile) {
            oldestFile = stats.mtime;
          }
          if (!newestFile || stats.mtime > newestFile) {
            newestFile = stats.mtime;
          }
        }

        return {
          fileCount: svgFiles.length,
          totalSize,
          oldestFile,
          newestFile
        };
      } catch (error) {
        return { fileCount: 0, totalSize: 0, oldestFile: null, newestFile: null };
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { fileCount: 0, totalSize: 0, oldestFile: null, newestFile: null };
    }
  }

  /**
   * レンダーワーカーを終了
   */
  public destroy(): void {
    if (this.renderWindow && !this.renderWindow.isDestroyed()) {
      this.renderWindow.destroy();
      this.renderWindow = null;
    }
    this.isInitialized = false;
    console.log('✅ MermaidRenderWorker destroyed');
  }

  /**
   * レンダーワーカーが初期化されているかチェック
   */
  public isReady(): boolean {
    return this.isInitialized && 
           this.renderWindow !== null && 
           !this.renderWindow.isDestroyed();
  }
}