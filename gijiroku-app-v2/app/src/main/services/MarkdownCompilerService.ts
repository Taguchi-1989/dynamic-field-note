/**
 * MarkdownCompilerService - Markdown→PDF パイプライン
 * 
 * masterfile.md 仕様に基づく高品質PDF生成
 * - remark-parse → remark-gfm → remark-math → rehype-katex
 * - FrontMatter対応（toc, theme, pageSize等）
 * - KaTeX統合（オフラインフォント）
 * - Mermaid事前描画
 */

import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import grayMatter from 'gray-matter';
import * as path from 'path';
import * as fs from 'fs/promises';
import { WorkspaceService } from './WorkspaceService';
import { MermaidRenderWorker } from './MermaidRenderWorker';
import { z } from 'zod';

// FrontMatter スキーマ
const FrontMatterSchema = z.object({
  title: z.string().optional(),
  author: z.string().optional(),
  date: z.string().optional(),
  toc: z.boolean().default(true),
  theme: z.enum(['default', 'corporate']).default('default'),
  latex: z.enum(['katex', 'tectonic']).default('katex'),
  pageSize: z.enum(['A4', 'Letter']).default('A4'),
  marginMm: z.number().default(15),
  mermaid: z.object({
    theme: z.string().default('default'),
  }).optional(),
});

export type FrontMatter = z.infer<typeof FrontMatterSchema>;

export interface MarkdownCompileOptions {
  latex?: 'katex' | 'tectonic';
  theme?: 'default' | 'corporate';
  toc?: boolean;
  pageSize?: 'A4' | 'Letter';
  marginMm?: number;
  title?: string;
  author?: string;
  date?: string;
}

export interface MarkdownCompileInput {
  mdPath?: string;        // 既存ファイル
  mdContent?: string;     // 文字列直渡し
  pdfPath?: string;       // 明示保存先
  options?: MarkdownCompileOptions;
}

export interface MarkdownCompileResult {
  htmlContent: string;
  frontMatter: FrontMatter;
  warnings: string[];
}

export class MarkdownCompilerService {
  private static instance: MarkdownCompilerService;
  private workspaceService: WorkspaceService;
  private mermaidWorker: MermaidRenderWorker;
  private processor: any;

  private constructor() {
    this.workspaceService = WorkspaceService.getInstance();
    this.mermaidWorker = MermaidRenderWorker.getInstance();
    // 初期化を非同期で実行（コンストラクタでは同期的に処理）
    this.initializeProcessor().catch(error => {
      console.error('❌ Failed to initialize MarkdownCompilerService:', error);
    });
  }

  public static getInstance(): MarkdownCompilerService {
    if (!MarkdownCompilerService.instance) {
      MarkdownCompilerService.instance = new MarkdownCompilerService();
    }
    return MarkdownCompilerService.instance;
  }

