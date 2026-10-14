import type { NextApiRequest, NextApiResponse } from 'next'
import JSZip from 'jszip'
import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'
import { buildMatrizWorkbook, mapDbMatrizToExportData } from '@/lib/matriz-excel-builder'

export const config = {
  api: {
    responseLimit: false,
  },
}

function parseDate(value: unknown) {
  const text = String(Array.isArray(value) ? value[0] : value || '').trim()
  if (!text) return undefined
  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await getAuthUser(req)
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const search = String(Array.isArray(req.query.search) ? req.query.search[0] : req.query.search || '').trim()
    const tipo = String(Array.isArray(req.query.tipo) ? req.query.tipo[0] : req.query.tipo || '').trim()
    const clasificacion = String(Array.isArray(req.query.clasificacion) ? req.query.clasificacion[0] : req.query.clasificacion || '').trim()
    const dateDesde = parseDate(req.query.dateDesde)
    const dateHasta = parseDate(req.query.dateHasta)

    const baseConditions: Prisma.MatrizWhereInput[] = [
      { deletedAt: null }
    ]

    if (tipo) {
      baseConditions.push({
        procesos: { some: { nombre: { equals: tipo, mode: 'insensitive' } } },
      })
    }

    if (clasificacion) {
      baseConditions.push({
        procesos: {
          some: {
            zonas: {
              some: {
                actividades: {
                  some: {
                    peligros: {
                      some: {
                        clasificacion: { equals: clasificacion, mode: 'insensitive' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })
    }

    if (dateDesde || dateHasta) {
      baseConditions.push({
        fechaElaboracion: {
          ...(dateDesde ? { gte: dateDesde } : {}),
          ...(dateHasta ? { lte: dateHasta } : {}),
        },
      })
    }

    if (search) {
      const searchTerms = search.split(/\s+/).filter(Boolean)
      for (const term of searchTerms) {
        baseConditions.push({
          OR: [
            { area: { contains: term, mode: 'insensitive' } },
            { responsable: { contains: term, mode: 'insensitive' } },
            { procesos: { some: { nombre: { contains: term, mode: 'insensitive' } } } },
            { procesos: { some: { zonas: { some: { nombre: { contains: term, mode: 'insensitive' } } } } } },
          ],
        })
      }
    }

    const where: Prisma.MatrizWhereInput = baseConditions.length > 1 ? { AND: baseConditions } : { deletedAt: null }

    const matrices = await prisma.matriz.findMany({
      where,
      orderBy: [
        { area: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        archivos: true,
        procesos: {
          orderBy: { orden: 'asc' },
          include: {
            zonas: {
              orderBy: { orden: 'asc' },
              include: {
                actividades: {
                  orderBy: { orden: 'asc' },
                  include: {
                    peligros: {
                      orderBy: { orden: 'asc' },
                      include: {
                        control: true,
                        criterio: true,
                        evaluacion: true,
                        evaluacionPost: true,
                        intervencion: true,
                        catalogoPeligro: {
                          include: {
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
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!matrices || matrices.length === 0) {
      return res.status(404).json({ error: 'No se encontraron matrices para exportar con los filtros seleccionados' })
    }

    const zip = new JSZip()
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const nameCounts = new Map<string, number>()

    for (const m of matrices) {
      try {
        const mappedData = mapDbMatrizToExportData(m)
        const wb = await buildMatrizWorkbook(mappedData)
        const buf = await wb.xlsx.writeBuffer()

        const sanitizedArea = (mappedData.area || 'Matriz')
          .trim()
          .toUpperCase()
          .replace(/\s+/g, '_')
          .replace(/[^\w-]/g, '') || 'MATRIZ'

        const baseFilename = `Matriz_${sanitizedArea}_${dateStr}`
        const count = nameCounts.get(baseFilename) || 0
        let finalFilename = `${baseFilename}.xlsx`
        if (count > 0) {
          finalFilename = `Matriz_${sanitizedArea}_(${count + 1})_${dateStr}.xlsx`
        }
        nameCounts.set(baseFilename, count + 1)

        zip.file(finalFilename, Buffer.from(buf))
      } catch (matrixErr) {
        console.error(`Error generating workbook for matrix ${m.id} (${m.area}):`, matrixErr)
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    })

    const zipFilename = `Matrices_Riesgos_Clinica_Santa_Maria_${dateStr}.zip`
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${zipFilename}"`)
    res.setHeader('Content-Length', zipBuffer.length)

    return res.status(200).send(zipBuffer)
  } catch (error) {
    console.error('Error exporting all matrices to zip:', error)
    return res.status(500).json({ error: 'Error al exportar las matrices a ZIP' })
  }
}
