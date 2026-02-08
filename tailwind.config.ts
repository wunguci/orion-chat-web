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
        },
        gray: {
          primary: "#505050",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
