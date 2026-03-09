"use client";

import React from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, FileJson } from "lucide-react";

export default function CSVToJSONPage() {
    const tool = getToolBySlug("csv-to-json")!;

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
            const lines = val.trim().split(/\r?\n/);
            if (lines.length < 2) return "[]";

            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            const result = lines.slice(1).map(line => {
                const data = line.split(',').map(d => d.trim().replace(/^"|"$/g, ''));
                return headers.reduce((obj: any, header, index) => {
                    obj[header] = data[index] || "";
                    return obj;
                }, {});
            });

            return JSON.stringify(result, null, 2);
        },
        debounceMs: 200,
    });

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">Input CSV</label>
                        <button onClick={handleClear} className="text-text-muted hover:text-error transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field flex-grow min-h-[400px] resize-none"
                        placeholder='id,name,email
1,John Doe,john@example.com
2,Jane Smith,jane@example.com'
                    />
                    {error && <p className="text-error text-xs font-mono">{error}</p>}
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">JSON Output</label>
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
                            {output || <span className="text-text-muted italic">Waiting for valid CSV input...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
