/**
 * Jest Setup
 * Global test configuration and mocks
 */

// Mock React Native
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Platform.OS = 'ios';
  return RN;
});

// Mock expo modules
jest.mock('expo-status-bar', () => ({
  StatusBar: jest.fn(() => null),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  Provider: jest.fn(({ children }) => children),
  Portal: jest.fn(({ children }) => children),
  Button: jest.fn(() => null),
  FAB: jest.fn(() => null),
  Card: jest.fn(() => null),
  List: jest.fn(() => null),
  Switch: jest.fn(() => null),
  SegmentedButtons: jest.fn(() => null),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: jest.fn(({ children }) => children),
  useNavigation: jest.fn(() => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  })),
  useRoute: jest.fn(() => ({
    params: {},
  })),
}));

// Mock drawer
jest.mock('@react-navigation/drawer', () => ({
  createDrawerNavigator: jest.fn(() => ({
    Navigator: jest.fn(() => null),
    Screen: jest.fn(() => null),
  })),
}));

// Mock Gemini API
jest.mock('./src/services/geminiService', () => ({
  summarizeText: jest.fn(() =>
    Promise.resolve({
      summary: {
        title: 'Test Summary',
        date: '2025-10-18',
        summary: 'This is a test summary',
        key_points: ['Point 1', 'Point 2'],
        action_items: ['Action 1', 'Action 2'],
      },
      processing_time: 1000,
    })
  ),
  testGeminiConnection: jest.fn(() => Promise.resolve(true)),
  isGeminiConfigured: jest.fn(() => true),
}));

// Global test timeout
jest.setTimeout(10000);

// Silence console warnings in tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});
