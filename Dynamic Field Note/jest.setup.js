/**
 * Jest Setup
 * Global test configuration and mocks
 */

// Define __DEV__ global variable for tests
global.__DEV__ = true;

// Mock React Native
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: jest.fn((obj) => obj.ios || obj.default),
  },
  StyleSheet: {
    create: jest.fn((styles) => styles),
    flatten: jest.fn((style) => style),
  },
  View: 'View',
  Text: 'Text',
  TextInput: 'TextInput',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Alert: {
    alert: jest.fn(),
  },
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 667 })),
  },
}));

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
jest.mock('react-native-paper', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');
  return {
    Provider: jest.fn(({ children }) => children),
    Portal: jest.fn(({ children }) => children),
    Button: jest.fn(() => null),
    FAB: jest.fn(() => null),
    Card: Object.assign(
      jest.fn(({ children, onPress, onLongPress, ...props }) =>
        React.createElement('View', { onPress, onLongPress, testID: 'card', ...props }, children)
      ),
      {
        Content: jest.fn(({ children }) => React.createElement('View', null, children)),
      }
    ),
    List: jest.fn(() => null),
    Switch: jest.fn(() => null),
    SegmentedButtons: jest.fn(() => null),
    ActivityIndicator: jest.fn(({ size, color }) =>
      React.createElement('View', { testID: 'activity-indicator', size, color })
    ),
    Text: jest.fn(({ children, style, ...props }) =>
      React.createElement('Text', { style, ...props }, children)
    ),
    Menu: Object.assign(
      jest.fn(({ visible, _onDismiss, anchor, children }) =>
        visible ? React.createElement('View', null, anchor, children) : anchor
      ),
      {
        Item: jest.fn(({ onPress, title, leadingIcon }) =>
          React.createElement(
            'Text',
            { onPress, testID: `menu-item-${title}`, accessibilityLabel: leadingIcon },
            title
          )
        ),
      }
    ),
    IconButton: jest.fn(({ icon, onPress, _size, ...props }) =>
      React.createElement('Text', {
        onPress,
        testID: `icon-button-${icon}`,
        accessibilityLabel: icon,
        ...props,
      })
    ),
    Divider: jest.fn(() => React.createElement('View', { testID: 'divider' })),
  };
});

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

// Mock expo-sqlite (auto-mocked from __mocks__/expo-sqlite.js)
jest.mock('expo-sqlite');

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
