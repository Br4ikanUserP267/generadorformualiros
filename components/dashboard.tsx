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
            individuo: actividad.cargo || '',
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
  const [currentPage, setCurrentPage] = useState(1)
  const [totalMatrices, setTotalMatrices] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totals, setTotals] = useState({ totP: 0, ma: 0, al: 0, me: 0, ba: 0 })
  const [isLoading, setIsLoading] = useState(false)
  const [facetTipos, setFacetTipos] = useState<string[]>([])
  const summariesCacheRef = useRef<Record<string, any>>({})
  const prefetchTokenRef = useRef(0)

  const PAGE_SIZE = 6

  const buildSummaryParams = (page: number) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', String(PAGE_SIZE))
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
    setTotals({
      totP: Number(body?.totals?.totalPeligros || 0),
      ma: Number(body?.totals?.counts?.[0] || 0),
      al: Number(body?.totals?.counts?.[1] || 0),
      me: Number(body?.totals?.counts?.[2] || 0),
      ba: Number(body?.totals?.counts?.[3] || 0),
    })
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
    try {
      const params = buildSummaryParams(page)
      const key = params.toString()
      const cached = summariesCacheRef.current[key]
      if (cached) {
        applySummaryPayload(cached, page)
      } else {
        const res = await apiFetch(`/api/riesgos/summary?${key}`)
        if (!res.ok) throw new Error('No se pudo cargar el resumen')
        const body = await res.json()
        summariesCacheRef.current[key] = body
        applySummaryPayload(body, page)
      }

      const currentBody = summariesCacheRef.current[key]
      const maxPage = Number(currentBody?.totalPages || 1)
      if (page === 1 && maxPage > 1) {
        const token = ++prefetchTokenRef.current
        void prefetchRemainingPages(2, maxPage, token)
      }
    } catch (error) {
      console.error('Error loading matrix summaries:', error)
    } finally {
      setIsLoading(false)
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
  }, [currentPage, search, dateDesde, dateHasta, tipoFilter])

  useEffect(() => {
    void loadFacets()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    summariesCacheRef.current = {}
    prefetchTokenRef.current += 1
  }, [search, dateDesde, dateHasta, tipoFilter])

  const tiposList = useMemo(() => facetTipos, [facetTipos])

  const stats = useMemo(() => {
    return {
      totM: totalMatrices,
      totP: totals.totP,
      ma: totals.ma,
      al: totals.al,
      me: totals.me,
      ba: totals.ba,
    }
  }, [totalMatrices, totals])

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

  return (
    <div className="min-h-screen bg-[#f8faf9] text-[#2c3630]">
      {/* Topbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#e2e9e4] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <img src="/matriz-riesgos/csm_logo_long.png" alt="Logo" className="h-10 object-contain" />
            <div className="w-[1px] h-8 bg-[#e2e9e4]" />
            <h1 className="text-base font-bold text-[#1F7D3E] leading-tight hidden md:block">
              Sistema de Gestión de Seguridad<br/>y Salud en el Trabajo
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setInstructionsOpen(true)}
            className="text-sm font-bold text-[#5e6b62] hover:text-[#1F7D3E] flex items-center gap-2 px-4 py-2 bg-white border border-[#e2e9e4] rounded-xl shadow-sm transition-all hover:bg-[#f0f9f1] hover:border-[#d1e2d6]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Instrucciones
          </button>

          <button 
            onClick={() => router.push('/dashboard/reporte')}
            className="text-sm font-bold text-[#1F7D3E] hover:underline px-4 py-2 bg-[#f0f9f1] border border-[#d1e2d6] rounded-xl shadow-sm transition-all hover:bg-white"
          >
            Reporte de Peligros
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

      <main className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Total matrices', val: stats.totM, color: '#1F7D3E', bg: 'bg-[#f0f9f1]' },
            { label: 'Total riesgos', val: stats.totP, color: '#2c3630', bg: 'bg-gray-100' },
            { label: 'Muy Alto', val: stats.ma, color: '#a50000', bg: 'bg-[#fce8e8]' },
            { label: 'Alto', val: stats.al, color: '#ef4444', bg: 'bg-[#fdecea]' },
            { label: 'Medio', val: stats.me, color: '#fd7e14', bg: 'bg-[#fff3e0]' },
            { label: 'Bajo', val: stats.ba, color: '#198754', bg: 'bg-[#e8f5e9]' }
          ].map((s, i) => (
            <div key={i} className="bg-white border border-[#e2e9e4] rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-3xl font-bold block leading-none" style={{ color: s.color }}>{s.val}</span>
              <span className="text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider leading-tight whitespace-normal">{s.label}</span>
              <div className={`h-1.5 w-full rounded-full ${s.bg}`} style={{ background: i > 1 ? s.color : undefined }} />
            </div>
          ))}
        </div>

        {/* Filters Bar */}
        <div className="bg-white border border-[#e2e9e4] rounded-2xl p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[280px] relative">
              <input 
                type="text" 
                placeholder="Buscar por Área, Proceso, Zona..." 
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-sm focus:outline-none focus:ring-2 focus:ring-[#1F7D3E]/20 focus:border-[#1F7D3E] transition-all"
                value={search} 
                onChange={e=>setSearch(e.target.value)} 
              />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#5e6b62] uppercase">Desde</span>
                <input 
                  type="date" 
                  className="px-3 py-2 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-sm font-medium focus:outline-none focus:border-[#1F7D3E]"
                  value={dateDesde} 
                  onChange={e=>setDateDesde(e.target.value)} 
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#5e6b62] uppercase">Hasta</span>
                <input 
                  type="date" 
                  className="px-3 py-2 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-sm font-medium focus:outline-none focus:border-[#1F7D3E]"
                  value={dateHasta} 
                  onChange={e=>setDateHasta(e.target.value)} 
                />
              </div>
            </div>

            <select 
              className="px-4 py-2.5 rounded-xl border border-[#e2e9e4] bg-[#f8faf9] text-sm font-medium text-[#2c3630] cursor-pointer focus:outline-none focus:border-[#1F7D3E]"
              value={tipoFilter} 
              onChange={e=>setTipoFilter(e.target.value)}
            >
              <option value="">Tipo: Todos</option>
              {tiposList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <div className="flex items-center gap-2 ml-auto">
              <button 
                className="px-5 py-2.5 rounded-xl border border-[#e2e9e4] text-sm font-bold text-[#5e6b62] hover:bg-gray-50 transition-colors"
                onClick={() => { setSearch(''); setDateDesde(''); setDateHasta(''); setTipoFilter(''); setCurrentPage(1) }}
              >
                Limpiar
              </button>
              
              <div className="relative group">
                <button className="px-6 py-2.5 rounded-xl bg-[#1F7D3E] text-white text-sm font-bold shadow-lg shadow-[#1F7D3E]/20 hover:bg-[#186331] transition-all flex items-center gap-2">
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
              className="group relative bg-white border border-[#e2e9e4] rounded-2xl p-5 flex items-center gap-6 cursor-pointer hover:border-[#1F7D3E] hover:shadow-xl hover:-translate-y-0.5 transition-all"
              onClick={() => router.push('/matriz/' + m.id)}
            >
              <div className="flex-1 space-y-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold text-[#0f2b1a] group-hover:text-[#1F7D3E] transition-colors line-clamp-1">
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

              <div className="flex items-center gap-2 sm:gap-4 md:gap-8">
                <div className="flex gap-2 mr-4 hidden sm:flex">
                  {m.counts.map((c: number, idx: number) => (
                    <div key={idx} className="flex flex-col items-center justify-center w-14 h-14 rounded-xl border border-transparent transition-all" style={{ background: COLORS[idx].bg + '80' }}>
                      <span className="text-lg font-bold" style={{ color: COLORS[idx].txt }}>{c}</span>
                      <span className="text-[8px] font-bold uppercase" style={{ color: COLORS[idx].txt }}>{COLORS[idx].lbl.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
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
                      className={`p-2.5 rounded-xl border border-transparent transition-all ${btn.color || 'text-[#5e6b62] hover:bg-[#f0f9f1] hover:border-[#d1e2d6] hover:text-[#1F7D3E]'}`}
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
          <div className="flex items-center justify-between pt-4 border-t border-[#e2e9e4]">
            <p className="text-xs font-semibold text-[#5e6b62] uppercase tracking-wider">
              Página {currentPage} de {totalPages} <span className="mx-2 opacity-30">|</span> {totalMatrices} totales
            </p>
            <div className="flex items-center gap-2">
              <button 
                className="px-4 py-2 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#2c3630] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                disabled={currentPage <= 1} 
                onClick={() => setCurrentPage(1)}
              >
                Primera
              </button>
              <button 
                className="px-4 py-2 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#2c3630] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                disabled={currentPage <= 1} 
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button 
                className="px-4 py-2 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#2c3630] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                disabled={currentPage >= totalPages} 
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </button>
              <button 
                className="px-4 py-2 rounded-xl border border-[#e2e9e4] bg-white text-xs font-bold text-[#2c3630] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
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

      <InstructionsModal 
        open={instructionsOpen} 
        onClose={() => setInstructionsOpen(false)} 
      />
    </div>
  )
}
