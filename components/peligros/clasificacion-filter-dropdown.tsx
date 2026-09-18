"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Check,
  ChevronsUpDown,
  Filter,
  Search,
  X,
  Biohazard,
  Activity,
  Radio,
  FlaskConical,
  Brain,
  ShieldAlert,
  Building2,
  Wrench,
  Zap,
  Flame,
  Car,
  CloudLightning,
  Tag,
} from 'lucide-react'
import {
  normalizeClasificacion,
  getClasificacionStyle,
  getClasificacionPrefix,
} from '@/lib/gtc45-utils'

interface ClasificacionFilterDropdownProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  detailedCounts?: Record<string, number>
  totalCount?: number
  className?: string
}

function getCategoryIcon(name: string, className: string = 'size-3.5') {
  const norm = normalizeClasificacion(name)
  switch (norm) {
    case 'BIOLÓGICO':
      return <Biohazard className={className} />
    case 'BIOMECÁNICO':
      return <Activity className={className} />
    case 'FÍSICO':
      return <Radio className={className} />
    case 'QUÍMICO':
      return <FlaskConical className={className} />
    case 'PSICOSOCIAL':
      return <Brain className={className} />
    case 'CONDICIONES DE SEGURIDAD':
      return <ShieldAlert className={className} />
    case 'LOCATIVO':
      return <Building2 className={className} />
    case 'MECÁNICO':
      return <Wrench className={className} />
    case 'ELÉCTRICO':
      return <Zap className={className} />
    case 'TECNOLÓGICO':
      return <Flame className={className} />
    case 'ACCIDENTES DE TRÁNSITO':
      return <Car className={className} />
    case 'FENÓMENOS NATURALES':
      return <CloudLightning className={className} />
    default:
      return <Tag className={className} />
  }
}

export function ClasificacionFilterDropdown({
  value,
  onChange,
  options,
  detailedCounts = {},
  totalCount,
  className = '',
}: ClasificacionFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Normalize options list and remove duplicates
  const normalizedOptions = useMemo(() => {
    return Array.from(new Set(options.map((o) => normalizeClasificacion(o)).filter(Boolean))) as string[]
  }, [options])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Focus search input
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setSearchTerm('')
    }
  }, [open])

  const searchClean = searchTerm.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()

  const filtered = useMemo(() => {
    if (!searchClean) return normalizedOptions
    return normalizedOptions.filter((opt) => {
      const optClean = opt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
      return optClean.includes(searchClean)
    })
  }, [normalizedOptions, searchClean])

  const isAllSelected = !value || value === 'TODOS'
  const currentNormalized = normalizeClasificacion(value)
  const currentStyle = !isAllSelected && currentNormalized ? getClasificacionStyle(currentNormalized) : null

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-pointer shadow-2xs ${
          open
            ? 'border-[#1F7D3E] bg-white ring-2 ring-[#1F7D3E]/10'
            : !isAllSelected
            ? 'border-[#1F7D3E]/40 bg-[#f4faf5] hover:bg-white'
            : 'border-[#dfe9e2] bg-white hover:bg-[#fafcfa] hover:border-[#b8cfc1]'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {!isAllSelected && currentStyle && currentNormalized ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`p-1 rounded-md border ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border} shrink-0`}>
                {getCategoryIcon(currentNormalized, 'size-3')}
              </span>
              <span className="text-xs font-black text-[#163522] truncate">{currentNormalized}</span>
              <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-white text-[#1F7D3E] border border-[#d6ebd9] shrink-0">
                {currentStyle.prefix}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#4e6355]">
              <Filter className="size-3.5 text-[#1F7D3E] shrink-0" />
              <span className="text-xs font-bold truncate">Todas las clasificaciones</span>
              {totalCount !== undefined && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-[#eef7f0] text-[#1F7D3E] border border-[#d6ebd9] shrink-0">
                  {totalCount}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {!isAllSelected && (
            <span
              onClick={(e) => {
                e.stopPropagation()
                onChange('TODOS')
              }}
              className="p-1 text-[#7a9182] hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
              title="Limpiar filtro"
            >
              <X className="size-3" />
            </span>
          )}
          <ChevronsUpDown className="size-3.5 text-[#7a9182]" />
        </div>
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white border border-[#dfe9e2] rounded-2xl shadow-2xl z-[10030] p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
          {/* Quick Search */}
          <div className="relative">
            <Search className="size-3.5 text-[#7a9182] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar tipo de riesgo..."
              className="w-full text-xs font-bold text-[#163522] pl-8 pr-7 py-2 rounded-xl bg-[#f8faf9] border border-[#dfe9e2] focus:border-[#1F7D3E] focus:bg-white focus:outline-none placeholder:text-[#94a399] placeholder:font-normal"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7a9182] hover:text-[#163522]"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Option: Todos */}
          {!searchClean && (
            <button
              type="button"
              onClick={() => {
                onChange('TODOS')
                setOpen(false)
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                isAllSelected
                  ? 'bg-[#1F7D3E] text-white shadow-xs'
                  : 'text-[#163522] hover:bg-[#f4f8f5]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Filter className={`size-3.5 ${isAllSelected ? 'text-white' : 'text-[#1F7D3E]'}`} />
                <span>Todas las clasificaciones</span>
              </div>
              <div className="flex items-center gap-1.5">
                {totalCount !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      isAllSelected
                        ? 'bg-white/20 text-white border-white/30'
                        : 'bg-[#f0f5f1] text-[#2c4033] border-[#dfe9e2]'
                    }`}
                  >
                    {totalCount}
                  </span>
                )}
                {isAllSelected && <Check className="size-3.5 text-white shrink-0" />}
              </div>
            </button>
          )}

          <div className="border-t border-[#f0f5f1]" />

          {/* Filtered Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 scrollbar-thin scrollbar-thumb-[#d1e2d6]">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#7a9182]">
                No hay clasificaciones que coincidan con la búsqueda
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt === currentNormalized
                const style = getClasificacionStyle(opt)
                const count = detailedCounts[opt]

                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt)
                      setOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#1F7D3E] text-white shadow-xs'
                        : 'text-[#163522] hover:bg-[#f4f8f5]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`p-1 rounded-lg border shrink-0 ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : `${style.bg} ${style.text} ${style.border}`
                        }`}
                      >
                        {getCategoryIcon(opt, 'size-3.5')}
                      </span>
                      <span className="truncate tracking-wide">{opt}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[9.5px] font-black px-1.5 py-0.5 rounded border ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-[#f4f7f5] text-[#556b5c] border-[#dfe9e2]'
                        }`}
                      >
                        {style.prefix}
                      </span>
                      {count !== undefined && (
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-[#4e6355]'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                      {isSelected && <Check className="size-3.5 text-white shrink-0" />}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
