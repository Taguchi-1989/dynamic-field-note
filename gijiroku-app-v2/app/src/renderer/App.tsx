import React, { useState, lazy, Suspense } from 'react';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import ElectronModeIndicator from './components/ElectronModeIndicator';
// import HealthStatusPanel from './components/HealthStatusPanel'; // Disabled for offline mode

// Code splitting - lazy load components
const FileUpload = lazy(() => import('./components/FileUpload'));
const TextEditor = lazy(() => import('./components/TextEditor'));
const ProcessingResult = lazy(() => import('./components/ProcessingResult'));
const DashboardRefactored = lazy(() => import('./components/DashboardRefactored'));
const Header = lazy(() => import('./components/Header'));
const DataSyncTester = lazy(() => import('./components/DataSyncTester'));
const ApiTest = lazy(() => import('./components/ApiTest'));

export interface ProcessedText {
  original: string;
  corrected: string;
  corrections: Array<{
    step: string;
    original: string;
    corrected: string;
    reason: string;
    count: number;
  }>;
}

function App() {
  const [processedText, setProcessedText] = useState<ProcessedText | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'upload' | 'dashboard' | 'result' | 'editor' | 'sync-test' | 'api-test'>('dashboard');

  const handleFileProcessed = (result: ProcessedText) => {
    setProcessedText(result);
    setViewMode('result');
  };

  const handleProcessingStateChange = (processing: boolean) => {
    setIsProcessing(processing);
  };

  const handleEdit = () => {
    setViewMode('editor');
  };

  const handleReset = () => {
    setProcessedText(null);
    setViewMode('dashboard');
  };

  return (
    <ErrorBoundary>
      <div className="app">
        {/* Simple top-right quick nav - only show dashboard return button */}
        <div style={{ position: 'fixed', top: 8, right: 8, display: 'flex', gap: 8, zIndex: 1000 }}>
          {viewMode !== 'dashboard' && (
            <button onClick={() => setViewMode('dashboard')} style={{ padding: '6px 10px' }}>🏠 ダッシュボード</button>
          )}
        </div>
        {/* <ElectronModeIndicator /> Temporary disabled due to Vite HMR issues */}
        {/* <HealthStatusPanel /> Disabled for offline mode */}
        {viewMode === 'dashboard' && (
          <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}} aria-live="polite">読み込み中...</div>}>
            <DashboardRefactored onReset={handleReset} />
          </Suspense>
        )}
      
      {viewMode === 'upload' && (
        <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>読み込み中...</div>}>
          <Header />
          <main className="main-content">
            <div className="upload-section">
              <h2>VTTファイルをアップロード</h2>
              <FileUpload 
                onFileProcessed={handleFileProcessed}
                onProcessingChange={handleProcessingStateChange}
                isProcessing={isProcessing}
              />
            </div>
          </main>
        </Suspense>
      )}

      {viewMode === 'result' && processedText && (
        <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>読み込み中...</div>}>
          <Header />
          <main className="main-content">
            <ProcessingResult 
              processedText={processedText}
              onEdit={handleEdit}
              onReset={handleReset}
            />
          </main>
        </Suspense>
      )}

      {viewMode === 'editor' && processedText && (
        <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}}>読み込み中...</div>}>
          <Header />
          <main className="main-content">
            <TextEditor 
              processedText={processedText}
              onReset={handleReset}
            />
          </main>
        </Suspense>
      )}
      
      
        {isProcessing && (
          <div className="loading-overlay" aria-live="polite" aria-label="処理中">
            <div className="loading-spinner">
              <div className="spinner" aria-hidden="true"></div>
              <p aria-live="polite">議事録を処理中...</p>
            </div>
          </div>
        )}

        {viewMode === 'sync-test' && (
          <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}} aria-live="polite">読み込み中...</div>}>
            <DataSyncTester />
          </Suspense>
        )}

        {viewMode === 'api-test' && (
          <Suspense fallback={<div style={{padding: '2rem', textAlign: 'center'}} aria-live="polite">読み込み中...</div>}>
            <ApiTest />
          </Suspense>
        )}
      </div>
    </ErrorBoundary>
  );
}

export default App;