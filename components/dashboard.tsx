"use client"

import React, { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import ConfirmModal from './confirm-modal'
import { ImportMatrizModal } from './ImportMatrizModal'
import { MatrixPreview } from './matrix-preview'
import { exportMatrizToExcel } from '@/lib/matriz-excel-export'
import type { Riesgo } from '@/lib/types'
import { apiFetch } from '@/lib/utils'
import { InstructionsModal } from './InstructionsModal'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { VersionMatrixDetailView } from '@/components/version-matrix-detail-view'

const Icons = {
  asistencial: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2a2 2 0 100 4 2 2 0 000-4z" stroke="currentColor" strokeWidth="1.1"/><path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  administrativo: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="2.5" width="9" height="7" rx="1" stroke="currentColor" strokeWidth="1.1"/><path d="M4 2.5V4M8 2.5V4M1.5 5.5h9" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>,
  apoyo: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1.5l1.2 2.4 2.6.4-1.9 1.8.45 2.6L6 7.4l-2.35 1.3.45-2.6L2.2 4.3l2.6-.4z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>,
  diagnostico: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h2l1.5-3 2 6 1.5-3H10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  infraestructura: <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 10.5h9M3 10.5V6l3-3.5 3 3.5v4.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><rect x="4.5" y="7.5" width="3" height="3" rx=".5" stroke="currentColor" strokeWidth="1"/></svg>
}

function getIcon(tipo: string) {
  const t = tipo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  if(t.includes('asist')) return Icons.asistencial
  if(t.includes('admin')) return Icons.administrativo
  if(t.includes('apoyo')) return Icons.apoyo
  if(t.includes('diag')) return Icons.diagnostico
  if(t.includes('infra')) return Icons.infraestructura
  return Icons.apoyo
}

// Helper function to flatten matrix data into Riesgo array for export
function flattenMatrixToRiesgos(matrix: any): Riesgo[] {
  const riesgos: Riesgo[] = []
  const procesos = matrix.procesos || []
  
  for (const proceso of procesos) {
    const zonas = proceso.zonas || []
    for (const zona of zonas) {
      const actividades = zona.actividades || []
      for (const actividad of actividades) {
        const peligros = actividad.peligros || []
        for (const peligro of peligros) {
          const nd = peligro.evaluacion?.nd || 0
          const ne = peligro.evaluacion?.ne || 0
          const nc = peligro.evaluacion?.nc || 0
          const nr = (nd * ne) * nc
          
          // Build controls string from individual control fields
          const controlsArray = [
            peligro.controles?.fuente || '',
            peligro.controles?.medio || '',
            peligro.controles?.individuo || ''
          ].filter(Boolean)
          const controlsStr = controlsArray.join(', ')
          
          riesgos.push({
            id: peligro.id,
            area: matrix.area || '',
            proceso: proceso.nombre || '',
            responsable: matrix.responsable || '',
            individuo: zona.nombre || '',
            zona: zona.nombre || '',
            actividad: actividad.nombre || '',
            tarea: actividad.tareas || '',
            cargo: actividad.cargo || '',
            rutinario: actividad.rutinario || false,
            clasificacion: peligro.clasificacion || '',
            peligro_desc: peligro.descripcion || '',
            efectos: peligro.efectos || '',
            deficiencia: nd,
            exposicion: ne,
            consecuencia: nc,
            controles: controlsStr,
            control_eliminacion: peligro.intervencion?.eliminacion || '',
            control_sustitucion: peligro.intervencion?.sustitucion || '',
            control_ingenieria: peligro.intervencion?.controles_ingenieria || '',
            control_admin: peligro.intervencion?.controles_administrativos || '',
            epp: peligro.intervencion?.epp || '',
            intervencion: peligro.intervencion?.descripcion || '',
            fecha: matrix.fecha_elaboracion || '',
            fecha_ejecucion: peligro.intervencion?.fecha_ejecucion || '',
            seguimiento: peligro.seguimiento || '',
            num_expuestos: peligro.criterios?.num_expuestos,
            peor_consecuencia: peligro.criterios?.peor_consecuencia || '',
            requisito_legal: peligro.criterios?.requisito_legal ? 'Sí' : 'No',
            interpretacion_nivel_riesgo: peligro.evaluacion?.interp_nr || '',
            aceptabilidad: peligro.evaluacion?.aceptabilidad || ''
          })
        }
      }
    }
  }
  
  return riesgos
}

const COLORS = [
  {bg:'#fce8e8',txt:'#a50000',lbl:'Muy alto'},
  {bg:'#fdecea',txt:'#dc3545',lbl:'Alto'},
  {bg:'#fff3e0',txt:'#fd7e14',lbl:'Medio'},
  {bg:'#e8f5e9',txt:'#198754',lbl:'Bajo'},
]

type MatrixVersionSummary = {
  id: string
  timestamp: string
  userName: string
  userEmail: string
  action: string
  title: string
  lines: string[]
}

type MatrixVersionDetail = {
  id: string
  timestamp: string
  userName: string
  userEmail: string
  action: string
  changes: string
  before: string
}

function safeParseJson(value: string) {
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

function countStructure(procesos: any[] = []) {
  let procesosCount = 0
  let zonasCount = 0
  let actividadesCount = 0
  let peligrosCount = 0

  for (const proceso of unwrapCreateList(procesos)) {
    procesosCount += 1
    for (const zona of unwrapCreateList(proceso?.zonas)) {
      zonasCount += 1
      for (const actividad of unwrapCreateList(zona?.actividades)) {
        actividadesCount += 1
        peligrosCount += unwrapCreateList(actividad?.peligros).length
      }
    }
  }

  return { procesosCount, zonasCount, actividadesCount, peligrosCount }
}

function normalizeVersionMatrix(value: any) {
  const data = unwrapVersionData(value)
  if (!data || typeof data !== 'object') return null

  return {
    area: data.area || '',
    responsable: data.responsable || '',
    fechaElaboracion: data.fecha_elaboracion || data.fechaElaboracion || '',
    fechaActualizacion: data.fecha_actualizacion || data.fechaActualizacion || '',
    files: unwrapCreateList(data.archivos?.create).length > 0
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
            criterio: peligro?.criterio?.create || peligro?.criterios?.create || peligro?.criterio || peligro?.criterios || null,
            intervencion: peligro?.intervencion?.create || peligro?.intervencion || null,
            control: peligro?.control?.create || peligro?.controles?.create || peligro?.control || peligro?.controles || null,
          })),
        })),
      })),
    })),
  }
}

