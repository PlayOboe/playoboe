import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#0c1f17",
        pine: "#14312a",
        moss: "#1d4435",
        sage: "#27704f",
        leaf: "#3c9670",
        mint: "#7fc9a3",
        copper: "#c4a35a",
        brass: "#ddc48a",
        cream: "#eef3ec",
        muted: "#a9bdb2",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
