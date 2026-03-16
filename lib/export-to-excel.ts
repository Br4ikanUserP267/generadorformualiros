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
