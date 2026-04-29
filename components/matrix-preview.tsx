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
  if (!np) return { label: '—', color: '#9CA3AF' }
  if (np >= 24 && np <= 40) return { label: 'Muy Alto', color: '#a50000' }
  if (np >= 10 && np <= 23) return { label: 'Alto', color: '#ef4444' }
  if (np >= 6 && np <= 9) return { label: 'Medio', color: '#EAB308' }
  if (np >= 2 && np <= 5) return { label: 'Bajo', color: '#198754' }
  return { label: String(np), color: '#9CA3AF' }
}

function interpNivelRiesgo(nr: number) {
  if (!nr) return { label: '—', color: '#9CA3AF' }
  if (nr >= 4000 && nr <= 6000) return { label: 'I', color: '#a50000' }
  if (nr >= 150 && nr <= 500) return { label: 'II', color: '#ef4444' }
  if (nr >= 40 && nr <= 120) return { label: 'III', color: '#198754' }
  if (nr >= 10 && nr <= 20) return { label: 'IV', color: '#198754' }
  if (nr >= 501) return { label: 'I', color: '#a50000' }
  if (nr >= 121 && nr <= 500) return { label: 'II', color: '#ef4444' }
  return { label: String(nr), color: '#9CA3AF' }
}

function aceptabilidadColor(text: string) {
  if (text.includes('No Aceptable')) return '#a50000'
  if (text.includes('Control Especifico')) return '#ef4444'
  if (text.includes('Mejorable')) return '#198754'
  if (text.includes('Aceptable')) return '#198754'
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
    nd: 60,
    ne: 60,
    np: 60,
    interpNp: 140,
    nc: 60,
    nr: 60,
    interpNr: 160,
    aceptabilidad: 180,
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

  return (
    <div className="fixed inset-0 w-full h-full bg-white z-[9999] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e9e4] bg-[#f8faf9]/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="flex items-center justify-center p-2 rounded-full hover:bg-gray-100 transition-colors text-[#5e6b62]"
            title="Volver"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          </button>
          
          <div className="flex items-center gap-4">
            <img src="/matriz-riesgos/csm_logo_long.png" alt="Logo" className="h-8 object-contain" />
            <div className="w-[1px] h-6 bg-[#e2e9e4]" />
            <div>
              <h2 className="text-sm font-bold text-[#1F7D3E] uppercase tracking-wide">Vista Previa de Matriz</h2>
              <p className="text-[10px] font-bold text-[#8aa08f] uppercase tracking-widest">{matrizData.area || 'Matriz de Riesgos'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Fields Section */}
      <div className="px-8 py-6 bg-white border-b border-[#e2e9e4] grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-[#8aa08f] uppercase tracking-wider block">Área / Proceso</label>
          <div className="bg-[#f0f9f1] border border-[#d1e2d6] rounded-xl px-4 py-2.5 text-sm font-bold text-[#1F7D3E]">
            {matrizData.area || '—'}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-[#8aa08f] uppercase tracking-wider block">Fecha de Actualización</label>
          <div className="bg-white border border-[#e2e9e4] rounded-xl px-4 py-2.5 text-sm font-medium text-[#2c3630]">
            {matrizData.fecha_elaboracion || '—'}
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
      <div className="flex-1 min-h-0 bg-[#f8faf9] px-8 pb-8 flex flex-col">
        <div className="bg-white rounded-2xl border border-[#e2e9e4] shadow-xl shadow-gray-200/50 flex-1 overflow-hidden mt-4 flex flex-col">
          <div 
            ref={tableContainerRef}
            className="flex-1 overflow-auto"
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
                    <td colSpan={columns.length} className="px-8 py-20 text-center text-[#5e6b62] font-medium italic bg-gray-50/50">
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
                            <td colSpan={columns.length} className="px-6 py-3 bg-[#f8faf9] border-r border-[#e2e9e4] last:border-r-0 font-bold text-[#1F7D3E] flex items-center gap-2">
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
                          <tr key={`row-${r}`} className="hover:bg-gray-50/50 transition-colors">
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
                                    className={`px-4 py-3 border-r border-[#e2e9e4] last:border-r-0 align-top text-[#2c3630] leading-relaxed ${isEvaluationField ? 'whitespace-nowrap' : 'break-words font-medium'} ${col.key === 'zona' ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''} ${isNumeric ? 'text-center' : 'text-left'}`}
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
                                  className={`px-4 py-3 border-r border-[#e2e9e4] last:border-r-0 align-top text-[#2c3630] leading-relaxed ${isEvaluationField ? 'whitespace-nowrap' : 'break-words font-medium'} ${isNumeric ? 'text-center' : 'text-left'}`}
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
        backgroundColor: '#f8faf9',
        color: '#5e6b62',
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
          className="bg-transparent border-none text-center w-full focus:bg-white/50 outline-none px-4 py-3 m-0 transition-colors"
          style={{ 
            fontSize: '10px', 
            fontWeight: 'bold',
            color: '#5e6b62', 
            textAlign: 'center', 
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
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
