import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

function parseSearch(value: unknown) {
  const raw = String(Array.isArray(value) ? value[0] : value || '').trim()
  return raw || ''
}

function buildWhere(search: string, aceptabilidad: string) {
  return {
    ...(search ? {
      descripcion: { contains: search, mode: 'insensitive' as const },
    } : {}),
    evaluacion: { aceptabilidad },
    actividad: {
      zona: {
        proceso: {
          matriz: { deletedAt: null },
        },
      },
    },
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const search = parseSearch(req.query.search)

    const [muyAlto, alto, medio, bajo] = await Promise.all([
      prisma.peligro.count({ where: buildWhere(search, 'No Aceptable') }),
      prisma.peligro.count({ where: buildWhere(search, 'Aceptable con Control Especifico') }),
      prisma.peligro.count({ where: buildWhere(search, 'Mejorable') }),
      prisma.peligro.count({ where: buildWhere(search, 'Aceptable') }),
    ])

    return res.status(200).json({
      muyAlto,
      alto,
      medio,
      bajo,
    })
  } catch (error) {
    console.error('Reporte peligros counts error:', error)
    return res.status(500).json({ error: 'Error cargando conteos de peligros' })
  }
}
