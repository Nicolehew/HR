import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  // Public routes
  if (pathname === '/login' || pathname === '/') {
    if (user) {
      const { data: driver } = await supabase
        .from('drivers')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (!driver) {
        // Session exists but no driver row — clear session and show login
        const response = NextResponse.redirect(new URL('/login', request.url))
        // Copy any auth cookie deletions from supabaseResponse
        supabaseResponse.cookies.getAll().forEach(cookie => {
          response.cookies.set(cookie.name, cookie.value, cookie as Parameters<typeof response.cookies.set>[2])
        })
        request.cookies.getAll().forEach(cookie => {
          if (cookie.name.includes('auth-token')) {
            response.cookies.delete(cookie.name)
          }
        })
        return response
      }

      const dest = driver.role === 'boss' ? '/boss/today' : '/home'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  // Protected routes — must be logged in
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Boss-only routes
  if (pathname.startsWith('/boss')) {
    const { data: driver } = await supabase
      .from('drivers')
      .select('role')
      .eq('auth_id', user.id)
      .single()

    if (driver?.role !== 'boss') {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
