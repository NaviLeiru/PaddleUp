import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
    },
    extend: {
      colors: {
        background: "#EBECE8",
        nav: "#1E222B",
        accent: "#FBA01E",
        link: "#235C5E",
        card: "#ffffff",
        border: "#E7E7E1",
      },
      fontFamily: {
        heading: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-hanken-grotesk)", "sans-serif"],
      },
      borderRadius: {
        card: "20px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
