"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export default function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    // Avoid hydration mismatch
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-10 h-10" />;

    const isDark = resolvedTheme === "dark";

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-2 rounded-xl bg-background-input border border-border hover:border-accent/40 transition-all text-text-primary group"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun className="w-5 h-5 group-hover:text-accent transition-colors" />
            ) : (
                <Moon className="w-5 h-5 group-hover:text-accent transition-colors" />
            )}
        </button>
    );
}
