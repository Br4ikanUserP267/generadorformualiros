"use client"

import React, { useState } from 'react'

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-[#edf2ed] pb-2 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-4">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-[#8aa08f]">{label}</div>
      <div className="min-w-0 break-words text-sm leading-6 text-[#163522]">{value}</div>
    </div>
  )
}

export function VersionMatrixDetailView({ matrix }: { matrix: any }) {
  const [expandedActivities, setExpandedActivities] = useState<Record<string, boolean>>({})
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
      <div className="space-y-3 rounded-xl border border-[#e2e9e4] bg-[#fbfdfb] p-4 sm:p-5">
        <div className="text-xs font-bold uppercase tracking-wide text-[#1F7D3E]">Datos de la matriz</div>
        <DetailRow label="Área" value={matrix.area || 'Vacío'} />
        <DetailRow label="Responsable" value={matrix.responsable || 'Vacío'} />
        <DetailRow label="Fecha de elaboración" value={matrix.fechaElaboracion || 'Vacío'} />
        <DetailRow label="Fecha de actualización" value={matrix.fechaActualizacion || 'Vacío'} />
        <DetailRow label="Archivos" value={matrix.files?.length || 0} />
      </div>

      <div className="space-y-3">
        {(matrix.procesos || []).map((proceso: any, procesoIndex: number) => (
          <div key={`${proceso.nombre}-${procesoIndex}`} className="overflow-hidden rounded-xl border border-[#dce8dc] bg-white">
            <div className="border-b border-[#dce8dc] bg-[#eef7f0] px-4 py-3">
              <div className="text-sm font-bold text-[#163522]">Proceso {procesoIndex + 1}: {proceso.nombre || 'Sin nombre'}</div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {(proceso.zonas || []).length === 0 ? (
                <div className="text-sm text-[#5e6b62]">No hay zonas en esta versión.</div>
              ) : (
                (proceso.zonas || []).map((zona: any, zonaIndex: number) => (
                  <div key={`${zona.nombre}-${zonaIndex}`} className="space-y-4 rounded-xl border border-[#e2e9e4] bg-[#fcfdfc] p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-bold text-[#1F7D3E]">Zona {zonaIndex + 1}: {zona.nombre || 'Sin nombre'}</div>
                      <div className="text-xs font-semibold text-[#5e6b62]">{(zona.actividades || []).length} actividades</div>
                    </div>

                    {(zona.actividades || []).map((actividad: any, actividadIndex: number) => {
                      const activityKey = `${procesoIndex}-${zonaIndex}-${actividadIndex}`
                      const isActivityExpanded = !!expandedActivities[activityKey]

                      return (
                        <div key={`${actividad.nombre}-${actividadIndex}`} className="overflow-hidden rounded-2xl border border-[#dce8dc] bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => setExpandedActivities((current) => ({ ...current, [activityKey]: !current[activityKey] }))}
                            className="w-full px-4 py-4 text-left transition-colors hover:bg-[#f9fcfa] sm:px-5"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center rounded-full bg-[#eef7f0] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1F7D3E]">
                                    Actividad {actividadIndex + 1}
                                  </span>
                                </div>
                                <div className="text-sm font-semibold leading-6 text-[#163522]">
                                  {actividad.nombre || 'Sin nombre'}
                                </div>
                                {actividad.descripcion && (
                                  <div className="line-clamp-2 text-xs leading-5 text-[#5e6b62]">
                                    {actividad.descripcion}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-3 lg:justify-end">
                                <div className="text-xs text-[#5e6b62]">
                                  {(actividad.peligros || []).length} peligros
                                </div>
                                <span className="inline-flex items-center rounded-full border border-[#cfe0d4] bg-white px-3 py-1 text-xs font-bold text-[#355244]">
                                  {isActivityExpanded ? 'Ocultar' : 'Ver detalle'}
                                </span>
                              </div>
                            </div>
                          </button>

                          {isActivityExpanded && (
                            <div className="space-y-3 border-t border-[#dce8dc] bg-[#fcfdfc] p-4 sm:p-5">
                              <DetailRow label="Descripción" value={actividad.descripcion || 'Vacío'} />
                              <DetailRow label="Tareas" value={actividad.tareas || 'Vacío'} />
                              <DetailRow label="Cargo" value={actividad.cargo || 'Vacío'} />
                              <DetailRow label="Rutinario" value={actividad.rutinario === null ? 'Sin dato' : actividad.rutinario ? 'Sí' : 'No'} />

                              <div className="space-y-3 border-t border-[#edf2ed] pt-3">
                                {(actividad.peligros || []).map((peligro: any, peligroIndex: number) => {
                                  const hazardKey = `${procesoIndex}-${zonaIndex}-${actividadIndex}-${peligroIndex}`
                                  const isHazardExpanded = !!expandedHazards[hazardKey]

                                  return (
                                    <div key={`${peligro.descripcion}-${peligroIndex}`} className="overflow-hidden rounded-2xl border border-[#dce8dc] bg-[#f9fcfa] shadow-sm">
                                      <button
                                        type="button"
                                        onClick={() => setExpandedHazards((current) => ({ ...current, [hazardKey]: !current[hazardKey] }))}
                                        className="w-full px-4 py-4 text-left transition-colors hover:bg-white"
                                      >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                          <div className="min-w-0 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="inline-flex items-center rounded-full bg-[#eaf5ed] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-[#1F7D3E]">
                                                Peligro {peligroIndex + 1}
                                              </span>
                                              {peligro.clasificacion && (
                                                <span className="inline-flex items-center rounded-full border border-[#d1e2d6] bg-white px-2.5 py-1 text-[10px] font-bold uppercase text-[#1F7D3E]">
                                                  {peligro.clasificacion}
                                                </span>
                                              )}
                                            </div>
                                            <div className="line-clamp-2 text-sm font-semibold leading-6 text-[#163522]">
                                              {peligro.descripcion || 'Sin descripción'}
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between gap-3 lg:justify-end">
                                            <div className="text-xs text-[#5e6b62]">
                                              {peligro.efectos ? 'Incluye efectos y controles' : 'Haz clic para ver el detalle'}
                                            </div>
                                            <span className="inline-flex items-center rounded-full border border-[#cfe0d4] bg-white px-3 py-1 text-xs font-bold text-[#355244]">
                                              {isHazardExpanded ? 'Ocultar' : 'Ver detalle'}
                                            </span>
                                          </div>
                                        </div>
                                      </button>

                                      {isHazardExpanded && (
                                        <div className="space-y-3 border-t border-[#dce8dc] bg-white p-4 sm:p-5">
                                          <div className="text-sm font-bold text-[#163522]">Detalle del peligro</div>
                                          <div className="grid gap-3 md:grid-cols-2">
                                            <DetailRow label="Descripción" value={peligro.descripcion || 'Vacío'} />
                                            <DetailRow label="Efectos" value={peligro.efectos || 'Vacío'} />
                                            <DetailRow label="Control en la fuente" value={peligro.control?.fuente || 'Vacío'} />
                                            <DetailRow label="Control en el medio" value={peligro.control?.medio || 'Vacío'} />
                                            <DetailRow label="Control individual" value={peligro.control?.individuo || 'Vacío'} />
                                            <DetailRow label="Número de expuestos" value={peligro.criterio?.numExpuestos ?? peligro.criterio?.num_expuestos ?? 'Vacío'} />
                                            <DetailRow label="Peor consecuencia" value={peligro.criterio?.peorConsecuencia || peligro.criterio?.peor_consecuencia || 'Vacío'} />
                                            <DetailRow
                                              label="Requisito legal"
                                              value={
                                                typeof (peligro.criterio?.requisitoLegal ?? peligro.criterio?.requisito_legal) === 'boolean'
                                                  ? ((peligro.criterio?.requisitoLegal ?? peligro.criterio?.requisito_legal) ? 'Sí' : 'No')
                                                  : 'Vacío'
                                              }
                                            />
                                            <DetailRow
                                              label="ND / NE / NC"
                                              value={
                                                [peligro.evaluacion?.nivelDeficiencia, peligro.evaluacion?.nivelExposicion, peligro.evaluacion?.nivelConsecuencia]
                                                  .filter((v) => v !== null && v !== undefined && v !== '')
                                                  .join(' / ') || 'Vacío'
                                              }
                                            />
                                            <DetailRow
                                              label="NP / NR"
                                              value={
                                                [peligro.evaluacion?.nivelProbabilidad, peligro.evaluacion?.nivelRiesgo]
                                                  .filter((v) => v !== null && v !== undefined && v !== '')
                                                  .join(' / ') || 'Vacío'
                                              }
                                            />
                                            <DetailRow
                                              label="Interpretación"
                                              value={
                                                [peligro.evaluacion?.interpProbabilidad, peligro.evaluacion?.interpRiesgo, peligro.evaluacion?.aceptabilidad]
                                                  .filter(Boolean)
                                                  .join(' | ') || 'Vacío'
                                              }
                                            />
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
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
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
