import { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { key } = req.query

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ error: 'Key is required' })
  }

  if (req.method === 'GET') {
    try {
      const config = await prisma.configuracion.findUnique({
        where: { key }
      })
      return res.status(200).json(config || { key, valor: null })
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  if (req.method === 'POST') {
    const { valor } = req.body
    try {
      const config = await prisma.configuracion.upsert({
        where: { key },
        update: { valor },
        create: { key, valor }
      })
      return res.status(200).json(config)
    } catch (error: any) {
      return res.status(500).json({ error: error.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
