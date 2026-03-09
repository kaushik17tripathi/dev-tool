import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    base: "#0f1117",
                    card: "#1a1d27",
                    input: "#12151e",
                },
                accent: {
                    DEFAULT: "#6366f1",
                    hover: "#818cf8",
                },
                success: "#22c55e",
                error: "#ef4444",
                text: {
                    primary: "#f1f5f9",
                    muted: "#64748b",
                },
                border: "#2d3148",
            },
        },
    },
    plugins: [],
};
export default config;
