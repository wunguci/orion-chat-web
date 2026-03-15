/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{js,jsx,ts,tsx}',
        './app/**/*.{js,jsx,ts,tsx}',
        './components/**/*.{js,jsx,ts,tsx}',
    ],
    theme: {
        extend: {
            colors: {
                'orange-primary': '#ee652b',
                'orange-bg-heavy': '#fcede6',
                'orange-bg-light': '#fdfaf9',
                'orange-border-light': '#fbe7df',
                'gray-primary': '#505050',
                'gray-border': '#EFF4F8',
                'gray-secondary': '#94a3b8',
                'blue-dark': '#0052cc',
                'green-primary': '#226262',
                'green-hover': '#004444',
                'green-bg-heavy': '#D6F2F2',
                'green-bg-light': '#F4FFFF',
                'green-border-light': '#D6F2F2',
                'green-message': '#007c7c',
            },
        },
    },
    plugins: [],
};
