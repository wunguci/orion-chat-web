import type { Config } from 'tailwindcss';

export default {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                orange: {
                    primary: '#ee652b',
                    'bg-heavy': '#fcede6',
                    'bg-light': '#fdfaf9',
                    'border-light': '#fbe7df',
                    'green-primary': '#226262',
                    'green-bg-heavy': '#D6F2F2',
                    'green-bg-light': '#F4FFFF',
                    'green-border-light': '#D6F2F2',
                },
                gray: {
                    primary: '#505050',
                },
            },
        },
    },
    plugins: [],
} satisfies Config;
