/**
 * Field comparison and normalization utilities for Matrix Differential Persistence.
 * Ensures updates only execute when database fields genuinely changed.
 */

export function normStr(v: any): string {
  if (v === null || v === undefined) return ''
  return String(v).trim()
}

export function normNum(v: any): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return isNaN(n) ? null : n
}

export function normBool(v: any): boolean {
  return Boolean(v)
}

export function normDateStr(v: any): string {
  if (!v) return ''
  if (v instanceof Date) {
    return v.toISOString().split('T')[0]
  }
  const s = String(v).trim()
  if (!s) return ''
  if (s.includes('T')) return s.split('T')[0]
  return s
}

// 1. Matrix Header Comparison
export function isMatrixHeaderEqual(persisted: any, incoming: any): boolean {
  const pArea = normStr(persisted.area)
  const iArea = normStr(incoming.area)
  if (pArea !== iArea) return false

  const pResp = normStr(persisted.responsable)
  const iResp = normStr(incoming.responsable)
  if (pResp !== iResp) return false

  const pFechElab = normDateStr(persisted.fechaElaboracion)
  const iFechElab = normDateStr(incoming.fecha_elaboracion)
  if (pFechElab !== iFechElab) return false

  const pFechAct = normDateStr(persisted.fechaActualizacion)
  const iFechAct = normDateStr(incoming.fecha_actualizacion)
  if (pFechAct !== iFechAct) return false

  return true
}

// 2. Proceso Comparison
export function isProcesoEqual(persisted: any, incoming: any, expectedOrden: number): boolean {
  if (normStr(persisted.nombre) !== normStr(incoming.nombre)) return false
  const pOrden = typeof persisted.orden === 'number' ? persisted.orden : 0
  const iOrden = typeof incoming.orden === 'number' ? incoming.orden : expectedOrden
  if (pOrden !== iOrden) return false
  return true
}

// 3. Zona Comparison
export function isZonaEqual(persisted: any, incoming: any, expectedOrden: number): boolean {
  if (normStr(persisted.nombre) !== normStr(incoming.nombre)) return false
  const pOrden = typeof persisted.orden === 'number' ? persisted.orden : 0
  const iOrden = typeof incoming.orden === 'number' ? incoming.orden : expectedOrden
  if (pOrden !== iOrden) return false
  return true
}

// 4. Actividad Comparison
export function isActividadEqual(persisted: any, incoming: any, expectedOrden: number): boolean {
  if (normStr(persisted.nombre) !== normStr(incoming.nombre)) return false
  if (normStr(persisted.descripcion) !== normStr(incoming.descripcion)) return false
  if (normStr(persisted.tareas) !== normStr(incoming.tareas)) return false
  if (normStr(persisted.cargo) !== normStr(incoming.cargo)) return false
  if (normBool(persisted.rutinario) !== normBool(incoming.rutinario)) return false
  const pOrden = typeof persisted.orden === 'number' ? persisted.orden : 0
  const iOrden = typeof incoming.orden === 'number' ? incoming.orden : expectedOrden
  if (pOrden !== iOrden) return false
  return true
}

// 5. Peligro Comparison
export function isPeligroEqual(persisted: any, incoming: any, expectedOrden: number): boolean {
  if (normStr(persisted.descripcion) !== normStr(incoming.descripcion)) return false
  if (normStr(persisted.clasificacion) !== normStr(incoming.clasificacion)) return false
  if (normStr(persisted.efectosPosibles) !== normStr(incoming.efectos)) return false
  const pCatId = normStr(persisted.catalogoPeligroId)
  const iCatId = normStr(incoming.catalogoPeligroId)
  if (pCatId !== iCatId) return false
  const pOrden = typeof persisted.orden === 'number' ? persisted.orden : 0
  const iOrden = typeof incoming.orden === 'number' ? incoming.orden : expectedOrden
  if (pOrden !== iOrden) return false
  return true
}

