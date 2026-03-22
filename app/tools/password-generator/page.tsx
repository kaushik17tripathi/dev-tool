"use client";

import React, { useState, useEffect, useCallback } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Clipboard, RefreshCw, Check, Shield, TriangleAlert } from "lucide-react";

export default function PasswordGeneratorPage() {
    const tool = getToolBySlug("password-generator")!;
    const [password, setPassword] = useState("");
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({
        uppercase: true,
        lowercase: true,
        numbers: true,
        symbols: true,
    });
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);

    const generatePassword = useCallback(() => {
        const charSets = {
            uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            lowercase: "abcdefghijklmnopqrstuvwxyz",
            numbers: "0123456789",
            symbols: "!@#$%^&*()_+~`|}{[]:;?><,./-=",
        };

        let allowedChars = "";
        if (options.uppercase) allowedChars += charSets.uppercase;
        if (options.lowercase) allowedChars += charSets.lowercase;
        if (options.numbers) allowedChars += charSets.numbers;
        if (options.symbols) allowedChars += charSets.symbols;

        if (!allowedChars) {
            setPassword("Please select at least one option");
            return;
        }

        let result = "";
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            result += allowedChars.charAt(array[i] % allowedChars.length);
        }
        setPassword(result);
    }, [length, options]);

    useEffect(() => {
        generatePassword();
    }, [generatePassword]);

    const handleCopy = () => {
        navigator.clipboard.writeText(password);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    };

    const strength = length < 8 ? "Weak" : length < 12 ? "Medium" : "Strong";
    const strengthColor = length < 8 ? "text-error" : length < 12 ? "text-yellow-500" : "text-success";

    return (
        <ToolLayout tool={tool}>
            <div className="max-w-3xl mx-auto space-y-8">
                <div className="card space-y-10 shadow-2xl bg-background-card/50 backdrop-blur-sm border-accent/10 p-8 md:p-12">

                    {/* Output Display */}
                    <div className="relative group">
                        <div className="input-field py-8 px-8 text-3xl font-mono text-accent bg-background-input/80 flex items-center justify-between overflow-hidden rounded-2xl border-2 border-accent/20">
                            <span className="truncate mr-4 selection:bg-accent/30">{password}</span>
                            <div className="flex gap-3 flex-shrink-0">
                                <button
                                    onClick={generatePassword}
                                    className="p-3 bg-accent/5 hover:bg-accent/15 rounded-xl transition-all text-text-muted hover:text-accent hover:rotate-180 duration-500"
                                    title="Regenerate password"
                                >
                                    <RefreshCw className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={`p-3 rounded-xl transition-all ${showCopyFeedback ? 'bg-success/20 text-success' : 'bg-accent/5 hover:bg-accent/15 text-text-muted hover:text-accent'}`}
                                    title="Copy to clipboard"
                                >
                                    {showCopyFeedback ? <Check className="w-6 h-6" /> : <Clipboard className="w-6 h-6" />}
                                </button>
                            </div>
                        </div>
                        {/* Strength Indicator Bar */}
                        <div className="absolute bottom-0 left-0 h-1.5 bg-border/20 w-full rounded-b-2xl overflow-hidden">
                            <div
                                className={`h-full transition-all duration-700 ease-out ${strength === 'Weak' ? 'bg-error w-1/3 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : strength === 'Medium' ? 'bg-yellow-500 w-2/3 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-success w-full shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-10">
                        {/* Length Slider */}
                        <div className="space-y-6 bg-background-input/20 p-6 rounded-2xl border border-border/50">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-bold uppercase tracking-widest text-text-muted">Password Length</label>
                                <div className="flex items-center gap-3">
                                    <span className={`text-3xl font-black font-mono tracking-tighter ${strengthColor}`}>{length}</span>
                                    <span className="text-[10px] font-bold text-text-muted/50 uppercase tracking-widest">chars</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="range"
                                    min="4"
                                    max="64"
                                    value={length}
                                    onChange={(e) => setLength(parseInt(e.target.value))}
                                    className="w-full accent-accent bg-background-input h-3 rounded-full appearance-none cursor-pointer hover:accent-accent-hover transition-all"
                                />
                                <div className="flex justify-between text-[10px] text-text-muted font-black uppercase tracking-widest px-1">
                                    <span>min: 4</span>
                                    <span>max: 64</span>
                                </div>
                            </div>
                        </div>

                        {/* Options Grid - Now more spacious */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <OptionToggle label="Uppercase" description="A-Z" checked={options.uppercase} onChange={() => setOptions({ ...options, uppercase: !options.uppercase })} />
                            <OptionToggle label="Lowercase" description="a-z" checked={options.lowercase} onChange={() => setOptions({ ...options, lowercase: !options.lowercase })} />
                            <OptionToggle label="Numbers" description="0-9" checked={options.numbers} onChange={() => setOptions({ ...options, numbers: !options.numbers })} />
                            <OptionToggle label="Symbols" description="!@#$%" checked={options.symbols} onChange={() => setOptions({ ...options, symbols: !options.symbols })} />
                        </div>
                    </div>

                    {/* Security Tip */}
                    <div className={`border p-5 rounded-2xl flex gap-4 items-center transition-colors duration-500 ${length < 12 ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-success/5 border-success/20'}`}>
                        <div className={`p-3 rounded-xl ${length < 12 ? 'bg-yellow-500/10' : 'bg-success/10'}`}>
                            {length < 12 ? <TriangleAlert className="w-6 h-6 text-yellow-500" /> : <Shield className="w-6 h-6 text-success" />}
                        </div>
                        <div className="space-y-1">
                            <p className={`text-sm font-black uppercase tracking-widest ${strengthColor}`}>Security Status: {strength}</p>
                            <p className="text-text-muted text-sm leading-relaxed">
                                {length < 12 ? "Weak. Longer passwords (12+ characters) are exponentially harder to crack." : "Strong. This password meets modern security complexity standards."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}

function OptionToggle({ label, description, checked, onChange }: any) {
    return (
        <button
            onClick={onChange}
            className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all hover:shadow-lg ${checked ? 'border-accent bg-accent/5 text-text-primary' : 'border-border/50 bg-background-input/10 text-text-muted hover:border-accent/30'}`}
        >
            <div className="flex flex-col items-start gap-0.5">
                <span className="text-xs font-black uppercase tracking-widest">{label}</span>
                <span className="text-[10px] opacity-50 font-mono">{description}</span>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${checked ? 'bg-accent' : 'bg-border/50'}`}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${checked ? 'left-7' : 'left-1'}`} />
            </div>
        </button>
    );
}
