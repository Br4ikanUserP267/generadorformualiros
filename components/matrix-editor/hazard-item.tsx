"use client"

import React from 'react'
import {
  Copy,
  Trash2,
  GripVertical,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
  Edit3,
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { PlanAccionModal } from '@/components/plan-accion/plan-accion-modal'
import { PlanAccionPreviewModal } from '@/components/plan-accion/plan-accion-preview-modal'
import { apiFetch } from '@/lib/utils'

interface HazardItemProps {
  hazard: any
  hazardIndex: number
  isDragging?: boolean
  isTargetEdge?: 'before' | 'after' | null
  isHighlighted?: boolean
  onToggleExpand: () => void
  onChangeTab: (tabIndex: number) => void
  onUpdateField: (path: string[], value: any) => void
  onDuplicate: () => void
  onDelete: () => void
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function interpProbabilidad(np: number) {
  if (!np) return { label: '—', color: '#9CA3AF' }
  if (np <= 4) return { label: 'Bajo', color: '#16a34a' }
  if (np <= 8) return { label: 'Medio', color: '#ca8a04' }
  if (np <= 20) return { label: 'Alto', color: '#ea580c' }
  return { label: 'Muy Alto', color: '#dc2626' }
}

function interpNivelRiesgo(nr: number) {
  if (!nr) return { label: '—', color: '#9CA3AF' }
  if (nr <= 20) return { label: 'IV - Bajo', color: '#16a34a' }
  if (nr <= 120) return { label: 'III - Moderado', color: '#d97706' }
  if (nr <= 500) return { label: 'II - Alto', color: '#ea580c' }
  return { label: 'I - Muy Alto', color: '#dc2626' }
}

export function getHazardRiskLevel(hazard: any): {
  level: 'MUY_ALTO' | 'ALTO' | 'MODERADO' | 'BAJO'
  label: string
  color: string
  isEligibleForPlan: boolean
} {
  if (!hazard) {
    return { level: 'BAJO', label: 'Sin evaluar', color: '#9CA3AF', isEligibleForPlan: false }
  }

  // 1. Check direct matrix evaluation (prefer residual if intervened, else initial)
  const initialEval = hazard.evaluacion || {}
  const residualEval = hazard.evaluacionPost || null
  const activeEval = residualEval && Number(residualEval.nr || 0) > 0 ? residualEval : initialEval

  const nr = Number(activeEval.nr ?? activeEval.nivelRiesgo ?? 0)
  const interpRiesgo = String(activeEval.interpRiesgo || activeEval.interp_nr || '').toUpperCase().trim()
  const aceptabilidad = String(activeEval.aceptabilidad || '').toUpperCase().trim()

  // Strict GTC 45 thresholds based on NR
  if (nr >= 600) {
    return { level: 'MUY_ALTO', label: 'Nivel I (Muy Alto)', color: '#dc2626', isEligibleForPlan: true }
  }
  if (nr >= 150 && nr < 600) {
    return { level: 'ALTO', label: 'Nivel II (Alto)', color: '#ea580c', isEligibleForPlan: true }
  }
  if (nr >= 40 && nr < 150) {
    return { level: 'MODERADO', label: 'Nivel III (Moderado)', color: '#d97706', isEligibleForPlan: true }
  }
  if (nr > 0 && nr <= 20) {
    return { level: 'BAJO', label: 'Nivel IV (Bajo)', color: '#16a34a', isEligibleForPlan: false }
  }

  // String interpretation checks
  if (
    interpRiesgo.startsWith('I ') ||
    interpRiesgo === 'I' ||
    (interpRiesgo.includes('I') && !interpRiesgo.includes('II') && !interpRiesgo.includes('IV'))
  ) {
    return { level: 'MUY_ALTO', label: 'Nivel I (Muy Alto)', color: '#dc2626', isEligibleForPlan: true }
  }
  if (
    interpRiesgo.startsWith('II ') ||
    interpRiesgo === 'II' ||
    (interpRiesgo.includes('II') && !interpRiesgo.includes('III'))
  ) {
    return { level: 'ALTO', label: 'Nivel II (Alto)', color: '#ea580c', isEligibleForPlan: true }
  }
  if (
    interpRiesgo.startsWith('III ') ||
    interpRiesgo === 'III' ||
    interpRiesgo.includes('III') ||
    interpRiesgo.includes('MEJORABLE') ||
    interpRiesgo.includes('MODERADO')
  ) {
    return { level: 'MODERADO', label: 'Nivel III (Moderado)', color: '#d97706', isEligibleForPlan: true }
  }
  if (interpRiesgo.includes('IV') || interpRiesgo.includes('BAJO') || interpRiesgo === '4') {
    return { level: 'BAJO', label: 'Nivel IV (Bajo)', color: '#16a34a', isEligibleForPlan: false }
  }

  // Acceptability checks
  if (aceptabilidad.includes('NO ACEPTABLE')) {
    return { level: 'MUY_ALTO', label: 'Nivel I (Muy Alto)', color: '#dc2626', isEligibleForPlan: true }
  }
  if (aceptabilidad.includes('ESPECÍFICO') || aceptabilidad.includes('ESPECIFICO')) {
    return { level: 'ALTO', label: 'Nivel II (Alto)', color: '#ea580c', isEligibleForPlan: true }
  }
  if (aceptabilidad.includes('MEJORABLE')) {
    return { level: 'MODERADO', label: 'Nivel III (Moderado)', color: '#d97706', isEligibleForPlan: true }
  }
  if (aceptabilidad === 'ACEPTABLE' || (aceptabilidad.includes('ACEPTABLE') && !aceptabilidad.includes('CONTROL'))) {
    return { level: 'BAJO', label: 'Nivel IV (Bajo)', color: '#16a34a', isEligibleForPlan: false }
  }

  // 2. Check catalog hazard fallback
  const cat = hazard.catalogoPeligro
  if (cat) {
    const catNr = Number(cat.nivelRiesgo || 0)
    const catInterp = String(cat.interpRiesgo || '').toUpperCase().trim()

    if (catNr >= 600 || catInterp.startsWith('I ') || catInterp === 'I') {
      return { level: 'MUY_ALTO', label: 'Nivel I (Muy Alto)', color: '#dc2626', isEligibleForPlan: true }
    }
    if ((catNr >= 150 && catNr < 600) || catInterp.startsWith('II ') || catInterp === 'II') {
      return { level: 'ALTO', label: 'Nivel II (Alto)', color: '#ea580c', isEligibleForPlan: true }
    }
    if (
      (catNr >= 40 && catNr < 150) ||
      catInterp.startsWith('III ') ||
      catInterp === 'III' ||
      catInterp.includes('MEJORABLE') ||
      catInterp.includes('MODERADO')
    ) {
      return { level: 'MODERADO', label: 'Nivel III (Moderado)', color: '#d97706', isEligibleForPlan: true }
    }
    if ((catNr > 0 && catNr <= 20) || catInterp.includes('IV') || catInterp.includes('BAJO') || catInterp.includes('ACEPTABLE')) {
      return { level: 'BAJO', label: 'Nivel IV (Bajo)', color: '#16a34a', isEligibleForPlan: false }
    }
  }

  return { level: 'BAJO', label: 'Sin evaluar', color: '#9CA3AF', isEligibleForPlan: false }
}

function aceptabilidadColor(text: string) {
  if (!text) return '#9CA3AF'
  if (text.includes('No Aceptable')) return '#dc2626'
  if (text.includes('Control Especifico') || text.includes('Alto')) return '#ea580c'
  if (text.includes('Mejorable') || text.includes('Medio')) return '#ca8a04'
  if (text.includes('Aceptable') || text.includes('Bajo')) return '#16a34a'
  return '#9CA3AF'
}

function getStablePeligroTitle(hazard: any, fallbackIndex: number) {
  const base = hazard?._ui?.stableLabel || `Peligro ${fallbackIndex + 1}`
  if (hazard?.descripcion) {
    const desc = hazard.descripcion.trim()
    return `${base}: ${desc}`
  }
  return base
}

export function HazardItem({
  hazard,
  hazardIndex,
  isDragging = false,
  isTargetEdge = null,
  isHighlighted = false,
  onToggleExpand,
  onChangeTab,
  onUpdateField,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragEnd,
}: HazardItemProps) {
  const itemRef = React.useRef<HTMLDivElement>(null)
  const isExpanded = isHighlighted || !!hazard?._ui?.expanded
  const activeTab = Number(hazard?._ui?.activeTab || 0)

  // 5W2H Action Plan modal state
  const [showPlanModal, setShowPlanModal] = React.useState(false)
  const [showPreviewModal, setShowPreviewModal] = React.useState(false)

  // Retrieve 5W2H actions from hazard (from catalogo or direct hazard association)
  const existingPlans: any[] = React.useMemo(() => {
    if (Array.isArray(hazard?.catalogoPeligro?.planesAccion) && hazard.catalogoPeligro.planesAccion.length > 0) {
      return hazard.catalogoPeligro.planesAccion
    }
    if (Array.isArray(hazard?.planesAccion)) {
      return hazard.planesAccion
    }
    return []
  }, [hazard])

  const has5w2h = existingPlans.length > 0

  // Format danger object for PlanAccionModal
  const dangerForPlan = React.useMemo(() => {
    return {
      id: hazard.catalogoPeligroId || hazard.id,
      codigo: hazard.codigo || hazard.catalogoPeligro?.codigo || null,
      descripcion: hazard.descripcion || '',
      clasificacion: hazard.clasificacion || '',
      eliminacion: hazard.intervencion?.eliminacion || '',
      sustitucion: hazard.intervencion?.sustitucion || '',
      controlesIngenieria: hazard.intervencion?.controles_ingenieria || '',
      controlesAdministrativos: hazard.intervencion?.controles_administrativos || '',
      epp: hazard.intervencion?.epp || '',
      planesAccion: existingPlans,
    }
  }, [hazard, existingPlans])

  // Handle plan saved
  const handlePlanSaved = async () => {
    try {
      const targetId = hazard.catalogoPeligroId || hazard.id
      const res = await apiFetch(`/api/plan-accion/danger/${targetId}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.planesAccion) {
          onUpdateField(['planesAccion'], data.planesAccion)
          if (hazard.catalogoPeligro) {
            onUpdateField(['catalogoPeligro', 'planesAccion'], data.planesAccion)
          }
        }
      }
    } catch (e) {
      console.error('Error refreshing danger 5W2H plans:', e)
    }
  }

  // Auto-scroll to center the hazard card squarely in the viewport when deep-linked/highlighted
  React.useEffect(() => {
    if (isHighlighted && itemRef.current) {
      const centerCard = () => {
        if (!itemRef.current) return
        itemRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        })
      }

      // Initial frame
      const frameId = requestAnimationFrame(centerCard)
      // Multi-stage progressive timers to ensure centering after uncollapse and full layout render
      const t1 = setTimeout(centerCard, 60)
      const t2 = setTimeout(centerCard, 200)
      const t3 = setTimeout(centerCard, 500)
      const t4 = setTimeout(centerCard, 850)

      return () => {
        cancelAnimationFrame(frameId)
        clearTimeout(t1)
        clearTimeout(t2)
        clearTimeout(t3)
        clearTimeout(t4)
      }
    }
  }, [isHighlighted])

  const initialEval = hazard.evaluacion || {}
  const residualEval = hazard.evaluacionPost || null

  const initialNr = Number(initialEval.nr || 0)
  const residualNr = residualEval ? Number(residualEval.nr || 0) : null
  const hasResidual = !!residualEval && (residualNr !== null || residualEval.nd !== undefined)

  // Reduction %
  const reductionPercent = hasResidual && initialNr > 0 && residualNr !== null
    ? Math.max(0, Math.min(100, Math.round(((initialNr - residualNr) / initialNr) * 100)))
    : null

  // Risk Level & Action Plan Eligibility
  const riskInfo = React.useMemo(() => getHazardRiskLevel(hazard), [hazard])
  const statusColor = riskInfo.color

  return (
    <div
      ref={itemRef}
      data-peligro-id={hazard.id}
      className={`rounded-2xl border scroll-my-12 transition-all duration-700 overflow-hidden ${
        isHighlighted
          ? 'border-[#1F7D3E] ring-4 ring-[#1F7D3E]/30 bg-[#f0f9f1]/30 shadow-lg scale-[1.006]'
          : 'border-[#dfe9e2] bg-white hover:border-[#bfd7c5] shadow-2xs'
      } ${isTargetEdge === 'before' ? 'border-t-2 border-t-[#1F7D3E]' : ''} ${
        isTargetEdge === 'after' ? 'border-b-2 border-b-[#1F7D3E]' : ''
      }`}
    >
      {/* Header Bar */}
      <div
        onClick={onToggleExpand}
        className="px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-[#fcfdfc] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Drag Handle */}
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1 rounded-lg text-[#a3b8aa] hover:text-[#5e6b62] hover:bg-[#f0f5f1] cursor-grab active:cursor-grabbing shrink-0"
            title="Arrastrar para reordenar peligro"
          >
            <GripVertical className="size-4" />
          </div>

          {/* Risk Level Status Dot */}
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: statusColor }}
            title={`Nivel de riesgo: ${riskInfo.label}`}
          />

          {/* Title & Classification */}
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-[#163522] truncate max-w-[500px]">
                {getStablePeligroTitle(hazard, hazardIndex)}
              </span>
              {hazard.clasificacion && (
                <span className="inline-flex items-center rounded-full bg-[#f4f8f5] text-[#5e6b62] border border-[#dfe9e2] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  {hazard.clasificacion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Actions: 5W2H Plan, Duplicate, Delete, Expand Chevron */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* 5W2H Quick Button: ONLY available for Muy Alto, Alto, and Moderado */}
          {riskInfo.isEligibleForPlan && (
            <button
              type="button"
              onClick={() => {
                if (has5w2h) setShowPreviewModal(true)
                else setShowPlanModal(true)
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition-all border cursor-pointer ${
                has5w2h
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                  : 'bg-white text-[#5e6b62] border-[#dfe9e2] hover:bg-[#f0f9f1] hover:text-[#1F7D3E]'
              }`}
              title="Plan de Acción 5W2H por peligro (sincronizado en matrices)"
            >
              <Sparkles className="size-3 text-[#1F7D3E]" />
              <span>{has5w2h ? `Plan 5W2H (${existingPlans.length})` : '+ Plan 5W2H'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onDuplicate}
            className="p-1.5 rounded-lg text-[#5e6b62] hover:text-[#1F7D3E] hover:bg-[#eef7f0] transition-colors"
            title="Duplicar este peligro"
          >
            <Copy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            title="Eliminar este peligro"
          >
            <Trash2 className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 rounded-lg text-[#7a9182] hover:bg-[#f0f5f1] ml-1"
          >
            {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Body */}
      {isExpanded && (
        <div className="border-t border-[#edf2ed] bg-[#fbfdfb] p-4 sm:p-5 space-y-4">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-1.5 flex-wrap pb-1 border-b border-[#edf2ed]">
            {[
              { id: 0, label: 'Descripción y Controles' },
              { id: 1, label: 'Evaluación' },
              { id: 2, label: 'Criterios' },
              { id: 3, label: 'Intervención' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => onChangeTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#1F7D3E] text-white shadow-xs'
                    : 'bg-white text-[#5e6b62] border border-[#dfe9e2] hover:bg-[#f4f8f5] hover:text-[#163522]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 0: Descripción y Controles */}
          {activeTab === 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                    Descripción del Peligro
                  </label>
                  <Textarea
                    rows={3}
                    value={hazard.descripcion || ''}
                    onChange={(e) => onUpdateField(['descripcion'], e.target.value)}
                    placeholder="Describe las condiciones o actos con potencial de daño..."
                    className="w-full text-xs sm:text-sm rounded-xl border-[#d1e2d6] bg-white focus:ring-[#1F7D3E]/20"
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                      Clasificación
                    </label>
                    <Input
                      value={hazard.clasificacion || ''}
                      onChange={(e) => onUpdateField(['clasificacion'], e.target.value)}
                      placeholder="Ej: Biológico, Físico, Químico, Biomecánico..."
                      className="h-9 text-xs sm:text-sm rounded-xl border-[#d1e2d6] bg-white focus:ring-[#1F7D3E]/20"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                      Efectos Posibles
                    </label>
                    <Textarea
                      rows={2}
                      value={hazard.efectos || ''}
                      onChange={(e) => onUpdateField(['efectos'], e.target.value)}
                      placeholder="Ej: Infección, traumatismo, lumbalgia..."
                      className="w-full text-xs rounded-xl border-[#d1e2d6] bg-white focus:ring-[#1F7D3E]/20"
                    />
                  </div>
                </div>
              </div>

              {/* Controles Existentes */}
              <div className="rounded-2xl border border-[#dfe9e2] bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <div className="text-xs font-black text-[#1F7D3E] uppercase tracking-wider">
                  Controles Existentes
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#355244]">En la Fuente</label>
                    <textarea
                      rows={3}
                      value={hazard.controles?.fuente || ''}
                      onChange={(e) => onUpdateField(['controles', 'fuente'], e.target.value)}
                      placeholder="Ej: Mantenimiento preventivo, aislamiento de equipos..."
                      className="w-full text-xs font-medium rounded-xl border border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white focus:border-[#1F7D3E] focus:outline-none p-2.5 resize-y leading-relaxed min-h-[68px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#355244]">En el Medio</label>
                    <textarea
                      rows={3}
                      value={hazard.controles?.medio || ''}
                      onChange={(e) => onUpdateField(['controles', 'medio'], e.target.value)}
                      placeholder="Ej: Ventilación forzada, señalización, barreras..."
                      className="w-full text-xs font-medium rounded-xl border border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white focus:border-[#1F7D3E] focus:outline-none p-2.5 resize-y leading-relaxed min-h-[68px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#355244]">En el Individuo</label>
                    <textarea
                      rows={3}
                      value={hazard.controles?.individuo || ''}
                      onChange={(e) => onUpdateField(['controles', 'individuo'], e.target.value)}
                      placeholder="Ej: Capacitación, esquema de vacunación, EPP..."
                      className="w-full text-xs font-medium rounded-xl border border-[#d1e2d6] bg-[#fbfdfb] focus:bg-white focus:border-[#1F7D3E] focus:outline-none p-2.5 resize-y leading-relaxed min-h-[68px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: Evaluación (Side-by-side comparison) */}
          {activeTab === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 items-stretch">
              {/* LEFT: Evaluación Inicial */}
              <div className="rounded-2xl border border-[#dfe9e2] bg-white p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#edf2ed]">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-wider">
                    Evaluación inicial
                  </h4>
                  <span className="text-[10px] font-bold text-[#7a9182]">
                    (Antes de la intervención)
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Deficiencia (ND)
                    </label>
                    <select
                      value={initialEval.nd ?? ''}
                      onChange={(e) =>
                        onUpdateField(
                          ['evaluacion', 'nd'],
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full p-2 border rounded-xl text-xs font-bold bg-[#fbfdfb] border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E]"
                    >
                      <option value="">— Seleccionar —</option>
                      <option value={10}>10 - Muy Alto</option>
                      <option value={6}>6 - Alto</option>
                      <option value={2}>2 - Bajo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Exposición (NE)
                    </label>
                    <select
                      value={initialEval.ne ?? ''}
                      onChange={(e) =>
                        onUpdateField(
                          ['evaluacion', 'ne'],
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full p-2 border rounded-xl text-xs font-bold bg-[#fbfdfb] border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E]"
                    >
                      <option value="">— Seleccionar —</option>
                      <option value={4}>4 - Continua</option>
                      <option value={3}>3 - Frecuente</option>
                      <option value={2}>2 - Ocasional</option>
                      <option value={1}>1 - Esporádica</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Probabilidad (NP)
                    </label>
                    <div className="w-full p-2 rounded-xl text-xs font-black bg-[#f8faf9] border border-[#dfe9e2] text-[#163522]">
                      {initialEval.np ?? '—'}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Interpretación (NP)
                    </label>
                    <div
                      className="w-full p-2 rounded-xl text-xs font-black text-center text-white"
                      style={{
                        backgroundColor: interpProbabilidad(Number(initialEval.np || 0)).color,
                      }}
                    >
                      {initialEval.interp_np || '—'}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Consecuencia (NC)
                    </label>
                    <select
                      value={initialEval.nc ?? ''}
                      onChange={(e) =>
                        onUpdateField(
                          ['evaluacion', 'nc'],
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      className="w-full p-2 border rounded-xl text-xs font-bold bg-[#fbfdfb] border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E]"
                    >
                      <option value="">— Seleccionar —</option>
                      <option value={100}>100 - Mortal o Catastrófico</option>
                      <option value={60}>60 - Muy Grave</option>
                      <option value={25}>25 - Grave</option>
                      <option value={10}>10 - Leve</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Nivel Riesgo (NR)
                    </label>
                    <div className="w-full p-2 rounded-xl text-xs font-black bg-[#f8faf9] border border-[#dfe9e2] text-[#163522]">
                      {initialEval.nr ?? '—'}
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                      Aceptabilidad del Riesgo
                    </label>
                    <div
                      className="w-full p-2 rounded-xl text-xs font-black text-center text-white"
                      style={{
                        backgroundColor: aceptabilidadColor(initialEval.aceptabilidad || ''),
                      }}
                    >
                      {initialEval.aceptabilidad || '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER: Reducción del nivel de riesgo (Desktop) */}
              <div className="hidden lg:flex flex-col items-center justify-center p-3 rounded-2xl border border-[#dfe9e2] bg-[#fcfdfc] text-center w-40 space-y-2 self-center">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                  Reducción del riesgo
                </div>
                {hasResidual && initialNr > 0 && residualNr !== null ? (
                  <>
                    <div className="text-base font-black text-[#163522] flex items-center gap-1">
                      <span>{initialNr}</span>
                      <ArrowRight className="size-3.5 text-[#1F7D3E]" />
                      <span className="text-[#1F7D3E]">{residualNr}</span>
                    </div>
                    {reductionPercent !== null && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6] px-2 py-0.5 text-xs font-black">
                        <TrendingDown className="size-3" />
                        -{reductionPercent}%
                      </span>
                    )}
                    <p className="text-[10px] text-[#7a9182] leading-tight pt-1">
                      Medidas de intervención aplicadas.
                    </p>
                  </>
                ) : (
                  <div className="py-2 text-[11px] text-[#a3b8aa] italic">
                    Pendiente de intervención
                  </div>
                )}
              </div>

              {/* CENTER: Reducción del nivel de riesgo (Mobile / Tablet Banner) */}
              {hasResidual && initialNr > 0 && residualNr !== null && (
                <div className="lg:hidden flex items-center justify-between p-3 rounded-xl border border-[#dfe9e2] bg-[#fcfdfc]">
                  <span className="text-xs font-bold text-[#5e6b62]">Reducción del riesgo:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#163522]">
                      {initialNr} → {residualNr}
                    </span>
                    {reductionPercent !== null && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6] px-2 py-0.5 text-[11px] font-black">
                        <TrendingDown className="size-3" />
                        -{reductionPercent}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* RIGHT: Evaluación Residual */}
              <div className="rounded-2xl border border-[#dfe9e2] bg-[#fcfdfc] p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#edf2ed]">
                  <h4 className="text-xs font-black text-[#1F7D3E] uppercase tracking-wider">
                    Evaluación residual
                  </h4>
                  <span className="text-[10px] font-bold text-[#7a9182]">
                    (Después de la intervención)
                  </span>
                </div>

                {!hasResidual ? (
                  /* Empty State when non-intervened */
                  <div className="py-8 text-center space-y-3">
                    <div className="size-9 rounded-2xl bg-[#f0f5f1] text-[#7a9182] flex items-center justify-center mx-auto border border-[#dfe9e2]">
                      <AlertCircle className="size-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#163522]">
                        Aún no se ha registrado una intervención para este riesgo.
                      </p>
                      <p className="text-[11px] text-[#7a9182] mt-0.5">
                        Define los controles y evaluación post-intervención para ver el riesgo residual.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onChangeTab(3)}
                      className="rounded-xl border-[#d1e2d6] text-[#1F7D3E] hover:bg-[#eef7f0] text-xs font-bold h-8"
                    >
                      Ir a Intervención
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                        Nivel Deficiencia (ND)
                      </label>
                      <select
                        value={residualEval?.nd ?? ''}
                        onChange={(e) =>
                          onUpdateField(
                            ['evaluacionPost', 'nd'],
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="w-full p-2 border rounded-xl text-xs font-bold bg-white border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E]"
                      >
                        <option value="">— Seleccionar —</option>
                        <option value={10}>10 - Muy Alto</option>
                        <option value={6}>6 - Alto</option>
                        <option value={2}>2 - Bajo</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                        Nivel Exposición (NE)
                      </label>
                      <select
                        value={residualEval?.ne ?? ''}
                        onChange={(e) =>
                          onUpdateField(
                            ['evaluacionPost', 'ne'],
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="w-full p-2 border rounded-xl text-xs font-bold bg-white border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E]"
                      >
                        <option value="">— Seleccionar —</option>
                        <option value={4}>4 - Continua</option>
                        <option value={3}>3 - Frecuente</option>
                        <option value={2}>2 - Ocasional</option>
                        <option value={1}>1 - Esporádica</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                        Nivel Probabilidad (NP)
                      </label>
                      <div className="w-full p-2 rounded-xl text-xs font-black bg-white border border-[#dfe9e2] text-[#163522]">
                        {residualEval?.np ?? '—'}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                        Interpretación (NP)
                      </label>
                      <div
                        className="w-full p-2 rounded-xl text-xs font-black text-center text-white"
                        style={{
                          backgroundColor: interpProbabilidad(Number(residualEval?.np || 0)).color,
                        }}
                      >
                        {residualEval?.interp_np || '—'}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                        Nivel Consecuencia (NC)
                      </label>
                      <select
                        value={residualEval?.nc ?? ''}
                        onChange={(e) =>
                          onUpdateField(
                            ['evaluacionPost', 'nc'],
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                        className="w-full p-2 border rounded-xl text-xs font-bold bg-white border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E]"
                      >
                        <option value="">— Seleccionar —</option>
                        <option value={100}>100 - Mortal o Catastrófico</option>
                        <option value={60}>60 - Muy Grave</option>
                        <option value={25}>25 - Grave</option>
                        <option value={10}>10 - Leve</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                        Nivel Riesgo (NR)
                      </label>
                      <div className="w-full p-2 rounded-xl text-xs font-black bg-white border border-[#dfe9e2] text-[#163522]">
                        {residualEval?.nr ?? '—'}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider block mb-1">
                        Aceptabilidad Residual
                      </label>
                      <div
                        className="w-full p-2 rounded-xl text-xs font-black text-center text-white"
                        style={{
                          backgroundColor: aceptabilidadColor(residualEval?.aceptabilidad || ''),
                        }}
                      >
                        {residualEval?.aceptabilidad || '—'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Criterios */}
          {activeTab === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                    Número de Expuestos
                  </label>
                  <Input
                    type="number"
                    value={hazard.criterios?.num_expuestos ?? ''}
                    onChange={(e) =>
                      onUpdateField(
                        ['criterios', 'num_expuestos'],
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="Ej: 5"
                    className="h-9 text-xs sm:text-sm rounded-xl border-[#d1e2d6] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                    Existencia de Requisito Legal
                  </label>
                  <div className="flex items-center gap-2.5 h-9">
                    <Switch
                      checked={!!hazard.criterios?.requisito_legal}
                      onCheckedChange={(v) =>
                        onUpdateField(['criterios', 'requisito_legal'], !!v)
                      }
                      className="data-[state=checked]:bg-[#1F7D3E]"
                    />
                    <span className="text-xs font-bold text-[#163522]">
                      {hazard.criterios?.requisito_legal ? 'Sí aplica' : 'No aplica'}
                    </span>
                  </div>
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                    Peor Consecuencia
                  </label>
                  <Textarea
                    rows={2}
                    value={hazard.criterios?.peor_consecuencia || ''}
                    onChange={(e) =>
                      onUpdateField(['criterios', 'peor_consecuencia'], e.target.value)
                    }
                    placeholder="Ej: Muerte, invalidez, daño permanente a la salud..."
                    className="w-full text-xs rounded-xl border-[#d1e2d6] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Intervención */}
          {activeTab === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                    Eliminación
                  </label>
                  <Input
                    value={hazard.intervencion?.eliminacion || ''}
                    onChange={(e) =>
                      onUpdateField(['intervencion', 'eliminacion'], e.target.value)
                    }
                    placeholder="Medidas para suprimir el peligro..."
                    className="h-9 text-xs rounded-xl border-[#d1e2d6] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                    Sustitución
                  </label>
                  <Input
                    value={hazard.intervencion?.sustitucion || ''}
                    onChange={(e) =>
                      onUpdateField(['intervencion', 'sustitucion'], e.target.value)
                    }
                    placeholder="Sustituir por elemento menos peligroso..."
                    className="h-9 text-xs rounded-xl border-[#d1e2d6] bg-white"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                    Controles de Ingeniería
                  </label>
                  <Textarea
                    rows={2}
                    value={hazard.intervencion?.controles_ingenieria || ''}
                    onChange={(e) =>
                      onUpdateField(['intervencion', 'controles_ingenieria'], e.target.value)
                    }
                    placeholder="Instalación de barreras, aislamientos, extractores..."
                    className="w-full text-xs rounded-xl border-[#d1e2d6] bg-white"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                    Señalización, Advertencia y Controles Administrativos
                  </label>
                  <Textarea
                    rows={2}
                    value={hazard.intervencion?.controles_administrativos || ''}
                    onChange={(e) =>
                      onUpdateField(['intervencion', 'controles_administrativos'], e.target.value)
                    }
                    placeholder="Procedimientos, capacitaciones, rotación de personal..."
                    className="w-full text-xs rounded-xl border-[#d1e2d6] bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                    Equipos / Elementos de Protección Personal (EPP)
                  </label>
                  <Textarea
                    rows={2}
                    value={hazard.intervencion?.epp || ''}
                    onChange={(e) => onUpdateField(['intervencion', 'epp'], e.target.value)}
                    placeholder="Guantes, mascarilla N95, gafas de seguridad..."
                    className="w-full text-xs rounded-xl border-[#d1e2d6] bg-white"
                  />
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                      Responsable de la Intervención
                    </label>
                    <Input
                      value={hazard.intervencion?.responsable || ''}
                      onChange={(e) =>
                        onUpdateField(['intervencion', 'responsable'], e.target.value)
                      }
                      placeholder="Ej: Coordinador SST, Líder de Área..."
                      className="h-9 text-xs rounded-xl border-[#d1e2d6] bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#5e6b62] uppercase tracking-wider">
                      Fecha de Ejecución
                    </label>
                    <Input
                      type="date"
                      value={hazard.intervencion?.fecha_ejecucion || ''}
                      onChange={(e) =>
                        onUpdateField(['intervencion', 'fecha_ejecucion'], e.target.value)
                      }
                      className="h-9 text-xs rounded-xl border-[#d1e2d6] bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Dedicated 5W2H Section in Tab 3 */}
              <div className="pt-3 border-t border-[#e2e9e4]">
                <div className="rounded-2xl border border-[#cbe4d1] bg-[linear-gradient(180deg,#fcfdfc_0%,#f4f9f5_100%)] p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="size-7 rounded-xl bg-[#1F7D3E] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Sparkles className="size-3.5" />
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-[#163522] uppercase tracking-wider flex items-center gap-1.5">
                          Plan de Acción Metodológico 5W2H
                          <span className="text-[9.5px] font-bold text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2 py-0.2 rounded-full normal-case">
                            Sincronizado por peligro
                          </span>
                        </h4>
                        <p className="text-[11px] text-[#7a9182]">
                          Qué, Por qué, Dónde, Cuándo, Quién, Cómo y Cuánto asignados a este peligro clínico.
                        </p>
                      </div>
                    </div>

                    {riskInfo.isEligibleForPlan && (
                      <div className="flex items-center gap-2">
                        {has5w2h && (
                          <button
                            type="button"
                            onClick={() => setShowPreviewModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#eef7f0] text-xs font-bold text-[#163522] transition-colors"
                          >
                            <Eye className="size-3.5 text-[#1F7D3E]" />
                            Ver Plan ({existingPlans.length})
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowPlanModal(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-bold transition-colors shadow-xs"
                        >
                          <Edit3 className="size-3.5" />
                          {has5w2h ? 'Editar Plan 5W2H' : 'Configurar Plan 5W2H'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Existing actions summary preview list OR Non-eligible Notice */}
                  {!riskInfo.isEligibleForPlan ? (
                    <div className="bg-white rounded-xl border border-[#dfe9e2] p-4 text-center text-xs text-[#5e6b62] space-y-1">
                      <p className="font-bold text-[#163522]">
                        Plan de Acción 5W2H no requerido para Nivel IV (Bajo)
                      </p>
                      <p className="text-[11px] text-[#7a9182]">
                        De acuerdo con los lineamientos institucionales, el Plan de Acción 5W2H solo se formula para peligros con clasificación <strong>Muy Alta, Alta y Moderada</strong> (Niveles I, II y III GTC 45).
                      </p>
                    </div>
                  ) : has5w2h ? (
                    <div className="space-y-1.5 pt-1">
                      {existingPlans.map((act: any, idx: number) => {
                        let statusColor = 'bg-slate-100 text-slate-700'
                        if (act.estado === 'EJECUTADO') statusColor = 'bg-emerald-100 text-emerald-800'
                        else if (act.estado === 'EN_PROCESO') statusColor = 'bg-amber-100 text-amber-800'

                        return (
                          <div
                            key={act.id || idx}
                            className="bg-white rounded-xl border border-[#dfe9e2] p-2.5 text-xs flex items-center justify-between gap-3"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-bold text-[#163522] mr-2">#{idx + 1}</span>
                              <span className="font-medium text-[#2d4b37]">{act.que}</span>
                              {act.responsable && (
                                <span className="ml-2 text-[10.5px] text-[#7a9182]">
                                  • Resp: {act.responsable}
                                </span>
                              )}
                            </div>
                            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md shrink-0 uppercase ${statusColor}`}>
                              {act.estado || 'PENDIENTE'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="bg-white/70 rounded-xl border border-dashed border-[#cbe4d1] p-3 text-center text-xs text-[#7a9182]">
                      Este peligro aún no tiene acciones 5W2H formuladas. Haga clic en <strong>Configurar Plan 5W2H</strong> para generarlas a partir de las medidas de intervención GTC 45.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5W2H Modals */}
      {showPlanModal && (
        <PlanAccionModal
          open={showPlanModal}
          onOpenChange={setShowPlanModal}
          danger={dangerForPlan}
          onSaved={handlePlanSaved}
        />
      )}

      {showPreviewModal && (
        <PlanAccionPreviewModal
          open={showPreviewModal}
          onOpenChange={setShowPreviewModal}
          danger={dangerForPlan}
          onEdit={() => {
            setShowPreviewModal(false)
            setShowPlanModal(true)
          }}
        />
      )}
    </div>
  )
}