// 6. Control Comparison
export function isControlEqual(persisted: any, incoming: any): boolean {
  if (!persisted && !incoming) return true
  if (!persisted && incoming) {
    // If incoming has only empty strings, it's considered equal to non-existent
    return !normStr(incoming.fuente) && !normStr(incoming.medio) && !normStr(incoming.individuo)
  }
  if (persisted && !incoming) {
    return !normStr(persisted.fuente) && !normStr(persisted.medio) && !normStr(persisted.individuo)
  }
  if (normStr(persisted.fuente) !== normStr(incoming.fuente)) return false
  if (normStr(persisted.medio) !== normStr(incoming.medio)) return false
  if (normStr(persisted.individuo) !== normStr(incoming.individuo)) return false
  return true
}

// 7. Evaluacion Comparison (Inherent & Residual)
export function isEvaluacionEqual(persisted: any, incoming: any): boolean {
  if (!persisted && !incoming) return true
  if (!persisted && incoming) {
    return (
      normNum(incoming.nd) === null &&
      normNum(incoming.ne) === null &&
      normNum(incoming.nc) === null
    )
  }
  if (persisted && !incoming) {
    return (
      persisted.nivelDeficiencia === null &&
      persisted.nivelExposicion === null &&
      persisted.nivelConsecuencia === null
    )
  }

  if (normNum(persisted.nivelDeficiencia) !== normNum(incoming.nd)) return false
  if (normNum(persisted.nivelExposicion) !== normNum(incoming.ne)) return false
  if (normNum(persisted.nivelConsecuencia) !== normNum(incoming.nc)) return false
  if (normNum(persisted.nivelProbabilidad) !== normNum(incoming.np)) return false
  if (normNum(persisted.nivelRiesgo) !== normNum(incoming.nr)) return false
  if (normStr(persisted.interpProbabilidad) !== normStr(incoming.interp_np)) return false
  if (normStr(persisted.interpRiesgo) !== normStr(incoming.interp_nr)) return false
  if (normStr(persisted.aceptabilidad) !== normStr(incoming.aceptabilidad)) return false

  return true
}

// 8. Criterio Comparison
export function isCriterioEqual(persisted: any, incoming: any): boolean {
  if (!persisted && !incoming) return true
  if (!persisted && incoming) {
    return (
      normNum(incoming.num_expuestos) === null &&
      !normStr(incoming.peor_consecuencia) &&
      !normBool(incoming.requisito_legal)
    )
  }
  if (persisted && !incoming) {
    return (
      persisted.numExpuestos === null &&
      !normStr(persisted.peorConsecuencia) &&
      !normBool(persisted.requisitoLegal)
    )
  }

  if (normNum(persisted.numExpuestos) !== normNum(incoming.num_expuestos)) return false
  if (normStr(persisted.peorConsecuencia) !== normStr(incoming.peor_consecuencia)) return false
  if (normBool(persisted.requisitoLegal) !== normBool(incoming.requisito_legal)) return false

  return true
}

// 9. Intervencion Comparison
export function isIntervencionEqual(persisted: any, incoming: any): boolean {
  if (!persisted && !incoming) return true
  if (!persisted && incoming) {
    return (
      !normStr(incoming.eliminacion) &&
      !normStr(incoming.sustitucion) &&
      !normStr(incoming.controles_ingenieria) &&
      !normStr(incoming.controles_administrativos) &&
      !normStr(incoming.epp) &&
      !normStr(incoming.responsable) &&
      !normDateStr(incoming.fecha_ejecucion)
    )
  }
  if (persisted && !incoming) {
    return (
      !normStr(persisted.eliminacion) &&
      !normStr(persisted.sustitucion) &&
      !normStr(persisted.controlesIngenieria) &&
      !normStr(persisted.controlesAdministrativos) &&
      !normStr(persisted.epp) &&
      !normStr(persisted.responsable) &&
      !normDateStr(persisted.fechaEjecucion)
    )
  }

  if (normStr(persisted.eliminacion) !== normStr(incoming.eliminacion)) return false
  if (normStr(persisted.sustitucion) !== normStr(incoming.sustitucion)) return false
  if (normStr(persisted.controlesIngenieria) !== normStr(incoming.controles_ingenieria)) return false
  if (normStr(persisted.controlesAdministrativos) !== normStr(incoming.controles_administrativos)) return false
  if (normStr(persisted.epp) !== normStr(incoming.epp)) return false
  if (normStr(persisted.responsable) !== normStr(incoming.responsable)) return false
  if (normDateStr(persisted.fechaEjecucion) !== normDateStr(incoming.fecha_ejecucion)) return false

  return true
}
