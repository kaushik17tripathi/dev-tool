"use client";

import React, { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Clipboard, Check, CalendarClock } from "lucide-react";

export default function CronGeneratorPage() {
    const tool = getToolBySlug("cron-generator")!;
    const [input, setInput] = useState("* * * * *");
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(input);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    };

    // Simple predefined presets
    const presets = [
        { label: "Every minute", value: "* * * * *" },
        { label: "Every hour", value: "0 * * * *" },
        { label: "Daily at midnight", value: "0 0 * * *" },
        { label: "Every Monday at 9AM", value: "0 9 * * 1" },
        { label: "Every 15 minutes", value: "*/15 * * * *" },
    ];

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="max-w-3xl mx-auto space-y-12 py-8">
                <div className="bg-background-card border border-border rounded-2xl p-8 space-y-8 shadow-2xl">
                    <div className="space-y-4">
                        <label className="label uppercase tracking-widest text-center block">Cron Expression</label>
                        <div className="relative group">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                className="w-full bg-background-input border border-border rounded-xl py-6 text-center text-4xl font-mono font-bold text-accent focus:ring-2 focus:ring-accent outline-none"
                            />
                            <div className="absolute inset-0 border border-accent/20 rounded-xl pointer-events-none group-hover:border-accent/40 transition-colors" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                        {input.split(' ').map((part, i) => (
                            <div key={i} className="bg-background-input/50 border border-border rounded-lg p-3 text-center">
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">
                                    {['Min', 'Hour', 'Day', 'Month', 'Weekday'][i]}
                                </p>
                                <p className="font-mono text-lg">{part}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleCopy}
                            className="btn-primary flex-1 py-4 flex items-center justify-center gap-2 text-lg"
                        >
                            {showCopyFeedback ? <Check className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
                            <span>{showCopyFeedback ? 'Copied' : 'Copy Expression'}</span>
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-bold">Quick Presets</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {presets.map((p) => (
                            <button
                                key={p.label}
                                onClick={() => setInput(p.value)}
                                className="flex items-center justify-between p-4 bg-background-input hover:bg-background-input/80 border border-border rounded-xl group transition-all"
                            >
                                <span className="font-medium group-hover:text-accent transition-colors">{p.label}</span>
                                <code className="text-xs bg-accent/10 text-accent px-2 py-1 rounded">{p.value}</code>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
