/**
 * Type definitions for Matrix Differential Persistence Architecture.
 */

export interface IncomingFile {
  name?: string
  type?: string
  data?: string
  url?: string
}

export interface IncomingControl {
  fuente?: string | null
  medio?: string | null
  individuo?: string | null
}

export interface IncomingEvaluacion {
  nd?: number | string | null
  ne?: number | string | null
  nc?: number | string | null
  np?: number | string | null
  nr?: number | string | null
  interp_np?: string | null
  interp_nr?: string | null
  aceptabilidad?: string | null
}

export interface IncomingCriterios {
  num_expuestos?: number | string | null
  peor_consecuencia?: string | null
  requisito_legal?: boolean | null
}

export interface IncomingIntervencion {
  eliminacion?: string | null
  sustitucion?: string | null
  controles_ingenieria?: string | null
  controles_administrativos?: string | null
  epp?: string | null
  responsable?: string | null
  fecha_ejecucion?: string | null
}

export interface IncomingPeligro {
  id?: string
  catalogoPeligroId?: string | null
  codigo?: string | null
  descripcion?: string | null
  clasificacion?: string | null
  efectos?: string | null
  orden?: number | null
  numero?: number | null
  controles?: IncomingControl | null
  evaluacion?: IncomingEvaluacion | null
  evaluacionPost?: IncomingEvaluacion | null
  criterios?: IncomingCriterios | null
  intervencion?: IncomingIntervencion | null
  planesAccion?: any[]
  _ui?: any
}

export interface IncomingActividad {
  id?: string
  nombre?: string
  descripcion?: string | null
  tareas?: string | null
  cargo?: string | null
  rutinario?: boolean | null
  orden?: number | null
  peligros?: IncomingPeligro[]
}

export interface IncomingZona {
  id?: string
  nombre?: string
  orden?: number | null
  cargo?: string | null
  rutinario?: boolean | null
  actividades?: IncomingActividad[]
}

export interface IncomingProceso {
  id?: string
  nombre?: string
  orden?: number | null
  zonas?: IncomingZona[]
}

export interface IncomingMatrixPayload {
  id?: string
  area?: string | null
  responsable?: string | null
  fecha_elaboracion?: string | null
  fecha_actualizacion?: string | null
  lastUpdatedAt?: string | null
  files?: IncomingFile[]
  procesos?: IncomingProceso[]
}

export interface IdReconciliationMap {
  procesos: Record<string, string>
  zonas: Record<string, string>
  actividades: Record<string, string>
  peligros: Record<string, string>
}

export interface PersistenceOperationStats {
  matrixUpdated: boolean
  filesCreated: number
  filesDeleted: number
  processesCreated: number
  processesUpdated: number
  processesDeleted: number
  zonesCreated: number
  zonesUpdated: number
  zonesDeleted: number
  activitiesCreated: number
  activitiesUpdated: number
  activitiesDeleted: number
  hazardsCreated: number
  hazardsUpdated: number
  hazardsDeleted: number
  controlsCreated: number
  controlsUpdated: number
  controlsDeleted: number
  evaluationsCreated: number
  evaluationsUpdated: number
  evaluationsDeleted: number
  criteriaCreated: number
  criteriaUpdated: number
  criteriaDeleted: number
  interventionsCreated: number
  interventionsUpdated: number
  interventionsDeleted: number
  totalMutations: number
}

export interface SyncMatrixResult {
  id: string
  updatedAt: Date
  idMap: IdReconciliationMap
  stats: PersistenceOperationStats
  durationMs: number
}
