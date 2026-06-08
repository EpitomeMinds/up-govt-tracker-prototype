import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        up: {
          saffron: "#FF9933",
          green: "#138808",
          navy: "#0f172a",
        },
        bi: {
          sidebar: "#0f1623",
          sidebarHover: "#1a2438",
          sidebarActive: "#243049",
          canvas: "#f0f3fa",
          widget: "#ffffff",
          border: "#e2e8f0",
          muted: "#64748b",
          label: "#475569",
          title: "#0f172a",
          accent: "#2563eb",
          accentHover: "#1d4ed8",
          accentSoft: "#eff6ff",
          teal: "#0d9488",
          violet: "#7c3aed",
          coral: "#ef4444",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        widget:
          "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        "widget-hover":
          "0 8px 24px rgba(15, 23, 42, 0.1), 0 0 0 1px rgba(37, 99, 235, 0.08)",
        kpi: "0 4px 20px rgba(37, 99, 235, 0.12)",
        sidebar: "4px 0 24px rgba(0, 0, 0, 0.15)",
        glow: "0 0 0 3px rgba(37, 99, 235, 0.15)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
