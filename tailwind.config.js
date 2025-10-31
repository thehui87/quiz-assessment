// tailwind.config.js
/** @type {import('tailwindcss').Config} */
import lineClamp from "@tailwindcss/line-clamp";

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}", // Next.js 13+ App Router
    "./pages/**/*.{js,ts,jsx,tsx,mdx}", // Next.js Pages Router
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [lineClamp],
};
