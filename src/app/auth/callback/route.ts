import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user to determine redirect
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', user.id)
          .single();

        const role = profile?.role || user.user_metadata?.role;
        const onboardingDone = profile?.onboarding_completed ?? false;

        let redirectTo = next;

        if (next === '/') {
          switch (role) {
            case 'student':
              redirectTo = onboardingDone ? '/student/feed' : '/student/onboarding';
              break;
            case 'store_manager':
              redirectTo = onboardingDone ? '/manager/feed' : '/manager/store';
              break;
            case 'school_admin':
            case 'super_admin':
              redirectTo = '/dashboard';
              break;
            default:
              redirectTo = '/';
          }
        }

        return NextResponse.redirect(`${origin}${redirectTo}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
