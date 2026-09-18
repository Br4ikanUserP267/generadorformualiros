"use client"

import React, { useState, useEffect } from 'react'
import {
  Flame,
  Plus,
  Upload,
  Download,
  Sparkles,
  Search,
  Trash2,
  Pencil,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Loader2,
} from 'lucide-react'
import { AppSidebar } from '@/components/dashboard/app-sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { PeligroModal } from '@/components/peligros/peligro-modal'
import { ImportPeligrosModal } from '@/components/peligros/import-peligros-modal'
import { PeligroPreviewModal } from '@/components/peligros/peligro-preview-modal'
import ConfirmModal from '@/components/confirm-modal'
import { ClasificacionFilterDropdown } from '@/components/peligros/clasificacion-filter-dropdown'
import {
  CLASIFICACIONES_RIESGO,
  interpProbabilidad,
  interpNivelRiesgo,
  normalizeClasificacion,
  getClasificacionStyle,
} from '@/lib/gtc45-utils'
import { apiFetch } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function PeligrosDashboard() {
  const { toast } = useToast()
  const [mobileOpen, setMobileOpen] = useState(false)

  const [items, setItems] = useState<any[]>([])
  const [summary, setSummary] = useState({
    totalCatalog: 0,
    muyAlto: 0,
    alto: 0,
    medio: 0,
    bajo: 0,
  })

  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClasificacion, setSelectedClasificacion] = useState('TODOS')
  const [selectedNivelRiesgo, setSelectedNivelRiesgo] = useState('TODOS')

  // Modals state
  const [showPeligroModal, setShowPeligroModal] = useState(false)
  const [editingPeligro, setEditingPeligro] = useState<any | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [previewPeligro, setPreviewPeligro] = useState<any | null>(null)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [classificationsList, setClassificationsList] = useState<string[]>(Array.from(CLASIFICACIONES_RIESGO))
  const [detailedCounts, setDetailedCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    async function loadClassifications() {
      try {
        const res = await apiFetch('/api/peligros/classifications')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.classifications) && data.classifications.length > 0) {
            setClassificationsList(data.classifications)
          }
          if (Array.isArray(data.detailed)) {
            const map: Record<string, number> = {}
            for (const d of data.detailed) {
              map[d.name] = d.count
            }
            setDetailedCounts(map)
          }
        }
      } catch (e) {
        console.error('Error loading classifications:', e)
      }
    }
    loadClassifications()
  }, [])

  const fetchCatalog = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.append('q', searchTerm.trim())
      if (selectedClasificacion !== 'TODOS') params.append('clasificacion', selectedClasificacion)
      if (selectedNivelRiesgo !== 'TODOS') params.append('nivelRiesgo', selectedNivelRiesgo)

      const res = await apiFetch(`/api/peligros?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setItems(data.items || [])
        if (data.summary) {
          setSummary({
            totalCatalog: Number(data.summary.totalCatalog || 0),
            muyAlto: Number(data.summary.muyAlto || 0),
            alto: Number(data.summary.alto || 0),
            medio: Number(data.summary.medio || 0),
            bajo: Number(data.summary.bajo || 0),
          })
        }
      } else {
        throw new Error('No fue posible cargar el catálogo')
      }
    } catch (err: any) {
      console.error('Error fetching catalog:', err)
      toast({
        title: 'Error al cargar catálogo',
        description: err?.message || 'Verifica la conexión con el servidor.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCatalog()
    }, 250)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm, selectedClasificacion, selectedNivelRiesgo])

  // Sync / Extract from matrices
  const handleSyncFromMatrices = async () => {
    setSyncing(true)
    try {
      const res = await apiFetch('/api/peligros/seed-from-matrices', {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Error al sincronizar desde matrices')
      const data = await res.json()
      toast({
        title: 'Sincronización Completada',
        description: data.message || 'Se consolidaron los peligros de las matrices en el catálogo.',
      })
      fetchCatalog()
    } catch (err: any) {
      toast({
        title: 'Error de sincronización',
        description: err?.message || 'No fue posible sincronizar.',
        variant: 'destructive',
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleDeletePeligro = async () => {
    if (!deletingId) return
    try {
      const res = await apiFetch(`/api/peligros/${deletingId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Error al eliminar el peligro')
      toast({
        title: 'Peligro eliminado',
        description: 'El peligro ha sido removido del catálogo maestro.',
      })
      fetchCatalog()
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err?.message || 'No fue posible eliminar el peligro.',
        variant: 'destructive',
      })
    } finally {
      setConfirmDeleteOpen(false)
      setDeletingId(null)
    }
  }

  const handleExportExcel = () => {
    window.location.href = '/api/peligros/export'
  }

  return (
    <div className="flex h-screen w-full bg-[#f8faf9] overflow-hidden">
      {/* Sidebar */}
      <AppSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <DashboardHeader
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onOpenInstructions={() => {}}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Title & Primary Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="size-9 rounded-xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center shrink-0 border border-[#d6ebd9]">
                  <Flame className="size-5" />
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-[#163522] tracking-tight">
                  Catálogo Maestro de Peligros
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#7a9182] font-medium">
                Biblioteca centralizada de peligros clínicos estandarizados, controles base y evaluación inicial del riesgo (antes de intervención GTC 45).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSyncFromMatrices}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#163522] text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                title="Extraer y consolidar peligros únicos desde las matrices existentes"
              >
                {syncing ? (
                  <Loader2 className="size-3.5 animate-spin text-[#1F7D3E]" />
                ) : (
                  <Sparkles className="size-3.5 text-[#1F7D3E]" />
                )}
                <span>Sincronizar Matrices</span>
              </button>

              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#163522] text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Upload className="size-3.5 text-[#1F7D3E]" />
                <span>Importar Excel</span>
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#163522] text-xs font-bold transition-all shadow-2xs cursor-pointer"
              >
                <Download className="size-3.5 text-[#1F7D3E]" />
                <span>Exportar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingPeligro(null)
                  setShowPeligroModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-black shadow-sm shadow-[#1F7D3E]/20 transition-all cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Nuevo Peligro</span>
              </button>
            </div>
          </div>

          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Catalog */}
            <div className="p-4 rounded-2xl border border-[#dfe9e2] bg-white shadow-xs space-y-1">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-[#7a9182]">
                Peligros Únicos
              </div>
              <div className="text-2xl font-black text-[#163522]">{summary.totalCatalog}</div>
              <div className="text-[10px] font-bold text-[#1F7D3E]">Catálogo Central</div>
            </div>

            {/* Muy Alto */}
            <div
              onClick={() => setSelectedNivelRiesgo(selectedNivelRiesgo === 'MUY_ALTO' ? 'TODOS' : 'MUY_ALTO')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs space-y-1 ${
                selectedNivelRiesgo === 'MUY_ALTO'
                  ? 'border-rose-500 bg-rose-50/80 ring-2 ring-rose-500/20'
                  : 'border-[#fecaca] bg-[#fef2f2] hover:border-rose-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-[#991b1b]">
                  Muy Alto (I)
                </span>
                <AlertOctagon className="size-3.5 text-[#991b1b]" />
              </div>
              <div className="text-2xl font-black text-[#991b1b]">{summary.muyAlto}</div>
              <div className="text-[10px] font-bold text-[#b91c1c]">No Aceptable</div>
            </div>

            {/* Alto */}
            <div
              onClick={() => setSelectedNivelRiesgo(selectedNivelRiesgo === 'ALTO' ? 'TODOS' : 'ALTO')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs space-y-1 ${
                selectedNivelRiesgo === 'ALTO'
                  ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/20'
                  : 'border-[#fed7aa] bg-[#fff7ed] hover:border-orange-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-[#c2410c]">
                  Alto (II)
                </span>
                <AlertTriangle className="size-3.5 text-[#ea580c]" />
              </div>
              <div className="text-2xl font-black text-[#c2410c]">{summary.alto}</div>
              <div className="text-[10px] font-bold text-[#ea580c]">Control Específico</div>
            </div>

            {/* Medio */}
            <div
              onClick={() => setSelectedNivelRiesgo(selectedNivelRiesgo === 'MEDIO' ? 'TODOS' : 'MEDIO')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs space-y-1 ${
                selectedNivelRiesgo === 'MEDIO'
                  ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20'
                  : 'border-[#fde68a] bg-[#fffbeb] hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-[#b45309]">
                  Medio (III)
                </span>
                <Clock className="size-3.5 text-[#d97706]" />
              </div>
              <div className="text-2xl font-black text-[#b45309]">{summary.medio}</div>
              <div className="text-[10px] font-bold text-[#d97706]">Mejorable</div>
            </div>

            {/* Bajo */}
            <div
              onClick={() => setSelectedNivelRiesgo(selectedNivelRiesgo === 'BAJO' ? 'TODOS' : 'BAJO')}
              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-xs space-y-1 ${
                selectedNivelRiesgo === 'BAJO'
                  ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                  : 'border-[#bbf7d0] bg-[#f0fdf4] hover:border-emerald-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase tracking-wider text-[#15803d]">
                  Bajo (IV)
                </span>
                <CheckCircle2 className="size-3.5 text-[#16a34a]" />
              </div>
              <div className="text-2xl font-black text-[#15803d]">{summary.bajo}</div>
              <div className="text-[10px] font-bold text-[#16a34a]">Aceptable</div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white border border-[#dfe9e2] rounded-2xl p-4 shadow-2xs space-y-3.5">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="size-4 text-[#7a9182] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por descripción de peligro, código, efectos o controles..."
                  className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border border-[#dfe9e2] bg-[#fbfdfb] focus:bg-white focus:border-[#1F7D3E] focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7a9182] hover:text-[#163522]"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Classification Selector */}
              <div className="w-full md:w-72">
                <ClasificacionFilterDropdown
                  value={selectedClasificacion}
                  onChange={setSelectedClasificacion}
                  options={classificationsList}
                  detailedCounts={detailedCounts}
                  totalCount={summary.totalCatalog}
                />
              </div>

              {/* Reset filter button if active */}
              {(selectedClasificacion !== 'TODOS' || selectedNivelRiesgo !== 'TODOS' || searchTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClasificacion('TODOS')
                    setSelectedNivelRiesgo('TODOS')
                    setSearchTerm('')
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>

          {/* Catalog Items List / Table */}
          <div className="bg-white border border-[#dfe9e2] rounded-3xl shadow-xs overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-[linear-gradient(180deg,#fcfdfc_0%,#f4f8f5_100%)] border-b border-[#dfe9e2] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#163522]">Peligros Registrados en el Catálogo</h3>
                <p className="text-xs text-[#7a9182] font-medium">
                  Mostrando {items.length} {items.length === 1 ? 'peligro' : 'peligros'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="size-8 animate-spin text-[#1F7D3E]" />
                <p className="text-xs font-bold text-[#7a9182]">Cargando catálogo de peligros...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center space-y-4 px-6">
                <div className="size-14 rounded-3xl bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center mx-auto border border-[#d6ebd9]">
                  <Flame className="size-7" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h4 className="text-base font-black text-[#163522]">No se encontraron peligros</h4>
                  <p className="text-xs text-[#7a9182]">
                    No hay registros que coincidan con los filtros aplicados o el catálogo está vacío. Puedes importar tu Excel o extraerlos automáticamente de las matrices.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#163522] text-xs font-bold"
                  >
                    <Upload className="size-3.5 text-[#1F7D3E]" />
                    <span>Importar Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncFromMatrices}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-bold"
                  >
                    <Sparkles className="size-3.5" />
                    <span>Sincronizar desde Matrices</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-[#e8efe9]">
                {items.map((item) => {
                  const riskInfo = interpNivelRiesgo(Number(item.nivelRiesgo || 0))
                  const matricesCount = item._count?.peligrosMatriz || 0

                  return (
                    <div
                      key={item.id}
                      className="p-5 sm:p-6 hover:bg-[#fafcfa] transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                    >
                      {/* Left: Info */}
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.codigo && (
                            <span className="font-mono text-xs font-black text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2 py-0.5 rounded-lg">
                              {item.codigo}
                            </span>
                          )}
                          {(() => {
                            const style = getClasificacionStyle(item.clasificacion)
                            return (
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-lg ${style.bg} ${style.text} border ${style.border} px-2.5 py-0.5 text-[10.5px] font-black uppercase tracking-wider shadow-2xs`}
                              >
                                <span className={`size-1.5 rounded-full ${style.dot}`} />
                                <span>{normalizeClasificacion(item.clasificacion)}</span>
                                <span className="text-[9px] opacity-75 font-mono">[{style.prefix}]</span>
                              </span>
                            )
                          })()}
                          {riskInfo.label && (
                            <span
                              className="inline-flex items-center rounded-full text-[10px] font-black px-2.5 py-0.5 text-white"
                              style={{ backgroundColor: riskInfo.color }}
                            >
                              NR Inicial: {item.nivelRiesgo} • {riskInfo.label}
                            </span>
                          )}
                          {item.nivelProbabilidad !== null && item.nivelConsecuencia !== null && (
                            <span className="inline-flex items-center rounded-full bg-[#f8faf9] text-[#2c4033] border border-[#d6ebd9] px-2.5 py-0.5 text-[9.5px] font-bold">
                              NP {item.nivelProbabilidad} × NC {item.nivelConsecuencia}
                            </span>
                          )}
                          {matricesCount > 0 && (
                            <span className="text-[10.5px] font-bold text-[#7a9182] bg-[#f8faf9] border border-[#e2e9e4] px-2 py-0.5 rounded-md">
                              Presente en {matricesCount} {matricesCount === 1 ? 'actividad' : 'actividades'}
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm sm:text-base font-black text-[#163522] leading-snug">
                          {item.descripcion}
                        </h4>

                        {item.efectosPosibles && (
                          <p className="text-xs text-[#5e6b62] font-medium leading-relaxed">
                            <span className="font-bold text-[#355244]">Efectos:</span> {item.efectosPosibles}
                          </p>
                        )}

                        {/* Controls Pills */}
                        {(item.controlFuente || item.controlMedio || item.controlIndividuo) && (
                          <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                            {item.controlFuente && (
                              <span className="bg-[#f0f5f1] text-[#2c4033] px-2 py-0.5 rounded-md font-medium border border-[#dce8df] truncate max-w-sm">
                                <strong className="font-black text-[#163522]">Fuente:</strong> {item.controlFuente}
                              </span>
                            )}
                            {item.controlMedio && (
                              <span className="bg-[#f0f5f1] text-[#2c4033] px-2 py-0.5 rounded-md font-medium border border-[#dce8df] truncate max-w-sm">
                                <strong className="font-black text-[#163522]">Medio:</strong> {item.controlMedio}
                              </span>
                            )}
                            {item.controlIndividuo && (
                              <span className="bg-[#f0f5f1] text-[#2c4033] px-2 py-0.5 rounded-md font-medium border border-[#dce8df] truncate max-w-sm">
                                <strong className="font-black text-[#163522]">Individuo:</strong> {item.controlIndividuo}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Right: Actions (Preview, Edit, Delete) */}
                      <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                        {/* Preview Icon Button */}
                        <button
                          type="button"
                          onClick={() => setPreviewPeligro(item)}
                          className="size-9 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Ver detalle y vista previa completa de este peligro"
                        >
                          <Eye className="size-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPeligro(item)
                            setShowPeligroModal(true)
                          }}
                          className="size-9 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#5e6b62] hover:text-[#163522] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Editar información de este peligro"
                        >
                          <Pencil className="size-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingId(item.id)
                            setConfirmDeleteOpen(true)
                          }}
                          className="size-9 rounded-xl border border-[#dfe9e2] bg-white hover:bg-rose-50 text-rose-500 hover:text-rose-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Eliminar este peligro del catálogo"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Auxiliary Modals */}
      <PeligroModal
        open={showPeligroModal}
        onOpenChange={setShowPeligroModal}
        peligro={editingPeligro}
        onSaved={fetchCatalog}
      />

      <ImportPeligrosModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
        onImported={fetchCatalog}
      />

      <PeligroPreviewModal
        open={Boolean(previewPeligro)}
        onOpenChange={(v) => {
          if (!v) setPreviewPeligro(null)
        }}
        peligro={previewPeligro}
      />

      <ConfirmModal
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeletePeligro}
        title="Eliminar Peligro del Catálogo"
        message="¿Estás seguro de que deseas eliminar este peligro del catálogo maestro? Las matrices existentes conservarán sus datos históricos."
      />
    </div>
  )
}
