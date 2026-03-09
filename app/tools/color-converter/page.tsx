"use client";

import React, { useState, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Clipboard, Check, Palette } from "lucide-react";

export default function ColorConverterPage() {
    const tool = getToolBySlug("color-converter")!;
    const [hex, setHex] = useState("#6366f1");
    const [rgb, setRgb] = useState("rgb(99, 102, 241)");
    const [hsl, setHsl] = useState("hsl(239, 84%, 67%)");
    const [copyFeedback, setCopyFeedback] = useState("");

    const handleCopy = (val: string, label: string) => {
        navigator.clipboard.writeText(val);
        setCopyFeedback(label);
        setTimeout(() => setCopyFeedback(""), 2000);
    };

    const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    };

    const rgbToHsl = (r: number, g: number, b: number) => {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s, l = (max + min) / 2;
        if (max === min) h = s = 0;
        else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    };

    useEffect(() => {
        const rgbVal = hexToRgb(hex);
        if (rgbVal) {
            setRgb(`rgb(${rgbVal.r}, ${rgbVal.g}, ${rgbVal.b})`);
            const hslVal = rgbToHsl(rgbVal.r, rgbVal.g, rgbVal.b);
            setHsl(`hsl(${hslVal.h}, ${hslVal.s}%, ${hslVal.l}%)`);
        }
    }, [hex]);

    return (
        <ToolLayout tool={tool} shareValue={hex}>
            <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 py-8">
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="label uppercase tracking-widest font-bold">Pick a Color</label>
                        <div className="flex gap-4">
                            <input
                                type="color"
                                value={hex}
                                onChange={(e) => setHex(e.target.value)}
                                className="w-24 h-24 rounded-2xl cursor-pointer border-4 border-white/10 shadow-xl overflow-hidden"
                            />
                            <input
                                type="text"
                                value={hex}
                                onChange={(e) => setHex(e.target.value)}
                                className="flex-grow bg-background-input border border-border rounded-2xl px-6 text-2xl font-mono uppercase focus:ring-2 focus:ring-accent outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { label: 'HEX', value: hex.toUpperCase() },
                                { label: 'RGB', value: rgb },
                                { label: 'HSL', value: hsl }
                            ].map((item) => (
                                <div key={item.label} className="bg-background-card border border-border rounded-xl p-4 flex items-center justify-between group hover:border-accent/30 transition-all">
                                    <div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{item.label}</p>
                                        <p className="font-mono text-lg">{item.value}</p>
                                    </div>
                                    <button
                                        onClick={() => handleCopy(item.value, item.label)}
                                        className={`p-2 rounded-lg transition-colors ${copyFeedback === item.label ? 'bg-success/10 text-success' : 'hover:bg-accent/10 text-text-muted hover:text-accent'}`}
                                    >
                                        {copyFeedback === item.label ? <Check className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <label className="label uppercase tracking-widest font-bold">Live Preview</label>
                    <div
                        className="w-full aspect-square rounded-3xl shadow-2xl flex items-center justify-center relative overflow-hidden group"
                        style={{ backgroundColor: hex }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="z-10 text-white font-black text-4xl drop-shadow-md select-none opacity-50 uppercase">{hex}</p>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
