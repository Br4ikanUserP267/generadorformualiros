import ExcelJS from 'exceljs'
import type { ImportPreviewRow, ImportRowError, ParsedImport, ParsedPeligro } from '@/lib/riesgos-import-store'

export const EXPECTED_HEADERS = [
  'Proceso',
  'Zona / Lugar',
  'Actividad',
  'Descripción de la Actividad',
  'Tareas',
  'Cargo',
  'Rutinario',
  'Peligro',
  'Clasificación del Peligro',
  'Efectos Posibles',
  'Control Fuente',
  'Control Medio',
  'Control Individuo',
  'ND',
  'NE',
  'NC',
  'Num. Expuestos',
  'Peor Consecuencia',
  'Requisito Legal',
  'Eliminación',
  'Sustitución',
  'Controles Ingeniería',
  'Controles Administrativos',
  'EPP',
  'Responsable Intervención',
  'Fecha Ejecución',
]

type RawRow = Record<string, string>

function cleanString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

type ImportFieldKey =
  | 'proceso'
  | 'zona'
  | 'actividad'
  | 'descripcionActividad'
  | 'tareas'
  | 'cargo'
  | 'rutinario'
  | 'peligro'
  | 'clasificacion'
  | 'efectos'
  | 'controlFuente'
  | 'controlMedio'
  | 'controlIndividuo'
  | 'nd'
  | 'ne'
  | 'nc'
  | 'numExpuestos'
  | 'peorConsecuencia'
  | 'requisitoLegal'
  | 'eliminacion'
  | 'sustitucion'
  | 'controlesIngenieria'
  | 'controlesAdministrativos'
  | 'epp'
  | 'responsableIntervencion'
  | 'fechaEjecucion'

const REQUIRED_IMPORT_FIELDS: ImportFieldKey[] = [
  'proceso',
  'zona',
  'actividad',
  'descripcionActividad',
  'tareas',
  'cargo',
  'rutinario',
  'peligro',
  'clasificacion',
  'efectos',
  'controlFuente',
  'controlMedio',
  'controlIndividuo',
  'nd',
  'ne',
  'nc',
  'numExpuestos',
  'peorConsecuencia',
  'requisitoLegal',
  'eliminacion',
  'sustitucion',
  'controlesIngenieria',
  'controlesAdministrativos',
  'epp',
  'responsableIntervencion',
  'fechaEjecucion',
]

const FIELD_LABELS: Record<ImportFieldKey, string> = {
  proceso: 'Proceso',
  zona: 'Zona / Lugar',
  actividad: 'Actividad',
  descripcionActividad: 'Descripción de la Actividad',
  tareas: 'Tareas',
  cargo: 'Cargo',
  rutinario: 'Rutinario',
  peligro: 'Peligro',
  clasificacion: 'Clasificación del Peligro',
  efectos: 'Efectos Posibles',
  controlFuente: 'Control Fuente',
  controlMedio: 'Control Medio',
  controlIndividuo: 'Control Individuo',
  nd: 'ND',
  ne: 'NE',
  nc: 'NC',
  numExpuestos: 'Num. Expuestos',
  peorConsecuencia: 'Peor Consecuencia',
  requisitoLegal: 'Requisito Legal',
  eliminacion: 'Eliminación',
  sustitucion: 'Sustitución',
  controlesIngenieria: 'Controles Ingeniería',
  controlesAdministrativos: 'Controles Administrativos',
  epp: 'EPP',
  responsableIntervencion: 'Responsable Intervención',
  fechaEjecucion: 'Fecha Ejecución',
}

