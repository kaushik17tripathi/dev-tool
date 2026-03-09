"use client";

import React, { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, ArrowDownUp, Globe } from "lucide-react";

export default function URLEncoderPage() {
    const tool = getToolBySlug("url-encoder-decoder")!;
    const [mode, setMode] = useState<"encode" | "decode">("encode");

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
            if (mode === "encode") {
                return encodeURIComponent(val);
            } else {
                return decodeURIComponent(val);
            }
        },
    });

    const toggleMode = () => {
        const nextMode = mode === "encode" ? "decode" : "encode";
        setMode(nextMode);
        if (output && !error) setInput(output);
    };

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Input Panel */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">{mode === "encode" ? "URL to Encode" : "Encoded URL to Decode"}</label>
                        <button onClick={handleClear} className="text-text-muted hover:text-error transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field flex-grow min-h-[300px] resize-none"
                        placeholder={mode === "encode" ? "e.g. https://example.com/search?q=hello world" : "e.g. https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world"}
                    />
                </div>

                {/* Controls */}
                <div className="hidden lg:flex flex-col justify-center items-center -mx-4 z-10">
                    <button onClick={toggleMode} className="bg-accent p-3 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg text-white">
                        <ArrowDownUp className="w-6 h-6" />
                    </button>
                </div>

                {/* Output Panel */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">{mode === "encode" ? "Encoded Result" : "Decoded Result"}</label>
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
                        <div className={`absolute inset-0 bg-background-input border border-border rounded-lg p-3 font-mono text-sm overflow-auto break-all ${error ? 'text-error bg-error/5' : ''}`}>
                            {error ? `Invalid URL: ${error}` : (output || <span className="text-text-muted italic">Waiting for input...</span>)}
                        </div>
                    </div>

                    <div className="bg-background-card border border-border rounded-xl p-4 flex gap-3 text-xs text-text-muted italic">
                        <Globe className="w-4 h-4 text-accent shrink-0" />
                        <p>This tool uses <code>encodeURIComponent</code> for encoding to ensure all reserved characters are safely escaped for query parameters.</p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
