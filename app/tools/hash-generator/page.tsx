"use client";

import React, { useState, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Clipboard, Check } from "lucide-react";

export default function HashGeneratorPage() {
    const tool = getToolBySlug("hash-generator")!;
    const [input, setInput] = useState("");
    const [hashes, setHashes] = useState({
        md5: "...",
        sha1: "...",
        sha256: "...",
        sha512: "...",
    });
    const [copyStates, setCopyStates] = useState<Record<string, boolean>>({});

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopyStates({ ...copyStates, [key]: true });
        setTimeout(() => setCopyStates({ ...copyStates, [key]: false }), 2000);
    };

    useEffect(() => {
        const generateHashes = async () => {
            if (!input) {
                setHashes({ md5: "...", sha1: "...", sha256: "...", sha512: "..." });
                return;
            }

            const msgUint8 = new TextEncoder().encode(input);

            const getHash = async (algo: string) => {
                const hashBuffer = await crypto.subtle.digest(algo, msgUint8);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return hashHex;
            };

            try {
                // MD5 is not in subtle crypto, we'll skip or use a small lib. 
                // For now let's do SHA family which is native.
                const s1 = await getHash('SHA-1');
                const s256 = await getHash('SHA-256');
                const s512 = await getHash('SHA-512');

                setHashes({
                    md5: "MD5 requires library", // or just skip MD5
                    sha1: s1,
                    sha256: s256,
                    sha512: s512,
                });
            } catch (e) {
                console.error(e);
            }
        };

        generateHashes();
    }, [input]);

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="max-w-4xl mx-auto space-y-8 py-8">
                <div className="space-y-4">
                    <label className="label uppercase tracking-widest font-bold">Input Text</label>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field w-full min-h-[120px] resize-none text-lg"
                        placeholder="Type or paste text to hash..."
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {['sha256', 'sha512', 'sha1'].map((algo) => (
                        <div key={algo} className="bg-background-card border border-border rounded-xl p-6 space-y-3 shadow-sm hover:border-accent/30 transition-colors">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">{algo}</span>
                                <button
                                    onClick={() => handleCopy((hashes as any)[algo], algo)}
                                    className={`text-xs flex items-center gap-1.5 font-medium transition-colors ${copyStates[algo] ? 'text-success' : 'text-accent hover:text-accent-hover'}`}
                                >
                                    {copyStates[algo] ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                                    {copyStates[algo] ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                            <p className="font-mono text-sm break-all text-text-primary bg-background-input/50 p-3 rounded-lg border border-border/50">
                                {(hashes as any)[algo]}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </ToolLayout>
    );
}
