import type { NextApiRequest, NextApiResponse } from 'next'
import { Prisma } from '@prisma/client'
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

type SummaryTotals = {
  totalMatrices: number
  totalProcesos: number
  totalZonas: number
  totalActividades: number
  totalPeligros: number
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

function parseDate(value: unknown) {
  const text = String(Array.isArray(value) ? value[0] : value || '').trim()
  if (!text) return undefined
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

function classifyRiskLevelForCounts(evalObj: any): 0 | 1 | 2 | 3 {
  if (!evalObj) return 3 // Bajo

  // 1. Prioritize Interpretación (NP) / Nivel de Probabilidad
  const interpNp = String(evalObj.interpProbabilidad || evalObj.interp_np || '').toUpperCase().trim()
  if (interpNp.includes('MUY ALTO') || interpNp === 'MA' || interpNp === 'EXTREMO') return 0
  if (interpNp.includes('ALTO') || interpNp === 'A') return 1
  if (interpNp.includes('MEDIO') || interpNp.includes('MODERADO') || interpNp === 'M') return 2
  if (interpNp.includes('BAJO') || interpNp === 'B') return 3

  // 2. Numeric NP (Nivel de Probabilidad)
  const np = Number(evalObj.nivelProbabilidad ?? evalObj.np ?? 0)
  if (np >= 24) return 0
  if (np >= 10) return 1
  if (np >= 6) return 2
  if (np > 0) return 3

  return 3 // Default to Bajo
}

function getEffectiveEvaluation(peligro: any) {
  const post = peligro?.evaluacionPost
  const isPostActive = Boolean(
    post && (
      (post.interpProbabilidad && String(post.interpProbabilidad).trim() !== '') ||
      (post.interp_np && String(post.interp_np).trim() !== '') ||
      (post.nivelProbabilidad !== null && post.nivelProbabilidad !== undefined && Number(post.nivelProbabilidad) > 0) ||
      (post.np !== null && post.np !== undefined && Number(post.np) > 0) ||
      (post.nivelRiesgo !== null && post.nivelRiesgo !== undefined && Number(post.nivelRiesgo) > 0) ||
      (post.nr !== null && post.nr !== undefined && Number(post.nr) > 0) ||
      (post.aceptabilidad && String(post.aceptabilidad).trim() !== '')
    )
  )
  return isPostActive ? post : peligro?.evaluacion
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
          const evalActual = getEffectiveEvaluation(peligro)
          const lvlIdx = classifyRiskLevelForCounts(evalActual)
          counts[lvlIdx] += 1
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

function computeTotalsFromMatrices(matrices: any[]): SummaryTotals {
  let totalProcesos = 0
  let totalZonas = 0
  let totalActividades = 0
  let totalPeligros = 0
  const counts: [number, number, number, number] = [0, 0, 0, 0]

  for (const matrix of matrices || []) {
    totalProcesos += (matrix.procesos || []).length
    const computed = computeCountsFromSummary(matrix)
    totalZonas += computed.totalZonas
    totalActividades += computed.totalActividades
    totalPeligros += computed.totalPeligros
    counts[0] += computed.counts[0]
    counts[1] += computed.counts[1]
    counts[2] += computed.counts[2]
    counts[3] += computed.counts[3]
  }

  return {
    totalMatrices: matrices.length,
    totalProcesos,
    totalZonas,
    totalActividades,
    totalPeligros,
    counts,
  }
}

import { getAuthUser } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const page = parsePage(req.query.page)
    const pageSize = parsePageSize(req.query.pageSize)
    const skip = (page - 1) * pageSize
    const search = String(Array.isArray(req.query.search) ? req.query.search[0] : req.query.search || '').trim()
    const tipo = String(Array.isArray(req.query.tipo) ? req.query.tipo[0] : req.query.tipo || '').trim()
    const clasificacion = String(Array.isArray(req.query.clasificacion) ? req.query.clasificacion[0] : req.query.clasificacion || '').trim()
    const dateDesde = parseDate(req.query.dateDesde)
    const dateHasta = parseDate(req.query.dateHasta)

    const isUserAdmin = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
    const baseConditions: Prisma.MatrizWhereInput[] = [
      { deletedAt: null }
    ]

    if (tipo) {
      baseConditions.push({
        procesos: { some: { nombre: { equals: tipo, mode: 'insensitive' } } },
      })
    }

    if (clasificacion) {
      baseConditions.push({
        procesos: {
          some: {
            zonas: {
              some: {
                actividades: {
                  some: {
                    peligros: {
                      some: {
                        clasificacion: { equals: clasificacion, mode: 'insensitive' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    }

    if (dateDesde || dateHasta) {
      baseConditions.push({
        fechaElaboracion: {
          ...(dateDesde ? { gte: dateDesde } : {}),
          ...(dateHasta ? { lte: dateHasta } : {}),
        },
      })
    }

    const searchConditions: Prisma.MatrizWhereInput[] = []
    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean)
      for (const term of searchTerms) {
        searchConditions.push({
          OR: [
            { area: { contains: term, mode: 'insensitive' } },
            { responsable: { contains: term, mode: 'insensitive' } },
            { procesos: { some: { nombre: { contains: term, mode: 'insensitive' } } } },
            { procesos: { some: { zonas: { some: { nombre: { contains: term, mode: 'insensitive' } } } } } },
          ],
        })
      }
    }

    const whereBase: Prisma.MatrizWhereInput = baseConditions.length > 1 ? { AND: baseConditions } : { deletedAt: null }
    
    const queryConditions = [...baseConditions, ...searchConditions]
    const where: Prisma.MatrizWhereInput = queryConditions.length > 1 ? { AND: queryConditions } : { deletedAt: null }

    const fetchTotalsPromise: Promise<SummaryTotals | null> = search
      ? Promise.resolve(null)
      : (async () => {
          const hasCustomFilters = Boolean(tipo || clasificacion || dateDesde || dateHasta)
          if (!hasCustomFilters) {
            try {
              const [countsResult, matrixCounts] = await Promise.all([
                (prisma as any).$queryRawUnsafe(`
                  WITH active_data AS (
                    SELECT 
                      p.id,
                      COALESCE(NULLIF(TRIM(ep.interp_probabilidad), ''), NULLIF(TRIM(e.interp_probabilidad), ''), '') as interp_np,
                      CASE 
                        WHEN ep.nivel_probabilidad IS NOT NULL AND ep.nivel_probabilidad > 0 THEN ep.nivel_probabilidad
                        WHEN e.nivel_probabilidad IS NOT NULL AND e.nivel_probabilidad > 0 THEN e.nivel_probabilidad
                        ELSE 0
                      END as np
                    FROM peligros p
                    JOIN actividades a ON p.actividad_id = a.id AND a.deleted_at IS NULL
                    JOIN zonas z ON a.zona_id = z.id AND z.deleted_at IS NULL
                    JOIN procesos pr ON z.proceso_id = pr.id AND pr.deleted_at IS NULL
                    JOIN matrices m ON pr.matriz_id = m.id AND m.deleted_at IS NULL
                    LEFT JOIN evaluaciones e ON e.peligro_id = p.id
                    LEFT JOIN evaluaciones_post ep ON ep.peligro_id = p.id
                    WHERE p.deleted_at IS NULL
                  )
                  SELECT 
                    COUNT(*)::int AS total_peligros,
                    COUNT(*) FILTER (
                      WHERE np >= 24 OR UPPER(interp_np) LIKE '%MUY ALTO%' OR UPPER(interp_np) = 'MA' OR UPPER(interp_np) = 'EXTREMO'
                    )::int AS ma_count,
                    COUNT(*) FILTER (
                      WHERE (np >= 10 AND np < 24) OR (UPPER(interp_np) LIKE '%ALTO%' AND UPPER(interp_np) NOT LIKE '%MUY ALTO%') OR UPPER(interp_np) = 'A'
                    )::int AS al_count,
                    COUNT(*) FILTER (
                      WHERE (np >= 6 AND np < 10) OR UPPER(interp_np) LIKE '%MEDIO%' OR UPPER(interp_np) LIKE '%MODERADO%' OR UPPER(interp_np) = 'M'
                    )::int AS me_count
                  FROM active_data;
                `) as Promise<Array<{
                  total_peligros: number
                  ma_count: number
                  al_count: number
                  me_count: number
                }>>,
                (prisma as any).$queryRawUnsafe(`
                  SELECT 
                    (SELECT COUNT(*)::int FROM matrices WHERE deleted_at IS NULL) as total_matrices,
                    (SELECT COUNT(*)::int FROM procesos p JOIN matrices m ON p.matriz_id = m.id WHERE p.deleted_at IS NULL AND m.deleted_at IS NULL) as total_procesos,
                    (SELECT COUNT(*)::int FROM zonas z JOIN procesos p ON z.proceso_id = p.id JOIN matrices m ON p.matriz_id = m.id WHERE z.deleted_at IS NULL AND p.deleted_at IS NULL AND m.deleted_at IS NULL) as total_zonas,
                    (SELECT COUNT(*)::int FROM actividades a JOIN zonas z ON a.zona_id = z.id JOIN procesos p ON z.proceso_id = p.id JOIN matrices m ON p.matriz_id = m.id WHERE a.deleted_at IS NULL AND z.deleted_at IS NULL AND p.deleted_at IS NULL AND m.deleted_at IS NULL) as total_actividades;
                `) as Promise<Array<{
                  total_matrices: number
                  total_procesos: number
                  total_zonas: number
                  total_actividades: number
                }>>
              ])

              const cr = countsResult[0] || { total_peligros: 0, ma_count: 0, al_count: 0, me_count: 0 }
              const mc = matrixCounts[0] || { total_matrices: 0, total_procesos: 0, total_zonas: 0, total_actividades: 0 }
              const baCount = cr.total_peligros - cr.ma_count - cr.al_count - cr.me_count

              return {
                totalMatrices: mc.total_matrices,
                totalProcesos: mc.total_procesos,
                totalZonas: mc.total_zonas,
                totalActividades: mc.total_actividades,
                totalPeligros: cr.total_peligros,
                counts: [cr.ma_count, cr.al_count, cr.me_count, baCount]
              }
            } catch (err) {
              console.warn('Fallback to Prisma for summary totals:', err)
            }
          }

          const fallbackTotalsSource = await (prisma.matriz.findMany as any)({
            where: whereBase,
            select: {
              procesos: {
                where: { deletedAt: null },
                select: {
                  zonas: {
                    where: { deletedAt: null },
                    select: {
                      actividades: {
                        where: { deletedAt: null },
                        select: {
                          peligros: {
                            where: { deletedAt: null },
                            select: {
                              evaluacion: {
                                select: {
                                  nivelRiesgo: true,
                                  nivelProbabilidad: true,
                                  interpProbabilidad: true,
                                  interpRiesgo: true,
                                },
                              },
                              evaluacionPost: {
                                select: {
                                  nivelRiesgo: true,
                                  nivelProbabilidad: true,
                                  interpProbabilidad: true,
                                  interpRiesgo: true,
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
          })
          return computeTotalsFromMatrices(fallbackTotalsSource)
        })()

    const [total, matrices, totals] = await Promise.all([
      prisma.matriz.count({ where }),
      (prisma.matriz.findMany as any)({
        where,
        select: {
          id: true,
          area: true,
          responsable: true,
          fechaElaboracion: true,
          fechaActualizacion: true,
          _count: { select: { procesos: true } },
          procesos: {
            where: { deletedAt: null },
            select: {
              nombre: true,
              zonas: {
                where: { deletedAt: null },
                select: {
                  nombre: true,
                  actividades: {
                    where: { deletedAt: null },
                    select: {
                      _count: { select: { peligros: true } },
                      peligros: {
                        where: { deletedAt: null },
                        select: {
                          clasificacion: true,
                          evaluacion: {
                            select: {
                              nivelRiesgo: true,
                              nivelProbabilidad: true,
                              interpProbabilidad: true,
                              interpRiesgo: true,
                              aceptabilidad: true,
                            },
                          },
                          evaluacionPost: {
                            select: {
                              nivelRiesgo: true,
                              nivelProbabilidad: true,
                              interpProbabilidad: true,
                              interpRiesgo: true,
                              aceptabilidad: true,
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
        } as any,
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip,
      }),
      fetchTotalsPromise,
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
        clasificaciones: Array.from(new Set((matrix.procesos || []).flatMap((p: any) => (p.zonas || []).flatMap((z: any) => (z.actividades || []).flatMap((a: any) => (a.peligros || []).map((pel: any) => pel.clasificacion).filter(Boolean)))))) as string[],
        counts: computed.counts,
      }
    })

    return res.status(200).json({
      page: safePage,
      pageSize,
      total,
      totalPages,
      totals,
      items,
    })
  } catch (error) {
    console.error('Summary riesgos error:', error)
    return res.status(500).json({ error: 'Error cargando el resumen de matrices' })
  }
}
