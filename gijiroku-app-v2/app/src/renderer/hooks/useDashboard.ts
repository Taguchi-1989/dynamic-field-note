import { useState, useEffect, useCallback, useMemo } from 'react';
import { ToastMessage, UploadStatus } from '../types';

export const useDashboard = () => {
  // Text states
  const [uploadedText, setUploadedText] = useState<string>(() => {
    const saved = localStorage.getItem('gijiroku_uploadedText');
    return saved || '';
  });
  const [directTextInput, setDirectTextInput] = useState<string>(() => {
    const saved = localStorage.getItem('gijiroku_directTextInput');
    return saved || '';
  });
  const [outputText, setOutputText] = useState<string>(() => {
    const saved = localStorage.getItem('gijiroku_outputText');
    return saved || '';
  });
  const [previewText, setPreviewText] = useState<string>('');
  const [editorText, setEditorText] = useState<string | null>(null);
  
  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [dragOver, setDragOver] = useState<boolean>(false);
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isRevising, setIsRevising] = useState<boolean>(false);
  
  // Modal states
  const [isDictionaryOpen, setIsDictionaryOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);
  const [isContactOpen, setIsContactOpen] = useState<boolean>(false);
  
  // Revision states
  const [revisionNotes, setRevisionNotes] = useState<string>('');
  const [showRevisionPanel, setShowRevisionPanel] = useState<boolean>(false);
  
  // Help states
  const [showPromptHelp, setShowPromptHelp] = useState<boolean>(false);
  const [showFileHelp, setShowFileHelp] = useState<boolean>(false);
  const [showModelInfo, setShowModelInfo] = useState<boolean>(false);
  
  // Settings
  const [saveTitle, setSaveTitle] = useState<string>(`${new Date().toISOString().slice(0, 10)}_議事録`);
  const [selectedModel, setSelectedModel] = useState(() => {
    // 設定画面で保存されたモデルを読み込み
    const savedModels = localStorage.getItem('selectedModels');
    if (savedModels) {
      const models = JSON.parse(savedModels);
      // デフォルトはGeminiモデルを使用
      const defaultModel = models.gemini || models.openai || 'gemini-2.5-pro';
      console.log('🔗 Loading saved model for AI execution:', defaultModel);
      return defaultModel;
    }
    // フォールバック: 最新のデフォルトモデル
    return 'gemini-2.5-pro';
  });
  const [selectedPromptTemplate, setSelectedPromptTemplate] = useState('general_meeting');
  const [customPromptText, setCustomPromptText] = useState<string | undefined>(undefined);
  
  // Theme
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  
  // Custom Dictionary
  const [useCustomDictionary, setUseCustomDictionary] = useState<boolean>(() => {
    const saved = localStorage.getItem('useCustomDictionary');
    return saved ? JSON.parse(saved) : true; // デフォルトは有効
  });

  // 設定画面でモデルが変更された時の同期
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'selectedModels' && e.newValue) {
        const models = JSON.parse(e.newValue);
        const newDefaultModel = models.gemini || models.openai || 'gemini-2.5-pro';
        console.log('🔄 Model settings changed via storage event, updating selected model:', newDefaultModel);
        setSelectedModel(newDefaultModel);
      }
    };

    // カスタムイベント（同一ウィンドウ内での設定変更）を処理
    const handleModelSettingsChanged = (e: CustomEvent) => {
      const models = e.detail;
      const newDefaultModel = models.gemini || models.openai || 'gemini-2.5-pro';
      console.log('🔄 Model settings changed via custom event, updating selected model:', newDefaultModel);
      setSelectedModel(newDefaultModel);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('modelSettingsChanged', handleModelSettingsChanged as EventListener);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('modelSettingsChanged', handleModelSettingsChanged as EventListener);
    };
  }, []);
  
  // Toast
  const [toast, setToast] = useState<ToastMessage>({
    message: '',
    type: 'info',
    isVisible: false
  });

  // Dark mode effect
  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      htmlElement.removeAttribute('data-theme');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  
  // Auto-save text inputs
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (uploadedText || directTextInput || outputText) {
        localStorage.setItem('gijiroku_uploadedText', uploadedText);
        localStorage.setItem('gijiroku_directTextInput', directTextInput);
        localStorage.setItem('gijiroku_outputText', outputText);
        localStorage.setItem('gijiroku_lastSaved', new Date().toISOString());
        setLastSaved(new Date());
        setHasUnsavedChanges(false);
        console.log('🔄 入力内容を自動保存しました');
      }
    }, 2000); // 2秒後に自動保存
    
    setHasUnsavedChanges(true);
    return () => clearTimeout(timeoutId);
  }, [uploadedText, directTextInput, outputText]);
  
  // Load last saved timestamp on mount
  useEffect(() => {
    const savedTimestamp = localStorage.getItem('gijiroku_lastSaved');
    if (savedTimestamp) {
      setLastSaved(new Date(savedTimestamp));
    }
  }, []);

  // Custom dictionary persistence
  useEffect(() => {
    localStorage.setItem('useCustomDictionary', JSON.stringify(useCustomDictionary));
  }, [useCustomDictionary]);

  // API keys availability check
  const checkApiKeysAvailable = useCallback(() => {
    const savedKeys = localStorage.getItem('apiKeys');
    if (!savedKeys) return false;
    
    try {
      const apiKeys = JSON.parse(savedKeys);
      const hasGeminiKey = apiKeys.gemini && apiKeys.gemini.trim().length > 0;
      const hasOpenaiKey = apiKeys.openai && apiKeys.openai.trim().length > 0;
      
      // At least one key should be available
      return hasGeminiKey || hasOpenaiKey;
    } catch {
      return false;
    }
  }, []);

  // API keys availability state
  const [apiKeysAvailable, setApiKeysAvailable] = useState<boolean>(() => checkApiKeysAvailable());

  // Monitor API keys changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'apiKeys') {
        const newAvailability = checkApiKeysAvailable();
        console.log('🔑 API keys availability changed:', newAvailability);
        setApiKeysAvailable(newAvailability);
      }
    };

    // Custom event for same-window changes
    const handleApiKeysChanged = () => {
      const newAvailability = checkApiKeysAvailable();
      console.log('🔑 API keys availability changed via custom event:', newAvailability);
      setApiKeysAvailable(newAvailability);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('apiKeysChanged', handleApiKeysChanged);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('apiKeysChanged', handleApiKeysChanged);
    };
  }, [checkApiKeysAvailable]);

  // Toast functions (memoized)
  const showToast = useCallback((message: string, type: ToastMessage['type']) => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode]);
  
  const toggleCustomDictionary = useCallback(() => {
    setUseCustomDictionary(!useCustomDictionary);
  }, [useCustomDictionary]);

  // Computed values (memoized)
  const hasInput = useMemo(() => {
    return Boolean(uploadedText || directTextInput);
  }, [uploadedText, directTextInput]);

  const isReady = useMemo(() => {
    return hasInput && selectedPromptTemplate;
  }, [hasInput, selectedPromptTemplate]);

  // Manual save function
  const saveCurrentState = useCallback(() => {
    localStorage.setItem('gijiroku_uploadedText', uploadedText);
    localStorage.setItem('gijiroku_directTextInput', directTextInput);
    localStorage.setItem('gijiroku_outputText', outputText);
    localStorage.setItem('gijiroku_lastSaved', new Date().toISOString());
    setLastSaved(new Date());
    setHasUnsavedChanges(false);
    return true;
  }, [uploadedText, directTextInput, outputText]);
  
  // Clear saved data
  const clearSavedData = useCallback(() => {
    localStorage.removeItem('gijiroku_uploadedText');
    localStorage.removeItem('gijiroku_directTextInput');
    localStorage.removeItem('gijiroku_outputText');
    localStorage.removeItem('gijiroku_lastSaved');
    setLastSaved(null);
    setHasUnsavedChanges(false);
  }, []);

  return {
    // States
    uploadedText,
    setUploadedText,
    directTextInput,
    setDirectTextInput,
    outputText,
    setOutputText,
    previewText,
    setPreviewText,
    editorText,
    setEditorText,
    activeTab,
    setActiveTab,
    uploadStatus,
    setUploadStatus,
    dragOver,
    setDragOver,
    isProcessing,
    setIsProcessing,
    isUploading,
    setIsUploading,
    isRevising,
    setIsRevising,
    isDictionaryOpen,
    setIsDictionaryOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    isAboutOpen,
    setIsAboutOpen,
    isContactOpen,
    setIsContactOpen,
    revisionNotes,
    setRevisionNotes,
    showRevisionPanel,
    setShowRevisionPanel,
    showPromptHelp,
    setShowPromptHelp,
    showFileHelp,
    setShowFileHelp,
    showModelInfo,
    setShowModelInfo,
    saveTitle,
    setSaveTitle,
    selectedModel,
    setSelectedModel,
    selectedPromptTemplate,
    setSelectedPromptTemplate,
    customPromptText,
    setCustomPromptText,
    isDarkMode,
    setIsDarkMode,
    useCustomDictionary,
    setUseCustomDictionary,
    toast,
    setToast,
    lastSaved,
    hasUnsavedChanges,
    apiKeysAvailable,
    
    // Functions
    showToast,
    hideToast,
    toggleDarkMode,
    toggleCustomDictionary,
    saveCurrentState,
    clearSavedData,
    
    // Computed values
    hasInput,
    isReady,
  };
};