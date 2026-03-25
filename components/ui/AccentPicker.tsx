"use client";

import * as React from "react";
import { Palette, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { type LightAccent, useAccent } from "@/hooks/useAccent";

const LABELS: Record<LightAccent, string> = {
    blue: "Blue",
    indigo: "Indigo",
    teal: "Teal",
    emerald: "Emerald",
    rose: "Rose",
    orange: "Orange",
    amber: "Amber",
    slate: "Slate",
};

const SWATCH_CLASS: Record<LightAccent, string> = {
    blue: "bg-[#2563EB]",
    indigo: "bg-[#4F46E5]",
    teal: "bg-[#0F766E]",
    emerald: "bg-[#059669]",
    rose: "bg-[#E11D48]",
    orange: "bg-[#EA580C]",
    amber: "bg-[#D97706]",
    slate: "bg-[#334155]",
};

export default function AccentPicker() {
    const { resolvedTheme } = useTheme();
    const { accent, setAccent, accents } = useAccent();
    const [open, setOpen] = React.useState(false);
    const popoverRef = React.useRef<HTMLDivElement | null>(null);

    React.useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };

        const onPointerDown = (e: PointerEvent) => {
            const el = popoverRef.current;
            if (!el) return;
            if (e.target instanceof Node && !el.contains(e.target)) {
                setOpen(false);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("pointerdown", onPointerDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("pointerdown", onPointerDown);
        };
    }, [open]);

    // Only show in light theme (per your requirement B).
    if (resolvedTheme !== "light") return null;

    return (
        <div className="relative" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background-input border border-border hover:border-accent/40 transition-all text-text-primary"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Choose accent color"
            >
                <span className={`w-3 h-3 rounded-full ${SWATCH_CLASS[accent]}`} />
                <Palette className="w-4 h-4 opacity-80" />
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Accent palette"
                    className="absolute right-0 mt-2 w-56 rounded-2xl border border-border/70 bg-background-card/75 backdrop-blur-2xl shadow-[0_1px_2px_rgb(var(--shadow)/0.05),0_22px_70px_-45px_rgb(var(--shadow)/0.32)] p-2"
                >
                    <div className="px-2 pt-1 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                        Accent (Light)
                    </div>
                    <div className="grid grid-cols-4 gap-2 px-1 pb-1">
                        {accents.map((a) => (
                            <button
                                key={a}
                                role="menuitem"
                                type="button"
                                onClick={() => {
                                    setAccent(a);
                                    setOpen(false);
                                }}
                                className="group relative rounded-xl border border-border/70 bg-background-base/40 hover:bg-background-base/60 transition-colors p-2"
                                title={LABELS[a]}
                                aria-label={`Set accent to ${LABELS[a]}`}
                            >
                                <div className="flex items-center justify-center">
                                    <div className={`w-6 h-6 rounded-lg ${SWATCH_CLASS[a]} shadow-sm`} />
                                </div>
                                {a === accent && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background-card border border-border flex items-center justify-center">
                                        <Check className="w-3.5 h-3.5 text-text-primary" strokeWidth={3} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="px-2 pt-1 pb-1 text-xs text-text-muted font-medium">
                        Selected: <span className="text-text-primary font-bold">{LABELS[accent]}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

