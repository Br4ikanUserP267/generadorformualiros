"use client"

import ExcelJS from 'exceljs'

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
  name?: string
  tipo?: string
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

function colNumberToLetter(n: number): string {
  let s = ''
  while (n > 0) {
    const m = (n - 1) % 26
    s = String.fromCharCode(65 + m) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
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

// ============================================================================
// Main Export Function
// ============================================================================

export async function exportMatrizToExcel(matrizData: MatrizData): Promise<void> {
  try {
    const wb = new ExcelJS.Workbook()

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
      24: 10, // X - Requisito Legal
      25: 15, // Y - Eliminacion
      26: 15, // Z - Sustitucion
      27: 25, // AA - Controles Ingenieria
      28: 25, // AB - Controles Admin
      29: 25, // AC - EPP
      30: 18, // AD - Intervencion Responsable
      31: 14  // AE - Fecha Ejecucion
    }

    for (const [col, width] of Object.entries(colWidths)) {
      ws.getColumn(parseInt(col)).width = width
    }

    // ========== HEADER BLOCK (Rows 2-5) ==========
    // Row 2
    ws.mergeCells('D2:AC2')
    const cell_D2 = ws.getCell('D2')
    cell_D2.value = 'SISTEMAS INTEGRADOS GESTIÓN'
    cell_D2.font = { bold: true, name: 'Arial', size: 11 }
    cell_D2.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_D2)

    const cell_AD2 = ws.getCell('AD2')
    cell_AD2.value = 'Código:'
    cell_AD2.font = { bold: true, name: 'Arial', size: 11 }
    cell_AD2.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_AD2)

    const cell_AE2 = ws.getCell('AE2')
    cell_AE2.value = '45.17-FOR-38'
    cell_AE2.font = { bold: true, name: 'Arial', size: 11 }
    cell_AE2.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_AE2)

    // Row 3
    ws.mergeCells('D3:AC3')
    const cell_D3 = ws.getCell('D3')
    cell_D3.value = 'CLINICA SANTA MARIA S.A.S.'
    cell_D3.font = { bold: true, name: 'Arial', size: 11 }
    cell_D3.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_D3)

    const cell_AD3 = ws.getCell('AD3')
    cell_AD3.value = 'Versión:'
    cell_AD3.font = { bold: true, name: 'Arial', size: 11 }
    cell_AD3.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_AD3)

    const cell_AE3 = ws.getCell('AE3')
    cell_AE3.value = '02'
    cell_AE3.font = { bold: true, name: 'Arial', size: 11 }
    cell_AE3.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_AE3)

    // Row 4
    ws.mergeCells('D4:AC5')
    const cell_D4 = ws.getCell('D4')
    cell_D4.value = 'MATRIZ DE IDENTIFICACIÓN DE PELIGROS Y VALORACIÓN DE RIESGOS'
    cell_D4.font = { bold: true, name: 'Arial', size: 11 }
    cell_D4.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    applyStandardBorder(cell_D4)

    const cell_AD4 = ws.getCell('AD4')
    cell_AD4.value = 'Fecha:'
    cell_AD4.font = { bold: true, name: 'Arial', size: 11 }
    cell_AD4.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_AD4)

    const cell_AE4 = ws.getCell('AE4')
    cell_AE4.value = '26/4/2019'
    cell_AE4.font = { bold: true, name: 'Arial', size: 11 }
    cell_AE4.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_AE4)

    const cell_AD5 = ws.getCell('AD5')
    cell_AD5.value = 'Página:'
    cell_AD5.font = { bold: true, name: 'Arial', size: 11 }
    cell_AD5.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_AD5)

    const cell_AE5 = ws.getCell('AE5')
    cell_AE5.value = '1 de 1'
    cell_AE5.font = { bold: true, name: 'Arial', size: 11 }
    cell_AE5.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_AE5)

    // ========== INFO ROW (Row 7) ==========
    const tealFill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF006666' } }
    const tealFont = { bold: true, name: 'Arial', size: 10, color: { argb: 'FFFFFFFF' } }

    // B7:C7 - ÁREA / PROCESO
    ws.mergeCells('B7:C7')
    const cell_B7 = ws.getCell('B7')
    cell_B7.value = 'ÁREA / PROCESO'
    cell_B7.font = tealFont
    cell_B7.fill = tealFill
    cell_B7.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_B7)

    // D7:G7
    ws.mergeCells('D7:G7')
    const cell_D7 = ws.getCell('D7')
    cell_D7.value = matrizData.area || ''
    cell_D7.font = { name: 'Arial', size: 10 }
    cell_D7.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_D7)

    // I7:J7
    ws.mergeCells('I7:J7')
    const cell_I7 = ws.getCell('I7')
    cell_I7.value = 'RESPONSABLE'
    cell_I7.font = tealFont
    cell_I7.fill = tealFill
    cell_I7.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_I7)

    // K7:L7
    ws.mergeCells('K7:L7')
    const cell_K7 = ws.getCell('K7')
    cell_K7.value = matrizData.responsable || ''
    cell_K7.font = { name: 'Arial', size: 10 }
    cell_K7.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_K7)

    // N7:P7
    ws.mergeCells('N7:P7')
    const cell_N7 = ws.getCell('N7')
    cell_N7.value = 'FECHA ELABORACIÓN'
    cell_N7.font = tealFont
    cell_N7.fill = tealFill
    cell_N7.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_N7)

    // Q7:T7
    ws.mergeCells('Q7:T7')
    const cell_Q7 = ws.getCell('Q7')
    cell_Q7.value = formatDate(matrizData.fecha_elaboracion) || ''
    cell_Q7.font = { name: 'Arial', size: 10 }
    cell_Q7.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_Q7)

    // V7:X7
    ws.mergeCells('V7:X7')
    const cell_V7 = ws.getCell('V7')
    cell_V7.value = 'FECHA DE ACTUALIZACIÓN'
    cell_V7.font = tealFont
    cell_V7.fill = tealFill
    cell_V7.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_V7)

    // Y7:AA7
    ws.mergeCells('Y7:AA7')
    const cell_Y7 = ws.getCell('Y7')
    cell_Y7.value = formatDate(matrizData.fecha_actualizacion) || ''
    cell_Y7.font = { name: 'Arial', size: 10 }
    cell_Y7.alignment = { horizontal: 'center', vertical: 'middle' }
    applyStandardBorder(cell_Y7)

    // ========== COLUMN HEADERS (Rows 9-10) ==========
    const headerFill = tealFill
    const headerFont = tealFont

    function setHeaderCell(
      cell: ExcelJS.Cell,
      value: string,
      merge?: string
    ) {
      cell.value = value
      cell.font = headerFont
      cell.fill = headerFill
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      applyStandardBorder(cell)
    }

    // B9:B10
    ws.mergeCells('B9:B10')
    setHeaderCell(ws.getCell('B9'), 'PROCESO')

    // C9:C10
    ws.mergeCells('C9:C10')
    setHeaderCell(ws.getCell('C9'), 'ZONA/LUGAR')

    // D9:D10
    ws.mergeCells('D9:D10')
    setHeaderCell(ws.getCell('D9'), 'ACTIVIDADES')

    // E9:E10
    ws.mergeCells('E9:E10')
    setHeaderCell(ws.getCell('E9'), 'TAREAS')

    // F9:F10
    ws.mergeCells('F9:F10')
    setHeaderCell(ws.getCell('F9'), 'CARGO')

    // G9:G10
    ws.mergeCells('G9:G10')
    setHeaderCell(ws.getCell('G9'), 'RUTINARIO\nSI O NO')

    // H9:I9 (PELIGROS header)
    ws.mergeCells('H9:I9')
    setHeaderCell(ws.getCell('H9'), 'PELIGROS')
    setHeaderCell(ws.getCell('H10'), 'Descripción')
    setHeaderCell(ws.getCell('I10'), 'Clasificación')

    // J9:J10
    ws.mergeCells('J9:J10')
    setHeaderCell(ws.getCell('J9'), 'EFECTOS POSIBLES')

    // K9:M9 (CONTROLES header)
    ws.mergeCells('K9:M9')
    setHeaderCell(ws.getCell('K9'), 'CONTROLES EXISTENTES')
    setHeaderCell(ws.getCell('K10'), 'Fuente')
    setHeaderCell(ws.getCell('L10'), 'Medio')
    setHeaderCell(ws.getCell('M10'), 'Individuo')

    // N9:T9 (EVALUACIÓN header)
    ws.mergeCells('N9:T9')
    setHeaderCell(ws.getCell('N9'), 'EVALUACIÓN DEL RIESGO')
    setHeaderCell(ws.getCell('N10'), 'Nivel\nDeficiencia')
    setHeaderCell(ws.getCell('O10'), 'Nivel\nExposición')
    setHeaderCell(ws.getCell('P10'), 'Nivel\nProbabilidad')
    setHeaderCell(ws.getCell('Q10'), 'Interpretación\nNivel\nProbabilidad')
    setHeaderCell(ws.getCell('R10'), 'Nivel\nConsecuencia')
    setHeaderCell(ws.getCell('S10'), 'Nivel\nRiesgo')
    setHeaderCell(ws.getCell('T10'), 'Interpretación\nNivel Riesgo')

    // U9:U10
    ws.mergeCells('U9:U10')
    setHeaderCell(ws.getCell('U9'), 'VALORACIÓN\nDEL RIESGO')

    // V9:X9 (CRITERIOS header)
    ws.mergeCells('V9:X9')
    setHeaderCell(ws.getCell('V9'), 'CRITERIOS PARA ESTABLECER CONTROLES')
    setHeaderCell(ws.getCell('V10'), 'N° de Expuestos')
    setHeaderCell(ws.getCell('W10'), 'Peor Consecuencia')
    setHeaderCell(ws.getCell('X10'), 'Existencia de\nRequisito Legal\n(Si o No)')

    // Y9:AC9 (MEDIDAS header)
    ws.mergeCells('Y9:AC9')
    setHeaderCell(ws.getCell('Y9'), 'MEDIDAS DE INTERVENCIÓN')
    setHeaderCell(ws.getCell('Y10'), 'Eliminación')
    setHeaderCell(ws.getCell('Z10'), 'Sustitución')
    setHeaderCell(ws.getCell('AA10'), 'Controles de\nIngeniería')
    setHeaderCell(ws.getCell('AB10'), 'Señalización,\nAdvertencia,\nControles\nAdministrativos')
    setHeaderCell(ws.getCell('AC10'), 'Equipos /\nElementos de\nProtección Personal')

    // AD9:AE9 (SEGUIMIENTO header)
    ws.mergeCells('AD9:AE9')
    setHeaderCell(ws.getCell('AD9'), 'SEGUIMIENTO MEDIDAS\nDE INTERVENCIÓN')
    setHeaderCell(ws.getCell('AD10'), 'Intervención')
    setHeaderCell(ws.getCell('AE10'), 'Fecha de\nEjecución')

    ws.getRow(9).height = 30
    ws.getRow(10).height = 40

    // ========== DATA ROWS (Starting row 11) ==========
    let currentRow = 11
    const mergeRanges: string[] = []

    // Build data structure to track row positions for merging
    interface RowTracker {
      procesoProcesosStartRow: number
      procesoZonasStartRow: number
      zonaActividadesStartRow: number
      actividadPeligrosStartRow: number
      peligroRowCount: number
    }

    const processGrouping = new Map<string, { name: string; zonas: Map<string, { name: string; actividades: Map<string, { name: string; descripcion: string; tareas: string; cargo: string; rutinario: boolean; peligros: Peligro[] }> }> }>()

    // Group data hierarchically
    if (matrizData.procesos) {
      for (const proceso of matrizData.procesos) {
        const procesoKey = proceso.id || proceso.nombre || 'Unknown'
        if (!processGrouping.has(procesoKey)) {
          processGrouping.set(procesoKey, { name: proceso.nombre || '', zonas: new Map() })
        }

        const procesoData = processGrouping.get(procesoKey)!
        if (proceso.zonas) {
          for (const zona of proceso.zonas) {
            const zonaKey = zona.id || zona.nombre || 'Unknown'
            if (!procesoData.zonas.has(zonaKey)) {
              procesoData.zonas.set(zonaKey, { name: zona.nombre || '', actividades: new Map() })
            }

            const zonaData = procesoData.zonas.get(zonaKey)!
            if (zona.actividades) {
              for (const actividad of zona.actividades) {
                const actividadKey = actividad.id || actividad.nombre || 'Unknown'
                if (!zonaData.actividades.has(actividadKey)) {
                  zonaData.actividades.set(actividadKey, {
                    name: actividad.nombre || '',
                    descripcion: actividad.descripcion || '',
                    tareas: actividad.tareas || '',
                    cargo: actividad.cargo || '',
                    rutinario: actividad.rutinario || false,
                    peligros: actividad.peligros || []
                  })
                }
              }
            }
          }
        }
      }
    }

    // Iterate and write data rows
    for (const [procesoProcesosKey, procesoData] of processGrouping.entries()) {
      const procesoProcesosStartRow = currentRow

      for (const [procesoZonasKey, zonaData] of procesoData.zonas.entries()) {
        const procesoZonasStartRow = currentRow

        for (const [zonaActividadesKey, actividadData] of zonaData.actividades.entries()) {
          const zonaActividadesStartRow = currentRow

          for (let peligroIndex = 0; peligroIndex < actividadData.peligros.length; peligroIndex++) {
            const peligro = actividadData.peligros[peligroIndex]
            const row = ws.getRow(currentRow)

            const control = peligro.control || peligro.controles || {}
            const evaluacion = peligro.evaluacion || {}
            const criterio = peligro.criterio || peligro.criterios || {}
            const intervencion = peligro.intervencion || {}

            // Column B - PROCESO (will merge later)
            row.getCell(2).value = procesoData.name

            // Column C - ZONA (will merge later)
            row.getCell(3).value = zonaData.name

            // Column D - ACTIVIDAD (will merge later)
            row.getCell(4).value = actividadData.descripcion

            // Column E - TAREAS (will merge later)
            row.getCell(5).value = actividadData.tareas

            // Column F - CARGO (will merge later)
            row.getCell(6).value = actividadData.cargo

            // Column G - RUTINARIO (will merge later)
            row.getCell(7).value = peligro.rutinario || actividadData.rutinario ? 'Sí' : 'No'

            // Column H - PELIGRO Descripción
            row.getCell(8).value = peligro.descripcion || ''

            // Column I - PELIGRO Clasificación
            row.getCell(9).value = peligro.clasificacion || ''

            // Column J - EFECTOS POSIBLES
            row.getCell(10).value = peligro.efectos_posibles || peligro.efectos || ''

            // Column K - CONTROLES Fuente
            row.getCell(11).value = control.fuente || ''

            // Column L - CONTROLES Medio
            row.getCell(12).value = control.medio || ''

            // Column M - CONTROLES Individuo
            row.getCell(13).value = control.individuo || ''

            // Column N - Nivel Deficiencia
            row.getCell(14).value = evaluacion.nivel_deficiencia || evaluacion.nd || 0

            // Column O - Nivel Exposición
            row.getCell(15).value = evaluacion.nivel_exposicion || evaluacion.ne || 0

            // Column P - Nivel Probabilidad
            row.getCell(16).value = evaluacion.nivel_probabilidad || evaluacion.np || 0

            // Column Q - Interpretación Probabilidad
            row.getCell(17).value = evaluacion.interp_probabilidad || evaluacion.interp_np || ''

            // Column R - Nivel Consecuencia
            row.getCell(18).value = evaluacion.nivel_consecuencia || evaluacion.nc || 0

            // Column S - Nivel Riesgo
            row.getCell(19).value = evaluacion.nivel_riesgo || evaluacion.nr || 0

            // Column T - Interpretación Riesgo
            row.getCell(20).value = evaluacion.interp_riesgo || evaluacion.interp_nr || ''

            // Column U - Aceptabilidad
            row.getCell(21).value = evaluacion.aceptabilidad || ''

            // Column V - N° Expuestos (will merge later)
            row.getCell(22).value = criterio.num_expuestos || criterio.numExpuestos || ''

            // Column W - Peor Consecuencia
            row.getCell(23).value = criterio.peor_consecuencia || criterio.peorConsecuencia || ''

            // Column X - Requisito Legal
            const hasReq = criterio.requisito_legal || criterio.requisitoLegal
            row.getCell(24).value = hasReq ? 'Sí' : 'No'

            // Columns Y-AC - Interventions
            row.getCell(25).value = intervencion.eliminacion || '' // Y
            row.getCell(26).value = intervencion.sustitucion || '' // Z
            row.getCell(27).value = intervencion.controles_ingenieria || '' // AA
            row.getCell(28).value = intervencion.controles_administrativos || '' // AB
            row.getCell(29).value = intervencion.epp || '' // AC

            // Column AD - Responsable Intervención
            row.getCell(30).value = intervencion.responsable || ''

            // Column AE - Fecha Ejecución
            row.getCell(31).value = formatDate(intervencion.fecha_ejecucion) || ''

            // Apply cell formatting
            row.height = 45
            row.eachCell({ includeEmpty: true }, (cell) => {
              cell.font = { name: 'Arial', size: 9 }
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
              applyStandardBorder(cell)
            })

            currentRow++
          }

          // Merge cells for actividad rows
          const actividadRowStart = zonaActividadesStartRow
          const actividadRowEnd = currentRow - 1

          if (actividadRowStart <= actividadRowEnd) {
            // Merge D (Actividades)
            mergeRanges.push(`D${actividadRowStart}:D${actividadRowEnd}`)
            // Merge E (Tareas)
            mergeRanges.push(`E${actividadRowStart}:E${actividadRowEnd}`)
            // Merge F (Cargo)
            mergeRanges.push(`F${actividadRowStart}:F${actividadRowEnd}`)
            // Merge G (Rutinario)
            mergeRanges.push(`G${actividadRowStart}:G${actividadRowEnd}`)
          }
        }

        // Merge cells for zona rows
        const zonaRowStart = procesoZonasStartRow
        const zonaRowEnd = currentRow - 1

        if (zonaRowStart <= zonaRowEnd) {
          // Merge C (Zona)
          mergeRanges.push(`C${zonaRowStart}:C${zonaRowEnd}`)
          
          // Merge V (N° Expuestos) only for consecutive cells with same value
          let currentValue = ws.getCell(`V${zonaRowStart}`).value
          let mergeStart = zonaRowStart
          
          for (let row = zonaRowStart + 1; row <= zonaRowEnd + 1; row++) {
            const nextValue = row <= zonaRowEnd ? ws.getCell(`V${row}`).value : null
            
            // If value changed or we've reached the end, merge the previous group if it spans multiple rows
            if (nextValue !== currentValue) {
              if (row - 1 > mergeStart) {
                // Only merge if there are multiple consecutive rows with the same value
                mergeRanges.push(`V${mergeStart}:V${row - 1}`)
              }
              currentValue = nextValue
              mergeStart = row
            }
          }
        }
      }

      // Merge cells for proceso rows
      const procesoRowStart = procesoProcesosStartRow
      const procesoRowEnd = currentRow - 1

      if (procesoRowStart <= procesoRowEnd) {
        // Merge B (Proceso)
        mergeRanges.push(`B${procesoRowStart}:B${procesoRowEnd}`)
      }
    }

    // Apply all merges
    for (const range of mergeRanges) {
      try {
        ws.mergeCells(range)
      } catch (e) {
        // Merge failed, continue
      }
    }

    // Freeze panes
    ws.views = [{ state: 'frozen', ySplit: 10 }]

    // ========== FOTOGRAFIAS SHEET ==========
    const photoSheet = wb.addWorksheet('Fotografias')
    photoSheet.getColumn(1).width = 3
    photoSheet.getColumn(2).width = 40
    photoSheet.getColumn(3).width = 40
    photoSheet.getColumn(4).width = 40
    photoSheet.getColumn(5).width = 40

    const archivos = matrizData.archivos || matrizData.files || []

    if (!archivos || archivos.length === 0) {
      // No files
      const cell = photoSheet.getCell('B2')
      cell.value = 'Sin fotografías adjuntas'
      cell.font = { name: 'Arial', size: 11 }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
    } else {
      // Group files in columns of 4 per row
      let fileIndex = 0
      let photoRow = 2
      const filesPerRow = 4

      while (fileIndex < archivos.length) {
        for (let col = 0; col < filesPerRow && fileIndex < archivos.length; col++) {
          const archivo = archivos[fileIndex]
          const startCol = col * 1 + 2 // Start from column B
          const endCol = startCol + 1 // Span 2 columns

          // Header row with filename
          const headerCell = photoSheet.getCell(photoRow, startCol)
          photoSheet.mergeCells(photoRow, startCol, photoRow, endCol)
          const fileName = archivo.nombre_original || archivo.name || 'Archivo'
          headerCell.value = fileName
          headerCell.font = { bold: true, name: 'Arial', size: 10 }
          headerCell.alignment = { horizontal: 'center', vertical: 'middle' }
          applyStandardBorder(headerCell)

          // Empty rows below header for image area (rows photoRow+1 to photoRow+20)
          for (let i = 1; i <= 20; i++) {
            const cell = photoSheet.getCell(photoRow + i, startCol)
            cell.alignment = { horizontal: 'center', vertical: 'middle' }
            applyStandardBorder(cell)
          }

          // Add URL as hyperlink in the cell below header
          const fileUrl = archivo.url || archivo.data
          if (fileUrl) {
            const urlCell = photoSheet.getCell(photoRow + 1, startCol)
            urlCell.value = {
              text: 'Ver archivo',
              hyperlink: fileUrl
            }
            urlCell.font = { color: { argb: 'FF0563C1' }, underline: true }
            urlCell.alignment = { horizontal: 'center', vertical: 'middle' }
          }

          fileIndex++
        }
        photoRow += 21 // Move to next row after processing up to 4 files
      }
    }

    // ========== DOWNLOAD ==========
    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const sanitizedArea = (matrizData.area || 'Matriz')
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]/g, '')
    link.download = `Matriz_${sanitizedArea}_${dateStr}.xlsx`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error generating Excel:', error)
    throw error
  }
}
