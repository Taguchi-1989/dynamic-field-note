// Core Types for gijiroku-app-v2
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

export interface DashboardProps {
  onReset?: () => void;
  initialMode?: StepMode;
}

export type StepMode = 'input' | 'processing' | 'result' | 'editor';
export type StepStatus = 'pending' | 'active' | 'completed' | 'error';

export interface StepState {
  mode: StepMode;
  status: StepStatus;
  data?: ProcessedText;
}

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FileUploadProps {
  onFileProcessed: (result: ProcessedText) => void;
  onProcessingChange: (processing: boolean) => void;
  isProcessing: boolean;
}

export interface ProcessingResultProps {
  processedText: ProcessedText;
  onEdit: () => void;
  onReset: () => void;
}

export interface InputSectionProps {
  onTextSubmit: (text: string) => void;
  isProcessing: boolean;
  inputValue: string;
  onInputChange: (value: string) => void;
}

export interface AIExecutionSectionProps {
  selectedTemplate: string;
  onTemplateChange: (templateId: string, customPrompt?: string) => void;
  onExecute: () => void;
  isProcessing: boolean;
  canExecute: boolean;
}

export interface EditorSectionProps {
  content: string;
  onChange: (content: string) => void;
  onGeneratePdf: () => void;
  isGenerating: boolean;
}