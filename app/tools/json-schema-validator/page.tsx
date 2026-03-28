"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { decompressState } from "@/lib/shareUtils";
import {
    CheckCircle2, XCircle, AlertCircle, Trash2, Clipboard, Check,
    ChevronDown, ChevronRight, Lightbulb, FileJson, RefreshCw,
    Copy, BookOpen, Layers, Hash, Type, ToggleLeft, List
} from "lucide-react";

// ── AJV instance (Draft-07 + formats) ───────────────────────────────────────
const ajv = new Ajv({ allErrors: true, verbose: true, strict: false });
addFormats(ajv);

// ── Draft detection ──────────────────────────────────────────────────────────
function detectDraft(schema: any): string {
    const url: string = schema.$schema || "";
    if (url.includes("2020-12")) return "Draft 2020-12";
    if (url.includes("2019-09")) return "Draft 2019-09";
    if (url.includes("draft-07")) return "Draft 07";
    if (url.includes("draft-06")) return "Draft 06";
    if (url.includes("draft-04")) return "Draft 04";
    if (schema.$schema) return "Custom";
    return "Draft 07 (inferred)";
}

// ── Schema Examples ──────────────────────────────────────────────────────────
const EXAMPLES: { label: string; schema: string; data: string }[] = [
    {
        label: "User Object",
        schema: JSON.stringify({
            $schema: "http://json-schema.org/draft-07/schema#",
            title: "User",
            type: "object",
            required: ["id", "name", "email"],
            properties: {
                id: { type: "integer", minimum: 1, description: "Unique user ID" },
                name: { type: "string", minLength: 2, maxLength: 100 },
                email: { type: "string", format: "email" },
                age: { type: "integer", minimum: 0, maximum: 150 },
                role: { type: "string", enum: ["admin", "editor", "viewer"] },
                tags: { type: "array", items: { type: "string" }, uniqueItems: true },
                address: {
                    type: "object",
                    properties: {
                        street: { type: "string" },
                        city: { type: "string" },
                        zip: { type: "string", pattern: "^\\d{5}$" },
                    },
                    required: ["city"],
                },
            },
            additionalProperties: false,
        }, null, 2),
        data: JSON.stringify({
            id: 42,
            name: "Alice Chen",
            email: "alice@devwallah.dev",
            age: 30,
            role: "admin",
            tags: ["typescript", "react"],
            address: { street: "123 Main St", city: "San Francisco", zip: "94105" },
        }, null, 2),
    },
    {
        label: "E-Commerce Order",
        schema: JSON.stringify({
            $schema: "http://json-schema.org/draft-07/schema#",
            title: "Order",
            type: "object",
            required: ["orderId", "customerId", "items", "total"],
            properties: {
                orderId: { type: "string", format: "uuid" },
                customerId: { type: "integer" },
                status: { type: "string", enum: ["pending", "processing", "shipped", "delivered", "cancelled"] },
                items: {
                    type: "array",
                    minItems: 1,
                    items: {
                        type: "object",
                        required: ["sku", "quantity", "price"],
                        properties: {
                            sku: { type: "string" },
                            quantity: { type: "integer", minimum: 1 },
                            price: { type: "number", minimum: 0 },
                        },
                    },
                },
                total: { type: "number", minimum: 0 },
                discount: { type: "number", minimum: 0, maximum: 100 },
                createdAt: { type: "string", format: "date-time" },
            },
        }, null, 2),
        data: JSON.stringify({
            orderId: "550e8400-e29b-41d4-a716-446655440000",
            customerId: 1001,
            status: "processing",
            items: [
                { sku: "LAPTOP-16", quantity: 1, price: 1299.99 },
                { sku: "MOUSE-USB", quantity: 2, price: 29.99 },
            ],
            total: 1359.97,
            createdAt: "2026-03-29T00:00:00Z",
        }, null, 2),
    },
    {
        label: "API Error Response",
        schema: JSON.stringify({
            $schema: "http://json-schema.org/draft-07/schema#",
            title: "ErrorResponse",
            type: "object",
            required: ["error"],
            properties: {
                error: {
                    type: "object",
                    required: ["code", "message"],
                    properties: {
                        code: { type: "integer", minimum: 100, maximum: 599 },
                        message: { type: "string" },
                        details: { type: "array", items: { type: "string" } },
                        requestId: { type: "string", format: "uuid" },
                    },
                },
            },
        }, null, 2),
        data: JSON.stringify({
            error: {
                code: 422,
                message: "Validation failed",
                details: ["email is required", "name must be at least 2 characters"],
                requestId: "550e8400-e29b-41d4-a716-446655440000",
            },
        }, null, 2),
    },
    {
        label: "Invalid Data (Show Errors)",
        schema: JSON.stringify({
            $schema: "http://json-schema.org/draft-07/schema#",
            type: "object",
            required: ["name", "age", "email"],
            properties: {
                name: { type: "string", minLength: 3 },
                age: { type: "integer", minimum: 0, maximum: 120 },
                email: { type: "string", format: "email" },
                score: { type: "number", minimum: 0, maximum: 100 },
            },
            additionalProperties: false,
        }, null, 2),
        data: JSON.stringify({
            name: "Al",
            age: -5,
            email: "not-an-email",
            score: 150,
            unknownField: "oops",
        }, null, 2),
    },
];

