/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{svelte,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        softextreme: {
          "primary": "#00d4aa",
          "secondary": "#ff6b6b", 
          "accent": "#4ecdc4",
          "neutral": "#2a2a2a",
          "base-100": "#1a1a1a",
          "base-200": "#2a2a2a",
          "base-300": "#3a3a3a",
          "base-content": "#ffffff",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        },
        lemonade: {
          "primary": "#519903",
          "secondary": "#f6d860",
          "accent": "#37cdbe",
          "neutral": "#3d4451",
          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#f3f4f6",
          "base-content": "#1f2937",
          "info": "#3abff8",
          "success": "#36d399",
          "warning": "#fbbd23",
          "error": "#f87272",
        }
      }
    ],
    darkTheme: 'softextreme',
    base: true,
    styled: true,
    utils: true,
    logs: false,
    rtl: false,
    themeRoot: ':root'
  }
};

