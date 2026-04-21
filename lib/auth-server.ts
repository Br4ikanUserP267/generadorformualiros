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

    return user
  } catch (error) {
    return null
  }
}

export function isAdmin(user: any) {
  // You might want to pass the role in the token too
  // For now, let's assume we can trust the role in the token if we want
  return false // Default to false, implement if needed
}
