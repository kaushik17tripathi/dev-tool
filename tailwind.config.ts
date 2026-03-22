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
            colors: {
                background: {
                    base: "rgb(var(--background-base) / <alpha-value>)",
                    card: "rgb(var(--background-card) / <alpha-value>)",
                    input: "rgb(var(--background-input) / <alpha-value>)",
                },
                accent: {
                    DEFAULT: "rgb(var(--accent) / <alpha-value>)",
                    hover: "rgb(var(--accent-hover) / <alpha-value>)",
                },
                success: "rgb(var(--success) / <alpha-value>)",
                error: "rgb(var(--error) / <alpha-value>)",
                text: {
                    primary: "rgb(var(--text-primary) / <alpha-value>)",
                    muted: "rgb(var(--text-muted) / <alpha-value>)",
                },
                border: "rgb(var(--border) / <alpha-value>)",
            },
        },
    },
    plugins: [typography],
};
export default config;
