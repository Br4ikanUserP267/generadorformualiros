"use client"

import React, { useState, useEffect, useMemo } from 'react'
import {
  FolderKanban,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'

interface DashboardStatsProps {
  totals: {
    totM: number
    totP: number
    ma: number
    al: number
    me: number
    ba: number
  }
}

// Custom hook for smooth animated number count-up
function useCountUp(targetValue: number, durationMs = 800) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let startTimestamp: number | null = null
    const startValue = displayValue

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (targetValue - startValue) * easeOut)
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplayValue(targetValue)
      }
    }

    const animId = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animId)
  }, [targetValue, durationMs])

  return displayValue
}

// Custom hook for SVG arc animation
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

// Format numbers with Colombian locale (e.g. 2.994)
function formatNumberCol(val: number): string {
  return new Intl.NumberFormat('es-CO').format(val)
}

// Format percentage dynamically (e.g. 0%, 0,03%, 47%, 53%)
function formatPercentage(count: number, total: number): string {
  if (!total || total <= 0 || !count || count <= 0) return '0%'
  const pct = (count / total) * 100
  if (pct < 1 && pct > 0) {
    return (
      pct.toLocaleString('es-CO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + '%'
    )
  }
  return `${Math.round(pct)}%`
}

export function DashboardStats({ totals }: DashboardStatsProps) {
  const [hoveredRiskKey, setHoveredRiskKey] = useState<'ma' | 'al' | 'me' | 'ba' | null>(null)
  const [barLoaded, setBarLoaded] = useState(false)

  useEffect(() => {
    setBarLoaded(false)
    const timer = setTimeout(() => setBarLoaded(true), 60)
    return () => clearTimeout(timer)
  }, [totals])

  const totalMatrices = totals.totM || 0
  const totalPeligros = totals.totP || (totals.ma + totals.al + totals.me + totals.ba) || 0

  const counts = useMemo(() => ({
    ma: totals.ma || 0,
    al: totals.al || 0,
    me: totals.me || 0,
    ba: totals.ba || 0,
  }), [totals])

  // Animated Numbers
  const animMatrices = useCountUp(totalMatrices, 700)
  const animPeligros = useCountUp(totalPeligros, 750)
  const animMa = useCountUp(counts.ma, 700)
  const animAl = useCountUp(counts.al, 700)
  const animMe = useCountUp(counts.me, 700)
  const animBa = useCountUp(counts.ba, 700)

  // Percentages
  const safeTotal = totalPeligros > 0 ? totalPeligros : 1
  const maPctRaw = totalPeligros > 0 ? (counts.ma / safeTotal) * 100 : 0
  const alPctRaw = totalPeligros > 0 ? (counts.al / safeTotal) * 100 : 0
  const mePctRaw = totalPeligros > 0 ? (counts.me / safeTotal) * 100 : 0
  const baPctRaw = totalPeligros > 0 ? (counts.ba / safeTotal) * 100 : 0

  // SVG Donut Slices config
  const arcProgress = useArcAnimation(`${counts.ma}-${counts.al}-${counts.me}-${counts.ba}-${totalPeligros}`, 900)
  const radius = 50
  const circumference = 2 * Math.PI * radius

  const donutSlices = [
    { key: 'ma', label: 'Muy Alto', sub: 'Nivel I', count: counts.ma, pct: maPctRaw, color: '#ef4444' },
    { key: 'al', label: 'Alto', sub: 'Nivel II', count: counts.al, pct: alPctRaw, color: '#ea580c' },
    { key: 'me', label: 'Medio', sub: 'Nivel III', count: counts.me, pct: mePctRaw, color: '#eab308' },
    { key: 'ba', label: 'Bajo', sub: 'Nivel IV', count: counts.ba, pct: baPctRaw, color: '#16a34a' },
  ]

  const activeSlices = donutSlices.filter((s) => s.count > 0)
  const hasMultipleSlices = activeSlices.length > 1
  const gapLength = hasMultipleSlices ? 2.5 : 0
  const totalGap = hasMultipleSlices ? activeSlices.length * gapLength : 0
  const availableCircumference = circumference - totalGap

  let accumulatedLength = 0
  const activeSlice = donutSlices.find((s) => s.key === hoveredRiskKey)

  return (
    <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 select-none">
      {/* CARD 1: TOTAL MATRICES */}
      <div className="lg:col-span-3 rounded-2xl border border-[#dfe9e2] bg-white p-5 shadow-2xs relative overflow-hidden flex flex-col justify-between hover:border-[#cbdad0] hover:shadow-xs transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both">
        {/* Background decorative soft wave */}
        <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-40">
          <svg viewBox="0 0 300 80" className="w-full h-16 text-[#eef7f0]" fill="currentColor">
            <path d="M0,32 C60,60 140,10 220,40 C260,55 290,45 300,42 L300,80 L0,80 Z" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full">
          {/* Top: Label & Icon */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#5e6b62]">
              Total Matrices
            </span>
            <span className="size-9 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shadow-2xs shrink-0">
              <FolderKanban className="size-4.5" />
            </span>
          </div>

          {/* Value & Subtitle */}
          <div className="my-auto py-4">
            <div className="text-4xl sm:text-5xl font-black text-[#1F7D3E] tracking-tight leading-none tabular-nums">
              {animMatrices}
            </div>
            <p className="text-xs font-semibold text-[#5e6b62] mt-2">
              Matrices en SG-SST
            </p>
          </div>
        </div>
      </div>

      {/* CARD 2: DISTRIBUCIÓN ACTUAL DEL RIESGO */}
      <div className="lg:col-span-9 rounded-2xl border border-[#dfe9e2] bg-white p-5 shadow-2xs relative flex flex-col justify-between hover:border-[#cbdad0] hover:shadow-xs transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100 fill-mode-both">
        <div>
          {/* Header Row: Title + Total Pill */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#163522]">
              Distribución actual del riesgo
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6] text-[11px] font-black tracking-tight">
              {formatNumberCol(totalPeligros)} riesgos en total
            </span>
          </div>

          {/* Body Content: Donut on Left, 4 Risk Level Columns on Right */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 pt-3">
            {/* Left: Interactive SVG Donut Chart + All Active Category Indicators */}
            <div className="flex flex-col items-center shrink-0">
              <div className="relative size-34 sm:size-38 flex items-center justify-center">
                <svg className="size-full -rotate-90 overflow-visible" viewBox="0 0 130 130">
                  {/* Background Track Circle */}
                  <circle
                    cx="65"
                    cy="65"
                    r={radius}
                    fill="none"
                    stroke="#eef2ef"
                    strokeWidth="14"
                  />

                  {/* Clean Non-overlapping SVG Slices with Sharp Butt Caps and Gaps */}
                  {totalPeligros > 0 &&
                    activeSlices.map((slice) => {
                      const fraction = slice.count / safeTotal
                      const rawLength = fraction * availableCircumference * arcProgress
                      const sliceLength = Math.max(rawLength, 2 * arcProgress)
                      const strokeOffset = -accumulatedLength
                      accumulatedLength += sliceLength + gapLength

                      const isHovered = hoveredRiskKey === slice.key
                      const isOtherHovered = hoveredRiskKey !== null && !isHovered

                      return (
                        <circle
                          key={slice.key}
                          cx="65"
                          cy="65"
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
                            filter: isHovered ? `drop-shadow(0 0 10px ${slice.color}dd)` : 'none',
                            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                          }}
                          onMouseEnter={() => setHoveredRiskKey(slice.key as any)}
                          onMouseLeave={() => setHoveredRiskKey(null)}
                        />
                      )
                    })}
                </svg>

                {/* Donut Center Display with Real Protagonism */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none transition-all duration-200">
                  {hoveredRiskKey && activeSlice ? (
                    <div className="animate-in fade-in zoom-in-90 duration-200 flex flex-col items-center">
                      {/* Highlighted Level Badge */}
                      <span
                        className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-0.5 shadow-2xs"
                        style={{
                          backgroundColor: `${activeSlice.color}18`,
                          color: activeSlice.color,
                          border: `1px solid ${activeSlice.color}50`,
                        }}
                      >
                        {activeSlice.label} · {activeSlice.sub}
                      </span>

                      {/* Large Count */}
                      <span
                        className="text-2xl sm:text-3xl font-black tracking-tight leading-none tabular-nums mt-0.5"
                        style={{ color: activeSlice.color }}
                      >
                        {formatNumberCol(activeSlice.count)}
                      </span>

                      {/* Percentage */}
                      <span className="text-[10px] font-bold text-[#5e6b62] mt-0.5">
                        {formatPercentage(activeSlice.count, totalPeligros)} del total
                      </span>
                    </div>
                  ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col items-center">
                      <span className="text-2xl sm:text-3xl font-black text-[#163522] tracking-tight leading-none tabular-nums">
                        {formatNumberCol(animPeligros)}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#7a9182] mt-0.5">
                        riesgos
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dynamic Interactive Legend under Donut */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2.5 max-w-[190px]">
                {donutSlices
                  .filter((s) => s.count > 0)
                  .map((s) => {
                    const isHovered = hoveredRiskKey === s.key
                    const isOther = hoveredRiskKey !== null && !isHovered

                    return (
                      <button
                        type="button"
                        key={s.key}
                        onMouseEnter={() => setHoveredRiskKey(s.key as any)}
                        onMouseLeave={() => setHoveredRiskKey(null)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all duration-200 cursor-pointer ${
                          isHovered
                            ? 'scale-105 shadow-2xs font-black'
                            : isOther
                            ? 'opacity-30 border-transparent bg-transparent'
                            : 'border-[#e2e9e4] bg-[#fbfdfb] hover:bg-white text-[#5e6b62]'
                        }`}
                        style={{
                          backgroundColor: isHovered ? `${s.color}15` : undefined,
                          borderColor: isHovered ? s.color : undefined,
                          color: isHovered ? s.color : undefined,
                        }}
                      >
                        <span
                          className="size-2 rounded-full shrink-0 transition-transform duration-200"
                          style={{
                            backgroundColor: s.color,
                            boxShadow: isHovered ? `0 0 8px ${s.color}` : 'none',
                            transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                          }}
                        />
                        <span className="text-xs font-black tabular-nums">
                          {formatPercentage(s.count, totalPeligros)}
                        </span>
                        <span className="text-[10px] font-bold">{s.label}</span>
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Right: 4 Columns (MUY ALTO, ALTO, MEDIO, BAJO) with Synced Protagonism */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 flex-1 w-full">
              {/* 1. MUY ALTO */}
              <div
                onMouseEnter={() => setHoveredRiskKey('ma')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-1.5 cursor-pointer ${
                  hoveredRiskKey === 'ma'
                    ? 'border-[#ef4444] bg-[#fef2f2] scale-[1.03] shadow-md ring-2 ring-[#ef4444]/20'
                    : hoveredRiskKey !== null
                    ? 'opacity-40 border-transparent bg-[#fbfdfb]'
                    : 'border-transparent bg-[#fbfdfb] hover:border-[#e2e9e4]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                    Muy Alto
                  </span>
                  <AlertCircle className="size-3.5 text-[#ef4444]" />
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-[#ef4444] tracking-tight leading-none tabular-nums">
                    {animMa}
                  </div>
                  <div className="text-[10px] font-bold text-[#7a9182]">
                    {formatPercentage(counts.ma, totalPeligros)}
                  </div>
                </div>

                {/* Mini progress track with animated fill */}
                <div className="w-full h-1.5 rounded-full bg-[#eef2ef] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#ef4444] transition-all duration-1000 ease-out"
                    style={{ width: barLoaded ? `${maPctRaw}%` : '0%' }}
                  />
                </div>

                {/* Status chip */}
                <div>
                  <span
                    className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      counts.ma === 0 ? 'bg-[#f8faf9] text-[#7a9182]' : 'bg-[#fef2f2] text-[#dc2626]'
                    }`}
                  >
                    {counts.ma === 0 ? 'Sin casos' : 'Atención crítica'}
                  </span>
                </div>

                <div className="text-[8px] font-medium text-[#8aa08f] leading-tight pt-1 border-t border-[#f0f5f1]">
                  Nivel I (No Aceptable)
                </div>
              </div>

              {/* 2. ALTO */}
              <div
                onMouseEnter={() => setHoveredRiskKey('al')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-1.5 cursor-pointer ${
                  hoveredRiskKey === 'al'
                    ? 'border-[#ea580c] bg-[#fff7ed] scale-[1.03] shadow-md ring-2 ring-[#ea580c]/20'
                    : hoveredRiskKey !== null
                    ? 'opacity-40 border-transparent bg-[#fbfdfb]'
                    : 'border-transparent bg-[#fbfdfb] hover:border-[#e2e9e4]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                    Alto
                  </span>
                  <AlertTriangle className="size-3.5 text-[#ea580c]" />
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-[#ea580c] tracking-tight leading-none tabular-nums">
                    {animAl}
                  </div>
                  <div className="text-[10px] font-bold text-[#7a9182]">
                    {formatPercentage(counts.al, totalPeligros)}
                  </div>
                </div>

                {/* Mini progress track with animated fill */}
                <div className="w-full h-1.5 rounded-full bg-[#eef2ef] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#ea580c] transition-all duration-1000 ease-out"
                    style={{ width: barLoaded ? `${alPctRaw}%` : '0%' }}
                  />
                </div>

                {/* Status chip */}
                <div>
                  <span
                    className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                      counts.al > 0 ? 'bg-[#fff7ed] text-[#c2410c]' : 'bg-[#f8faf9] text-[#7a9182]'
                    }`}
                  >
                    {counts.al > 0 ? 'Atención inmediata' : 'Sin casos'}
                  </span>
                </div>

                <div className="text-[8px] font-medium text-[#8aa08f] leading-tight pt-1 border-t border-[#f0f5f1]">
                  Nivel II (Control Específico)
                </div>
              </div>

              {/* 3. MEDIO */}
              <div
                onMouseEnter={() => setHoveredRiskKey('me')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-1.5 cursor-pointer ${
                  hoveredRiskKey === 'me'
                    ? 'border-[#eab308] bg-[#fefce8] scale-[1.03] shadow-md ring-2 ring-[#eab308]/20'
                    : hoveredRiskKey !== null
                    ? 'opacity-40 border-transparent bg-[#fbfdfb]'
                    : 'border-transparent bg-[#fbfdfb] hover:border-[#e2e9e4]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                    Medio
                  </span>
                  <AlertCircle className="size-3.5 text-[#eab308]" />
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-[#d97706] tracking-tight leading-none tabular-nums">
                    {formatNumberCol(animMe)}
                  </div>
                  <div className="text-[10px] font-bold text-[#7a9182]">
                    {formatPercentage(counts.me, totalPeligros)}
                  </div>
                </div>

                {/* Mini progress track with animated fill */}
                <div className="w-full h-1.5 rounded-full bg-[#eef2ef] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#eab308] transition-all duration-1000 ease-out"
                    style={{ width: barLoaded ? `${mePctRaw}%` : '0%' }}
                  />
                </div>

                <div className="h-5" />

                <div className="text-[8px] font-medium text-[#8aa08f] leading-tight pt-1 border-t border-[#f0f5f1]">
                  Nivel III (Mejorable)
                </div>
              </div>

              {/* 4. BAJO */}
              <div
                onMouseEnter={() => setHoveredRiskKey('ba')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-1.5 cursor-pointer ${
                  hoveredRiskKey === 'ba'
                    ? 'border-[#16a34a] bg-[#f0fdf4] scale-[1.03] shadow-md ring-2 ring-[#16a34a]/20'
                    : hoveredRiskKey !== null
                    ? 'opacity-40 border-transparent bg-[#fbfdfb]'
                    : 'border-transparent bg-[#fbfdfb] hover:border-[#e2e9e4]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                    Bajo
                  </span>
                  <CheckCircle2 className="size-3.5 text-[#16a34a]" />
                </div>

                <div className="space-y-0.5">
                  <div className="text-xl sm:text-2xl font-black text-[#16a34a] tracking-tight leading-none tabular-nums">
                    {formatNumberCol(animBa)}
                  </div>
                  <div className="text-[10px] font-bold text-[#7a9182]">
                    {formatPercentage(counts.ba, totalPeligros)}
                  </div>
                </div>

                {/* Mini progress track with animated fill */}
                <div className="w-full h-1.5 rounded-full bg-[#eef2ef] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#16a34a] transition-all duration-1000 ease-out"
                    style={{ width: barLoaded ? `${baPctRaw}%` : '0%' }}
                  />
                </div>

                <div className="h-5" />

                <div className="text-[8px] font-medium text-[#8aa08f] leading-tight pt-1 border-t border-[#f0f5f1]">
                  Nivel IV (Aceptable)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Full-width Segmented Progress Bar with Animation & Focus Protagonism */}
        <div className="mt-4 pt-3 border-t border-[#f0f5f1]">
          <div className="relative h-4 sm:h-4.5 w-full rounded-full bg-[#f0f4f1] overflow-hidden flex gap-0.5 p-0.5 border border-[#e2e9e4]">
            {/* Muy Alto segment */}
            {counts.ma > 0 && (
              <div
                title={`Muy Alto: ${formatNumberCol(counts.ma)} (${formatPercentage(counts.ma, totalPeligros)})`}
                onMouseEnter={() => setHoveredRiskKey('ma')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`h-full rounded-full bg-[#ef4444] transition-all duration-500 ease-out flex items-center justify-center text-[9px] font-black text-white overflow-hidden cursor-pointer ${
                  hoveredRiskKey === 'ma' ? 'scale-y-110 shadow-xs' : hoveredRiskKey !== null ? 'opacity-30' : ''
                }`}
                style={{
                  width: barLoaded ? `${maPctRaw}%` : '0%',
                  minWidth: barLoaded && counts.ma > 0 ? '6px' : '0px',
                }}
              >
                {maPctRaw >= 8 && formatPercentage(counts.ma, totalPeligros)}
              </div>
            )}

            {/* Alto segment */}
            {counts.al > 0 && (
              <div
                title={`Alto: ${formatNumberCol(counts.al)} (${formatPercentage(counts.al, totalPeligros)})`}
                onMouseEnter={() => setHoveredRiskKey('al')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`h-full rounded-full bg-[#ea580c] transition-all duration-500 ease-out flex items-center justify-center text-[9px] font-black text-white overflow-hidden cursor-pointer ${
                  hoveredRiskKey === 'al' ? 'scale-y-110 shadow-xs' : hoveredRiskKey !== null ? 'opacity-30' : ''
                }`}
                style={{
                  width: barLoaded ? `${alPctRaw}%` : '0%',
                  minWidth: barLoaded && counts.al > 0 ? '6px' : '0px',
                }}
              >
                {alPctRaw >= 8 && formatPercentage(counts.al, totalPeligros)}
              </div>
            )}

            {/* Medio segment */}
            {counts.me > 0 && (
              <div
                title={`Medio: ${formatNumberCol(counts.me)} (${formatPercentage(counts.me, totalPeligros)})`}
                onMouseEnter={() => setHoveredRiskKey('me')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`h-full rounded-full bg-[#eab308] transition-all duration-500 ease-out flex items-center justify-center text-[9px] font-black text-white overflow-hidden cursor-pointer ${
                  hoveredRiskKey === 'me' ? 'scale-y-110 shadow-xs' : hoveredRiskKey !== null ? 'opacity-30' : ''
                }`}
                style={{
                  width: barLoaded ? `${mePctRaw}%` : '0%',
                  minWidth: barLoaded && counts.me > 0 ? '6px' : '0px',
                }}
              >
                {mePctRaw >= 8 && formatPercentage(counts.me, totalPeligros)}
              </div>
            )}

            {/* Bajo segment */}
            {counts.ba > 0 && (
              <div
                title={`Bajo: ${formatNumberCol(counts.ba)} (${formatPercentage(counts.ba, totalPeligros)})`}
                onMouseEnter={() => setHoveredRiskKey('ba')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`h-full rounded-full bg-[#16a34a] transition-all duration-500 ease-out flex items-center justify-center text-[9px] font-black text-white overflow-hidden cursor-pointer ${
                  hoveredRiskKey === 'ba' ? 'scale-y-110 shadow-xs' : hoveredRiskKey !== null ? 'opacity-30' : ''
                }`}
                style={{
                  width: barLoaded ? `${baPctRaw}%` : '0%',
                  minWidth: barLoaded && counts.ba > 0 ? '6px' : '0px',
                }}
              >
                {baPctRaw >= 8 && formatPercentage(counts.ba, totalPeligros)}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
