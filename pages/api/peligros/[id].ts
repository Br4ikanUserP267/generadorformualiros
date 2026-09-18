import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { calculateGtc45, normalizeClasificacion } from '@/lib/gtc45-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const { id } = req.query
  const peligroId = String(id)

  if (!peligroId) {
    return res.status(400).json({ error: 'ID de peligro inválido' })
  }

  const { method } = req

  if (method === 'GET') {
    try {
      const item = await prisma.peligroCatalogo.findUnique({
        where: { id: peligroId },
        include: {
          peligrosMatriz: {
            where: { deletedAt: null },
            include: {
              actividad: {
                select: {
                  nombre: true,
                  zona: {
                    select: {
                      nombre: true,
                      proceso: {
                        select: {
                          nombre: true,
                          matriz: {
                            select: {
                              id: true,
                              area: true,
                              responsable: true,
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
      })

      if (!item || item.deletedAt) {
        return res.status(404).json({ error: 'Peligro no encontrado' })
      }

      return res.status(200).json(item)
    } catch (error: any) {
      console.error('Error GET /api/peligros/[id]:', error)
      return res.status(500).json({
        error: 'Error al obtener el detalle del peligro',
        details: error?.message || String(error),
      })
    }
  }

  if (method === 'PUT') {
    try {
      const body = req.body
      if (!body) {
        return res.status(400).json({ error: 'Cuerpo de la petición vacío' })
      }

      const existing = await prisma.peligroCatalogo.findUnique({
        where: { id: peligroId },
      })

      if (!existing || existing.deletedAt) {
        return res.status(404).json({ error: 'Peligro no encontrado' })
      }

      const calculated = calculateGtc45(
        body.nivelDeficiencia ?? existing.nivelDeficiencia,
        body.nivelExposicion ?? existing.nivelExposicion,
        body.nivelConsecuencia ?? existing.nivelConsecuencia
      )

      const updated = await prisma.peligroCatalogo.update({
        where: { id: peligroId },
        data: {
          codigo: body.codigo !== undefined ? (body.codigo ? String(body.codigo).trim() : null) : existing.codigo,
          clasificacion: body.clasificacion ? (normalizeClasificacion(body.clasificacion) || 'BIOLÓGICO') : existing.clasificacion,
          descripcion: body.descripcion ? String(body.descripcion).trim() : existing.descripcion,
          efectosPosibles: body.efectosPosibles !== undefined ? (body.efectosPosibles ? String(body.efectosPosibles).trim() : null) : existing.efectosPosibles,
          controlFuente: body.controlFuente !== undefined ? (body.controlFuente ? String(body.controlFuente).trim() : null) : existing.controlFuente,
          controlMedio: body.controlMedio !== undefined ? (body.controlMedio ? String(body.controlMedio).trim() : null) : existing.controlMedio,
          controlIndividuo: body.controlIndividuo !== undefined ? (body.controlIndividuo ? String(body.controlIndividuo).trim() : null) : existing.controlIndividuo,
          nivelDeficiencia: calculated.nd,
          nivelExposicion: calculated.ne,
          nivelProbabilidad: calculated.np,
          interpProbabilidad: calculated.interpNp || body.interpProbabilidad || null,
          nivelConsecuencia: calculated.nc,
          nivelRiesgo: calculated.nr,
          interpRiesgo: calculated.interpNr || body.interpRiesgo || null,
          aceptabilidad: calculated.aceptabilidad || body.aceptabilidad || null,
          numExpuestos: body.numExpuestos !== undefined ? (body.numExpuestos ? Number(body.numExpuestos) : null) : existing.numExpuestos,
          peorConsecuencia: body.peorConsecuencia !== undefined ? (body.peorConsecuencia ? String(body.peorConsecuencia).trim() : null) : existing.peorConsecuencia,
          requisitoLegal: body.requisitoLegal !== undefined ? Boolean(body.requisitoLegal) : existing.requisitoLegal,
          eliminacion: body.eliminacion !== undefined ? (body.eliminacion ? String(body.eliminacion).trim() : null) : existing.eliminacion,
          sustitucion: body.sustitucion !== undefined ? (body.sustitucion ? String(body.sustitucion).trim() : null) : existing.sustitucion,
          controlesIngenieria: body.controlesIngenieria !== undefined ? (body.controlesIngenieria ? String(body.controlesIngenieria).trim() : null) : existing.controlesIngenieria,
          controlesAdministrativos: body.controlesAdministrativos !== undefined ? (body.controlesAdministrativos ? String(body.controlesAdministrativos).trim() : null) : existing.controlesAdministrativos,
          epp: body.epp !== undefined ? (body.epp ? String(body.epp).trim() : null) : existing.epp,
        },
      })

      return res.status(200).json(updated)
    } catch (error: any) {
      console.error('Error PUT /api/peligros/[id]:', error)
      return res.status(500).json({
        error: 'Error al actualizar el peligro',
        details: error?.message || String(error),
      })
    }
  }

  if (method === 'DELETE') {
    try {
      await prisma.peligroCatalogo.update({
        where: { id: peligroId },
        data: { deletedAt: new Date() },
      })

      return res.status(200).json({ success: true, message: 'Peligro eliminado del catálogo' })
    } catch (error: any) {
      console.error('Error DELETE /api/peligros/[id]:', error)
      return res.status(500).json({
        error: 'Error al eliminar el peligro',
        details: error?.message || String(error),
      })
    }
  }

  res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
  return res.status(405).json({ error: `Método ${method} no permitido` })
}
