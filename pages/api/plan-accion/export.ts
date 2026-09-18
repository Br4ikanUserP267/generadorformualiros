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
    const hazards = await prisma.peligroCatalogo.findMany({
      where: {
        deletedAt: null,
        NOT: {
          OR: [
            { interpRiesgo: { contains: 'IV', mode: 'insensitive' } },
            { interpRiesgo: { contains: 'Aceptable', mode: 'insensitive' } },
            { nivelRiesgo: { lt: 40 } },
          ],
        },
      },
      include: {
        planesAccion: {
          where: { deletedAt: null },
          orderBy: { orden: 'asc' },
        },
        peligrosMatriz: {
          where: { deletedAt: null },
          select: {
            actividad: {
              select: {
                zona: {
                  select: {
                    proceso: {
                      select: {
                        matriz: {
                          select: {
                            id: true,
                            area: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { nivelRiesgo: 'desc' },
        { clasificacion: 'asc' },
        { codigo: 'asc' },
      ],
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'SG-SST Matriz de Riesgos'
    workbook.created = new Date()

    // Sheet: Plan de Acción 5W2H
    const sheet = workbook.addWorksheet('Plan de Acción 5W2H', {
      views: [{ state: 'frozen', ySplit: 1 }],
    })

    sheet.columns = [
      { header: 'CÓDIGO', key: 'codigo', width: 14 },
      { header: 'CLASIFICACIÓN', key: 'clasificacion', width: 22 },
      { header: 'DESCRIPCIÓN DEL PELIGRO', key: 'descripcion', width: 42 },
      { header: 'NIVEL RIESGO', key: 'nivelRiesgo', width: 14 },
      { header: 'ACEPTABILIDAD', key: 'aceptabilidad', width: 24 },
      { header: 'MATRICES VINCULADAS', key: 'matrices', width: 26 },
      { header: '¿QUÉ? (ACCIÓN REQUERIDA)', key: 'que', width: 40 },
      { header: '¿POR QUÉ? (JUSTIFICACIÓN)', key: 'porQue', width: 35 },
      { header: '¿DÓNDE? (ÁREA / LUGAR)', key: 'donde', width: 25 },
      { header: '¿CUÁNDO INICIA?', key: 'cuandoInicio', width: 16 },
      { header: '¿CUÁNDO TERMINA?', key: 'cuandoFin', width: 16 },
      { header: '¿QUIÉN? (RESPONSABLE)', key: 'responsable', width: 26 },
      { header: '¿CÓMO? (MÉTODO / PROCEDIMIENTO)', key: 'como', width: 35 },
      { header: '¿CUÁNTO? (PRESUPUESTO / RECURSOS)', key: 'cuanto', width: 24 },
      { header: 'ESTADO', key: 'estado', width: 16 },
    ]

    // Style Header Row
    const headerRow = sheet.getRow(1)
    headerRow.height = 30
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F7D3E' },
    }
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }

    // Populate rows
    hazards.forEach((h: any) => {
      const areas = Array.from(
        new Set(
          h.peligrosMatriz
            .map((pm: any) => pm.actividad?.zona?.proceso?.matriz?.area)
            .filter(Boolean)
        )
      ).join(', ')

      const actions = h.planesAccion || []

      if (actions.length === 0) {
        // Danger without action plan yet
        sheet.addRow({
          codigo: h.codigo || '—',
          clasificacion: h.clasificacion,
          descripcion: h.descripcion,
          nivelRiesgo: h.interpRiesgo ? `Nivel ${h.interpRiesgo}` : '—',
          aceptabilidad: h.aceptabilidad || '—',
          matrices: areas || 'Sin asignar a matriz',
          que: 'SIN PLAN REGISTRADO',
          porQue: '',
          donde: '',
          cuandoInicio: '',
          cuandoFin: '',
          responsable: '',
          como: '',
          cuanto: '',
          estado: 'PENDIENTE',
        })
      } else {
        actions.forEach((act: any) => {
          sheet.addRow({
            codigo: h.codigo || '—',
            clasificacion: h.clasificacion,
            descripcion: h.descripcion,
            nivelRiesgo: h.interpRiesgo ? `Nivel ${h.interpRiesgo}` : '—',
            aceptabilidad: h.aceptabilidad || '—',
            matrices: areas || 'Sin asignar a matriz',
            que: act.que,
            porQue: act.porQue || '',
            donde: act.donde || '',
            cuandoInicio: act.cuandoInicio ? act.cuandoInicio.toISOString().split('T')[0] : '',
            cuandoFin: act.cuandoFin ? act.cuandoFin.toISOString().split('T')[0] : '',
            responsable: act.responsable || '',
            como: act.como || '',
            cuanto: act.cuanto || '',
            estado: act.estado,
          })
        })
      }
    })

    // Zebra striping and text wrapping
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.alignment = { vertical: 'middle', wrapText: true }
        if (rowNumber % 2 === 0) {
          row.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FCF9' },
          }
        }
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Plan_Accion_5W2H_${new Date().toISOString().split('T')[0]}.xlsx"`
    )
    return res.status(200).send(buffer)
  } catch (error: any) {
    console.error('Error GET /api/plan-accion/export:', error)
    return res.status(500).json({
      error: 'Error al exportar el plan de acción a Excel',
      details: error?.message || String(error),
    })
  }
}
