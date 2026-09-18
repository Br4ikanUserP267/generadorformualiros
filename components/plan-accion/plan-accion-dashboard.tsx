"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet,
  Layers,
  Building2,
  Eye,
  Edit3,
  SlidersHorizontal,
  ChevronLeft,
  Info,
  Check,
  AlertCircle,
  ShieldCheck,
  X,
} from 'lucide-react'
import { apiFetch } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { getClasificacionStyle, CLASIFICACIONES_RIESGO } from '@/lib/gtc45-utils'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { InstructionsModal } from '@/components/InstructionsModal'
import { PlanAccionModal } from './plan-accion-modal'
import { PlanAccionPreviewModal } from './plan-accion-preview-modal'

interface PeligroPlanItem {
  id: string
  codigo?: string | null
  clasificacion: string
  descripcion: string
  efectosPosibles?: string | null
  nivelRiesgo?: number | null
  interpRiesgo?: string | null
  aceptabilidad?: string | null
  eliminacion?: string | null
  sustitucion?: string | null
  controlesIngenieria?: string | null
  controlesAdministrativos?: string | null
  epp?: string | null
  planesAccion: any[]
  totalAcciones: number
  estadoPlan: 'SIN_PLAN' | 'PENDIENTE' | 'EN_PROCESO' | 'EJECUTADO' | string
  matricesCount: number
  actividadesCount: number
  areas: string[]
}

interface RiskLevelStat {
  total: number
  conPlan: number
  sinPlan: number
  cobertura: number
  totalAcciones: number
}

interface StatsData {
  totalPeligros: number
  peligrosConPlan: number
  peligrosCriticosSinPlan: number
  totalAcciones: number
  accionesPendientes: number
  accionesEnProgreso: number
  accionesEjecutadas: number
  porcentajeCumplimiento: number
  porcentajeCobertura: number
  nivelI: RiskLevelStat
  nivelII: RiskLevelStat
  nivelIII: RiskLevelStat
}

