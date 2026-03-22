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

    const outputText = error ? `Invalid input: ${error}` : output || "Waiting for input...";
    const outputHasValue = !!output && !error;

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Input Panel */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label text-lg font-semibold text-slate-200">
                            {mode === "encode" ? "Text to Encode" : "Base64 to Decode"}
                        </label>
                        <button
                            onClick={handleClear}
                            className="text-slate-400 hover:text-red-400 transition-colors p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            title="Clear input"
                            aria-label="Clear input"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>

                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className={`w-full min-h-[260px] max-h-[520px] rounded-2xl border ${error ? 'border-red-500' : 'border-slate-700'} bg-slate-950 text-slate-100 p-4 text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none shadow-sm ${error ? 'ring-2 ring-red-500/40' : ''}`}
                        placeholder={mode === "encode" ? "Enter plain text here..." : "Enter Base64 string here..."}
                        aria-label={mode === "encode" ? "Text to encode" : "Base64 to decode"}
                    />
                </div>

                {/* Controls (Absolute on large, relative on small) */}
                <div className="hidden lg:flex flex-col justify-center items-center -mx-4 z-10">
                    <button
                        onClick={toggleMode}
                        className="bg-indigo-600 hover:bg-indigo-500 p-3 rounded-full hover:scale-110 active:scale-95 transition-all shadow-lg text-white border border-indigo-400"
                        title="Switch Mode"
                        aria-label="Toggle encode/decode mode"
                    >
                        <ArrowDownUp className="w-6 h-6" />
                    </button>
                </div>

                <div className="lg:hidden flex justify-center py-2">
                    <button
                        onClick={toggleMode}
                        className="bg-slate-800 hover:bg-slate-700 text-white py-2 px-6 rounded-xl flex items-center gap-2 shadow-sm"
                    >
                        <ArrowDownUp className="w-4 h-4" />
                        <span className="text-sm">Switch to {mode === "encode" ? "Decoding" : "Encoding"}</span>
                    </button>
                </div>

                {/* Output Panel */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label text-lg font-semibold text-slate-200">{mode === "encode" ? "Base64 Encoded" : "Decoded Text"}</label>
                        <button
                            onClick={() => output && handleCopy(output)}
                            disabled={!outputHasValue}
                            className={`py-2 px-3 flex items-center gap-2 text-sm font-medium rounded-lg border transition-all ${outputHasValue ? 'bg-indigo-600 text-white border-indigo-400 hover:bg-indigo-500' : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'} ${showCopyFeedback ? 'ring-2 ring-emerald-400' : ''}`}
                            aria-label="Copy decoded text to clipboard"
                        >
                            {showCopyFeedback ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                            <span>{showCopyFeedback ? 'Copied!' : 'Copy to Clipboard'}</span>
                        </button>
                    </div>

                    <div className="rounded-2xl border border-slate-700 bg-slate-950 shadow-lg p-3 min-h-[260px] max-h-[540px] overflow-auto">
                        <textarea
                            readOnly
                            value={outputText}
                            className={`w-full min-h-[220px] max-h-[520px] h-auto rounded-lg border ${error ? 'border-red-500 bg-red-950/20 text-red-100' : 'border-slate-700 bg-slate-900 text-slate-100'} p-4 text-sm leading-relaxed resize-none outline-none whitespace-pre-wrap break-words overflow-auto`}
                            aria-label={mode === "encode" ? "Base64 output" : "Decoded output"}
                        />
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
