"use client"

import ExcelJS from 'exceljs'
import type { Riesgo } from './types'

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
function formatDate(dateStr?: string | Date): string {
  if (!dateStr) return ''
  const d = dateStr instanceof Date ? dateStr : new Date(dateStr)
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
 * Clone template structure exactly and fill with data, merging rows by activity
 */
async function cloneTemplateAndFillData(
  templateWorkbook: ExcelJS.Workbook | null,
  riesgos: Riesgo[],
  areaName?: string,
  responsable?: string,
  fechaElaboracion?: string,
  fechaActualizacion?: string
): Promise<ExcelJS.Workbook> {
  let workbook: ExcelJS.Workbook

  if (templateWorkbook) {
    workbook = templateWorkbook
  } else {
    workbook = new ExcelJS.Workbook()
  }

  const columnCount = 31

  // Get or recreate "Matriz" sheet
  let matrizSheet = workbook.getWorksheet('Matriz')
  if (!matrizSheet) {
    matrizSheet = workbook.addWorksheet('Matriz')
  }

  // Clear data rows (keep rows 1-8 for formatting)
  if (matrizSheet.rowCount > 8) {
    while (matrizSheet.rowCount > 8) {
      matrizSheet.spliceRows(9, 1)
    }
  }

  // ===== GROUP DATA BY PROCESO, ZONA, ACTIVIDAD =====
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

  // ===== INSERT DATA ROWS WITH MERGING FOR ACTIVITIES =====
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

          // Handle controles
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

          // Handle intervencion
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

          // Build row values - EXACTLY 31 columns to match template
          const rowValues = [
            null, // Col 1 (A) - empty
            proceso, // Col 2 (B) - PROCESO
            zona, // Col 3 (C) - ZONA/LUGAR
            actividad, // Col 4 (D) - ACTIVIDADES
            p.tarea || '', // Col 5 (E) - TAREAS
            p.cargo || '', // Col 6 (F) - CARGO
            p.rutinario ? 'Sí' : 'No', // Col 7 (G) - RUTINARIO SI O NO
            p.peligro_desc || '', // Col 8 (H) - Descripción
            p.clasificacion || '', // Col 9 (I) - Clasificación
            p.efectos || '', // Col 10 (J) - EFECTOS POSIBLES
            controlesFuente || p.fuente || '', // Col 11 (K) - Fuente
            controlesMedio || p.medio || '', // Col 12 (L) - Medio
            controlesIndividuo || p.individuo || '', // Col 13 (M) - Individuo
            nd, // Col 14 (N) - Nivel Deficiencia
            ne, // Col 15 (O) - Nivel Exposición
            np, // Col 16 (P) - Nivel Probabilidad
            p.interpretacion_probabilidad || '', // Col 17 (Q) - Interpretación Probabilidad
            nc, // Col 18 (R) - Nivel Consecuencia
            nr, // Col 19 (S) - Nivel Riesgo
            p.interpretacion_nivel_riesgo || '', // Col 20 (T) - Interpretación Riesgo
            p.aceptabilidad || '', // Col 21 (U) - Aceptabilidad
            p.num_expuestos || 1, // Col 22 (V) - N° Expuestos
            p.peor_consecuencia || '', // Col 23 (W) - Peor Consecuencia
            p.requisito_legal || 'No', // Col 24 (X) - Requisito Legal
            eliminacion, // Col 25 (Y) - Eliminación
            sustitucion, // Col 26 (Z) - Sustitución
            ingenieria, // Col 27 (AA) - Ingeniería
            administrativos || p.senalizacion || '', // Col 28 (AB) - Administrativos
            epp, // Col 29 (AC) - EPP
            intervencionDesc || responsableIntervention || p.responsable || p.seguimiento || (typeof p.intervencion === 'string' ? p.intervencion : '') || '', // Col 30 (AD)
            formatDate(fechaEjecucion || p.fecha || p.fecha_ejecucion) // Col 31 (AE) - Fecha
          ]

          const row = matrizSheet.getRow(currentRow)
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

            // Color for aceptabilidad (column 21)
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

        // Mark rows for merging when activity has MULTIPLE peligros
        if (peligros.length > 1) {
          const endRow = currentRow - 1
          // Merge columns B, C, D, E, F, G for process/zona/activity info
          const colsToMerge = [2, 3, 4, 5, 6, 7]

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

  // Apply all merges
  for (const range of mergeMap) {
    try {
      matrizSheet.mergeCells(range)
    } catch (e) {
      console.warn('Merge failed:', range)
    }
  }

  // Set worksheet view and filters
  matrizSheet.views = [{ state: 'frozen', ySplit: 8 }]
  const lastCol = colNumberToLetter(columnCount)
  matrizSheet.autoFilter = { from: 'A8', to: `${lastCol}8` }

  // ===== HANDLE FOTOGRAFIAS SHEET =====
  let fotosSheet = workbook.getWorksheet('Fotografias ')
  if (!fotosSheet) {
    fotosSheet = workbook.getWorksheet('Fotografias')
  }
  
  if (!fotosSheet) {
    fotosSheet = workbook.addWorksheet('Fotografias')
  }

  // Clear existing data rows from Fotografias
  while (fotosSheet.rowCount > 1) {
    fotosSheet.spliceRows(2, 1)
  }

  // Set up headers for Fotografias
  fotosSheet.columns = [
    { header: 'Proceso', key: 'proceso', width: 20 },
    { header: 'Zona', key: 'zona', width: 20 },
    { header: 'Actividad', key: 'actividad', width: 30 },
    { header: 'Peligro', key: 'peligro', width: 30 },
    { header: 'Nombre Archivo', key: 'nombre', width: 40 },
    { header: 'Tipo', key: 'tipo', width: 15 },
    { header: 'Tamaño (bytes)', key: 'tamano', width: 15 },
    { header: 'URL', key: 'url', width: 50 },
    { header: 'Fecha Subida', key: 'fechaSubida', width: 15 }
  ]

  // Format Fotografias header row
  const fotosHeaderRow = fotosSheet.getRow(1)
  fotosHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri', size: 11 }
  fotosHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  }

  // Populate with file attachments
  let fotoRowNum = 2
  let hasFiles = false
  
  for (const r of riesgos) {
    if (r.archivos && Array.isArray(r.archivos) && r.archivos.length > 0) {
      hasFiles = true
      for (const archivo of r.archivos) {
        const row = fotosSheet.getRow(fotoRowNum)
        row.values = {
          proceso: r.proceso || '',
          zona: r.zona || '',
          actividad: r.actividad || '',
          peligro: r.peligro_desc || '',
          nombre: archivo.nombre || '',
          tipo: archivo.tipo || '',
          tamano: archivo.tamano || 0,
          url: archivo.url || '',
          fechaSubida: formatDate(archivo.fechaSubida)
        }

        // Apply cell formatting
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true }
          cell.font = { name: 'Calibri', size: 10 }
          cell.border = {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'thin' }
          }
        })

        row.height = 18
        fotoRowNum++
      }
    }
  }

  // If no files, add placeholder
  if (!hasFiles) {
    const placeholderRow = fotosSheet.getRow(2)
    placeholderRow.values = {
      proceso: 'Sin archivos adjuntos',
      zona: '',
      actividad: '',
      peligro: '',
      nombre: '',
      tipo: '',
      tamano: '',
      url: '',
      fechaSubida: ''
    }
    placeholderRow.height = 18
  }

  // ===== REMOVE EXTRA SHEETS - KEEP ONLY Matriz AND Fotografias =====
  const sheetsToRemove = workbook.worksheets.filter(sheet => {
    const name = sheet.name.trim()
    return name !== 'Matriz' && name !== 'Fotografias' && name !== 'Fotografias '
  })

  for (const sheet of sheetsToRemove) {
    workbook.removeWorksheet(sheet.id)
  }

  return workbook
}

