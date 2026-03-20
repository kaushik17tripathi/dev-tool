"use client";

import React, { useState, useMemo } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Clipboard, Check, Trash2, ArrowRight } from "lucide-react";

const EXAMPLE = `{
  "name": "DevToolbox",
  "version": "1.0.0",
  "tags": ["developer", "tools"],
  "active": true
}`;

export default function JsonMinifyStringifyPage() {
    const tool = getToolBySlug("json-minify-stringify")!;
    const [input, setInput] = useState(EXAMPLE);
    const [mode, setMode] = useState<"minify" | "stringify">("minify");
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const output = useMemo(() => {
        if (!input.trim()) return "";
        try {
            const parsed = JSON.parse(input);
            setError(null);
            if (mode === "minify") {
                return JSON.stringify(parsed);
            } else {
                // Stringify: minify then escape it as a string literal
                const minified = JSON.stringify(parsed);
                return JSON.stringify(minified);
            }
        } catch (e: any) {
            setError(e.message);
            return "";
        }
    }, [input, mode]);

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex gap-2 bg-background-input rounded-xl p-1 border border-border w-fit">
                    <button
                        onClick={() => setMode("minify")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "minify" ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"}`}
                    >
                        Minify
                    </button>
                    <button
                        onClick={() => setMode("stringify")}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === "stringify" ? "bg-accent text-white" : "text-text-muted hover:text-text-primary"}`}
                    >
                        Stringify (to string literal)
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Input */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label className="label">Input JSON</label>
                            <button onClick={() => setInput("")} className="text-text-muted hover:text-error transition-colors p-1" title="Clear">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className={`input-field h-[400px] font-mono text-sm resize-none leading-relaxed ${error ? "border-error/50" : ""}`}
                            placeholder='{"key": "value"}'
                            spellCheck="false"
                        />
                        {error && (
                            <div className="bg-error/10 border border-error/20 text-error text-xs p-3 rounded-lg font-mono">
                                ✗ {error}
                            </div>
                        )}
                    </div>

                    {/* Output */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label className="label">
                                {mode === "minify" ? "Minified JSON" : "Stringified (escaped) JSON"}
                            </label>
                            <button
                                onClick={handleCopy}
                                disabled={!output}
                                className={`btn-secondary py-1 text-xs flex items-center gap-2 ${copyFeedback ? "text-success border-success/50" : ""}`}
                            >
                                {copyFeedback ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                                {copyFeedback ? "Copied!" : "Copy"}
                            </button>
                        </div>
                        <div className="bg-background-input border border-border rounded-xl p-4 h-[400px] font-mono text-sm break-all overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {output || <span className="text-text-muted italic">Output will appear here…</span>}
                        </div>
                    </div>
                </div>

                {mode === "stringify" && (
                    <p className="text-xs text-text-muted bg-background-input border border-border rounded-lg p-3">
                        💡 <strong>Stringify mode</strong> minifies the JSON and wraps it in JSON encoding — producing a valid string literal ready for use in code (e.g., an environment variable or a JSON key value).
                    </p>
                )}
            </div>
        </ToolLayout>
    );
}
