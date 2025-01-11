import { addDynamicIconSelectors } from "@iconify/tailwind"
import daisyui from "daisyui"
import { fontFamily } from "tailwindcss/defaultTheme"

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: ["./src/**/*.{html,js,jsx,ts,tsx,astro,vue,svelte,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Clear Sans", "Helvetica Neue", ...fontFamily.sans],
      },
      screens: {
        "2xs": "375px",
        xs: "475px",
        "2xl": "1536px",
        "3xl": "1920px",
      },
      colors: {
        "page-bg": "#776e65",
        "grid-bg": "#bbada0",
        "grid-cell": "#cdc1b4",
      },
    },
  },
  plugins: [addDynamicIconSelectors(), require("tailwindcss-animate"), daisyui],
  daisyui: {
    logs: false,
    themes: [
      {
        dark: {
          ...require("daisyui/src/theming/themes").night,
          "base-content": "white",
          primary: "hsl(15, 91%, 60%)",
          neutral: "white",
        },
      },
    ],
  },
}

export default config
