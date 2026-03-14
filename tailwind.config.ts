import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          primary: "#ee652b",
          "bg-heavy": "#fcede6",
          "bg-light": "#fdfaf9",
          "border-light": "#fbe7df",
          "green-primary": "#0d9488",
          "green-bg-heavy": "#ccfbf1",
          "green-bg-light": "#f0fdfa",
          "green-border-light": "#e2e8f0",
        },
        gray: {
          primary: "#505050",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
