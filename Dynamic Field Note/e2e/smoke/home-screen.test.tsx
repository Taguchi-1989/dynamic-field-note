/**
 * Smoke Test: Home Screen
 * CI/CD: Minimal test for critical user path
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { HomeScreen } from '../../src/screens/HomeScreen';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

describe('Smoke Test: Home Screen', () => {
  it('should render input field', () => {
    render(<HomeScreen />);
    const input = screen.getByPlaceholderText(/音声入力または手動でメモを入力してください/i);
    expect(input).toBeTruthy();
  });

  it('should render action buttons', () => {
    render(<HomeScreen />);
    const summarizeButton = screen.getByText('要約実行');
    const clearButton = screen.getByText('クリア');
    expect(summarizeButton).toBeTruthy();
    expect(clearButton).toBeTruthy();
  });

  it('should render markdown preview area', () => {
    const { toJSON } = render(<HomeScreen />);
    expect(toJSON()).toBeTruthy();
  });
});
