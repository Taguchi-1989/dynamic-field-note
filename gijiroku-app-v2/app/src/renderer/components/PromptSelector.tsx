import React, { useState, useEffect, useRef, useCallback } from 'react';
import { mockPromptTemplates } from '../../mocks/api';
import PromptDetailModal from './PromptDetailModal';
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
  const [isLoading, setIsLoading] = useState(true);
  // モーダル状態管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTemplateForModal, setCurrentTemplateForModal] = useState<PromptTemplate | null>(null);

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
      
      // まずローカルIPCからプロンプトを読み込み試行（新templates API優先）
      console.log('🔄 Attempting to load prompts from templates API...');
      try {
        // 新templates APIを優先的に使用 (CODEX_REVIEW.md準拠)
        let ipcResult = null;
        let fetchedTemplates = [];
        
        if (window.electronAPI?.templates?.list) {
          console.log('🔌 Using new templates API (DB-based)');
          ipcResult = await window.electronAPI.templates.list();
          if (ipcResult?.success && Array.isArray(ipcResult.data)) {
            // 新API形式: dataが直接配列
            fetchedTemplates = ipcResult.data;
          }
        } else if (window.electronAPI?.file?.loadPrompts) {
          console.log('⚠️ Falling back to legacy file:loadPrompts API');
          ipcResult = await window.electronAPI.file.loadPrompts();
          if (ipcResult?.success && ipcResult.data?.prompts) {
            // 旧API形式: data.promptsに配列
            fetchedTemplates = ipcResult.data.prompts;
          }
        }
        
        console.log('📡 IPC Result:', ipcResult);
        
        if (fetchedTemplates.length > 0) {
          console.log('✅ Successfully loaded prompts via IPC');
          console.log('📋 Template loaded:', { count: fetchedTemplates.length, templates: fetchedTemplates.map(t => ({ id: t.id, title: t.title })) });

          // Update cache
          promptCache = {
            templates: fetchedTemplates,
            timestamp: Date.now()
          };

          setTemplates(fetchedTemplates);

          // Select initial template
          const selId = selectedTemplate || (fetchedTemplates[0] ? fetchedTemplates[0].id : '');
          const sel = fetchedTemplates.find(t => t.id === selId) || fetchedTemplates[0];
          if (sel) {
            setCurrentTemplate(sel.id);
            setCurrentTemplateForModal(sel);
            console.log('🎯 Template Selected (IPC):', { id: sel.id, title: sel.title });
            window.setTimeout(() => onPromptSelect(sel.id, sel.content), 100);
          }
          setIsLoading(false);
          return;
        }
      } catch (ipcError) {
        console.warn('⚠️ IPC prompts loading failed, falling back to mock data:', ipcError);
        
        // IPCが失敗した場合は必ずモックデータを使用（外部API呼び出しを削除）
        console.log('🎭 Using mock data as fallback');
        const mockTemplatesFormatted = mockPromptTemplates.map(template => ({
          id: template.id,
          title: template.name,
          content: template.prompt,
          description: template.description,
          category: template.category,
          is_active: true
        }));
        
        // Cache the templates
        promptCache = {
          templates: mockTemplatesFormatted,
          timestamp: Date.now()
        };
        
        setTemplates(mockTemplatesFormatted);
        const selId = selectedTemplate || (mockTemplatesFormatted[0] ? mockTemplatesFormatted[0].id : '');
        const sel = mockTemplatesFormatted.find(t => t.id === selId) || mockTemplatesFormatted[0];
        if (sel) {
          setCurrentTemplate(sel.id);
          setCurrentTemplateForModal(sel);
          console.log('🎯 Mock Template Selected (fallback):', { id: sel.id, title: sel.title });
          window.setTimeout(() => onPromptSelect(sel.id, sel.content), 100);
        }
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error('❌ テンプレート取得エラー:', error);
      console.error('エラーの詳細:', { name: error instanceof Error ? error.name : 'Unknown', message: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : 'No stack' });
      setTemplates([]);
      setIsLoading(false);
      alert(`プロンプトテンプレートの読み込みに失敗しました: ${error}`);
    }
  }, [onPromptSelect, selectedTemplate]);

  useEffect(() => {
    console.log('🚀 PromptSelector初期化 - Templates API');
    fetchTemplates();
  }, []); // 依存配列を空にして初回のみ実行

  // 親からの選択テンプレート変更をローカル状態に同期
  useEffect(() => {
    if (selectedTemplate) {
      setCurrentTemplate(selectedTemplate);
      const t = templates.find(t => t.id === selectedTemplate);
      if (t) {
        setCurrentTemplateForModal(t);
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
      setCurrentTemplateForModal(null);
      setShowEditor(true);
      setEditingPrompt(customPrompt || '');
    } else if (selectedTemplate) {
      setCurrentTemplateForModal(selectedTemplate);
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
    onPromptSelect(currentTemplate, value);
  };

  const handleSavePrompt = async () => {
    if (currentTemplate === 'custom') {
      setCustomPrompt(editingPrompt);
      onPromptSelect('custom', editingPrompt);
    } else {
      // 既存テンプレートの更新（DB保存 - CODEX_REVIEW.md準拠）
      try {
        // 新templates APIを使用
        if (window.electronAPI?.templates?.upsert) {
          const currentTemplateData = templates.find(t => t.id === currentTemplate);
          if (currentTemplateData) {
            const response = await window.electronAPI.templates.upsert({
              id: currentTemplate,
              title: currentTemplateData.title,
              content: editingPrompt,
              description: currentTemplateData.description,
              category: currentTemplateData.category,
              is_active: currentTemplateData.is_active
            });
            
            if (response?.success) {
              // キャッシュをクリアして再取得
              promptCache = null;
              await fetchTemplates();
              onPromptSelect(currentTemplate, editingPrompt);
              alert('プロンプトがデータベースに保存されました');
            } else {
              alert('プロンプトの保存に失敗しました: ' + (response?.error || 'Unknown error'));
            }
          }
        } else {
          // templates APIが利用できない場合は保存をスキップ
          console.warn('⚠️ Templates API not available, cannot save to DB');
          alert('プロンプトの保存機能は現在利用できません');
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
      onPromptSelect(currentTemplate, selectedTemplate.content);
    }
    setShowEditor(false);
  };

  // モーダル制御関数
  const handleShowDetail = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleModalEdit = (content: string) => {
    onPromptSelect(currentTemplate, content);
  };

  const handleModalSave = async (content: string) => {
    if (currentTemplate === 'custom') {
      setCustomPrompt(content);
      onPromptSelect('custom', content);
    } else {
      // 既存テンプレートの更新（DB保存）
      try {
        if (window.electronAPI?.templates?.upsert && currentTemplateForModal) {
          const response = await window.electronAPI.templates.upsert({
            id: currentTemplate,
            title: currentTemplateForModal.title,
            content: content,
            description: currentTemplateForModal.description,
            category: currentTemplateForModal.category,
            is_active: currentTemplateForModal.is_active
          });
          
          if (response?.success) {
            // キャッシュをクリアして再取得
            promptCache = null;
            await fetchTemplates();
            onPromptSelect(currentTemplate, content);
            alert('プロンプトがデータベースに保存されました');
          } else {
            throw new Error(response?.error || 'Unknown error');
          }
        } else {
          throw new Error('Templates API not available');
        }
      } catch (error) {
        console.error('プロンプト更新エラー:', error);
        throw error;
      }
    }
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
      setCurrentTemplateForModal(tpl);
      delayedInitRef.current = true;
    }, 100);
    return () => window.clearTimeout(timer);
  }, [isLoading, templates, currentTemplate, selectedTemplate, onPromptSelect]);

  // ローディング中でも枠とスケルトンを出したいので、早期returnはしない

  return (
    <div className="prompt-selector">
      {/* テンプレート選択部 */}
      <div className="template-selection">
        <label className="template-label">テンプレート選択:</label>
        <div className="template-controls">
          <div className="template-dropdown-wrapper">
            <select 
              value={currentTemplate} 
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="template-dropdown"
            >
              {isLoading ? (
                <option>読み込み中...</option>
              ) : (
                <>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                  <option value="custom">カスタムプロンプト</option>
                </>
              )}
            </select>
          </div>
          
          <button 
            className="detail-btn"
            onClick={handleShowDetail}
            disabled={isLoading || (!currentTemplateForModal && currentTemplate !== 'custom')}
            title="詳細版を表示"
          >
            <i className="fas fa-expand-alt"></i>
            詳細版
          </button>
        </div>
      </div>

      {/* 編集モード */}
      {showEditor && (
        <div className="prompt-editor">
          <div className="editor-header">
            <h4>
              <i className="fas fa-edit"></i>
              プロンプト編集
            </h4>
            <div className="editor-info">
              <small>※編集内容は即座にプレビューに反映されます</small>
            </div>
          </div>
          
          <div className="editor-content">
            <textarea
              value={editingPrompt}
              onChange={(e) => handleTempEdit(e.target.value)}
              className="prompt-editor-textarea"
              rows={12}
              placeholder="プロンプトを入力してください..."
            />
          </div>
          
          <div className="editor-actions">
            <button 
              className="editor-btn save-btn"
              onClick={handleSavePrompt}
              title="データベースに保存"
            >
              <i className="fas fa-database"></i>
              データベースに保存
            </button>
            <button 
              className="editor-btn cancel-btn"
              onClick={handleCancelEdit}
              title="編集をキャンセル"
            >
              <i className="fas fa-times"></i>
              キャンセル
            </button>
          </div>
        </div>
      )}
      
      {/* 詳細版モーダル */}
      <PromptDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        template={currentTemplateForModal}
        customPrompt={customPrompt}
        isCustom={currentTemplate === 'custom'}
        onEdit={handleModalEdit}
        onSave={handleModalSave}
      />
    </div>
  );
};

export default PromptSelector;
