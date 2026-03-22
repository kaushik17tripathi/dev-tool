"use client";

import React from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, FileCode } from "lucide-react";

export default function JSONToYAMLPage() {
    const tool = getToolBySlug("json-to-yaml")!;

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
            const json = JSON.parse(val);

            // Simple custom JSON to YAML function for strings/objects/arrays
            const toYaml = (obj: any, indent = 0): string => {
                const spacing = '  '.repeat(indent);
                if (obj === null) return 'null';
                if (typeof obj === 'string') return obj;
                if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

                if (Array.isArray(obj)) {
                    return obj.map(item => `\n${spacing}- ${toYaml(item, indent + 1)}`).join('');
                }

                return Object.entries(obj).map(([key, value]) => {
                    const valStr = toYaml(value, indent + 1);
                    return `\n${spacing}${key}: ${typeof value === 'object' && value !== null ? valStr : valStr}`;
                }).join('');
            };

            return toYaml(json).trim();
        },
        debounceMs: 200,
    });

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">Input JSON</label>
                        <button onClick={handleClear} className="text-text-muted hover:text-error transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field flex-grow min-h-[400px] resize-none"
                        placeholder='{"name": "DevWallah", "version": "1.0.0"}'
                    />
                    {error && <p className="text-error text-xs font-mono">{error}</p>}
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">YAML Output</label>
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
                            {output || <span className="text-text-muted italic">Waiting for valid JSON input...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
