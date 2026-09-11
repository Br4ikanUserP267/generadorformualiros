"use client"

import React, { useEffect, useState } from 'react'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number
  subtitle?: string
  icon: LucideIcon
  iconBgColor?: string
  iconTextColor?: string
  accentColor?: string
  badgeText?: string
  badgeColor?: string
  delayIndex?: number
  formatNumber?: boolean
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor = 'bg-[#f0f9f1]',
  iconTextColor = 'text-[#1F7D3E]',
  accentColor = '#1F7D3E',
  badgeText,
  badgeColor,
  delayIndex = 0,
  formatNumber = true,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    // Check for prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion || value === 0) {
      setDisplayValue(value)
      return
    }

    let startTimestamp: number | null = null
    const duration = 750 // 750ms count-up
    const startVal = 0
    const endVal = value

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp
      const progress = Math.min((timestamp - startTimestamp) / duration, 1)
      // Ease-out cubic formula
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startVal + (endVal - startVal) * easeOut)
      setDisplayValue(current)

      if (progress < 1) {
        window.requestAnimationFrame(step)
      } else {
        setDisplayValue(endVal)
      }
    }

    const animationFrame = window.requestAnimationFrame(step)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [value])

  const formattedNumberString = formatNumber
    ? new Intl.NumberFormat('es-CO').format(displayValue)
    : String(displayValue)

  return (
    <div
      className="group relative bg-white border border-[#e2e9e4] rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-[#1F7D3E]/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
      style={{
        animation: `fadeInUp 350ms cubic-bezier(0.16, 1, 0.3, 1) ${delayIndex * 60}ms both`,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <span className="text-[11px] font-bold text-[#8aa08f] uppercase tracking-wider block truncate">
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className="text-2xl sm:text-3xl font-black tracking-tight"
              style={{ color: accentColor }}
            >
              {formattedNumberString}
            </span>
            {badgeText && (
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                  badgeColor || 'bg-[#f0f9f1] text-[#1F7D3E]'
                }`}
              >
                {badgeText}
              </span>
            )}
          </div>
        </div>

        <div
          className={`size-10 rounded-xl ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105`}
        >
          <Icon className="size-5" />
        </div>
      </div>

      {subtitle && (
        <div className="mt-3 pt-2.5 border-t border-[#f0f4f1] text-[11px] font-medium text-[#5e6b62] truncate">
          {subtitle}
        </div>
      )}
    </div>
  )
}
