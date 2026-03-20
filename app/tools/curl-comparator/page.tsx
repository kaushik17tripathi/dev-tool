"use client";

import React, { useState, useMemo } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Clipboard, Trash2, Check, GitCompare, ArrowRight } from "lucide-react";

interface ParsedCurl {
    method: string;
    url: string;
    headers: Record<string, string>;
    body: string;
    raw: string;
}

const parseCurl = (curl: string): ParsedCurl => {
    const result: ParsedCurl = {
        method: "GET",
        url: "",
        headers: {},
        body: "",
        raw: curl,
    };

    if (!curl.trim()) return result;

    // Very basic cURL parser
    const lines = curl.split(/\\\n| /).filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
        const part = lines[i].trim().replace(/^['"]|['"]$/g, "");

        if (part === "curl") continue;

        if (part === "-X" || part === "--request") {
            result.method = lines[++i]?.trim().replace(/^['"]|['"]$/g, "") || "GET";
        } else if (part === "-H" || part === "--header") {
            const header = lines[++i]?.trim().replace(/^['"]|['"]$/g, "");
            if (header) {
                const [key, ...valueParts] = header.split(":");
                if (key) {
                    result.headers[key.trim().toLowerCase()] = valueParts.join(":").trim();
                }
            }
        } else if (part === "-d" || part === "--data" || part === "--data-raw" || part === "--data-binary") {
            result.body = lines[++i]?.trim().replace(/^['"]|['"]$/g, "") || "";
            if (result.method === "GET") result.method = "POST";
        } else if (part.startsWith("http")) {
            result.url = part;
        }
    }

    return result;
};

export default function CurlComparatorPage() {
    const tool = getToolBySlug("curl-comparator")!;
    const [input1, setInput1] = useState("");
    const [input2, setInput2] = useState("");
    const [copyFeedback, setCopyFeedback] = useState<number | null>(null);

    const parsed1 = useMemo(() => parseCurl(input1), [input1]);
    const parsed2 = useMemo(() => parseCurl(input2), [input2]);

    const handleClear = (side: 1 | 2) => {
        if (side === 1) setInput1("");
        else setInput2("");
    };

    const handleCopy = (text: string, id: number) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(id);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const renderDiff = (label: string, val1: string, val2: string) => {
        const isDifferent = val1 !== val2;
        return (
            <div className={`p-3 rounded-lg border ${isDifferent ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-background-input/50'}`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</span>
                    {isDifferent && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">DIFF</span>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="font-mono text-sm break-all opacity-80">{val1 || <span className="italic opacity-50">Empty</span>}</div>
                    <div className="font-mono text-sm break-all">{val2 || <span className="italic opacity-50">Empty</span>}</div>
                </div>
            </div>
        );
    };

    const allHeaderKeys = useMemo(() => {
        const keys = new Set([...Object.keys(parsed1.headers), ...Object.keys(parsed2.headers)]);
        return Array.from(keys).sort();
    }, [parsed1, parsed2]);

    const bodyDiff = useMemo(() => {
        if (!parsed1.body && !parsed2.body) return null;
        try {
            const b1 = JSON.parse(parsed1.body);
            const b2 = JSON.parse(parsed2.body);
            return {
                formatted1: JSON.stringify(b1, null, 2),
                formatted2: JSON.stringify(b2, null, 2),
                isDifferent: JSON.stringify(b1) !== JSON.stringify(b2),
            };
        } catch (e) {
            return {
                formatted1: parsed1.body,
                formatted2: parsed2.body,
                isDifferent: parsed1.body !== parsed2.body,
            };
        }
    }, [parsed1.body, parsed2.body]);

    return (
        <ToolLayout tool={tool} shareValue={`${input1}|||${input2}`}>
            <div className="space-y-8">
                {/* Input Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label className="label">cURL Command A</label>
                            <button onClick={() => handleClear(1)} className="text-text-muted hover:text-error transition-colors p-1" title="Clear"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <textarea
                            value={input1}
                            onChange={(e) => setInput1(e.target.value)}
                            className="input-field h-[200px] font-mono text-sm resize-none leading-relaxed"
                            placeholder="Paste first curl command here..."
                            spellCheck="false"
                        />
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label className="label">cURL Command B</label>
                            <button onClick={() => handleClear(2)} className="text-text-muted hover:text-error transition-colors p-1" title="Clear"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <textarea
                            value={input2}
                            onChange={(e) => setInput2(e.target.value)}
                            className="input-field h-[200px] font-mono text-sm resize-none leading-relaxed"
                            placeholder="Paste second curl command here..."
                            spellCheck="false"
                        />
                    </div>
                </div>

                {/* Comparison Results */}
                {(input1 || input2) && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 border-b border-border pb-4">
                            <GitCompare className="w-5 h-5 text-accent" />
                            <h2 className="text-xl font-bold">Comparison Results</h2>
                        </div>

                        <div className="space-y-4">
                            {renderDiff("Method", parsed1.method, parsed2.method)}
                            {renderDiff("URL", parsed1.url, parsed2.url)}

                            {/* Headers Comparison */}
                            <div className="p-3 rounded-lg border border-border bg-background-input/50">
                                <div className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">Headers</div>
                                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                                    {allHeaderKeys.map(key => {
                                        const v1 = parsed1.headers[key];
                                        const v2 = parsed2.headers[key];
                                        const isDiff = v1 !== v2;
                                        return (
                                            <div key={key} className={`grid grid-cols-[1fr,1.5fr,1.5fr] gap-4 py-1.5 px-2 rounded ${isDiff ? 'bg-amber-500/10' : ''}`}>
                                                <div className="font-mono text-xs font-bold break-all">{key}:</div>
                                                <div className="font-mono text-xs break-all opacity-70">{v1 || '-'}</div>
                                                <div className="font-mono text-xs break-all">{v2 || '-'}</div>
                                            </div>
                                        );
                                    })}
                                    {allHeaderKeys.length === 0 && <div className="text-xs text-text-muted italic">No headers detected.</div>}
                                </div>
                            </div>

                            {/* Body Comparison */}
                            {bodyDiff && (
                                <div className={`p-3 rounded-lg border ${bodyDiff.isDifferent ? 'border-amber-500/30 bg-amber-500/5' : 'border-border bg-background-input/50'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">Request Body</span>
                                        {bodyDiff.isDifferent && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold">DIFF</span>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-black/20 p-3 rounded border border-white/5 overflow-auto h-[350px] scrollbar-thin">
                                            <pre className="font-mono text-[11px] opacity-70 whitespace-pre-wrap">{bodyDiff.formatted1 || <span className="italic opacity-50">Empty</span>}</pre>
                                        </div>
                                        <div className="bg-black/20 p-3 rounded border border-white/5 overflow-auto h-[350px] scrollbar-thin">
                                            <pre className="font-mono text-[11px] whitespace-pre-wrap">{bodyDiff.formatted2 || <span className="italic opacity-50">Empty</span>}</pre>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
