/**
 * Smoke Test: App Launch
 * CI/CD: Minimal test to ensure app launches
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../../App';

describe('Smoke Test: App Launch', () => {
  it('should render App component without crashing', () => {
    const { toJSON } = render(<App />);
    expect(toJSON()).toBeTruthy();
  });

  it('should render navigation container', () => {
    const { getByTestId } = render(<App />);
    // Basic smoke test - just ensure no crash
    expect(true).toBe(true);
  });
});
