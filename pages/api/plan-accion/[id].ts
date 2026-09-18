import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID inválido' })
  }

  const { method } = req

  if (method === 'PUT') {
    try {
      const {
        que,
        porQue,
        donde,
        cuandoInicio,
        cuandoFin,
        como,
        cuanto,
        responsable,
        estado,
        orden,
      } = req.body

      const existing = await prisma.planAccion5W2H.findUnique({
        where: { id },
      })

      if (!existing || existing.deletedAt) {
        return res.status(404).json({ error: 'Acción 5W2H no encontrada' })
      }

      const updateData: any = {}
      if (que !== undefined) updateData.que = String(que).trim()
      if (porQue !== undefined) updateData.porQue = porQue ? String(porQue).trim() : null
      if (donde !== undefined) updateData.donde = donde ? String(donde).trim() : null
      if (cuandoInicio !== undefined) updateData.cuandoInicio = cuandoInicio ? new Date(cuandoInicio) : null
      if (cuandoFin !== undefined) updateData.cuandoFin = cuandoFin ? new Date(cuandoFin) : null
      if (como !== undefined) updateData.como = como ? String(como).trim() : null
      if (cuanto !== undefined) updateData.cuanto = cuanto ? String(cuanto).trim() : null
      if (responsable !== undefined) updateData.responsable = responsable ? String(responsable).trim() : null
      if (estado !== undefined) updateData.estado = String(estado).toUpperCase()
      if (orden !== undefined) updateData.orden = Number(orden)

      const updated = await prisma.planAccion5W2H.update({
        where: { id },
        data: updateData,
      })

      return res.status(200).json(updated)
    } catch (error: any) {
      console.error('Error PUT /api/plan-accion/[id]:', error)
      return res.status(500).json({
        error: 'Error al actualizar la acción 5W2H',
        details: error?.message || String(error),
      })
    }
  }

  if (method === 'DELETE') {
    try {
      const existing = await prisma.planAccion5W2H.findUnique({
        where: { id },
      })

      if (!existing || existing.deletedAt) {
        return res.status(404).json({ error: 'Acción 5W2H no encontrada' })
      }

      await prisma.planAccion5W2H.update({
        where: { id },
        data: { deletedAt: new Date() },
      })

      return res.status(200).json({ success: true, message: 'Acción eliminada correctamente' })
    } catch (error: any) {
      console.error('Error DELETE /api/plan-accion/[id]:', error)
      return res.status(500).json({
        error: 'Error al eliminar la acción 5W2H',
        details: error?.message || String(error),
      })
    }
  }

  res.setHeader('Allow', ['PUT', 'DELETE'])
  return res.status(405).json({ error: 'Método no permitido' })
}
