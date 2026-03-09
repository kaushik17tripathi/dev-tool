"use client";

import React, { useState } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Clipboard, Check, RefreshCw, Pencil } from "lucide-react";

export default function LoremIpsumGeneratorPage() {
    const tool = getToolBySlug("lorem-ipsum-generator")!;
    const [count, setCount] = useState(3);
    const [type, setType] = useState<"paragraphs" | "words" | "sentences">("paragraphs");
    const [output, setOutput] = useState("");
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);

    const LOREM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

    const generate = () => {
        let result = "";
        if (type === "paragraphs") {
            resultArray = Array(count).fill(LOREM_TEXT);
            result = resultArray.join("\n\n");
        } else if (type === "sentences") {
            const sentences = LOREM_TEXT.split(". ");
            const temp = [];
            for (let i = 0; i < count; i++) {
                temp.push(sentences[i % sentences.length]);
            }
            result = temp.join(". ") + ".";
        } else {
            const words = LOREM_TEXT.split(" ");
            const temp = [];
            for (let i = 0; i < count; i++) {
                temp.push(words[i % words.length]);
            }
            result = temp.join(" ");
        }
        setOutput(result);
    };

    let resultArray: string[] = [];

    // Initialize
    React.useEffect(() => {
        generate();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(output);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    };

    return (
        <ToolLayout tool={tool}>
            <div className="max-w-4xl mx-auto space-y-8 py-8">
                <div className="bg-background-card border border-border rounded-2xl p-8 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2 col-span-1">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Type</label>
                            <select
                                value={type}
                                onChange={(e: any) => setType(e.target.value)}
                                className="w-full bg-background-input border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-accent"
                            >
                                <option value="paragraphs">Paragraphs</option>
                                <option value="sentences">Sentences</option>
                                <option value="words">Words</option>
                            </select>
                        </div>
                        <div className="space-y-2 col-span-1">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Amount</label>
                            <input
                                type="number"
                                value={count}
                                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                                className="w-full bg-background-input border border-border rounded-xl p-3 outline-none focus:ring-2 focus:ring-accent"
                                min="1"
                                max="100"
                            />
                        </div>
                        <div className="col-span-2 flex gap-3">
                            <button onClick={generate} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4" />
                                Generate
                            </button>
                            <button
                                onClick={handleCopy}
                                className="btn-secondary flex-1 py-3 flex items-center justify-center gap-2"
                            >
                                {showCopyFeedback ? <Check className="w-4 h-4 text-success" /> : <Clipboard className="w-4 h-4" />}
                                <span>{showCopyFeedback ? 'Copied' : 'Copy All'}</span>
                            </button>
                        </div>
                    </div>

                    <div className="relative group">
                        <div className="bg-background-input/50 border border-border rounded-xl p-6 font-serif text-lg leading-relaxed text-text-primary whitespace-pre-wrap min-h-[300px]">
                            {output}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
