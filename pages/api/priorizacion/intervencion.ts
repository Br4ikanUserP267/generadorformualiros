import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { peligroId, intervencion, evaluacionPost } = req.body

    if (!peligroId) {
      return res.status(400).json({ error: 'Peligro ID is required' })
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update or Create Intervencion
      const updatedIntervencion = await tx.intervencion.upsert({
        where: { peligroId },
        create: {
          peligroId,
          eliminacion: intervencion.eliminacion,
          sustitucion: intervencion.sustitucion,
          controlesIngenieria: intervencion.controles_ingenieria,
          controlesAdministrativos: intervencion.controles_administrativos,
          epp: intervencion.epp,
          responsable: intervencion.responsable,
          fechaEjecucion: intervencion.fecha_ejecucion ? new Date(intervencion.fecha_ejecucion) : null,
        },
        update: {
          eliminacion: intervencion.eliminacion,
          sustitucion: intervencion.sustitucion,
          controlesIngenieria: intervencion.controles_ingenieria,
          controlesAdministrativos: intervencion.controles_administrativos,
          epp: intervencion.epp,
          responsable: intervencion.responsable,
          fechaEjecucion: intervencion.fecha_ejecucion ? new Date(intervencion.fecha_ejecucion) : null,
        }
      })

      // 2. Update or Create EvaluacionPost
      const updatedEvaluacionPost = await (tx as any).evaluacionPost.upsert({
        where: { peligroId },
        create: {
          peligroId,
          nivelDeficiencia: Number(evaluacionPost.nd) || null,
          nivelExposicion: Number(evaluacionPost.ne) || null,
          nivelConsecuencia: Number(evaluacionPost.nc) || null,
          nivelProbabilidad: Number(evaluacionPost.np) || null,
          nivelRiesgo: Number(evaluacionPost.nr) || null,
          interpProbabilidad: evaluacionPost.interp_np,
          interpRiesgo: evaluacionPost.interp_nr,
          aceptabilidad: evaluacionPost.aceptabilidad,
        },
        update: {
          nivelDeficiencia: Number(evaluacionPost.nd) || null,
          nivelExposicion: Number(evaluacionPost.ne) || null,
          nivelConsecuencia: Number(evaluacionPost.nc) || null,
          nivelProbabilidad: Number(evaluacionPost.np) || null,
          nivelRiesgo: Number(evaluacionPost.nr) || null,
          interpProbabilidad: evaluacionPost.interp_np,
          interpRiesgo: evaluacionPost.interp_nr,
          aceptabilidad: evaluacionPost.aceptabilidad,
        }
      })

      return { intervencion: updatedIntervencion, evaluacionPost: updatedEvaluacionPost }
    })

    return res.status(200).json(result)
  } catch (error) {
    console.error('Save intervention error:', error)
    return res.status(500).json({ error: 'Error guardando la intervención' })
  }
}
