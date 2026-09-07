import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateSafeRedirect } from '@/lib/auth/redirect';

/**
 * Server-side OAuth Callback Route Handler.
 * Exchanges OAuth authorization code for a verified Supabase session cookie,
 * enforces safe internal redirect boundaries, and sanitizes failure states.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextParam = requestUrl.searchParams.get('next');
  const origin = requestUrl.origin;

  // Determine safe target redirect path (defaults to /app)
  const targetRedirect = validateSafeRedirect(nextParam, '/app');

  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // Successful code exchange -> redirect to safe authenticated route
        return NextResponse.redirect(`${origin}${targetRedirect}`);
      }
    } catch {
      // Ignore internal exception details to avoid leaking system trace
    }
  }

  // Missing code, invalid code, or exchange failure -> redirect safely to login with sanitized error flag
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
