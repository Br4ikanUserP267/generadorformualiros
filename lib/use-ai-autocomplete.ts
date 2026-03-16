// Simple client helper to call the server-side autocomplete route.
// Usage: import { aiAutocomplete } from '@/lib/use-ai-autocomplete'

export async function aiAutocomplete(prompt: string, opts?: { maxTokens?: number; model?: string }) {
  const url = '/api/ai/autocomplete'
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, maxTokens: opts?.maxTokens, model: opts?.model })
  })

  const raw = await res.text()
  // Try parse JSON, otherwise return raw text
  let parsed: any = null
  try { parsed = raw ? JSON.parse(raw) : null } catch (e) { parsed = null }

  if (!res.ok) {
    const bodyStr = parsed ? JSON.stringify(parsed) : raw
    throw new Error(`AI autocomplete error: ${res.status} ${bodyStr}`)
  }

  // Normalize common provider shapes so callers can more easily extract text:
  // - Gemini: { candidates: [{ content: { parts: [{ text }] } }] }
  // - Other shapes: { output: [{ content: { parts: [...] } }] } or choices/messages
  const extractPartsText = (obj: any) => {
    if (!obj) return ''
    // If it's already a string
    if (typeof obj === 'string') return obj
    // Gemini candidate.content.parts
    if (obj.parts && Array.isArray(obj.parts)) {
      return obj.parts.map((p: any) => (p && typeof p.text === 'string' ? p.text : '')).join('')
    }
    // Some providers nest content under content array
    if (Array.isArray(obj)) return obj.map(extractPartsText).join('')
    // Fallback: try common fields
    if (obj.text && typeof obj.text === 'string') return obj.text
    if (obj.message && obj.message.content) return extractPartsText(obj.message.content)
    return ''
  }

  if (parsed && typeof parsed === 'object') {
    try {
      if (Array.isArray(parsed.candidates) && parsed.candidates[0]) {
        const c0 = parsed.candidates[0]
        if (c0.content) {
          const txt = extractPartsText(c0.content)
          // normalize to make downstream extraction simple
          parsed.candidates[0].content = txt || c0.content
          parsed._extractedText = txt || parsed._extractedText
        }
      } else if (Array.isArray(parsed.output) && parsed.output[0] && parsed.output[0].content) {
        const txt = extractPartsText(parsed.output[0].content)
        parsed.output[0].content = txt || parsed.output[0].content
        parsed._extractedText = txt || parsed._extractedText
      } else if (parsed.choices && parsed.choices[0]) {
        const ch = parsed.choices[0]
        const txt = ch.text || (ch.message && extractPartsText(ch.message.content)) || ''
        parsed._extractedText = txt || parsed._extractedText
      }
    } catch (e) {
      // ignore normalization errors
    }
  }

  return parsed !== null ? parsed : raw
}
