"use client"

import React from 'react'

interface MatrixRiskSummaryProps {
  counts: [number, number, number, number] | number[]
}

const RISK_BADGES = [
  { label: 'Muy Alto', bg: 'bg-[#fce8e8]', border: 'border-[#f8d7da]', text: 'text-[#a50000]' },
  { label: 'Alto', bg: 'bg-[#fdecea]', border: 'border-[#f5c6cb]', text: 'text-[#dc3545]' },
  { label: 'Medio', bg: 'bg-[#fff3e0]', border: 'border-[#ffeeba]', text: 'text-[#b45309]' },
  { label: 'Bajo', bg: 'bg-[#e8f5e9]', border: 'border-[#c3e6cb]', text: 'text-[#198754]' },
]

export function MatrixRiskSummary({ counts }: MatrixRiskSummaryProps) {
  const safeCounts = Array.isArray(counts) && counts.length === 4 ? counts : [0, 0, 0, 0]

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {RISK_BADGES.map((badge, idx) => {
        const val = Number(safeCounts[idx] || 0)
        return (
          <div
            key={badge.label}
            title={`${badge.label}: ${val} riesgos`}
            className={`flex flex-col items-center justify-center w-11 sm:w-12 h-11 sm:h-12 rounded-xl border ${badge.bg} ${badge.border} transition-transform hover:scale-105 shadow-2xs`}
          >
            <span className={`text-sm sm:text-base font-black leading-none ${badge.text}`}>
              {val}
            </span>
            <span className={`text-[8px] font-extrabold uppercase tracking-tight mt-0.5 ${badge.text}`}>
              {badge.label.split(' ')[0]}
            </span>
          </div>
        )
      })}
    </div>
  )
}
