"use client"

import React, { useMemo, useState, useEffect } from 'react'
import {
  TrendingDown,
  ShieldAlert,
  Sparkles,
  Info,
  AlertCircle,
  Percent,
} from 'lucide-react'

interface Hazard {
  id: string
  evaluacion?: {
    nd?: number | null
    ne?: number | null
    nc?: number | null
    np?: number | null
    nr?: number | null
    interp_np?: string
    interp_nr?: string
    nivel_riesgo?: string
    interpProbabilidad?: string
    aceptabilidad?: string
    [key: string]: any
  }
  evaluacionPost?: {
    nd?: number | null
    ne?: number | null
    nc?: number | null
    np?: number | null
    nr?: number | null
    interp_np?: string
    interp_nr?: string
    nivel_riesgo?: string
    interpProbabilidad?: string
    aceptabilidad?: string
    [key: string]: any
  }
}

interface ActivityRiskSummaryProps {
  peligros: Hazard[]
}

// Custom hook for smooth integer counting animation
function useCountUp(targetValue: number, durationMs = 800) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const startValue = displayValue

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1)
      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (targetValue - startValue) * easeOut)
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      }
    }

    const animId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animId)
  }, [targetValue, durationMs])

  return displayValue
}

// Custom hook for smooth SVG arc fill animation
function useArcAnimation(trigger: any, durationMs = 900) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)
    let startTimestamp: number | null = null

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const elapsed = Math.min((timestamp - startTimestamp) / durationMs, 1)
      const easeOut = 1 - Math.pow(1 - elapsed, 3)
      setProgress(easeOut)

      if (elapsed < 1) {
        window.requestAnimationFrame(step)
      }
    }

    const animId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animId)
  }, [trigger, durationMs])

  return progress
}

function classifyRiskLevel(evalObj: any): 'extremo' | 'alto' | 'moderado' | 'bajo' {
  if (!evalObj) return 'bajo'

  // 1. Check NP interpretation if present
  const interpNp = String(evalObj.interp_np || evalObj.interpProbabilidad || '').toLowerCase()
  if (interpNp.includes('muy alto')) return 'extremo'
  if (interpNp.includes('alto')) return 'alto'
  if (interpNp.includes('medio') || interpNp.includes('moderado')) return 'moderado'
  if (interpNp.includes('bajo')) return 'bajo'

  // 2. Check numeric NP (Nivel de Probabilidad)
  const np = Number(evalObj.np || 0)
  if (np > 20) return 'extremo'
  if (np > 8) return 'alto'
  if (np >= 6) return 'moderado'
  if (np > 0) return 'bajo'

  // 3. Fallback to NR (Nivel de Riesgo)
  const nr = Number(evalObj.nr || 0)
  if (nr > 500) return 'extremo'     // Nivel I
  if (nr > 120) return 'alto'        // Nivel II
  if (nr > 20) return 'moderado'     // Nivel III (40 - 120)
  if (nr > 0) return 'bajo'          // Nivel IV (<= 20)

  // 4. Fallback to NR text interpretation / aceptabilidad
  const interpNr = String(evalObj.interp_nr || evalObj.nivel_riesgo || evalObj.aceptabilidad || '').toLowerCase()
  if (interpNr.includes('i') && !interpNr.includes('ii') && !interpNr.includes('iv')) return 'extremo'
  if (interpNr.includes('ii') && !interpNr.includes('iii')) return 'alto'
  if (interpNr.includes('iii') || interpNr.includes('mejorable')) return 'moderado'
  if (interpNr.includes('iv') || interpNr.includes('aceptable')) return 'bajo'

  return 'bajo'
}

