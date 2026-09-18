"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  FolderKanban,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Repeat,
  Building2,
  TrendingUp,
  BarChart3,
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Flame,
} from 'lucide-react'
import { apiFetch } from '@/lib/utils'

interface DashboardStatsProps {
  totals?: {
    totM: number
    totP: number
    ma: number
    al: number
    me: number
    ba: number
  }
}

interface RiskDistribution {
  total: number
  muyAlto: number
  alto: number
  moderado: number
  bajo: number
  porcentajes: {
    muyAlto: number
    alto: number
    moderado: number
    bajo: number
  }
  promedioRepeticion?: number
}

interface TopHazard {
  id: string
  codigo: string
  descripcion: string
  clasificacion: string
  nivelRiesgo: 'MUY_ALTO' | 'ALTO' | 'MODERADO' | 'BAJO'
  interpRiesgo: string
  totalOcurrencias: number
  matricesCount: number
  areasCount: number
  porcentajeMatrices: number
  planesCount: number
}

interface AreaStat {
  matrizId: string
  area: string
  responsable: string
  totalOcurrencias: number
  peligrosUnicosCount: number
  muyAlto: number
  alto: number
  moderado: number
  bajo: number
  porcentajeDelTotal: number
}

interface ClasificacionStat {
  nombre: string
  uniqueCount: number
  occurrencesCount: number
  muyAltoCount: number
  altoCount: number
  moderadoCount: number
  bajoCount: number
  porcentajeOcurrencias: number
}

// Format numbers with Colombian locale (e.g. 2.994)
function formatNumberCol(val: number): string {
  return new Intl.NumberFormat('es-CO').format(val || 0)
}

