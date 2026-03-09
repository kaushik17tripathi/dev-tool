"use client";

import React, { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, ArrowDownUp } from "lucide-react";

export default function Base64Page() {
    const tool = getToolBySlug("base64-encoder-decoder")!;
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
                return btoa(val);
            } else {
                return atob(val);
            }
        },
    });

    const toggleMode = () => {
        const nextMode = mode === "encode" ? "decode" : "encode";
        setMode(nextMode);

        // Swap input and output if valid
        if (output && !error) {
            setInput(output);
        }
    };

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Input Panel */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label">{mode === "encode" ? "Text to Encode" : "Base64 to Decode"}</label>
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
                        className={`input-field flex-grow min-h-[300px] resize-none ${error ? 'border-error/50' : ''}`}
                        placeholder={mode === "encode" ? "Enter plain text here..." : "Enter Base64 string here..."}
                    />
                </div>

                {/* Controls (Absolute on large, relative on small) */}
                <div className="hidden lg:flex flex-col justify-center items-center -mx-4 z-10">
                    <button
                        onClick={toggleMode}
                        className="bg-accent p-3 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg text-white"
                        title="Switch Mode"
                    >
                        <ArrowDownUp className="w-6 h-6" />
                    </button>
                </div>

                <div className="lg:hidden flex justify-center py-2">
                    <button
                        onClick={toggleMode}
                        className="btn-secondary py-2 px-6 flex items-center gap-2"
                    >
                        <ArrowDownUp className="w-4 h-4" />
                        <span>Switch to {mode === "encode" ? "Decoding" : "Encoding"}</span>
                    </button>
                </div>

                {/* Output Panel */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label">{mode === "encode" ? "Base64 Encoded" : "Decoded Text"}</label>
                        <button
                            onClick={() => output && handleCopy(output)}
                            disabled={!output}
                            className={`btn-secondary py-1 text-xs flex items-center gap-2 ${showCopyFeedback ? 'text-success border-success/50' : ''}`}
                        >
                            {showCopyFeedback ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                            <span>{showCopyFeedback ? 'Copied' : 'Copy Result'}</span>
                        </button>
                    </div>

                    <div className="relative flex-grow">
                        <div className={`absolute inset-0 bg-background-input border border-border rounded-lg p-3 font-mono text-sm overflow-auto break-all ${error ? 'text-error bg-error/5' : ''}`}>
                            {error ? `Invalid input: ${error}` : (output || <span className="text-text-muted italic">Waiting for input...</span>)}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