  /**
   * remark/rehype プロセッサーを初期化
   */
  private async initializeProcessor(): Promise<void> {
    try {
      console.log('🔄 Initializing remark processor...');
      
      // 安全な方法で段階的にプロセッサーを構築
      this.processor = remark();
      
      // オプションプラグインを個別に追加
      try {
        const remarkGfm = await import('remark-gfm');
        if (remarkGfm && typeof remarkGfm.default === 'function') {
          this.processor = this.processor.use(remarkGfm.default);
          console.log('✅ remark-gfm loaded');
        }
      } catch (gfmError) {
        console.warn('⚠️ remark-gfm not available, continuing without it');
      }
      
      // 基本的な変換チェーンを設定
      try {
        // remarkRehypeを正しくインポートして使用
        const { default: remarkRehypePlugin } = await import('remark-rehype');
        this.processor = this.processor.use(remarkRehypePlugin, {
          allowDangerousHtml: true
        });
        console.log('✅ remark-rehype loaded');
      } catch (rehypeError) {
        console.warn('⚠️ remark-rehype error:', rehypeError);
        // フォールバックプロセッサーを使用
        this.processor = this.processor.use(remarkRehype, {
          allowDangerousHtml: true
        });
      }
      
      // rehype plugins を追加
      try {
        const { default: rehypeRawPlugin } = await import('rehype-raw');
        this.processor = this.processor.use(rehypeRawPlugin);
        console.log('✅ rehype-raw loaded');
      } catch (rawError) {
        console.warn('⚠️ rehype-raw not available, continuing without it');
        // フォールバック
        try {
          this.processor = this.processor.use(rehypeRaw);
        } catch (fallbackError) {
          console.warn('⚠️ rehype-raw fallback failed, skipping');
        }
      }
      
      try {
        const { default: rehypeStringifyPlugin } = await import('rehype-stringify');
        this.processor = this.processor.use(rehypeStringifyPlugin);
        console.log('✅ rehype-stringify loaded');
      } catch (stringifyError) {
        console.warn('⚠️ rehype-stringify error:', stringifyError);
        // フォールバック
        try {
          this.processor = this.processor.use(rehypeStringify);
        } catch (fallbackError) {
          console.error('❌ rehype-stringify fallback failed');
          throw fallbackError;
        }
      }

      console.log('✅ MarkdownCompilerService processor initialized');
    } catch (error) {
      console.error('❌ Failed to initialize remark processor:', error);
      
      // シンプルなフォールバック
      this.processor = {
        process: async (content: string) => {
          // 基本的なMarkdown → HTMLの手動変換
          let html = content;
          html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
          html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
          html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
          html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
          html = html.replace(/\n\n/g, '</p><p>');
          html = '<p>' + html + '</p>';
          return { toString: () => html };
        }
      };
      console.log('⚠️ Using manual fallback processor');
    }
  }

  /**
   * 初期化が完了するまで待機
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.processor) {
      console.log('⏳ Waiting for MarkdownCompilerService initialization...');
      await this.initializeProcessor();
    }
  }

  /**
   * Markdownコンテンツを処理してHTMLに変換
   */
  public async compileToHtml(input: MarkdownCompileInput): Promise<MarkdownCompileResult> {
    await this.ensureInitialized();
    const warnings: string[] = [];
    
    try {
      // Markdownコンテンツの取得
      let mdContent: string;
      if (input.mdPath) {
        mdContent = await fs.readFile(input.mdPath, 'utf-8');
      } else if (input.mdContent) {
        mdContent = input.mdContent;
      } else {
        throw new Error('Either mdPath or mdContent must be provided');
      }

      // FrontMatter解析
      const matter = grayMatter(mdContent);
      const frontMatter = FrontMatterSchema.parse({
        ...matter.data,
        ...input.options,
        // optionsのtitleを最優先で設定
        title: input.options?.title || matter.data?.title || 'Document'
      });

      // Mermaidブロックの事前処理
      const processedContent = await this.preprocessMermaid(matter.content, warnings);

      // プロセッサーが未初期化の場合は初期化
      if (!this.processor) {
        await this.initializeProcessor();
      }

      // Markdown → HTML変換
      const vfile = await this.processor.process(processedContent);
      let htmlContent = String(vfile);

      // カスタムCSSの適用
      htmlContent = await this.applyCustomStyles(htmlContent, frontMatter);

      // TOC生成（無効化）
      // if (frontMatter.toc) {
      //   htmlContent = this.generateToc(htmlContent);
      // }

      return {
        htmlContent,
        frontMatter,
        warnings
      };

    } catch (error) {
      console.error('Markdown compilation error:', error);
      throw new Error(`Failed to compile markdown: ${error}`);
    }
  }

