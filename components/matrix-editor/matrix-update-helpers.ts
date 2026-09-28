/**
 * Targeted immutable update helpers for Matrix Editor.
 * Eliminates full-matrix JSON.parse(JSON.stringify(m)) deep cloning.
 * Preserves object and array references for all untouched branches.
 */

export function interpProbabilidad(np: number) {
  if (!np || np <= 0) return { label: '—', color: '#9CA3AF' }
  if (np <= 4) return { label: 'Bajo', color: '#16a34a' } // Verde
  if (np <= 8) return { label: 'Medio', color: '#eab308' } // Amarillo
  if (np <= 20) return { label: 'Alto', color: '#f87171' } // Rojo pastel
  return { label: 'Muy Alto', color: '#b91c1c' } // Rojo Oscuro
}

export function interpNivelRiesgo(nr: number) {
  if (!nr || nr <= 0) return { label: '', color: '#9CA3AF' }
  if (nr <= 20) return { label: 'IV', color: '#16a34a' } // Verde (Aceptable)
  if (nr <= 120) return { label: 'III', color: '#16a34a' } // Verde (Mejorable)
  if (nr <= 500) return { label: 'II', color: '#eab308' } // Amarillo (Aceptable con Control Especifico)
  return { label: 'I', color: '#b91c1c' } // Rojo Oscuro (No Aceptable)
}

export function aceptabilidadFromNivel(label: string) {
  if (!label) return ''
  switch (label) {
    case 'IV':
      return 'Aceptable'
    case 'III':
      return 'Mejorable'
    case 'II':
      return 'Aceptable con Control Especifico'
    case 'I':
      return 'No Aceptable'
    default:
      return ''
  }
}

export function aceptabilidadColor(text: string) {
  if (!text) return '#9CA3AF'
  const norm = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
  if (norm.includes('NO ACEPTABLE') || (norm.startsWith('I') && !norm.startsWith('II') && !norm.startsWith('III') && !norm.startsWith('IV'))) {
    return '#b91c1c' // Rojo Oscuro
  }
  if (norm.includes('CONTROL ESPECIFICO') || norm.startsWith('II')) {
    return '#eab308' // Amarillo
  }
  if (norm.includes('MEJORABLE') || norm.startsWith('III')) {
    return '#16a34a' // Verde
  }
  if (norm.includes('ACEPTABLE') || norm.startsWith('IV')) {
    return '#16a34a' // Verde
  }
  return '#9CA3AF'
}

/**
 * Immutably applies a field update to a hazard and recalculates GTC 45 risk values if needed.
 */
export function applyHazardFieldUpdate(hazard: any, path: string[], value: any) {
  const updated = { ...hazard }

  if (path.length === 1) {
    updated[path[0]] = value
  } else if (path.length === 2) {
    updated[path[0]] = {
      ...(updated[path[0]] || {}),
      [path[1]]: value,
    }
  } else {
    let target = updated
    for (let i = 0; i < path.length - 1; i++) {
      target[path[i]] = { ...(target[path[i]] || {}) }
      target = target[path[i]]
    }
    target[path[path.length - 1]] = value
  }

  // Initial evaluation recalculation (GTC 45)
  if (path[0] === 'evaluacion' && updated.evaluacion) {
    const nd = Number(updated.evaluacion.nd || 0)
    const ne = Number(updated.evaluacion.ne || 0)
    const nc = Number(updated.evaluacion.nc || 0)
    const np = !nd || !ne ? 0 : nd * ne
    const nr = !np || !nc ? 0 : np * nc
    const nivelLabel = interpNivelRiesgo(nr).label

    updated.evaluacion = {
      ...updated.evaluacion,
      np,
      nr,
      interp_np: interpProbabilidad(np).label,
      interp_nr: nivelLabel,
      nivel_riesgo: nivelLabel,
      aceptabilidad: nivelLabel ? aceptabilidadFromNivel(nivelLabel) : '',
    }
  }

  // Residual evaluation recalculation (GTC 45 post-intervention)
  if (path[0] === 'evaluacionPost' && updated.evaluacionPost) {
    const ep = updated.evaluacionPost || {}
    const ndP = Number(ep.nd || 0)
    const neP = Number(ep.ne || 0)
    const ncP = Number(ep.nc || 0)
    const npP = !ndP || !neP ? 0 : ndP * neP
    const nrP = !npP || !ncP ? 0 : npP * ncP
    const nivelLabelP = interpNivelRiesgo(nrP).label

    updated.evaluacionPost = {
      ...ep,
      np: npP,
      nr: nrP,
      interp_np: interpProbabilidad(npP).label,
      interp_nr: nivelLabelP,
      nivel_riesgo: nivelLabelP,
      aceptabilidad: nivelLabelP ? aceptabilidadFromNivel(nivelLabelP) : '',
    }
  }

  return updated
}

