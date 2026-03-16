"use client"

import { useState, useEffect } from "react"
import type { Riesgo, ArchivoAdjunto } from "@/lib/types"
import { calcularNivelRiesgo, interpretacionFromValor } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from "@/components/ui/select"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
// removed ScrollArea to avoid nested scrollbars
import { Switch } from "@/components/ui/switch"
import { useClasificaciones } from "@/hooks/use-clasificaciones"
import { Spinner } from "@/components/ui/spinner"
import { Download, X } from "lucide-react"
import { aiAutocomplete } from '@/lib/use-ai-autocomplete'

interface RiskFormProps {
  riesgo: Riesgo | null
  open: boolean
  onClose: () => void
  onSave: (riesgo: Partial<Riesgo>) => void
}

const CLASIFICACIONES = [
  "Biológico",
  "Químico",
  "Físico",
  "Mecánico",
  "Ergonómico",
  "Eléctrico",
  "Psicosocial",
  "Locativo",
  "Natural"
]

const DEFAULT_RIESGO: Partial<Riesgo> = {
  proceso: "",
  tipo_proceso: "ASISTENCIAL",
  zona: "",
  actividad: "",
  tarea: "",
  cargo: "",
  rutinario: true,
  clasificacion: "",
  peligro_desc: "",
  efectos: "",
  deficiencia: 0,
  exposicion: 0,
  consecuencia: 0,
  controles: "",
  intervencion: "",
  fecha: new Date().toISOString().split('T')[0],
  seguimiento: ""
}

