import { NextApiRequest, NextApiResponse } from 'next'
import ExcelJS from 'exceljs'
import fs from 'fs/promises'
import path from 'path'

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
      const logoPath = path.join(process.cwd(), 'public', 'logo_csm.png')
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
    ws.getCell('AE4').value = formatDate(matrizData.fecha_elaboracion) || '26/4/2019'
    ws.getCell('AE4').alignment = { horizontal: 'center' }

    // Row 5
    ws.getCell('AD5').value = 'Página:'
    ws.getCell('AD5').font = { bold: true, name: 'Arial', size: 10 }
    ws.getCell('AE5').value = '1 de 1'
    ws.getCell('AE5').alignment = { horizontal: 'center' }

    // Row 7 (Info row)
    ws.mergeCells('B7:C7')
    ws.getCell('B7').value = 'ÁREA / PROCESO'
    ws.getCell('B7').font = { bold: true, name: 'Arial', size: 10 }

    ws.mergeCells('D7:H7')
    ws.getCell('D7').value = matrizData.area || ''
    ws.getCell('D7').alignment = { horizontal: 'center' }

    ws.mergeCells('I7:J7')
    ws.getCell('I7').value = 'RESPONSABLE'
    ws.getCell('I7').font = { bold: true, name: 'Arial', size: 10 }

    ws.mergeCells('K7:M7')
    ws.getCell('K7').value = matrizData.responsable || ''
    ws.getCell('K7').alignment = { horizontal: 'center' }

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

    // Column Headers (Row 8 & 9)
    const headerRow8 = ws.getRow(8)
    const headerRow9 = ws.getRow(9)

    headerRow8.height = 30
    headerRow9.height = 60

    // Setup headers
    const headers = [
      { col: 'B', text: 'PROCESO', merge: 'B8:B9' },
      { col: 'C', text: 'ZONA / LUGAR', merge: 'C8:C9' },
      { col: 'D', text: 'ACTIVIDADES', merge: 'D8:D9' },
      { col: 'E', text: 'TAREAS', merge: 'E8:E9' },
      { col: 'F', text: 'CARGO\n(Personal involucrado expuesto)', merge: 'F8:F9' },
      { col: 'G', text: 'RUTINARIO (SI O NO)', merge: 'G8:G9' },
      { col: 'H', text: 'PELIGROS', merge: 'H8:I8' },
      { col: 'J', text: 'EFECTOS POSIBLES', merge: 'J8:J9' },
      { col: 'K', text: 'CONTROLES EXISTENTES', merge: 'K8:M8' },
      { col: 'N', text: 'EVALUACIÓN DEL RIESGO', merge: 'N8:T8' },
      { col: 'U', text: 'VALORACIÓN DEL RIESGO', merge: 'U8:U9' },
      { col: 'V', text: 'CRITERIOS PARA ESTABLECER CONTROLES', merge: 'V8:X8' },
      { col: 'Y', text: 'MEDIDAS DE INTERVENCIÓN', merge: 'Y8:AC8' },
      { col: 'AD', text: 'SEGUIMIENTO CONTROLES', merge: 'AD8:AE8' }
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
      { col: 'S', text: 'Nivel de Riesgo' },
      { col: 'T', text: 'Interpretación Nivel de Riesgo' },
      // U is merged from row 8
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
      const cell = ws.getCell(`${h.col}8`)
      cell.value = h.text
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 9 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      applyStandardBorder(cell)
    }

    for (const sh of subHeaders) {
      const cell = ws.getCell(`${sh.col}9`)
      cell.value = sh.text
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, name: 'Arial', size: 9 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } }
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      applyStandardBorder(cell)
    }

    // Apply borders to all header cells
    for (let c = 2; c <= 31; c++) {
      const colLetter = ws.getColumn(c).letter
      applyStandardBorder(ws.getCell(`${colLetter}8`))
      applyStandardBorder(ws.getCell(`${colLetter}9`))
    }

    // Data rows
    let currentRow = 10
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
            
            // Requisito Legal Merge Check (Column X)
            let mergeReq = true
            const valX = ws.getCell(`X${startR}`).value
            for (let r = startR + 1; r <= endR; r++) {
              if (ws.getCell(`X${r}`).value !== valX) {
                mergeReq = false
                break
              }
            }
            if (mergeReq) {
              mergeRanges.push(`X${startR}:X${endR}`)
            }
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