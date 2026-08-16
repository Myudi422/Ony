import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const isAdminEmail = (email?: string | null) => {
  if (!email) return false
  const adminEmail = (process.env.ADMIN_EMAIL ?? 'myudi422@gmail.com').toLowerCase().trim()
  return email.toLowerCase().trim() === adminEmail
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  // Protect /dashboard
  if (pathname.startsWith('/dashboard') && !token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect /admin - Strict RBAC check
  if (pathname.startsWith('/admin')) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const isAdmin = isAdminEmail(token.email) || token.role === 'admin' || token.role === 'superadmin'
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
}
