import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Whether the access token was signed with an asymmetric key (ES256/RS256).
 * Those can be verified here without a round trip; a legacy HS256 token can
 * only be checked by the Auth server, which is the per-request network call
 * this middleware exists to avoid.
 */
function signedAsymmetrically(jwt: string): boolean {
  try {
    const header = JSON.parse(atob(jwt.split(".")[0].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof header.alg === "string" && !header.alg.startsWith("HS");
  } catch {
    return false;
  }
}

export async function updateSession(request: NextRequest) {
  // Without Supabase configured there is nothing to gate against: let the
  // request through rather than lock every route behind a login that cannot
  // work.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  // Route gating: read the session from the cookie rather than asking the
  // Auth server on every navigation (the main source of slow page loads).
  // This still refreshes an expired token, which persists via setAll above.
  //
  // A cookie is the caller's to forge, so the token is then verified against
  // the project's public signing key (cached in-process after the first
  // fetch): a made-up session no longer reaches the app shell. Projects still
  // on the legacy shared secret have no local way to verify and keep the
  // unverified read; data access is protected by row-level security either
  // way, since Postgres verifies every token itself.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let user = session?.user ?? null;

  if (session && signedAsymmetrically(session.access_token)) {
    const { data: claims, error } = await supabase.auth.getClaims(session.access_token);
    if (error || !claims) user = null;
  }

  // Protected routes: redirect to login if not authenticated
  const isAuthPage =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname === "/signup" ||
    request.nextUrl.pathname === "/reset-password" ||
    request.nextUrl.pathname.startsWith("/auth/");
  const isPublicPage =
    request.nextUrl.pathname === "/" ||
    request.nextUrl.pathname === "/privacy" ||
    request.nextUrl.pathname === "/terms" ||
    request.nextUrl.pathname === "/coming-soon" ||
    request.nextUrl.pathname === "/pricing" ||
    request.nextUrl.pathname.startsWith("/features/") ||
    request.nextUrl.pathname.startsWith("/api/") ||
    // Dev-only preview of signed-in screens with sample data (see app/(app)/preview).
    (process.env.NODE_ENV !== "production" && request.nextUrl.pathname.startsWith("/preview/"));

  if (!user && !isAuthPage && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages, but NOT from
  // /auth/update-password, which requires an active session to work.
  if (user && isAuthPage && request.nextUrl.pathname !== "/auth/update-password") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
