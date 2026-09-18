import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { calculateGtc45, normalizeClasificacion } from '@/lib/gtc45-utils'
import { generateNextPeligroCode } from './next-code'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'No autorizado' })
  }

  const { method } = req

  if (method === 'GET') {
    try {
      const { q, clasificacion, nivelRiesgo, limit, offset } = req.query

      const where: any = {
        deletedAt: null,
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
          { efectosPosibles: { contains: queryStr, mode: 'insensitive' } },
          { controlFuente: { contains: queryStr, mode: 'insensitive' } },
          { controlMedio: { contains: queryStr, mode: 'insensitive' } },
          { controlIndividuo: { contains: queryStr, mode: 'insensitive' } },
        ]
      }

      // Filter by GTC 45 Risk Level if requested
      if (nivelRiesgo && String(nivelRiesgo) !== 'TODOS') {
        const nrFilter = String(nivelRiesgo).toUpperCase()
        if (nrFilter === 'MUY_ALTO' || nrFilter === 'I') {
          where.nivelRiesgo = { gt: 500 }
        } else if (nrFilter === 'ALTO' || nrFilter === 'II') {
          where.nivelRiesgo = { gt: 120, lte: 500 }
        } else if (nrFilter === 'MEDIO' || nrFilter === 'III') {
          where.nivelRiesgo = { gt: 20, lte: 120 }
        } else if (nrFilter === 'BAJO' || nrFilter === 'IV') {
          where.OR = [
            { nivelRiesgo: { lte: 20 } },
            { nivelRiesgo: null },
          ]
        }
      }

      const take = limit ? Math.min(500, Math.max(1, parseInt(String(limit), 10))) : undefined
      const skip = offset ? Math.max(0, parseInt(String(offset), 10)) : undefined

      const [totalCount, items, summaryCounts] = await Promise.all([
        prisma.peligroCatalogo.count({ where }),
        prisma.peligroCatalogo.findMany({
          where,
          include: {
            _count: {
              select: {
                peligrosMatriz: {
                  where: { deletedAt: null },
                },
              },
            },
          },
          orderBy: [
            { clasificacion: 'asc' },
            { nivelRiesgo: 'desc' },
            { descripcion: 'asc' },
          ],
          take,
          skip,
        }),
        // Global count breakdown for summary badges
        Promise.all([
          prisma.peligroCatalogo.count({ where: { deletedAt: null } }),
          prisma.peligroCatalogo.count({
            where: { deletedAt: null, nivelRiesgo: { gt: 500 } },
          }),
          prisma.peligroCatalogo.count({
            where: { deletedAt: null, nivelRiesgo: { gt: 120, lte: 500 } },
          }),
          prisma.peligroCatalogo.count({
            where: { deletedAt: null, nivelRiesgo: { gt: 20, lte: 120 } },
          }),
          prisma.peligroCatalogo.count({
            where: {
              deletedAt: null,
              OR: [{ nivelRiesgo: { lte: 20 } }, { nivelRiesgo: null }],
            },
          }),
        ]),
      ])

      const [totalCatalog, muyAltoCount, altoCount, medioCount, bajoCount] = summaryCounts

      return res.status(200).json({
        total: totalCount,
        items,
        summary: {
          totalCatalog,
          muyAlto: muyAltoCount,
          alto: altoCount,
          medio: medioCount,
          bajo: bajoCount,
        },
      })
    } catch (error: any) {
      console.error('Error GET /api/peligros:', error)
      return res.status(500).json({
        error: 'Error al obtener el catálogo de peligros',
        details: error?.message || String(error),
      })
    }
  }

  if (method === 'POST') {
    try {
      const body = req.body
      if (!body || !body.descripcion || !body.clasificacion) {
        return res
          .status(400)
          .json({ error: 'La descripción y clasificación del peligro son obligatorias.' })
      }

      const calculated = calculateGtc45(body.nivelDeficiencia, body.nivelExposicion, body.nivelConsecuencia)
      const clasifStr = normalizeClasificacion(body.clasificacion) || 'BIOLÓGICO'

      let finalCodigo = body.codigo ? String(body.codigo).trim().toUpperCase() : null
      if (!finalCodigo) {
        finalCodigo = await generateNextPeligroCode(clasifStr)
      }

      const created = await prisma.peligroCatalogo.create({
        data: {
          codigo: finalCodigo,
          clasificacion: clasifStr,
          descripcion: String(body.descripcion).trim(),
          efectosPosibles: body.efectosPosibles ? String(body.efectosPosibles).trim() : null,
          controlFuente: body.controlFuente ? String(body.controlFuente).trim() : null,
          controlMedio: body.controlMedio ? String(body.controlMedio).trim() : null,
          controlIndividuo: body.controlIndividuo ? String(body.controlIndividuo).trim() : null,
          nivelDeficiencia: calculated.nd,
          nivelExposicion: calculated.ne,
          nivelProbabilidad: calculated.np,
          interpProbabilidad: calculated.interpNp || body.interpProbabilidad || null,
          nivelConsecuencia: calculated.nc,
          nivelRiesgo: calculated.nr,
          interpRiesgo: calculated.interpNr || body.interpRiesgo || null,
          aceptabilidad: calculated.aceptabilidad || body.aceptabilidad || null,
          numExpuestos: body.numExpuestos ? Number(body.numExpuestos) : null,
          peorConsecuencia: body.peorConsecuencia ? String(body.peorConsecuencia).trim() : null,
          requisitoLegal: Boolean(body.requisitoLegal),
          eliminacion: body.eliminacion ? String(body.eliminacion).trim() : null,
          sustitucion: body.sustitucion ? String(body.sustitucion).trim() : null,
          controlesIngenieria: body.controlesIngenieria ? String(body.controlesIngenieria).trim() : null,
          controlesAdministrativos: body.controlesAdministrativos ? String(body.controlesAdministrativos).trim() : null,
          epp: body.epp ? String(body.epp).trim() : null,
        },
      })

      return res.status(201).json(created)
    } catch (error: any) {
      console.error('Error POST /api/peligros:', error)
      return res.status(500).json({
        error: 'Error al registrar el peligro en el catálogo',
        details: error?.message || String(error),
      })
    }
  }

  res.setHeader('Allow', ['GET', 'POST'])
  return res.status(405).json({ error: `Método ${method} no permitido` })
}
