"use client";

import React, { useState } from "react";
import Link from "next/link";
import * as Icons from "lucide-react";
import { type Tool, tools } from "@/lib/toolRegistry";
import ToolCard from "@/components/ui/ToolCard";
import { useFavorites } from "@/hooks/useFavorites";
import { getShareUrl } from "@/lib/shareUtils";

interface ToolLayoutProps {
    tool: Tool;
    children: React.ReactNode;
    shareValue?: string;
}

export default function ToolLayout({ tool, children, shareValue }: ToolLayoutProps) {
    const { toggleFavorite, isFavorite } = useFavorites();
    const [shareFeedback, setShareFeedback] = useState(false);
    const IconComponent = (Icons as any)[tool.icon] || Icons.HelpCircle;

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

    return (
        <div className="space-y-12">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-text-muted">
                <Link href="/" className="hover:text-accent transition-colors">Home</Link>
                <Icons.ChevronRight className="w-4 h-4" />
                <span className="text-text-primary px-2 py-0.5 bg-background-input rounded border border-border">
                    {tool.category}
                </span>
                <Icons.ChevronRight className="w-4 h-4" />
                <span className="text-text-primary font-medium">{tool.name}</span>
            </nav>

            {/* Tool Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-border">
                <div className="flex items-center gap-4">
                    <div className="bg-accent/10 p-4 rounded-2xl">
                        <IconComponent className="w-8 h-8 text-accent" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">{tool.name}</h1>
                        <p className="text-text-muted mt-1">{tool.description}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleShare}
                        disabled={!shareValue}
                        className={`btn-secondary flex items-center gap-2 text-sm transition-all ${shareFeedback ? 'text-success border-success/50' : ''}`}
                    >
                        {shareFeedback ? <Icons.Check className="w-4 h-4" /> : <Icons.Share2 className="w-4 h-4" />}
                        <span>{shareFeedback ? 'Link Copied!' : 'Share'}</span>
                    </button>
                    <button
                        onClick={() => toggleFavorite(tool.slug)}
                        className={`btn-secondary flex items-center gap-2 text-sm transition-all ${starred ? 'text-yellow-500 bg-yellow-500/10 border-yellow-500/50' : ''}`}
                    >
                        <Icons.Star className={`w-4 h-4 ${starred ? 'fill-current' : ''}`} />
                        <span>{starred ? 'Favorited' : 'Favorite'}</span>
                    </button>
                </div>
            </div>

            {/* Tool Main Content */}
            <div className="min-h-[400px]">
                {children}
            </div>

            {/* SEO/Content Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 py-12 border-t border-border">
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">How to use {tool.name}</h2>
                    <div className="space-y-4 text-text-muted leading-relaxed">
                        <p>
                            This {tool.name.toLowerCase()} is designed to be fast and secure.
                            To get started, simply paste or type your content into the input area.
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Input your data in the provided text area.</li>
                            <li>The tool will automatically process your input in real-time.</li>
                            <li>Check the output section for the results.</li>
                            <li>Use the copy button to save the result to your clipboard.</li>
                        </ul>
                    </div>
                </div>
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <details className="group border border-border rounded-lg p-4 cursor-pointer hover:bg-background-input transition-colors">
                            <summary className="font-bold list-none flex justify-between items-center text-text-primary">
                                Is my data safe?
                                <Icons.ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                            </summary>
                            <p className="mt-3 text-sm text-text-muted">
                                Yes! All processing happens locally in your browser. We never send your data to any server.
                                Your privacy is our top priority.
                            </p>
                        </details>
                        <details className="group border border-border rounded-lg p-4 cursor-pointer hover:bg-background-input transition-colors">
                            <summary className="font-bold list-none flex justify-between items-center text-text-primary">
                                Is this tool free?
                                <Icons.ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                            </summary>
                            <p className="mt-3 text-sm text-text-muted">
                                Absolutely. DevToolbox is and will always be free to use for developers.
                            </p>
                        </details>
                    </div>
                </div>
            </section>

            {/* Related Tools */}
            {relatedTools.length > 0 && (
                <section className="space-y-8 pt-12 border-t border-border">
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
