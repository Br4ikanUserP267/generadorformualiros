import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

function parseNumberParam(value: unknown, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.floor(n)
}

function parseStringParam(value: unknown): string {
  const raw = String(Array.isArray(value) ? value[0] : value || '').trim()
  return raw
}

function buildPriorizacionWhere({
  search,
  area,
  proceso,
  interpProbabilidad,
  postEvaluatedOnly,
}: {
  search?: string
  area?: string
  proceso?: string
  interpProbabilidad?: string
  postEvaluatedOnly?: boolean
}) {
  const conditions: any[] = [
    {
      actividad: {
        zona: {
          proceso: {
            matriz: {
              deletedAt: null,
            },
          },
        },
      },
    },
  ]

  // Initial evaluation: either a specific level or all prioritized levels (Medio, Alto, Muy Alto)
  if (interpProbabilidad) {
    conditions.push({
      evaluacion: {
        interpProbabilidad,
      },
    })
  } else {
    conditions.push({
      evaluacion: {
        interpProbabilidad: {
          in: ['Medio', 'Alto', 'Muy Alto'],
        },
      },
    })
  }

  // Post evaluation filter
  if (postEvaluatedOnly) {
    conditions.push({
      NOT: {
        evaluacionPost: null,
      },
    })
  } else {
    conditions.push({
      OR: [
        { evaluacionPost: null },
        {
          evaluacionPost: {
            interpProbabilidad: {
              not: 'Bajo',
            },
          },
        },
      ],
    })
  }

  // Search filter
  if (search) {
    conditions.push({
      OR: [
        { descripcion: { contains: search, mode: 'insensitive' } },
        { clasificacion: { contains: search, mode: 'insensitive' } },
        { actividad: { nombre: { contains: search, mode: 'insensitive' } } },
        { actividad: { zona: { nombre: { contains: search, mode: 'insensitive' } } } },
        { actividad: { zona: { proceso: { nombre: { contains: search, mode: 'insensitive' } } } } },
        { actividad: { zona: { proceso: { matriz: { area: { contains: search, mode: 'insensitive' } } } } } },
      ],
    })
  }

  // Area filter
  if (area && area !== 'all') {
    conditions.push({
      actividad: {
        zona: {
          proceso: {
            matriz: {
              area: { equals: area, mode: 'insensitive' },
            },
          },
        },
      },
    })
  }

  // Proceso filter
  if (proceso && proceso !== 'all') {
    conditions.push({
      actividad: {
        zona: {
          proceso: {
            nombre: { equals: proceso, mode: 'insensitive' },
          },
        },
      },
    })
  }

  return { AND: conditions }
}

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
    const page = parseNumberParam(req.query.page, 1)
    const pageSize = Math.min(parseNumberParam(req.query.pageSize, 10), 100)
    const search = parseStringParam(req.query.search)
    const area = parseStringParam(req.query.area)
    const proceso = parseStringParam(req.query.proceso)

    const mainWhere = buildPriorizacionWhere({ search, area, proceso })
    const muyAltoWhere = buildPriorizacionWhere({ search, area, proceso, interpProbabilidad: 'Muy Alto' })
    const altoWhere = buildPriorizacionWhere({ search, area, proceso, interpProbabilidad: 'Alto' })
    const medioWhere = buildPriorizacionWhere({ search, area, proceso, interpProbabilidad: 'Medio' })
    const conPostWhere = buildPriorizacionWhere({ search, area, proceso, postEvaluatedOnly: true })

    // Execute queries in parallel using pure Prisma methods
    const [
      totalFiltered,
      dangers,
      muyAltoCount,
      altoCount,
      medioCount,
      conPostCount,
      matricesAreas,
      procesosList,
    ] = await Promise.all([
      prisma.peligro.count({ where: mainWhere }),
      prisma.peligro.findMany({
        where: mainWhere,
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
              cargo: true,
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
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          {
            evaluacion: {
              nivelProbabilidad: 'desc',
            },
          },
          { id: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.peligro.count({ where: muyAltoWhere }),
      prisma.peligro.count({ where: altoWhere }),
      prisma.peligro.count({ where: medioWhere }),
      prisma.peligro.count({ where: conPostWhere }),
      prisma.matriz.findMany({
        where: {
          deletedAt: null,
          area: { not: null },
        },
        select: { area: true },
        distinct: ['area'],
        orderBy: { area: 'asc' },
      }),
      prisma.proceso.findMany({
        where: {
          deletedAt: null,
          nombre: { not: '' },
          matriz: { deletedAt: null },
        },
        select: { nombre: true },
        distinct: ['nombre'],
        orderBy: { nombre: 'asc' },
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize))

    const mapped = (dangers as any[]).map((d: any) => ({
      id: d.id,
      descripcion: d.descripcion || '',
      clasificacion: d.clasificacion || '',
      area: d.actividad?.zona?.proceso?.matriz?.area || 'Sin área',
      matrizId: d.actividad?.zona?.proceso?.matriz?.id || '',
      proceso: d.actividad?.zona?.proceso?.nombre || 'General',
      zona: d.actividad?.zona?.nombre || '',
      cargo: d.actividad?.cargo || '',
      actividad: d.actividad?.nombre || 'Actividad',
      evaluacion: {
        nd: d.evaluacion?.nivelDeficiencia ?? null,
        ne: d.evaluacion?.nivelExposicion ?? null,
        nc: d.evaluacion?.nivelConsecuencia ?? null,
        np: d.evaluacion?.nivelProbabilidad ?? null,
        nr: d.evaluacion?.nivelRiesgo ?? null,
        interp_np: d.evaluacion?.interpProbabilidad || '',
        interp_nr: d.evaluacion?.interpRiesgo || '',
        aceptabilidad: d.evaluacion?.aceptabilidad || '',
      },
      evaluacionPost: d.evaluacionPost
        ? {
            nd: d.evaluacionPost.nivelDeficiencia ?? null,
            ne: d.evaluacionPost.nivelExposicion ?? null,
            nc: d.evaluacionPost.nivelConsecuencia ?? null,
            np: d.evaluacionPost.nivelProbabilidad ?? null,
            nr: d.evaluacionPost.nivelRiesgo ?? null,
            interp_np: d.evaluacionPost.interpProbabilidad || '',
            interp_nr: d.evaluacionPost.interpRiesgo || '',
            aceptabilidad: d.evaluacionPost.aceptabilidad || '',
          }
        : null,
      intervencion: {
        eliminacion: d.intervencion?.eliminacion || '',
        sustitucion: d.intervencion?.sustitucion || '',
        controles_ingenieria: d.intervencion?.controlesIngenieria || '',
        controles_administrativos: d.intervencion?.controlesAdministrativos || '',
        epp: d.intervencion?.epp || '',
        responsable: d.intervencion?.responsable || '',
        fecha_ejecucion: d.intervencion?.fechaEjecucion
          ? d.intervencion.fechaEjecucion.toISOString().split('T')[0]
          : '',
      },
    }))

    return res.status(200).json({
      items: mapped,
      pagination: {
        page,
        pageSize,
        total: totalFiltered,
        totalPages,
      },
      stats: {
        total: totalFiltered,
        muyAlto: muyAltoCount,
        alto: altoCount,
        medio: medioCount,
        conEvaluacionPost: conPostCount,
      },
      filterOptions: {
        areas: (matricesAreas as Array<{ area: string | null }>)
          .map((m: { area: string | null }) => m.area?.trim())
          .filter((a: string | undefined | null): a is string => Boolean(a && a.length > 0)),
        procesos: (procesosList as Array<{ nombre: string | null }>)
          .map((p: { nombre: string | null }) => p.nombre?.trim())
          .filter((p: string | undefined | null): p is string => Boolean(p && p.length > 0)),
      },
    })
  } catch (error: any) {
    console.error('Priorizacion risks error:', error?.message || error)
    return res.status(500).json({ error: 'Error cargando riesgos prioritarios', details: error?.message || String(error) })
  }
}
