import { promises as fs } from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import ExcelJS from 'exceljs'
import { getAuthUser } from '@/lib/auth-server'
import { calculateGtc45 } from '@/lib/gtc45-utils'

export const config = {
  api: {
    bodyParser: false,
  },
}

const MAX_FILE_SIZE = 15 * 1024 * 1024

function parseForm(req: NextApiRequest) {
  const form = formidable({
    multiples: false,
    maxFileSize: MAX_FILE_SIZE,
    allowEmptyFiles: false,
  })

  return new Promise<{ files: formidable.Files; fields: formidable.Fields }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err)
        return
      }
      resolve({ files, fields })
    })
  })
}

function normalizeHeader(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    const { files } = await parseForm(req)
    const uploaded = Array.isArray(files.file) ? files.file[0] : files.file

    if (!uploaded) {
      return res.status(400).json({ error: 'No se envió ningún archivo' })
    }

    const buffer = await fs.readFile(uploaded.filepath)
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer as any)

    const sheet = workbook.worksheets[0]
    if (!sheet) {
      return res.status(400).json({ error: 'El libro de Excel no contiene hojas de cálculo.' })
    }

    // Find header row
    let headerRowIdx = 1
    let colMap: Record<string, number> = {}

    for (let r = 1; r <= Math.min(sheet.rowCount, 10); r++) {
      const row = sheet.getRow(r)
      const map: Record<string, number> = {}
      row.eachCell((cell, colNumber) => {
        const val = normalizeHeader(String(cell.value || ''))
        if (val) map[val] = colNumber
      })

      // Check if this row looks like header (contains descripcion / peligro / clasificacion)
      const hasKeyCol = Object.keys(map).some(
        (k) =>
          k.includes('descripcion') ||
          k.includes('peligro') ||
          k.includes('clasificacion') ||
          k.includes('riesgo')
      )
      if (hasKeyCol) {
        headerRowIdx = r
        colMap = map
        break
      }
    }

    const getColValue = (row: ExcelJS.Row, possibleKeys: string[]) => {
      for (const pk of possibleKeys) {
        const normalized = normalizeHeader(pk)
        // Exact match
        if (colMap[normalized]) {
          const val = row.getCell(colMap[normalized]).value
          if (val !== null && val !== undefined) {
            if (typeof val === 'object' && 'text' in (val as any)) return (val as any).text
            return String(val).trim()
          }
        }
        // Partial match
        for (const [k, colNum] of Object.entries(colMap)) {
          if (k.includes(normalized) || normalized.includes(k)) {
            const val = row.getCell(colNum).value
            if (val !== null && val !== undefined) {
              if (typeof val === 'object' && 'text' in (val as any)) return (val as any).text
              return String(val).trim()
            }
          }
        }
      }
      return ''
    }

    const parsedRows: any[] = []

    for (let r = headerRowIdx + 1; r <= sheet.rowCount; r++) {
      const row = sheet.getRow(r)
      if (!row.hasValues) continue

      const desc = getColValue(row, ['descripcion', 'peligro', 'factorriesgo', 'nombre'])
      if (!desc) continue

      const clasif = getColValue(row, ['clasificacion', 'tiporiesgo', 'categoria', 'tipo']) || 'GENERAL'
      const codigo = getColValue(row, ['codigo', 'cod', 'id'])
      const efectos = getColValue(row, ['efectosposibles', 'efectos', 'consecuencias', 'dano'])
      const fuente = getColValue(row, ['controlfuente', 'fuente'])
      const medio = getColValue(row, ['controlmedio', 'medio'])
      const individuo = getColValue(row, ['controlindividuo', 'individuo', 'persona', 'trabajador'])

      const ndStr = getColValue(row, ['nd', 'deficiencia', 'niveldeficiencia'])
      const neStr = getColValue(row, ['ne', 'exposicion', 'nivelexposicion'])
      const ncStr = getColValue(row, ['nc', 'consecuencia', 'nivelconsecuencia'])

      const nd = ndStr && !isNaN(Number(ndStr)) ? Number(ndStr) : null
      const ne = neStr && !isNaN(Number(neStr)) ? Number(neStr) : null
      const nc = ncStr && !isNaN(Number(ncStr)) ? Number(ncStr) : null

      const calc = calculateGtc45(nd, ne, nc)

      // 5W2H columns
      const planQue = getColValue(row, ['planque', 'que', 'accion', 'medidapropuesta'])
      const planPorQue = getColValue(row, ['planporque', 'porque', 'justificacion', 'causa'])
      const planDonde = getColValue(row, ['plandonde', 'donde', 'area', 'lugar', 'proceso'])
      const planComo = getColValue(row, ['plancomo', 'como', 'metodo', 'procedimiento'])
      const planResponsable = getColValue(row, ['planresponsable', 'responsable', 'cargo'])

      parsedRows.push({
        codigo: codigo || null,
        clasificacion: clasif.toUpperCase(),
        descripcion: desc,
        efectosPosibles: efectos || null,
        controlFuente: fuente || null,
        controlMedio: medio || null,
        controlIndividuo: individuo || null,
        nd: calc.nd,
        ne: calc.ne,
        np: calc.np,
        interpNp: calc.interpNp,
        nc: calc.nc,
        nr: calc.nr,
        interpNr: calc.interpNr,
        aceptabilidad: calc.aceptabilidad,
        planQue: planQue || null,
        planPorQue: planPorQue || null,
        planDonde: planDonde || null,
        planComo: planComo || null,
        planResponsable: planResponsable || null,
      })
    }

    return res.status(200).json({
      totalRows: parsedRows.length,
      rows: parsedRows,
    })
  } catch (error: any) {
    console.error('Error in /api/peligros/import/preview:', error)
    return res.status(500).json({
      error: 'Error al procesar el archivo Excel.',
      details: error?.message || String(error),
    })
  }
}
