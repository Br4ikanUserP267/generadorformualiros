import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const { dangerId } = req.query
  if (!dangerId || typeof dangerId !== 'string') {
    return res.status(400).json({ error: 'ID de peligro inválido' })
  }

  const { method } = req

  if (method === 'GET') {
    try {
      // Find danger in PeligroCatalogo
      let danger: any = await prisma.peligroCatalogo.findUnique({
        where: { id: dangerId },
        include: {
          planesAccion: {
            where: { deletedAt: null },
            orderBy: { orden: 'asc' },
          },
        },
      })

      let isCatalog = true

      // If not in catalog, search in matrix peligros
      if (!danger) {
        danger = await prisma.peligro.findUnique({
          where: { id: dangerId },
          include: {
            planesAccion: {
              where: { deletedAt: null },
              orderBy: { orden: 'asc' },
            },
            control: true,
            evaluacion: true,
            criterio: true,
            intervencion: true,
            catalogoPeligro: {
              include: {
                planesAccion: {
                  where: { deletedAt: null },
                  orderBy: { orden: 'asc' },
                },
              },
            },
          },
        })
        isCatalog = false
      }

      if (!danger || danger.deletedAt) {
        return res.status(404).json({ error: 'Peligro no encontrado' })
      }

      // If it's a matrix danger that links to catalog, combine/fallback planesAccion
      const planes = isCatalog
        ? danger.planesAccion
        : (danger.planesAccion && danger.planesAccion.length > 0
            ? danger.planesAccion
            : danger.catalogoPeligro?.planesAccion || [])

      return res.status(200).json({
        danger: {
          id: danger.id,
          codigo: danger.codigo || null,
          clasificacion: danger.clasificacion,
          descripcion: danger.descripcion,
          efectosPosibles: danger.efectosPosibles || danger.efectos_posibles || null,
          nivelRiesgo: danger.nivelRiesgo || danger.evaluacion?.nivelRiesgo || null,
          interpRiesgo: danger.interpRiesgo || danger.evaluacion?.interpRiesgo || null,
          aceptabilidad: danger.aceptabilidad || danger.evaluacion?.aceptabilidad || null,
          eliminacion: danger.eliminacion || danger.intervencion?.eliminacion || null,
          sustitucion: danger.sustitucion || danger.intervencion?.sustitucion || null,
          controlesIngenieria: danger.controlesIngenieria || danger.intervencion?.controlesIngenieria || null,
          controlesAdministrativos: danger.controlesAdministrativos || danger.intervencion?.controlesAdministrativos || null,
          epp: danger.epp || danger.intervencion?.epp || null,
          isCatalog,
        },
        planesAccion: planes,
      })
    } catch (error: any) {
      console.error('Error GET /api/plan-accion/danger/[dangerId]:', error)
      return res.status(500).json({
        error: 'Error al obtener las acciones del peligro',
        details: error?.message || String(error),
      })
    }
  }

  if (method === 'POST') {
    try {
      const { actions } = req.body

      if (!Array.isArray(actions)) {
        return res.status(400).json({ error: 'La propiedad "actions" debe ser un array.' })
      }

      // Verify if danger is catalog or matrix
      const catalogItem = await prisma.peligroCatalogo.findUnique({
        where: { id: dangerId },
      })

      const isCatalog = Boolean(catalogItem)

      const result = await prisma.$transaction(async (tx: any) => {
        // Mark existing actions not in the submitted list as deleted
        const activeSubmittedIds = actions.filter((a: any) => a.id).map((a: any) => a.id)

        await tx.planAccion5W2H.updateMany({
          where: {
            peligroCatalogoId: isCatalog ? dangerId : undefined,
            peligroId: !isCatalog ? dangerId : undefined,
            id: { notIn: activeSubmittedIds },
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
        })

        // Upsert submitted actions
        const savedActions = []

        for (let i = 0; i < actions.length; i++) {
          const act = actions[i]
          if (!act.que || !String(act.que).trim()) continue

          const actionData = {
            peligroCatalogoId: isCatalog ? dangerId : null,
            peligroId: !isCatalog ? dangerId : null,
            que: String(act.que).trim(),
            porQue: act.porQue ? String(act.porQue).trim() : null,
            donde: act.donde ? String(act.donde).trim() : null,
            cuandoInicio: act.cuandoInicio ? new Date(act.cuandoInicio) : null,
            cuandoFin: act.cuandoFin ? new Date(act.cuandoFin) : null,
            como: act.como ? String(act.como).trim() : null,
            cuanto: act.cuanto ? String(act.cuanto).trim() : null,
            responsable: act.responsable ? String(act.responsable).trim() : null,
            estado: act.estado ? String(act.estado).toUpperCase() : 'PENDIENTE',
            orden: i,
          }

          if (act.id) {
            const updated = await tx.planAccion5W2H.update({
              where: { id: act.id },
              data: actionData,
            })
            savedActions.push(updated)
          } else {
            const created = await tx.planAccion5W2H.create({
              data: actionData,
            })
            savedActions.push(created)
          }
        }

        return savedActions
      })

      return res.status(200).json({
        success: true,
        message: 'Plan de acción 5W2H actualizado exitosamente',
        planesAccion: result,
      })
    } catch (error: any) {
      console.error('Error POST /api/plan-accion/danger/[dangerId]:', error)
      return res.status(500).json({
        error: 'Error al guardar el plan de acción',
        details: error?.message || String(error),
      })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Método no permitido' })
}