const FIELD_ALIASES: Record<ImportFieldKey, string[]> = {
  proceso: ['proceso', 'area / proceso', 'area proceso'],
  zona: ['zona / lugar', 'zona/lugar', 'zona lugar', 'zona'],
  actividad: ['actividad', 'actividades', 'descripcion de la actividad', 'actividades descripcion'],
  descripcionActividad: ['descripcion de la actividad', 'descripcion actividad', 'actividades', 'actividad'],
  tareas: ['tareas', 'tarea'],
  cargo: ['cargo'],
  rutinario: ['rutinario', 'rutinario si o no', 'si o no'],
  peligro: ['peligro', 'peligros', 'peligros descripcion', 'descripcion peligro'],
  clasificacion: ['clasificacion del peligro', 'clasificacion peligro', 'clasificacion', 'peligros clasificacion'],
  efectos: ['efectos posibles', 'efectos'],
  controlFuente: ['control fuente', 'controles existentes fuente', 'fuente'],
  controlMedio: ['control medio', 'controles existentes medio', 'medio'],
  controlIndividuo: ['control individuo', 'controles existentes individuo', 'individuo'],
  nd: ['nd', 'nivel deficiencia', 'evaluacion del riesgo nivel deficiencia'],
  ne: ['ne', 'nivel exposicion', 'evaluacion del riesgo nivel exposicion'],
  nc: ['nc', 'nivel consecuencia', 'evaluacion del riesgo nivel consecuencia'],
  numExpuestos: ['num. expuestos', 'num expuestos', 'numero expuestos', 'n de expuestos', 'n° de expuestos'],
  peorConsecuencia: ['peor consecuencia'],
  requisitoLegal: ['requisito legal', 'existencia de requisito legal', 'existencia de requisito legal o especifico'],
  eliminacion: ['eliminacion', 'medidas de intervencion eliminacion'],
  sustitucion: ['sustitucion', 'medidas de intervencion sustitucion'],
  controlesIngenieria: ['controles ingenieria', 'controles de ingenieria', 'medidas de intervencion controles de ingenieria'],
  controlesAdministrativos: ['controles administrativos', 'senalizacion advertencia controles administrativos'],
  epp: ['epp', 'equipos / elementos de proteccion personal', 'equipos elementos de proteccion personal'],
  responsableIntervencion: ['responsable intervencion', 'intervencion', 'seguimiento medidas de intervencion intervencion'],
  fechaEjecucion: ['fecha ejecucion', 'seguimiento medidas de intervencion fecha de ejecucion'],
}

type HeaderDetection = {
  headerRowIndex: number
  dataStartRow: number
  mapping: Partial<Record<ImportFieldKey, number>>
}

const WORKBOOK_LAYOUT = {
  metadata: {
    area: { row: 7, col: 4 },
    responsable: { row: 7, col: 11 },
    fechaElaboracion: { row: 7, col: 17 },
    fechaActualizacion: { row: 7, col: 25 },
  },
  dataStartRow: 11,
  columns: {
    proceso: 2,
    zona: 3,
    actividadDescripcion: 4,
    tareas: 5,
    cargo: 6,
    rutinario: 7,
    peligro: 8,
    clasificacion: 9,
    efectos: 10,
    controlFuente: 11,
    controlMedio: 12,
    controlIndividuo: 13,
    nd: 14,
    ne: 15,
    nivelProbabilidad: 16,
    interpProbabilidad: 17,
    nc: 18,
    nivelRiesgo: 19,
    interpRiesgo: 20,
    valoracionRiesgo: 21,
    numExpuestos: 22,
    peorConsecuencia: 23,
    requisitoLegal: 24,
    eliminacion: 25,
    sustitucion: 26,
    controlesIngenieria: 27,
    controlesAdministrativos: 28,
    epp: 29,
    intervencion: 30,
    fechaEjecucion: 31,
  },
} as const

const SUBHEADER_ALIASES: Record<ImportFieldKey, string[]> = {
  proceso: ['proceso'],
  zona: ['zona/lugar', 'zona / lugar', 'zona lugar'],
  actividad: ['actividades', 'actividad'],
  descripcionActividad: ['actividades', 'actividad'],
  tareas: ['tareas'],
  cargo: ['cargo'],
  rutinario: ['rutinario si o no', 'rutinario'],
  peligro: ['descripcion', 'peligro descripcion', 'peligros descripcion'],
  clasificacion: ['clasificacion'],
  efectos: ['efectos posibles'],
  controlFuente: ['fuente'],
  controlMedio: ['medio'],
  controlIndividuo: ['individuo'],
  nd: ['nivel deficiencia', 'nd'],
  ne: ['nivel exposicion', 'ne'],
  nc: ['nivel consecuencia', 'nc'],
  numExpuestos: ['n° de expuestos', 'n de expuestos', 'num. expuestos', 'num expuestos'],
  peorConsecuencia: ['peor consecuencia'],
  requisitoLegal: ['existencia de requisito legal', 'requisito legal'],
  eliminacion: ['eliminacion'],
  sustitucion: ['sustitucion'],
  controlesIngenieria: ['controles de ingenieria', 'controles ingenieria'],
  controlesAdministrativos: ['senalizacion, advertencia, controles administrativos', 'controles administrativos'],
  epp: ['equipos / elementos de proteccion personal', 'epp'],
  responsableIntervencion: ['intervencion', 'responsable intervencion'],
  fechaEjecucion: ['fecha de ejecucion', 'fecha ejecucion'],
}

