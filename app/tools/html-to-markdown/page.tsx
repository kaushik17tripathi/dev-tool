"use client";

import React from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { Clipboard, Trash2, Check, FileText } from "lucide-react";

export default function HTMLToMarkdownPage() {
    const tool = getToolBySlug("html-to-markdown")!;

    const {
        input,
        setInput,
        output,
        showCopyFeedback,
        handleCopy,
        handleClear,
    } = useTool<string>({
        onProcess: (val) => {
            if (!val) return "";

            // Basic implementation using a regex based converter for common tags
            // In a real scenario, turndown is better, but let's do a reliable light version
            let md = val;

            // Headers
            md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n');
            md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n');
            md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n');

            // Bold/Italic
            md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**');
            md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**');
            md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*');
            md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*');

            // Links
            md = md.replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)');

            // Lists
            md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n');

            // Paragraphs/Divs
            md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n');
            md = md.replace(/<br\s*\/?>/gi, '\n');

            // Strip remaining tags
            md = md.replace(/<[^>]*>/g, '');

            return md.trim();
        },
        debounceMs: 300,
    });

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">Input HTML</label>
                        <button onClick={handleClear} className="text-text-muted hover:text-error transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field flex-grow min-h-[400px] resize-none font-mono text-sm"
                        placeholder="<h1>Hello World</h1><p>Welcome to <b>DevToolbox</b>!</p>"
                    />
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label uppercase tracking-widest">Markdown Output</label>
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
                        <div className="absolute inset-0 bg-background-input border border-border rounded-lg p-3 font-mono text-sm overflow-auto whitespace-pre-wrap">
                            {output || <span className="text-text-muted italic">Waiting for HTML input...</span>}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
