/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0c1b30',
          800: '#142B4A', // primary navy
          700: '#1E3A5F', // secondary navy
          600: '#284d7a',
          100: '#e8edf5',
          50: '#f2f6fa',
        },
        primary: {
          DEFAULT: '#142B4A',
          hover: '#0e1f36',
          light: '#1E3A5F',
        },
        accent: {
          DEFAULT: '#2563EB',
          hover: '#1d4ed8',
          light: '#dbeafe',
        },
        surface: '#FFFFFF',
        slatebg: '#F5F7FB',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(20, 43, 74, 0.05), 0 1px 2px 0 rgba(20, 43, 74, 0.03)',
        card: '0 4px 6px -1px rgba(20, 43, 74, 0.07), 0 2px 4px -1px rgba(20, 43, 74, 0.04)',
        elevated: '0 10px 15px -3px rgba(20, 43, 74, 0.1), 0 4px 6px -2px rgba(20, 43, 74, 0.05)',
      }
    },
  },
  plugins: [],
}
