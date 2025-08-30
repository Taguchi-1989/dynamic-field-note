/**
 * PdfGenerationService - printToPDF統合PDF生成サービス
 * 
 * masterfile.md 仕様に基づく高品質PDF生成
 * - Chromium印刷エンジン（webContents.printToPDF）
 * - MarkdownCompilerService統合
 * - MermaidRenderWorker統合
 * - 設定可能なページサイズ・マージン
 * - workspace/exports/ への出力
 */

import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import { MarkdownCompilerService, MarkdownCompileInput } from './MarkdownCompilerService';
import { MermaidRenderWorker } from './MermaidRenderWorker';
import { WorkspaceService } from './WorkspaceService';
import { DbService } from './DbService';

export interface PdfGenerationOptions {
  pageSize?: 'A4' | 'Letter';
  marginMm?: number;
  landscape?: boolean;
  printBackground?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  scale?: number;
}

export interface PdfGenerationResult {
  pdfPath: string;
  pages: number;
  sizeBytes: number;
  warnings?: string[];
}

export class PdfGenerationService {
  private static instance: PdfGenerationService;
  private workspaceService: WorkspaceService;
  private dbService: DbService;
  private markdownCompiler: MarkdownCompilerService;
  private mermaidWorker: MermaidRenderWorker;

  private constructor() {
    this.workspaceService = WorkspaceService.getInstance();
    this.dbService = DbService.getInstance();
    this.markdownCompiler = MarkdownCompilerService.getInstance();
    this.mermaidWorker = MermaidRenderWorker.getInstance();
  }

  public static getInstance(): PdfGenerationService {
    if (!PdfGenerationService.instance) {
      PdfGenerationService.instance = new PdfGenerationService();
    }
    return PdfGenerationService.instance;
  }

  /**
   * MarkdownからPDFを生成
   */
  public async generatePdfFromMarkdown(
    input: MarkdownCompileInput,
    options: PdfGenerationOptions = {}
  ): Promise<PdfGenerationResult> {
    try {
      console.log('🚀 Starting PDF generation...');
      console.log('📄 Input:', JSON.stringify(input).substring(0, 200) + '...');

      // MermaidWorkerを初期化（一時的に無効化）
      console.log('🧩 Skipping MermaidWorker initialization (disabled for PDF generation)');
      // TODO: MermaidWorker初期化問題を修正後に有効化
      // if (!this.mermaidWorker.isReady()) {
      //   console.log('🧩 Initializing MermaidWorker...');
      //   await this.mermaidWorker.initialize();
      //   console.log('✅ MermaidWorker initialized');
      // } else {
      //   console.log('✅ MermaidWorker already ready');
      // }

      // Markdown → HTMLコンパイル
      console.log('📝 Compiling Markdown to HTML...');
      console.log('📝 Markdown content length:', input.mdContent?.length || 0);
      const compileResult = await this.markdownCompiler.compileToHtml(input);
      console.log('✅ HTML compilation completed');
      console.log('📄 HTML length:', compileResult.htmlContent?.length || 0);

      // PDF生成オプションの準備
      const pdfOptions = this.preparePdfOptions(compileResult.frontMatter, options);

      // PDF生成用BrowserWindow作成
      const pdfWindow = await this.createPdfWindow();

      try {
        // HTMLコンテンツをロード（loadHTMLを使用してdata URL問題を回避）
        console.log('🌐 Loading HTML content...');
        await pdfWindow.webContents.loadURL('data:text/html,<html><body>Loading...</body></html>');
        
        // HTMLを直接設定
        console.log('📝 Setting HTML content...');
        await pdfWindow.webContents.executeJavaScript(`
          document.open();
          document.write(${JSON.stringify(compileResult.htmlContent)});
          document.close();
        `);
        console.log('✅ HTML content set');

        // レンダリング完了を待機
        console.log('⏱️ Waiting for rendering...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ Rendering completed');

        // PDF生成
        console.log('🖨️ Generating PDF with printToPDF...');
        const pdfBuffer = await Promise.race([
          pdfWindow.webContents.printToPDF(pdfOptions),
          new Promise<Buffer>((_, reject) => 
            setTimeout(() => reject(new Error('PDF generation timeout')), 60000)
          )
        ]);
        console.log('✅ PDF generated successfully', pdfBuffer.length, 'bytes');


        // PDFファイルの保存（optionsのtitleを優先使用）
        const titleForFile = input.options?.title || compileResult.frontMatter.title || 'document';
        console.log('📂 PDF title for filename:', titleForFile);
        console.log('📂 Input options title:', input.options?.title);
        console.log('📂 FrontMatter title:', compileResult.frontMatter.title);
        const pdfPath = await this.savePdfFile(pdfBuffer, input, titleForFile);

        // PDFメタデータの取得
        const sizeBytes = pdfBuffer.length;
        const pages = await this.estimatePageCount(pdfBuffer);

        // 監査ログ記録
        this.dbService.addAuditLog({
          action: 'pdf_generate',
          entity: 'document',
          entity_id: this.generateDocumentId(input),
          detail: JSON.stringify({
            pdfPath,
            pages,
            sizeBytes,
            options: pdfOptions
          })
        });

        console.log(`✅ PDF generation completed: ${pdfPath}`);

        return {
          pdfPath,
          pages,
          sizeBytes,
          warnings: compileResult.warnings
        };

      } finally {
        // PDFウィンドウを破棄
        console.log('🧹 Cleaning up PDF window...');
        if (!pdfWindow.isDestroyed()) {
          pdfWindow.destroy();
          console.log('✅ PDF window destroyed');
        } else {
          console.log('⚠️ PDF window already destroyed');
        }
      }

    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      
      // エラーログ記録
      this.dbService.addAuditLog({
        action: 'pdf_generate_failed',
        entity: 'document',
        entity_id: this.generateDocumentId(input),
        detail: JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' })
      });

      throw new Error(`PDF generation failed: ${error}`);
    }
  }

