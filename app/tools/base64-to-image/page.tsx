"use client";

import React, { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Trash2, Image as ImageIcon, Download } from "lucide-react";

export default function Base64ToImagePage() {
    const tool = getToolBySlug("base64-to-image")!;
    const [input, setInput] = useState("");

    const cleanBase64 = input.trim();
    const imageSrc = cleanBase64.startsWith("data:image") ? cleanBase64 : `data:image/png;base64,${cleanBase64}`;

    const handleDownload = () => {
        const link = document.createElement("a");
        link.href = imageSrc;
        link.download = "decoded-image.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="max-w-4xl mx-auto space-y-12 py-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="label uppercase tracking-widest font-bold">Paste Base64 String</label>
                        <button onClick={() => setInput("")} className="text-text-muted hover:text-error p-1">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field w-full min-h-[150px] font-mono text-xs resize-none"
                        placeholder="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
                    />
                </div>

                <div className="space-y-4">
                    <label className="label uppercase tracking-widest font-bold text-center block">Image Preview</label>
                    <div className="bg-background-card border border-border rounded-3xl p-8 min-h-[300px] flex items-center justify-center relative group overflow-hidden shadow-sm">
                        {input ? (
                            <div className="relative">
                                <img
                                    src={imageSrc}
                                    alt="Decoded"
                                    className="max-w-full max-h-[500px] rounded-lg shadow-2xl object-contain"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                    <button
                                        onClick={handleDownload}
                                        className="btn-primary py-2 px-6 flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download Image
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4 opacity-20">
                                <ImageIcon className="w-16 h-16 mx-auto" />
                                <p className="font-bold uppercase tracking-widest">Image will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
