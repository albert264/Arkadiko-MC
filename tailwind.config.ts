import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Trebuchet MS', 'sans-serif'],
        body: ['var(--font-body)', 'Trebuchet MS', 'sans-serif'],
      },
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
          elevated: "var(--bg-elevated)",
        },
        accent: {
          DEFAULT: "var(--accent-primary)",
          hover: "var(--accent-hover)",
          subtle: "var(--accent-subtle)",
          muted: "var(--accent-muted)",
        },
        status: {
          todo: "var(--status-todo)",
          progress: "var(--status-progress)",
          complete: "var(--status-complete)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
          strong: "var(--border-strong)",
        },
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'card': 'var(--shadow-card)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-in': 'slideIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;
