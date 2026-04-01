import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).end('Method Not Allowed')
  }

  const token = req.cookies['auth_token']
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    if (!decoded?.id || !decoded?.email || !decoded?.exp || decoded.exp < Date.now()) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    return res.status(200).json({
      id: decoded.id,
      email: decoded.email,
      nombre: decoded.nombre,
      cargo: decoded.cargo || 'Usuario',
    })
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
