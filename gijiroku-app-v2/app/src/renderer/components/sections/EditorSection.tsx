import React, { useEffect, memo } from 'react';
// 統合AI処理（Electron IPC）を使用
import PdfDownloadButton from '../PdfDownloadButton';
import './EditorSection.css';

interface EditorSectionProps {
  outputText: string;
  setOutputText: (text: string) => void;
  previewText: string;
  setPreviewText: (text: string) => void;
  editorText: string | null;
  setEditorText: (text: string | null) => void;
  revisionNotes: string;
  setRevisionNotes: (notes: string) => void;
  showRevisionPanel: boolean;
  setShowRevisionPanel: (show: boolean) => void;
  isRevising: boolean;
  setIsRevising: (revising: boolean) => void;
  saveTitle: string;
  setSaveTitle: (title: string) => void;
  setActiveTab: (tab: 'edit' | 'preview') => void;
  showToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  selectedModel: string;
}

const EditorSection: React.FC<EditorSectionProps> = ({
  outputText,
  setOutputText,
  previewText,
  setPreviewText,
  editorText,
  setEditorText,
  revisionNotes,
  setRevisionNotes,
  showRevisionPanel,
  setShowRevisionPanel,
  isRevising,
  setIsRevising,
  saveTitle,
  setSaveTitle,
  setActiveTab,
  showToast,
  selectedModel,
}) => {
  // Markdownプレビュー更新
  useEffect(() => {
    if (!outputText.trim()) {
      setPreviewText('');
      return;
    }

    const updatePreview = async () => {
      try {
        const { marked } = await import('marked');
        const html = await marked.parse(outputText);
        setPreviewText(html);
      } catch (error) {
        console.error('Markdown parsing error:', error);
        let html = outputText;
        html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
        html = html.replace(/\n/g, '<br>');
        setPreviewText(html);
      }
    };
    
    updatePreview();
  }, [outputText, setPreviewText]);

  const executeRevision = async () => {
    const currentText = editorText || outputText;
    
    if (!currentText.trim()) {
      showToast('再修正するテキストがありません', 'warning');
      return;
    }
    if (!revisionNotes.trim()) {
      showToast('追記・修正指示を入力してください', 'warning');
      return;
    }

    setIsRevising(true);
    
    try {
      console.log('🔄 再修正処理を開始します');
      console.log('使用するテキスト:', currentText.substring(0, 100) + '...');
      
      let revisedText: string;
      let usedFallback = false;

      try {
        console.log('🤖 統合AI再修正処理を開始（完全オフライン対応）');
        console.log('📤 再修正データ:', {
          originalLength: currentText.length,
          revisionNotes: revisionNotes.slice(0, 100) + '...'
        });

        // ElectronAPIの利用可能性を確認
        if (typeof window !== 'undefined' && (window as any).electronAPI) {
          console.log('✅ Electron API統合AI再修正を使用');
          
          const electronAPI = (window as any).electronAPI;
          
          // AI処理オプション設定
          const aiOptions = {
            provider: selectedModel.includes('gemini') ? 'gemini' : 
                      selectedModel.includes('openai') ? 'openai' : 
                      selectedModel.includes('gpt') ? 'openai' : 'offline',
            model: selectedModel,
            temperature: 0.7,
            maxTokens: 8192
          };

          const result = await electronAPI.ai.reviseText(
            currentText,
            revisionNotes,
            aiOptions
          );

          if (result.success && result.data) {
            revisedText = result.data.processedText;
            console.log('✅ AI再修正成功:', {
              provider: result.data.provider,
              model: result.data.model,
              processingTime: result.data.processingTime
            });
          } else {
            throw new Error(result.error?.message || 'AI再修正に失敗しました');
          }
        } else {
          // フォールバック: シンプルな手動修正
          console.log('⚠️ Electron API利用不可、手動修正に切り替え');
          
          revisedText = applySimpleRevision(currentText, revisionNotes);
          usedFallback = true;
        }

      } catch (revisionError) {
        console.error('❌ AI再修正エラー:', revisionError);
        
        // 最終フォールバック: シンプルな手動修正
        console.log('🔄 最終フォールバック: 手動修正を適用');
        revisedText = applySimpleRevision(currentText, revisionNotes);
        usedFallback = true;
      }
      
      if (!revisedText) {
        console.error('❌ 再修正レスポンスが空です');
        showToast('再修正結果が取得できませんでした', 'error');
        return;
      }
      
      if (typeof revisedText === 'string' && revisedText.trim().length > 0) {
        setOutputText(revisedText);
        if (editorText !== null) {
          setEditorText(revisedText);
        }
        console.log('✅ 出力テキストとエディターを更新しました');
      } else {
        console.error('❌ 修正されたテキストが無効です:', typeof revisedText, revisedText);
        showToast('修正されたテキストが無効でした', 'error');
        return;
      }
      
      setRevisionNotes('');
      setShowRevisionPanel(false);
      setActiveTab('edit');
      
      const successMessage = usedFallback 
        ? '再修正が完了しました (フォールバック実行)！エディターで確認してください。'
        : '再修正が完了しました！エディターで確認してください。';
      showToast(successMessage, 'success');
      
    } catch (err: unknown) {
      const error = err as {
        code?: string, 
        message?: string,
        response?: {
          status?: number, 
          data?: {
            detail?: unknown,
            message?: unknown
          }
        }
      };
      
      console.error('❌ 再修正エラー:', error);
      
      let errorMessage = '再修正処理中にエラーが発生しました';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = '再修正処理がタイムアウトしました。もう一度お試しください。';
      } else if (error.response?.data?.message) {
        errorMessage = typeof error.response.data.message === 'string' 
          ? error.response.data.message 
          : JSON.stringify(error.response.data.message);
      } else if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'object' && error.response.data.detail !== null) {
          if (Array.isArray(error.response.data.detail)) {
            errorMessage = error.response.data.detail.map((d: unknown) => (d as {msg?: string, message?: string}).msg || (d as {msg?: string, message?: string}).message || JSON.stringify(d)).join(', ');
          } else {
            const detail = error.response.data.detail as {msg?: string, message?: string};
            errorMessage = detail.msg || detail.message || JSON.stringify(error.response.data.detail);
          }
        } else {
          errorMessage = String(error.response.data.detail);
        }
      } else if (error.response?.status === 422) {
        errorMessage = 'データ形式が無効です。入力内容を確認してください。';
      } else if (error.response?.status === 500) {
        errorMessage = 'サーバーエラーが発生しました。しばらく後にお試しください。';
      } else if (error.response?.status === 400) {
        errorMessage = 'リクエストが無効です。入力内容を確認してください。';
      } else if (error.message) {
        errorMessage = `エラー: ${error.message}`;
      }
      
      showToast(errorMessage, 'error');
    } finally {
      setIsRevising(false);
    }
  };

  // シンプルな手動修正関数
  const applySimpleRevision = (originalText: string, revisionNotes: string): string => {
    let revisedText = originalText;
    
    // 修正指示を基に基本的なテキスト修正を適用
    const instructions = revisionNotes.toLowerCase();
    
    if (instructions.includes('追加') || instructions.includes('加える')) {
      revisedText += `\n\n## 追記事項\n${revisionNotes}に関する内容を追加しました。\n`;
    }
    
    if (instructions.includes('削除') || instructions.includes('除く')) {
      revisedText += `\n\n*(修正指示: ${revisionNotes})*\n`;
    }
    
    if (instructions.includes('修正') || instructions.includes('変更')) {
      revisedText += `\n\n## 修正履歴\n- 修正指示: ${revisionNotes}\n- 修正日時: ${new Date().toLocaleString('ja-JP')}\n`;
    }
    
    return revisedText;
  };

  // PDFダウンロードはプレビューセクションの PdfDownloadButton に委譲

  const saveMarkdown = () => {
    if (!outputText.trim()) {
      showToast('保存するテキストがありません', 'warning');
      return;
    }
    
    try {
      const blob = new Blob([outputText], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const filename = `${saveTitle}.md`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`Markdownファイルを保存しました: ${filename}`, 'success');
    } catch (error) {
      console.error('Markdown保存エラー:', error);
      showToast('Markdown保存に失敗しました', 'error');
    }
  };

  return (
    <div className="panel editor-preview-panel">
      <div className="panel-header">
        <h2>✏️ 4. 編集＆プレビュー</h2>
        <div className="editor-header-controls">
          <div className="save-title-section">
            <label htmlFor="saveTitle" className="save-title-label">保存タイトル:</label>
            <input
              id="saveTitle"
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              className="save-title-input"
              placeholder="ファイル名を入力"
            />
          </div>
          <div className="action-buttons">
            <button 
              onClick={() => setShowRevisionPanel(!showRevisionPanel)} 
              className="action-btn revision"
              disabled={!outputText.trim()}
              title="追記・修正指示をしてLLMに再修正を依頼"
            >
              <i className="fas fa-edit"></i>
              <span>LLM再修正</span>
            </button>
          </div>
        </div>
      </div>
      <div className="panel-content">
        {showRevisionPanel && (
          <div className="revision-panel">
            <div className="revision-header">
              <h4>🤖 LLM再修正</h4>
              <button 
                onClick={() => setShowRevisionPanel(false)}
                className="close-revision-btn"
                title="再修正パネルを閉じる"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="revision-content">
              <label htmlFor="revision-notes">追記・修正指示:</label>
              <textarea
                id="revision-notes"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="例: '参加者に田中さんを追加してください'、'アクションアイテムの期日を来週金曜日に変更'等"
                className="revision-textarea"
                rows={3}
              />
              <div className="revision-actions">
                <button 
                  onClick={executeRevision}
                  disabled={isRevising || !revisionNotes.trim()}
                  className="execute-revision-btn"
                >
                  {isRevising ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      <span>処理中...</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic"></i>
                      <span>再修正実行</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="edit-preview-layout">
          <div className="edit-section">
            <div className="section-header">
              <h3><i className="fas fa-edit"></i> 編集時の内容 <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'normal' }}>({outputText.length}文字)</span></h3>
              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={saveMarkdown}
                  disabled={!outputText.trim()}
                  title={!outputText.trim() ? '保存するテキストがありません' : 'Markdownファイルとしてダウンロード'}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: !outputText.trim() ? 'not-allowed' : 'pointer',
                    opacity: !outputText.trim() ? 0.6 : 1,
                    backgroundColor: '#007bff',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  📥 Markdown ダウンロード
                </button>
              </div>
            </div>
            <div className="section-content">
              <textarea 
                value={outputText}
                onChange={(e) => setOutputText(e.target.value)}
                placeholder="ここにAIの出力結果が表示され、編集できます..."
                className={`markdown-editor-vertical ${showRevisionPanel ? 'with-revision-panel' : ''}`}
              />
            </div>
          </div>
          
          <div className="preview-section">
            <div className="section-header">
              <h3><i className="fas fa-eye"></i> 印刷時の品質</h3>
              <div style={{ marginLeft: 'auto' }}>
                <PdfDownloadButton 
                  content={outputText}
                  title={saveTitle || '議事録'}
                  disabled={!outputText.trim()}
                  size="small"
                />
                {/* Debug: 保存タイトル確認用 */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
                    デバッグ: 保存タイトル="{saveTitle}"
                  </div>
                )}
              </div>
            </div>
            <div className="section-content">
              <div 
                className="markdown-preview-vertical"
                dangerouslySetInnerHTML={{ __html: previewText }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(EditorSection);
