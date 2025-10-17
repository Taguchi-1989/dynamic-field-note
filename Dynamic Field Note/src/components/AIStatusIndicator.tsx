/**
 * AI状態表示インジケーター
 * Phase 2: AI実行状態の視覚的フィードバック
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, ActivityIndicator, ProgressBar } from 'react-native-paper';

export type AIStatus = 'idle' | 'processing' | 'success' | 'error';

interface AIStatusIndicatorProps {
  /** 現在の状態 */
  status: AIStatus;
  /** 処理中のメッセージ */
  message?: string;
  /** エラーメッセージ */
  errorMessage?: string;
  /** 進捗率（0-1、オプション） */
  progress?: number;
}

/**
 * AI状態インジケーター
 *
 * 状態:
 * - 🟡 idle: 待機中
 * - 🟢 processing: AI実行中
 * - ✅ success: 完了
 * - 🔴 error: エラー
 */
export const AIStatusIndicator: React.FC<AIStatusIndicatorProps> = ({
  status,
  message,
  errorMessage,
  progress,
}) => {
  if (status === 'idle') {
    return null; // 待機中は何も表示しない
  }

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return '#4caf50'; // 緑
      case 'success':
        return '#2196f3'; // 青
      case 'error':
        return '#f44336'; // 赤
      default:
        return '#9e9e9e'; // グレー
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return '🟢';
      case 'success':
        return '✅';
      case 'error':
        return '🔴';
      default:
        return '🟡';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return message || 'AI処理中...';
      case 'success':
        return '完了しました';
      case 'error':
        return errorMessage || 'エラーが発生しました';
      default:
        return '待機中';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: `${getStatusColor()}15` }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getStatusIcon()}</Text>
          {status === 'processing' && (
            <ActivityIndicator size="small" color={getStatusColor()} style={styles.spinner} />
          )}
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
          {status === 'processing' && progress !== undefined && (
            <ProgressBar progress={progress} color={getStatusColor()} style={styles.progressBar} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  spinner: {
    marginLeft: 8,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressBar: {
    marginTop: 8,
    height: 4,
    borderRadius: 2,
  },
});
