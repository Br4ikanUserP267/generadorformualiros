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
  proceso: string
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
