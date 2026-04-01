import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '@/lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' })
  }

  try {
    const user = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      cargo: 'Director de Seguridad',
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }

    const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64')
    res.setHeader(
      'Set-Cookie',
      `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    )

    return res.status(200).json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      cargo: 'Director de Seguridad' // Fallback for standard demo
    })
  } catch (error) {
    console.error('Error logging in:', error)
    return res.status(500).json({ error: 'Error del servidor' })
  }
}
