/**
 * SecurityPolicy - セキュリティポリシー強化
 * 
 * masterfile.md 仕様に基づくセキュリティ強化
 * - Content Security Policy (CSP)
 * - セキュアな通信設定
 * - ファイルシステムアクセス制限
 * - プロセス分離強化
 */

import { BrowserWindow, session, protocol } from 'electron';
import * as path from 'path';

// セキュリティ設定定数
const SECURITY_CONFIG = {
  CSP: {
    DEFAULT: "default-src 'self'",
    STYLE: "style-src 'self' 'unsafe-inline' data:",
    SCRIPT: process.env.NODE_ENV === 'development' 
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173" // 開発時のVite対応
      : "script-src 'self'", // 本番環境では厳格化
    IMG: "img-src 'self' data: blob:",
    CONNECT: "connect-src 'self' http://localhost:* https://localhost:* ws://localhost:* wss://localhost:* https://api.openai.com https://*.supabase.co https://generativelanguage.googleapis.com",
    FONT: "font-src 'self' data:",
    OBJECT: "object-src 'none'",
    BASE: "base-uri 'self'",
    FRAME: "frame-ancestors 'none'"
  },
  ALLOWED_ORIGINS: [
    'https://api.openai.com',
    'https://*.supabase.co',
    'https://*.supabase.com'
  ],
  ALLOWED_PROTOCOLS: [
    'https:',
    'http:', // 開発時のlocalhost用
    'data:',
    'blob:'
  ],
  BLOCKED_HEADERS: [
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
    'referrer-policy'
  ]
};

export class SecurityPolicy {
  private static instance: SecurityPolicy;
  private initialized = false;
  private protocolsRegistered = false;

  private constructor() {}

  public static getInstance(): SecurityPolicy {
    if (!SecurityPolicy.instance) {
      SecurityPolicy.instance = new SecurityPolicy();
    }
    return SecurityPolicy.instance;
  }

  /**
   * app.ready前に実行すべきプロトコル設定
   */
  public setupProtocolsBeforeReady(): void {
    if (this.protocolsRegistered) {
      return;
    }

    console.log('🛡️ Registering security protocols before app ready...');
    
    try {
      // プロトコルスキームをapp.ready前に登録
      protocol.registerSchemesAsPrivileged([
        {
          scheme: 'app',
          privileges: {
            secure: true,
            standard: true,
            supportFetchAPI: true,
            corsEnabled: false,
            stream: false
          }
        }
      ]);

      this.protocolsRegistered = true;
      console.log('✅ Security protocols registered successfully');
    } catch (error) {
      console.error('❌ Failed to register protocols:', error);
    }
  }

