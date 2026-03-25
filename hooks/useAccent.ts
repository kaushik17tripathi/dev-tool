"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

export type LightAccent =
    | "blue"
    | "indigo"
    | "teal"
    | "emerald"
    | "rose"
    | "orange"
    | "amber"
    | "slate";

const STORAGE_KEY = "devwallah-accent-light";
const DEFAULT_ACCENT: LightAccent = "blue";

export function useAccent() {
    const { resolvedTheme } = useTheme();
    const [accent, setAccentState] = useState<LightAccent>(DEFAULT_ACCENT);

    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return;
            setAccentState(stored as LightAccent);
        } catch {
            // ignore
        }
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return;

        const root = document.documentElement;

        // Accent is configurable only in light theme; dark keeps the brand cyan.
        if (resolvedTheme === "light") {
            root.setAttribute("data-accent", accent);
        } else {
            root.removeAttribute("data-accent");
        }
    }, [accent, resolvedTheme]);

    const setAccent = (next: LightAccent) => {
        setAccentState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // ignore
        }
    };

    const accents = useMemo(
        () =>
            [
                "blue",
                "indigo",
                "teal",
                "emerald",
                "rose",
                "orange",
                "amber",
                "slate",
            ] as const,
        [],
    );

    return { accent, setAccent, accents };
}

