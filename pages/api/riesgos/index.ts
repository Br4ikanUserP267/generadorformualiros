import { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { persistFilesToDisk } from '@/lib/server-upload'

const prismaSupportsPeligroNumero = !!Prisma.dmmf.datamodel.models
  .find((m) => m.name === 'Peligro')
  ?.fields.some((f) => f.name === 'numero')

function desiredPeligroNumero(pel: any, fallbackIdx: number) {
  if (typeof pel?.numero === 'number' && pel.numero > 0) return pel.numero
  const labelMatch = String(pel?._ui?.stableLabel || '').match(/\b(\d+)\b/)
  return labelMatch ? Number(labelMatch[1]) : (fallbackIdx + 1)
}

async function persistPeligroNumeroByOrderPath(matrizId: string, procesos: any[]) {
  try {
    for (let pIdx = 0; pIdx < (procesos || []).length; pIdx++) {
      const p = procesos[pIdx]
      for (let zIdx = 0; zIdx < (p?.zonas || []).length; zIdx++) {
        const z = p.zonas[zIdx]
        for (let aIdx = 0; aIdx < (z?.actividades || []).length; aIdx++) {
          const a = z.actividades[aIdx]
          for (let pelIdx = 0; pelIdx < (a?.peligros || []).length; pelIdx++) {
            const pel = a.peligros[pelIdx]
            const numero = desiredPeligroNumero(pel, pelIdx)

            await prisma.$executeRaw`
              UPDATE "peligros" AS pg
              SET "numero" = ${numero}
              FROM "actividades" ac
              INNER JOIN "zonas" z ON z."id" = ac."zona_id"
              INNER JOIN "procesos" p ON p."id" = z."proceso_id"
              WHERE pg."actividad_id" = ac."id"
                AND p."matriz_id" = ${matrizId}
                AND p."orden" = ${pIdx}
                AND z."orden" = ${zIdx}
                AND ac."orden" = ${aIdx}
                AND pg."orden" = ${pelIdx}
            `
          }
        }
      }
    }
  } catch {
    // Keep save flow working even if runtime/database does not expose numero yet.
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const rows = await prisma.matriz.findMany({
        where: {
          deletedAt: null  // Exclude soft-deleted records
        },
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
                          intervencion: true
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
        },
        orderBy: { createdAt: 'asc' }
      })

      // Construct JSON exactly like the frontend expects
      const mapped = rows.map((m) => {
        return {
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
            orden: p.orden || 0,
            zonas: p.zonas.map(z => ({
              id: z.id,
              nombre: z.nombre,
              orden: z.orden || 0,
              cargo: '', // From actividad or fallback
              rutinario: false,
              actividades: z.actividades.map(a => ({
                id: a.id,
                nombre: a.nombre,
                orden: a.orden || 0,
                descripcion: a.descripcion || '',
                tareas: a.tareas || '',
                cargo: a.cargo || '',
                rutinario: !!a.rutinario,
                peligros: a.peligros.map((pel: any) => ({
                  id: pel.id,
                  descripcion: pel.descripcion || '',
                  clasificacion: pel.clasificacion || '',
                  numero: pel.numero || 0,
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
      })
      
      return res.status(200).json(mapped)
    }

    if (req.method === 'POST') {
      const body = req.body
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid payload' })

      const persistedFiles = await persistFilesToDisk(body.files || [])

      // Get any valid user to act as foreign key
      const firstUser = await prisma.usuario.findFirst()
      if (!firstUser) {
        return res.status(500).json({ error: 'No hay usuarios en la base de datos' })
      }

      const created = await prisma.matriz.create({
        data: {
          usuarioId: firstUser.id,
          area: body.area,
          archivos: {
            create: persistedFiles.map((f: any) => ({
              nombreOriginal: f.name || 'file',
              nombreAlmacenado: f.name || 'file',
              tipoMime: f.type || '',
              url: f.url || ''
            }))
          },
          responsable: body.responsable,
          fechaElaboracion: body.fecha_elaboracion ? new Date(body.fecha_elaboracion) : null,
          fechaActualizacion: body.fecha_actualizacion ? new Date(body.fecha_actualizacion) : null,
          procesos: {
            create: (body.procesos || []).map((p: any, pIdx: number) => ({
              nombre: p.nombre,
              orden: typeof p.orden === 'number' ? p.orden : pIdx,
              zonas: {
                create: (p.zonas || []).map((z: any, zIdx: number) => ({
                  nombre: z.nombre,
                  orden: typeof z.orden === 'number' ? z.orden : zIdx,
                  actividades: {
                    create: (z.actividades || []).map((a: any, aIdx: number) => ({
                      nombre: a.nombre,
                      descripcion: a.descripcion,
                      tareas: a.tareas,
                      cargo: z.cargo || a.cargo, // Frontend fallback pattern
                      rutinario: a.rutinario || z.rutinario || false,
                      orden: typeof a.orden === 'number' ? a.orden : aIdx,
                      peligros: {
                        create: (a.peligros || []).map((pel: any, pelIdx: number) => ({
                          ...(prismaSupportsPeligroNumero ? {
                            numero: (typeof pel.numero === 'number' && pel.numero > 0)
                              ? pel.numero
                              : (() => {
                                  const labelMatch = String(pel?._ui?.stableLabel || '').match(/\b(\d+)\b/)
                                  return labelMatch ? Number(labelMatch[1]) : (pelIdx + 1)
                                })(),
                          } : {}),
                          descripcion: pel.descripcion,
                          clasificacion: pel.clasificacion,
                          efectosPosibles: pel.efectos,
                          orden: typeof pel.orden === 'number' ? pel.orden : pelIdx,
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

      if (!prismaSupportsPeligroNumero) {
        await persistPeligroNumeroByOrderPath(created.id, body.procesos || [])
      }
      
      return res.status(201).json({ id: created.id })
    }

    res.setHeader('Allow', 'GET,POST')
    res.status(405).end('Method Not Allowed')
  } catch (err: any) {
    console.error('API /api/riesgos error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
