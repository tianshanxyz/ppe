import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/settings', '/api-keys', '/subscription']
const AUTH_ROUTES = ['/auth/login', '/auth/signup', '/auth/callback']
const PROTECTED_API_ROUTES = [
  '/api/compare',
  '/api/export',
  '/api/api-keys',
  '/api/subscription',
  '/api/credit-score/compare',
  '/api/ai/chat',
  '/api/ai/extract',
  '/api/ai/query',
  '/api/report/generate',
  '/api/report/download',
  '/api/membership',
  '/api/favorites',
  '/api/bookmarks',
  '/api/watchlists',
  '/api/audit',
  '/api/alerts',
  '/api/risks',
  '/api/medplum',
  '/api/entity-resolution',
  '/api/comparison',
  '/api/notifications',
  '/api/batch-query',
  '/api/data-sources',
  '/api/product-classification',
  '/api/price-prediction',
  '/api/regulation-impact',
  '/api/market-recommendation',
]

const LOCALES = ['en', 'zh']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const { pathname, searchParams } = request.nextUrl
  
  const langParam = searchParams.get('lang')
  const existingCookie = request.cookies.get('mdlooker-locale')?.value
  
  if (langParam && LOCALES.includes(langParam)) {
    supabaseResponse.cookies.set('mdlooker-locale', langParam, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    })
  } else if (existingCookie && LOCALES.includes(existingCookie) && !langParam) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.searchParams.set('lang', existingCookie)
    return NextResponse.redirect(redirectUrl)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))

  if ((isProtectedRoute || isProtectedApiRoute) && !user) {
    // Allow demo sessions (cookie-based demo bypass)
    const isDemoSession = request.cookies.get('demo_session')?.value === 'true'
    if (isDemoSession) {
      return supabaseResponse
    }
    if (isProtectedApiRoute) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect logged-in demo users away from auth pages too
  const isDemoSession = request.cookies.get('demo_session')?.value === 'true'
  if (isAuthRoute && (user || isDemoSession)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
