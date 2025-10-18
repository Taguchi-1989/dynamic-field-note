/**
 * ルートナビゲーション
 * Phase 3.4: Stack + Drawer ナビゲーション構造
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DrawerNavigator } from './DrawerNavigator';
import { ReportListScreen } from '../screens/ReportListScreen';
import { ReportFormScreen } from '../screens/ReportFormScreen';

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
  );
};
