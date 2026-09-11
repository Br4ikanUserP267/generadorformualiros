"use client"

import React, { useState, useEffect } from 'react'
import {
  ListChecks,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'

interface PriorizacionStatsProps {
  stats: {
    total: number
    muyAlto: number
    alto: number
    medio: number
    conEvaluacionPost: number
  }
}

// Custom hook for smooth animated number count-up
function useCountUp(targetValue: number, durationMs = 700) {
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

function formatNumber(val: number): string {
  return new Intl.NumberFormat('es-CO').format(val)
}

function formatPercentage(count: number, total: number): string {
  if (!total || total <= 0 || !count || count <= 0) return '0%'
  const pct = (count / total) * 100
  if (pct < 1 && pct > 0) {
    return (
      pct.toLocaleString('es-CO', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }) + '%'
    )
  }
  return `${Math.round(pct)}%`
}

export function PriorizacionStats({ stats }: PriorizacionStatsProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 50)
    return () => clearTimeout(t)
  }, [stats])

  const total = stats.total || 0
  const animTotal = useCountUp(total)
  const animMuyAlto = useCountUp(stats.muyAlto || 0)
  const animAlto = useCountUp(stats.alto || 0)
  const animMedio = useCountUp(stats.medio || 0)
  const animPost = useCountUp(stats.conEvaluacionPost || 0)

  const safeTotal = total > 0 ? total : 1
  const muyAltoPct = total > 0 ? (stats.muyAlto / safeTotal) * 100 : 0
  const altoPct = total > 0 ? (stats.alto / safeTotal) * 100 : 0
  const medioPct = total > 0 ? (stats.medio / safeTotal) * 100 : 0
  const postPct = total > 0 ? (stats.conEvaluacionPost / safeTotal) * 100 : 0

  const kpis = [
    {
      key: 'total',
      title: 'Total riesgos por intervenir',
      count: animTotal,
      rawCount: total,
      pctText: '100% del total',
      pctValue: 100,
      icon: ListChecks,
      iconBg: 'bg-[#eef7f0]',
      iconColor: 'text-[#1F7D3E]',
      textColor: 'text-[#1F7D3E]',
      barColor: 'bg-[#1F7D3E]',
      cardBg: 'bg-white',
      borderColor: 'border-[#dfe9e2]',
    },
    {
      key: 'muyAlto',
      title: 'Muy altos',
      count: animMuyAlto,
      rawCount: stats.muyAlto,
      pctText: formatPercentage(stats.muyAlto, total),
      pctValue: muyAltoPct,
      icon: AlertTriangle,
      iconBg: 'bg-red-50',
      iconColor: 'text-[#a50000]',
      textColor: 'text-[#a50000]',
      barColor: 'bg-[#a50000]',
      cardBg: 'bg-white',
      borderColor: 'border-[#fecaca]/80',
    },
    {
      key: 'alto',
      title: 'Altos',
      count: animAlto,
      rawCount: stats.alto,
      pctText: formatPercentage(stats.alto, total),
      pctValue: altoPct,
      icon: AlertTriangle,
      iconBg: 'bg-rose-50',
      iconColor: 'text-[#ef4444]',
      textColor: 'text-[#ef4444]',
      barColor: 'bg-[#ef4444]',
      cardBg: 'bg-white',
      borderColor: 'border-[#fed7aa]/80',
    },
    {
      key: 'medio',
      title: 'Medios',
      count: animMedio,
      rawCount: stats.medio,
      pctText: formatPercentage(stats.medio, total),
      pctValue: medioPct,
      icon: AlertCircle,
      iconBg: 'bg-amber-50',
      iconColor: 'text-[#eab308]',
      textColor: 'text-[#eab308]',
      barColor: 'bg-[#eab308]',
      cardBg: 'bg-white',
      borderColor: 'border-[#fef08a]/80',
    },
    {
      key: 'post',
      title: 'Con evaluación post',
      count: animPost,
      rawCount: stats.conEvaluacionPost,
      pctText: formatPercentage(stats.conEvaluacionPost, total),
      pctValue: postPct,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-[#10b981]',
      textColor: 'text-[#10b981]',
      barColor: 'bg-[#10b981]',
      cardBg: 'bg-white',
      borderColor: 'border-[#a7f3d0]/80',
    },
  ]

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 select-none">
      {kpis.map((kpi, idx) => {
        const IconComponent = kpi.icon

        return (
          <div
            key={kpi.key}
            className={`${kpi.cardBg} rounded-2xl border ${kpi.borderColor} p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-[#cbdad0] transition-all duration-300 flex flex-col justify-between relative overflow-hidden group`}
            style={{
              animationDelay: `${idx * 60}ms`,
            }}
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-bold text-[#5e6b62] leading-tight line-clamp-2">
                {kpi.title}
              </span>
              <span
                className={`size-8 sm:size-9 rounded-xl ${kpi.iconBg} ${kpi.iconColor} flex items-center justify-center shadow-2xs shrink-0 transition-transform duration-300 group-hover:scale-105`}
              >
                <IconComponent className="size-4 sm:size-4.5" />
              </span>
            </div>

            {/* Bottom: Big Number + Animated Progress Bar */}
            <div className="mt-3">
              <div
                className={`text-2xl sm:text-3xl lg:text-4xl font-black ${kpi.textColor} tracking-tight leading-none tabular-nums`}
              >
                {formatNumber(kpi.count)}
              </div>

              {/* Progress bar + percentage badge */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-[#f0f4f2] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${kpi.barColor} rounded-full transition-all duration-700 ease-out`}
                    style={{
                      width: animated ? `${Math.min(100, Math.max(kpi.pctValue, kpi.rawCount > 0 ? 4 : 0))}%` : '0%',
                    }}
                  />
                </div>
                <span className="text-[10px] font-bold text-[#7a9182] shrink-0 tabular-nums">
                  {kpi.pctText}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </section>
  )
}
