/**
 * 報告書一覧画面
 * Phase 3.4: 報告書管理機能実装
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, FAB, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { reportDAO } from '../dao/ReportDAO';
import { ReportCard } from '../components/ReportCard';
import type { Report } from '../types/case';

type RootStackParamList = {
  ReportList: { caseId: number };
  ReportForm: { caseId: number; reportId?: number };
};

type ReportListScreenRouteProp = RouteProp<RootStackParamList, 'ReportList'>;
type ReportListScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ReportListScreen: React.FC = () => {
  const route = useRoute<ReportListScreenRouteProp>();
  const navigation = useNavigation<ReportListScreenNavigationProp>();
  const { caseId } = route.params;

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 報告書一覧を読み込み
   */
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const data = await reportDAO.findByCaseId(caseId);
      setReports(data);
    } catch (error) {
      console.error('[ReportListScreen] Failed to load reports:', error);
      Alert.alert('エラー', '報告書の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  /**
   * 画面がフォーカスされたら再読み込み
   */
  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [loadReports])
  );

  /**
   * Pull to refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  }, [loadReports]);

  /**
   * 報告書削除
   */
  const handleDelete = useCallback(
    async (report: Report) => {
      Alert.alert('報告書を削除', `"${report.title}" を削除しますか？`, [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await reportDAO.delete(report.id);
              await loadReports();
            } catch (error) {
              console.error('[ReportListScreen] Failed to delete report:', error);
              Alert.alert('エラー', '報告書の削除に失敗しました');
            }
          },
        },
      ]);
    },
    [loadReports]
  );

  /**
   * 報告書編集画面へ遷移
   */
  const handleEdit = useCallback(
    (report: Report) => {
      navigation.navigate('ReportForm', { caseId, reportId: report.id });
    },
    [navigation, caseId]
  );

  /**
   * 新規報告書作成画面へ遷移
   */
  const handleCreate = useCallback(() => {
    navigation.navigate('ReportForm', { caseId });
  }, [navigation, caseId]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {reports.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>報告書がありません</Text>
            <Text style={styles.emptySubText}>右下のボタンから新規作成できます</Text>
          </View>
        ) : (
          reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onPress={() => handleEdit(report)}
              onLongPress={() => handleDelete(report)}
              onEdit={() => handleEdit(report)}
              onDelete={() => handleDelete(report)}
            />
          ))
        )}
      </ScrollView>

      <FAB style={styles.fab} icon="plus" onPress={handleCreate} label="新規作成" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
