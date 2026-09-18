import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import ExcelJS from 'exceljs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    const peligros = await prisma.peligroCatalogo.findMany({
      where: { deletedAt: null },
      include: {
        planesAccion: {
          where: { deletedAt: null },
          orderBy: { orden: 'asc' },
        },
      },
      orderBy: [
        { clasificacion: 'asc' },
        { nivelRiesgo: 'desc' },
        { descripcion: 'asc' },
      ],
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SG-SST Matriz de Riesgos'
    workbook.created = new Date()

    // Sheet 1: Catálogo de Peligros
    const sheetPeligros = workbook.addWorksheet('Catálogo de Peligros', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    sheetPeligros.columns = [
      { header: 'CÓDIGO', key: 'codigo', width: 14 },
      { header: 'CLASIFICACIÓN', key: 'clasificacion', width: 22 },
      { header: 'DESCRIPCIÓN DEL PELIGRO', key: 'descripcion', width: 45 },
      { header: 'EFECTOS POSIBLES', key: 'efectos', width: 35 },
      { header: 'CONTROL FUENTE', key: 'fuente', width: 28 },
      { header: 'CONTROL MEDIO', key: 'medio', width: 28 },
      { header: 'CONTROL INDIVIDUO', key: 'individuo', width: 28 },
      { header: 'ND', key: 'nd', width: 8 },
      { header: 'NE', key: 'ne', width: 8 },
      { header: 'NP', key: 'np', width: 8 },
      { header: 'INTERP NP', key: 'interpNp', width: 14 },
      { header: 'NC', key: 'nc', width: 8 },
      { header: 'NR', key: 'nr', width: 10 },
      { header: 'INTERP NR', key: 'interpNr', width: 22 },
      { header: 'ACEPTABILIDAD', key: 'aceptabilidad', width: 26 },
      { header: 'Nº EXPUESTOS', key: 'numExpuestos', width: 14 },
      { header: 'PEOR CONSECUENCIA', key: 'peorConsecuencia', width: 30 },
      { header: 'REQUISITO LEGAL', key: 'requisitoLegal', width: 16 },
      { header: 'ELIMINACIÓN', key: 'eliminacion', width: 24 },
      { header: 'SUSTITUCIÓN', key: 'sustitucion', width: 24 },
      { header: 'CONTROLES INGENIERÍA', key: 'controlesIngenieria', width: 28 },
      { header: 'CONTROLES ADMINISTRATIVOS', key: 'controlesAdmin', width: 30 },
      { header: 'EPP', key: 'epp', width: 24 },
    ]

    // Style Header Row
    const headerRow1 = sheetPeligros.getRow(1)
    headerRow1.height = 28
    headerRow1.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    headerRow1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F7D3E' },
    }
    headerRow1.alignment = { vertical: 'middle', horizontal: 'center' }

    peligros.forEach((p: any) => {
      sheetPeligros.addRow({
        codigo: p.codigo || '—',
        clasificacion: p.clasificacion,
        descripcion: p.descripcion,
        efectos: p.efectosPosibles || '',
        fuente: p.controlFuente || '',
        medio: p.controlMedio || '',
        individuo: p.controlIndividuo || '',
        nd: p.nivelDeficiencia ?? '',
        ne: p.nivelExposicion ?? '',
        np: p.nivelProbabilidad ?? '',
        interpNp: p.interpProbabilidad || '',
        nc: p.nivelConsecuencia ?? '',
        nr: p.nivelRiesgo ?? '',
        interpNr: p.interpRiesgo || '',
        aceptabilidad: p.aceptabilidad || '',
        numExpuestos: p.numExpuestos ?? '',
        peorConsecuencia: p.peorConsecuencia || '',
        requisitoLegal: p.requisitoLegal ? 'Sí' : 'No',
        eliminacion: p.eliminacion || '',
        sustitucion: p.sustitucion || '',
        controlesIngenieria: p.controlesIngenieria || '',
        controlesAdmin: p.controlesAdministrativos || '',
        epp: p.epp || '',
      })
    })

    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Catalogo_Peligros_SST_${new Date().toISOString().split('T')[0]}.xlsx"`
    )
    return res.status(200).send(buffer)
  } catch (error: any) {
    console.error('Error GET /api/peligros/export:', error)
    return res.status(500).json({
      error: 'Error al exportar el catálogo a Excel',
      details: error?.message || String(error),
    })
  }
}
