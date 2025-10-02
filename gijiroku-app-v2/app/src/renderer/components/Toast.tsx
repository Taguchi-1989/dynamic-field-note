/**
 * @fileoverview Toast notification component for user feedback
 * @module components/Toast
 */

import React, { useEffect, useCallback, memo } from 'react';
import './Toast.css';

/**
 * Toast notification type variants
 */
type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Icon mapping for toast types
 */
const TOAST_ICONS: Record<ToastType, string> = {
  success: 'fas fa-check-circle',
  error: 'fas fa-exclamation-circle',
  warning: 'fas fa-exclamation-triangle',
  info: 'fas fa-info-circle',
} as const;

/**
 * Default auto-close duration in milliseconds
 */
const DEFAULT_DURATION = 4000;

/**
 * Props for Toast component
 */
interface ToastProps {
  /** Message to display in the toast */
  message: string;
  /** Visual style variant of the toast */
  type: ToastType;
  /** Controls visibility of the toast */
  isVisible: boolean;
  /** Callback fired when toast should close */
  onClose: () => void;
  /** Auto-close duration in milliseconds (default: 4000ms) */
  duration?: number;
}

/**
 * Toast notification component
 *
 * Displays temporary notification messages with auto-close functionality.
 * Supports success, error, warning, and info variants.
 *
 * @example
 * ```tsx
 * <Toast
 *   message="Operation successful!"
 *   type="success"
 *   isVisible={true}
 *   onClose={() => setShowToast(false)}
 *   duration={3000}
 * />
 * ```
 */
const Toast: React.FC<ToastProps> = memo(({
  message,
  type,
  isVisible,
  onClose,
  duration = DEFAULT_DURATION,
}) => {
  /**
   * Get icon class for the current toast type
   */
  const getIconClass = useCallback((): string => {
    return TOAST_ICONS[type];
  }, [type]);

  /**
   * Setup auto-close timer when toast becomes visible
   */
  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return (): void => {
      clearTimeout(timer);
    };
  }, [isVisible, onClose, duration]);

  /**
   * Handle close button click
   */
  const handleClose = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();
    onClose();
  }, [onClose]);

  if (!isVisible) {
    return null;
  }

  const iconClass = getIconClass();
  const toastClassName = `toast toast-${type} ${isVisible ? 'toast-visible' : ''}`;

  return (
    <div className={toastClassName} role="alert" aria-live="polite">
      <div className="toast-icon" aria-hidden="true">
        <i className={iconClass} />
      </div>
      <div className="toast-message">
        {message}
      </div>
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
        type="button"
      >
        <i className="fas fa-times" />
      </button>
    </div>
  );
});

Toast.displayName = 'Toast';

export default Toast;
export type { ToastProps, ToastType };