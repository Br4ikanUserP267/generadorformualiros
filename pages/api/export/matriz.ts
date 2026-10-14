import { NextApiRequest, NextApiResponse } from 'next'
import { buildMatrizWorkbook, MatrizData } from '@/lib/matriz-excel-builder'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const matrizData: MatrizData = req.body

    const wb = await buildMatrizWorkbook(matrizData)
    const buf = await wb.xlsx.writeBuffer()
    const sanitizedArea = (matrizData.area || 'Matriz')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w-]/g, '') || 'MATRIZ'
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="Matriz_${sanitizedArea}_${dateStr}.xlsx"`)
    return res.status(200).send(Buffer.from(buf))

  } catch (error) {
    console.error('Export error:', error)
    return res.status(500).json({ error: 'Failed to export matriz' })
  }
}