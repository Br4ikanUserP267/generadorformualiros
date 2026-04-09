import { NextRequest, NextResponse } from 'next/server'

function isValidToken(token?: string) {
  if (!token) return false

  try {
    const decoded = JSON.parse(atob(token))
    return !!decoded?.id && !!decoded?.email && !!decoded?.exp && decoded.exp > Date.now()
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isValidToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const decoded = JSON.parse(atob(token))
    return NextResponse.json({
      id: decoded.id,
      email: decoded.email,
      nombre: decoded.nombre,
      cargo: decoded.cargo || '',
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
