import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { CLASIFICACIONES_RIESGO, normalizeClasificacion } from '@/lib/gtc45-utils'

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
    // Fetch distinct classifications and counts from catalog
    const counts = await prisma.peligroCatalogo.groupBy({
      by: ['clasificacion'],
      _count: { id: true },
      where: { deletedAt: null },
    })

    const countMap = new Map<string, number>()
    for (const c of counts) {
      if (c.clasificacion) {
        const norm = normalizeClasificacion(c.clasificacion)
        if (norm) {
          countMap.set(norm, (countMap.get(norm) || 0) + c._count.id)
        }
      }
    }

    const set = new Set<string>()

    // Standard list first
    for (const c of CLASIFICACIONES_RIESGO) {
      const norm = normalizeClasificacion(c)
      if (norm) set.add(norm)
    }

    // Add any custom classifications from DB
    for (const [norm] of countMap) {
      set.add(norm)
    }

    // Sort: standard list in standard order, then custom alphabetically
    const standardArray = Array.from(CLASIFICACIONES_RIESGO) as string[]
    const classifications = Array.from(set).sort((a, b) => {
      const aIdx = standardArray.indexOf(a)
      const bIdx = standardArray.indexOf(b)
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx
      if (aIdx !== -1) return -1
      if (bIdx !== -1) return 1
      return a.localeCompare(b, 'es')
    })

    const detailed = classifications.map((name) => ({
      name,
      count: countMap.get(name) || 0,
      isStandard: standardArray.includes(name),
    }))

    return res.status(200).json({
      classifications,
      detailed,
    })
  } catch (error: any) {
    console.error('Error GET /api/peligros/classifications:', error)
    return res.status(500).json({
      error: 'Error al obtener clasificaciones',
      details: error?.message || String(error),
    })
  }
}
