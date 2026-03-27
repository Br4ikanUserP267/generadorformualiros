"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
    interpNr: 120,
    aceptabilidad: 120,
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

  useEffect(() => {
    const loadMatriz = async () => {
      try {
        const res = await fetch(`/api/riesgos/${matrizId}`)
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
          }}
          style={{
            width: '4px',
            height: '20px',
            cursor: 'col-resize',
            backgroundColor: 'rgba(255,255,255,0.5)',
            marginLeft: '4px',
            borderRadius: '2px'
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0">
      <div className="bg-white w-screen h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold">{matrizData.area || 'Matriz'}</h2>
            <p className="text-sm text-gray-500">
              Responsable: {matrizData.responsable || 'N/A'} • Fecha: {matrizData.fecha_elaboracion || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl font-bold text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-auto flex-1">
          <div className="p-4">
            <table style={tableStyle}>
            <thead>
              <tr>
                {columns.map(col => (
                  <HeaderCell key={col.key} column={col} />
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ ...cellStyle, textAlign: 'center', padding: '20px' }}>
                    No hay peligros registrados
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx}>
                    {columns.map(col => {
                      const value = row[col.key as keyof typeof row]
                      const isNumeric = ['nd', 'ne', 'nc', 'nr', 'numExpuestos'].includes(col.key)
                      const isEvaluationField = ['nd', 'ne', 'nc', 'nr', 'interpNr', 'aceptabilidad'].includes(col.key)
                      
                      let cellBackgroundStyle = {}
                      if (isEvaluationField && row.nr) {
                        const colors = getRiskColor(row.nr)
                        cellBackgroundStyle = { backgroundColor: colors.bg, color: colors.text }
                      }
                      
                      return (
                        <td
                          key={col.key}
                          style={{
                            ...cellStyle,
                            width: columnWidths[col.key] || 100,
                            textAlign: isNumeric ? 'center' : 'left',
                            ...cellBackgroundStyle
                          }}
                        >
                          {value}
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onClose()
              router.push(`/matriz/${matrizId}`)
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Editar Matriz
          </button>
        </div>
      </div>
    </div>
  )
}
