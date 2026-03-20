"use client";

import React, { useState, useMemo } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Shield, ShieldAlert, ShieldCheck, Info, Trash2, Search, ExternalLink } from "lucide-react";

interface HeaderInfo {
    description: string;
    security?: boolean;
    mdn?: string;
}

const headerDatabase: Record<string, HeaderInfo> = {
    "content-security-policy": {
        description: "Controls which resources the browser is allowed to load for a given page.",
        security: true,
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy"
    },
    "strict-transport-security": {
        description: "Tells the browser that the site should only be accessed using HTTPS.",
        security: true,
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security"
    },
    "x-frame-options": {
        description: "Indicates whether a browser should be allowed to render a page in a <frame>, <iframe>, <embed> or <object>.",
        security: true,
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options"
    },
    "x-content-type-options": {
        description: "Prevents the browser from MIME-sniffing a response away from the declared content-type.",
        security: true,
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options"
    },
    "referrer-policy": {
        description: "Governs which referrer information, sent in the Referer header, should be included with requests made.",
        security: true,
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy"
    },
    "permissions-policy": {
        description: "Allows site owners to enable and disable browser features and APIs for their own pages and those they embed.",
        security: true,
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy"
    },
    "cache-control": {
        description: "Specifies directives for caching mechanisms in both requests and responses.",
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control"
    },
    "content-type": {
        description: "Indicates the media type of the resource.",
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type"
    },
    "etag": {
        description: "An identifier for a specific version of a resource.",
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag"
    },
    "server": {
        description: "Contains information about the software used by the origin server to handle the request. (Warning: Can leak information)",
        security: true,
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server"
    },
    "x-powered-by": {
        description: "Specifies the technology (e.g., ASP.NET, PHP, JBoss) supporting the web application. (Warning: Recommended to hide this)",
        security: true,
        mdn: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Powered-By"
    }
};

export default function HTTPHeadersAnalyzerPage() {
    const tool = getToolBySlug("http-headers-analyzer")!;
    const [input, setInput] = useState("");

    const parsedHeaders = useMemo(() => {
        if (!input.trim()) return [];
        return input.split("\n").filter(line => line.includes(":")).map(line => {
            const [key, ...valueParts] = line.split(":");
            return {
                key: key.trim(),
                value: valueParts.join(":").trim(),
                lowKey: key.trim().toLowerCase()
            };
        });
    }, [input]);

    const securityAudit = useMemo(() => {
        if (parsedHeaders.length === 0) return null;

        const present = new Set(parsedHeaders.map(h => h.lowKey));
        const missing = [
            { id: "csp", name: "Content-Security-Policy", score: 40 },
            { id: "hsts", name: "Strict-Transport-Security", score: 20 },
            { id: "xfo", name: "X-Frame-Options", score: 15 },
            { id: "xcto", name: "X-Content-Type-Options", score: 10 },
            { id: "rp", name: "Referrer-Policy", score: 10 },
            { id: "pp", name: "Permissions-Policy", score: 5 }
        ].filter(h => !present.has(h.name.toLowerCase()));

        const score = 100 - missing.reduce((acc, h) => acc + h.score, 0);

        return { score, missing };
    }, [parsedHeaders]);

    const handleClear = () => setInput("");

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="space-y-8">
                {/* Input Panel */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="label">Paste Raw Headers</label>
                        <button onClick={handleClear} className="text-text-muted hover:text-error transition-colors p-1" title="Clear input">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field h-[250px] font-mono text-sm resize-none leading-relaxed"
                        placeholder={`HTTP/1.1 200 OK\nContent-Type: text/html\nCache-Control: max-age=3600\n...`}
                        spellCheck="false"
                    />
                </div>

                {/* Analysis Results */}
                {parsedHeaders.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* Audit Summary */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="card p-6 border-accent/20 bg-accent/5">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-accent" />
                                    Security Audit
                                </h3>
                                <div className="text-center py-6">
                                    <div className={`text-5xl font-black mb-2 ${securityAudit!.score >= 80 ? 'text-success' :
                                            securityAudit!.score >= 50 ? 'text-amber-500' : 'text-error'
                                        }`}>
                                        {securityAudit?.score}%
                                    </div>
                                    <p className="text-sm text-text-muted font-medium">Security Grade</p>
                                </div>

                                {securityAudit?.missing && securityAudit.missing.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t border-border">
                                        <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Recommendations</p>
                                        <div className="space-y-3">
                                            {securityAudit.missing.map(m => (
                                                <div key={m.id} className="flex gap-3">
                                                    <ShieldAlert className="w-4 h-4 text-error shrink-0 mt-0.5" />
                                                    <div className="text-sm">
                                                        <span className="font-bold text-text-primary">Missing {m.name}</span>
                                                        <p className="text-xs text-text-muted mt-1 leading-relaxed">
                                                            Essential for preventing {m.id === 'csp' ? 'XSS attacks' : m.id === 'xfo' ? 'clickjacking' : 'security vulnerabilities'}.
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {securityAudit?.missing.length === 0 && (
                                    <div className="flex gap-3 pt-4 border-t border-border">
                                        <ShieldCheck className="w-5 h-5 text-success shrink-0" />
                                        <p className="text-sm font-bold text-success">All essential security headers are present!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Parsed Headers List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                                <Search className="w-5 h-5 text-accent" />
                                Detailed Analysis
                            </h3>
                            <div className="space-y-3">
                                {parsedHeaders.map((header, idx) => {
                                    const info = headerDatabase[header.lowKey];
                                    return (
                                        <div key={idx} className="group border border-border rounded-xl p-4 bg-background-input/30 hover:bg-background-input/80 transition-all hover:border-accent/40">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-sm font-bold text-text-primary">{header.key}</span>
                                                        {info?.security && <Shield className="w-3 h-3 text-accent fill-accent/10" />}
                                                    </div>
                                                    <div className="font-mono text-xs text-accent break-all">{header.value}</div>
                                                </div>
                                                {info?.mdn && (
                                                    <a
                                                        href={info.mdn}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-text-muted hover:text-accent transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-background/50 px-2 py-1 rounded border border-border"
                                                    >
                                                        Docs <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                )}
                                            </div>
                                            {info && (
                                                <div className="mt-3 text-xs text-text-muted leading-relaxed flex items-start gap-2 bg-background/40 p-2 rounded-lg italic">
                                                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                    {info.description}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
