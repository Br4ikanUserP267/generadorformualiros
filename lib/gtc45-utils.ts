export const CLASIFICACIONES_RIESGO = [
  'BIOLÓGICO',
  'BIOMECÁNICO',
  'FÍSICO',
  'QUÍMICO',
  'PSICOSOCIAL',
  'CONDICIONES DE SEGURIDAD',
  'LOCATIVO',
  'MECÁNICO',
  'ELÉCTRICO',
  'TECNOLÓGICO',
  'ACCIDENTES DE TRÁNSITO',
  'PÚBLICO',
  'TRABAJO EN ALTURAS',
  'ESPACIOS CONFINADOS',
  'FENÓMENOS NATURALES',
] as const

export type ClasificacionRiesgo = (typeof CLASIFICACIONES_RIESGO)[number] | string

/**
 * Normaliza cualquier variante de clasificación (eliminando tildes, plurales, mayúsculas/minúsculas y erratas frecuentes)
 * a su forma canónica oficial de la GTC 45 o a un string limpio en mayúsculas.
 */
export function normalizeClasificacion(val?: string | null): string {
  if (!val || typeof val !== 'string') return ''
  const trimmed = val.trim().replace(/\s+/g, ' ')
  if (!trimmed) return ''

  // Descartar registros accidentales numéricos (ej. desfases de cabecera '2', '3', '4')
  if (/^\d+$/.test(trimmed)) return ''

  const clean = trimmed
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  // Match específico por patrones canónicos
  if (clean.includes('BIOMEC') || clean.includes('ERGONOM')) {
    return 'BIOMECÁNICO'
  }
  if (clean.startsWith('BIO')) {
    return 'BIOLÓGICO'
  }
  if (clean.includes('FISI') || clean.includes('FISIC')) {
    return 'FÍSICO'
  }
  if (clean.startsWith('QUIM')) {
    return 'QUÍMICO'
  }
  if (clean.startsWith('PSICO')) {
    return 'PSICOSOCIAL'
  }
  if (clean.includes('TRANSIT')) {
    return 'ACCIDENTES DE TRÁNSITO'
  }
  if (clean.includes('MECANIC')) {
    return 'MECÁNICO'
  }
  if (clean.includes('ELECTR')) {
    return 'ELÉCTRICO'
  }
  if (clean.includes('LOCATIV')) {
    return 'LOCATIVO'
  }
  if (clean.includes('TECNOLOG')) {
    return 'TECNOLÓGICO'
  }
  if (clean.includes('ALTURA')) {
    return 'TRABAJO EN ALTURAS'
  }
  if (clean.includes('CONFINAD')) {
    return 'ESPACIOS CONFINADOS'
  }
  if (clean.includes('PUBLIC')) {
    return 'PÚBLICO'
  }
  if (clean.startsWith('CONDICION') || clean.startsWith('SEGURIDAD')) {
    return 'CONDICIONES DE SEGURIDAD'
  }
  if (clean.includes('NATURAL') || clean.includes('FENOMEN')) {
    return 'FENÓMENOS NATURALES'
  }

  // Si es una clasificación personalizada válida, retornar en mayúsculas limpia
  return trimmed.toUpperCase()
}

export function getClasificacionPrefix(clasificacion: string): string {
  if (!clasificacion) return 'PEL'
  const norm = normalizeClasificacion(clasificacion)
  
  switch (norm) {
    case 'BIOLÓGICO': return 'BIO'
    case 'BIOMECÁNICO': return 'BMC'
    case 'FÍSICO': return 'FIS'
    case 'QUÍMICO': return 'QUI'
    case 'PSICOSOCIAL': return 'PSI'
    case 'CONDICIONES DE SEGURIDAD': return 'SEG'
    case 'LOCATIVO': return 'LOC'
    case 'MECÁNICO': return 'MEC'
    case 'ELÉCTRICO': return 'ELE'
    case 'TECNOLÓGICO': return 'TEC'
    case 'ACCIDENTES DE TRÁNSITO': return 'TRA'
    case 'PÚBLICO': return 'PUB'
    case 'TRABAJO EN ALTURAS': return 'ALT'
    case 'ESPACIOS CONFINADOS': return 'ESP'
    case 'FENÓMENOS NATURALES': return 'NAT'
    default: {
      const clean = norm.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9]/g, '')
      return (clean.slice(0, 3) || 'PEL').padEnd(3, 'X')
    }
  }
}

/**
 * Metadata visual para renderizar badges y opciones de clasificación con estilo premium
 */
export interface ClasificacionStyle {
  bg: string
  text: string
  border: string
  dot: string
  prefix: string
  isStandard: boolean
}

