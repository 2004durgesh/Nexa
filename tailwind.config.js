/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        light: {
          text: '#11181C',
          background: '#fcfdfe',
          tint: 'var(--tintColorLight)',
          icon: '#687076',
          tabIconDefault: '#687076',
          tabIconSelected: 'var(--tintColorLight)',
        },
        dark: {
          text: '#ECEDEE',
          background: '#020407',
          tint: 'var(--tintColorDark)',
          icon: '#9BA1A6',
          tabIconDefault: '#9BA1A6',
          tabIconSelected: 'var(--tintColorDark)',
        },
      },
    },
  },
  plugins: [],
}

