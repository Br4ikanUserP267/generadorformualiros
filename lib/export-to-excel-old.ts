import ExcelJS from 'exceljs'
import type { Riesgo } from './types'
import { loadTemplate } from './template-loader'

// Helper: Convert column number to Excel letter (1->A, 27->AA)
function colNumberToLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

// Helper: Format date as DD/MM/YYYY
function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper: Get risk interpretation color
const interpretacionColor = (interp?: string) => {
  switch ((interp || '').toLowerCase()) {
    case 'aceptable': return 'FFC6EFCE'
    case 'mejorable': return 'FFFFE699'
    case 'aceptable con control especifico': return 'FFFFCC99'
    case 'no aceptable': return 'FFFFC7CE'
    default: return 'FFFFFFFF'
  }
}

/**
 * Clone template structure and fill with data
 * Detects template columns dynamically and preserves all formatting
 */
async function cloneTemplateAndFillData(
  templateBuffer: ArrayBuffer | null,
  riesgos: Riesgo[],
  areaName?: string,
  responsable?: string,
  fechaElaboracion?: string,
  fechaActualizacion?: string
): Promise<ExcelJS.Workbook> {
  let workbook: ExcelJS.Workbook
  let dataStartRow = 9
  let columnCount = 31
  const columnHeaders: string[] = []

  // Try to load template if provided
  if (templateBuffer) {
    try {
      workbook = new ExcelJS.Workbook()
      await workbook.xlsx.load(templateBuffer)
    } catch (e) {
      console.warn('Failed to load template, creating fresh workbook')
      workbook = new ExcelJS.Workbook()
    }
  } else {
    workbook = new ExcelJS.Workbook()
  }

  // Get or create "Matriz" sheet
  let ws = workbook.getWorksheet('Matriz')
  if (!ws) {
    ws = workbook.addWorksheet('Matriz')
  }

  // Extract template structure if workbook was loaded
  if (templateBuffer && workbook.worksheets.length > 0) {
    const templateWs = workbook.worksheets[0]

    // Get column count from template
    if (templateWs.columnCount) {
      columnCount = templateWs.columnCount
    }

    // Extract column headers from row 8 (typical header row)
    const headerRow = templateWs.getRow(8)
    if (headerRow) {
      for (let i = 1; i <= columnCount; i++) {
        const cell = headerRow.getCell(i)
        columnHeaders.push(cell.value?.toString() || `Col${i}`)
      }
    }

    // Copy column properties from template
    for (let i = 1; i <= columnCount; i++) {
      const templateCol = templateWs.getColumn(i)
      const targetCol = ws.getColumn(i)
      if (templateCol && templateCol.width) {
        targetCol.width = templateCol.width
      }
    }

    // Copy non-data rows (header, info rows) from template
    // Usually rows 1-8 contain structure
    for (let rowNum = 1; rowNum < 9 && rowNum <= templateWs.rowCount; rowNum++) {
      const sourceRow = templateWs.getRow(rowNum)
      const targetRow = ws.getRow(rowNum)

      // Copy cells
      for (let colNum = 1; colNum <= columnCount; colNum++) {
        const sourceCell = sourceRow.getCell(colNum)
        const targetCell = targetRow.getCell(colNum)

        // Copy value, font, fill, alignment, border
        targetCell.value = sourceCell.value
        if (sourceCell.font) targetCell.font = { ...sourceCell.font }
        if (sourceCell.fill) targetCell.fill = { ...sourceCell.fill }
        if (sourceCell.alignment) targetCell.alignment = { ...sourceCell.alignment }
        if (sourceCell.border) targetCell.border = { ...sourceCell.border }
      }

      targetRow.height = sourceRow.height
    }

    // Copy merged cells from template (non-data rows)
    try {
      if (templateWs && 'model' in templateWs) {
        const model = (templateWs as any).model
        if (model && Array.isArray(model.merges)) {
          for (const merge of model.merges) {
            if (merge && merge.startRow < 9) {
              try {
                ws.mergeCells(merge.ref)
              } catch (e) {
                // Merge may fail, continue
              }
            }
          }
        }
      }
    } catch (e) {
      // No merged cells or can't access, continue
    }

    // Update info values in row 7 (if it exists)
    const infoRow = ws.getRow(7)
    if (infoRow) {
      // Heuristic: update area, responsable, dates based on typical positions
      // This will depend on template structure
      let cellIndex = 1
      for (let i = 1; i <= columnCount && cellIndex <= 4; i++) {
        const cell = infoRow.getCell(i)
        if (cell.value === undefined || cell.value === null || cell.value === '') {
          // Find next info cell
          continue
        }
        // Update based on position (area, responsable, fecha_elaboracion, fecha_actualizacion)
        if (i <= 8) {
          cell.value = areaName || cell.value
        } else if (i <= 16) {
          cell.value = responsable || cell.value
        } else if (i <= 24) {
          cell.value = formatDate(fechaElaboracion) || cell.value
        } else {
          cell.value = formatDate(fechaActualizacion) || cell.value
        }
      }
    }
  }

  // Clear existing data rows
  while (ws.rowCount > 8) {
    ws.spliceRows(9, 1)
  }

  // ===== GROUP AND INSERT DATA ROWS =====
  interface GroupedData {
    [proceso: string]: {
      [zona: string]: {
        [actividad: string]: Riesgo[]
      }
    }
  }

  const grouped: GroupedData = {}
  for (const r of riesgos) {
    const p = r.proceso || 'General'
    const z = r.zona || 'General'
    const a = r.actividad || 'General'
    if (!grouped[p]) grouped[p] = {}
    if (!grouped[p][z]) grouped[p][z] = {}
    if (!grouped[p][z][a]) grouped[p][z][a] = []
    grouped[p][z][a].push(r)
  }

  let currentRow = 9
  const mergeMap: string[] = []

  for (const proceso in grouped) {
    for (const zona in grouped[proceso]) {
      for (const actividad in grouped[proceso][zona]) {
        const peligros = grouped[proceso][zona][actividad]
        const startRow = currentRow

        for (let i = 0; i < peligros.length; i++) {
          const p = peligros[i]
          const nd = Number(p.deficiencia || 0)
          const ne = Number(p.exposicion || 0)
          const np = nd * ne
          const nc = Number(p.consecuencia || 0)
          const nr = np * nc

          // Handle controles (can be string or object)
          let controlesFuente = ''
          let controlesMedio = ''
          let controlesIndividuo = ''
          if (typeof p.controles === 'object' && p.controles) {
            controlesFuente = (p.controles as any).fuente || ''
            controlesMedio = (p.controles as any).medio || ''
            controlesIndividuo = (p.controles as any).individuo || ''
          } else if (typeof p.controles === 'string') {
            controlesFuente = p.controles || ''
          }

          // Handle intervencion (can be string or object)
          let intervencionDesc = ''
          let eliminacion = ''
          let sustitucion = ''
          let ingenieria = ''
          let administrativos = ''
          let epp = ''
          let responsableIntervention = ''
          let fechaEjecucion = ''

          if (typeof p.intervencion === 'object' && p.intervencion) {
            intervencionDesc = (p.intervencion as any).descripcion || ''
            eliminacion = (p.intervencion as any).eliminacion || p.control_eliminacion || ''
            sustitucion = (p.intervencion as any).sustitucion || p.control_sustitucion || ''
            ingenieria = (p.intervencion as any).ingenieria || p.control_ingenieria || ''
            administrativos = (p.intervencion as any).administrativos || p.control_admin || ''
            epp = (p.intervencion as any).epp || p.epp || ''
            responsableIntervention = (p.intervencion as any).responsable || ''
            fechaEjecucion = (p.intervencion as any).fecha_ejecucion || p.fecha_ejecucion || ''
          } else if (typeof p.intervencion === 'string') {
            intervencionDesc = p.intervencion || ''
          }

          eliminacion = eliminacion || p.control_eliminacion || ''
          sustitucion = sustitucion || p.control_sustitucion || ''
          ingenieria = ingenieria || p.control_ingenieria || ''
          administrativos = administrativos || p.control_admin || ''
          epp = epp || p.epp || ''

          // Build row values array
          const rowValues = [
            proceso,
            zona,
            actividad,
            p.tarea || '',
            p.cargo || '',
            p.rutinario ? 'Sí' : 'No',
            p.peligro_desc || '',
            p.clasificacion || '',
            p.efectos || '',
            controlesFuente,
            controlesMedio,
            controlesIndividuo,
            nd,
            ne,
            np,
            nc,
            nr,
            p.interpretacion_nivel_riesgo || '',
            p.aceptabilidad || '',
            intervencionDesc,
            eliminacion,
            sustitucion,
            ingenieria,
            administrativos,
            epp,
            responsableIntervention || p.responsable || '',
            formatDate(fechaEjecucion),
            p.seguimiento || '',
            formatDate(p.fecha_ejecucion),
            '',
            'Vigente'
          ]

          const row = ws.getRow(currentRow)
          row.values = rowValues

          // Apply formatting
          row.eachCell({ includeEmpty: true }, (cell, colNum) => {
            cell.alignment = {
              horizontal: colNum <= 6 || colNum > 20 ? 'left' : 'center',
              vertical: 'top',
              wrapText: true
            }
            cell.font = { name: 'Calibri', size: 10 }
            cell.border = {
              top: { style: 'thin' },
              bottom: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            }

            // Color coding for aceptabilidad (column 21)
            if (colNum === 21) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: interpretacionColor(p.aceptabilidad) }
              }
            }
          })

          row.height = 20
          currentRow++
        }

        // Record merge for grouped rows
        if (peligros.length > 0) {
          const endRow = currentRow - 1
          const colsToMerge = [1, 2, 3, 4, 5, 6]

          for (const colNum of colsToMerge) {
            if (startRow < endRow) {
              const colLetter = colNumberToLetter(colNum)
              mergeMap.push(`${colLetter}${startRow}:${colLetter}${endRow}`)
            }
          }
        }
      }
    }
  }

  // Apply merges
  for (const range of mergeMap) {
    try {
      ws.mergeCells(range)
    } catch (e) {
      // Merge might fail, continue
    }
  }

  // Set worksheet properties
  ws.views = [{ state: 'frozen', ySplit: 8 }]
  const lastCol = colNumberToLetter(columnCount)
  ws.autoFilter = { from: 'A8', to: `${lastCol}8` }

  // Ensure "Fotografias" sheet exists
  let photoSheet = workbook.getWorksheet('Fotografias')
  if (!photoSheet) {
    photoSheet = workbook.addWorksheet('Fotografias')
    photoSheet.columns = [{ header: 'Fotografías', key: 'foto', width: 100 }]
    photoSheet.addRow(['Sin archivos adjuntos'])
  }

  return workbook
}

/**
 * Main export function - Auto-detects and uses template if available
 */
export async function exportRisksToExcel(
  riesgos: Riesgo[],
  areaName?: string,
  responsable?: string,
  fechaElaboracion?: string,
  fechaActualizacion?: string,
  filename = 'MATRIZ_IPVR.xlsx',
  templateBuffer?: ArrayBuffer | null
) {
  try {
    // Auto-load template if not provided
    let template: ArrayBuffer | null = templateBuffer ?? null
    if (!template) {
      template = await loadTemplate(areaName)
    }

    const wb = await cloneTemplateAndFillData(
      template || null,
      riesgos,
      areaName,
      responsable,
      fechaElaboracion,
      fechaActualizacion
    )

    wb.creator = 'Sistema de Gestión de Riesgos'
    wb.created = new Date()

    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating Excel:', error)
    throw error
  }
}
