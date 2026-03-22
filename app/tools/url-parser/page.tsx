"use client";

import React, { useState, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Trash2, Link2, Clipboard, Check } from "lucide-react";

export default function URLParserPage() {
    const tool = getToolBySlug("url-parser")!;
    const [input, setInput] = useState("");
    const [showCopyFeedback, setShowCopyFeedback] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setShowCopyFeedback(id);
        setTimeout(() => setShowCopyFeedback(null), 2000);
    };

    const parsedUrl = React.useMemo(() => {
        if (!input) return null;
        try {
            const url = new URL(input);
            const params = Array.from(url.searchParams.entries()).map(([k, v]) => ({ key: k, value: v }));
            return {
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port || (url.protocol === 'https:' ? '443' : '80'),
                pathname: url.pathname,
                search: url.search,
                hash: url.hash,
                params,
            };
        } catch (e) {
            return { error: "Invalid URL. Please include the protocol (e.g., https://)" };
        }
    }, [input]);

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="max-w-4xl mx-auto space-y-8 py-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="label uppercase tracking-widest font-bold">Paste URL</label>
                        <button onClick={() => setInput("")} className="text-text-muted hover:text-error p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field w-full text-lg"
                        placeholder="https://example.com/path?name=DevWallah#top"
                    />
                </div>

                {!parsedUrl ? (
                    <div className="bg-background-input/30 border border-dashed border-border rounded-2xl p-20 text-center text-text-muted italic">
                        Parse your URL to see components...
                    </div>
                ) : 'error' in parsedUrl ? (
                    <p className="text-error text-center py-12 font-mono">{(parsedUrl as any).error}</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'Protocol', value: parsedUrl.protocol },
                            { label: 'Hostname', value: parsedUrl.hostname },
                            { label: 'Path', value: parsedUrl.pathname },
                            { label: 'Hash', value: parsedUrl.hash || '(none)' },
                        ].map((item) => (
                            <div key={item.label} className="bg-background-card border border-border rounded-xl p-5 flex items-center justify-between group hover:border-accent/30 transition-colors">
                                <div>
                                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{item.label}</label>
                                    <p className="font-mono text-lg truncate pr-2">{item.value}</p>
                                </div>
                                <button
                                    onClick={() => handleCopy(item.value, item.label)}
                                    className={`p-2 rounded-lg transition-colors ${showCopyFeedback === item.label ? 'text-success' : 'text-text-muted hover:text-accent'}`}
                                >
                                    {showCopyFeedback === item.label ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                                </button>
                            </div>
                        ))}

                        <div className="col-span-1 md:col-span-2 bg-background-card border border-border rounded-xl p-6 space-y-4">
                            <label className="label uppercase tracking-widest font-bold">Query Parameters</label>
                            {parsedUrl.params.length > 0 ? (
                                <div className="space-y-2">
                                    {parsedUrl.params.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-background-input p-3 rounded-lg border border-border">
                                            <span className="text-accent font-mono font-bold">{p.key}</span>
                                            <span className="text-text-muted opacity-50">=</span>
                                            <span className="text-text-primary font-mono truncate">{p.value}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-text-muted italic text-sm">No parameters found.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
