import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas
  if (pathname === '/' || pathname === '/login' || pathname === '/signup-professor') {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Protege /teacher/*
  if (pathname.startsWith('/teacher')) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Busca o perfil para verificar o cargo (role)
    const { data: profile, error } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .maybeSingle() // maybeSingle evita erro se não encontrar

    // Se não houver perfil ou não for professor, redireciona para a home
    if (error || !profile || profile.role !== 'TEACHER') {
      console.log('Middleware: Acesso negado ou perfil não encontrado', { user: user.id, profile, error })
      return NextResponse.redirect(new URL('/', request.url))
    }

    return response
  }

  return response
}

export const config = {
  matcher: ['/teacher/:path*', '/app/:path*'],
}