function buildVersionDetail(entry: MatrixVersionDetail) {
  const parsedChanges = safeParseJson(entry.changes)
  return {
    parsedChanges,
    parsedBefore: safeParseJson(entry.before),
    normalizedMatrix: normalizeVersionMatrix(parsedChanges),
  }
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="grid grid-cols-1 md:grid-cols-[140px_minmax(0,1fr)] gap-1 md:gap-3 text-sm">
      <div className="text-[#8aa08f] font-bold uppercase tracking-wide text-[10px]">{label}</div>
      <div className="text-[#163522] break-words">{value}</div>
    </div>
  )
}

function VersionMatrixView({ matrix }: { matrix: any }) {
  const [expandedHazards, setExpandedHazards] = useState<Record<string, boolean>>({})

  if (!matrix) {
    return (
      <div className="rounded-xl border border-[#e2e9e4] bg-[#fbfdfb] p-4 text-sm text-[#5e6b62]">
        La información visual completa no está disponible para esta versión.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e2e9e4] bg-[#fbfdfb] p-4 sm:p-5 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wide text-[#1F7D3E]">Datos de la matriz</div>
        <DetailRow label="Área" value={matrix.area || 'Vacío'} />
        <DetailRow label="Responsable" value={matrix.responsable || 'Vacío'} />
        <DetailRow label="Fecha de elaboración" value={matrix.fechaElaboracion || 'Vacío'} />
        <DetailRow label="Fecha de actualización" value={matrix.fechaActualizacion || 'Vacío'} />
        <DetailRow label="Files" value={matrix.files.length || 0} />
      </div>

      <div className="space-y-3">
        {matrix.procesos.map((proceso: any, procesoIndex: number) => (
          <div key={`${proceso.nombre}-${procesoIndex}`} className="rounded-xl border border-[#dce8dc] overflow-hidden bg-white">
            <div className="px-4 py-3 bg-[#eef7f0] border-b border-[#dce8dc]">
              <div className="text-sm font-bold text-[#163522]">Proceso {procesoIndex + 1}: {proceso.nombre || 'Sin nombre'}</div>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              {proceso.zonas.length === 0 ? (
                <div className="text-sm text-[#5e6b62]">No hay zonas en esta versión.</div>
              ) : (
                proceso.zonas.map((zona: any, zonaIndex: number) => (
                  <div key={`${zona.nombre}-${zonaIndex}`} className="rounded-xl border border-[#e2e9e4] bg-[#fcfdfc] p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-sm font-bold text-[#1F7D3E]">Zona {zonaIndex + 1}: {zona.nombre || 'Sin nombre'}</div>
                      <div className="text-xs font-semibold text-[#5e6b62]">{zona.actividades.length} actividades</div>
                    </div>

                    {zona.actividades.map((actividad: any, actividadIndex: number) => (
                      <div key={`${actividad.nombre}-${actividadIndex}`} className="rounded-xl border border-[#e2e9e4] bg-white p-4 sm:p-5 space-y-3">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="text-sm font-bold text-[#163522]">Actividad {actividadIndex + 1}: {actividad.nombre || 'Sin nombre'}</div>
                          <div className="text-xs font-semibold text-[#5e6b62]">{actividad.peligros.length} peligros</div>
                        </div>

                        <DetailRow label="Descripción" value={actividad.descripcion || 'Vacío'} />
                        <DetailRow label="Tareas" value={actividad.tareas || 'Vacío'} />
                        <DetailRow label="Cargo" value={actividad.cargo || 'Vacío'} />
                        <DetailRow label="Rutinario" value={actividad.rutinario === null ? 'Sin dato' : actividad.rutinario ? 'Sí' : 'No'} />

                        <div className="space-y-3 pt-2 border-t border-[#edf2ed]">
                          {actividad.peligros.map((peligro: any, peligroIndex: number) => (
                            <div key={`${peligro.descripcion}-${peligroIndex}`} className="rounded-lg border border-[#e2e9e4] bg-[#fbfdfb] overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  const key = `${procesoIndex}-${zonaIndex}-${actividadIndex}-${peligroIndex}`
                                  setExpandedHazards((current) => ({ ...current, [key]: !current[key] }))
                                }}
                                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white transition-colors"
                              >
                                <div className="min-w-0">
                                  <div className="text-sm font-bold text-[#163522]">Peligro {peligroIndex + 1}</div>
                                  <div className="text-xs text-[#5e6b62] truncate">
                                    {peligro.descripcion || 'Sin descripción'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {peligro.clasificacion && (
                                    <span className="inline-flex items-center rounded-full border border-[#d1e2d6] bg-white px-2 py-1 text-[10px] font-bold uppercase text-[#1F7D3E]">
                                      {peligro.clasificacion}
                                    </span>
                                  )}
                                  <span className="text-[#5e6b62] text-xs font-bold">
                                    {expandedHazards[`${procesoIndex}-${zonaIndex}-${actividadIndex}-${peligroIndex}`] ? 'Ocultar' : 'Ver detalle'}
                                  </span>
                                </div>
                              </button>
                              {expandedHazards[`${procesoIndex}-${zonaIndex}-${actividadIndex}-${peligroIndex}`] && (
                                <div className="border-t border-[#e2e9e4] p-4 sm:p-5 space-y-3">
                                  <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="text-sm font-bold text-[#163522]">Detalle del peligro</div>
                                  </div>
                              <div className="space-y-3">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="text-sm font-bold text-[#163522]">Peligro {peligroIndex + 1}</div>
                                {peligro.clasificacion && (
                                  <span className="inline-flex items-center rounded-full border border-[#d1e2d6] bg-white px-2 py-1 text-[10px] font-bold uppercase text-[#1F7D3E]">
                                    {peligro.clasificacion}
                                  </span>
                                )}
                              </div>
                              <DetailRow label="Descripción" value={peligro.descripcion || 'Vacío'} />
                              <DetailRow label="Efectos" value={peligro.efectos || 'Vacío'} />
                              <DetailRow label="Control en la fuente" value={peligro.control?.fuente || 'Vacío'} />
                              <DetailRow label="Control en el medio" value={peligro.control?.medio || 'Vacío'} />
                              <DetailRow label="Control individual" value={peligro.control?.individuo || 'Vacío'} />
                              <DetailRow label="Número de expuestos" value={peligro.criterio?.numExpuestos ?? peligro.criterio?.num_expuestos ?? 'Vacío'} />
                              <DetailRow label="Peor consecuencia" value={peligro.criterio?.peorConsecuencia || peligro.criterio?.peor_consecuencia || 'Vacío'} />
                              <DetailRow label="Requisito legal" value={
                                typeof (peligro.criterio?.requisitoLegal ?? peligro.criterio?.requisito_legal) === 'boolean'
                                  ? ((peligro.criterio?.requisitoLegal ?? peligro.criterio?.requisito_legal) ? 'Sí' : 'No')
                                  : 'Vacío'
                              } />
                              <DetailRow label="ND / NE / NC" value={
                                [peligro.evaluacion?.nivelDeficiencia, peligro.evaluacion?.nivelExposicion, peligro.evaluacion?.nivelConsecuencia]
                                  .filter((v) => v !== null && v !== undefined && v !== '')
                                  .join(' / ') || 'Vacío'
                              } />
                              <DetailRow label="NP / NR" value={
                                [peligro.evaluacion?.nivelProbabilidad, peligro.evaluacion?.nivelRiesgo]
                                  .filter((v) => v !== null && v !== undefined && v !== '')
                                  .join(' / ') || 'Vacío'
                              } />
                              <DetailRow label="Interpretación" value={
                                [peligro.evaluacion?.interpProbabilidad, peligro.evaluacion?.interpRiesgo, peligro.evaluacion?.aceptabilidad]
                                  .filter(Boolean)
                                  .join(' | ') || 'Vacío'
                              } />
                              <DetailRow label="Eliminación" value={peligro.intervencion?.eliminacion || 'Vacío'} />
                              <DetailRow label="Sustitución" value={peligro.intervencion?.sustitucion || 'Vacío'} />
                              <DetailRow label="Controles de ingeniería" value={peligro.intervencion?.controlesIngenieria || peligro.intervencion?.controles_ingenieria || 'Vacío'} />
                              <DetailRow label="Controles administrativos" value={peligro.intervencion?.controlesAdministrativos || peligro.intervencion?.controles_administrativos || 'Vacío'} />
                              <DetailRow label="EPP" value={peligro.intervencion?.epp || 'Vacío'} />
                              <DetailRow label="Responsable" value={peligro.intervencion?.responsable || 'Vacío'} />
                              <DetailRow label="Fecha de ejecución" value={peligro.intervencion?.fechaEjecucion || peligro.intervencion?.fecha_ejecucion || 'Vacío'} />
                              </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Dashboard() {
  const { user, logout } = useAuth()
  const router = useRouter()
  
  const [matrices, setMatrices] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [dateDesde, setDateDesde] = useState('')
  const [dateHasta, setDateHasta] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<string|null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [duplicateSuccess, setDuplicateSuccess] = useState(false)
  const [duplicateSuccessTitle, setDuplicateSuccessTitle] = useState('')
  const [previewMatrixId, setPreviewMatrixId] = useState<string|null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [instructionsOpen, setInstructionsOpen] = useState(false)
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionDetailLoading, setVersionDetailLoading] = useState(false)
  const [versionsMatrixTitle, setVersionsMatrixTitle] = useState('')
  const [versionsMatrixId, setVersionsMatrixId] = useState('')
  const [versionEntries, setVersionEntries] = useState<MatrixVersionSummary[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [selectedVersionDetail, setSelectedVersionDetail] = useState<MatrixVersionDetail | null>(null)
  const versionsCacheRef = useRef<Record<string, { title: string; versions: MatrixVersionSummary[] }>>({})
  const versionDetailCacheRef = useRef<Record<string, MatrixVersionDetail>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalMatrices, setTotalMatrices] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totals, setTotals] = useState({ totM: 0, totP: 0, ma: 0, al: 0, me: 0, ba: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [facetTipos, setFacetTipos] = useState<string[]>([])
  const summariesCacheRef = useRef<Record<string, any>>({})
  const prefetchTokenRef = useRef(0)
  const fetchTokenRef = useRef(0)
  const [pageSize, setPageSize] = useState(10)

  const buildSummaryParams = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(pageSize))
    if (search.trim()) params.set('search', search.trim())
    if (dateDesde) params.set('dateDesde', dateDesde)
    if (dateHasta) params.set('dateHasta', dateHasta)
    if (tipoFilter) params.set('tipo', tipoFilter)
    return params
  }

  const applySummaryPayload = (body: any, requestedPage: number) => {
    setMatrices(Array.isArray(body?.items) ? body.items : [])
    setTotalMatrices(Number(body?.total || 0))
    setTotalPages(Math.max(1, Number(body?.totalPages || 1)))
    
    if (body.totals) {
      setTotals({
        totP: Number(body.totals.totalPeligros || 0),
        ma: Number(body.totals.counts?.[0] || 0),
        al: Number(body.totals.counts?.[1] || 0),
        me: Number(body.totals.counts?.[2] || 0),
        ba: Number(body.totals.counts?.[3] || 0),
        totM: Number(body.totals.totalMatrices || 0),
      })
    }
    
    if (Number(body?.page) && Number(body.page) !== requestedPage) setCurrentPage(Number(body.page))
  }

  const prefetchRemainingPages = async (fromPage: number, maxPage: number, token: number) => {
    for (let p = fromPage; p <= maxPage; p++) {
      if (prefetchTokenRef.current !== token) return
      const params = buildSummaryParams(p)
      const key = params.toString()
      if (summariesCacheRef.current[key]) continue
      try {
        const res = await apiFetch(`/api/riesgos/summary?${key}`)
        if (!res.ok) return
        const body = await res.json()
        summariesCacheRef.current[key] = body
      } catch {
        return
      }
    }
  }

  const loadSummaries = async (page = 1) => {
    setIsLoading(true)
    const currentToken = ++fetchTokenRef.current
    try {
      const params = buildSummaryParams(page)
      const key = params.toString()
      const cached = summariesCacheRef.current[key]
      if (cached) {
        if (currentToken === fetchTokenRef.current) applySummaryPayload(cached, page)
      } else {
        const res = await apiFetch(`/api/riesgos/summary?${key}`)
        if (!res.ok) throw new Error('No se pudo cargar el resumen')
        const body = await res.json()
        summariesCacheRef.current[key] = body
        if (currentToken === fetchTokenRef.current) applySummaryPayload(body, page)
      }

      if (currentToken === fetchTokenRef.current) {
        const currentBody = summariesCacheRef.current[key]
        const maxPage = Number(currentBody?.totalPages || 1)
        if (page === 1 && maxPage > 1) {
          const token = ++prefetchTokenRef.current
          void prefetchRemainingPages(2, maxPage, token)
        }
      }
    } catch (error) {
      console.error('Error loading matrix summaries:', error)
    } finally {
      if (currentToken === fetchTokenRef.current) setIsLoading(false)
    }
  }

  const loadFacets = async () => {
    try {
      const res = await apiFetch('/api/riesgos/facets')
      if (!res.ok) return
      const body = await res.json().catch(() => ({}))
      setFacetTipos(Array.isArray(body?.tipos) ? body.tipos : [])
    } catch (error) {
      console.error('Error loading risk facets:', error)
    }
  }

  useEffect(() => {
    void loadSummaries(currentPage)
  }, [currentPage, search, dateDesde, dateHasta, tipoFilter, pageSize])

  useEffect(() => {
    void loadFacets()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    summariesCacheRef.current = {}
    prefetchTokenRef.current += 1
  }, [search, dateDesde, dateHasta, tipoFilter, pageSize])

  const tiposList = useMemo(() => facetTipos, [facetTipos])

  const stats = useMemo(() => {
    return {
      totM: totals.totM,
      totP: totals.totP,
      ma: totals.ma,
      al: totals.al,
      me: totals.me,
      ba: totals.ba,
    }
  }, [totals])

  const handleNew = () => {
    router.push('/matriz/nuevo')
  }

  const handleOpenImport = () => {
    setImportOpen(true)
  }

  function confirmDeleteAction() {
    if (!deleteTarget) return
    apiFetch(`/api/riesgos/${deleteTarget}`, { method: 'DELETE' }).then(() => { 
      setConfirmOpen(false)
      setDeleteTarget(null)
      void loadSummaries(currentPage)
    }).catch(() => {
      setConfirmOpen(false)
      setDeleteTarget(null)
    })
  }

  async function handleDownloadMatrix(matrizId: string) {
    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}`)
      if (!res.ok) throw new Error('Failed to fetch matrix')
      const matrizData = await res.json()
      
      // Export directly with nested structure
      await exportMatrizToExcel(matrizData)
    } catch (error) {
      console.error('Error downloading matrix:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      alert(`Error al descargar la matriz: ${errorMsg}`)
    }
  }

  async function handleDuplicateMatrix(matrizId: string) {
    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}`)
      if (!res.ok) throw new Error('No se pudo obtener la matriz')
      const matrizData = await res.json()

      const duplicateData = {
        area: `${matrizData.area} (Copia)`,
        responsable: matrizData.responsable,
        fecha_elaboracion: new Date().toISOString().split('T')[0],
        fecha_actualizacion: '',
        files: matrizData.files || [],
        procesos: matrizData.procesos || []
      }

      const createRes = await apiFetch('/api/riesgos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicateData)
      })

      if (!createRes.ok) throw new Error('No se pudo crear la copia')

      await loadSummaries(currentPage)
      
      // Show success with modal style
      setDuplicateSuccessTitle(`${duplicateData.area}`)
      setDuplicateSuccess(true)
    } catch (error) {
      console.error('Error duplicating matrix:', error)
      const errorMsg = error instanceof Error ? error.message : String(error)
      alert(`Error al duplicar la matriz: ${errorMsg}`)
    }
  }

  async function handleOpenVersions(matrizId: string, title: string) {
    setVersionsOpen(true)
    setVersionsMatrixId(matrizId)
    setVersionsMatrixTitle(title)
    setSelectedVersionId(null)
    setSelectedVersionDetail(null)

    const cached = versionsCacheRef.current[matrizId]
    if (cached) {
      setVersionEntries(cached.versions)
      setVersionsMatrixTitle(cached.title || title)
      setVersionsLoading(false)
      if (cached.versions[0]?.id) {
        void handleSelectVersion(matrizId, cached.versions[0].id)
      }
      return
    }

    setVersionsLoading(true)
    setVersionEntries([])

    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}/versions`)
      if (!res.ok) throw new Error('Could not load matrix versions')
      const body = await res.json()
      const nextTitle = body?.matriz?.title || title
      const nextVersions = Array.isArray(body?.versions) ? body.versions : []
      versionsCacheRef.current[matrizId] = { title: nextTitle, versions: nextVersions }
      setVersionsMatrixTitle(nextTitle)
      setVersionEntries(nextVersions)
      if (nextVersions[0]?.id) {
        void handleSelectVersion(matrizId, nextVersions[0].id)
      }
    } catch (error) {
      console.error('Error loading matrix versions:', error)
      alert('Could not load matrix versions.')
    } finally {
      setVersionsLoading(false)
    }
  }

  async function handleSelectVersion(matrizId: string, versionId: string) {
    setSelectedVersionId(versionId)

    const cached = versionDetailCacheRef.current[versionId]
    if (cached) {
      setSelectedVersionDetail(cached)
      setVersionDetailLoading(false)
      return
    }

    setVersionDetailLoading(true)
    setSelectedVersionDetail(null)

    try {
      const res = await apiFetch(`/api/riesgos/${matrizId}/versions?versionId=${versionId}`)
      if (!res.ok) throw new Error('Could not load version detail')
      const body = await res.json()
      const detail = body?.version || null
      if (detail) {
        versionDetailCacheRef.current[versionId] = detail
      }
      setSelectedVersionDetail(detail)
    } catch (error) {
      console.error('Error loading version detail:', error)
      alert('Could not load version detail.')
    } finally {
      setVersionDetailLoading(false)
    }
  }

  const selectedVersionSummary = selectedVersionId
    ? versionEntries.find((item) => item.id === selectedVersionId) || null
    : null

  let versionDetailContent: React.ReactNode
  if (!selectedVersionId || versionDetailLoading) {
    versionDetailContent = (
      <div className="rounded-3xl border border-[#dfe9e2] bg-[#fbfdfb] p-8 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-[#e9f2eb]" />
          <div className="h-4 w-64 rounded bg-[#eef5f0]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="h-24 rounded-2xl bg-[#eef5f0]" />
            <div className="h-24 rounded-2xl bg-[#eef5f0]" />
            <div className="h-24 rounded-2xl bg-[#eef5f0]" />
          </div>
          <div className="h-48 rounded-2xl bg-[#eef5f0]" />
        </div>
      </div>
    )
  } else if (selectedVersionDetail) {
    const detail = buildVersionDetail(selectedVersionDetail)
    versionDetailContent = (
      <div className="space-y-5">
        <div className="rounded-3xl border border-[#dfe9e2] bg-[linear-gradient(180deg,#fbfdfb_0%,#f4f8f5_100%)] p-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center rounded-full bg-[#eef7f0] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#1F7D3E]">
                  {selectedVersionDetail.action}
                </span>
                <span className="text-sm font-bold text-[#163522]">
                  {selectedVersionSummary?.title || 'Versión'}
                </span>
              </div>
              <div className="mt-3 text-sm text-[#355244]">
                {new Date(selectedVersionDetail.timestamp).toLocaleString('es-CO', {
                  year: 'numeric',
                  month: 'long',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <div className="mt-1 text-sm text-[#5e6b62]">
                Por {selectedVersionDetail.userName || user?.nombre || 'Usuario actual'}{selectedVersionDetail.userEmail ? ` (${selectedVersionDetail.userEmail})` : ''}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 xl:w-[520px]">
              {(selectedVersionSummary?.lines || []).slice(0, 3).map((line, index) => (
                <div key={index} className="rounded-2xl border border-[#dfe9e2] bg-white p-3 text-xs font-semibold text-[#355244]">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>

        <VersionMatrixDetailView matrix={detail.normalizedMatrix} />
      </div>
    )
  } else {
    versionDetailContent = (
      <div className="rounded-3xl border border-dashed border-[#dfe9e2] bg-[#fbfdfb] p-8 text-sm text-[#5e6b62]">
        Selecciona una versión para ver toda la información.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#2c3630]">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e2e9e4] px-4 md:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-4 justify-between w-full md:w-auto">
          <div className="flex items-center gap-3">
            <img src="/matriz-riesgos/csm_logo_long.png" alt="Logo" className="h-10 object-contain" />
            <div className="w-[1px] h-8 bg-[#e2e9e4] hidden md:block" />
            <h1 className="text-base font-bold text-[#1F7D3E] leading-tight hidden md:block">
              Sistema de Gestión de Seguridad<br/>y Salud en el Trabajo
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 w-full md:w-auto">
          <button 
            onClick={() => setInstructionsOpen(true)}
            className="text-xs sm:text-sm font-bold text-[#5e6b62] hover:text-[#1F7D3E] flex items-center gap-1.5 sm:gap-2 px-2 py-1.5 sm:px-4 sm:py-2 bg-white border border-[#e2e9e4] rounded-xl shadow-sm transition-all hover:bg-[#f0f9f1] hover:border-[#d1e2d6]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <span className="hidden xs:inline sm:inline">Instrucciones</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/priorizacion')}
            className="text-xs sm:text-sm font-bold text-[#1F7D3E] hover:underline px-2 py-1.5 sm:px-4 sm:py-2 bg-[#f0f9f1] border border-[#d1e2d6] rounded-xl shadow-sm transition-all hover:bg-white whitespace-nowrap"
          >
            <span className="sm:hidden">Priorización</span>
            <span className="hidden sm:inline">Priorización de Riesgos</span>
          </button>

          <button 
            onClick={() => router.push('/dashboard/reporte')}
            className="text-xs sm:text-sm font-bold text-[#1F7D3E] hover:underline px-2 py-1.5 sm:px-4 sm:py-2 bg-[#f0f9f1] border border-[#d1e2d6] rounded-xl shadow-sm transition-all hover:bg-white whitespace-nowrap"
          >
            <span className="sm:hidden">Reporte</span>
            <span className="hidden sm:inline">Reporte de Peligros</span>
          </button>

          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-[#e2e9e4] shadow-sm">
            <div className="w-8 h-8 rounded-full bg-[#1F7D3E] text-white flex items-center justify-center text-sm font-bold shadow-sm">
              {(user?.nombre || 'U')[0]}
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-[#5e6b62]">
              <span>{user?.nombre}</span>
              {user?.cargo && <span className="text-[#8aa08f] font-normal text-xs">• {user.cargo}</span>}
            </div>
          </div>
          
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total matrices', val: stats.totM, color: '#1F7D3E', bg: 'bg-[#f0f9f1]' },
            { label: 'Total riesgos', val: stats.totP, color: '#2c3630', bg: 'bg-gray-100' },
            { label: 'Muy Alto', val: stats.ma, color: '#a50000', bg: 'bg-[#fce8e8]' },
            { label: 'Alto', val: stats.al, color: '#ef4444', bg: 'bg-[#fdecea]' },
            { label: 'Medio', val: stats.me, color: '#EAB308', bg: 'bg-[#fff3e0]' },
            { label: 'Bajo', val: stats.ba, color: '#198754', bg: 'bg-[#e8f5e9]' }
          ].map((s, i) => (
            <div key={i} className="bg-white border border-[#e2e9e4] rounded-2xl p-3 sm:p-5 shadow-sm space-y-2">
              <span className="text-3xl font-bold block leading-none" style={{ color: s.color }}>{s.val}</span>
              <span className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider leading-tight whitespace-normal">{s.label}</span>
              <div className={`h-1.5 w-full rounded-full ${s.bg}`} style={{ background: i > 1 ? s.color : undefined }} />
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-[#e2e9e4] rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="w-full sm:flex-1 sm:min-w-[280px] relative">
              <input 
                type="text" 
                placeholder="Buscar por Área, Proceso, Zona..." 
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7D3E]/20 focus:border-[#1F7D3E] transition-all"
                value={search} 
                onChange={e=>setSearch(e.target.value)} 
              />
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-[#5e6b62] uppercase whitespace-nowrap">Desde</span>
                <input 
                  type="date" 
                  className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-sm font-medium focus:outline-none focus:border-[#1F7D3E] w-full sm:w-auto"
                  value={dateDesde} 
                  onChange={e=>setDateDesde(e.target.value)} 
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-[#5e6b62] uppercase whitespace-nowrap">Hasta</span>
                <input 
                  type="date" 
                  className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-sm font-medium focus:outline-none focus:border-[#1F7D3E] w-full sm:w-auto"
                  value={dateHasta} 
                  onChange={e=>setDateHasta(e.target.value)} 
                />
              </div>
            </div>

            <select 
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-sm font-medium text-[#2c3630] cursor-pointer focus:outline-none focus:border-[#1F7D3E]"
              value={tipoFilter} 
              onChange={e=>setTipoFilter(e.target.value)}
            >
              <option value="">Tipo: Todos</option>
              {tiposList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 sm:ml-auto">
              <button 
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#e2e9e4] text-sm font-bold text-[#5e6b62] hover:bg-gray-50 transition-colors"
                onClick={() => { setSearch(''); setDateDesde(''); setDateHasta(''); setTipoFilter(''); setCurrentPage(1) }}
              >
                Limpiar
              </button>
              
              <div className="relative group flex-1 sm:flex-none">
                <button className="w-full sm:w-auto px-4 sm:px-6 py-2.5 rounded-xl bg-[#1F7D3E] text-white text-sm font-bold shadow-lg shadow-[#1F7D3E]/20 hover:bg-[#186331] transition-all flex items-center justify-center gap-2">
                  <span>+</span> Nueva Matriz
                </button>
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-[#e2e9e4] rounded-xl shadow-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f9f1] text-[#1F7D3E] font-medium" onClick={handleNew}>
                    Crear desde cero
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-[#f0f9f1] text-[#1F7D3E] font-medium" onClick={handleOpenImport}>
                    Importar desde Excel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between text-[#5e6b62]">
          <p className="text-sm font-medium">{totalMatrices} matri{totalMatrices === 1 ? 'z' : 'ces'} encontradas</p>
        </div>
        
        {/* Matrix List */}
        <div className="space-y-4">
          {matrices.map(m => (
            <div 
              key={m.id} 
              className="group relative bg-white border border-[#e2e9e4] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 cursor-pointer hover:border-[#1F7D3E] hover:shadow-xl hover:-translate-y-0.5 transition-all"
              onClick={() => router.push('/matriz/' + m.id)}
            >
              <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-[#0f2b1a] group-hover:text-[#1F7D3E] transition-colors line-clamp-2 md:line-clamp-1">
                    {m.area || m.responsable || 'Matriz sin área'}
                  </h3>
                  <p className="text-xs font-semibold text-[#8aa08f] uppercase tracking-wide">{m.date}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {m.tipos.length === 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f8faf9] border border-[#e2e9e4] text-[10px] font-bold text-[#5e6b62] uppercase">
                      {getIcon('')} General
                    </span>
                  ) : (
                    m.tipos.map((t: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f8faf9] border border-[#e2e9e4] text-[10px] font-bold text-[#5e6b62] uppercase">
                        {getIcon(t)} {t}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-2 md:gap-8 w-full md:w-auto shrink-0">
                <div className="hidden md:flex gap-2 mr-2">
                  {m.counts.map((c: number, idx: number) => (
                    <div key={idx} className="flex flex-col items-center justify-center w-14 h-14 rounded-xl border border-transparent transition-all" style={{ background: COLORS[idx].bg + '80' }}>
                      <span className="text-lg font-bold" style={{ color: COLORS[idx].txt }}>{c}</span>
                      <span className="text-[8px] font-bold uppercase" style={{ color: COLORS[idx].txt }}>{COLORS[idx].lbl.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
                  <button
                    title="Versiones"
                    onClick={() => handleOpenVersions(m.id, m.area || m.responsable || 'Untitled matrix')}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-[#d1e2d6] bg-[#f8faf9] text-[#1F7D3E] text-xs font-bold hover:bg-[#f0f9f1] hover:border-[#b9d2bf] transition-all"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
                    <span>Versiones</span>
                  </button>
                  {[
                    { title: 'Vista Previa', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>, action: () => setPreviewMatrixId(m.id) },
                    { title: 'Descargar Excel', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>, action: () => handleDownloadMatrix(m.id) },
                    { title: 'Duplicar', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>, action: () => handleDuplicateMatrix(m.id) },
                    { title: 'Editar', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, action: () => router.push('/matriz/' + m.id) },
                    { title: 'Eliminar', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>, action: () => { setDeleteTarget(m.id); setConfirmOpen(true) }, color: 'text-red-500 hover:bg-red-50 hover:border-red-200' }
                  ].map((btn, idx) => (
                    <button 
                      key={idx}
                      title={btn.title}
                      onClick={btn.action}
                      className={`p-2 sm:p-2.5 rounded-xl border border-transparent transition-all ${btn.color || 'text-[#5e6b62] hover:bg-[#f0f9f1] hover:border-[#d1e2d6] hover:text-[#1F7D3E]'}`}
                    >
                      {btn.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          
          {matrices.length === 0 && !isLoading && (
            <div className="bg-white border border-dashed border-[#e2e9e4] rounded-2xl py-20 text-center space-y-2">
              <p className="text-sm font-medium text-[#5e6b62]">No se encontraron resultados para los filtros aplicados</p>
              <button 
                className="text-xs font-bold text-[#1F7D3E] hover:underline"
                onClick={() => { setSearch(''); setDateDesde(''); setDateHasta(''); setTipoFilter('') }}
              >
                Restablecer filtros
              </button>
            </div>
          )}
          
          {isLoading && (
            <div className="py-20 text-center text-sm font-medium text-[#5e6b62] animate-pulse">
              Cargando matrices...
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalMatrices > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#e2e9e4]">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-[10px] sm:text-xs font-semibold text-[#5e6b62] uppercase tracking-wider">
                Pág. {currentPage}/{totalPages} <span className="mx-1 sm:mx-2 opacity-30">|</span> {totalMatrices} totales
              </p>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#5e6b62] font-semibold uppercase tracking-wider">
                <span>Ver:</span>
                <select 
                  value={pageSize} 
                  onChange={e => setPageSize(Number(e.target.value))}
                  className="p-1 border rounded-lg bg-white border-[#e2e9e4] focus:outline-none focus:border-[#1F7D3E] font-bold text-xs text-[#2c3630]"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button 
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#2c3630] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                disabled={currentPage <= 1} 
                onClick={() => setCurrentPage(1)}
              >
                Primera
              </button>
              <button 
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#2c3630] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                disabled={currentPage <= 1} 
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button 
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#2c3630] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                disabled={currentPage >= totalPages} 
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </button>
              <button 
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#2c3630] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                disabled={currentPage >= totalPages} 
                onClick={() => setCurrentPage(totalPages)}
              >
                Última
              </button>
            </div>
          </div>
        )}
      </main>

        <ImportMatrizModal open={importOpen} onOpenChange={setImportOpen} />

      <ConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmDeleteAction}
        title="Eliminar Matriz"
        message="¿Estás seguro de que deseas eliminar esta matriz? Esta acción no se puede deshacer y borrará todos los procesos, actividades y peligros asociados."
      />

      <ConfirmModal
        open={duplicateSuccess}
        onCancel={() => setDuplicateSuccess(false)}
        onConfirm={() => setDuplicateSuccess(false)}
        title="Matriz Duplicada"
        message={`La matriz "${duplicateSuccessTitle}" ha sido duplicada exitosamente.`}
        confirmLabel="Aceptar"
      />

      {previewMatrixId && (
        <MatrixPreview
          matrizId={previewMatrixId!}
          onClose={() => setPreviewMatrixId(null)}
        />
      )}

      <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
        <DialogContent className="w-screen max-w-none h-[100dvh] rounded-none overflow-hidden p-0 sm:w-[98vw] sm:max-w-[1900px] sm:h-[96vh] sm:rounded-2xl">
          <DialogHeader className="px-6 py-5 border-b border-[#dbe8de] bg-[linear-gradient(180deg,#f8fbf8_0%,#f1f7f3_100%)] shrink-0">
            <DialogTitle className="text-[#163522] flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1F7D3E] text-white shadow-lg shadow-[#1F7D3E]/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/></svg>
              </span>
              <span>Versiones: {versionsMatrixTitle}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Historial de versiones de la matriz seleccionada con lista de cambios y detalle completo.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-[430px_minmax(0,1fr)]">
            {versionsLoading ? (
              <div className="lg:col-span-2 flex items-center justify-center p-10">
                <div className="rounded-3xl border border-[#dbe8de] bg-white px-8 py-10 text-center shadow-sm min-w-[280px]">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-[#eef7f0] animate-pulse" />
                  <div className="mt-4 text-sm font-bold text-[#355244]">Cargando versiones...</div>
                  <div className="mt-1 text-xs text-[#7e9586]">Preparando el historial de esta matriz.</div>
                </div>
              </div>
            ) : versionEntries.length === 0 ? (
              <div className="lg:col-span-2 flex items-center justify-center p-10">
                <div className="rounded-3xl border border-dashed border-[#dbe8de] bg-white px-8 py-10 text-center shadow-sm min-w-[320px]">
                  <div className="text-sm font-bold text-[#355244]">No se encontraron versiones guardadas para esta matriz.</div>
                </div>
              </div>
            ) : (
              <>
                <div className="border-b xl:border-b-0 xl:border-r border-[#e2e9e4] bg-[#f8faf9] min-h-0 overflow-y-auto p-4 space-y-3 max-h-[36vh] xl:max-h-none">
                  {versionEntries.map((entry, index) => (
                    <button
                      key={entry.id}
                      onClick={() => handleSelectVersion(versionsMatrixId, entry.id)}
                      className={`w-full text-left rounded-2xl border p-4 transition-all shadow-sm ${
                        selectedVersionId === entry.id
                          ? 'border-[#1F7D3E] bg-white shadow-md'
                          : 'border-[#dfe9e2] bg-white/80 hover:bg-white hover:border-[#bfd7c5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#eef7f0] text-[#1F7D3E] text-xs font-black shrink-0">
                            {versionEntries.length - index}
                          </span>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-[#163522] truncate">{entry.title}</div>
                            <div className="text-[11px] text-[#6d8174] mt-0.5">
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
                        <span className="inline-flex items-center rounded-full bg-[#f8faf9] border border-[#dfe9e2] px-2 py-0.5 text-[10px] font-bold text-[#5e6b62] uppercase tracking-wide shrink-0">
                          {entry.action}
                        </span>
                      </div>
                      <div className="mt-3 text-xs text-[#5e6b62]">
                        Por {entry.userName || user?.nombre || 'Usuario actual'}{entry.userEmail ? ` (${entry.userEmail})` : ''}
                      </div>
                      <div className="mt-3 space-y-1">
                        {entry.lines.slice(0, 2).map((line, lineIndex) => (
                          <div key={lineIndex} className="text-xs text-[#355244] line-clamp-2">{line}</div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="min-h-0 overflow-y-auto bg-white p-4 sm:p-6 min-w-0">
                  {versionDetailContent}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <InstructionsModal 
        open={instructionsOpen} 
        onClose={() => setInstructionsOpen(false)} 
      />
    </div>
  )
}