/**
 * Load the user's template file from the public folder
 */
async function loadTemplateFromPublic(): Promise<ExcelJS.Workbook | null> {
  try {
    const response = await fetch('/api/load-template')
    if (!response.ok) {
      console.warn('Could not load template from API')
      return null
    }
    const arrayBuffer = await response.arrayBuffer()
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(arrayBuffer)
    console.log('Template loaded successfully')
    return wb
  } catch (e) {
    console.warn('Failed to load template:', e)
    return null
  }
}

/**
 * Main export function - Uses the user's template file exactly
 */
export async function exportRisksToExcel(
  riesgos: Riesgo[],
  areaName?: string,
  responsable?: string,
  fechaElaboracion?: string,
  fechaActualizacion?: string,
  filename = 'MATRIZ_IPVR.xlsx',
  templateWorkbook?: ExcelJS.Workbook | null
) {
  try {
    console.log('Starting Excel export for:', filename)
    
    // Try to load template if not provided
    let template: ExcelJS.Workbook | null = templateWorkbook ?? null
    if (!template) {
      console.log('Loading template from API...')
      template = await loadTemplateFromPublic()
      if (!template) {
        console.warn('No template available, creating fresh workbook')
      }
    }

    console.log('Cloning template and filling data...')
    const wb = await cloneTemplateAndFillData(
      template,
      riesgos,
      areaName,
      responsable,
      fechaElaboracion,
      fechaActualizacion
    )

    wb.creator = 'Sistema de Gestión de Riesgos'
    wb.created = new Date()

    console.log('Writing Excel buffer...')
    const buf = await wb.xlsx.writeBuffer()
    console.log('Buffer created, size:', buf.byteLength, 'bytes')
    
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    console.log('Triggering download...')
    link.click()
    
    // Clean up after download
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
    
    console.log('Excel export completed successfully')
  } catch (error) {
    console.error('Error generating Excel:', error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error('Error details:', errorMsg)
    throw error
  }
}
