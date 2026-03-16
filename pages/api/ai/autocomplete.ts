import type { NextApiRequest, NextApiResponse } from 'next'

// Backwards-compatible API route in `pages/` to ensure /api/ai/autocomplete is reachable
// This keeps the whole integration inside the monolith and logs requests for debugging.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, route: '/api/ai/autocomplete (pages api)' })
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { prompt = '', maxTokens = 256, model } = req.body || {}

    // Log incoming request for easier debugging in dev
    console.log('[pages api] AI autocomplete request prompt length:', String(prompt).length)

    const bearerKey = process.env.GEN_AI_KEY
    const bearerEndpoint = process.env.GEN_AI_ENDPOINT
    const geminiKey = process.env.GEMINI_KEY
    const defaultGoogleEndpoint = 'https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate'

    if (!bearerKey && !geminiKey) {
      return res.status(500).json({ error: 'Server not configured. Set GEN_AI_KEY or GEMINI_KEY.' })
    }

    // Build payload. For Google Gemini-style endpoints (gemini-flash) we send
    // { contents: [{ parts: [{ text: '...' }] }] }
    // Default payload: keep it minimal to avoid sending unsupported root-level fields
    let payload: any = {
      prompt: { text: prompt }
    }
    if (model) payload.model = model

    // Default endpoint and fetch options
    let endpointToCall = bearerEndpoint || defaultGoogleEndpoint
    const fetchOptions: any = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }

    // If GEMINI_KEY is present, prefer Gemini-style endpoint and payload
    if (geminiKey) {
      // Use Gemini generateContent endpoint for flash model by default
      const defaultGeminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'
      endpointToCall = process.env.GEN_AI_ENDPOINT || defaultGeminiEndpoint
      // Build the Gemini payload shape and include generationConfig (correct place for limits)
      payload = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {}
      }
      if (maxTokens) payload.generationConfig.maxOutputTokens = Number(maxTokens)
      // update body on fetchOptions
      fetchOptions.body = JSON.stringify(payload)
      // set header name for API key
      fetchOptions.headers['X-goog-api-key'] = geminiKey
      // Some Gemini endpoints may require additional headers; keep Content-Type.
    } else if (bearerKey) {
      fetchOptions.headers['Authorization'] = `Bearer ${bearerKey}`
    }

    console.log('[pages api] calling endpoint:', endpointToCall)

    let r = await fetch(endpointToCall, fetchOptions)
    let raw = await r.text()

    // If Google returned 404 on v1beta2, try v1 endpoint as a fallback
    if (r.status === 404 && endpointToCall.includes('v1beta2')) {
      const alt = endpointToCall.replace('v1beta2', 'v1')
      console.log('[pages api] received 404 from v1beta2, retrying with', alt)
      r = await fetch(alt, fetchOptions)
      raw = await r.text()
    }

    // Log response for debugging
    console.log('[pages api] provider status:', r.status, 'body len:', raw ? raw.length : 0)

    // Helpful error if endpoint not found (common when API not enabled or key lacks permissions)
    if (r.status === 404) {
      return res.status(502).json({
        error: 'Provider returned 404 (Not Found). Ensure the Generative Language API is enabled, the model name is correct and the API key has access. Check billing and key restrictions in Google Cloud Console.',
        endpoint: endpointToCall,
        providerStatus: r.status,
        rawBodyLength: raw ? raw.length : 0
      })
    }

    try {
      const data = raw ? JSON.parse(raw) : null
      return res.status(r.status).json(data)
    } catch (err) {
      // return raw text to client for debugging
      return res.status(r.status).json({ text: raw })
    }
  } catch (err: any) {
    console.error('[pages api] error', err)
    return res.status(500).json({ error: err?.message || String(err) })
  }
}