function detectStructuredSubheaderMapping(sheet: ExcelJS.Worksheet): HeaderDetection | null {
  const maxScan = Math.min(sheet.rowCount || 1, 60)
  const requiredAnchors: ImportFieldKey[] = ['proceso', 'zona', 'actividad', 'peligro', 'nd', 'ne', 'nc']

  for (let rowIdx = 1; rowIdx <= maxScan; rowIdx++) {
    const row = sheet.getRow(rowIdx)
    const maxCol = Math.max(row.cellCount, 60)
    const mapping: Partial<Record<ImportFieldKey, number>> = {}

    for (let col = 1; col <= maxCol; col++) {
      const txt = normalizeHeader(getEffectiveCellText(sheet, rowIdx, col))
      if (!txt) continue

      for (const field of Object.keys(SUBHEADER_ALIASES) as ImportFieldKey[]) {
        if (mapping[field]) continue
        if (SUBHEADER_ALIASES[field].some((alias) => txt.includes(normalizeHeader(alias)))) {
          mapping[field] = col
        }
      }
    }

    const anchors = requiredAnchors.filter((k) => !!mapping[k]).length
    if (anchors < requiredAnchors.length) continue

    // Template-specific sanity: ND/NE/NC must be contiguous in that order.
    const nd = mapping.nd as number
    const ne = mapping.ne as number
    const nc = mapping.nc as number
    if (!(nd < ne && ne < nc && nc - nd <= 6)) continue

    if (!mapping.descripcionActividad && mapping.actividad) mapping.descripcionActividad = mapping.actividad

    return {
      headerRowIndex: rowIdx,
      dataStartRow: rowIdx + 1,
      mapping,
    }
  }

  return null
}

