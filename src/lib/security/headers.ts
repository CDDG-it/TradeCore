/**
 * The security headers every response carries.
 *
 * Applied from `next.config.ts`, so they cover static assets and prerendered
 * pages as well as the dynamic ones: a header set only in the proxy would miss
 * everything the proxy matcher excludes.
 *
 * The policy is deliberately built without a nonce. A nonce has to be read per
 * request in the root layout, and `headers()` there would opt every currently
 * static page (the landing page, pricing, terms, the trader pages) into
 * dynamic rendering. The origin allowlists below are what actually stop an
 * injected script from loading code or shipping data somewhere else, and those
 * work without one.
 */

/** Where the browser is allowed to talk to us: Supabase, over https and wss. */
function supabaseOrigins(): string[] {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return [];
  try {
    const { origin, host } = new URL(url);
    // Realtime opens a websocket against the same host.
    return [origin, `wss://${host}`];
  } catch {
    return [];
  }
}

export function contentSecurityPolicy(dev: boolean): string {
  const supabase = supabaseOrigins();
  /* `data:` and `blob:` are not network destinations: a script can only fetch
     one it is already holding, so allowing them here lets nothing out. The app
     needs both, because it turns a pasted screenshot into a file by fetching
     its own data URL, and the screenshot migration does the same to move a
     base64 image into Storage. Without them that work fails with a policy
     violation rather than an error anyone would recognise. */
  const connect = [
    "'self'",
    "data:",
    "blob:",
    ...supabase,
    /* Development only: the dev server pushes rebuilds over a websocket, and
       `'self'` does not cover a different scheme, so without this every edit
       stops reaching the browser and the page has to be reloaded by hand.
       `ws:` is unencrypted by definition and has no business in production. */
    ...(dev ? ["ws:"] : []),
  ];
  const img = ["'self'", "data:", "blob:", ...supabase.filter((o) => o.startsWith("https:"))];

  const directives: Record<string, string[] | null> = {
    "default-src": ["'self'"],

    // 'unsafe-inline' is unavoidable without a nonce: Next.js streams the RSC
    // payload through inline scripts, and the theme script in the root layout
    // has to run before the first paint. What this directive still buys is the
    // origin list: an injected <script src="..."> pointing anywhere else is
    // refused. 'unsafe-eval' is a development-only concession to React Refresh.
    "script-src": ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],

    // Tailwind and Motion both write inline styles.
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": img,
    "font-src": ["'self'", "data:"],
    "connect-src": connect,

    // Nothing here embeds anything, and nothing may embed us: this is the
    // clickjacking defence for the whole signed-in app.
    "frame-src": ["'none'"],
    "frame-ancestors": ["'none'"],
    "object-src": ["'none'"],

    // Stops an injected <base> from re-pointing every relative URL, and stops
    // a form from being retargeted at someone else's collector.
    "base-uri": ["'self'"],
    "form-action": ["'self'"],

    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],

    // No value; only outside development, where http://localhost is the point.
    ...(dev ? {} : { "upgrade-insecure-requests": null }),
  };

  return Object.entries(directives)
    .map(([name, values]) => (values === null ? name : `${name} ${values.join(" ")}`))
    .join("; ");
}

export function securityHeaders(dev: boolean): { key: string; value: string }[] {
  return [
    { key: "Content-Security-Policy", value: contentSecurityPolicy(dev) },

    // Belt and braces next to frame-ancestors, for anything that predates CSP.
    { key: "X-Frame-Options", value: "DENY" },

    // No MIME sniffing: an uploaded file served as text must not be run as a
    // script because its bytes happen to look like one.
    { key: "X-Content-Type-Options", value: "nosniff" },

    // Privacy: other sites learn which site the visitor came from, never which
    // page. Journal and account URLs carry row ids.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

    // The app asks for none of these, so no embedded content can either.
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },

    // Keep this origin off other sites' shared browsing-context groups.
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "X-DNS-Prefetch-Control", value: "off" },

    // Two years, subdomains included. Only meaningful over https, so it is
    // left off in development.
    ...(dev
      ? []
      : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
  ];
}