export function PlanAccionDashboard() {
  const { toast } = useToast()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [instructionsOpen, setInstructionsOpen] = useState(false)

  // Data & Loading
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [peligros, setPeligros] = useState<PeligroPlanItem[]>([])
  const [stats, setStats] = useState<StatsData>({
    totalPeligros: 0,
    peligrosConPlan: 0,
    peligrosCriticosSinPlan: 0,
    totalAcciones: 0,
    accionesPendientes: 0,
    accionesEnProgreso: 0,
    accionesEjecutadas: 0,
    porcentajeCumplimiento: 0,
    porcentajeCobertura: 0,
    nivelI: { total: 0, conPlan: 0, sinPlan: 0, cobertura: 100, totalAcciones: 0 },
    nivelII: { total: 0, conPlan: 0, sinPlan: 0, cobertura: 0, totalAcciones: 0 },
    nivelIII: { total: 0, conPlan: 0, sinPlan: 0, cobertura: 0, totalAcciones: 0 },
  })
  const [areasList, setAreasList] = useState<string[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [clasificacionFilter, setClasificacionFilter] = useState('TODOS')
  const [nivelRiesgoFilter, setNivelRiesgoFilter] = useState('TODOS')
  const [estadoPlanFilter, setEstadoPlanFilter] = useState('TODOS')
  const [areaFilter, setAreaFilter] = useState('TODOS')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(15)

  // Modals
  const [selectedDangerForEdit, setSelectedDangerForEdit] = useState<PeligroPlanItem | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedDangerForPreview, setSelectedDangerForPreview] = useState<PeligroPlanItem | null>(null)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (search.trim()) params.append('q', search.trim())
      if (clasificacionFilter !== 'TODOS') params.append('clasificacion', clasificacionFilter)
      if (nivelRiesgoFilter !== 'TODOS') params.append('nivelRiesgo', nivelRiesgoFilter)
      if (estadoPlanFilter !== 'TODOS') params.append('estadoPlan', estadoPlanFilter)
      if (areaFilter !== 'TODOS') params.append('area', areaFilter)

      const res = await apiFetch(`/api/plan-accion?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Error al cargar datos del plan de acción')
      }
      const data = await res.json()
      setPeligros(data.peligros || data.items || [])
      setStats({
        totalPeligros: data.stats?.totalPeligros ?? 0,
        peligrosConPlan: data.stats?.peligrosConPlan ?? 0,
        peligrosCriticosSinPlan: data.stats?.peligrosCriticosSinPlan ?? 0,
        totalAcciones: data.stats?.totalAcciones ?? 0,
        accionesPendientes: data.stats?.accionesPendientes ?? 0,
        accionesEnProgreso: data.stats?.accionesEnProgreso ?? 0,
        accionesEjecutadas: data.stats?.accionesEjecutadas ?? 0,
        porcentajeCumplimiento: data.stats?.porcentajeCumplimiento ?? 0,
        porcentajeCobertura: data.stats?.porcentajeCobertura ?? 0,
        nivelI: data.stats?.nivelI ?? { total: 0, conPlan: 0, sinPlan: 0, cobertura: 100, totalAcciones: 0 },
        nivelII: data.stats?.nivelII ?? { total: 0, conPlan: 0, sinPlan: 0, cobertura: 0, totalAcciones: 0 },
        nivelIII: data.stats?.nivelIII ?? { total: 0, conPlan: 0, sinPlan: 0, cobertura: 0, totalAcciones: 0 },
      })
      if (Array.isArray(data.areas)) {
        setAreasList(data.areas)
      }
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Error de carga',
        description: err.message || 'No se pudieron obtener los planes de acción',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [search, clasificacionFilter, nivelRiesgoFilter, estadoPlanFilter, areaFilter, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [search, clasificacionFilter, nivelRiesgoFilter, estadoPlanFilter, areaFilter])

  // Pagination slice
  const totalPages = Math.ceil(peligros.length / pageSize) || 1
  const paginatedPeligros = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return peligros.slice(start, start + pageSize)
  }, [peligros, currentPage, pageSize])

  const handleResetFilters = () => {
    setSearch('')
    setClasificacionFilter('TODOS')
    setNivelRiesgoFilter('TODOS')
    setEstadoPlanFilter('TODOS')
    setAreaFilter('TODOS')
    setCurrentPage(1)
  }

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      setExporting(true)
      const params = new URLSearchParams()
      if (search.trim()) params.append('q', search.trim())
      if (clasificacionFilter !== 'TODOS') params.append('clasificacion', clasificacionFilter)
      if (nivelRiesgoFilter !== 'TODOS') params.append('nivelRiesgo', nivelRiesgoFilter)
      if (estadoPlanFilter !== 'TODOS') params.append('estadoPlan', estadoPlanFilter)

      const response = await apiFetch(`/api/plan-accion/export?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Error al generar el archivo Excel')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const dateStr = new Date().toISOString().split('T')[0]
      a.download = `Plan_de_Accion_5W2H_${dateStr}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Exportación exitosa',
        description: 'El archivo Excel 5W2H ha sido descargado correctamente.',
      })
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Error al exportar',
        description: err.message || 'No se pudo descargar el archivo Excel',
        variant: 'destructive',
      })
    } finally {
      setExporting(false)
    }
  }

  const openEditModal = (danger: PeligroPlanItem) => {
    setSelectedDangerForEdit(danger)
    setEditModalOpen(true)
  }

  const openPreviewModal = (danger: PeligroPlanItem) => {
    setSelectedDangerForPreview(danger)
    setPreviewModalOpen(true)
  }

  return (
    <div className="flex min-h-screen bg-[#f8faf8] text-[#163522]">
      {/* 1. Lateral Navigation */}
      <AppSidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Top Application Header */}
        <DashboardHeader
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenInstructions={() => setInstructionsOpen(true)}
        />

        {/* 3. Main Dashboard Body */}
        <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#dfe9e2] shadow-xs">
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2.5 py-0.5 rounded-full">
                  Módulo Estratégico SG-SST
                </span>
                <span className="text-[10px] font-bold text-[#7a9182]">
                  Metodología 5W2H
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#163522]">
                Plan de Acción 5W2H por Peligro
              </h1>
              <p className="text-xs sm:text-sm text-[#5e6b62] max-w-3xl font-medium leading-relaxed">
                Estructure las acciones correctivas y preventivas mediante el estándar internacional 5W2H (Qué, Por qué, Dónde, Cuándo, Quién, Cómo y Cuánto).
                <strong className="text-[#1F7D3E] font-bold"> Cada plan se sincroniza automáticamente</strong> en todas las matrices de la Clínica Santa María S.A.S. donde se encuentre el peligro.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="size-10 rounded-2xl border border-[#dfe9e2] bg-[#f8faf8] hover:bg-[#eef7f0] hover:text-[#1F7D3E] text-[#5e6b62] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                title="Refrescar datos"
              >
                <RefreshCw className={`size-4.5 ${loading ? 'animate-spin text-[#1F7D3E]' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exporting || loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#1F7D3E] hover:bg-[#186331] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#1F7D3E]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="size-4" />
                <span>{exporting ? 'Generando Excel...' : 'Descargar Excel 5W2H'}</span>
              </button>
            </div>
          </div>

          {/* Sync Notice Alert */}
          <div className="flex items-start sm:items-center gap-3 bg-[linear-gradient(90deg,#f0f9f2_0%,#eef7f0_100%)] border border-[#cbe4d1] px-4 py-3 rounded-2xl text-xs text-[#1e5230]">
            <ShieldCheck className="size-5 text-[#1F7D3E] shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
              <strong className="font-black">Principio de Sincronización Automática:</strong> El plan de acción 5W2H está vinculado al catálogo de peligros clínicos. Si añade o actualiza una acción para un peligro (ej. <em>Riesgo Biológico por Punzocortantes</em>), el cambio se actualizará en tiempo real en la matriz de Urgencias, Hospitalización, Cirugía y cualquier otra área donde dicho peligro esté registrado.
            </div>
          </div>

          {/* KPI Cards Grid - Each Danger Level Strictly Separated */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Nivel I - Muy Alto (El más rojo) */}
            <div
              onClick={() => setNivelRiesgoFilter(nivelRiesgoFilter === 'I' ? 'TODOS' : 'I')}
              className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                nivelRiesgoFilter === 'I'
                  ? 'border-red-700 ring-2 ring-red-700/20 shadow-sm bg-red-50/30'
                  : 'border-[#dfe9e2] hover:border-red-400 shadow-xs'
              }`}
              title="Clic para filtrar por Nivel I (Muy Alto)"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${stats.nivelI.sinPlan > 0 ? 'bg-red-800 animate-pulse' : 'bg-red-700'}`} />
                  <span className="text-[11px] font-black uppercase tracking-wider text-red-900">
                    Nivel I · Muy Alto
                  </span>
                </div>
                <div className="size-8 rounded-xl bg-red-100 text-red-800 flex items-center justify-center font-black text-xs border border-red-200">
                  I
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl sm:text-3xl font-black ${stats.nivelI.sinPlan > 0 ? 'text-red-800' : 'text-[#163522]'}`}>
                    {stats.nivelI.sinPlan}
                  </span>
                  <span className="text-xs font-bold text-[#7a9182]">
                    sin plan (de {stats.nivelI.total})
                  </span>
                </div>
                <div className="mt-2.5 w-full bg-[#fcedee] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-700 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.nivelI.total > 0 ? stats.nivelI.cobertura : 100}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between items-center text-[10.5px] font-bold text-[#7a9182]">
                  <span>{stats.nivelI.conPlan} con plan</span>
                  <span className="text-red-900 font-black">
                    {stats.nivelI.total > 0 ? `${stats.nivelI.cobertura}% cobertura` : '0 peligros'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2: Nivel II - Alto (Rojo) */}
            <div
              onClick={() => setNivelRiesgoFilter(nivelRiesgoFilter === 'II' ? 'TODOS' : 'II')}
              className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                nivelRiesgoFilter === 'II'
                  ? 'border-red-500 ring-2 ring-red-500/20 shadow-sm bg-red-50/20'
                  : 'border-[#dfe9e2] hover:border-red-300 shadow-xs'
              }`}
              title="Clic para filtrar por Nivel II (Alto)"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${stats.nivelII.sinPlan > 0 ? 'bg-red-500' : 'bg-red-400'}`} />
                  <span className="text-[11px] font-black uppercase tracking-wider text-red-700">
                    Nivel II · Alto
                  </span>
                </div>
                <div className="size-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-black text-xs border border-red-100">
                  II
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl sm:text-3xl font-black ${stats.nivelII.sinPlan > 0 ? 'text-red-600' : 'text-[#163522]'}`}>
                    {stats.nivelII.sinPlan}
                  </span>
                  <span className="text-xs font-bold text-[#7a9182]">
                    sin plan (de {stats.nivelII.total})
                  </span>
                </div>
                <div className="mt-2.5 w-full bg-[#fef2f2] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-red-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.nivelII.cobertura}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between items-center text-[10.5px] font-bold text-[#7a9182]">
                  <span>{stats.nivelII.conPlan} con plan</span>
                  <span className="text-red-700 font-black">
                    {stats.nivelII.cobertura}% cobertura
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Nivel III - Moderado (Amarillo) */}
            <div
              onClick={() => setNivelRiesgoFilter(nivelRiesgoFilter === 'III' ? 'TODOS' : 'III')}
              className={`bg-white p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md ${
                nivelRiesgoFilter === 'III'
                  ? 'border-yellow-400 ring-2 ring-yellow-400/20 shadow-sm bg-yellow-50/20'
                  : 'border-[#dfe9e2] hover:border-yellow-300 shadow-xs'
              }`}
              title="Clic para filtrar por Nivel III (Moderado)"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-yellow-500" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-yellow-800">
                    Nivel III · Moderado
                  </span>
                </div>
                <div className="size-8 rounded-xl bg-yellow-50 text-yellow-800 flex items-center justify-center font-black text-xs border border-yellow-200">
                  III
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-2xl sm:text-3xl font-black ${stats.nivelIII.sinPlan > 0 ? 'text-yellow-800' : 'text-[#163522]'}`}>
                    {stats.nivelIII.sinPlan}
                  </span>
                  <span className="text-xs font-bold text-[#7a9182]">
                    sin plan (de {stats.nivelIII.total})
                  </span>
                </div>
                <div className="mt-2.5 w-full bg-[#fefce8] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-yellow-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.nivelIII.cobertura}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between items-center text-[10.5px] font-bold text-[#7a9182]">
                  <span>{stats.nivelIII.conPlan} con plan</span>
                  <span className="text-yellow-800 font-black">
                    {stats.nivelIII.cobertura}% cobertura
                  </span>
                </div>
              </div>
            </div>

            {/* Card 4: Cobertura Institucional 5W2H */}
            <div className="bg-white p-5 rounded-3xl border border-[#dfe9e2] shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#7a9182]">
                  Cobertura 5W2H
                </span>
                <div className="size-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="size-4.5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#163522]">
                    {stats.peligrosConPlan}
                  </span>
                  <span className="text-xs font-bold text-[#7a9182]">
                    con plan (de {stats.totalPeligros})
                  </span>
                </div>
                <div className="mt-2.5 w-full bg-[#eef3f0] h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.porcentajeCobertura}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between items-center text-[10.5px] font-bold">
                  <span className="text-[#7a9182]">{Math.max(0, stats.totalPeligros - stats.peligrosConPlan)} sin plan formulado</span>
                  <span className="text-blue-700 font-black">{stats.porcentajeCobertura}% cobertura</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#dfe9e2] shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#8aa08f]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar peligro, código, descripción o controles..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-[#f8faf8] hover:bg-white focus:bg-white border border-[#dfe9e2] focus:border-[#1F7D3E] rounded-2xl outline-none transition-all placeholder:text-[#8aa08f] text-[#163522] font-medium shadow-2xs"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full bg-[#eef3f0] text-[#5e6b62] flex items-center justify-center hover:bg-[#dfe9e2]"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>

              {/* Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Clasificación */}
                <div className="flex items-center gap-1.5 bg-[#f8faf8] px-3 py-2 rounded-2xl border border-[#dfe9e2]">
                  <span className="text-[11px] font-bold text-[#7a9182]">Clasificación:</span>
                  <select
                    value={clasificacionFilter}
                    onChange={(e) => setClasificacionFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#163522] outline-none cursor-pointer"
                  >
                    <option value="TODOS">Todas</option>
                    {CLASIFICACIONES_RIESGO.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nivel de Riesgo GTC 45 */}
                <div className="flex items-center gap-1.5 bg-[#f8faf8] px-3 py-2 rounded-2xl border border-[#dfe9e2]">
                  <span className="text-[11px] font-bold text-[#7a9182]">Nivel Riesgo:</span>
                  <select
                    value={nivelRiesgoFilter}
                    onChange={(e) => setNivelRiesgoFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#163522] outline-none cursor-pointer"
                  >
                    <option value="TODOS">Todos los Niveles ({stats.totalPeligros})</option>
                    <option value="I">Nivel I · Muy Alto ({stats.nivelI.total})</option>
                    <option value="II">Nivel II · Alto ({stats.nivelII.total})</option>
                    <option value="III">Nivel III · Moderado ({stats.nivelIII.total})</option>
                  </select>
                </div>

                {/* Plan 5W2H Filter */}
                <div className="flex items-center gap-1.5 bg-[#f8faf8] px-3 py-2 rounded-2xl border border-[#dfe9e2]">
                  <span className="text-[11px] font-bold text-[#7a9182]">Plan 5W2H:</span>
                  <select
                    value={estadoPlanFilter}
                    onChange={(e) => setEstadoPlanFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[#163522] outline-none cursor-pointer"
                  >
                    <option value="TODOS">Todos ({stats.totalPeligros})</option>
                    <option value="CON_PLAN">Con Plan Formulado ({stats.peligrosConPlan})</option>
                    <option value="SIN_PLAN">Sin Plan Formulado ({Math.max(0, stats.totalPeligros - stats.peligrosConPlan)})</option>
                  </select>
                </div>

                {/* Reset filters */}
                {(search || clasificacionFilter !== 'TODOS' || nivelRiesgoFilter !== 'TODOS' || estadoPlanFilter !== 'TODOS' || areaFilter !== 'TODOS') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-2xl border border-red-200 transition-colors"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>

            {/* Results count & Filter badge indicators */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#7a9182] pt-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span>
                  Mostrando <strong className="text-[#163522]">{peligros.length}</strong> peligros:
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-100 text-red-900 font-bold text-[10.5px] border border-red-300">
                  Nivel I: {stats.nivelI.total}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-red-700 font-bold text-[10.5px] border border-red-200">
                  Nivel II: {stats.nivelII.total}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-800 font-bold text-[10.5px] border border-yellow-200">
                  Nivel III: {stats.nivelIII.total}
                </span>
              </div>
              <span className="text-[11px]">
                Página <strong className="text-[#163522]">{currentPage}</strong> de {totalPages}
              </span>
            </div>
          </div>

          {/* Dangers List / Cards */}
          {loading ? (
            <div className="bg-white p-12 rounded-3xl border border-[#dfe9e2] text-center space-y-3">
              <RefreshCw className="size-8 text-[#1F7D3E] animate-spin mx-auto" />
              <p className="text-sm font-bold text-[#163522]">Cargando peligros y planes de acción 5W2H...</p>
              <p className="text-xs text-[#7a9182]">Consultando catálogo clínico y presencia en matrices</p>
            </div>
          ) : paginatedPeligros.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#dfe9e2] text-center space-y-3">
              <div className="size-12 rounded-full bg-[#f0f5f1] text-[#1F7D3E] flex items-center justify-center mx-auto">
                <Search className="size-6" />
              </div>
              <h3 className="text-base font-black text-[#163522]">No se encontraron peligros</h3>
              <p className="text-xs text-[#7a9182] max-w-md mx-auto">
                No hay registros que coincidan con los filtros seleccionados. Intente ajustar el término de búsqueda o restablecer los filtros.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-[#1F7D3E] text-white rounded-xl text-xs font-bold hover:bg-[#186331] transition-all"
              >
                Ver todos los peligros
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {paginatedPeligros.map((danger) => {
                const badge = getClasificacionStyle(danger.clasificacion || '')
                const actionsCount = danger.totalAcciones || 0
                const hasActions = actionsCount > 0

                // Interpretation of risk level (Muy Alto, Alto, Moderado)
                let riskBadgeClass = 'bg-yellow-100 text-yellow-800 border-yellow-200'
                let riskLevelText = 'Nivel III (Moderado)'
                const nr = danger.nivelRiesgo || 0
                const interp = (danger.interpRiesgo || '').toUpperCase()

                if (interp.startsWith('I ') || interp === 'I' || nr >= 600) {
                  riskBadgeClass = 'bg-red-100 text-red-900 border-red-300'
                  riskLevelText = 'Nivel I (Muy Alto)'
                } else if (interp.startsWith('II ') || interp === 'II' || (nr >= 150 && nr < 600)) {
                  riskBadgeClass = 'bg-red-50 text-red-700 border-red-200'
                  riskLevelText = 'Nivel II (Alto)'
                } else if (interp.startsWith('III ') || interp === 'III' || (nr >= 40 && nr < 150)) {
                  riskBadgeClass = 'bg-yellow-50 text-yellow-800 border-yellow-200'
                  riskLevelText = 'Nivel III (Moderado)'
                }

                // Breakdown of actions
                const ejecutadas = danger.planesAccion.filter((a) => a.estado === 'EJECUTADO' || a.estado === 'COMPLETADO').length
                const enProgreso = danger.planesAccion.filter((a) => a.estado === 'EN_PROCESO').length
                const pendientes = danger.planesAccion.filter((a) => a.estado === 'PENDIENTE' || !a.estado).length

                return (
                  <div
                    key={danger.id}
                    className="bg-white rounded-3xl border border-[#dfe9e2] hover:border-[#1F7D3E]/40 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left & Center: Danger Information */}
                    <div className="space-y-2 flex-1 min-w-0">
                      {/* Badges line */}
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Hazard Code */}
                        {danger.codigo && (
                          <span className="font-mono text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-[#163522] text-white tracking-wide">
                            {danger.codigo}
                          </span>
                        )}

                        {/* Classification */}
                        <span className={`text-[10.5px] font-black uppercase px-2.5 py-0.5 rounded-lg border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {danger.clasificacion}
                        </span>

                        {/* Risk Level */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${riskBadgeClass}`}>
                          {riskLevelText}
                        </span>

                        {/* Presence in Matrices */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#f0f5f1] text-[#1e5230] border border-[#d6ebd9] flex items-center gap-1">
                          <Building2 className="size-3 text-[#1F7D3E]" />
                          {danger.matricesCount} {danger.matricesCount === 1 ? 'matriz' : 'matrices'}
                        </span>
                      </div>

                      {/* Title / Description */}
                      <div>
                        <h3 className="text-sm sm:text-base font-black text-[#163522] leading-snug">
                          {danger.descripcion}
                        </h3>
                        {danger.efectosPosibles && (
                          <p className="text-xs text-[#7a9182] font-medium line-clamp-1 mt-0.5">
                            <span className="font-bold text-[#5e6b62]">Efectos:</span> {danger.efectosPosibles}
                          </p>
                        )}
                      </div>

                      {/* Existing Controls Summary */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] text-[#5e6b62]">
                        <span className="font-bold text-[#7a9182]">Controles GTC 45:</span>
                        {danger.eliminacion && (
                          <span className="px-1.5 py-0.5 bg-[#f4f8f5] border border-[#dfe9e2] rounded text-[#1F7D3E]">
                            Eliminación
                          </span>
                        )}
                        {danger.sustitucion && (
                          <span className="px-1.5 py-0.5 bg-[#f4f8f5] border border-[#dfe9e2] rounded text-[#1F7D3E]">
                            Sustitución
                          </span>
                        )}
                        {danger.controlesIngenieria && (
                          <span className="px-1.5 py-0.5 bg-[#f4f8f5] border border-[#dfe9e2] rounded text-[#1F7D3E]">
                            Ingeniería
                          </span>
                        )}
                        {danger.controlesAdministrativos && (
                          <span className="px-1.5 py-0.5 bg-[#f4f8f5] border border-[#dfe9e2] rounded text-[#1F7D3E]">
                            Administrativos
                          </span>
                        )}
                        {danger.epp && (
                          <span className="px-1.5 py-0.5 bg-[#f4f8f5] border border-[#dfe9e2] rounded text-[#1F7D3E]">
                            EPP
                          </span>
                        )}
                        {!danger.eliminacion && !danger.sustitucion && !danger.controlesIngenieria && !danger.controlesAdministrativos && !danger.epp && (
                          <span className="italic text-[#8aa08f]">Sin controles definidos</span>
                        )}
                      </div>
                    </div>

                    {/* Right: 5W2H Status & Actions */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#eef3f0]">
                      {/* Status indicator */}
                      <div>
                        {hasActions ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black">
                            <ClipboardCheck className="size-3.5 text-emerald-600" />
                            Plan 5W2H Formulado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                            <AlertCircle className="size-3.5 text-amber-600" />
                            Sin Plan 5W2H
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {hasActions && (
                          <button
                            type="button"
                            onClick={() => openPreviewModal(danger)}
                            className="size-9 rounded-xl border border-[#dfe9e2] bg-[#f8faf8] hover:bg-[#eef7f0] text-[#5e6b62] hover:text-[#1F7D3E] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                            title="Ver detalles 5W2H"
                          >
                            <Eye className="size-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditModal(danger)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                        >
                          <Edit3 className="size-3.5" />
                          <span>{hasActions ? 'Gestionar 5W2H' : 'Crear Plan 5W2H'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="bg-white p-4 rounded-3xl border border-[#dfe9e2] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7a9182] font-medium">Filas por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setCurrentPage(1)
                  }}
                  className="bg-[#f8faf8] border border-[#dfe9e2] text-xs font-bold text-[#163522] rounded-xl px-2.5 py-1.5 outline-none cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="size-8 rounded-xl border border-[#dfe9e2] bg-white text-[#5e6b62] hover:bg-[#eef7f0] hover:text-[#1F7D3E] flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                >
                  <ChevronLeft className="size-4" />
                </button>

                <div className="text-xs font-bold text-[#163522] px-3 py-1 bg-[#f8faf8] rounded-xl border border-[#dfe9e2]">
                  {currentPage} / {totalPages}
                </div>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="size-8 rounded-xl border border-[#dfe9e2] bg-white text-[#5e6b62] hover:bg-[#eef7f0] hover:text-[#1F7D3E] flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* 4. Edit 5W2H Modal */}
      {selectedDangerForEdit && (
        <PlanAccionModal
          open={editModalOpen}
          onOpenChange={(open) => {
            setEditModalOpen(open)
            if (!open) setSelectedDangerForEdit(null)
          }}
          danger={selectedDangerForEdit}
          onSaved={() => {
            fetchData()
          }}
        />
      )}

      {/* 5. Preview 5W2H Modal */}
      {selectedDangerForPreview && (
        <PlanAccionPreviewModal
          open={previewModalOpen}
          onOpenChange={(open) => {
            setPreviewModalOpen(open)
            if (!open) setSelectedDangerForPreview(null)
          }}
          danger={selectedDangerForPreview}
          onEdit={() => {
            setPreviewModalOpen(false)
            openEditModal(selectedDangerForPreview)
          }}
        />
      )}

      {/* 6. Instructions Modal */}
      <InstructionsModal
        open={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
      />
    </div>
  )
}

export default PlanAccionDashboard

