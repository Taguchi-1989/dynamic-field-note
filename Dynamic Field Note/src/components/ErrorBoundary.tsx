/**
 * ErrorBoundary
 * アプリ全体のエラーをキャッチして表示
 * Phase 3: 本番環境対応
 */

import React, { Component, ReactNode } from 'react';
import { StyleSheet, View, ScrollView, Platform } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

interface Props {
  children: ReactNode;
  /** エラー発生時のカスタムメッセージ */
  fallbackMessage?: string;
  /** エラーレポート送信関数（オプション） */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * ErrorBoundary コンポーネント
 *
 * React コンポーネントツリー内のエラーをキャッチし、
 * フォールバックUIを表示します。
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   fallbackMessage="アプリケーションでエラーが発生しました"
 *   onError={(error, errorInfo) => {
 *     // エラーレポートサービスに送信
 *     reportError(error, errorInfo);
 *   }}
 * >
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  /**
   * エラー発生時にstateを更新
   */
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * エラー情報をログに記録
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 開発環境ではコンソールに出力
    if (__DEV__) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }

    // エラー情報をStateに保存
    this.setState({
      errorInfo,
    });

    // カスタムエラーハンドラー実行（レポート送信など）
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  /**
   * エラー状態をリセット
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * アプリを再読み込み（ネイティブ版のみ）
   */
  handleReload = () => {
    if (Platform.OS !== 'web') {
      // ネイティブ版: アプリを再起動
      // Note: 実際の再起動は expo-updates や CodePush を使用
      this.handleReset();
    } else {
      // Web版: ページをリロード
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;
      const { fallbackMessage } = this.props;

      return (
        <View style={styles.container}>
          <Card style={styles.card}>
            <Card.Title
              title="エラーが発生しました"
              titleStyle={styles.cardTitle}
              left={(_props) => <Text style={styles.errorIcon}>⚠️</Text>}
            />
            <Card.Content>
              <Text style={styles.message}>
                {fallbackMessage || 'アプリケーションで予期しないエラーが発生しました。'}
              </Text>

              {__DEV__ && error && (
                <ScrollView style={styles.errorDetails}>
                  <Text style={styles.errorTitle}>エラー詳細（開発モードのみ）:</Text>
                  <Text style={styles.errorMessage}>{error.toString()}</Text>

                  {errorInfo && (
                    <>
                      <Text style={styles.errorTitle}>コンポーネントスタック:</Text>
                      <Text style={styles.stackTrace}>{errorInfo.componentStack}</Text>
                    </>
                  )}
                </ScrollView>
              )}

              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={this.handleReset}
                  style={styles.button}
                  icon="reload"
                >
                  再試行
                </Button>

                <Button
                  mode="outlined"
                  onPress={this.handleReload}
                  style={styles.button}
                  icon="restart"
                >
                  アプリを再起動
                </Button>
              </View>
            </Card.Content>
          </Card>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  errorIcon: {
    fontSize: 32,
    marginRight: 8,
  },
  message: {
    fontSize: 16,
    marginBottom: 16,
    color: '#424242',
    lineHeight: 24,
  },
  errorDetails: {
    maxHeight: 300,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    color: '#d32f2f',
  },
  errorMessage: {
    fontSize: 13,
    color: '#d32f2f',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
  stackTrace: {
    fontSize: 12,
    color: '#616161',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
  },
});
