export type PdfRequest = {
  content: string
  title?: string
  format?: 'A4' | 'Letter' | 'A3'
  content_type?: 'markdown' | 'text'
}

// Decide API base automatically:
// - If FRONTEND_PDF_API_BASE is set, use it
// - Else if running on localhost and BACKEND_PORT is set, use http://localhost:<port>
// - Else default to same-origin /api (Vercel Functions)
function resolveApiBase() {
  const manual = (import.meta as any).env?.VITE_FRONTEND_PDF_API_BASE || process.env.FRONTEND_PDF_API_BASE
  if (manual) return manual.replace(/\/$/, '')

  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    const backendPort = (import.meta as any).env?.VITE_BACKEND_PORT || process.env.BACKEND_PORT
    if (isLocalhost && backendPort) return `http://localhost:${backendPort}`
  }

  return '' // same-origin
}

const API_BASE = resolveApiBase()

export async function generatePdf(req: PdfRequest): Promise<Blob> {
  const endpoint = `${API_BASE}/api/generate-pdf`.replace('/api/api/', '/api/')
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: req.content,
      title: req.title || '議事録',
      format: req.format || 'A4',
      content_type: req.content_type || 'markdown'
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`PDF API error ${res.status}: ${text}`)
  }
  return await res.blob()
}

