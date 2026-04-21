import { NextApiRequest } from 'next'
import prisma from './prisma'

export async function getAuthUser(req: NextApiRequest) {
  const token = req.cookies['auth_token']
  if (!token) return null

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    if (!decoded?.email || !decoded?.exp || decoded.exp < Date.now()) {
      return null
    }

    // Always fetch from DB to get the correct Risks DB ID
    const user = await prisma.usuario.findUnique({
      where: { email: decoded.email }
    })

    if (!user) return null

    // Inject role from token (since Risks DB doesn't have roles)
    return {
      ...user,
      role: decoded.role,
      cargo: decoded.cargo
    }
  } catch (error) {
    return null
  }
}

export function isAdmin(user: any) {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
}
