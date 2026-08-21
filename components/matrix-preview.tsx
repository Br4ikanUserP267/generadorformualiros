"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/utils'

interface MatrixPreviewProps {
  matrizId: string
  onClose: () => void
}

interface ColumnWidths {
  [key: string]: number
}

// risk interpretation helpers matching matrix-editor
function interpProbabilidad(np: number) {
  if (!np) return { label: '', color: '#9CA3AF' }
  if (np <= 4) return { label: 'Bajo', color: '#198754' }     // Green
  if (np <= 8) return { label: 'Medio', color: '#EAB308' }    // Yellow
  if (np <= 20) return { label: 'Alto', color: '#ef4444' }     // Red
  return { label: 'Muy Alto', color: '#a50000' } // Deep Red
}

function interpNivelRiesgo(nr: number) {
  if (!nr) return { label: '', color: '#9CA3AF' }
  if (nr <= 20) return { label: 'IV', color: '#198754' }     // IV = Green
  if (nr <= 120) return { label: 'III', color: '#198754' }    // III = Green
  if (nr <= 500) return { label: 'II', color: '#EAB308' }    // II = Yellow
  return { label: 'I', color: '#ef4444' }    // I = Red
}

function aceptabilidadColor(text: string) {
  if (!text) return '#9CA3AF'
  if (text.includes('No Aceptable')) return '#dc3545' // Rojo
  if (text.includes('Control Especifico')) return '#EAB308' // Amarillo
  if (text.includes('Mejorable')) return '#198754' // Verde
  if (text.includes('Aceptable')) return '#198754' // Verde profundo
  return '#9CA3AF'
}

function getEvalFieldStyle(colKey: string, row: any) {
  if (colKey === 'interpNp') {
    const color = interpProbabilidad(row.np || 0).color
    return color !== '#9CA3AF' ? { backgroundColor: color, color: '#fff', fontWeight: '700' } : {}
  }
  if (colKey === 'interpNr') {
    const color = interpNivelRiesgo(row.nr || 0).color
    return color !== '#9CA3AF' ? { backgroundColor: color, color: '#fff', fontWeight: '700' } : {}
  }
  if (colKey === 'aceptabilidad') {
    const color = aceptabilidadColor(row.aceptabilidad || '')
    return color !== '#9CA3AF' ? { backgroundColor: color, color: '#fff', fontWeight: '700' } : {}
  }
  return {}
}

