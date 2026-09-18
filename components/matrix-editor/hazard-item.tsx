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
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

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
  if (nr <= 120) return { label: 'III - Mejorable', color: '#16a34a' }
  if (nr <= 500) return { label: 'II - Alto', color: '#ca8a04' }
  return { label: 'I - No Aceptable', color: '#dc2626' }
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

  const statusColor = interpProbabilidad(Number((residualEval || initialEval)?.np || 0)).color

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

          {/* Status Dot */}
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: statusColor }}
            title="Nivel de probabilidad"
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

        {/* Right Actions: Duplicate, Delete, Expand Chevron */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
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
            </div>
          )}
        </div>
      )}
    </div>
  )
}
