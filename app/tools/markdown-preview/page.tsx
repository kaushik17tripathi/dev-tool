"use client";

import React, { useState, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Trash2, Eye, Pencil } from "lucide-react";
import { marked } from "marked";

export default function MarkdownPreviewPage() {
    const tool = getToolBySlug("markdown-preview")!;
    const [input, setInput] = useState("# Welcome\n\n- Bullet 1\n- Bullet 2\n\n**Bold text**");
    const [html, setHtml] = useState("");

    useEffect(() => {
        const renderMarkdown = async () => {
            const rendered = await marked.parse(input);
            setHtml(rendered);
        };
        renderMarkdown();
    }, [input]);

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-250px)]">
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-accent" />
                            <label className="label uppercase tracking-widest mb-0">Editor</label>
                        </div>
                        <button onClick={() => setInput("")} className="text-text-muted hover:text-error transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field flex-grow resize-none font-mono text-sm p-6"
                        placeholder="# Markdown here..."
                    />
                </div>

                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-accent" />
                        <label className="label uppercase tracking-widest mb-0">Live Preview</label>
                    </div>
                    <div className="bg-white text-slate-900 border border-border rounded-2xl p-8 overflow-auto flex-grow prose prose-slate prose-invert max-w-none shadow-inner">
                        <div
                            dangerouslySetInnerHTML={{ __html: html }}
                            className="markdown-content"
                        />
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