function detectHeaderMapping(sheet: ExcelJS.Worksheet): HeaderDetection {
  const structured = detectStructuredSubheaderMapping(sheet)
  if (structured) return structured

  const lastRowToScan = Math.min(sheet.rowCount || 1, 35)

  const countHeaderMatchesInRow = (rowIdx: number) => {
    if (rowIdx < 1) return 0
    const row = sheet.getRow(rowIdx)
    const maxCol = Math.max(row.cellCount, 60)
    let count = 0

    for (let col = 1; col <= maxCol; col++) {
      const txt = normalizeHeader(getEffectiveCellText(sheet, rowIdx, col))
      if (!txt) continue
      const isHeaderLike = (Object.keys(FIELD_ALIASES) as ImportFieldKey[]).some((field) =>
        FIELD_ALIASES[field].some((alias) => txt.includes(normalizeHeader(alias)))
      )
      if (isHeaderLike) count += 1
    }

    return count
  }

  let best: HeaderDetection = {
    headerRowIndex: 1,
    dataStartRow: 2,
    mapping: {},
  }

  let bestScore = -1

  for (let rowIdx = 1; rowIdx <= lastRowToScan; rowIdx++) {
    const row = sheet.getRow(rowIdx)
    const mapping: Partial<Record<ImportFieldKey, number>> = {}

    const maxCol = Math.max(row.cellCount, 60)
    for (let col = 1; col <= maxCol; col++) {
      const current = normalizeHeader(getEffectiveCellText(sheet, rowIdx, col))
      const above = normalizeHeader(getEffectiveCellText(sheet, rowIdx - 1, col))
      const below = normalizeHeader(getEffectiveCellText(sheet, rowIdx + 1, col))

      const candidates = [
        current,
        below,
        `${current} ${below}`.trim(),
        `${above} ${current}`.trim(),
        `${above} ${current} ${below}`.trim(),
      ].filter(Boolean)
      if (candidates.length === 0) continue

      for (const field of Object.keys(FIELD_ALIASES) as ImportFieldKey[]) {
        if (mapping[field]) continue
        const aliases = FIELD_ALIASES[field]
        if (aliases.some((a) => candidates.some((c) => c.includes(normalizeHeader(a))))) {
          mapping[field] = col
        }
      }
    }

    const anchorFields: ImportFieldKey[] = ['proceso', 'zona', 'actividad', 'peligro', 'nd', 'ne', 'nc']
    const anchorsFound = anchorFields.filter((k) => !!mapping[k]).length
    const score = Object.keys(mapping).length + (anchorsFound * 3)

    // Avoid selecting weak rows that accidentally match only a few generic labels.
    if (anchorsFound < 4) continue

    if (score > bestScore) {
      const nextRowHeaderLikeCount = countHeaderMatchesInRow(rowIdx + 1)
      bestScore = score
      best = {
        headerRowIndex: rowIdx,
        dataStartRow: rowIdx + (nextRowHeaderLikeCount >= 4 ? 2 : 1),
        mapping,
      }
    }
  }

  if (!best.mapping.actividad && best.mapping.descripcionActividad) {
    best.mapping.actividad = best.mapping.descripcionActividad
  }
  if (!best.mapping.descripcionActividad && best.mapping.actividad) {
    best.mapping.descripcionActividad = best.mapping.actividad
  }

  // In this format ND, NE, NC are contiguous. Recover ND when it drifts to
  // a wrong "nivel" column match.
  if (best.mapping.ne && best.mapping.nc) {
    const ne = best.mapping.ne
    const nc = best.mapping.nc
    const nd = best.mapping.nd
    if (!nd || nd < ne - 2 || nd > ne + 2) {
      if (Math.abs(ne - nc) <= 3) best.mapping.nd = ne - 1
    }
  }

  // If grouped subheader scan found ND/NE/NC but fuzzy aliases shifted,
  // clamp to ordered neighborhood to avoid reading non-evaluation cells.
  if (best.mapping.nd && best.mapping.ne && best.mapping.nc) {
    const nd = best.mapping.nd
    const ne = best.mapping.ne
    const nc = best.mapping.nc
    if (!(nd < ne && ne < nc)) {
      const ordered = [nd, ne, nc].sort((a, b) => a - b)
      best.mapping.nd = ordered[0]
      best.mapping.ne = ordered[1]
      best.mapping.nc = ordered[2]
    }
  }

  return best
}

function readMappedCell(
  row: ExcelJS.Row,
  sheet: ExcelJS.Worksheet,
  mapping: Partial<Record<ImportFieldKey, number>>,
  key: ImportFieldKey
) {
  const col = mapping[key]
  if (!col) return ''
  return cleanString(getEffectiveCellText(sheet, row.number, col))
}

function readDirectMappedCell(
  row: ExcelJS.Row,
  mapping: Partial<Record<ImportFieldKey, number>>,
  key: ImportFieldKey
) {
  const col = mapping[key]
  if (!col) return ''
  return cleanString(getCellText(row.getCell(col).value))
}

function parseBooleanSiNo(raw: string): { value: boolean | null; error?: string } {
  const v = raw.trim()
  if (!v) return { value: null }
  const norm = v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (norm === 'si' || norm === '1' || norm === 'true') return { value: true }
  if (norm === 'no' || norm === '0' || norm === 'false') return { value: false }
  if (norm.includes(' si ')) return { value: true }
  if (norm.includes(' no ')) return { value: false }
  return { value: null, error: 'Debe ser "Si" o "No"' }
}

function parseNumber(raw: string): { value: number | null; error?: string } {
  const v = raw.trim()
  if (!v) return { value: null }
  const direct = Number(v)
  if (!Number.isNaN(direct)) return { value: direct }

  // Allow dropdown labels that include a numeric token, e.g. "10 (Muy Alto)".
  const token = v.match(/-?\d+(?:[.,]\d+)?/)
  if (token) {
    const parsed = Number(token[0].replace(',', '.'))
    if (!Number.isNaN(parsed)) return { value: parsed }
  }

  return { value: null, error: 'Debe ser un numero' }
}

