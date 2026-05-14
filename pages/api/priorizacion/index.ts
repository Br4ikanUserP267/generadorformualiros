import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const isUserAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';

    // Fetch risks where initial NP is Medio, Alto, or Muy Alto
    // AND where post-intervention NP is NOT Bajo (or doesn't exist)
    const dangers = await (prisma.peligro.findMany as any)({
      where: {
        actividad: {
          zona: {
            proceso: {
              matriz: {
                deletedAt: null,
                ...(isUserAdmin ? {} : { usuarioId: user.id })
              }
            }
          }
        },
        evaluacion: {
          interpProbabilidad: {
            in: ['Medio', 'Alto', 'Muy Alto']
          }
        },
        OR: [
          { evaluacionPost: null },
          {
            evaluacionPost: {
              interpProbabilidad: {
                not: 'Bajo'
              }
            }
          }
        ]
      } as any,
      select: {
        id: true,
        descripcion: true,
        clasificacion: true,
        evaluacion: true,
        evaluacionPost: true,
        intervencion: true,
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
                        area: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } as any,
      orderBy: {
        evaluacion: {
          nivelProbabilidad: 'desc'
        }
      }
    })

    const mapped = (dangers as any[]).map(d => ({
      id: d.id,
      descripcion: d.descripcion,
      clasificacion: d.clasificacion,
      area: d.actividad.zona.proceso.matriz.area,
      matrizId: d.actividad.zona.proceso.matriz.id,
      proceso: d.actividad.zona.proceso.nombre,
      zona: d.actividad.zona.nombre,
      actividad: d.actividad.nombre,
      evaluacion: {
        nd: d.evaluacion?.nivelDeficiencia,
        ne: d.evaluacion?.nivelExposicion,
        nc: d.evaluacion?.nivelConsecuencia,
        np: d.evaluacion?.nivelProbabilidad,
        nr: d.evaluacion?.nivelRiesgo,
        interp_np: d.evaluacion?.interpProbabilidad,
        interp_nr: d.evaluacion?.interpRiesgo,
        aceptabilidad: d.evaluacion?.aceptabilidad
      },
      evaluacionPost: d.evaluacionPost ? {
        nd: d.evaluacionPost.nivelDeficiencia,
        ne: d.evaluacionPost.nivelExposicion,
        nc: d.evaluacionPost.nivelConsecuencia,
        np: d.evaluacionPost.nivelProbabilidad,
        nr: d.evaluacionPost.nivelRiesgo,
        interp_np: d.evaluacionPost.interpProbabilidad,
        interp_nr: d.evaluacionPost.interpRiesgo,
        aceptabilidad: d.evaluacionPost.aceptabilidad
      } : null,
      intervencion: {
        eliminacion: d.intervencion?.eliminacion || '',
        sustitucion: d.intervencion?.sustitucion || '',
        controles_ingenieria: d.intervencion?.controlesIngenieria || '',
        controles_administrativos: d.intervencion?.controlesAdministrativos || '',
        epp: d.intervencion?.epp || '',
        responsable: d.intervencion?.responsable || '',
        fecha_ejecucion: d.intervencion?.fechaEjecucion ? d.intervencion.fechaEjecucion.toISOString().split('T')[0] : ''
      }
    }))

    return res.status(200).json(mapped)
  } catch (error) {
    console.error('Priorizacion risks error:', error)
    return res.status(500).json({ error: 'Error cargando riesgos prioritarios' })
  }
}
