import React from "react";
import { Rocket, Tag, Sparkles, Wrench } from "lucide-react";
import type { Metadata } from "next";

const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
    title: "Changelog – What's New in DevWallah",
    description: "See the latest updates, new tools, and improvements to DevWallah. Stay up to date with our changelog.",
    alternates: baseUrl ? { canonical: `${baseUrl}/changelog` } : undefined,
    openGraph: {
        title: "DevWallah Changelog",
        description: "Track every update, new tool, and improvement to DevWallah.",
        ...(baseUrl ? { url: `${baseUrl}/changelog` } : {}),
    },
};

const ENTRIES = [
    {
        version: "2.0",
        date: "March 2026",
        title: "Complete UI Redesign",
        icon: Sparkles,
        tag: "Major",
        items: [
            "Brand new brutalist-glassmorphism design system",
            "Custom typography with Outfit, DM Sans, and JetBrains Mono",
            "Floating glass pill navbar with backdrop blur",
            "Dot-grid background texture and floating geometric shapes",
            "Scroll-triggered reveal animations across all sections",
            "Redesigned tool cards with monochromatic icon boxes",
        ],
    },
    {
        version: "1.8",
        date: "March 2026",
        title: "Network Tools & SEO",
        icon: Rocket,
        tag: "Feature",
        items: [
            "Added HTTP Headers Analyzer with security grading",
            "Added cURL Comparator for side-by-side diff",
            "JSON Schema Validator with draft-07 support",
            "Comprehensive JSON-LD structured data for all pages",
            "Improved sitemap and robots.txt configuration",
        ],
    },
    {
        version: "1.5",
        date: "February 2026",
        title: "10 New Developer Tools",
        icon: Wrench,
        tag: "Feature",
        items: [
            "Fake JSON Generator with custom schema support",
            "JSON to TypeScript interface generator",
            "Markdown Preview with live rendering",
            "QR Code Generator",
            "XML Formatter",
            "HTML to Markdown converter",
            "List Sorter with multiple sort modes",
            "Base64 to Image viewer",
            "Text to Unicode converter",
            "URL Parser with component breakdown",
        ],
    },
    {
        version: "1.0",
        date: "January 2026",
        title: "Initial Launch",
        icon: Tag,
        tag: "Launch",
        items: [
            "Launched with 15 core developer tools",
            "100% client-side processing — zero server calls",
            "Dark mode with theme persistence",
            "Favorites system with local storage",
            "Shareable tool state via URL parameters",
            "Responsive design for all screen sizes",
        ],
    },
];

export default function ChangelogPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 space-y-16 pt-16">
            {/* Header */}
            <section className="space-y-6">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Changelog</span>
                <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter">What&apos;s New</h1>
                <p className="text-xl text-text-muted font-medium max-w-2xl">
                    Every update, new tool, and improvement shipped to DevWallah. We build in public.
                </p>
            </section>

            {/* Timeline */}
            <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-6 top-0 bottom-0 w-px bg-border/60 hidden md:block"></div>

                <div className="space-y-16">
                    {ENTRIES.map((entry) => {
                        const Icon = entry.icon;
                        return (
                            <article key={entry.version} className="relative md:pl-20">
                                {/* Timeline dot */}
                                <div className="hidden md:flex absolute left-0 top-0 w-12 h-12 bg-text-primary text-background-base rounded-2xl items-center justify-center shadow-xl z-10">
                                    <Icon className="w-6 h-6" strokeWidth={1.5} />
                                </div>

                                <div className="space-y-6">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <span className="text-accent font-mono font-black text-lg">v{entry.version}</span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-background-base bg-text-primary px-3 py-1">
                                            {entry.tag}
                                        </span>
                                        <span className="text-text-muted text-sm font-medium">{entry.date}</span>
                                    </div>
                                    <h2 className="text-3xl font-display font-black tracking-tight">{entry.title}</h2>
                                    <ul className="space-y-3">
                                        {entry.items.map((item, i) => (
                                            <li key={i} className="flex items-start gap-4 text-text-muted font-medium">
                                                <span className="text-accent font-black text-sm mt-0.5 shrink-0">→</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
