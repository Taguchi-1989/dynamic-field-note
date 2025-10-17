/**
 * Jest Setup
 * Global test configuration and mocks
 */

import '@testing-library/react-native';

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-paper
jest.mock('react-native-paper', () => {
  const RealModule = jest.requireActual('react-native-paper');
  const MockedModule = {
    ...RealModule,
    Portal: ({ children }) => children,
  };
  return MockedModule;
});

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
    }),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock Gemini API
jest.mock('./src/services/geminiService', () => ({
  summarizeText: jest.fn().mockResolvedValue({
    summary: {
      title: 'Test Summary',
      date: '2025-10-18',
      summary: 'This is a test summary',
      key_points: ['Point 1', 'Point 2'],
      action_items: ['Action 1', 'Action 2'],
    },
    processing_time: 1000,
  }),
  testGeminiConnection: jest.fn().mockResolvedValue(true),
  isGeminiConfigured: jest.fn().mockReturnValue(true),
}));

// Global test timeout
jest.setTimeout(10000);

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
