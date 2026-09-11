"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  X,
  ExternalLink,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Calendar,
  User,
  Loader2,
  Layers,
  Sparkles,
  BarChart2,
} from 'lucide-react'
import { resolveRiskIcon } from '@/lib/risk-icon-map'
import { RiskPrioritizationItem } from './risk-row-item'
import { apiFetch } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface InterventionDrawerProps {
  open: boolean
  risk: RiskPrioritizationItem | null
  onClose: () => void
  onSaveSuccess: (updatedRisk: RiskPrioritizationItem) => void
}

// GTC 45 Interpretation Helpers
function interpProbabilidad(np: number | null) {
  if (!np || np <= 0) return { label: '', color: '#9CA3AF', bg: 'bg-slate-100', text: 'text-slate-600' }
  if (np <= 4) return { label: 'Bajo', color: '#16a34a', bg: 'bg-emerald-50', text: 'text-[#16a34a]' }
  if (np <= 8) return { label: 'Medio', color: '#d97706', bg: 'bg-amber-50', text: 'text-[#d97706]' }
  if (np <= 20) return { label: 'Alto', color: '#ef4444', bg: 'bg-rose-50', text: 'text-[#ef4444]' }
  return { label: 'Muy Alto', color: '#a50000', bg: 'bg-red-50', text: 'text-[#a50000]' }
}

function interpNivelRiesgo(nr: number | null) {
  if (!nr || nr <= 0) return { label: '', color: '#9CA3AF', bg: 'bg-slate-100', text: 'text-slate-600' }
  if (nr <= 20) return { label: 'IV', color: '#16a34a', bg: 'bg-emerald-50', text: 'text-[#16a34a]' }
  if (nr <= 120) return { label: 'III', color: '#16a34a', bg: 'bg-emerald-50', text: 'text-[#16a34a]' }
  if (nr <= 500) return { label: 'II', color: '#d97706', bg: 'bg-amber-50', text: 'text-[#d97706]' }
  return { label: 'I', color: '#ef4444', bg: 'bg-red-50', text: 'text-[#ef4444]' }
}

function aceptabilidadFromNivel(label: string) {
  if (!label) return ''
  switch (label) {
    case 'IV':
      return 'Aceptable'
    case 'III':
      return 'Mejorable'
    case 'II':
      return 'Aceptable con Control Específico'
    case 'I':
      return 'No Aceptable'
    default:
      return ''
  }
}

