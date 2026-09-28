import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

function classifyRiskLevel(interpNp: string | null | undefined, nivelProbabilidad: number | null | undefined): 'MUY_ALTO' | 'ALTO' | 'MODERADO' | 'BAJO' {
  const interp = (interpNp || '').toUpperCase().trim()
  const np = Number(nivelProbabilidad || 0)

  if (interp.includes('MUY ALTO') || interp === 'MA' || interp === 'EXTREMO' || np >= 24) {
    return 'MUY_ALTO'
  }
  if ((interp.includes('ALTO') && !interp.includes('MUY ALTO')) || interp === 'A' || (np >= 10 && np < 24)) {
    return 'ALTO'
  }
  if (interp.includes('MEDIO') || interp.includes('MODERADO') || interp === 'M' || (np >= 6 && np < 10)) {
    return 'MODERADO'
  }
  return 'BAJO'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    const { area } = req.query
    const selectedArea = area && String(area).trim() !== 'TODAS' ? String(area).trim() : null

    // 1. Concurrently fetch catalog hazards, active matrices, total registered risks count, and aggregated SQL statistics
    const [
      catalogHazards,
      activeMatrices,
      totalRiesgosRegistrados,
      hazardOccurrencesAgg,
      areaOccurrencesAgg
    ] = await Promise.all([
      // Lean catalog query with plan count only
      prisma.peligroCatalogo.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          codigo: true,
          descripcion: true,
          clasificacion: true,
          nivelProbabilidad: true,
          interpProbabilidad: true,
          nivelRiesgo: true,
          interpRiesgo: true,
          _count: {
            select: {
              planesAccion: { where: { deletedAt: null } }
            }
          }
        },
        orderBy: [
          { nivelProbabilidad: 'desc' },
          { clasificacion: 'asc' },
          { codigo: 'asc' },
        ],
      }),

      // Active matrices
      prisma.matriz.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          area: true,
          responsable: true,
          fechaActualizacion: true,
        },
        orderBy: { area: 'asc' },
      }),

      // Total active registered risks count
      selectedArea
        ? prisma.peligro.count({
            where: {
              deletedAt: null,
              actividad: {
                zona: {
                  proceso: {
                    matriz: {
                      deletedAt: null,
                      area: { equals: selectedArea, mode: 'insensitive' },
                    },
                  },
                },
              },
            },
          })
        : prisma.peligro.count({
            where: {
              deletedAt: null,
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
          }),

      // SQL Aggregation: occurrences per catalog hazard (count, distinct matrices, distinct areas)
      (prisma as any).$queryRawUnsafe(`
        SELECT 
          p.catalogo_peligro_id,
          COUNT(p.id)::int AS total_ocurrencias,
          COUNT(DISTINCT pr.matriz_id)::int AS matrices_count,
          COUNT(DISTINCT TRIM(m.area))::int AS areas_count
        FROM peligros p
        JOIN actividades a ON p.actividad_id = a.id AND a.deleted_at IS NULL
        JOIN zonas z ON a.zona_id = z.id AND z.deleted_at IS NULL
        JOIN procesos pr ON z.proceso_id = pr.id AND pr.deleted_at IS NULL
        JOIN matrices m ON pr.matriz_id = m.id AND m.deleted_at IS NULL
        WHERE p.deleted_at IS NULL AND p.catalogo_peligro_id IS NOT NULL
        GROUP BY p.catalogo_peligro_id;
      `),

      // SQL Aggregation: Occurrences with area and risk evaluation
      (prisma as any).$queryRawUnsafe(`
        WITH occ_data AS (
          SELECT 
            m.id AS matriz_id,
            TRIM(COALESCE(m.area, 'Sin Área')) AS area_name,
            COALESCE(m.responsable, 'No asignado') AS responsable,
            p.catalogo_peligro_id,
            COALESCE(
              NULLIF(TRIM(ep.interp_probabilidad), ''), 
              NULLIF(TRIM(e.interp_probabilidad), ''), 
              TRIM(pc.interp_probabilidad), 
              ''
            ) AS interp_probabilidad,
            CASE 
              WHEN ep.nivel_probabilidad IS NOT NULL AND ep.nivel_probabilidad > 0 THEN ep.nivel_probabilidad
              WHEN e.nivel_probabilidad IS NOT NULL AND e.nivel_probabilidad > 0 THEN e.nivel_probabilidad
              ELSE COALESCE(pc.nivel_probabilidad, 0)
            END AS nivel_probabilidad
          FROM peligros p
          JOIN actividades a ON p.actividad_id = a.id AND a.deleted_at IS NULL
          JOIN zonas z ON a.zona_id = z.id AND z.deleted_at IS NULL
          JOIN procesos pr ON z.proceso_id = pr.id AND pr.deleted_at IS NULL
          JOIN matrices m ON pr.matriz_id = m.id AND m.deleted_at IS NULL
          LEFT JOIN evaluaciones e ON e.peligro_id = p.id
          LEFT JOIN evaluaciones_post ep ON ep.peligro_id = p.id
          LEFT JOIN peligros_catalogo pc ON pc.id = p.catalogo_peligro_id
          WHERE p.deleted_at IS NULL
        )
        SELECT 
          matriz_id,
          area_name,
          responsable,
          catalogo_peligro_id,
          interp_probabilidad,
          nivel_probabilidad
        FROM occ_data;
      `)
    ])

    const totalRiesgosArea = totalRiesgosRegistrados

    // Index hazard occurrences aggregation by catalog hazard id
    const occMap = new Map<string, { total_ocurrencias: number; matrices_count: number; areas_count: number }>()
    for (const row of hazardOccurrencesAgg) {
      occMap.set(row.catalogo_peligro_id, row)
    }

    const totalCatalogDangers = catalogHazards.length
    const catalogoUnico = { total: totalCatalogDangers, muyAlto: 0, alto: 0, moderado: 0, bajo: 0 }
    const ocurrenciasGlobales = { total: 0, muyAlto: 0, alto: 0, moderado: 0, bajo: 0 }
    const clasificacionesMap = new Map<string, { uniqueCount: number; occurrencesCount: number; altoCount: number; moderadoCount: number; bajoCount: number; muyAltoCount: number }>()
    const areasMap = new Map<string, {
      matrizId: string
      area: string
      responsable: string
      totalOcurrencias: number
      peligrosUnicosSet: Set<string>
      muyAlto: number
      alto: number
      moderado: number
      bajo: number
    }>()

    // Initialize areas
    activeMatrices.forEach((m: any) => {
      const areaName = m.area?.trim() || 'Sin Área'
      if (!areasMap.has(areaName)) {
        areasMap.set(areaName, {
          matrizId: m.id,
          area: areaName,
          responsable: m.responsable || 'No asignado',
          totalOcurrencias: 0,
          peligrosUnicosSet: new Set(),
          muyAlto: 0,
          alto: 0,
          moderado: 0,
          bajo: 0,
        })
      }
    })

    // Calculate catalog stats and classification unique counts
    for (const h of catalogHazards) {
      const catRisk = classifyRiskLevel(h.interpProbabilidad, h.nivelProbabilidad)
      if (catRisk === 'MUY_ALTO') catalogoUnico.muyAlto++
      else if (catRisk === 'ALTO') catalogoUnico.alto++
      else if (catRisk === 'MODERADO') catalogoUnico.moderado++
      else catalogoUnico.bajo++

      const clasifName = (h.clasificacion || 'OTRO').toUpperCase().trim()
      if (!clasificacionesMap.has(clasifName)) {
        clasificacionesMap.set(clasifName, {
          uniqueCount: 0,
          occurrencesCount: 0,
          muyAltoCount: 0,
          altoCount: 0,
          moderadoCount: 0,
          bajoCount: 0,
        })
      }
      const clasifItem = clasificacionesMap.get(clasifName)!
      clasifItem.uniqueCount++
      if (catRisk === 'MUY_ALTO') clasifItem.muyAltoCount++
      else if (catRisk === 'ALTO') clasifItem.altoCount++
      else if (catRisk === 'MODERADO') clasifItem.moderadoCount++
      else clasifItem.bajoCount++
    }

    // Catalog hazard to classification lookup
    const catClasifMap = new Map<string, string>()
    for (const h of catalogHazards) {
      catClasifMap.set(h.id, (h.clasificacion || 'OTRO').toUpperCase().trim())
    }

    // Area filtered stats if selectedArea
    const areaFilteredStats = selectedArea
      ? {
          area: selectedArea,
          totalPeligrosUnicos: 0,
          totalOcurrencias: 0,
          muyAlto: 0,
          alto: 0,
          moderado: 0,
          bajo: 0,
          peligros: [] as any[],
        }
      : null

    const areaHazardCounts = selectedArea ? new Map<string, number>() : null

    // Process aggregated occurrences
    for (const occ of areaOccurrencesAgg) {
      const occRisk = classifyRiskLevel(occ.interp_probabilidad, occ.nivel_probabilidad)

      ocurrenciasGlobales.total++
      if (occRisk === 'MUY_ALTO') ocurrenciasGlobales.muyAlto++
      else if (occRisk === 'ALTO') ocurrenciasGlobales.alto++
      else if (occRisk === 'MODERADO') ocurrenciasGlobales.moderado++
      else ocurrenciasGlobales.bajo++

      const clasifName = catClasifMap.get(occ.catalogo_peligro_id) || 'OTRO'
      const clasifItem = clasificacionesMap.get(clasifName)
      if (clasifItem) {
        clasifItem.occurrencesCount++
      }

      let areaData = areasMap.get(occ.area_name)
      if (!areaData) {
        areaData = {
          matrizId: occ.matriz_id,
          area: occ.area_name,
          responsable: occ.responsable,
          totalOcurrencias: 0,
          peligrosUnicosSet: new Set(),
          muyAlto: 0,
          alto: 0,
          moderado: 0,
          bajo: 0,
        }
        areasMap.set(occ.area_name, areaData)
      }

      areaData.totalOcurrencias++
      areaData.peligrosUnicosSet.add(occ.catalogo_peligro_id)
      if (occRisk === 'MUY_ALTO') areaData.muyAlto++
      else if (occRisk === 'ALTO') areaData.alto++
      else if (occRisk === 'MODERADO') areaData.moderado++
      else areaData.bajo++

      if (selectedArea && occ.area_name.toLowerCase() === selectedArea.toLowerCase()) {
        areaFilteredStats!.totalOcurrencias++
        if (occRisk === 'MUY_ALTO') areaFilteredStats!.muyAlto++
        else if (occRisk === 'ALTO') areaFilteredStats!.alto++
        else if (occRisk === 'MODERADO') areaFilteredStats!.moderado++
        else areaFilteredStats!.bajo++

        const currentCount = areaHazardCounts!.get(occ.catalogo_peligro_id) || 0
        areaHazardCounts!.set(occ.catalogo_peligro_id, currentCount + 1)
      }
    }

    if (selectedArea) {
      areaFilteredStats!.totalPeligrosUnicos = areaHazardCounts!.size
      for (const h of catalogHazards) {
        const occCount = areaHazardCounts!.get(h.id)
        if (occCount && occCount > 0) {
          areaFilteredStats!.peligros.push({
            id: h.id,
            codigo: h.codigo,
            descripcion: h.descripcion,
            clasificacion: h.clasificacion,
            nivelRiesgo: classifyRiskLevel(h.interpProbabilidad, h.nivelProbabilidad),
            ocurrenciasEnArea: occCount,
            planesCount: h._count.planesAccion,
          })
        }
      }
    }

    // Build topPeligrosRepetidos
    const topPeligrosRepetidos = catalogHazards.map((h: any) => {
      const agg = occMap.get(h.id) || { total_ocurrencias: 0, matrices_count: 0, areas_count: 0 }
      return {
        id: h.id,
        codigo: h.codigo,
        descripcion: h.descripcion,
        clasificacion: h.clasificacion,
        nivelRiesgo: classifyRiskLevel(h.interpProbabilidad, h.nivelProbabilidad),
        interpRiesgo: h.interpRiesgo,
        totalOcurrencias: agg.total_ocurrencias,
        matricesCount: agg.matrices_count,
        areasCount: agg.areas_count,
        porcentajeMatrices: activeMatrices.length > 0 ? Math.round((agg.matrices_count / activeMatrices.length) * 100) : 0,
        planesCount: h._count.planesAccion,
      }
    })

    // Sort top repeated hazards descending
    topPeligrosRepetidos.sort((a: any, b: any) => b.totalOcurrencias - a.totalOcurrencias)

    // Sort areas by total occurrences descending
    const areasRanking = Array.from(areasMap.values())
      .map((a) => ({
        matrizId: a.matrizId,
        area: a.area,
        responsable: a.responsable,
        totalOcurrencias: a.totalOcurrencias,
        peligrosUnicosCount: a.peligrosUnicosSet.size,
        muyAlto: a.muyAlto,
        alto: a.alto,
        moderado: a.moderado,
        bajo: a.bajo,
        porcentajeDelTotal: ocurrenciasGlobales.total > 0
          ? Math.round((a.totalOcurrencias / ocurrenciasGlobales.total) * 100)
          : 0,
      }))
      .sort((a, b) => b.totalOcurrencias - a.totalOcurrencias)

    // Convert classifications map to array sorted by occurrences
    const clasificacionesList = Array.from(clasificacionesMap.entries())
      .map(([nombre, data]) => ({
        nombre,
        uniqueCount: data.uniqueCount,
        occurrencesCount: data.occurrencesCount,
        muyAltoCount: data.muyAltoCount,
        altoCount: data.altoCount,
        moderadoCount: data.moderadoCount,
        bajoCount: data.bajoCount,
        porcentajeOcurrencias: ocurrenciasGlobales.total > 0
          ? Math.round((data.occurrencesCount / ocurrenciasGlobales.total) * 100)
          : 0,
      }))
      .sort((a, b) => b.occurrencesCount - a.occurrencesCount)

    const promedioRepeticion = totalCatalogDangers > 0
      ? Number((ocurrenciasGlobales.total / totalCatalogDangers).toFixed(1))
      : 0

    return res.status(200).json({
      success: true,
      totalMatrices: activeMatrices.length,
      totalRiesgosRegistrados: selectedArea ? totalRiesgosArea : totalRiesgosRegistrados,
      catalogoUnico: {
        ...catalogoUnico,
        porcentajes: {
          muyAlto: totalCatalogDangers > 0 ? Math.round((catalogoUnico.muyAlto / totalCatalogDangers) * 100) : 0,
          alto: totalCatalogDangers > 0 ? Math.round((catalogoUnico.alto / totalCatalogDangers) * 100) : 0,
          moderado: totalCatalogDangers > 0 ? Math.round((catalogoUnico.moderado / totalCatalogDangers) * 100) : 0,
          bajo: totalCatalogDangers > 0 ? Math.round((catalogoUnico.bajo / totalCatalogDangers) * 100) : 0,
        },
      },
      ocurrenciasGlobales: {
        ...ocurrenciasGlobales,
        promedioRepeticion,
        porcentajes: {
          muyAlto: ocurrenciasGlobales.total > 0 ? Math.round((ocurrenciasGlobales.muyAlto / ocurrenciasGlobales.total) * 100) : 0,
          alto: ocurrenciasGlobales.total > 0 ? Math.round((ocurrenciasGlobales.alto / ocurrenciasGlobales.total) * 100) : 0,
          moderado: ocurrenciasGlobales.total > 0 ? Math.round((ocurrenciasGlobales.moderado / ocurrenciasGlobales.total) * 100) : 0,
          bajo: ocurrenciasGlobales.total > 0 ? Math.round((ocurrenciasGlobales.bajo / ocurrenciasGlobales.total) * 100) : 0,
        },
      },
      topPeligrosRepetidos,
      clasificaciones: clasificacionesList,
      areasRanking,
      areaFilteredStats,
    })
  } catch (error: any) {
    console.error('Error GET /api/dashboard/stats:', error)
    return res.status(500).json({
      error: 'Error al calcular las estadísticas del dashboard',
      details: error?.message || String(error),
    })
  }
}
