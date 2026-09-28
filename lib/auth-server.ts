import { NextApiRequest } from 'next'
import prisma from './prisma'

export async function getAuthUser(req: NextApiRequest) {
  if ((req as any)._authUser !== undefined) {
    return (req as any)._authUser
  }

  const token = req.cookies['auth_token']
  if (!token) {
    (req as any)._authUser = null
    return null
  }

  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    if (!decoded?.email || !decoded?.exp || decoded.exp < Date.now()) {
      (req as any)._authUser = null
      return null
    }

    // Always fetch from DB to get the correct Risks DB ID
    const user = await prisma.usuario.findUnique({
      where: { email: decoded.email }
    })

    if (!user) {
      (req as any)._authUser = null
      return null
    }

    // Inject role from token (since Risks DB doesn't have roles)
    const authUser = {
      ...user,
      role: decoded.role,
      cargo: decoded.cargo
    };
    (req as any)._authUser = authUser
    return authUser
  } catch (error) {
    (req as any)._authUser = null
    return null
  }
}

export function isAdmin(user: any) {
  return user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN'
}