function asIsoDate(raw: string): string | null {
  const v = raw.trim()
  if (!v) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v

  const parts = v.split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    if (/^\d{1,2}$/.test(d) && /^\d{1,2}$/.test(m) && /^\d{4}$/.test(y)) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
  }

  const parsed = new Date(v)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().split('T')[0]
}

function getCellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString().split('T')[0]

  if (typeof value === 'object') {
    const rich = value as { richText?: Array<{ text: string }>; text?: string; result?: unknown }
    if (Array.isArray(rich.richText)) return rich.richText.map((t) => t.text || '').join('')
    if (rich.text) return rich.text
    if (rich.result !== undefined && rich.result !== null) return String(rich.result)
  }

  return String(value)
}

function getEffectiveCellText(sheet: ExcelJS.Worksheet, rowIndex: number, colIndex: number): string {
  if (rowIndex < 1 || colIndex < 1) return ''
  const cell = sheet.getRow(rowIndex).getCell(colIndex)

  let txt = cleanString(getCellText(cell.value))
  if (txt) return txt

  if (cell.isMerged && cell.master) {
    txt = cleanString(getCellText(cell.master.value))
    if (txt) return txt
  }

  return ''
}

function readWorkbookText(sheet: ExcelJS.Worksheet, rowIndex: number, colIndex: number, allowMerged = true): string {
  const row = sheet.getRow(rowIndex)
  const cell = row.getCell(colIndex)
  const direct = cleanString(getCellText(cell.value))
  if (direct) return direct
  if (!allowMerged) return ''
  return cleanString(getEffectiveCellText(sheet, rowIndex, colIndex))
}

function findLastDataRow(sheet: ExcelJS.Worksheet): number {
  const maxRow = sheet.rowCount || 1
  for (let rowIdx = maxRow; rowIdx >= WORKBOOK_LAYOUT.dataStartRow; rowIdx--) {
    for (const col of Object.values(WORKBOOK_LAYOUT.columns)) {
      if (readWorkbookText(sheet, rowIdx, col, false)) return rowIdx
    }
  }
  return WORKBOOK_LAYOUT.dataStartRow - 1
}

function interpProbabilidad(np: number) {
  if (!np) return '—'
  if (np >= 24 && np <= 40) return 'Muy Alto'
  if (np >= 10 && np <= 23) return 'Alto'
  if (np >= 6 && np <= 9) return 'Medio'
  if (np >= 2 && np <= 5) return 'Bajo'
  return String(np)
}

function interpNivelRiesgo(nr: number) {
  if (!nr) return '—'
  if (nr >= 4000 && nr <= 6000) return 'I'
  if (nr >= 150 && nr <= 500) return 'II'
  if (nr >= 40 && nr <= 120) return 'III'
  if (nr >= 10 && nr <= 20) return 'IV'
  if (nr >= 501) return 'I'
  if (nr >= 121 && nr <= 500) return 'II'
  return String(nr)
}

function aceptabilidadFromNivel(label: string) {
  switch (label) {
    case 'I':
      return 'No Aceptable'
    case 'II':
      return 'Aceptable con Control Especifico'
    case 'III':
      return 'Mejorable'
    case 'IV':
      return 'Aceptable'
    default:
      return '—'
  }
}

function ensureProceso(parsed: ParsedImport, nombre: string) {
  let proceso = parsed.procesos.find((p) => p.nombre === nombre)
  if (!proceso) {
    proceso = { nombre, zonas: [] }
    parsed.procesos.push(proceso)
  }
  return proceso
}

function ensureZona(parsedProceso: ParsedImport['procesos'][number], nombre: string) {
  let zona = parsedProceso.zonas.find((z) => z.nombre === nombre)
  if (!zona) {
    zona = { nombre, actividades: [] }
    parsedProceso.zonas.push(zona)
  }
  return zona
}

