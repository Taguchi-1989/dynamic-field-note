import React, { useState, useEffect, useRef, useCallback } from 'react';
import API_ENDPOINTS from '../config/api';
import { mockFetch, isMockMode, mockPromptTemplates } from '../../mocks/api';
import './PromptSelector.css';

// Simple cache for prompt templates to avoid multiple requests
let promptCache: { templates: PromptTemplate[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface PromptTemplate {
  id: string;
  title: string;
  content: string;
  description?: string;
  category: string;
  is_active: boolean;
}

interface PromptSelectorProps {
  onPromptSelect: (template: string, customPrompt?: string) => void;
  selectedTemplate: string;
}

const PromptSelector: React.FC<PromptSelectorProps> = ({ onPromptSelect, selectedTemplate }) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState(selectedTemplate || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [tempEditedPrompt, setTempEditedPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // 初回表示の不安定さを避けるため、プレビューはローカル状態で管理
  const [previewContent, setPreviewContent] = useState('');
  const [_previewReady, setPreviewReady] = useState(false);

  const fetchTemplates = useCallback(async () => {
    // Check cache first
    if (promptCache && Date.now() - promptCache.timestamp < CACHE_DURATION) {
      console.log('📦 Using cached prompt templates');
      setTemplates(promptCache.templates);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('🔄 プロンプトテンプレートを読み込み中...', { endpoint: API_ENDPOINTS.prompts, mockMode: isMockMode() });
      
      // モックモード時の処理
      if (isMockMode()) {
        console.log('🎭 Mock mode enabled, using mock data');
        const mockTemplatesFormatted = mockPromptTemplates.map(template => ({
          id: template.id,
          title: template.name,
          content: template.prompt,
          description: template.description,
          category: template.category,
          is_active: true
        }));
        
        setTemplates(mockTemplatesFormatted);
        const selId = selectedTemplate || (mockTemplatesFormatted[0] ? mockTemplatesFormatted[0].id : '');
        const sel = mockTemplatesFormatted.find(t => t.id === selId) || mockTemplatesFormatted[0];
        if (sel) {
          setCurrentTemplate(sel.id);
          setPreviewContent(sel.content || '');
          console.log('🎯 Mock Template Selected:', { id: sel.id, title: sel.title });
          window.setTimeout(() => onPromptSelect(sel.id, sel.content), 100);
        }
        setIsLoading(false);
        return;
      }
      
      let response = await fetch(API_ENDPOINTS.prompts);
      console.log('📡 API Response:', { status: response.status, statusText: response.statusText, ok: response.ok, url: response.url });
      if (!response.ok) {
        console.warn('🔄 バックエンドAPI失敗、フォールバック実行...', { fallbackEndpoint: API_ENDPOINTS.promptsFallback });
        try {
          response = await fetch(API_ENDPOINTS.promptsFallback);
          console.log('📡 Fallback API Response:', { status: response.status, statusText: response.statusText, ok: response.ok, url: response.url });
        } catch (fallbackError) {
          console.error('❌ フォールバックAPI失敗:', fallbackError);
          const errorText = await response.text();
          throw new Error(`Both main and fallback prompts APIs failed: ${response.status} - ${errorText}`);
        }
      }
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`Prompts fetch failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json() as { success: boolean; data: { prompts: PromptTemplate[] } };
      console.log('📄 Raw API Result:', result);
      if (!result.success) {
        console.error('❌ API returned success=false:', result);
        throw new Error('Prompts not successful');
      }
      const normalized = normalizeTemplates(result);
      console.log('✅ Normalized Templates:', normalized);
      
      // Cache the templates
      promptCache = {
        templates: normalized,
        timestamp: Date.now()
      };
      
      setTemplates(normalized);
      const selId = selectedTemplate || (normalized[0] ? normalized[0].id : '');
      const sel = normalized.find(t => t.id === selId) || normalized[0];
      if (sel) {
        setCurrentTemplate(sel.id);
        setPreviewContent(sel.content || '');
        console.log('🎯 Initial Template Selected:', { id: sel.id, title: sel.title });
        window.setTimeout(() => onPromptSelect(sel.id, sel.content), 100);
      }
      setIsLoading(false);
      console.log('✅ テンプレート読み込み完了:', { count: normalized.length });
    } catch (error) {
      console.error('❌ テンプレート取得エラー:', error);
      console.error('エラーの詳細:', { name: error instanceof Error ? error.name : 'Unknown', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : 'No stack' });
      setTemplates([]);
      setIsLoading(false);
      alert(`プロンプトテンプレートの読み込みに失敗しました: ${error}`);
    }
  }, [onPromptSelect, selectedTemplate]);

  useEffect(() => {
    console.log('🚀 PromptSelector初期化 - API設定:', {
      API_BASE: (import.meta as any).env?.VITE_API_BASE,
      promptsEndpoint: API_ENDPOINTS.prompts,
    });
    fetchTemplates();
  }, []); // 依存配列を空にして初回のみ実行

  // 親からの選択テンプレート変更をローカル状態に同期
  useEffect(() => {
    if (selectedTemplate) {
      setCurrentTemplate(selectedTemplate);
      const t = templates.find(t => t.id === selectedTemplate);
      if (t) {
        setTempEditedPrompt('');
      }
    }
  }, [selectedTemplate, templates]);

  // 初期表示時に一度だけ、選択テンプレートの内容を親へ反映しておく
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    if (templates.length === 0 || isLoading) return;

    const selId = selectedTemplate || currentTemplate || templates[0].id;
    const tpl = templates.find(t => t.id === selId) || templates[0];
    if (selId !== currentTemplate) {
      setCurrentTemplate(selId);
    }
    onPromptSelect(selId, tpl.content);
    setPreviewReady(true);
    initializedRef.current = true;
  }, [templates, isLoading, selectedTemplate, currentTemplate, onPromptSelect]);

  // 統一されたBackend形式のみを処理
  const normalizeTemplates = (response: { success: boolean; data: { prompts: PromptTemplate[] } }): PromptTemplate[] => {
    if (response.success && response.data && Array.isArray(response.data.prompts)) {
      return response.data.prompts;
    }
    throw new Error('Invalid API response format');
  };


  const handleTemplateChange = (templateKey: string) => {
    setCurrentTemplate(templateKey);
    const selectedTemplate = templates.find(t => t.id === templateKey);
    
    if (templateKey === 'custom') {
      setShowEditor(true);
      setEditingPrompt(customPrompt || '');
    } else if (selectedTemplate) {
      setShowEditor(false);
      onPromptSelect(templateKey, selectedTemplate.content);
    }
  };

  const handleEditTemplate = () => {
    const selectedTemplate = templates.find(t => t.id === currentTemplate);
    if (selectedTemplate) {
      setEditingPrompt(selectedTemplate.content);
      setTempEditedPrompt(selectedTemplate.content);
      setShowEditor(true);
    }
  };

  const handleTempEdit = (value: string) => {
    setEditingPrompt(value);
    setTempEditedPrompt(value);
    // 一時編集内容を即座に適用（プレビューはローカルで更新）
    setPreviewContent(value);
    onPromptSelect(currentTemplate, value);
  };

  const handleSavePrompt = async () => {
    if (currentTemplate === 'custom') {
      setCustomPrompt(editingPrompt);
      onPromptSelect('custom', editingPrompt);
    } else {
      // 既存テンプレートの更新（DB保存）
      try {
        const response = await fetch(`${API_ENDPOINTS.prompts}/${currentTemplate}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: editingPrompt
          })
        });
        if (response.ok) {
          await fetchTemplates();
          onPromptSelect(currentTemplate, editingPrompt);
          alert('プロンプトがデータベースに保存されました');
        } else {
          alert('プロンプトの保存に失敗しました');
        }
      } catch (error) {
        console.error('プロンプト更新エラー:', error);
        alert('プロンプトの保存に失敗しました');
      }
    }
    setShowEditor(false);
  };

  const handleCancelEdit = () => {
    // 編集をキャンセルして元のプロンプトに戻す
    const selectedTemplate = templates.find(t => t.id === currentTemplate);
    if (selectedTemplate) {
      setPreviewContent(selectedTemplate.content || '');
      onPromptSelect(currentTemplate, selectedTemplate.content);
    }
    setShowEditor(false);
  };


  // 初回のプレビューを安定して表示するために100ms遅延して適用
  const delayedInitRef = useRef(false);
  useEffect(() => {
    if (delayedInitRef.current) return;
    if (isLoading || templates.length === 0) return;
    const selId = currentTemplate || selectedTemplate || templates[0].id;
    const tpl = templates.find(t => t.id === selId) || templates[0];
    const timer = window.setTimeout(() => {
      onPromptSelect(selId, tpl.content);
      setPreviewReady(true);
      delayedInitRef.current = true;
    }, 100);
    return () => window.clearTimeout(timer);
  }, [isLoading, templates, currentTemplate, selectedTemplate, onPromptSelect]);

  // ローディング中でも枠とスケルトンを出したいので、早期returnはしない

  return (
    <div className="prompt-selector">
      <div className="prompt-controls">
        <div className="template-selector">
          <select value={currentTemplate} onChange={(e) => handleTemplateChange(e.target.value)}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title} - {template.description || template.category}
              </option>
            ))}
            <option value="custom">カスタムプロンプト</option>
          </select>
        </div>
        
        <div className="template-actions">
          <button 
            onClick={handleEditTemplate}
            className="edit-btn"
            disabled={!currentTemplate}
            title="プロンプトを編集"
          >
            📝 編集
          </button>
        </div>
      </div>

      {showEditor && (
        <div className="prompt-editor-full">
          <div className="editor-header">
            <h4>📝 プロンプト編集 - 一時編集中</h4>
            <div className="editor-info">
              <small>※編集内容は即座にプレビューに反映されます。「保存」をクリックするとデータベースに保存されます。</small>
            </div>
          </div>
          <textarea
            value={editingPrompt}
            onChange={(e) => handleTempEdit(e.target.value)}
            className="prompt-textarea-full"
            rows={10}
            placeholder="プロンプトを入力してください..."
          />
          <div className="editor-actions-full">
            <button 
              onClick={handleSavePrompt}
              className="save-btn-full"
              title="データベースに永続保存します"
            >
              💾 データベースに保存
            </button>
            <button 
              onClick={handleCancelEdit}
              className="cancel-btn-full"
              title="編集をキャンセルして元に戻します"
            >
              ❌ キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 初期表示で currentTemplate が未設定の際も概要を出す */}
      {!showEditor && !currentTemplate && (() => {
        const first = templates && templates.length > 0 ? templates[0] : undefined;
        const showSkeleton = isLoading && !first;
        const placeholder = 'テンプレートの内容が未設定です。';
        const preview = (first?.content || previewContent || '').trim();
        return (
          <div className="template-preview-compact" aria-live="polite">
            <div className="preview-header">
              <h4>📄 現在のテンプレート（概要）</h4>
            </div>
            <div className="prompt-preview-compact" role="region" aria-label="テンプレート概要のプレビュー">
              {showSkeleton ? (
                <div className="skeleton-lines" aria-busy="true" aria-label="読み込み中">
                  <div className="skeleton-line w90" />
                  <div className="skeleton-line w80" />
                  <div className="skeleton-line w60" />
                  <div className="skeleton-line thin w80" />
                  <div className="skeleton-line thin w40" />
                </div>
              ) : (
                <pre>{preview || placeholder}</pre>
              )}
            </div>
          </div>
        );
      })()}

      {currentTemplate && !showEditor && (() => {
        const selectedTemplate = templates.find(t => t.id === currentTemplate);
        const displayContent = (tempEditedPrompt || previewContent || selectedTemplate?.content || '').trim();
        const isEdited = tempEditedPrompt && tempEditedPrompt !== selectedTemplate?.content;
        const showSkeleton = isLoading && !displayContent;

        return (
          <div className="template-preview-compact" aria-live="polite">
            <div className="preview-header">
              <h4>📄 現在のテンプレート（概要）</h4>
              {isEdited && (
                <span className="edit-status">⚠️ 一時編集中（未保存）</span>
              )}
            </div>
            <div className="prompt-preview-compact" role="region" aria-label="テンプレート概要のプレビュー">
              {showSkeleton ? (
                <div className="skeleton-lines" aria-busy="true" aria-label="読み込み中">
                  <div className="skeleton-line w90" />
                  <div className="skeleton-line w80" />
                  <div className="skeleton-line w60" />
                  <div className="skeleton-line thin w80" />
                  <div className="skeleton-line thin w40" />
                </div>
              ) : (
                <pre>{displayContent}</pre>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default PromptSelector;
