/**
 * PhotoViewerModal Stories
 * 写真拡大表示モーダルのStorybook
 */

import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { View } from 'react-native';
import { PhotoViewerModal } from './PhotoViewerModal';
import type { Photo } from '../types/case';

const meta = {
  title: 'Components/PhotoViewerModal',
  component: PhotoViewerModal,
  decorators: [
    (Story) => (
      <View style={{ flex: 1 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof PhotoViewerModal>;

export default meta;

type Story = StoryObj<typeof meta>;

// モック写真データ
const mockPhoto: Photo = {
  id: 1,
  case_id: 1,
  report_id: null,
  file_path: 'https://picsum.photos/800/600?random=1',
  thumbnail_path: 'https://picsum.photos/200/200?random=1',
  caption: '現場の状況確認',
  exif_data: null,
  annotation_data: null,
  width: 800,
  height: 600,
  file_size: 120000,
  created_at: '2025-01-18T10:00:00Z',
  is_deleted: 0,
};

const mockPhotoNoCaption: Photo = {
  ...mockPhoto,
  id: 2,
  caption: null,
  file_path: 'https://picsum.photos/800/600?random=2',
};

/**
 * キャプション付き
 */
export const WithCaption: Story = {
  args: {
    photo: mockPhoto,
    visible: true,
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * キャプションなし
 */
export const WithoutCaption: Story = {
  args: {
    photo: mockPhotoNoCaption,
    visible: true,
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * 非表示状態
 */
export const Hidden: Story = {
  args: {
    photo: mockPhoto,
    visible: false,
    onDismiss: () => console.log('Dismissed'),
  },
};

/**
 * 写真なし (null)
 */
export const NoPhoto: Story = {
  args: {
    photo: null,
    visible: true,
    onDismiss: () => console.log('Dismissed'),
  },
};
