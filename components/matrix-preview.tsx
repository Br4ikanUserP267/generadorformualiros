"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface MatrixPreviewProps {
  matrizId: string
  onClose: () => void
}

export function MatrixPreview({ matrizId, onClose }: MatrixPreviewProps) {
  const router = useRouter()
  const [matrizData, setMatrizData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

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
    textAlign: 'left' as const
  }

  const headerCellStyle = {
    ...cellStyle,
    backgroundColor: '#006666',
    color: '#fff',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const
  }

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
                    actividad: a.nombre || '',
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-full max-h-[90vh] overflow-auto shadow-lg flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
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
        <div className="overflow-auto flex-1 p-4">
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={headerCellStyle}>Proceso</th>
                <th style={headerCellStyle}>Zona</th>
                <th style={headerCellStyle}>Actividad</th>
                <th style={headerCellStyle}>Tareas</th>
                <th style={headerCellStyle}>Cargo</th>
                <th style={headerCellStyle}>Rutinario</th>
                <th style={headerCellStyle}>Peligro</th>
                <th style={headerCellStyle}>Clasificación</th>
                <th style={headerCellStyle}>Efectos</th>
                <th style={headerCellStyle}>Control Fuente</th>
                <th style={headerCellStyle}>Control Medio</th>
                <th style={headerCellStyle}>Control Individuo</th>
                <th style={headerCellStyle}>ND</th>
                <th style={headerCellStyle}>NE</th>
                <th style={headerCellStyle}>NC</th>
                <th style={headerCellStyle}>NR</th>
                <th style={headerCellStyle}>Interpretación</th>
                <th style={headerCellStyle}>Aceptabilidad</th>
                <th style={headerCellStyle}>Nº Expuestos</th>
                <th style={headerCellStyle}>Peor Consecuencia</th>
                <th style={headerCellStyle}>Requisito Legal</th>
                <th style={headerCellStyle}>Eliminación</th>
                <th style={headerCellStyle}>Sustitución</th>
                <th style={headerCellStyle}>Controles Ingeniería</th>
                <th style={headerCellStyle}>Controles Admin</th>
                <th style={headerCellStyle}>EPP</th>
                <th style={headerCellStyle}>Responsable</th>
                <th style={headerCellStyle}>Fecha Ejecución</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={28} style={{ ...cellStyle, textAlign: 'center', padding: '20px' }}>
                    No hay peligros registrados
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr key={idx}>
                    <td style={cellStyle}>{row.proceso}</td>
                    <td style={cellStyle}>{row.zona}</td>
                    <td style={cellStyle}>{row.actividad}</td>
                    <td style={cellStyle}>{row.tareas}</td>
                    <td style={cellStyle}>{row.cargo}</td>
                    <td style={cellStyle}>{row.rutinario}</td>
                    <td style={cellStyle}>{row.peligro}</td>
                    <td style={cellStyle}>{row.clasificacion}</td>
                    <td style={cellStyle}>{row.efectos}</td>
                    <td style={cellStyle}>{row.controlFuente}</td>
                    <td style={cellStyle}>{row.controlMedio}</td>
                    <td style={cellStyle}>{row.controlIndividuo}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{row.nd}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{row.ne}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{row.nc}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{row.nr}</td>
                    <td style={cellStyle}>{row.interpNr}</td>
                    <td style={cellStyle}>{row.aceptabilidad}</td>
                    <td style={{ ...cellStyle, textAlign: 'center' }}>{row.numExpuestos}</td>
                    <td style={cellStyle}>{row.peorConsecuencia}</td>
                    <td style={cellStyle}>{row.requisitoLegal}</td>
                    <td style={cellStyle}>{row.eliminacion}</td>
                    <td style={cellStyle}>{row.sustitucion}</td>
                    <td style={cellStyle}>{row.controlIngenieria}</td>
                    <td style={cellStyle}>{row.controlAdmin}</td>
                    <td style={cellStyle}>{row.epp}</td>
                    <td style={cellStyle}>{row.responsable}</td>
                    <td style={cellStyle}>{row.fechaEjecucion}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
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
