import type { Config } from "tailwindcss";

/**
 * MILESTONE ERP Design Tokens
 * Apple-inspired Enterprise SaaS Theme (Light Mode).
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F7F8FA",
        surface: "#FFFFFF",
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          subtle: "#EFF6FF",
          border: "#BFDBFE",
        },
        "primary-container": "#2563eb",
        "primary-fixed-dim": "#1d4ed8",
        status: {
          moving: "#16a34a",
          idle: "#d97706",
          stopped: "#dc2626",
          offline: "#64748b",
        },
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      spacing: {
        sidebar_width: "230px",
        sidebar_collapsed: "72px",
        header_height: "60px",
        gutter: "24px",
        container_padding: "24px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "ui-monospace",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      fontSize: {
        display: ["28px", { lineHeight: "34px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-lg": ["22px", { lineHeight: "28px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-md": ["17px", { lineHeight: "22px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "body-lg": ["15px", { lineHeight: "20px", fontWeight: "400" }],
        "body-md": ["13px", { lineHeight: "18px", fontWeight: "400" }],
        "data-mono": ["13px", { lineHeight: "18px", fontWeight: "500" }],
        "label-sm": ["11px", { lineHeight: "14px", letterSpacing: "0.02em", fontWeight: "600" }],
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        dropdown: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
        modal: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
