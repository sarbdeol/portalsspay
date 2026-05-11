/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      spacing: {
        13: '3.25rem',
      },
      boxShadow: {
        glass: '0 24px 70px rgba(15, 23, 42, 0.14)',
        ios: '0 20px 50px rgba(2, 6, 23, 0.12)',
      },
      colors: {
        ink: '#101828',
        mist: '#f5f7fb',
        sspay: '#0f766e',
        roseglass: '#fff1f5',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 1.8s infinite linear',
      },
    },
  },
  plugins: [],
};
