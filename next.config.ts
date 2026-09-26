import type { NextConfig } from "next";
import { securityHeaders } from "./src/lib/security/headers";

const dev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  // Lets the iOS Simulator and phones on the LAN load dev assets from this
  // machine (the dev server blocks cross-origin `/_next/*` requests otherwise).
  allowedDevOrigins: ["192.168.1.69", "*.local"],

  // Upstream error text can carry a URL, a query string or a provider message.
  // Keep it in the server log rather than in the response body.
  poweredByHeader: false,

  images: {
    // Allow the higher-quality tier used for the landing-page screenshots.
    // Next 16 rejects any `quality` value not listed here (default is 75 only).
    qualities: [75, 92],
    // Prefer modern formats so the sharper screenshots stay small on the wire.
    formats: ["image/avif", "image/webp"],
  },

  async headers() {
    return [
      // Everything, including static assets and prerendered HTML.
      { source: "/:path*", headers: securityHeaders(dev) },
    ];
  },
};

export default nextConfig;
