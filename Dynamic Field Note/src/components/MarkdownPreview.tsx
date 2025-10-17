/**
 * Markdownプレビューコンポーネント（簡易版）
 * Phase 1: PoC で使用
 * Phase 2: 完全版に置き換え予定
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card } from 'react-native-paper';

interface MarkdownPreviewProps {
  /** Markdown形式の内容 */
  content: string;
  /** スタイル */
  style?: object;
}

/**
 * 簡易Markdownプレビュー
 *
 * Phase 1ではプレーンテキストとして表示
 * Phase 2で react-native-markdown-display を導入予定
 */
export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, style }) => {
  if (!content || content.trim() === '') {
    return (
      <View style={[styles.container, style]}>
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>
              まだ要約がありません
            </Text>
            <Text style={styles.emptySubtext}>
              テキストを入力して「要約実行」ボタンをタップしてください
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.markdown}>{content}</Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    elevation: 2,
  },
  emptyCard: {
    margin: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  markdown: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
});
