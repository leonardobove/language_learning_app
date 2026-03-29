/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0d0f14",
        surface: "#161a23",
        surfaceHover: "#1e2330",
        border: "#2a2f3d",
        accent: "#f5a623",
        accentHover: "#e09415",
        accentLight: "#ffd280",
        textPrimary: "#f0f0f5",
        textSecondary: "#8b8fa8",
        textMuted: "#4e5368",
        danger: "#e05555",
        success: "#4caf7a",
      },
      fontFamily: {
        heading: ['"Playfair Display"', "serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
      keyframes: {
        pulse_ring: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.6" },
          "50%": { transform: "scale(1.35)", opacity: "0" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInLeft: {
          "0%": { opacity: "0", transform: "translateX(-16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        fadeInRight: {
          "0%": { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        wordFade: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        pulse_ring: "pulse_ring 1.4s ease-out infinite",
        fadeInUp: "fadeInUp 0.35s ease both",
        fadeInLeft: "fadeInLeft 0.3s ease both",
        fadeInRight: "fadeInRight 0.3s ease both",
        wordFade: "wordFade 0.2s ease both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};