/**
 * Updates a single hazard in matrix immutably, preserving references of all untouched processes, zones, activities, and hazards.
 */
export function updateHazardInMatrix(
  matrix: any,
  selected: { procesoId?: string; zonaId?: string; actividadId?: string },
  peligroId: string,
  updater: (p: any) => any
) {
  if (!matrix || !matrix.procesos) return matrix

  let changed = false
  const newProcesos = matrix.procesos.map((proc: any) => {
    if (selected.procesoId && proc.id !== selected.procesoId) return proc

    let procChanged = false
    const newZonas = (proc.zonas || []).map((zona: any) => {
      if (selected.zonaId && zona.id !== selected.zonaId) return zona

      let zonaChanged = false
      const newActividades = (zona.actividades || []).map((act: any) => {
        if (selected.actividadId && act.id !== selected.actividadId) return act

        const peligros = act.peligros || []
        const pIdx = peligros.findIndex((p: any) => p.id === peligroId)
        if (pIdx === -1) return act

        const oldP = peligros[pIdx]
        const newP = updater(oldP)
        if (oldP === newP) return act

        const newPeligros = [...peligros]
        newPeligros[pIdx] = newP
        zonaChanged = true
        return {
          ...act,
          peligros: newPeligros,
        }
      })

      if (!zonaChanged) return zona
      procChanged = true
      return {
        ...zona,
        actividades: newActividades,
      }
    })

    if (!procChanged) return proc
    changed = true
    return {
      ...proc,
      zonas: newZonas,
    }
  })

  if (!changed) return matrix

  return {
    ...matrix,
    procesos: newProcesos,
  }
}

/**
 * Updates an activity in matrix immutably, preserving references of all untouched processes, zones, and other activities.
 */
export function updateActivityInMatrix(
  matrix: any,
  selected: { procesoId?: string; zonaId?: string; actividadId?: string },
  updater: (act: any) => any
) {
  if (!matrix || !matrix.procesos) return matrix

  let changed = false
  const newProcesos = matrix.procesos.map((proc: any) => {
    if (selected.procesoId && proc.id !== selected.procesoId) return proc

    let procChanged = false
    const newZonas = (proc.zonas || []).map((zona: any) => {
      if (selected.zonaId && zona.id !== selected.zonaId) return zona

      let zonaChanged = false
      const newActividades = (zona.actividades || []).map((act: any) => {
        if (selected.actividadId && act.id !== selected.actividadId) return act

        const newAct = updater(act)
        if (newAct === act) return act
        zonaChanged = true
        return newAct
      })

      if (!zonaChanged) return zona
      procChanged = true
      return {
        ...zona,
        actividades: newActividades,
      }
    })

    if (!procChanged) return proc
    changed = true
    return {
      ...proc,
      zonas: newZonas,
    }
  })

  if (!changed) return matrix

  return {
    ...matrix,
    procesos: newProcesos,
  }
}
