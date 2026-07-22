import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that don't require auth
  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route
  );

  const withAuthCookies = (url: URL) => {
    // Carry any refreshed auth cookies onto the redirect so the session
    // isn't dropped along the way.
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(({ name, value }) =>
      redirectResponse.cookies.set(name, value)
    );
    return redirectResponse;
  };

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return withAuthCookies(url);
  }

  // Already signed in? /login and /signup would only confuse ("Opret konto"
  // while logged in) — send the user to their own area instead.
  const authPages = ['/login', '/signup'];
  if (user && authPages.includes(request.nextUrl.pathname)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? user.user_metadata?.role;
    let destination: string | null = null;
    switch (role) {
      case 'student':
        destination = profile?.onboarding_completed ? '/student/feed' : '/student/onboarding';
        break;
      case 'store_manager':
        destination = '/manager/feed';
        break;
      case 'school_admin':
      case 'super_admin':
        destination = '/dashboard';
        break;
    }

    if (destination) {
      const url = request.nextUrl.clone();
      url.pathname = destination;
      return withAuthCookies(url);
    }
  }

  return supabaseResponse;
}
