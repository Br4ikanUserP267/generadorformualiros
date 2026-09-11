"use client"

import React, { useEffect, useState } from 'react'

interface RiskDistributionProps {
  ma: number // Muy Alto
  al: number // Alto
  me: number // Medio
  ba: number // Bajo
  total: number
}

const RISK_LEVELS = [
  {
    key: 'ma',
    label: 'Muy Alto',
    color: '#a50000',
    barBg: '#a50000',
    chipBg: '#fce8e8',
    chipText: '#a50000',
    dotColor: '#a50000',
  },
  {
    key: 'al',
    label: 'Alto',
    color: '#ef4444',
    barBg: '#ef4444',
    chipBg: '#fdecea',
    chipText: '#dc3545',
    dotColor: '#ef4444',
  },
  {
    key: 'me',
    label: 'Medio',
    color: '#eab308',
    barBg: '#eab308',
    chipBg: '#fff3e0',
    chipText: '#b45309',
    dotColor: '#eab308',
  },
  {
    key: 'ba',
    label: 'Bajo',
    color: '#198754',
    barBg: '#198754',
    chipBg: '#e8f5e9',
    chipText: '#198754',
    dotColor: '#198754',
  },
] as const

export function RiskDistribution({ ma, al, me, ba, total }: RiskDistributionProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Trigger animation of bar widths after mount
    const timeout = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timeout)
  }, [])

  const counts = { ma, al, me, ba }
  const safeTotal = total > 0 ? total : 1

  const getPercentage = (val: number) => {
    if (total === 0) return 0
    return ((val / safeTotal) * 100).toFixed(1)
  }

  return (
    <div className="bg-white border border-[#e2e9e4] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-[#163522]">
            Distribución Global de Riesgos
          </h3>
          <p className="text-[11px] text-[#8aa08f]">
            Clasificación GTC-45 de los {new Intl.NumberFormat('es-CO').format(total)} peligros registrados
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-[10px] font-bold text-[#5e6b62] bg-[#f8faf9] border border-[#e2e9e4] px-2.5 py-1 rounded-lg">
          <span>Total evaluados:</span>
          <span className="text-[#163522] font-black">{new Intl.NumberFormat('es-CO').format(total)}</span>
        </div>
      </div>

      {/* Segmented horizontal progress bar */}
      <div className="h-3 w-full rounded-full bg-[#f0f4f1] overflow-hidden flex gap-0.5 p-0.5 border border-[#e2e9e4]">
        {RISK_LEVELS.map((level) => {
          const val = counts[level.key]
          const pct = total > 0 ? (val / safeTotal) * 100 : 0
          return (
            <div
              key={level.key}
              title={`${level.label}: ${val} (${getPercentage(val)}%)`}
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: mounted ? `${pct}%` : '0%',
                backgroundColor: level.barBg,
                minWidth: val > 0 && mounted ? '6px' : '0px',
              }}
            />
          )
        })}
      </div>

      {/* Legend Grid with values */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        {RISK_LEVELS.map((level) => {
          const val = counts[level.key]
          const pct = getPercentage(val)
          return (
            <div
              key={level.key}
              className="flex flex-col p-2.5 rounded-xl border border-[#eef3f0] bg-[#fbfdfb] transition-colors hover:bg-white"
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="size-2 rounded-full shrink-0"
                  style={{ backgroundColor: level.dotColor }}
                />
                <span className="text-[11px] font-bold text-[#5e6b62] uppercase tracking-wide truncate">
                  {level.label}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1 gap-1">
                <span className="text-base font-black" style={{ color: level.color }}>
                  {new Intl.NumberFormat('es-CO').format(val)}
                </span>
                <span className="text-[10px] font-semibold text-[#8aa08f]">
                  {pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
