/**
 * AIStatusIndicator Stories
 * AI状態インジケーターのStorybook
 */

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React from 'react';
import { View } from 'react-native';
import { AIStatusIndicator } from './AIStatusIndicator';

const meta = {
  title: 'Components/AIStatusIndicator',
  component: AIStatusIndicator,
  decorators: [
    (Story) => (
      <View style={{ padding: 16 }}>
        <Story />
      </View>
    ),
  ],
} satisfies Meta<typeof AIStatusIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * アイドル状態
 */
export const Idle: Story = {
  args: {
    status: 'idle',
  },
};

/**
 * 処理中状態
 */
export const Processing: Story = {
  args: {
    status: 'processing',
    progress: 0.5,
    message: 'AI処理中... 50%',
  },
};

/**
 * 成功状態
 */
export const Success: Story = {
  args: {
    status: 'success',
    message: '要約完了',
  },
};

/**
 * エラー状態
 */
export const Error: Story = {
  args: {
    status: 'error',
    errorMessage: 'APIエラーが発生しました',
  },
};

/**
 * 処理開始
 */
export const ProcessingStart: Story = {
  args: {
    status: 'processing',
    progress: 0.1,
    message: 'AI処理中... 10%',
  },
};

/**
 * 処理終盤
 */
export const ProcessingAlmostDone: Story = {
  args: {
    status: 'processing',
    progress: 0.9,
    message: 'AI処理中... 90%',
  },
};
