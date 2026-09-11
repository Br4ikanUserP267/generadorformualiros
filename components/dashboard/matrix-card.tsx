"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Calendar,
  User,
  Bed,
  Activity,
  Stethoscope,
  Siren,
  Scan,
  Pill,
  FlaskConical,
  Briefcase,
  Wrench,
} from 'lucide-react'
import { MatrixRiskSummary } from './matrix-risk-summary'
import { MatrixActionsMenu } from './matrix-actions-menu'

interface MatrixCardProps {
  matrix: {
    id: string
    area?: string
    responsable?: string
    fechaElaboracion?: string
    fechaActualizacion?: string
    date?: string
    procesosCount?: number
    totalZonas?: number
    totalActividades?: number
    totalPeligros?: number
    tipos?: string[]
    counts?: [number, number, number, number] | number[]
  }
  onPreview: (id: string) => void
  onVersions: (id: string, title: string) => void
  onDownload: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

const COLOR_PALETTES = [
  { bg: 'bg-[#eef7f0]', text: 'text-[#1F7D3E]', border: 'border-[#d1e2d6]' }, // Mint / Forest Green
  { bg: 'bg-[#e0f2fe]', text: 'text-[#0284c7]', border: 'border-[#bae6fd]' }, // Sky Blue
  { bg: 'bg-[#f3e8ff]', text: 'text-[#7e22ce]', border: 'border-[#e9d5ff]' }, // Purple / Lavender
  { bg: 'bg-[#ccfbf1]', text: 'text-[#0d9488]', border: 'border-[#99f6e4]' }, // Teal / Aqua
  { bg: 'bg-[#ffedd5]', text: 'text-[#ea580c]', border: 'border-[#fed7aa]' }, // Orange / Amber
  { bg: 'bg-[#e0e7ff]', text: 'text-[#4338ca]', border: 'border-[#c7d2fe]' }, // Indigo
  { bg: 'bg-[#ffe4e6]', text: 'text-[#e11d48]', border: 'border-[#fecdd3]' }, // Rose / Coral
  { bg: 'bg-[#fef9c3]', text: 'text-[#ca8a04]', border: 'border-[#fef08a]' }, // Warm Gold
]

function getMatrixTheme(name: string, tipos: string[] = []) {
  const norm = (name + ' ' + tipos.join(' '))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // Deterministic hash from matrix name for both color palette and icon variation
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const absHash = Math.abs(hash)
  const colorIndex = absHash % COLOR_PALETTES.length
  const palette = COLOR_PALETTES[colorIndex]

  // Context-aware icon matching (including the classic Building icon from the reference)
  let Icon = Building2
  if (norm.includes('rayos') || norm.includes('ecograf') || norm.includes('imag') || norm.includes('radiolog') || norm.includes('diag')) {
    Icon = Scan
  } else if (norm.includes('urgenc') || norm.includes('emergenc')) {
    Icon = Siren
  } else if (norm.includes('cirug') || norm.includes('quirof')) {
    Icon = Stethoscope
  } else if (norm.includes('farmac') || norm.includes('medicam')) {
    Icon = Pill
  } else if (norm.includes('laborat') || norm.includes('patolog')) {
    Icon = FlaskConical
  } else if (norm.includes('admin') || norm.includes('financ') || norm.includes('gestion') || norm.includes('gerenc')) {
    Icon = (absHash % 2 === 0) ? Briefcase : Building2
  } else if (norm.includes('infra') || norm.includes('manten') || norm.includes('sistem')) {
    Icon = (absHash % 2 === 0) ? Wrench : Building2
  } else if (norm.includes('hospit')) {
    // Alternates between Bed and Building2 (matches reference image: Cristo Rey -> Building, Nazareth -> Bed, Guadalupe -> Building, etc.)
    Icon = (absHash % 2 === 0) ? Bed : Building2
  } else if (norm.includes('uci') || norm.includes('intensiv') || norm.includes('pediatr')) {
    Icon = (absHash % 2 === 0) ? Activity : Building2
  } else if (norm.includes('asistenc') || norm.includes('consult')) {
    Icon = (absHash % 2 === 0) ? Stethoscope : Building2
  } else {
    Icon = Building2
  }

  return { Icon, palette }
}

function formatDate(dateStr?: string) {
  if (!dateStr) return 'Sin fecha'
  // Handle ISO string or YYYY-MM-DD
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
    const day = parseInt(match[3], 10)
    const month = months[parseInt(match[2], 10) - 1]
    const year = match[1]
    return `${day} ${month}. ${year}`
  }
  return dateStr
}

