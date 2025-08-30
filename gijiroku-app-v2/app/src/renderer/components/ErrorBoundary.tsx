import React, { Component, ErrorInfo, ReactNode } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // エラーログをローカルストレージに保存
    this.saveErrorLog(error, errorInfo);
    
    // Optional: Send error to monitoring service
    // sendErrorToService(error, errorInfo);
  }

  private saveErrorLog = (error: Error, errorInfo: ErrorInfo) => {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo: {
          componentStack: errorInfo.componentStack
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      existingLogs.push(errorLog);
      
      // 最大50件のログを保持
      if (existingLogs.length > 50) {
        existingLogs.shift();
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
    } catch (storageError) {
      console.warn('Failed to store error log:', storageError);
    }
  };

  handleReload = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h2>予期せぬエラーが発生しました</h2>
            <p>申し訳ございませんが、アプリケーションでエラーが発生しました。</p>
            
            <div className="error-boundary-actions">
              <button 
                className="error-boundary-btn primary"
                onClick={this.handleReload}
              >
                <i className="fas fa-redo"></i>
                再試行
              </button>
              <button 
                className="error-boundary-btn secondary"
                onClick={this.handleRefresh}
              >
                <i className="fas fa-refresh"></i>
                ページ再読み込み
              </button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="error-boundary-details">
                <summary>開発者向けエラー詳細</summary>
                <div className="error-boundary-stack">
                  <h4>エラーメッセージ:</h4>
                  <pre>{this.state.error.message}</pre>
                  
                  {this.state.error.stack && (
                    <>
                      <h4>スタックトレース:</h4>
                      <pre>{this.state.error.stack}</pre>
                    </>
                  )}
                  
                  {this.state.errorInfo && (
                    <>
                      <h4>コンポーネントスタック:</h4>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </>
                  )}
                </div>
              </details>
            )}

            <div className="error-boundary-footer">
              <p>問題が続く場合は、お問い合わせください。</p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;