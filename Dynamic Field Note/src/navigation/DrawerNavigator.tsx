/**
 * Drawerナビゲーション
 * Phase 2: ハンバーガーメニュー実装
 */

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { HomeScreen } from '../screens/HomeScreen';
import { CaseListScreen } from '../screens/CaseListScreen';
import { CameraScreen } from '../screens/CameraScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { SyncHistoryScreen } from '../screens/SyncHistoryScreen';
import { ComponentShowcaseScreen } from '../screens/ComponentShowcaseScreen';

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
        component={HomeScreen}
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
        component={CaseListScreen}
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
        component={CameraScreen}
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
        component={SettingsScreen}
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
        component={SyncHistoryScreen}
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
        component={ComponentShowcaseScreen}
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
