export interface ArchivoAdjunto {
  id: string
  nombre: string
  tipo: string
  tamano: number
  url: string
  fechaSubida: string
}

export interface Riesgo {
  id: number
  area: string
  proceso: string
  responsable: string
  individuo: string
  zona: string
  actividad: string
  tarea: string
  cargo: string
  rutinario: boolean
  clasificacion: string
  peligro_desc: string
  efectos: string
  deficiencia: number
  exposicion: number
  consecuencia: number
  controles: string
  intervencion: string
  fecha: string
  seguimiento: string
  archivos?: ArchivoAdjunto[]
  // Additional optional fields to support extended form columns
  fuente?: string
  medio?: string
  probabilidad?: number
  interpretacion_probabilidad?: string
  nivel_riesgo?: number
  interpretacion_nivel_riesgo?: string
  aceptabilidad?: string
  num_expuestos?: number
  peor_consecuencia?: string
  requisito_legal?: string
  senalizacion?: string
  advertencia?: string
  control_eliminacion?: string
  control_sustitucion?: string
  control_ingenieria?: string
  control_admin?: string
  epp?: string
  fecha_ejecucion?: string
  tipo_proceso?: string
}

export type MatrixRow = {
  proceso: string
  zona: string
  actividad: string
  tarea: string
  cargo: string
  rutinario: boolean

  peligro_descripcion: string
  peligro_clasificacion: string
  efectos_posibles: string

  control_fuente: string
  control_medio: string
  control_individuo: string

  nivel_deficiencia: number
  nivel_exposicion: number

  nivel_probabilidad?: number
  interpretacion_probabilidad?: string

  nivel_consecuencia: number

  nivel_riesgo?: number
  interpretacion_riesgo?: string
  aceptabilidad?: string

  numero_expuestos: number
  peor_consecuencia: string
  requisito_legal: string

  eliminacion: string
  sustitucion: string
  ingenieria: string
  administrativos: string
  epp: string

  intervencion: string
  fecha_ejecucion: string
}

export type AreaMatrix = {
  area_nombre: string
  responsable: string
  fecha_elaboracion: string
  fecha_actualizacion: string
  filas: MatrixRow[]
}

// Nested structures for Area → Zona → Actividad → Tarea → Riesgo
export type RiesgoNested = Riesgo

export type Tarea = {
  id: string
  nombre: string
  descripcion?: string
  rutinario?: boolean
  riesgos: RiesgoNested[]
}

export type Actividad = {
  id: string
  nombre: string
  descripcion?: string
  cargo?: string
  tareas: Tarea[]
}

export type Zona = {
  id: string
  nombre: string
  actividades: Actividad[]
}

export type Proceso = {
  id: string
  nombre: string
  zonas: Zona[]
}

export type AreaNested = {
  id: string
  nombre: string
  responsable: string
  fecha_elaboracion: string
  fecha_actualizacion: string
  procesos: Proceso[]
}

export interface Configuracion {
  id: number
  nombre: string
  codigo: string
  version: string
  fecha: string
  defecto_deficiencia: number
  defecto_exposicion: number
  defecto_consecuencia: number
}

export type RiskLevel = 'bajo' | 'medio' | 'alto' | 'critico'

export function calcularNivelRiesgo(deficiencia: number, exposicion: number, consecuencia: number): { nivel: RiskLevel; valor: number } {
  const valor = deficiencia * exposicion * consecuencia
  
  if (valor <= 20) return { nivel: 'bajo', valor }
  if (valor <= 120) return { nivel: 'medio', valor }
  if (valor <= 500) return { nivel: 'alto', valor }
  return { nivel: 'critico', valor }
}

export function getRiskColor(nivel: RiskLevel): string {
  switch (nivel) {
    case 'bajo': return 'bg-[oklch(0.7_0.15_145)]'
    case 'medio': return 'bg-[oklch(0.75_0.18_85)]'
    case 'alto': return 'bg-[oklch(0.65_0.20_50)]'
    case 'critico': return 'bg-[oklch(0.55_0.22_25)]'
  }
}

export function getRiskTextColor(nivel: RiskLevel): string {
  switch (nivel) {
    case 'bajo': return 'text-[oklch(0.25_0.08_145)]'
    case 'medio': return 'text-[oklch(0.25_0.08_85)]'
    case 'alto': return 'text-white'
    case 'critico': return 'text-white'
  }
}

// Interpretación (Romanos I..IV) helpers and color mapping
export function interpretacionFromValor(val: number): string {
  if (!val || val === 0) return ""
  if (val <= 20) return "IV"
  if (val <= 120) return "III"
  if (val <= 500) return "II"
  if (val <= 4000) return "I"
  return "I"
}

export function getInterpretacionColor(interp: string): string {
  switch (interp) {
    // Map desired presentation: I -> red, II -> yellow, III -> green, IV -> green
    case 'I': return 'bg-red-600'
    case 'II': return 'bg-yellow-400'
    case 'III': return 'bg-green-600'
    case 'IV': return 'bg-green-600'
    default: return 'bg-muted'
  }
}

export function getInterpretacionTextColor(interp: string): string {
  switch (interp) {
    case 'II':
      return 'text-black'
    case 'III':
    case 'IV':
    case 'I':
      return 'text-white'
    default:
      return 'text-muted-foreground'
  }
}
