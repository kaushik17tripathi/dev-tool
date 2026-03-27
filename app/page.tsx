"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { tools, type Category } from "@/lib/toolRegistry";
import ToolCard from "@/components/ui/ToolCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentTools } from "@/hooks/useRecentTools";
import Link from "next/link";
import * as Icons from "lucide-react";
import { Search, Terminal, Zap, Shield, X, Star, ClipboardCopy, ChevronLeft, ChevronRight, FileJson, Hash, Code, Clock, Palette, Wifi, ArrowRight, ChevronDown } from "lucide-react";

import { useScrollReveal } from "@/hooks/useScrollReveal";

const CATEGORIES: Category[] = ['JSON', 'Encoding', 'Developer', 'DateTime', 'Misc', 'Network'];
const MOBILE_CATEGORY_PREVIEW_COUNT = 4;
const MOBILE_EXPANDED_CATEGORY_KEY = "devwallah-mobile-open-category";

export default function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
    const { favorites, toggleFavorite, isFavorite } = useFavorites();
    const { recentSlugs } = useRecentTools();
    const [mounted, setMounted] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [expandedMobileCategory, setExpandedMobileCategory] = useState<Category | null>('JSON');
    const [mobileVisibleCount, setMobileVisibleCount] = useState<Record<Category, number>>({
        JSON: MOBILE_CATEGORY_PREVIEW_COUNT,
        Encoding: MOBILE_CATEGORY_PREVIEW_COUNT,
        Developer: MOBILE_CATEGORY_PREVIEW_COUNT,
        DateTime: MOBILE_CATEGORY_PREVIEW_COUNT,
        Misc: MOBILE_CATEGORY_PREVIEW_COUNT,
        Network: MOBILE_CATEGORY_PREVIEW_COUNT,
    });
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
        // Handle clicking outside to close dropdown
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setSearchFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        
        // Global Keyboard Shortcut ('/' to focus)
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
                e.preventDefault();
                document.getElementById("main-search")?.focus();
            }
            if (e.key === "Escape") {
                setSearchFocused(false);
                (document.activeElement as HTMLElement)?.blur();
            }
        };
        document.addEventListener("keydown", handleGlobalKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, []);

    useEffect(() => {
        if (!mounted) return;
        const stored = localStorage.getItem(MOBILE_EXPANDED_CATEGORY_KEY) as Category | null;
        if (stored && CATEGORIES.includes(stored)) {
            setExpandedMobileCategory(stored);
        }
    }, [mounted]);

    useEffect(() => {
        if (!mounted) return;
        if (expandedMobileCategory) {
            localStorage.setItem(MOBILE_EXPANDED_CATEGORY_KEY, expandedMobileCategory);
        }
    }, [expandedMobileCategory, mounted]);

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
    
    const recentTools = useMemo(() => {
        return recentSlugs
            .map((slug) => tools.find((tool) => tool.slug === slug))
            .filter(Boolean)
            .slice(0, 5) as typeof tools;
    }, [recentSlugs]);

    const mobileToolsByCategory = useMemo(() => {
        return CATEGORIES.map((category) => ({
            category,
            tools: tools.filter((tool) => tool.category === category),
        }));
    }, []);

    const showFavorites = mounted && favoriteTools.length > 0 && !searchQuery && activeCategory === 'All';

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!searchQuery) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex(prev => (prev < filteredTools.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            const tool = filteredTools[activeIndex];
            if (tool) {
                window.location.href = `/tools/${tool.slug}`;
            }
        }
    };

    useEffect(() => {
        setActiveIndex(-1);
    }, [searchQuery]);

    return (
        <div className="space-y-12 py-0 relative">
            {/* Backdrop Dimmer */}
            <div 
                className={`fixed inset-0 bg-background-base/60 backdrop-blur-sm z-40 transition-opacity duration-500 pointer-events-none ${searchFocused && searchQuery ? 'opacity-100' : 'opacity-0'}`}
            ></div>

            {/* Hero Section */}
            <section className={`text-center max-w-4xl mx-auto space-y-8 pt-4 pb-0 relative z-50 transition-all duration-500 ${searchFocused && searchQuery ? 'scale-[1.02]' : 'scale-100'}`}>
                <div className="absolute inset-x-0 top-0 -z-10 h-[500px] w-full bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-accent/20 via-background-base/0 to-background-base/0 opacity-60 blur-3xl"></div>
                
                <div className="animate-in-up flex justify-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/80 bg-background-card/50 backdrop-blur-md shadow-sm">
                        <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-primary">DevWallah 2.0 Live</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <h1 className="animate-in-up delay-100 text-5xl md:text-8xl font-display font-black tracking-tighter leading-[0.9]">
                        The Developer&apos;s <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-text-primary via-text-primary to-text-muted">Utility Belt.</span>
                    </h1>
                    
                    <p className="animate-in-up delay-200 text-lg md:text-xl text-text-muted font-medium max-w-2xl mx-auto tracking-tight">
                        Fast, private, and free developer tools that run entirely in your browser.
                        No tracking, no data collection, no hassle.
                    </p>
                </div>
            </section>

            {/* Interactive Search & Marquee Area */}
            <div className="space-y-12 relative z-50">
                <HeroMarquee />

                {/* Search Bar with Dropdown (Now below Marquee) */}
                <div ref={searchRef} className="animate-in-up delay-300 relative max-w-2xl mx-auto px-4 group sticky top-20 md:top-auto md:static z-[55]">
                    <Search className={`absolute left-10 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${searchQuery || searchFocused ? 'text-accent' : 'text-text-muted group-focus-within:text-accent'}`} />
                    <input
                        id="main-search"
                        type="text"
                        value={searchQuery}
                        onFocus={() => setSearchFocused(true)}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search tools... (Press '/' to focus)"
                        className="w-full bg-background-card border-2 border-border rounded-2xl py-5 pl-16 pr-24 focus:ring-4 focus:ring-accent/10 focus:border-accent transition-all outline-none text-lg font-medium shadow-2xl shadow-black/20"
                        spellCheck="false"
                    />
                    
                    {/* Shortcut Hint */}
                    <div className="absolute right-14 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                        {!searchQuery && !searchFocused && (
                            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border bg-background-input px-1.5 font-mono text-[11px] font-black text-text-muted">
                                /
                            </kbd>
                        )}
                        {searchFocused && (
                            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border bg-background-input px-1.5 font-mono text-[10px] font-black text-text-muted">
                                ESC
                            </kbd>
                        )}
                    </div>

                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-10 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    {/* Search Dropdown */}
                    {searchFocused && searchQuery && (
                        <div className="absolute top-[calc(100%+12px)] left-4 right-4 bg-background-card border-2 border-border rounded-2xl shadow-2xl max-h-[440px] overflow-y-auto z-[60] animate-in fade-in slide-in-from-top-2 duration-300 no-scrollbar overflow-hidden">
                            <div className="p-2 space-y-1">
                                {filteredTools.length > 0 ? (
                                    filteredTools.slice(0, 10).map((tool, idx) => {
                                        const IconComponent = (Icons as any)[tool.icon] || Icons.HelpCircle;
                                        const isActive = idx === activeIndex;
                                        return (
                                            <Link
                                                key={tool.slug}
                                                href={`/tools/${tool.slug}`}
                                                className={`flex items-center gap-4 p-3 rounded-xl transition-all ${isActive ? 'bg-accent text-black scale-[0.98]' : 'hover:bg-background-input text-text-primary'}`}
                                                onMouseEnter={() => setActiveIndex(idx)}
                                            >
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isActive ? 'bg-black/10' : 'bg-text-primary text-background-base shadow-lg shadow-black/20'}`}>
                                                    <IconComponent className="w-5 h-5" strokeWidth={1.5} />
                                                </div>
                                                <div className="text-left flex-1">
                                                    <div className="font-display font-black text-sm tracking-tight">{tool.name}</div>
                                                    <div className={`text-[10px] font-bold ${isActive ? 'text-black/60' : 'text-text-muted'}`}>{tool.category.toUpperCase()} — {tool.description.substring(0, 50)}...</div>
                                                </div>
                                                <ArrowRight className={`w-4 h-4 ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'} transition-all`} />
                                            </Link>
                                        );
                                    })
                                ) : (
                                    <div className="p-8 text-center space-y-3">
                                         <Icons.Search className="w-10 h-10 text-text-muted mx-auto opacity-20" />
                                        <div className="text-sm font-display font-black">No tools found for &quot;{searchQuery}&quot;</div>
                                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Try searching for JSON, JWT, or UI</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Body with Dimming Effect */}
            <div className={`space-y-20 transition-all duration-500 ${searchFocused && searchQuery ? 'opacity-20 blur-[2px] grayscale pointer-events-none scale-[0.99]' : 'opacity-100 blur-0 grayscale-0 scale-100'}`}>
                {/* Categories Section (Commented out as requested) */}
                {/* <CategoriesSection onCategoryClick={setActiveCategory} activeCategory={activeCategory} /> */}

                {/* Favorites Section */}
                {showFavorites && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 pb-4">
                            <Star className="w-5 h-5 text-yellow-400 fill-current" />
                            <h2 className="text-2xl font-display font-black tracking-tight">Your Favorites</h2>
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
                <section id="tools" className="space-y-10 scroll-mt-32">
                    <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-6">
                        <h2 className="text-4xl font-display font-black tracking-tight">
                            {activeCategory === 'All' ? 'All Tools' : `${activeCategory} Tools`}
                            {searchQuery && <span className="text-text-muted text-base font-normal ml-3">— {filteredTools.length} results</span>}
                        </h2>
                        
                        <div className="hidden md:flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveCategory('All')}
                                className={`text-[10px] font-black uppercase tracking-[0.15em] px-5 py-2.5 rounded-xl transition-all duration-300 border ${activeCategory === 'All' ? 'bg-accent text-black border-accent shadow-glow' : 'bg-background-card text-text-muted hover:text-text-primary border-border'}`}
                            >
                                All
                            </button>
                            {CATEGORIES.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`text-[10px] font-black uppercase tracking-[0.15em] px-5 py-2.5 rounded-xl transition-all duration-300 border ${activeCategory === cat ? 'bg-accent text-black border-accent shadow-glow' : 'bg-background-card text-text-muted hover:text-text-primary border-border'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile-first browsing: quick access + category accordions */}
                    <div className="md:hidden space-y-6">
                        {!searchQuery && recentTools.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-text-muted">Recent</h3>
                                    <span className="text-xs text-text-muted font-bold">{recentTools.length} viewed</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {recentTools.map((tool) => (
                                        <ToolCard
                                            key={`mobile-recent-${tool.slug}`}
                                            tool={tool}
                                            isFavorite={isFavorite(tool.slug)}
                                            onToggleFavorite={toggleFavorite}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {!searchQuery && favoriteTools.length > 0 && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-[0.15em] text-text-muted">Quick Access</h3>
                                    <span className="text-xs text-text-muted font-bold">{favoriteTools.length} saved</span>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {favoriteTools.slice(0, 4).map((tool) => (
                                        <ToolCard
                                            key={`mobile-fav-${tool.slug}`}
                                            tool={tool}
                                            isFavorite={true}
                                            onToggleFavorite={toggleFavorite}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {searchQuery ? (
                            filteredTools.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6">
                                    {filteredTools.map((tool) => (
                                        <ToolCard
                                            key={`mobile-search-${tool.slug}`}
                                            tool={tool}
                                            isFavorite={isFavorite(tool.slug)}
                                            onToggleFavorite={toggleFavorite}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="border border-dashed border-border p-10 text-center rounded-3xl">
                                    <Search className="w-10 h-10 text-text-muted mx-auto mb-4" strokeWidth={1} />
                                    <p className="text-text-primary font-display font-black text-xl">No tools found</p>
                                    <p className="text-text-muted font-medium max-w-xs mx-auto mt-2">No match for &ldquo;{searchQuery}&rdquo; in {activeCategory}.</p>
                                    <button
                                        onClick={() => { setSearchQuery(""); setActiveCategory('All'); }}
                                        className="btn-secondary mt-6 py-2.5 px-8 text-sm"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="space-y-3">
                                {mobileToolsByCategory.map(({ category, tools: categoryTools }) => {
                                    const isOpen = expandedMobileCategory === category;
                                    const visibleCount = mobileVisibleCount[category];
                                    const visibleTools = categoryTools.slice(0, visibleCount);
                                    const canShowMore = visibleCount < categoryTools.length;
                                    const canShowLess = visibleCount > MOBILE_CATEGORY_PREVIEW_COUNT;

                                    return (
                                        <section key={`mobile-cat-${category}`} className="border border-border/70 rounded-2xl bg-background-card/60 backdrop-blur-md overflow-hidden">
                                            <button
                                                type="button"
                                                className="w-full px-4 py-4 flex items-center justify-between text-left"
                                                onClick={() => setExpandedMobileCategory(isOpen ? null : category)}
                                            >
                                                <div className="space-y-0.5">
                                                    <h3 className="font-display font-black text-lg tracking-tight">{category}</h3>
                                                    <p className="text-xs text-text-muted font-bold">{categoryTools.length} tools</p>
                                                </div>
                                                <ChevronDown className={`w-5 h-5 text-text-muted transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                                            </button>

                                            {isOpen && (
                                                <div className="px-4 pb-4 space-y-4">
                                                    <div className="grid grid-cols-1 gap-4">
                                                        {visibleTools.map((tool) => (
                                                            <ToolCard
                                                                key={`mobile-cat-card-${tool.slug}`}
                                                                tool={tool}
                                                                isFavorite={isFavorite(tool.slug)}
                                                                onToggleFavorite={toggleFavorite}
                                                            />
                                                        ))}
                                                    </div>

                                                    {(canShowMore || canShowLess) && (
                                                        <button
                                                            type="button"
                                                            className="w-full py-2.5 rounded-xl border border-border bg-background-input text-text-primary text-xs font-black uppercase tracking-[0.12em] hover:border-accent/40 hover:text-accent transition-colors"
                                                            onClick={() => {
                                                                setMobileVisibleCount((prev) => ({
                                                                    ...prev,
                                                                    [category]: canShowMore ? prev[category] + 4 : MOBILE_CATEGORY_PREVIEW_COUNT,
                                                                }));
                                                            }}
                                                        >
                                                            {canShowMore ? "Show More" : "Show Less"}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </section>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Desktop tools grid + category chips */}
                    <div className="hidden md:block">
                        {filteredTools.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
                            <div className="border border-dashed border-border p-20 text-center rounded-3xl">
                                <Search className="w-10 h-10 text-text-muted mx-auto mb-4" strokeWidth={1} />
                                <p className="text-text-primary font-display font-black text-xl">No tools found</p>
                                <p className="text-text-muted font-medium max-w-xs mx-auto mt-2">No match for &ldquo;{searchQuery}&rdquo; in {activeCategory}.</p>
                                <button
                                    onClick={() => { setSearchQuery(""); setActiveCategory('All'); }}
                                    className="btn-secondary mt-6 py-2.5 px-8 text-sm"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                {/* Features & Stats */}
                <div className="space-y-8 pt-12">
                    <div className="text-center space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">The Difference</span>
                        <h2 className="text-3xl font-display font-black tracking-tight">Why DevWallah?</h2>
                    </div>
                    
                    <StatsBar />

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50 p-px rounded-3xl overflow-hidden shadow-2xl shadow-black/5">
                        <div className="flex flex-col items-start p-10 space-y-4 bg-background-card hover:bg-background-input/50 transition-colors duration-500">
                            <Shield className="w-8 h-8 text-text-primary mb-2" strokeWidth={1.5} />
                            <h3 className="font-display font-black text-xl tracking-tight">Privacy First</h3>
                            <p className="text-text-muted text-sm font-medium leading-relaxed">Your data never leaves your browser. All processing is 100% client-side instantly.</p>
                        </div>
                        <div className="flex flex-col items-start p-10 space-y-4 bg-background-card hover:bg-background-input/50 transition-colors duration-500">
                            <Zap className="w-8 h-8 text-text-primary mb-2" strokeWidth={1.5} />
                            <h3 className="font-display font-black text-xl tracking-tight">Instant Execution</h3>
                            <p className="text-text-muted text-sm font-medium leading-relaxed">No server lag. All tools process your data instantly in real-time as you type.</p>
                        </div>
                        <div className="flex flex-col items-start p-10 space-y-4 bg-background-card hover:bg-background-input/50 transition-colors duration-500">
                            <Star className="w-8 h-8 text-text-primary mb-2" strokeWidth={1.5} />
                            <h3 className="font-display font-black text-xl tracking-tight">Free Forever</h3>
                            <p className="text-text-muted text-sm font-medium leading-relaxed">30+ professional tools available for free. No account, no subscription, no limits.</p>
                        </div>
                    </section>
                </div>

                <HowItWorks />
                {/* <EmailCTA /> */}

                <section className="max-w-4xl mx-auto">
                    <div className="relative overflow-hidden border border-border bg-background-card p-12 md:p-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 text-center sm:text-left rounded-3xl">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent opacity-60 pointer-events-none"></div>
                        <div className="space-y-4 flex-1 relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Feedback</span>
                            <h2 className="text-3xl font-display font-black tracking-tight">Something on your mind?</h2>
                            <p className="text-text-muted font-medium leading-relaxed max-w-md mx-auto sm:mx-0">
                                Bug reports, feature ideas, or general feedback — we read everything.
                            </p>
                        </div>
                        <Link href="/contact" className="btn-primary whitespace-nowrap shrink-0 relative z-10">
                            Get in Touch
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}

/* Sub-components */

function StatsBar() {
    const revealRef = useScrollReveal();
    const stats = [
        { value: "35+", label: "Developer Tools" },
        { value: "100%", label: "Client-Side" },
        { value: "0", label: "Servers Used" },
        { value: "∞", label: "Free Forever" },
    ];

    return (
        <section ref={revealRef} className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/50 p-px rounded-3xl overflow-hidden">
            {stats.map((stat) => (
                <div key={stat.label} className="bg-background-card p-8 text-center space-y-2 hover:bg-background-input/50 transition-colors duration-500">
                    <div className="text-4xl md:text-5xl font-display font-black text-accent tracking-tighter">{stat.value}</div>
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{stat.label}</div>
                </div>
            ))}
        </section>
    );
}

function HowItWorks() {
    const revealRef = useScrollReveal();
    const steps = [
        { num: "01", title: "Paste", desc: "Drop your data into the input area. JSON, URLs, timestamps — we handle it all.", icon: Terminal },
        { num: "02", title: "Process", desc: "Instant processing happens locally in your browser. Zero network calls.", icon: Zap },
        { num: "03", title: "Copy", desc: "One click to copy the result. Share with your team or use it in your code.", icon: ClipboardCopy },
    ];

    return (
        <section ref={revealRef} className="space-y-12 py-12">
            <div className="text-center space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Workflow</span>
                <h2 className="text-4xl font-display font-black tracking-tight">How It Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                <div className="hidden md:block absolute top-16 left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] h-px bg-border/60 z-0"></div>
                {steps.map((step) => {
                    const Icon = step.icon;
                    return (
                        <div key={step.num} className="relative z-10 flex flex-col items-center text-center space-y-6 group">
                            <div className="w-16 h-16 rounded-full bg-text-primary text-background-base flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-500 shadow-xl">
                                <Icon className="w-7 h-7" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-3">
                                <span className="text-accent font-mono font-black text-sm">{step.num}</span>
                                <h3 className="text-2xl font-display font-black tracking-tight">{step.title}</h3>
                                <p className="text-text-muted font-medium leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

function EmailCTA() {
    const revealRef = useScrollReveal();
    return (
        <section ref={revealRef} className="relative overflow-hidden py-12">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-accent/15 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none"></div>
            <div className="relative border border-border bg-background-card/50 backdrop-blur-xl p-12 md:p-16 text-center space-y-8">
                <div className="space-y-4 max-w-xl mx-auto">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Stay Updated</span>
                    <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight">Get notified when we ship new tools.</h2>
                    <p className="text-text-muted font-medium">No spam. Just a ping when something useful drops.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                    <input
                        type="email"
                        placeholder="you@company.com"
                        className="flex-1 bg-background-input border border-border rounded-full py-3.5 px-6 focus:ring-1 focus:ring-accent focus:border-accent outline-none transition-all font-medium"
                    />
                    <button className="btn-primary whitespace-nowrap">Subscribe</button>
                </div>
                <p className="text-text-muted/50 text-xs font-medium">We respect your privacy. Unsubscribe anytime.</p>
            </div>
        </section>
    );
}

function HeroMarquee() {
    const marqueeTools = useMemo(() => {
        const MARQUEE_SLUGS = ['json-formatter', 'jwt-decoder', 'base64-encoder-decoder', 'uuid-generator', 'password-generator', 'regex-tester', 'timestamp-converter', 'hash-generator', 'qr-code-generator', 'color-converter', 'sql-formatter', 'cron-generator'];
        return MARQUEE_SLUGS.map(slug => tools.find(t => t.slug === slug)).filter(Boolean) as typeof tools;
    }, []);

    const doubledTools = [...marqueeTools, ...marqueeTools];

    return (
        <section className="relative -mx-4 md:-mx-12 overflow-hidden py-2">
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background-base to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background-base to-transparent z-10 pointer-events-none"></div>

            <div className="flex gap-4 animate-marquee hover:[animation-play-state:paused]">
                {doubledTools.map((tool, i) => {
                    const IconComponent = (Icons as any)[tool.icon] || Icons.HelpCircle;
                    return (
                        <Link
                            key={`${tool.slug}-${i}`}
                            href={`/tools/${tool.slug}`}
                            className="group shrink-0 flex items-center gap-3 px-5 py-3 border border-border bg-background-card/80 backdrop-blur-sm rounded-full hover:border-accent/50 hover:bg-accent/5 transition-all duration-300"
                        >
                            <div className="w-8 h-8 rounded-lg bg-text-primary text-background-base flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all duration-300">
                                <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                            </div>
                            <span className="font-display font-bold text-sm tracking-tight whitespace-nowrap group-hover:text-accent transition-colors">{tool.name}</span>
                            <ArrowRight className="w-3 h-3 text-text-muted group-hover:text-accent group-hover:-rotate-45 transition-all" />
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}

function CategoriesSection({ onCategoryClick, activeCategory }: { onCategoryClick: (cat: Category | 'All') => void; activeCategory: Category | 'All' }) {
    const CATEGORY_META: { name: Category; icon: keyof typeof Icons }[] = [
        { name: 'JSON', icon: 'FileJson' },
        { name: 'Encoding', icon: 'Hash' },
        { name: 'Developer', icon: 'Code' },
        { name: 'DateTime', icon: 'Clock' },
        { name: 'Misc', icon: 'Palette' },
        { name: 'Network', icon: 'Wifi' },
    ];

    return (
        <section className="space-y-8 py-8">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Browse</span>
                    <h2 className="text-3xl font-display font-black tracking-tight">Categories</h2>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {CATEGORY_META.map((cat) => {
                    const IconComp = (Icons as any)[cat.icon] || Icons.HelpCircle;
                    const count = tools.filter(t => t.category === cat.name).length;
                    const isActive = activeCategory === cat.name;

                    return (
                        <button
                            key={cat.name}
                            onClick={() => onCategoryClick(cat.name)}
                            className={`group relative text-left p-6 border transition-all duration-300 space-y-4 ${
                                isActive ? 'border-accent bg-accent/5' : 'border-border bg-background-card hover:border-text-primary/30 hover:bg-background-input/50'
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-accent text-black' : 'bg-text-primary text-background-base group-hover:scale-110'}`}>
                                <IconComp className="w-5 h-5" strokeWidth={1.5} />
                            </div>
                            <div>
                                <div className="font-display font-black text-sm tracking-tight">{cat.name}</div>
                                <div className="text-[10px] font-bold text-text-muted mt-1">{count} tools</div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}
