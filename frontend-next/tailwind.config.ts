import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "dark-blue": "var(--dark-blue)",
        "medium-blue": "var(--medium-blue)",
        "light-blue": "var(--light-blue)",
        "neon-blue": "var(--neon-blue)",
        "neon-purple": "var(--neon-purple)",
        "neon-pink": "var(--neon-pink)",
        "neon-green": "var(--neon-green)",
        "neon-yellow": "var(--neon-yellow)",
        "terminal-green": "var(--terminal-green)",
      },
      backgroundImage: {
        "grid-pattern": "var(--grid-color)",
      },
      fontFamily: {
        mono: ["var(--monospace-font)"],
        orbitron: ["Orbitron", "sans-serif"],
      },
      animation: {
        blink: "blink 1s infinite",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      boxShadow: {
        neon: "0 0 5px var(--neon-blue), 0 0 10px var(--neon-blue)",
        "neon-inset":
          "0 0 5px var(--neon-blue), inset 0 0 5px var(--neon-blue)",
        "neon-pink": "0 0 5px var(--neon-pink), 0 0 10px var(--neon-pink)",
        "neon-purple":
          "0 0 5px var(--neon-purple), 0 0 10px var(--neon-purple)",
      },
      textShadow: {
        neon: "0 0 5px var(--neon-blue), 0 0 10px var(--neon-blue)",
      },
      spacing: {
        "terminal-padding": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
