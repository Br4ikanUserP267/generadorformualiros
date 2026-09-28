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
    const [countsResult, pagedPeligros, allMatrixHazards] = await Promise.all([
      prisma.$queryRaw<Array<{
        total_procesos: number
        total_zonas: number
        total_actividades: number
        total_peligros: number
        muy_alto: number
        alto: number
        medio: number
        bajo: number
      }>>`
        WITH active_data AS (
          SELECT 
            p."id",
            COALESCE(NULLIF(TRIM(ep."interp_probabilidad"), ''), NULLIF(TRIM(e."interp_probabilidad"), ''), '') AS interp_np,
            CASE 
              WHEN ep."nivel_probabilidad" IS NOT NULL AND ep."nivel_probabilidad" > 0 THEN ep."nivel_probabilidad"
              WHEN e."nivel_probabilidad" IS NOT NULL AND e."nivel_probabilidad" > 0 THEN e."nivel_probabilidad"
              ELSE 0
            END AS np
          FROM "peligros" p
          JOIN "actividades" a ON p."actividad_id" = a."id" AND a."deleted_at" IS NULL
          JOIN "zonas" z ON a."zona_id" = z."id" AND z."deleted_at" IS NULL
          JOIN "procesos" pr ON z."proceso_id" = pr."id" AND pr."deleted_at" IS NULL
          LEFT JOIN "evaluaciones" e ON e."peligro_id" = p."id"
          LEFT JOIN "evaluaciones_post" ep ON ep."peligro_id" = p."id"
          WHERE pr."matriz_id" = ${matrizId} AND p."deleted_at" IS NULL
        )
        SELECT
          (SELECT COUNT(*)::int FROM "procesos" WHERE "matriz_id" = ${matrizId} AND "deleted_at" IS NULL) AS total_procesos,
          (SELECT COUNT(*)::int FROM "zonas" z JOIN "procesos" pr ON z."proceso_id" = pr."id" WHERE pr."matriz_id" = ${matrizId} AND z."deleted_at" IS NULL AND pr."deleted_at" IS NULL) AS total_zonas,
          (SELECT COUNT(*)::int FROM "actividades" a JOIN "zonas" z ON a."zona_id" = z."id" JOIN "procesos" pr ON z."proceso_id" = pr."id" WHERE pr."matriz_id" = ${matrizId} AND a."deleted_at" IS NULL AND z."deleted_at" IS NULL AND pr."deleted_at" IS NULL) AS total_actividades,
          COUNT("id")::int AS total_peligros,
          COUNT("id") FILTER (
            WHERE np >= 24
               OR UPPER(interp_np) LIKE '%MUY ALTO%'
               OR UPPER(interp_np) = 'MA'
               OR UPPER(interp_np) = 'EXTREMO'
          )::int AS muy_alto,
          COUNT("id") FILTER (
            WHERE (
              (np >= 10 AND np < 24)
              OR (UPPER(interp_np) LIKE '%ALTO%' AND UPPER(interp_np) NOT LIKE '%MUY ALTO%')
              OR UPPER(interp_np) = 'A'
            )
            AND NOT (
              np >= 24
              OR UPPER(interp_np) LIKE '%MUY ALTO%'
              OR UPPER(interp_np) = 'MA'
              OR UPPER(interp_np) = 'EXTREMO'
            )
          )::int AS alto,
          COUNT("id") FILTER (
            WHERE (
              (np >= 6 AND np < 10)
              OR UPPER(interp_np) LIKE '%MEDIO%'
              OR UPPER(interp_np) LIKE '%MODERADO%'
              OR UPPER(interp_np) = 'M'
            )
            AND NOT (
              np >= 10
              OR UPPER(interp_np) LIKE '%ALTO%'
            )
          )::int AS medio,
          COUNT("id") FILTER (
            WHERE (
              (np > 0 AND np <= 4)
              OR UPPER(interp_np) LIKE '%BAJO%'
              OR UPPER(interp_np) = 'B'
              OR (np = 0 AND interp_np = '')
            )
            AND NOT (
              np >= 6
              OR UPPER(interp_np) LIKE '%MEDIO%'
              OR UPPER(interp_np) LIKE '%MODERADO%'
              OR UPPER(interp_np) LIKE '%ALTO%'
            )
          )::int AS bajo
        FROM active_data;
      `,
      prisma.peligro.findMany({
        where: baseWhere,
        select: {
          id: true,
          descripcion: true,
          clasificacion: true,
          efectosPosibles: true,
          orden: true,
          catalogoPeligroId: true,
          catalogoPeligro: {
            select: {
              id: true,
              codigo: true,
              planesAccion: {
                where: { deletedAt: null },
                orderBy: { orden: 'asc' },
              },
            },
          },
          planesAccion: {
            where: { deletedAt: null },
            orderBy: { orden: 'asc' },
          },
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
          { actividad: { zona: { orden: 'asc' } } },
          { actividad: { orden: 'asc' } },
          { orden: 'asc' },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),

      // 3. Query distinct dangers in this matrix to get consolidated 5W2H action plans concurrently
      prisma.peligro.findMany({
        where: baseWhere,
        select: {
          id: true,
          descripcion: true,
          clasificacion: true,
          catalogoPeligroId: true,
          evaluacion: {
            select: {
              nivelRiesgo: true,
              interpRiesgo: true,
              aceptabilidad: true,
            },
          },
          catalogoPeligro: {
            select: {
              id: true,
              codigo: true,
              descripcion: true,
              clasificacion: true,
              nivelRiesgo: true,
              interpRiesgo: true,
              planesAccion: {
                where: { deletedAt: null },
                orderBy: { orden: 'asc' },
              },
            },
          },
          planesAccion: {
            where: { deletedAt: null },
            orderBy: { orden: 'asc' },
          },
        },
      }),
    ])

    const agg = countsResult[0] || {
      total_procesos: 0,
      total_zonas: 0,
      total_actividades: 0,
      total_peligros: 0,
      muy_alto: 0,
      alto: 0,
      medio: 0,
      bajo: 0,
    }

    const totalProcesos = agg.total_procesos
    const totalZonas = agg.total_zonas
    const totalActividades = agg.total_actividades
    const totalPeligros = agg.total_peligros
    const muyAltoCount = agg.muy_alto
    const altoCount = agg.alto
    const medioCount = agg.medio
    const bajoCount = agg.bajo

    // Consolidate 5W2H action plans grouped by danger (ONLY for Muy Alto, Alto, and Moderado)
    const planesAccion5w2hMap = new Map<string, any>()
    for (const haz of allMatrixHazards) {
      const nr = Number(haz.evaluacion?.nivelRiesgo ?? haz.catalogoPeligro?.nivelRiesgo ?? 0)
      const interp = String(haz.evaluacion?.interpRiesgo || haz.catalogoPeligro?.interpRiesgo || '').toUpperCase()
      const acept = String(haz.evaluacion?.aceptabilidad || '').toUpperCase()
      const isBajo = (nr > 0 && nr <= 20) || interp.includes('IV') || interp.includes('BAJO') || (acept === 'ACEPTABLE' && !acept.includes('CONTROL'))

      if (isBajo) continue

      const dangerKey = haz.catalogoPeligroId || haz.descripcion.trim().toLowerCase()
      if (!planesAccion5w2hMap.has(dangerKey)) {
        const plans = haz.catalogoPeligro?.planesAccion?.length
          ? haz.catalogoPeligro.planesAccion
          : haz.planesAccion || []
        
        planesAccion5w2hMap.set(dangerKey, {
          dangerId: haz.catalogoPeligroId || haz.id,
          codigo: haz.catalogoPeligro?.codigo || null,
          descripcion: haz.catalogoPeligro?.descripcion || haz.descripcion,
          clasificacion: haz.catalogoPeligro?.clasificacion || haz.clasificacion,
          planes: plans,
        })
      }
    }
    const planesAccionConsolidados = Array.from(planesAccion5w2hMap.values())

    const totalPages = Math.max(1, Math.ceil(totalPeligros / pageSize))

    // Map paged dangers to 30 flat columns
    const records = pagedPeligros.map((p: any) => {
      const a = p.actividad
      const z = a?.zona
      const proc = z?.proceso
      const ctrl = p.control
      const evPost = p.evaluacionPost
      const isIntervened = Boolean(
        evPost && (
          (evPost.interpProbabilidad && String(evPost.interpProbabilidad).trim() !== '') ||
          (evPost.nivelProbabilidad !== null && evPost.nivelProbabilidad !== undefined && Number(evPost.nivelProbabilidad) > 0) ||
          (evPost.nivelRiesgo !== null && evPost.nivelRiesgo !== undefined && Number(evPost.nivelRiesgo) > 0)
        )
      )
      const ev = isIntervened ? evPost : p.evaluacion
      const crit = p.criterio
      const inv = p.intervencion

      const nrNum = Number(ev?.nivelRiesgo ?? p.catalogoPeligro?.nivelRiesgo ?? 0)
      const interpStr = String(ev?.interpRiesgo || p.catalogoPeligro?.interpRiesgo || '').toUpperCase()
      const aceptStr = String(ev?.aceptabilidad || '').toUpperCase()
      const isBajo = (nrNum > 0 && nrNum <= 20) || interpStr.includes('IV') || interpStr.includes('BAJO') || (aceptStr === 'ACEPTABLE' && !aceptStr.includes('CONTROL'))

      const rawPlans = (p.catalogoPeligro?.planesAccion?.length ? p.catalogoPeligro.planesAccion : p.planesAccion) || []
      const planesAccion = isBajo ? [] : rawPlans

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
        planesAccion,
        catalogoPeligroId: p.catalogoPeligroId || null,
        codigoPeligro: p.catalogoPeligro?.codigo || null,
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
      planesAccion5w2h: planesAccionConsolidados,
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
