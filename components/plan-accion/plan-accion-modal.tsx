"use client"

import React, { useState, useEffect } from 'react'
import {
  X,
  Save,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  User,
  MapPin,
  HelpCircle,
  DollarSign,
  CheckCircle2,
  Clock,
  ClipboardList,
  Shield,
  Layers,
} from 'lucide-react'
import { apiFetch } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { getClasificacionStyle } from '@/lib/gtc45-utils'

interface ActionItem {
  id?: string
  que: string
  porQue?: string
  donde?: string
  cuandoInicio?: string
  cuandoFin?: string
  como?: string
  cuanto?: string
  responsable?: string
  estado?: 'PENDIENTE' | 'EN_PROCESO' | 'EJECUTADO' | 'CANCELADO' | string
}

interface PlanAccionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  danger: any | null
  onSaved: () => void
}

export function PlanAccionModal({
  open,
  onOpenChange,
  danger,
  onSaved,
}: PlanAccionModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actions, setActions] = useState<ActionItem[]>([])

  const createDefaultItem = (d: any): ActionItem => ({
    que: '',
    porQue: '',
    donde: d?.areas && d.areas.length > 0 ? d.areas.join(', ') : '',
    cuandoInicio: new Date().toISOString().split('T')[0],
    cuandoFin: '',
    como: '',
    cuanto: '',
    responsable: '',
    estado: 'PENDIENTE',
  })

  // Load existing action plans when modal opens
  useEffect(() => {
    if (open && danger?.id) {
      loadActions()
    } else if (open) {
      setActions([createDefaultItem(danger)])
    } else {
      setActions([])
    }
  }, [open, danger])

  const loadActions = async () => {
    if (!danger?.id) return
    setLoading(true)
    try {
      const res = await apiFetch(`/api/plan-accion/danger/${danger.id}`)
      if (res.ok) {
        const data = await res.json()
        let mapped: ActionItem[] = (data.planesAccion || []).map((a: any) => ({
          id: a.id,
          que: a.que || '',
          porQue: a.porQue || '',
          donde: a.donde || (danger?.areas && danger.areas.length > 0 ? danger.areas.join(', ') : ''),
          cuandoInicio: a.cuandoInicio ? a.cuandoInicio.split('T')[0] : new Date().toISOString().split('T')[0],
          cuandoFin: a.cuandoFin ? a.cuandoFin.split('T')[0] : '',
          como: a.como || '',
          cuanto: a.cuanto || '',
          responsable: a.responsable || '',
          estado: a.estado || 'PENDIENTE',
        }))

        // Automatically provide all 5W2H questions if no prior record exists
        if (mapped.length === 0) {
          mapped = [createDefaultItem(danger)]
        }

        setActions(mapped)
      }
    } catch (err) {
      console.error('Error loading actions:', err)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las preguntas del plan 5W2H.',
        variant: 'destructive',
      })
      setActions([createDefaultItem(danger)])
    } finally {
      setLoading(false)
    }
  }

  const handleAddAction = () => {
    setActions((prev) => [...prev, createDefaultItem(danger)])
  }

  const handleRemoveAction = (index: number) => {
    if (actions.length <= 1) {
      // Clear instead of removing last item so 5W2H questions always remain visible
      setActions([createDefaultItem(danger)])
      return
    }
    setActions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateField = (index: number, field: keyof ActionItem, value: any) => {
    setActions((prev) => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation: ensure all actions have 'que'
    const invalid = actions.some((a) => !a.que.trim())
    if (invalid) {
      toast({
        title: 'Campo obligatorio',
        description: 'Debe responder la pregunta "¿QUÉ se va a hacer?" para guardar el plan 5W2H.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)
    try {
      const res = await apiFetch(`/api/plan-accion/danger/${danger.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actions }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al guardar el plan de acción')
      }

      toast({
        title: 'Plan 5W2H Guardado',
        description: `El plan 5W2H para este peligro ha sido sincronizado exitosamente en todas las matrices vinculadas.`,
      })

      onSaved()
      onOpenChange(false)
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'No fue posible guardar el plan 5W2H.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!open || !danger) return null

  const badgeStyle = getClasificacionStyle(danger.clasificacion || '')

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#dfe9e2] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <header className="px-6 py-4 bg-[linear-gradient(180deg,#fcfdfc_0%,#f4f8f5_100%)] border-b border-[#dfe9e2] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="size-10 rounded-2xl bg-[#1F7D3E] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#1F7D3E]/20">
              <ClipboardList className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2.5 py-0.5 rounded-full">
                  PLAN DE ACCIÓN 5W2H POR PELIGRO
                </span>
                {danger.codigo && (
                  <span className="text-[10px] font-mono font-black text-[#5a7c65] bg-[#f2f6f3] border border-[#dfe9e2] px-2 py-0.5 rounded-md">
                    {danger.codigo}
                  </span>
                )}
              </div>
              <h2 className="text-sm sm:text-base font-black text-[#163522] tracking-tight truncate mt-0.5">
                {danger.descripcion}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-9 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#7a9182] hover:text-[#163522] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <X className="size-4" />
          </button>
        </header>

        {/* Danger Context Bar */}
        <div className="px-6 py-3 bg-[#fbfdfb] border-b border-[#dfe9e2] flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span
              className="px-2.5 py-0.5 rounded-lg font-black text-[11px] border"
              style={{
                backgroundColor: badgeStyle.bg,
                color: badgeStyle.text,
                borderColor: badgeStyle.border,
              }}
            >
              {danger.clasificacion}
            </span>

            {danger.interpRiesgo && (
              <span
                className={`px-2.5 py-0.5 rounded-lg font-black text-[11px] border ${
                  danger.interpRiesgo.startsWith('I ') || danger.interpRiesgo === 'I'
                    ? 'bg-red-100 text-red-900 border-red-300'
                    : danger.interpRiesgo.startsWith('II ') || danger.interpRiesgo === 'II'
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : danger.interpRiesgo.startsWith('III ') || danger.interpRiesgo === 'III'
                    ? 'bg-yellow-50 text-yellow-800 border-yellow-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                GTC 45: Nivel {danger.interpRiesgo} {danger.aceptabilidad ? `(${danger.aceptabilidad})` : ''}
              </span>
            )}

            {danger.actividadesCount !== undefined && danger.actividadesCount > 0 && (
              <span className="text-[#5e6b62] font-semibold text-[11.5px]">
                Presente en <strong>{danger.matricesCount || 1}</strong> matrices ({danger.actividadesCount} actividades)
              </span>
            )}
          </div>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSave} className="flex flex-col min-h-0 flex-1">
          <div className="overflow-y-auto p-6 space-y-6 flex-1 max-h-[66vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#7a9182]">
                <Loader2 className="size-7 animate-spin text-[#1F7D3E] mb-2" />
                <p className="text-xs font-semibold">Cargando preguntas 5W2H del peligro...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {actions.map((act, index) => (
                  <div
                    key={act.id || `plan-danger-${index}`}
                    className="p-5 sm:p-6 rounded-3xl border border-[#dfe9e2] bg-[#fbfdfb] hover:border-[#1F7D3E]/40 transition-all shadow-2xs space-y-4 relative"
                  >
                    {/* Header: Title and Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#eef3f0] pb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-xl bg-[#1F7D3E] text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
                          {actions.length > 1 ? index + 1 : <ClipboardList className="size-4 text-white" />}
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-black text-[#163522]">
                            {actions.length > 1 ? `Medida 5W2H #${index + 1}` : 'Preguntas Metodológicas 5W2H'}
                          </h3>
                          <p className="text-[10.5px] text-[#7a9182]">
                            Las respuestas formuladas se sincronizarán en todas las matrices donde este peligro esté asignado.
                          </p>
                        </div>
                      </div>

                      {actions.length > 1 && (
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <button
                            type="button"
                            onClick={() => handleRemoveAction(index)}
                            className="size-8 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Eliminar esta medida complementaria"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 5W2H Questions Grid - Generous, multiline boxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. WHAT - ¿QUÉ? */}
                      <div className="sm:col-span-2 space-y-1.5">
                        <label className="text-xs font-black text-[#163522] flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#eef7f0] text-[#1F7D3E] font-black text-[10px] tracking-wide">WHAT</span>
                          <span>¿QUÉ se va a hacer? (Acción preventiva / correctiva / de control) *</span>
                        </label>
                        <textarea
                          rows={3}
                          value={act.que}
                          onChange={(e) => handleUpdateField(index, 'que', e.target.value)}
                          placeholder="Describe con claridad y detalle la tarea, medida o intervención requerida para mitigar o controlar este peligro..."
                          className="w-full text-xs sm:text-sm font-medium rounded-2xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] p-3.5 focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E]/20 focus:outline-none resize-y min-h-[82px] leading-relaxed shadow-2xs"
                          required
                        />
                      </div>

                      {/* 2. WHY - ¿POR QUÉ? */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-[#163522] flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 font-black text-[10px] tracking-wide">WHY</span>
                          <span>¿POR QUÉ se realiza? (Justificación / Causa raíz)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={act.porQue || ''}
                          onChange={(e) => handleUpdateField(index, 'porQue', e.target.value)}
                          placeholder="Justificación técnica, causa raíz detectada o reducción esperada en el nivel de severidad del peligro..."
                          className="w-full text-xs sm:text-sm font-medium rounded-2xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] p-3.5 focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E]/20 focus:outline-none resize-y min-h-[76px] leading-relaxed shadow-2xs"
                        />
                      </div>

                      {/* 3. WHERE - ¿DÓNDE? */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-[#163522] flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 font-black text-[10px] tracking-wide">WHERE</span>
                          <span>¿DÓNDE se ejecutará? (Áreas, sedes o servicios asistenciales)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={act.donde || ''}
                          onChange={(e) => handleUpdateField(index, 'donde', e.target.value)}
                          placeholder="Áreas clínicas, unidades, sedes hospitalarias o puestos de trabajo donde aplica esta medida..."
                          className="w-full text-xs sm:text-sm font-medium rounded-2xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] p-3.5 focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E]/20 focus:outline-none resize-y min-h-[76px] leading-relaxed shadow-2xs"
                        />
                      </div>

                      {/* 4. HOW - ¿CÓMO? */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-[#163522] flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-black text-[10px] tracking-wide">HOW</span>
                          <span>¿CÓMO se va a hacer? (Metodología, etapas y procedimiento)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={act.como || ''}
                          onChange={(e) => handleUpdateField(index, 'como', e.target.value)}
                          placeholder="Pasos específicos, metodología técnica, protocolos clínicos o estándar operativo a implementar..."
                          className="w-full text-xs sm:text-sm font-medium rounded-2xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] p-3.5 focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E]/20 focus:outline-none resize-y min-h-[76px] leading-relaxed shadow-2xs"
                        />
                      </div>

                      {/* 5. HOW MUCH - ¿CUÁNTO? */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-[#163522] flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-black text-[10px] tracking-wide">HOW MUCH</span>
                          <span>¿CUÁNTO costará? (Presupuesto / Recursos necesarios)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={act.cuanto || ''}
                          onChange={(e) => handleUpdateField(index, 'cuanto', e.target.value)}
                          placeholder="Presupuesto estimado, compras requeridas, dotación interna o recursos institucionales asignados..."
                          className="w-full text-xs sm:text-sm font-medium rounded-2xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] p-3.5 focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E]/20 focus:outline-none resize-y min-h-[76px] leading-relaxed shadow-2xs"
                        />
                      </div>

                      {/* 6. WHEN - ¿CUÁNDO? */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-[#163522] flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 font-black text-[10px] tracking-wide">WHEN</span>
                          <span>¿CUÁNDO se ejecutará? (Cronograma de fechas)</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#7a9182] block">Fecha Inicio</span>
                            <input
                              type="date"
                              value={act.cuandoInicio || ''}
                              onChange={(e) => handleUpdateField(index, 'cuandoInicio', e.target.value)}
                              className="w-full text-xs font-semibold rounded-xl border border-[#dfe9e2] bg-white p-2.5 focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E]/20 focus:outline-none shadow-2xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#7a9182] block">Fecha Fin / Límite</span>
                            <input
                              type="date"
                              value={act.cuandoFin || ''}
                              onChange={(e) => handleUpdateField(index, 'cuandoFin', e.target.value)}
                              className="w-full text-xs font-semibold rounded-xl border border-[#dfe9e2] bg-white p-2.5 focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E]/20 focus:outline-none shadow-2xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 7. WHO - ¿QUIÉN? */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-black text-[#163522] flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 font-black text-[10px] tracking-wide">WHO</span>
                          <span>¿QUIÉN es el responsable? (Cargo / Rol / Comité)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={act.responsable || ''}
                          onChange={(e) => handleUpdateField(index, 'responsable', e.target.value)}
                          placeholder="Cargo(s), coordinador de servicio, supervisor SST o equipo multidisciplinario responsable..."
                          className="w-full text-xs sm:text-sm font-medium rounded-2xl border border-[#dfe9e2] bg-white focus:bg-[#fcfdfc] p-3 focus:border-[#1F7D3E] focus:ring-1 focus:ring-[#1F7D3E]/20 focus:outline-none resize-y min-h-[58px] leading-relaxed shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Optional additional measure button */}
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddAction}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f4f8f5] hover:text-[#1F7D3E] text-[#5e6b62] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  >
                    <Plus className="size-3.5 text-[#1F7D3E]" />
                    <span>Añadir medida complementaria a este peligro</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <footer className="px-6 py-3.5 bg-[#fcfdfc] border-t border-[#dfe9e2] flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4.5 py-2.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#5e6b62] text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-2xs"
            >
              Cerrar
            </button>

            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={saving || loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs sm:text-sm font-black shadow-md shadow-[#1F7D3E]/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                <span>Guardar Plan 5W2H</span>
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
