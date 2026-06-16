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
        coffee: {
          50: '#FAF9F6',
          100: '#F3F1E2',
          200: '#E8E3D1',
          300: '#D4C4AC',
          400: '#C4A882',
          500: '#8B7355',
          600: '#6F4E37',
          700: '#5C3D2E',
          800: '#3E2723',
          900: '#2C1810',
          dark: '#3E2B21', /* Exact dark brown for sidebar */
        },
        beige: {
          50: '#FCF9F2', /* Main bg color */
          100: '#F5EFE6',
          200: '#EAE6D5',
          300: '#E0D9C5',
          400: '#D4C4AC',
          500: '#C5B79E',
        },
        cream: {
          50: '#FFFDFB',
          100: '#FFF8DC',
          200: '#FFF4CC',
          300: '#FFEEBB',
        },
        gold: {
          400: '#E5B887',
          500: '#D4A373',
          600: '#C4936B',
          700: '#B08054',
        },
        sage: {
          500: '#00704A',
          600: '#005A3C',
          700: '#004A31',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'premium': '0 4px 20px rgba(62, 39, 35, 0.08), 0 2px 8px rgba(111, 78, 55, 0.04)',
        'premium-lg': '0 10px 40px rgba(62, 39, 35, 0.12), 0 4px 16px rgba(111, 78, 55, 0.08)',
      },
    },
  },
  plugins: [],
};
