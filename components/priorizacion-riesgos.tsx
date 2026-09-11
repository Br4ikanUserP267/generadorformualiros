"use client"

import React, { useEffect, useState, useCallback, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Loader2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { InstructionsModal } from '@/components/InstructionsModal'
import { PriorizacionStats } from '@/components/priorizacion/priorizacion-stats'
import { RiskRowItem, RiskPrioritizationItem } from '@/components/priorizacion/risk-row-item'
import { InterventionDrawer } from '@/components/priorizacion/intervention-drawer'
import { apiFetch } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'

interface PriorizacionResponse {
  items: RiskPrioritizationItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  stats: {
    total: number
    muyAlto: number
    alto: number
    medio: number
    conEvaluacionPost: number
  }
  filterOptions: {
    areas: string[]
    procesos: string[]
  }
}

export function PriorizacionRiesgos() {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // Shell states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [instructionsOpen, setInstructionsOpen] = useState(false)

  // Data states
  const [risks, setRisks] = useState<RiskPrioritizationItem[]>([])
  const [stats, setStats] = useState({
    total: 0,
    muyAlto: 0,
    alto: 0,
    medio: 0,
    conEvaluacionPost: 0,
  })
  const [filterOptions, setFilterOptions] = useState<{
    areas: string[]
    procesos: string[]
  }>({
    areas: [],
    procesos: [],
  })

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filter states
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedArea, setSelectedArea] = useState('all')
  const [selectedProceso, setSelectedProceso] = useState('all')

  // Drawer states
  const [selectedRisk, setSelectedRisk] = useState<RiskPrioritizationItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch prioritized risks from API
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(currentPage))
      params.set('pageSize', String(pageSize))
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim())
      if (selectedArea && selectedArea !== 'all') params.set('area', selectedArea)
      if (selectedProceso && selectedProceso !== 'all') params.set('proceso', selectedProceso)

      const res = await apiFetch(`/api/priorizacion?${params.toString()}`)
      if (!res.ok) {
        const errPayload = await res.json().catch(() => null)
        throw new Error(errPayload?.details || errPayload?.error || `HTTP error ${res.status}`)
      }

      const data: PriorizacionResponse = await res.json()

      setRisks(data.items || [])
      setTotalItems(data.pagination?.total || 0)
      setTotalPages(data.pagination?.totalPages || 1)
      if (data.stats) {
        setStats(data.stats)
      }
      if (data.filterOptions) {
        setFilterOptions(data.filterOptions)
      }
    } catch (error: any) {
      console.error('Error fetching priorizacion data:', error?.message || error)
      toast({
        title: 'Error de carga',
        variant: 'destructive',
        description: error?.message || 'No se pudieron cargar los riesgos prioritarios.',
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, pageSize, debouncedSearch, selectedArea, selectedProceso])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reset filters
  const handleResetFilters = () => {
    setSearch('')
    setDebouncedSearch('')
    setSelectedArea('all')
    setSelectedProceso('all')
    setCurrentPage(1)
  }

  // Open intervention drawer
  const handleOpenIntervention = (risk: RiskPrioritizationItem) => {
    setSelectedRisk(risk)
    setDrawerOpen(true)
  }

  // Handle successful intervention save
  const handleSaveSuccess = (updatedRisk: RiskPrioritizationItem) => {
    // 1. Update row in memory
    setRisks((prev) =>
      prev.map((r) => (r.id === updatedRisk.id ? updatedRisk : r))
    )

    // 2. Refresh list and stats seamlessly
    startTransition(() => {
      loadData()
    })
  }

  const hasActiveFilters =
    search.trim() !== '' || selectedArea !== 'all' || selectedProceso !== 'all'

  return (
    <div className="min-h-screen bg-[#f8faf9] flex text-[#2c3630]">
      {/* 1. Left Sidebar */}
      <AppSidebar
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Top Application Header */}
        <DashboardHeader
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenInstructions={() => setInstructionsOpen(true)}
        />

        {/* 3. Main Priorización Body */}
        <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 select-none">
          {/* Page Header */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#1F7D3E]">
              Gestión de Riesgos
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#163522]">
              Priorización de Riesgos
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-[#1F7D3E]">
                Riesgos por Intervenir
              </span>
              <span className="size-1 rounded-full bg-[#d1e2d6] hidden sm:inline-block" />
              <p className="text-xs sm:text-sm text-[#5e6b62] font-medium">
                Mostrando riesgos con valoración Muy Alta, Alta o Media que aún no han sido mitigados.
              </p>
            </div>
          </div>

          {/* 4. Statistics Strip (5 Compact KPIs) */}
          <PriorizacionStats stats={stats} />

          {/* 5. Search & Filters Bar */}
          <div className="bg-white border border-[#dfe9e2] rounded-2xl p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-3xl">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="size-4 text-[#8aa08f] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar riesgo, área o proceso..."
                  className="w-full pl-9.5 pr-8 py-2 rounded-xl text-xs font-medium bg-[#fbfdfb] border border-[#d1e2d6] placeholder:text-[#8aa08f] focus:outline-none focus:border-[#1F7D3E] focus:bg-white transition-colors"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8aa08f] hover:text-[#2c3630] p-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Area Filter */}
              <div className="w-full sm:w-56">
                <select
                  value={selectedArea}
                  onChange={(e) => {
                    setSelectedArea(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-[#163522] bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="all">Área: Todas</option>
                  {filterOptions.areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Proceso Filter */}
              <div className="w-full sm:w-56">
                <select
                  value={selectedProceso}
                  onChange={(e) => {
                    setSelectedProceso(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="w-full py-2 px-3 rounded-xl text-xs font-bold text-[#163522] bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="all">Proceso: Todos</option>
                  {filterOptions.procesos.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#5e6b62] hover:text-[#1F7D3E] bg-[#f8faf9] border border-[#dfe9e2] hover:border-[#cbdad0] transition-colors shrink-0 cursor-pointer"
                  title="Limpiar filtros"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}
            </div>

            {/* Right Counter */}
            <div className="text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#f0f4f2]">
              <span className="text-xs font-black text-[#1F7D3E] tabular-nums">
                {totalItems}
              </span>
              <span className="text-xs font-bold text-[#5e6b62] ml-1">
                riesgos encontrados
              </span>
            </div>
          </div>

          {/* 6. Main List / Rows Container */}
          <div className="space-y-3">
            {loading ? (
              /* Skeleton Loader */
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#dfe9e2] rounded-2xl p-5 shadow-2xs animate-pulse flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="size-11 rounded-2xl bg-slate-200 shrink-0" />
                      <div className="space-y-2 flex-1 max-w-md">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 rounded w-1/3" />
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-6">
                      <div className="h-6 w-20 bg-slate-100 rounded-full" />
                      <div className="h-6 w-24 bg-slate-100 rounded-full" />
                      <div className="h-8 w-24 bg-slate-200 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : risks.length === 0 ? (
              /* Empty State */
              <div className="bg-white border border-[#dfe9e2] rounded-2xl p-12 text-center shadow-2xs space-y-3">
                <div className="size-12 rounded-2xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center mx-auto shadow-2xs">
                  <Shield className="size-6" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#163522]">
                  No se encontraron riesgos prioritarios
                </h3>
                <p className="text-xs text-[#5e6b62] max-w-sm mx-auto">
                  {hasActiveFilters
                    ? 'No hay riesgos que coincidan con los filtros aplicados. Intenta restablecer los filtros de búsqueda.'
                    : 'Actualmente no existen riesgos con valoración Muy Alta, Alta o Media pendientes de intervención.'}
                </p>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F7D3E] text-white text-xs font-bold hover:bg-[#186331] transition-all cursor-pointer shadow-xs"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>Restablecer filtros</span>
                  </button>
                )}
              </div>
            ) : (
              /* Risk Rows List with Aligned Column Headers */
              <div className="space-y-2">
                {/* Desktop Column Header */}
                <div className="hidden lg:flex items-center justify-between gap-3 lg:gap-4 px-6 py-1 text-[10px] font-black text-[#5e6b62] uppercase tracking-wider">
                  <div className="flex-1 min-w-0">Riesgo / Descripción</div>
                  <div className="flex items-center justify-end gap-3 sm:gap-4 lg:gap-5 shrink-0">
                    <div className="w-28 text-center">Clasificación</div>
                    <div className="w-44 xl:w-52 text-left">Área / Proceso</div>
                    <div className="w-28 text-center">Estado Inicial</div>
                    <div className="w-28 text-center">Estado Post</div>
                    <div className="w-28 text-right pr-2">Acciones</div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {risks.map((risk) => (
                    <RiskRowItem
                      key={risk.id}
                      risk={risk}
                      onOpenIntervention={handleOpenIntervention}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 7. Server-Side Pagination Bar */}
          {!loading && totalItems > 0 && (
            <div className="bg-white border border-[#dfe9e2] rounded-2xl px-4 sm:px-6 py-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: Total Range */}
              <div className="text-xs font-semibold text-[#5e6b62]">
                Mostrando{' '}
                <span className="font-bold text-[#1F7D3E] tabular-nums">
                  {(currentPage - 1) * pageSize + 1}
                </span>{' '}
                –{' '}
                <span className="font-bold text-[#1F7D3E] tabular-nums">
                  {Math.min(totalItems, currentPage * pageSize)}
                </span>{' '}
                de{' '}
                <span className="font-bold text-[#1F7D3E] tabular-nums">
                  {totalItems}
                </span>{' '}
                riesgos
              </div>

              {/* Center: Numeric Page Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Página anterior"
                  className="size-8 rounded-xl border border-[#dfe9e2] flex items-center justify-center text-[#5e6b62] hover:bg-[#f8faf9] hover:border-[#cbdad0] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return (
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1
                    )
                  })
                  .map((p, index, array) => {
                    const showEllipsis = index > 0 && p - array[index - 1] > 1

                    return (
                      <React.Fragment key={p}>
                        {showEllipsis && (
                          <span className="px-1 text-xs text-[#8aa08f]">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(p)}
                          className={`size-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            currentPage === p
                              ? 'bg-[#1F7D3E] text-white shadow-xs'
                              : 'border border-[#dfe9e2] text-[#5e6b62] hover:bg-[#f8faf9] hover:border-[#cbdad0]'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    )
                  })}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Página siguiente"
                  className="size-8 rounded-xl border border-[#dfe9e2] flex items-center justify-center text-[#5e6b62] hover:bg-[#f8faf9] hover:border-[#cbdad0] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>

              {/* Right: Page Size Selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#5e6b62]">Mostrar:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="py-1 px-2.5 rounded-xl text-xs font-bold text-[#163522] bg-[#fbfdfb] border border-[#d1e2d6] focus:outline-none focus:border-[#1F7D3E] cursor-pointer"
                >
                  <option value={10}>10 por página</option>
                  <option value={20}>20 por página</option>
                  <option value={50}>50 por página</option>
                </select>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 8. Slide-over Intervention Drawer */}
      <InterventionDrawer
        open={drawerOpen}
        risk={selectedRisk}
        onClose={() => setDrawerOpen(false)}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* 9. Instructions Modal */}
      <InstructionsModal
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
      />
    </div>
  )
}
