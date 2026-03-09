"use client";

import React, { useState, useEffect, useRef } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Trash2, QrCode, Download } from "lucide-react";
import QRCode from "qrcode";

export default function QRCodeGeneratorPage() {
    const tool = getToolBySlug("qr-code-generator")!;
    const [input, setInput] = useState("https://devtoolbox.com");
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current && input) {
            QRCode.toCanvas(canvasRef.current, input, {
                width: 300,
                margin: 2,
                color: {
                    dark: "#6366f1",
                    light: "#ffffff00", // Transparent background
                }
            }, (error) => {
                if (error) console.error(error);
            });
        }
    }, [input]);

    const handleDownload = () => {
        if (!canvasRef.current) return;
        const link = document.createElement('a');
        link.download = 'qrcode.png';
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="max-w-xl mx-auto space-y-8 py-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <label className="label uppercase tracking-widest font-bold">Content for QR Code</label>
                        <button onClick={() => setInput("")} className="text-text-muted hover:text-error p-1">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        className="input-field w-full min-h-[100px] resize-none text-lg"
                        placeholder="URL, text, or phone number..."
                    />
                </div>

                <div className="bg-background-card border border-border rounded-3xl p-12 flex flex-col items-center justify-center space-y-8 shadow-xl relative group overflow-hidden">
                    <div className="bg-white p-4 rounded-2xl shadow-inner">
                        <canvas ref={canvasRef} />
                    </div>

                    <button
                        onClick={handleDownload}
                        disabled={!input}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-lg disabled:opacity-50"
                    >
                        <Download className="w-5 h-5" />
                        Download QR Code
                    </button>

                    <div className="absolute top-4 right-4 text-accent/20 group-hover:text-accent/40 transition-colors">
                        <QrCode className="w-12 h-12" />
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
