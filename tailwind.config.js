/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{svelte,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        forest: {
          primary: "oklch(62% 0.194 149.214)",
          "primary-content": "oklch(98% 0.018 155.826)",
          secondary: "oklch(55% 0.288 302.321)",
          "secondary-content": "oklch(97% 0.014 308.299)",
          accent: "oklch(59% 0.249 0.584)",
          "accent-content": "oklch(97% 0.014 343.198)",
          neutral: "oklch(20% 0 0)",
          "neutral-content": "oklch(98% 0 0)",
          "base-100": "oklch(14% 0 0)",
          "base-200": "oklch(20% 0 0)",
          "base-300": "oklch(26% 0 0)",
          "base-content": "oklch(97% 0 0)",
          info: "oklch(70% 0.165 254.624)",
          "info-content": "oklch(28% 0.091 267.935)",
          success: "oklch(84% 0.238 128.85)",
          "success-content": "oklch(27% 0.072 132.109)",
          warning: "oklch(75% 0.183 55.934)",
          "warning-content": "oklch(26% 0.079 36.259)",
          error: "oklch(70% 0.191 22.216)",
          "error-content": "oklch(25% 0.092 26.042)",
        },
      },
    ],
    darkTheme: "forest",
    base: true,
    styled: true,
    utils: true,
    logs: false,
    rtl: false,
    themeRoot: ":root",
  },
};
