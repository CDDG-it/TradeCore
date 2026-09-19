import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets the iOS Simulator and phones on the LAN load dev assets from this
  // machine (the dev server blocks cross-origin `/_next/*` requests otherwise).
  allowedDevOrigins: ["192.168.1.69", "*.local"],
  images: {
    // Allow the higher-quality tier used for the landing-page screenshots.
    // Next 16 rejects any `quality` value not listed here (default is 75 only).
    qualities: [75, 92],
    // Prefer modern formats so the sharper screenshots stay small on the wire.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
