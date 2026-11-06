"use client";

import { useEffect, useRef } from "react";

/**
 * Autoplaying, muted, looping demo of the design studio. Playback starts
 * when the section scrolls into view and pauses again off-screen; the
 * `loop` attribute keeps it running continuously while it is visible.
 */
export function StudioVideo({ caption }: { caption: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            void video.play().catch(() => {
              // Autoplay can be refused on some devices; a static frame stays visible.
            });
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative select-none">
      <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_30px_80px_-40px_rgba(17,17,17,0.45)]">
        <video
          ref={ref}
          className="block h-auto w-full"
          style={{ aspectRatio: "1086 / 720" }}
          src="/studio-demo.webm"
          poster="/studio-poster.jpg"
          loop
          muted
          playsInline
          preload="none"
          aria-label={caption}
        />
      </div>
      <p className="mt-3 text-center text-[10px] text-ink-soft">{caption}</p>
    </div>
  );
}
