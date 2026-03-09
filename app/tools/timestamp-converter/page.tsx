"use client";

import React, { useState, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { Clipboard, Check, Clock, Calendar, Globe, ArrowRight } from "lucide-react";

dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

export default function TimestampConverterPage() {
    const tool = getToolBySlug("timestamp-converter")!;
    const [input, setInput] = useState<string>(Math.floor(Date.now() / 1000).toString());
    const [showCopyFeedback, setShowCopyFeedback] = useState<string | null>(null);

    const getTimeData = (val: string) => {
        try {
            let d;
            const num = parseInt(val);
            if (isNaN(num)) return null;

            // Detect if milliseconds (13 digits) or seconds (10 digits)
            if (val.length >= 13) {
                d = dayjs(num);
            } else {
                d = dayjs.unix(num);
            }

            if (!d.isValid()) return null;

            return {
                iso: d.toISOString(),
                utc: d.utc().format("YYYY-MM-DD HH:mm:ss [UTC]"),
                local: d.format("YYYY-MM-DD HH:mm:ss"),
                relative: d.fromNow(),
                timezone: dayjs.tz.guess(),
                dayOfYear: Math.floor((d.toDate().getTime() - new Date(d.year(), 0, 0).getTime()) / 86400000),
                weekOfYear: Math.ceil((((d.toDate().getTime() - new Date(d.year(), 0, 1).getTime()) / 86400000) + new Date(d.year(), 0, 1).getDay() + 1) / 7),
            };
        } catch {
            return null;
        }
    };

    const data = getTimeData(input);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setShowCopyFeedback(id);
        setTimeout(() => setShowCopyFeedback(null), 2000);
    };

    const setNow = () => setInput(Math.floor(Date.now() / 1000).toString());

    return (
        <ToolLayout tool={tool} shareValue={input}>
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Input Section */}
                <div className="card space-y-6">
                    <div className="flex flex-col md:flex-row md:items-end gap-6">
                        <div className="flex-grow space-y-2">
                            <label className="label">Unix Timestamp (Seconds or Milliseconds)</label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    className="input-field pl-12 py-4 text-xl font-bold bg-background-input/50"
                                    placeholder="e.g. 1715263200"
                                />
                            </div>
                        </div>
                        <button
                            onClick={setNow}
                            className="btn-primary py-4 px-8 min-w-[120px]"
                        >
                            Set to Now
                        </button>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ResultCard
                        label="ISO 8601"
                        value={data?.iso || "Invalid Timestamp"}
                        icon={<Globe className="w-5 h-5" />}
                        onCopy={() => data && handleCopy(data.iso, 'iso')}
                        isCopied={showCopyFeedback === 'iso'}
                    />
                    <ResultCard
                        label="UTC Date / Time"
                        value={data?.utc || "Invalid Timestamp"}
                        icon={<Clock className="w-5 h-5 text-accent" />}
                        onCopy={() => data && handleCopy(data.utc, 'utc')}
                        isCopied={showCopyFeedback === 'utc'}
                    />
                    <ResultCard
                        label="Local Date / Time"
                        value={data?.local || "Invalid Timestamp"}
                        icon={<Calendar className="w-5 h-5 text-success" />}
                        onCopy={() => data && handleCopy(data.local, 'local')}
                        isCopied={showCopyFeedback === 'local'}
                    />
                    <ResultCard
                        label="Relative"
                        value={data?.relative || "Invalid Timestamp"}
                        icon={<ArrowRight className="w-5 h-5 text-text-muted" />}
                        onCopy={() => data && handleCopy(data.relative, 'rel')}
                        isCopied={showCopyFeedback === 'rel'}
                    />
                </div>

                {/* Extra Info */}
                {data && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-background-card border border-border p-4 rounded-2xl text-center space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase">Your Timezone</span>
                            <p className="text-sm font-medium">{data.timezone}</p>
                        </div>
                        <div className="bg-background-card border border-border p-4 rounded-2xl text-center space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase">Day of Year</span>
                            <p className="text-sm font-medium">{data.dayOfYear}</p>
                        </div>
                        <div className="bg-background-card border border-border p-4 rounded-2xl text-center space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase">Week of Year</span>
                            <p className="text-sm font-medium">{data.weekOfYear}</p>
                        </div>
                        <div className="bg-background-card border border-border p-4 rounded-2xl text-center space-y-1">
                            <span className="text-[10px] font-bold text-text-muted uppercase">Type Detected</span>
                            <p className="text-sm font-medium text-accent">{input.length >= 13 ? 'Milliseconds' : 'Seconds'}</p>
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}

function ResultCard({ label, value, icon, onCopy, isCopied }: any) {
    return (
        <div className="card group hover:border-accent/40 transition-colors">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {icon}
                    <label className="label mb-0">{label}</label>
                </div>
                <button
                    onClick={onCopy}
                    className={`p-1.5 rounded-lg transition-colors ${isCopied ? 'text-success bg-success/10' : 'text-text-muted hover:text-accent hover:bg-accent/10'}`}
                >
                    {isCopied ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                </button>
            </div>
            <p className="font-mono text-lg break-all group-hover:text-text-primary transition-colors">{value}</p>
        </div>
    );
}