function ensureActividad(
  parsedZona: ParsedImport['procesos'][number]['zonas'][number],
  row: { nombre: string; descripcion: string; tareas: string; cargo: string; rutinario: boolean | null }
) {
  let actividad = parsedZona.actividades.find((a) => a.nombre === row.nombre)
  if (!actividad) {
    actividad = {
      nombre: row.nombre,
      descripcion: row.descripcion,
      tareas: row.tareas,
      cargo: row.cargo,
      rutinario: !!row.rutinario,
      peligros: [],
    }
    parsedZona.actividades.push(actividad)
  } else {
    if (!actividad.descripcion && row.descripcion) actividad.descripcion = row.descripcion
    if (!actividad.tareas && row.tareas) actividad.tareas = row.tareas
    if (!actividad.cargo && row.cargo) actividad.cargo = row.cargo
    if (!actividad.rutinario && row.rutinario !== null) actividad.rutinario = row.rutinario
  }

  return actividad
}

export async function parseImportWorkbook(buffer: Buffer): Promise<{
  totalRows: number
  validRows: number
  errors: ImportRowError[]
  preview: ImportPreviewRow[]
  metadata: ParsedImport['metadata']
  parsed: ParsedImport
}> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer as any)

  const sheet = workbook.getWorksheet('Matriz')
  if (!sheet) {
    throw new Error('No se encontro la hoja "Matriz" en el archivo')
  }

  const metadata = {
    area: readWorkbookText(sheet, WORKBOOK_LAYOUT.metadata.area.row, WORKBOOK_LAYOUT.metadata.area.col),
    responsable: readWorkbookText(sheet, WORKBOOK_LAYOUT.metadata.responsable.row, WORKBOOK_LAYOUT.metadata.responsable.col),
    fechaElaboracion: asIsoDate(readWorkbookText(sheet, WORKBOOK_LAYOUT.metadata.fechaElaboracion.row, WORKBOOK_LAYOUT.metadata.fechaElaboracion.col)) || '',
    fechaActualizacion: asIsoDate(readWorkbookText(sheet, WORKBOOK_LAYOUT.metadata.fechaActualizacion.row, WORKBOOK_LAYOUT.metadata.fechaActualizacion.col)) || '',
  }

  const lastDataRow = findLastDataRow(sheet)

  let currentProceso = ''
  let currentZona = ''
  let currentActivity: ParsedImport['procesos'][number]['zonas'][number]['actividades'][number] | null = null
  let currentActivityDescripcion = ''
  let activityCounter = 0

  let totalRows = 0
  let validRows = 0
  const errors: ImportRowError[] = []
  const preview: ImportPreviewRow[] = []
  const parsed: ParsedImport = { metadata, procesos: [] }

  for (let rowNumber = WORKBOOK_LAYOUT.dataStartRow; rowNumber <= lastDataRow; rowNumber++) {
    const row = sheet.getRow(rowNumber)

    const raw = {
      proceso: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.proceso, false),
      zona: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.zona, false),
      actividadDescripcion: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.actividadDescripcion, false),
      tareas: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.tareas, false),
      cargo: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.cargo, false),
      rutinario: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.rutinario, false),
      peligro: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.peligro, false),
      clasificacion: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.clasificacion, false),
      efectos: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.efectos, false),
      controlFuente: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.controlFuente, false),
      controlMedio: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.controlMedio, false),
      controlIndividuo: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.controlIndividuo, false),
      nd: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.nd, false),
      ne: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.ne, false),
      nc: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.nc, false),
      numExpuestos: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.numExpuestos, false),
      peorConsecuencia: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.peorConsecuencia, false),
      requisitoLegal: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.requisitoLegal, false),
      eliminacion: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.eliminacion, false),
      sustitucion: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.sustitucion, false),
      controlesIngenieria: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.controlesIngenieria, false),
      controlesAdministrativos: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.controlesAdministrativos, false),
      epp: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.epp, false),
      responsableIntervencion: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.intervencion, false),
      fechaEjecucion: readWorkbookText(sheet, rowNumber, WORKBOOK_LAYOUT.columns.fechaEjecucion, false),
    }

    const hasAnyValue = Object.values(raw).some((v) => !!v)
    if (!hasAnyValue) continue

    const hasDangerData = [
      raw.peligro,
      raw.clasificacion,
      raw.efectos,
      raw.nd,
      raw.ne,
      raw.nc,
      raw.numExpuestos,
      raw.peorConsecuencia,
      raw.requisitoLegal,
      raw.eliminacion,
      raw.sustitucion,
      raw.controlesIngenieria,
      raw.controlesAdministrativos,
      raw.epp,
      raw.responsableIntervencion,
      raw.fechaEjecucion,
    ].some(Boolean)
    if (!hasDangerData) {
      if (raw.proceso && raw.proceso !== currentProceso) {
        currentProceso = raw.proceso
        currentZona = ''
        currentActivity = null
        currentActivityDescripcion = ''
        activityCounter = 0
      }
      if (raw.zona && raw.zona !== currentZona) {
        currentZona = raw.zona
        currentActivity = null
        currentActivityDescripcion = ''
        activityCounter = 0
      }
      if (raw.actividadDescripcion) {
        currentActivityDescripcion = raw.actividadDescripcion
        currentActivity = null
      }
      continue
    }

    totalRows += 1

    if (raw.proceso && raw.proceso !== currentProceso) {
      currentProceso = raw.proceso
      currentZona = ''
      currentActivity = null
      currentActivityDescripcion = ''
      activityCounter = 0
    }
    if (raw.zona && raw.zona !== currentZona) {
      currentZona = raw.zona
      currentActivity = null
      currentActivityDescripcion = ''
      activityCounter = 0
    }
    if (raw.actividadDescripcion && raw.actividadDescripcion !== currentActivityDescripcion) {
      currentActivityDescripcion = raw.actividadDescripcion
      activityCounter += 1
      currentActivity = null
    }

    const procesoValue = currentProceso
    const zonaValue = currentZona
    const actividadName = currentActivity?.nombre || `Actividad ${Math.max(activityCounter, 1)}`
    const actividadDescripcion = currentActivity?.descripcion || currentActivityDescripcion || raw.actividadDescripcion

    const rowErrors: ImportRowError[] = []

    if (!procesoValue) rowErrors.push({ row: rowNumber, field: 'Proceso', message: 'Requerido' })
    if (!actividadDescripcion) rowErrors.push({ row: rowNumber, field: 'Actividad', message: 'Requerido' })
    if (!raw.peligro) rowErrors.push({ row: rowNumber, field: 'Peligro', message: 'Requerido' })

    const ndParsed = parseNumber(raw.nd)
    const neParsed = parseNumber(raw.ne)
    const ncParsed = parseNumber(raw.nc)
    if (ndParsed.error) rowErrors.push({ row: rowNumber, field: 'ND', message: ndParsed.error })
    if (neParsed.error) rowErrors.push({ row: rowNumber, field: 'NE', message: neParsed.error })
    if (ncParsed.error) rowErrors.push({ row: rowNumber, field: 'NC', message: ncParsed.error })

    const rutinarioParsed = parseBooleanSiNo(raw.rutinario)
    if (rutinarioParsed.error) rowErrors.push({ row: rowNumber, field: 'Rutinario', message: rutinarioParsed.error })

    const requisitoParsed = parseBooleanSiNo(raw.requisitoLegal)
    if (requisitoParsed.error) rowErrors.push({ row: rowNumber, field: 'Requisito Legal', message: requisitoParsed.error })

    if (rowErrors.length > 0) {
      errors.push(...rowErrors)
      continue
    }

    validRows += 1

    const nd = ndParsed.value
    const ne = neParsed.value
    const nc = ncParsed.value

    const np = !nd || !ne ? 0 : nd * ne
    const nr = !np || !nc ? 0 : np * nc
    const interpNp = interpProbabilidad(np)
    const interpNr = interpNivelRiesgo(nr)
    const aceptabilidad = aceptabilidadFromNivel(interpNr)

    const peligro: ParsedPeligro = {
      descripcion: raw.peligro,
      clasificacion: raw.clasificacion,
      efectosPosibles: raw.efectos,
      control: {
        fuente: raw.controlFuente,
        medio: raw.controlMedio,
        individuo: raw.controlIndividuo,
      },
      evaluacion: {
        nivelDeficiencia: nd,
        nivelExposicion: ne,
        nivelConsecuencia: nc,
        nivelProbabilidad: np || null,
        nivelRiesgo: nr || null,
        interpProbabilidad: interpNp,
        interpRiesgo: interpNr,
        aceptabilidad,
      },
      criterio: {
        numExpuestos: parseNumber(raw.numExpuestos).value,
        peorConsecuencia: raw.peorConsecuencia,
        requisitoLegal: !!requisitoParsed.value,
      },
      intervencion: {
        eliminacion: raw.eliminacion,
        sustitucion: raw.sustitucion,
        controlesIngenieria: raw.controlesIngenieria,
        controlesAdministrativos: raw.controlesAdministrativos,
        epp: raw.epp,
        responsable: raw.responsableIntervencion,
        fechaEjecucion: asIsoDate(raw.fechaEjecucion),
      },
    }

    const proceso = ensureProceso(parsed, procesoValue)
    const zona = ensureZona(proceso, zonaValue || 'Sin zona')
    const activityRow = {
      nombre: actividadName,
      descripcion: actividadDescripcion,
      tareas: raw.tareas,
      cargo: raw.cargo,
      rutinario: rutinarioParsed.value,
    }

    currentActivity = ensureActividad(zona, activityRow)

    currentActivity.peligros.push(peligro)

    if (preview.length < 10) {
      preview.push({
        proceso: procesoValue,
        zona: zonaValue,
        actividad: actividadName,
        descripcionActividad: actividadDescripcion,
        tareas: raw.tareas,
        cargo: raw.cargo,
        rutinario: raw.rutinario,
        peligro: raw.peligro,
        clasificacion: raw.clasificacion,
        efectos: raw.efectos,
        controlFuente: raw.controlFuente,
        controlMedio: raw.controlMedio,
        controlIndividuo: raw.controlIndividuo,
        nd,
        ne,
        nc,
        nivelProbabilidad: np || null,
        interpretacionProbabilidad: interpNp,
        nivelRiesgo: nr || null,
        interpretacionNivelRiesgo: interpNr,
        valoracionRiesgo: aceptabilidad,
        numeroExpuestos: parseNumber(raw.numExpuestos).value,
        peorConsecuencia: raw.peorConsecuencia,
        requisitoLegal: raw.requisitoLegal,
        eliminacion: raw.eliminacion,
        sustitucion: raw.sustitucion,
        controlesIngenieria: raw.controlesIngenieria,
        controlesAdministrativos: raw.controlesAdministrativos,
        epp: raw.epp,
        responsableIntervencion: raw.responsableIntervencion,
        fechaEjecucion: asIsoDate(raw.fechaEjecucion),
      })
    }
  }

  return { totalRows, validRows, errors, preview, metadata, parsed }
}

