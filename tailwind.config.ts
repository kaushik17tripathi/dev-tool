import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
    darkMode: ["selector", '[data-theme="dark"]'],
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
                display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
            },
            colors: {
                background: {
                    base: "rgb(var(--background-base) / <alpha-value>)",
                    card: "rgb(var(--background-card) / <alpha-value>)",
                    input: "rgb(var(--background-input) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "rgb(var(--accent) / <alpha-value>)",
                    hover: "rgb(var(--accent-hover) / <alpha-value>)",
                    fg: "rgb(var(--accent-fg) / <alpha-value>)",
                },
                success: "rgb(var(--success) / <alpha-value>)",
                error: "rgb(var(--error) / <alpha-value>)",
                text: {
                    primary: "rgb(var(--text-primary) / <alpha-value>)",
                    muted: "rgb(var(--text-muted) / <alpha-value>)",
                },
                border: "rgb(var(--border) / <alpha-value>)",
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
            },
            boxShadow: {
                'glow': '0 0 40px -10px rgb(var(--accent) / 0.5)',
            }
        },
    },
    plugins: [typography],
};
export default config;