export function DashboardStats({ totals }: DashboardStatsProps) {
  // Mode switch: 'CATALOGO' (82 Peligros Únicos) vs 'OCURRENCIAS' (2.754 Repeticiones en Matrices)
  const [viewMode, setViewMode] = useState<'CATALOGO' | 'OCURRENCIAS'>('CATALOGO')

  // Selected Area filter ('TODAS' or specific area name)
  const [selectedArea, setSelectedArea] = useState<string>('TODAS')
  const [areaSearch, setAreaSearch] = useState<string>('')
  const [areaDropdownOpen, setAreaDropdownOpen] = useState(false)

  // Active Insights Tab
  const [insightsTab, setInsightsTab] = useState<'REPETICIONES' | 'AREAS' | 'CLASIFICACIONES'>('REPETICIONES')
  const [expandedInsights, setExpandedInsights] = useState(true)

  // Pagination & Filter state for tabs
  const [hazardsPage, setHazardsPage] = useState(1)
  const [tabAreasPage, setTabAreasPage] = useState(1)
  const [tabAreasSearch, setTabAreasSearch] = useState('')
  const [clasifPage, setClasifPage] = useState(1)

  // Interactive risk hover state
  const [hoveredRiskKey, setHoveredRiskKey] = useState<'ma' | 'al' | 'me' | 'ba' | null>(null)
  const [barLoaded, setBarLoaded] = useState(false)

  // API State
  const [loading, setLoading] = useState(true)
  const [statsData, setStatsData] = useState<{
    totalMatrices: number
    totalRiesgosRegistrados?: number
    catalogoUnico: RiskDistribution
    ocurrenciasGlobales: RiskDistribution
    topPeligrosRepetidos: TopHazard[]
    clasificaciones: ClasificacionStat[]
    areasRanking: AreaStat[]
    areaFilteredStats: any | null
  } | null>(null)

  // Fetch full institutional statistics
  const fetchStats = useCallback(async (areaName?: string) => {
    try {
      setLoading(true)
      const param = areaName && areaName !== 'TODAS' ? `?area=${encodeURIComponent(areaName)}` : ''
      const res = await apiFetch(`/api/dashboard/stats${param}`)
      if (!res.ok) throw new Error('Error al cargar estadísticas')
      const data = await res.json()
      setStatsData(data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
      setBarLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchStats(selectedArea)
  }, [fetchStats, selectedArea])

  // Compute active numbers based on mode & area selection
  const isAreaSelected = selectedArea !== 'TODAS' && !!statsData?.areaFilteredStats

  const activeStats = useMemo(() => {
    if (isAreaSelected && statsData?.areaFilteredStats) {
      const areaData = statsData.areaFilteredStats
      const total = viewMode === 'CATALOGO' ? areaData.totalPeligrosUnicos : areaData.totalOcurrencias
      const ma = areaData.muyAlto || 0
      const al = areaData.alto || 0
      const me = areaData.moderado || 0
      const ba = areaData.bajo || 0
      const safeTot = total > 0 ? total : 1
      return {
        total,
        ma,
        al,
        me,
        ba,
        maPct: (ma / safeTot) * 100,
        alPct: (al / safeTot) * 100,
        mePct: (me / safeTot) * 100,
        baPct: (ba / safeTot) * 100,
        label: `Área: ${selectedArea}`,
      }
    }

    if (statsData) {
      const target = viewMode === 'CATALOGO' ? statsData.catalogoUnico : statsData.ocurrenciasGlobales
      const total = target.total || 0
      const safeTot = total > 0 ? total : 1
      return {
        total,
        ma: target.muyAlto || 0,
        al: target.alto || 0,
        me: target.moderado || 0,
        ba: target.bajo || 0,
        maPct: ((target.muyAlto || 0) / safeTot) * 100,
        alPct: ((target.alto || 0) / safeTot) * 100,
        mePct: ((target.moderado || 0) / safeTot) * 100,
        baPct: ((target.bajo || 0) / safeTot) * 100,
        label: viewMode === 'CATALOGO' ? 'Catálogo Único de Peligros' : 'Repeticiones en Matrices',
      }
    }

    // Fallback to prop totals
    const tot = totals?.totP || 82
    return {
      total: tot,
      ma: totals?.ma || 0,
      al: totals?.al || 26,
      me: totals?.me || 48,
      ba: totals?.ba || 8,
      maPct: 0,
      alPct: 32,
      mePct: 58,
      baPct: 10,
      label: 'Catálogo de Peligros',
    }
  }, [viewMode, isAreaSelected, selectedArea, statsData, totals])

  // Filtered areas list for dropdown
  const filteredAreas = useMemo(() => {
    if (!statsData?.areasRanking) return []
    if (!areaSearch.trim()) return statsData.areasRanking
    const q = areaSearch.toLowerCase()
    return statsData.areasRanking.filter((a) => a.area.toLowerCase().includes(q))
  }, [statsData?.areasRanking, areaSearch])

  // Reset tab areas page when tab search changes
  useEffect(() => {
    setTabAreasPage(1)
  }, [tabAreasSearch])

  // TAB 2 (AREAS / MATRICES) PAGINATION (9 per page = 3x3)
  const TAB_AREAS_PAGE_SIZE = 9
  const tabFilteredAreas = useMemo(() => {
    const list = statsData?.areasRanking || []
    if (!tabAreasSearch.trim()) return list
    const q = tabAreasSearch.toLowerCase()
    return list.filter(
      (a) =>
        a.area.toLowerCase().includes(q) ||
        (a.responsable && a.responsable.toLowerCase().includes(q))
    )
  }, [statsData?.areasRanking, tabAreasSearch])

  const totalTabAreasPages = Math.max(1, Math.ceil(tabFilteredAreas.length / TAB_AREAS_PAGE_SIZE))
  const paginatedAreas = useMemo(() => {
    const start = (tabAreasPage - 1) * TAB_AREAS_PAGE_SIZE
    return tabFilteredAreas.slice(start, start + TAB_AREAS_PAGE_SIZE)
  }, [tabFilteredAreas, tabAreasPage])

  // TAB 3 (FAMILIAS / CLASIFICACIONES) PAGINATION (12 per page: shows all standard families; pagination activates if > 12)
  const CLASIF_PAGE_SIZE = 12
  const totalClasificaciones = useMemo(() => {
    return statsData?.clasificaciones || []
  }, [statsData?.clasificaciones])

  const totalClasifPages = Math.max(1, Math.ceil(totalClasificaciones.length / CLASIF_PAGE_SIZE))
  const paginatedClasificaciones = useMemo(() => {
    const start = (clasifPage - 1) * CLASIF_PAGE_SIZE
    return totalClasificaciones.slice(start, start + CLASIF_PAGE_SIZE)
  }, [totalClasificaciones, clasifPage])

  // TAB 1 (TOP PELIGROS) PAGINATION (10 per page)
  const HAZARDS_PAGE_SIZE = 10
  const allHazards = useMemo(() => {
    return statsData?.topPeligrosRepetidos || []
  }, [statsData?.topPeligrosRepetidos])

  const totalHazardsPages = Math.max(1, Math.ceil(allHazards.length / HAZARDS_PAGE_SIZE))
  const paginatedHazards = useMemo(() => {
    const start = (hazardsPage - 1) * HAZARDS_PAGE_SIZE
    return allHazards.slice(start, start + HAZARDS_PAGE_SIZE)
  }, [allHazards, hazardsPage])

  // Reusable pagination toolbar
  const renderPaginationBar = (
    currentPage: number,
    totalPages: number,
    totalItems: number,
    pageSize: number,
    label: string,
    onPageChange: (p: number) => void
  ) => {
    if (totalPages <= 1) return null
    const start = (currentPage - 1) * pageSize + 1
    const end = Math.min(currentPage * pageSize, totalItems)

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3.5 mt-1 border-t border-[#dfe9e2] text-xs">
        <div className="text-[#5e6b62] font-medium flex items-center gap-1">
          <span>Mostrando</span>
          <strong className="text-[#163522] font-mono font-bold">{start}</strong>
          <span>–</span>
          <strong className="text-[#163522] font-mono font-bold">{end}</strong>
          <span>de</span>
          <strong className="text-[#163522] font-mono font-bold">{totalItems}</strong>
          <span>{label}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#dfe9e2] bg-white text-[#5e6b62] hover:text-[#163522] hover:bg-[#eef7f0] hover:border-[#1F7D3E]/40 disabled:opacity-35 disabled:cursor-not-allowed font-bold transition-all text-[11px] cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="size-3.5" />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isActive = p === currentPage
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-7 h-7 px-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1F7D3E] text-white shadow-2xs scale-105'
                      : 'text-[#5e6b62] bg-white border border-[#dfe9e2] hover:bg-[#eef7f0] hover:text-[#163522]'
                  }`}
                >
                  {p}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#dfe9e2] bg-white text-[#5e6b62] hover:text-[#163522] hover:bg-[#eef7f0] hover:border-[#1F7D3E]/40 disabled:opacity-35 disabled:cursor-not-allowed font-bold transition-all text-[11px] cursor-pointer shadow-2xs"
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>
    )
  }

  // SVG Donut Slices config
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const donutSlices = [
    { key: 'ma', label: 'Muy Alto', sub: 'Nivel I', count: activeStats.ma, pct: activeStats.maPct, color: '#991b1b' },
    { key: 'al', label: 'Alto', sub: 'Nivel II', count: activeStats.al, pct: activeStats.alPct, color: '#ef4444' },
    { key: 'me', label: 'Moderado', sub: 'Nivel III', count: activeStats.me, pct: activeStats.mePct, color: '#eab308' },
    { key: 'ba', label: 'Bajo', sub: 'Nivel IV', count: activeStats.ba, pct: activeStats.baPct, color: '#16a34a' },
  ]

  const activeSlices = donutSlices.filter((s) => s.count > 0)
  const hasMultipleSlices = activeSlices.length > 1
  const gapLength = hasMultipleSlices ? 2.5 : 0
  const totalGap = hasMultipleSlices ? activeSlices.length * gapLength : 0
  const availableCircumference = circumference - totalGap
  let accumulatedLength = 0

  return (
    <section className="space-y-4 select-none">
      {/* 1. TOP CONTROL BAR: Institutional Perspective & Unit (Area) Selector */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-[#dfe9e2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: View Mode Pills (Catálogo Único vs Ocurrencias en Matrices) */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#f6f9f7] p-1 rounded-2xl border border-[#dfe9e2]">
          <button
            type="button"
            onClick={() => setViewMode('CATALOGO')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'CATALOGO'
                ? 'bg-[#1F7D3E] text-white shadow-xs'
                : 'text-[#5e6b62] hover:text-[#163522] hover:bg-white'
            }`}
          >
            <Layers className="size-3.5" />
            <span>Catálogo Único</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              viewMode === 'CATALOGO' ? 'bg-white/20 text-white' : 'bg-[#e2ede5] text-[#1F7D3E]'
            }`}>
              {statsData?.catalogoUnico.total ?? 82}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('OCURRENCIAS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'OCURRENCIAS'
                ? 'bg-[#1F7D3E] text-white shadow-xs'
                : 'text-[#5e6b62] hover:text-[#163522] hover:bg-white'
            }`}
          >
            <Repeat className="size-3.5" />
            <span>Ocurrencias / Repeticiones</span>
            <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
              viewMode === 'OCURRENCIAS' ? 'bg-white/20 text-white' : 'bg-[#e2ede5] text-[#1F7D3E]'
            }`}>
              {formatNumberCol(statsData?.ocurrenciasGlobales.total ?? 2754)}
            </span>
          </button>
        </div>

        {/* Right: Area Selector ("As a Whole" vs "As a Unit") */}
        <div className="relative flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#7a9182]">
            <Building2 className="size-4 text-[#1F7D3E]" />
            <span className="hidden sm:inline">Unidad / Área:</span>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setAreaDropdownOpen(!areaDropdownOpen)}
              className="inline-flex items-center justify-between gap-2 px-3.5 py-2 rounded-2xl bg-[#f8faf8] hover:bg-white border border-[#dfe9e2] text-xs font-black text-[#163522] min-w-[220px] max-w-[320px] truncate shadow-2xs cursor-pointer transition-all"
            >
              <span className="truncate">
                {selectedArea === 'TODAS' ? '🏥 Toda la Clínica (48 Áreas)' : selectedArea}
              </span>
              <Filter className="size-3.5 text-[#7a9182] shrink-0" />
            </button>

            {/* Dropdown Menu */}
            {areaDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-[#dfe9e2] shadow-xl z-50 p-2 space-y-2 animate-in fade-in zoom-in-95">
                {/* Search in Dropdown */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#8aa08f]" />
                  <input
                    type="text"
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    placeholder="Buscar área clínica..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f8faf8] border border-[#dfe9e2] rounded-xl outline-none focus:border-[#1F7D3E] font-medium"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedArea('TODAS')
                      setAreaDropdownOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      selectedArea === 'TODAS'
                        ? 'bg-[#eef7f0] text-[#1F7D3E]'
                        : 'hover:bg-[#f8faf8] text-[#163522]'
                    }`}
                  >
                    <span>🏥 Toda la Clínica (Consolidado)</span>
                    <span className="text-[10px] text-[#7a9182]">48 matrices</span>
                  </button>

                  {filteredAreas.map((a) => (
                    <button
                      key={a.matrizId}
                      type="button"
                      onClick={() => {
                        setSelectedArea(a.area)
                        setAreaDropdownOpen(false)
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                        selectedArea === a.area
                          ? 'bg-[#eef7f0] text-[#1F7D3E] font-bold'
                          : 'hover:bg-[#f8faf8] text-[#334155]'
                      }`}
                    >
                      <span className="truncate max-w-[200px]">{a.area}</span>
                      <span className="text-[10px] text-[#7a9182] tabular-nums font-mono shrink-0">
                        {a.totalOcurrencias} oc. ({a.peligrosUnicosCount} ún.)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedArea !== 'TODAS' && (
            <button
              type="button"
              onClick={() => setSelectedArea('TODAS')}
              className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              title="Restablecer a toda la clínica"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. MAIN KPI CARDS GRID - 6 STRICTLY SEPARATED STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* CARD 1: Peligros Únicos (Catálogo) */}
        <div className="rounded-3xl border border-[#dfe9e2] bg-white p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
              {isAreaSelected ? 'Peligros del Área' : 'Peligros Únicos'}
            </span>
            <div className="size-7 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center font-black">
              <Layers className="size-3.5" />
            </div>
          </div>

          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#163522] tabular-nums">
                {formatNumberCol(isAreaSelected ? (statsData?.areaFilteredStats?.totalPeligrosUnicos ?? activeStats.total) : (statsData?.catalogoUnico.total ?? 82))}
              </span>
              <span className="text-[10.5px] font-bold text-[#7a9182]">
                {isAreaSelected ? 'en área' : 'en catálogo'}
              </span>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#f0f5f1] flex items-center justify-between text-[10px] font-bold text-[#7a9182]">
              <span>Tasa repetición:</span>
              <span className="text-[#1F7D3E] font-black">
                {statsData?.ocurrenciasGlobales.promedioRepeticion ?? 33.6}x por peligro
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: Total Riesgos (Sin importar repetición) */}
        <div className="rounded-3xl border border-[#dfe9e2] bg-white p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
              Total Riesgos
            </span>
            <div className="size-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
              <BarChart3 className="size-3.5" />
            </div>
          </div>

          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-[#163522] tabular-nums">
                {formatNumberCol(statsData?.totalRiesgosRegistrados ?? totals?.totP ?? 2919)}
              </span>
              <span className="text-[10.5px] font-bold text-[#7a9182]">
                {isAreaSelected ? 'en esta área' : 'en la clínica'}
              </span>
            </div>

            <div className="mt-2 pt-1.5 border-t border-[#f0f5f1] flex items-center justify-between text-[10px] font-bold text-[#7a9182]">
              <span>Sin importar repetición:</span>
              <span className="text-blue-600 font-black">
                {isAreaSelected ? '1 matriz' : '48 matrices'}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: NIVEL I · MUY ALTO (Isolated) */}
        <div
          onMouseEnter={() => setHoveredRiskKey('ma')}
          onMouseLeave={() => setHoveredRiskKey(null)}
          className={`rounded-3xl border transition-all p-4 flex flex-col justify-between cursor-pointer ${
            hoveredRiskKey === 'ma'
              ? 'border-red-700 bg-red-50/50 shadow-md ring-2 ring-red-700/20'
              : 'border-[#dfe9e2] bg-white hover:border-red-400 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${activeStats.ma > 0 ? 'bg-red-800 animate-pulse' : 'bg-red-700'}`} />
              <span className="text-[10px] font-black uppercase tracking-wider text-red-900">
                Nivel I · Muy Alto
              </span>
            </div>
            <div className="size-7 rounded-lg bg-red-100 text-red-800 flex items-center justify-center font-black text-xs border border-red-200">
              I
            </div>
          </div>

          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl sm:text-3xl font-black tabular-nums ${activeStats.ma > 0 ? 'text-red-800' : 'text-[#163522]'}`}>
                {activeStats.ma}
              </span>
              <span className="text-[10.5px] font-bold text-[#7a9182]">
                ({Math.round(activeStats.maPct)}%)
              </span>
            </div>

            {/* Progress track */}
            <div className="mt-2 w-full bg-[#fcedee] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-red-700 h-full rounded-full transition-all duration-700"
                style={{ width: `${activeStats.maPct}%` }}
              />
            </div>

            <div className="mt-2 text-[9.5px] font-bold text-red-800">
              {activeStats.ma === 0 ? 'Sin peligros Nivel I' : 'Atención crítica'}
            </div>
          </div>
        </div>

        {/* CARD 4: NIVEL II · ALTO (Isolated) */}
        <div
          onMouseEnter={() => setHoveredRiskKey('al')}
          onMouseLeave={() => setHoveredRiskKey(null)}
          className={`rounded-3xl border transition-all p-4 flex flex-col justify-between cursor-pointer ${
            hoveredRiskKey === 'al'
              ? 'border-red-500 bg-red-50/40 shadow-md ring-2 ring-red-500/20'
              : 'border-[#dfe9e2] bg-white hover:border-red-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-red-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-red-700">
                Nivel II · Alto
              </span>
            </div>
            <div className="size-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-black text-xs border border-red-100">
              II
            </div>
          </div>

          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-red-600 tabular-nums">
                {formatNumberCol(activeStats.al)}
              </span>
              <span className="text-[10.5px] font-bold text-[#7a9182]">
                ({Math.round(activeStats.alPct)}%)
              </span>
            </div>

            <div className="mt-2 w-full bg-[#fef2f2] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${activeStats.alPct}%` }}
              />
            </div>

            <div className="mt-2 text-[9.5px] font-bold text-red-700">
              Control Específico GTC 45
            </div>
          </div>
        </div>

        {/* CARD 5: NIVEL III · MODERADO (Isolated) */}
        <div
          onMouseEnter={() => setHoveredRiskKey('me')}
          onMouseLeave={() => setHoveredRiskKey(null)}
          className={`rounded-3xl border transition-all p-4 flex flex-col justify-between cursor-pointer ${
            hoveredRiskKey === 'me'
              ? 'border-yellow-400 bg-yellow-50/40 shadow-md ring-2 ring-yellow-400/20'
              : 'border-[#dfe9e2] bg-white hover:border-yellow-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-yellow-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-yellow-800">
                Nivel III · Moderado
              </span>
            </div>
            <div className="size-7 rounded-lg bg-yellow-50 text-yellow-800 flex items-center justify-center font-black text-xs border border-yellow-200">
              III
            </div>
          </div>

          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-yellow-800 tabular-nums">
                {formatNumberCol(activeStats.me)}
              </span>
              <span className="text-[10.5px] font-bold text-[#7a9182]">
                ({Math.round(activeStats.mePct)}%)
              </span>
            </div>

            <div className="mt-2 w-full bg-[#f0f4f2] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-yellow-500 h-full rounded-full transition-all duration-700"
                style={{ width: `${activeStats.mePct}%` }}
              />
            </div>

            <div className="mt-2 text-[9.5px] font-bold text-[#7a9182]">
              Mejorable / Monitoreo SG-SST
            </div>
          </div>
        </div>

        {/* CARD 6: NIVEL IV · BAJO (Isolated) */}
        <div
          onMouseEnter={() => setHoveredRiskKey('ba')}
          onMouseLeave={() => setHoveredRiskKey(null)}
          className={`rounded-3xl border transition-all p-4 flex flex-col justify-between cursor-pointer ${
            hoveredRiskKey === 'ba'
              ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
              : 'border-[#dfe9e2] bg-white hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Nivel IV · Bajo
              </span>
            </div>
            <div className="size-7 rounded-lg bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-black text-xs">
              IV
            </div>
          </div>

          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 tabular-nums">
                {formatNumberCol(activeStats.ba)}
              </span>
              <span className="text-[10.5px] font-bold text-[#7a9182]">
                ({Math.round(activeStats.baPct)}%)
              </span>
            </div>

            <div className="mt-2.5 w-full bg-[#f0f4f2] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-700"
                style={{ width: `${activeStats.baPct}%` }}
              />
            </div>

            <div className="mt-2 text-[10px] font-bold text-[#8aa08f]">
              Aceptable / Medidas rutinarias
            </div>
          </div>
        </div>
      </div>

      {/* 3. VISUAL RISK PROPORTION & DONUT ROW */}
      <div className="bg-white p-5 rounded-3xl border border-[#dfe9e2] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#f0f5f1] pb-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#163522] flex items-center gap-2">
              <span>Distribución del Riesgo</span>
              <span className="text-[11px] font-bold text-[#7a9182] lowercase">
                ({viewMode === 'CATALOGO' ? 'por catálogo de peligros únicos' : 'por volumen de ocurrencias en matrices'})
              </span>
            </h3>
            {isAreaSelected && (
              <p className="text-xs text-[#1F7D3E] font-bold mt-0.5">
                📍 Filtrado para la unidad: {selectedArea}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-black">
            <span className="text-[#7a9182]">Total evaluado:</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-[#eef7f0] text-[#1F7D3E] font-mono">
              {formatNumberCol(activeStats.total)} {viewMode === 'CATALOGO' ? 'peligros únicos' : 'ocurrencias'}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="relative size-32 shrink-0 flex items-center justify-center">
            <svg className="size-full -rotate-90 overflow-visible" viewBox="0 0 130 130">
              <circle cx="65" cy="65" r={radius} fill="none" stroke="#eef2ef" strokeWidth="14" />
              {activeStats.total > 0 &&
                activeSlices.map((slice) => {
                  const fraction = slice.count / (activeStats.total || 1)
                  const sliceLength = Math.max(fraction * availableCircumference, 2)
                  const strokeOffset = -accumulatedLength
                  accumulatedLength += sliceLength + gapLength
                  const isHovered = hoveredRiskKey === slice.key
                  const isOther = hoveredRiskKey !== null && !isHovered

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
                      className="cursor-pointer transition-all duration-300 origin-center"
                      style={{
                        opacity: isOther ? 0.25 : 1,
                        filter: isHovered ? `drop-shadow(0 0 8px ${slice.color}88)` : 'none',
                      }}
                      onMouseEnter={() => setHoveredRiskKey(slice.key as any)}
                      onMouseLeave={() => setHoveredRiskKey(null)}
                    />
                  )
                })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xl font-black text-[#163522] tabular-nums leading-tight">
                {formatNumberCol(activeStats.total)}
              </span>
              <span className="text-[9px] font-bold text-[#7a9182] uppercase tracking-wider">
                {viewMode === 'CATALOGO' ? 'Únicos' : 'Total'}
              </span>
            </div>
          </div>

          {/* Segmented Linear Progress Bar & Detailed Chips */}
          <div className="flex-1 w-full space-y-3">
            {/* Multi-segment stacked bar */}
            <div className="w-full h-3 rounded-full bg-[#eef2ef] overflow-hidden flex shadow-inner">
              {activeStats.ma > 0 && (
                <div
                  className="h-full bg-[#991b1b] transition-all duration-500"
                  style={{ width: `${activeStats.maPct}%` }}
                  title={`Muy Alto: ${activeStats.ma} (${Math.round(activeStats.maPct)}%)`}
                />
              )}
              {activeStats.al > 0 && (
                <div
                  className="h-full bg-[#ef4444] transition-all duration-500"
                  style={{ width: `${activeStats.alPct}%` }}
                  title={`Alto: ${activeStats.al} (${Math.round(activeStats.alPct)}%)`}
                />
              )}
              {activeStats.me > 0 && (
                <div
                  className="h-full bg-[#eab308] transition-all duration-500"
                  style={{ width: `${activeStats.mePct}%` }}
                  title={`Moderado: ${activeStats.me} (${Math.round(activeStats.mePct)}%)`}
                />
              )}
              {activeStats.ba > 0 && (
                <div
                  className="h-full bg-[#16a34a] transition-all duration-500"
                  style={{ width: `${activeStats.baPct}%` }}
                  title={`Bajo: ${activeStats.ba} (${Math.round(activeStats.baPct)}%)`}
                />
              )}
            </div>

            {/* Interactive Chips Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div
                onMouseEnter={() => setHoveredRiskKey('ma')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  hoveredRiskKey === 'ma' ? 'border-red-700 bg-red-50/50 shadow-xs' : 'border-[#dfe9e2] bg-[#f8faf8]'
                }`}
              >
                <span className="size-2.5 rounded-full bg-[#991b1b] shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-[#163522] truncate text-[11px]">Nivel I · Muy Alto</div>
                  <div className="text-[10px] text-[#7a9182] font-mono">{activeStats.ma} ({Math.round(activeStats.maPct)}%)</div>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredRiskKey('al')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  hoveredRiskKey === 'al' ? 'border-red-500 bg-red-50/50 shadow-xs' : 'border-[#dfe9e2] bg-[#f8faf8]'
                }`}
              >
                <span className="size-2.5 rounded-full bg-[#ef4444] shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-[#163522] truncate text-[11px]">Nivel II · Alto</div>
                  <div className="text-[10px] text-[#7a9182] font-mono">{formatNumberCol(activeStats.al)} ({Math.round(activeStats.alPct)}%)</div>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredRiskKey('me')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  hoveredRiskKey === 'me' ? 'border-yellow-400 bg-yellow-50/50 shadow-xs' : 'border-[#dfe9e2] bg-[#f8faf8]'
                }`}
              >
                <span className="size-2.5 rounded-full bg-[#eab308] shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-[#163522] truncate text-[11px]">Nivel III · Moderado</div>
                  <div className="text-[10px] text-[#7a9182] font-mono">{formatNumberCol(activeStats.me)} ({Math.round(activeStats.mePct)}%)</div>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredRiskKey('ba')}
                onMouseLeave={() => setHoveredRiskKey(null)}
                className={`p-2 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                  hoveredRiskKey === 'ba' ? 'border-emerald-500 bg-emerald-50/50 shadow-xs' : 'border-[#dfe9e2] bg-[#f8faf8]'
                }`}
              >
                <span className="size-2.5 rounded-full bg-[#16a34a] shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-[#163522] truncate text-[11px]">Nivel IV · Bajo</div>
                  <div className="text-[10px] text-[#7a9182] font-mono">{formatNumberCol(activeStats.ba)} ({Math.round(activeStats.baPct)}%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EXPANDABLE INSTITUTIONAL INSIGHTS: Top Repeated, Area Ranking & Classification */}
      <div className="bg-white rounded-3xl border border-[#dfe9e2] shadow-xs overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-[#dfe9e2] p-3 sm:px-5 bg-[#fcfdfc]">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setInsightsTab('REPETICIONES')
                setExpandedInsights(true)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                insightsTab === 'REPETICIONES' && expandedInsights
                  ? 'bg-[#1F7D3E] text-white shadow-2xs'
                  : 'text-[#5e6b62] hover:bg-[#eef3f0] hover:text-[#163522]'
              }`}
            >
              <Flame className="size-3.5" />
              <span>Top Peligros Más Repetidos</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInsightsTab('AREAS')
                setExpandedInsights(true)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                insightsTab === 'AREAS' && expandedInsights
                  ? 'bg-[#1F7D3E] text-white shadow-2xs'
                  : 'text-[#5e6b62] hover:bg-[#eef3f0] hover:text-[#163522]'
              }`}
            >
              <Building2 className="size-3.5" />
              <span>Análisis por Áreas (48)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setInsightsTab('CLASIFICACIONES')
                setExpandedInsights(true)
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                insightsTab === 'CLASIFICACIONES' && expandedInsights
                  ? 'bg-[#1F7D3E] text-white shadow-2xs'
                  : 'text-[#5e6b62] hover:bg-[#eef3f0] hover:text-[#163522]'
              }`}
            >
              <BarChart3 className="size-3.5" />
              <span>Por Clasificación GTC 45</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpandedInsights(!expandedInsights)}
            className="text-[11px] font-bold text-[#7a9182] hover:text-[#1F7D3E] cursor-pointer px-2 py-1"
          >
            {expandedInsights ? 'Ocultar panel' : 'Ver detalle'}
          </button>
        </div>

        {/* Tab Body */}
        {expandedInsights && (
          <div className="p-4 sm:p-5">
            {/* TAB 1: TOP PELIGROS MÁS REPETIDOS */}
            {insightsTab === 'REPETICIONES' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#7a9182]">
                  <p>
                    Peligros del catálogo con mayor presencia transversal en las matrices de la Clínica Santa María S.A.S.:
                  </p>
                  <span className="font-mono text-[11px] font-bold text-[#163522] bg-[#eef7f0] px-2.5 py-1 rounded-lg border border-[#d2e4d7]">
                    {hazardsPage === 1 ? 'Top 10 más frecuentes' : `Página ${hazardsPage} de ${totalHazardsPages}`}
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[#dfe9e2]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8faf8] border-b border-[#dfe9e2] text-[#5e6b62] font-black uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-3.5 py-2.5">Código</th>
                        <th className="px-3.5 py-2.5">Descripción del Peligro</th>
                        <th className="px-3.5 py-2.5">Clasificación</th>
                        <th className="px-3.5 py-2.5">Nivel Riesgo</th>
                        <th className="px-3.5 py-2.5 text-center">Presencia en Matrices</th>
                        <th className="px-3.5 py-2.5 text-right">Ocurrencias Totales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f0f5f1] font-medium text-[#163522]">
                      {paginatedHazards.map((h) => (
                        <tr key={h.id} className="hover:bg-[#fbfdfb] transition-colors">
                          <td className="px-3.5 py-2.5 font-mono font-black text-[#1F7D3E]">
                            {h.codigo || '—'}
                          </td>
                          <td className="px-3.5 py-2.5 max-w-sm truncate" title={h.descripcion}>
                            {h.descripcion}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#eef3f0] text-[#5e6b62] text-[10px] font-bold">
                              {h.clasificacion}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                              h.nivelRiesgo === 'MUY_ALTO'
                                ? 'bg-red-100 text-red-800'
                                : h.nivelRiesgo === 'ALTO'
                                ? 'bg-amber-100 text-amber-800'
                                : h.nivelRiesgo === 'MODERADO'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {h.nivelRiesgo === 'MUY_ALTO' ? 'Nivel I (Muy Alto)' : h.nivelRiesgo === 'ALTO' ? 'Nivel II (Alto)' : h.nivelRiesgo === 'MODERADO' ? 'Nivel III (Moderado)' : 'Nivel IV (Bajo)'}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <span className="inline-flex items-center gap-1 font-bold text-[#1F7D3E]">
                              {h.matricesCount} matrices ({h.porcentajeMatrices}%)
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right font-black font-mono text-[#163522]">
                            {h.totalOcurrencias} veces
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {renderPaginationBar(
                  hazardsPage,
                  totalHazardsPages,
                  allHazards.length,
                  HAZARDS_PAGE_SIZE,
                  'peligros en catálogo',
                  setHazardsPage
                )}
              </div>
            )}

            {/* TAB 2: ANÁLISIS POR ÁREAS (COMO UNIDADES) */}
            {insightsTab === 'AREAS' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#7a9182]">
                  <p>
                    Perfil de exposición al riesgo por área clínica (haga clic en <strong>Filtrar</strong> para ver el desglose exclusivo de esa unidad):
                  </p>
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <div className="relative">
                      <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7a9182]" />
                      <input
                        type="text"
                        placeholder="Buscar área o responsable..."
                        value={tabAreasSearch}
                        onChange={(e) => setTabAreasSearch(e.target.value)}
                        className="pl-8 pr-6 py-1 text-xs rounded-lg border border-[#dfe9e2] bg-white text-[#163522] placeholder:text-[#9bb0a2] focus:outline-none focus:ring-1 focus:ring-[#1F7D3E] w-48 sm:w-56"
                      />
                      {tabAreasSearch && (
                        <button
                          type="button"
                          onClick={() => setTabAreasSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7a9182] hover:text-[#163522]"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>
                    <span className="font-mono text-[11px] font-bold text-[#163522] bg-[#eef7f0] px-2.5 py-1 rounded-lg border border-[#d2e4d7] whitespace-nowrap">
                      {tabFilteredAreas.length} {tabFilteredAreas.length === 1 ? 'Área' : 'Áreas'}
                    </span>
                  </div>
                </div>

                {paginatedAreas.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-[#dfe9e2] bg-[#fbfdfb] text-xs text-[#7a9182]">
                    No se encontraron matrices o áreas que coincidan con &ldquo;{tabAreasSearch}&rdquo;
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {paginatedAreas.map((a) => (
                      <div
                        key={a.matrizId}
                        className="p-3.5 rounded-2xl border border-[#dfe9e2] bg-[#fbfdfb] hover:bg-white hover:border-[#1F7D3E]/40 transition-all flex flex-col justify-between space-y-2 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-black text-xs text-[#163522] truncate" title={a.area}>
                              {a.area}
                            </h4>
                            <p className="text-[10px] text-[#7a9182] truncate">
                              {a.responsable}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedArea(a.area)}
                            className="px-2 py-0.5 rounded-lg bg-[#eef7f0] hover:bg-[#1F7D3E] hover:text-white text-[#1F7D3E] text-[10.5px] font-black transition-colors shrink-0 cursor-pointer"
                          >
                            Filtrar
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-bold pt-1 border-t border-[#f0f5f1]">
                          <span className="text-[#163522] font-black">
                            {a.totalOcurrencias} ocurrencias
                          </span>
                          <span className="text-[#7a9182]">
                            {a.peligrosUnicosCount} peligros únicos
                          </span>
                        </div>

                        {/* Mini risk composition bar */}
                        <div className="w-full h-1.5 rounded-full bg-[#eef2ef] overflow-hidden flex">
                          {a.alto > 0 && (
                            <div
                              className="h-full bg-[#ea580c]"
                              style={{ width: `${(a.alto / (a.totalOcurrencias || 1)) * 100}%` }}
                              title={`Altos: ${a.alto}`}
                            />
                          )}
                          {a.moderado > 0 && (
                            <div
                              className="h-full bg-[#eab308]"
                              style={{ width: `${(a.moderado / (a.totalOcurrencias || 1)) * 100}%` }}
                              title={`Moderados: ${a.moderado}`}
                            />
                          )}
                          {a.bajo > 0 && (
                            <div
                              className="h-full bg-[#16a34a]"
                              style={{ width: `${(a.bajo / (a.totalOcurrencias || 1)) * 100}%` }}
                              title={`Bajos: ${a.bajo}`}
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[9.5px] font-mono font-bold text-[#7a9182]">
                          <span className="text-amber-700">{a.alto} altos</span>
                          <span className="text-yellow-700">{a.moderado} mod.</span>
                          <span className="text-emerald-700">{a.bajo} bajos</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {renderPaginationBar(
                  tabAreasPage,
                  totalTabAreasPages,
                  tabFilteredAreas.length,
                  TAB_AREAS_PAGE_SIZE,
                  'áreas / matrices',
                  setTabAreasPage
                )}
              </div>
            )}

            {/* TAB 3: POR CLASIFICACIÓN GTC 45 */}
            {insightsTab === 'CLASIFICACIONES' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-[#7a9182]">
                  <p>
                    Volumen de peligros únicos y ocurrencias por familia de peligro según GTC 45:
                  </p>
                  <span className="font-mono text-[11px] font-bold text-[#163522] bg-[#eef7f0] px-2.5 py-1 rounded-lg border border-[#d2e4d7]">
                    {totalClasificaciones.length} Familias GTC 45
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {paginatedClasificaciones.map((c) => (
                    <div
                      key={c.nombre}
                      className="p-3.5 rounded-2xl border border-[#dfe9e2] bg-[#fbfdfb] flex flex-col justify-between space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#163522]">
                          {c.nombre}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#eef7f0] text-[#1F7D3E] font-black text-[10px] font-mono">
                          {c.uniqueCount} en catálogo
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between text-xs pt-1 border-t border-[#f0f5f1]">
                        <span className="text-[#5e6b62] font-medium">Repeticiones totales:</span>
                        <span className="font-black font-mono text-[#163522]">
                          {formatNumberCol(c.occurrencesCount)} ({c.porcentajeOcurrencias}%)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#7a9182]">
                        {c.muyAltoCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-900 border border-red-300">
                            {c.muyAltoCount} muy altos
                          </span>
                        )}
                        {c.altoCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                            {c.altoCount} altos
                          </span>
                        )}
                        {c.moderadoCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-800 border border-yellow-200">
                            {c.moderadoCount} moderados
                          </span>
                        )}
                        {c.bajoCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {c.bajoCount} bajos
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {renderPaginationBar(
                  clasifPage,
                  totalClasifPages,
                  totalClasificaciones.length,
                  CLASIF_PAGE_SIZE,
                  'familias de peligro',
                  setClasifPage
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
