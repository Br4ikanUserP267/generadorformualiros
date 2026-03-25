import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Don't redirect static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/public') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp)$/)
  ) {
    return NextResponse.next()
  }

  // Redirect root to /matriz-riesgos
  if (pathname === '/') {
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
