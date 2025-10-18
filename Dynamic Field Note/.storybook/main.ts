/**
 * Storybook Main Configuration
 * React Native用のStorybook設定
 */

import type { StorybookConfig } from '@storybook/react-native';

const config: StorybookConfig = {
  stories: ['../src/components/**/*.stories.@(ts|tsx|js|jsx)'],
  addons: ['@storybook/addon-ondevice-controls', '@storybook/addon-ondevice-actions'],
};

export default config;