export function MatrixPreview({ matrizId, onClose }: MatrixPreviewProps) {
  const router = useRouter()
  const [matrizData, setMatrizData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>({
    proceso: 120,
    zona: 120,
    actividad: 300,
    tareas: 300,
    cargo: 120,
    rutinario: 80,
    peligro: 200,
    clasificacion: 140,
    efectos: 200,
    controlFuente: 150,
    controlMedio: 150,
    controlIndividuo: 150,
    nd: 130,
    ne: 130,
    np: 130,
    interpNp: 220,
    nc: 130,
    nr: 130,
    interpNr: 200,
    aceptabilidad: 200,
    numExpuestos: 100,
    peorConsecuencia: 150,
    requisitoLegal: 100,
    eliminacion: 150,
    sustitucion: 150,
    controlIngenieria: 180,
    controlAdmin: 180,
    epp: 150,
    responsable: 150,
    fechaEjecucion: 120
  })
  const [columnLabels, setColumnLabels] = useState<Record<string, string>>({
    proceso: 'Proceso',
    zona: 'Zona',
    actividad: 'Actividad',
    tareas: 'Tareas',
    cargo: 'Cargo',
    rutinario: 'Rutinario',
    peligro: 'Peligro',
    clasificacion: 'Clasificación',
    efectos: 'Efectos',
    controlFuente: 'Control Fuente',
    controlMedio: 'Control Medio',
    controlIndividuo: 'Control Individuo',
    nd: 'Nivel Deficiencia',
    ne: 'Nivel Exposición',
    np: 'Nivel Probabilidad',
    interpNp: 'Interpretación Nivel Probabilidad',
    nc: 'Nivel Consecuencia',
    nr: 'Nivel Riesgo',
    interpNr: 'Interpretación Nivel Riesgo',
    aceptabilidad: 'Aceptabilidad Del Riesgo',
    numExpuestos: 'Nº Expuestos',
    peorConsecuencia: 'Peor Consecuencia',
    requisitoLegal: 'Requisito Legal',
    eliminacion: 'Eliminación',
    sustitucion: 'Sustitución',
    controlIngenieria: 'Controles Ingeniería',
    controlAdmin: 'Controles Admin',
    epp: 'EPP',
    responsable: 'Responsable',
    fechaEjecucion: 'Fecha Ejecución'
  })
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [collapsedZonas, setCollapsedZonas] = useState<Record<string, boolean>>({})

  const handleLabelChange = async (key: string, newLabel: string) => {
    const updatedLabels = { ...columnLabels, [key]: newLabel }
    setColumnLabels(updatedLabels)
    
    // Auto-adjust width: approximate 9px per character + padding/resizer space
    const neededWidth = (newLabel.length * 8.5) + 50
    if (neededWidth > columnWidths[key]) {
      setColumnWidths(prev => ({
        ...prev,
        [key]: Math.min(600, Math.ceil(neededWidth))
      }))
    }

    // Persist to DB
    try {
      await apiFetch('/api/configuracion?key=column_labels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: updatedLabels })
      })
    } catch (e) {
      console.error('Error saving labels to DB:', e)
    }
  }

  function toggleZona(name: string) {
    setCollapsedZonas(prev => ({ ...prev, [name]: !prev[name] }))
  }

  useEffect(() => {
    const loadMatriz = async () => {
      try {
        const res = await apiFetch(`/api/riesgos/${matrizId}`)
        if (res.ok) {
          const data = await res.json()
          setMatrizData(data)
        }
      } catch (e) {
        console.error('Error loading matrix:', e)
      } finally {
        setLoading(false)
      }
    }

    const loadConfig = async () => {
      try {
        const res = await apiFetch('/api/configuracion?key=column_labels')
        if (res.ok) {
          const config = await res.json()
          if (config && config.valor) {
            setColumnLabels(prev => ({ ...prev, ...config.valor }))
          }
        }
      } catch (e) {
        console.error('Error loading config:', e)
      }
    }

    loadMatriz()
    loadConfig()
  }, [matrizId])

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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingColumn) return
      const diff = e.clientX - resizeStartX
      setColumnWidths(prev => ({
        ...prev,
        [resizingColumn]: Math.max(60, prev[resizingColumn] + diff)
      }))
      setResizeStartX(e.clientX)
    }

    const handleMouseUp = () => {
      setResizingColumn(null)
      try { document.body.style.userSelect = '' } catch {}
      try { document.body.style.cursor = '' } catch {}
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

  // Refs for scroll synchronization
  const tableContainerRef = React.useRef<HTMLDivElement>(null)
  const topScrollRef = React.useRef<HTMLDivElement>(null)

  const handleScrollSync = (source: React.RefObject<HTMLDivElement | null>, target: React.RefObject<HTMLDivElement | null>) => {
    if (source.current && target.current) {
      target.current.scrollLeft = source.current.scrollLeft
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">Cargando preview...</div>
      </div>
    )
  }

  if (!matrizData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">Error al cargar la matriz</div>
      </div>
    )
  }

  const columns = Object.keys(columnLabels).map(key => ({
    key,
    label: columnLabels[key]
  }))

  const infoRowStyle = {
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold' as const
  }

  // Calculate total width for top scrollbar dummy
  const totalTableWidth = columns.reduce((acc, col) => acc + (columnWidths[col.key] || 100), 0)

  // Flatten peligros for display
  const rows: any[] = []
  if (matrizData.procesos) {
    matrizData.procesos.forEach((p: any) => {
      if (p.zonas) {
        p.zonas.forEach((z: any) => {
          if (z.actividades) {
            z.actividades.forEach((a: any) => {
              if (a.peligros) {
                a.peligros.forEach((pel: any) => {
                  const nd = pel.evaluacion?.nd || pel.evaluacion?.deficiencia || 0
                  const ne = pel.evaluacion?.ne || pel.evaluacion?.exposicion || 0
                  const nc = pel.evaluacion?.nc || pel.evaluacion?.consecuencia || 0
                  const nr = pel.evaluacion?.nr || (nd * ne * nc)

                  rows.push({
                    proceso: p.nombre || '',
                    zona: z.nombre || '',
                    actividad: a.descripcion || a.nombre || '',
                    tareas: a.tareas || '',
                    cargo: a.cargo || '',
                    rutinario: a.rutinario ? 'Sí' : 'No',
                    peligro: pel.descripcion || '',
                    clasificacion: pel.clasificacion || '',
                    efectos: pel.efectos || '',
                    controlFuente: pel.controles?.fuente || '',
                    controlMedio: pel.controles?.medio || '',
                    controlIndividuo: pel.controles?.individuo || '',
                    nd,
                    ne,
                    np: pel.evaluacion?.np || (nd * ne),
                    interpNp: pel.evaluacion?.interp_np || '',
                    nc,
                    nr,
                    interpNr: pel.evaluacion?.interp_nr || '',
                    aceptabilidad: pel.evaluacion?.aceptabilidad || '',
                    numExpuestos: pel.criterios?.num_expuestos || '',
                    peorConsecuencia: pel.criterios?.peor_consecuencia || '',
                    requisitoLegal: pel.criterios?.requisito_legal ? 'Sí' : 'No',
                    eliminacion: pel.intervencion?.eliminacion || '',
                    sustitucion: pel.intervencion?.sustitucion || '',
                    controlIngenieria: pel.intervencion?.controles_ingenieria || '',
                    controlAdmin: pel.intervencion?.controles_administrativos || '',
                    epp: pel.intervencion?.epp || '',
                    responsable: pel.intervencion?.responsable || '',
                    fechaEjecucion: pel.intervencion?.fecha_ejecucion || ''
                  })
                })
              }
            })
          }
        })
      }
    })
  }

  // Compute rowSpans for consecutive identical values on selected keys
  const mergeKeys = ['proceso', 'zona', 'actividad', 'tareas', 'cargo', 'rutinario', 'numExpuestos']
  const rowSpans: Record<string, number[]> = {}
  for (const key of mergeKeys) {
    rowSpans[key] = new Array(rows.length).fill(0)
    let i = 0
    while (i < rows.length) {
      let j = i + 1
      while (j < rows.length && String(rows[j][key]) === String(rows[i][key])) j++
      const span = j - i
      rowSpans[key][i] = span
      for (let k = i + 1; k < j; k++) rowSpans[key][k] = 0
      i = j
    }
  }

  const totalProcesos = matrizData.procesos?.length || 0
  const totalZonas = (matrizData.procesos || []).reduce((acc: number, proceso: any) => acc + (proceso.zonas?.length || 0), 0)
  const totalActividades = (matrizData.procesos || []).reduce((acc: number, proceso: any) => (
    acc + (proceso.zonas || []).reduce((zonaAcc: number, zona: any) => zonaAcc + (zona.actividades?.length || 0), 0)
  ), 0)
  const totalPeligros = rows.length
  const riesgoBuckets = rows.reduce((acc: { alto: number; medio: number; bajo: number }, row: any) => {
    const np = Number(row.np || 0)
    if (np >= 10) acc.alto += 1
    else if (np >= 6) acc.medio += 1
    else acc.bajo += 1
    return acc
  }, { alto: 0, medio: 0, bajo: 0 })

  return (
    <div className="fixed inset-0 w-full h-full bg-[linear-gradient(180deg,#f4f8f4_0%,#edf4ef_100%)] z-[9999] flex flex-col overflow-hidden overscroll-none animate-in fade-in zoom-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#dbe8de] bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 rounded-2xl border border-[#dbe8de] bg-[#f8fbf8] hover:bg-white transition-colors text-[#355244] shadow-sm shrink-0"
            title="Volver"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          
          <div className="flex items-center gap-4 min-w-0">
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-[radial-gradient(circle_at_top_left,#1F7D3E_0%,#0e4d24_100%)] text-white shadow-lg shadow-[#1F7D3E]/20">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18"/><path d="M8 3v8"/><path d="M16 3v8"/><path d="M5 12h14v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/></svg>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center rounded-full bg-[#eef7f0] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#1F7D3E]">
                  Preview
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8aa08f]">
                  Matriz de Riesgos
                </span>
              </div>
              <h2 className="mt-1 text-lg sm:text-xl font-black text-[#163522] truncate">Vista Previa de Matriz</h2>
              <p className="text-[11px] sm:text-xs font-bold text-[#7e9586] uppercase tracking-[0.16em] truncate">{matrizData.area || 'Matriz de Riesgos'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
      {/* Metadata Fields Section */}
      <div className="px-4 sm:px-8 py-5 sm:py-6 border-b border-[#dbe8de] bg-[linear-gradient(180deg,rgba(255,255,255,0.94)_0%,rgba(247,251,248,0.96)_100%)] space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
          {[
            { label: 'Area / Proceso', value: matrizData.area || '—', accent: 'bg-[#edf8ef] border-[#cae4cf] text-[#1F7D3E]' },
            { label: 'Fecha de Actualizacion', value: matrizData.fecha_actualizacion || '—', accent: 'bg-white border-[#dfe9e2] text-[#163522]' },
            { label: 'Fecha de Elaboracion', value: matrizData.fecha_elaboracion || '—', accent: 'bg-white border-[#dfe9e2] text-[#163522]' },
            { label: 'Responsable', value: matrizData.responsable || '—', accent: 'bg-white border-[#dfe9e2] text-[#163522]' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-[#e4ede6] bg-white p-4 shadow-[0_8px_24px_rgba(17,24,39,0.04)]">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#8aa08f]">{item.label}</div>
              <div className={`mt-3 rounded-2xl border px-4 py-3.5 text-sm font-bold ${item.accent}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {[
            { label: 'Procesos', value: totalProcesos, tone: 'text-[#1F7D3E] bg-[#eef7f0] border-[#d6eadb]' },
            { label: 'Zonas', value: totalZonas, tone: 'text-[#22577a] bg-[#edf7fb] border-[#d7ebf5]' },
            { label: 'Actividades', value: totalActividades, tone: 'text-[#7c5c00] bg-[#fff8e6] border-[#f1e3b1]' },
            { label: 'Peligros', value: totalPeligros, tone: 'text-[#7a1f1f] bg-[#fff1f1] border-[#f2d0d0]' },
            { label: 'Riesgo Alto', value: riesgoBuckets.alto, tone: 'text-[#b42318] bg-[#fff0ef] border-[#f4c7c3]' },
            { label: 'Riesgo Medio', value: riesgoBuckets.medio, tone: 'text-[#b26b00] bg-[#fff7e8] border-[#f0d5a6]' },
            { label: 'Riesgo Bajo', value: riesgoBuckets.bajo, tone: 'text-[#166534] bg-[#ecfdf3] border-[#cdebd7]' },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl border px-4 py-3 shadow-sm ${card.tone}`}>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">{card.label}</div>
              <div className="mt-2 text-2xl font-black leading-none">{card.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="hidden px-4 sm:px-8 py-4 sm:py-6 bg-white border-b border-[#e2e9e4] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-[#8aa08f] uppercase tracking-wider block">Área / Proceso</label>
          <div className="bg-[#f0f9f1] border border-[#d1e2d6] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1F7D3E]">
            {matrizData.area || '—'}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-[#8aa08f] uppercase tracking-wider block">Fecha de Actualización</label>
          <div className="bg-white border border-[#e2e9e4] rounded-xl px-4 py-2.5 text-sm font-medium text-[#2c3630]">
            {matrizData.fecha_actualizacion || '—'}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-[#8aa08f] uppercase tracking-wider block">Fecha de Elaboracion</label>
          <div className="bg-white border border-[#e2e9e4] rounded-xl px-4 py-2.5 text-sm font-medium text-[#2c3630]">
            {matrizData.fecha_elaboracion || 'â€”'}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-[#8aa08f] uppercase tracking-wider block">Responsable</label>
          <div className="bg-white border border-[#e2e9e4] rounded-xl px-4 py-2.5 text-sm font-medium text-[#2c3630]">
            {matrizData.responsable || '—'}
          </div>
        </div>
      </div>



      {/* Main Table Content */}
      <div className="px-4 sm:px-8 pb-4 sm:pb-8 pt-5">
        <div className="rounded-[28px] border border-[#dbe8de] bg-white shadow-[0_18px_60px_rgba(23,40,28,0.08)] overflow-hidden flex flex-col min-h-[62vh]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#e4ede6] bg-[linear-gradient(180deg,#fbfdfb_0%,#f4f8f5_100%)]">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8aa08f]">Detalle Completo</div>
              <h3 className="mt-1 text-base sm:text-lg font-black text-[#163522]">Tabla consolidada de peligros y controles</h3>
              <p className="mt-1 text-xs text-[#6c8374]">Scroll horizontally to review all fields. Column headers can still be renamed and resized.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-full border border-[#dbe8de] bg-white px-3 py-1.5 text-[11px] font-bold text-[#355244]">
                {columns.length} columnas
              </span>
              <span className="inline-flex items-center rounded-full border border-[#dbe8de] bg-white px-3 py-1.5 text-[11px] font-bold text-[#355244]">
                {rows.length} registros
              </span>
            </div>
          </div>
          <div 
            ref={tableContainerRef}
            className="overflow-auto bg-[linear-gradient(180deg,#ffffff_0%,#fcfdfc_100%)] max-h-[72vh]"
          >
            <table className="w-full border-collapse table-fixed text-[11px] font-sans">
              <thead className="sticky top-0 z-10">
                <tr>
                  {columns.map(col => (
                    <HeaderCell 
                      key={col.key} 
                      column={col} 
                      width={columnWidths[col.key] || 100}
                      onLabelChange={(newLabel) => handleLabelChange(col.key, newLabel)}
                      onResizeStart={(e) => {
                        e.preventDefault()
                        setResizingColumn(col.key)
                        setResizeStartX(e.clientX)
                        try { document.body.style.userSelect = 'none' } catch {}
                        try { document.body.style.cursor = 'col-resize' } catch {}
                      }}
                    />
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e9e4]/50">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-8 py-20 text-center text-[#5e6b62] font-medium italic bg-[#fbfdfb]">
                      No se encontraron registros en esta matriz
                    </td>
                  </tr>
                ) : (
                  (() => {
                    const elements: any[] = []
                    let i = 0
                    while (i < rows.length) {
                      const zonaSpan = rowSpans['zona'][i] || 1
                      const zonaName = rows[i].zona || ''
                      const isCollapsed = (collapsedZonas && collapsedZonas[zonaName]) === true

                      if (isCollapsed) {
                        elements.push(
                          <tr key={`zona-c-${i}`} className="group cursor-pointer hover:bg-[#f0f9f1] transition-colors" onClick={() => toggleZona(zonaName)}>
                            <td colSpan={columns.length} className="px-6 py-3 bg-[#f7fbf8] border-r border-[#e2e4e4] last:border-r-0 font-bold text-[#1F7D3E] flex items-center gap-2">
                              <span className="text-xs">▶</span> {zonaName} <span className="text-[9px] font-normal text-[#8aa08f]">(Expandir)</span>
                            </td>
                          </tr>
                        )
                        i += zonaSpan
                        continue
                      }

                      const end = i + zonaSpan
                      for (let r = i; r < end; r++) {
                        const row = rows[r]
                        elements.push(
                          <tr key={`row-${r}`} className={`${r % 2 === 0 ? 'bg-white' : 'bg-[#fbfdfb]'} hover:bg-[#f5faf6] transition-colors`}>
                            {columns.map((col, colIdx) => {
                              const value = row[col.key as keyof typeof row]
                              const isNumeric = ['nd', 'ne', 'np', 'nc', 'nr', 'numExpuestos'].includes(col.key)
                              const isEvaluationField = ['nd', 'ne', 'np', 'interpNp', 'nc', 'nr', 'interpNr', 'aceptabilidad'].includes(col.key)

                              if (mergeKeys.includes(col.key)) {
                                const span = rowSpans[col.key][r] || 0
                                if (span === 0) return null
                                const evalStyle = isEvaluationField ? getEvalFieldStyle(col.key, row) : {}
                                
                                return (
                                  <td 
                                    key={col.key} 
                                    rowSpan={span} 
                                    className={`px-4 py-3.5 border-r border-[#e2e9e4] last:border-r-0 align-top text-[#2c3630] leading-relaxed ${isEvaluationField ? 'whitespace-nowrap' : 'break-words font-medium'} ${col.key === 'zona' ? 'cursor-pointer hover:bg-[#eef7f0] transition-colors' : ''} ${isNumeric ? 'text-center' : 'text-left'}`}
                                    style={evalStyle}
                                    onClick={col.key === 'zona' ? () => toggleZona(zonaName) : undefined}
                                  >
                                    {col.key === 'zona' && <span className="mr-1.5 text-[9px] text-[#8aa08f]">▼</span>}
                                    {value}
                                  </td>
                                )
                              }

                              const bgStyle = isEvaluationField ? getEvalFieldStyle(col.key, row) : {}
                              return (
                                <td 
                                  key={col.key} 
                                  className={`px-4 py-3.5 border-r border-[#e2e9e4] last:border-r-0 align-top text-[#2c3630] leading-relaxed ${isEvaluationField ? 'whitespace-nowrap' : 'break-words font-medium'} ${isNumeric ? 'text-center' : 'text-left'}`}
                                  style={bgStyle}
                                >
                                  {col.key === 'requisitoLegal' || col.key === 'cumple' ? (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${value === 'Sí' || value === 'SI' ? 'bg-[#e8f5e9] text-[#198754]' : 'bg-gray-100 text-gray-500'}`}>
                                      {value}
                                    </span>
                                  ) : value}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      }
                      i = end
                    }
                    return elements
                  })()
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

// Separated component to prevent focus loss during parent re-renders
const HeaderCell = ({ 
  column, 
  width, 
  onLabelChange, 
  onResizeStart 
}: { 
  column: { key: string; label: string }; 
  width: number;
  onLabelChange: (val: string) => void;
  onResizeStart: (e: React.MouseEvent) => void;
}) => {
  const [localLabel, setLocalLabel] = useState(column.label)
  
  // Sync if parent updates externally
  useEffect(() => {
    setLocalLabel(column.label)
  }, [column.label])

  const commit = () => {
    if (localLabel !== column.label) {
      onLabelChange(localLabel)
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
        border: '1px solid #e2e9e4',
        padding: '0',
        background: 'linear-gradient(180deg, #f8fbf8 0%, #eff6f1 100%)',
        color: '#355244',
        fontWeight: 'bold',
        textAlign: 'center',
        position: 'relative',
        userSelect: 'none',
        width: width
      }}
      className="group last:border-r-0"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', position: 'relative' }}>
        <input 
          value={localLabel} 
          onChange={(e) => setLocalLabel(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="bg-transparent border-none text-center w-full focus:bg-white/70 outline-none px-4 py-3.5 m-0 transition-colors"
          style={{ 
            fontSize: '10px', 
            fontWeight: '900',
            color: '#355244', 
            textAlign: 'center', 
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            fontFamily: 'inherit',
            cursor: 'text'
          }}
          title="Haz clic para renombrar. Pulsa Enter para confirmar."
        />
        <div
          onMouseDown={onResizeStart}
          style={{
            width: '4px',
            height: '100%',
            cursor: 'col-resize',
            position: 'absolute',
            right: 0,
            top: 0,
            zIndex: 10
          }}
          className="hover:bg-[#1F7D3E]/30 transition-colors opacity-0 group-hover:opacity-100"
        />
      </div>
    </th>
  )
}
