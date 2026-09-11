"use client"

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  History,
  Building2,
  User,
  Calendar,
  Layers,
  Settings,
  MapPin,
  FileText,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Search,
  MessageSquare,
  ShieldAlert,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

export type MatrixVersionSummary = {
  id: string
  timestamp: string
  userName: string
  userEmail: string
  action: string
  title: string
  lines: string[]
}

export type MatrixVersionDetail = {
  id: string
  timestamp: string
  userName: string
  userEmail: string
  action: string
  changes: string
  before: string
}

interface VersionHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matrixTitle: string
  matrixId: string
  loading: boolean
  detailLoading: boolean
  versionEntries: MatrixVersionSummary[]
  selectedVersionId: string | null
  selectedVersionDetail: MatrixVersionDetail | null
  onSelectVersion: (matrizId: string, versionId: string) => void
  currentUser?: {
    nombre?: string
    email?: string
  } | null
}

function safeParseJson(value: string | null) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function unwrapCreateList(value: any): any[] {
  if (Array.isArray(value)) return value
  if (value && typeof value === 'object' && Array.isArray(value.create)) return value.create
  return []
}

function unwrapVersionData(value: any) {
  if (!value || typeof value !== 'object') return null
  return value.data && typeof value.data === 'object' ? value.data : value
}

function normalizeVersionMatrix(value: any) {
  const data = unwrapVersionData(value)
  if (!data || typeof data !== 'object') return null

  return {
    area: data.area || '',
    responsable: data.responsable || '',
    fechaElaboracion: data.fecha_elaboracion || data.fechaElaboracion || '',
    fechaActualizacion: data.fecha_actualizacion || data.fechaActualizacion || '',
    files:
      unwrapCreateList(data.archivos?.create).length > 0
        ? unwrapCreateList(data.archivos?.create)
        : Array.isArray(data.files)
        ? data.files
        : [],
    procesos: unwrapCreateList(data.procesos).map((proceso: any) => ({
      nombre: proceso?.nombre || '',
      zonas: unwrapCreateList(proceso?.zonas).map((zona: any) => ({
        nombre: zona?.nombre || '',
        actividades: unwrapCreateList(zona?.actividades).map((actividad: any) => ({
          nombre: actividad?.nombre || '',
          descripcion: actividad?.descripcion || '',
          tareas: actividad?.tareas || '',
          cargo: actividad?.cargo || '',
          rutinario: typeof actividad?.rutinario === 'boolean' ? actividad.rutinario : null,
          peligros: unwrapCreateList(actividad?.peligros).map((peligro: any) => ({
            descripcion: peligro?.descripcion || '',
            clasificacion: peligro?.clasificacion || '',
            efectos: peligro?.efectosPosibles || peligro?.efectos || '',
            evaluacion: peligro?.evaluacion?.create || peligro?.evaluacion || null,
            criterio:
              peligro?.criterio?.create ||
              peligro?.criterios?.create ||
              peligro?.criterio ||
              peligro?.criterios ||
              null,
            intervencion: peligro?.intervencion?.create || peligro?.intervencion || null,
            control:
              peligro?.control?.create ||
              peligro?.controles?.create ||
              peligro?.control ||
              peligro?.controles ||
              null,
          })),
        })),
      })),
    })),
  }
}

function countMatrixStructure(matrix: any) {
  let procesosCount = 0
  let zonasCount = 0
  let actividadesCount = 0
  let peligrosCount = 0

  if (!matrix) return { procesosCount, zonasCount, actividadesCount, peligrosCount }

  const procesos = Array.isArray(matrix.procesos) ? matrix.procesos : []
  procesosCount = procesos.length

  for (const p of procesos) {
    const zonas = Array.isArray(p.zonas) ? p.zonas : []
    zonasCount += zonas.length
    for (const z of zonas) {
      const actividades = Array.isArray(z.actividades) ? z.actividades : []
      actividadesCount += actividades.length
      for (const a of actividades) {
        const peligros = Array.isArray(a.peligros) ? a.peligros : []
        peligrosCount += peligros.length
      }
    }
  }

  return { procesosCount, zonasCount, actividadesCount, peligrosCount }
}

