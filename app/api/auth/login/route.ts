import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Faltan credenciales' }, { status: 400 })
    }

    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured')
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const { default: prisma } = await import('@/lib/prisma')
    const bcrypt = (await import('bcryptjs')).default

    const user = await prisma.usuario.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const stored = String(user.passwordHash || '')
    let passwordMatches = false

    // Detect if stored password is a bcrypt hash (legacy DB may contain plaintext)
    const isBcrypt = /^\$2[aby]\$/.test(stored)
    if (isBcrypt) {
      passwordMatches = await bcrypt.compare(password, stored)
    } else {
      // Legacy plaintext password: accept it and migrate to bcrypt
      if (password === stored) {
        passwordMatches = true
        try {
          const newHash = await bcrypt.hash(password, 10)
          await prisma.usuario.update({ where: { id: user.id }, data: { passwordHash: newHash } })
        } catch (e) {
          console.warn('Failed to migrate plaintext password to bcrypt for user', user.id)
        }
      }
    }

    if (!passwordMatches) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      cargo: user.cargo || '',
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }

    const token = Buffer.from(JSON.stringify(sessionPayload)).toString('base64')

    const response = NextResponse.json({
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      cargo: user.cargo || ''
    })

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error logging in:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
