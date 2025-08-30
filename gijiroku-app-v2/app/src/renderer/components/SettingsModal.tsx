import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/api';
import { mockPromptTemplates } from '../../mocks/api';
import WorkspaceManager from './WorkspaceManager';
import './SettingsModal.css';
import './modal-close-style.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  promptText: string;
  onPromptChange: (text: string) => void;
  onPromptReset: () => void;
  onOpenDictionary: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  useCustomDictionary: boolean;
  onToggleCustomDictionary: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  promptText: _promptText,
  onPromptChange: _onPromptChange,
  onPromptReset: _onPromptReset,
  onOpenDictionary,
  isDarkMode,
  onToggleDarkMode,
  useCustomDictionary,
  onToggleCustomDictionary
}) => {
  const [activeTab, setActiveTab] = useState<'workspace' | 'api' | 'prompt' | 'dictionary' | 'appearance' | 'chunking'>('workspace');
  const [apiKeys, setApiKeys] = useState({
    gemini: '',
    openai: ''
  });
  
  // プロンプト管理用の状態
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedTemplateContent, setSelectedTemplateContent] = useState<any>(null);
  const [customTemplates, setCustomTemplates] = useState<any[]>([]);
  
  
  // APIキー検証用の状態
  const [isValidatingAPI, setIsValidatingAPI] = useState<{[key: string]: boolean}>({});
  const [validationResults, setValidationResults] = useState<{[key: string]: any}>({});
  
  // モデル選択用の状態
  const [availableModels, setAvailableModels] = useState<any>(null);
  const [selectedModels, setSelectedModels] = useState<{[key: string]: string}>({});

  // 分割設定用の状態
  const [chunkingSettings, setChunkingSettings] = useState({
    maxChunkSize: 300,      // テスト用デフォルト: 300文字
    overlapSize: 50,        // テスト用デフォルト: 50文字
    splitOnSentence: true,
    preserveSpeakers: true
  });

  // ローカルストレージからAPIキーとモデル設定を読み込み
  useEffect(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (savedKeys) {
      setApiKeys(JSON.parse(savedKeys));
    }
    
    const savedModels = localStorage.getItem('selectedModels');
    if (savedModels) {
      setSelectedModels(JSON.parse(savedModels));
      console.log('📦 Loaded saved models from localStorage:', JSON.parse(savedModels));
    }

    // 分割設定の読み込み
    const savedChunkingSettings = localStorage.getItem('chunkingSettings');
    if (savedChunkingSettings) {
      setChunkingSettings(JSON.parse(savedChunkingSettings));
    }
  }, [isOpen]);

  // テンプレート一覧を読み込み
  useEffect(() => {
    if (isOpen && activeTab === 'prompt') {
      loadTemplates();
      loadCustomTemplates();
    }
  }, [isOpen, activeTab]);

  // モデル一覧を読み込み
  useEffect(() => {
    if (isOpen && activeTab === 'api') {
      loadAvailableModels();
    }
  }, [isOpen, activeTab]);

  // 標準テンプレート読み込み（プロンプトセレクターと同じものを使用）
  const loadTemplates = async () => {
    try {
      // Electron環境: プロンプトセレクターと同じmockPromptTemplatesを使用
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        console.log('📄 Using same templates as PromptSelector');
        
        // mockPromptTemplatesをSettingsModal形式に変換
        const formattedTemplates = mockPromptTemplates.map(template => ({
          id: template.id,
          title: template.name,
          description: template.description,
          content: template.prompt,
          category: template.category,
          is_active: true,
          created_at: template.created_at,
          updated_at: template.updated_at
        }));
        
        setTemplates(formattedTemplates);
        console.log('✅ Templates loaded from mockPromptTemplates:', formattedTemplates.length);
        return;
      }

      // Web環境の場合はAPIを使用（フォールバック）
      const response = await fetch(API_ENDPOINTS.prompts);
      const data = await response.json();
      if (data.success && data.data && data.data.prompts) {
        setTemplates(data.data.prompts);
      } else {
        // フォールバック: mockPromptTemplatesを使用
        const formattedTemplates = mockPromptTemplates.map(template => ({
          id: template.id,
          title: template.name,
          description: template.description,
          content: template.prompt,
          category: template.category,
          is_active: true,
          created_at: template.created_at,
          updated_at: template.updated_at
        }));
        setTemplates(formattedTemplates);
      }
    } catch (error) {
      console.error('テンプレート読み込みエラー:', error);
      // エラー時もmockPromptTemplatesを使用
      const formattedTemplates = mockPromptTemplates.map(template => ({
        id: template.id,
        title: template.name,
        description: template.description,
        content: template.prompt,
        category: template.category,
        is_active: true,
        created_at: template.created_at,
        updated_at: template.updated_at
      }));
      setTemplates(formattedTemplates);
    }
  };

  // カスタムテンプレート読み込み（SQLiteから）
  const loadCustomTemplates = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const electronAPI = (window as any).electronAPI;
        // SQLiteからプロンプトテンプレートを取得
        const response = await electronAPI.db.query({
          sql: 'SELECT * FROM prompt_templates WHERE is_active = 1 ORDER BY name',
          params: []
        });
        
        if (response.success) {
          const customTemplates = response.data.map((row: any) => ({
            id: `custom_${row.id}`,
            name: row.name,
            description: row.purpose || 'カスタムプロンプト',
            prompt: JSON.parse(row.template_json).content || row.template_json,
            version: row.version,
            created_at: row.created_at
          }));
          setCustomTemplates(customTemplates);
          console.log('SQLiteからカスタムテンプレートを読み込みました:', customTemplates);
        }
      } else {
        // Web環境でのフォールバック
        const response = await fetch(API_ENDPOINTS.customTemplates);
        const data = await response.json();
        setCustomTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('カスタムテンプレート読み込みエラー:', error);
      setCustomTemplates([]);
    }
  };

  // 利用可能なモデル一覧を読み込み
  const loadAvailableModels = async () => {
    try {
      // Electron環境: JSONファイルから読み込み
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        console.log('📄 Loading models from JSON config file');
        try {
          // models.jsonファイルを読み込み
          const configPath = '/models.json';
          const response = await fetch(configPath);
          const modelsConfig = await response.json();
          
          console.log('✅ Models loaded from JSON:', modelsConfig);
          setAvailableModels(modelsConfig);
          setSelectedModels({
            openai: modelsConfig.openai.default,
            gemini: modelsConfig.gemini.default
          });
          return;
        } catch (fileError) {
          console.warn('📄 Failed to load models.json, using fallback data:', fileError);
          // JSONファイル読み込み失敗時のフォールバック
          const fallbackData = {
            openai: { models: ['gpt-5'], default: 'gpt-5' },
            gemini: { models: ['gemini-2.5-pro', 'gemini-2.0-flash'], default: 'gemini-2.5-pro' }
          };
          setAvailableModels(fallbackData);
          setSelectedModels({
            openai: fallbackData.openai.default,
            gemini: fallbackData.gemini.default
          });
          return;
        }
      }

      // Web環境: APIから取得
      const response = await fetch(API_ENDPOINTS.apiKeyModels);
      const data = await response.json();
      setAvailableModels(data);
      
      // デフォルトモデルを設定
      setSelectedModels({
        openai: data.openai?.default || 'gpt-5',
        gemini: data.gemini?.default || 'gemini-2.5-pro'
      });
    } catch (error) {
      console.error('モデル一覧読み込みエラー:', error);
      
      // エラー時のフォールバック
      const fallbackData = {
        openai: { models: ['gpt-5'], default: 'gpt-5' },
        gemini: { models: ['gemini-2.5-pro', 'gemini-2.0-flash'], default: 'gemini-2.5-pro' }
      };
      setAvailableModels(fallbackData);
      setSelectedModels({
        openai: fallbackData.openai.default,
        gemini: fallbackData.gemini.default
      });
    }
  };

  // テンプレート選択処理
  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    // 標準テンプレートから検索
    const standardTemplate = templates.find(t => t.id === templateKey);
    if (standardTemplate) {
      setSelectedTemplateContent({
        name: standardTemplate.title,
        description: standardTemplate.description,
        prompt: standardTemplate.content
      });
    } else {
      // カスタムテンプレートの場合
      const customTemplate = customTemplates.find(t => t.id === templateKey);
      if (customTemplate) {
        setSelectedTemplateContent({
          name: customTemplate.name,
          description: customTemplate.description,
          prompt: customTemplate.prompt
        });
      }
    }
  };

  // プロンプト使用処理
  const handleUseTemplate = (promptContent: string) => {
    // 親コンポーネントのプロンプト変更ハンドラを呼び出す
    _onPromptChange(promptContent);
    // 成功メッセージを表示
    alert('プロンプトテンプレートが適用されました！');
    onClose();
  };

  // カスタムテンプレート削除処理
  const handleDeleteCustomTemplate = async (templateId: string) => {
    if (!confirm('このカスタムテンプレートを削除してもよろしいですか？')) {
      return;
    }
    
    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const electronAPI = (window as any).electronAPI;
        const numericId = templateId.replace('custom_', '');
        
        const response = await electronAPI.db.query({
          sql: 'UPDATE prompt_templates SET is_active = 0 WHERE id = ?',
          params: [numericId]
        });
        
        if (response.success) {
          // リストを再読み込み
          loadCustomTemplates();
          setSelectedTemplate('');
          setSelectedTemplateContent(null);
          alert('カスタムテンプレートを削除しました。');
        } else {
          alert('削除に失敗しました: ' + response.error);
        }
      }
    } catch (error) {
      console.error('カスタムテンプレート削除エラー:', error);
      alert('削除中にエラーが発生しました。');
    }
  };

  // APIキーとモデル設定の保存
  const saveApiKeys = () => {
    localStorage.setItem('apiKeys', JSON.stringify(apiKeys));
    localStorage.setItem('selectedModels', JSON.stringify(selectedModels));
    console.log('💾 Saving API keys and models:', { apiKeys, selectedModels });
    
    // カスタムイベントを発行してメイン画面に変更を通知
    const customEvent = new CustomEvent('modelSettingsChanged', { 
      detail: selectedModels 
    });
    window.dispatchEvent(customEvent);
    console.log('🔔 Dispatched modelSettingsChanged event:', selectedModels);
    
    alert('APIキーとモデル設定を保存しました');
  };

  // プロンプトエクスポート（全テンプレート）
  const exportAllPrompts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.promptsExportAll);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data.prompts, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `プロンプトテンプレート_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('プロンプトテンプレートをエクスポートしました');
    } catch (error) {
      console.error('エクスポートエラー:', error);
      alert('エクスポートに失敗しました');
    }
  };

  // プロンプトインポート
  const importPrompts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const jsonData = e.target?.result as string;
        const parsedData = JSON.parse(jsonData);
        
        // カスタムテンプレートとしてデータベースに保存
        for (const [key, template] of Object.entries(parsedData as any)) {
          const templateData = template as any;
          const response = await fetch(API_ENDPOINTS.customTemplates, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: templateData.name || key,
              description: templateData.description || '',
              prompt: templateData.prompt || '',
              user_id: null,
              is_public: true
            })
          });
          
          if (!response.ok) {
            console.error(`テンプレート ${key} の保存に失敗:`, await response.text());
          }
        }
        
        alert('プロンプトテンプレートをデータベースに保存しました');
        // テンプレート一覧を再読み込み
        loadCustomTemplates();
      } catch (error) {
        console.error('インポートエラー:', error);
        alert('ファイルの読み込みまたは保存に失敗しました');
      }
    };
    reader.readAsText(file);
    
    // ファイル入力をリセット
    event.target.value = '';
  };


  // 分割設定の保存ハンドラー
  const handleSaveChunkingSettings = () => {
    localStorage.setItem('chunkingSettings', JSON.stringify(chunkingSettings));
    alert('分割設定を保存しました');
  };

  // APIキー検証処理
  const validateApiKey = async (provider: 'openai' | 'gemini') => {
    const apiKey = provider === 'openai' ? apiKeys.openai : apiKeys.gemini;
    const selectedModel = selectedModels[provider];
    
    if (!apiKey || apiKey.trim() === '') {
      alert(`${provider === 'openai' ? 'OpenAI' : 'Gemini'} APIキーが入力されていません`);
      return;
    }

    setIsValidatingAPI({ ...isValidatingAPI, [provider]: true });
    
    try {
      // Electron環境: モック検証
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        console.log('🎭 Using mock API key validation (Electron)');
        
        // シンプルな形式チェック
        const isValidFormat = apiKey.length > 10 && 
          (provider === 'openai' ? apiKey.startsWith('sk-') : apiKey.startsWith('AI'));
        
        const mockResult = {
          isValid: isValidFormat,
          message: isValidFormat ? 'APIキーの形式は有効です（モック検証）' : 'APIキーの形式が無効です'
        };
        
        setValidationResults({ 
          ...validationResults, 
          [provider]: mockResult 
        });
        
        if (mockResult.isValid) {
          alert(`✓ ${provider === 'openai' ? 'OpenAI' : 'Gemini'} ${mockResult.message}`);
        } else {
          alert(`✗ ${mockResult.message}`);
        }
        return;
      }

      // Web環境: 実際のAPI検証
      const response = await axios.post(API_ENDPOINTS.apiKeyValidation, {
        provider,
        apiKey,
        model: selectedModel
      });
      
      setValidationResults({ 
        ...validationResults, 
        [provider]: response.data 
      });
      
      if (response.data.isValid) {
        alert(`✓ ${provider === 'openai' ? 'OpenAI' : 'Gemini'} APIキーは有効です`);
      } else {
        alert(`✗ ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('API key validation error:', error);
      const errorMessage = error.response?.data?.message || 'APIキーの検証中にエラーが発生しました';
      alert(`✗ ${errorMessage}`);
      setValidationResults({ 
        ...validationResults, 
        [provider]: { isValid: false, message: errorMessage } 
      });
    } finally {
      setIsValidatingAPI({ ...isValidatingAPI, [provider]: false });
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      tabIndex={-1}
      role="dialog" 
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div className="settings-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 id="settings-modal-title"><i className="fas fa-cog"></i> 設定</h2>
          <button 
            className="modal-close" 
            onClick={onClose}
            aria-label="設定画面を閉じる"
            title="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="settings-tabs">
          <button 
            className={`tab-btn ${activeTab === 'workspace' ? 'active' : ''}`}
            onClick={() => setActiveTab('workspace')}
          >
            <i className="fas fa-folder"></i> ワークスペース
          </button>
          <button 
            className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            <i className="fas fa-key"></i> APIキー
          </button>
          <button 
            className={`tab-btn ${activeTab === 'prompt' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompt')}
          >
            <i className="fas fa-file-alt"></i> プロンプト
          </button>
          <button 
            className={`tab-btn ${activeTab === 'dictionary' ? 'active' : ''}`}
            onClick={() => setActiveTab('dictionary')}
          >
            <i className="fas fa-book"></i> カスタム辞書
          </button>
          <button 
            className={`tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <i className="fas fa-palette"></i> 外観
          </button>
          <button 
            className={`tab-btn ${activeTab === 'chunking' ? 'active' : ''}`}
            onClick={() => setActiveTab('chunking')}
          >
            <i className="fas fa-cut"></i> 分割設定
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'workspace' && (
            <div className="workspace-settings">
              <WorkspaceManager isOpen={true} onClose={null} />
            </div>
          )}

          {activeTab === 'api' && (
            <div className="api-settings">
              
              <h3>AI API設定</h3>
              
              <div className="api-form">
                <div className="form-group">
                  <label>Google Gemini API Key</label>
                  <div className="api-key-input-group">
                    <input
                      type="password"
                      value={apiKeys.gemini}
                      onChange={(e) => setApiKeys({...apiKeys, gemini: e.target.value})}
                      placeholder="AIza..."
                    />
                    <select
                      value={selectedModels.gemini || 'gemini-2.0-flash'}
                      onChange={(e) => setSelectedModels({...selectedModels, gemini: e.target.value})}
                      className="model-selector"
                      disabled={!availableModels?.gemini}
                    >
                      {availableModels?.gemini?.models && Object.entries(availableModels.gemini.models).map(([key, name]) => (
                        <option key={key} value={key}>
                          {name as string}
                        </option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      className="validate-btn"
                      onClick={() => validateApiKey('gemini')}
                      disabled={isValidatingAPI.gemini || !apiKeys.gemini}
                    >
                      {isValidatingAPI.gemini ? (
                        <><i className="fas fa-spinner fa-spin"></i> 検証中...</>
                      ) : (
                        <><i className="fas fa-check-circle"></i> テスト</>
                      )}
                    </button>
                  </div>
                  {validationResults.gemini && (
                    <div className={`validation-result ${validationResults.gemini.isValid ? 'success' : 'error'}`}>
                      <i className={`fas ${validationResults.gemini.isValid ? 'fa-check' : 'fa-times'}`}></i>
                      {validationResults.gemini.message}
                      {validationResults.gemini.modelName && (
                        <span className="model-info"> ({validationResults.gemini.modelName})</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label>OpenAI API Key（オプション）</label>
                  <div className="api-key-input-group">
                    <input
                      type="password"
                      value={apiKeys.openai}
                      onChange={(e) => setApiKeys({...apiKeys, openai: e.target.value})}
                      placeholder="sk-..."
                    />
                    <select
                      value={selectedModels.openai || 'gpt-5-mini'}
                      onChange={(e) => setSelectedModels({...selectedModels, openai: e.target.value})}
                      className="model-selector"
                      disabled={!availableModels?.openai}
                    >
                      {availableModels?.openai?.models && Object.entries(availableModels.openai.models).map(([key, name]) => (
                        <option key={key} value={key}>
                          {name as string}
                        </option>
                      ))}
                    </select>
                    <button 
                      type="button"
                      className="validate-btn"
                      onClick={() => validateApiKey('openai')}
                      disabled={isValidatingAPI.openai || !apiKeys.openai}
                    >
                      {isValidatingAPI.openai ? (
                        <><i className="fas fa-spinner fa-spin"></i> 検証中...</>
                      ) : (
                        <><i className="fas fa-check-circle"></i> テスト</>
                      )}
                    </button>
                  </div>
                  {validationResults.openai && (
                    <div className={`validation-result ${validationResults.openai.isValid ? 'success' : 'error'}`}>
                      <i className={`fas ${validationResults.openai.isValid ? 'fa-check' : 'fa-times'}`}></i>
                      {validationResults.openai.message}
                      {validationResults.openai.modelName && (
                        <span className="model-info"> ({validationResults.openai.modelName})</span>
                      )}
                    </div>
                  )}
                </div>
                
                
                <button className="save-btn" onClick={saveApiKeys}>
                  <i className="fas fa-save"></i> APIキーを保存
                </button>
              </div>
            </div>
          )}

          {activeTab === 'prompt' && (
            <div className="prompt-settings">
              <h3>プロンプトテンプレート管理</h3>
              <p className="settings-description">
                利用可能なテンプレートを確認し、カスタムテンプレートをデータベースに保存できます。
              </p>
              
              <div className="prompt-controls">
                <button onClick={exportAllPrompts} className="control-btn export">
                  <i className="fas fa-download"></i> 全テンプレートをエクスポート
                </button>
                <label className="control-btn import">
                  <i className="fas fa-upload"></i> テンプレートをインポート（DB保存）
                  <input 
                    type="file" 
                    accept=".json"
                    onChange={importPrompts}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <div className="template-browser">
                <div className="template-list">
                  <h4>利用可能なテンプレート</h4>
                  
                  {/* 標準テンプレート */}
                  <div className="template-category">
                    <h5>標準テンプレート（JSONファイル）</h5>
                    {templates.map((template) => (
                      <div 
                        key={template.id} 
                        className={`template-item ${selectedTemplate === template.id ? 'selected' : ''}`}
                        onClick={() => handleTemplateSelect(template.id)}
                      >
                        <div className="template-name">📄 {template.title}</div>
                        <div className="template-desc">{template.description}</div>
                        <div className="template-category-badge">{template.category}</div>
                      </div>
                    ))}
                  </div>

                  {/* カスタムテンプレート */}
                  {customTemplates.length > 0 && (
                    <div className="template-category">
                      <h5>カスタムテンプレート（データベース保存済み）</h5>
                      {customTemplates.map((template) => (
                        <div 
                          key={template.id} 
                          className={`template-item custom ${selectedTemplate === template.id ? 'selected' : ''}`}
                          onClick={() => handleTemplateSelect(template.id)}
                        >
                          <div className="template-name">
                            <i className="fas fa-database"></i> {template.name}
                          </div>
                          <div className="template-desc">{template.description}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* テンプレート詳細表示 */}
                {selectedTemplateContent && (
                  <div className="template-detail">
                    <h4>テンプレート詳細</h4>
                    <div className="detail-content">
                      <div className="detail-item">
                        <label>名前:</label>
                        <div>{selectedTemplateContent.name}</div>
                      </div>
                      <div className="detail-item">
                        <label>説明:</label>
                        <div>{selectedTemplateContent.description}</div>
                      </div>
                      <div className="detail-item">
                        <label>プロンプト内容:</label>
                        <div className="prompt-content">
                          {selectedTemplateContent.prompt}
                        </div>
                      </div>
                      
                      <div className="template-actions">
                        <button 
                          className="use-template-btn"
                          onClick={() => handleUseTemplate(selectedTemplateContent.prompt)}
                        >
                          <i className="fas fa-check"></i> このプロンプトを使用
                        </button>
                        {selectedTemplate.startsWith('custom_') && (
                          <button 
                            className="delete-template-btn"
                            onClick={() => handleDeleteCustomTemplate(selectedTemplate)}
                          >
                            <i className="fas fa-trash"></i> カスタムテンプレートを削除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dictionary' && (
            <div className="dictionary-settings">
              <h3>カスタム辞書</h3>
              <p className="settings-description">
                音声認識の誤字や専門用語の修正ルールを登録できます。
              </p>
              
              <div className="dictionary-controls">
                <div className="setting-item">
                  <div className="setting-label">
                    <i className="fas fa-toggle-on"></i>
                    <span>カスタム辞書機能</span>
                  </div>
                  <div className="setting-description">
                    カスタム辞書による自動修正を有効にします
                  </div>
                  <div className="toggle-switch">
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={useCustomDictionary}
                        onChange={onToggleCustomDictionary}
                      />
                      <span className="slider round"></span>
                    </label>
                    <span className="toggle-label">
                      {useCustomDictionary ? 'オン' : 'オフ'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="dictionary-info">
                <div className="info-card">
                  <i className="fas fa-info-circle"></i>
                  <p>
                    カスタム辞書は、AIによる修正処理の前に適用されます。
                    よく出現する誤字や専門用語を事前に登録しておくことで、
                    より正確な議事録を作成できます。
                  </p>
                </div>
                
                <button 
                  className="open-dictionary-btn"
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      onOpenDictionary();
                    }, 300);
                  }}
                >
                  <i className="fas fa-book"></i> カスタム辞書を開く
                </button>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="appearance-settings">
              <h3>外観設定</h3>
              <p className="settings-description">
                アプリケーションの外観やテーマを設定できます。
              </p>
              
              <div className="appearance-controls">
                <div className="setting-item">
                  <div className="setting-label">
                    <i className={isDarkMode ? "fas fa-moon" : "fas fa-sun"}></i>
                    <span>ダークモード</span>
                  </div>
                  <div className="setting-description">
                    目に優しいダークテーマに切り替えます
                  </div>
                  <div className="toggle-switch">
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={isDarkMode}
                        onChange={onToggleDarkMode}
                      />
                      <span className="slider round"></span>
                    </label>
                    <span className="toggle-label">
                      {isDarkMode ? 'オン' : 'オフ'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}


          {activeTab === 'chunking' && (
            <div className="chunking-settings">
              <h3>分割設定</h3>
              <p className="settings-description">
                <i className="fas fa-info-circle"></i>
                LLMの「lost in the middle」問題を防ぐため、長いテキストを分割して処理します。
              </p>
              
              <div className="chunking-controls">
                <div className="setting-item">
                  <div className="setting-label">
                    <i className="fas fa-ruler"></i>
                    <span>分割サイズ（文字数）</span>
                  </div>
                  <div className="setting-control">
                    <input
                      type="number"
                      value={chunkingSettings.maxChunkSize}
                      onChange={(e) => setChunkingSettings(prev => ({
                        ...prev,
                        maxChunkSize: parseInt(e.target.value) || 300
                      }))}
                      min="100"
                      max="10000"
                      step="50"
                      className="number-input"
                    />
                    <span className="input-suffix">文字</span>
                  </div>
                  <div className="setting-description">
                    テキストを分割する基本サイズです。テスト用: 300文字推奨
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <i className="fas fa-overlap"></i>
                    <span>オーバーラップサイズ（文字数）</span>
                  </div>
                  <div className="setting-control">
                    <input
                      type="number"
                      value={chunkingSettings.overlapSize}
                      onChange={(e) => setChunkingSettings(prev => ({
                        ...prev,
                        overlapSize: parseInt(e.target.value) || 50
                      }))}
                      min="0"
                      max="500"
                      step="10"
                      className="number-input"
                    />
                    <span className="input-suffix">文字</span>
                  </div>
                  <div className="setting-description">
                    分割境界での内容欠落を防ぐ重複部分のサイズです。テスト用: 50文字推奨
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <i className="fas fa-paragraph"></i>
                    <span>文単位分割</span>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={chunkingSettings.splitOnSentence}
                        onChange={(e) => setChunkingSettings(prev => ({
                          ...prev,
                          splitOnSentence: e.target.checked
                        }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="setting-description">
                    文の区切りで分割位置を調整します（推奨: ON）
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-label">
                    <i className="fas fa-user-friends"></i>
                    <span>話者情報保持</span>
                  </div>
                  <div className="setting-control">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={chunkingSettings.preserveSpeakers}
                        onChange={(e) => setChunkingSettings(prev => ({
                          ...prev,
                          preserveSpeakers: e.target.checked
                        }))}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="setting-description">
                    VTTファイルの話者情報を保持します（推奨: ON）
                  </div>
                </div>

                <div className="setting-preview">
                  <h4>設定プレビュー</h4>
                  <div className="preview-info">
                    <div className="preview-item">
                      <span className="label">1000文字のテキストの場合:</span>
                      <span className="value">
                        約{Math.ceil(1000 / (chunkingSettings.maxChunkSize - chunkingSettings.overlapSize))}個に分割
                      </span>
                    </div>
                    <div className="preview-item">
                      <span className="label">実効分割サイズ:</span>
                      <span className="value">
                        {chunkingSettings.maxChunkSize - chunkingSettings.overlapSize}文字（重複除く）
                      </span>
                    </div>
                  </div>
                </div>

                <button className="save-btn chunking" onClick={handleSaveChunkingSettings}>
                  <i className="fas fa-save"></i> 分割設定を保存
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;