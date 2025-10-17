/**
 * 案件一覧画面
 * Phase 3: 案件管理機能のプレースホルダー
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Card } from 'react-native-paper';

export const CaseListScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="📂 案件一覧" />
        <Card.Content>
          <Text style={styles.placeholderText}>Phase 3で実装予定</Text>
          <Text style={styles.descriptionText}>
            現場報告書の案件を管理する機能です。{'\n'}- 案件の作成・編集・削除{'\n'}-
            Markdown・写真の案件別管理{'\n'}- 案件検索・フィルタリング
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
