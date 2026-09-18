import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { getClasificacionPrefix, normalizeClasificacion } from '@/lib/gtc45-utils'

export async function generateNextPeligroCode(clasificacion: string): Promise<string> {
  const normClasif = normalizeClasificacion(clasificacion) || clasificacion
  const prefix = getClasificacionPrefix(normClasif)

  // Find all active hazards with code starting with prefix or classification
  const items = await prisma.peligroCatalogo.findMany({
    where: {
      deletedAt: null,
      OR: [
        { codigo: { startsWith: `${prefix}-`, mode: 'insensitive' } },
        { clasificacion: { equals: normClasif, mode: 'insensitive' } },
      ],
    },
    select: { codigo: true },
  })

  let maxNum = 0

  for (const item of items) {
    if (!item.codigo) continue
    const match = item.codigo.match(/(\d+)$/)
    if (match) {
      const num = parseInt(match[1], 10)
      if (!isNaN(num) && num > maxNum) {
        maxNum = num
      }
    }
  }

  const nextNum = maxNum + 1
  return `${prefix}-${String(nextNum).padStart(2, '0')}`
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
    const { clasificacion } = req.query
    const clasifStr = String(clasificacion || 'BIOLOGICO').trim()
    const prefix = getClasificacionPrefix(clasifStr)
    const nextCode = await generateNextPeligroCode(clasifStr)

    return res.status(200).json({
      prefix,
      clasificacion: clasifStr,
      nextCode,
    })
  } catch (error: any) {
    console.error('Error GET /api/peligros/next-code:', error)
    return res.status(500).json({
      error: 'Error al calcular el código automático',
      details: error?.message || String(error),
    })
  }
}
