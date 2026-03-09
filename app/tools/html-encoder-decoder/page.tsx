"use client";

import React from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, Code2 } from "lucide-react";

export default function HTMLEncoderDecoderPage() {
    const tool = getToolBySlug("html-encoder-decoder")!;

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
            // Basic implementation: defaults to encode if not obvious
            // But we can add a toggle. For now let's do both side by side or a toggle.
            // Better: Two output panes or a selector. 
            // Let's implement both encode and decode.
            return ``; // Placeholder, as we'll use a better structure below
        },
        debounceMs: 50,
    });

    const encode = (str: string) => {
        return str.replace(/[\u00A0-\u9999<>\&]/g, (i) => {
            return '&#' + i.charCodeAt(0) + ';';
        });
    };

    const decode = (str: string) => {
        return str.replace(/&#(\d+);/g, (match, dec) => {
            return String.fromCharCode(dec);
        });
    };

    const currentEncode = encode(input);
    const currentDecode = decode(input);

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">Input Text / Entities</label>
                        <button onClick={handleClear} className="text-text-muted hover:text-error transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field flex-grow min-h-[300px] resize-none font-mono text-sm"
                        placeholder="Type <script>alert(1)</script> or &#60;script&#62;..."
                    />
                </div>

                <div className="space-y-6 flex flex-col">
                    <div className="space-y-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                            <label className="label uppercase tracking-widest">Encoded (Entities)</label>
                            <button
                                onClick={() => handleCopy(currentEncode)}
                                className={`btn-secondary py-1 text-xs flex items-center gap-2 ${showCopyFeedback ? 'text-success' : ''}`}
                            >
                                {showCopyFeedback ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                                <span>Copy</span>
                            </button>
                        </div>
                        <div className="bg-background-input border border-border rounded-lg p-3 font-mono text-sm break-all h-[150px] overflow-auto">
                            {currentEncode || <span className="text-text-muted">Result will appear here...</span>}
                        </div>
                    </div>

                    <div className="space-y-4 flex flex-col flex-1">
                        <div className="flex items-center justify-between">
                            <label className="label uppercase tracking-widest">Decoded (Raw)</label>
                            <button
                                onClick={() => handleCopy(currentDecode)}
                                className={`btn-secondary py-1 text-xs flex items-center gap-2 ${showCopyFeedback ? 'text-success' : ''}`}
                            >
                                {showCopyFeedback ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
                                <span>Copy</span>
                            </button>
                        </div>
                        <div className="bg-background-input border border-border rounded-lg p-3 font-mono text-sm h-[150px] overflow-auto">
                            {currentDecode || <span className="text-text-muted">Result will appear here...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
