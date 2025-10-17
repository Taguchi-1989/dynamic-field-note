/**
 * 同期履歴画面
 * Phase 4: クラウド同期履歴のプレースホルダー
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Card } from 'react-native-paper';

export const SyncHistoryScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="🔄 同期履歴" />
        <Card.Content>
          <Text style={styles.placeholderText}>Phase 4で実装予定</Text>
          <Text style={styles.descriptionText}>
            Azure Blob Storageとの同期履歴を表示します。{'\n'}- 同期ステータス（成功・失敗・保留中）
            {'\n'}- 同期日時とファイル数{'\n'}- 再同期・再送機能{'\n'}-
            ネットワークエラー時の自動リトライ
          </Text>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  card: {
    elevation: 2,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 16,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});
