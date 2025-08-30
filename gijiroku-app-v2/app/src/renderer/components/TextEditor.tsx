import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
// import jsPDF from 'jspdf'; // Removed to reduce bundle size - PDF generation handled server-side
import { ProcessedText } from '../App';
import './TextEditor.css';

interface TextEditorProps {
  processedText: ProcessedText;
  onReset: () => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ processedText, onReset }) => {
  const [editedText, setEditedText] = useState(processedText.corrected);
  const [showCorrections, setShowCorrections] = useState(true);
  const [showOriginal, setShowOriginal] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const _handleDownloadMarkdown = () => {
    const blob = new Blob([editedText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `議事録_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const _handleDownloadPDF = async () => {
    // PDF generation moved to server-side - this function is deprecated
    console.log('PDF generation moved to server-side');
    alert('PDF生成はサーバーサイドで処理されます');
  };

  // PDFにテキストを追加し、自動改行する関数 - deprecated (server-side PDF generation)
  // const addTextToPDF = (pdf: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number => {
  //   const lines = pdf.splitTextToSize(text, maxWidth);
  //   pdf.text(lines, x, y);
  //   return y + (lines.length * lineHeight);
  // };

  // マークダウンを解析してPDF用の構造体に変換
  const parseMarkdownForPDF = (markdown: string): Array<{type: string, content: string, items?: string[]}> => {
    const lines = markdown.split('\n');
    const elements: Array<{type: string, content: string, items?: string[]}> = [];
    let currentListItems: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line === '') {
        if (currentListItems.length > 0) {
          elements.push({ type: 'list', content: '', items: currentListItems });
          currentListItems = [];
        }
        continue;
      }
      
      // 見出し
      if (line.startsWith('# ')) {
        if (currentListItems.length > 0) {
          elements.push({ type: 'list', content: '', items: currentListItems });
          currentListItems = [];
        }
        elements.push({ type: 'heading1', content: line.substring(2) });
      } else if (line.startsWith('## ')) {
        if (currentListItems.length > 0) {
          elements.push({ type: 'list', content: '', items: currentListItems });
          currentListItems = [];
        }
        elements.push({ type: 'heading2', content: line.substring(3) });
      } else if (line.startsWith('### ')) {
        if (currentListItems.length > 0) {
          elements.push({ type: 'list', content: '', items: currentListItems });
          currentListItems = [];
        }
        elements.push({ type: 'heading3', content: line.substring(4) });
      }
      // リスト項目
      else if (line.startsWith('* ') || line.startsWith('- ')) {
        currentListItems.push(line.substring(2));
      } else if (/^\d+\.\s/.test(line)) {
        currentListItems.push(line.replace(/^\d+\.\s/, ''));
      }
      // 太字（**text**）
      else if (line.includes('**')) {
        if (currentListItems.length > 0) {
          elements.push({ type: 'list', content: '', items: currentListItems });
          currentListItems = [];
        }
        const boldText = line.replace(/\*\*(.*?)\*\*/g, '$1');
        elements.push({ type: 'strong', content: boldText });
      }
      // 通常のテキスト
      else {
        if (currentListItems.length > 0) {
          elements.push({ type: 'list', content: '', items: currentListItems });
          currentListItems = [];
        }
        elements.push({ type: 'paragraph', content: line });
      }
    }
    
    // 最後のリストアイテムを追加
    if (currentListItems.length > 0) {
      elements.push({ type: 'list', content: '', items: currentListItems });
    }
    
    return elements;
  };

  const handleSyncScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement;
    const previewElement = document.querySelector('.preview-content');
    
    if (previewElement) {
      const scrollPercentage = textarea.scrollTop / (textarea.scrollHeight - textarea.clientHeight);
      previewElement.scrollTop = scrollPercentage * (previewElement.scrollHeight - previewElement.clientHeight);
    }
  };

  return (
    <div className="text-editor">
      <div className="editor-header">
        <div className="editor-title">
          <h2>議事録エディタ</h2>
          <p>左側で編集、右側でプレビューを確認できます</p>
        </div>
        
        <div className="editor-actions">
          <button
            className="toggle-button"
            onClick={() => setShowCorrections(!showCorrections)}
          >
            {showCorrections ? '修正箇所を隠す' : '修正箇所を表示'}
          </button>
          
          <button
            className="toggle-button"
            onClick={() => setShowOriginal(!showOriginal)}
          >
            {showOriginal ? '元テキストを隠す' : '元テキストを表示'}
          </button>
          
          
          <button className="reset-button" onClick={onReset}>
            🔄 新しいファイル
          </button>
        </div>
      </div>

      {showCorrections && processedText.corrections.length > 0 && (
        <div className="corrections-summary">
          <h3>修正内容 ({processedText.corrections.length}件)</h3>
          <div className="corrections-list">
            {processedText.corrections.slice(0, 5).map((correction, index) => (
              <div key={index} className="correction-item">
                <span className="correction-original">「{correction.original}」</span>
                <span className="correction-arrow">→</span>
                <span className="correction-corrected">「{correction.corrected}」</span>
                <span className="correction-reason">({correction.reason})</span>
              </div>
            ))}
            {processedText.corrections.length > 5 && (
              <div className="correction-more">
                ...他 {processedText.corrections.length - 5} 件
              </div>
            )}
          </div>
        </div>
      )}

      <div className="editor-container">
        {showOriginal && (
          <div className="original-text">
            <h3>元のテキスト</h3>
            <div className="original-content">
              <pre>{processedText.original}</pre>
            </div>
          </div>
        )}
        
        <div className="editor-main">
          <div className="editor-pane">
            <div className="pane-header">
              <h3>編集</h3>
              <div className="editor-stats">
                <span>{editedText.length} 文字</span>
                <span>{editedText.split('\n').length} 行</span>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onScroll={handleSyncScroll}
              className="editor-textarea"
              placeholder="議事録の内容を編集してください..."
              spellCheck={false}
            />
          </div>

          <div className="preview-pane">
            <div className="pane-header">
              <h3>プレビュー</h3>
              <div className="preview-format">
                Markdown形式
              </div>
            </div>
            <div className="preview-content">
              <ReactMarkdown>{editedText}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;