/**
 * LoadingIndicator Stories
 * ローディングインジケーターのStorybook
 */

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import { View } from 'react-native';
import { LoadingIndicator } from './LoadingIndicator';

const meta = {
  title: 'Components/LoadingIndicator',
  component: LoadingIndicator,
  decorators: [
    (Story) => (
      <View style={{ padding: 16, height: 200 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof LoadingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * デフォルトメッセージ
 */
export const Default: Story = {
  args: {},
};

/**
 * カスタムメッセージ
 */
export const CustomMessage: Story = {
  args: {
    message: 'データを読み込み中...',
  },
};

/**
 * AI処理中
 */
export const AIProcessing: Story = {
  args: {
    message: 'Gemini AIで要約中...',
  },
};

/**
 * 報告書保存中
 */
export const SavingReport: Story = {
  args: {
    message: '報告書を保存中...',
  },
};
