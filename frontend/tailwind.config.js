/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#3aa1b7",
                    "50": "#effafd",
                    "100": "#cff1f6",
                    "200": "#a0e0eb",
                    "300": "#68c7da",
                    "400": "#3aa1b7",
                    "500": "#2d8da3",
                    "600": "#267287",
                    "700": "#235d6f",
                    "800": "#224d5b",
                    "900": "#1f404c",
                    "950": "#122933"
                },
                secondary: {
                    DEFAULT: "#f19a60",
                    "50": "#fef8f4",
                    "100": "#fdecd9",
                    "200": "#fbd8b0",
                    "300": "#f7bc80",
                    "400": "#f19a60",
                    "500": "#e37936",
                    "600": "#cf5d29",
                    "700": "#ac4924",
                    "800": "#8b3e24",
                    "900": "#703522",
                    "950": "#3d1a10"
                }
            }
        },
    },
    plugins: [],
}
