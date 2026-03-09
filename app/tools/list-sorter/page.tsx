"use client";

import React, { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Clipboard, Trash2, Check, SortAsc, SortDesc } from "lucide-react";

export default function ListSorterPage() {
    const tool = getToolBySlug("list-sorter")!;
    const [input, setInput] = useState("");
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);

    const sortLines = (direction: 'asc' | 'desc') => {
        const lines = input.split(/\r?\n/).filter(line => line.trim() !== "");
        const sorted = [...lines].sort((a, b) => {
            const result = a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
            return direction === 'asc' ? result : -result;
        });
        setInput(sorted.join('\n'));
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(input);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    };

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="max-w-4xl mx-auto space-y-8 py-8">
                <div className="flex gap-4">
                    <button onClick={() => sortLines('asc')} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                        <SortAsc className="w-5 h-5" />
                        Sort A-Z
                    </button>
                    <button onClick={() => sortLines('desc')} className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2">
                        <SortDesc className="w-5 h-5" />
                        Sort Z-A
                    </button>
                </div>

                <div className="space-y-4 flex flex-col relative">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest font-bold">List Items (One per line)</label>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopy}
                                className={`p-1.5 rounded-lg transition-colors ${showCopyFeedback ? 'text-success' : 'text-text-muted hover:text-accent'}`}
                            >
                                {showCopyFeedback ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => setInput("")}
                                className="text-text-muted hover:text-error p-1.5"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field w-full min-h-[400px] resize-none text-lg p-6 font-mono"
                        placeholder="Apple
Banana
Cherry
10
2"
                    />
                </div>
            </div>
        </ToolLayout>
    );
}
