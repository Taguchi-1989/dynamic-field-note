/**
 * OfflineBanner Component
 * Phase 5: PWA化 - オフライン状態表示
 */

import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import { Banner } from 'react-native-paper';

export const OfflineBanner: React.FC = () => {
  // 初期状態を遅延初期化で設定（effect内でのsetStateを回避）
  const [isOffline, setIsOffline] = useState(() =>
    Platform.OS === 'web' ? !navigator.onLine : false
  );
  const [visible, setVisible] = useState(() => (Platform.OS === 'web' ? !navigator.onLine : false));

  useEffect(() => {
    // Web専用: オンライン/オフライン状態監視
    if (Platform.OS === 'web') {
      const handleOnline = () => {
        setIsOffline(false);
        // オンラインに復帰したら3秒後に非表示
        setTimeout(() => setVisible(false), 3000);
      };

      const handleOffline = () => {
        setIsOffline(true);
        setVisible(true);
      };

      // イベントリスナー登録
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // クリーンアップ
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (Platform.OS !== 'web' || !visible) {
    return null;
  }

  return (
    <Banner
      visible={visible}
      actions={[
        {
          label: '閉じる',
          onPress: () => setVisible(false),
        },
      ]}
      icon={isOffline ? 'wifi-off' : 'wifi'}
      style={[styles.banner, isOffline ? styles.bannerOffline : styles.bannerOnline]}
    >
      <Text style={styles.bannerText}>
        {isOffline
          ? 'オフラインモードで動作しています。一部機能が制限されます。'
          : 'オンラインに復帰しました'}
      </Text>
    </Banner>
  );
};

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  bannerOffline: {
    backgroundColor: '#ff9800',
  },
  bannerOnline: {
    backgroundColor: '#4caf50',
  },
  bannerText: {
    color: '#ffffff',
    fontWeight: '500',
  },
});
