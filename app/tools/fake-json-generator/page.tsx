"use client";

import React, { useState, useCallback } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Wand2, Clipboard, Check, RefreshCw, Plus, Trash2, ChevronDown } from "lucide-react";

// --- Faker helpers (no external libs) ---
const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = () => parseFloat((Math.random() * 100).toFixed(2));

const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Hank", "Ivy", "Jack"];
const lastNames = ["Smith", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Anderson", "Thomas"];
const domains = ["gmail.com", "yahoo.com", "outlook.com", "example.com", "dev.io"];
const streets = ["Main St", "Oak Ave", "Maple Blvd", "Cedar Rd", "Elm Way", "Park Lane"];
const cities = ["New York", "Los Angeles", "Chicago", "Houston", "Seattle", "Austin"];
const colors = ["red", "blue", "green", "yellow", "purple", "orange", "pink"];
const companies = ["Acme Corp", "Globex", "Initech", "Umbrella", "Hooli", "Pied Piper"];
const jobTitles = ["Engineer", "Designer", "Manager", "Analyst", "Developer", "Consultant"];
const lorem = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt".split(" ");

const fakers: Record<string, () => unknown> = {
    name: () => `${rand(firstNames)} ${rand(lastNames)}`,
    firstName: () => rand(firstNames),
    lastName: () => rand(lastNames),
    email: () => `${rand(firstNames).toLowerCase()}.${rand(lastNames).toLowerCase()}@${rand(domains)}`,
    phone: () => `+1-${randInt(200, 999)}-${randInt(100, 999)}-${randInt(1000, 9999)}`,
    age: () => randInt(18, 75),
    id: () => randInt(1000, 9999),
    uuid: () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 0x3) | 0x8).toString(16); }),
    boolean: () => Math.random() > 0.5,
    price: () => randFloat(),
    integer: () => randInt(1, 1000),
    float: () => randFloat(),
    color: () => rand(colors),
    street: () => `${randInt(1, 999)} ${rand(streets)}`,
    city: () => rand(cities),
    company: () => rand(companies),
    jobTitle: () => rand(jobTitles),
    url: () => `https://www.${rand(companies).toLowerCase().replace(/\s+/g, "")}.com`,
    loremWord: () => rand(lorem),
    loremSentence: () => lorem.slice(0, randInt(5, 12)).join(" ") + ".",
};

const FAKER_TYPES = Object.keys(fakers);

interface Field {
    id: string;
    key: string;
    type: string;
}

const DEFAULT_FIELDS: Field[] = [
    { id: "1", key: "id", type: "id" },
    { id: "2", key: "name", type: "name" },
    { id: "3", key: "email", type: "email" },
    { id: "4", key: "company", type: "company" },
    { id: "5", key: "age", type: "age" },
];

export default function FakeJsonGeneratorPage() {
    const tool = getToolBySlug("fake-json-generator")!;
    const [fields, setFields] = useState<Field[]>(DEFAULT_FIELDS);
    const [count, setCount] = useState(5);
    const [output, setOutput] = useState("");
    const [copyFeedback, setCopyFeedback] = useState(false);

    const generate = useCallback(() => {
        const records = Array.from({ length: count }, () => {
            const obj: Record<string, unknown> = {};
            for (const f of fields) {
                if (!f.key.trim()) continue;
                obj[f.key] = fakers[f.type] ? fakers[f.type]() : null;
            }
            return obj;
        });
        setOutput(JSON.stringify(records, null, 2));
    }, [fields, count]);

    const addField = () => {
        setFields(prev => [...prev, { id: Date.now().toString(), key: "field", type: "name" }]);
    };

    const removeField = (id: string) => {
        setFields(prev => prev.filter(f => f.id !== id));
    };

    const updateField = (id: string, key: string, value: string) => {
        setFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const handleCopy = () => {
        if (!output) return;
        navigator.clipboard.writeText(output);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    return (
        <ToolLayout tool={tool} shareValue={output}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Schema Builder */}
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-lg font-bold">Schema</h3>

                        {/* Count Selector */}
                        <div className="flex items-center gap-3">
                            <label className="label whitespace-nowrap">Records</label>
                            <input
                                type="number"
                                value={count}
                                min={1}
                                max={100}
                                onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
                                className="input-field w-24 text-center"
                            />
                        </div>

                        {/* Fields */}
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                            {fields.map(field => (
                                <div key={field.id} className="flex gap-2 items-center group">
                                    <input
                                        value={field.key}
                                        onChange={(e) => updateField(field.id, "key", e.target.value)}
                                        placeholder="key"
                                        className="input-field flex-1 py-2 text-sm font-mono"
                                    />
                                    <div className="relative">
                                        <select
                                            value={field.type}
                                            onChange={(e) => updateField(field.id, "type", e.target.value)}
                                            className="input-field py-2 text-sm pr-8 appearance-none cursor-pointer"
                                        >
                                            {FAKER_TYPES.map(t => (
                                                <option key={t} value={t}>{t}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-text-muted" />
                                    </div>
                                    <button
                                        onClick={() => removeField(field.id)}
                                        className="text-text-muted hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button onClick={addField} className="btn-secondary flex items-center gap-2 text-sm w-full justify-center py-2">
                            <Plus className="w-4 h-4" /> Add Field
                        </button>

                        <button onClick={generate} className="btn-primary flex items-center gap-2 text-sm w-full justify-center py-3 mt-2">
                            <Wand2 className="w-4 h-4" /> Generate {count} Record{count !== 1 ? "s" : ""}
                        </button>
                    </div>

                    {/* Output */}
                    <div className="lg:col-span-3 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="label">Generated JSON</label>
                            <div className="flex gap-2">
                                {output && (
                                    <button onClick={generate} className="btn-secondary py-1 text-xs flex items-center gap-2">
                                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                                    </button>
                                )}
                                <button
                                    onClick={handleCopy}
                                    disabled={!output}
                                    className={`btn-secondary py-1 text-xs flex items-center gap-2 ${copyFeedback ? "text-success border-success/50" : ""}`}
                                >
                                    {copyFeedback ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                                    {copyFeedback ? "Copied!" : "Copy"}
                                </button>
                            </div>
                        </div>
                        <div className="bg-background-input border border-border rounded-xl p-4 h-[600px] font-mono text-xs overflow-y-auto whitespace-pre leading-relaxed scrollbar-thin">
                            {output || <span className="text-text-muted italic">Click "Generate" to produce fake data…</span>}
                        </div>
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
