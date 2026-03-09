"use client";

import React from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, Binary } from "lucide-react";

export default function TextToUnicodePage() {
    const tool = getToolBySlug("text-to-unicode")!;

    const {
        input,
        setInput,
        output,
        showCopyFeedback,
        handleCopy,
        handleClear,
    } = useTool<string>({
        onProcess: (val) => {
            if (!val) return "";
            return val.split('').map(char => {
                const unicode = char.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0');
                return `\\u${unicode}`;
            }).join('');
        },
        debounceMs: 50,
    });

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">Input Text</label>
                        <button onClick={handleClear} className="text-text-muted hover:text-error transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field flex-grow min-h-[400px] resize-none text-lg"
                        placeholder="Type status message or code..."
                    />
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">Unicode Escape</label>
                        <button
                            onClick={() => output && handleCopy(output)}
                            disabled={!output}
                            className={`btn-secondary py-1 text-xs flex items-center gap-2 ${showCopyFeedback ? 'text-success border-success/50' : ''}`}
                        >
                            {showCopyFeedback ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                            <span>{showCopyFeedback ? 'Copied' : 'Copy'}</span>
                        </button>
                    </div>
                    <div className="relative flex-grow">
                        <div className="absolute inset-0 bg-background-input border border-border rounded-lg p-3 font-mono text-sm overflow-auto whitespace-pre-wrap break-all">
                            {output || <span className="text-text-muted italic">Result will appear here...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
