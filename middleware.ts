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

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const token = request.cookies.get('auth_token')?.value
  const hasValidSession = isValidToken(token)

  // Don't redirect static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next()
  }

  // Public auth APIs
  if (pathname === '/api/auth/login' || pathname === '/api/auth/me' || pathname === '/api/auth/logout') {
    return NextResponse.next()
  }

  // Protect all non-auth APIs
  if (pathname.startsWith('/api')) {
    if (!hasValidSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // Redirect root to /matriz-riesgos
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/matriz-riesgos', request.url))
  }

  // Public login route only
  if (pathname === '/matriz-riesgos' || pathname === '/matriz-riesgos/') {
    return NextResponse.next()
  }

  // Protect all other pages
  if (!hasValidSession) {
    return NextResponse.redirect(new URL('/matriz-riesgos', request.url))
  }

  // Rewrite all other routes to be under /matriz-riesgos if not already
  if (!pathname.startsWith('/matriz-riesgos')) {
    const newPathname = `/matriz-riesgos${pathname}`
    return NextResponse.rewrite(new URL(newPathname, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
