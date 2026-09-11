import React from 'react'
import {
  Zap,
  Thermometer,
  Biohazard,
  FlaskConical,
  Activity,
  Brain,
  Volume2,
  Radiation,
  Flame,
  Wrench,
  CloudRain,
  ShieldAlert,
  AlertTriangle,
  HeartHandshake,
  Footprints,
  Sun,
  Eye,
  Layers,
} from 'lucide-react'

export interface RiskIconConfig {
  icon: React.ComponentType<{ className?: string }>
  bg: string
  text: string
  border: string
  label: string
}

/**
 * Resolves a contextual hazard icon and visual tone based on:
 * 1. Structured classification (clasificacion)
 * 2. Description keywords (fallback/refinement)
 */
export function resolveRiskIcon(params: {
  clasificacion?: string | null
  descripcion?: string | null
}): RiskIconConfig {
  const clasificacion = (params.clasificacion || '').toUpperCase().trim()
  const desc = (params.descripcion || '').toUpperCase().trim()

  // 1. BIOMECÁNICO / ERGONÓMICO
  if (
    clasificacion.includes('BIOMECANIC') ||
    clasificacion.includes('BIOMECÁNIC') ||
    clasificacion.includes('ERGONOM') ||
    desc.includes('POSTURA') ||
    desc.includes('CARGA') ||
    desc.includes('LEVANTAMIENTO') ||
    desc.includes('ESFUERZO') ||
    desc.includes('MOVIMIENTO REPETITIVO')
  ) {
    return {
      icon: Activity,
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200',
      label: 'Biomecánico',
    }
  }

  // 2. ELÉCTRICO
  if (
    clasificacion.includes('ELECTRIC') ||
    clasificacion.includes('ELÉCTRIC') ||
    desc.includes('ELECTR') ||
    desc.includes('CORRIENTE') ||
    desc.includes('ALTA TENSION') ||
    desc.includes('CIRCUITO') ||
    desc.includes('TOMACORRIENTE') ||
    desc.includes('CABLE')
  ) {
    return {
      icon: Zap,
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'border-blue-200',
      label: 'Eléctrico',
    }
  }

  // 3. FÍSICO
  if (clasificacion.includes('FISIC') || clasificacion.includes('FÍSIC')) {
    // Thermal / Temperature
    if (
      desc.includes('TERMICO') ||
      desc.includes('TÉRMICO') ||
      desc.includes('CALOR') ||
      desc.includes('FRIO') ||
      desc.includes('FRÍO') ||
      desc.includes('TEMPERATURA')
    ) {
      return {
        icon: Thermometer,
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200',
        label: 'Físico (Térmico)',
      }
    }
    // Noise / Vibration
    if (
      desc.includes('RUIDO') ||
      desc.includes('SONIDO') ||
      desc.includes('VIBRAC')
    ) {
      return {
        icon: Volume2,
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        label: 'Físico (Ruido/Vibración)',
      }
    }
    // Radiation / Illuminance
    if (
      desc.includes('RADIAC') ||
      desc.includes('RAYOS') ||
      desc.includes('ILUMINAC') ||
      desc.includes('LUZ')
    ) {
      return {
        icon: Radiation,
        bg: 'bg-orange-50',
        text: 'text-orange-600',
        border: 'border-orange-200',
        label: 'Físico (Radiación)',
      }
    }
    // Default Físico
    return {
      icon: Thermometer,
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200',
      label: 'Físico',
    }
  }

  // 4. BIOLÓGICO
  if (
    clasificacion.includes('BIOLOGIC') ||
    clasificacion.includes('BIOLÓGIC') ||
    desc.includes('VIRUS') ||
    desc.includes('BACTERIA') ||
    desc.includes('FLUIDO') ||
    desc.includes('MICROORGANISMO') ||
    desc.includes('INFECC') ||
    desc.includes('SANGRE') ||
    desc.includes('CORTO PUNZANTE') ||
    desc.includes('MORDEDURA') ||
    desc.includes('PICADURA')
  ) {
    return {
      icon: Biohazard,
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      label: 'Biológico',
    }
  }

  // 5. QUÍMICO
  if (
    clasificacion.includes('QUIMIC') ||
    clasificacion.includes('QUÍMIC') ||
    desc.includes('GAS') ||
    desc.includes('VAPOR') ||
    desc.includes('POLVO') ||
    desc.includes('LIQUIDO') ||
    desc.includes('LÍQUIDO') ||
    desc.includes('SUSTANCIA') ||
    desc.includes('REACTIVO') ||
    desc.includes('AEROSOL') ||
    desc.includes('SOLVENTE')
  ) {
    return {
      icon: FlaskConical,
      bg: 'bg-fuchsia-50',
      text: 'text-fuchsia-600',
      border: 'border-fuchsia-200',
      label: 'Químico',
    }
  }

  // 6. PSICOSOCIAL
  if (
    clasificacion.includes('PSICOSOCIAL') ||
    clasificacion.includes('PSICOLOG') ||
    desc.includes('ESTRES') ||
    desc.includes('ESTRÉS') ||
    desc.includes('JORNADA') ||
    desc.includes('CARGA MENTAL') ||
    desc.includes('ACOSO') ||
    desc.includes('TURNO')
  ) {
    return {
      icon: Brain,
      bg: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200',
      label: 'Psicosocial',
    }
  }

  // 7. CONDICIONES DE SEGURIDAD / LOCATIVO / MECÁNICO / TECNOLÓGICO
  if (
    clasificacion.includes('SEGURIDAD') ||
    clasificacion.includes('LOCATIV') ||
    clasificacion.includes('MECANIC') ||
    clasificacion.includes('MECÁNIC') ||
    clasificacion.includes('TECNOLOG') ||
    clasificacion.includes('TECNOLÓG') ||
    clasificacion.includes('TRANSITO') ||
    clasificacion.includes('TRÁNSITO') ||
    clasificacion.includes('PUBLICO') ||
    clasificacion.includes('PÚBLICO')
  ) {
    // Fire / Explosion
    if (
      desc.includes('INCENDIO') ||
      desc.includes('EXPLOS') ||
      desc.includes('FUEGO') ||
      desc.includes('COMBUST')
    ) {
      return {
        icon: Flame,
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        label: 'Seguridad (Incendio/Explosión)',
      }
    }
    // Mechanical / Machinery / Tools
    if (
      desc.includes('HERRAMIENTA') ||
      desc.includes('MAQUINA') ||
      desc.includes('MÁQUINA') ||
      desc.includes('ATRAPAMIENTO') ||
      desc.includes('CORTE') ||
      desc.includes('PROYECCION') ||
      desc.includes('EQUIPO')
    ) {
      return {
        icon: Wrench,
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        label: 'Seguridad (Mecánico)',
      }
    }
    // Locativo / Fall / Height / Stairs
    if (
      desc.includes('CAIDA') ||
      desc.includes('CAÍDA') ||
      desc.includes('ALTURA') ||
      desc.includes('PISO') ||
      desc.includes('ESCALERA') ||
      desc.includes('DESNIVEL') ||
      desc.includes('ORDEN') ||
      desc.includes('ASEO')
    ) {
      return {
        icon: AlertTriangle,
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        label: 'Seguridad (Locativo)',
      }
    }

    return {
      icon: ShieldAlert,
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      label: 'Condiciones de Seguridad',
    }
  }

  // 8. FENÓMENOS NATURALES
  if (
    clasificacion.includes('NATURAL') ||
    desc.includes('SISMO') ||
    desc.includes('TERREMOTO') ||
    desc.includes('INUNDAC') ||
    desc.includes('LLUVIA') ||
    desc.includes('TORMENTA') ||
    desc.includes('VENDAVAL')
  ) {
    return {
      icon: CloudRain,
      bg: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-200',
      label: 'Fenómenos Naturales',
    }
  }

  // 9. DEFAULT FALLBACK
  return {
    icon: ShieldAlert,
    bg: 'bg-[#eef7f0]',
    text: 'text-[#1F7D3E]',
    border: 'border-[#d1e2d6]',
    label: clasificacion || 'Peligro',
  }
}
