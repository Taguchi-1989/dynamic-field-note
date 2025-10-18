/**
 * ReportCard Stories
 * 報告書カードのStorybook
 */

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import { View } from 'react-native';
import { ReportCard } from './ReportCard';
import type { Report } from '../types/case';

const meta = {
  title: 'Components/ReportCard',
  component: ReportCard,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof ReportCard>;

export default meta;

type Story = StoryObj<typeof meta>;

// モック報告書データ
const mockReport: Report = {
  id: 1,
  case_id: 1,
  title: '現場調査報告書',
  content:
    '# 現場調査報告書\n\n## 概要\n本日の現場調査では、設備の劣化状況を確認しました。\n\n## 調査結果\n- 外壁：ひび割れ複数箇所確認\n- 設備：正常動作\n- その他：特記事項なし',
  voice_buffer: '音声入力テキスト...',
  summary_json: '{"summary": "現場調査完了"}',
  processing_time: 1500,
  created_at: '2025-01-18T10:00:00Z',
  updated_at: '2025-01-18T10:30:00Z',
  is_deleted: 0,
};

const mockReportLongTitle: Report = {
  ...mockReport,
  id: 2,
  title: '非常に長いタイトルの報告書でテキストが折り返されることを確認するためのサンプル',
  updated_at: '2025-01-17T15:00:00Z',
};

const mockReportShortContent: Report = {
  ...mockReport,
  id: 3,
  title: '簡易報告書',
  content: '# 簡易報告\n\n特記事項なし。',
  updated_at: '2025-01-16T09:00:00Z',
};

/**
 * 標準的な報告書
 */
export const Default: Story = {
  args: {
    report: mockReport,
    onPress: () => console.log('Report pressed'),
    onLongPress: () => console.log('Report long pressed'),
    onEdit: () => console.log('Report edit'),
    onDelete: () => console.log('Report delete'),
  },
};

/**
 * 長いタイトル
 */
export const LongTitle: Story = {
  args: {
    report: mockReportLongTitle,
    onPress: () => console.log('Report pressed'),
    onLongPress: () => console.log('Report long pressed'),
    onEdit: () => console.log('Report edit'),
    onDelete: () => console.log('Report delete'),
  },
};

/**
 * 短いコンテンツ
 */
export const ShortContent: Story = {
  args: {
    report: mockReportShortContent,
    onPress: () => console.log('Report pressed'),
    onLongPress: () => console.log('Report long pressed'),
    onEdit: () => console.log('Report edit'),
    onDelete: () => console.log('Report delete'),
  },
};

/**
 * クリック時の動作
 */
export const Interactive: Story = {
  args: {
    report: mockReport,
    onPress: () => alert('報告書がタップされました'),
    onLongPress: () => alert('長押しされました'),
    onEdit: () => alert('編集'),
    onDelete: () => alert('削除'),
  },
};
