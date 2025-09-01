// Simple WebVTT parser utilities (client-side)
// Extracts text-only and a lightly formatted text with speakers preserved when available

/**
 * 話者名をクリーンアップ（ローマ字部分、括弧、番号などを除去）
 * 例: "壷井　佑夏(Tsuboi, Yuka)" → "壷井　佑夏"
 *     "@1" → "@1" (そのまま)
 */
function cleanSpeakerName(rawSpeaker: string): string {
  if (!rawSpeaker) return ''
  
  let cleaned = rawSpeaker.trim()
  
  // @記号で始まる場合はそのまま返す（システム話者）
  if (cleaned.startsWith('@')) {
    return cleaned
  }
  
  // 括弧とその中身を除去 (Tsuboi, Yuka) など
  cleaned = cleaned.replace(/\([^)]*\)/g, '')
  
  // 行末の数字やハイフンを除去
  cleaned = cleaned.replace(/[-\d]+$/, '')
  
  // 余分な空白を除去
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

export interface VTTEntry {
  start: string
  end: string
  speaker?: string
  text: string
}

const timeLineRe = /-->\s*/
const _timestampRe = /\d{2}:\d{2}:\d{2}\.\d{3}\s+-->/

export function parseVtt(content: string): VTTEntry[] {
  const lines = content.replace(/\r\n?/g, "\n").split("\n")
  const entries: VTTEntry[] = []
  let i = 0
  // Skip header lines until first timing line
  while (i < lines.length && !lines[i].includes("-->")) i++
  while (i < lines.length) {
    const tline = lines[i++] || ""
    if (!tline.includes("-->")) continue
    const [start, endPart] = tline.split(timeLineRe)
    const end = (endPart || '').trim().split(' ')[0]
    const textLines: string[] = []
    while (i < lines.length && lines[i].trim() !== "") {
      textLines.push(lines[i++])
    }
    // skip blank separator
    while (i < lines.length && lines[i].trim() === "") i++

    const full = textLines.join(" ").trim()
    // Parse speaker from VTT voice tags: <v Speaker>text</v> or "Speaker: text"
    let speaker: string | undefined
    let text = full

    // Handle <v Speaker>text</v> format
    const voiceTagMatch = full.match(/^<v\s+([^>]+)>(.+)<\/v>$/)
    if (voiceTagMatch) {
      speaker = cleanSpeakerName(voiceTagMatch[1])
      text = voiceTagMatch[2].trim()
    } else {
      // Handle "Speaker: text" format
      const colonIdx = full.indexOf(": ")
      if (colonIdx > 0 && colonIdx < 40) {
        speaker = cleanSpeakerName(full.slice(0, colonIdx))
        text = full.slice(colonIdx + 1).trim()
      }
    }
    if (full) {
      entries.push({ start: (start || '').trim(), end: end || '', speaker, text })
    }
  }
  return entries
}

export function extractTextOnly(content: string): string {
  const entries = parseVtt(content)
  return entries.map(e => e.text).join("\n")
}

export function extractFormatted(content: string): string {
  const entries = parseVtt(content)
  // Group consecutive same speaker, print with timestamps inline minimal
  return entries
    .map(e => (e.speaker ? `${e.speaker}: ${e.text}` : e.text))
    .join("\n")
}

