/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        apple: {
          green: '#34C759',
          orange: '#FF9500',
          red: '#FF3B30',
          blue: '#007AFF',
          dark: '#1D1D1F',
          gray: '#6E6E73',
          surface: '#F5F5F7',
          border: '#E5E5EA',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"',
          '"Pretendard"', '"Noto Sans KR"', 'sans-serif',
        ],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
