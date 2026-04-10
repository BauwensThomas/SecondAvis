import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdmin } from '@/lib/config'



export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  // Cree le client Supabase avec les cookies de la requete
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Recupere la session de l utilisateur connecte
  const { data: { user } } = await supabase.auth.getUser()

  // Vérifie si l'email est confirmé (email_confirmed_at présent dans les métadonnées)
  const emailConfirmed = !!user?.email_confirmed_at

  // Protection de l espace admin - verifie que l email correspond a ADMIN_EMAIL
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (!isAdmin(user.email)) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Bloque l'acces si l'email n'est pas encore confirme
    if (!emailConfirmed) {
      return NextResponse.redirect(new URL('/auth/confirm', request.url))
    }
    return response
  }

  // Protection de l espace expert
  if (pathname.startsWith('/expert')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Bloque l'accès si l'email n'est pas encore confirmé
    if (!emailConfirmed) {
      return NextResponse.redirect(new URL('/auth/confirm', request.url))
    }
    return response
  }

  // Protection des pages client connecte - redirige vers /login avec l'URL d'origine
  if (
    pathname.startsWith('/mes-demandes') ||
    pathname.startsWith('/nouvelle-demande') ||
    pathname.startsWith('/mon-compte')
  ) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    // Bloque l'accès si l'email n'est pas encore confirmé
    if (!emailConfirmed) {
      return NextResponse.redirect(new URL('/auth/confirm', request.url))
    }
    return response
  }

  // Si connecte et essaie d acceder a /login ou /register
  if (user && (pathname === '/login' || pathname === '/register')) {
    // Si l'email n'est pas confirmé, renvoie vers /auth/confirm
    if (!emailConfirmed) {
      return NextResponse.redirect(new URL('/auth/confirm', request.url))
    }
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