export async function buildTemplateWorkbookBuffer() {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Matriz')

  sheet.addRow(EXPECTED_HEADERS)
  sheet.getRow(1).height = 24
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D7A40' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  })

  const exampleRows = [
    [
      'Asistencial', 'Urgencias', 'Triagen', 'Recepcion inicial de paciente', 'Clasificar y registrar', 'Enfermera', 'Si',
      'Piso mojado', 'Locativo', 'Caidas', 'Senalizacion', 'Tapete antideslizante', 'Calzado',
      2, 3, 10, 3, 'Fractura', 'No', 'N/A', 'N/A', 'N/A', 'Capacitacion diaria', 'Botas', 'Supervisor SST', '2026-04-01',
    ],
    [
      '', '', '', '', '', '', '',
      'Sobreesfuerzo', 'Biomecanico', 'Dolor lumbar', 'Rotacion de tareas', 'Ayudas mecanicas', 'Pausas activas',
      2, 2, 25, 4, 'Lesion incapacitante', 'No', 'Rediseno', 'N/A', 'Grua', 'Procedimiento seguro', 'Faja', 'Lider de area', '2026-04-15',
    ],
    [
      'Administrativo', 'Facturacion', 'Digitacion', 'Ingreso de informacion', 'Digitar cuentas', 'Auxiliar', 'No',
      'Fatiga visual', 'Ergonomico', 'Cefalea', 'Iluminacion', 'Pantalla adecuada', 'Descansos',
      1, 2, 10, 2, 'Molestia temporal', 'Si', 'N/A', 'N/A', 'N/A', 'Pausas activas', 'Gafas', 'Coordinador', '2026-05-01',
    ],
  ]

  for (const row of exampleRows) sheet.addRow(row)

  for (let i = 1; i <= EXPECTED_HEADERS.length; i++) {
    sheet.getColumn(i).width = 20
  }

  return workbook.xlsx.writeBuffer()
}
