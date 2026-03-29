import { useEffect, useRef } from "react";

export default function MicButton({ recording, onClick, disabled }) {
  const btnRef = useRef(null);

  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings when recording */}
      {recording && (
        <>
          <span className="absolute w-24 h-24 rounded-full bg-red-500 opacity-30 animate-ping" />
          <span
            className="absolute w-20 h-20 rounded-full bg-red-500 opacity-20"
            style={{ animation: "pulse_ring 1.4s ease-out infinite 0.3s" }}
          />
        </>
      )}

      <button
        ref={btnRef}
        onClick={onClick}
        disabled={disabled}
        className={`
          relative z-10 w-16 h-16 rounded-full flex items-center justify-center
          transition-all duration-200 shadow-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background
          ${disabled ? "opacity-40 cursor-not-allowed bg-textMuted" : ""}
          ${
            recording
              ? "bg-red-500 focus:ring-red-500 glow-accent-strong scale-110"
              : !disabled
              ? "bg-accent hover:bg-accentHover focus:ring-accent glow-accent hover:scale-105 active:scale-95"
              : ""
          }
        `}
        aria-label={recording ? "Stop recording" : "Start recording"}
      >
        {recording ? (
          /* Stop icon */
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          /* Mic icon */
          <svg
            className="w-6 h-6 text-background"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm-1 16.93A8.001 8.001 0 0 1 4 11H2a10 10 0 0 0 9 9.95V23h2v-2.05A10 10 0 0 0 22 11h-2a8.001 8.001 0 0 1-7 6.93z" />
          </svg>
        )}
      </button>
    </div>
  );
}
