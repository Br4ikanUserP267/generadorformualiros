"use client"

import React, { useState, useEffect } from 'react'
import {
  X,
  Search,
  Flame,
  Plus,
  Check,
  Eye,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Loader2,
} from 'lucide-react'
import {
  CLASIFICACIONES_RIESGO,
  interpProbabilidad,
  interpNivelRiesgo,
  normalizeClasificacion,
  getClasificacionStyle,
} from '@/lib/gtc45-utils'
import { apiFetch } from '@/lib/utils'
import { PeligroPreviewModal } from '@/components/peligros/peligro-preview-modal'
import { ClasificacionFilterDropdown } from '@/components/peligros/clasificacion-filter-dropdown'

interface SelectPeligroCatalogModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPeligros: (selectedPeligros: any[]) => void
}

export function SelectPeligroCatalogModal({
  open,
  onOpenChange,
  onSelectPeligros,
}: SelectPeligroCatalogModalProps) {
  const [catalog, setCatalog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClasificacion, setSelectedClasificacion] = useState('TODOS')
  const [selectedNivelRiesgo, setSelectedNivelRiesgo] = useState('TODOS')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [previewItem, setPreviewItem] = useState<any | null>(null)
  const [classificationsList, setClassificationsList] = useState<string[]>(Array.from(CLASIFICACIONES_RIESGO))
  const [detailedCounts, setDetailedCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (open) {
      fetchCatalog()
      setSelectedIds([])
      // Fetch dynamic classifications with counts
      apiFetch('/api/peligros/classifications')
        .then((res) => res.json())
        .then((data) => {
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
        })
        .catch(() => {})
    }
  }, [open])

  const fetchCatalog = async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/peligros?limit=500')
      if (res.ok) {
        const data = await res.json()
        setCatalog(data.items || [])
      }
    } catch (err) {
      console.error('Error fetching catalog for modal:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  const filteredItems = catalog.filter((item) => {
    const matchesSearch =
      !searchTerm.trim() ||
      (item.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.efectosPosibles || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.clasificacion || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesClasif =
      selectedClasificacion === 'TODOS' ||
      (item.clasificacion || '').toUpperCase() === selectedClasificacion.toUpperCase()

    let matchesRisk = true
    if (selectedNivelRiesgo !== 'TODOS') {
      const nr = Number(item.nivelRiesgo || 0)
      if (selectedNivelRiesgo === 'MUY_ALTO') matchesRisk = nr > 500
      else if (selectedNivelRiesgo === 'ALTO') matchesRisk = nr > 120 && nr <= 500
      else if (selectedNivelRiesgo === 'MEDIO') matchesRisk = nr > 20 && nr <= 120
      else if (selectedNivelRiesgo === 'BAJO') matchesRisk = nr <= 20
    }

    return matchesSearch && matchesClasif && matchesRisk
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleConfirmAdd = () => {
    const selected = catalog.filter((p) => selectedIds.includes(p.id))
    if (selected.length > 0) {
      onSelectPeligros(selected)
      onOpenChange(false)
    }
  }

  const handleAddSingle = (peligro: any) => {
    onSelectPeligros([peligro])
    onOpenChange(false)
  }

  return (
    <>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl border border-[#dfe9e2] shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <header className="px-6 py-4 bg-[linear-gradient(180deg,#fcfdfc_0%,#f4f8f5_100%)] border-b border-[#dfe9e2] flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="size-11 rounded-2xl bg-[#1F7D3E] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#1F7D3E]/20">
                <Flame className="size-5.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2.5 py-0.5 rounded-full inline-block">
                  CATÁLOGO DE PELIGROS CLÍNICOS
                </span>
                <h2 className="text-base sm:text-lg font-black text-[#163522] tracking-tight truncate mt-0.5">
                  Seleccionar Peligros para la Actividad
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="size-9 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#7a9182] hover:text-[#163522] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            >
              <X className="size-4.5" />
            </button>
          </header>

          {/* Filter Bar */}
          <div className="p-4 bg-white border-b border-[#dfe9e2] space-y-3 shrink-0">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="size-4 text-[#7a9182] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por peligro, efectos, controles o código..."
                  className="w-full text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl border border-[#dfe9e2] bg-[#fbfdfb] focus:bg-white focus:border-[#1F7D3E] focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-full sm:w-64">
                  <ClasificacionFilterDropdown
                    value={selectedClasificacion}
                    onChange={setSelectedClasificacion}
                    options={classificationsList}
                    detailedCounts={detailedCounts}
                    totalCount={catalog.length}
                  />
                </div>

                <select
                  value={selectedNivelRiesgo}
                  onChange={(e) => setSelectedNivelRiesgo(e.target.value)}
                  className="text-xs font-bold text-[#163522] rounded-xl border border-[#dfe9e2] bg-white px-3 py-2.5 focus:border-[#1F7D3E] focus:outline-none cursor-pointer flex-1 sm:flex-none"
                >
                  <option value="TODOS">Todos los niveles</option>
                  <option value="MUY_ALTO">Nivel I (Muy Alto)</option>
                  <option value="ALTO">Nivel II (Alto)</option>
                  <option value="MEDIO">Nivel III (Medio)</option>
                  <option value="BAJO">Nivel IV (Bajo)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hazard List */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-[#fcfdfc]">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="size-8 animate-spin text-[#1F7D3E]" />
                <p className="text-xs font-bold text-[#7a9182]">Cargando catálogo...</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="size-12 rounded-2xl bg-[#f0f5f1] text-[#7a9182] flex items-center justify-center mx-auto">
                  <Flame className="size-6" />
                </div>
                <div className="text-sm font-black text-[#163522]">No se encontraron peligros en el catálogo</div>
                <p className="text-xs text-[#7a9182]">
                  Intenta ajustar los filtros de búsqueda o registra nuevos peligros desde el Catálogo Maestro.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => {
                  const isChecked = selectedIds.includes(item.id)
                  const riskInfo = interpNivelRiesgo(Number(item.nivelRiesgo || 0))

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelect(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                        isChecked
                          ? 'border-[#1F7D3E] bg-[#f0f9f1] ring-2 ring-[#1F7D3E]/20 shadow-xs'
                          : 'border-[#dfe9e2] bg-white hover:border-[#bfd7c5] hover:bg-[#fafcfa]'
                      }`}
                    >
                      {/* Left details */}
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div className="pt-0.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent div
                            className="size-4.5 text-[#1F7D3E] rounded border-[#dfe9e2] focus:ring-[#1F7D3E] cursor-pointer"
                          />
                        </div>

                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {item.codigo && (
                              <span className="font-mono text-[11px] font-black text-[#1F7D3E] bg-[#eef7f0] border border-[#d6ebd9] px-2 py-0.5 rounded-md">
                                {item.codigo}
                              </span>
                            )}
                            {(() => {
                              const style = getClasificacionStyle(item.clasificacion)
                              return (
                                <span
                                  className={`inline-flex items-center gap-1 rounded-md ${style.bg} ${style.text} border ${style.border} px-2 py-0.5 text-[10px] font-black uppercase tracking-wider`}
                                >
                                  <span className={`size-1.5 rounded-full ${style.dot}`} />
                                  <span>{normalizeClasificacion(item.clasificacion)}</span>
                                </span>
                              )
                            })()}
                            {riskInfo.label && (
                              <span
                                className="text-[10px] font-black text-white px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: riskInfo.color }}
                              >
                                NR: {item.nivelRiesgo} • {riskInfo.label}
                              </span>
                            )}
                          </div>

                          <div className="text-xs sm:text-sm font-black text-[#163522] leading-snug">
                            {item.descripcion}
                          </div>

                          {item.efectosPosibles && (
                            <div className="text-[11px] text-[#5e6b62] font-medium truncate">
                              <strong className="text-[#355244]">Efectos:</strong> {item.efectosPosibles}
                            </div>
                          )}

                          {/* Controls preview */}
                          {(item.controlFuente || item.controlMedio || item.controlIndividuo) && (
                            <div className="text-[10.5px] text-[#7a9182] font-medium truncate pt-0.5">
                              <span className="font-bold text-[#2c4033]">Controles: </span>
                              {[
                                item.controlFuente ? `Fuente: ${item.controlFuente}` : '',
                                item.controlMedio ? `Medio: ${item.controlMedio}` : '',
                                item.controlIndividuo ? `Individuo: ${item.controlIndividuo}` : '',
                              ]
                                .filter(Boolean)
                                .join(' | ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Actions: Preview + Quick Add */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="size-8 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#eef7f0] text-[#1F7D3E] flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                          title="Ver detalle completo de este peligro"
                        >
                          <Eye className="size-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddSingle(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#eef7f0] text-[#1F7D3E] border border-[#d6ebd9] text-xs font-black transition-all cursor-pointer shadow-2xs"
                        >
                          <Plus className="size-3.5" />
                          <span>Agregar</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <footer className="px-6 py-4 bg-white border-t border-[#dfe9e2] flex items-center justify-between gap-4 shrink-0">
            <div className="text-xs font-medium text-[#7a9182]">
              {selectedIds.length > 0 ? (
                <span className="font-bold text-[#1F7D3E]">
                  {selectedIds.length} {selectedIds.length === 1 ? 'peligro seleccionado' : 'peligros seleccionados'}
                </span>
              ) : (
                <span>Selecciona los peligros que deseas incluir en esta actividad</span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 rounded-xl border border-[#dfe9e2] bg-white hover:bg-[#f0f5f1] text-[#5e6b62] text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={handleConfirmAdd}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#1F7D3E] hover:bg-[#186331] text-white text-xs font-black shadow-sm shadow-[#1F7D3E]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="size-4" />
                <span>Agregar Seleccionados ({selectedIds.length})</span>
              </button>
            </div>
          </footer>
        </div>
      </div>

      <PeligroPreviewModal
        open={Boolean(previewItem)}
        onOpenChange={(v) => {
          if (!v) setPreviewItem(null)
        }}
        peligro={previewItem}
      />
    </>
  )
}
