/**
 * CaseFormModal
 * 案件作成・編集モーダル
 * Phase 3: 案件管理機能実装
 */

import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Modal, Portal, Text, TextInput, Button, SegmentedButtons } from 'react-native-paper';
import type { Case, CaseStatus, CreateCaseInput, UpdateCaseInput } from '../types/case';

/**
 * Props型定義
 */
interface CaseFormModalProps {
  /** モーダル表示状態 */
  visible: boolean;
  /** 閉じるコールバック */
  onDismiss: () => void;
  /** 保存コールバック */
  onSave: (input: CreateCaseInput | UpdateCaseInput) => Promise<void>;
  /** 編集対象の案件（新規作成時はundefined） */
  editingCase?: Case;
}

/**
 * 案件作成・編集モーダル
 */
export const CaseFormModal: React.FC<CaseFormModalProps> = ({
  visible,
  onDismiss,
  onSave,
  editingCase,
}) => {
  // フォーム状態管理
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<CaseStatus>('active');
  const [saving, setSaving] = useState(false);

  // 編集時に初期値をセット
  useEffect(() => {
    if (editingCase) {
      setTitle(editingCase.title);
      setClientName(editingCase.client_name || '');
      setLocation(editingCase.location || '');
      setDescription(editingCase.description || '');
      setStatus(editingCase.status);
    } else {
      // 新規作成時は初期化
      setTitle('');
      setClientName('');
      setLocation('');
      setDescription('');
      setStatus('active');
    }
  }, [editingCase, visible]);

  /**
   * 保存処理
   */
  const handleSave = async () => {
    try {
      setSaving(true);

      if (editingCase) {
        // 編集の場合
        const updateInput: UpdateCaseInput = {
          title: title.trim() || undefined,
          client_name: clientName.trim() || undefined,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          status,
        };
        await onSave(updateInput);
      } else {
        // 新規作成の場合
        const createInput: CreateCaseInput = {
          title: title.trim(),
          client_name: clientName.trim() || undefined,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
          status,
        };
        await onSave(createInput);
      }

      onDismiss();
    } catch (error) {
      console.error('[CaseFormModal] Failed to save case:', error);
      // エラーハンドリングは親コンポーネントで行う
    } finally {
      setSaving(false);
    }
  };

  /**
   * タイトルの入力チェック
   */
  const isTitleValid = title.trim().length > 0;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* ヘッダー */}
            <Text variant="headlineSmall" style={styles.header}>
              {editingCase ? '案件を編集' : '新しい案件を作成'}
            </Text>

            {/* タイトル（必須） */}
            <TextInput
              label="案件名 *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              style={styles.input}
              error={title.length > 0 && !isTitleValid}
              placeholder="例: 〇〇ビル現場調査"
            />

            {/* 顧客名 */}
            <TextInput
              label="顧客名"
              value={clientName}
              onChangeText={setClientName}
              mode="outlined"
              style={styles.input}
              placeholder="例: 株式会社〇〇"
            />

            {/* 場所 */}
            <TextInput
              label="場所"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              style={styles.input}
              placeholder="例: 東京都渋谷区〇〇"
            />

            {/* 説明 */}
            <TextInput
              label="説明"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.textArea}
              placeholder="案件の詳細情報を入力してください"
            />

            {/* ステータス */}
            <Text variant="labelLarge" style={styles.statusLabel}>
              ステータス
            </Text>
            <SegmentedButtons
              value={status}
              onValueChange={(value) => setStatus(value as CaseStatus)}
              buttons={[
                {
                  value: 'active',
                  label: '進行中',
                  icon: 'progress-clock',
                },
                {
                  value: 'completed',
                  label: '完了',
                  icon: 'check-circle',
                },
                {
                  value: 'archived',
                  label: 'アーカイブ',
                  icon: 'archive',
                },
              ]}
              style={styles.segmentedButtons}
            />

            {/* ボタン */}
            <View style={styles.buttonContainer}>
              <Button mode="outlined" onPress={onDismiss} style={styles.button} disabled={saving}>
                キャンセル
              </Button>
              <Button
                mode="contained"
                onPress={handleSave}
                style={styles.button}
                disabled={!isTitleValid || saving}
                loading={saving}
              >
                {editingCase ? '更新' : '作成'}
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  );
};

/**
 * スタイル定義
 */
const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '90%',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  textArea: {
    marginBottom: 16,
    minHeight: 100,
  },
  statusLabel: {
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
