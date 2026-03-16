// TypeScript interfaces that map to the SQL schema (helpful for server/ORM code)
import type { ArchivoAdjunto, Riesgo as AppRiesgo } from './types'

export interface UsuarioRow {
  id: number
  nombre: string
  email?: string | null
  cargo?: string | null
  created_at: string
  updated_at: string
}

export interface AreaRow {
  id: number
  nombre: string
  descripcion?: string | null
  created_at: string
  updated_at: string
}

export interface ClasificacionRow {
  id: number
  nombre: string
  created_at: string
}

export interface RiesgoRow {
  id: number
  proceso: string
  zona: string
  actividad?: string | null
  tarea?: string | null
  cargo?: string | null
  rutinario: boolean
  clasificacion_id?: number | null
  clasificacion?: string | null
  peligro_desc: string
  efectos: string
  deficiencia: number
  exposicion: number
  consecuencia: number
  controles?: string | null
  intervencion?: string | null
  fecha?: string | null // ISO date
  fecha_ejecucion?: string | null
  seguimiento?: string | null
  fuente?: string | null
  medio?: string | null
  individuo?: string | null
  probabilidad?: number | null
  interpretacion_probabilidad?: string | null
  nivel_riesgo?: number | null
  interpretacion_nivel_riesgo?: string | null
  aceptabilidad?: string | null
  num_expuestos?: number | null
  peor_consecuencia?: string | null
  requisito_legal?: string | null
  senalizacion?: string | null
  advertencia?: string | null
  control_eliminacion?: string | null
  control_sustitucion?: string | null
  control_ingenieria?: string | null
  control_admin?: string | null
  epp?: string | null
  created_at: string
  updated_at: string
}

export interface ArchivoRow {
  id: string
  riesgo_id: number
  nombre: string
  tipo?: string | null
  tamano?: number | null
  url?: string | null
  fecha_subida: string
}

// Helper: map a DB row to application model
export function mapRiesgoRowToApp(row: RiesgoRow, archivos: ArchivoRow[] = []): AppRiesgo {
  return {
    id: row.id,
    proceso: row.proceso,
    zona: row.zona,
    actividad: row.actividad || '',
    tarea: row.tarea || '',
    cargo: row.cargo || '',
    rutinario: !!row.rutinario,
    clasificacion: row.clasificacion || '',
    peligro_desc: row.peligro_desc || '',
    efectos: row.efectos || '',
    deficiencia: row.deficiencia || 0,
    exposicion: row.exposicion || 0,
    consecuencia: row.consecuencia || 0,
    controles: row.controles || '',
    intervencion: row.intervencion || '',
    fecha: row.fecha || '',
    seguimiento: row.seguimiento || '',
    archivos: archivos.map(a => ({ id: a.id, nombre: a.nombre, tipo: a.tipo || '', tamano: a.tamano || 0, url: a.url || '', fechaSubida: a.fecha_subida })),
    fuente: row.fuente || undefined,
    medio: row.medio || undefined,
    individuo: row.individuo || undefined,
    probabilidad: row.probabilidad || undefined,
    interpretacion_probabilidad: row.interpretacion_probabilidad || undefined,
    nivel_riesgo: row.nivel_riesgo || undefined,
    interpretacion_nivel_riesgo: row.interpretacion_nivel_riesgo || undefined,
    aceptabilidad: row.aceptabilidad || undefined,
    num_expuestos: row.num_expuestos || undefined,
    peor_consecuencia: row.peor_consecuencia || undefined,
    requisito_legal: row.requisito_legal || undefined,
    senalizacion: row.senalizacion || undefined,
    advertencia: row.advertencia || undefined,
    control_eliminacion: row.control_eliminacion || undefined,
    control_sustitucion: row.control_sustitucion || undefined,
    control_ingenieria: row.control_ingenieria || undefined,
    control_admin: row.control_admin || undefined,
    epp: row.epp || undefined,
    fecha_ejecucion: row.fecha_ejecucion || undefined
  }
}
