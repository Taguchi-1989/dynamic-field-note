/**
 * ローディングインジケーターコンポーネント
 * Phase 1: PoC で使用
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

interface LoadingIndicatorProps {
  /** 表示するメッセージ */
  message?: string;
  /** サイズ */
  size?: 'small' | 'large';
}

/**
 * ローディングインジケーター
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'AI要約中...',
  size = 'large',
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color="#6200ee" />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