function formatRiskLevel(peligro: any) {
  const ev = peligro.evaluacion || {}
  const raw = String(
    ev.interpRiesgo || ev.interp_nr || ev.nivelRiesgo || ev.nr || ''
  ).toLowerCase().trim()

  if (raw.includes('muy alto') || raw === 'i' || raw.includes('i ')) {
    return {
      label: 'Muy Alto',
      tag: 'I - Muy Alto',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
    }
  }
  if (raw.includes('alto') || raw === 'ii' || raw.includes('ii ')) {
    return {
      label: 'Alto',
      tag: 'II - Alto',
      bg: 'bg-orange-50',
      text: 'text-orange-700',
      border: 'border-orange-200',
    }
  }
  if (raw.includes('medio') || raw === 'iii' || raw.includes('iii ')) {
    return {
      label: 'Medio',
      tag: 'III - Medio',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
    }
  }
  if (raw.includes('bajo') || raw === 'iv' || raw.includes('iv ')) {
    return {
      label: 'Bajo',
      tag: 'IV - Bajo',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
    }
  }

  return {
    label: 'Sin evaluar',
    tag: 'Sin evaluar',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    border: 'border-slate-200',
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 py-1.5 border-b border-[#edf2ed] last:border-b-0 sm:grid-cols-[160px_minmax(0,1fr)] sm:gap-3 items-baseline">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#7a9182]">{label}</div>
      <div className="min-w-0 break-words text-xs font-medium text-[#163522]">{value}</div>
    </div>
  )
}

export function VersionHistoryModal({
  open,
  onOpenChange,
  matrixTitle,
  matrixId,
  loading,
  detailLoading,
  versionEntries,
  selectedVersionId,
  selectedVersionDetail,
  onSelectVersion,
  currentUser,
}: VersionHistoryModalProps) {
  // Tree collapse / expand states
  const [expandedProcesses, setExpandedProcesses] = useState<Record<string, boolean>>({})
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({})
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({})
  const [expandedHazards, setExpandedHazards] = useState<Record<string, boolean>>({})
  const [structureSearch, setStructureSearch] = useState('')

  // Build current version normalized details
  const parsedData = useMemo(() => {
    if (!selectedVersionDetail) return null
    const parsedChanges = safeParseJson(selectedVersionDetail.changes)
    const parsedBefore = safeParseJson(selectedVersionDetail.before)
    const normalizedMatrix = normalizeVersionMatrix(parsedChanges)
    const normalizedBeforeMatrix = normalizeVersionMatrix(parsedBefore)

    const currentCounts = countMatrixStructure(normalizedMatrix)
    const beforeCounts = countMatrixStructure(normalizedBeforeMatrix)

    return {
      parsedChanges,
      parsedBefore,
      normalizedMatrix,
      normalizedBeforeMatrix,
      currentCounts,
      beforeCounts,
      hasBefore: !!normalizedBeforeMatrix && beforeCounts.procesosCount > 0,
    }
  }, [selectedVersionDetail])

  // Selected version index in the list
  const selectedIndex = useMemo(() => {
    if (!selectedVersionId) return -1
    return versionEntries.findIndex((v) => v.id === selectedVersionId)
  }, [versionEntries, selectedVersionId])

  const selectedVersionNumber = selectedIndex >= 0 ? versionEntries.length - selectedIndex : null
  const isLatestVersion = selectedIndex === 0

  // Quick actions: Expand / Collapse All
  const handleExpandAll = (expand: boolean) => {
    if (!parsedData?.normalizedMatrix?.procesos) return
    const newP: Record<string, boolean> = {}
    const newZ: Record<string, boolean> = {}
    const newA: Record<string, boolean> = {}

    parsedData.normalizedMatrix.procesos.forEach((proceso: any, pIdx: number) => {
      newP[`${pIdx}`] = expand
      proceso.zonas?.forEach((zona: any, zIdx: number) => {
        newZ[`${pIdx}-${zIdx}`] = expand
        zona.actividades?.forEach((_: any, aIdx: number) => {
          newA[`${pIdx}-${zIdx}-${aIdx}`] = expand
        })
      })
    })

    setExpandedProcesses(newP)
    setExpandedZones(newZ)
    setExpandedActivities(newA)
  }

  // Filtered processes based on search
  const filteredProcesses = useMemo(() => {
    if (!parsedData?.normalizedMatrix?.procesos) return []
    const query = structureSearch.toLowerCase().trim()
    if (!query) return parsedData.normalizedMatrix.procesos

    return parsedData.normalizedMatrix.procesos
      .map((proceso: any) => {
        const pMatches = proceso.nombre?.toLowerCase().includes(query)
        const matchedZonas = (proceso.zonas || [])
          .map((zona: any) => {
            const zMatches = zona.nombre?.toLowerCase().includes(query)
            const matchedActividades = (zona.actividades || []).filter((act: any) => {
              const aMatches =
                act.nombre?.toLowerCase().includes(query) ||
                act.descripcion?.toLowerCase().includes(query) ||
                act.cargo?.toLowerCase().includes(query)
              const hMatches = (act.peligros || []).some(
                (pel: any) =>
                  pel.descripcion?.toLowerCase().includes(query) ||
                  pel.clasificacion?.toLowerCase().includes(query) ||
                  pel.efectos?.toLowerCase().includes(query)
              )
              return aMatches || hMatches
            })

            if (zMatches || matchedActividades.length > 0) {
              return {
                ...zona,
                actividades: zMatches ? zona.actividades : matchedActividades,
              }
            }
            return null
          })
          .filter(Boolean)

        if (pMatches || matchedZonas.length > 0) {
          return {
            ...proceso,
            zonas: pMatches ? proceso.zonas : matchedZonas,
          }
        }
        return null
      })
      .filter(Boolean)
  }, [parsedData, structureSearch])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen max-w-none h-[100dvh] rounded-none overflow-hidden p-0 sm:w-[98vw] sm:max-w-[1750px] sm:h-[94vh] sm:rounded-3xl border-[#dbe8de] shadow-2xl flex flex-col bg-[#f8faf9]">
        {/* Top Header */}
        <DialogHeader className="px-6 py-4 border-b border-[#dbe8de] bg-[linear-gradient(180deg,#ffffff_0%,#f8faf9_100%)] shrink-0 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3.5 text-left">
            <span className="inline-flex size-11 items-center justify-center rounded-2xl bg-[#1F7D3E] text-white shadow-md shadow-[#1F7D3E]/20 shrink-0">
              <History className="size-5.5" />
            </span>
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-[#163522] tracking-tight flex items-center gap-2 flex-wrap">
                <span>Versiones:</span>
                <span className="text-[#1F7D3E]">{matrixTitle || 'Matriz de Riesgos'}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-[#5e6b62] mt-0.5">
                Consulta el historial de versiones guardadas, revisa los cambios y la estructura detallada de la matriz.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[380px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)] overflow-hidden">
          {/* Left Column: Timeline Version List */}
          <div className="border-b lg:border-b-0 lg:border-r border-[#dfe9e2] bg-[#fbfdfb] flex flex-col min-h-0 overflow-hidden">
            {/* List Header */}
            <div className="px-5 py-3.5 border-b border-[#dfe9e2] bg-[#f4f8f5]/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-[#1F7D3E]" />
                <span className="text-xs font-black text-[#163522] uppercase tracking-wider">
                  {versionEntries.length} {versionEntries.length === 1 ? 'versión guardada' : 'versiones guardadas'}
                </span>
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="space-y-3 py-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-[#dfe9e2] bg-white p-4 animate-pulse space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="size-8 rounded-full bg-[#eef5f0]" />
                        <div className="h-4 w-16 rounded-full bg-[#eef5f0]" />
                      </div>
                      <div className="h-4 w-3/4 rounded bg-[#eef5f0]" />
                      <div className="h-3 w-1/2 rounded bg-[#f4f8f5]" />
                    </div>
                  ))}
                </div>
              ) : versionEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#dfe9e2] bg-white p-8 text-center">
                  <Clock className="size-8 text-[#a3b8aa] mx-auto mb-2" />
                  <div className="text-sm font-bold text-[#355244]">
                    No hay versiones guardadas
                  </div>
                  <div className="text-xs text-[#7a9182] mt-1">
                    Esta matriz no registra versiones históricas previas.
                  </div>
                </div>
              ) : (
                versionEntries.map((entry, index) => {
                  const versionNum = versionEntries.length - index
                  const isSelected = selectedVersionId === entry.id
                  const isActual = index === 0

                  return (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => onSelectVersion(matrixId, entry.id)}
                      className={`w-full text-left rounded-2xl p-4 transition-all duration-150 relative ${
                        isSelected
                          ? 'border-2 border-[#1F7D3E] bg-white shadow-md ring-1 ring-[#1F7D3E]/10'
                          : 'border border-[#dfe9e2] bg-white/90 hover:bg-white hover:border-[#1F7D3E]/40 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Circular Version Number Badge */}
                          <span
                            className={`inline-flex items-center justify-center size-9 rounded-full text-xs font-black shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-[#1F7D3E] text-white shadow-xs'
                                : 'bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6]'
                            }`}
                          >
                            {versionNum}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-black text-[#163522] truncate">
                              Versión guardada
                            </div>
                            <div className="text-[11px] text-[#6d8174] font-medium mt-0.5">
                              {new Date(entry.timestamp).toLocaleString('es-CO', {
                                year: 'numeric',
                                month: 'short',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shrink-0 ${
                            isActual
                              ? 'bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6]'
                              : 'bg-[#f4f8f5] text-[#5e6b62] border border-[#dfe9e2]'
                          }`}
                        >
                          {isActual ? 'ACTUAL' : entry.action || 'UPDATE'}
                        </span>
                      </div>

                      {/* Author Line */}
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#5e6b62] truncate">
                        <User className="size-3.5 text-[#7a9182] shrink-0" />
                        <span className="truncate">
                          {entry.userName || currentUser?.nombre || 'Usuario'}
                          {entry.userEmail ? ` (${entry.userEmail})` : ''}
                        </span>
                      </div>

                      {/* Summary / Comments Snippet */}
                      <div className="mt-2.5 pt-2.5 border-t border-[#f0f5f1] flex items-center gap-1.5 text-xs text-[#7a9182]">
                        <MessageSquare className="size-3.5 text-[#a3b8aa] shrink-0" />
                        <span className="truncate">
                          {entry.lines && entry.lines.length > 0
                            ? entry.lines[0]
                            : 'Sin comentarios adicionales'}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Right Column: Selected Version Detail View */}
          <div className="flex-1 min-h-0 overflow-y-auto bg-white p-4 sm:p-6 lg:p-7 space-y-6">
            {!selectedVersionId || detailLoading ? (
              <div className="space-y-6">
                {/* Skeleton Hero */}
                <div className="rounded-3xl border border-[#dfe9e2] bg-[#fbfdfb] p-6 shadow-xs animate-pulse space-y-4">
                  <div className="h-6 w-48 rounded bg-[#e9f2eb]" />
                  <div className="h-4 w-72 rounded bg-[#eef5f0]" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    {[1, 2, 3, 4].map((k) => (
                      <div key={k} className="h-20 rounded-2xl bg-[#eef5f0]" />
                    ))}
                  </div>
                </div>
                {/* Skeleton Body */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="h-40 rounded-2xl bg-[#f4f8f5] animate-pulse" />
                  <div className="h-40 rounded-2xl bg-[#f4f8f5] animate-pulse" />
                </div>
              </div>
            ) : !selectedVersionDetail || !parsedData ? (
              <div className="rounded-3xl border border-dashed border-[#dfe9e2] bg-[#fbfdfb] p-10 text-center">
                <FileText className="size-10 text-[#a3b8aa] mx-auto mb-3" />
                <div className="text-base font-bold text-[#163522]">
                  Selecciona una versión para ver los detalles
                </div>
                <div className="text-xs text-[#7a9182] mt-1">
                  Elige cualquier versión del panel izquierdo para explorar su información completa.
                </div>
              </div>
            ) : (
              <>
                {/* 1. TOP HERO CARD */}
                <div className="rounded-3xl border border-[#dfe9e2] bg-[linear-gradient(180deg,#fcfdfc_0%,#f4f8f5_100%)] p-5 sm:p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            isLatestVersion
                              ? 'bg-[#eef7f0] text-[#1F7D3E] border border-[#d1e2d6]'
                              : 'bg-[#f4f8f5] text-[#5e6b62] border border-[#dfe9e2]'
                          }`}
                        >
                          {isLatestVersion ? 'ACTUAL' : selectedVersionDetail.action || 'UPDATE'}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-black text-[#163522] tracking-tight">
                          Versión {selectedVersionNumber ?? ''}
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-[#5e6b62]">
                        Guardada el{' '}
                        <span className="font-semibold text-[#163522]">
                          {new Date(selectedVersionDetail.timestamp).toLocaleString('es-CO', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>{' '}
                        por{' '}
                        <span className="font-semibold text-[#163522]">
                          {selectedVersionDetail.userName || currentUser?.nombre || 'Usuario'}
                        </span>
                        {selectedVersionDetail.userEmail ? ` (${selectedVersionDetail.userEmail})` : ''}
                      </p>
                    </div>
                  </div>

                  {/* 4 Quick Stat Hero Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 pt-1">
                    {/* Area Tile */}
                    <div className="rounded-2xl border border-[#dfe9e2] bg-white p-3.5 flex items-start gap-3 shadow-2xs">
                      <span className="size-9 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0">
                        <Building2 className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                          Área
                        </div>
                        <div className="text-xs font-bold text-[#163522] truncate mt-0.5" title={parsedData.normalizedMatrix?.area || matrixTitle}>
                          {parsedData.normalizedMatrix?.area || matrixTitle}
                        </div>
                      </div>
                    </div>

                    {/* Responsible Tile */}
                    <div className="rounded-2xl border border-[#dfe9e2] bg-white p-3.5 flex items-start gap-3 shadow-2xs">
                      <span className="size-9 rounded-xl bg-[#e0f2fe] text-[#0284c7] flex items-center justify-center shrink-0">
                        <User className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                          Responsable
                        </div>
                        <div className="text-xs font-bold text-[#163522] truncate mt-0.5" title={parsedData.normalizedMatrix?.responsable || 'No asignado'}>
                          {parsedData.normalizedMatrix?.responsable || 'No asignado'}
                        </div>
                      </div>
                    </div>

                    {/* Structure Counts Tile */}
                    <div className="rounded-2xl border border-[#dfe9e2] bg-white p-3.5 flex items-start gap-3 shadow-2xs">
                      <span className="size-9 rounded-xl bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center shrink-0">
                        <Layers className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                          Estructura
                        </div>
                        <div className="text-xs font-bold text-[#163522] truncate mt-0.5">
                          {parsedData.currentCounts.procesosCount} procesos • {parsedData.currentCounts.peligrosCount} peligros
                        </div>
                      </div>
                    </div>

                    {/* Last Update Tile */}
                    <div className="rounded-2xl border border-[#dfe9e2] bg-white p-3.5 flex items-start gap-3 shadow-2xs">
                      <span className="size-9 rounded-xl bg-[#fef3c7] text-[#b45309] flex items-center justify-center shrink-0">
                        <Calendar className="size-4.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-wider text-[#7a9182]">
                          Fecha registro
                        </div>
                        <div className="text-xs font-bold text-[#163522] truncate mt-0.5">
                          {new Date(selectedVersionDetail.timestamp).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. MIDDLE ROW: Matrix Information & Structure Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Card 1: Información de la matriz */}
                  <div className="rounded-2xl border border-[#dfe9e2] bg-[#fcfdfc] p-5 shadow-2xs space-y-3">
                    <div className="flex items-center gap-2 text-sm font-black text-[#163522]">
                      <FileSpreadsheet className="size-4.5 text-[#1F7D3E]" />
                      <span>Información de la matriz</span>
                    </div>

                    <div className="bg-white rounded-xl border border-[#edf2ed] p-3.5 divide-y divide-[#edf2ed]">
                      <DetailRow
                        label="Área"
                        value={parsedData.normalizedMatrix?.area || 'Vacío'}
                      />
                      <DetailRow
                        label="Responsable"
                        value={parsedData.normalizedMatrix?.responsable || 'Vacío'}
                      />
                      <DetailRow
                        label="Fecha elaboración"
                        value={
                          parsedData.normalizedMatrix?.fechaElaboracion
                            ? String(parsedData.normalizedMatrix.fechaElaboracion)
                            : 'Vacío'
                        }
                      />
                      <DetailRow
                        label="Fecha actualización"
                        value={
                          parsedData.normalizedMatrix?.fechaActualizacion
                            ? String(parsedData.normalizedMatrix.fechaActualizacion)
                            : 'Vacío'
                        }
                      />
                      <DetailRow
                        label="Archivos adjuntos"
                        value={parsedData.normalizedMatrix?.files?.length || 0}
                      />
                    </div>
                  </div>

                  {/* Card 2: Cambios respecto a la versión anterior / Resumen estructural */}
                  <div className="rounded-2xl border border-[#dfe9e2] bg-[#fcfdfc] p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-black text-[#163522]">
                        <Sparkles className="size-4.5 text-[#1F7D3E]" />
                        <span>Resumen estructural de la versión</span>
                      </div>
                      {parsedData.hasBefore && (
                        <span className="text-[10px] font-bold text-[#1F7D3E] bg-[#eef7f0] px-2 py-0.5 rounded-full border border-[#d1e2d6]">
                          Comparado con anterior
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Procesos Stat */}
                      <div className="rounded-xl border border-[#dfe9e2] bg-white p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="size-7 rounded-lg bg-[#f0fdf4] text-[#1F7D3E] flex items-center justify-center">
                            <Settings className="size-4" />
                          </span>
                          {parsedData.hasBefore ? (
                            <span
                              className={`text-[11px] font-black ${
                                parsedData.currentCounts.procesosCount > parsedData.beforeCounts.procesosCount
                                  ? 'text-[#1F7D3E]'
                                  : parsedData.currentCounts.procesosCount < parsedData.beforeCounts.procesosCount
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {parsedData.currentCounts.procesosCount - parsedData.beforeCounts.procesosCount > 0
                                ? `+${parsedData.currentCounts.procesosCount - parsedData.beforeCounts.procesosCount}`
                                : parsedData.currentCounts.procesosCount - parsedData.beforeCounts.procesosCount < 0
                                ? `${parsedData.currentCounts.procesosCount - parsedData.beforeCounts.procesosCount}`
                                : '—'}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xl font-black text-[#163522]">
                          {parsedData.currentCounts.procesosCount}
                        </div>
                        <div className="text-[11px] font-bold text-[#7a9182]">Procesos</div>
                      </div>

                      {/* Zonas Stat */}
                      <div className="rounded-xl border border-[#dfe9e2] bg-white p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="size-7 rounded-lg bg-[#f0fdfa] text-[#0d9488] flex items-center justify-center">
                            <MapPin className="size-4" />
                          </span>
                          {parsedData.hasBefore ? (
                            <span
                              className={`text-[11px] font-black ${
                                parsedData.currentCounts.zonasCount > parsedData.beforeCounts.zonasCount
                                  ? 'text-[#1F7D3E]'
                                  : parsedData.currentCounts.zonasCount < parsedData.beforeCounts.zonasCount
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {parsedData.currentCounts.zonasCount - parsedData.beforeCounts.zonasCount > 0
                                ? `+${parsedData.currentCounts.zonasCount - parsedData.beforeCounts.zonasCount}`
                                : parsedData.currentCounts.zonasCount - parsedData.beforeCounts.zonasCount < 0
                                ? `${parsedData.currentCounts.zonasCount - parsedData.beforeCounts.zonasCount}`
                                : '—'}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xl font-black text-[#163522]">
                          {parsedData.currentCounts.zonasCount}
                        </div>
                        <div className="text-[11px] font-bold text-[#7a9182]">Zonas</div>
                      </div>

                      {/* Actividades Stat */}
                      <div className="rounded-xl border border-[#dfe9e2] bg-white p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="size-7 rounded-lg bg-[#f8fafc] text-[#475569] flex items-center justify-center">
                            <FileText className="size-4" />
                          </span>
                          {parsedData.hasBefore ? (
                            <span
                              className={`text-[11px] font-black ${
                                parsedData.currentCounts.actividadesCount > parsedData.beforeCounts.actividadesCount
                                  ? 'text-[#1F7D3E]'
                                  : parsedData.currentCounts.actividadesCount < parsedData.beforeCounts.actividadesCount
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {parsedData.currentCounts.actividadesCount - parsedData.beforeCounts.actividadesCount > 0
                                ? `+${parsedData.currentCounts.actividadesCount - parsedData.beforeCounts.actividadesCount}`
                                : parsedData.currentCounts.actividadesCount - parsedData.beforeCounts.actividadesCount < 0
                                ? `${parsedData.currentCounts.actividadesCount - parsedData.beforeCounts.actividadesCount}`
                                : '—'}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xl font-black text-[#163522]">
                          {parsedData.currentCounts.actividadesCount}
                        </div>
                        <div className="text-[11px] font-bold text-[#7a9182]">Actividades</div>
                      </div>

                      {/* Peligros Stat */}
                      <div className="rounded-xl border border-[#dfe9e2] bg-white p-3.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="size-7 rounded-lg bg-[#fff1f2] text-[#e11d48] flex items-center justify-center">
                            <AlertTriangle className="size-4" />
                          </span>
                          {parsedData.hasBefore ? (
                            <span
                              className={`text-[11px] font-black ${
                                parsedData.currentCounts.peligrosCount > parsedData.beforeCounts.peligrosCount
                                  ? 'text-[#1F7D3E]'
                                  : parsedData.currentCounts.peligrosCount < parsedData.beforeCounts.peligrosCount
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {parsedData.currentCounts.peligrosCount - parsedData.beforeCounts.peligrosCount > 0
                                ? `+${parsedData.currentCounts.peligrosCount - parsedData.beforeCounts.peligrosCount}`
                                : parsedData.currentCounts.peligrosCount - parsedData.beforeCounts.peligrosCount < 0
                                ? `${parsedData.currentCounts.peligrosCount - parsedData.beforeCounts.peligrosCount}`
                                : '—'}
                            </span>
                          ) : null}
                        </div>
                        <div className="text-xl font-black text-[#163522]">
                          {parsedData.currentCounts.peligrosCount}
                        </div>
                        <div className="text-[11px] font-bold text-[#7a9182]">Peligros</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM SECTION: Interactive Process Tree */}
                <div className="space-y-4 pt-2">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#dfe9e2]">
                    <div>
                      <h3 className="text-base font-black text-[#163522] flex items-center gap-2">
                        <Layers className="size-4.5 text-[#1F7D3E]" />
                        <span>Detalle de estructura de la matriz</span>
                      </h3>
                      <p className="text-xs text-[#7a9182]">
                        Explora procesos, zonas, actividades y evaluación de peligros registrados.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Search in structure */}
                      <div className="relative w-full sm:w-56">
                        <Search className="size-3.5 text-[#7a9182] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={structureSearch}
                          onChange={(e) => setStructureSearch(e.target.value)}
                          placeholder="Buscar actividad o peligro..."
                          className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-[#dfe9e2] bg-[#fbfdfb] focus:bg-white focus:outline-none focus:border-[#1F7D3E] text-[#163522] placeholder:text-[#a3b8aa]"
                        />
                      </div>

                      {/* Expand / Collapse All */}
                      <button
                        type="button"
                        onClick={() => handleExpandAll(true)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f4f8f5] text-[11px] font-bold text-[#355244] transition-colors"
                        title="Expandir todo"
                      >
                        <Maximize2 className="size-3" />
                        <span className="hidden sm:inline">Expandir</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExpandAll(false)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f4f8f5] text-[11px] font-bold text-[#355244] transition-colors"
                        title="Colapsar todo"
                      >
                        <Minimize2 className="size-3" />
                        <span className="hidden sm:inline">Colapsar</span>
                      </button>
                    </div>
                  </div>

                  {/* Processes Tree */}
                  {filteredProcesses.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#dfe9e2] bg-[#fbfdfb] p-8 text-center">
                      <div className="text-sm font-bold text-[#355244]">
                        No se encontraron elementos coincidentes
                      </div>
                      <div className="text-xs text-[#7a9182] mt-1">
                        Intenta con otro término de búsqueda o limpia el filtro.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredProcesses.map((proceso: any, pIndex: number) => {
                        const pKey = `${pIndex}`
                        const isProcessExpanded = expandedProcesses[pKey] !== false // Default open

                        const totalZonas = (proceso.zonas || []).length
                        let totalAct = 0
                        let totalPel = 0
                        for (const z of proceso.zonas || []) {
                          totalAct += (z.actividades || []).length
                          for (const a of z.actividades || []) {
                            totalPel += (a.peligros || []).length
                          }
                        }

                        return (
                          <div
                            key={`proceso-${pIndex}`}
                            className="rounded-2xl border border-[#dbe8de] bg-white shadow-2xs overflow-hidden"
                          >
                            {/* Proceso Header */}
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedProcesses((prev) => ({
                                  ...prev,
                                  [pKey]: !isProcessExpanded,
                                }))
                              }
                              className="w-full px-5 py-3.5 bg-[linear-gradient(180deg,#fcfdfc_0%,#f5f9f6_100%)] border-b border-[#dbe8de] flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#edf5ef]"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="size-8 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d1e2d6]">
                                  <Settings className="size-4" />
                                </span>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-[#1F7D3E] uppercase tracking-wider">
                                    Proceso {pIndex + 1}
                                  </div>
                                  <div className="text-sm font-black text-[#163522] truncate">
                                    {proceso.nombre || 'Proceso sin nombre'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="inline-flex items-center rounded-full bg-white border border-[#d1e2d6] px-2.5 py-0.5 text-[11px] font-bold text-[#355244]">
                                  {totalZonas} {totalZonas === 1 ? 'zona' : 'zonas'} • {totalPel} peligros
                                </span>
                                <span className="size-7 rounded-lg bg-white border border-[#d1e2d6] flex items-center justify-center text-[#5e6b62]">
                                  {isProcessExpanded ? (
                                    <ChevronDown className="size-4" />
                                  ) : (
                                    <ChevronRight className="size-4" />
                                  )}
                                </span>
                              </div>
                            </button>

                            {/* Proceso Body (Zonas) */}
                            {isProcessExpanded && (
                              <div className="p-4 sm:p-5 space-y-4 bg-[#f8faf9]/50">
                                {(proceso.zonas || []).length === 0 ? (
                                  <div className="text-xs text-[#7a9182] italic py-2">
                                    No hay zonas registradas en este proceso.
                                  </div>
                                ) : (
                                  proceso.zonas.map((zona: any, zIndex: number) => {
                                    const zKey = `${pIndex}-${zIndex}`
                                    const isZoneExpanded = expandedZones[zKey] !== false // Default open

                                    const zonaActCount = (zona.actividades || []).length
                                    let zonaPelCount = 0
                                    for (const a of zona.actividades || []) {
                                      zonaPelCount += (a.peligros || []).length
                                    }

                                    return (
                                      <div
                                        key={`zona-${zIndex}`}
                                        className="rounded-2xl border border-[#dfe9e2] bg-white overflow-hidden shadow-2xs"
                                      >
                                        {/* Zona Header */}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setExpandedZones((prev) => ({
                                              ...prev,
                                              [zKey]: !isZoneExpanded,
                                            }))
                                          }
                                          className="w-full px-4 py-3 bg-[#fdfefe] border-b border-[#edf2ed] flex items-center justify-between gap-3 text-left transition-colors hover:bg-[#f4f8f5]"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            <span className="size-7 rounded-lg bg-[#ccfbf1] text-[#0d9488] flex items-center justify-center shrink-0">
                                              <MapPin className="size-3.5" />
                                            </span>
                                            <div className="min-w-0">
                                              <div className="text-[10px] font-bold text-[#0d9488] uppercase tracking-wider">
                                                Zona {zIndex + 1}
                                              </div>
                                              <div className="text-xs font-bold text-[#163522] truncate">
                                                {zona.nombre || 'Zona sin nombre'}
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] font-semibold text-[#5e6b62]">
                                              {zonaActCount} act. • {zonaPelCount} pel.
                                            </span>
                                            <span className="size-6 rounded-md bg-[#f8faf9] border border-[#dfe9e2] flex items-center justify-center text-[#5e6b62]">
                                              {isZoneExpanded ? (
                                                <ChevronDown className="size-3.5" />
                                              ) : (
                                                <ChevronRight className="size-3.5" />
                                              )}
                                            </span>
                                          </div>
                                        </button>

                                        {/* Zona Body (Actividades) */}
                                        {isZoneExpanded && (
                                          <div className="p-3.5 sm:p-4 space-y-3 bg-[#fcfdfc]">
                                            {(zona.actividades || []).length === 0 ? (
                                              <div className="text-xs text-[#7a9182] italic py-2">
                                                No hay actividades en esta zona.
                                              </div>
                                            ) : (
                                              zona.actividades.map((actividad: any, aIndex: number) => {
                                                const aKey = `${pIndex}-${zIndex}-${aIndex}`
                                                const isActExpanded = !!expandedActivities[aKey]
                                                const peligrosList = actividad.peligros || []

                                                return (
                                                  <div
                                                    key={`act-${aIndex}`}
                                                    className="rounded-xl border border-[#dfe9e2] bg-white overflow-hidden shadow-2xs transition-all hover:border-[#1F7D3E]/40"
                                                  >
                                                    {/* Actividad Bar */}
                                                    <div className="p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                      <div className="min-w-0 space-y-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                          <span className="inline-flex items-center gap-1 rounded-md bg-[#eef7f0] px-2 py-0.5 text-[10px] font-black uppercase text-[#1F7D3E]">
                                                            <FileText className="size-3" />
                                                            Actividad {aIndex + 1}
                                                          </span>
                                                          <span className="text-xs font-black text-[#163522]">
                                                            {actividad.nombre || 'Actividad sin nombre'}
                                                          </span>
                                                        </div>
                                                        {actividad.descripcion && (
                                                          <p className="text-xs text-[#5e6b62] line-clamp-2 leading-relaxed">
                                                            {actividad.descripcion}
                                                          </p>
                                                        )}
                                                      </div>

                                                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
                                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#163522] bg-[#f4f8f5] px-2.5 py-1 rounded-full border border-[#dfe9e2]">
                                                          <AlertTriangle className="size-3 text-[#b45309]" />
                                                          {peligrosList.length}{' '}
                                                          {peligrosList.length === 1 ? 'peligro' : 'peligros'}
                                                        </span>

                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            setExpandedActivities((prev) => ({
                                                              ...prev,
                                                              [aKey]: !isActExpanded,
                                                            }))
                                                          }
                                                          className="inline-flex items-center gap-1 rounded-lg border border-[#d1e2d6] bg-white px-3 py-1 text-xs font-bold text-[#1F7D3E] hover:bg-[#eef7f0] transition-colors"
                                                        >
                                                          <span>{isActExpanded ? 'Ocultar' : 'Ver detalle'}</span>
                                                          {isActExpanded ? (
                                                            <ChevronDown className="size-3.5" />
                                                          ) : (
                                                            <ChevronRight className="size-3.5" />
                                                          )}
                                                        </button>
                                                      </div>
                                                    </div>

                                                    {/* Actividad Expanded Details & Peligros */}
                                                    {isActExpanded && (
                                                      <div className="border-t border-[#edf2ed] bg-[#fbfdfb] p-4 sm:p-5 space-y-4">
                                                        {/* Metadata info rows */}
                                                        <div className="bg-white rounded-xl border border-[#edf2ed] p-3.5 divide-y divide-[#edf2ed]">
                                                          <DetailRow
                                                            label="Descripción"
                                                            value={actividad.descripcion || 'Sin descripción'}
                                                          />
                                                          <DetailRow
                                                            label="Tareas"
                                                            value={actividad.tareas || 'Sin tareas'}
                                                          />
                                                          <DetailRow
                                                            label="Cargo"
                                                            value={actividad.cargo || 'Sin cargo especificado'}
                                                          />
                                                          <DetailRow
                                                            label="Rutinario"
                                                            value={
                                                              actividad.rutinario === null
                                                                ? 'Sin dato'
                                                                : actividad.rutinario
                                                                ? 'Sí'
                                                                : 'No'
                                                            }
                                                          />
                                                        </div>

                                                        {/* Peligros Sub-List */}
                                                        <div className="space-y-3 pt-1">
                                                          <div className="text-xs font-black text-[#163522] uppercase tracking-wider flex items-center gap-1.5">
                                                            <ShieldAlert className="size-3.5 text-[#1F7D3E]" />
                                                            <span>Peligros evaluados ({peligrosList.length})</span>
                                                          </div>

                                                          {peligrosList.length === 0 ? (
                                                            <div className="rounded-xl border border-dashed border-[#dfe9e2] bg-white p-4 text-center text-xs text-[#7a9182]">
                                                              No hay peligros asociados a esta actividad.
                                                            </div>
                                                          ) : (
                                                            peligrosList.map((peligro: any, pelIndex: number) => {
                                                              const pelKey = `${pIndex}-${zIndex}-${aIndex}-${pelIndex}`
                                                              const isHazardExpanded = !!expandedHazards[pelKey]
                                                              const riskStyle = formatRiskLevel(peligro)

                                                              return (
                                                                <div
                                                                  key={`pel-${pelIndex}`}
                                                                  className="rounded-xl border border-[#dfe9e2] bg-white overflow-hidden shadow-2xs"
                                                                >
                                                                  {/* Peligro Item Header */}
                                                                  <div className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                                    <div className="min-w-0 space-y-1">
                                                                      <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="inline-flex items-center rounded-md bg-[#eef7f0] px-2 py-0.5 text-[10px] font-black uppercase text-[#1F7D3E]">
                                                                          Peligro {pelIndex + 1}
                                                                        </span>
                                                                        {peligro.clasificacion && (
                                                                          <span className="inline-flex items-center rounded-md bg-[#f4f8f5] px-2 py-0.5 text-[10px] font-bold text-[#5e6b62] border border-[#dfe9e2]">
                                                                            {peligro.clasificacion}
                                                                          </span>
                                                                        )}
                                                                        {/* Risk Level Badge */}
                                                                        <span
                                                                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black ${riskStyle.bg} ${riskStyle.text} border ${riskStyle.border}`}
                                                                        >
                                                                          {riskStyle.tag}
                                                                        </span>
                                                                      </div>
                                                                      <div className="text-xs font-bold text-[#163522] line-clamp-2">
                                                                        {peligro.descripcion || 'Sin descripción de peligro'}
                                                                      </div>
                                                                    </div>

                                                                    <button
                                                                      type="button"
                                                                      onClick={() =>
                                                                        setExpandedHazards((prev) => ({
                                                                          ...prev,
                                                                          [pelKey]: !isHazardExpanded,
                                                                        }))
                                                                      }
                                                                      className="inline-flex items-center gap-1 rounded-lg border border-[#dfe9e2] bg-[#fbfdfb] hover:bg-[#f4f8f5] px-2.5 py-1 text-xs font-bold text-[#355244] shrink-0 transition-colors self-start sm:self-center"
                                                                    >
                                                                      <span>
                                                                        {isHazardExpanded ? 'Ocultar' : 'Ver controles'}
                                                                      </span>
                                                                      {isHazardExpanded ? (
                                                                        <ChevronDown className="size-3" />
                                                                      ) : (
                                                                        <ChevronRight className="size-3" />
                                                                      )}
                                                                    </button>
                                                                  </div>

                                                                  {/* Peligro Expanded Detailed Breakdown */}
                                                                  {isHazardExpanded && (
                                                                    <div className="border-t border-[#edf2ed] bg-[#fbfdfb] p-4 space-y-4 text-xs">
                                                                      {/* Section 1: Evaluacion y Criterios */}
                                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {/* Evaluacion Card */}
                                                                        <div className="rounded-xl border border-[#dfe9e2] bg-white p-3 space-y-2">
                                                                          <div className="font-bold text-[#163522] border-b border-[#edf2ed] pb-1.5 flex items-center justify-between">
                                                                            <span>Evaluación del Riesgo</span>
                                                                            <span
                                                                              className={`px-2 py-0.5 rounded text-[10px] font-black ${riskStyle.bg} ${riskStyle.text}`}
                                                                            >
                                                                              {riskStyle.label}
                                                                            </span>
                                                                          </div>
                                                                          <DetailRow
                                                                            label="ND / NE / NC"
                                                                            value={
                                                                              [
                                                                                peligro.evaluacion?.nivelDeficiencia,
                                                                                peligro.evaluacion?.nivelExposicion,
                                                                                peligro.evaluacion?.nivelConsecuencia,
                                                                              ]
                                                                                .filter((v) => v !== null && v !== undefined && v !== '')
                                                                                .join(' / ') || 'Vacío'
                                                                            }
                                                                          />
                                                                          <DetailRow
                                                                            label="NP / NR"
                                                                            value={
                                                                              [
                                                                                peligro.evaluacion?.nivelProbabilidad,
                                                                                peligro.evaluacion?.nivelRiesgo,
                                                                              ]
                                                                                .filter((v) => v !== null && v !== undefined && v !== '')
                                                                                .join(' / ') || 'Vacío'
                                                                            }
                                                                          />
                                                                          <DetailRow
                                                                            label="Interpretación"
                                                                            value={
                                                                              [
                                                                                peligro.evaluacion?.interpProbabilidad,
                                                                                peligro.evaluacion?.interpRiesgo,
                                                                                peligro.evaluacion?.aceptabilidad,
                                                                              ]
                                                                                .filter(Boolean)
                                                                                .join(' | ') || 'Vacío'
                                                                            }
                                                                          />
                                                                        </div>

                                                                        {/* Criterios Card */}
                                                                        <div className="rounded-xl border border-[#dfe9e2] bg-white p-3 space-y-2">
                                                                          <div className="font-bold text-[#163522] border-b border-[#edf2ed] pb-1.5">
                                                                            Criterios para Controles
                                                                          </div>
                                                                          <DetailRow
                                                                            label="N° Expuestos"
                                                                            value={
                                                                              peligro.criterio?.numExpuestos ??
                                                                              peligro.criterio?.num_expuestos ??
                                                                              'Vacío'
                                                                            }
                                                                          />
                                                                          <DetailRow
                                                                            label="Peor Consecuencia"
                                                                            value={
                                                                              peligro.criterio?.peorConsecuencia ??
                                                                              peligro.criterio?.peor_consecuencia ??
                                                                              'Vacío'
                                                                            }
                                                                          />
                                                                          <DetailRow
                                                                            label="Requisito Legal"
                                                                            value={
                                                                              typeof (peligro.criterio?.requisitoLegal ?? peligro.criterio?.requisito_legal) === 'boolean'
                                                                                ? ((peligro.criterio?.requisitoLegal ?? peligro.criterio?.requisito_legal) ? (
                                                                                    <span className="text-[#1F7D3E] font-bold flex items-center gap-1">
                                                                                      <CheckCircle2 className="size-3" /> Sí
                                                                                    </span>
                                                                                  ) : (
                                                                                    <span className="text-slate-500 flex items-center gap-1">
                                                                                      <XCircle className="size-3" /> No
                                                                                    </span>
                                                                                  ))
                                                                                : 'Vacío'
                                                                            }
                                                                          />
                                                                        </div>
                                                                      </div>

                                                                      {/* Section 2: Controles Existentes & Medidas de Intervención */}
                                                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {/* Controles Existentes */}
                                                                        <div className="rounded-xl border border-[#dfe9e2] bg-white p-3 space-y-2">
                                                                          <div className="font-bold text-[#163522] border-b border-[#edf2ed] pb-1.5">
                                                                            Controles Existentes
                                                                          </div>
                                                                          <DetailRow
                                                                            label="Fuente"
                                                                            value={peligro.control?.fuente || 'Ninguno'}
                                                                          />
                                                                          <DetailRow
                                                                            label="Medio"
                                                                            value={peligro.control?.medio || 'Ninguno'}
                                                                          />
                                                                          <DetailRow
                                                                            label="Individuo"
                                                                            value={peligro.control?.individuo || 'Ninguno'}
                                                                          />
                                                                        </div>

                                                                        {/* Medidas de Intervención */}
                                                                        <div className="rounded-xl border border-[#dfe9e2] bg-white p-3 space-y-2">
                                                                          <div className="font-bold text-[#163522] border-b border-[#edf2ed] pb-1.5">
                                                                            Medidas de Intervención
                                                                          </div>
                                                                          <DetailRow
                                                                            label="Eliminación"
                                                                            value={peligro.intervencion?.eliminacion || 'Ninguno'}
                                                                          />
                                                                          <DetailRow
                                                                            label="Sustitución"
                                                                            value={peligro.intervencion?.sustitucion || 'Ninguno'}
                                                                          />
                                                                          <DetailRow
                                                                            label="Controles Ing."
                                                                            value={
                                                                              peligro.intervencion?.controlesIngenieria ||
                                                                              peligro.intervencion?.controles_ingenieria ||
                                                                              'Ninguno'
                                                                            }
                                                                          />
                                                                          <DetailRow
                                                                            label="Controles Adm."
                                                                            value={
                                                                              peligro.intervencion?.controlesAdministrativos ||
                                                                              peligro.intervencion?.controles_administrativos ||
                                                                              'Ninguno'
                                                                            }
                                                                          />
                                                                          <DetailRow
                                                                            label="EPP"
                                                                            value={peligro.intervencion?.epp || 'Ninguno'}
                                                                          />
                                                                          <DetailRow
                                                                            label="Responsable"
                                                                            value={peligro.intervencion?.responsable || 'Vacío'}
                                                                          />
                                                                          <DetailRow
                                                                            label="Fecha Ejecución"
                                                                            value={
                                                                              peligro.intervencion?.fechaEjecucion ||
                                                                              peligro.intervencion?.fecha_ejecucion ||
                                                                              'Vacío'
                                                                            }
                                                                          />
                                                                        </div>
                                                                      </div>
                                                                    </div>
                                                                  )}
                                                                </div>
                                                              )
                                                            })
                                                          )}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                )
                                              })
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  })
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
