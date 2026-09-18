"use client"

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Check,
  ChevronsUpDown,
  Plus,
  Search,
  Tag,
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
  X,
} from 'lucide-react'
import {
  CLASIFICACIONES_RIESGO,
  normalizeClasificacion,
  getClasificacionStyle,
  getClasificacionPrefix,
} from '@/lib/gtc45-utils'
import { apiFetch } from '@/lib/utils'

interface ClasificacionComboboxProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

// Map Lucide icons for risk categories
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

export function ClasificacionCombobox({
  value,
  onChange,
  disabled = false,
}: ClasificacionComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [options, setOptions] = useState<string[]>(Array.from(CLASIFICACIONES_RIESGO))
  const [loading, setLoading] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Load classifications from backend
  useEffect(() => {
    let isMounted = true
    async function fetchClassifications() {
      try {
        setLoading(true)
        const res = await apiFetch('/api/peligros/classifications')
        if (res.ok) {
          const data = await res.json()
          if (isMounted && Array.isArray(data.classifications) && data.classifications.length > 0) {
            // Deduplicate and normalize
            const unique = Array.from(
              new Set(data.classifications.map((c: string) => normalizeClasificacion(c)).filter(Boolean))
            ) as string[]
            setOptions(unique)
          }
        }
      } catch (err) {
        console.error('Error fetching classifications:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchClassifications()
    return () => {
      isMounted = false
    }
  }, [])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  // Focus search input when popover opens
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      setHighlightedIndex(0)
    } else {
      setSearchTerm('')
    }
  }, [open])

  // Filter options with accent-insensitive matching
  const cleanSearch = searchTerm.trim()
  const searchNormalized = cleanSearch
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  const filtered = useMemo(() => {
    if (!searchNormalized) return options
    return options.filter((opt) => {
      const optClean = opt
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
      return optClean.includes(searchNormalized)
    })
  }, [options, searchNormalized])

  const isExactMatch = useMemo(() => {
    if (!cleanSearch) return false
    const norm = normalizeClasificacion(cleanSearch)
    return options.some((opt) => opt === norm)
  }, [options, cleanSearch])

  // Scroll active item into view
  useEffect(() => {
    if (open && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, open])

  const handleSelect = (clasif: string) => {
    const normalized = normalizeClasificacion(clasif) || clasif.toUpperCase()
    onChange(normalized)
    setOpen(false)
    setSearchTerm('')
  }

  const handleAddNew = () => {
    if (!cleanSearch) return
    const normalized = normalizeClasificacion(cleanSearch) || cleanSearch.toUpperCase()
    if (!options.includes(normalized)) {
      setOptions((prev) => [...prev, normalized].sort())
    }
    onChange(normalized)
    setOpen(false)
    setSearchTerm('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (cleanSearch && !isExactMatch && filtered.length === 0) {
        handleAddNew()
      } else if (filtered[highlightedIndex]) {
        handleSelect(filtered[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  const normalizedCurrentValue = normalizeClasificacion(value)
  const currentStyle = normalizedCurrentValue
    ? getClasificacionStyle(normalizedCurrentValue)
    : null

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none shadow-2xs ${
          open
            ? 'border-[#1F7D3E] bg-white ring-2 ring-[#1F7D3E]/10'
            : 'border-[#dfe9e2] bg-[#fbfdfb] hover:bg-white hover:border-[#b8cfc1]'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {normalizedCurrentValue && currentStyle ? (
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`inline-flex items-center justify-center p-1 rounded-lg border ${currentStyle.bg} ${currentStyle.text} ${currentStyle.border} shrink-0`}
              >
                {getCategoryIcon(normalizedCurrentValue, 'size-3.5')}
              </span>
              <span className="text-xs font-black text-[#163522] truncate tracking-wide">
                {normalizedCurrentValue}
              </span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#eef7f0] text-[#1F7D3E] border border-[#d6ebd9] shrink-0">
                {currentStyle.prefix}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[#7a9182]">
              <Tag className="size-3.5 shrink-0 text-[#7a9182]" />
              <span className="text-xs font-semibold">Seleccionar o escribir tipo de riesgo...</span>
            </div>
          )}
        </div>
        <ChevronsUpDown className="size-4 text-[#7a9182] shrink-0" />
      </button>

      {/* Dropdown Popover */}
      {open && (
        <div className="absolute left-0 top-full mt-2 w-full bg-white border border-[#dfe9e2] rounded-2xl shadow-2xl z-[10020] p-2.5 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Search Bar */}
          <div className="relative">
            <Search className="size-3.5 text-[#7a9182] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setHighlightedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar clasificación o escribir nueva..."
              className="w-full text-xs font-bold text-[#163522] pl-9 pr-8 py-2.5 rounded-xl bg-[#f8faf9] border border-[#dfe9e2] focus:border-[#1F7D3E] focus:bg-white focus:outline-none placeholder:text-[#94a399] placeholder:font-normal transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  inputRef.current?.focus()
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#7a9182] hover:text-[#163522] rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>

          {/* Add New Custom Classification Option */}
          {cleanSearch && !isExactMatch && (
            <button
              type="button"
              onClick={handleAddNew}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-[#eef7f0] to-[#f4faf5] hover:from-[#e2f2e5] hover:to-[#ebf7ee] border border-[#cbe5cf] text-[#1F7D3E] text-xs font-black transition-all cursor-pointer shadow-2xs group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1 rounded-lg bg-white border border-[#cbe5cf] text-[#1F7D3E] shadow-2xs">
                  <Plus className="size-3.5" />
                </div>
                <span className="truncate">
                  Registrar nueva: <span className="underline">"{cleanSearch.toUpperCase()}"</span>
                </span>
              </div>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white text-[#1F7D3E] border border-[#cbe5cf] shrink-0">
                Prefijo: {getClasificacionPrefix(cleanSearch)}
              </span>
            </button>
          )}

          {/* Header Count */}
          <div className="flex items-center justify-between px-2 pt-1 text-[10.5px] font-bold text-[#7a9182] uppercase tracking-wider">
            <span>Clasificaciones Oficiales GTC 45</span>
            <span>{filtered.length} disponibles</span>
          </div>

          {/* Options List */}
          <div
            ref={listRef}
            className="max-h-72 overflow-y-auto space-y-1 p-0.5 scrollbar-thin scrollbar-thumb-[#d1e2d6] scrollbar-track-transparent"
          >
            {filtered.length === 0 && !cleanSearch ? (
              <div className="py-6 text-center text-xs text-[#7a9182]">
                No hay clasificaciones disponibles
              </div>
            ) : filtered.length === 0 && cleanSearch && !isExactMatch ? (
              <div className="py-4 px-3 text-center text-xs text-[#7a9182] bg-[#f8faf9] rounded-xl border border-dashed border-[#dfe9e2]">
                No existe coincidencia exacta. Haz clic arriba en <strong className="text-[#1F7D3E]">"Registrar nueva"</strong> o presiona <kbd className="px-1.5 py-0.5 bg-white border rounded text-[10px] font-mono">Enter</kbd>.
              </div>
            ) : (
              filtered.map((item, idx) => {
                const isSelected = item === normalizedCurrentValue
                const isHighlighted = idx === highlightedIndex
                const style = getClasificacionStyle(item)

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-[#1F7D3E] text-white shadow-xs'
                        : isHighlighted
                        ? 'bg-[#f0f7f2] text-[#163522]'
                        : 'text-[#163522] hover:bg-[#f7faf8]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center p-1 rounded-lg border shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : `${style.bg} ${style.text} ${style.border}`
                        }`}
                      >
                        {getCategoryIcon(item, 'size-3.5')}
                      </span>
                      <span className="truncate tracking-wide">{item}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded border transition-colors ${
                          isSelected
                            ? 'bg-white/20 text-white border-white/30'
                            : 'bg-[#f4f7f5] text-[#556b5c] border-[#dfe9e2]'
                        }`}
                      >
                        {style.prefix}
                      </span>
                      {isSelected && <Check className="size-4 text-white shrink-0" />}
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
