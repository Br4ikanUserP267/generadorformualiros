import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getImport, removeImport } from '@/lib/riesgos-import-store'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { importId, area, responsable, fecha_elaboracion } = req.body || {}

    if (!importId || typeof importId !== 'string') {
      return res.status(400).json({ error: 'importId es requerido' })
    }

    const saved = getImport(importId)
    if (!saved) {
      return res.status(404).json({ error: 'Importacion no encontrada o expirada' })
    }

    const firstUser = await prisma.usuario.findFirst()
    if (!firstUser) {
      return res.status(500).json({ error: 'No hay usuarios en la base de datos' })
    }

    const fechaElaboracion = fecha_elaboracion
      ? new Date(fecha_elaboracion)
      : (saved.metadata.fechaElaboracion ? new Date(saved.metadata.fechaElaboracion) : new Date())

    const areaValue = (area ?? saved.metadata.area ?? '').trim()
    const responsableValue = (responsable ?? saved.metadata.responsable ?? '').trim()

    const created = await prisma.$transaction(async (tx) => {
      return tx.matriz.create({
        data: {
          usuarioId: firstUser.id,
          area: areaValue,
          responsable: responsableValue,
          fechaElaboracion,
          fechaActualizacion: null,
          procesos: {
            create: saved.parsed.procesos.map((p, pIdx) => ({
              nombre: p.nombre.trim(),
              orden: pIdx,
              zonas: {
                create: p.zonas.map((z, zIdx) => ({
                  nombre: z.nombre.trim(),
                  orden: zIdx,
                  actividades: {
                    create: z.actividades.map((a, aIdx) => ({
                      nombre: a.nombre.trim(),
                      descripcion: a.descripcion.trim(),
                      tareas: a.tareas.trim(),
                      cargo: a.cargo.trim(),
                      rutinario: !!a.rutinario,
                      orden: aIdx,
                      peligros: {
                        create: a.peligros.map((pel, pelIdx) => ({
                          descripcion: pel.descripcion.trim(),
                          clasificacion: pel.clasificacion.trim(),
                          efectosPosibles: pel.efectosPosibles.trim(),
                          orden: pelIdx,
                          control: {
                            create: {
                              fuente: pel.control.fuente.trim(),
                              medio: pel.control.medio.trim(),
                              individuo: pel.control.individuo.trim(),
                            },
                          },
                          evaluacion: {
                            create: {
                              nivelDeficiencia: pel.evaluacion.nivelDeficiencia,
                              nivelExposicion: pel.evaluacion.nivelExposicion,
                              nivelConsecuencia: pel.evaluacion.nivelConsecuencia,
                              nivelProbabilidad: pel.evaluacion.nivelProbabilidad,
                              nivelRiesgo: pel.evaluacion.nivelRiesgo,
                              interpProbabilidad: pel.evaluacion.interpProbabilidad,
                              interpRiesgo: pel.evaluacion.interpRiesgo,
                              aceptabilidad: pel.evaluacion.aceptabilidad,
                            },
                          },
                          criterio: {
                            create: {
                              numExpuestos: pel.criterio.numExpuestos,
                              peorConsecuencia: pel.criterio.peorConsecuencia.trim(),
                              requisitoLegal: pel.criterio.requisitoLegal,
                            },
                          },
                          intervencion: {
                            create: {
                              eliminacion: pel.intervencion.eliminacion.trim(),
                              sustitucion: pel.intervencion.sustitucion.trim(),
                              controlesIngenieria: pel.intervencion.controlesIngenieria.trim(),
                              controlesAdministrativos: pel.intervencion.controlesAdministrativos.trim(),
                              epp: pel.intervencion.epp.trim(),
                              responsable: pel.intervencion.responsable.trim(),
                              fechaEjecucion: pel.intervencion.fechaEjecucion ? new Date(pel.intervencion.fechaEjecucion) : null,
                            },
                          },
                        })),
                      },
                    })),
                  },
                })),
              },
            })),
          },
        },
      })
    })

    removeImport(importId)
    return res.status(200).json({ id: created.id })
  } catch (error: any) {
    console.error('Import confirm error:', error)
    return res.status(500).json({ error: 'Error importando matriz', details: error?.message || String(error) })
  }
}
