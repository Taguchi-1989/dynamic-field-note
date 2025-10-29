/**
 * Dynamic Field Note - メインアプリ
 * Phase 3: ローカル保存機能 + SQLite統合
 * Phase 4: Performance最適化 + フォントプリロード
 * Phase 5: PWA化 + Service Worker
 */

import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AccessibilityProvider } from './src/contexts/AccessibilityContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
// Phase 3: DatabaseService (ネイティブ専用)
// Web版ではexpo-sqliteのWASM問題があるため、条件付きimport
let databaseService: { initialize: () => Promise<void> } | null = null;
if (Platform.OS !== 'web') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  databaseService = require('./src/services/DatabaseService').databaseService;
}
import { Workbox } from 'workbox-window';
import { OfflineBanner } from './src/components/OfflineBanner';

// Web専用: フォント最適化のためのヘッド要素追加
if (Platform.OS === 'web') {
  // Preconnect to Google Fonts
  const preconnectGoogleFonts = document.createElement('link');
  preconnectGoogleFonts.rel = 'preconnect';
  preconnectGoogleFonts.href = 'https://fonts.googleapis.com';
  document.head.appendChild(preconnectGoogleFonts);

  const preconnectGstatic = document.createElement('link');
  preconnectGstatic.rel = 'preconnect';
  preconnectGstatic.href = 'https://fonts.gstatic.com';
  preconnectGstatic.crossOrigin = 'anonymous';
  document.head.appendChild(preconnectGstatic);

  // font-display: swap付きでRobotoを読み込み
  const fontStyle = document.createElement('style');
  fontStyle.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

    @font-face {
      font-family: 'Roboto';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: local('Roboto'), local('Roboto-Regular'),
        url(https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2) format('woff2');
    }

    @font-face {
      font-family: 'Roboto';
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: local('Roboto Medium'), local('Roboto-Medium'),
        url(https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmEU9fBBc4.woff2) format('woff2');
    }

    body {
      font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue',
        Arial, sans-serif;
    }
  `;
  document.head.appendChild(fontStyle);
}

// スプラッシュスクリーンを自動で隠さない
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Web版ではDatabaseServiceをスキップ（Phase 3機能はネイティブ専用）
        if (databaseService) {
          await databaseService.initialize();
        }
        setIsDbReady(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setDbError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        // データベース初期化完了後にスプラッシュスクリーンを隠す
        await SplashScreen.hideAsync();
      }
    };

    initializeDatabase();
  }, []);

  // Service Worker登録（Web専用）
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      const wb = new Workbox('/service-worker.js');

      // Service Worker更新通知
      wb.addEventListener('waiting', () => {
        console.log('[Service Worker] New version available! Reload to update.');
        // ユーザーに更新を通知（オプション）
        if (window.confirm('新しいバージョンが利用可能です。今すぐ更新しますか？')) {
          wb.messageSkipWaiting();
          window.location.reload();
        }
      });

      // Service Worker登録
      wb.register()
        .then(() => {
          console.log('[Service Worker] Registered successfully');
        })
        .catch((error) => {
          console.error('[Service Worker] Registration failed:', error);
        });
    }
  }, []);

  // ローディング画面
  if (!isDbReady && !dbError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>データベースを初期化しています...</Text>
      </View>
    );
  }

  // エラー画面
  if (dbError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>エラー</Text>
        <Text style={styles.errorText}>{dbError}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary
      fallbackMessage="アプリケーションで予期しないエラーが発生しました。アプリを再起動してください。"
      onError={(error, errorInfo) => {
        // TODO: エラーレポートサービスに送信（Phase 4）
        if (__DEV__) {
          console.error('[App] ErrorBoundary caught error:', error);
          console.error('[App] Component stack:', errorInfo.componentStack);
        }
      }}
    >
      <SafeAreaProvider>
        <AccessibilityProvider>
          <PaperProvider>
            <OfflineBanner />
            <NavigationContainer>
              <RootNavigator />
            </NavigationContainer>
            <StatusBar style="auto" />
          </PaperProvider>
        </AccessibilityProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