// ── Schema tree browser ──────────────────────────────────────────────────────
function SchemaNode({ name, schema, depth = 0 }: { name: string; schema: any; depth?: number }) {
    const [open, setOpen] = useState(depth < 2);
    if (!schema || typeof schema !== "object") return null;

    const typeIcon: Record<string, React.ReactNode> = {
        object: <Layers className="w-3 h-3" />,
        array: <List className="w-3 h-3" />,
        string: <Type className="w-3 h-3" />,
        integer: <Hash className="w-3 h-3" />,
        number: <Hash className="w-3 h-3" />,
        boolean: <ToggleLeft className="w-3 h-3" />,
    };

    const t = schema.type || "any";
    const isExpandable = schema.properties || schema.items || schema.allOf || schema.oneOf || schema.anyOf;
    const req = schema.required || [];

    return (
        <div className={`${depth > 0 ? "border-l border-border ml-3 pl-3" : ""}`}>
            <div
                className={`flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer hover:bg-background-input/50 transition-colors group ${depth === 0 ? "font-bold" : ""}`}
                onClick={() => isExpandable && setOpen(!open)}
            >
                {isExpandable ? (
                    open ? <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
                ) : <span className="w-3.5" />}
                <span className={`text-[11px] font-black uppercase tracking-wider ${depth === 0 ? "text-accent" : "text-text-primary"}`}>{name}</span>
                <span className={`ml-auto flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${t === "object" ? "bg-violet-500/10 text-violet-400" : t === "array" ? "bg-amber-500/10 text-amber-400" : t === "string" ? "bg-emerald-500/10 text-emerald-400" : t === "integer" || t === "number" ? "bg-blue-500/10 text-blue-400" : t === "boolean" ? "bg-pink-500/10 text-pink-400" : "bg-border text-text-muted"}`}>
                    {typeIcon[t] || null}{t}
                </span>
                {schema.format && <span className="text-[10px] text-text-muted font-mono bg-background-input px-1.5 py-0.5 rounded">{schema.format}</span>}
                {schema.description && <span className="text-[10px] text-text-muted truncate max-w-[120px] hidden group-hover:block absolute right-4 bg-background-card border border-border px-2 py-1 rounded shadow z-10">{schema.description}</span>}
            </div>

            {open && isExpandable && (
                <div>
                    {schema.properties && Object.entries(schema.properties).map(([k, v]: any) => (
                        <div key={k} className="relative">
                            {req.includes(k) && <span className="absolute -left-1 top-2 w-1.5 h-1.5 rounded-full bg-error shrink-0" title="required" />}
                            <SchemaNode name={k} schema={v} depth={depth + 1} />
                        </div>
                    ))}
                    {schema.items && <SchemaNode name="[items]" schema={schema.items} depth={depth + 1} />}
                    {schema.allOf?.map((s: any, i: number) => <SchemaNode key={i} name={`allOf[${i}]`} schema={s} depth={depth + 1} />)}
                    {schema.oneOf?.map((s: any, i: number) => <SchemaNode key={i} name={`oneOf[${i}]`} schema={s} depth={depth + 1} />)}
                    {schema.anyOf?.map((s: any, i: number) => <SchemaNode key={i} name={`anyOf[${i}]`} schema={s} depth={depth + 1} />)}
                </div>
            )}
        </div>
    );
}

