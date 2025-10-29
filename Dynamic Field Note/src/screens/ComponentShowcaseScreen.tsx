/**
 * Component Showcase Screen
 * コンポーネントプレビュー画面（Storybook代替）
 * ブラウザで確認可能
 */

import React, { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider, SegmentedButtons } from 'react-native-paper';
import { AIStatusIndicator } from '../components/AIStatusIndicator';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { PhotoThumbnailGrid } from '../components/PhotoThumbnailGrid';
import { PhotoViewerModal } from '../components/PhotoViewerModal';
import { ReportCard } from '../components/ReportCard';
import type { Photo, Report } from '../types/case';

// モックデータ
const mockPhotos: Photo[] = [
  {
    id: 1,
    case_id: 1,
    report_id: null,
    file_path: 'https://picsum.photos/400/400?random=1',
    thumbnail_path: 'https://picsum.photos/200/200?random=1',
    caption: '現場写真1',
    exif_data: null,
    annotation_data: null,
    width: 400,
    height: 400,
    file_size: 50000,
    created_at: '2025-01-18T10:00:00Z',
    is_deleted: 0,
  },
];

const mockReport: Report = {
  id: 1,
  case_id: 1,
  title: '現場調査報告書',
  content: '# 現場調査報告書\n\n## 概要\n本日の現場調査を実施しました。',
  voice_buffer: '',
  summary_json: '',
  processing_time: 1500,
  created_at: '2025-01-18T10:00:00Z',
  updated_at: '2025-01-18T10:30:00Z',
  is_deleted: 0,
};

export const ComponentShowcaseScreen: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState('ai-status');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium">Component Showcase</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          UIコンポーネントプレビュー
        </Text>
      </View>

      <SegmentedButtons
        value={selectedComponent}
        onValueChange={setSelectedComponent}
        buttons={[
          { value: 'ai-status', label: 'AI Status' },
          { value: 'loading', label: 'Loading' },
          { value: 'photos', label: 'Photos' },
          { value: 'report', label: 'Report' },
        ]}
        style={styles.segmentedButtons}
      />

      <Divider style={styles.divider} />

      {/* AIStatusIndicator */}
      {selectedComponent === 'ai-status' && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            AIStatusIndicator
          </Text>

          <View style={styles.preview}>
            <Text variant="labelMedium">Idle</Text>
            <AIStatusIndicator status="idle" />
          </View>

          <View style={styles.preview}>
            <Text variant="labelMedium">Processing (50%)</Text>
            <AIStatusIndicator status="processing" progress={0.5} message="AI処理中... 50%" />
          </View>

          <View style={styles.preview}>
            <Text variant="labelMedium">Success</Text>
            <AIStatusIndicator status="success" message="要約完了" />
          </View>

          <View style={styles.preview}>
            <Text variant="labelMedium">Error</Text>
            <AIStatusIndicator status="error" errorMessage="APIエラーが発生しました" />
          </View>
        </View>
      )}

      {/* LoadingIndicator */}
      {selectedComponent === 'loading' && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            LoadingIndicator
          </Text>

          <View style={styles.preview}>
            <Text variant="labelMedium">Default</Text>
            <LoadingIndicator />
          </View>

          <View style={styles.preview}>
            <Text variant="labelMedium">Custom Message</Text>
            <LoadingIndicator message="データを読み込み中..." />
          </View>
        </View>
      )}

      {/* PhotoThumbnailGrid */}
      {selectedComponent === 'photos' && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            PhotoThumbnailGrid
          </Text>

          <View style={styles.preview}>
            <Text variant="labelMedium">Empty</Text>
            <PhotoThumbnailGrid
              photos={[]}
              maxPhotos={10}
              onPhotoPress={(photo) => setSelectedPhoto(photo)}
              onDeletePress={() => {
                if (__DEV__) {
                  console.log('Delete');
                }
              }}
              onAddPress={() => {
                if (__DEV__) {
                  console.log('Add');
                }
              }}
            />
          </View>

          <View style={styles.preview}>
            <Text variant="labelMedium">With Photo</Text>
            <PhotoThumbnailGrid
              photos={mockPhotos}
              maxPhotos={10}
              onPhotoPress={(photo) => setSelectedPhoto(photo)}
              onDeletePress={() => {
                if (__DEV__) {
                  console.log('Delete');
                }
              }}
              onAddPress={() => {
                if (__DEV__) {
                  console.log('Add');
                }
              }}
            />
          </View>

          <PhotoViewerModal
            photo={selectedPhoto}
            visible={!!selectedPhoto}
            onDismiss={() => setSelectedPhoto(null)}
          />
        </View>
      )}

      {/* ReportCard */}
      {selectedComponent === 'report' && (
        <View style={styles.section}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            ReportCard
          </Text>

          <View style={styles.preview}>
            <ReportCard
              report={mockReport}
              onPress={() => {
                if (__DEV__) {
                  console.log('Press');
                }
              }}
              onLongPress={() => {
                if (__DEV__) {
                  console.log('Long Press');
                }
              }}
              onEdit={() => {
                if (__DEV__) {
                  console.log('Edit');
                }
              }}
              onDelete={() => {
                if (__DEV__) {
                  console.log('Delete');
                }
              }}
            />
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    paddingTop: 24,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  segmentedButtons: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  preview: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});
