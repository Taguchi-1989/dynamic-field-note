import React, { useState } from 'react';
import { generatePDF, downloadPDF, PdfGenerationOptions } from '../services/pdfService';

interface PdfDownloadButtonProps {
  content: string;
  title?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  size?: 'small' | 'medium' | 'large';
  images?: {[key: string]: string}; // 画像データ（base64）
  outputFormat?: 'standard' | 'latex'; // 出力フォーマット
}

const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({
  content,
  title = '議事録',
  disabled = false,
  variant = 'primary',
  size = 'medium',
  images = {},
  outputFormat = 'standard'
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | null>(null);

  const handleDownloadPDF = async () => {
    if (!content.trim()) {
      setMessage('ダウンロードするコンテンツがありません');
      setMessageType('error');
      return;
    }

    // LaTeX形式の場合は開発中メッセージを表示
    if (outputFormat === 'latex') {
      setMessage('⚠️ LaTeX PDF機能は現在開発中です。標準PDFをご利用ください。');
      setMessageType('error');
      return;
    }

    setIsGenerating(true);
    setMessage(null);
    setMessageType(null);

    try {
      console.log('📄 Starting PDF generation via Electron IPC...');
      
      // 保存タイトルを事前に確定
      const finalTitle = title && title.trim() ? title.trim() : '議事録';
      console.log('📝 Received title prop:', title);
      console.log('📝 Final title for PDF:', finalTitle);

      // Electron API経由でPDF生成
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const electronAPI = (window as any).electronAPI;
        
        // 画像IDを実際のbase64データに置換
        let processedContent = content;
        Object.entries(images).forEach(([imageId, dataUri]) => {
          const regex = new RegExp(`!\\[([^\\]]*?)\\]\\(${imageId}\\)`, 'g');
          processedContent = processedContent.replace(regex, `![$1](${dataUri})`);
        });

        const input = {
          mdContent: processedContent,
          options: {
            title: finalTitle, // 確定したタイトルを設定
            toc: false, // 目次無効
            theme: 'default',
            format: outputFormat, // LaTeX か Standard かの指定
            includeImages: Object.keys(images).length > 0, // 画像が含まれているかの指定
            imageData: images // 画像データを渡す
          }
        };

        console.log('🔗 Using Electron IPC for PDF generation with title:', finalTitle);
        const result = await electronAPI.markdown.compileToPdf(input);
        
        if (result.success && result.data) {
          console.log('✅ PDF generated via Electron IPC:', result.data.pdfPath);
          
          // EBUSY エラー回避のため、タイムスタンプ付きのユニークなファイル名を生成
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
          const targetFilename = `${finalTitle}_${timestamp}.pdf`;
          
          try {
            console.log('📁 Copying PDF to Downloads folder with filename:', targetFilename);
            
            // Electron API経由でDownloadsフォルダにコピー
            const copyToDownloadsResult = await electronAPI.file.copyToDownloads(result.data.pdfPath, targetFilename);
            
            if (copyToDownloadsResult.success && copyToDownloadsResult.data) {
              const formatInfo = outputFormat === 'latex' ? '（LaTeX形式）' : '';
              const imageInfo = Object.keys(images).length > 0 ? `（${Object.keys(images).length}枚の画像含む）` : '';
              setMessage(`✅ PDF${formatInfo}${imageInfo}をDownloadsフォルダに保存しました: ${targetFilename}`);
              setMessageType('success');
              console.log('✅ PDF copied to Downloads folder:', copyToDownloadsResult.data.destPath);
            } else {
              throw new Error(copyToDownloadsResult.error?.message || 'Downloadsフォルダへのコピーに失敗');
            }
            
          } catch (copyError) {
            console.error('❌ Failed to copy PDF to Downloads:', copyError);
            // コピーに失敗しても、PDF自体は生成されているので成功メッセージに変更
            const exportsPath = result.data.pdfPath;
            const fileName = exportsPath.split('\\').pop() || exportsPath.split('/').pop();
            setMessage(`✅ PDFを生成しました！Downloadsフォルダへのコピーは失敗しましたが、以下の場所からアクセスできます:\n📁 ${fileName}`);
            setMessageType('success');
          }
          
        } else {
          throw new Error(result.error?.message || 'PDF generation failed');
        }
      } else {
        throw new Error('Electron API not available');
      }

    } catch (err) {
      console.error('PDF generation error:', err);
      let errorMessage = 'PDFの生成に失敗しました。';
      
      if (err instanceof Error) {
        errorMessage += `\n詳細: ${err.message}`;
      } else if (typeof err === 'object' && err !== null) {
        errorMessage += `\n詳細: ${JSON.stringify(err)}`;
      }
      
      setMessage(`❌ ${errorMessage}`);
      setMessageType('error');
    } finally {
      setIsGenerating(false);
    }
  };

  // プレビュー機能は削除

  // スタイル設定
  const baseStyle = {
    padding: size === 'small' ? '6px 12px' : size === 'large' ? '12px 24px' : '8px 16px',
    fontSize: size === 'small' ? '12px' : size === 'large' ? '16px' : '14px',
    borderRadius: '4px',
    border: 'none',
    cursor: disabled || isGenerating ? 'not-allowed' : 'pointer',
    opacity: disabled || isGenerating ? 0.6 : 1,
    transition: 'all 0.2s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  };

  const primaryStyle = {
    ...baseStyle,
    backgroundColor: '#007bff',
    color: 'white'
  };

  const secondaryStyle = {
    ...baseStyle,
    backgroundColor: '#6c757d',
    color: 'white'
  };

  const buttonStyle = variant === 'primary' ? primaryStyle : secondaryStyle;

  return (
    <div style={{ display: 'inline-block' }}>
      <button
        onClick={handleDownloadPDF}
        disabled={disabled || isGenerating || !content.trim()}
        style={buttonStyle}
        onMouseOver={(e) => {
          if (!disabled && !isGenerating) {
            e.currentTarget.style.opacity = '0.9';
          }
        }}
        onMouseOut={(e) => {
          if (!disabled && !isGenerating) {
            e.currentTarget.style.opacity = '1';
          }
        }}
      >
        {isGenerating ? (
          <>
            <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
            PDF生成中...
          </>
        ) : (
          <>
            📄 PDF ダウンロード
          </>
        )}
      </button>

      {message && (
        <div style={{
          color: messageType === 'success' ? '#28a745' : '#dc3545',
          fontSize: '12px',
          marginTop: '4px',
          maxWidth: '300px',
          fontWeight: '500'
        }}>
          {message}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PdfDownloadButton;