/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MONOKAI Primary (Pink/Magenta)
        primary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#F92672', // MONOKAI Pink
          600: '#E11D62',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },
        // MONOKAI Dark backgrounds
        dark: {
          950: '#1E1F1A',
          900: '#272822', // MONOKAI 메인 배경
          800: '#2D2E27',
          700: '#3E3D32',
          600: '#49483E',
        },
        // MONOKAI 시맨틱 색상
        monokai: {
          bg: '#272822',
          fg: '#F8F8F2',
          pink: '#F92672',
          green: '#A6E22E',
          cyan: '#66D9EF',
          yellow: '#E6DB74',
          orange: '#FD971F',
          purple: '#AE81FF',
          comment: '#75715E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Pretendard', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // 12.5% 증가된 폰트 크기
        'xs': ['0.84375rem', { lineHeight: '1.5' }],    // 13.5px (was 12px)
        'sm': ['0.984375rem', { lineHeight: '1.6' }],   // 15.75px (was 14px)
        'base': ['1.125rem', { lineHeight: '1.7' }],    // 18px (was 16px)
        'lg': ['1.265625rem', { lineHeight: '1.75' }],  // 20.25px (was 18px)
        'xl': ['1.40625rem', { lineHeight: '1.75' }],   // 22.5px (was 20px)
        '2xl': ['1.6875rem', { lineHeight: '2' }],      // 27px (was 24px)
        '3xl': ['2.025rem', { lineHeight: '2.25' }],    // 32.4px (was 30px)
        '4xl': ['2.53125rem', { lineHeight: '2.5' }],   // 40.5px (was 36px)
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
}