function aceptabilidadStyle(text: string) {
  if (!text) return { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' }
  if (text.includes('No Aceptable')) {
    return { bg: 'bg-red-50', text: 'text-[#a50000]', border: 'border-red-200' }
  }
  if (text.includes('Control Específico')) {
    return { bg: 'bg-amber-50', text: 'text-[#d97706]', border: 'border-amber-200' }
  }
  if (text.includes('Mejorable') || text.includes('Aceptable')) {
    return { bg: 'bg-emerald-50', text: 'text-[#16a34a]', border: 'border-emerald-200' }
  }
  return { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
}

export function InterventionDrawer({
  open,
  risk,
  onClose,
  onSaveSuccess,
}: InterventionDrawerProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [formIntervencion, setFormIntervencion] = useState({
    eliminacion: '',
    sustitucion: '',
    controles_ingenieria: '',
    controles_administrativos: '',
    epp: '',
    responsable: '',
    fecha_ejecucion: '',
  })

  const [formEvalPost, setFormEvalPost] = useState<{
    nd: string | number
    ne: string | number
    nc: string | number
  }>({
    nd: '',
    ne: '',
    nc: '',
  })

  // Synchronize initial form state when risk changes
  useEffect(() => {
    if (risk) {
      setFormIntervencion({
        eliminacion: risk.intervencion?.eliminacion || '',
        sustitucion: risk.intervencion?.sustitucion || '',
        controles_ingenieria: risk.intervencion?.controles_ingenieria || '',
        controles_administrativos: risk.intervencion?.controles_administrativos || '',
        epp: risk.intervencion?.epp || '',
        responsable: risk.intervencion?.responsable || '',
        fecha_ejecucion: risk.intervencion?.fecha_ejecucion || '',
      })

      setFormEvalPost({
        nd: risk.evaluacionPost?.nd ?? '',
        ne: risk.evaluacionPost?.ne ?? '',
        nc: risk.evaluacionPost?.nc ?? '',
      })
    }
  }, [risk])

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Calculate residual risk dynamically using GTC 45 rules
  const postEvalResult = useMemo(() => {
    const nd = formEvalPost.nd !== '' ? Number(formEvalPost.nd) : null
    const ne = formEvalPost.ne !== '' ? Number(formEvalPost.ne) : null
    const nc = formEvalPost.nc !== '' ? Number(formEvalPost.nc) : null

    const hasProb = nd !== null && ne !== null
    const np = hasProb ? nd * ne : null
    const nr = np !== null && nc !== null ? np * nc : null

    const prob = interpProbabilidad(np)
    const riesgo = interpNivelRiesgo(nr)
    const aceptabilidad = aceptabilidadFromNivel(riesgo.label)

    return {
      nd,
      ne,
      nc,
      np,
      nr,
      interp_np: prob.label,
      interp_nr: riesgo.label,
      aceptabilidad,
      prob,
      riesgo,
      isComplete: np !== null && nr !== null && aceptabilidad !== '',
    }
  }, [formEvalPost])

  if (!open || !risk) return null

  const iconConfig = resolveRiskIcon({
    clasificacion: risk.clasificacion,
    descripcion: risk.descripcion,
  })
  const IconComponent = iconConfig.icon

  const handleOpenInMatrix = () => {
    router.push(`/matriz/${risk.matrizId}?peligroId=${risk.id}`)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload = {
        peligroId: risk.id,
        intervencion: formIntervencion,
        evaluacionPost: {
          nd: postEvalResult.nd,
          ne: postEvalResult.ne,
          nc: postEvalResult.nc,
          np: postEvalResult.np,
          nr: postEvalResult.nr,
          interp_np: postEvalResult.interp_np,
          interp_nr: postEvalResult.interp_nr,
          aceptabilidad: postEvalResult.aceptabilidad,
        },
      }

      const res = await apiFetch('/api/priorizacion/intervencion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        throw new Error('Error al guardar la intervención')
      }

      const updatedRisk: RiskPrioritizationItem = {
        ...risk,
        intervencion: { ...formIntervencion },
        evaluacionPost: postEvalResult.np !== null
          ? {
              nd: postEvalResult.nd,
              ne: postEvalResult.ne,
              nc: postEvalResult.nc,
              np: postEvalResult.np,
              nr: postEvalResult.nr,
              interp_np: postEvalResult.interp_np,
              interp_nr: postEvalResult.interp_nr,
              aceptabilidad: postEvalResult.aceptabilidad,
            }
          : null,
      }

      toast({
        title: 'Intervención guardada',
        description: 'Las medidas y la evaluación residual han sido actualizadas exitosamente.',
      })

      onSaveSuccess(updatedRisk)
      onClose()
    } catch (error) {
      console.error('Save intervention error:', error)
      toast({
        title: 'Error al guardar',
        variant: 'destructive',
        description: 'No se pudo guardar la intervención. Por favor intenta nuevamente.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const aceptStyle = aceptabilidadStyle(postEvalResult.aceptabilidad)

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none animate-in fade-in duration-200">
      {/* 1. Dimmed Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Slide-over Drawer Panel */}
      <div className="relative z-50 w-full sm:w-[560px] md:w-[700px] lg:w-[820px] xl:w-[920px] bg-[#fbfdfb] shadow-2xl flex flex-col h-full border-l border-[#dfe9e2] animate-in slide-in-from-right duration-300 ease-out">
        {/* Top Header */}
        <div className="bg-white border-b border-[#dfe9e2] px-5 sm:px-6 py-4 flex items-center justify-between gap-4 shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-base sm:text-lg font-black text-[#163522] tracking-tight">
              Intervención de Riesgo
            </h2>
            <p className="text-xs font-medium text-[#5e6b62] truncate">
              Registra las medidas de intervención y la evaluación del riesgo
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenInMatrix}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dfe9e2] bg-white text-xs font-bold text-[#1F7D3E] hover:bg-[#f0f9f1] hover:border-[#d1e2d6] transition-all shadow-2xs"
            >
              <ExternalLink className="size-3.5" />
              <span>Abrir en matriz</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar drawer"
              className="size-8.5 rounded-xl border border-[#dfe9e2] flex items-center justify-center text-[#5e6b62] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <X className="size-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Selected Risk Summary Card */}
          <div className="bg-white border border-[#dfe9e2] rounded-2xl p-4 sm:p-5 shadow-2xs">
            <div className="text-[10px] font-black uppercase tracking-wider text-[#1F7D3E] mb-2.5 flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              Riesgo Seleccionado
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left Info: Context Icon + Title + Activity */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div
                  className={`size-11 sm:size-12 rounded-2xl ${iconConfig.bg} ${iconConfig.border} border flex items-center justify-center shrink-0 shadow-2xs`}
                >
                  <IconComponent className={`size-5.5 ${iconConfig.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-[#163522] leading-snug line-clamp-2">
                    {risk.descripcion}
                  </h3>
                  <p className="text-[11px] font-bold text-[#8aa08f] mt-0.5">
                    {risk.actividad}
                  </p>
                </div>
              </div>

              {/* Right Metadata */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0f4f2]">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8aa08f] block">
                    Clasificación
                  </span>
                  <span className="inline-block px-2 py-0.5 rounded-full bg-[#f8faf9] text-[#5e6b62] border border-[#e2e9e4] text-[10px] font-black uppercase tracking-wider mt-0.5">
                    {risk.clasificacion}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8aa08f] block">
                    Área / Proceso
                  </span>
                  <span className="text-xs font-black text-[#163522] block uppercase mt-0.5">
                    {risk.area}
                  </span>
                  <span className="text-[10px] text-[#7a9182] block">
                    {risk.proceso}
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#8aa08f] block">
                    Estado Inicial
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 text-[#a50000] border border-red-200 text-[10px] font-black uppercase mt-0.5">
                    <AlertTriangle className="size-3" />
                    {risk.evaluacion.interp_np || 'ALTO'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Before / After Progression Banner */}
          <div className="bg-white border border-[#dfe9e2] rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Before */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#7a9182]">
                    Riesgo antes de la intervención
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-[#a50000] border border-red-200 text-[11px] font-black tracking-tight mt-0.5">
                    <BarChart2 className="size-3.5" />
                    {risk.evaluacion.interp_np || 'ALTO'}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="size-7 rounded-full bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0">
                <ArrowRight className="size-4" />
              </div>

              {/* After */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#7a9182]">
                    Riesgo después de la intervención
                  </span>
                  {postEvalResult.interp_np ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${postEvalResult.prob.bg} ${postEvalResult.prob.text} border text-[11px] font-black tracking-tight mt-0.5`}
                      style={{ borderColor: `${postEvalResult.prob.color}40` }}
                    >
                      <CheckCircle2 className="size-3.5" />
                      {postEvalResult.interp_np}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-50 text-[#8aa08f] border border-[#dfe9e2] text-[11px] font-black tracking-tight mt-0.5">
                      <Clock className="size-3.5" />
                      PENDIENTE
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Helper text on right */}
            <div className="text-[11px] text-[#7a9182] font-medium sm:text-right max-w-xs">
              {postEvalResult.isComplete
                ? 'Evaluación residual completada según metodología GTC 45.'
                : 'Completa la evaluación para conocer el nivel de riesgo resultante.'}
            </div>
          </div>

          {/* Form Sections Grid: Left (Medidas) + Right (Evaluación Post) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Medidas de Intervención (Left) */}
            <div className="bg-white border border-[#dfe9e2] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f4f2]">
                <span className="size-6 rounded-full bg-[#1F7D3E] text-white flex items-center justify-center text-xs font-black shrink-0">
                  1
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#163522]">
                    Medidas de Intervención
                  </h4>
                  <p className="text-[10px] font-medium text-[#7a9182]">
                    Define las acciones para mitigar el riesgo
                  </p>
                </div>
              </div>

              {/* Eliminación / Sustitución */}
              <div>
                <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                  Eliminación / Sustitución
                </label>
                <textarea
                  rows={3}
                  value={formIntervencion.eliminacion}
                  onChange={(e) =>
                    setFormIntervencion({
                      ...formIntervencion,
                      eliminacion: e.target.value,
                    })
                  }
                  placeholder="Describe medidas de eliminación o sustitución del peligro..."
                  className="w-full p-2.5 rounded-xl text-xs font-medium bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white resize-none transition-colors"
                />
              </div>

              {/* Controles de Ingeniería / Administrativos */}
              <div>
                <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                  Controles de Ingeniería / Admin
                </label>
                <textarea
                  rows={3}
                  value={formIntervencion.controles_ingenieria}
                  onChange={(e) =>
                    setFormIntervencion({
                      ...formIntervencion,
                      controles_ingenieria: e.target.value,
                    })
                  }
                  placeholder="Instalación de guardas, plataformas, señalización, procedimientos..."
                  className="w-full p-2.5 rounded-xl text-xs font-medium bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white resize-none transition-colors"
                />
              </div>

              {/* EPP & Responsable Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                    EPP
                  </label>
                  <input
                    type="text"
                    value={formIntervencion.epp}
                    onChange={(e) =>
                      setFormIntervencion({
                        ...formIntervencion,
                        epp: e.target.value,
                      })
                    }
                    placeholder="Elementos de protección..."
                    className="w-full p-2 rounded-xl text-xs font-medium bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={formIntervencion.responsable}
                    onChange={(e) =>
                      setFormIntervencion({
                        ...formIntervencion,
                        responsable: e.target.value,
                      })
                    }
                    placeholder="Nombre / Cargo..."
                    className="w-full p-2 rounded-xl text-xs font-medium bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Fecha Objetivo (Opcional) */}
              <div>
                <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                  Fecha Objetivo (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formIntervencion.fecha_ejecucion}
                    onChange={(e) =>
                      setFormIntervencion({
                        ...formIntervencion,
                        fecha_ejecucion: e.target.value,
                      })
                    }
                    className="w-full p-2 rounded-xl text-xs font-medium bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* 2. Evaluación Post-Intervención (Right) */}
            <div className="bg-white border border-[#dfe9e2] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-[#f0f4f2]">
                <span className="size-6 rounded-full bg-[#1F7D3E] text-white flex items-center justify-center text-xs font-black shrink-0">
                  2
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#163522]">
                    Evaluación Post-Intervención
                  </h4>
                  <p className="text-[10px] font-medium text-[#7a9182]">
                    Evalúa el riesgo residual después de las medidas
                  </p>
                </div>
              </div>

              {/* EVALUACIÓN DEL RIESGO */}
              <div className="space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#1F7D3E]">
                  Evaluación del Riesgo
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Nivel Deficiencia (ND) */}
                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Deficiencia (ND)
                    </label>
                    <select
                      value={formEvalPost.nd}
                      onChange={(e) =>
                        setFormEvalPost({
                          ...formEvalPost,
                          nd: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded-xl text-xs font-bold bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="">— Seleccionar —</option>
                      <option value={10}>10 - Muy Alto</option>
                      <option value={6}>6 - Alto</option>
                      <option value={2}>2 - Bajo</option>
                    </select>
                  </div>

                  {/* Nivel Exposición (NE) */}
                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Exposición (NE)
                    </label>
                    <select
                      value={formEvalPost.ne}
                      onChange={(e) =>
                        setFormEvalPost({
                          ...formEvalPost,
                          ne: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded-xl text-xs font-bold bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="">— Seleccionar —</option>
                      <option value={4}>4 - Continua</option>
                      <option value={3}>3 - Frecuente</option>
                      <option value={2}>2 - Ocasional</option>
                      <option value={1}>1 - Esporádica</option>
                    </select>
                  </div>

                  {/* Nivel Probabilidad (NP) */}
                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Probabilidad (NP)
                    </label>
                    <div className="w-full p-2 rounded-xl text-xs font-black bg-[#f8faf9] border border-[#dfe9e2] text-[#163522] tabular-nums">
                      {postEvalResult.np ?? '—'}
                    </div>
                  </div>

                  {/* Interpretación Nivel Probabilidad */}
                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Interpretación NP
                    </label>
                    {postEvalResult.interp_np ? (
                      <div
                        className={`w-full p-2 rounded-xl text-xs font-black text-center ${postEvalResult.prob.bg} ${postEvalResult.prob.text} border`}
                        style={{ borderColor: `${postEvalResult.prob.color}40` }}
                      >
                        {postEvalResult.interp_np}
                      </div>
                    ) : (
                      <div className="w-full p-2 rounded-xl text-xs font-medium text-center bg-[#f8faf9] border border-[#dfe9e2] text-[#8aa08f]">
                        —
                      </div>
                    )}
                  </div>

                  {/* Nivel Consecuencia (NC) */}
                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Consecuencia (NC)
                    </label>
                    <select
                      value={formEvalPost.nc}
                      onChange={(e) =>
                        setFormEvalPost({
                          ...formEvalPost,
                          nc: e.target.value,
                        })
                      }
                      className="w-full p-2 rounded-xl text-xs font-bold bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="">— Seleccionar —</option>
                      <option value={100}>100 - Mortal / Catastrófico</option>
                      <option value={60}>60 - Muy Grave</option>
                      <option value={25}>25 - Grave</option>
                      <option value={10}>10 - Leve</option>
                    </select>
                  </div>

                  {/* Nivel Riesgo (NR) */}
                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Riesgo (NR)
                    </label>
                    <div className="w-full p-2 rounded-xl text-xs font-black bg-[#f8faf9] border border-[#dfe9e2] text-[#163522] tabular-nums">
                      {postEvalResult.nr ?? '—'}
                    </div>
                  </div>
                </div>

                {/* Interpretación Nivel Riesgo (Full row) */}
                <div>
                  <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                    Interpretación Nivel Riesgo
                  </label>
                  {postEvalResult.interp_nr ? (
                    <div
                      className={`w-full p-2 rounded-xl text-xs font-black text-center ${postEvalResult.riesgo.bg} ${postEvalResult.riesgo.text} border`}
                      style={{ borderColor: `${postEvalResult.riesgo.color}40` }}
                    >
                      Nivel {postEvalResult.interp_nr}
                    </div>
                  ) : (
                    <div className="w-full p-2 rounded-xl text-xs font-medium text-center bg-[#f8faf9] border border-[#dfe9e2] text-[#8aa08f]">
                      —
                    </div>
                  )}
                </div>
              </div>

              {/* VALORACIÓN DEL RIESGO */}
              <div className="pt-2 border-t border-[#f0f4f2] space-y-2">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#1F7D3E]">
                  Valoración del Riesgo
                </div>

                <div>
                  <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                    Aceptabilidad del Riesgo
                  </label>
                  {postEvalResult.aceptabilidad ? (
                    <div
                      className={`w-full p-2.5 rounded-xl text-xs font-black text-center ${aceptStyle.bg} ${aceptStyle.text} border ${aceptStyle.border} shadow-2xs`}
                    >
                      {postEvalResult.aceptabilidad}
                    </div>
                  ) : (
                    <div className="w-full p-2.5 rounded-xl text-xs font-medium text-center bg-[#f8faf9] border border-[#dfe9e2] text-[#8aa08f]">
                      —
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="bg-white border-t border-[#dfe9e2] px-5 sm:px-6 py-4 flex items-center justify-end gap-3 shrink-0 shadow-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-[#dfe9e2] bg-white text-xs font-bold text-[#5e6b62] hover:bg-[#f8faf9] hover:border-[#cbdad0] transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-black shadow-xs hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="size-4" />
                <span>Guardar intervención</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
