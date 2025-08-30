import React, { useMemo, useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { generatePdf } from '../services/pdfApi'

type Props = {
  onClose?: () => void
  initialContent?: string
}

const sample = `# 議事録サンプル\n\n- 日時: 2025-08-27\n- 参加者: 山田, 田中\n\n## 決定事項\n- 次回までにドラフト作成\n\n## メモ\n日本語テキストの表示とPDF化を確認します。\n\n> 引用の例\n\n1. 箇条書き\n2. 番号付きリスト\n\n`;

export default function MarkdownPdfTool({ onClose, initialContent }: Props) {
  const [title, setTitle] = useState('議事録')
  const [markdown, setMarkdown] = useState(initialContent || sample)
  
  // 保存された入力内容をPDFツールで使用
  useEffect(() => {
    const savedContent = localStorage.getItem('gijiroku_outputText') || 
                        localStorage.getItem('gijiroku_uploadedText') ||
                        localStorage.getItem('gijiroku_directTextInput');
    if (savedContent && !initialContent) {
      setMarkdown(savedContent);
    }
  }, [initialContent]);
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => markdown, [markdown])

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const blob = await generatePdf({ content: markdown, title, content_type: 'markdown' })
      const url = URL.createObjectURL(blob)
      // Open in new tab for print/download
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || 'document'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.message || 'PDF生成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 40px)', padding: 16 }}>
      <div style={{ position: 'fixed', top: 8, right: 8, display: 'flex', gap: 8 }}>
        {onClose && (
          <button onClick={onClose} style={{ padding: '8px 12px' }}>← ダッシュボードへ</button>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="タイトル"
            style={{ flex: 1, padding: 8 }}
          />
          <button onClick={handleGenerate} disabled={loading} style={{ padding: '8px 12px' }}>
            {loading ? '生成中…' : 'PDFを生成'}
          </button>
          <div style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
            💾 保存済み入力内容を自動読み込み
          </div>
        </div>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          style={{ flex: 1, width: '100%', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace', fontSize: 14, padding: 12 }}
        />
        {error && <div style={{ color: 'tomato', marginTop: 8 }}>{error}</div>}
      </div>
      <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: 16, overflow: 'auto' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ borderBottom: '1px solid #ddd', paddingBottom: 8 }}>{title || 'プレビュー'}</h2>
          <div style={{ fontFamily: 'Noto Sans JP, system-ui, -apple-system, Segoe UI, Meiryo, sans-serif', lineHeight: 1.7 }}>
            <ReactMarkdown>{preview}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}

