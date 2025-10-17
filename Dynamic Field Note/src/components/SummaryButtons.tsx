/**
 * 要約実行ボタンコンポーネント
 * Phase 2: FABボタンによる中間・最終まとめ実行
 */

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FAB, Portal, Text } from 'react-native-paper';

interface SummaryButtonsProps {
  /** 実行中フラグ */
  isLoading: boolean;
  /** 入力テキストが空かどうか */
  isEmpty: boolean;
  /** 中間まとめボタン押下時のコールバック */
  onQuickSummary: () => void;
  /** 最終まとめボタン押下時のコールバック */
  onFinalSummary: () => void;
}

/**
 * FAB要約ボタン
 *
 * 機能:
 * - 右下FABボタン（メイン）
 * - 展開時に2つのアクションを表示
 *   - 🔄 中間まとめ（Gemini Fast）
 *   - ✨ 最終まとめ（将来のGPT-5用・現在はGemini）
 * - ローディング中は無効化
 * - 入力が空の場合は無効化
 */
export const SummaryButtons: React.FC<SummaryButtonsProps> = ({
  isLoading,
  isEmpty,
  onQuickSummary,
  onFinalSummary,
}) => {
  const [open, setOpen] = useState(false);

  const onStateChange = ({ open }: { open: boolean }) => setOpen(open);

  const isDisabled = isLoading || isEmpty;

  return (
    <Portal>
      <FAB.Group
        open={open}
        visible={!isDisabled}
        icon={open ? 'close' : 'file-document-outline'}
        actions={[
          {
            icon: 'lightning-bolt',
            label: '中間まとめ',
            onPress: () => {
              setOpen(false);
              onQuickSummary();
            },
            style: styles.actionButton,
            labelStyle: styles.actionLabel,
          },
          {
            icon: 'star',
            label: '最終まとめ',
            onPress: () => {
              setOpen(false);
              onFinalSummary();
            },
            style: styles.actionButton,
            labelStyle: styles.actionLabel,
          },
        ]}
        onStateChange={onStateChange}
        onPress={() => {
          if (open) {
            setOpen(false);
          }
        }}
        style={styles.fabGroup}
        fabStyle={styles.fab}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>要約処理中...</Text>
          </View>
        </View>
      )}
    </Portal>
  );
};

const styles = StyleSheet.create({
  fabGroup: {
    paddingBottom: 16,
  },
  fab: {
    backgroundColor: '#1976d2',
  },
  actionButton: {
    backgroundColor: '#ffffff',
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
});
