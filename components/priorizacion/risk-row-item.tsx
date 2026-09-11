"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Clock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { resolveRiskIcon } from '@/lib/risk-icon-map'

export interface RiskPrioritizationItem {
  id: string
  matrizId: string
  descripcion: string
  clasificacion: string
  area: string
  proceso: string
  zona: string
  cargo: string
  actividad: string
  evaluacion: {
    nd: number | null
    ne: number | null
    nc: number | null
    np: number | null
    nr: number | null
    interp_np: string
    interp_nr: string
    aceptabilidad: string
  }
  evaluacionPost: {
    nd: number | null
    ne: number | null
    nc: number | null
    np: number | null
    nr: number | null
    interp_np: string
    interp_nr: string
    aceptabilidad: string
  } | null
  intervencion: {
    eliminacion: string
    sustitucion: string
    controles_ingenieria: string
    controles_administrativos: string
    epp: string
    responsable: string
    fecha_ejecucion: string
  }
}

interface RiskRowItemProps {
  risk: RiskPrioritizationItem
  onOpenIntervention: (risk: RiskPrioritizationItem) => void
}

function getInitialStateBadge(interp: string) {
  const norm = (interp || '').toUpperCase().trim()

  if (norm.includes('MUY ALTO')) {
    return {
      label: 'MUY ALTO',
      bg: 'bg-red-50',
      text: 'text-[#a50000]',
      border: 'border-red-200',
      icon: AlertTriangle,
    }
  }

  if (norm.includes('ALTO')) {
    return {
      label: 'ALTO',
      bg: 'bg-rose-50',
      text: 'text-[#ef4444]',
      border: 'border-rose-200',
      icon: AlertTriangle,
    }
  }

  if (norm.includes('MEDIO')) {
    return {
      label: 'MEDIO',
      bg: 'bg-amber-50',
      text: 'text-[#d97706]',
      border: 'border-amber-200',
      icon: AlertCircle,
    }
  }

  return {
    label: interp || 'MEDIO',
    bg: 'bg-amber-50',
    text: 'text-[#d97706]',
    border: 'border-amber-200',
    icon: AlertCircle,
  }
}

function getPostStateBadge(evalPost: RiskPrioritizationItem['evaluacionPost']) {
  if (!evalPost || !evalPost.interp_np) {
    return {
      label: 'PENDIENTE',
      bg: 'bg-slate-50',
      text: 'text-[#8aa08f]',
      border: 'border-[#dfe9e2]',
      icon: Clock,
      isPending: true,
    }
  }

  const norm = (evalPost.interp_np || '').toUpperCase().trim()

  if (norm.includes('MUY ALTO')) {
    return {
      label: 'MUY ALTO',
      bg: 'bg-red-50',
      text: 'text-[#a50000]',
      border: 'border-red-200',
      icon: AlertTriangle,
      isPending: false,
    }
  }

  if (norm.includes('ALTO')) {
    return {
      label: 'ALTO',
      bg: 'bg-rose-50',
      text: 'text-[#ef4444]',
      border: 'border-rose-200',
      icon: AlertTriangle,
      isPending: false,
    }
  }

  if (norm.includes('MEDIO')) {
    return {
      label: 'MEDIO',
      bg: 'bg-amber-50',
      text: 'text-[#d97706]',
      border: 'border-amber-200',
      icon: AlertCircle,
      isPending: false,
    }
  }

  if (norm.includes('BAJO')) {
    return {
      label: 'BAJO',
      bg: 'bg-emerald-50',
      text: 'text-[#16a34a]',
      border: 'border-emerald-200',
      icon: CheckCircle2,
      isPending: false,
    }
  }

  return {
    label: evalPost.interp_np,
    bg: 'bg-slate-50',
    text: 'text-[#5e6b62]',
    border: 'border-[#dfe9e2]',
    icon: CheckCircle2,
    isPending: false,
  }
}

