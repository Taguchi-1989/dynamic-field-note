import React, { memo } from 'react';
import { ModelInfo } from '../../types';
import './AIExecutionSection.css';

// 分割処理の進捗情報
interface ChunkingProgress {
  totalChunks: number;
  processedChunks: number;
  currentChunk: number;
  status: 'chunking' | 'processing' | 'merging' | 'completed' | 'error';
  estimatedTimeLeft: number;
  errorCount: number;
  currentChunkText?: string;
}

interface AIExecutionSectionProps {
  uploadedText: string;
  directTextInput: string;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  setOutputText: (text: string) => void;
  setActiveTab: (tab: 'edit' | 'preview') => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  selectedPromptTemplate: string;
  customPromptText: string | undefined;
  showModelInfo: boolean;
  setShowModelInfo: (show: boolean) => void;
  useCustomDictionary: boolean;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  totalCharacters?: number;
  chunkingProgress?: ChunkingProgress;
  setChunkingProgress?: (progress: ChunkingProgress | undefined) => void;
  apiKeysAvailable?: boolean;
}

const AIExecutionSection: React.FC<AIExecutionSectionProps> = ({
  uploadedText,
  directTextInput,
  isProcessing,
  setIsProcessing,
  setOutputText,
  setActiveTab,
  selectedModel,
  setSelectedModel,
  selectedPromptTemplate,
  customPromptText,
  showModelInfo,
  setShowModelInfo,
  useCustomDictionary,
  showToast,
  totalCharacters,
  chunkingProgress,
  apiKeysAvailable,
}) => {
  const executeAI = async () => {
    const inputText = uploadedText || directTextInput;
    if (!inputText.trim()) {
      showToast('まずファイルをアップロードするか、テキストを入力してください', 'warning');
      return;
    }

    // === 新規追加: 事前APIキーチェック ===
    console.log('🔍 Pre-execution API key validation...');
    
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const electronAPI = (window as any).electronAPI;
        
        // API設定状況の確認
        const apiStatus = await electronAPI.security.getApiConfigStatus();
        console.log('📊 API Status:', apiStatus);
        
        const hasAnyApiKey = apiStatus.gemini?.apiKey || apiStatus.openai?.apiKey;
        
        if (!hasAnyApiKey) {
          showToast(
            'APIキーが設定されていません。設定画面でGeminiまたはOpenAI APIキーを設定してください。', 
            'error'
          );
          return;
        }
        
        // 利用可能プロバイダーの確認
        const availableProviders = await electronAPI.ai.getAvailableProviders();
        console.log('🎯 Available providers:', availableProviders);
        
        if (!availableProviders.includes('gemini') && !availableProviders.includes('openai')) {
          console.warn('⚠️ No API providers available, will use offline processing');
        }
      }
    } catch (error) {
      console.error('❌ Pre-execution check failed:', error);
      // エラーがあっても実行は継続（オフライン処理にフォールバック）
    }

    setIsProcessing(true);
    
    try {
      console.log('🤖 統合AI処理を開始します（完全オフライン対応）');
      console.log('📤 処理データ:', {
        textLength: inputText.length,
        textPreview: inputText.slice(0, 200) + '...',
        promptTemplate: selectedPromptTemplate,
        customPromptLength: customPromptText?.length || 0,
        selectedModel,
        useCustomDictionary
      });

      let correctedText: string;
      let processingInfo: any = {};

      // ElectronAPIの利用可能性を確認
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        console.log('✅ Electron API統合AI処理を使用');
        
        const electronAPI = (window as any).electronAPI;
        
        // AI処理オプション設定
        const aiOptions = {
          provider: selectedModel.includes('gemini') ? 'gemini' : 
                    selectedModel.includes('openai') ? 'openai' : 
                    selectedModel.includes('mock') ? 'mock' : 'offline',
          model: selectedModel,
          temperature: 0.7,
          maxTokens: 8192
        };

        const result = await electronAPI.ai.processText(
          inputText,
          selectedPromptTemplate,
          customPromptText,
          aiOptions
        );

        if (result.success && result.data) {
          correctedText = result.data.processedText;
          processingInfo = result.data;
          console.log('✅ AI処理成功:', {
            provider: result.data.provider,
            model: result.data.model,
            processingTime: result.data.processingTime,
            warnings: result.data.warnings
          });
        } else {
          throw new Error(result.error?.message || 'AI処理に失敗しました');
        }
      } else {
        // フォールバック: モック処理
        console.log('⚠️ Electron API利用不可、モック処理に切り替え');
        
        correctedText = generateMockProcessedText(inputText, selectedPromptTemplate);
        processingInfo = {
          provider: 'fallback-mock',
          model: 'mock-processor-v1',
          processingTime: 1000 + Math.random() * 2000,
          warnings: ['Electron API利用不可のためモック処理を使用']
        };
      }

      // 処理結果の検証
      if (!correctedText || correctedText.trim().length === 0) {
        throw new Error('AI処理結果が空でした');
      }
      
      console.log('📝 AI処理完了:', {
        inputLength: inputText.length,
        outputLength: correctedText.length,
        provider: processingInfo.provider,
        model: processingInfo.model,
        processingTime: processingInfo.processingTime,
        warnings: processingInfo.warnings
      });
      
      setOutputText(correctedText);
      setActiveTab('edit');
      
      const successMessage = processingInfo.provider === 'offline' 
        ? 'AI修正処理が完了しました（オフライン処理）'
        : processingInfo.provider === 'fallback-mock'
        ? 'AI修正処理が完了しました（モック処理）'
        : `AI修正処理が完了しました（${processingInfo.provider}）`;
        
      showToast(successMessage, 'success');
      
      if (processingInfo.warnings && processingInfo.warnings.length > 0) {
        console.warn('⚠️ 処理警告:', processingInfo.warnings);
      }
      
    } catch (err: unknown) {
      console.error('❌ AI処理エラー:', err);
      
      let errorMessage = 'AI処理中にエラーが発生しました';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // モック処理用ヘルパー関数
  const generateMockProcessedText = (inputText: string, templateId: string): string => {
    const lines = inputText.split('\n').filter(line => line.trim().length > 0);
    
    let processed = `# 議事録（AI処理済み）\n\n`;
    processed += `**処理日時**: ${new Date().toLocaleDateString('ja-JP')}\n`;
    processed += `**処理方式**: オフラインモック処理\n`;
    processed += `**テンプレート**: ${templateId}\n\n`;
    processed += `## 会議内容\n\n`;
    
    lines.forEach((line, index) => {
      const cleanLine = line.replace(/えーと|あのー|そのー/g, '').trim();
      if (cleanLine.length > 5) {
        if (cleanLine.includes('質問') || cleanLine.includes('？')) {
          processed += `**Q**: ${cleanLine}\n\n`;
        } else if (cleanLine.includes('回答') || cleanLine.includes('答え')) {
          processed += `**A**: ${cleanLine}\n\n`;
        } else {
          processed += `- ${cleanLine}\n`;
        }
      }
    });
    
    processed += `\n## 処理情報\n\n`;
    processed += `- 元テキスト長: ${inputText.length}文字\n`;
    processed += `- 処理行数: ${lines.length}行\n`;
    processed += `- 処理方式: モック処理（デモ用）\n`;
    
    return processed;
  };

  const models: ModelInfo[] = [
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'Google', description: 'API設定時のみ利用可能', available: true },
    { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'Google', description: 'API設定時のみ利用可能', available: true },
    { value: 'gpt-5', label: 'GPT-5', provider: 'OpenAI', description: 'API設定時のみ利用可能', available: true },
  ];

  const hasInput = uploadedText || directTextInput;

  // 進捗表示の文字列を生成
  const getProgressString = (): string => {
    if (!chunkingProgress || !isProcessing) {
      return hasInput ? "実行準備完了" : "入力受付待ち";
    }

    const { totalChunks, processedChunks, status, estimatedTimeLeft } = chunkingProgress;
    const percentage = totalChunks > 0 ? Math.round((processedChunks / totalChunks) * 100) : 0;
    const progressBar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
    
    const timeStr = estimatedTimeLeft > 0 ? `残り約${Math.ceil(estimatedTimeLeft / 60)}分` : '';

    switch (status) {
      case 'chunking':
        return `🔄 テキスト分割中: ${totalChunks}個に分割`;
      case 'processing':
        return `🔄 LLM処理中: ${processedChunks}/${totalChunks}分割完了 ${timeStr} ${progressBar} ${percentage}%`;
      case 'merging':
        return `🔄 結果統合中: ${progressBar} ${percentage}%`;
      case 'completed':
        return `✅ 処理完了: ${totalChunks}分割処理済み`;
      case 'error':
        return `❌ 処理エラー: ${processedChunks}/${totalChunks}完了`;
      default:
        return `🔄 処理中: ${processedChunks}/${totalChunks}`;
    }
  };

  return (
    <div className="panel ai-execution-panel">
      <div className="panel-header">
        <h2>🤖 3. AI修正実行</h2>
      </div>
      <div className="panel-content">
        <div className="ai-execution-layout">
          <div className="ai-status-section">
            <div className="ai-status">
              <div className="ai-status-icon">
                <i className={isProcessing ? "fas fa-spinner fa-spin" : "fas fa-robot"}></i>
              </div>
              <div className="ai-status-text">
                <p className="progress-display">{getProgressString()}</p>
                {totalCharacters && totalCharacters > 0 && (
                  <p className="character-info">
                    📊 {totalCharacters.toLocaleString()}文字 
                    {chunkingProgress && chunkingProgress.totalChunks > 0 && 
                      ` → ${chunkingProgress.totalChunks}分割`
                    }
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={executeAI} 
              className="execute-btn enhanced"
              disabled={isProcessing || !hasInput || (apiKeysAvailable === false)}
              title={
                !hasInput 
                  ? "入力受付待ちです" 
                  : apiKeysAvailable === false 
                  ? "API設定が必要です（設定画面でAPIキーを入力してください）" 
                  : `${models.find(m => m.value === selectedModel)?.label || selectedModel}で処理を実行`
              }
            >
              {isProcessing ? (
                <div className="execute-btn-content">
                  <i className="fas fa-spinner fa-spin"></i>
                  <span className="btn-main-text">処理中</span>
                  <span className="btn-sub-text">{models.find(m => m.value === selectedModel)?.label}</span>
                </div>
              ) : (
                <div className="execute-btn-content">
                  <i className="fas fa-rocket"></i>
                  <span className="btn-main-text">AIに実行</span>
                  <span className="btn-sub-text">{models.find(m => m.value === selectedModel)?.label}</span>
                </div>
              )}
            </button>
          </div>
          
          <div className="model-selection-section">
            <div className="model-selector">
              <label className="model-label">使用モデル:</label>
              <div className="model-toggle">
                <select 
                  value={selectedModel} 
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="model-select"
                >
                  {models.map(model => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </select>
                <button 
                  className="model-info-btn"
                  onClick={() => setShowModelInfo(true)}
                  title="モデル詳細情報"
                >
                  <i className="fas fa-info-circle"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モデル情報ポップアップ */}
      {showModelInfo && (
        <div className="modal-overlay" onClick={() => setShowModelInfo(false)}>
          <div className="modal-content model-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-cog"></i> モデル詳細情報</h3>
              <button className="close-btn" onClick={() => setShowModelInfo(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="model-info-table">
                <table className="model-specs">
                  <thead>
                    <tr>
                      <th>モデル</th>
                      <th>API Key</th>
                      <th>特徴</th>
                      <th>使用可能</th>
                    </tr>
                  </thead>
                  <tbody>
                    {models.map(model => (
                      <tr key={model.value} className={selectedModel === model.value ? 'selected' : ''}>
                        <td>{model.label}</td>
                        <td>{model.provider}</td>
                        <td>{model.description}</td>
                        <td>
                          <span className={`status ${model.available ? 'available' : 'unavailable'}`}>
                            {model.available ? '使える' : '使えない'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(AIExecutionSection);