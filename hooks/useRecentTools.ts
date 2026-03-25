"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "devwallah-recent-tools";
const MAX_RECENT = 8;

export function useRecentTools() {
    const [recentSlugs, setRecentSlugs] = useState<string[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return;
        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                setRecentSlugs(parsed.filter((item) => typeof item === "string"));
            }
        } catch {
            // ignore malformed storage
        }
    }, []);

    const recordVisit = useCallback((slug: string) => {
        setRecentSlugs((prev) => {
            const next = [slug, ...prev.filter((s) => s !== slug)].slice(0, MAX_RECENT);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    }, []);

    return { recentSlugs, recordVisit };
}

