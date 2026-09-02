"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const CLOUDINARY_VIDEO_URL =
  "https://res.cloudinary.com/dvwqtmjk0/video/upload/f_auto,q_auto:good/v1788308541/copy_6488C294-38F8-4FAD-B1A5-807E522BA84B_qbuaab.mov";

const CLOUDINARY_POSTER_URL =
  "https://res.cloudinary.com/dvwqtmjk0/video/upload/f_jpg,q_auto:good,so_0/v1788308541/copy_6488C294-38F8-4FAD-B1A5-807E522BA84B_qbuaab.jpg";

export function PrizeFooterVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncMotionPreference = () => {
      setPrefersReducedMotion(motionQuery.matches);

      if (!video) {
        return;
      }

      if (motionQuery.matches) {
        video.pause();
        video.currentTime = 0;
        return;
      }

      void video.play().catch(() => {
        // Browsers can deny programmatic playback even when autoplay is allowed.
      });
    };

    syncMotionPreference();
    motionQuery.addEventListener("change", syncMotionPreference);

    return () => {
      motionQuery.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  function toggleSound() {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);

    if (!nextMuted && !prefersReducedMotion && video.paused) {
      void video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
      });
    }
  }

  return (
    <div
      aria-label="Video de Sofia para la rifa SOFI'S 3D ART"
      className="relative mt-5 aspect-[9/13] min-h-[430px] overflow-hidden rounded-[8px] bg-neutral-100 bg-cover bg-center sm:aspect-[4/3] sm:min-h-[360px] md:aspect-[4/3] lg:aspect-[16/9] lg:max-h-[620px]"
      style={{ backgroundImage: `url(${CLOUDINARY_POSTER_URL})` }}
    >
      {!hasVideoError ? (
        <video
          ref={videoRef}
          aria-label="Sofi presentando la rifa de SOFI'S 3D ART"
          autoPlay
          className="h-full w-full object-cover object-[50%_52%] sm:object-[50%_50%] lg:object-[50%_56%]"
          disablePictureInPicture
          loop
          muted
          onError={() => setHasVideoError(true)}
          onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
          playsInline
          poster={CLOUDINARY_POSTER_URL}
          preload="metadata"
        >
          <source src={CLOUDINARY_VIDEO_URL} />
          Tu navegador no puede reproducir este video.
        </video>
      ) : null}
      {!hasVideoError ? (
        <button
          aria-label={
            isMuted
              ? "Activar sonido del video de Sofia"
              : "Silenciar el video de Sofia"
          }
          aria-pressed={!isMuted}
          className="absolute bottom-3 right-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-full border border-white/60 bg-white/88 px-4 text-sm font-black text-ink shadow-soft backdrop-blur-md transition hover:bg-white focus:outline-none focus:ring-4 focus:ring-pink-soft sm:bottom-4 sm:right-4"
          onClick={toggleSound}
          type="button"
        >
          {isMuted ? (
            <VolumeX aria-hidden className="h-[18px] w-[18px]" strokeWidth={2.5} />
          ) : (
            <Volume2 aria-hidden className="h-[18px] w-[18px]" strokeWidth={2.5} />
          )}
          <span>{isMuted ? "Activar sonido" : "Silenciar"}</span>
        </button>
      ) : null}
    </div>
  );
}
