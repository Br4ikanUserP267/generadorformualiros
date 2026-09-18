import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { calculateGtc45, normalizeClasificacion } from '@/lib/gtc45-utils'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    const { items, mode = 'merge' } = req.body // mode: 'merge' (update/insert) or 'replace'

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No se encontraron registros para importar.' })
    }

    if (mode === 'replace') {
      // Soft-delete all existing catalog hazards
      await prisma.peligroCatalogo.updateMany({
        where: { deletedAt: null },
        data: { deletedAt: new Date() },
      })
    }

    let createdCount = 0
    let updatedCount = 0
    const errors: string[] = []

    for (let i = 0; i < items.length; i++) {
      const row = items[i]
      const rawDesc = row.descripcion || row.peligro || row.Peligro || row.DESCRIPCION || ''
      const rawClasif = row.clasificacion || row.Clasificacion || row.CLASIFICACION || row.tipoRiesgo || 'GENERAL'

      if (!String(rawDesc).trim()) {
        errors.push(`Fila ${i + 1}: Descripción vacía, omitida.`)
        continue
      }

      const desc = String(rawDesc).trim()
      const clasif = normalizeClasificacion(rawClasif) || 'BIOLÓGICO'
      const codigo = row.codigo || row.Codigo || row.CODIGO ? String(row.codigo || row.Codigo || row.CODIGO).trim() : null

      const nd = row.nd !== undefined ? Number(row.nd) : (row.nivelDeficiencia !== undefined ? Number(row.nivelDeficiencia) : null)
      const ne = row.ne !== undefined ? Number(row.ne) : (row.nivelExposicion !== undefined ? Number(row.nivelExposicion) : null)
      const nc = row.nc !== undefined ? Number(row.nc) : (row.nivelConsecuencia !== undefined ? Number(row.nivelConsecuencia) : null)

      const calculated = calculateGtc45(nd, ne, nc)

      const peligroData = {
        codigo: codigo || undefined,
        clasificacion: clasif,
        descripcion: desc,
        efectosPosibles: row.efectosPosibles || row.efectos || row.EFECTOS ? String(row.efectosPosibles || row.efectos || row.EFECTOS).trim() : null,
        controlFuente: row.controlFuente || row.fuente || row.FUENTE ? String(row.controlFuente || row.fuente || row.FUENTE).trim() : null,
        controlMedio: row.controlMedio || row.medio || row.MEDIO ? String(row.controlMedio || row.medio || row.MEDIO).trim() : null,
        controlIndividuo: row.controlIndividuo || row.individuo || row.INDIVIDUO ? String(row.controlIndividuo || row.individuo || row.INDIVIDUO).trim() : null,
        nivelDeficiencia: calculated.nd,
        nivelExposicion: calculated.ne,
        nivelProbabilidad: calculated.np || (row.np ? Number(row.np) : null),
        interpProbabilidad: calculated.interpNp || row.interpProbabilidad || row.interpNp || null,
        nivelConsecuencia: calculated.nc,
        nivelRiesgo: calculated.nr || (row.nr ? Number(row.nr) : null),
        interpRiesgo: calculated.interpNr || row.interpRiesgo || row.interpNr || null,
        aceptabilidad: calculated.aceptabilidad || row.aceptabilidad || null,
        numExpuestos: row.numExpuestos ? Number(row.numExpuestos) : null,
        peorConsecuencia: row.peorConsecuencia ? String(row.peorConsecuencia).trim() : null,
        requisitoLegal: row.requisitoLegal === true || row.requisitoLegal === 'SI' || row.requisitoLegal === 'Sí',
        eliminacion: row.eliminacion ? String(row.eliminacion).trim() : null,
        sustitucion: row.sustitucion ? String(row.sustitucion).trim() : null,
        controlesIngenieria: row.controlesIngenieria ? String(row.controlesIngenieria).trim() : null,
        controlesAdministrativos: row.controlesAdministrativos ? String(row.controlesAdministrativos).trim() : null,
        epp: row.epp ? String(row.epp).trim() : null,
      }

      // Check if already exists by exact description & classification
      const existing = await prisma.peligroCatalogo.findFirst({
        where: {
          descripcion: { equals: desc, mode: 'insensitive' },
          clasificacion: { equals: clasif, mode: 'insensitive' },
          deletedAt: null,
        },
      })

      let targetId = ''

      if (existing) {
        await prisma.peligroCatalogo.update({
          where: { id: existing.id },
          data: peligroData,
        })
        targetId = existing.id
        updatedCount++
      } else {
        const created = await prisma.peligroCatalogo.create({
          data: peligroData,
        })
        targetId = created.id
        createdCount++
      }
    }

    return res.status(200).json({
      success: true,
      createdCount,
      updatedCount,
      totalProcessed: items.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
    })
  } catch (error: any) {
    console.error('Error POST /api/peligros/import:', error)
    return res.status(500).json({
      error: 'Error al procesar la importación del catálogo',
      details: error?.message || String(error),
    })
  }
}
