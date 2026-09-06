/** @type {import('tailwindcss').Config} */
// Consumes apps/web/src/styles/tokens.css's CSS variables per ARCHITECTURE.md
// §5 — theme values here are all var(--...) references, never literal
// hex/px, so tokens.css remains the single source of truth.
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--surface-canvas)",
        raised: "var(--surface-raised)",
        sunken: "var(--surface-sunken)",
        border: {
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
        ink: {
          50: "var(--color-ink-50)",
          100: "var(--color-ink-100)",
          200: "var(--color-ink-200)",
          300: "var(--color-ink-300)",
          400: "var(--color-ink-400)",
          500: "var(--color-ink-500)",
          600: "var(--color-ink-600)",
          700: "var(--color-ink-700)",
          800: "var(--color-ink-800)",
          900: "var(--color-ink-900)",
          950: "var(--color-ink-950)",
        },
        accent: {
          100: "var(--color-accent-100)",
          400: "var(--color-accent-400)",
          500: "var(--color-accent-500)",
          600: "var(--color-accent-600)",
          700: "var(--color-accent-700)",
        },
        success: { 100: "var(--color-success-100)", 600: "var(--color-success-600)" },
        warning: { 100: "var(--color-warning-100)", 600: "var(--color-warning-600)" },
        danger: { 100: "var(--color-danger-100)", 600: "var(--color-danger-600)" },
        info: { 100: "var(--color-info-100)", 600: "var(--color-info-600)" },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          onAccent: "var(--text-on-accent)",
          inverse: "var(--text-inverse)",
        },
      },
      fontFamily: {
        sans: "var(--font-sans)",
        serif: "var(--font-serif)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "var(--radius-full)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        base: "var(--duration-base)",
        slow: "var(--duration-slow)",
      },
      ringColor: {
        DEFAULT: "var(--focus-ring)",
      },
    },
  },
  plugins: [],
};
