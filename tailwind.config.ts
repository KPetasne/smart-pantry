import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        carbon: '#333333',
        terracota: '#B5522E',
        mostaza: '#E3B448',
        smoke: '#F5F5F5',
      },
    },
  },
  plugins: [],
};
export default config;
