"use client";

import React, { useState, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { v4 as uuidv4 } from "uuid";
import { Clipboard, RefreshCw, Check, Plus, Minus } from "lucide-react";

export default function UUIDGeneratorPage() {
    const tool = getToolBySlug("uuid-generator")!;
    const [uuids, setUuids] = useState<string[]>([]);
    const [count, setCount] = useState(5);
    const [showCopyFeedback, setShowCopyFeedback] = useState<number | null>(null);

    const generateUUIDs = () => {
        const newUuids = Array.from({ length: count }, () => uuidv4());
        setUuids(newUuids);
    };

    useEffect(() => {
        generateUUIDs();
    }, [count]);

    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setShowCopyFeedback(index);
        setTimeout(() => setShowCopyFeedback(null), 2000);
    };

    const copyAll = () => {
        navigator.clipboard.writeText(uuids.join("\n"));
        setShowCopyFeedback(-1); // -1 for "All"
        setTimeout(() => setShowCopyFeedback(null), 2000);
    };

    return (
        <ToolLayout tool={tool}>
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="card space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-text-muted uppercase">Number of UUIDs</span>
                            <div className="flex items-center bg-background-input border border-border rounded-xl p-1">
                                <button
                                    onClick={() => setCount(Math.max(1, count - 1))}
                                    className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-text-muted"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <input
                                    type="number"
                                    value={count}
                                    onChange={(e) => setCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                                    className="bg-transparent border-none text-center w-12 font-bold focus:ring-0 text-text-primary"
                                />
                                <button
                                    onClick={() => setCount(Math.min(100, count + 1))}
                                    className="p-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-text-muted"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={generateUUIDs} className="btn-secondary flex items-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                <span>Regenerate</span>
                            </button>
                            <button onClick={copyAll} className={`btn-primary flex items-center gap-2 ${showCopyFeedback === -1 ? 'bg-success hover:bg-success' : ''}`}>
                                {showCopyFeedback === -1 ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                                <span>{showCopyFeedback === -1 ? 'Copied All' : 'Copy All'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {uuids.map((id, index) => (
                            <div
                                key={index}
                                className="group flex items-center justify-between bg-background-input border border-border hover:border-accent/40 rounded-xl p-4 transition-all"
                            >
                                <code className="text-accent font-mono text-sm md:text-base break-all">{id}</code>
                                <button
                                    onClick={() => handleCopy(id, index)}
                                    className={`ml-4 p-2 rounded-lg transition-all ${showCopyFeedback === index ? 'text-success bg-success/10' : 'text-text-muted hover:text-accent hover:bg-accent/10'}`}
                                >
                                    {showCopyFeedback === index ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
