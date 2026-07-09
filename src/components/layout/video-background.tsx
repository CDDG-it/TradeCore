"use client";

import { useEffect, useRef } from "react";

/**
 * Ambient dashboard background video. Plays muted/looping behind every app
 * page, slowed right down so the motion reads as a subtle living texture
 * rather than a distracting clip. The raw footage is desaturated and pushed
 * into the site palette (deep navy base + turquoise/cyan wash) by the overlay
 * layers, so it never fights the UI on top of it.
 */
export function VideoBackground() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    // Slow the clip down — the source plays too fast to feel ambient.
    el.playbackRate = 0.35;
    // Autoplay can be deferred by the browser until it's ready; re-assert once
    // metadata loads so the rate sticks even after a late play().
    const apply = () => { el.playbackRate = 0.35; };
    el.addEventListener("loadedmetadata", apply);
    return () => el.removeEventListener("loadedmetadata", apply);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src="/dashboard-bg.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          // Strip the footage's native colour and dim it so only the motion
          // survives to be recoloured by the overlays below.
          filter: "grayscale(1) brightness(0.6) contrast(1.1)",
          opacity: 0.5,
        }}
      />
      {/* Turquoise/cyan wash — tints the grey motion into the brand palette. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(20,184,166,0.35) 0%, rgba(6,182,212,0.24) 50%, rgba(20,184,166,0.18) 100%)",
          mixBlendMode: "color",
        }}
      />
      {/* Deep-navy veil — anchors everything to the app background (#0B1120)
          and keeps contrast high for the UI layered on top. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(11,17,32,0.42) 0%, rgba(11,17,32,0.72) 55%, rgba(11,17,32,0.9) 100%)",
        }}
      />
    </div>
  );
}
