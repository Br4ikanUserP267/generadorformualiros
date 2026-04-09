import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 })
    }

    const user = await prisma.usuario.findUnique({
      where: { email }
    })

    if (!user || user.passwordHash !== password) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      cargo: 'Director de Seguridad',
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }

    const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64')
    
    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      cargo: 'Director de Seguridad'
    })
    
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error logging in:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
