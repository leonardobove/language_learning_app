import { useEffect, useRef, useState } from "react";

/**
 * Audio player that auto-plays on desktop and shows a tap-to-play button
 * on mobile (where autoplay is blocked by browser policy).
 */
export default function AudioPlayer({ src, onEnded }) {
  const audioRef = useRef(null);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    if (!src) {
      setNeedsTap(false);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = src;
    audio.play().catch(() => {
      // Autoplay blocked (common on mobile) — show tap button
      setNeedsTap(true);
    });
  }, [src]);

  useEffect(() => {
    return () => {
      if (src && src.startsWith("blob:")) {
        URL.revokeObjectURL(src);
      }
    };
  }, [src]);

  function handleTap() {
    const audio = audioRef.current;
    if (!audio) return;
    setNeedsTap(false);
    audio.play().catch(() => {});
  }

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => {
          setNeedsTap(false);
          onEnded?.();
        }}
        style={{ display: "none" }}
        aria-hidden="true"
      />

      {needsTap && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 animate-fadeInUp">
          <button
            onClick={handleTap}
            className="flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-sm font-semibold
              bg-accent text-background hover:bg-accentHover active:scale-95 transition-all"
          >
            {/* Speaker icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0013 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06C18.01 19.86 21 16.28 21 12c0-4.28-2.99-7.86-7-8.77z" />
            </svg>
            Tap to hear
          </button>
        </div>
      )}
    </>
  );
}
