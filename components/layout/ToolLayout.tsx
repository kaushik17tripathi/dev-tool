"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { type Tool, tools } from "@/lib/toolRegistry";
import ToolCard from "@/components/ui/ToolCard";
import { useFavorites } from "@/hooks/useFavorites";
import { useRecentTools } from "@/hooks/useRecentTools";
import { getShareUrl } from "@/lib/shareUtils";

interface ToolLayoutProps {
    tool: Tool;
    children: React.ReactNode;
    shareValue?: string;
}

export default function ToolLayout({ tool, children, shareValue }: ToolLayoutProps) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const { recordVisit } = useRecentTools();
    const [shareFeedback, setShareFeedback] = useState(false);
    const IconComponent = (Icons as any)[tool.icon] || Icons.HelpCircle;

    useEffect(() => {
        recordVisit(tool.slug);
    }, [tool.slug, recordVisit]);

    const handleShare = () => {
        if (!shareValue) return;
        const url = getShareUrl(shareValue);
        navigator.clipboard.writeText(url);
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
    };

    const relatedTools = tools
        .filter(t => t.category === tool.category && t.slug !== tool.slug)
        .slice(0, 3);

    const starred = isFavorite(tool.slug);

    const schemaOrg = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "name": tool.name,
                "description": tool.description,
                "applicationCategory": "DeveloperApplication",
                "operatingSystem": "Any",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD"
                }
            },
            {
                "@type": "FAQPage",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "Is my data safe?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes! All processing happens locally in your browser. We never send your data to any server. Your privacy is our top priority."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Is this tool free?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Absolutely. DevWallah is and will always be free to use for developers."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <div className="space-y-16 min-w-0 pt-10">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
            />
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-3 text-[10px] uppercase font-black tracking-[0.2em] text-text-muted mb-8">
                <Link href="/" className="hover:text-accent transition-colors">Home</Link>
                <Icons.ChevronRight className="w-3 h-3" strokeWidth={3} />
                <span className="text-background-base bg-text-primary px-3 py-1 scale-90 origin-left">
                    {tool.category}
                </span>
                <Icons.ChevronRight className="w-3 h-3" strokeWidth={3} />
                <span className="text-text-primary">{tool.name}</span>
            </nav>

            {/* Tool Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b-2 border-border/60">
                <div className="space-y-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-text-primary text-background-base rounded-2xl shadow-xl">
                        <IconComponent className="w-8 h-8" strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="text-5xl md:text-6xl font-display font-black tracking-tighter mb-4">{tool.name}</h1>
                        <p className="text-xl text-text-muted font-medium max-w-2xl">{tool.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                    <button
                        onClick={handleShare}
                        disabled={!shareValue}
                        className={`btn-secondary flex items-center gap-3 transition-all ${shareFeedback ? 'border-success text-success' : ''}`}
                    >
                        {shareFeedback ? <Icons.Check className="w-4 h-4" /> : <Icons.Share2 className="w-4 h-4" />}
                        <span>{shareFeedback ? 'Copied URL' : 'Share State'}</span>
                    </button>
                    <button
                        onClick={() => toggleFavorite(tool.slug)}
                        className={`btn-secondary flex items-center gap-3 transition-all ${starred ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' : ''}`}
                    >
                        <Icons.Star className={`w-4 h-4 ${starred ? 'fill-current' : ''}`} />
                        <span>{starred ? 'Favorited' : 'Favorite'}</span>
                    </button>
                </div>
            </div>

            {/* Tool Main Content */}
            <div className="relative z-10 isolate min-h-[400px] min-w-0">
                {children}
            </div>

            {/* SEO/Content Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-16 py-16 border-t border-border/60 mt-16">
                <div className="space-y-8">
                    <h2 className="text-3xl font-display font-black tracking-tight">How to use {tool.name}</h2>
                    <div className="space-y-6 text-text-muted font-medium leading-relaxed">
                        <p>
                            This {tool.name.toLowerCase()} is designed to be blazingly fast and 100% secure.
                            Everything runs inside your browser sandbox.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex gap-4">
                                <span className="text-accent font-black">01</span> Input your data in the provided text area.
                            </li>
                            <li className="flex gap-4">
                                <span className="text-accent font-black">02</span> The tool will automatically process your input in real-time.
                            </li>
                            <li className="flex gap-4">
                                <span className="text-accent font-black">03</span> Check the output section for the results.
                            </li>
                            <li className="flex gap-4">
                                <span className="text-accent font-black">04</span> Use the copy button to save the result.
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="space-y-8">
                    <h2 className="text-3xl font-display font-black tracking-tight">FAQ</h2>
                    <div className="space-y-4">
                        <details className="group border border-border bg-background-card p-6 cursor-pointer hover:border-text-primary/30 transition-colors">
                            <summary className="font-display font-bold text-lg list-none flex justify-between items-center text-text-primary">
                                Is my data safe?
                                <Icons.Plus className="w-5 h-5 group-open:rotate-45 transition-transform" />
                            </summary>
                            <p className="mt-4 text-text-muted font-medium leading-relaxed">
                                Yes. All processing happens locally in your browser leveraging WebAssembly or standard JS. We never send your data to any server. Your privacy is structurally guaranteed.
                            </p>
                        </details>
                        <details className="group border border-border bg-background-card p-6 cursor-pointer hover:border-text-primary/30 transition-colors">
                            <summary className="font-display font-bold text-lg list-none flex justify-between items-center text-text-primary">
                                Is this tool free?
                                <Icons.Plus className="w-5 h-5 group-open:rotate-45 transition-transform" />
                            </summary>
                            <p className="mt-4 text-text-muted font-medium leading-relaxed">
                                Absolutely. DevWallah is built by developers, for developers, and will always be free to use.
                            </p>
                        </details>
                    </div>
                </div>
            </section>

            {/* Related Tools */}
            {relatedTools.length > 0 && (
                <section className="relative z-0 space-y-8 pt-12 border-t border-border">
                    <h2 className="text-2xl font-bold">Related {tool.category} Tools</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {relatedTools.map(t => (
                            <ToolCard key={t.slug} tool={t} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
