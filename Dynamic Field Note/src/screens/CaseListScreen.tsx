/**
 * 案件一覧画面
 * Phase 3: 案件管理機能実装
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Card,
  FAB,
  Chip,
  IconButton,
  Menu,
  Divider,
  ActivityIndicator,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { caseDAO } from '../dao/CaseDAO';
import type { Case, CaseStatus, CreateCaseInput, UpdateCaseInput } from '../types/case';
import { CaseFormModal } from './CaseFormModal';

export const CaseListScreen: React.FC = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CaseStatus | 'all'>('all');
  const [menuVisible, setMenuVisible] = useState<{ [key: number]: boolean }>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | undefined>(undefined);

  /**
   * 案件一覧を読み込み
   */
  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      const data =
        filterStatus !== 'all' ? await caseDAO.findByStatus(filterStatus) : await caseDAO.findAll();
      setCases(data);
    } catch (error) {
      console.error('[CaseListScreen] Failed to load cases:', error);
      Alert.alert('エラー', '案件の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  /**
   * 画面がフォーカスされたら再読み込み
   */
  useFocusEffect(
    useCallback(() => {
      loadCases();
    }, [loadCases])
  );

  /**
   * Pull to refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCases();
    setRefreshing(false);
  }, [loadCases]);

  /**
   * 案件削除
   */
  const handleDelete = useCallback(
    async (caseItem: Case) => {
      Alert.alert('案件を削除', `"${caseItem.title}" を削除しますか？`, [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              await caseDAO.delete(caseItem.id);
              await loadCases();
            } catch (error) {
              console.error('[CaseListScreen] Failed to delete case:', error);
              Alert.alert('エラー', '案件の削除に失敗しました');
            }
          },
        },
      ]);
    },
    [loadCases]
  );

  /**
   * メニューの表示/非表示を切り替え
   */
  const toggleMenu = useCallback((id: number) => {
    setMenuVisible((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  /**
   * 新規作成モーダルを開く
   */
  const handleCreateCase = useCallback(() => {
    setEditingCase(undefined);
    setModalVisible(true);
  }, []);

  /**
   * 編集モーダルを開く
   */
  const handleEditCase = useCallback((caseItem: Case) => {
    setEditingCase(caseItem);
    setModalVisible(true);
  }, []);

  /**
   * モーダルを閉じる
   */
  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingCase(undefined);
  }, []);

  /**
   * 案件保存（作成 or 更新）
   */
  const handleSaveCase = useCallback(
    async (input: CreateCaseInput | UpdateCaseInput) => {
      try {
        if (editingCase) {
          // 更新
          await caseDAO.update(editingCase.id, input as UpdateCaseInput);
          Alert.alert('成功', '案件を更新しました');
        } else {
          // 新規作成
          await caseDAO.create(input as CreateCaseInput);
          Alert.alert('成功', '案件を作成しました');
        }
        await loadCases();
      } catch (error) {
        console.error('[CaseListScreen] Failed to save case:', error);
        Alert.alert('エラー', '案件の保存に失敗しました');
        throw error; // モーダル側でハンドリング
      }
    },
    [editingCase, loadCases]
  );

  /**
   * ステータス別の色を取得
   */
  const getStatusColor = (status: CaseStatus): string => {
    switch (status) {
      case 'active':
        return '#4caf50';
      case 'completed':
        return '#2196f3';
      case 'archived':
        return '#9e9e9e';
      default:
        return '#757575';
    }
  };

  /**
   * ステータスのラベルを取得
   */
  const getStatusLabel = (status: CaseStatus): string => {
    switch (status) {
      case 'active':
        return '進行中';
      case 'completed':
        return '完了';
      case 'archived':
        return 'アーカイブ';
      default:
        return status;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>案件を読み込み中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* フィルタチップ */}
      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          <Chip
            selected={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
            style={styles.chip}
          >
            すべて
          </Chip>
          <Chip
            selected={filterStatus === 'active'}
            onPress={() => setFilterStatus('active')}
            style={styles.chip}
          >
            進行中
          </Chip>
          <Chip
            selected={filterStatus === 'completed'}
            onPress={() => setFilterStatus('completed')}
            style={styles.chip}
          >
            完了
          </Chip>
          <Chip
            selected={filterStatus === 'archived'}
            onPress={() => setFilterStatus('archived')}
            style={styles.chip}
          >
            アーカイブ
          </Chip>
        </ScrollView>
      </View>

      {/* 案件一覧 */}
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {cases.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>案件がありません</Text>
              <Text style={styles.emptyHint}>右下の + ボタンから案件を作成できます</Text>
            </Card.Content>
          </Card>
        ) : (
          cases.map((caseItem) => (
            <Card key={caseItem.id} style={styles.caseCard}>
              <Card.Title
                title={caseItem.title}
                subtitle={caseItem.client_name || '顧客名なし'}
                left={(props) => (
                  <View
                    {...props}
                    style={[
                      styles.statusIndicator,
                      { backgroundColor: getStatusColor(caseItem.status) },
                    ]}
                  />
                )}
                right={(props) => (
                  <Menu
                    visible={menuVisible[caseItem.id] || false}
                    onDismiss={() => toggleMenu(caseItem.id)}
                    anchor={
                      <IconButton
                        {...props}
                        icon="dots-vertical"
                        onPress={() => toggleMenu(caseItem.id)}
                      />
                    }
                  >
                    <Menu.Item
                      leadingIcon="pencil"
                      onPress={() => {
                        toggleMenu(caseItem.id);
                        handleEditCase(caseItem);
                      }}
                      title="編集"
                    />
                    <Divider />
                    <Menu.Item
                      leadingIcon="delete"
                      onPress={() => {
                        toggleMenu(caseItem.id);
                        handleDelete(caseItem);
                      }}
                      title="削除"
                    />
                  </Menu>
                )}
              />
              <Card.Content>
                <View style={styles.metadata}>
                  <Chip
                    icon="map-marker"
                    textStyle={styles.chipText}
                    style={[
                      styles.metadataChip,
                      { backgroundColor: getStatusColor(caseItem.status) },
                    ]}
                  >
                    {getStatusLabel(caseItem.status)}
                  </Chip>
                  {caseItem.location && (
                    <Text style={styles.locationText}>📍 {caseItem.location}</Text>
                  )}
                </View>
                {caseItem.description && (
                  <Text style={styles.description} numberOfLines={2}>
                    {caseItem.description}
                  </Text>
                )}
                <Text style={styles.date}>
                  作成: {new Date(caseItem.created_at).toLocaleDateString('ja-JP')}
                </Text>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* FAB: 新規案件作成 */}
      <FAB icon="plus" style={styles.fab} onPress={handleCreateCase} />

      {/* 案件作成・編集モーダル */}
      <CaseFormModal
        visible={modalVisible}
        onDismiss={handleCloseModal}
        onSave={handleSaveCase}
        editingCase={editingCase}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChips: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    marginRight: 8,
  },
  scrollView: {
    flex: 1,
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  caseCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 16,
    marginTop: 16,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  metadataChip: {
    height: 24,
  },
  chipText: {
    fontSize: 12,
    color: '#fff',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#1976d2',
  },
});
