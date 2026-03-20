"use client";

import React, { useState, useMemo } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { CheckCircle, XCircle, AlertCircle, Trash2, Clipboard, Check } from "lucide-react";

const EXAMPLE_SCHEMA = `{
  "type": "object",
  "required": ["name", "age"],
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 },
    "email": { "type": "string", "format": "email" }
  }
}`;

const EXAMPLE_DATA = `{
  "name": "Alice",
  "age": 30,
  "email": "alice@example.com"
}`;

type ValidationResult =
    | { status: "valid" }
    | { status: "invalid"; errors: string[] }
    | { status: "error"; message: string };

function validateJSON(data: string, schema: string): ValidationResult {
    let parsedData: unknown;
    let parsedSchema: any;

    try {
        parsedData = JSON.parse(data);
    } catch {
        return { status: "error", message: "JSON data is not valid JSON." };
    }
    try {
        parsedSchema = JSON.parse(schema);
    } catch {
        return { status: "error", message: "JSON Schema is not valid JSON." };
    }

    const errors: string[] = [];

    const validate = (value: unknown, schema: any, path: string) => {
        if (!schema || typeof schema !== "object") return;

        // type check
        if (schema.type) {
            const t = schema.type;
            const actual = Array.isArray(value) ? "array" : typeof value;
            const typeMatch =
                t === "integer"
                    ? Number.isInteger(value)
                    : t === "number"
                        ? typeof value === "number"
                        : actual === t;
            if (!typeMatch)
                errors.push(`${path}: expected type "${t}", got "${actual}".`);
        }

        // required
        if (schema.required && typeof value === "object" && value !== null && !Array.isArray(value)) {
            for (const key of schema.required) {
                if (!(key in (value as Record<string, unknown>))) {
                    errors.push(`${path}: missing required property "${key}".`);
                }
            }
        }

        // properties
        if (schema.properties && typeof value === "object" && value !== null && !Array.isArray(value)) {
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                if (key in (value as Record<string, unknown>)) {
                    validate((value as Record<string, unknown>)[key], propSchema, `${path}.${key}`);
                }
            }
        }

        // minimum / maximum
        if (typeof value === "number") {
            if (schema.minimum !== undefined && value < schema.minimum)
                errors.push(`${path}: value ${value} is less than minimum ${schema.minimum}.`);
            if (schema.maximum !== undefined && value > schema.maximum)
                errors.push(`${path}: value ${value} exceeds maximum ${schema.maximum}.`);
            if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum)
                errors.push(`${path}: value ${value} must be greater than ${schema.exclusiveMinimum}.`);
        }

        // minLength / maxLength
        if (typeof value === "string") {
            if (schema.minLength !== undefined && value.length < schema.minLength)
                errors.push(`${path}: string length ${value.length} is less than minLength ${schema.minLength}.`);
            if (schema.maxLength !== undefined && value.length > schema.maxLength)
                errors.push(`${path}: string length ${value.length} exceeds maxLength ${schema.maxLength}.`);
            if (schema.pattern) {
                try {
                    if (!new RegExp(schema.pattern).test(value))
                        errors.push(`${path}: value does not match pattern "${schema.pattern}".`);
                } catch { }
            }
        }

        // enum
        if (schema.enum && !schema.enum.includes(value)) {
            errors.push(`${path}: value must be one of [${schema.enum.join(", ")}].`);
        }

        // array items
        if (Array.isArray(value) && schema.items) {
            value.forEach((item, i) => validate(item, schema.items, `${path}[${i}]`));
        }
    };

    validate(parsedData, parsedSchema, "$");
    return errors.length > 0 ? { status: "invalid", errors } : { status: "valid" };
}

export default function JsonSchemaValidatorPage() {
    const tool = getToolBySlug("json-schema-validator")!;
    const [data, setData] = useState(EXAMPLE_DATA);
    const [schema, setSchema] = useState(EXAMPLE_SCHEMA);
    const [copyFeedback, setCopyFeedback] = useState(false);

    const result = useMemo<ValidationResult | null>(() => {
        if (!data.trim() && !schema.trim()) return null;
        return validateJSON(data, schema);
    }, [data, schema]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    return (
        <ToolLayout tool={tool} shareValue={`${schema}|||${data}`}>
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Schema Input */}
                    <div className="flex flex-col gap-3">
                        <label className="label">JSON Schema</label>
                        <textarea
                            value={schema}
                            onChange={(e) => setSchema(e.target.value)}
                            className="input-field h-[360px] font-mono text-sm resize-none leading-relaxed"
                            placeholder={'{\n  "type": "object",\n  "properties": {}\n}'}
                            spellCheck="false"
                        />
                    </div>

                    {/* Data Input */}
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <label className="label">JSON Data to Validate</label>
                            <button onClick={() => { setData(""); setSchema(""); }} className="text-text-muted hover:text-error transition-colors p-1" title="Clear both">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <textarea
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                            className="input-field h-[360px] font-mono text-sm resize-none leading-relaxed"
                            placeholder='{"key": "value"}'
                            spellCheck="false"
                        />
                    </div>
                </div>

                {/* Result */}
                {result && (
                    <div className={`rounded-xl p-6 border animate-in fade-in duration-300 ${result.status === "valid"
                            ? "border-success/30 bg-success/5"
                            : result.status === "error"
                                ? "border-amber-500/30 bg-amber-500/5"
                                : "border-error/30 bg-error/5"
                        }`}>
                        <div className="flex items-center gap-3 mb-4">
                            {result.status === "valid" && <CheckCircle className="w-6 h-6 text-success" />}
                            {result.status === "invalid" && <XCircle className="w-6 h-6 text-error" />}
                            {result.status === "error" && <AlertCircle className="w-6 h-6 text-amber-500" />}
                            <span className={`font-bold text-lg ${result.status === "valid" ? "text-success" :
                                    result.status === "error" ? "text-amber-500" : "text-error"
                                }`}>
                                {result.status === "valid" && "Valid — JSON matches the schema"}
                                {result.status === "invalid" && `Invalid — ${result.errors.length} error${result.errors.length !== 1 ? "s" : ""} found`}
                                {result.status === "error" && result.message}
                            </span>
                        </div>
                        {result.status === "invalid" && (
                            <ul className="space-y-2">
                                {result.errors.map((err, i) => (
                                    <li key={i} className="font-mono text-sm text-error flex gap-2">
                                        <span className="opacity-50">{i + 1}.</span>
                                        <span>{err}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
