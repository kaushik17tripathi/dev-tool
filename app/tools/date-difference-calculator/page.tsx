"use client";

import React, { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { CalendarRange, Info } from "lucide-react";

export default function DateDifferencePage() {
    const tool = getToolBySlug("date-difference-calculator")!;
    const [date1, setDate1] = useState("");
    const [date2, setDate2] = useState("");

    const calculateDiff = () => {
        if (!date1 || !date2) return null;
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const years = Math.floor(diffDays / 365);
        const remainingDays = diffDays % 365;
        const months = Math.floor(remainingDays / 30);
        const days = remainingDays % 30;

        return { totalDays: diffDays, years, months, days };
    };

    const diff = calculateDiff();

    return (
        <ToolLayout tool={tool}>
            <div className="max-w-3xl mx-auto space-y-12 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <label className="label uppercase tracking-widest font-bold">Start Date</label>
                        <input
                            type="date"
                            value={date1}
                            onChange={(e) => setDate1(e.target.value)}
                            className="w-full bg-background-input border border-border rounded-xl p-4 text-xl focus:ring-2 focus:ring-accent outline-none"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="label uppercase tracking-widest font-bold">End Date</label>
                        <input
                            type="date"
                            value={date2}
                            onChange={(e) => setDate2(e.target.value)}
                            className="w-full bg-background-input border border-border rounded-xl p-4 text-xl focus:ring-2 focus:ring-accent outline-none"
                        />
                    </div>
                </div>

                {diff ? (
                    <div className="bg-background-card border border-border rounded-2xl p-8 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <p className="text-6xl font-black text-accent">{diff.totalDays}</p>
                            <p className="text-text-muted font-bold uppercase tracking-widest mt-2">Total Days</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 border-t border-border pt-8">
                            <div className="text-center">
                                <p className="text-3xl font-bold">{diff.years}</p>
                                <p className="text-xs text-text-muted uppercase">Years</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold">{diff.months}</p>
                                <p className="text-xs text-text-muted uppercase">Months</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold">{diff.days}</p>
                                <p className="text-xs text-text-muted uppercase">Days</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-background-input border border-dashed border-border rounded-2xl p-12 text-center text-text-muted">
                        <Info className="w-8 h-8 mx-auto mb-4 opacity-20" />
                        <p>Pick two dates to calculate the difference</p>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
