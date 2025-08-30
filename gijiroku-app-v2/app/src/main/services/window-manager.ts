import { BrowserWindow, screen, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;
  private isDevelopment = !app.isPackaged; // より確実な環境判定

  async createMainWindow(): Promise<BrowserWindow> {
    console.log('🪟 Creating main window...');
    console.log('📱 Environment:', { 
      isDevelopment: this.isDevelopment, 
      isPackaged: app.isPackaged,
      nodeEnv: process.env.NODE_ENV 
    });
    console.log('📁 App paths:', {
      appPath: app.getAppPath(),
      userData: app.getPath('userData'),
      exe: app.getPath('exe'),
      cwd: process.cwd(),
      __dirname: __dirname
    });
    
    // プライマリディスプレイの作業領域を取得
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;
    console.log('Display size:', { width, height });

    // ハードウェアアクセラレーション設定（環境変数で制御）
    if (process.env.DISABLE_GPU === 'true') {
      app.disableHardwareAcceleration();
      console.log('🚫 Hardware acceleration disabled');
    }

    // アイコンパスを設定（開発・本番環境対応）
    const getIconPath = (): string => {
      if (this.isDevelopment) {
        // 開発環境: resourcesディレクトリから
        return path.join(process.cwd(), 'resources', 'icons', 'favicon.ico');
      } else {
        // 本番環境: アプリパッケージ内のresourcesから
        return path.join(process.resourcesPath, 'resources', 'icons', 'favicon.ico');
      }
    };

    const iconPath = getIconPath();
    console.log('🎨 Icon path:', iconPath);

    // ウィンドウ設定
    const windowConfig = {
      width: Math.min(1400, Math.floor(width * 0.8)),
      height: Math.min(900, Math.floor(height * 0.8)),
      minWidth: 1024,
      minHeight: 768,
      show: false, // ready-to-showまで非表示
      backgroundColor: '#ffffff', // 白い背景設定
      icon: iconPath, // アプリケーションアイコン設定
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        sandbox: true, // セキュリティ強化
        webSecurity: true, // 本番環境では常にセキュリティを有効化
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.cjs')  // asar内：dist-electron/preload.cjs
          : path.join(__dirname, 'preload.cjs')
      },
      titleBarStyle: 'default' as const
    };
    
    console.log('Window config:', windowConfig);

    this.mainWindow = new BrowserWindow(windowConfig);

    // 包括的なエラーハンドリングを設定
    this.setupErrorHandlers();

    // ready-to-showで表示
    this.mainWindow.once('ready-to-show', () => {
      console.log('✅ Window ready-to-show event fired');
      if (this.mainWindow) {
        this.mainWindow.show();
        this.mainWindow.focus();
        console.log('✅ Window shown and focused');
      }
    });

    // コンテンツ読み込み
    if (this.isDevelopment) {
      await this.loadDevelopment();
    } else {
      await this.loadProduction();
    }

    // ウィンドウイベント設定
    this.setupWindowEvents();

    return this.mainWindow;
  }

  private async loadDevelopment(): Promise<void> {
    if (!this.mainWindow) return;
    
    // 開発用：Vite devサーバー
    const devServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';
    
    try {
      console.log(`🔌 Connecting to dev server: ${devServerUrl}`);
      await this.mainWindow.loadURL(devServerUrl);
      this.mainWindow.webContents.openDevTools({ mode: 'detach' });
      console.log('✅ Connected to dev server');
    } catch (error) {
      console.error('❌ Failed to connect to dev server:', error);
      await this.mainWindow.loadURL(`data:text/html,${this.getDevErrorHtml()}`);
    }
  }

  private async loadProduction(): Promise<void> {
    if (!this.mainWindow) return;

    // 本番用：HTMLファイルを直接読み込み（asar対応）
    const indexPath = app.isPackaged 
      ? path.join(__dirname, '../dist/index.html')  // asar内：dist-electron/../dist/index.html
      : path.join(__dirname, '../../dist/index.html');
    
    console.log('📄 Loading production HTML from:', indexPath);
    
    if (!fs.existsSync(indexPath)) {
      console.error('❌ index.html not found:', indexPath);
      await this.mainWindow.loadURL(`data:text/html,${this.getErrorHtml()}`);
      return;
    }

    try {
      await this.mainWindow.loadFile(indexPath);
      console.log('✅ Production HTML loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load production HTML:', error);
      await this.mainWindow.loadURL(`data:text/html,${this.getErrorHtml()}`);
    }
  }

  private setupErrorHandlers(): void {
    if (!this.mainWindow) return;

    // ページ読み込み失敗
    this.mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDesc, validatedURL) => {
      console.error('🚨 did-fail-load:', { errorCode, errorDesc, validatedURL });
    });

    // レンダラープロセス異常終了
    this.mainWindow.webContents.on('render-process-gone', (event, details) => {
      console.error('🚨 render-process-gone:', details);
      if (details.reason === 'crashed') {
        this.showCrashDialog();
      }
    });

    // レンダラーの応答停止
    this.mainWindow.webContents.on('unresponsive', () => {
      console.error('🚨 Renderer process became unresponsive');
    });

    // レンダラーの応答回復
    this.mainWindow.webContents.on('responsive', () => {
      console.log('✅ Renderer process became responsive again');
    });

    // レンダラーのコンソールメッセージ転送
    this.mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      const logLevel = level === 1 ? 'warn' : level === 2 ? 'error' : 'log';
      console[logLevel as 'log'](`[Renderer ${level}] ${message} (${sourceId}:${line})`);
    });
  }

  private showCrashDialog(): void {
    // クラッシュダイアログの実装（必要に応じて）
    console.log('💥 Renderer crashed - showing recovery options');
  }

  private getErrorHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>アプリケーションエラー</title>
        </head>
        <body style="font-family: system-ui; padding: 40px; background: #f5f5f5; color: #333;">
          <h1>⚠️ アプリケーションの読み込みエラー</h1>
          <p>アプリケーションファイルが見つかりません。</p>
          <p>以下を確認してください：</p>
          <ul>
            <li>アプリケーションが正しくビルドされているか</li>
            <li>frontend/dist/index.html が存在するか</li>
            <li>electron-builderの設定が正しいか</li>
          </ul>
          <p><small>パッケージ版: ${app.isPackaged}</small></p>
        </body>
      </html>
    `;
  }

  private getDevErrorHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>開発サーバー接続エラー</title>
        </head>
        <body style="font-family: system-ui; padding: 40px; background: #fff3cd; color: #856404;">
          <h1>⚠️ 開発サーバーに接続できません</h1>
          <p>Vite開発サーバーが起動していない可能性があります。</p>
          <p>以下を確認してください：</p>
          <ul>
            <li><code>npm run dev:frontend</code> が実行されているか</li>
            <li>http://localhost:5173 にアクセスできるか</li>
            <li>ファイアウォールがポート5173をブロックしていないか</li>
          </ul>
        </body>
      </html>
    `;
  }

  private setupWindowEvents(): void {
    if (!this.mainWindow) return;

    // ウィンドウクローズイベント
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // ウィンドウ最小化復元時の処理
    this.mainWindow.on('restore', () => {
      if (this.mainWindow) {
        this.mainWindow.focus();
      }
    });

    // Web Contents のセキュリティ設定
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      // 開発環境以外では外部URLへのナビゲーションを制限
      if (!this.isDevelopment && !url.startsWith('file://')) {
        event.preventDefault();
        console.warn('🚫 Blocked navigation to:', url);
      }
    });
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  isMainWindowOpen(): boolean {
    return this.mainWindow !== null && !this.mainWindow.isDestroyed();
  }

  focusMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
    }
  }

  closeMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
  }
}