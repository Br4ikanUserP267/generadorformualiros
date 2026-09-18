import type { NextApiRequest, NextApiResponse } from 'next'
import ExcelJS from 'exceljs'
import { getAuthUser } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Plantilla Peligros', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    sheet.columns = [
      { header: 'CODIGO', key: 'codigo', width: 14 },
      { header: 'CLASIFICACION', key: 'clasificacion', width: 25 },
      { header: 'DESCRIPCION', key: 'descripcion', width: 45 },
      { header: 'EFECTOS_POSIBLES', key: 'efectos', width: 35 },
      { header: 'CONTROL_FUENTE', key: 'fuente', width: 30 },
      { header: 'CONTROL_MEDIO', key: 'medio', width: 30 },
      { header: 'CONTROL_INDIVIDUO', key: 'individuo', width: 30 },
      { header: 'ND', key: 'nd', width: 8 },
      { header: 'NE', key: 'ne', width: 8 },
      { header: 'NC', key: 'nc', width: 8 },
      { header: 'PEOR_CONSECUENCIA', key: 'peorConsecuencia', width: 30 },
      { header: 'ELIMINACION', key: 'eliminacion', width: 25 },
      { header: 'SUSTITUCION', key: 'sustitucion', width: 25 },
      { header: 'CONTROLES_INGENIERIA', key: 'controlesIngenieria', width: 28 },
      { header: 'CONTROLES_ADMINISTRATIVOS', key: 'controlesAdmin', width: 28 },
      { header: 'EPP', key: 'epp', width: 25 },
    ]

    const headerRow = sheet.getRow(1)
    headerRow.height = 26
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F7D3E' },
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' }

    // Sample rows
    sheet.addRow({
      codigo: 'BIO-01',
      clasificacion: 'BIOLÓGICO',
      descripcion: 'Contacto con fluidos corporales y patógenos durante atención médica',
      efectos: 'Infecciones virales, bacterianas, hepatitis B/C, VIH',
      fuente: 'Protocolo de bioseguridad institucional',
      medio: 'Desinfección de áreas y esterilización',
      individuo: 'Uso de guantes, mascarilla N95, bata, gafas protectoras',
      nd: 6,
      ne: 3,
      nc: 60,
      peorConsecuencia: 'Enfermedad infectocontagiosa grave',
      eliminacion: '',
      sustitucion: '',
      controlesIngenieria: 'Contenedores rígidos para cortopunzantes en cada puesto',
      controlesAdmin: 'Capacitación mensual en bioseguridad y protocolo de punzocortantes',
      epp: 'Guantes de látex/nitrilo, mascarilla de alta eficiencia, monogafas',
    })

    sheet.addRow({
      codigo: 'BIO-02',
      clasificacion: 'BIOMECÁNICO / ERGONÓMICO',
      descripcion: 'Manipulación manual de cargas y movilización de pacientes dependientes',
      efectos: 'Lumbalgia, lesiones musculoesqueléticas, fatiga muscular',
      fuente: 'Ayudas mecánicas para transferencia de pacientes',
      medio: 'Espacios adecuados y camillas con regulación de altura',
      individuo: 'Higiene postural y pausas activas programadas',
      nd: 2,
      ne: 3,
      nc: 25,
      peorConsecuencia: 'Hernia discal / Incapacidad permanente parcial',
      eliminacion: '',
      sustitucion: '',
      controlesIngenieria: 'Sillas y camillas ergonómicas ajustables',
      controlesAdmin: 'Pausas activas dirigidas 2 veces al día y talleres ergonómicos',
      epp: 'Calzado ergonómico con suela antideslizante',
    })

    sheet.addRow({
      codigo: 'QUI-01',
      clasificacion: 'QUÍMICO',
      descripcion: 'Manipulación de agentes desinfectantes y glutaraldehído',
      efectos: 'Irritación ocular, dérmica y respiratoria, cefalea',
      fuente: 'Sustitución por desinfectantes de menor toxicidad',
      medio: 'Sistema de extracción y ventilación en central de esterilización',
      individuo: 'Respirador con filtros para vapores, guantes de nitrilo',
      nd: 2,
      ne: 2,
      nc: 25,
      peorConsecuencia: 'Intoxicación aguda / Dermatitis de contacto',
      eliminacion: '',
      sustitucion: 'Uso de peróxido de hidrógeno en lugar de glutaraldehído',
      controlesIngenieria: 'Campana extractora de gases',
      controlesAdmin: 'Disponibilidad de Fichas de Datos de Seguridad (FDS) y rotulado SGA',
      epp: 'Respirador media cara con cartuchos para vapores orgánicos, guantes nitrilo caña larga',
    })

    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Plantilla_Catalogo_Peligros_SST.xlsx"'
    )
    return res.status(200).send(Buffer.from(buffer))
  } catch (error: any) {
    console.error('Error exporting template:', error)
    return res.status(500).json({ error: 'Error al generar la plantilla de Excel' })
  }
}
