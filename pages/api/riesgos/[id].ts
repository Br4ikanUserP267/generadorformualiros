import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { id } = req.query
    const mid = String(id) // UUID string
    if (!mid || mid === 'undefined') return res.status(400).json({ error: 'Invalid id' })

    if (req.method === 'GET') {
      const m = await prisma.matriz.findUnique({
        where: { id: mid },
        include: {
          archivos: true,
          procesos: {
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
                          intervencion: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      })
      if (!m) return res.status(404).json({ error: 'Not found' })

      const mapped = {
        id: m.id,
        area: m.area || '',
        responsable: m.responsable || '',
        fecha_elaboracion: m.fechaElaboracion ? m.fechaElaboracion.toISOString().split('T')[0] : '',
        fecha_actualizacion: m.fechaActualizacion ? m.fechaActualizacion.toISOString().split('T')[0] : '',
        files: m.archivos.map((a) => ({
          name: a.nombreOriginal || 'file',
          type: a.tipoMime || '',
          data: a.url || ''
        })),
        procesos: m.procesos.map(p => ({
          id: p.id,
          nombre: p.nombre,
          zonas: p.zonas.map(z => ({
            id: z.id,
            nombre: z.nombre,
            cargo: '', // Loaded below or empty since we map to Actividad directly now
            rutinario: false,
            actividades: z.actividades.map(a => ({
              id: a.id,
              nombre: a.nombre,
              descripcion: a.descripcion || '',
              tareas: a.tareas || '',
              cargo: a.cargo || '',
              rutinario: !!a.rutinario,
              peligros: a.peligros.map(pel => ({
                id: pel.id,
                descripcion: pel.descripcion || '',
                clasificacion: pel.clasificacion || '',
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
                _ui: { expanded: false, activeTab: 0 }
              }))
            }))
          }))
        }))
      }

      return res.status(200).json(mapped)
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const body = req.body
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid payload' })

      const updated = await prisma.matriz.update({
        where: { id: mid },
        data: {
          area: body.area,
          archivos: {
            deleteMany: {},
            create: (body.files || []).map((f: any) => ({
              nombreOriginal: f.name || 'file',
              nombreAlmacenado: f.name || 'file',
              tipoMime: f.type || '',
              url: f.data || ''
            }))
          },
          responsable: body.responsable,
          fechaElaboracion: body.fecha_elaboracion ? new Date(body.fecha_elaboracion) : null,
          fechaActualizacion: body.fecha_actualizacion ? new Date(body.fecha_actualizacion) : null,
          procesos: {
            deleteMany: {}, // Clean up existing completely (cascades down due to schema rules)
            create: (body.procesos || []).map((p: any) => ({
              nombre: p.nombre,
              zonas: {
                create: (p.zonas || []).map((z: any) => ({
                  nombre: z.nombre,
                  actividades: {
                    create: (z.actividades || []).map((a: any) => ({
                      nombre: a.nombre,
                      descripcion: a.descripcion,
                      tareas: a.tareas,
                      cargo: z.cargo || a.cargo,
                      rutinario: a.rutinario || z.rutinario || false,
                      peligros: {
                        create: (a.peligros || []).map((pel: any) => ({
                          descripcion: pel.descripcion,
                          clasificacion: pel.clasificacion,
                          efectosPosibles: pel.efectos,
                          control: pel.controles ? { create: { fuente: pel.controles.fuente, medio: pel.controles.medio, individuo: pel.controles.individuo } } : undefined,
                          evaluacion: pel.evaluacion ? { create: { 
                            nivelDeficiencia: Number(pel.evaluacion.nd) || null,
                            nivelExposicion: Number(pel.evaluacion.ne) || null,
                            nivelConsecuencia: Number(pel.evaluacion.nc) || null,
                            nivelProbabilidad: Number(pel.evaluacion.np) || null,
                            nivelRiesgo: Number(pel.evaluacion.nr) || null,
                            interpProbabilidad: pel.evaluacion.interp_np,
                            interpRiesgo: pel.evaluacion.interp_nr,
                            aceptabilidad: pel.evaluacion.aceptabilidad
                          }} : undefined,
                          criterio: pel.criterios ? { create: {
                            numExpuestos: Number(pel.criterios.num_expuestos) || null,
                            peorConsecuencia: pel.criterios.peor_consecuencia,
                            requisitoLegal: !!pel.criterios.requisito_legal
                          }} : undefined,
                          intervencion: pel.intervencion ? { create: {
                            eliminacion: pel.intervencion.eliminacion,
                            sustitucion: pel.intervencion.sustitucion,
                            controlesIngenieria: pel.intervencion.controles_ingenieria,
                            controlesAdministrativos: pel.intervencion.controles_administrativos,
                            epp: pel.intervencion.epp,
                            responsable: pel.intervencion.responsable,
                            fechaEjecucion: pel.intervencion.fecha_ejecucion ? new Date(pel.intervencion.fecha_ejecucion) : null
                          }} : undefined
                        }))
                      }
                    }))
                  }
                }))
              }
            }))
          }
        }
      })
      
      return res.status(200).json({ id: updated.id })
    }

    if (req.method === 'DELETE') {
      await prisma.matriz.delete({ where: { id: mid } })
      return res.status(200).json({ deleted: mid })
    }

    res.setHeader('Allow', 'GET,PUT,PATCH,DELETE')
    res.status(405).end('Method Not Allowed')
  } catch (err: any) {
    console.error('API /api/riesgos/[id] error:', err)
    res.status(500).json({ error: 'Internal server error', details: err.message, stack: err.stack })
  }
}