  /**
   * Mermaidコードブロックを事前描画
   */
  private async preprocessMermaid(content: string, warnings: string[]): Promise<string> {
    const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
    let processedContent = content;
    let match;

    while ((match = mermaidRegex.exec(content)) !== null) {
      try {
        const mermaidCode = match[1].trim();
        const svgResult = await this.mermaidWorker.renderToSvg(mermaidCode);
        
        // SVGをdata URLとして埋め込み
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svgResult.svg).toString('base64')}`;
        const imgTag = `<img src="${dataUrl}" alt="Mermaid diagram" class="mermaid-diagram" />`;
        
        processedContent = processedContent.replace(match[0], imgTag);
        console.log('✅ Mermaid diagram preprocessed and cached');
        
      } catch (error) {
        console.warn('Mermaid preprocessing failed:', error);
        warnings.push(`Mermaid diagram could not be rendered: ${error}`);
        
        // フォールバック: コードブロックとして残す
        const fallback = `<pre><code class="language-mermaid">${match[1]}</code></pre>`;
        processedContent = processedContent.replace(match[0], fallback);
      }
    }

    return processedContent;
  }

  /**
   * カスタムスタイルを適用
   */
  private async applyCustomStyles(htmlContent: string, frontMatter: FrontMatter): Promise<string> {
    try {
      const { paths } = await this.workspaceService.resolve();
      
      // ベーステンプレート読み込み
      const templateContent = await this.loadHtmlTemplate(frontMatter.theme);
      
      // KaTeXスタイル
      const katexCss = await this.getKatexCss();
      
      // Mermaidスタイル
      const mermaidCss = await this.getMermaidCss();
      
      // カスタムスタイル
      const customCss = this.generateCustomCss(frontMatter);

      // HTMLテンプレートに内容を注入
      console.log('🔧 Template processing:');
      console.log('  - Title:', frontMatter.title || 'Document');
      console.log('  - Template contains {{TITLE}}:', templateContent.includes('{{TITLE}}'));
      
      const finalHtml = templateContent
        .replace(/\{\{TITLE\}\}/g, frontMatter.title || 'Document')
        .replace(/\{\{AUTHOR\}\}/g, frontMatter.author || '')
        .replace(/\{\{DATE\}\}/g, frontMatter.date || new Date().toLocaleDateString('ja-JP'))
        .replace(/\{\{KATEX_CSS\}\}/g, katexCss)
        .replace(/\{\{MERMAID_CSS\}\}/g, mermaidCss)
        .replace(/\{\{CUSTOM_CSS\}\}/g, customCss)
        .replace(/\{\{CONTENT\}\}/g, htmlContent);

      // デバッグ: 置換後の{{TITLE}}残存確認
      const remainingTitles = finalHtml.match(/\{\{TITLE\}\}/g);
      if (remainingTitles) {
        console.warn('⚠️ {{TITLE}} placeholders still remaining:', remainingTitles.length);
        console.log('Final HTML snippet:', finalHtml.substring(0, 500));
      } else {
        console.log('✅ All {{TITLE}} placeholders successfully replaced');
      }

      return finalHtml;

    } catch (error) {
      console.warn('Custom styles application failed:', error);
      return htmlContent; // フォールバック
    }
  }

  /**
   * HTMLテンプレートを読み込み
   */
  private async loadHtmlTemplate(theme: string): Promise<string> {
    const resourcesDir = this.getResourcesDir();
    const templatePath = path.join(resourcesDir, 'templates', 'html', `${theme}.html`);
    
    try {
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      console.warn(`Template ${theme}.html not found, using default`);
      return this.getDefaultHtmlTemplate();
    }
  }

  /**
   * デフォルトHTMLテンプレート（シンプル版）
   */
  private getDefaultHtmlTemplate(): string {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <style>
    {{KATEX_CSS}}
    {{MERMAID_CSS}}
    {{CUSTOM_CSS}}
  </style>
</head>
<body>
  <main class="document-content">
    {{CONTENT}}
  </main>
</body>
</html>`;
  }

  /**
   * KaTeX CSSを取得
   */
  private async getKatexCss(): Promise<string> {
    const resourcesDir = this.getResourcesDir();
    const katexCssPath = path.join(resourcesDir, 'katex', 'katex.min.css');
    
    try {
      return await fs.readFile(katexCssPath, 'utf-8');
    } catch (error) {
      console.warn('KaTeX CSS not found, using CDN fallback');
      return `@import url('https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/katex.min.css');`;
    }
  }

  /**
   * Mermaid CSSを取得
   */
  private async getMermaidCss(): Promise<string> {
    const resourcesDir = this.getResourcesDir();
    const mermaidCssPath = path.join(resourcesDir, 'themes', 'mermaid', 'mermaid-theme.css');
    
    try {
      return await fs.readFile(mermaidCssPath, 'utf-8');
    } catch (error) {
      console.warn('Mermaid CSS not found');
      return '';
    }
  }

