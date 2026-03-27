"use client";

import React, { useState, useEffect } from 'react';
import { MockEndpoint } from '../lib/storage';
import { Save, Copy, Hash, Code2, Settings, Zap } from 'lucide-react';

interface EndpointEditorProps {
    endpoint: MockEndpoint;
    onSave: (endpoint: MockEndpoint) => void;
    onUpdate: (endpoint: MockEndpoint) => void; // Support real-time sync with parent
}

type DataTemplate = { label: string; single: () => any; list: () => any };

const firstNames = ['Alice', 'Bob', 'Carlos', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah'];
const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Taylor', 'Clark', 'Lewis'];
const domains = ['gmail.com', 'outlook.com', 'proton.me'];
const statuses = ['active', 'inactive', 'pending'];

const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => Number((Math.random() * (max - min) + min).toFixed(2));
const randDate = () => new Date(Date.now() - randInt(0, 365) * 86400000).toISOString();

const fakeUser = () => {
    const first = rand(firstNames);
    const last = rand(lastNames);
    return {
        id: randInt(1000, 9999),
        name: `${first} ${last}`,
        email: `${first.toLowerCase()}.${last.toLowerCase()}@${rand(domains)}`,
        status: rand(statuses),
        createdAt: randDate(),
    };
};

const fakeProduct = () => ({
    id: randInt(1000, 9999),
    name: `Item-${randInt(10, 999)}`,
    price: randFloat(10, 999),
    inStock: Math.random() > 0.3,
    tags: ['new', 'popular'],
});

const fakeOrder = () => ({
    id: `ORD-${randInt(10000, 99999)}`,
    userId: randInt(1000, 9999),
    total: randFloat(20, 1200),
    status: rand(['pending', 'processing', 'delivered']),
    createdAt: randDate(),
});

const fakeError = () => ({
    error: 'VALIDATION_FAILED',
    code: 422,
    message: 'The given data is invalid.',
    timestamp: new Date().toISOString(),
});

const DATA_TEMPLATES: DataTemplate[] = [
    { label: 'User', single: fakeUser, list: () => Array.from({ length: 10 }, fakeUser) },
    { label: 'Product', single: fakeProduct, list: () => Array.from({ length: 8 }, fakeProduct) },
    { label: 'Order', single: fakeOrder, list: () => Array.from({ length: 6 }, fakeOrder) },
];

const EDGE_CASES = [
    { label: 'Empty Object', fn: () => ({}) },
    { label: 'Empty Array', fn: () => [] },
    { label: 'Null Fields', fn: () => ({ id: null, name: null, status: null }) },
    { label: 'Error Shape', fn: fakeError },
    { label: 'Paginated', fn: () => ({ data: Array.from({ length: 5 }, fakeUser), meta: { page: 1, per_page: 5, total: 25 } }) },
];

export function EndpointEditor({ endpoint, onSave, onUpdate }: EndpointEditorProps) {
    const [bodyStr, setBodyStr] = useState('{}');
    const [copied, setCopied] = useState(false);
    const [showDataGen, setShowDataGen] = useState(false);

    useEffect(() => {
        setBodyStr(typeof endpoint.body === 'string' ? endpoint.body : JSON.stringify(endpoint.body, null, 2));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [endpoint.id]); // Only reset bodyStr when switching endpoints

    const handleChange = (updates: Partial<MockEndpoint>) => {
        onUpdate({ ...endpoint, ...updates });
    };

    const handleBodyChange = (value: string) => {
        setBodyStr(value);
        let parsedBody = value;
        try { parsedBody = JSON.parse(value); } catch (e) { }
        onUpdate({ ...endpoint, body: parsedBody });
    };

    const copyUrl = () => {
        const fullUrl = `${window.location.origin}${endpoint.url}`;
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const applyGeneratedPayload = (payload: any) => {
        const pretty = JSON.stringify(payload, null, 2);
        setBodyStr(pretty);
        onUpdate({ ...endpoint, body: payload });
        setShowDataGen(false);
    };

    return (
        <div className="flex flex-col h-full bg-background-base text-text-primary transition-colors duration-300">
            <div className="p-4 border-b border-border flex items-center justify-between sticky top-0 bg-background-card/80 backdrop-blur-md z-30 transition-colors duration-300">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-background-input border border-border rounded-lg">
                        <Hash size={12} className="text-text-muted/50" />
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">{endpoint.id.slice(0, 8)}</span>
                    </div>
                </div>
                <button 
                    onClick={() => onSave(endpoint)}
                    className="flex items-center gap-2 px-6 py-2 bg-accent text-white rounded-xl hover:bg-accent-hover transition-all font-black text-[11px] shadow-lg shadow-accent/10 uppercase tracking-widest active:scale-95"
                >
                    <Save size={14} /> Commit Changes
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-12 max-w-5xl mx-auto w-full space-y-12">
                <div className="grid grid-cols-12 gap-8 items-end">
                    <div className="col-span-3 space-y-3">
                        <label className="text-[9px] font-black uppercase text-text-muted tracking-[0.3em] ml-1">Method</label>
                        <select 
                            className="w-full h-14 bg-background-input border-2 border-transparent rounded-2xl px-5 text-xs font-black appearance-none outline-none focus:border-accent transition-all cursor-pointer text-text-primary uppercase shadow-sm"
                            value={endpoint.method}
                            onChange={(e) => handleChange({ method: e.target.value as any })}
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                    </div>
                    <div className="col-span-9 space-y-3">
                        <label className="text-[9px] font-black uppercase text-text-muted tracking-[0.3em] ml-1">Mount Path (Virtual Directory)</label>
                        <input 
                            type="text" 
                            className="w-full h-14 bg-background-input border-2 border-transparent rounded-2xl px-5 text-xs font-mono font-bold outline-none focus:border-accent transition-all text-text-primary shadow-sm"
                            value={endpoint.url}
                            onChange={(e) => handleChange({ url: e.target.value })}
                            placeholder="/mock/api/v1/resource"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-12 gap-8">
                    <div className="col-span-4 space-y-3">
                        <label className="text-[9px] font-black uppercase text-text-muted tracking-[0.3em] ml-1">HTTP Return Code</label>
                        <div className="relative group">
                            <input 
                                type="number" 
                                className="w-full h-14 bg-background-input border-2 border-transparent rounded-2xl px-5 text-sm font-black outline-none focus:border-accent transition-all text-text-primary shadow-sm font-mono"
                                value={endpoint.status}
                                onChange={(e) => handleChange({ status: parseInt(e.target.value) || 200 })}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-text-muted uppercase tracking-widest opacity-30 select-none">Code</div>
                        </div>
                    </div>
                    <div className="col-span-8 space-y-3">
                        <label className="text-[9px] font-black uppercase text-text-muted tracking-[0.3em] ml-1">Public Terminal</label>
                        <div className="h-14 bg-slate-950 rounded-2xl flex items-center justify-between px-5 border border-white/5 shadow-2xl shadow-accent/5">
                            <span className="text-[10px] font-mono text-blue-400 font-bold truncate pr-4">
                                {typeof window !== 'undefined' ? `${window.location.origin}${endpoint.url || ''}` : (endpoint.url || '')}
                            </span>
                            <button 
                                onClick={copyUrl}
                                className={`shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${copied ? 'bg-success text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                            >
                                {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-border/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Code2 size={16} className="text-accent" />
                            <h3 className="text-[10px] font-black text-text-primary uppercase tracking-[0.4em]">JSON Payload Definition</h3>
                        </div>
                        <button
                            onClick={() => setShowDataGen(v => !v)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${showDataGen ? 'bg-accent/15 text-accent border border-accent/40' : 'bg-background-input text-text-muted border border-border hover:text-accent hover:border-accent/40'}`}
                        >
                            <Zap size={12} /> Smart Data Generator
                        </button>
                    </div>

                    {showDataGen && (
                        <div className="p-4 rounded-2xl border border-accent/20 bg-accent/5 space-y-4">
                            <p className="text-[10px] text-text-muted">Generate payloads quickly and inject directly into JSON body.</p>
                            <div className="grid grid-cols-3 gap-2">
                                {DATA_TEMPLATES.map((tpl) => (
                                    <div key={tpl.label} className="rounded-xl border border-border bg-background/50 p-2 space-y-2">
                                        <p className="text-[10px] font-black text-text-muted uppercase tracking-wider text-center">{tpl.label}</p>
                                        <button
                                            onClick={() => applyGeneratedPayload(tpl.single())}
                                            className="w-full py-1.5 text-[10px] rounded-lg border border-border bg-background-input hover:border-accent/40 hover:text-accent"
                                        >
                                            Single
                                        </button>
                                        <button
                                            onClick={() => applyGeneratedPayload(tpl.list())}
                                            className="w-full py-1.5 text-[10px] rounded-lg border border-border bg-background-input hover:border-accent/40 hover:text-accent"
                                        >
                                            List
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 border-t border-accent/20">
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-wider mb-2">Edge Cases</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {EDGE_CASES.map((item) => (
                                        <button
                                            key={item.label}
                                            onClick={() => applyGeneratedPayload(item.fn())}
                                            className="py-1.5 px-2 text-left text-[10px] rounded-lg border border-border bg-background-input hover:border-accent/40 hover:text-accent"
                                        >
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="h-96 bg-background-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl shadow-accent/5 focus-within:border-accent transition-all flex flex-col group relative">
                        <textarea 
                            className="flex-1 p-10 bg-transparent outline-none resize-none font-mono text-xs leading-relaxed text-text-primary/70 group-focus:text-text-primary transition-colors scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
                            value={bodyStr}
                            onChange={(e) => handleBodyChange(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
