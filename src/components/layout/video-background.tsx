"use client";

import { usePathname } from "next/navigation";

const VIDEOS = [
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_145119_f4ec4d9f-3ecd-4116-baa3-26e8cf2df976.mp4",
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260322_013248_a74099a8-be2b-4164-a823-eddd5e149fa1.mp4",
];

function pickVideo(_pathname: string): string {
  return VIDEOS[2];
}

export function VideoBackground() {
  const pathname = usePathname();
  const src = pickVideo(pathname);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <video
        key={src}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          opacity: 0.38,
          // Warm orange/white colour grade: desaturate slightly then push warm
          filter: "sepia(0.75) saturate(3.5) hue-rotate(10deg) brightness(0.80)",
        }}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Dark vignette — keeps edges dark, centre more visible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 90% at 50% 50%, rgba(7,4,2,0.18) 0%, rgba(7,4,2,0.70) 100%)",
        }}
      />
      {/* Orange radial bloom from top */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(249,115,22,0.30) 0%, transparent 70%)",
        }}
      />
      {/* Full orange wash */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(180,70,0,0.22)" }}
      />
      {/* Subtle grain */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </div>
  );
}
