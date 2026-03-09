"use client";

import React, { useState, useMemo } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Split, Trash2 } from "lucide-react";

export default function JSONDiffPage() {
    const tool = getToolBySlug("json-diff")!;
    const [left, setLeft] = useState("");
    const [right, setRight] = useState("");

    const formatJSON = (val: string) => {
        try {
            return JSON.stringify(JSON.parse(val), null, 2);
        } catch {
            return val;
        }
    };

    const diffResult = useMemo(() => {
        if (!left || !right) return null;
        try {
            const obj1 = JSON.parse(left);
            const obj2 = JSON.parse(right);

            // Simple diff logic: find keys only in obj1, obj2, and keys with different values
            const keys1 = Object.keys(obj1);
            const keys2 = Object.keys(obj2);
            const allKeys = Array.from(new Set([...keys1, ...keys2])).sort();

            const diffs = allKeys.map(key => {
                const v1 = obj1[key];
                const v2 = obj2[key];

                if (!(key in obj1)) return { key, status: 'added', v2 };
                if (!(key in obj2)) return { key, status: 'removed', v1 };
                if (JSON.stringify(v1) !== JSON.stringify(v2)) return { key, status: 'changed', v1, v2 };
                return { key, status: 'equal', v1 };
            });

            return diffs;
        } catch (e: any) {
            return { error: "Invalid JSON in one of the inputs." };
        }
    }, [left, right]);

    return (
        <ToolLayout tool={tool} shareValue={left}>
            <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="label">Original JSON</label>
                            <button
                                onClick={() => setLeft("")}
                                className="text-text-muted hover:text-error p-1"
                                title="Clear"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            value={left}
                            onChange={(e) => setLeft(e.target.value)}
                            onBlur={() => setLeft(formatJSON(left))}
                            className="input-field w-full min-h-[300px] font-mono text-sm resize-none"
                            placeholder='{ "id": 1, "status": "active" }'
                        />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="label">Modified JSON</label>
                            <button
                                onClick={() => setRight("")}
                                className="text-text-muted hover:text-error p-1"
                                title="Clear"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            value={right}
                            onChange={(e) => setRight(e.target.value)}
                            onBlur={() => setRight(formatJSON(right))}
                            className="input-field w-full min-h-[300px] font-mono text-sm resize-none"
                            placeholder='{ "id": 1, "status": "inactive" }'
                        />
                    </div>
                </div>

                <div className="bg-background-card border border-border rounded-2xl p-6 shadow-sm">
                    <label className="label mb-6">Comparison Result</label>
                    {!diffResult ? (
                        <p className="text-text-muted text-center py-12 italic">Enter JSON in both fields to see the diff.</p>
                    ) : 'error' in diffResult ? (
                        <p className="text-error text-center py-12 font-mono">{(diffResult as any).error}</p>
                    ) : (
                        <div className="space-y-2 font-mono text-sm max-h-[400px] overflow-auto">
                            {diffResult.map((d: any, i) => (
                                <div key={i} className={`p-2 rounded-lg border flex gap-4 ${d.status === 'added' ? 'bg-success/5 border-success/20' :
                                    d.status === 'removed' ? 'bg-error/5 border-error/20' :
                                        d.status === 'changed' ? 'bg-accent/5 border-accent/20' : 'bg-background-input/50 border-transparent'
                                    }`}>
                                    <span className="w-24 shrink-0 font-bold opacity-50">{d.status.toUpperCase()}</span>
                                    <span className="text-accent">{d.key}:</span>
                                    {d.status === 'changed' ? (
                                        <span className="flex gap-2">
                                            <s className="text-error">{JSON.stringify(d.v1)}</s>
                                            <span className="text-success">{JSON.stringify(d.v2)}</span>
                                        </span>
                                    ) : (
                                        <span className={d.status === 'removed' ? 'text-error' : d.status === 'added' ? 'text-success' : 'text-text-primary'}>
                                            {JSON.stringify(d.status === 'added' ? d.v2 : d.v1)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </ToolLayout>
    );
}
