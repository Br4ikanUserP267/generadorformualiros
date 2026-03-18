import { aiAutocomplete } from './use-ai-autocomplete'

export type FormSetter<T> = (updater: (prev: T) => T) => void

// Given a form data object and an array of target keys to fill,
// call AI to suggest values and merge them into the form via the setter.
// fields: array of keys to request (e.g. ['peligro_desc','efectos','controles'])
export async function aiFillForm<T extends Record<string, any>>(
  formData: T,
  setFormData: FormSetter<T>,
  fields: string[],
  opts?: { maxTokens?: number; templateSummary?: string }
) {
  const summary = opts?.templateSummary || Object.keys(formData).slice(0,5).map(k => `${k}: ${String((formData as any)[k] || '')}`).join('. ')
  const prompt = `Eres un asistente experto en gestión de riesgos y formularios. A partir de la siguiente información:
${summary}
Devuelve sólo JSON válido con las claves: ${fields.join(', ')}. Si no puedes completar una clave, devuélvela vacía.`

  const resp = await aiAutocomplete(prompt, { maxTokens: opts?.maxTokens || 600 })

  // aiAutocomplete may return parsed object or raw string; prefer `_extractedText` when available
  let parsed: any = null
  if (resp && typeof resp === 'object') {
    if ((resp as any)._extractedText && typeof (resp as any)._extractedText === 'string') {
      try { parsed = JSON.parse((resp as any)._extractedText) } catch (e) { parsed = null }
    }
    if (!parsed) parsed = resp
  }
  if (!parsed && typeof resp === 'string') {
    try { parsed = JSON.parse(resp) } catch (e) { parsed = null }
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('La IA no devolvió JSON válido')
  }

  // Merge only requested fields
  const toMerge: Partial<T> = {}
  for (const f of fields) {
    if (parsed[f] !== undefined) (toMerge as any)[f] = parsed[f]
  }

  setFormData(prev => ({ ...prev, ...toMerge }))
}
