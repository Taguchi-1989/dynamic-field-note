/**
 * @fileoverview API testing component for development
 * @module components/ApiTest
 */

import React, { useState, useCallback, memo } from 'react';
import API_ENDPOINTS from '../config/api';

/**
 * Container styles
 */
const CONTAINER_STYLES: React.CSSProperties = {
  padding: '20px',
  border: '1px solid #ccc',
  margin: '20px',
} as const;

/**
 * Result display styles
 */
const RESULT_STYLES: React.CSSProperties = {
  background: '#f5f5f5',
  padding: '10px',
  marginTop: '10px',
  whiteSpace: 'pre-wrap',
  maxHeight: '300px',
  overflow: 'auto',
} as const;

/**
 * Default result message
 */
const DEFAULT_MESSAGE = 'Click the button to test API';

/**
 * Button text constants
 */
const BUTTON_TEXT = {
  IDLE: '🚀 Test API',
  LOADING: '⏳ Testing...',
} as const;

/**
 * API test result type
 */
type ApiTestResult = string;

/**
 * API testing component
 *
 * Development utility component for testing API endpoints.
 * Displays request/response details and handles errors.
 *
 * @example
 * ```tsx
 * <ApiTest />
 * ```
 */
const ApiTest: React.FC = memo(() => {
  /**
   * API test result
   */
  const [result, setResult] = useState<ApiTestResult>('');

  /**
   * Loading state
   */
  const [loading, setLoading] = useState<boolean>(false);

  /**
   * Test API endpoint
   */
  const testApi = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      // Log request start
      console.log('🔄 API Test - Starting...', { endpoint: API_ENDPOINTS.prompts });

      const response = await fetch(API_ENDPOINTS.prompts);

      // Log response details
      console.log('📡 API Test Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data: unknown = await response.json();
      console.log('📄 API Test Data:', data);

      setResult(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('❌ API Test Error:', error);
      setResult(`Error: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Handle test button click
   */
  const handleTestClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      event.preventDefault();
      void testApi();
    },
    [testApi]
  );

  const buttonText = loading ? BUTTON_TEXT.LOADING : BUTTON_TEXT.IDLE;
  const displayResult = result || DEFAULT_MESSAGE;

  return (
    <div style={CONTAINER_STYLES} role="region" aria-label="API Test Tool">
      <h3>🧪 API Test Component</h3>
      <p>
        <strong>Endpoint:</strong> {API_ENDPOINTS.prompts}
      </p>
      <button
        onClick={handleTestClick}
        disabled={loading}
        type="button"
        aria-busy={loading}
      >
        {buttonText}
      </button>
      <pre
        style={RESULT_STYLES}
        aria-live="polite"
        aria-label="API test result"
      >
        {displayResult}
      </pre>
    </div>
  );
});

ApiTest.displayName = 'ApiTest';

export default ApiTest;