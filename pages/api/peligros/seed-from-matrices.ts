import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { calculateGtc45, normalizeClasificacion } from '@/lib/gtc45-utils'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: 'Método no permitido' })
  }

  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  try {
    // 1. Fetch all matrix peligros with joins
    const matrixPeligros = await prisma.peligro.findMany({
      where: {
        deletedAt: null,
        actividad: {
          deletedAt: null,
          zona: {
            deletedAt: null,
            proceso: {
              deletedAt: null,
              matriz: { deletedAt: null },
            },
          },
        },
      },
      include: {
        control: true,
        criterio: true,
        evaluacion: true,
        intervencion: true,
      },
    })

    if (matrixPeligros.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No se encontraron peligros en las matrices para extraer.',
        uniqueCreated: 0,
        matrixPeligrosUpdated: 0,
      })
    }

    // 2. Group by normalized (clasificacion + description)
    const groups: Record<
      string,
      {
        clasificacion: string
        descripcion: string
        efectosPosibles: string
        controles: { fuente: string; medio: string; individuo: string }
        evaluacion: { nd: number | null; ne: number | null; nc: number | null; nr: number | null }
        criterio: { numExpuestos: number | null; peorConsecuencia: string; requisitoLegal: boolean }
        intervencion: {
          eliminacion: string
          sustitucion: string
          controlesIngenieria: string
          controlesAdministrativos: string
          epp: string
        }
        peligroIds: string[]
      }
    > = {}

    for (const p of matrixPeligros) {
      let desc = (p.descripcion || '').trim()
      // Clean extraneous concatenated headers
      desc = desc
        .replace(/\s*Controles\s+en\s+la\s+fuente.*$/i, '')
        .replace(/\s*Controles\s+en\s+el\s+medio.*$/i, '')
        .replace(/\s*Controles\s+en\s+el\s+trabajador.*$/i, '')
        .trim()
      const clasif = normalizeClasificacion(p.clasificacion) || 'CONDICIONES DE SEGURIDAD'
      if (!desc) continue

      const key = `${clasif}:::${desc.toLowerCase()}`

      if (!groups[key]) {
        groups[key] = {
          clasificacion: clasif,
          descripcion: desc,
          efectosPosibles: p.efectosPosibles || '',
          controles: {
            fuente: p.control?.fuente || '',
            medio: p.control?.medio || '',
            individuo: p.control?.individuo || '',
          },
          evaluacion: {
            nd: p.evaluacion?.nivelDeficiencia ?? null,
            ne: p.evaluacion?.nivelExposicion ?? null,
            nc: p.evaluacion?.nivelConsecuencia ?? null,
            nr: p.evaluacion?.nivelRiesgo ?? null,
          },
          criterio: {
            numExpuestos: p.criterio?.numExpuestos ?? null,
            peorConsecuencia: p.criterio?.peorConsecuencia || '',
            requisitoLegal: Boolean(p.criterio?.requisitoLegal),
          },
          intervencion: {
            eliminacion: p.intervencion?.eliminacion || '',
            sustitucion: p.intervencion?.sustitucion || '',
            controlesIngenieria: p.intervencion?.controlesIngenieria || '',
            controlesAdministrativos: p.intervencion?.controlesAdministrativos || '',
            epp: p.intervencion?.epp || '',
          },
          peligroIds: [p.id],
        }
      } else {
        groups[key].peligroIds.push(p.id)
        // Keep highest evaluated risk
        const currNr = groups[key].evaluacion.nr || 0
        const newNr = p.evaluacion?.nivelRiesgo || 0
        if (newNr > currNr) {
          groups[key].evaluacion = {
            nd: p.evaluacion?.nivelDeficiencia ?? null,
            ne: p.evaluacion?.nivelExposicion ?? null,
            nc: p.evaluacion?.nivelConsecuencia ?? null,
            nr: p.evaluacion?.nivelRiesgo ?? null,
          }
        }
        // Merge missing controls/interventions if empty
        if (!groups[key].controles.fuente && p.control?.fuente) groups[key].controles.fuente = p.control.fuente
        if (!groups[key].controles.medio && p.control?.medio) groups[key].controles.medio = p.control.medio
        if (!groups[key].controles.individuo && p.control?.individuo) groups[key].controles.individuo = p.control.individuo
        if (!groups[key].efectosPosibles && p.efectosPosibles) groups[key].efectosPosibles = p.efectosPosibles
      }
    }

    let uniqueCreated = 0
    let uniqueUpdated = 0
    let matrixPeligrosUpdated = 0

    const entries = Object.values(groups)

    for (const g of entries) {
      const calc = calculateGtc45(g.evaluacion.nd, g.evaluacion.ne, g.evaluacion.nc)

      // Find existing in catalog
      const existing = await prisma.peligroCatalogo.findFirst({
        where: {
          descripcion: { equals: g.descripcion, mode: 'insensitive' },
          clasificacion: { equals: g.clasificacion, mode: 'insensitive' },
          deletedAt: null,
        },
      })

      let catalogId = ''

      if (existing) {
        catalogId = existing.id
        uniqueUpdated++
      } else {
        const created = await prisma.peligroCatalogo.create({
          data: {
            clasificacion: g.clasificacion,
            descripcion: g.descripcion,
            efectosPosibles: g.efectosPosibles || null,
            controlFuente: g.controles.fuente || null,
            controlMedio: g.controles.medio || null,
            controlIndividuo: g.controles.individuo || null,
            nivelDeficiencia: calc.nd,
            nivelExposicion: calc.ne,
            nivelProbabilidad: calc.np,
            interpProbabilidad: calc.interpNp || null,
            nivelConsecuencia: calc.nc,
            nivelRiesgo: calc.nr,
            interpRiesgo: calc.interpNr || null,
            aceptabilidad: calc.aceptabilidad || null,
            numExpuestos: g.criterio.numExpuestos,
            peorConsecuencia: g.criterio.peorConsecuencia || null,
            requisitoLegal: g.criterio.requisitoLegal,
            eliminacion: g.intervencion.eliminacion || null,
            sustitucion: g.intervencion.sustitucion || null,
            controlesIngenieria: g.intervencion.controlesIngenieria || null,
            controlesAdministrativos: g.intervencion.controlesAdministrativos || null,
            epp: g.intervencion.epp || null,
          },
        })
        catalogId = created.id
        uniqueCreated++
      }

      // Link matrix peligros to catalog entry
      if (catalogId && g.peligroIds.length > 0) {
        await prisma.peligro.updateMany({
          where: { id: { in: g.peligroIds } },
          data: { catalogoPeligroId: catalogId },
        })
        matrixPeligrosUpdated += g.peligroIds.length
      }
    }

    return res.status(200).json({
      success: true,
      message: `Extracción completada con éxito. Se consolidaron ${matrixPeligros.length} aplicaciones en ${entries.length} peligros únicos normalizados.`,
      uniqueCreated,
      uniqueUpdated,
      totalCatalogUnique: entries.length,
      matrixPeligrosUpdated,
    })
  } catch (error: any) {
    console.error('Error POST /api/peligros/seed-from-matrices:', error)
    return res.status(500).json({
      error: 'Error al extraer y consolidar peligros desde las matrices',
      details: error?.message || String(error),
    })
  }
}
