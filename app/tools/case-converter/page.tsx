"use client";

import React from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, CaseSensitive } from "lucide-react";

export default function CaseConverterPage() {
    const tool = getToolBySlug("case-converter")!;

    const {
        input,
        setInput,
        output,
        showCopyFeedback,
        handleCopy,
        handleClear,
    } = useTool<Record<string, string>>({
        onProcess: (val): Record<string, string> => {
            if (!val) return {};

            const clean = val.replace(/[^a-zA-Z0-9 ]/g, ' ').split(/\s+/).filter(x => x.length > 0);
            if (clean.length === 0) return {};

            const toCamel = (words: string[]) => words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
            const toSnake = (words: string[]) => words.map(w => w.toLowerCase()).join('_');
            const toPascal = (words: string[]) => words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
            const toKebab = (words: string[]) => words.map(w => w.toLowerCase()).join('-');
            const toTitle = (words: string[]) => words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            const toUpper = (words: string[]) => words.map(w => w.toUpperCase()).join(' ');

            return {
                camelCase: toCamel(clean),
                snake_case: toSnake(clean),
                PascalCase: toPascal(clean),
                "kebab-case": toKebab(clean),
                "Title Case": toTitle(clean),
                "UPPER CASE": toUpper(clean),
            };
        },
        debounceMs: 50,
    });

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="max-w-4xl mx-auto space-y-12 py-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="label uppercase tracking-widest font-bold">Input Text</label>
                        <button onClick={handleClear} className="text-text-muted hover:text-error p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field w-full min-h-[120px] resize-none text-xl"
                        placeholder="Type something here..."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(output || {}).map(([label, val]) => (
                        <div key={label} className="bg-background-card border border-border rounded-xl p-5 space-y-3 group hover:border-accent/30 transition-colors shadow-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</span>
                                <button
                                    onClick={() => handleCopy(val)}
                                    className={`p-1.5 rounded-lg transition-colors ${showCopyFeedback ? 'text-success bg-success/10' : 'text-text-muted hover:text-accent hover:bg-accent/10'}`}
                                >
                                    {showCopyFeedback ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                                </button>
                            </div>
                            <p className="font-mono text-lg break-all">{val}</p>
                        </div>
                    ))}
                </div>
            </div>
        </ToolLayout>
    );
}