  /**
   * カスタムCSSを生成
   */
  private generateCustomCss(frontMatter: FrontMatter): string {
    return `
/* Document styles */
body {
  font-family: 'Noto Sans JP', sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: none;
  margin: 0;
  padding: 20mm;
}

/* 見出しの文字間隔を修正 */
h1, h2, h3, h4, h5, h6 {
  letter-spacing: normal !important;
  word-spacing: normal !important;
  font-weight: 600;
  line-height: 1.3;
  margin: 0.8em 0 0.4em 0;
}

h1 { 
  font-size: 1.8em; 
  margin-top: 0;
  margin-bottom: 0.6em;
  border-bottom: 2px solid #333;
  padding-bottom: 0.3em;
}

h2 { 
  font-size: 1.5em; 
  margin-top: 1.2em;
  margin-bottom: 0.5em;
}

h3 { 
  font-size: 1.3em; 
}

h4 { 
  font-size: 1.1em; 
}

h5, h6 { 
  font-size: 1em; 
}

.document-header {
  border-bottom: 2px solid #2196f3;
  margin-bottom: 2em;
  padding-bottom: 1em;
}

.document-header h1 {
  color: #2196f3;
  margin: 0;
  font-size: 2em;
}

.document-meta {
  margin-top: 0.5em;
  color: #666;
}

.document-meta .author,
.document-meta .date {
  margin-right: 2em;
}

/* Table styles */
table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

th {
  background-color: #f5f5f5;
  font-weight: 600;
}

/* Code styles */
code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Consolas', monospace;
}

pre {
  background-color: #f5f5f5;
  padding: 1em;
  border-radius: 5px;
  overflow-x: auto;
}

pre code {
  background: none;
  padding: 0;
}

/* Mermaid diagram styles */
.mermaid-diagram {
  display: block;
  margin: 1em auto;
  max-width: 100%;
  height: auto;
}

/* Print optimization */
@media print {
  body {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
    padding: ${frontMatter.marginMm}mm;
  }
  
  .document-header {
    page-break-after: avoid;
  }
  
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }
  
  table {
    page-break-inside: avoid;
  }
  
  .mermaid-diagram {
    page-break-inside: avoid;
  }
}

/* Page size optimization */
@page {
  size: ${frontMatter.pageSize};
  margin: ${frontMatter.marginMm}mm;
}
`;
  }

  /**
   * 目次を生成
   */
  private generateToc(htmlContent: string): string {
    const headingRegex = /<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi;
    const headings: { level: number; text: string; id: string }[] = [];
    let match;

    // 見出しを抽出
    while ((match = headingRegex.exec(htmlContent)) !== null) {
      const level = parseInt(match[1]);
      const text = match[2].replace(/<[^>]*>/g, ''); // HTMLタグを除去
      const id = `heading-${headings.length + 1}`;
      headings.push({ level, text, id });
    }

    if (headings.length === 0) {
      return htmlContent; // 見出しがない場合はそのまま返す
    }

    // 見出しにIDを追加
    headings.forEach((heading, index) => {
      const originalHeading = new RegExp(`<h${heading.level}([^>]*)>(.*?)<\/h${heading.level}>`, 'i');
      htmlContent = htmlContent.replace(originalHeading, 
        `<h${heading.level} id="${heading.id}"$1>$2</h${heading.level}>`);
    });

    // 目次HTML生成
    const tocHtml = headings.map(heading => {
      const indent = '  '.repeat(heading.level - 1);
      return `${indent}<li><a href="#${heading.id}">${heading.text}</a></li>`;
    }).join('\n');

    const tocSection = `
<nav class="table-of-contents">
  <h2>目次</h2>
  <ul>
${tocHtml}
  </ul>
</nav>
`;

    // 目次を本文の前に挿入
    return htmlContent.replace(
      '<main class="document-content">',
      `<main class="document-content">${tocSection}`
    );
  }

  /**
   * resourcesディレクトリのパスを取得
   */
  private getResourcesDir(): string {
    if (process.env.NODE_ENV === 'development') {
      return path.join(__dirname, '../../../resources');
    } else {
      return path.join(process.resourcesPath, 'resources');
    }
  }
}