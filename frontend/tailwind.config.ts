import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        line: "#d7dde5",
        brand: "#0f766e",
        accent: "#b45309"
      }
    }
  },
  plugins: []
};

export default config;