export function MatrixCard({
  matrix,
  onPreview,
  onVersions,
  onDownload,
  onDuplicate,
  onDelete,
}: MatrixCardProps) {
  const router = useRouter()

  const title = matrix.area || matrix.responsable || 'Matriz sin área'
  const displayDate = formatDate(matrix.fechaActualizacion || matrix.fechaElaboracion || matrix.date)
  const tipos = Array.isArray(matrix.tipos) && matrix.tipos.length > 0 ? matrix.tipos : ['General']
  const { Icon, palette } = getMatrixTheme(title, tipos)

  const handleCardClick = () => {
    router.push(`/matriz/${matrix.id}`)
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative bg-white border border-[#e2e9e4] rounded-2xl p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 cursor-pointer hover:border-[#1F7D3E]/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Left side: Icon + Title + Tags + Metadata */}
      <div className="flex items-start gap-3.5 sm:gap-4 flex-1 min-w-0">
        {/* Dynamic Contextual Icon with Varied Color Palette */}
        <div className={`size-11 sm:size-12 rounded-2xl ${palette.bg} ${palette.border} border flex items-center justify-center ${palette.text} shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
          <Icon className="size-5 sm:size-6" />
        </div>

        {/* Content details */}
        <div className="space-y-2 flex-1 min-w-0">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#163522] group-hover:text-[#1F7D3E] transition-colors line-clamp-1">
                {title}
              </h3>

              {/* Type tags */}
              <div className="flex flex-wrap gap-1.5">
                {tipos.map((tipo, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#f8faf9] border border-[#e2e9e4] text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider"
                  >
                    {tipo}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[#5e6b62]">
            {/* Date */}
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="size-3.5 text-[#8aa08f]" />
              <span>Actualizada: <strong className="font-semibold text-[#163522]">{displayDate}</strong></span>
            </div>

            {/* Responsable */}
            {matrix.responsable && (
              <div className="flex items-center gap-1.5 font-medium truncate max-w-[240px]">
                <User className="size-3.5 text-[#8aa08f] shrink-0" />
                <span className="truncate">Responsable: <strong className="font-semibold text-[#163522]">{matrix.responsable}</strong></span>
              </div>
            )}

            {/* Structural Counts */}
            <div className="flex items-center gap-2 text-[11px] text-[#8aa08f] font-semibold">
              {typeof matrix.procesosCount === 'number' && (
                <span>{matrix.procesosCount} {matrix.procesosCount === 1 ? 'proceso' : 'procesos'}</span>
              )}
              {typeof matrix.totalZonas === 'number' && matrix.totalZonas > 0 && (
                <>
                  <span>•</span>
                  <span>{matrix.totalZonas} {matrix.totalZonas === 1 ? 'zona' : 'zonas'}</span>
                </>
              )}
              {typeof matrix.totalActividades === 'number' && matrix.totalActividades > 0 && (
                <>
                  <span>•</span>
                  <span>{matrix.totalActividades} {matrix.totalActividades === 1 ? 'actividad' : 'actividades'}</span>
                </>
              )}
              {typeof matrix.totalPeligros === 'number' && matrix.totalPeligros > 0 && (
                <>
                  <span>•</span>
                  <span>{matrix.totalPeligros} {matrix.totalPeligros === 1 ? 'peligro' : 'peligros'}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Risk Badges + Actions */}
      <div className="flex items-center justify-between xl:justify-end gap-3 sm:gap-6 pt-3 xl:pt-0 border-t xl:border-t-0 border-[#f0f4f1] shrink-0">
        {/* Risk summary 4 boxes */}
        {matrix.counts && <MatrixRiskSummary counts={matrix.counts} />}

        {/* Action buttons */}
        <MatrixActionsMenu
          onPreview={() => onPreview(matrix.id)}
          onVersions={() => onVersions(matrix.id, title)}
          onEdit={() => router.push(`/matriz/${matrix.id}`)}
          onDownload={() => onDownload(matrix.id)}
          onDuplicate={() => onDuplicate(matrix.id)}
          onDelete={() => onDelete(matrix.id)}
        />
      </div>
    </div>
  )
}
