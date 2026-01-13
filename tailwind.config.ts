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
        salvia: '#88967D',
        madera: '#C08C5B',
        blancoCrema: '#F2EEE6',
        laton: '#B8862E',
        terracota: '#BA6B55',
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
