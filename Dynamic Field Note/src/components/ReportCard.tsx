/**
 * 報告書カードコンポーネント
 * Phase 3.4 Refactoring: ReportListScreenから抽出
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Card, IconButton, Menu, Divider } from 'react-native-paper';
import { formatDateTime } from '../utils/dateFormatter';
import type { Report } from '../types/case';

interface ReportCardProps {
  report: Report;
  onPress: () => void;
  onLongPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * 報告書カード
 *
 * 機能:
 * - タイトル、作成日時、更新日時の表示
 * - 内容のプレビュー (最初の100文字)
 * - 編集・削除メニュー
 */
export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onPress,
  onLongPress,
  onEdit,
  onDelete,
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleEdit = () => {
    setMenuVisible(false);
    onEdit();
  };

  const handleDelete = () => {
    setMenuVisible(false);
    onDelete();
  };

  return (
    <Card style={styles.card} onPress={onPress} onLongPress={onLongPress}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>{report.title}</Text>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton icon="dots-vertical" size={20} onPress={() => setMenuVisible(true)} />
            }
          >
            <Menu.Item leadingIcon="pencil" onPress={handleEdit} title="編集" />
            <Divider />
            <Menu.Item leadingIcon="delete" onPress={handleDelete} title="削除" />
          </Menu>
        </View>
        <Text style={styles.dateText}>作成: {formatDateTime(report.created_at)}</Text>
        <Text style={styles.dateText}>更新: {formatDateTime(report.updated_at)}</Text>
        {report.content && (
          <Text style={styles.contentPreview} numberOfLines={2}>
            {report.content.substring(0, 100)}
            {report.content.length > 100 ? '...' : ''}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
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
});
