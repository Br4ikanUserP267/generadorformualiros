import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

type SummaryMatrixRow = {
  id: string
  area: string
  responsable: string
  fechaElaboracion: string
  fechaActualizacion: string
  procesosCount: number
  totalZonas: number
  totalActividades: number
  totalPeligros: number
  tipos: string[]
  counts: [number, number, number, number]
}

function parsePage(value: unknown) {
  const page = Number(Array.isArray(value) ? value[0] : value)
  if (!Number.isFinite(page) || page < 1) return 1
  return Math.floor(page)
}

function parsePageSize(value: unknown) {
  const size = Number(Array.isArray(value) ? value[0] : value)
  if (!Number.isFinite(size) || size < 1) return DEFAULT_PAGE_SIZE
  return Math.min(Math.floor(size), MAX_PAGE_SIZE)
}

function buildTextFilter(value: unknown) {
  const text = String(Array.isArray(value) ? value[0] : value || '').trim()
  if (!text) return undefined
  return {
    contains: text,
    mode: 'insensitive' as const,
  }
}

function computeCountsFromSummary(summary: any) {
  const tipos = new Set<string>()
  let totalZonas = 0
  let totalActividades = 0
  let totalPeligros = 0
  const counts: [number, number, number, number] = [0, 0, 0, 0]

  for (const proceso of summary.procesos || []) {
    if (proceso?.nombre) tipos.add(proceso.nombre)
    for (const zona of proceso?.zonas || []) {
      totalZonas += 1
      for (const actividad of zona?.actividades || []) {
        totalActividades += 1
        const peligros = actividad?.peligros || []
        totalPeligros += peligros.length
        for (const peligro of peligros) {
          const nr = Number(peligro?.evaluacion?.nivelRiesgo || 0)
          if (!nr || nr === 0) counts[3] += 1
          else if (nr >= 4000) counts[0] += 1
          else if (nr >= 501) counts[0] += 1
          else if (nr >= 121) counts[1] += 1
          else if (nr >= 40) counts[2] += 1
          else counts[3] += 1
        }
      }
    }
  }

  return {
    tipos: Array.from(tipos),
    totalZonas,
    totalActividades,
    totalPeligros,
    counts,
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const page = parsePage(req.query.page)
    const pageSize = parsePageSize(req.query.pageSize)
    const skip = (page - 1) * pageSize
    const area = buildTextFilter(req.query.area)
    const responsable = buildTextFilter(req.query.responsable)

    const where = {
      deletedAt: null as null,
      ...(area ? { area } : {}),
      ...(responsable ? { responsable } : {}),
    }

    const [total, matrices] = await Promise.all([
      prisma.matriz.count({ where }),
      prisma.matriz.findMany({
        where,
        select: {
          id: true,
          area: true,
          responsable: true,
          fechaElaboracion: true,
          fechaActualizacion: true,
          _count: { select: { procesos: true } },
          procesos: {
            select: {
              nombre: true,
              zonas: {
                select: {
                  actividades: {
                    select: {
                      _count: { select: { peligros: true } },
                      peligros: {
                        select: {
                          clasificacion: true,
                          evaluacion: {
                            select: {
                              nivelRiesgo: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip,
      }),
    ])

    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = Math.min(page, totalPages)

    const items: SummaryMatrixRow[] = matrices.map((matrix: any) => {
      const computed = computeCountsFromSummary(matrix)
      return {
        id: matrix.id,
        area: matrix.area || '',
        responsable: matrix.responsable || '',
        fechaElaboracion: matrix.fechaElaboracion ? matrix.fechaElaboracion.toISOString().split('T')[0] : '',
        fechaActualizacion: matrix.fechaActualizacion ? matrix.fechaActualizacion.toISOString().split('T')[0] : '',
        procesosCount: matrix._count?.procesos || 0,
        totalZonas: computed.totalZonas,
        totalActividades: computed.totalActividades,
        totalPeligros: computed.totalPeligros,
        tipos: computed.tipos,
        counts: computed.counts,
      }
    })

    return res.status(200).json({
      page: safePage,
      pageSize,
      total,
      totalPages,
      items,
    })
  } catch (error) {
    console.error('Summary riesgos error:', error)
    return res.status(500).json({ error: 'Error cargando el resumen de matrices' })
  }
}
