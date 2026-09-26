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

/**
 * Private testing: only these accounts reach the signed-in app. Everyone else
 * can still register, and lands on /waitlist once signed in.
 *
 * Kept in an environment variable rather than a table on purpose: this runs on
 * every request, and a database read here would cost a query per navigation.
 * An unset or empty list means the gate is off, so a missing variable can
 * never lock the owner out of their own app.
 */
function allowlist(): Set<string> | null {
  const raw = process.env.ALLOWED_EMAILS?.trim();
  if (!raw) return null;
  const emails = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.length ? new Set(emails) : null;
}

/** A refusal an API caller can actually parse, and that nothing may cache. */
function deny(status: number, message: string): NextResponse {
  return NextResponse.json(
    { error: message },
    { status, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
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

  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  // Protected routes: redirect to login if not authenticated
  const isAuthPage =
    path === "/login" ||
    path === "/signup" ||
    path === "/reset-password" ||
    path.startsWith("/auth/");
  // Market data that is the same for everyone, plus the Supabase email hook,
  // which authenticates itself with its own shared secret. Everything else
  // under /api is the signed-in product and is gated like the pages are.
  const isOpenApi =
    path.startsWith("/api/gmi/") ||
    path === "/api/prices" ||
    path === "/api/cot" ||
    path === "/api/bonds" ||
    path === "/api/auth/send-email";

  const isPublicPage =
    path === "/" ||
    path === "/privacy" ||
    path === "/terms" ||
    path === "/pricing" ||
    path === "/waitlist" ||
    path.startsWith("/traders/") ||
    isOpenApi ||
    // Dev-only preview of signed-in screens with sample data (see app/(app)/preview).
    (process.env.NODE_ENV !== "production" && path.startsWith("/preview/"));

  if (!user && !isAuthPage && !isPublicPage) {
    // A fetch wants an answer it can read, not the HTML of the login page.
    if (isApi) return deny(401, "Not signed in");
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Private testing gate. Applied after the login check, so an outsider sees
  // the waiting page rather than a login loop, and only on the app's own
  // routes: the public site and the auth pages stay reachable.
  const allowed = allowlist();
  if (user && allowed && !allowed.has(user.email?.toLowerCase() ?? "")) {
    if (!isPublicPage && !isAuthPage) {
      // The API is gated here as well. Without this an account that is held on
      // the waiting page could still drive the product straight through
      // /api/broker/*, which is the whole thing the gate exists to prevent.
      if (isApi) return deny(403, "This account is not enabled yet");
      const url = request.nextUrl.clone();
      url.pathname = "/waitlist";
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages, but NOT from
  // /auth/update-password, which requires an active session to work.
  if (user && isAuthPage && path !== "/auth/update-password") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
