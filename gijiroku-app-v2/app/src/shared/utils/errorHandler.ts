import axios, { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: unknown;
  timestamp: string;
  requestId?: string;
}

export interface ErrorContext {
  action: string;
  component?: string;
  userId?: string | null;
  additionalData?: Record<string, unknown>;
}

export class ErrorHandler {
  private static errorLogs: ApiError[] = [];
  private static maxLogs = 100;

  /**
   * APIエラーを標準化された形式に変換
   */
  static handleApiError(error: unknown, context?: ErrorContext): ApiError {
    const timestamp = new Date().toISOString();
    let apiError: ApiError = {
      message: 'Unknown error occurred',
      timestamp,
    };

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      apiError = {
        message: this.getAxiosErrorMessage(axiosError),
        status: axiosError.response?.status,
        code: axiosError.code,
        details: axiosError.response?.data,
        timestamp,
        requestId: axiosError.response?.headers?.['x-correlation-id'] || axiosError.response?.headers?.['x-request-id'],
      };
    } else if (error instanceof Error) {
      apiError = {
        message: error.message,
        timestamp,
      };
    } else if (typeof error === 'string') {
      apiError = {
        message: error,
        timestamp,
      };
    }

    // エラーログを記録
    this.logError(apiError, context);

    return apiError;
  }

  /**
   * Axiosエラーから適切なエラーメッセージを生成
   */
  private static getAxiosErrorMessage(error: AxiosError): string {
    // ネットワークエラー
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'リクエストがタイムアウトしました。ネットワーク接続を確認してください。';
      }
      if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        return 'ネットワークエラーが発生しました。接続を確認してください。';
      }
      return 'サーバーに接続できませんでした。ネットワーク接続を確認してください。';
    }

    const status = error.response.status;
    const data = error.response.data as any;

    // サーバーからのエラーメッセージを優先
    if (data?.message) {
      return data.message;
    }
    if (data?.error) {
      return typeof data.error === 'string' ? data.error : data.error.message || 'サーバーエラーが発生しました';
    }
    if (data?.detail) {
      return data.detail;
    }

    // HTTPステータスコードに基づくメッセージ
    switch (status) {
      case 400:
        return 'リクエストが無効です。入力内容を確認してください。';
      case 401:
        return 'APIキーが無効または期限切れです。設定を確認してください。';
      case 403:
        return 'アクセス権限がありません。APIキーの権限を確認してください。';
      case 404:
        return 'リクエストされたリソースが見つかりません。';
      case 429:
        return 'API使用量制限に達しました。しばらく待ってから再実行してください。';
      case 500:
        return 'サーバーの内部エラーが発生しました。しばらく待ってから再実行してください。';
      case 502:
        return 'サーバーが一時的に利用できません。しばらく待ってから再実行してください。';
      case 503:
        return 'サービスが一時的に利用できません。しばらく待ってから再実行してください。';
      case 504:
        return 'サーバーの応答がタイムアウトしました。しばらく待ってから再実行してください。';
      default:
        return `サーバーエラーが発生しました (${status})`;
    }
  }

  /**
   * エラーログを記録
   */
  private static logError(error: ApiError, context?: ErrorContext) {
    const logEntry = {
      ...error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };

    // メモリ内ログ
    this.errorLogs.push(logEntry);
    if (this.errorLogs.length > this.maxLogs) {
      this.errorLogs.shift();
    }

    // ローカルストレージに保存
    try {
      const existingLogs = JSON.parse(localStorage.getItem('apiErrorLogs') || '[]');
      existingLogs.push(logEntry);
      
      if (existingLogs.length > this.maxLogs) {
        existingLogs.shift();
      }
      
      localStorage.setItem('apiErrorLogs', JSON.stringify(existingLogs));
    } catch (storageError) {
      console.warn('Failed to store API error log:', storageError);
    }

    // コンソール出力
    console.error('API Error:', logEntry);
  }

  /**
   * エラーログを取得
   */
  static getErrorLogs(): ApiError[] {
    return [...this.errorLogs];
  }

  /**
   * エラーログをクリア
   */
  static clearErrorLogs(): void {
    this.errorLogs = [];
    try {
      localStorage.removeItem('apiErrorLogs');
    } catch (error) {
      console.warn('Failed to clear API error logs:', error);
    }
  }

  /**
   * ユーザーフレンドリーなエラーメッセージを取得
   */
  static getUserFriendlyMessage(error: ApiError): string {
    return error.message;
  }

  /**
   * エラーが再試行可能かどうかを判定
   */
  static isRetryableError(error: ApiError): boolean {
    if (!error.status) return false;
    
    // 5xx系エラーと429は再試行可能
    return error.status >= 500 || error.status === 429;
  }

  /**
   * エラーの重要度を判定
   */
  static getErrorSeverity(error: ApiError): 'low' | 'medium' | 'high' | 'critical' {
    if (!error.status) return 'medium';
    
    if (error.status >= 500) return 'critical';
    if (error.status === 429) return 'high';
    if (error.status >= 400 && error.status < 500) return 'medium';
    return 'low';
  }
}

/**
 * APIリクエストを実行し、エラーハンドリングを行うヘルパー関数
 */
export async function apiRequest<T>(
  requestFn: () => Promise<T>,
  context?: ErrorContext
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const data = await requestFn();
    return { data };
  } catch (error) {
    const apiError = ErrorHandler.handleApiError(error, context);
    return { error: apiError };
  }
}

/**
 * 再試行機能付きAPIリクエスト
 */
export async function apiRequestWithRetry<T>(
  requestFn: () => Promise<T>,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    context?: ErrorContext;
  } = {}
): Promise<{ data?: T; error?: ApiError }> {
  const { maxRetries = 3, retryDelay = 1000, context } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await apiRequest(requestFn, {
      ...context,
      additionalData: { ...context?.additionalData, attempt: attempt + 1 },
    });

    if (result.data || !result.error || !ErrorHandler.isRetryableError(result.error)) {
      return result;
    }

    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, retryDelay * Math.pow(2, attempt)));
    }
  }

  // This should never be reached, but TypeScript requires it
  return { error: { message: 'Max retries exceeded', timestamp: new Date().toISOString() } };
}

export default ErrorHandler;