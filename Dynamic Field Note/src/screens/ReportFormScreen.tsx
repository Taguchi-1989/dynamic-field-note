/**
 * 報告書作成・編集画面
 * Phase 3.4: 報告書管理機能実装
 */

import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Appbar, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MarkdownPreview } from '../components/MarkdownPreview';
import { useReportForm } from '../hooks/useReportForm';
import { useAutoSave } from '../hooks/useAutoSave';

type RootStackParamList = {
  ReportForm: { caseId: number; reportId?: number };
};

type ReportFormScreenRouteProp = RouteProp<RootStackParamList, 'ReportForm'>;
type ReportFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ReportFormScreen: React.FC = () => {
  const route = useRoute<ReportFormScreenRouteProp>();
  const navigation = useNavigation<ReportFormScreenNavigationProp>();
  const { caseId, reportId } = route.params;

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  // フォーム状態管理
  const { title, setTitle, content, setContent, loading, saving, isModified, save } = useReportForm(
    { caseId, reportId }
  );

  // 自動保存 (5秒後)
  useAutoSave({
    data: { title, content },
    onSave: async () => {
      try {
        await save();
      } catch (err) {
        // 自動保存の失敗は silent (エラーログのみ)
        console.error('[ReportFormScreen] Auto-save failed:', err);
      }
    },
    delay: 5000,
    enabled: isModified && (!!title || !!content),
  });

  /**
   * 保存処理 (手動保存)
   */
  const handleSave = useCallback(async () => {
    try {
      await save();
      navigation.goBack();
    } catch (err) {
      const error = err as Error;
      Alert.alert('エラー', error.message || '報告書の保存に失敗しました');
    }
  }, [save, navigation]);

  /**
   * 戻るボタン処理
   */
  const handleBack = useCallback(() => {
    if (isModified) {
      Alert.alert(
        '未保存の変更',
        '変更が保存されていません。破棄しますか？',
        [
          {
            text: 'キャンセル',
            style: 'cancel',
          },
          {
            text: '破棄',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
          {
            text: '保存',
            onPress: handleSave,
          },
        ],
        { cancelable: true }
      );
    } else {
      navigation.goBack();
    }
  }, [isModified, navigation, handleSave]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <Appbar.Header>
        <Appbar.BackAction onPress={handleBack} />
        <Appbar.Content title={reportId ? '報告書編集' : '新規報告書'} />
        <Appbar.Action icon="content-save" onPress={handleSave} disabled={saving} />
      </Appbar.Header>

      <View style={styles.content}>
        {/* タイトル入力 */}
        <View style={styles.titleContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="報告書タイトル"
            value={title}
            onChangeText={setTitle}
            maxLength={100}
            editable={!saving}
          />
        </View>

        {/* 編集/プレビュー切り替え */}
        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as 'edit' | 'preview')}
          buttons={[
            {
              value: 'edit',
              label: '編集',
              icon: 'pencil',
            },
            {
              value: 'preview',
              label: 'プレビュー',
              icon: 'eye',
            },
          ]}
          style={styles.segmentedButtons}
        />

        {/* 編集エリア / プレビューエリア */}
        {viewMode === 'edit' ? (
          <TextInput
            style={styles.contentInput}
            placeholder="Markdown形式で入力..."
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            editable={!saving}
          />
        ) : (
          <ScrollView style={styles.previewContainer}>
            <MarkdownPreview content={content || '_プレビューする内容がありません_'} />
          </ScrollView>
        )}

        {/* 保存状態表示 */}
        {saving && (
          <View style={styles.savingIndicator}>
            <ActivityIndicator size="small" />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  titleContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 8,
  },
  segmentedButtons: {
    margin: 16,
    marginBottom: 8,
  },
  contentInput: {
    flex: 1,
    fontSize: 16,
    padding: 16,
    lineHeight: 24,
  },
  previewContainer: {
    flex: 1,
    padding: 16,
  },
  savingIndicator: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    borderRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
    }),
  },
});
