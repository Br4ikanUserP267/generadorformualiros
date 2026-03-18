import ExcelJS from 'exceljs'
import type { Riesgo } from './types'

const interpretacionColor = (interp?: string) => {
  switch ((interp||'').toLowerCase()) {
    case 'aceptable': return 'FFDCFCE7' // green-ish
    case 'mejorable': return 'FFFFF7CC' // yellow
    case 'aceptable con control especifico': return 'FFFFE6C2' // orange
    case 'no aceptable': return 'FFFEB2B2' // red
    default: return 'FFFFFFFF' // white
  }
}

export async function exportRisksToExcel(riesgos: Riesgo[], filename = 'matriz_riesgos.xlsx') {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Matriz de Riesgos'
  wb.created = new Date()

  const ws = wb.addWorksheet('Matriz')

  // Define columns (order and widths)
  ws.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Área / Proceso', key: 'proceso', width: 28 },
    { header: 'Zona / Lugar', key: 'zona', width: 20 },
    { header: 'Responsable', key: 'individuo', width: 20 },
    { header: 'Cargo', key: 'cargo', width: 18 },
    { header: 'Clasificación', key: 'clasificacion', width: 18 },
    { header: 'Deficiencia (ND)', key: 'deficiencia', width: 12 },
    { header: 'Exposición (NE)', key: 'exposicion', width: 12 },
    { header: 'Consecuencia (NC)', key: 'consecuencia', width: 12 },
    { header: 'Nivel Riesgo (valor)', key: 'nivel', width: 18 },
    { header: 'Interpretación', key: 'interpretacion', width: 20 },
    { header: 'Aceptabilidad', key: 'aceptabilidad', width: 20 },
    { header: 'Descripción del Peligro', key: 'peligro_desc', width: 40 },
    { header: 'Efectos', key: 'efectos', width: 40 },
    { header: 'Controles / Medidas', key: 'controles', width: 40 },
    { header: 'Intervención / Seguimiento', key: 'intervencion', width: 30 },
    { header: 'Número Expuestos', key: 'num_expuestos', width: 14 },
    { header: 'Peor Consecuencia', key: 'peor_consecuencia', width: 24 },
    { header: 'Requisito Legal', key: 'requisito_legal', width: 16 },
    { header: 'Fecha Elaboración', key: 'fecha', width: 14 },
    { header: 'Fecha Actualización', key: 'fecha_ejecucion', width: 16 }
  ]

  // Header style
  ws.getRow(1).font = { bold: true }
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
  ws.getRow(1).height = 22
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } }

  // Add rows
  for (const r of riesgos) {
    const { nivel, valor } = (function() {
      // try to calculate from fields if present
      const nd = Number((r.deficiencia ?? 0))
      const ne = Number((r.exposicion ?? 0))
      const nc = Number((r.consecuencia ?? 0))
      const prob = nd * ne
      const nivelVal = prob * nc
      // interpretacion mapping (simple)
      let interp = ''
      if (nivelVal === 0) interp = ''
      else if (nivelVal <= 20) interp = 'IV'
      else if (nivelVal <= 120) interp = 'III'
      else if (nivelVal <= 500) interp = 'II'
      else interp = 'I'
      return { nivel: interp, valor: nivelVal }
    })()

    const row = ws.addRow({
      id: r.id,
      proceso: r.proceso,
      zona: r.zona,
      individuo: r.individuo,
      cargo: r.cargo,
      clasificacion: r.clasificacion,
      deficiencia: r.deficiencia,
      exposicion: r.exposicion,
      consecuencia: r.consecuencia,
      nivel: `${nivel} (${valor})`,
      interpretacion: r.interpretacion_nivel_riesgo || '',
      aceptabilidad: r.aceptabilidad || '',
      peligro_desc: r.peligro_desc || '',
      efectos: r.efectos || '',
      controles: (r.controles || '') + '\n' + (r.control_eliminacion || '') + '\n' + (r.control_sustitucion || '') + '\n' + (r.control_ingenieria || '') + '\n' + (r.control_admin || '') + '\n' + (r.epp || ''),
      intervencion: r.intervencion || r.seguimiento || '',
      num_expuestos: r.num_expuestos ?? '',
      peor_consecuencia: r.peor_consecuencia || '',
      requisito_legal: r.requisito_legal || '',
      fecha: r.fecha || '',
      fecha_ejecucion: r.fecha_ejecucion || ''
    })

    // wrap text for long columns
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.alignment = { wrapText: true, vertical: 'top', horizontal: colNumber <= 6 ? 'left' : 'left' }
      // small font for dense reports
      cell.font = { name: 'Arial', size: 10 }
    })

    // Apply background color based on interpretación or aceptabilidad
    const color = interpretacionColor(r.aceptabilidad || (r.interpretacion_nivel_riesgo || ''))
    row.getCell('interpretacion').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
    row.getCell('aceptabilidad').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
  }

  // Auto filter and freeze header
  ws.autoFilter = { from: 'A1', to: ws.getRow(1).lastCell ? ws.getRow(1).lastCell.address : 'A1' }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function exportAreaMatrixToExcel(matrix: import("./types").AreaMatrix, filename = undefined) {
  const name = filename || `${matrix.area_nombre || 'area'}_matriz.xlsx`
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Matriz de Riesgos'
  wb.created = new Date()

  const ws = wb.addWorksheet('Matriz')

  // Header rows with area info
  ws.addRow([`Área: ${matrix.area_nombre || ''}`])
  ws.addRow([`Responsable: ${matrix.responsable || ''}`])
  ws.addRow([`Fecha Elaboración: ${matrix.fecha_elaboracion || ''}`])
  ws.addRow([`Fecha Actualización: ${matrix.fecha_actualizacion || ''}`])
  ws.addRow([])

  // columns
  ws.columns = [
    { header: 'Proceso', key: 'proceso', width: 24 },
    { header: 'Zona', key: 'zona', width: 18 },
    { header: 'Cargo', key: 'cargo', width: 18 },
    { header: 'Actividad', key: 'actividad', width: 30 },
    { header: 'Tarea', key: 'tarea', width: 24 },
    { header: 'Peligro', key: 'peligro', width: 32 },
    { header: 'Clasificación', key: 'clasificacion', width: 18 },
    { header: 'Efectos', key: 'efectos', width: 32 },
    { header: 'ND', key: 'nd', width: 8 },
    { header: 'NE', key: 'ne', width: 8 },
    { header: 'NP', key: 'np', width: 10 },
    { header: 'NC', key: 'nc', width: 8 },
    { header: 'Nivel Riesgo', key: 'nivel', width: 14 },
    { header: 'Interpretación', key: 'interpretacion', width: 12 },
    { header: 'Aceptabilidad', key: 'aceptabilidad', width: 16 },
    { header: 'Controles', key: 'controles', width: 30 },
    { header: 'Intervención', key: 'intervencion', width: 24 },
    { header: 'Num Expuestos', key: 'num_expuestos', width: 12 },
    { header: 'Peor Consecuencia', key: 'peor_consecuencia', width: 24 },
    { header: 'Requisito Legal', key: 'requisito_legal', width: 18 }
  ]

  // header style
  ws.getRow(6).font = { bold: true }
  ws.getRow(6).alignment = { vertical: 'middle', horizontal: 'center' }

  for (const r of matrix.filas) {
    const np = Number(r.nivel_probabilidad ?? 0)
    const nivel = Number(r.nivel_riesgo ?? 0)
    ws.addRow({
      proceso: r.proceso,
      zona: r.zona,
      cargo: r.cargo,
      actividad: r.actividad,
      tarea: r.tarea,
      peligro: r.peligro_descripcion,
      clasificacion: r.peligro_clasificacion,
      efectos: r.efectos_posibles,
      nd: r.nivel_deficiencia,
      ne: r.nivel_exposicion,
      np: np,
      nc: r.nivel_consecuencia,
      nivel: nivel,
      interpretacion: r.interpretacion_riesgo || '',
      aceptabilidad: r.aceptabilidad || '',
      controles: [r.control_fuente, r.control_medio, r.control_individuo].filter(Boolean).join('\n'),
      intervencion: r.intervencion || '',
      num_expuestos: r.numero_expuestos || '',
      peor_consecuencia: r.peor_consecuencia || '',
      requisito_legal: r.requisito_legal || ''
    })
  }

  ws.eachRow((row, rowNumber) => {
    row.eachCell((cell) => {
      cell.alignment = { wrapText: true, vertical: 'top' }
      cell.font = { name: 'Arial', size: 10 }
    })
  })

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export async function exportNestedAreaToExcel(area: import("./types").AreaNested, filename = undefined) {
  const name = filename || `${area.nombre || 'area'}_matriz.xlsx`
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Matriz de Riesgos'
  wb.created = new Date()

  const ws = wb.addWorksheet('Matriz')

  // Header rows with area info
  ws.addRow([`Área: ${area.nombre || ''}`])
  ws.addRow([`Responsable: ${area.responsable || ''}`])
  ws.addRow([`Fecha Elaboración: ${area.fecha_elaboracion || ''}`])
  ws.addRow([`Fecha Actualización: ${area.fecha_actualizacion || ''}`])
  ws.addRow([])

  ws.columns = [
    { header: 'Área', key: 'area', width: 18 },
    { header: 'Zona', key: 'zona', width: 18 },
    { header: 'Actividad', key: 'actividad', width: 24 },
    { header: 'Tarea', key: 'tarea', width: 24 },
    { header: 'Proceso', key: 'proceso', width: 24 },
    { header: 'Cargo', key: 'cargo', width: 16 },
    { header: 'Clasificación', key: 'clasificacion', width: 18 },
    { header: 'Nivel Deficiencia', key: 'deficiencia', width: 12 },
    { header: 'Nivel Exposición', key: 'exposicion', width: 12 },
    { header: 'Nivel Probabilidad', key: 'probabilidad', width: 12 },
    { header: 'Nivel Consecuencia', key: 'consecuencia', width: 12 },
    { header: 'Nivel Riesgo', key: 'nivel_riesgo', width: 14 },
    { header: 'Interpretación Nivel Riesgo', key: 'interpretacion', width: 16 },
    { header: 'Aceptabilidad', key: 'aceptabilidad', width: 16 },
    { header: 'Descripción del Peligro', key: 'peligro_desc', width: 40 },
    { header: 'Efectos', key: 'efectos', width: 40 },
    { header: 'Controles', key: 'controles', width: 40 },
    { header: 'Intervención', key: 'intervencion', width: 24 },
    { header: 'Número Expuestos', key: 'num_expuestos', width: 12 },
    { header: 'Peor Consecuencia', key: 'peor_consecuencia', width: 24 },
    { header: 'Requisito Legal', key: 'requisito_legal', width: 18 }
  ]

  // header style
  ws.getRow(6).font = { bold: true }
  ws.getRow(6).alignment = { vertical: 'middle', horizontal: 'center' }

  for (const z of area.zonas || []) {
    for (const act of z.actividades || []) {
      for (const t of act.tareas || []) {
        for (const r of t.riesgos || []) {
          const calc = (function() {
            const nd = Number(r.deficiencia ?? 0)
            const ne = Number(r.exposicion ?? 1) || 1
            const nc = Number(r.consecuencia ?? 0)
            const prob = nd * ne
            const nivelVal = prob * nc
            return { prob, nivelVal }
          })()

          ws.addRow({
            area: area.nombre,
            zona: z.nombre,
            actividad: act.nombre,
            tarea: t.nombre,
            proceso: r.proceso || '',
            cargo: r.cargo || '',
            clasificacion: r.clasificacion || '',
            deficiencia: r.deficiencia ?? '',
            exposicion: r.exposicion ?? '',
            probabilidad: calc.prob,
            consecuencia: r.consecuencia ?? '',
            nivel_riesgo: calc.nivelVal,
            interpretacion: (r.interpretacion_nivel_riesgo || ''),
            aceptabilidad: r.aceptabilidad || '',
            peligro_desc: r.peligro_desc || '',
            efectos: r.efectos || '',
            controles: [r.controles || '', r.control_eliminacion || '', r.control_sustitucion || '', r.control_ingenieria || '', r.control_admin || '', r.epp || ''].filter(Boolean).join('\n'),
            intervencion: r.intervencion || '',
            num_expuestos: r.num_expuestos ?? '',
            peor_consecuencia: r.peor_consecuencia || '',
            requisito_legal: r.requisito_legal || ''
          })
        }
      }
    }
  }

  ws.eachRow((row) => {
    row.eachCell((cell) => {
      cell.alignment = { wrapText: true, vertical: 'top' }
      cell.font = { name: 'Arial', size: 10 }
    })
  })

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// Generic wrapper used by dashboard and other pages — accepts single record or array
export async function exportToExcel(records: any[] | any) {
  if (Array.isArray(records)) {
    // attempt to use exportRisksToExcel for arrays of flat riesgos
    return exportRisksToExcel(records as any[])
  }
  // single record: if it looks like an area matrix, use area export, otherwise treat as single riesgo
  const r = records as any
  if (r && (r.filas || r.zonas || r.procesos)) {
    // try nested area
    try { return await exportAreaMatrixToExcel(r) } catch (e) {}
  }
  return exportRisksToExcel([r])
}
