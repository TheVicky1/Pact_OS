import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware session handler and route protection gateway.
 * Evaluates session validity server-side before serving protected routes.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not run code between createServerClient and getUser().
  // getUser() sends a network request to Supabase Auth to re-validate JWT server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();
  const isAuthRoute = url.pathname.startsWith('/login') || url.pathname.startsWith('/register');
  const isProtectedRoute = url.pathname.startsWith('/app') || url.pathname.startsWith('/profile');

  // 1. Unauthenticated user trying to access protected routes -> Redirect to landing with signin mode
  if (!user && isProtectedRoute) {
    url.pathname = '/';
    url.search = '?auth=signin';
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user trying to access auth or landing -> Redirect to protected app root
  if (user && (isAuthRoute || url.pathname === '/')) {
    url.pathname = '/app';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
