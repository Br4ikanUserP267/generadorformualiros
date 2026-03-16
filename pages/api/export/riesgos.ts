import { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs/promises'
import path from 'path'
import ExcelJS from 'exceljs'

const DATA_FILE = path.join(process.cwd(), 'data', 'riesgos.json')

async function readData() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET,POST')
    return res.status(405).end('Method Not Allowed')
  }

  const data = await readData()
  // Optionally accept ids in POST body to export only a subset
  let items = data
  if (req.method === 'POST') {
    const body = req.body
    if (body && Array.isArray(body.ids)) {
      const ids = body.ids.map((v: any) => Number(v))
      items = data.filter((r: any) => ids.includes(Number(r.id)))
    }
  }

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Matriz de Riesgos'

  // Group by tipo_proceso and create one sheet per type
  const groups: Record<string, any[]> = {}
  for (const r of items) {
    const t = (r.tipo_proceso || 'ASISTENCIAL').toString().toUpperCase()
    groups[t] = groups[t] || []
    groups[t].push(r)
  }

  // Ensure consistent order: ASISTENCIAL, OPERATIVO, ADMINISTRATIVO, then others
  const order = ['ASISTENCIAL', 'OPERATIVO', 'ADMINISTRATIVO']
  const keys = Array.from(new Set([...order, ...Object.keys(groups)])).filter(Boolean)

  for (const k of keys) {
    const rows = groups[k] || []
    if (rows.length === 0) continue

    const ws = wb.addWorksheet(k)
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

    // header styling
    ws.getRow(1).font = { bold: true }
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }
    ws.getRow(1).height = 22
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } }

    // Group rows by `proceso` inside each sheet and add a process header row
    const procGroups: Record<string, any[]> = {}
    for (const r of rows) {
      const p = (r.proceso || 'Sin proceso').toString()
      procGroups[p] = procGroups[p] || []
      procGroups[p].push(r)
    }

    const procKeys = Object.keys(procGroups).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))

    for (const procKey of procKeys) {
      // add a merged row as process header
      const procRow = ws.addRow([`Proceso: ${procKey}`])
      const procRowNum = procRow.number
      ws.mergeCells(procRowNum, 1, procRowNum, ws.columns.length)
      const procCell = ws.getCell(procRowNum, 1)
      procCell.font = { bold: true, name: 'Arial', size: 11 }
      procCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      procCell.alignment = { horizontal: 'left' }

      for (const r of procGroups[procKey]) {
        const nd = Number(r.deficiencia || 0)
        const ne = Number(r.exposicion || 0)
        const nc = Number(r.consecuencia || 0)
        const prob = nd * ne
        const nivelVal = prob * nc
        let nivel = ''
        if (nivelVal === 0) nivel = ''
        else if (nivelVal <= 20) nivel = 'IV'
        else if (nivelVal <= 120) nivel = 'III'
        else if (nivelVal <= 500) nivel = 'II'
        else nivel = 'I'

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
          nivel: `${nivel} (${nivelVal})`,
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

        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'left' }
          cell.font = { name: 'Arial', size: 10 }
        })
      }

      // spacing row
      ws.addRow([])
    }

    ws.views = [{ state: 'frozen', ySplit: 2 }]
  }

  const buf = await wb.xlsx.writeBuffer()
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  res.setHeader('Content-Disposition', 'attachment; filename="matriz_riesgos.xlsx"')
  return res.status(200).send(Buffer.from(buf))
}
