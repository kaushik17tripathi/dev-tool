"use client";

import React, { useState, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Info, AlertCircle, CheckCircle2, Search } from "lucide-react";

export default function RegexTesterPage() {
    const tool = getToolBySlug("regex-tester")!;
    const [pattern, setPattern] = useState("([a-zA-Z0-9._%-]+)@([a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6})");
    const [flags, setFlags] = useState("g");
    const [input, setInput] = useState("Contact us at support@devtoolbox.dev or admin@example.com");
    const [matches, setMatches] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            if (!pattern) {
                setMatches([]);
                setError(null);
                return;
            }
            const regex = new RegExp(pattern, flags);
            const results = [];
            let match;

            if (flags.includes('g')) {
                while ((match = regex.exec(input)) !== null) {
                    results.push({
                        text: match[0],
                        index: match.index,
                        groups: match.slice(1)
                    });
                    if (match.index === regex.lastIndex) regex.lastIndex++;
                }
            } else {
                match = regex.exec(input);
                if (match) {
                    results.push({
                        text: match[0],
                        index: match.index,
                        groups: match.slice(1)
                    });
                }
            }

            setMatches(results);
            setError(null);
        } catch (e: any) {
            setError(e.message);
            setMatches([]);
        }
    }, [pattern, flags, input]);

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Input */}
                <div className="space-y-6">
                    <div className="card space-y-4">
                        <div className="space-y-2">
                            <label className="label">Regular Expression</label>
                            <div className="flex gap-2">
                                <div className="relative flex-grow">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted font-mono">/</span>
                                    <input
                                        type="text"
                                        value={pattern}
                                        onChange={(e) => setPattern(e.target.value)}
                                        className={`input-field pl-6 font-mono border-accent/30 ${error ? 'border-error/50 ring-error/20' : ''}`}
                                        placeholder="([a-z]+)"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted font-mono">/</span>
                                </div>
                                <input
                                    type="text"
                                    value={flags}
                                    onChange={(e) => setFlags(e.target.value)}
                                    className="input-field w-20 text-center font-mono border-accent/30"
                                    placeholder="gim"
                                />
                            </div>
                            {error && <p className="text-error text-[10px] font-mono mt-1 ml-1">{error}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="label">Test String</label>
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="input-field min-h-[200px] resize-none text-sm leading-relaxed"
                                placeholder="Insert text to test your regex against..."
                            />
                        </div>
                    </div>

                    <div className="bg-background-card border border-border rounded-xl p-4 flex gap-3 text-xs text-text-muted">
                        <Info className="w-4 h-4 text-accent shrink-0" />
                        <ul className="space-y-1">
                            <li><code className="bg-background-input px-1 rounded">g</code>: Global search</li>
                            <li><code className="bg-background-input px-1 rounded">i</code>: Case-insensitive</li>
                            <li><code className="bg-background-input px-1 rounded">m</code>: Multi-line</li>
                        </ul>
                    </div>
                </div>

                {/* Right: Matches */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2">
                            {matches.length > 0 ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Search className="w-5 h-5 text-text-muted" />}
                            {matches.length} Matches Found
                        </h3>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-auto pr-2">
                        {matches.length === 0 ? (
                            <div className="bg-background-input/50 border border-dashed border-border rounded-xl p-12 text-center">
                                <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-3" />
                                <p className="text-text-muted text-sm">No matches found with current pattern.</p>
                            </div>
                        ) : (
                            matches.map((m, i) => (
                                <div key={i} className="card p-4 hover:border-accent/30 transition-colors">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-accent text-[10px] font-bold px-1.5 py-0.5 rounded text-white uppercase tracking-tighter">Match {i + 1}</span>
                                        <span className="text-text-muted text-[10px] font-mono italic">Index: {m.index}</span>
                                    </div>
                                    <code className="block bg-background-input p-2 rounded border border-border text-success font-mono text-sm break-all">{m.text}</code>

                                    {m.groups.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            <p className="text-[10px] font-bold text-text-muted uppercase">Groups</p>
                                            <div className="flex flex-wrap gap-2">
                                                {m.groups.map((g: string, j: number) => (
                                                    <div key={j} className="bg-background-input border border-border rounded px-2 py-1 text-xs">
                                                        <span className="text-text-muted mr-2 font-mono">{j + 1}:</span>
                                                        <span className="font-mono text-accent">{g || 'null'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
