// Simple WebVTT parser utilities (client-side)
// Extracts text-only and a lightly formatted text with speakers preserved when available

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
    // Try to split speaker: "Name: text"
    let speaker: string | undefined
    let text = full
    const colonIdx = full.indexOf(": ")
    if (colonIdx > 0 && colonIdx < 40) {
      speaker = full.slice(0, colonIdx).trim()
      text = full.slice(colonIdx + 1).trim()
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

