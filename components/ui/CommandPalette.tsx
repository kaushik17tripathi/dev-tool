"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as Icons from "lucide-react";
import { tools } from "@/lib/toolRegistry";

interface CommandItem {
    id: string;
    label: string;
    description: string;
    icon: string;
    href: string;
    category: string;
    keywords: string[];
}

const staticCommands: CommandItem[] = [
    { id: "home", label: "Home", description: "Browse all tools", icon: "Home", href: "/", category: "Navigation", keywords: ["home", "tools", "all"] },
    { id: "blog", label: "Blog", description: "Tutorials and guides", icon: "BookOpen", href: "/blog", category: "Navigation", keywords: ["blog", "guide", "tutorial"] },
    { id: "about", label: "About", description: "About DevWallah", icon: "Info", href: "/about", category: "Navigation", keywords: ["about"] },
    { id: "contact", label: "Contact", description: "Get in touch", icon: "Mail", href: "/contact", category: "Navigation", keywords: ["contact", "email"] },
    { id: "changelog", label: "Changelog", description: "What's new", icon: "GitCommit", href: "/changelog", category: "Navigation", keywords: ["changelog", "updates", "new"] },
];

const toolCommands: CommandItem[] = tools.map((t) => ({
    id: t.slug,
    label: t.name,
    description: t.description,
    icon: t.icon,
    href: `/tools/${t.slug}`,
    category: t.category,
    keywords: t.keywords,
}));

const allCommands = [...staticCommands, ...toolCommands];

function score(cmd: CommandItem, query: string): number {
    const q = query.toLowerCase();
    const label = cmd.label.toLowerCase();
    const desc = cmd.description.toLowerCase();
    const kws = cmd.keywords.join(" ").toLowerCase();

    if (label === q) return 100;
    if (label.startsWith(q)) return 90;
    if (label.includes(q)) return 70;
    if (desc.includes(q)) return 50;
    if (kws.includes(q)) return 40;
    return 0;
}

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const filtered = query.trim()
        ? allCommands
            .map((c) => ({ cmd: c, s: score(c, query) }))
            .filter((x) => x.s > 0)
            .sort((a, b) => b.s - a.s)
            .map((x) => x.cmd)
        : allCommands.filter((c) => c.category !== "Navigation").slice(0, 8);

    // Global shortcut: Ctrl+K or Cmd+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setOpen((prev) => !prev);
                setQuery("");
                setActiveIdx(0);
            }
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Reset active index when results change
    useEffect(() => {
        setActiveIdx(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIdx((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIdx((i) => Math.max(i - 1, 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (filtered[activeIdx]) {
                router.push(filtered[activeIdx].href);
                setOpen(false);
                setQuery("");
            }
        }
    };

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.querySelectorAll("[data-cmd-item]")[activeIdx] as HTMLElement | undefined;
        el?.scrollIntoView({ block: "nearest" });
    }, [activeIdx]);

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />

            {/* Palette */}
            <div className="fixed inset-x-4 top-[10vh] z-[201] max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-150">
                <div className="bg-background-card border border-border rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                    {/* Search input */}
                    <div className="flex items-center gap-3 px-4 border-b border-border">
                        <Icons.Search className="w-4 h-4 text-text-muted shrink-0" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search tools, pages, and actions..."
                            className="flex-1 bg-transparent py-4 text-base text-text-primary placeholder:text-text-muted/50 outline-none font-medium"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <kbd className="hidden sm:inline-flex h-6 items-center rounded border border-border bg-background-input px-1.5 font-mono text-[10px] font-bold text-text-muted shrink-0">
                            ESC
                        </kbd>
                    </div>

                    {/* Results */}
                    <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-2">
                        {filtered.length === 0 ? (
                            <div className="py-12 text-center space-y-2">
                                <Icons.SearchX className="w-8 h-8 text-text-muted/30 mx-auto" />
                                <p className="text-sm text-text-muted">No results for &quot;{query}&quot;</p>
                            </div>
                        ) : (
                            <>
                                {!query && (
                                    <div className="px-4 pb-1 pt-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                                            Popular Tools
                                        </span>
                                    </div>
                                )}
                                {filtered.map((cmd, idx) => {
                                    const IconComp = (Icons as any)[cmd.icon] || Icons.HelpCircle;
                                    const isActive = idx === activeIdx;
                                    return (
                                        <Link
                                            key={cmd.id}
                                            href={cmd.href}
                                            data-cmd-item
                                            onClick={() => { setOpen(false); setQuery(""); }}
                                            onMouseEnter={() => setActiveIdx(idx)}
                                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-100 ${isActive ? "bg-accent/10" : "hover:bg-background-input/50"}`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? "bg-accent text-accent-fg" : "bg-background-input text-text-muted"}`}>
                                                <IconComp className="w-4 h-4" strokeWidth={1.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-sm font-bold truncate ${isActive ? "text-accent" : "text-text-primary"}`}>
                                                    {cmd.label}
                                                </div>
                                                <div className="text-[11px] text-text-muted truncate">
                                                    {cmd.description}
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest shrink-0 text-text-muted/50 hidden sm:block">
                                                {cmd.category}
                                            </span>
                                            {isActive && (
                                                <Icons.CornerDownLeft className="w-3.5 h-3.5 text-accent shrink-0" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="border-t border-border px-4 py-2.5 flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
                            <kbd className="inline-flex h-5 items-center rounded border border-border bg-background-input px-1 font-mono text-[9px]">↑↓</kbd>
                            Navigate
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
                            <kbd className="inline-flex h-5 items-center rounded border border-border bg-background-input px-1 font-mono text-[9px]">↵</kbd>
                            Open
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted">
                            <kbd className="inline-flex h-5 items-center rounded border border-border bg-background-input px-1 font-mono text-[9px]">ESC</kbd>
                            Close
                        </div>
                        <div className="ml-auto text-[10px] font-black text-text-muted/40 uppercase tracking-widest">
                            {filtered.length} results
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
