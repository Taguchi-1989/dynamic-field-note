/**
 * ルートナビゲーション
 * Phase 3.4: Stack + Drawer ナビゲーション構造
 * Phase 4: Code Splitting with React.lazy for performance
 */

import React, { Suspense, lazy } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';

// Lazy load components for code splitting
const DrawerNavigator = lazy(() =>
  import('./DrawerNavigator').then((module) => ({
    default: module.DrawerNavigator,
  }))
);

// Phase 3の画面はネイティブ専用（Web版ではexpo-sqliteのWASM問題があるため）
const DummyScreen: React.FC = () => (
  <View style={styles.loadingContainer}>
    <Text>この機能はネイティブアプリ専用です</Text>
  </View>
);

const ReportListScreen =
  Platform.OS === 'web'
    ? DummyScreen
    : lazy(() =>
        import('../screens/ReportListScreen').then((module) => ({
          default: module.ReportListScreen,
        }))
      );

const ReportFormScreen =
  Platform.OS === 'web'
    ? DummyScreen
    : lazy(() =>
        import('../screens/ReportFormScreen').then((module) => ({
          default: module.ReportFormScreen,
        }))
      );

// Loading fallback component
const LoadingFallback: React.FC = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#1976d2" />
  </View>
);

export type RootStackParamList = {
  DrawerRoot: undefined;
  ReportList: { caseId: number };
  ReportForm: { caseId: number; reportId?: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * ルートナビゲーター
 *
 * 構造:
 * - DrawerRoot: Drawerナビゲーション (ホーム、案件一覧など)
 * - ReportList: 報告書一覧 (Stack内)
 * - ReportForm: 報告書作成・編集 (Stack内)
 */
export const RootNavigator: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // Drawer内の画面でヘッダーを表示
        }}
      >
        <Stack.Screen name="DrawerRoot" component={DrawerNavigator} />
        <Stack.Screen
          name="ReportList"
          component={ReportListScreen}
          options={{
            headerShown: true,
            title: '報告書一覧',
            headerStyle: {
              backgroundColor: '#1976d2',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="ReportForm"
          component={ReportFormScreen}
          options={{
            headerShown: false, // ReportFormScreen内でAppbarを使用
          }}
        />
      </Stack.Navigator>
    </Suspense>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
