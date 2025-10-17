/**
 * Markdownプレビューコンポーネント（完全版）
 * Phase 2: react-native-markdown-display を使用した高品質プレビュー
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card } from 'react-native-paper';
import Markdown from 'react-native-markdown-display';

interface MarkdownPreviewProps {
  /** Markdown形式の内容 */
  content: string;
  /** スタイル */
  style?: object;
}

/**
 * リッチMarkdownプレビュー
 *
 * Phase 2: react-native-markdown-display による完全なMarkdownレンダリング
 * - 見出し、リスト、強調、コードブロック対応
 * - スクロール対応
 * - Material Design準拠のスタイリング
 */
export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({ content, style }) => {
  if (!content || content.trim() === '') {
    return (
      <View style={[styles.container, style]}>
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>まだ要約がありません</Text>
            <Text style={styles.emptySubtext}>
              テキストを入力して「要約実行」ボタンをタップしてください
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={true}>
      <Card style={styles.card}>
        <Card.Content>
          <Markdown style={markdownStyles}>{content}</Markdown>
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
});

/**
 * Markdownスタイル定義
 * Material Design準拠のタイポグラフィとスペーシング
 */
const markdownStyles = StyleSheet.create({
  // 本文テキスト
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#212121',
  },
  // 見出し1
  heading1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 24,
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#1976d2',
    paddingBottom: 8,
  },
  // 見出し2
  heading2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 6,
  },
  // 見出し3
  heading3: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 16,
    marginBottom: 8,
  },
  // 見出し4-6
  heading4: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 12,
    marginBottom: 6,
  },
  heading5: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#616161',
    marginTop: 10,
    marginBottom: 5,
  },
  heading6: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#757575',
    marginTop: 8,
    marginBottom: 4,
  },
  // 段落
  paragraph: {
    marginTop: 0,
    marginBottom: 16,
    lineHeight: 24,
  },
  // 強調
  strong: {
    fontWeight: 'bold',
    color: '#212121',
  },
  // イタリック
  em: {
    fontStyle: 'italic',
  },
  // リスト
  bullet_list: {
    marginTop: 8,
    marginBottom: 16,
  },
  ordered_list: {
    marginTop: 8,
    marginBottom: 16,
  },
  list_item: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  bullet_list_icon: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1976d2',
    marginRight: 8,
  },
  ordered_list_icon: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1976d2',
    marginRight: 8,
  },
  // コードブロック
  code_inline: {
    backgroundColor: '#f5f5f5',
    color: '#d32f2f',
    fontFamily: 'monospace',
    fontSize: 14,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  code_block: {
    backgroundColor: '#263238',
    color: '#aed581',
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  fence: {
    backgroundColor: '#263238',
    color: '#aed581',
    fontFamily: 'monospace',
    fontSize: 14,
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  // 引用
  blockquote: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
    paddingLeft: 12,
    paddingVertical: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  // 水平線
  hr: {
    backgroundColor: '#e0e0e0',
    height: 1,
    marginTop: 20,
    marginBottom: 20,
  },
  // リンク
  link: {
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
  // テーブル（基本対応）
  table: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  thead: {
    backgroundColor: '#f5f5f5',
  },
  tbody: {},
  th: {
    fontWeight: 'bold',
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tr: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  td: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});
