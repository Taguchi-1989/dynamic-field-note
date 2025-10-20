/**
 * Drawerナビゲーション
 * Phase 2: ハンバーガーメニュー実装
 * Phase 4: バンドルサイズ最適化 - 遅延ロード
 */

import React, { Suspense, lazy } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';

// Dummy screen for Web (Phase 3 features require native SQLite)
const DummyScreen: React.FC = () => (
  <View style={styles.loaderContainer}>
    <Text>この機能はネイティブアプリ専用です</Text>
  </View>
);

// Lazy load all drawer screens for bundle size optimization
const HomeScreen = lazy(() =>
  import('../screens/HomeScreen').then((module) => ({
    default: module.HomeScreen,
  }))
);

// Phase 3の画面はネイティブ専用（Web版ではexpo-sqliteのWASM問題があるため）
const CaseListScreen =
  Platform.OS === 'web'
    ? DummyScreen
    : lazy(() =>
        import('../screens/CaseListScreen').then((module) => ({
          default: module.CaseListScreen,
        }))
      );

const CameraScreen = lazy(() =>
  import('../screens/CameraScreen').then((module) => ({
    default: module.CameraScreen,
  }))
);

const SettingsScreen = lazy(() =>
  import('../screens/SettingsScreen').then((module) => ({
    default: module.SettingsScreen,
  }))
);

const SyncHistoryScreen = lazy(() =>
  import('../screens/SyncHistoryScreen').then((module) => ({
    default: module.SyncHistoryScreen,
  }))
);

const ComponentShowcaseScreen =
  Platform.OS === 'web'
    ? DummyScreen
    : lazy(() =>
        import('../screens/ComponentShowcaseScreen').then((module) => ({
          default: module.ComponentShowcaseScreen,
        }))
      );

// Loading fallback for lazy-loaded screens
const ScreenLoader: React.FC = () => (
  <View style={styles.loaderContainer}>
    <ActivityIndicator size="large" color="#1976d2" />
  </View>
);

// Wrapper to add Suspense to each screen
const withSuspense = (Component: React.LazyExoticComponent<React.FC>) => {
  const SuspenseWrapper: React.FC = (props: object) => (
    <Suspense fallback={<ScreenLoader />}>
      <Component {...props} />
    </Suspense>
  );
  SuspenseWrapper.displayName = `withSuspense(${Component.name || 'Component'})`;
  return SuspenseWrapper;
};

const Drawer = createDrawerNavigator();

/**
 * Drawerナビゲーター
 *
 * メニュー項目:
 * - 🏠 ホーム: メイン画面（音声入力→要約→プレビュー）
 * - 📂 案件一覧: 案件管理（Phase 3で実装）
 * - ⚙️ 設定: AI設定・匿名化設定
 * - 🔄 同期履歴: クラウド同期履歴（Phase 4で実装）
 */
export const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1976d2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        drawerActiveTintColor: '#1976d2',
        drawerInactiveTintColor: '#666',
        drawerStyle: {
          backgroundColor: '#fff',
        },
      }}
    >
      <Drawer.Screen
        name="Home"
        component={withSuspense(HomeScreen)}
        options={{
          drawerLabel: 'ホーム',
          title: 'Dynamic Field Note',
          drawerIcon: ({ color, size }) => (
            <React.Fragment>
              <span style={{ fontSize: size, color }}>🏠</span>
            </React.Fragment>
          ),
        }}
      />
      <Drawer.Screen
        name="CaseList"
        component={withSuspense(CaseListScreen)}
        options={{
          drawerLabel: '案件一覧',
          title: '案件一覧',
          drawerIcon: ({ color, size }) => (
            <React.Fragment>
              <span style={{ fontSize: size, color }}>📂</span>
            </React.Fragment>
          ),
        }}
      />
      <Drawer.Screen
        name="Camera"
        component={withSuspense(CameraScreen)}
        options={{
          drawerLabel: '写真撮影',
          title: '写真撮影',
          drawerIcon: ({ color, size }) => (
            <React.Fragment>
              <span style={{ fontSize: size, color }}>📷</span>
            </React.Fragment>
          ),
        }}
      />
      <Drawer.Screen
        name="Settings"
        component={withSuspense(SettingsScreen)}
        options={{
          drawerLabel: '設定',
          title: '設定',
          drawerIcon: ({ color, size }) => (
            <React.Fragment>
              <span style={{ fontSize: size, color }}>⚙️</span>
            </React.Fragment>
          ),
        }}
      />
      <Drawer.Screen
        name="SyncHistory"
        component={withSuspense(SyncHistoryScreen)}
        options={{
          drawerLabel: '同期履歴',
          title: '同期履歴',
          drawerIcon: ({ color, size }) => (
            <React.Fragment>
              <span style={{ fontSize: size, color }}>🔄</span>
            </React.Fragment>
          ),
        }}
      />
      <Drawer.Screen
        name="ComponentShowcase"
        component={withSuspense(ComponentShowcaseScreen)}
        options={{
          drawerLabel: 'コンポーネント一覧',
          title: 'Component Showcase',
          drawerIcon: ({ color, size }) => (
            <React.Fragment>
              <span style={{ fontSize: size, color }}>🎨</span>
            </React.Fragment>
          ),
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
