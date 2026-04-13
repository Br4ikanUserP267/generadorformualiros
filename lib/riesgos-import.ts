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
    .trim()
}

function parseBooleanSiNo(raw: string): { value: boolean | null; error?: string } {
  const v = raw.trim()
  if (!v) return { value: null }
  const norm = v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (norm === 'si') return { value: true }
  if (norm === 'no') return { value: false }
  return { value: null, error: 'Debe ser "Si" o "No"' }
}

function parseNumber(raw: string): { value: number | null; error?: string } {
  const v = raw.trim()
  if (!v) return { value: null }
  const n = Number(v)
  if (Number.isNaN(n)) return { value: null, error: 'Debe ser un numero' }
  return { value: n }
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
  parsed: ParsedImport
}> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheet = workbook.getWorksheet('Matriz')
  if (!sheet) {
    throw new Error('No se encontro la hoja "Matriz" en el archivo')
  }

  const headers: string[] = []
  const headerRow = sheet.getRow(1)
  for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
    headers.push(normalizeHeader(cleanString(getCellText(headerRow.getCell(i + 1).value))))
  }

  const expectedNormalized = EXPECTED_HEADERS.map((h) => normalizeHeader(h))
  const missing: string[] = []
  for (let i = 0; i < expectedNormalized.length; i++) {
    if (headers[i] !== expectedNormalized[i]) missing.push(EXPECTED_HEADERS[i])
  }

  if (missing.length > 0) {
    const err = new Error('Columnas faltantes') as Error & { missing?: string[] }
    err.missing = missing
    throw err
  }

  let lastProceso = ''
  let lastZona = ''
  let lastActividad = ''

  let totalRows = 0
  let validRows = 0
  const errors: ImportRowError[] = []
  const preview: ImportPreviewRow[] = []
  const parsed: ParsedImport = { procesos: [] }

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber)

    const raw: RawRow = {}
    for (let i = 0; i < EXPECTED_HEADERS.length; i++) {
      raw[EXPECTED_HEADERS[i]] = cleanString(getCellText(row.getCell(i + 1).value))
    }

    const hasAnyValue = EXPECTED_HEADERS.some((h) => raw[h])
    if (!hasAnyValue) continue

    totalRows += 1

    const procesoValue = raw['Proceso'] || lastProceso
    const zonaValue = raw['Zona / Lugar'] || lastZona
    const actividadValue = raw['Actividad'] || lastActividad

    if (raw['Proceso']) lastProceso = raw['Proceso']
    if (raw['Zona / Lugar']) lastZona = raw['Zona / Lugar']
    if (raw['Actividad']) lastActividad = raw['Actividad']

    const rowErrors: ImportRowError[] = []

    if (!procesoValue) rowErrors.push({ row: rowNumber, field: 'Proceso', message: 'Requerido' })
    if (!actividadValue) rowErrors.push({ row: rowNumber, field: 'Actividad', message: 'Requerido' })
    if (!raw['Peligro']) rowErrors.push({ row: rowNumber, field: 'Peligro', message: 'Requerido' })

    const ndParsed = parseNumber(raw.ND)
    const neParsed = parseNumber(raw.NE)
    const ncParsed = parseNumber(raw.NC)
    if (ndParsed.error) rowErrors.push({ row: rowNumber, field: 'ND', message: ndParsed.error })
    if (neParsed.error) rowErrors.push({ row: rowNumber, field: 'NE', message: neParsed.error })
    if (ncParsed.error) rowErrors.push({ row: rowNumber, field: 'NC', message: ncParsed.error })

    const rutinarioParsed = parseBooleanSiNo(raw.Rutinario)
    if (rutinarioParsed.error) rowErrors.push({ row: rowNumber, field: 'Rutinario', message: rutinarioParsed.error })

    const requisitoParsed = parseBooleanSiNo(raw['Requisito Legal'])
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
      descripcion: raw.Peligro,
      clasificacion: raw['Clasificación del Peligro'],
      efectosPosibles: raw['Efectos Posibles'],
      control: {
        fuente: raw['Control Fuente'],
        medio: raw['Control Medio'],
        individuo: raw['Control Individuo'],
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
        numExpuestos: parseNumber(raw['Num. Expuestos']).value,
        peorConsecuencia: raw['Peor Consecuencia'],
        requisitoLegal: !!requisitoParsed.value,
      },
      intervencion: {
        eliminacion: raw['Eliminación'],
        sustitucion: raw['Sustitución'],
        controlesIngenieria: raw['Controles Ingeniería'],
        controlesAdministrativos: raw['Controles Administrativos'],
        epp: raw.EPP,
        responsable: raw['Responsable Intervención'],
        fechaEjecucion: asIsoDate(raw['Fecha Ejecución']),
      },
    }

    const proceso = ensureProceso(parsed, procesoValue)
    const zona = ensureZona(proceso, zonaValue || 'Sin zona')
    const actividad = ensureActividad(zona, {
      nombre: actividadValue,
      descripcion: raw['Descripción de la Actividad'],
      tareas: raw.Tareas,
      cargo: raw.Cargo,
      rutinario: rutinarioParsed.value,
    })

    actividad.peligros.push(peligro)

    if (preview.length < 10) {
      preview.push({
        proceso: procesoValue,
        zona: zonaValue,
        actividad: actividadValue,
        peligro: raw.Peligro,
        clasificacion: raw['Clasificación del Peligro'],
        efectos: raw['Efectos Posibles'],
        nd,
        ne,
        nc,
      })
    }
  }

  return { totalRows, validRows, errors, preview, parsed }
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