// Map standard levels
function getRiskCounts(hazards: Hazard[], isResidual = false) {
  const counts = {
    extremo: 0, // Muy Alto / I
    alto: 0,    // Alto / II
    moderado: 0,// Medio / III
    bajo: 0,    // Bajo / IV
    total: 0,
  }

  hazards.forEach((h) => {
    if (isResidual) {
      // Must have completed evaluacionPost
      if (!h.evaluacionPost || (!h.evaluacionPost.nr && !h.evaluacionPost.nd && !h.evaluacionPost.interp_nr && !h.evaluacionPost.np && !h.evaluacionPost.interp_np)) {
        return
      }
      const lvl = classifyRiskLevel(h.evaluacionPost)
      if (lvl === 'extremo') counts.extremo++
      else if (lvl === 'alto') counts.alto++
      else if (lvl === 'moderado') counts.moderado++
      else if (lvl === 'bajo') counts.bajo++
      counts.total++
    } else {
      const lvl = classifyRiskLevel(h.evaluacion)
      if (lvl === 'extremo') counts.extremo++
      else if (lvl === 'alto') counts.alto++
      else if (lvl === 'moderado') counts.moderado++
      else if (lvl === 'bajo') counts.bajo++
      counts.total++
    }
  })

  return counts
}

// Animated Donut Chart Component with Smooth Arc Drawing & Interactivity
function AnimatedDonutChart({
  counts,
  totalLabel,
  totalCount,
  hoveredKey,
  onHoverKey,
}: {
  counts: { extremo: number; alto: number; moderado: number; bajo: number; total: number }
  totalLabel: string
  totalCount: number
  hoveredKey?: string | null
  onHoverKey?: (key: string | null) => void
}) {
  const animatedNumber = useCountUp(totalCount, 750)
  const arcProgress = useArcAnimation(`${counts.extremo}-${counts.alto}-${counts.moderado}-${counts.bajo}-${counts.total}`, 900)

  const radius = 54
  const circumference = 2 * Math.PI * radius
  const total = counts.total || 1

  // Slices configured by risk category
  const slices = [
    { key: 'extremo', name: 'Nivel I (Extremo)', count: counts.extremo, color: '#ef4444' },
    { key: 'alto', name: 'Nivel II (Alto)', count: counts.alto, color: '#ea580c' },
    { key: 'moderado', name: 'Nivel III (Moderado)', count: counts.moderado, color: '#eab308' },
    { key: 'bajo', name: 'Nivel IV (Bajo)', count: counts.bajo, color: '#16a34a' },
  ]

  const activeSlices = slices.filter((s) => s.count > 0)
  const hasMultiple = activeSlices.length > 1
  const gapLength = hasMultiple ? 2.5 : 0
  const totalGap = hasMultiple ? activeSlices.length * gapLength : 0
  const availableCircumference = circumference - totalGap

  let accumulatedLength = 0

  const activeSlice = slices.find((s) => s.key === hoveredKey)
  const activePercent = activeSlice && totalCount > 0 ? Math.round((activeSlice.count / totalCount) * 100) : 0

  return (
    <div className="relative size-36 sm:size-40 flex items-center justify-center shrink-0 group select-none">
      <svg className="size-full -rotate-90 overflow-visible" viewBox="0 0 140 140">
        {/* Background Track Circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#eef2ef"
          strokeWidth="14"
        />

        {/* Dynamic Colored Slices with Smooth Stroke Animation */}
        {counts.total > 0 && activeSlices.map((slice) => {
          const sliceFraction = slice.count / total
          const rawLength = sliceFraction * availableCircumference * arcProgress
          const sliceLength = Math.max(rawLength, 2 * arcProgress)
          const strokeOffset = -accumulatedLength
          accumulatedLength += sliceLength + gapLength

          const isHovered = hoveredKey === slice.key
          const isOtherHovered = hoveredKey !== null && !isHovered

          return (
            <circle
              key={slice.key}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={isHovered ? 18 : 14}
              strokeDasharray={`${sliceLength} ${circumference}`}
              strokeDashoffset={strokeOffset}
              strokeLinecap="butt"
              className="cursor-pointer transition-all duration-300 ease-out origin-center"
              style={{
                opacity: isOtherHovered ? 0.22 : 1,
                filter: isHovered ? `drop-shadow(0 0 12px ${slice.color}dd)` : 'none',
                transform: isHovered ? 'scale(1.04)' : 'scale(1)',
              }}
              onMouseEnter={() => onHoverKey?.(slice.key)}
              onMouseLeave={() => onHoverKey?.(null)}
            />
          )
        })}
      </svg>

      {/* Center Count & Label with Fade and Zoom Animation */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none transition-all duration-300">
        {hoveredKey && activeSlice ? (
          <div className="animate-in fade-in zoom-in-75 duration-200 flex flex-col items-center">
            <div className="flex items-baseline gap-0.5">
              <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none" style={{
                color: activeSlice.color
              }}>
                {activeSlice.count}
              </span>
              <span className="text-[11px] font-black text-[#7a9182]">
                ({activePercent}%)
              </span>
            </div>
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-[#5e6b62] mt-0.5 max-w-[85px] leading-tight line-clamp-1">
              {activeSlice.name}
            </span>
          </div>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-black text-[#163522] tracking-tight leading-none tabular-nums">
              {animatedNumber}
            </span>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#7a9182] mt-1 max-w-[85px] leading-tight">
              {totalLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// Breakdown list with animated numbers, proportional fill bars, and hover integration
function RiskBreakdownList({
  counts,
  totalCount,
  hoveredKey,
  onHoverKey,
}: {
  counts: { extremo: number; alto: number; moderado: number; bajo: number }
  totalCount: number
  hoveredKey?: string | null
  onHoverKey?: (key: string | null) => void
}) {
  const animatedExtremo = useCountUp(counts.extremo, 700)
  const animatedAlto = useCountUp(counts.alto, 700)
  const animatedModerado = useCountUp(counts.moderado, 700)
  const animatedBajo = useCountUp(counts.bajo, 700)

  const items = [
    { key: 'extremo', label: 'Extremo', count: animatedExtremo, raw: counts.extremo, color: '#ef4444', bgSoft: '#fef2f2' },
    { key: 'alto', label: 'Alto', count: animatedAlto, raw: counts.alto, color: '#ea580c', bgSoft: '#fff7ed' },
    { key: 'moderado', label: 'Moderado', count: animatedModerado, raw: counts.moderado, color: '#eab308', bgSoft: '#fefce8' },
    { key: 'bajo', label: 'Bajo', count: animatedBajo, raw: counts.bajo, color: '#16a34a', bgSoft: '#f0fdf4' },
  ]

  return (
    <div className="space-y-2 w-full sm:w-40 text-xs">
      {items.map((item) => {
        const isHovered = hoveredKey === item.key
        const percent = totalCount > 0 ? (item.raw / totalCount) * 100 : 0

        return (
          <div
            key={item.key}
            onMouseEnter={() => onHoverKey?.(item.key)}
            onMouseLeave={() => onHoverKey?.(null)}
            className={`relative overflow-hidden rounded-xl border transition-all duration-200 cursor-pointer p-1.5 ${
              isHovered
                ? 'border-current shadow-xs scale-[1.03]'
                : 'border-transparent hover:border-[#e2e9e4] bg-[#fbfdfb]'
            }`}
            style={{
              borderColor: isHovered ? `${item.color}66` : undefined,
              backgroundColor: isHovered ? item.bgSoft : undefined,
            }}
          >
            {/* Animated proportional background progress bar */}
            <div
              className="absolute inset-y-0 left-0 transition-all duration-700 ease-out opacity-25 rounded-l-xl pointer-events-none"
              style={{
                width: `${percent}%`,
                backgroundColor: item.color,
              }}
            />

            <div className="relative z-10 flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2.5 rounded-full transition-all duration-200 shrink-0"
                  style={{
                    backgroundColor: item.color,
                    transform: isHovered ? 'scale(1.35)' : 'scale(1)',
                    boxShadow: isHovered ? `0 0 8px ${item.color}` : 'none',
                  }}
                />
                <span className={`font-semibold transition-colors ${isHovered ? 'text-[#163522]' : 'text-[#5e6b62]'}`}>
                  {item.label}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="font-black text-[#163522] tabular-nums transition-transform">
                  {item.count}
                </span>
                {totalCount > 0 && item.raw > 0 && (
                  <span className="text-[10px] font-medium text-[#7a9182]">
                    ({Math.round(percent)}%)
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function ActivityRiskSummary({ peligros }: ActivityRiskSummaryProps) {
  const [hoveredInherentKey, setHoveredInherentKey] = useState<string | null>(null)
  const [hoveredResidualKey, setHoveredResidualKey] = useState<string | null>(null)

  // 1. Inherent risk counts (ALL hazards)
  const inherentCounts = useMemo(() => getRiskCounts(peligros, false), [peligros])

  // 2. Residual risk counts (ONLY hazards with completed residual evaluation)
  const residualCounts = useMemo(() => getRiskCounts(peligros, true), [peligros])

  // 3. Impact metrics
  const totalHazards = peligros.length
  const intervenedCount = residualCounts.total
  const pendingCount = Math.max(0, totalHazards - intervenedCount)
  const intervenedPercentage = totalHazards > 0 ? (intervenedCount / totalHazards) * 100 : 0

  // Calculate real average risk score reduction if data exists
  const rawReductionPercentage = useMemo(() => {
    if (intervenedCount === 0) return 0
    let totalInitialScore = 0
    let totalResidualScore = 0
    let evaluatedCount = 0

    peligros.forEach((p) => {
      if (p.evaluacionPost && p.evaluacionPost.nr && p.evaluacion && p.evaluacion.nr) {
        totalInitialScore += Number(p.evaluacion.nr)
        totalResidualScore += Number(p.evaluacionPost.nr)
        evaluatedCount++
      }
    })

    if (evaluatedCount === 0 || totalInitialScore === 0) return 0
    const reduction = ((totalInitialScore - totalResidualScore) / totalInitialScore) * 100
    return Math.max(0, Math.min(100, Math.round(reduction)))
  }, [peligros, intervenedCount])

  // Smooth count-up animations for impact numbers
  const animatedReduction = useCountUp(rawReductionPercentage, 850)
  const animatedIntervenedPercent = useCountUp(Math.round(intervenedPercentage), 850)
  const animatedIntervenedCount = useCountUp(intervenedCount, 750)

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="size-6 rounded-lg bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 shadow-2xs">
          <ShieldAlert className="size-3.5" />
        </span>
        <h3 className="text-sm font-black text-[#163522] tracking-tight">
          Resumen de riesgo de la actividad
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {/* CARD 1: Riesgo inherente */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both rounded-2xl border border-[#dfe9e2] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#cbdad0] hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#163522] uppercase tracking-wider flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#1F7D3E]" />
                Riesgo inherente
              </h4>
              <span className="text-[10px] font-bold text-[#7a9182]">
                (Antes de intervención)
              </span>
            </div>

            {/* Donut + Breakdown */}
            <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 pt-3">
              <AnimatedDonutChart
                counts={inherentCounts}
                totalCount={totalHazards}
                totalLabel="riesgos valorados"
                hoveredKey={hoveredInherentKey}
                onHoverKey={setHoveredInherentKey}
              />

              <RiskBreakdownList
                counts={inherentCounts}
                totalCount={totalHazards}
                hoveredKey={hoveredInherentKey}
                onHoverKey={setHoveredInherentKey}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#f0f5f1] flex items-center gap-1.5 text-[11px] text-[#7a9182]">
            <Info className="size-3.5 shrink-0 text-[#a3b8aa]" />
            <span>Incluye todos los riesgos asociados a la actividad.</span>
          </div>
        </div>

        {/* CARD 2: Impacto de la intervención */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both rounded-2xl border border-[#dfe9e2] bg-[linear-gradient(180deg,#ffffff_0%,#f8faf9_100%)] p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#cbdad0] hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#163522] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[#1F7D3E]" />
                Impacto de la intervención
              </h4>
            </div>

            <div className="pt-4 space-y-3.5 text-center">
              {/* Reduction Percentage Badge */}
              <div className="space-y-1">
                <div className="text-[11px] font-black uppercase tracking-wider text-[#7a9182]">
                  Reducción del nivel de riesgo
                </div>
                <div className="text-3xl sm:text-4xl font-black text-[#1F7D3E] flex items-center justify-center gap-1.5">
                  <span className="tabular-nums transition-all">
                    {rawReductionPercentage > 0 ? `${animatedReduction}%` : '—'}
                  </span>
                  {rawReductionPercentage > 0 && (
                    <TrendingDown className="size-6 text-[#1F7D3E] animate-float-gentle" />
                  )}
                </div>
              </div>

              {/* Progress Detail with animated progress bar and shimmer */}
              <div className="rounded-xl border border-[#dfe9e2] bg-white p-3 space-y-2 text-xs text-left shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#163522]">
                    {animatedIntervenedCount} de {totalHazards} riesgos intervenidos
                  </span>
                  <span className="font-black text-[#1F7D3E] tabular-nums">
                    {animatedIntervenedPercent}%
                  </span>
                </div>
                
                {/* Animated Progress Bar with Shimmer */}
                <div className="relative w-full h-2.5 rounded-full bg-[#f0f5f1] overflow-hidden p-0.5">
                  <div
                    className="relative h-full rounded-full bg-gradient-to-r from-[#1F7D3E] via-[#22c55e] to-[#2ecc71] transition-all duration-1000 ease-out shadow-xs overflow-hidden"
                    style={{ width: `${intervenedPercentage}%` }}
                  >
                    {/* Shimmer light sweep */}
                    {intervenedPercentage > 0 && (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    )}
                  </div>
                </div>

                <div className="text-[11px] text-[#7a9182]">
                  Evaluación residual completada
                  {pendingCount > 0 && ` (${pendingCount} pendientes)`}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#f0f5f1] flex items-center justify-center gap-1.5 text-[11px] text-[#7a9182]">
            <span>Actualización en tiempo real según controles registrados.</span>
          </div>
        </div>

        {/* CARD 3: Riesgo residual (ONLY INTERVENED RISKS) */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200 fill-mode-both rounded-2xl border border-[#dfe9e2] bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4 hover:border-[#cbdad0] hover:shadow-xs transition-all">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#163522] uppercase tracking-wider flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#22c55e]" />
                Riesgo residual
              </h4>
              <span className="text-[10px] font-bold text-[#7a9182]">
                (Después de intervención)
              </span>
            </div>

            {/* Empty State when zero residual evaluations exist */}
            {intervenedCount === 0 ? (
              <div className="py-6 px-3 text-center space-y-2 animate-in fade-in duration-300">
                <div className="size-10 rounded-2xl bg-[#f8faf9] text-[#a3b8aa] flex items-center justify-center mx-auto border border-[#dfe9e2]">
                  <AlertCircle className="size-5" />
                </div>
                <p className="text-xs font-bold text-[#355244]">
                  No hay riesgos con evaluación residual
                </p>
                <p className="text-[11px] text-[#7a9182] leading-relaxed max-w-[240px] mx-auto">
                  Los riesgos aparecerán aquí una vez se registre una intervención y su evaluación residual.
                </p>
              </div>
            ) : (
              /* Donut + Breakdown of ONLY intervened risks */
              <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-4 pt-3 animate-in fade-in duration-300">
                <AnimatedDonutChart
                  counts={residualCounts}
                  totalCount={intervenedCount}
                  totalLabel="riesgos intervenidos"
                  hoveredKey={hoveredResidualKey}
                  onHoverKey={setHoveredResidualKey}
                />

                <RiskBreakdownList
                  counts={residualCounts}
                  totalCount={intervenedCount}
                  hoveredKey={hoveredResidualKey}
                  onHoverKey={setHoveredResidualKey}
                />
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-[#f0f5f1] flex items-center gap-1.5 text-[11px] text-[#7a9182]">
            <Info className="size-3.5 shrink-0 text-[#a3b8aa]" />
            <span>Solo incluye riesgos con intervención y evaluación residual registrada.</span>
          </div>
        </div>
      </div>
    </div>
  )
}

