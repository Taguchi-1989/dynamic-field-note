/**
 * PhotoThumbnailGrid Stories
 * 写真サムネイルグリッドのStorybook
 */

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import { View } from 'react-native';
import { PhotoThumbnailGrid } from './PhotoThumbnailGrid';
import type { Photo } from '../types/case';

const meta = {
  title: 'Components/PhotoThumbnailGrid',
  component: PhotoThumbnailGrid,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof PhotoThumbnailGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

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
  {
    id: 2,
    case_id: 1,
    report_id: null,
    file_path: 'https://picsum.photos/400/400?random=2',
    thumbnail_path: 'https://picsum.photos/200/200?random=2',
    caption: '現場写真2',
    exif_data: null,
    annotation_data: null,
    width: 400,
    height: 400,
    file_size: 60000,
    created_at: '2025-01-18T10:05:00Z',
    is_deleted: 0,
  },
  {
    id: 3,
    case_id: 1,
    report_id: null,
    file_path: 'https://picsum.photos/400/400?random=3',
    thumbnail_path: 'https://picsum.photos/200/200?random=3',
    caption: null,
    exif_data: null,
    annotation_data: null,
    width: 400,
    height: 400,
    file_size: 55000,
    created_at: '2025-01-18T10:10:00Z',
    is_deleted: 0,
  },
];

/**
 * 空の状態
 */
export const Empty: Story = {
  args: {
    photos: [],
    maxPhotos: 10,
    onPhotoPress: () => console.log('Photo pressed'),
    onDeletePress: () => console.log('Delete pressed'),
    onAddPress: () => console.log('Add pressed'),
    disabled: false,
  },
};

/**
 * 写真1枚
 */
export const OnePhoto: Story = {
  args: {
    photos: [mockPhotos[0]],
    maxPhotos: 10,
    onPhotoPress: () => console.log('Photo pressed'),
    onDeletePress: () => console.log('Delete pressed'),
    onAddPress: () => console.log('Add pressed'),
    disabled: false,
  },
};

/**
 * 写真3枚
 */
export const ThreePhotos: Story = {
  args: {
    photos: mockPhotos,
    maxPhotos: 10,
    onPhotoPress: () => console.log('Photo pressed'),
    onDeletePress: () => console.log('Delete pressed'),
    onAddPress: () => console.log('Add pressed'),
    disabled: false,
  },
};

/**
 * 上限到達 (10枚)
 */
export const LimitReached: Story = {
  args: {
    photos: Array(10)
      .fill(null)
      .map((_, i) => ({
        ...mockPhotos[0],
        id: i + 1,
        file_path: `https://picsum.photos/400/400?random=${i + 10}`,
        thumbnail_path: `https://picsum.photos/200/200?random=${i + 10}`,
        caption: `写真${i + 1}`,
      })),
    maxPhotos: 10,
    onPhotoPress: () => console.log('Photo pressed'),
    onDeletePress: () => console.log('Delete pressed'),
    onAddPress: () => console.log('Add pressed'),
    disabled: false,
  },
};

/**
 * 無効状態
 */
export const Disabled: Story = {
  args: {
    photos: mockPhotos,
    maxPhotos: 10,
    onPhotoPress: () => console.log('Photo pressed'),
    onDeletePress: () => console.log('Delete pressed'),
    onAddPress: () => console.log('Add pressed'),
    disabled: true,
  },
};
