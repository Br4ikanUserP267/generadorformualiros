import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

function classifyRiskLevel(interpRiesgo: string | null | undefined, nivelRiesgo: number | null | undefined): 'MUY_ALTO' | 'ALTO' | 'MODERADO' | 'BAJO' {
  const interp = (interpRiesgo || '').toUpperCase()
  const nr = Number(nivelRiesgo || 0)

  if (interp.startsWith('I ') || interp === 'I' || (interp.includes('I') && !interp.includes('II') && !interp.includes('IV')) || nr >= 600) {
    return 'MUY_ALTO'
  }
  if (interp.startsWith('II ') || interp === 'II' || (interp.includes('II') && !interp.includes('III')) || (nr >= 150 && nr < 600)) {
    return 'ALTO'
  }
  if (interp.startsWith('III ') || interp === 'III' || interp.includes('III') || interp.includes('MEJORABLE') || interp.includes('MODERADO') || (nr >= 40 && nr < 150)) {
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

    // 1. Fetch all active catalog hazards with their matrix occurrences and action plans
    const catalogHazards = await prisma.peligroCatalogo.findMany({
      where: { deletedAt: null },
      include: {
        planesAccion: {
          where: { deletedAt: null },
          select: { id: true, estado: true },
        },
        peligrosMatriz: {
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
          select: {
            id: true,
            evaluacion: {
              select: {
                nivelRiesgo: true,
                interpRiesgo: true,
              },
            },
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
                            area: true,
                            responsable: true,
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
      orderBy: [
        { nivelRiesgo: 'desc' },
        { clasificacion: 'asc' },
        { codigo: 'asc' },
      ],
    })

    // 2. Fetch all active matrices to build area overview
    const activeMatrices = await prisma.matriz.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        area: true,
        responsable: true,
        fechaActualizacion: true,
      },
      orderBy: { area: 'asc' },
    })

    const totalCatalogDangers = catalogHazards.length

    // Count all active danger occurrences in matrices (regardless of catalog linkage)
    const totalRiesgosRegistrados = await prisma.peligro.count({
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
    })

    const totalRiesgosArea = selectedArea
      ? await prisma.peligro.count({
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
      : totalRiesgosRegistrados

    // Structure for Catalog Unique Dangers stats
    const catalogoUnico = {
      total: totalCatalogDangers,
      muyAlto: 0,
      alto: 0,
      moderado: 0,
      bajo: 0,
    }

    // Structure for Repetitions / Occurrences stats
    const ocurrenciasGlobales = {
      total: 0,
      muyAlto: 0,
      alto: 0,
      moderado: 0,
      bajo: 0,
    }

    // Classification distribution map
    const clasificacionesMap = new Map<string, { uniqueCount: number; occurrencesCount: number; altoCount: number; moderadoCount: number; bajoCount: number; muyAltoCount: number }>()

    // Area distribution map: areaName -> { matrizId, area, responsable, totalOcurrencias, peligrosUnicos: Set, muyAlto, alto, moderado, bajo }
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

    // List of dangers with repetition metrics
    const topPeligrosRepetidos: any[] = []

    // Filtered data when a specific area is selected
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

    for (const h of catalogHazards) {
      const catRisk = classifyRiskLevel(h.interpRiesgo, h.nivelRiesgo)

      if (catRisk === 'MUY_ALTO') catalogoUnico.muyAlto++
      else if (catRisk === 'ALTO') catalogoUnico.alto++
      else if (catRisk === 'MODERADO') catalogoUnico.moderado++
      else catalogoUnico.bajo++

      // Classification aggregation
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

      const matricesSet = new Set<string>()
      const areasSet = new Set<string>()
      let hazardOccurrencesInSelectedArea = 0

      for (const pm of h.peligrosMatriz) {
        const matriz = pm.actividad?.zona?.proceso?.matriz
        if (matriz) {
          matricesSet.add(matriz.id)
          const areaName = matriz.area?.trim() || 'Sin Área'
          areasSet.add(areaName)

          // Evaluate risk level of this specific occurrence (prefer matrix eval, fallback to catalog)
          const occRisk = pm.evaluacion
            ? classifyRiskLevel(pm.evaluacion.interpRiesgo, pm.evaluacion.nivelRiesgo)
            : catRisk

          ocurrenciasGlobales.total++
          if (occRisk === 'MUY_ALTO') ocurrenciasGlobales.muyAlto++
          else if (occRisk === 'ALTO') ocurrenciasGlobales.alto++
          else if (occRisk === 'MODERADO') ocurrenciasGlobales.moderado++
          else ocurrenciasGlobales.bajo++

          clasifItem.occurrencesCount++

          // Accumulate area stats
          let areaData = areasMap.get(areaName)
          if (!areaData) {
            areaData = {
              matrizId: matriz.id,
              area: areaName,
              responsable: matriz.responsable || 'No asignado',
              totalOcurrencias: 0,
              peligrosUnicosSet: new Set(),
              muyAlto: 0,
              alto: 0,
              moderado: 0,
              bajo: 0,
            }
            areasMap.set(areaName, areaData)
          }

          areaData.totalOcurrencias++
          areaData.peligrosUnicosSet.add(h.id)
          if (occRisk === 'MUY_ALTO') areaData.muyAlto++
          else if (occRisk === 'ALTO') areaData.alto++
          else if (occRisk === 'MODERADO') areaData.moderado++
          else areaData.bajo++

          // If selected area matches
          if (selectedArea && areaName.toLowerCase() === selectedArea.toLowerCase()) {
            hazardOccurrencesInSelectedArea++
            areaFilteredStats!.totalOcurrencias++
            if (occRisk === 'MUY_ALTO') areaFilteredStats!.muyAlto++
            else if (occRisk === 'ALTO') areaFilteredStats!.alto++
            else if (occRisk === 'MODERADO') areaFilteredStats!.moderado++
            else areaFilteredStats!.bajo++
          }
        }
      }

      if (selectedArea && hazardOccurrencesInSelectedArea > 0) {
        areaFilteredStats!.totalPeligrosUnicos++
        areaFilteredStats!.peligros.push({
          id: h.id,
          codigo: h.codigo,
          descripcion: h.descripcion,
          clasificacion: h.clasificacion,
          nivelRiesgo: catRisk,
          ocurrenciasEnArea: hazardOccurrencesInSelectedArea,
          planesCount: h.planesAccion.length,
        })
      }

      topPeligrosRepetidos.push({
        id: h.id,
        codigo: h.codigo,
        descripcion: h.descripcion,
        clasificacion: h.clasificacion,
        nivelRiesgo: catRisk,
        interpRiesgo: h.interpRiesgo,
        totalOcurrencias: h.peligrosMatriz.length,
        matricesCount: matricesSet.size,
        areasCount: areasSet.size,
        porcentajeMatrices: activeMatrices.length > 0
          ? Math.round((matricesSet.size / activeMatrices.length) * 100)
          : 0,
        planesCount: h.planesAccion.length,
      })
    }

    // Sort top repeated hazards descending
    topPeligrosRepetidos.sort((a, b) => b.totalOcurrencias - a.totalOcurrencias)

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
