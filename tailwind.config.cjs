const { addDynamicIconSelectors } = require('@iconify/tailwind')
const defaultTheme = require('tailwindcss/defaultTheme')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{html,js,jsx,ts,tsx,astro,vue,svelte,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Clear Sans', 'Helvetica Neue', ...defaultTheme.fontFamily.sans],
      },
      screens: {
        '2xs': '375px',
        xs: '475px',
        sm: '640px',
        mb: '520px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
      },
      colors: {
        'page-bg': {
          light: '#776e65',
          dark: '#776e65',
        },
        'grid-bg': {
          light: '#bbada0',
          dark: '#bbada0',
          DEFAULT: '#bbada0',
        },
        'grid-cell': {
          light: '#cdc1b4',
          DEFAULT: '#cdc1b4',
          dark: '#cdc1b4',
        },
      },
    },
  },
  plugins: [require('daisyui'), addDynamicIconSelectors()],
  daisyui: {
    logs: false,
    themes: [
      {
        light: {
          ...require('daisyui/src/theming/themes')['light'],
          'base-content': 'black',
          primary: '#10aebd',
          secondary: '#42DEE1',
          accent: '#e64215',
          neutral: 'black',
        },
        dark: {
          ...require('daisyui/src/theming/themes')['dark'],
          'base-content': 'white',
          primary: 'red',
          accent: 'red',
          neutral: 'white',
        },
      },
    ],
  },
}