export function RiskForm({ riesgo, open, onClose, onSave }: RiskFormProps) {
  const [formData, setFormData] = useState<Partial<Riesgo>>(DEFAULT_RIESGO)
  const [isSaving, setIsSaving] = useState(false)
  const { clasificaciones, addClasificacion } = useClasificaciones()
  const [addingClasificacion, setAddingClasificacion] = useState(false)
  const [newClasificacion, setNewClasificacion] = useState("")

  useEffect(() => {
    if (riesgo) {
      setFormData(riesgo)
    } else {
      setFormData(DEFAULT_RIESGO)
    }
  }, [riesgo, open])

  // ensure classification exists in persisted list when editing
  useEffect(() => {
    if (riesgo && riesgo.clasificacion) {
      addClasificacion(riesgo.clasificacion)
    }
  }, [riesgo, addClasificacion])

  const handleChange = (field: keyof Riesgo, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Calculate derived fields: Probabilidad = Deficiencia * Exposición
  useEffect(() => {
    const nd = Number(formData.deficiencia || 0)
    const ne = Number(formData.exposicion || 0)
    const prob = nd * ne
    const interpretProb = (p: number) => {
      if (p === 0) return ""
      if (p <= 4) return "Bajo"
      if (p <= 8) return "Medio"
      if (p <= 20) return "Alto"
      return "Muy Alto"
    }
    setFormData(prev => ({ ...prev, probabilidad: prob, interpretacion_probabilidad: interpretProb(prob) }))
  }, [formData.deficiencia, formData.exposicion])

  // Nivel Riesgo = Probabilidad * Consecuencia
  useEffect(() => {
    const prob = Number(formData.probabilidad || 0)
    const nc = Number(formData.consecuencia || 0)
    const nivel = prob * nc
    // interpretation mapping
    const interpret = (val: number) => {
      if (val === 0) return ""
      if (val <= 20) return "IV"
      if (val <= 120) return "III"
      if (val <= 500) return "II"
      if (val <= 4000) return "I"
      return "I"
    }
    setFormData(prev => ({ ...prev, nivel_riesgo: nivel, interpretacion_nivel_riesgo: interpret(nivel) }))
  }, [formData.probabilidad, formData.consecuencia])

  // Aceptabilidad based on interpretación nivel riesgo
  useEffect(() => {
    const interp = formData.interpretacion_nivel_riesgo as string | undefined
    const mapAceptabilidad = (i?: string) => {
      if (!i) return ""
      switch (i) {
        case "IV": return "Aceptable"
        case "III": return "Mejorable"
        case "II": return "Aceptable con Control Especifico"
        case "I": return "No Aceptable"
        default: return ""
      }
    }
    setFormData(prev => ({ ...prev, aceptabilidad: mapAceptabilidad(interp) }))
  }, [formData.interpretacion_nivel_riesgo])

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e && typeof (e as any).preventDefault === "function") (e as any).preventDefault()
    setIsSaving(true)

    // Basic validation required by gestión de riesgos (mínimos)
    const missing: string[] = []
    if (!formData.peligro_desc || String(formData.peligro_desc).trim() === "") missing.push("Descripción del peligro")
    if (!formData.clasificacion || String(formData.clasificacion).trim() === "") missing.push("Clasificación")
    if (!formData.efectos || String(formData.efectos).trim() === "") missing.push("Efectos")

    const expos = Number(formData.exposicion || 0)
    if (!expos || expos < 1 || expos > 4) {
      missing.push("Exposición (debe ser entre 1 y 4)")
    }

    if (missing.length > 0) {
      window.alert("Complete los campos requeridos: " + missing.join(", "))
      setIsSaving(false)
      return
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600))

    const today = new Date().toISOString().split('T')[0]
    const payload: Partial<Riesgo> = { ...formData }
    if (riesgo) {
      // If user set a fecha_ejecucion keep it; otherwise default to today
      payload.fecha_ejecucion = payload.fecha_ejecucion || today
    } else {
      payload.fecha = payload.fecha || today
    }

    onSave(payload)
    setIsSaving(false)
    onClose()
  }

  const downloadBlob = (html: string, filename: string) => {
    const blob = new Blob([html], { type: "application/msword" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const [isAutoLoading, setIsAutoLoading] = useState(false)

  // File attachments (temporary client-side previews)
  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newFiles: ArchivoAdjunto[] = Array.from(files).map((file, idx) => ({
      id: `${Date.now()}_${idx}`,
      nombre: file.name,
      tipo: file.type || 'application/octet-stream',
      tamano: file.size,
      url: URL.createObjectURL(file),
      fechaSubida: new Date().toISOString()
    }))
    setFormData(prev => ({ ...prev, archivos: [...(prev.archivos || []), ...newFiles] }))
  }

  const removeArchivo = (id: string) => {
    setFormData(prev => {
      const archivos = prev.archivos || []
      const found = archivos.find(a => a.id === id)
      if (found) {
        try { URL.revokeObjectURL(found.url) } catch { /* ignore */ }
      }
      return { ...prev, archivos: archivos.filter(a => a.id !== id) }
    })
  }

  useEffect(() => {
    return () => {
      try {
        (formData.archivos || []).forEach(a => { if (a.url) URL.revokeObjectURL(a.url) })
      } catch { }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const extractTextFromAiResponse = (data: any) => {
    if (!data) return ''
    if (typeof data === 'string') return data

    // Prefer normalized extracted text from server-side helper
    if (data._extractedText && typeof data._extractedText === 'string') return data._extractedText

    // Google Gemini-style: data.candidates[0].content may contain structured output
    if (data.candidates && Array.isArray(data.candidates) && data.candidates[0]) {
      const c = data.candidates[0]
      if (c.finishReason === 'MAX_TOKENS') {
        return JSON.stringify({ _warning: 'MAX_TOKENS', candidate: c })
      }
      if (c.content) {
        if (typeof c.content === 'string') return c.content
        // newer helper may already have normalized content to a string
        if (typeof c.content === 'object' && c.content.parts && Array.isArray(c.content.parts)) {
          return c.content.parts.map((p: any) => p?.text || '').join('')
        }
        if (c.content.output && Array.isArray(c.content.output) && c.content.output[0] && c.content.output[0].content) return c.content.output[0].content
        if (c.content[0] && c.content[0].text) return c.content[0].text
        if (c.content.text) return c.content.text
        if (Object.keys(c.content).length === 0) return ''
      }
    }

    // Fallbacks for other providers
    if (data.output && Array.isArray(data.output) && data.output[0] && data.output[0].content) return data.output[0].content
    if (data.choices && data.choices[0]) {
      return data.choices[0].text || (data.choices[0].message && data.choices[0].message.content) || JSON.stringify(data)
    }
    try { return JSON.stringify(data) } catch { return String(data) }
  }

  const handleAutoComplete = async () => {
    try {
      setIsAutoLoading(true)
      const summary = `Proceso: ${formData.proceso || ''}. Zona: ${formData.zona || ''}. Actividad: ${formData.actividad || ''}. Tarea: ${formData.tarea || ''}. Cargo: ${formData.cargo || ''}. Responsable: ${formData.individuo || ''}.`;
      const prompt = `Eres un asistente experto en gestión de riesgos. A partir de la siguiente información general:\n${summary}\nGenera valores sugeridos para los siguientes campos del formulario (devuelve JSON con claves):\npeligro_desc, efectos, controles, intervencion, seguimiento, peor_consecuencia, control_eliminacion, control_sustitucion, control_ingenieria, control_admin, epp\nDevuelve sólo JSON válido.`

      const resp = await aiAutocomplete(prompt, { maxTokens: 600 })
      const text = extractTextFromAiResponse(resp)

      let parsed: any = null
      try { parsed = JSON.parse(text) } catch (e) { parsed = null }

      if (parsed && typeof parsed === 'object') {
        setFormData(prev => ({
          ...prev,
          peligro_desc: parsed.peligro_desc || parsed.peligro || prev.peligro_desc,
          efectos: parsed.efectos || prev.efectos,
          controles: parsed.controles || prev.controles,
          intervencion: parsed.intervencion || prev.intervencion,
          seguimiento: parsed.seguimiento || prev.seguimiento,
          peor_consecuencia: parsed.peor_consecuencia || prev.peor_consecuencia,
          control_eliminacion: parsed.control_eliminacion || prev.control_eliminacion,
          control_sustitucion: parsed.control_sustitucion || prev.control_sustitucion,
          control_ingenieria: parsed.control_ingenieria || prev.control_ingenieria,
          control_admin: parsed.control_admin || prev.control_admin,
          epp: parsed.epp || prev.epp
        }))
      } else if (text && text.trim()) {
        const get = (label: string) => {
          const re = new RegExp(label + '\\s*[:\\-]?\\s*([\\s\\S]*?)(?:\\n\\s*\\n|$)', 'i')
          const m = text.match(re)
          return m ? m[1].trim() : ''
        }
        const peligro = get('Peligro') || get('Descripción del peligro') || text
        const efectos = get('Efectos') || ''
        const controles = get('Controles') || ''
        const intervencion = get('Intervención') || get('Medidas de intervención') || ''

        setFormData(prev => ({
          ...prev,
          peligro_desc: peligro || prev.peligro_desc,
          efectos: efectos || prev.efectos,
          controles: controles || prev.controles,
          intervencion: intervencion || prev.intervencion,
        }))
      } else {
        window.alert('La IA no devolvió contenido útil.')
      }
    } catch (err: any) {
      console.error('AI autocomplete error', err)
      window.alert('Error al autocompletar: ' + (err?.message || String(err)))
    } finally {
      setIsAutoLoading(false)
    }
  }

  const generateFormHtml = (data: Partial<Riesgo>) => {
    const safe = (v: any) => (v === undefined || v === null ? "" : String(v))
    const { nivel, valor } = calcularNivelRiesgo(Number(data.deficiencia || 0), Number(data.exposicion || 0), Number(data.consecuencia || 0))
    const interp = (data.interpretacion_nivel_riesgo as string) || interpretacionFromValor(valor)
    const listify = (t?: any) => (t ? String(t).split(/\r?\n/).map(s => s.trim()).filter(Boolean).map(s => `<li>${s}</li>`).join('') : '')
    return `<!doctype html><html><head><meta charset="utf-8"/><title>Informe Riesgo ${safe(data.id)}</title>
      <style>
        body{font-family:Arial, Helvetica, sans-serif;color:#111827;margin:28px;line-height:1.35}
        h2{font-size:14px;margin:18px 0 8px;color:#0f172a}
        table{width:100%;border-collapse:collapse;margin-top:6px}
        th,td{padding:8px 10px;text-align:left;vertical-align:top;border:1px solid #e6e7eb;font-size:12px}
        th{background:#fff;font-weight:600;width:30%}
        .bullet{margin:6px 0 0 18px}
      </style>
    </head><body>
      <h2>Información general</h2>
      <table>
        <tr><th>Área / Proceso</th><td>${safe(data.proceso)}</td></tr>
        <tr><th>Zona / Lugar</th><td>${safe(data.zona)}</td></tr>
        <tr><th>Responsable / Cargo</th><td>${safe(data.individuo)} — ${safe(data.cargo)}</td></tr>
        <tr><th>Fecha elaboración</th><td>${safe(data.fecha)}</td></tr>
        <tr><th>Fecha actualización</th><td>${safe(data.fecha_ejecucion)}</td></tr>
      </table>
      <h2>Clasificación del riesgo</h2>
      <table>
        <tr><th>Clasificación</th><td>${safe(data.clasificacion)}</td></tr>
        <tr><th>Deficiencia · Exposición · Consecuencia</th><td>${safe(data.deficiencia)} · ${safe(data.exposicion)} · ${safe(data.consecuencia)}</td></tr>
        <tr><th>Nivel calculado</th><td>${nivel} (${valor}) — Interpretación: ${interp}</td></tr>
      </table>
      <h2>Descripción del peligro</h2>
      <ul class="bullet">${listify(data.peligro_desc)}</ul>
      <h2>Efectos</h2>
      <ul class="bullet">${listify(data.efectos)}</ul>
      <h2>Controles y Medidas</h2>
      <p>${safe(data.controles)}</p>
      <p>${safe(data.intervencion) || safe(data.seguimiento)}</p>
    </body></html>`
  }

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const html = generateFormHtml(formData)
    const id = formData.id ? `_${formData.id}` : ""
    downloadBlob(html, `informe_riesgo${id}.doc`)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-card">
        <DialogHeader className="p-4 pb-2 bg-primary text-primary-foreground">
          <div className="flex items-start justify-between w-full">
            <div>
              <DialogTitle className="text-xl">
                {riesgo ? "Editar Riesgo" : "Nuevo Riesgo"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80">
                {riesgo 
                  ? `Editando riesgo ID: ${riesgo.id}` 
                  : "Complete el formulario para registrar un nuevo riesgo"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>Cancelar</Button>
              <Button variant="ghost" size="sm" onClick={() => handleDownload()} disabled={isSaving}><Download className="h-4 w-4 mr-2" />Descargar</Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => handleSubmit(undefined)} disabled={isSaving}>
                {isSaving ? "Guardando..." : (riesgo ? "Actualizar" : "Guardar")}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[calc(90vh-180px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Document Header */}
            <div className="p-4 bg-card border border-border rounded-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">SISTEMAS INTEGRADOS GESTIÓN</div>
                  <div className="text-xs">CLINICA SANTA MARIA S.A.S.</div>
                  <div className="text-xs font-medium mt-2">MATRIZ DE IDENTIFICACIÓN DE PELIGROS Y VALORACIÓN DE RIESGOS</div>
                </div>
                <div className="text-right text-xs space-y-1">
                  <div>Codigo: 45.17-FOR-38</div>
                  <div>Versión: 02</div>
                  <div>Fecha: 26/4/2019</div>
                  <div>Pagina: 1 de 1</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <Input value={formData.proceso || ""} onChange={(e) => handleChange("proceso", e.target.value)} placeholder="Área / Proceso" />
                  <div className="mt-2">
                    <div className="text-xs font-medium">FECHA ELABORACIÓN</div>
                    <Input type="date" value={formData.fecha || ""} disabled className="cursor-not-allowed" />
                  </div>
                </div>
                <div>
                  <Input value={(formData.individuo as string) || ""} onChange={(e) => handleChange("individuo", e.target.value)} placeholder="Responsable" />
                  <div className="mt-2">
                    <div className="text-xs font-medium">FECHA ACTUALIZACIÓN</div>
                    <Input type="date" value={(formData.fecha_ejecucion as string) || ""} disabled className="cursor-not-allowed" />
                  </div>
                </div>
              </div>
            </div>
            {/* Header removed: Nivel de Riesgo Calculado */}

            {/* Información General */}
            <div className="p-4 bg-card border border-border rounded-md">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground mb-3">Información General</h3>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={handleAutoComplete} disabled={isAutoLoading}>
                    {isAutoLoading ? <Spinner className="h-4 w-4" /> : 'Autocompletar'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    // apply template values then run autocomplete using those values
                    const template = {
                      proceso: 'Mantenimiento',
                      zona: 'Cuarto de Máquinas',
                      actividad: 'Mantenimiento de equipos eléctricos',
                      tarea: 'Revisión y reparación de sistemas eléctricos de media y baja tensión',
                      cargo: 'Técnico Electricista',
                      rutinario: false,
                      individuo: 'DS',
                      fecha: '2024-01-30'
                    }
                    setFormData(prev => ({ ...prev, ...template }))
                    // build prompt from the same template values and call AI directly
                    setIsAutoLoading(true)
                    try {
                      const summary = `Proceso: ${template.proceso}. Zona: ${template.zona}. Actividad: ${template.actividad}. Tarea: ${template.tarea}. Cargo: ${template.cargo}. Responsable: ${template.individuo}.`;
                      const prompt = `Eres un asistente experto en gestión de riesgos. A partir de la siguiente información general:\n${summary}\nGenera valores sugeridos para los siguientes campos del formulario (devuelve JSON con claves):\npeligro_desc, efectos, controles, intervencion, seguimiento, peor_consecuencia, control_eliminacion, control_sustitucion, control_ingenieria, control_admin, epp\nDevuelve sólo JSON válido.`
                      const resp = await aiAutocomplete(prompt, { maxTokens: 600 })
                      const text = extractTextFromAiResponse(resp)
                      let parsed: any = null
                      try { parsed = JSON.parse(text) } catch { parsed = null }
                      if (parsed && typeof parsed === 'object') {
                        setFormData(prev => ({
                          ...prev,
                          peligro_desc: parsed.peligro_desc || parsed.peligro || prev.peligro_desc,
                          efectos: parsed.efectos || prev.efectos,
                          controles: parsed.controles || prev.controles,
                          intervencion: parsed.intervencion || prev.intervencion,
                          seguimiento: parsed.seguimiento || prev.seguimiento,
                          peor_consecuencia: parsed.peor_consecuencia || prev.peor_consecuencia,
                          control_eliminacion: parsed.control_eliminacion || prev.control_eliminacion,
                          control_sustitucion: parsed.control_sustitucion || prev.control_sustitucion,
                          control_ingenieria: parsed.control_ingenieria || prev.control_ingenieria,
                          control_admin: parsed.control_admin || prev.control_admin,
                          epp: parsed.epp || prev.epp
                        }))
                      } else if (text && text.trim()) {
                        const get = (label: string) => {
                          const re = new RegExp(label + '\\s*[:\\-]?\\s*([\\s\\S]*?)(?:\\n\\s*\\n|$)', 'i')
                          const m = text.match(re)
                          return m ? m[1].trim() : ''
                        }
                        const peligro = get('Peligro') || get('Descripción del peligro') || text
                        const efectos = get('Efectos') || ''
                        const controles = get('Controles') || ''
                        const intervencion = get('Intervención') || get('Medidas de intervención') || ''
                        setFormData(prev => ({ ...prev, peligro_desc: peligro || prev.peligro_desc, efectos: efectos || prev.efectos, controles: controles || prev.controles, intervencion: intervencion || prev.intervencion }))
                      } else {
                        window.alert('La IA no devolvió contenido útil.')
                      }
                    } catch (err: any) {
                      console.error('AI template autocomplete error', err)
                      window.alert('Error al autocompletar plantilla: ' + (err?.message || String(err)))
                    } finally {
                      setIsAutoLoading(false)
                    }
                  }}>
                    Autocompletar Plantilla SIG
                  </Button>
                </div>
              </div>
              <div className="grid gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="proceso">Proceso</FieldLabel>
                    <Input id="proceso" value={formData.proceso || ""} onChange={(e) => handleChange("proceso", e.target.value)} placeholder="Área / Proceso" className="bg-background" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="tipo_proceso">Tipo de Proceso</FieldLabel>
                    <Select value={(formData.tipo_proceso as string) || "ASISTENCIAL"} onValueChange={(v) => handleChange("tipo_proceso", v)}>
                      <SelectTrigger className="bg-background w-full"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ASISTENCIAL">ASISTENCIAL</SelectItem>
                        <SelectItem value="OPERATIVO">OPERATIVO</SelectItem>
                        <SelectItem value="ADMINISTRATIVO">ADMINISTRATIVO</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="zona">Zona / Lugar</FieldLabel>
                    <Input id="zona" value={formData.zona || ""} onChange={(e) => handleChange("zona", e.target.value)} placeholder="Zona / Lugar" className="bg-background" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="actividad">Actividades</FieldLabel>
                    <Textarea id="actividad" value={formData.actividad || ""} onChange={(e) => handleChange("actividad", e.target.value)} placeholder="Describa las actividades..." rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="tarea">Tarea</FieldLabel>
                    <Textarea id="tarea" value={formData.tarea || ""} onChange={(e) => handleChange("tarea", e.target.value)} placeholder="Describa la tarea específica..." rows={2} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="cargo">Cargo</FieldLabel>
                      <Input id="cargo" value={formData.cargo || ""} onChange={(e) => handleChange("cargo", e.target.value)} placeholder="Cargo" className="bg-background" />
                    </Field>
                  </FieldGroup>

                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="rutinario">Actividad Rutinaria</FieldLabel>
                      <div className="flex items-center h-10 gap-2">
                        <Switch id="rutinario" checked={!!formData.rutinario} onCheckedChange={(checked) => handleChange("rutinario", checked)} />
                        <span className="text-sm text-muted-foreground">{formData.rutinario ? "Sí" : "No"}</span>
                      </div>
                    </Field>
                  </FieldGroup>
                </div>

                {/* Fecha removed as requested */}
              </div>
            </div>
            {/* Información del Peligro */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Información del Peligro</h3>
              <div className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="peligro_desc">Descripción del Peligro *</FieldLabel>
                    <Textarea
                      id="peligro_desc"
                      value={formData.peligro_desc || ""}
                      onChange={(e) => handleChange("peligro_desc", e.target.value)}
                      placeholder="Describa detalladamente el peligro identificado..."
                      required
                      rows={4}
                      className="bg-background resize-y"
                    />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="clasificacion">Clasificación del Peligro *</FieldLabel>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Select
                        value={formData.clasificacion || ""}
                        onValueChange={(value) => {
                          if (value === "__add__") {
                            setAddingClasificacion(true)
                            return
                          }
                          handleChange("clasificacion", value)
                        }}
                      >
                        <SelectTrigger className="bg-background w-full sm:w-auto">
                          <SelectValue placeholder="Seleccione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clasificaciones.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                          <SelectSeparator />
                          <SelectItem value="__add__">+ Agregar nueva categoría</SelectItem>
                        </SelectContent>
                      </Select>

                      {addingClasificacion && (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="Nueva categoría"
                            value={newClasificacion}
                            onChange={(e) => setNewClasificacion(e.target.value)}
                            className="bg-background"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const v = newClasificacion.trim()
                              if (!v) return
                              addClasificacion(v)
                              handleChange("clasificacion", v)
                              setNewClasificacion("")
                              setAddingClasificacion(false)
                            }}
                          >Agregar</Button>
                          <Button size="sm" variant="outline" onClick={() => setAddingClasificacion(false)}>Cancelar</Button>
                        </div>
                      )}
                    </div>
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="efectos">Efectos Posibles *</FieldLabel>
                    <Textarea
                      id="efectos"
                      value={formData.efectos || ""}
                      onChange={(e) => handleChange("efectos", e.target.value)}
                      placeholder="Describa los posibles efectos en la salud..."
                      required
                      rows={3}
                      className="bg-background resize-y"
                    />
                  </Field>
                </FieldGroup>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="p-4 rounded-lg border border-border bg-muted/30">
              <h3 className="font-semibold text-foreground mb-4">Evaluación del Riesgo</h3>
              <div className="grid gap-4 sm:grid-cols-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="deficiencia">Deficiencia (ND)</FieldLabel>
                    <Input
                      id="deficiencia"
                      type="number"
                      min={0}
                      step={1}
                      value={String(formData.deficiencia ?? "")}
                      onChange={(e) => handleChange("deficiencia", parseInt(e.target.value || "0"))}
                      className="bg-background"
                    />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="exposicion">Exposición (NE)</FieldLabel>
                    <Input
                      id="exposicion"
                      type="number"
                      min={1}
                      max={4}
                      step={1}
                      value={String(formData.exposicion ?? "")}
                      onChange={(e) => handleChange("exposicion", parseInt(e.target.value || "1"))}
                      className="bg-background"
                    />
                  </Field>
                </FieldGroup>
                {/* Mostrar Probabilidad como bloque no editable para evitar que el usuario intente escribir */}
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="probabilidad">Nivel Probabilidad (NP)</FieldLabel>
                    <div id="probabilidad" className="inline-block"><Badge>{String(formData.probabilidad ?? "")}</Badge></div>
                  </Field>
                </FieldGroup>

                {/* Consecuencia (NC) ahora después de NP */}
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="consecuencia">Consecuencia (NC)</FieldLabel>
                    <Input
                      id="consecuencia"
                      type="number"
                      min={0}
                      step={1}
                      value={String(formData.consecuencia ?? "")}
                      onChange={(e) => handleChange("consecuencia", parseInt(e.target.value || "0"))}
                      className="bg-background"
                    />
                  </Field>
                </FieldGroup>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="interpretacion_probabilidad">Interpretación Nivel Probabilidad</FieldLabel>
                    <div id="interpretacion_probabilidad" className="inline-block">
                      <Badge>{(formData.interpretacion_probabilidad as string) || ""}</Badge>
                    </div>
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="nivel_riesgo">Nivel Riesgo (valor)</FieldLabel>
                    <div id="nivel_riesgo" className="bg-background border border-border rounded px-3 py-2">{String(formData.nivel_riesgo ?? "")}</div>
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="interpretacion_nivel_riesgo">Interpretación Nivel Riesgo</FieldLabel>
                    <div id="interpretacion_nivel_riesgo">
                      <Badge>{(formData.interpretacion_nivel_riesgo as string) || ""}</Badge>
                    </div>
                  </Field>
                </FieldGroup>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FieldGroup>
                  <Field>
                      <FieldLabel htmlFor="aceptabilidad">Aceptabilidad Del Riesgo</FieldLabel>
                      <div id="aceptabilidad" className="bg-background border border-border rounded px-3 py-2">{(formData.aceptabilidad as string) || ""}</div>
                    </Field>
                </FieldGroup>
              </div>
            </div>

            {/* Controles Existentes (tercer cuadro) */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Controles Existentes</h3>
              <div className="space-y-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="fuente">Fuente</FieldLabel>
                    <Input id="fuente" value={(formData.fuente as string) || ""} onChange={(e) => handleChange("fuente", e.target.value)} placeholder="Fuente del control" className="bg-background" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="medio">Medio</FieldLabel>
                    <Textarea id="medio" value={(formData.medio as string) || ""} onChange={(e) => handleChange("medio", e.target.value)} placeholder="Describa medios o recursos" rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>

                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="individuo">Individuo</FieldLabel>
                    <Textarea id="individuo" value={(formData.individuo as string) || ""} onChange={(e) => handleChange("individuo", e.target.value)} placeholder="Persona(s) responsables / expuestas" rows={2} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
              </div>
            </div>

            {/* Quinto cuadro: Criterios para Establecer Controles */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Criterios para Establecer Controles</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="num_expuestos">Número de Expuestos</FieldLabel>
                    <Input id="num_expuestos" type="number" min={0} value={String(formData.num_expuestos ?? "")} onChange={(e) => handleChange("num_expuestos", parseInt(e.target.value || "0"))} className="bg-background" />
                  </Field>
                </FieldGroup>
                <FieldGroup className="sm:col-span-2">
                  <Field>
                    <FieldLabel htmlFor="peor_consecuencia">Peor Consecuencia</FieldLabel>
                    <Textarea id="peor_consecuencia" value={(formData.peor_consecuencia as string) || ""} onChange={(e) => handleChange("peor_consecuencia", e.target.value)} rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
              </div>
              <div className="mt-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="requisito_legal">Existencia de Requisito Legal o Específico</FieldLabel>
                    <Select value={(formData.requisito_legal as string) || "none"} onValueChange={(v) => handleChange("requisito_legal", v === "none" ? "" : v)}>
                      <SelectTrigger className="bg-background w-full"><SelectValue placeholder="Seleccione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">--</SelectItem>
                        <SelectItem value="Si">Si</SelectItem>
                        <SelectItem value="No">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </FieldGroup>
              </div>
            </div>

            {/* Sexto cuadro: Medidas de Intervención */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Medidas de Intervención</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="control_eliminacion">Eliminación</FieldLabel>
                    <Input id="control_eliminacion" value={(formData.control_eliminacion as string) || ""} onChange={(e) => handleChange("control_eliminacion", e.target.value)} className="bg-background" />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="control_sustitucion">Sustitución</FieldLabel>
                    <Input id="control_sustitucion" value={(formData.control_sustitucion as string) || ""} onChange={(e) => handleChange("control_sustitucion", e.target.value)} className="bg-background" />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="control_ingenieria">Controles de Ingeniería</FieldLabel>
                    <Textarea id="control_ingenieria" value={(formData.control_ingenieria as string) || ""} onChange={(e) => handleChange("control_ingenieria", e.target.value)} rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="senalizacion">Señalización / Advertencia</FieldLabel>
                    <Input id="senalizacion" value={(formData.control_admin as string) || ""} onChange={(e) => handleChange("control_admin", e.target.value)} className="bg-background" />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="control_admin">Controles Administrativos</FieldLabel>
                    <Textarea id="control_admin_text" value={(formData.control_admin as string) || ""} onChange={(e) => handleChange("control_admin", e.target.value)} rows={3} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="epp">Equipos / EPP</FieldLabel>
                    <Textarea id="epp" value={(formData.epp as string) || ""} onChange={(e) => handleChange("epp", e.target.value)} rows={2} className="bg-background resize-y" />
                  </Field>
                </FieldGroup>
              </div>

              <div className="mt-4 border-t pt-4">
                <h4 className="font-medium">Seguimiento Medidas De Intervención</h4>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="intervencion">Intervención</FieldLabel>
                      <Textarea id="intervencion" value={formData.intervencion || ""} onChange={(e) => handleChange("intervencion", e.target.value)} rows={2} className="bg-background resize-y" />
                    </Field>
                  </FieldGroup>
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="fecha_ejecucion">Fecha de Ejecución</FieldLabel>
                      <Input id="fecha_ejecucion" type="date" value={(formData.fecha_ejecucion as string) || ""} onChange={(e) => handleChange("fecha_ejecucion", e.target.value)} className="bg-background" />
                    </Field>
                  </FieldGroup>
                </div>
              </div>
            </div>
            {/* Archivos adjuntos */}
            <div className="p-4 bg-card border border-border rounded-md">
              <h3 className="font-semibold text-foreground mb-3">Archivos Adjuntos</h3>
              <div className="space-y-2">
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFiles(e.target.files)}
                  className="w-full text-sm"
                />

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(formData.archivos || []).map((a) => (
                    <div key={a.id} className="border border-border rounded-md p-2 relative bg-background">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeArchivo(a.id) }}
                        className="absolute right-2 top-2 text-muted-foreground"
                        aria-label={`Eliminar ${a.nombre}`}
                      >
                        <X className="h-4 w-4" />
                      </button>

                      {a.tipo.startsWith('image/') ? (
                        <a href={a.url} target="_blank" rel="noreferrer">
                          <img src={a.url} alt={a.nombre} className="w-full h-28 object-cover rounded" />
                        </a>
                      ) : a.tipo === 'application/pdf' ? (
                        <a href={a.url} target="_blank" rel="noreferrer" className="block w-full h-28 overflow-hidden">
                          <embed src={a.url} type="application/pdf" className="w-full h-28" />
                        </a>
                      ) : (
                        <a href={a.url} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full h-28 text-sm text-muted-foreground">
                          {a.nombre}
                        </a>
                      )}

                      <div className="mt-2 text-xs text-muted-foreground">{a.nombre} · {Math.round((a.tamano||0)/1024)} KB</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>

        
      </DialogContent>
    </Dialog>
  )
}
