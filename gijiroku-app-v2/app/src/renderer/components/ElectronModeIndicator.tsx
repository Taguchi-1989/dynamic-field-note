/**
 * @fileoverview Electron mode indicator component
 * @module components/ElectronModeIndicator
 */

import React, { memo, useMemo } from 'react';

/**
 * Inline styles for the indicator badge
 */
const INDICATOR_STYLES: React.CSSProperties = {
  position: 'fixed',
  top: 10,
  right: 10,
  background: '#2563eb',
  color: 'white',
  padding: '4px 8px',
  borderRadius: '4px',
  fontSize: '12px',
  zIndex: 1000,
} as const;

/**
 * Indicator text constant
 */
const INDICATOR_TEXT = 'Electron Mode';

/**
 * Extended Window interface with Electron API
 */
interface ElectronWindow extends Window {
  electronAPI?: unknown;
}

/**
 * Check if running in Electron environment
 *
 * @returns {boolean} True if Electron API is available
 */
const isElectronEnvironment = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const electronWindow = window as ElectronWindow;
  return typeof electronWindow.electronAPI !== 'undefined';
};

/**
 * Electron mode indicator component
 *
 * Displays a visual badge when the application is running in Electron mode.
 * Only visible when electronAPI is available on the window object.
 *
 * @example
 * ```tsx
 * <ElectronModeIndicator />
 * ```
 */
const ElectronModeIndicator: React.FC = memo(() => {
  /**
   * Memoized Electron environment check
   */
  const isElectron = useMemo((): boolean => {
    return isElectronEnvironment();
  }, []);

  if (!isElectron) {
    return null;
  }

  return (
    <div
      style={INDICATOR_STYLES}
      role="status"
      aria-label="Running in Electron mode"
      data-testid="electron-mode-indicator"
    >
      {INDICATOR_TEXT}
    </div>
  );
});

ElectronModeIndicator.displayName = 'ElectronModeIndicator';

export default ElectronModeIndicator;