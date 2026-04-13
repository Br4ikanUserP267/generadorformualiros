import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const [tipos, clasificaciones] = await Promise.all([
      prisma.$queryRaw<Array<{ value: string | null }>>`
        SELECT DISTINCT p."nombre" AS value
        FROM "matrices" m
        INNER JOIN "procesos" p ON p."matriz_id" = m."id"
        WHERE m."deleted_at" IS NULL
          AND p."deleted_at" IS NULL
          AND p."nombre" IS NOT NULL
          AND TRIM(p."nombre") <> ''
        ORDER BY value ASC
      `,
      prisma.$queryRaw<Array<{ value: string | null }>>`
        SELECT DISTINCT pel."clasificacion" AS value
        FROM "matrices" m
        INNER JOIN "procesos" p ON p."matriz_id" = m."id"
        INNER JOIN "zonas" z ON z."proceso_id" = p."id"
        INNER JOIN "actividades" a ON a."zona_id" = z."id"
        INNER JOIN "peligros" pel ON pel."actividad_id" = a."id"
        WHERE m."deleted_at" IS NULL
          AND p."deleted_at" IS NULL
          AND z."deleted_at" IS NULL
          AND a."deleted_at" IS NULL
          AND pel."deleted_at" IS NULL
          AND pel."clasificacion" IS NOT NULL
          AND TRIM(pel."clasificacion") <> ''
        ORDER BY value ASC
      `,
    ])

    return res.status(200).json({
      tipos: tipos.map((row) => row.value).filter((value): value is string => !!value),
      clasificaciones: clasificaciones.map((row) => row.value).filter((value): value is string => !!value),
    })
  } catch (error) {
    console.error('Facets riesgos error:', error)
    return res.status(500).json({ error: 'Error cargando los filtros de matrices' })
  }
}
