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
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="card space-y-8 shadow-2xl bg-background-card/50 backdrop-blur-sm border-accent/10">

                    {/* Output Display */}
                    <div className="relative group">
                        <div className="input-field py-6 px-6 text-2xl font-mono text-accent bg-background-input/80 flex items-center justify-between overflow-hidden">
                            <span className="truncate mr-4">{password}</span>
                            <div className="flex gap-2">
                                <button onClick={generatePassword} className="p-2 hover:bg-accent/10 rounded-lg transition-colors text-text-muted hover:text-accent">
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={handleCopy}
                                    className={`p-2 rounded-lg transition-all ${showCopyFeedback ? 'bg-success/10 text-success' : 'hover:bg-accent/10 text-text-muted hover:text-accent'}`}
                                >
                                    {showCopyFeedback ? <Check className="w-5 h-5" /> : <Clipboard className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        {/* Strength Indicator Bar */}
                        <div className="absolute bottom-0 left-0 h-1 bg-border w-full rounded-b-lg overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${strength === 'Weak' ? 'bg-error w-1/3' : strength === 'Medium' ? 'bg-yellow-500 w-2/3' : 'bg-success w-full'}`}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Length Slider */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center px-1">
                                <label className="label mb-0">Password Length</label>
                                <span className={`text-sm font-bold font-mono ${strengthColor}`}>{length}</span>
                            </div>
                            <input
                                type="range"
                                min="4"
                                max="64"
                                value={length}
                                onChange={(e) => setLength(parseInt(e.target.value))}
                                className="w-full accent-accent bg-background-input h-2 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-text-muted font-bold uppercase tracking-widest">
                                <span>4</span>
                                <span>64</span>
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="grid grid-cols-2 gap-4">
                            <OptionToggle label="Uppercase" checked={options.uppercase} onChange={() => setOptions({ ...options, uppercase: !options.uppercase })} />
                            <OptionToggle label="Lowercase" checked={options.lowercase} onChange={() => setOptions({ ...options, lowercase: !options.lowercase })} />
                            <OptionToggle label="Numbers" checked={options.numbers} onChange={() => setOptions({ ...options, numbers: !options.numbers })} />
                            <OptionToggle label="Symbols" checked={options.symbols} onChange={() => setOptions({ ...options, symbols: !options.symbols })} />
                        </div>
                    </div>

                    {/* Security Tip */}
                    <div className="bg-background-input/30 border border-border p-4 rounded-xl flex gap-3 items-start">
                        {length < 12 ? <TriangleAlert className="w-5 h-5 text-yellow-500 shrink-0" /> : <Shield className="w-5 h-5 text-success shrink-0" />}
                        <div className="text-xs space-y-1">
                            <p className={`font-bold uppercase tracking-wider ${strengthColor}`}>Security Level: {strength}</p>
                            <p className="text-text-muted">
                                {length < 12 ? "Longer passwords (12+ characters) are significantly harder to crack." : "This password meets modern complexity standards for most services."}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}

function OptionToggle({ label, checked, onChange }: any) {
    return (
        <button
            onClick={onChange}
            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${checked ? 'border-accent bg-accent/5 text-text-primary' : 'border-border bg-background-input/20 text-text-muted hover:border-accent/30'}`}
        >
            <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
            <div className={`w-8 h-4 rounded-full relative transition-colors ${checked ? 'bg-accent' : 'bg-border'}`}>
                <div className={`absolute top-1 w-2 h-2 rounded-full bg-white transition-all ${checked ? 'left-5' : 'left-1'}`} />
            </div>
        </button>
    );
}
