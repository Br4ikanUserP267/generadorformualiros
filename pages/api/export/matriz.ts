import { NextApiRequest, NextApiResponse } from 'next'
import ExcelJS from 'exceljs'
import fs from 'fs/promises'
import path from 'path'
import prisma from '@/lib/prisma'

// ============================================================================
// Type Definitions for Nested Matrix Structure
// ============================================================================

interface Control {
  fuente?: string
  medio?: string
  individuo?: string
}

interface Evaluacion {
  nivel_deficiencia?: number
  nivel_exposicion?: number
  nivel_probabilidad?: number
  interp_probabilidad?: string
  nivel_consecuencia?: number
  nivel_riesgo?: number
  interp_riesgo?: string
  aceptabilidad?: string
  nd?: number
  ne?: number
  np?: number
  nc?: number
  nr?: number
  interp_np?: string
  interp_nr?: string
}

interface Criterio {
  num_expuestos?: number
  peor_consecuencia?: string
  requisito_legal?: string
  numExpuestos?: number
  peorConsecuencia?: string
  requisitoLegal?: boolean
}

interface Intervencion {
  eliminacion?: string
  sustitucion?: string
  controles_ingenieria?: string
  controles_administrativos?: string
  epp?: string
  responsable?: string
  fecha_ejecucion?: string
}

interface Peligro {
  id?: string
  descripcion?: string
  clasificacion?: string
  efectos_posibles?: string
  efectos?: string
  rutinario?: boolean
  control?: Control
  controles?: Control
  evaluacion?: Evaluacion
  criterio?: Criterio
  criterios?: Criterio
  intervencion?: Intervencion
}

interface Actividad {
  id?: string
  nombre?: string
  descripcion?: string
  tareas?: string
  cargo?: string
  rutinario?: boolean
  peligros?: Peligro[]
}

interface Zona {
  id?: string
  nombre?: string
  actividades?: Actividad[]
}

interface Proceso {
  id?: string
  nombre?: string
  zonas?: Zona[]
}

interface Archivo {
  id?: string
  nombre_original?: string
  nombreOriginal?: string
  name?: string
  tipo?: string
  tipoMime?: string
  type?: string
  tamano?: number
  url?: string
  data?: string
  fechaSubida?: string
}

interface MatrizData {
  id?: string
  area?: string
  responsable?: string
  fecha_elaboracion?: string
  fecha_actualizacion?: string
  procesos?: Proceso[]
  archivos?: Archivo[]
  files?: Archivo[]
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRiskColorFill(nr: number): { type: 'pattern'; pattern: 'solid'; fgColor: { argb: string } } {
  if (nr >= 4000) return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFfce8e8' } } // Muy alto
  if (nr >= 501) return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFfdecea' } } // Alto
  if (nr >= 121) return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFfff3e0' } } // Medio
  return { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFe8f5e9' } } // Bajo
}

function getRiskColorFont(nr: number): { color: { argb: string } } {
  if (nr >= 4000) return { color: { argb: 'FFa50000' } } // Muy alto
  if (nr >= 501) return { color: { argb: 'FFdc3545' } } // Alto
  if (nr >= 121) return { color: { argb: 'FFfd7e14' } } // Medio
  return { color: { argb: 'FF198754' } } // Bajo
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const isoDate = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoDate) return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return ''
  }
}

function applyStandardBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    left: { style: 'thin', color: { argb: 'FF000000' } },
    right: { style: 'thin', color: { argb: 'FF000000' } }
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const matrizData: MatrizData = req.body

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Sistema'

    // Create "Matriz" sheet
    const ws = wb.addWorksheet('Matriz')

    // Set column widths
    const colWidths: { [key: number]: number } = {
      1: 3,   // A
      2: 12,  // B - PROCESO
      3: 18,  // C - ZONA/LUGAR
      4: 25,  // D - ACTIVIDADES
      5: 25,  // E - TAREAS
      6: 18,  // F - CARGO
      7: 8,   // G - RUTINARIO
      8: 30,  // H - PELIGROS Desc
      9: 14,  // I - PELIGROS Clasificacion
      10: 25, // J - EFECTOS
      11: 20, // K - Controles Fuente
      12: 25, // L - Controles Medio
      13: 25, // M - Controles Individuo
      14: 8,  // N - Nivel Deficiencia
      15: 8,  // O - Nivel Exposicion
      16: 8,  // P - Nivel Probabilidad
      17: 12, // Q - Interpretacion NP
      18: 8,  // R - Nivel Consecuencia
      19: 8,  // S - Nivel Riesgo
      20: 10, // T - Interpretacion NR
      21: 18, // U - Aceptabilidad
      22: 8,  // V - N° Expuestos
      23: 25, // W - Peor Consecuencia
      24: 8,  // X - Requisito Legal
      25: 25, // Y - Eliminacion
      26: 25, // Z - Sustitucion
      27: 25, // AA - Controles Ingenieria
      28: 25, // AB - Controles Admin
      29: 25, // AC - EPP
      30: 15, // AD - Responsable
      31: 12  // AE - Fecha Ejecucion
    }

    for (let i = 1; i <= 31; i++) {
       ws.getColumn(i).width = colWidths[i] || 15
    }

    // Header structure rows
    // Row 1
    ws.getRow(1).height = 10

    // Row 2
    ws.mergeCells('B2:C5')
    ws.getCell('B2').value = '' 
    ws.getCell('B2').alignment = { horizontal: 'center', vertical: 'middle' }
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logocsm_excel.png')
      const logoBuffer = await fs.readFile(logoPath)
      const logoId = wb.addImage({
        buffer: logoBuffer as any,
        extension: 'png'
      })
      ws.addImage(logoId, 'B2:C5')
    } catch (err) {
      ws.getCell('B2').value = 'LOGO' // Fallback
    }

    ws.mergeCells('D2:AC2')
    ws.getCell('D2').value = 'SISTEMAS INTEGRADOS GESTIÓN'
    ws.getCell('D2').alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getCell('D2').font = { bold: true, name: 'Arial', size: 10 }

    ws.getCell('AD2').value = 'Código:'
    ws.getCell('AD2').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('AE2').value = '45.17-FOR-38'
    ws.getCell('AE2').alignment = { horizontal: 'center' }

    // Row 3
    ws.mergeCells('D3:AC3')
    ws.getCell('D3').value = 'CLINICA SANTA MARIA S.A.S.'
    ws.getCell('D3').alignment = { horizontal: 'center', vertical: 'middle' }
    ws.getCell('D3').font = { bold: true, name: 'Arial', size: 10 }

    ws.getCell('AD3').value = 'Versión:'
    ws.getCell('AD3').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('AE3').value = '02'
    ws.getCell('AE3').alignment = { horizontal: 'center' }

    // Row 4
    ws.mergeCells('D4:AC5')
    ws.getCell('D4').value = 'MATRIZ DE IDENTIFICACIÓN DE PELIGROS Y VALORACIÓN DE RIESGOS'
    ws.getCell('D4').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    ws.getCell('D4').font = { bold: true, name: 'Arial', size: 10 }

    ws.getCell('AD4').value = 'Fecha:'
    ws.getCell('AD4').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('AE4').value = '26/4/2019'
    ws.getCell('AE4').alignment = { horizontal: 'center' }

    // Row 5
    ws.getCell('AD5').value = 'Página:'
    ws.getCell('AD5').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('AE5').value = '1 de 1'
    ws.getCell('AE5').alignment = { horizontal: 'center' }

    // Row 7 (Info row)
    ws.mergeCells('B7:C7')
    ws.getCell('B7').value = 'ÁREA / PROCESO'
    ws.getCell('B7').font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 }
    ws.getCell('B7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5C2A' } }
    ws.getCell('B7').alignment = { horizontal: 'center', vertical: 'middle' }

    ws.mergeCells('D7:G7')
    ws.getCell('D7').value = matrizData.area || ''
    ws.getCell('D7').alignment = { horizontal: 'center', vertical: 'middle' }

    ws.mergeCells('I7:J7')
    ws.getCell('I7').value = 'RESPONSABLE'
    ws.getCell('I7').font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 }
    ws.getCell('I7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5C2A' } }
    ws.getCell('I7').alignment = { horizontal: 'center', vertical: 'middle' }

    ws.mergeCells('K7:L7')
    ws.getCell('K7').value = matrizData.responsable || ''
    ws.getCell('K7').alignment = { horizontal: 'center', vertical: 'middle' }

    ws.mergeCells('N7:P7')
    ws.getCell('N7').value = 'FECHA ELABORACIÓN'
    ws.getCell('N7').font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 }
    ws.getCell('N7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5C2A' } }
    ws.getCell('N7').alignment = { horizontal: 'center', vertical: 'middle' }

    ws.mergeCells('Q7:T7')
    ws.getCell('Q7').value = matrizData.fecha_elaboracion ? formatDate(matrizData.fecha_elaboracion) : ''
    ws.getCell('Q7').alignment = { horizontal: 'center', vertical: 'middle' }

    ws.mergeCells('V7:X7')
    ws.getCell('V7').value = 'FECHA ACTUALIZACIÓN'
    ws.getCell('V7').font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 10 }
    ws.getCell('V7').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5C2A' } }
    ws.getCell('V7').alignment = { horizontal: 'center', vertical: 'middle' }

    ws.mergeCells('Y7:AA7')
    ws.getCell('Y7').value = matrizData.fecha_actualizacion ? formatDate(matrizData.fecha_actualizacion) : ''
    ws.getCell('Y7').alignment = { horizontal: 'center', vertical: 'middle' }

    // Apply borders to rows 2-5 and 7
    for (let r = 2; r <= 5; r++) {
        for (let c = 2; c <= 31; c++) {
            const letter = ws.getColumn(c).letter;
            const cell = ws.getCell(letter + r);
            if (!cell.border) cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
        }
    }
    for (let c = 2; c <= 31; c++) {
        const letter = ws.getColumn(c).letter;
        const cell = ws.getCell(letter + '7');
        if (!cell.border && cell.value !== null && cell.value !== '') cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
        };
    }

    // Column Headers (Row 9 & 10)
    const headerRow9 = ws.getRow(9)
    const headerRow10 = ws.getRow(10)

    headerRow9.height = 30
    headerRow10.height = 60

    // Setup headers
    const headers = [
      { col: 'B', text: 'PROCESO', merge: 'B9:B10' },
      { col: 'C', text: 'ZONA / LUGAR', merge: 'C9:C10' },
      { col: 'D', text: 'ACTIVIDADES', merge: 'D9:D10' },
      { col: 'E', text: 'TAREAS', merge: 'E9:E10' },
      { col: 'F', text: 'CARGO\n(Personal involucrado expuesto)', merge: 'F9:F10' },
      { col: 'G', text: 'RUTINARIO (SI O NO)', merge: 'G9:G10' },
      { col: 'H', text: 'PELIGROS', merge: 'H9:I9' },
      { col: 'J', text: 'EFECTOS POSIBLES', merge: 'J9:J10' },
      { col: 'K', text: 'CONTROLES EXISTENTES', merge: 'K9:M9' },
      { col: 'N', text: 'EVALUACIÓN DEL RIESGO', merge: 'N9:T9' },
      { col: 'U', text: 'VALORACIÓN DEL RIESGO', merge: 'U9:U10' },
      { col: 'V', text: 'CRITERIOS PARA ESTABLECER CONTROLES', merge: 'V9:X9' },
      { col: 'Y', text: 'MEDIDAS DE INTERVENCIÓN', merge: 'Y9:AC9' },
      { col: 'AD', text: 'SEGUIMIENTO CONTROLES', merge: 'AD9:AE9' }
    ]

    const subHeaders = [
      { col: 'H', text: 'Descripción' },
      { col: 'I', text: 'Clasificación' },
      { col: 'K', text: 'Fuente' },
      { col: 'L', text: 'Medio' },
      { col: 'M', text: 'Individuo' },
      { col: 'N', text: 'Nivel Deficiencia' },
      { col: 'O', text: 'Nivel Exposición' },
      { col: 'P', text: 'Nivel Probabilidad' },
      { col: 'Q', text: 'Interpretación Nivel Probabilidad' },
      { col: 'R', text: 'Nivel Consecuencia' },
      { col: 'S', text: 'Nivel Riesgo' },
      { col: 'T', text: 'Interpretación Nivel Riesgo' },
      // U is merged from row 9
      { col: 'V', text: 'N° Expuestos' },
      { col: 'W', text: 'Peor Consecuencia' },
      { col: 'X', text: 'Asociado a Requisito Legal' },
      { col: 'Y', text: 'Eliminación' },
      { col: 'Z', text: 'Sustitución' },
      { col: 'AA', text: 'Controles de Ingeniería' },
      { col: 'AB', text: 'Controles Administrativos, Señalización, Advertencia' },
      { col: 'AC', text: 'Equipos y Elementos de Protección Personal' },
      { col: 'AD', text: 'Responsable' },
      { col: 'AE', text: 'Fecha Ejecución' }
    ]

    for (const h of headers) {
      if (h.merge) ws.mergeCells(h.merge)
      const cell = ws.getCell(`${h.col}9`)
      cell.value = h.text
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 9 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5C2A' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      applyStandardBorder(cell)
    }

    for (const sh of subHeaders) {
      const cell = ws.getCell(`${sh.col}10`)
      cell.value = sh.text
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 9 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A5C2A' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      applyStandardBorder(cell)
    }

    // Apply borders to all header cells
    for (let c = 2; c <= 31; c++) {
      const colLetter = ws.getColumn(c).letter
      applyStandardBorder(ws.getCell(`${colLetter}9`))
      applyStandardBorder(ws.getCell(`${colLetter}10`))
    }

    // Data rows
    let currentRow = 11
    const mergeRanges: string[] = []

    const procesos = matrizData.procesos || []

    for (const p of procesos) {
      const pName = p.nombre || ''
      const zonas = p.zonas || []

      const procesoProcesosStartRow = currentRow

      for (const z of zonas) {
        const zName = z.nombre || ''
        const actividades = z.actividades || []

        const procesoZonasStartRow = currentRow

        for (const a of actividades) {
          const aName = a.nombre || ''
          const aDesc = a.descripcion || ''
          const aTareas = a.tareas || ''
          const aCargo = a.cargo || ''
          const aRut = a.rutinario ? 'Si' : 'No'
          const peligros = a.peligros || []

          for (const pel of peligros) {
            // Evaluacion variables
            const ev = pel.evaluacion || {}
            const nd = ev.nivel_deficiencia ?? ev.nd ?? 0
            const ne = ev.nivel_exposicion ?? ev.ne ?? 0
            const np = ev.nivel_probabilidad ?? ev.np ?? (nd * ne)
            const interp_np = ev.interp_probabilidad ?? ev.interp_np ?? ''
            const nc = ev.nivel_consecuencia ?? ev.nc ?? 0
            const nr = ev.nivel_riesgo ?? ev.nr ?? (np * nc)
            const interp_nr = ev.interp_riesgo ?? ev.interp_nr ?? ''
            const aceptabilidad = ev.aceptabilidad ?? ''

            const crit = pel.criterios || pel.criterio || {}
            const inter = pel.intervencion || {}
            const ctrl = pel.controles || pel.control || {}

            const rowData = [
              '', // A: empty
              pName, // B
              zName, // C
              aDesc || aName, // D
              aTareas, // E
              aCargo, // F
              aRut, // G
              pel.descripcion || '', // H
              pel.clasificacion || '', // I
              pel.efectos_posibles || pel.efectos || '', // J
              ctrl.fuente || '', // K
              ctrl.medio || '', // L
              ctrl.individuo || '', // M
              nd, // N
              ne, // O
              np, // P
              interp_np, // Q
              nc, // R
              nr, // S
              interp_nr, // T
              aceptabilidad, // U
              crit.num_expuestos ?? crit.numExpuestos ?? 1, // V
              crit.peor_consecuencia ?? crit.peorConsecuencia ?? '', // W
              (crit.requisito_legal ?? crit.requisitoLegal) ? 'Si' : 'No', // X
              inter.eliminacion || '', // Y
              inter.sustitucion || '', // Z
              inter.controles_ingenieria || '', // AA
              inter.controles_administrativos || '', // AB
              inter.epp || '', // AC
              inter.responsable || '', // AD
              formatDate(inter.fecha_ejecucion) // AE
            ]

            const row = ws.addRow(rowData)
            // Removed row.height = -1 as it causes rows to collapse in Excel properly 

            // Styling for data cells
            for (let c = 2; c <= 31; c++) {
              const cell = row.getCell(c)
              cell.font = { name: 'Arial', size: 9 }
              
              if (c === 4 || c === 5) {
                // Actividades (D=4) y Tareas (E=5) -> centrado y arriba
                cell.alignment = { wrapText: true, vertical: 'top', horizontal: 'center' }
              } else {
                // El resto -> centrado y en el medio
                cell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' }
              }
              
              applyStandardBorder(cell)

              // Color risk columns ( Evaluaciones N(14) to U(21) )
              if (c >= 14 && c <= 21) {
                if (nr > 0) {
                  cell.fill = getRiskColorFill(nr)
                  const fontColor = getRiskColorFont(nr).color
                  cell.font = { ...cell.font, bold: true, color: fontColor }
                }
              }
            }

            currentRow++
          }

          // Merge cells for Actividades
          if (peligros.length > 1) {
            const startR = currentRow - peligros.length
            const endR = currentRow - 1
            mergeRanges.push(`D${startR}:D${endR}`)
            mergeRanges.push(`E${startR}:E${endR}`)
            mergeRanges.push(`F${startR}:F${endR}`)
            mergeRanges.push(`G${startR}:G${endR}`)
          }
        }

        // group ranges: evaluate contiguous blocks for the same value
        const zonaRowStart = procesoZonasStartRow
        const zonaRowEnd = currentRow - 1

        if (zonaRowStart <= zonaRowEnd) {
          mergeRanges.push(`C${zonaRowStart}:C${zonaRowEnd}`)

          let currentValue = ws.getCell(`V${zonaRowStart}`).value
          let mergeStart = zonaRowStart

          for (let rowIdx = zonaRowStart + 1; rowIdx <= zonaRowEnd + 1; rowIdx++) {
            const nextValue = rowIdx <= zonaRowEnd ? ws.getCell(`V${rowIdx}`).value : null
            if (nextValue !== currentValue) {
              if (rowIdx - 1 > mergeStart) {
                mergeRanges.push(`V${mergeStart}:V${rowIdx - 1}`)
              }
              currentValue = nextValue
              mergeStart = rowIdx
            }
          }

          let currentValueX = ws.getCell(`X${zonaRowStart}`).value
          let mergeStartX = zonaRowStart

          for (let rowIdx = zonaRowStart + 1; rowIdx <= zonaRowEnd + 1; rowIdx++) {
            const nextValue = rowIdx <= zonaRowEnd ? ws.getCell(`X${rowIdx}`).value : null
            if (nextValue !== currentValueX) {
              if (rowIdx - 1 > mergeStartX) {
                mergeRanges.push(`X${mergeStartX}:X${rowIdx - 1}`)
              }
              currentValueX = nextValue
              mergeStartX = rowIdx
            }
          }
        }
      }

      const procesoRowStart = procesoProcesosStartRow
      const procesoRowEnd = currentRow - 1
      if (procesoRowStart <= procesoRowEnd) {
        mergeRanges.push(`B${procesoRowStart}:B${procesoRowEnd}`)
      }
    }

    for (const range of mergeRanges) {
      try { ws.mergeCells(range) } catch (e) { /* ignore */ }
    }

    // ========== FOTOGRAFIAS SHEET ==========
    const photoSheet = wb.addWorksheet('Fotografias')
    photoSheet.getColumn(1).width = 35
    photoSheet.getColumn(2).width = 50

    const archivos = matrizData.archivos || matrizData.files || []

    if (!archivos || archivos.length === 0) {
      const cell = photoSheet.getCell('A2')
      cell.value = 'Sin fotografías adjuntas'
      cell.font = { name: 'Arial', size: 11 }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    } else {
      let photoRow = 2

      for (const archivo of archivos) {
        const fileName = archivo.nombre_original || archivo.nombreOriginal || archivo.name || 'Archivo'
        const tipoMime = archivo.tipoMime || archivo.tipo || archivo.type || ''
        const fileUrl = archivo.url || archivo.data || ''

        const nameCell = photoSheet.getCell(`A${photoRow}`)
        nameCell.value = fileName
        nameCell.font = { bold: true, name: 'Arial', size: 10 }
        nameCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
        applyStandardBorder(nameCell)

        const imageCell = photoSheet.getCell(`B${photoRow}`)

        if (tipoMime.startsWith('image/') && fileUrl && typeof fileUrl === 'string') {
          try {
            // Clean up the URL to get local file path
            // e.g. /uploads/matrices/image.jpg
            const cleanUrl = fileUrl.split('?')[0] // remove query params just in case

            let localPath = ''
            if (cleanUrl.startsWith('/')) {
              localPath = path.join(process.cwd(), 'public', cleanUrl)
            } else if (cleanUrl.startsWith('http')) {
              // Might not be locally stored if it's an outside absolute URL, but assuming
              // for this project uploads are in /uploads/matrices/
              const urlObj = new URL(cleanUrl)
              localPath = path.join(process.cwd(), 'public', urlObj.pathname)
            } else {
              localPath = path.join(process.cwd(), 'public', cleanUrl)
            }

            let imageBuffer: Buffer | null = null
            try {
              imageBuffer = await fs.readFile(localPath)
            } catch (err) {
              console.warn(`File not found at ${localPath}:`, err)
            }

            if (imageBuffer) {
              const mimeToExt: { [key: string]: 'jpeg' | 'png' | 'gif' } = {
                'image/jpeg': 'jpeg',
                'image/jpg': 'jpeg',
                'image/png': 'png',
                'image/gif': 'gif',
                'image/bmp': 'png',
                'image/webp': 'png'
              }
              const ext = mimeToExt[tipoMime] || 'png'

              const imageId = wb.addImage({
                buffer: imageBuffer as any,
                extension: ext
              })

              photoSheet.addImage(imageId, {
                tl: { col: 1.5, row: photoRow - 1 },
                ext: { width: 400, height: 300 }
              })

              photoSheet.getRow(photoRow).height = 220
              imageCell.value = '(Imagen embebida)'
              imageCell.font = { name: 'Arial', size: 9, italic: true, color: { argb: 'FF999999' } }
              imageCell.alignment = { horizontal: 'center', vertical: 'middle' }
            } else {
              imageCell.value = 'Imagen no encontrada'
              imageCell.font = { name: 'Arial', size: 9, color: { argb: 'FFFF0000' } }
              imageCell.alignment = { horizontal: 'center', vertical: 'middle' }
              photoSheet.getRow(photoRow).height = 25
            }
          } catch (error) {
            console.error(`Error processing image ${fileName}:`, error)
            imageCell.value = 'Error al procesar imagen'
            imageCell.font = { name: 'Arial', size: 9, color: { argb: 'FFFF0000' } }
            imageCell.alignment = { horizontal: 'center', vertical: 'middle' }
            photoSheet.getRow(photoRow).height = 25
          }
        } else {
          imageCell.value = 'Archivo no visual'
          imageCell.font = { name: 'Arial', size: 9, italic: true }
          imageCell.alignment = { horizontal: 'center', vertical: 'middle' }
          photoSheet.getRow(photoRow).height = 25
        }

        applyStandardBorder(imageCell)
        photoRow++
      }
    }

    // ============================================================================
    // 3. Create "Plan de Acción 5W2H" Sheet
    // ============================================================================
    const allDangers: any[] = []
    if (Array.isArray(matrizData.procesos)) {
      for (const proc of matrizData.procesos) {
        if (Array.isArray(proc.zonas)) {
          for (const z of proc.zonas) {
            if (Array.isArray(z.actividades)) {
              for (const a of z.actividades) {
                if (Array.isArray(a.peligros)) {
                  for (const p of a.peligros) {
                    allDangers.push(p)
                  }
                }
              }
            }
          }
        }
      }
    }

    const catalogIds = Array.from(
      new Set(allDangers.map((d: any) => d.catalogoPeligroId || d.catalogo_peligro_id).filter(Boolean))
    ) as string[]

    const matrixDangerIds = Array.from(
      new Set(allDangers.map((d: any) => d.id).filter(Boolean))
    ) as string[]

    const [catalogPlans, directPlans] = await Promise.all([
      catalogIds.length > 0
        ? prisma.planAccion5W2H.findMany({
            where: {
              peligroCatalogoId: { in: catalogIds },
              deletedAt: null,
            },
            include: {
              peligroCatalogo: {
                select: { id: true, codigo: true, clasificacion: true, descripcion: true },
              },
            },
            orderBy: [{ peligroCatalogoId: 'asc' }, { orden: 'asc' }],
          })
        : [],
      matrixDangerIds.length > 0
        ? prisma.planAccion5W2H.findMany({
            where: {
              peligroId: { in: matrixDangerIds },
              deletedAt: null,
            },
            include: {
              peligro: {
                select: { id: true, clasificacion: true, descripcion: true },
              },
            },
            orderBy: [{ peligroId: 'asc' }, { orden: 'asc' }],
          })
        : [],
    ])

    // De-duplicate actions
    const combined5w2h: any[] = []
    const seenActionIds = new Set<string>()

    for (const cp of catalogPlans) {
      if (!seenActionIds.has(cp.id)) {
        seenActionIds.add(cp.id)
        combined5w2h.push({
          codigo: cp.peligroCatalogo?.codigo || '',
          clasificacion: cp.peligroCatalogo?.clasificacion || '',
          peligro: cp.peligroCatalogo?.descripcion || '',
          que: cp.que,
          porQue: cp.porQue || '',
          donde: cp.donde || matrizData.area || '',
          cuandoInicio: cp.cuandoInicio ? formatDate(cp.cuandoInicio.toISOString()) : '',
          cuandoFin: cp.cuandoFin ? formatDate(cp.cuandoFin.toISOString()) : '',
          responsable: cp.responsable || '',
          como: cp.como || '',
          cuanto: cp.cuanto || '',
          estado: cp.estado || 'PENDIENTE',
        })
      }
    }

    for (const dp of directPlans) {
      if (!seenActionIds.has(dp.id)) {
        seenActionIds.add(dp.id)
        combined5w2h.push({
          codigo: '',
          clasificacion: dp.peligro?.clasificacion || '',
          peligro: dp.peligro?.descripcion || '',
          que: dp.que,
          porQue: dp.porQue || '',
          donde: dp.donde || matrizData.area || '',
          cuandoInicio: dp.cuandoInicio ? formatDate(dp.cuandoInicio.toISOString()) : '',
          cuandoFin: dp.cuandoFin ? formatDate(dp.cuandoFin.toISOString()) : '',
          responsable: dp.responsable || '',
          como: dp.como || '',
          cuanto: dp.cuanto || '',
          estado: dp.estado || 'PENDIENTE',
        })
      }
    }

    // Always create worksheet
    const planSheet = wb.addWorksheet('Plan de Acción 5W2H')

    // Set widths
    planSheet.columns = [
      { key: 'codigo', width: 14 },
      { key: 'clasificacion', width: 20 },
      { key: 'peligro', width: 32 },
      { key: 'que', width: 34 },
      { key: 'porQue', width: 26 },
      { key: 'donde', width: 22 },
      { key: 'cuando', width: 22 },
      { key: 'quien', width: 24 },
      { key: 'como', width: 26 },
      { key: 'cuanto', width: 20 },
      { key: 'estado', width: 16 },
    ]

    // Title rows
    planSheet.mergeCells('A1:K1')
    const tCell = planSheet.getCell('A1')
    tCell.value = 'CLÍNICA SANTA MARÍA S.A.S. - SISTEMA DE GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO'
    tCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
    tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF163522' } }
    tCell.alignment = { horizontal: 'center', vertical: 'middle' }
    planSheet.getRow(1).height = 28

    planSheet.mergeCells('A2:K2')
    const subCell = planSheet.getCell('A2')
    subCell.value = `PLAN DE ACCIÓN 5W2H VINCULADO - ÁREA: ${(matrizData.area || 'GENERAL').toUpperCase()}`
    subCell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } }
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F7D3E' } }
    subCell.alignment = { horizontal: 'center', vertical: 'middle' }
    planSheet.getRow(2).height = 22

    // Header row
    const headers5w2h = [
      'CÓDIGO',
      'CLASIFICACIÓN',
      'PELIGRO ASOCIADO',
      'QUÉ (WHAT) - Acción',
      'POR QUÉ (WHY) - Justificación',
      'DÓNDE (WHERE) - Área/Lugar',
      'CUÁNDO (WHEN) - Fechas',
      'QUIÉN (WHO) - Responsable',
      'CÓMO (HOW) - Procedimiento',
      'CUÁNTO (HOW MUCH) - Recursos',
      'ESTADO',
    ]

    const hRow = planSheet.getRow(4)
    hRow.height = 26
    headers5w2h.forEach((h, idx) => {
      const cell = hRow.getCell(idx + 1)
      cell.value = h
      cell.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FFFFFFFF' } }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F7D3E' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      applyStandardBorder(cell)
    })

    let pRowIdx = 5
    if (combined5w2h.length === 0) {
      planSheet.getRow(pRowIdx).height = 24
      planSheet.mergeCells(`A${pRowIdx}:K${pRowIdx}`)
      const emptyCell = planSheet.getCell(`A${pRowIdx}`)
      emptyCell.value = 'No se registran acciones 5W2H formuladas aún para los peligros de esta matriz.'
      emptyCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF777777' } }
      emptyCell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyStandardBorder(emptyCell)
    } else {
      for (const item of combined5w2h) {
        const row = planSheet.getRow(pRowIdx)
        row.height = 24

        const c1 = row.getCell(1)
        c1.value = item.codigo
        c1.alignment = { horizontal: 'center', vertical: 'middle' }
        c1.font = { name: 'Arial', size: 9, bold: true }

        const c2 = row.getCell(2)
        c2.value = item.clasificacion
        c2.alignment = { horizontal: 'left', vertical: 'middle' }
        c2.font = { name: 'Arial', size: 9 }

        const c3 = row.getCell(3)
        c3.value = item.peligro
        c3.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
        c3.font = { name: 'Arial', size: 9, bold: true }

        const c4 = row.getCell(4)
        c4.value = item.que
        c4.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
        c4.font = { name: 'Arial', size: 9 }

        const c5 = row.getCell(5)
        c5.value = item.porQue
        c5.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
        c5.font = { name: 'Arial', size: 9 }

        const c6 = row.getCell(6)
        c6.value = item.donde
        c6.alignment = { horizontal: 'left', vertical: 'middle' }
        c6.font = { name: 'Arial', size: 9 }

        const c7 = row.getCell(7)
        c7.value = item.cuandoInicio || item.cuandoFin ? `${item.cuandoInicio} - ${item.cuandoFin}` : ''
        c7.alignment = { horizontal: 'center', vertical: 'middle' }
        c7.font = { name: 'Arial', size: 9 }

        const c8 = row.getCell(8)
        c8.value = item.responsable
        c8.alignment = { horizontal: 'left', vertical: 'middle' }
        c8.font = { name: 'Arial', size: 9 }

        const c9 = row.getCell(9)
        c9.value = item.como
        c9.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
        c9.font = { name: 'Arial', size: 9 }

        const c10 = row.getCell(10)
        c10.value = item.cuanto
        c10.alignment = { horizontal: 'left', vertical: 'middle' }
        c10.font = { name: 'Arial', size: 9 }

        const c11 = row.getCell(11)
        c11.value = item.estado
        c11.alignment = { horizontal: 'center', vertical: 'middle' }
        if (item.estado === 'EJECUTADO') {
          c11.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1E7DD' } }
          c11.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF0F5132' } }
        } else if (item.estado === 'EN_PROCESO') {
          c11.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } }
          c11.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF664D03' } }
        } else {
          c11.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }
          c11.font = { name: 'Arial', size: 9, bold: true, color: { argb: 'FF495057' } }
        }

        for (let c = 1; c <= 11; c++) {
          applyStandardBorder(row.getCell(c))
        }

        pRowIdx++
      }
    }

    const buf = await wb.xlsx.writeBuffer()
    const sanitizedArea = (matrizData.area || 'Matriz').toUpperCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '')
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="Matriz_${sanitizedArea}_${dateStr}.xlsx"`)
    return res.status(200).send(Buffer.from(buf))

  } catch (error) {
    console.error('Export error:', error)
    return res.status(500).json({ error: 'Failed to export matriz' })
  }
}