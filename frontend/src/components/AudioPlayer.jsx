import { useEffect, useRef } from "react";

/**
 * Hidden audio player that auto-plays when src changes.
 */
export default function AudioPlayer({ src, onEnded }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = src;
    audio.play().catch((err) => {
      console.warn("Audio autoplay blocked:", err);
    });
  }, [src]);

  useEffect(() => {
    return () => {
      // Clean up object URLs
      if (src && src.startsWith("blob:")) {
        URL.revokeObjectURL(src);
      }
    };
  }, [src]);

  return (
    <audio
      ref={audioRef}
      onEnded={onEnded}
      style={{ display: "none" }}
      aria-hidden="true"
    />
  );
}
