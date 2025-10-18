/**
 * 報告書一覧画面
 * Phase 3.4: 報告書管理機能実装
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Alert } from 'react-native';
import { Text, Card, FAB, IconButton, Menu, Divider, ActivityIndicator } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { reportDAO } from '../dao/ReportDAO';
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
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});

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
   * メニューの表示/非表示を切り替え
   */
  const toggleMenu = useCallback((id: number) => {
    setMenuVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  /**
   * 報告書編集画面へ遷移
   */
  const handleEdit = useCallback(
    (report: Report) => {
      setMenuVisible({});
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

  /**
   * 日時フォーマット
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
            <Card
              key={report.id}
              style={styles.card}
              onPress={() => handleEdit(report)}
              onLongPress={() => handleDelete(report)}
            >
              <Card.Content>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleContainer}>
                    <Text style={styles.cardTitle}>{report.title}</Text>
                  </View>
                  <Menu
                    visible={menuVisible[report.id] || false}
                    onDismiss={() => toggleMenu(report.id)}
                    anchor={
                      <IconButton
                        icon="dots-vertical"
                        size={20}
                        onPress={() => toggleMenu(report.id)}
                      />
                    }
                  >
                    <Menu.Item
                      leadingIcon="pencil"
                      onPress={() => handleEdit(report)}
                      title="編集"
                    />
                    <Divider />
                    <Menu.Item
                      leadingIcon="delete"
                      onPress={() => handleDelete(report)}
                      title="削除"
                    />
                  </Menu>
                </View>
                <Text style={styles.dateText}>作成: {formatDate(report.created_at)}</Text>
                <Text style={styles.dateText}>更新: {formatDate(report.updated_at)}</Text>
                {report.content && (
                  <Text style={styles.contentPreview} numberOfLines={2}>
                    {report.content.substring(0, 100)}
                    {report.content.length > 100 ? '...' : ''}
                  </Text>
                )}
              </Card.Content>
            </Card>
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
  card: {
    margin: 8,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  contentPreview: {
    fontSize: 14,
    color: '#444',
    marginTop: 8,
    fontStyle: 'italic',
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
