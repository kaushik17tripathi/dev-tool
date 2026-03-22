"use client";

import React, { useMemo, useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { renderMarkdownToHtml } from "@/lib/markdownPreview";
import { Trash2, Eye, Pencil } from "lucide-react";

export default function MarkdownPreviewPage() {
    const tool = getToolBySlug("markdown-preview")!;
    const [input, setInput] = useState("# Welcome\n\n- Bullet 1\n- Bullet 2\n\n**Bold text**");

    const html = useMemo(() => renderMarkdownToHtml(input), [input]);

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[min(650px,80vh)] lg:h-[650px] lg:min-h-[650px]">
                <div className="flex min-h-0 min-w-0 flex-col space-y-4">
                    <div className="flex flex-shrink-0 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Pencil className="h-4 w-4 text-accent" />
                            <label className="label mb-0 uppercase tracking-widest">Editor</label>
                        </div>
                        <button onClick={() => setInput("")} className="p-1 text-text-muted transition-colors hover:text-error" title="Clear input">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field min-h-0 min-w-0 flex-1 resize-none overflow-auto break-words p-6 font-mono text-sm"
                        placeholder="# Markdown here..."
                        spellCheck="false"
                    />
                </div>

                <div className="flex min-h-0 min-w-0 flex-col space-y-4">
                    <div className="flex flex-shrink-0 items-center gap-2">
                        <Eye className="h-4 w-4 text-accent" />
                        <label className="label mb-0 uppercase tracking-widest">Live Preview</label>
                    </div>
                    <div className="h-full min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-auto rounded-2xl border border-border bg-white p-8 text-slate-900 shadow-inner dark:bg-slate-950 dark:text-slate-100">
                        <div
                            dangerouslySetInnerHTML={{ __html: html }}
                            className="prose prose-slate max-w-none break-words dark:prose-invert"
                        />
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
