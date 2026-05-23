import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()
  if (pathname.startsWith('/api/')) {
    const token = req.cookies.get('tns-token')?.value ||
      req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ success: false, error: 'Token invalid' }, { status: 401 })
    return NextResponse.next()
  }

  const token = req.cookies.get('tns-token')?.value
  if (!token) return NextResponse.redirect(new URL('/login', req.url))
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.redirect(new URL('/login', req.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
