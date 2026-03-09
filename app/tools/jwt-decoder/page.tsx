"use client";

import React from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { useTool } from "@/hooks/useTool";
import { jwtDecode } from "jwt-decode";
import { Clipboard, Trash2, Check, ShieldCheck, Info } from "lucide-react";

export default function JWTDecoderPage() {
    const tool = getToolBySlug("jwt-decoder")!;

    const {
        input,
        setInput,
        output,
        error,
        showCopyFeedback,
        handleCopy,
        handleClear,
    } = useTool<{ header: any; payload: any }>({
        onProcess: (val) => {
            const header = jwtDecode(val, { header: true });
            const payload = jwtDecode(val);
            return { header, payload };
        },
    });

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
                {/* Input Panel */}
                <div className="space-y-4 flex flex-col">
                    <div className="flex items-center justify-between">
                        <label className="label">Encoded JWT Token</label>
                        <button
                            onClick={handleClear}
                            className="text-text-muted hover:text-error transition-colors p-1"
                            title="Clear input"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className={`input-field flex-grow min-h-[300px] lg:min-h-full resize-none ${error ? 'border-error/50' : ''} border-accent/20 focus:border-accent`}
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    />
                    {error && (
                        <div className="bg-error/10 border border-error/20 text-error text-xs p-3 rounded-lg font-mono">
                            Error: {error}
                        </div>
                    )}

                    <div className="bg-background-card border border-border rounded-xl p-4 flex gap-3 text-sm text-text-muted">
                        <ShieldCheck className="w-5 h-5 text-accent shrink-0" />
                        <p>Tokens are decoded client-side. Your sensitive data never leaves your browser.</p>
                    </div>
                </div>

                {/* Output Panel */}
                <div className="space-y-8 flex flex-col overflow-auto h-full">
                    {/* Header Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                                <label className="label mb-0">Header</label>
                            </div>
                            {output && (
                                <button
                                    onClick={() => handleCopy(JSON.stringify(output.header, null, 2))}
                                    className="text-accent hover:text-accent-hover text-xs font-bold"
                                >
                                    Copy Header
                                </button>
                            )}
                        </div>
                        <pre className="bg-background-input border border-border rounded-xl p-4 font-mono text-sm overflow-auto max-h-[200px] text-[#fbbf24]">
                            {output ? JSON.stringify(output.header, null, 2) : '// Header will appear here'}
                        </pre>
                    </div>

                    {/* Payload Section */}
                    <div className="space-y-3 flex-grow">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-success rounded-full" />
                                <label className="label mb-0">Payload (Claims)</label>
                            </div>
                            {output && (
                                <button
                                    onClick={() => handleCopy(JSON.stringify(output.payload, null, 2))}
                                    className="text-accent hover:text-accent-hover text-xs font-bold"
                                >
                                    Copy Payload
                                </button>
                            )}
                        </div>
                        <pre className="bg-background-input border border-border rounded-xl p-4 font-mono text-sm overflow-auto text-success min-h-[250px]">
                            {output ? JSON.stringify(output.payload, null, 2) : '// Payload will appear here'}
                        </pre>
                    </div>

                    {output && (
                        <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3">
                            <div className="flex items-center gap-2 font-bold text-accent text-sm">
                                <Info className="w-4 h-4" />
                                <span>Token Structure Info</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                                <div>
                                    <span className="text-text-muted block lowercase">Algorithm</span>
                                    <span className="text-text-primary uppercase">{output.header.alg || 'None'}</span>
                                </div>
                                <div>
                                    <span className="text-text-muted block lowercase">Issued At (iat)</span>
                                    <span className="text-text-primary">
                                        {output.payload.iat ? new Date(output.payload.iat * 1000).toLocaleString() : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </ToolLayout>
    );
}
