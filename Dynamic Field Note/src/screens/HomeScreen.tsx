/**
 * ホーム画面
 * Phase 2: UI/UX強化版
 *
 * 音声入力 → 要約 → プレビュー の基本フロー + FABボタン
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Appbar, Snackbar, Text } from 'react-native-paper';
import { useVoiceBuffer } from '../hooks/useVoiceBuffer';
import { useSummarize } from '../hooks/useSummarize';
import { MarkdownPreview } from '../components/MarkdownPreview';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SummaryButtons } from '../components/SummaryButtons';

export const HomeScreen: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  /**
   * スナックバー表示
   */
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  // 音声バッファ管理
  const { buffer, fullText, addText, clearBuffer, isReadyToSend, sendReason, timeSinceLastInput } =
    useVoiceBuffer(
      {
        bufferInterval: 5000, // 5秒
        autoSendInterval: 300000, // 5分
        silenceThreshold: 30000, // 30秒
      },
      (_text, reason) => {
        console.log('送信準備完了:', reason);
        showSnackbar(
          `${reason === 'auto' ? '5分経過' : reason === 'silence' ? '無音検知' : '手動'}で送信準備完了`
        );
      }
    );

  // 要約実行
  const { isLoading, error, markdown, processingTime, executeSummarize, clearSummary, retry } =
    useSummarize();

  /**
   * テキスト入力変更
   */
  const handleTextChange = (text: string) => {
    setInputText(text);
    addText(text);
  };

  /**
   * 中間まとめ実行（Gemini Fast）
   */
  const handleQuickSummary = async () => {
    if (!fullText || fullText.trim() === '') {
      showSnackbar('テキストを入力してください');
      return;
    }

    await executeSummarize(fullText);
    showSnackbar(`中間まとめ完了 (${processingTime}ms)`);
  };

  /**
   * 最終まとめ実行（将来のGPT-5用・現在はGemini）
   */
  const handleFinalSummary = async () => {
    if (!fullText || fullText.trim() === '') {
      showSnackbar('テキストを入力してください');
      return;
    }

    await executeSummarize(fullText);
    showSnackbar(`最終まとめ完了 (${processingTime}ms)`);
  };

  /**
   * 要約実行（既存ボタン用・後方互換）
   */
  const handleSummarize = async () => {
    await handleQuickSummary();
  };

  /**
   * クリア
   */
  const handleClear = () => {
    setInputText('');
    clearBuffer();
    clearSummary();
    showSnackbar('クリアしました');
  };

  /**
   * 自動送信トリガー監視
   */
  useEffect(() => {
    if (isReadyToSend && fullText && !isLoading) {
      // 自動的に要約を実行（オプション）
      // handleSummarize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadyToSend]);

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <Appbar.Header>
        <Appbar.Content title="Dynamic Field Note" subtitle="PoC デモ" />
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* 入力エリア */}
        <View style={styles.inputContainer}>
          <TextInput
            label="現場メモを入力"
            mode="outlined"
            multiline
            numberOfLines={4}
            value={inputText}
            onChangeText={handleTextChange}
            placeholder="音声入力または手動でメモを入力してください..."
            style={styles.input}
            disabled={isLoading}
          />

          {/* バッファ情報 */}
          <View style={styles.bufferInfo}>
            <Text style={styles.bufferText}>
              バッファ: {buffer.length}件 | 最終入力: {timeSinceLastInput}秒前
            </Text>
            {isReadyToSend && <Text style={styles.readyText}>✅ 送信準備完了 ({sendReason})</Text>}
          </View>

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSummarize}
              loading={isLoading}
              disabled={isLoading || !fullText}
              style={styles.button}
            >
              要約実行
            </Button>
            <Button
              mode="outlined"
              onPress={handleClear}
              disabled={isLoading}
              style={styles.button}
            >
              クリア
            </Button>
          </View>

          {/* エラー表示 */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>❌ {error}</Text>
              <Button mode="text" onPress={retry}>
                再試行
              </Button>
            </View>
          )}
        </View>

        {/* プレビューエリア */}
        <View style={styles.previewContainer}>
          {isLoading ? (
            <LoadingIndicator message="Gemini AIで要約中..." />
          ) : (
            <MarkdownPreview content={markdown} />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* スナックバー */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>

      {/* FAB要約ボタン */}
      <SummaryButtons
        isLoading={isLoading}
        isEmpty={!fullText || fullText.trim() === ''}
        onQuickSummary={handleQuickSummary}
        onFinalSummary={handleFinalSummary}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  inputContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  input: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  bufferInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bufferText: {
    fontSize: 12,
    color: '#666',
  },
  readyText: {
    fontSize: 12,
    color: '#4caf50',
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    marginBottom: 8,
  },
  previewContainer: {
    flex: 1,
  },
});
