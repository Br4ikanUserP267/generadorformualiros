import { randomUUID } from 'crypto'

export type ImportRowError = {
  row: number
  field: string
  message: string
}

export type ImportPreviewRow = {
  proceso: string
  zona: string
  actividad: string
  descripcionActividad: string
  tareas: string
  cargo: string
  rutinario: string
  peligro: string
  clasificacion: string
  efectos: string
  controlFuente: string
  controlMedio: string
  controlIndividuo: string
  nd: number | null
  ne: number | null
  nc: number | null
  nivelProbabilidad: number | null
  interpretacionProbabilidad: string
  nivelRiesgo: number | null
  interpretacionNivelRiesgo: string
  valoracionRiesgo: string
  numeroExpuestos: number | null
  peorConsecuencia: string
  requisitoLegal: string
  eliminacion: string
  sustitucion: string
  controlesIngenieria: string
  controlesAdministrativos: string
  epp: string
  responsableIntervencion: string
  fechaEjecucion: string | null
}

export type ParsedPeligro = {
  descripcion: string
  clasificacion: string
  efectosPosibles: string
  control: {
    fuente: string
    medio: string
    individuo: string
  }
  evaluacion: {
    nivelDeficiencia: number | null
    nivelExposicion: number | null
    nivelConsecuencia: number | null
    nivelProbabilidad: number | null
    nivelRiesgo: number | null
    interpProbabilidad: string
    interpRiesgo: string
    aceptabilidad: string
  }
  criterio: {
    numExpuestos: number | null
    peorConsecuencia: string
    requisitoLegal: boolean
  }
  intervencion: {
    eliminacion: string
    sustitucion: string
    controlesIngenieria: string
    controlesAdministrativos: string
    epp: string
    responsable: string
    fechaEjecucion: string | null
  }
}

export type ParsedActividad = {
  nombre: string
  descripcion: string
  tareas: string
  cargo: string
  rutinario: boolean
  peligros: ParsedPeligro[]
}

export type ParsedZona = {
  nombre: string
  actividades: ParsedActividad[]
}

export type ParsedProceso = {
  nombre: string
  zonas: ParsedZona[]
}

export type ParsedImport = {
  metadata: {
    area: string
    responsable: string
    fechaElaboracion: string
    fechaActualizacion: string
  }
  procesos: ParsedProceso[]
}

export type StoredImport = {
  id: string
  createdAt: number
  expiresAt: number
  totalRows: number
  validRows: number
  errors: ImportRowError[]
  preview: ImportPreviewRow[]
  metadata: ParsedImport['metadata']
  parsed: ParsedImport
}

const TTL_MS = 10 * 60 * 1000

type ImportMap = Map<string, StoredImport>

declare global {
  // eslint-disable-next-line no-var
  var __riesgosImportStore: ImportMap | undefined
}

const store: ImportMap = global.__riesgosImportStore || new Map<string, StoredImport>()
if (!global.__riesgosImportStore) global.__riesgosImportStore = store

function purgeExpired() {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (value.expiresAt <= now) store.delete(key)
  }
}

export function saveImport(input: Omit<StoredImport, 'id' | 'createdAt' | 'expiresAt'>): StoredImport {
  purgeExpired()
  const now = Date.now()
  const id = randomUUID()
  const saved: StoredImport = {
    ...input,
    id,
    createdAt: now,
    expiresAt: now + TTL_MS,
  }
  store.set(id, saved)
  return saved
}

export function getImport(importId: string): StoredImport | null {
  purgeExpired()
  const entry = store.get(importId)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    store.delete(importId)
    return null
  }
  return entry
}

export function removeImport(importId: string) {
  store.delete(importId)
}
