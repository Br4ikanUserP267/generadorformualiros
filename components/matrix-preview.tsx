"use client"

import React, { useEffect, useState, useRef, useMemo } from 'react'
import {
  ArrowLeft,
  Download,
  Building2,
  Calendar,
  CalendarCheck,
  User,
  Network,
  MapPin,
  ListChecks,
  AlertTriangle,
  AlertOctagon,
  AlertCircle,
  CheckCircle2,
  Columns3,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Table as TableIcon,
  RefreshCw,
  Flame,
} from 'lucide-react'
import { apiFetch } from '@/lib/utils'
import { exportMatrizToExcel } from '@/lib/matriz-excel-export'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MatrixPreviewProps {
  matrizId: string
  onClose: () => void
}

interface ColumnWidths {
  [key: string]: number
}

type TableDensity = 'comfortable' | 'standard' | 'compact'

interface MatrixMetadata {
  id: string
  area: string
  responsable: string
  fechaElaboracion: string
  fechaActualizacion: string
}

interface MatrixSummary {
  procesos: number
  zonas: number
  actividades: number
  peligros: number
  muyAlto: number
  alto: number
  medio: number
  bajo: number
}

interface PaginationState {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Smooth Count-Up number component for initial page entrance
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (hasAnimated.current) {
      setDisplayValue(value)
      return
    }
    hasAnimated.current = true

    let start = 0
    const duration = 650
    const startTime = performance.now()

    const update = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (value - start) * easeOut)
      setDisplayValue(current)
      if (progress < 1) {
        requestAnimationFrame(update)
      }
    }

    requestAnimationFrame(update)
  }, [value])

  return <span>{displayValue}</span>
}

// Risk interpretation helpers matching GTC 45 & matrix editor
function interpProbabilidad(np: number) {
  if (!np) return { label: '', color: '#9CA3AF' }
  if (np <= 4) return { label: 'Bajo', color: '#16a34a' }      // Green
  if (np <= 8) return { label: 'Medio', color: '#d97706' }     // Yellow/Amber
  if (np <= 20) return { label: 'Alto', color: '#dc2626' }     // Red
  return { label: 'Muy Alto', color: '#991b1b' }               // Deep Red
}

function interpNivelRiesgo(nr: number) {
  if (!nr) return { label: '', color: '#9CA3AF' }
  if (nr <= 20) return { label: 'IV', color: '#16a34a' }       // IV = Green
  if (nr <= 120) return { label: 'III', color: '#16a34a' }     // III = Green
  if (nr <= 500) return { label: 'II', color: '#d97706' }      // II = Yellow
  return { label: 'I', color: '#dc2626' }                      // I = Red
}

function aceptabilidadColor(text: string) {
  if (!text) return '#9CA3AF'
  if (text.includes('No Aceptable')) return '#dc2626'
  if (text.includes('Control Especifico') || text.includes('Alto')) return '#ea580c'
  if (text.includes('Mejorable') || text.includes('Medio')) return '#d97706'
  if (text.includes('Aceptable') || text.includes('Bajo')) return '#16a34a'
  return '#9CA3AF'
}

function getEvalFieldStyle(colKey: string, row: any) {
  if (colKey === 'interpNp') {
    const color = interpProbabilidad(Number(row.np || 0)).color
    return color !== '#9CA3AF'
      ? { backgroundColor: color, color: '#ffffff', fontWeight: '800' }
      : {}
  }
  if (colKey === 'interpNr') {
    const color = interpNivelRiesgo(Number(row.nr || 0)).color
    return color !== '#9CA3AF'
      ? { backgroundColor: color, color: '#ffffff', fontWeight: '800' }
      : {}
  }
  if (colKey === 'aceptabilidad') {
    const color = aceptabilidadColor(String(row.aceptabilidad || ''))
    return color !== '#9CA3AF'
      ? { backgroundColor: color, color: '#ffffff', fontWeight: '800' }
      : {}
  }
  return {}
}

