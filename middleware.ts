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
  const pathname = request.nextUrl.pathname
  const appPath = pathname.startsWith('/matriz-riesgos') ? pathname.replace('/matriz-riesgos', '') || '/' : pathname
  const token = request.cookies.get('auth_token')?.value
  const hasValidSession = isValidToken(token)
  
  if (appPath.startsWith('/api')) {
    console.log('[MIDDLEWARE] API request:', { pathname, appPath, hasToken: !!token, hasValidSession })
    // If the original pathname includes basePath, rewrite it to strip the basePath
    if (pathname !== appPath) {
      console.log('[MIDDLEWARE] Rewriting API path from', pathname, 'to', appPath)
      return NextResponse.rewrite(new URL(appPath, request.url))
    }
  }

  // Don't modify static files or Next.js internals
  if (
    appPath.startsWith('/_next') ||
    appPath.startsWith('/public') ||
    appPath.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next()
  }

  const isAuthApi = appPath === '/api/auth/login' || appPath === '/api/auth/me' || appPath === '/api/auth/logout'
  if (isAuthApi) {
    return NextResponse.next()
  }

  if (appPath.startsWith('/api')) {
    if (!hasValidSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.next()
  }

  if (appPath === '/' || appPath === '') {
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
