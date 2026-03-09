"use client";

import { useState, useEffect } from "react";

export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);

    // Load favorites on mount
    useEffect(() => {
        const stored = localStorage.getItem("devtoolbox-favorites");
        if (stored) {
            try {
                setFavorites(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse favorites", e);
            }
        }
    }, []);

    const toggleFavorite = (slug: string) => {
        const newFavorites = favorites.includes(slug)
            ? favorites.filter((s) => s !== slug)
            : [...favorites, slug];

        setFavorites(newFavorites);
        localStorage.setItem("devtoolbox-favorites", JSON.stringify(newFavorites));
    };

    const isFavorite = (slug: string) => favorites.includes(slug);

    return { favorites, toggleFavorite, isFavorite };
}
