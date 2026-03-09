"use client";

import React from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, Type } from "lucide-react";

export default function JSONToTypeScriptPage() {
    const tool = getToolBySlug("json-to-typescript")!;

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
            const json = JSON.parse(val);

            const toPascal = (str: string) => str.replace(/(^\w|_\w|-\w)/g, (m: string) => m.replace(/_|-/, '').toUpperCase());

            const generateInterface = (obj: any, name: string = "RootObject"): string => {
                let lines = [`export interface ${toPascal(name)} {`];

                Object.entries(obj).forEach(([key, value]) => {
                    let type: string = typeof value;
                    if (value === null) type = "any";
                    else if (Array.isArray(value)) {
                        const entryType = value.length > 0 ? typeof value[0] : "any";
                        type = `${entryType}[]`;
                    } else if (type === "object") {
                        type = toPascal(key);
                    }
                    lines.push(`  ${key}: ${type};`);
                });

                lines.push("}");
                return lines.join("\n");
            };

            // Simple implementation: handle root object. 
            // For recursive objects, we'd need more logic, but this covers 80% use cases.
            return generateInterface(json);
        },
        debounceMs: 300,
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
                        className="input-field flex-grow min-h-[400px] resize-none font-mono text-sm"
                        placeholder='{ "id": 1, "name": "John", "roles": ["admin"] }'
                    />
                    {error && <p className="text-error text-xs font-mono">{error}</p>}
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">TypeScript Interface</label>
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
                            {output || <span className="text-text-muted italic">Waiting for JSON input...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
