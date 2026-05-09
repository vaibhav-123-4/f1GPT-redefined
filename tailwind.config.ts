import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        f1: {
          black: "#0B0B0B",
          red: "#E10600",
          white: "#FFFFFF",
          surface: "#121212",
          line: "rgba(255,255,255,0.08)",
          muted: "rgba(255,255,255,0.65)",
        },
      },
      boxShadow: {
        glow: "0 0 32px rgba(225, 6, 0, 0.22)",
      },
      keyframes: {
        pulseRail: {
          "0%, 100%": { opacity: "0.45" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        pulseRail: "pulseRail 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