export function RiskRowItem({ risk, onOpenIntervention }: RiskRowItemProps) {
  const router = useRouter()

  const iconConfig = resolveRiskIcon({
    clasificacion: risk.clasificacion,
    descripcion: risk.descripcion,
  })
  const IconComponent = iconConfig.icon

  const initialBadge = getInitialStateBadge(risk.evaluacion.interp_np)
  const InitialIcon = initialBadge.icon

  const postBadge = getPostStateBadge(risk.evaluacionPost)
  const PostIcon = postBadge.icon

  const handleOpenMatrix = () => {
    router.push(`/matriz/${risk.matrizId}?peligroId=${risk.id}`)
  }

  return (
    <div className="bg-white border border-[#dfe9e2] rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-[#cbdad0] transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 lg:gap-4 select-none group">
      {/* 1. Left Clickable Navigation Block (Icon + Description + Activity + Chevron) */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpenMatrix}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleOpenMatrix()
          }
        }}
        className="flex-1 min-w-0 flex items-center gap-3.5 p-2 -m-2 rounded-xl hover:bg-[#f0f9f1]/50 border border-transparent hover:border-[#1F7D3E]/20 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1F7D3E]/20"
        title="Clic para abrir este peligro directamente en la matriz"
      >
        {/* Contextual Hazard Icon */}
        <div
          className={`size-11 sm:size-12 rounded-2xl ${iconConfig.bg} ${iconConfig.border} border flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105`}
        >
          <IconComponent className={`size-5.5 ${iconConfig.text}`} />
        </div>

        {/* Text Details */}
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-xs sm:text-sm font-black text-[#163522] leading-snug line-clamp-2 hover:text-[#1F7D3E] transition-colors">
            {risk.descripcion}
          </h4>
          <p className="text-[11px] font-bold text-[#8aa08f] mt-1">
            {risk.actividad}
          </p>
        </div>

        {/* Subtle Chevron Affordance */}
        <div className="flex items-center text-[#8aa08f] group-hover:text-[#1F7D3E] transition-all group-hover:translate-x-1 shrink-0 px-1">
          <ChevronRight className="size-4.5" />
        </div>
      </div>

      {/* 2. Right Normalized Columns (Clasificación, Área/Proceso, Inicial, Post, Acciones) */}
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 sm:gap-4 lg:gap-5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#f0f4f2]">
        {/* Clasificación Badge (Fixed Width: w-28) */}
        <div className="w-28 shrink-0 flex justify-center">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#f8faf9] text-[#5e6b62] border border-[#e2e9e4] text-[10px] font-black uppercase tracking-wider text-center truncate max-w-full">
            {risk.clasificacion || 'General'}
          </span>
        </div>

        {/* Área / Proceso (Fixed Width: w-44 xl:w-52) */}
        <div className="w-44 xl:w-52 shrink-0 text-left">
          <div className="text-xs font-black text-[#163522] truncate uppercase" title={risk.area}>
            {risk.area}
          </div>
          <div className="text-[11px] font-medium text-[#7a9182] truncate" title={risk.proceso}>
            {risk.proceso}
          </div>
        </div>

        {/* Estado Inicial Pill (Fixed Width: w-28) */}
        <div className="w-28 shrink-0 flex justify-center">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${initialBadge.bg} ${initialBadge.text} border ${initialBadge.border} text-[10px] font-black tracking-tight shadow-2xs`}
          >
            <InitialIcon className="size-3 shrink-0" />
            <span>{initialBadge.label}</span>
          </span>
        </div>

        {/* Estado Post Pill (Fixed Width: w-28) */}
        <div className="w-28 shrink-0 flex justify-center">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${postBadge.bg} ${postBadge.text} border ${postBadge.border} text-[10px] font-black tracking-tight shadow-2xs`}
          >
            <PostIcon className="size-3 shrink-0" />
            <span>{postBadge.label}</span>
          </span>
        </div>

        {/* Actions Button (Fixed Width: w-28) */}
        <div className="w-28 shrink-0 flex justify-end">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onOpenIntervention(risk)
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-black shadow-xs hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Intervenir</span>
            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
