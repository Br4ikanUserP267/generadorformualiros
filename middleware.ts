import { NextRequest, NextResponse } from "next/server"

function isValidToken(token?: string) {
  if (!token) return false

  try {
    const decoded = JSON.parse(atob(token))
    return !!decoded?.id && !!decoded?.email && !!decoded?.exp && decoded.exp > Date.now()
  } catch {
    return false
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth_token')?.value
  const hasValidSession = isValidToken(token)

  // With basePath set to /matriz-riesgos, Next.js passes the pathname without the basePath
  // so a request to /matriz-riesgos/dashboard comes here as /dashboard
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next()
  }

  const isAuthApi = pathname === '/api/auth/login' || pathname === '/api/auth/me' || pathname === '/api/auth/logout'
  if (isAuthApi) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api')) {
    if (!hasValidSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.next()
  }

  if (pathname === '/' || pathname === '') {
    if (hasValidSession) return NextResponse.redirect(new URL('/matriz-riesgos/dashboard', request.url))
    return NextResponse.next()
  }

  if (!hasValidSession) {
    return NextResponse.redirect(new URL('/matriz-riesgos', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
