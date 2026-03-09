"use client";

import React from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, FileCode2 } from "lucide-react";

export default function XMLFormatterPage() {
    const tool = getToolBySlug("xml-formatter")!;

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
            if (!val) return "";

            let formatted = '';
            let indent = '';
            const tab = '  ';
            val.split(/>\s*</).forEach((node) => {
                if (node.match(/^\/\w/)) indent = indent.substring(tab.length);
                formatted += indent + '<' + node + '>\r\n';
                if (node.match(/^<?\w[^>]*[^\/]$/)) indent += tab;
            });
            return formatted.substring(1, formatted.length - 3);
        },
        debounceMs: 300,
    });

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">Input XML</label>
                        <button onClick={handleClear} className="text-text-muted hover:text-error transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field flex-grow min-h-[400px] resize-none font-mono text-sm"
                        placeholder="<root><user id='1'><name>John</name></user></root>"
                    />
                    {error && <p className="text-error text-xs font-mono">{error}</p>}
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">Formatted XML</label>
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
                        <div className="absolute inset-0 bg-background-input border border-border rounded-lg p-3 font-mono text-sm overflow-auto whitespace-pre">
                            {output || <span className="text-text-muted italic">Waiting for XML input...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
