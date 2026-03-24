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
            <div className="relative h-[500px]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                    {/* Input Panel */}
                    <div className="space-y-4 flex flex-col h-full">
                        <div className="flex items-center justify-between flex-shrink-0">
                            <label className="label uppercase tracking-widest mb-0">{mode === "encode" ? "URL to Encode" : "Encoded URL to Decode"}</label>
                            <button onClick={handleClear} className="text-text-muted hover:text-error transition-colors p-1" title="Clear input">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            className="input-field flex-grow resize-none p-4 font-mono text-sm overflow-y-auto"
                            placeholder={mode === "encode" ? "e.g. https://example.com/search?q=hello world" : "e.g. https%3A%2F%2Fexample.com%2Fsearch%3Fq%3Dhello%20world"}
                            spellCheck="false"
                        />
                    </div>

                    {/* Output Panel */}
                    <div className="space-y-4 flex flex-col h-full">
                        <div className="flex items-center justify-between flex-shrink-0">
                            <label className="label uppercase tracking-widest mb-0">{mode === "encode" ? "Encoded Result" : "Decoded Result"}</label>
                            <button
                                onClick={() => output && handleCopy(output)}
                                disabled={!output}
                                className={`btn-secondary py-1 text-xs px-3 flex items-center gap-2 ${showCopyFeedback ? 'text-success border-success/50' : ''}`}
                            >
                                {showCopyFeedback ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                                <span>{showCopyFeedback ? 'Copied' : 'Copy Result'}</span>
                            </button>
                        </div>
                        
                        <div className="flex-grow flex flex-col gap-4">
                            <textarea
                                value={error ? `Error: ${error}` : (output ?? "")}
                                readOnly
                                className={`input-field flex-grow resize-none font-mono text-sm p-4 overflow-y-auto bg-background-input/50 ${error ? 'text-error border-error/30' : ''}`}
                                placeholder="Output will appear here..."
                            />
                            
                            <div className="bg-background-card border border-border rounded-xl p-4 flex gap-3 text-xs text-text-muted italic flex-shrink-0">
                                <Globe className="w-4 h-4 text-accent shrink-0" />
                                <p>This tool uses <code>encodeURIComponent</code> for encoding to ensure all reserved characters are safely escaped for query parameters.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mode Toggle - Desktop (Floating Center) */}
                <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <button
                        onClick={toggleMode}
                        className="bg-accent p-4 rounded-full hover:scale-110 active:scale-95 transition-all shadow-xl shadow-accent/20 text-white group"
                        title={`Switch to ${mode === "encode" ? "Decode" : "Encode"}`}
                    >
                        <ArrowDownUp className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                </div>

                {/* Mode Toggle - Mobile (Fixed bottom or between) */}
                <div className="lg:hidden flex justify-center mt-4">
                    <button
                        onClick={toggleMode}
                        className="btn-primary py-2 px-6 flex items-center gap-3 rounded-full shadow-lg"
                    >
                        <ArrowDownUp className="w-4 h-4" />
                        <span className="font-bold">Switch to {mode === "encode" ? "Decoding" : "Encoding"}</span>
                    </button>
                </div>
            </div>
        </ToolLayout>
    );
}
