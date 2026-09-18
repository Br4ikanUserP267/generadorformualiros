import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(450).json({ error: 'Method not allowed' })
  }

  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const { id, page: pageQuery, pageSize: pageSizeQuery } = req.query
    const matrizId = String(id)

    if (!matrizId || matrizId === 'undefined') {
      return res.status(400).json({ error: 'Matriz ID is required' })
    }

    const page = Math.max(1, parseInt(String(pageQuery || '1'), 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(String(pageSizeQuery || '10'), 10) || 10))

    const existingMatriz = await prisma.matriz.findUnique({
      where: { id: matrizId },
      select: {
        id: true,
        area: true,
        responsable: true,
        fechaElaboracion: true,
        fechaActualizacion: true,
        usuarioId: true,
        deletedAt: true,
      },
    })

    if (!existingMatriz || existingMatriz.deletedAt) {
      return res.status(404).json({ error: 'Matriz no encontrada' })
    }

    const isUserAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN'
    if (!isUserAdmin && existingMatriz.usuarioId !== user.id) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const baseWhere: Prisma.PeligroWhereInput = {
      deletedAt: null,
      actividad: {
        deletedAt: null,
        zona: {
          deletedAt: null,
          proceso: {
            matrizId,
            deletedAt: null,
          },
        },
      },
    }

    // Execute Global Summary Counts and Current Page Records in parallel
    const [
      totalProcesos,
      totalZonas,
      totalActividades,
      totalPeligros,
      muyAltoCount,
      altoCount,
      medioCount,
      bajoCount,
      pagedPeligros,
    ] = await Promise.all([
      // 1. Total Procesos in entire matrix
      prisma.proceso.count({
        where: { matrizId, deletedAt: null },
      }),

      // 2. Total Zonas in entire matrix
      prisma.zona.count({
        where: {
          deletedAt: null,
          proceso: { matrizId, deletedAt: null },
        },
      }),

      // 3. Total Actividades in entire matrix
      prisma.actividad.count({
        where: {
          deletedAt: null,
          zona: {
            deletedAt: null,
            proceso: { matrizId, deletedAt: null },
          },
        },
      }),

      // 4. Total Peligros in entire matrix
      prisma.peligro.count({
        where: baseWhere,
      }),

      // 5. Muy Alto (NP > 20)
      prisma.peligro.count({
        where: {
          ...baseWhere,
          evaluacion: {
            nivelProbabilidad: { gt: 20 },
          },
        },
      }),

      // 6. Alto (NP between 10 and 20)
      prisma.peligro.count({
        where: {
          ...baseWhere,
          evaluacion: {
            nivelProbabilidad: { gte: 10, lte: 20 },
          },
        },
      }),

      // 7. Medio (NP between 6 and 8)
      prisma.peligro.count({
        where: {
          ...baseWhere,
          evaluacion: {
            nivelProbabilidad: { gte: 6, lte: 8 },
          },
        },
      }),

      // 8. Bajo (NP <= 4 or unevaluated)
      prisma.peligro.count({
        where: {
          ...baseWhere,
          OR: [
            { evaluacion: { nivelProbabilidad: { lte: 4 } } },
            { evaluacion: null },
          ],
        },
      }),

      // 9. Current Page Peligros with full relationship joins
      prisma.peligro.findMany({
        where: baseWhere,
        select: {
          id: true,
          descripcion: true,
          clasificacion: true,
          efectosPosibles: true,
          orden: true,
          actividad: {
            select: {
              id: true,
              nombre: true,
              descripcion: true,
              tareas: true,
              cargo: true,
              rutinario: true,
              orden: true,
              zona: {
                select: {
                  id: true,
                  nombre: true,
                  orden: true,
                  proceso: {
                    select: {
                      id: true,
                      nombre: true,
                      orden: true,
                    },
                  },
                },
              },
            },
          },
          control: {
            select: {
              fuente: true,
              medio: true,
              individuo: true,
            },
          },
          evaluacion: {
            select: {
              nivelDeficiencia: true,
              nivelExposicion: true,
              nivelProbabilidad: true,
              interpProbabilidad: true,
              nivelConsecuencia: true,
              nivelRiesgo: true,
              interpRiesgo: true,
              aceptabilidad: true,
            },
          },
          criterio: {
            select: {
              numExpuestos: true,
              peorConsecuencia: true,
              requisitoLegal: true,
            },
          },
          intervencion: {
            select: {
              eliminacion: true,
              sustitucion: true,
              controlesIngenieria: true,
              controlesAdministrativos: true,
              epp: true,
              responsable: true,
              fechaEjecucion: true,
            },
          },
          evaluacionPost: {
            select: {
              nivelDeficiencia: true,
              nivelExposicion: true,
              nivelProbabilidad: true,
              interpProbabilidad: true,
              nivelConsecuencia: true,
              nivelRiesgo: true,
              interpRiesgo: true,
              aceptabilidad: true,
            },
          },
        },
        orderBy: [
          { actividad: { zona: { proceso: { orden: 'asc' } } } },
          { actividad: { zona: { proceso: { id: 'asc' } } } },
          { actividad: { zona: { orden: 'asc' } } },
          { actividad: { zona: { id: 'asc' } } },
          { actividad: { orden: 'asc' } },
          { actividad: { id: 'asc' } },
          { orden: 'asc' },
          { id: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(totalPeligros / pageSize))

    // Map paged dangers to 30 flat columns
    const records = pagedPeligros.map((p: any) => {
      const a = p.actividad
      const z = a?.zona
      const proc = z?.proceso
      const ctrl = p.control
      const ev = p.evaluacion
      const crit = p.criterio
      const inv = p.intervencion

      return {
        id: p.id,
        proceso: proc?.nombre || 'General',
        zona: z?.nombre || '',
        actividad: a?.descripcion || a?.nombre || '',
        tareas: a?.tareas || '',
        cargo: a?.cargo || '',
        rutinario: a?.rutinario ? 'Sí' : 'No',
        peligro: p.descripcion || '',
        clasificacion: p.clasificacion || '',
        efectos: p.efectosPosibles || '',
        controlFuente: ctrl?.fuente || '',
        controlMedio: ctrl?.medio || '',
        controlIndividuo: ctrl?.individuo || '',
        nd: ev?.nivelDeficiencia ?? '—',
        ne: ev?.nivelExposicion ?? '—',
        np: ev?.nivelProbabilidad ?? '—',
        interpNp: ev?.interpProbabilidad || '',
        nc: ev?.nivelConsecuencia ?? '—',
        nr: ev?.nivelRiesgo ?? '—',
        interpNr: ev?.interpRiesgo || '',
        aceptabilidad: ev?.aceptabilidad || '',
        numExpuestos: crit?.numExpuestos ?? '—',
        peorConsecuencia: crit?.peorConsecuencia || '',
        requisitoLegal: crit?.requisitoLegal ? 'Sí' : 'No',
        eliminacion: inv?.eliminacion || '',
        sustitucion: inv?.sustitucion || '',
        controlIngenieria: inv?.controlesIngenieria || '',
        controlAdmin: inv?.controlesAdministrativos || '',
        epp: inv?.epp || '',
        responsable: inv?.responsable || '',
        fechaEjecucion: inv?.fechaEjecucion
          ? inv.fechaEjecucion.toISOString().split('T')[0]
          : '',
      }
    })

    return res.status(200).json({
      matrix: {
        id: existingMatriz.id,
        area: existingMatriz.area || '—',
        responsable: existingMatriz.responsable || '—',
        fechaElaboracion: existingMatriz.fechaElaboracion
          ? existingMatriz.fechaElaboracion.toISOString().split('T')[0]
          : '—',
        fechaActualizacion: existingMatriz.fechaActualizacion
          ? existingMatriz.fechaActualizacion.toISOString().split('T')[0]
          : '—',
      },
      summary: {
        procesos: totalProcesos,
        zonas: totalZonas,
        actividades: totalActividades,
        peligros: totalPeligros,
        muyAlto: muyAltoCount,
        alto: altoCount,
        medio: medioCount,
        bajo: bajoCount,
      },
      records,
      pagination: {
        page,
        pageSize,
        total: totalPeligros,
        totalPages,
      },
    })
  } catch (error: any) {
    console.error('API /api/riesgos/[id]/preview error:', error)
    return res.status(500).json({
      error: 'Error al generar la vista previa paginada',
      details: error?.message || String(error),
    })
  }
}
