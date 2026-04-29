import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

function parseNumberParam(value: unknown, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return fallback
  return Math.floor(n)
}

function parseSearch(value: unknown) {
  const raw = String(Array.isArray(value) ? value[0] : value || '').trim()
  return raw || ''
}

function parseAceptabilidad(value: unknown): string[] {
  const raw = String(Array.isArray(value) ? value[0] : value || '').trim()
  if (!raw) return []
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const page = parseNumberParam(req.query.page, 0)
    const pageSize = Math.min(parseNumberParam(req.query.pageSize, 20), 100)
    const search = parseSearch(req.query.search)
    const aceptabilidad = parseAceptabilidad(req.query.aceptabilidad)

    const where = {
      ...(aceptabilidad.length > 0 ? {
        evaluacion: { interpProbabilidad: { in: aceptabilidad } },
      } : {}),
      ...(search ? {
        descripcion: { contains: search, mode: 'insensitive' as const },
      } : {}),
      actividad: {
        zona: {
          proceso: {
            matriz: { deletedAt: null },
          },
        },
      },
    }

    const [rows, total] = await Promise.all([
      prisma.peligro.findMany({
        where,
        select: {
          id: true,
          descripcion: true,
          clasificacion: true,
          evaluacion: {
            select: {
              nivelRiesgo: true,
              interpRiesgo: true,
              aceptabilidad: true,
              interpProbabilidad: true,
            },
          },
          actividad: {
            select: {
              nombre: true,
              orden: true,
              zona: {
                select: {
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
        orderBy: { evaluacion: { nivelProbabilidad: 'desc' } },
        take: pageSize,
        skip: page * pageSize,
      }),
      prisma.peligro.count({ where }),
    ])

    const data = rows.map((row) => {
      const orden = typeof row.actividad?.orden === 'number' ? row.actividad.orden : 0
      const matriz = row.actividad?.zona?.proceso?.matriz
      return {
        id: row.id,
        peligro: row.descripcion || '',
        clasificacion: row.clasificacion || '',
        nivelRiesgo: row.evaluacion?.nivelRiesgo ?? null,
        interpRiesgo: row.evaluacion?.interpRiesgo || '',
        aceptabilidad: row.evaluacion?.aceptabilidad || '',
        interpProbabilidad: row.evaluacion?.interpProbabilidad || '',
        nombreMatriz: matriz?.area || 'Matriz sin nombre',
        matrizId: matriz?.id || '',
        actividad: `Actividad ${orden + 1}`,
      }
    })

    return res.status(200).json({
      data,
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('Reporte peligros error:', error)
    return res.status(500).json({ error: 'Error cargando reporte de peligros' })
  }
}
