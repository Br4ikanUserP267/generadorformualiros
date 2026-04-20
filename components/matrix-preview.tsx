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

// Helper function to get color based on risk level
function getRiskColor(nr: number): { bg: string; text: string } {
  if (nr >= 4000) return { bg: '#fce8e8', text: '#a50000' } // Muy alto
  if (nr >= 501) return { bg: '#fdecea', text: '#dc3545' } // Alto
  if (nr >= 121) return { bg: '#fff3e0', text: '#fd7e14' } // Medio
  return { bg: '#e8f5e9', text: '#198754' } // Bajo
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
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [collapsedZonas, setCollapsedZonas] = useState<Record<string, boolean>>({})

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
    loadMatriz()
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

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse' as const,
    tableLayout: 'fixed' as const,
    fontSize: '12px',
    fontFamily: 'Arial, sans-serif'
  }

  const cellStyle = {
    border: '1px solid #000',
    padding: '8px',
    textAlign: 'left' as const,
    wordWrap: 'break-word' as const,
    whiteSpace: 'normal' as const
  }

  const headerCellStyle = {
    ...cellStyle,
    backgroundColor: '#006666',
    color: '#fff',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    position: 'relative' as const,
    userSelect: 'none' as const
  }

  const columns = [
    { key: 'proceso', label: 'Proceso' },
    { key: 'zona', label: 'Zona' },
    { key: 'actividad', label: 'Actividad' },
    { key: 'tareas', label: 'Tareas' },
    { key: 'cargo', label: 'Cargo' },
    { key: 'rutinario', label: 'Rutinario' },
    { key: 'peligro', label: 'Peligro' },
    { key: 'clasificacion', label: 'Clasificación' },
    { key: 'efectos', label: 'Efectos' },
    { key: 'controlFuente', label: 'Control Fuente' },
    { key: 'controlMedio', label: 'Control Medio' },
    { key: 'controlIndividuo', label: 'Control Individuo' },
    { key: 'nd', label: 'ND' },
    { key: 'ne', label: 'NE' },
    { key: 'nc', label: 'NC' },
    { key: 'nr', label: 'NR' },
    { key: 'interpNr', label: 'Interpretación' },
    { key: 'aceptabilidad', label: 'Aceptabilidad' },
    { key: 'numExpuestos', label: 'Nº Expuestos' },
    { key: 'peorConsecuencia', label: 'Peor Consecuencia' },
    { key: 'requisitoLegal', label: 'Requisito Legal' },
    { key: 'eliminacion', label: 'Eliminación' },
    { key: 'sustitucion', label: 'Sustitución' },
    { key: 'controlIngenieria', label: 'Controles Ingeniería' },
    { key: 'controlAdmin', label: 'Controles Admin' },
    { key: 'epp', label: 'EPP' },
    { key: 'responsable', label: 'Responsable' },
    { key: 'fechaEjecucion', label: 'Fecha Ejecución' }
  ]

  const HeaderCell = ({ column }: { column: { key: string; label: string } }) => (
    <th
      style={{
        ...headerCellStyle,
        width: columnWidths[column.key] || 100,
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
        <span>{column.label}</span>
        <div
          onMouseDown={(e) => {
            e.preventDefault()
            setResizingColumn(column.key)
            setResizeStartX(e.clientX)
            try { document.body.style.userSelect = 'none' } catch {}
            try { document.body.style.cursor = 'col-resize' } catch {}
          }}
          title="Arrastrar para cambiar ancho"
          style={{
            width: '10px',
            height: '100%',
            cursor: 'col-resize',
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(0,0,0,0.08) 50%, rgba(255,255,255,0) 100%)',
            marginLeft: '6px',
            display: 'inline-block',
            borderLeft: '1px solid rgba(255,255,255,0.12)'
          }}
        />
      </div>
    </th>
  )

  const infoRowStyle = {
    ...cellStyle,
    backgroundColor: '#f5f5f5',
    fontWeight: 'bold' as const
  }

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
                  const nr = (nd * ne) * nc

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
            <img src="/matriz-riesgos/csmLOGO_1_.png" alt="Logo" className="h-8 object-contain" />
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
      <div className="flex-1 overflow-auto bg-[#f8faf9] p-8">
        <div className="bg-white rounded-2xl border border-[#e2e9e4] shadow-xl shadow-gray-200/50 overflow-hidden">
          <div className="overflow-x-auto min-h-[60vh]">
            <table className="w-full border-collapse table-fixed text-[11px] font-sans">
              <thead className="sticky top-0 z-10">
                <tr>
                  {columns.map(col => (
                    <th 
                      key={col.key} 
                      className="px-4 py-3 bg-[#f8faf9] border-b border-r border-[#e2e9e4] text-[10px] font-bold text-[#5e6b62] uppercase tracking-wider text-center relative group select-none last:border-r-0"
                      style={{ width: columnWidths[col.key] || 100 }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>{col.label}</span>
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault()
                            setResizingColumn(col.key)
                            setResizeStartX(e.clientX)
                            try { document.body.style.userSelect = 'none' } catch {}
                            try { document.body.style.cursor = 'col-resize' } catch {}
                          }}
                          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-[#1F7D3E]/30 transition-colors"
                        />
                      </div>
                    </th>
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
                              const isNumeric = ['nd', 'ne', 'nc', 'nr', 'numExpuestos'].includes(col.key)
                              const isEvaluationField = ['nd', 'ne', 'nc', 'nr', 'interpNr', 'aceptabilidad'].includes(col.key)

                              if (mergeKeys.includes(col.key)) {
                                const span = rowSpans[col.key][r] || 0
                                if (span === 0) return null
                                const evalStyle = (isEvaluationField && row.nr) ? { backgroundColor: getRiskColor(row.nr).bg, color: getRiskColor(row.nr).text } : {}
                                
                                return (
                                  <td 
                                    key={col.key} 
                                    rowSpan={span} 
                                    className={`px-4 py-3 border-r border-[#e2e9e4] last:border-r-0 align-top text-[#2c3630] leading-relaxed ${isEvaluationField ? 'whitespace-nowrap font-bold' : 'break-words font-medium'} ${col.key === 'zona' ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''} ${isNumeric ? 'text-center' : 'text-left'}`}
                                    style={evalStyle}
                                    onClick={col.key === 'zona' ? () => toggleZona(zonaName) : undefined}
                                  >
                                    {col.key === 'zona' && <span className="mr-1.5 text-[9px] text-[#8aa08f]">▼</span>}
                                    {value}
                                  </td>
                                )
                              }

                              const bgStyle = (isEvaluationField && row.nr) ? { backgroundColor: getRiskColor(row.nr).bg, color: getRiskColor(row.nr).text, fontWeight: '700' } : {}
                              return (
                                <td 
                                  key={col.key} 
                                  className={`px-4 py-3 border-r border-[#e2e9e4] last:border-r-0 align-top text-[#2c3630] leading-relaxed ${isEvaluationField ? 'whitespace-nowrap font-bold' : 'break-words font-medium'} ${isNumeric ? 'text-center' : 'text-left'}`}
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
