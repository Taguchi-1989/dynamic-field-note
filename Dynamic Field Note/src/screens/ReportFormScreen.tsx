/**
 * 報告書作成・編集画面
 * Phase 3.4: 報告書管理機能実装
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { reportDAO } from '../dao/ReportDAO';
import { MarkdownPreview } from '../components/MarkdownPreview';
import type { CreateReportInput, UpdateReportInput } from '../types/case';

type RootStackParamList = {
  ReportForm: { caseId: number; reportId?: number };
};

type ReportFormScreenRouteProp = RouteProp<RootStackParamList, 'ReportForm'>;
type ReportFormScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ReportFormScreen: React.FC = () => {
  const route = useRoute<ReportFormScreenRouteProp>();
  const navigation = useNavigation<ReportFormScreenNavigationProp>();
  const { caseId, reportId } = route.params;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isModified, setIsModified] = useState(false);

  // 自動保存用のタイマー
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  /**
   * 既存報告書の読み込み (編集モード)
   */
  useEffect(() => {
    if (reportId) {
      loadReport(reportId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  const loadReport = async (id: number) => {
    try {
      setLoading(true);
      const report = await reportDAO.findById(id);
      if (report) {
        setTitle(report.title);
        setContent(report.content || '');
      } else {
        Alert.alert('エラー', '報告書が見つかりませんでした');
        navigation.goBack();
      }
    } catch (error) {
      console.error('[ReportFormScreen] Failed to load report:', error);
      Alert.alert('エラー', '報告書の読み込みに失敗しました');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  /**
   * 変更検知
   */
  useEffect(() => {
    setIsModified(true);
  }, [title, content]);

  /**
   * 自動保存 (5秒後)
   */
  useEffect(() => {
    if (!isModified || (!title && !content)) {
      return;
    }

    // 既存のタイマーをクリア
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }

    // 新しいタイマーをセット
    const timer = setTimeout(() => {
      handleSave(true); // isDraft = true
    }, 5000);

    setAutoSaveTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, isModified]);

  /**
   * バリデーション
   */
  const validate = (): boolean => {
    if (!title.trim()) {
      Alert.alert('入力エラー', 'タイトルを入力してください');
      return false;
    }

    if (title.length > 100) {
      Alert.alert('入力エラー', 'タイトルは100文字以内で入力してください');
      return false;
    }

    return true;
  };

  /**
   * 保存処理
   */
  const handleSave = useCallback(
    async (isDraft = false) => {
      if (!validate()) {
        return;
      }

      setSaving(true);

      try {
        if (reportId) {
          // 更新
          const updateData: UpdateReportInput = {
            title: title.trim(),
            content: content.trim() || undefined,
          };
          await reportDAO.update(reportId, updateData);
        } else {
          // 新規作成
          const createData: CreateReportInput = {
            case_id: caseId,
            title: title.trim(),
            content: content.trim() || undefined,
          };
          await reportDAO.create(createData);
        }

        setIsModified(false);

        if (!isDraft) {
          // 手動保存の場合は画面を閉じる
          navigation.goBack();
        }
      } catch (error) {
        console.error('[ReportFormScreen] Failed to save report:', error);
        if (!isDraft) {
          // 手動保存の失敗のみアラート表示
          Alert.alert('エラー', '報告書の保存に失敗しました');
        }
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reportId, caseId, title, content, navigation]
  );

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
            onPress: async () => {
              await handleSave(false);
            },
          },
        ],
        { cancelable: true }
      );
    } else {
      navigation.goBack();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModified, navigation]);

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
        <Appbar.Action icon="content-save" onPress={() => handleSave(false)} disabled={saving} />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