export function getClasificacionStyle(clasificacion: string): ClasificacionStyle {
  const norm = normalizeClasificacion(clasificacion)
  const prefix = getClasificacionPrefix(norm)
  const isStandard = (CLASIFICACIONES_RIESGO as readonly string[]).includes(norm)

  switch (norm) {
    case 'BIOLÓGICO':
      return { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', dot: 'bg-emerald-500', prefix, isStandard }
    case 'BIOMECÁNICO':
      return { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-500', prefix, isStandard }
    case 'FÍSICO':
      return { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', prefix, isStandard }
    case 'QUÍMICO':
      return { bg: 'bg-fuchsia-50', text: 'text-fuchsia-800', border: 'border-fuchsia-200', dot: 'bg-fuchsia-500', prefix, isStandard }
    case 'PSICOSOCIAL':
      return { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200', dot: 'bg-indigo-500', prefix, isStandard }
    case 'CONDICIONES DE SEGURIDAD':
      return { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500', prefix, isStandard }
    case 'LOCATIVO':
      return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', dot: 'bg-slate-500', prefix, isStandard }
    case 'MECÁNICO':
      return { bg: 'bg-zinc-100', text: 'text-zinc-800', border: 'border-zinc-300', dot: 'bg-zinc-500', prefix, isStandard }
    case 'ELÉCTRICO':
      return { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-500', prefix, isStandard }
    case 'TECNOLÓGICO':
      return { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200', dot: 'bg-cyan-500', prefix, isStandard }
    case 'ACCIDENTES DE TRÁNSITO':
      return { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-500', prefix, isStandard }
    case 'PÚBLICO':
      return { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-200', dot: 'bg-stone-500', prefix, isStandard }
    case 'TRABAJO EN ALTURAS':
      return { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200', dot: 'bg-sky-500', prefix, isStandard }
    case 'ESPACIOS CONFINADOS':
      return { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-500', prefix, isStandard }
    case 'FENÓMENOS NATURALES':
      return { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200', dot: 'bg-teal-500', prefix, isStandard }
    default:
      return { bg: 'bg-[#f0f5f1]', text: 'text-[#1F7D3E]', border: 'border-[#dfe9e2]', dot: 'bg-[#1F7D3E]', prefix, isStandard }
  }
}

export function interpProbabilidad(np: number) {
  if (!np) return { label: '', color: '#9CA3AF', key: 'BAJO' }
  if (np <= 4) return { label: 'Bajo', color: '#16a34a', key: 'BAJO' }
  if (np <= 8) return { label: 'Medio', color: '#d97706', key: 'MEDIO' }
  if (np <= 20) return { label: 'Alto', color: '#ea580c', key: 'ALTO' }
  return { label: 'Muy Alto', color: '#dc2626', key: 'MUY_ALTO' }
}

export function interpNivelRiesgo(nr: number) {
  if (!nr) return { label: '', color: '#9CA3AF', level: 'IV', key: 'BAJO' }
  if (nr <= 20) return { label: 'IV - Aceptable', color: '#16a34a', level: 'IV', key: 'BAJO' }
  if (nr <= 120) return { label: 'III - Mejorable', color: '#16a34a', level: 'III', key: 'BAJO' }
  if (nr <= 500) return { label: 'II - Control Específico', color: '#d97706', level: 'II', key: 'MEDIO' }
  return { label: 'I - No Aceptable', color: '#dc2626', level: 'I', key: 'ALTO' }
}

export function aceptabilidadFromNivel(nivel: string): string {
  if (!nivel) return ''
  if (nivel.includes('I -') || nivel === 'I') return 'No Aceptable'
  if (nivel.includes('II -') || nivel === 'II') return 'Aceptable con Control Específico'
  if (nivel.includes('III -') || nivel === 'III') return 'Mejorable'
  if (nivel.includes('IV -') || nivel === 'IV') return 'Aceptable'
  return ''
}

export function calculateGtc45(nd?: number | null, ne?: number | null, nc?: number | null) {
  const numNd = nd !== undefined && nd !== null ? Number(nd) : null
  const numNe = ne !== undefined && ne !== null ? Number(ne) : null
  const numNc = nc !== undefined && nc !== null ? Number(nc) : null

  const np = numNd !== null && numNe !== null ? numNd * numNe : null
  const nr = np !== null && numNc !== null ? np * numNc : null

  const interpNp = np !== null ? interpProbabilidad(np).label : ''
  const interpNrObj = nr !== null ? interpNivelRiesgo(nr) : { label: '', level: '', key: 'BAJO' }
  const interpNr = interpNrObj.label
  const nivelRiesgo = interpNrObj.level
  const aceptabilidad = interpNr ? aceptabilidadFromNivel(interpNr) : ''

  return {
    nd: numNd,
    ne: numNe,
    np,
    interpNp,
    nc: numNc,
    nr,
    interpNr,
    nivelRiesgo,
    aceptabilidad,
    categoryKey: interpNrObj.key,
  }
}
