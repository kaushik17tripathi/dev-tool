"use client";

import React, { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Trash2, Type } from "lucide-react";

export default function WordCounterPage() {
    const tool = getToolBySlug("word-counter")!;
    const [input, setInput] = useState("");

    const stats = {
        words: input.trim().split(/\s+/).filter(w => w.length > 0).length,
        characters: input.length,
        charsNoSpaces: input.replace(/\s/g, "").length,
        sentences: input.split(/[.!?]+/).filter(s => s.trim().length > 0).length,
        paragraphs: input.split(/\n+/).filter(p => p.trim().length > 0).length,
        readingTime: Math.ceil(input.trim().split(/\s+/).filter(w => w.length > 0).length / 200),
    };

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="max-w-4xl mx-auto space-y-8 py-8">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                        { label: 'Words', value: stats.words },
                        { label: 'Chars', value: stats.characters },
                        { label: 'Sentences', value: stats.sentences },
                        { label: 'Paragraphs', value: stats.paragraphs },
                        { label: 'No Spaces', value: stats.charsNoSpaces },
                        { label: 'Read Time', value: `${stats.readingTime}m` },
                    ].map((s) => (
                        <div key={s.label} className="bg-background-card border border-border rounded-xl p-4 text-center shadow-sm">
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{s.label}</p>
                            <p className="text-xl font-bold text-accent">{s.value}</p>
                        </div>
                    ))}
                </div>

                <div className="space-y-4 flex flex-col relative">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest font-bold">Text Analyzer</label>
                        <button
                            onClick={() => setInput("")}
                            className="text-text-muted hover:text-error transition-colors p-1"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field w-full min-h-[400px] resize-none text-lg p-6"
                        placeholder="Type or paste your content here..."
                    />
                </div>
            </div>
        </ToolLayout>
    );
}