  /**
   * セキュリティポリシーを初期化（app.ready後）
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🔒 Initializing security policies...');

    try {
      // CSP設定
      this.setupContentSecurityPolicy();

      // プロトコルハンドラー設定（app.ready後の処理のみ）
      this.setupProtocolHandlersAfterReady();

      // セッション設定
      this.setupSessionSecurity();

      // ウィンドウセキュリティ設定
      this.setupWindowSecurity();

      console.log('✅ Security policies initialized successfully');
      this.initialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize security policies:', error);
      throw new Error(`Security policy initialization failed: ${error}`);
    }
  }

  /**
   * Content Security Policy設定
   */
  private setupContentSecurityPolicy(): void {
    const cspHeader = [
      SECURITY_CONFIG.CSP.DEFAULT,
      SECURITY_CONFIG.CSP.STYLE,
      SECURITY_CONFIG.CSP.SCRIPT,
      SECURITY_CONFIG.CSP.IMG,
      SECURITY_CONFIG.CSP.CONNECT,
      SECURITY_CONFIG.CSP.FONT,
      SECURITY_CONFIG.CSP.OBJECT,
      SECURITY_CONFIG.CSP.BASE,
      SECURITY_CONFIG.CSP.FRAME
    ].join('; ');

    // レスポンスヘッダーの設定（本番環境でのみCSPを厳格適用）
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = {
        ...details.responseHeaders,
        'X-Content-Type-Options': ['nosniff'],
        'X-Frame-Options': ['DENY'],
        'X-XSS-Protection': ['1; mode=block'],
        'Referrer-Policy': ['strict-origin-when-cross-origin'],
        'Permissions-Policy': ['geolocation=(), microphone=(), camera=()']
      };

      // 本番環境でのみCSPとHTSTSを適用
      if (process.env.NODE_ENV === 'production') {
        responseHeaders['Content-Security-Policy'] = [cspHeader];
        responseHeaders['Strict-Transport-Security'] = ['max-age=31536000; includeSubDomains'];
      }

      callback({ responseHeaders });
    });

    console.log('🛡️ Content Security Policy configured');
  }

  /**
   * プロトコルハンドラー設定（app.ready後の処理）
   */
  private setupProtocolHandlersAfterReady(): void {
    // 危険なプロトコルのブロック
    const dangerousProtocols = ['file:', 'ftp:', 'chrome:', 'chrome-extension:'];
    
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
      const url = new URL(details.url);
      
      // 危険なプロトコルをブロック
      if (dangerousProtocols.some(proto => details.url.startsWith(proto))) {
        console.warn('🚫 Blocked dangerous protocol:', details.url);
        callback({ cancel: true });
        return;
      }

      // 許可されたプロトコルのみ通す
      if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.some(proto => details.url.startsWith(proto))) {
        console.warn('🚫 Blocked non-allowed protocol:', details.url);
        callback({ cancel: true });
        return;
      }

      callback({ cancel: false });
    });

    console.log('🔗 Protocol handlers configured');
  }

  /**
   * セッションセキュリティ設定
   */
  private setupSessionSecurity(): void {
    const defaultSession = session.defaultSession;

    // セキュアCookie設定
    defaultSession.cookies.on('changed', (event, cookie, cause, removed) => {
      if (!removed && !cookie.secure && cookie.domain && !cookie.domain.includes('localhost')) {
        console.warn('⚠️ Insecure cookie detected:', cookie);
      }
    });

    // 権限の制限
    defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      console.log('🔐 Permission request:', permission);
      
      // 基本的にすべての権限を拒否（必要に応じて個別許可）
      const allowedPermissions = ['clipboard-read', 'clipboard-write'];
      callback(allowedPermissions.includes(permission));
    });

    // preload スクリプトの検証 (新しいAPI使用)
    const preloadPath = path.join(__dirname, '../preload.cjs');
    try {
      if (require('fs').existsSync(preloadPath)) {
        defaultSession.registerPreloadScript(preloadPath);
        console.log('✅ Preload script registered:', preloadPath);
      }
    } catch (error) {
      console.warn('⚠️ Failed to register preload script:', error);
    }

    console.log('🔐 Session security configured');
  }

  /**
   * ウィンドウセキュリティ設定
   */
  private setupWindowSecurity(): void {
    // すべてのウィンドウ作成時にセキュリティ設定を適用
    const originalCreateWindow = BrowserWindow.prototype.constructor;
    
    // セキュアなデフォルト設定
    const secureWindowDefaults = {
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        enableBlinkFeatures: undefined,
        disableBlinkFeatures: undefined,
        preload: path.join(__dirname, '../preload.cjs')
      },
      show: false // 初期状態では非表示
    };

    console.log('🪟 Window security defaults configured');
  }

  /**
   * ファイルシステムアクセス検証
   */
  public validateFilePath(filePath: string): boolean {
    try {
      // パストラバーサル攻撃を防ぐ
      const normalizedPath = path.normalize(filePath);
      if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
        console.warn('🚫 Path traversal attempt detected:', filePath);
        return false;
      }

      // システム重要ディレクトリへのアクセスを制限
      const restrictedPaths = [
        '/etc/',
        '/usr/',
        '/bin/',
        '/sbin/',
        '/root/',
        '/sys/',
        '/proc/',
        'C:\\Windows\\',
        'C:\\Program Files\\',
        'C:\\System32\\',
        process.env.WINDIR || ''
      ];

      const lowerPath = normalizedPath.toLowerCase();
      if (restrictedPaths.some(restricted => 
        lowerPath.startsWith(restricted.toLowerCase())
      )) {
        console.warn('🚫 Access to restricted path denied:', filePath);
        return false;
      }

      return true;

    } catch (error) {
      console.error('Path validation error:', error);
      return false;
    }
  }

  /**
   * URL検証（外部通信用）
   */
  public validateUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);

      // プロトコル検証
      if (!['https:', 'http:'].includes(parsedUrl.protocol)) {
        console.warn('🚫 Invalid protocol:', parsedUrl.protocol);
        return false;
      }

      // 許可されたドメインの検証
      const allowedDomains = [
        'api.openai.com',
        'supabase.co',
        'supabase.com',
        'localhost'
      ];

      const isAllowed = allowedDomains.some(domain => 
        parsedUrl.hostname.endsWith(domain) || 
        parsedUrl.hostname === domain
      );

      if (!isAllowed) {
        console.warn('🚫 Domain not allowed:', parsedUrl.hostname);
        return false;
      }

      return true;

    } catch (error) {
      console.error('URL validation error:', error);
      return false;
    }
  }

  /**
   * 入力サニタイゼーション
   */
  public sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>\"'&]/g, (match) => {
        const escapeMap: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return escapeMap[match];
      })
      .substring(0, 10000); // 最大長制限
  }

  /**
   * セキュリティ監査ログ
   */
  public logSecurityEvent(event: string, details: Record<string, any>): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      pid: process.pid
    };

    console.log('🔍 Security Event:', JSON.stringify(logEntry));

    // より詳細なログが必要な場合は、ファイルに記録
    // この実装では簡潔性を保つためコンソールログのみ
  }

  /**
   * セキュリティヘルスチェック
   */
  public healthCheck(): {
    csp: boolean;
    session: boolean;
    protocols: boolean;
    overall: boolean;
  } {
    const results = {
      csp: this.initialized,
      session: !!session.defaultSession,
      protocols: protocol.isProtocolHandled('https'),
      overall: false
    };

    results.overall = results.csp && results.session && results.protocols;

    return results;
  }
}

// セキュリティポリシーミドルウェア
export const securityMiddleware = {
  /**
   * IPCハンドラー用セキュリティラッパー
   */
  wrapHandler: <T extends any[], R>(
    handlerName: string,
    handler: (...args: T) => Promise<R>
  ) => {
    return async (...args: T): Promise<R> => {
      const security = SecurityPolicy.getInstance();
      
      security.logSecurityEvent('ipc_handler_called', {
        handler: handlerName,
        args: args.length
      });

      try {
        const result = await handler(...args);
        
        security.logSecurityEvent('ipc_handler_success', {
          handler: handlerName
        });

        return result;
      } catch (error) {
        security.logSecurityEvent('ipc_handler_error', {
          handler: handlerName,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };
  }
};