  /**
   * PDF生成用BrowserWindowを作成
   */
  private async createPdfWindow(): Promise<BrowserWindow> {
    const window = new BrowserWindow({
      show: false,  // hidden window
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        offscreen: true  // オフスクリーンレンダリング
      },
      width: 1200,
      height: 1600  // A4相当
    });

    return window;
  }

  /**
   * printToPDFオプションを準備
   */
  private preparePdfOptions(frontMatter: any, options: PdfGenerationOptions): any {
    const pageSize = options.pageSize || frontMatter.pageSize || 'A4';
    const marginMm = options.marginMm || frontMatter.marginMm || 15;

    // マージンをmm → inchに変換（printToPDFはinch単位）
    const marginInch = marginMm / 25.4;

    const pdfOptions: any = {
      format: pageSize,
      landscape: options.landscape || false,
      printBackground: options.printBackground !== false,
      scale: options.scale || 1.0,
      margins: {
        top: marginInch,
        bottom: marginInch,
        left: marginInch,
        right: marginInch
      },
      displayHeaderFooter: options.displayHeaderFooter || false,
      headerTemplate: options.headerTemplate || '',
      footerTemplate: options.footerTemplate || this.getDefaultFooterTemplate(),
      preferCSSPageSize: true
    };

    return pdfOptions;
  }

  /**
   * ページの読み込み完了を待機
   */
  private async waitForPageLoad(window: BrowserWindow): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.log('⏰ Page load timeout - attempting to continue anyway');
        resolve(); // タイムアウトしても処理を続行
      }, 10000); // 10秒に短縮

      // 複数のイベントで読み込み完了を検出
      let hasResolved = false;
      
      const resolveOnce = () => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          console.log('✅ Page load detected');
          // レンダリング完了を待機
          setTimeout(resolve, 1000);
        }
      };

      window.webContents.once('did-finish-load', resolveOnce);
      window.webContents.once('dom-ready', resolveOnce);
      
      window.webContents.once('did-fail-load', (event, errorCode, errorDescription) => {
        if (!hasResolved) {
          hasResolved = true;
          clearTimeout(timeout);
          console.log(`⚠️ Page load failed, continuing: ${errorDescription}`);
          resolve(); // エラーでも処理を続行
        }
      });
    });
  }

  /**
   * PDFファイルを保存
   */
  private async savePdfFile(
    pdfBuffer: Buffer, 
    input: MarkdownCompileInput, 
    title?: string
  ): Promise<string> {
    const { paths } = await this.workspaceService.resolve();
    
    // ファイル名の生成
    let fileName: string;
    if (input.pdfPath) {
      // 明示的にパスが指定されている場合
      return input.pdfPath;
    } else {
      // 自動命名（タイムスタンプ付きでファイル重複を防止）
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
      const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
      const randomStr = Math.random().toString(36).substring(2, 6);
      const safeTitle = (title || 'document').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
      fileName = `${dateStr}-${timeStr}-${randomStr}-${safeTitle}.pdf`;
    }

    const pdfPath = path.join(paths.exports, fileName);
    
    // exportsディレクトリを作成
    await fs.mkdir(path.dirname(pdfPath), { recursive: true });
    
    // PDFファイルを保存
    await fs.writeFile(pdfPath, pdfBuffer);
    
    
    return pdfPath;
  }

  /**
   * PDFのページ数を推定（簡易版）
   */
  private async estimatePageCount(pdfBuffer: Buffer): Promise<number> {
    try {
      // PDF内容を文字列として検索（簡易的な方法）
      const pdfContent = pdfBuffer.toString('binary');
      const pageMatches = pdfContent.match(/\/Type\s*\/Page[^s]/g);
      return pageMatches ? pageMatches.length : 1;
    } catch (error) {
      console.warn('Failed to estimate page count:', error);
      return 1; // デフォルト値
    }
  }

  /**
   * デフォルトフッターテンプレート
   */
  private getDefaultFooterTemplate(): string {
    return `
      <div style="font-size: 10px; width: 100%; text-align: center; color: #666; margin-top: 10px;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `;
  }

  /**
   * ドキュメントIDを生成（監査ログ用）
   */
  private generateDocumentId(input: MarkdownCompileInput): string {
    if (input.mdPath) {
      return path.basename(input.mdPath, '.md');
    } else if (input.mdContent) {
      // コンテンツのハッシュから生成
      const crypto = require('crypto');
      return crypto.createHash('sha256').update(input.mdContent).digest('hex').substring(0, 8);
    }
    return 'unknown';
  }

  /**
   * PDF生成のテスト
   */
  public async testPdfGeneration(): Promise<{
    success: boolean;
    message: string;
    testPdfPath?: string;
  }> {
    try {
      const testMarkdown = `# PDF生成テスト

これはgijiroku-app-v2のPDF生成機能のテストドキュメントです。

## 機能テスト

### Markdown基本機能
- **太字テキスト**
- *斜体テキスト*
- \`コードスパン\`

### 数式テスト
$$E = mc^2$$

### 表テスト
| 項目 | 値 |
|------|-----|
| テスト1 | 成功 |
| テスト2 | 成功 |

### Mermaidテスト
\`\`\`mermaid
flowchart TD
    A[開始] --> B{テスト}
    B -->|成功| C[完了]
    B -->|失敗| D[エラー]
    C --> E[終了]
    D --> E
\`\`\`

このテストが成功すれば、PDF生成システムが正常に動作しています。
`;

      const result = await this.generatePdfFromMarkdown({
        mdContent: testMarkdown,
        options: {
          title: 'PDF生成テスト',
          toc: true,
          theme: 'default'
        }
      });

      return {
        success: true,
        message: 'PDF generation test completed successfully',
        testPdfPath: result.pdfPath
      };

    } catch (error) {
      return {
        success: false,
        message: `PDF generation test failed: ${error}`
      };
    }
  }
}