export function MatrixPreview({ matrizId, onClose }: MatrixPreviewProps) {
  const [metadata, setMetadata] = useState<MatrixMetadata | null>(null)
  const [summary, setSummary] = useState<MatrixSummary | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,
  })

  const [initialLoading, setInitialLoading] = useState(true)
  const [tableLoading, setTableLoading] = useState(false)
  const [tableError, setTableError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [density, setDensity] = useState<TableDensity>('standard')

  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    proceso: 140,
    zona: 150,
    actividad: 280,
    tareas: 300,
    cargo: 140,
    rutinario: 90,
    peligro: 240,
    clasificacion: 140,
    efectos: 220,
    controlFuente: 180,
    controlMedio: 180,
    controlIndividuo: 180,
    nd: 90,
    ne: 90,
    np: 90,
    interpNp: 150,
    nc: 90,
    nr: 90,
    interpNr: 140,
    aceptabilidad: 180,
    numExpuestos: 100,
    peorConsecuencia: 180,
    requisitoLegal: 110,
    eliminacion: 160,
    sustitucion: 160,
    controlIngenieria: 180,
    controlAdmin: 180,
    epp: 160,
    responsable: 160,
    fechaEjecucion: 130,
  })

  const [columnLabels, setColumnLabels] = useState<Record<string, string>>({
    proceso: 'Proceso',
    zona: 'Zona',
    actividad: 'Actividad',
    tareas: 'Tareas',
    cargo: 'Cargo',
    rutinario: 'Rutina',
    peligro: 'Peligro',
    clasificacion: 'Clasificación',
    efectos: 'Efectos',
    controlFuente: 'Control Fuente',
    controlMedio: 'Control Medio',
    controlIndividuo: 'Control Individuo',
    nd: 'ND',
    ne: 'NE',
    np: 'NP',
    interpNp: 'Interpretación NP',
    nc: 'NC',
    nr: 'NR',
    interpNr: 'Interpretación NR',
    aceptabilidad: 'Aceptabilidad',
    numExpuestos: 'Nº Expuestos',
    peorConsecuencia: 'Peor Consecuencia',
    requisitoLegal: 'Requisito Legal',
    eliminacion: 'Eliminación',
    sustitucion: 'Sustitución',
    controlIngenieria: 'Controles Ingeniería',
    controlAdmin: 'Controles Admin',
    epp: 'EPP',
    responsable: 'Responsable',
    fechaEjecucion: 'Fecha Ejecución',
  })

  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Fetch paginated preview data from dedicated backend API
  const fetchPreviewData = async (targetPage: number, targetPageSize: number, isInitial = false) => {
    if (isInitial) setInitialLoading(true)
    else setTableLoading(true)
    setTableError(null)

    try {
      const res = await apiFetch(
        `/api/riesgos/${matrizId}/preview?page=${targetPage}&pageSize=${targetPageSize}`
      )

      if (!res.ok) {
        throw new Error(`Error ${res.status}: No fue posible cargar la vista previa`)
      }

      const data = await res.json()
      setMetadata(data.matrix)
      setSummary(data.summary)
      setRecords(data.records || [])
      setPagination(
        data.pagination || {
          page: targetPage,
          pageSize: targetPageSize,
          total: data.records?.length || 0,
          totalPages: 1,
        }
      )

      // Reset horizontal scroll smoothly when changing pages
      if (!isInitial && tableContainerRef.current) {
        tableContainerRef.current.scrollLeft = 0
      }
    } catch (err: any) {
      console.error('Error fetching preview records:', err)
      setTableError(err?.message || 'Error al cargar los registros')
    } finally {
      if (isInitial) setInitialLoading(false)
      setTableLoading(false)
    }
  }

  // Load configuration labels & initial page
  useEffect(() => {
    fetchPreviewData(pagination.page, pagination.pageSize, true)

    const loadConfig = async () => {
      try {
        const res = await apiFetch('/api/configuracion?key=column_labels')
        if (res.ok) {
          const config = await res.json()
          if (config && config.valor) {
            setColumnLabels((prev) => ({ ...prev, ...config.valor }))
          }
        }
      } catch (e) {
        console.error('Error loading column labels config:', e)
      }
    }

    loadConfig()
  }, [matrizId])

  // Lock background window scrolling during full-screen modal
  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [])

  // Column Resizing mouse listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn) return
      const diff = e.clientX - resizeStartX
      setColumnWidths((prev) => ({
        ...prev,
        [resizingColumn]: Math.max(70, prev[resizingColumn] + diff),
      }))
      setResizeStartX(e.clientX)
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
      try {
        document.body.style.userSelect = ''
      } catch {}
      try {
        document.body.style.cursor = ''
      } catch {}
    }

    if (resizingColumn) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [resizingColumn, resizeStartX])

  // Column label renaming handler with DB persistence
  const handleLabelChange = async (key: string, newLabel: string) => {
    const updatedLabels = { ...columnLabels, [key]: newLabel }
    setColumnLabels(updatedLabels)

    const neededWidth = newLabel.length * 8.5 + 40
    if (neededWidth > columnWidths[key]) {
      setColumnWidths((prev) => ({
        ...prev,
        [key]: Math.min(600, Math.ceil(neededWidth)),
      }))
    }

    try {
      await apiFetch('/api/configuracion?key=column_labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: updatedLabels }),
      })
    } catch (e) {
      console.error('Error saving labels to DB:', e)
    }
  }

  // Complete Matrix Export to Excel (preserves ALL records, not just current page)
  const handleExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      // Fetch the full matrix for complete export
      const res = await apiFetch(`/api/riesgos/${matrizId}`)
      if (!res.ok) throw new Error('No fue posible obtener los datos para exportación')
      const fullMatrixData = await res.json()
      await exportMatrizToExcel(fullMatrixData)
    } catch (err) {
      console.error('Export error in preview:', err)
    } finally {
      setIsExporting(false)
    }
  }

  // Pagination page change handler
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.page) return
    fetchPreviewData(newPage, pagination.pageSize, false)
  }

  // Page size change handler
  const handlePageSizeChange = (newPageSize: number) => {
    if (newPageSize === pagination.pageSize) return
    fetchPreviewData(1, newPageSize, false)
  }

  const columns = useMemo(() => {
    return Object.keys(columnLabels).map((key) => ({
      key,
      label: columnLabels[key],
    }))
  }, [columnLabels])

  // Row spans for grouping on current page
  const mergeKeys = ['proceso', 'zona', 'actividad', 'tareas', 'cargo', 'rutinario']
  const rowSpans = useMemo(() => {
    const spans: Record<string, number[]> = {}
    for (const key of mergeKeys) {
      spans[key] = new Array(records.length).fill(0)
      let i = 0
      while (i < records.length) {
        let j = i + 1
        while (
          j < records.length &&
          String(records[j][key]) === String(records[i][key]) &&
          String(records[j].zona) === String(records[i].zona)
        ) {
          j++
        }
        const span = j - i
        spans[key][i] = span
        for (let k = i + 1; k < j; k++) spans[key][k] = 0
        i = j
      }
    }
    return spans
  }, [records])

  const densityClasses = {
    comfortable: {
      cell: 'px-4 py-3.5 text-xs',
      header: 'px-4 py-3.5 text-[11px]',
      lineHeight: 'leading-relaxed',
    },
    standard: {
      cell: 'px-3 py-2.5 text-xs',
      header: 'px-3 py-2.5 text-[10px]',
      lineHeight: 'leading-normal',
    },
    compact: {
      cell: 'px-2.5 py-1.5 text-[11px]',
      header: 'px-2.5 py-2 text-[10px]',
      lineHeight: 'leading-snug',
    },
  }[density]

  const densityLabels: Record<TableDensity, string> = {
    comfortable: 'Vista cómoda',
    standard: 'Vista estándar',
    compact: 'Vista compacta',
  }

  // Initial Fullscreen Loading
  if (initialLoading) {
    return (
      <div className="fixed inset-0 bg-[#f8faf9]/95 backdrop-blur-md flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-3xl p-8 border border-[#dfe9e2] shadow-xl text-center space-y-3">
          <div className="size-12 rounded-2xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center mx-auto animate-pulse">
            <TableIcon className="size-6" />
          </div>
          <div className="text-sm font-black text-[#163522]">Cargando vista previa de la matriz...</div>
        </div>
      </div>
    )
  }

  // Initial Fatal Error
  if (!metadata || !summary) {
    return (
      <div className="fixed inset-0 bg-[#f8faf9] flex items-center justify-center z-[9999] p-6">
        <div className="bg-white rounded-3xl p-8 border border-[#dfe9e2] shadow-xl text-center space-y-4 max-w-md">
          <div className="size-12 rounded-2xl bg-[#fef2f2] text-[#dc2626] flex items-center justify-center mx-auto">
            <AlertTriangle className="size-6" />
          </div>
          <div className="text-base font-black text-[#163522]">No se pudo cargar la matriz</div>
          <p className="text-xs text-[#7a9182]">
            Verifique que la matriz exista y que cuente con permisos para visualizarla.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#1F7D3E] text-white text-xs font-bold hover:bg-[#186331] transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  // Pagination bounds calculation
  const startItem = pagination.total > 0 ? (pagination.page - 1) * pagination.pageSize + 1 : 0
  const endItem = Math.min(pagination.page * pagination.pageSize, pagination.total)

  // Generate page buttons array
  const getPageNumbers = () => {
    const total = pagination.totalPages
    const current = pagination.page
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
    if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
    return [1, '...', current - 1, current, current + 1, '...', total]
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-[#f8faf9] z-[9999] flex flex-col overflow-hidden select-none sm:select-auto font-sans animate-in fade-in duration-200">
      {/* 1. Global Preview Header - Generous width, height and spacing */}
      <header className="min-h-[72px] px-6 sm:px-8 lg:px-10 py-3.5 bg-white border-b border-[#dfe9e2] flex items-center justify-between gap-4 shrink-0 shadow-2xs z-30">
        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
          {/* Back Button */}
          <button
            type="button"
            onClick={onClose}
            className="size-11 rounded-2xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] hover:border-[#b9d2bf] text-[#163522] flex items-center justify-center transition-all shadow-2xs cursor-pointer shrink-0"
            title="Volver al Dashboard"
          >
            <ArrowLeft className="size-5 text-[#163522]" />
          </button>

          {/* Matrix Icon */}
          <div className="size-11 rounded-2xl bg-[#1F7D3E] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#1F7D3E]/20">
            <TableIcon className="size-5.5" />
          </div>

          {/* Title and Breadcrumb */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-[#eef7f0] border border-[#d6ebd9] px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider text-[#1F7D3E]">
                PREVIEW
              </span>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                › MATRIZ DE RIESGOS
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-0.5">
              <h1 className="text-lg sm:text-xl font-black text-[#163522] tracking-tight truncate leading-tight">
                Vista Previa de Matriz
              </h1>
              <span className="hidden md:inline-block text-xs font-black text-[#7a9182] uppercase tracking-wider truncate max-w-md">
                • {metadata.area || 'Hospitalización'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Header Actions: Exportar */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-xl bg-white border border-[#dfe9e2] hover:bg-[#f0f9f1] hover:border-[#b9d2bf] text-[#163522] hover:text-[#1F7D3E] text-xs font-black shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            title="Exportar matriz completa a Excel"
          >
            {isExporting ? (
              <Loader2 className="size-4 animate-spin text-[#1F7D3E]" />
            ) : (
              <Download className="size-4 text-[#1F7D3E]" />
            )}
            <span className="hidden sm:inline">Exportar</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Body */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden px-6 sm:px-8 lg:px-10 py-4 space-y-4">
        {/* Row 1: General Matrix Information (4 significantly larger cards) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4 shrink-0">
          {/* Card 1: Area / Proceso */}
          <div className="bg-white rounded-2xl border border-[#dfe9e2] p-4 sm:p-4.5 shadow-xs flex items-center gap-4 hover:border-[#b9d2bf] transition-all">
            <div className="size-11 sm:size-12 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d6ebd9]">
              <Building2 className="size-5 sm:size-5.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#7a9182]">
                Área / Proceso
              </div>
              <div className="text-sm sm:text-base font-black text-[#163522] uppercase truncate mt-0.5">
                {metadata.area || '—'}
              </div>
            </div>
          </div>

          {/* Card 2: Fecha de Actualización */}
          <div className="bg-white rounded-2xl border border-[#dfe9e2] p-4 sm:p-4.5 shadow-xs flex items-center gap-4 hover:border-[#b9d2bf] transition-all">
            <div className="size-11 sm:size-12 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d6ebd9]">
              <Calendar className="size-5 sm:size-5.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#7a9182]">
                Fecha de Actualización
              </div>
              <div className="text-sm sm:text-base font-black text-[#163522] truncate mt-0.5">
                {metadata.fechaActualizacion || '—'}
              </div>
            </div>
          </div>

          {/* Card 3: Fecha de Elaboración */}
          <div className="bg-white rounded-2xl border border-[#dfe9e2] p-4 sm:p-4.5 shadow-xs flex items-center gap-4 hover:border-[#b9d2bf] transition-all">
            <div className="size-11 sm:size-12 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d6ebd9]">
              <CalendarCheck className="size-5 sm:size-5.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#7a9182]">
                Fecha de Elaboración
              </div>
              <div className="text-sm sm:text-base font-black text-[#163522] truncate mt-0.5">
                {metadata.fechaElaboracion || '—'}
              </div>
            </div>
          </div>

          {/* Card 4: Responsable */}
          <div className="bg-white rounded-2xl border border-[#dfe9e2] p-4 sm:p-4.5 shadow-xs flex items-center gap-4 hover:border-[#b9d2bf] transition-all">
            <div className="size-11 sm:size-12 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d6ebd9]">
              <User className="size-5 sm:size-5.5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#7a9182]">
                Responsable
              </div>
              <div className="text-sm sm:text-base font-black text-[#163522] truncate mt-0.5">
                {metadata.responsable || '—'}
              </div>
            </div>
          </div>
        </section>

        {/* Row 2: Matrix Summary Statistics (Substantially larger cards with larger numbers & icons) */}
        <section className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3 sm:gap-3.5 shrink-0">
          {/* 1. Procesos */}
          <div className="rounded-2xl border border-[#d7ecdc] bg-[#f0f9f1] px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center gap-3.5 shadow-xs hover:border-[#b8dfbf] transition-all">
            <div className="size-10 sm:size-11 rounded-xl bg-white text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d7ecdc] shadow-2xs">
              <Network className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#1F7D3E]/80">
                Procesos
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#1F7D3E] leading-none mt-1">
                <AnimatedNumber value={summary.procesos} />
              </div>
            </div>
          </div>

          {/* 2. Zonas */}
          <div className="rounded-2xl border border-[#d8eaff] bg-[#f0f7ff] px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center gap-3.5 shadow-xs hover:border-[#b4dbfa] transition-all">
            <div className="size-10 sm:size-11 rounded-xl bg-white text-[#0284c7] flex items-center justify-center shrink-0 border border-[#d8eaff] shadow-2xs">
              <MapPin className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#0284c7]/80">
                Zonas
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#0284c7] leading-none mt-1">
                <AnimatedNumber value={summary.zonas} />
              </div>
            </div>
          </div>

          {/* 3. Actividades */}
          <div className="rounded-2xl border border-[#fef3c7] bg-[#fffbeb] px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center gap-3.5 shadow-xs hover:border-[#fde68a] transition-all">
            <div className="size-10 sm:size-11 rounded-xl bg-white text-[#d97706] flex items-center justify-center shrink-0 border border-[#fef3c7] shadow-2xs">
              <ListChecks className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#d97706]/80">
                Actividades
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#d97706] leading-none mt-1">
                <AnimatedNumber value={summary.actividades} />
              </div>
            </div>
          </div>

          {/* 4. Peligros */}
          <div className="rounded-2xl border border-[#fee2e2] bg-[#fef2f2] px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center gap-3.5 shadow-xs hover:border-[#fca5a5] transition-all">
            <div className="size-10 sm:size-11 rounded-xl bg-white text-[#dc2626] flex items-center justify-center shrink-0 border border-[#fee2e2] shadow-2xs">
              <AlertTriangle className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#dc2626]/80">
                Peligros
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#dc2626] leading-none mt-1">
                <AnimatedNumber value={summary.peligros} />
              </div>
            </div>
          </div>

          {/* 5. Riesgo Alto (or Muy Alto if present) */}
          <div
            className={`rounded-2xl border px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center gap-3.5 shadow-xs transition-all ${
              summary.alto > 0 || summary.muyAlto > 0
                ? 'border-[#fecaca] bg-[#fef2f2] hover:border-[#f87171]'
                : 'border-[#e2e9e4] bg-[#fafcfa] hover:border-[#cbd5cf]'
            }`}
          >
            <div
              className={`size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                summary.alto > 0 || summary.muyAlto > 0
                  ? 'bg-white text-[#dc2626] border-[#fecaca]'
                  : 'bg-white text-[#7a9182] border-[#e2e9e4]'
              }`}
            >
              {summary.muyAlto > 0 ? (
                <Flame className="size-5 text-[#991b1b]" />
              ) : (
                <AlertOctagon className="size-5" />
              )}
            </div>
            <div className="min-w-0">
              <div
                className={`text-[10.5px] font-black uppercase tracking-wider ${
                  summary.alto > 0 || summary.muyAlto > 0 ? 'text-[#dc2626]/80' : 'text-[#7a9182]'
                }`}
              >
                Riesgo Alto
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black leading-none mt-1 ${
                  summary.alto > 0 || summary.muyAlto > 0 ? 'text-[#dc2626]' : 'text-[#5e6b62]'
                }`}
              >
                <AnimatedNumber value={summary.alto + summary.muyAlto} />
              </div>
            </div>
          </div>

          {/* 6. Riesgo Medio */}
          <div
            className={`rounded-2xl border px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center gap-3.5 shadow-xs transition-all ${
              summary.medio > 0
                ? 'border-[#fde68a] bg-[#fffbeb] hover:border-[#fcd34d]'
                : 'border-[#e2e9e4] bg-[#fafcfa] hover:border-[#cbd5cf]'
            }`}
          >
            <div
              className={`size-10 sm:size-11 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
                summary.medio > 0
                  ? 'bg-white text-[#d97706] border-[#fde68a]'
                  : 'bg-white text-[#7a9182] border-[#e2e9e4]'
              }`}
            >
              <AlertCircle className="size-5" />
            </div>
            <div className="min-w-0">
              <div
                className={`text-[10.5px] font-black uppercase tracking-wider ${
                  summary.medio > 0 ? 'text-[#d97706]/80' : 'text-[#7a9182]'
                }`}
              >
                Riesgo Medio
              </div>
              <div
                className={`text-2xl sm:text-3xl font-black leading-none mt-1 ${
                  summary.medio > 0 ? 'text-[#d97706]' : 'text-[#5e6b62]'
                }`}
              >
                <AnimatedNumber value={summary.medio} />
              </div>
            </div>
          </div>

          {/* 7. Riesgo Bajo */}
          <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 sm:px-4.5 sm:py-3.5 flex items-center gap-3.5 shadow-xs hover:border-[#86efac] transition-all">
            <div className="size-10 sm:size-11 rounded-xl bg-white text-[#16a34a] flex items-center justify-center shrink-0 border border-[#bbf7d0] shadow-2xs">
              <CheckCircle2 className="size-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#16a34a]/80">
                Riesgo Bajo
              </div>
              <div className="text-2xl sm:text-3xl font-black text-[#16a34a] leading-none mt-1">
                <AnimatedNumber value={summary.bajo} />
              </div>
            </div>
          </div>
        </section>

        {/* Row 3: Main Consolidated Table Panel */}
        <main className="flex-1 min-h-0 bg-white rounded-2xl border border-[#dfe9e2] shadow-sm flex flex-col overflow-hidden">
          {/* Table Header Utility Bar */}
          <div className="px-5 py-2.5 border-b border-[#dfe9e2] bg-[#fcfdfc] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 shrink-0">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#7a9182]">
                DETALLE COMPLETO
              </div>
              <h2 className="text-sm font-black text-[#163522] tracking-tight">
                Tabla consolidada de peligros y controles
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {/* Columns Count Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe9e2] bg-white px-3 py-1.5 text-xs font-bold text-[#355244] shadow-2xs">
                <Columns3 className="size-3.5 text-[#7a9182]" />
                {columns.length} columnas
              </span>

              {/* Global Total Records Badge */}
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe9e2] bg-white px-3 py-1.5 text-xs font-bold text-[#355244] shadow-2xs">
                <FileSpreadsheet className="size-3.5 text-[#7a9182]" />
                {summary.peligros} registros
              </span>

              {/* Density Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#dfe9e2] bg-white px-3 py-1.5 text-xs font-bold text-[#355244] hover:bg-[#f0f9f1] hover:border-[#b9d2bf] hover:text-[#1F7D3E] transition-colors shadow-2xs cursor-pointer"
                  >
                    <SlidersHorizontal className="size-3.5 text-[#7a9182]" />
                    <span>{densityLabels[density]}</span>
                    <ChevronDown className="size-3 text-[#7a9182]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-40 bg-white border border-[#dfe9e2] shadow-lg rounded-xl p-1 z-[10000]"
                >
                  <DropdownMenuItem
                    onClick={() => setDensity('comfortable')}
                    className={`cursor-pointer text-xs font-bold rounded-lg px-2.5 py-1.5 ${
                      density === 'comfortable'
                        ? 'bg-[#eef7f0] text-[#1F7D3E]'
                        : 'text-[#355244]'
                    }`}
                  >
                    Vista cómoda
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDensity('standard')}
                    className={`cursor-pointer text-xs font-bold rounded-lg px-2.5 py-1.5 ${
                      density === 'standard'
                        ? 'bg-[#eef7f0] text-[#1F7D3E]'
                        : 'text-[#355244]'
                    }`}
                  >
                    Vista estándar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setDensity('compact')}
                    className={`cursor-pointer text-xs font-bold rounded-lg px-2.5 py-1.5 ${
                      density === 'compact'
                        ? 'bg-[#eef7f0] text-[#1F7D3E]'
                        : 'text-[#355244]'
                    }`}
                  >
                    Vista compacta
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Consolidated Table Body */}
          <div
            ref={tableContainerRef}
            className="flex-1 min-h-0 overflow-auto bg-white scrollbar-thin scrollbar-thumb-[#cbd5cf] scrollbar-track-transparent relative"
          >
            {tableLoading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-30 flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#dfe9e2] shadow-md text-xs font-bold text-[#163522]">
                  <Loader2 className="size-4 animate-spin text-[#1F7D3E]" />
                  <span>Cargando página {pagination.page}...</span>
                </div>
              </div>
            )}

            {tableError ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="size-10 rounded-xl bg-[#fef2f2] text-[#dc2626] flex items-center justify-center">
                  <AlertTriangle className="size-5" />
                </div>
                <div className="text-sm font-bold text-[#163522]">{tableError}</div>
                <button
                  type="button"
                  onClick={() => fetchPreviewData(pagination.page, pagination.pageSize, false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F7D3E] text-white text-xs font-bold hover:bg-[#186331] transition-colors"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Reintentar</span>
                </button>
              </div>
            ) : (
              <table className="w-full border-collapse table-fixed text-xs font-sans">
                <thead className="sticky top-0 z-20 bg-[#f4f8f5] shadow-xs">
                  <tr>
                    {columns.map((col) => (
                      <HeaderCell
                        key={col.key}
                        column={col}
                        width={columnWidths[col.key] || 120}
                        densityClass={densityClasses.header}
                        onLabelChange={(newLabel) => handleLabelChange(col.key, newLabel)}
                        onResizeStart={(e) => {
                          e.preventDefault()
                          setResizingColumn(col.key)
                          setResizeStartX(e.clientX)
                          try {
                            document.body.style.userSelect = 'none'
                          } catch {}
                          try {
                            document.body.style.cursor = 'col-resize'
                          } catch {}
                        }}
                      />
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e9e4]">
                  {records.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-8 py-20 text-center text-[#7a9182] font-medium italic bg-[#fbfdfb]"
                      >
                        Esta matriz no tiene registros para mostrar
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const elements: any[] = []
                      for (let r = 0; r < records.length; r++) {
                        const row = records[r]
                        elements.push(
                          <tr
                            key={`row-${row.id || r}`}
                            className={`${
                              r % 2 === 0 ? 'bg-white' : 'bg-[#fafcfa]'
                            } hover:bg-[#f0f7f2] transition-colors`}
                          >
                            {columns.map((col) => {
                              const value = row[col.key as keyof typeof row]
                              const isNumeric = [
                                'nd',
                                'ne',
                                'np',
                                'nc',
                                'nr',
                                'numExpuestos',
                              ].includes(col.key)
                              const isEvaluationField = [
                                'nd',
                                'ne',
                                'np',
                                'interpNp',
                                'nc',
                                'nr',
                                'interpNr',
                                'aceptabilidad',
                              ].includes(col.key)

                              if (mergeKeys.includes(col.key)) {
                                const span = rowSpans[col.key]?.[r] ?? 1
                                if (span === 0) return null

                                return (
                                  <td
                                    key={col.key}
                                    rowSpan={span}
                                    className={`${densityClasses.cell} ${densityClasses.lineHeight} border-r border-[#e2e9e4] last:border-r-0 align-top text-[#2c3630] font-medium break-words ${
                                      col.key === 'zona' || col.key === 'proceso'
                                        ? 'font-bold text-[#163522]'
                                        : ''
                                    } ${isNumeric ? 'text-center font-bold' : 'text-left'}`}
                                  >
                                    {value}
                                  </td>
                                )
                              }

                              const evalStyle = isEvaluationField
                                ? getEvalFieldStyle(col.key, row)
                                : {}

                              return (
                                <td
                                  key={col.key}
                                  className={`${densityClasses.cell} ${densityClasses.lineHeight} border-r border-[#e2e9e4] last:border-r-0 align-top text-[#2c3630] ${
                                    isEvaluationField
                                      ? 'whitespace-nowrap text-center font-bold'
                                      : 'break-words font-normal'
                                  } ${isNumeric ? 'text-center font-bold' : 'text-left'}`}
                                  style={evalStyle}
                                >
                                  {col.key === 'requisitoLegal' ? (
                                    <span
                                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${
                                        value === 'Sí' || value === 'SI'
                                          ? 'bg-[#eef7f0] text-[#1F7D3E] border border-[#d6ebd9]'
                                          : 'bg-gray-100 text-gray-500'
                                      }`}
                                    >
                                      {value}
                                    </span>
                                  ) : (
                                    value
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      }
                      return elements
                    })()
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Footer */}
          <footer className="px-5 py-2.5 border-t border-[#dfe9e2] bg-[#fcfdfc] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            {/* Showing items indicator */}
            <div className="text-xs font-medium text-[#5e6b62]">
              Mostrando <span className="font-bold text-[#163522]">{startItem}–{endItem}</span> de{' '}
              <span className="font-bold text-[#163522]">{pagination.total}</span> registros
            </div>

            {/* Page navigation buttons */}
            <div className="flex items-center gap-1">
              {/* Prev Button */}
              <button
                type="button"
                disabled={pagination.page <= 1 || tableLoading}
                onClick={() => handlePageChange(pagination.page - 1)}
                className="size-8 rounded-lg border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] hover:border-[#b9d2bf] text-[#163522] flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs"
                title="Página anterior"
              >
                <ChevronLeft className="size-4" />
              </button>

              {/* Page Number Buttons */}
              {getPageNumbers().map((num, idx) => {
                if (num === '...') {
                  return (
                    <span
                      key={`dots-${idx}`}
                      className="size-8 flex items-center justify-center text-xs text-[#7a9182] font-bold"
                    >
                      ...
                    </span>
                  )
                }

                const pageNum = num as number
                const isActive = pageNum === pagination.page

                return (
                  <button
                    key={`page-${pageNum}`}
                    type="button"
                    disabled={tableLoading}
                    onClick={() => handlePageChange(pageNum)}
                    className={`size-8 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                      isActive
                        ? 'bg-[#1F7D3E] text-white border border-[#1F7D3E] font-black'
                        : 'border border-[#dfe9e2] bg-white text-[#163522] hover:bg-[#f0f5f1] hover:border-[#b9d2bf]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              {/* Next Button */}
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || tableLoading}
                onClick={() => handlePageChange(pagination.page + 1)}
                className="size-8 rounded-lg border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] hover:border-[#b9d2bf] text-[#163522] flex items-center justify-center transition-all disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-2xs"
                title="Página siguiente"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7a9182] font-medium hidden md:inline">Mostrar:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#163522] text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>{pagination.pageSize} por página</span>
                    <ChevronDown className="size-3 text-[#7a9182]" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 bg-white border border-[#dfe9e2] shadow-lg rounded-xl p-1 z-[10000]">
                  {[10, 20, 50].map((size) => (
                    <DropdownMenuItem
                      key={size}
                      onClick={() => handlePageSizeChange(size)}
                      className={`cursor-pointer text-xs font-bold rounded-lg px-2.5 py-1.5 ${
                        pagination.pageSize === size
                          ? 'bg-[#eef7f0] text-[#1F7D3E]'
                          : 'text-[#355244]'
                      }`}
                    >
                      {size} por página
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </footer>
        </main>
      </div>
    </div>
  )
}

// Header Cell component for column resizing and renaming
const HeaderCell = ({
  column,
  width,
  densityClass,
  onLabelChange,
  onResizeStart,
}: {
  column: { key: string; label: string }
  width: number
  densityClass: string
  onLabelChange: (val: string) => void
  onResizeStart: (e: React.MouseEvent) => void
}) => {
  const [localLabel, setLocalLabel] = useState(column.label)

  useEffect(() => {
    setLocalLabel(column.label)
  }, [column.label])

  const commit = () => {
    if (localLabel.trim() && localLabel !== column.label) {
      onLabelChange(localLabel.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commit()
      ;(e.target as HTMLInputElement).blur()
    }
    if (e.key === 'Escape') {
      setLocalLabel(column.label)
      ;(e.target as HTMLInputElement).blur()
    }
  }

  return (
    <th
      style={{
        width: width,
        minWidth: width,
        maxWidth: width,
      }}
      className="border-r border-[#dfe9e2] last:border-r-0 border-b border-[#dfe9e2] bg-[#f4f8f5] text-[#163522] font-black text-center relative user-select-none group p-0"
    >
      <div className="flex items-center justify-center h-full relative">
        <input
          value={localLabel}
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className={`bg-transparent border-none text-center w-full focus:bg-white/80 outline-none m-0 transition-colors uppercase tracking-wider font-black text-[#163522] cursor-text truncate ${densityClass}`}
          title="Haz clic para renombrar. Pulsa Enter para confirmar."
        />
        {/* Resize handle */}
        <div
          onMouseDown={onResizeStart}
          className="w-1.5 h-full cursor-col-resize absolute right-0 top-0 z-30 hover:bg-[#1F7D3E]/40 transition-colors opacity-0 group-hover:opacity-100"
          title="Arrastra para cambiar el ancho de la columna"
        />
      </div>
    </th>
  )
}
