/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "neon-blue": "#00ffff",
        "neon-pink": "#ff00ff",
        "neon-green": "#00ff00",
        "neon-purple": "#9900ff",
        "neon-yellow": "#ffff00",
        "dark-blue": "#050a30",
        "medium-blue": "#0a1852",
        "terminal-green": "#00ff9d",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      animation: {
        pulse: "pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.3 },
        },
      },
      animationDelay: {
        100: "100ms",
        200: "200ms",
        300: "300ms",
        400: "400ms",
        500: "500ms",
      },
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      const animationDelays = theme("animationDelay", {});
      const utilities = Object.entries(animationDelays).map(([key, value]) => {
        return {
          [`.animation-delay-${key}`]: {
            "animation-delay": value,
          },
        };
      });
      addUtilities(utilities);
    },
  ],
};
