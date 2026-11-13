/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F7F5F0",
        "paper-2": "#FBFAF7",
        surface: "#FFFFFF",
        line: "#E7E2D8",
        "line-strong": "#D6CFC1",
        ink: "#1D2A38",
        muted: "#5E6A78",
        subtle: "#8B94A0",
        brand: {
          DEFAULT: "#1B3A57",
          hover: "#24496C",
          soft: "#EAF0F5",
          50: "#F4F8FA",
        },
        approved: {
          DEFAULT: "#14784B",
          soft: "#E8F3EC",
          line: "#BEDFCA",
        },
        review: {
          DEFAULT: "#A15C07",
          soft: "#FBF1E1",
          line: "#EBD2A6",
        },
        rejected: {
          DEFAULT: "#B3261E",
          soft: "#FBEAE8",
          line: "#F0C6C2",
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        display: ['"Source Serif 4"', "ui-serif", "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(29, 42, 56, 0.05), 0 12px 32px -20px rgba(29, 42, 56, 0.25)",
        pop: "0 24px 60px -24px rgba(29, 42, 56, 0.35)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 160ms ease-out",
        "rise-in": "rise-in 220ms ease-out",
      },
    },
  },
  plugins: [],
};
