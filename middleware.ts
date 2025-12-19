import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { ipAddress } from '@vercel/edge'

// === Upstash Rate Limiting ===
// Sliding window: 10 requests per 60 seconds per IP (adjust as needed)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(), // Automatically uses UPSTASH_REDIS_REST_URL & _TOKEN
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 reqs / 60 seconds
  prefix: '@upstash/ratelimit/auth', // Optional: namespace keys
  analytics: true, // Optional: enables analytics in Upstash dashboard
})

async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname
  const method = request.method

  // Only rate limit sensitive auth-related paths
  const rateLimitedPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/api/auth', // your server actions (sendPhoneOTP, etc.)
    
  ]

  const shouldRateLimit =
    method === 'POST' && // ← Only POST requests
    rateLimitedPaths.some((path) => pathname.startsWith(path))

  if (!shouldRateLimit) return null

  if (!shouldRateLimit) return null

  // Get client IP (accurate on Vercel)
  const ip = ipAddress(request) || request.headers.get('x-forwarded-for') || 'unknown'

  const { success, limit, remaining, reset } = await ratelimit.limit(ip)

  if (!success) {
    const retryAfter = Math.ceil((reset - Date.now()) / 1000)

    return new NextResponse(
      JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    )
  }

  // Add useful headers even on success
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', reset.toString())

  return null
}

// === Main Middleware ===
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Apply Upstash rate limiting first
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const protectedRoutes = ['/user', '/business', '/admin']
  const authRoutes = ['/auth/login', '/auth/register']

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users from protected routes
  if (isProtectedRoute && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    let redirectPath = '/categories' // fallback

    if (profile?.role === 'business') redirectPath = '/business/dashboard'
    if (profile?.role === 'admin') redirectPath = '/admin/dashboard'

    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}