// ── Error card ───────────────────────────────────────────────────────────────
function ErrorCard({ err, idx }: { err: ErrorObject; idx: number }) {
    const path = err.instancePath || "$";
    const keyword = err.keyword;
    const msg = err.message || "";
    const params = JSON.stringify(err.params);

    return (
        <div className="border border-error/20 bg-error/5 rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-3">
                <span className="text-[10px] font-black text-error/50 mt-0.5 shrink-0 w-5 text-right">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <code className="text-xs font-mono font-bold text-error bg-error/10 px-2 py-0.5 rounded">{path || "$"}</code>
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted border border-border px-2 py-0.5 rounded-full">{keyword}</span>
                    </div>
                    <p className="text-sm text-text-muted font-medium">{msg.charAt(0).toUpperCase() + msg.slice(1)}.</p>
                    {params && params !== "{}" && (
                        <p className="text-[10px] font-mono text-text-muted/60 mt-1">Details: {params}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function JsonSchemaValidatorPage() {
    const tool = getToolBySlug("json-schema-validator")!;
    const [schema, setSchema] = useState(EXAMPLES[0].schema);
    const [data, setData] = useState(EXAMPLES[0].data);
    const [activeTab, setActiveTab] = useState<"errors" | "tree" | "info">("errors");
    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
    const initialized = useRef(false);

    // Deep-link support
    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;
        const params = new URLSearchParams(window.location.search);
        const s = params.get("s");
        if (s) {
            try {
                const raw = decompressState(s);
                const parsed = JSON.parse(raw);
                if (parsed.schema) setSchema(parsed.schema);
                if (parsed.data) setData(parsed.data);
            } catch { }
        }
    }, []);

    // Validate
    const { errors, status, schemaObj, draft, propCount } = React.useMemo(() => {
        try {
            const schemaObj = JSON.parse(schema);
            const dataObj = JSON.parse(data);
            const draft = detectDraft(schemaObj);

            // Count top-level properties
            const propCount = Object.keys(schemaObj.properties || {}).length;

            // Compile + validate
            const validate = ajv.compile(schemaObj);
            const valid = validate(dataObj);

            if (valid) return { errors: [], status: "valid" as const, schemaObj, draft, propCount };
            return { errors: validate.errors || [], status: "invalid" as const, schemaObj, draft, propCount };
        } catch (e: any) {
            return { errors: [], status: "parse-error" as const, message: e.message, schemaObj: null, draft: "-", propCount: 0 };
        }
    }, [schema, data]);

    const schemaParsed = (() => { try { return JSON.parse(schema); } catch { return null; } })();
    const dataParsed = (() => { try { return JSON.parse(data); } catch { return null; } })();

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(key);
        setTimeout(() => setCopyFeedback(null), 2000);
    };

    const handleBeautify = (target: "schema" | "data") => {
        try {
            if (target === "schema") setSchema(JSON.stringify(JSON.parse(schema), null, 2));
            else setData(JSON.stringify(JSON.parse(data), null, 2));
        } catch { }
    };

    const loadExample = (ex: typeof EXAMPLES[0]) => {
        setSchema(ex.schema);
        setData(ex.data);
    };

    const shareValue = JSON.stringify({ schema, data });

    return (
        <ToolLayout tool={tool} shareValue={shareValue}>
            <div className="space-y-6">
                {/* Example presets */}
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted mr-2 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Examples
                    </span>
                    {EXAMPLES.map((ex) => (
                        <button
                            key={ex.label}
                            onClick={() => loadExample(ex)}
                            className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full border border-border hover:border-accent/40 hover:text-accent bg-background-input transition-all"
                        >
                            {ex.label}
                        </button>
                    ))}
                </div>

                {/* Editor grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Schema pane */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="label mb-0">JSON Schema</label>
                            <div className="flex items-center gap-2">
                                {schemaParsed && (
                                    <span className="text-[10px] font-bold text-text-muted bg-background-input border border-border px-2 py-0.5 rounded-full">
                                        {detectDraft(schemaParsed)}
                                    </span>
                                )}
                                <button onClick={() => handleBeautify("schema")} title="Format JSON" className="text-text-muted hover:text-accent transition-colors p-1">
                                    <FileJson className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleCopy(schema, "schema")} title="Copy schema" className="text-text-muted hover:text-accent transition-colors p-1">
                                    {copyFeedback === "schema" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setSchema("")} title="Clear" className="text-text-muted hover:text-error transition-colors p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={schema}
                            onChange={(e) => setSchema(e.target.value)}
                            className="input-field h-[400px] font-mono text-xs resize-none leading-relaxed"
                            placeholder={'{\n  "$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object"\n}'}
                            spellCheck={false}
                        />
                    </div>

                    {/* Data pane */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="label mb-0">JSON Data to Validate</label>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleBeautify("data")} title="Format JSON" className="text-text-muted hover:text-accent transition-colors p-1">
                                    <FileJson className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleCopy(data, "data")} title="Copy data" className="text-text-muted hover:text-accent transition-colors p-1">
                                    {copyFeedback === "data" ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                                </button>
                                <button onClick={() => setData("")} title="Clear" className="text-text-muted hover:text-error transition-colors p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <textarea
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            className="input-field h-[400px] font-mono text-xs resize-none leading-relaxed"
                            placeholder='{"key": "value"}'
                            spellCheck={false}
                        />
                    </div>
                </div>

                {/* Status banner */}
                {(schema.trim() || data.trim()) && (
                    <div className={`rounded-2xl px-6 py-4 border flex items-center gap-4 transition-all duration-300 ${
                        status === "valid"
                            ? "border-success/30 bg-success/5"
                            : status === "invalid"
                                ? "border-error/30 bg-error/5"
                                : "border-amber-500/30 bg-amber-500/5"
                    }`}>
                        {status === "valid" && <CheckCircle2 className="w-6 h-6 text-success shrink-0" />}
                        {status === "invalid" && <XCircle className="w-6 h-6 text-error shrink-0" />}
                        {status === "parse-error" && <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />}

                        <div className="flex-1">
                            <div className={`font-black text-base ${status === "valid" ? "text-success" : status === "invalid" ? "text-error" : "text-amber-500"}`}>
                                {status === "valid" && "✓ Valid — JSON matches the schema perfectly"}
                                {status === "invalid" && `✗ Invalid — ${errors.length} error${errors.length !== 1 ? "s" : ""} found`}
                                {status === "parse-error" && "⚠ Parse error — check JSON syntax in schema or data"}
                            </div>
                            {status !== "parse-error" && (
                                <div className="flex flex-wrap gap-4 mt-1 text-[11px] font-bold text-text-muted">
                                    <span>Draft: {draft}</span>
                                    {propCount > 0 && <span>Properties: {propCount}</span>}
                                    {schemaParsed?.title && <span>Schema: {schemaParsed.title}</span>}
                                    {dataParsed && <span>Data keys: {Object.keys(dataParsed).length}</span>}
                                </div>
                            )}
                        </div>

                        {/* Validate button (manual re-check visual) */}
                        <button
                            onClick={() => { setSchema(s => s + " "); setTimeout(() => setSchema(s => s.trimEnd()), 0); }}
                            className="btn-secondary py-2 px-4 text-xs font-bold flex items-center gap-2 shrink-0"
                            title="Re-validate"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Re-validate
                        </button>
                    </div>
                )}

                {/* Tabbed bottom panels */}
                {(status === "invalid" || status === "valid") && (
                    <div className="bg-background-card border border-border rounded-2xl overflow-hidden">
                        {/* Tabs */}
                        <div className="flex border-b border-border">
                            {([
                                { id: "errors", label: `Errors${status === "invalid" ? ` (${errors.length})` : ""}`, icon: XCircle },
                                { id: "tree", label: "Schema Tree", icon: Layers },
                                { id: "info", label: "Schema Info", icon: Lightbulb },
                            ] as const).map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-5 py-3 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === tab.id ? "border-accent text-accent" : "border-transparent text-text-muted hover:text-text-primary"}`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-5 max-h-[400px] overflow-y-auto">
                            {/* Errors tab */}
                            {activeTab === "errors" && (
                                status === "valid" ? (
                                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                                        <CheckCircle2 className="w-12 h-12 text-success/40" />
                                        <p className="text-text-muted font-medium text-sm">No errors — your data is perfectly valid!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {errors.map((err, i) => (
                                            <ErrorCard key={i} err={err as ErrorObject} idx={i} />
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Schema Tree tab */}
                            {activeTab === "tree" && schemaParsed && (
                                <div className="text-sm">
                                    {schemaParsed.title && (
                                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Schema</span>
                                            <span className="font-bold text-text-primary">{schemaParsed.title}</span>
                                            {schemaParsed.description && <span className="text-text-muted text-xs">— {schemaParsed.description}</span>}
                                        </div>
                                    )}
                                    <SchemaNode name="root" schema={schemaParsed} depth={0} />
                                </div>
                            )}

                            {/* Info tab */}
                            {activeTab === "info" && schemaParsed && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        { label: "Draft", value: draft },
                                        { label: "Root Type", value: schemaParsed.type || "any" },
                                        { label: "Title", value: schemaParsed.title || "—" },
                                        { label: "Properties", value: String(Object.keys(schemaParsed.properties || {}).length) },
                                        { label: "Required Fields", value: String((schemaParsed.required || []).length) },
                                        { label: "Additional Props", value: schemaParsed.additionalProperties === false ? "Disallowed" : "Allowed" },
                                        { label: "Formats Used", value: JSON.stringify(schemaParsed.properties || {}).match(/"format":/g)?.length?.toString() || "0" },
                                        { label: "AJV Version", value: "8.x" },
                                        { label: "Validation Mode", value: "All Errors" },
                                    ].map((item) => (
                                        <div key={item.label} className="bg-background-input border border-border rounded-xl p-4">
                                            <div className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">{item.label}</div>
                                            <div className="font-bold text-text-primary text-sm">{item.value}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Keyword reference */}
                <details className="bg-background-card border border-border rounded-2xl overflow-hidden group">
                    <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer list-none hover:bg-background-input/30 transition-colors">
                        <Lightbulb className="w-4 h-4 text-accent" />
                        <span className="text-[11px] font-black uppercase tracking-widest">JSON Schema Keyword Reference</span>
                        <ChevronDown className="w-4 h-4 text-text-muted ml-auto group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-t border-border pt-4">
                        {[
                            { kw: "type", desc: "string | number | integer | object | array | boolean | null" },
                            { kw: "required", desc: "Array of property names that must be present" },
                            { kw: "properties", desc: "Define sub-schemas for object properties" },
                            { kw: "additionalProperties", desc: "Allow or restrict extra properties (false = strict)" },
                            { kw: "minLength / maxLength", desc: "String character length constraints" },
                            { kw: "minimum / maximum", desc: "Numeric value bounds (inclusive)" },
                            { kw: "exclusiveMinimum / exclusiveMaximum", desc: "Numeric bounds (exclusive)" },
                            { kw: "pattern", desc: "Regex pattern the string must match" },
                            { kw: "format", desc: "email, date, date-time, uri, uuid, ipv4, ipv6, …" },
                            { kw: "enum", desc: "Value must be one of the listed options" },
                            { kw: "items", desc: "Schema for array elements" },
                            { kw: "minItems / maxItems", desc: "Array length constraints" },
                            { kw: "uniqueItems", desc: "Array elements must be distinct (true/false)" },
                            { kw: "allOf", desc: "Must satisfy ALL listed sub-schemas" },
                            { kw: "anyOf", desc: "Must satisfy AT LEAST ONE sub-schema" },
                            { kw: "oneOf", desc: "Must satisfy EXACTLY ONE sub-schema" },
                            { kw: "not", desc: "Must NOT match the given sub-schema" },
                            { kw: "$ref", desc: "Reference another schema definition" },
                        ].map((item) => (
                            <div key={item.kw} className="space-y-1">
                                <code className="text-[11px] font-mono font-bold text-accent">{item.kw}</code>
                                <p className="text-[11px] text-text-muted leading-snug">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </details>
            </div>
        </ToolLayout>
    );
}
