import React, { useState } from 'react';
import API_ENDPOINTS from '../config/api';

const ApiTest: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    try {
      console.log('🔄 API Test - Starting...', { endpoint: API_ENDPOINTS.prompts });
      
      const response = await fetch(API_ENDPOINTS.prompts);
      
      console.log('📡 API Test Response:', { 
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok,
        url: response.url 
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('📄 API Test Data:', data);
      
      setResult(`Success: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('❌ API Test Error:', error);
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>🧪 API Test Component</h3>
      <p>Endpoint: {API_ENDPOINTS.prompts}</p>
      <button onClick={testApi} disabled={loading}>
        {loading ? '⏳ Testing...' : '🚀 Test API'}
      </button>
      <pre style={{ 
        background: '#f5f5f5', 
        padding: '10px', 
        marginTop: '10px',
        whiteSpace: 'pre-wrap',
        maxHeight: '300px',
        overflow: 'auto'
      }}>
        {result || 'Click the button to test API'}
      </pre>
    </div>
  );
};

export default ApiTest;