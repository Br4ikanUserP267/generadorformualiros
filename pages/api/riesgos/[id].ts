import { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { persistFilesToDisk } from '@/lib/server-upload'
import { syncMatrix } from '@/lib/matrix-persistence/sync-matrix'



export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

import { getAuthUser } from '@/lib/auth-server'
import { withLogging } from '@/lib/with-logging'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { id } = req.query
    const mid = String(id) // UUID string
    if (!mid || mid === 'undefined') return res.status(400).json({ error: 'Invalid id' })

    const method = (req.method || '').toUpperCase()

    const isUserAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const existing = await prisma.matriz.findUnique({
      where: { id: mid },
      select: { usuarioId: true, deletedAt: true }
    })

    if (!existing || existing.deletedAt) {
      return res.status(404).json({ error: 'Not found' })
    }


    if (method === 'GET') {
// ...
      const m = await prisma.matriz.findUnique({
        where: { id: mid },
        include: {
          archivos: true,
          procesos: {
            orderBy: { orden: 'asc' },
            include: {
              zonas: {
                include: {
                  actividades: {
                    include: {
                      peligros: {
                        include: {
                          control: true,
                          criterio: true,
                          evaluacion: true,
                          evaluacionPost: true,
                          intervencion: true,
                          catalogoPeligro: {
                            include: {
                              planesAccion: {
                                where: { deletedAt: null },
                                orderBy: { orden: 'asc' },
                              },
                            },
                          },
                          planesAccion: {
                            where: { deletedAt: null },
                            orderBy: { orden: 'asc' },
                          },
                        },
                        orderBy: { orden: 'asc' }
                      }
                    },
                    orderBy: { orden: 'asc' }
                  }
                },
                orderBy: { orden: 'asc' }
              }
            }
          }
        }
      })
      if (!m || m.deletedAt) return res.status(404).json({ error: 'Not found' })

      const mapped: any = {
        id: m.id,
        area: m.area || '',
        responsable: m.responsable || '',
        fecha_elaboracion: m.fechaElaboracion ? m.fechaElaboracion.toISOString().split('T')[0] : '',
        fecha_actualizacion: m.fechaActualizacion ? m.fechaActualizacion.toISOString().split('T')[0] : '',
        updatedAt: m.updatedAt ? m.updatedAt.toISOString() : null,
        files: (m as any).archivos.map((a: any) => ({
          name: a.nombreOriginal || 'file',
          type: a.tipoMime || '',
          data: a.url || ''
        })),
        procesos: ((m as any).procesos || []).map((p: any) => ({
          id: p.id,
          nombre: p.nombre,
          orden: p.orden || 0,
          zonas: (p.zonas || []).map((z: any) => ({
            id: z.id,
            nombre: z.nombre,
            orden: z.orden || 0,
            cargo: '',
            rutinario: false,
            actividades: (z.actividades || []).map((a: any) => ({
              id: a.id,
              nombre: a.nombre,
              orden: a.orden || 0,
              descripcion: a.descripcion || '',
              tareas: a.tareas || '',
              cargo: a.cargo || '',
              rutinario: !!a.rutinario,
              peligros: (a.peligros || []).map((pel: any, pelIdx: number) => {
                const planItems = (pel.planesAccion && pel.planesAccion.length > 0)
                  ? pel.planesAccion
                  : (pel.catalogoPeligro?.planesAccion || [])

                return {
                  id: pel.id,
                  catalogoPeligroId: pel.catalogoPeligroId || null,
                  codigo: pel.catalogoPeligro?.codigo || null,
                  descripcion: pel.descripcion || '',
                  clasificacion: pel.clasificacion || '',
                  numero: typeof pel.numero === 'number' && pel.numero > 0 ? pel.numero : ((pel.orden ?? pelIdx) + 1),
                  orden: pel.orden || 0,
                  efectos: pel.efectosPosibles || '',
                  controles: {
                    fuente: pel.control?.fuente || '',
                    medio: pel.control?.medio || '',
                    individuo: pel.control?.individuo || ''
                  },
                  evaluacion: {
                    nd: pel.evaluacion?.nivelDeficiencia || null,
                    ne: pel.evaluacion?.nivelExposicion || null,
                    nc: pel.evaluacion?.nivelConsecuencia || null,
                    np: pel.evaluacion?.nivelProbabilidad || null,
                    nr: pel.evaluacion?.nivelRiesgo || null,
                    interp_np: pel.evaluacion?.interpProbabilidad || '',
                    interp_nr: pel.evaluacion?.interpRiesgo || '',
                    aceptabilidad: pel.evaluacion?.aceptabilidad || ''
                  },
                  evaluacionPost: pel.evaluacionPost ? {
                    nd: pel.evaluacionPost.nivelDeficiencia || null,
                    ne: pel.evaluacionPost.nivelExposicion || null,
                    nc: pel.evaluacionPost.nivelConsecuencia || null,
                    np: pel.evaluacionPost.nivelProbabilidad || null,
                    nr: pel.evaluacionPost.nivelRiesgo || null,
                    interp_np: pel.evaluacionPost.interpProbabilidad || '',
                    interp_nr: pel.evaluacionPost.interpRiesgo || '',
                    aceptabilidad: pel.evaluacionPost.aceptabilidad || ''
                  } : null,
                  criterios: {
                    num_expuestos: pel.criterio?.numExpuestos || null,
                    peor_consecuencia: pel.criterio?.peorConsecuencia || '',
                    requisito_legal: !!pel.criterio?.requisitoLegal
                  },
                  intervencion: {
                    eliminacion: pel.intervencion?.eliminacion || '',
                    sustitucion: pel.intervencion?.sustitucion || '',
                    controles_ingenieria: pel.intervencion?.controlesIngenieria || '',
                    controles_administrativos: pel.intervencion?.controlesAdministrativos || '',
                    epp: pel.intervencion?.epp || '',
                    responsable: pel.intervencion?.responsable || '',
                    fecha_ejecucion: pel.intervencion?.fechaEjecucion ? pel.intervencion.fechaEjecucion.toISOString().split('T')[0] : ''
                  },
                  planesAccion: planItems,
                  _ui: { expanded: false, activeTab: 0 }
                }
              })
            }))
          }))
        }))
      }

      return res.status(200).json(mapped)
    }

    if (method === 'PUT' || method === 'PATCH') {
      const body = req.body
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid payload' })

      try {
        const syncResult = await syncMatrix(prisma, mid, body)

        return res.status(200).json({
          id: syncResult.id,
          updatedAt: syncResult.updatedAt,
          idMap: syncResult.idMap,
          stats: syncResult.stats,
          durationMs: syncResult.durationMs,
        })
      } catch (syncErr: any) {
        if (syncErr.code === 'CONCURRENT_MODIFICATION') {
          return res.status(409).json({
            error: 'Conflict',
            code: 'CONCURRENT_MODIFICATION',
            message: syncErr.message,
          })
        }
        throw syncErr
      }
    }

    if (method === 'DELETE') {
      await prisma.matriz.update({
        where: { id: mid },
        data: { deletedAt: new Date() }
      })
      return res.status(200).json({ deleted: mid })
    }

    res.setHeader('Allow', 'GET,PUT,PATCH,DELETE')
    res.status(405).end('Method Not Allowed')
  } catch (err: any) {
    console.error('API /api/riesgos/[id] error:', err)
    res.status(500).json({ error: 'Internal server error', details: err.message, stack: err.stack })
  }
}

export default withLogging(handler)
