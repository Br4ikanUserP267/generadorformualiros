import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const { method } = req

  if (method === 'GET') {
    try {
      const { q, clasificacion, nivelRiesgo, estadoPlan, area } = req.query

      const where: any = {
        deletedAt: null,
        NOT: {
          OR: [
            { interpRiesgo: { contains: 'IV', mode: 'insensitive' } },
            { interpRiesgo: { contains: 'Aceptable', mode: 'insensitive' } },
            { nivelRiesgo: { lt: 40 } },
          ],
        },
      }

      if (clasificacion && String(clasificacion) !== 'TODOS') {
        where.clasificacion = {
          equals: String(clasificacion),
          mode: 'insensitive',
        }
      }

      if (q && String(q).trim()) {
        const queryStr = String(q).trim()
        where.OR = [
          { descripcion: { contains: queryStr, mode: 'insensitive' } },
          { codigo: { contains: queryStr, mode: 'insensitive' } },
          { clasificacion: { contains: queryStr, mode: 'insensitive' } },
          { eliminacion: { contains: queryStr, mode: 'insensitive' } },
          { sustitucion: { contains: queryStr, mode: 'insensitive' } },
          { controlesIngenieria: { contains: queryStr, mode: 'insensitive' } },
          { controlesAdministrativos: { contains: queryStr, mode: 'insensitive' } },
          { epp: { contains: queryStr, mode: 'insensitive' } },
        ]
      }

      // Fetch all catalog hazards with their action plans and matrix links
      const catalogDangers = await prisma.peligroCatalogo.findMany({
        where,
        include: {
          planesAccion: {
            where: { deletedAt: null },
            orderBy: { orden: 'asc' },
          },
          peligrosMatriz: {
            where: { deletedAt: null },
            select: {
              id: true,
              actividad: {
                select: {
                  nombre: true,
                  zona: {
                    select: {
                      nombre: true,
                      proceso: {
                        select: {
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
          },
        },
        orderBy: [
          { nivelRiesgo: 'desc' },
          { clasificacion: 'asc' },
          { codigo: 'asc' },
        ],
      })

      // Map each danger and collect matrix presence
      let mapped = catalogDangers.map((p: any) => {
        const areasSet = new Set<string>()
        const matricesSet = new Set<string>()
        let totalOccurrences = 0

        p.peligrosMatriz.forEach((pm: any) => {
          totalOccurrences++
          const matriz = pm.actividad?.zona?.proceso?.matriz
          if (matriz) {
            matricesSet.add(matriz.id)
            if (matriz.area?.trim()) {
              areasSet.add(matriz.area.trim())
            }
          }
        })

        const activePlans = p.planesAccion || []
        const planCount = activePlans.length

        // Derive general action plan status for this danger
        let status = 'SIN_PLAN'
        if (planCount > 0) {
          const allCompleted = activePlans.every((a: any) => a.estado === 'EJECUTADO' || a.estado === 'COMPLETADO')
          const anyInProgress = activePlans.some((a: any) => a.estado === 'EN_PROCESO')
          const anyPending = activePlans.some((a: any) => a.estado === 'PENDIENTE')

          if (allCompleted) {
            status = 'EJECUTADO'
          } else if (anyInProgress) {
            status = 'EN_PROCESO'
          } else if (anyPending) {
            status = 'PENDIENTE'
          } else {
            status = 'PENDIENTE'
          }
        }

        return {
          id: p.id,
          codigo: p.codigo || null,
          clasificacion: p.clasificacion,
          descripcion: p.descripcion,
          efectosPosibles: p.efectosPosibles,
          nivelRiesgo: p.nivelRiesgo,
          interpRiesgo: p.interpRiesgo,
          aceptabilidad: p.aceptabilidad,
          nivelDeficiencia: p.nivelDeficiencia,
          nivelExposicion: p.nivelExposicion,
          nivelConsecuencia: p.nivelConsecuencia,
          eliminacion: p.eliminacion,
          sustitucion: p.sustitucion,
          controlesIngenieria: p.controlesIngenieria,
          controlesAdministrativos: p.controlesAdministrativos,
          epp: p.epp,
          planesAccion: activePlans,
          totalAcciones: planCount,
          estadoPlan: status,
          matricesCount: matricesSet.size,
          actividadesCount: totalOccurrences,
          areas: Array.from(areasSet),
        }
      })

      // Client-side filters for risk level and plan status if specified
      if (nivelRiesgo && String(nivelRiesgo) !== 'TODOS') {
        const nrFilter = String(nivelRiesgo).toUpperCase()
        mapped = mapped.filter((item: any) => {
          if (nrFilter === 'I') {
            return (
              item.interpRiesgo === 'I' ||
              item.interpRiesgo?.startsWith('I ') ||
              (item.nivelRiesgo && item.nivelRiesgo >= 600)
            )
          }
          if (nrFilter === 'II') {
            return (
              item.interpRiesgo === 'II' ||
              item.interpRiesgo?.startsWith('II ') ||
              (item.nivelRiesgo && item.nivelRiesgo >= 150 && item.nivelRiesgo < 600)
            )
          }
          if (nrFilter === 'III') {
            return (
              item.interpRiesgo === 'III' ||
              item.interpRiesgo?.startsWith('III ') ||
              (item.nivelRiesgo && item.nivelRiesgo >= 40 && item.nivelRiesgo < 150)
            )
          }
          return true
        })
      }

      if (estadoPlan && String(estadoPlan) !== 'TODOS') {
        const est = String(estadoPlan).toUpperCase()
        if (est === 'CON_PLAN') {
          mapped = mapped.filter((item: any) => item.totalAcciones > 0)
        } else if (est === 'SIN_PLAN') {
          mapped = mapped.filter((item: any) => item.totalAcciones === 0)
        } else {
          mapped = mapped.filter((item: any) => item.estadoPlan === est)
        }
      }

      if (area && String(area) !== 'TODOS') {
        const targetArea = String(area).trim().toLowerCase()
        mapped = mapped.filter((item: any) => item.areas.some((a: any) => a.toLowerCase() === targetArea))
      }

      // Calculate separated stats per risk level (Muy Alto, Alto, Moderado)
      const totalPeligros = catalogDangers.length
      let peligrosConPlan = 0
      let totalAcciones = 0
      let accionesPendientes = 0
      let accionesEnProgreso = 0
      let accionesEjecutadas = 0

      // Separate stats per danger level
      const nivelI = {
        total: 0,
        conPlan: 0,
        sinPlan: 0,
        cobertura: 0,
        totalAcciones: 0,
      }
      const nivelII = {
        total: 0,
        conPlan: 0,
        sinPlan: 0,
        cobertura: 0,
        totalAcciones: 0,
      }
      const nivelIII = {
        total: 0,
        conPlan: 0,
        sinPlan: 0,
        cobertura: 0,
        totalAcciones: 0,
      }

      catalogDangers.forEach((p: any) => {
        const plans = p.planesAccion || []
        const hasPlan = plans.length > 0
        const interp = (p.interpRiesgo || '').toUpperCase()
        const nr = p.nivelRiesgo || 0

        let level: 'I' | 'II' | 'III' = 'III'
        if (interp === 'I' || interp.startsWith('I ') || nr >= 600) {
          level = 'I'
        } else if (interp === 'II' || interp.startsWith('II ') || (nr >= 150 && nr < 600)) {
          level = 'II'
        }

        if (level === 'I') {
          nivelI.total++
          if (hasPlan) {
            nivelI.conPlan++
            nivelI.totalAcciones += plans.length
          }
        } else if (level === 'II') {
          nivelII.total++
          if (hasPlan) {
            nivelII.conPlan++
            nivelII.totalAcciones += plans.length
          }
        } else {
          nivelIII.total++
          if (hasPlan) {
            nivelIII.conPlan++
            nivelIII.totalAcciones += plans.length
          }
        }

        if (hasPlan) {
          peligrosConPlan++
          plans.forEach((a: any) => {
            totalAcciones++
            if (a.estado === 'EJECUTADO' || a.estado === 'COMPLETADO') accionesEjecutadas++
            else if (a.estado === 'EN_PROCESO') accionesEnProgreso++
            else accionesPendientes++
          })
        }
      })

      nivelI.sinPlan = nivelI.total - nivelI.conPlan
      nivelI.cobertura = nivelI.total > 0 ? Math.round((nivelI.conPlan / nivelI.total) * 100) : 100

      nivelII.sinPlan = nivelII.total - nivelII.conPlan
      nivelII.cobertura = nivelII.total > 0 ? Math.round((nivelII.conPlan / nivelII.total) * 100) : 0

      nivelIII.sinPlan = nivelIII.total - nivelIII.conPlan
      nivelIII.cobertura = nivelIII.total > 0 ? Math.round((nivelIII.conPlan / nivelIII.total) * 100) : 0

      const porcentajeCumplimiento = totalAcciones > 0
        ? Math.round((accionesEjecutadas / totalAcciones) * 100)
        : 0

      const porcentajeCobertura = totalPeligros > 0
        ? Math.round((peligrosConPlan / totalPeligros) * 100)
        : 0

      return res.status(200).json({
        peligros: mapped,
        items: mapped,
        stats: {
          totalPeligros,
          peligrosConPlan,
          peligrosSinPlan: totalPeligros - peligrosConPlan,
          nivelI,
          nivelII,
          nivelIII,
          peligrosCriticosSinPlan: nivelI.sinPlan + nivelII.sinPlan,
          totalAcciones,
          accionesPendientes,
          accionesEnProgreso,
          accionesEjecutadas,
          porcentajeCumplimiento,
          porcentajeCobertura,
        },
      })
    } catch (error: any) {
      console.error('Error GET /api/plan-accion:', error)
      return res.status(500).json({
        error: 'Error al obtener el plan de acción',
        details: error?.message || String(error),
      })
    }
  }

  if (method === 'POST') {
    try {
      const {
        peligroCatalogoId,
        peligroId,
        matrizId,
        que,
        porQue,
        donde,
        cuandoInicio,
        cuandoFin,
        como,
        cuanto,
        responsable,
        estado,
      } = req.body

      if (!que || !String(que).trim()) {
        return res.status(400).json({ error: 'El campo "Qué" (acción) es obligatorio.' })
      }

      if (!peligroCatalogoId && !peligroId) {
        return res.status(400).json({ error: 'Debe asociarse a un peligro del catálogo o de la matriz.' })
      }

      // Count existing actions to establish orden
      const existingCount = await prisma.planAccion5W2H.count({
        where: {
          peligroCatalogoId: peligroCatalogoId || undefined,
          peligroId: peligroId || undefined,
          deletedAt: null,
        },
      })

      const created = await prisma.planAccion5W2H.create({
        data: {
          peligroCatalogoId: peligroCatalogoId || null,
          peligroId: peligroId || null,
          matrizId: matrizId || null,
          que: String(que).trim(),
          porQue: porQue ? String(porQue).trim() : null,
          donde: donde ? String(donde).trim() : null,
          cuandoInicio: cuandoInicio ? new Date(cuandoInicio) : null,
          cuandoFin: cuandoFin ? new Date(cuandoFin) : null,
          como: como ? String(como).trim() : null,
          cuanto: cuanto ? String(cuanto).trim() : null,
          responsable: responsable ? String(responsable).trim() : null,
          estado: estado ? String(estado).toUpperCase() : 'PENDIENTE',
          orden: existingCount,
        },
      })

      return res.status(201).json(created)
    } catch (error: any) {
      console.error('Error POST /api/plan-accion:', error)
      return res.status(500).json({
        error: 'Error al crear la acción 5W2H',
        details: error?.message || String(error),
      })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: 'Método no permitido' })
}
