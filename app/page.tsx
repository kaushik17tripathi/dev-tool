"use client";

import React, { useState, useMemo, useEffect } from "react";
import { tools, type Category } from "@/lib/toolRegistry";
import ToolCard from "@/components/ui/ToolCard";
import { useFavorites } from "@/hooks/useFavorites";
import { Search, Terminal, Zap, Shield, X, Star } from "lucide-react";

const CATEGORIES: Category[] = ['JSON', 'Encoding', 'Developer', 'DateTime', 'Misc'];

export default function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
    const { favorites, toggleFavorite, isFavorite } = useFavorites();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const filteredTools = useMemo(() => {
        return tools.filter((tool) => {
            const matchesSearch =
                tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tool.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = activeCategory === 'All' || tool.category === activeCategory;

            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    const favoriteTools = useMemo(() => {
        return tools.filter(tool => favorites.includes(tool.slug));
    }, [favorites]);

    const showFavorites = mounted && favoriteTools.length > 0 && !searchQuery && activeCategory === 'All';

    return (
        <div className="space-y-16 py-8">
            {/* Hero Section */}
            <section className="text-center max-w-3xl mx-auto space-y-6">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                    The Developer's <span className="text-accent underline decoration-accent/30 underline-offset-8">Utility Belt</span>
                </h1>
                <p className="text-xl text-text-muted leading-relaxed">
                    Fast, private, and free developer tools that run entirely in your browser.
                    No tracking, no data collection, no hassle.
                </p>

                <div className="relative max-w-lg mx-auto pt-4 group">
                    <Search className={`absolute left-4 top-[48px] -translate-y-1/2 w-5 h-5 transition-colors ${searchQuery ? 'text-accent' : 'text-text-muted'}`} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search 30+ tools..."
                        className="w-full bg-background-input border border-border rounded-2xl py-4 pl-12 pr-12 focus:ring-2 focus:ring-accent focus:border-accent transition-all outline-none text-lg shadow-xl"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-4 top-[34px] -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </section>

            {/* Features Grid */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center p-6 space-y-3">
                    <div className="bg-accent/10 p-3 rounded-full">
                        <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-bold text-lg">Privacy First</h3>
                    <p className="text-text-muted text-sm">Your data never leaves your browser. All processing is client-side.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 space-y-3">
                    <div className="bg-accent/10 p-3 rounded-full">
                        <Zap className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-bold text-lg">Blazing Fast</h3>
                    <p className="text-text-muted text-sm">Built with Next.js 14 for instant loading and smooth transitions.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 space-y-3">
                    <div className="bg-accent/10 p-3 rounded-full">
                        <Terminal className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="font-bold text-lg">Open Source</h3>
                    <p className="text-text-muted text-sm">Check our code on GitHub. Community-driven and always free.</p>
                </div>
            </section>

            {/* Favorites Section */}
            {showFavorites && (
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 border-b border-border pb-4">
                        <Star className="w-5 h-5 text-yellow-500 fill-current" />
                        <h2 className="text-2xl font-bold">Your Favorites</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {favoriteTools.map((tool) => (
                            <ToolCard
                                key={`fav-${tool.slug}`}
                                tool={tool}
                                isFavorite={true}
                                onToggleFavorite={toggleFavorite}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* Tools Grid */}
            <section className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 gap-4">
                    <h2 className="text-2xl font-bold">
                        {activeCategory === 'All' ? 'All Tools' : `${activeCategory} Tools`}
                        {searchQuery && <span className="text-text-muted text-sm font-normal ml-3">— {filteredTools.length} results</span>}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveCategory('All')}
                            className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all border ${activeCategory === 'All' ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-background-input text-text-muted hover:text-text-primary border-border hover:border-accent/40'}`}
                        >
                            All
                        </button>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full transition-all border ${activeCategory === cat ? 'bg-accent text-white border-accent shadow-lg shadow-accent/20' : 'bg-background-input text-text-muted hover:text-text-primary border-border hover:border-accent/40'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredTools.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {filteredTools.map((tool) => (
                            <ToolCard
                                key={tool.slug}
                                tool={tool}
                                isFavorite={isFavorite(tool.slug)}
                                onToggleFavorite={toggleFavorite}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="bg-background-input/50 border border-dashed border-border rounded-xl p-20 text-center">
                        <div className="bg-border/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-text-muted" />
                        </div>
                        <p className="text-text-primary font-bold text-lg">No tools found</p>
                        <p className="text-text-muted max-w-xs mx-auto mt-2">We couldn't find any tools matching "{searchQuery}" in {activeCategory}.</p>
                        <button
                            onClick={() => { setSearchQuery(""); setActiveCategory('All'); }}
                            className="btn-secondary mt-6 py-2 px-6"
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
