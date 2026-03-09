"use client";

import React, { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, FileJson, Minus, Plus } from "lucide-react";

export default function JSONFormatterPage() {
    const tool = getToolBySlug("json-formatter")!;
    const [indent, setIndent] = useState(2);

    const {
        input,
        setInput,
        output,
        error,
        showCopyFeedback,
        handleCopy,
        handleClear,
    } = useTool<string>({
        onProcess: (val) => {
            const parsed = JSON.parse(val);
            return JSON.stringify(parsed, null, indent);
        },
        debounceMs: 100,
    });

    const handleBeautify = () => {
        try {
            const parsed = JSON.parse(input);
            const formatted = JSON.stringify(parsed, null, indent);
            setInput(formatted);
        } catch (e) { }
    };

    const handleMinify = () => {
        try {
            const parsed = JSON.parse(input);
            const minified = JSON.stringify(parsed);
            setInput(minified);
        } catch (e) { }
    };

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Input Panel */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label">Input JSON</label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleClear}
                                className="text-text-muted hover:text-error transition-colors p-1"
                                title="Clear input"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className={`input-field flex-grow min-h-[400px] resize-none ${error ? 'border-error/50' : ''}`}
                        placeholder='Paste your JSON here (e.g. {"name": "DevToolbox", "active": true})'
                    />
                    {error && (
                        <div className="bg-error/10 border border-error/20 text-error text-xs p-3 rounded-lg font-mono">
                            Error: {error}
                        </div>
                    )}
                </div>

                {/* Output Panel */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <label className="label">Formatted Output</label>
                            <div className="flex items-center bg-background-input border border-border rounded-lg px-2 py-0.5">
                                <span className="text-[10px] font-bold text-text-muted mr-2">INDENT</span>
                                <button onClick={() => setIndent(Math.max(1, indent - 1))} className="p-0.5 hover:text-accent"><Minus className="w-3 h-3" /></button>
                                <span className="text-xs font-mono w-4 text-center">{indent}</span>
                                <button onClick={() => setIndent(Math.min(8, indent + 1))} className="p-0.5 hover:text-accent"><Plus className="w-3 h-3" /></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => output && handleCopy(output)}
                                disabled={!output}
                                className={`btn-secondary py-1 text-xs flex items-center gap-2 ${showCopyFeedback ? 'text-success border-success/50' : ''}`}
                            >
                                {showCopyFeedback ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                                <span>{showCopyFeedback ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative flex-grow">
                        <div className="absolute inset-0 bg-background-input border border-border rounded-lg p-3 font-mono text-sm overflow-auto whitespace-pre">
                            {output || <span className="text-text-muted italic">Waiting for valid JSON input...</span>}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handleBeautify} className="btn-primary flex-1 py-2 text-sm">Beautify</button>
                        <button onClick={handleMinify} className="btn-secondary flex-1 py-2 text-sm">Minify</button>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
