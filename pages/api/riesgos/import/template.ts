import type { NextApiRequest, NextApiResponse } from 'next'
import { buildTemplateWorkbookBuffer } from '@/lib/riesgos-import'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const rawBuffer = await buildTemplateWorkbookBuffer()
    const buffer = Buffer.isBuffer(rawBuffer) ? rawBuffer : Buffer.from(rawBuffer)

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_matriz_riesgos.xlsx"')
    return res.status(200).send(buffer)
  } catch (error) {
    console.error('Template generation error:', error)
    return res.status(500).json({ error: 'Error generando plantilla' })
  }
}
