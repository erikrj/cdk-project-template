/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{html,js,ts,jsx,tsx,mdx}'],
  variants: {
    extend: {
      backgroundColor: ['active'],
      scale: ['active'],
    },
  },
  darkMode: 'selector',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#162337',
          green: '#2AB474',
          primary: '#B72C27',
          secondary: '#575757',
        },
        neutral: {
          '950': '#0a0a0a', // b - 4%
          '900': '#171717', // b - 9%
          '850': '#1f1f1f', // b - 12%
          '800': '#262626', // b - 15%
          '750': '#2e2e2e', // b - 18%
          '700': '#404040', // b - 25%
          '650': '#4a4a4a', // b - 29%
          '600': '#525252', // b - 32%
          '550': '#5b5b5b', // b - 36%
          '500': '#737373', // b - 45%
          '450': '#8c8c8c', // b - 55%
          '400': '#a3a3a3', // b - 64%
          '350': '#b9b9b9', // b - 73%
          '300': '#d4d4d4', // b - 83%
          '250': '#dbdbdb', // b - 86%
          '200': '#e5e5e5', // b - 90%
          '150': '#ededed', // b - 93%
          '100': '#f5f5f5', // b - 96%
          '50': '#fafaf9', // b - 98%
        },
      },
      opacity: {
        // cg: {
        '00dp': '0',
        '01dp': '.05',
        '02dp': '.07',
        '03dp': '.08',
        '0p4dp': '.09',
        '06dp': '.11',
        '08dp': '.12',
        '12dp': '.14',
        '16dp': '.15',
        '24dp': '.16',
        // }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      width: {
        '10%': '10%',
        '20%': '20%',
        '30%': '30%',
        '40%': '40%',
        '50%': '50%',
        '60%': '60%',
        '70%': '70%',
        '80%': '80%',
        '90%': '90%',
        '100%': '100%',
      },
    },
    animation: {
      'spin-slow': 'spin 2s linear infinite',
    },
  },
  plugins: [
    function ({addUtilities}: {addUtilities: any}) {
      const newUtilities = {
        '.placeholder-opacity-50::placeholder': {
          opacity: '0.5',
        },
        /* Add as many as you need */
      };
      addUtilities(newUtilities, ['responsive', 'hover']);
    },
  ],
};
