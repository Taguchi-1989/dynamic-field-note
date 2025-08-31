import React, { useState, useEffect, Suspense } from 'react';
import { DashboardProps, StepStatus } from '../types';
import { useDashboard } from '../hooks/useDashboard';
import { usePerformance, useWebVitals } from '../hooks/usePerformance';

// Components
import InputSection from './sections/InputSection';
import AIExecutionSection from './sections/AIExecutionSection';
import EditorSection from './sections/EditorSection';
import PromptSelector from './PromptSelector';
import Toast from './Toast';

// Lazy load heavy modal components
const DictionaryModal = React.lazy(() => import('./DictionaryModal'));
const SettingsModal = React.lazy(() => import('./SettingsModal'));
const AboutModal = React.lazy(() => import('./AboutModal'));
const ContactModal = React.lazy(() => import('./ContactModal'));

// CSS imports - core styles only, modal styles loaded dynamically
import './sections/InputSection.css';
import './sections/AIExecutionSection.css';
import './sections/EditorSection.css';
import './Dashboard.css';

const DashboardRefactored: React.FC<DashboardProps> = () => {
  const dashboardState = useDashboard();
  
  // パフォーマンス監視
  usePerformance('DashboardRefactored');
  useWebVitals();

  // デフォルトプロンプトテキスト
  const [promptText, setPromptText] = useState<string>('');
  
  // 文字数管理（分割処理用）
  const [totalCharacters, setTotalCharacters] = useState<number>(0);
  
  // 分割処理進捗管理
  const [chunkingProgress, setChunkingProgress] = useState<{
    totalChunks: number;
    processedChunks: number;
    currentChunk: number;
    status: 'chunking' | 'processing' | 'merging' | 'completed' | 'error';
    estimatedTimeLeft: number;
    errorCount: number;
    currentChunkText?: string;
  } | undefined>(undefined);
  
  const defaultPrompt = `あなたはプロの議事録編集者です。以下のテキストは会議の音声認識結果です。
以下のルールに従って、テキストを修正し、Markdown形式で出力してください。

# ルール
- 誤字脱字を修正してください
- 文脈に合わない単語を修正してください
- 話し言葉（「えーと」「あのー」など）を削除し、自然で読みやすい文章にしてください
- 話者情報は変更しないでください
- 出力はMarkdown形式のみとし、余計な説明は含めないでください

# Markdown書式要件
- 見出しには必ず「#」を使用して構造化してください（# 大見出し、## 中見出し、### 小見出し）
- 箇条書きには必ず「-」（ハイフン）を使用してください
- 議題や決定事項は適切な見出しレベルで構造化してください
- リストは「-」で統一し、番号リストが必要な場合のみ「1.」を使用してください

# 構造化の例
## 会議概要
- 日時: 
- 参加者: 

## 主な議題
### 議題1: タイトル
- 内容
- 決定事項

## アクションアイテム
- 担当者: 期限`;

  useEffect(() => {
    setPromptText(defaultPrompt);
  }, [defaultPrompt]);

  // ズーム機能の実装
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  
  useEffect(() => {
    const handleZoom = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        
        // deltaYが正の値 = 下スクロール = ズームアウト（縮小）
        // deltaYが負の値 = 上スクロール = ズームイン（拡大）
        const zoomDelta = event.deltaY < 0 ? 10 : -10;
        setZoomLevel(prevZoom => {
          const newZoom = Math.min(Math.max(prevZoom + zoomDelta, 50), 200);
          // CSS transformを使用してズーム
          const scale = newZoom / 100;
          document.body.style.transform = `scale(${scale})`;
          document.body.style.transformOrigin = '0 0';
          document.body.style.width = `${100 / scale}%`;
          document.body.style.height = `${100 / scale}%`;
          return newZoom;
        });
      }
    };

    const handleKeyboardZoom = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === '0') {
        event.preventDefault();
        setZoomLevel(100);
        document.body.style.transform = 'scale(1)';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
      } else if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        setZoomLevel(prevZoom => {
          const newZoom = Math.min(prevZoom + 10, 200);
          const scale = newZoom / 100;
          document.body.style.transform = `scale(${scale})`;
          document.body.style.transformOrigin = '0 0';
          document.body.style.width = `${100 / scale}%`;
          document.body.style.height = `${100 / scale}%`;
          return newZoom;
        });
      } else if ((event.ctrlKey || event.metaKey) && event.key === '-') {
        event.preventDefault();
        setZoomLevel(prevZoom => {
          const newZoom = Math.max(prevZoom - 10, 50);
          const scale = newZoom / 100;
          document.body.style.transform = `scale(${scale})`;
          document.body.style.transformOrigin = '0 0';
          document.body.style.width = `${100 / scale}%`;
          document.body.style.height = `${100 / scale}%`;
          return newZoom;
        });
      }
    };

    document.addEventListener('wheel', handleZoom, { passive: false });
    document.addEventListener('keydown', handleKeyboardZoom);
    
    // 初期化時にtransformをリセット
    document.body.style.transform = 'scale(1)';
    document.body.style.transformOrigin = '0 0';
    
    return () => {
      document.removeEventListener('wheel', handleZoom);
      document.removeEventListener('keydown', handleKeyboardZoom);
      // クリーンアップ時にスタイルをリセット
      document.body.style.transform = '';
      document.body.style.transformOrigin = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  // ステップの状態を計算
  const getStepStatus = (stepNumber: number): StepStatus => {
    const hasInput = dashboardState.uploadedText || dashboardState.directTextInput;
    switch (stepNumber) {
      case 1:
        return hasInput ? 'completed' : 'active';
      case 2:
        return hasInput && dashboardState.selectedPromptTemplate ? 'completed' : hasInput ? 'active' : 'pending';
      case 3:
        return dashboardState.outputText ? 'completed' : (hasInput && dashboardState.selectedPromptTemplate) ? 'active' : 'pending';
      case 4:
        return dashboardState.outputText ? 'active' : 'pending';
      default:
        return 'pending';
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // リフレッシュ機能（入力内容の初期化）
  const handleRefresh = () => {
    if (window.confirm('入力内容をすべてクリアしますか？')) {
      dashboardState.setUploadedText('');
      dashboardState.setDirectTextInput('');
      dashboardState.setOutputText('');
      dashboardState.setActiveTab('input');
      dashboardState.setIsProcessing(false);
      setTotalCharacters(0);
      setChunkingProgress(undefined);
      dashboardState.showToast('入力内容をクリアしました', 'info');
    }
  };

  // 新規議事録作成機能
  const handleNewDocument = () => {
    if (window.confirm('新しい議事録を作成しますか？\n現在の入力内容はクリアされます。')) {
      dashboardState.setUploadedText('');
      dashboardState.setDirectTextInput('');
      dashboardState.setOutputText('');
      dashboardState.setActiveTab('edit');
      dashboardState.setIsProcessing(false);
      setTotalCharacters(0);
      setChunkingProgress(undefined);
      dashboardState.setSaveTitle(`${new Date().toISOString().slice(0, 10)}_議事録`);
      dashboardState.showToast('新しい議事録を作成しました', 'success');
    }
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content container">
          <div className="header-title">
            <h1>📋 議事録修正支援アプリ</h1>
            <div className="header-actions">
              <button 
                className="header-btn new-document-btn" 
                onClick={handleNewDocument}
                title="新しい議事録を作成"
              >
                📝 議事録新規作成
              </button>
              <button 
                className="header-btn refresh-btn" 
                onClick={handleRefresh}
                title="入力内容をクリア"
              >
                🔄 リフレッシュ
              </button>
              {zoomLevel !== 100 && (
                <div className="zoom-indicator" title="現在のズーム倍率 (Ctrl+0でリセット)">
                  🔍 {zoomLevel}%
                </div>
              )}
            </div>
          </div>
          <div className="header-workflow">
            <span className={`workflow-step ${getStepStatus(1)}`}>📤 入力</span>
            <span className="workflow-arrow">→</span>
            <span className={`workflow-step ${getStepStatus(2)}`}>⚙️ プロンプト</span>
            <span className="workflow-arrow">→</span>
            <span className={`workflow-step ${getStepStatus(3)}`}>🤖 AI修正</span>
            <span className="workflow-arrow">→</span>
            <span className={`workflow-step ${getStepStatus(4)}`}>✏️ 編集</span>
          </div>
          <div className="header-buttons">
            <button className="header-btn" onClick={() => dashboardState.setIsAboutOpen(true)}>
              ℹ️ このアプリについて
            </button>
            <button className="header-btn" onClick={() => dashboardState.setIsSettingsOpen(true)}>
              ⚙️ 設定
            </button>
          </div>

          {/* モバイル用メニューボタン */}
          <button
            className="menu-toggle tap-target header-menu-toggle"
            aria-label="メニュー"
            aria-controls="dashboard-mobile-nav"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">メニュー</span>
            <i className="fas fa-bars" aria-hidden></i>
          </button>
        </div>

        {/* モバイル用ナビ（480px以下で表示） */}
        <nav id="dashboard-mobile-nav" className={`dashboard-mobile-nav ${mobileMenuOpen ? 'open' : ''}`}>
          <button className="mobile-nav-btn contact-btn" onClick={() => { setMobileMenuOpen(false); dashboardState.setIsContactOpen(true); }}>
            <i className="fas fa-envelope"></i>
            <span>お問い合わせ</span>
          </button>
          <button className="mobile-nav-btn" onClick={() => { setMobileMenuOpen(false); dashboardState.setIsAboutOpen(true); }}>
            <i className="fas fa-info-circle"></i>
            <span>About</span>
          </button>
          <button className="mobile-nav-btn" onClick={() => { setMobileMenuOpen(false); dashboardState.setIsSettingsOpen(true); }}>
            <i className="fas fa-cog"></i>
            <span>設定</span>
          </button>
        </nav>
      </header>

      {/* メインコンテンツ */}
      <div className="dashboard-layout container">
        {/* 左カラム: 操作パネル */}
        <div className="left-column">
          {/* 1. 入力エリア */}
          <InputSection
            uploadedText={dashboardState.uploadedText}
            setUploadedText={dashboardState.setUploadedText}
            directTextInput={dashboardState.directTextInput}
            setDirectTextInput={dashboardState.setDirectTextInput}
            uploadStatus={dashboardState.uploadStatus}
            setUploadStatus={dashboardState.setUploadStatus}
            dragOver={dashboardState.dragOver}
            setDragOver={dashboardState.setDragOver}
            isUploading={dashboardState.isUploading}
            setIsUploading={dashboardState.setIsUploading}
            showFileHelp={dashboardState.showFileHelp}
            setShowFileHelp={dashboardState.setShowFileHelp}
            showToast={dashboardState.showToast}
            totalCharacters={totalCharacters}
            setTotalCharacters={setTotalCharacters}
            lastSaved={dashboardState.lastSaved}
            hasUnsavedChanges={dashboardState.hasUnsavedChanges}
            onSave={dashboardState.saveCurrentState}
          />

          {/* 2. プロンプト選択エリア */}
          <div className="panel prompt-selection-panel">
            <div className="panel-header">
              <h2>⚙️ 2. プロンプト選択</h2>
            </div>
            <div className="panel-content">
              <PromptSelector
                selectedTemplate={dashboardState.selectedPromptTemplate}
                onPromptSelect={(template, customPrompt) => {
                  dashboardState.setSelectedPromptTemplate(template);
                  dashboardState.setCustomPromptText(customPrompt);
                }}
              />
            </div>
          </div>

          {/* 3. AI実行エリア */}
          <AIExecutionSection
            uploadedText={dashboardState.uploadedText}
            directTextInput={dashboardState.directTextInput}
            isProcessing={dashboardState.isProcessing}
            setIsProcessing={dashboardState.setIsProcessing}
            setOutputText={dashboardState.setOutputText}
            setActiveTab={dashboardState.setActiveTab}
            selectedModel={dashboardState.selectedModel}
            setSelectedModel={dashboardState.setSelectedModel}
            selectedPromptTemplate={dashboardState.selectedPromptTemplate}
            customPromptText={dashboardState.customPromptText}
            showModelInfo={dashboardState.showModelInfo}
            setShowModelInfo={dashboardState.setShowModelInfo}
            useCustomDictionary={dashboardState.useCustomDictionary}
            showToast={dashboardState.showToast}
            totalCharacters={totalCharacters}
            chunkingProgress={chunkingProgress}
            apiKeysAvailable={dashboardState.apiKeysAvailable}
          />
        </div>

        {/* 右カラム: 編集＆プレビューエリア */}
        <div className="right-column">
          <EditorSection
            outputText={dashboardState.outputText}
            setOutputText={dashboardState.setOutputText}
            previewText={dashboardState.previewText}
            setPreviewText={dashboardState.setPreviewText}
            editorText={dashboardState.editorText}
            setEditorText={dashboardState.setEditorText}
            revisionNotes={dashboardState.revisionNotes}
            setRevisionNotes={dashboardState.setRevisionNotes}
            showRevisionPanel={dashboardState.showRevisionPanel}
            setShowRevisionPanel={dashboardState.setShowRevisionPanel}
            isRevising={dashboardState.isRevising}
            setIsRevising={dashboardState.setIsRevising}
            saveTitle={dashboardState.saveTitle}
            setSaveTitle={dashboardState.setSaveTitle}
            setActiveTab={dashboardState.setActiveTab}
            showToast={dashboardState.showToast}
            selectedModel={dashboardState.selectedModel}
          />
        </div>
      </div>

      {/* カスタム辞書モーダル */}
      {dashboardState.isDictionaryOpen && (
        <Suspense fallback={<div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-primary)'}}>読み込み中...</div>}>
          <DictionaryModal 
            isOpen={dashboardState.isDictionaryOpen}
            onClose={() => dashboardState.setIsDictionaryOpen(false)}
          />
        </Suspense>
      )}

      {/* 設定モーダル */}
      {dashboardState.isSettingsOpen && (
        <Suspense fallback={<div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-primary)'}}>読み込み中...</div>}>
          <SettingsModal
            isOpen={dashboardState.isSettingsOpen}
            onClose={() => dashboardState.setIsSettingsOpen(false)}
            promptText={promptText}
            onPromptChange={setPromptText}
            onPromptReset={() => setPromptText(defaultPrompt)}
            onOpenDictionary={() => dashboardState.setIsDictionaryOpen(true)}
            isDarkMode={dashboardState.isDarkMode}
            onToggleDarkMode={dashboardState.toggleDarkMode}
            useCustomDictionary={dashboardState.useCustomDictionary}
            onToggleCustomDictionary={dashboardState.toggleCustomDictionary}
            onOpenContact={() => dashboardState.setIsContactOpen(true)}
          />
        </Suspense>
      )}

      {dashboardState.isAboutOpen && (
        <Suspense fallback={<div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-primary)'}}>読み込み中...</div>}>
          <AboutModal
            isOpen={dashboardState.isAboutOpen}
            onClose={() => dashboardState.setIsAboutOpen(false)}
          />
        </Suspense>
      )}

      {dashboardState.isContactOpen && (
        <Suspense fallback={<div style={{position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--text-primary)'}}>読み込み中...</div>}>
          <ContactModal
            isOpen={dashboardState.isContactOpen}
            onClose={() => dashboardState.setIsContactOpen(false)}
          />
        </Suspense>
      )}

      {/* フッター */}
      <footer className="dashboard-footer">
        <p>Copyright © ZEAL-BOOT-CAMP</p>
      </footer>

      {/* 通知 */}
      <Toast
        message={dashboardState.toast.message}
        type={dashboardState.toast.type}
        isVisible={dashboardState.toast.isVisible}
        onClose={dashboardState.hideToast}
      />
    </div>
  );
};

export default DashboardRefactored;
