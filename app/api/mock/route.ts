import { NextRequest, NextResponse } from 'next/server';
import LZString from 'lz-string';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const REGISTRY_FILE = path.join(os.tmpdir(), 'mock-registry.json');

const getValueByPath = (obj: any, pathExpr: string) => {
    return pathExpr.split('.').reduce((acc: any, part: string) => acc?.[part], obj);
};

const parseSqlLiteral = (raw: string) => {
    const trimmed = raw.trim();
    if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
        return trimmed.slice(1, -1);
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
    if (/^(true|false)$/i.test(trimmed)) return trimmed.toLowerCase() === 'true';
    if (/^null$/i.test(trimmed)) return null;
    return trimmed;
};

const splitSqlCsv = (input: string) => {
    const result: string[] = [];
    let current = '';
    let quote: string | null = null;

    for (let i = 0; i < input.length; i++) {
        const ch = input[i];

        if ((ch === "'" || ch === '"') && input[i - 1] !== '\\') {
            if (!quote) quote = ch;
            else if (quote === ch) quote = null;
            current += ch;
            continue;
        }

        if (ch === ',' && !quote) {
            result.push(current.trim());
            current = '';
            continue;
        }

        current += ch;
    }

    // Preserve trailing/empty values so validation can report missing fields clearly.
    result.push(current.trim());
    return result;
};

const matchesWhereClause = (row: any, whereRaw?: string) => {
    if (!whereRaw) return true;

    const clauses = whereRaw.split(/\s+AND\s+/i).map(c => c.trim()).filter(Boolean);
    return clauses.every((clause) => {
        const clauseMatch = clause.match(/^([\w.]+)\s*(=|!=|>=|<=|>|<|LIKE)\s*(.+)$/i);
        if (!clauseMatch) return false;

        const [, left, op, right] = clauseMatch;
        const leftVal = getValueByPath(row, left);
        const rightVal = parseSqlLiteral(right);

        switch (op.toUpperCase()) {
            case '=':
                return String(leftVal) === String(rightVal);
            case '!=':
                return String(leftVal) !== String(rightVal);
            case '>':
                return Number(leftVal) > Number(rightVal);
            case '<':
                return Number(leftVal) < Number(rightVal);
            case '>=':
                return Number(leftVal) >= Number(rightVal);
            case '<=':
                return Number(leftVal) <= Number(rightVal);
            case 'LIKE': {
                const regex = new RegExp(`^${String(rightVal).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')}$`, 'i');
                return regex.test(String(leftVal ?? ''));
            }
            default:
                return false;
        }
    });
};

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

const validateFieldType = (field: any, value: any) => {
    if (isEmptyValue(value)) return null;

    const actualType = Array.isArray(value) ? 'array' : typeof value;
    switch (field.type) {
        case 'string':
            return typeof value === 'string' ? null : `Field "${field.name}" must be a string, got ${actualType}.`;
        case 'number':
            return typeof value === 'number' && !isNaN(value) ? null : `Field "${field.name}" must be a number, got ${actualType}.`;
        case 'boolean':
            return typeof value === 'boolean' ? null : `Field "${field.name}" must be a boolean, got ${actualType}.`;
        case 'date':
            return typeof value === 'string' && !isNaN(Date.parse(value)) ? null : `Field "${field.name}" must be a valid ISO date string, got ${actualType}.`;
        case 'object':
            return typeof value === 'object' && value !== null && !Array.isArray(value) ? null : `Field "${field.name}" must be an object, got ${actualType}.`;
        case 'array':
            return Array.isArray(value) ? null : `Field "${field.name}" must be an array, got ${actualType}.`;
        default:
            return null;
    }
};

const makeStandardSuccess = (data: any, meta: Record<string, any> = {}) => ({
    success: true,
    data,
    error: null,
    meta: {
        timestamp: new Date().toISOString(),
        ...meta,
    },
});

const makeStandardError = (code: string, message: string, details?: any, meta: Record<string, any> = {}) => ({
    success: false,
    data: null,
    error: {
        code,
        message,
        details: details ?? null,
    },
    meta: {
        timestamp: new Date().toISOString(),
        ...meta,
    },
});

const executeQueryMethod = (sql: string, collections: any[], requestBodyParsed: any = {}) => {
    const normalized = sql.replace(/;\s*$/, '').trim();

    const selectMatch = normalized.match(/^SELECT\s+(.+?)\s+FROM\s+([\w-]+)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
    if (selectMatch) {
        const [, columnsRaw, tableName, whereRaw, limitRaw] = selectMatch;
        const collection = collections.find((c: any) => c.name?.toLowerCase() === tableName.toLowerCase());

        if (!collection) {
            throw new Error(`Table "${tableName}" not found.`);
        }

        let rows = Array.isArray(collection.items) ? [...collection.items] : [];
        rows = rows.filter((row: any) => matchesWhereClause(row, whereRaw));

        if (columnsRaw.trim() !== '*') {
            const columns = splitSqlCsv(columnsRaw);
            rows = rows.map((row: any) => {
                const projected: Record<string, any> = {};
                columns.forEach((columnExpr) => {
                    const asMatch = columnExpr.match(/^([\w.]+)\s+AS\s+([\w]+)$/i);
                    if (asMatch) {
                        const [, src, alias] = asMatch;
                        projected[alias] = getValueByPath(row, src);
                    } else {
                        projected[columnExpr] = getValueByPath(row, columnExpr);
                    }
                });
                return projected;
            });
        }

        if (limitRaw) {
            rows = rows.slice(0, Number(limitRaw));
        }

        return rows;
    }

    const insertMatch = normalized.match(/^INSERT\s+INTO\s+([\w-]+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)$/i);
    if (insertMatch) {
        const [, tableName, columnsRaw, valuesRaw] = insertMatch;
        const collection = collections.find((c: any) => c.name?.toLowerCase() === tableName.toLowerCase());

        if (!collection) {
            throw new Error(`Table "${tableName}" not found.`);
        }

        const columns = splitSqlCsv(columnsRaw);
        const values = splitSqlCsv(valuesRaw).map(parseSqlLiteral);

        if (columns.length !== values.length) {
            throw new Error('INSERT columns count must match values count.');
        }

        if (!Array.isArray(collection.items)) collection.items = [];

        // Validate against schema
        const errors: string[] = [];
        
        // Check that only schema-defined fields are being used
        const schemaFieldNames = collection.fields?.map((f: any) => f.name) || [];
        columns.forEach((col) => {
            if (col !== 'id' && !schemaFieldNames.includes(col)) {
                errors.push(`Field "${col}" is not defined in the schema.`);
            }
        });

        // Check required fields are present and not empty
        collection.fields?.forEach((f: any) => {
            if (f.required) {
                const colIdx = columns.indexOf(f.name);
                if (colIdx === -1) {
                    errors.push(`Field "${f.name}" is required.`);
                    return;
                }
                const value = values[colIdx];
                if (isEmptyValue(value)) {
                    errors.push(`Field "${f.name}" is required and cannot be empty.`);
                }
            }
        });

        // Validate types
        columns.forEach((col, idx) => {
            const value = values[idx];
            const field = collection.fields?.find((f: any) => f.name === col);
            
            if (field) {
                const typeError = validateFieldType(field, value);
                if (typeError) {
                    errors.push(typeError);
                }
            }
        });

        // Unique constraints
        collection.fields?.forEach((f: any) => {
            if (!f.unique) return;
            const colIdx = columns.indexOf(f.name);
            if (colIdx === -1) return;
            const value = values[colIdx];
            if (isEmptyValue(value)) return;

            const duplicate = collection.items.some((item: any) => String(item?.[f.name]) === String(value));
            if (duplicate) {
                errors.push(`Field "${f.name}" must be unique. Duplicate value "${value}" found.`);
            }
        });

        if (errors.length > 0) {
            throw new Error(`Validation Failed: ${errors.join(' | ')}`);
        }

        const newItem: Record<string, any> = {};
        columns.forEach((col, idx) => {
            newItem[col] = values[idx];
        });

        if (newItem.id === undefined || newItem.id === null || newItem.id === '') {
            newItem.id = Date.now();
        }

        collection.items.push(newItem);

        return { action: 'CREATE', affectedRows: 1, row: newItem };
    }

    const updateMatch = normalized.match(/^UPDATE\s+([\w-]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (updateMatch) {
        const [, tableName, setRaw, whereRaw] = updateMatch;
        const collection = collections.find((c: any) => c.name?.toLowerCase() === tableName.toLowerCase());

        if (!collection) {
            throw new Error(`Table "${tableName}" not found.`);
        }

        const assignments = splitSqlCsv(setRaw).map(expr => {
            const m = expr.match(/^([\w.]+)\s*=\s*(.+)$/);
            if (!m) throw new Error(`Invalid SET expression: ${expr}`);
            return { key: m[1], value: parseSqlLiteral(m[2]) };
        });

        if (!Array.isArray(collection.items)) collection.items = [];

        const errors: string[] = [];
        const schemaFieldNames = collection.fields?.map((f: any) => f.name) || [];

        assignments.forEach(({ key, value }) => {
            const field = collection.fields?.find((f: any) => f.name === key);
            if (key !== 'id' && !schemaFieldNames.includes(key)) {
                errors.push(`Field "${key}" is not defined in the schema.`);
                return;
            }
            if (field) {
                const typeError = validateFieldType(field, value);
                if (typeError) errors.push(typeError);
            }
        });

        if (errors.length > 0) {
            throw new Error(`Validation Failed: ${errors.join(' | ')}`);
        }

        const uniqueFields = (collection.fields || []).filter((f: any) => f.unique);
        if (uniqueFields.length > 0) {
            const targetIndexes = collection.items
                .map((item: any, idx: number) => (matchesWhereClause(item, whereRaw) ? idx : -1))
                .filter((idx: number) => idx !== -1);

            if (targetIndexes.length > 0) {
                const updatedByIndex = new Map<number, any>();
                targetIndexes.forEach((idx: number) => {
                    const updated = { ...collection.items[idx] };
                    assignments.forEach(({ key, value }) => {
                        updated[key] = value;
                    });
                    updatedByIndex.set(idx, updated);
                });

                uniqueFields.forEach((field: any) => {
                    const seen = new Map<string, number>();
                    collection.items.forEach((item: any, idx: number) => {
                        const candidate = updatedByIndex.get(idx) ?? item;
                        const val = candidate?.[field.name];
                        if (isEmptyValue(val)) return;
                        const key = String(val);
                        if (seen.has(key)) {
                            const firstIndex = seen.get(key)!;
                            if (firstIndex !== idx) {
                                errors.push(`Field "${field.name}" must be unique. Duplicate value "${val}" found.`);
                            }
                        } else {
                            seen.set(key, idx);
                        }
                    });
                });

                if (errors.length > 0) {
                    throw new Error(`Validation Failed: ${errors.join(' | ')}`);
                }
            }
        }

        let affectedRows = 0;
        collection.items = collection.items.map((item: any) => {
            if (!matchesWhereClause(item, whereRaw)) return item;
            affectedRows++;
            const updated = { ...item };
            assignments.forEach(({ key, value }) => {
                updated[key] = value;
            });
            return updated;
        });

        return { action: 'UPDATE', affectedRows };
    }

    const deleteMatch = normalized.match(/^DELETE\s+FROM\s+([\w-]+)(?:\s+WHERE\s+(.+))?$/i);
    if (deleteMatch) {
        const [, tableName, whereRaw] = deleteMatch;
        const collection = collections.find((c: any) => c.name?.toLowerCase() === tableName.toLowerCase());

        if (!collection) {
            throw new Error(`Table "${tableName}" not found.`);
        }

        if (!Array.isArray(collection.items)) collection.items = [];
        const before = collection.items.length;
        collection.items = collection.items.filter((item: any) => !matchesWhereClause(item, whereRaw));
        const affectedRows = before - collection.items.length;

        return { action: 'DELETE', affectedRows };
    }

    throw new Error('Unsupported query method. Use SELECT, INSERT, UPDATE, or DELETE.');
};

const appendWorkspaceLog = (entry: {
    method: string;
    url: string;
    fullUrl: string;
    headers: Record<string, string>;
    body: string | null;
    responseStatus: number;
    responseHeaders: Record<string, string>;
    responseBody: any;
    matchedEndpointId?: string;
    matchedRules?: any[];
    timeTakenMs: number;
}) => {
    const logEntry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        method: entry.method,
        url: entry.url,
        fullUrl: entry.fullUrl,
        headers: entry.headers,
        body: entry.body,
        responseStatus: entry.responseStatus,
        responseHeaders: entry.responseHeaders,
        responseBody: typeof entry.responseBody === 'string' ? entry.responseBody : JSON.stringify(entry.responseBody),
        matchedEndpointId: entry.matchedEndpointId,
        matchedRules: entry.matchedRules,
        timeTakenMs: entry.timeTakenMs,
        timestamp: new Date().toISOString(),
    };

    if (!(globalThis as any).mockApiWorkspaceLogs) {
        (globalThis as any).mockApiWorkspaceLogs = [];
    }
    const logs = (globalThis as any).mockApiWorkspaceLogs;
    logs.unshift(logEntry);
    if (logs.length > 50) logs.pop();
};

/**
 * Stateful Mocking Core
 * This handler processes mock requests that can interact with a "Database" (Collections).
 * Since the server is stateless, we receive the current state in either 'cfg' (compressed)
 * or 'id' (registry lookup) parameters.
 */

const handleRequest = async (req: NextRequest) => {
    const startTime = Date.now();
    let requestBodyRaw: string | null = null;
    let matchedEndpointId: string | undefined;
    let matchedRules: any[] | undefined;

    const logAndReturn = (response: NextResponse, responseBody: any) => {
        appendWorkspaceLog({
            method: req.method,
            url: req.nextUrl.pathname + req.nextUrl.search,
            fullUrl: req.url,
            headers: Object.fromEntries(req.headers.entries()),
            body: requestBodyRaw,
            responseStatus: response.status,
            responseHeaders: Object.fromEntries(response.headers.entries()),
            responseBody,
            matchedEndpointId,
            matchedRules,
            timeTakenMs: Date.now() - startTime,
        });
        return response;
    };

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Mock-State-Update');
    headers.set('Access-Control-Expose-Headers', 'X-Mock-State-Update');

    if (req.method === 'OPTIONS') {
        return new NextResponse(null, { status: 200, headers });
    }

    const { searchParams } = new URL(req.url);
    const cfg = searchParams.get('cfg');
    
    // In stateless mode, we MUST have cfg. Path is used for internal matching.
    if (!cfg) {
        return logAndReturn(NextResponse.json({ error: 'Missing cfg parameter' }, { status: 400, headers }), { error: 'Missing cfg parameter' });
    }

    try {
        const decompressed = LZString.decompressFromEncodedURIComponent(cfg);
        if (!decompressed) throw new Error('Decompression failed');
        const config = JSON.parse(decompressed);

        // --- ENDPOINT MATCHING LOGIC (Stateless) ---
        // We look for the endpoint that matches the current request's method and the 'path' query shim
        const pathParam = searchParams.get('path') || '/';
        const normalizedPath = pathParam.startsWith('/') ? pathParam : '/' + pathParam;
        const endpoints = config.endpoints || [];
        
        // Find matching endpoint
        let activeEndpoint = endpoints.find((e: any) => 
            (e.method === req.method || e.method === 'ALL') && 
            (e.path === normalizedPath || e.path === pathParam)
        );

        // Fallback for path params logic
        if (!activeEndpoint) {
            activeEndpoint = endpoints.find((e: any) => 
                (e.method === req.method || e.method === 'ALL') && 
                normalizedPath.includes(e.path.replace(/:[^\/]+/g, ''))
            );
        }

        if (!activeEndpoint) {
            const noMatch = { error: `No endpoint matches ${req.method} ${normalizedPath}` };
            return logAndReturn(NextResponse.json(noMatch, { status: 404, headers }), noMatch);
        }

        matchedEndpointId = activeEndpoint.id;
        matchedRules = activeEndpoint.rules;

        const { 
            status = 200, 
            delay = 0, 
            errorType = 'none', 
            body: staticBody = {}, 
            stateConfig,
            headers: customHeaders = [],
        } = activeEndpoint;

        const collections = config.collections || [];
        const customQueries = config.customQueries || [];

        // Parse request body once so it can be reused by query placeholders and CRUD handlers
        let requestBodyParsed: any = {};
        let requestBodyJsonInvalid = false;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
            try {
                requestBodyRaw = await req.text();
                if (requestBodyRaw) {
                    try {
                        requestBodyParsed = JSON.parse(requestBodyRaw);
                    } catch {
                        requestBodyJsonInvalid = true;
                        requestBodyParsed = {};
                    }
                }
            } catch {
                requestBodyRaw = null;
                requestBodyParsed = {};
            }
        }

        // 1. Simulate Delay
        if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 2. Custom Headers from Endpoint
        if (Array.isArray(customHeaders)) {
            customHeaders.forEach((h: any) => { if (h.key && h.value) headers.set(h.key, h.value); });
        }

        // 3. Error Simulations (If Error Rate not 100%, this would be randomized, but here we check errorType)
        if (errorType !== 'none') {
            const errorStatus = errorType === '500' ? 500 : errorType === '401' ? 401 : errorType === '403' ? 403 : status;
            const errorBody = errorType === '500' ? { error: 'Internal Server Error' } : errorType === '401' ? { error: 'Unauthorized' } : errorType === '403' ? { error: 'Forbidden' } : { error: 'Unknown Error' };
            return logAndReturn(NextResponse.json(errorBody, { status: errorStatus, headers }), errorBody);
        }

        const interpolate = (data: any): any => {
            if (typeof data !== 'string' && typeof data !== 'object') return data;
            
            let str = typeof data === 'string' ? data : JSON.stringify(data);
            const allParams = Object.fromEntries(searchParams.entries());
            
            // Query params: {{query.name}}
            str = str.replace(/\{\{query\.([^}]+)\}\}/g, (_, name) => searchParams.get(name) || '');
            
            // General params: {{params.name}}
            str = str.replace(/\{\{params\.([^}]+)\}\}/g, (_, name) => (allParams as any)[name] || '');

            // Request body params: {{body.name}} or full payload {{body}}
            str = str.replace(/\{\{body(?:\.([^}]+))?\}\}/g, (_, pathExpr) => {
                if (!pathExpr) {
                    if (requestBodyRaw) return requestBodyRaw;
                    if (typeof requestBodyParsed === 'object' && requestBodyParsed !== null) {
                        return JSON.stringify(requestBodyParsed);
                    }
                    return '';
                }

                const value = getValueByPath(requestBodyParsed, pathExpr);
                if (value === undefined || value === null) return '';
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
            });
            
            try {
                return JSON.parse(str);
            } catch (e) {
                return str; // Return as raw string if it's not valid JSON after interpolation (e.g. HTML/Text)
            }
        };

        let responseBody = interpolate(staticBody);
        let finalCollections = [...collections];

        // 4. Stateful Logic (query methods and legacy CRUD)
        if (stateConfig?.enabled) {
            const operation = stateConfig.operation || 'LIST';

            if (typeof operation === 'string' && operation.startsWith('custom-')) {
                const queryId = operation.replace('custom-', '');
                const queryMethod = customQueries.find((q: any) => q.id === queryId);

                if (!queryMethod?.code) {
                    const queryNotFound = makeStandardError('QUERY_METHOD_NOT_FOUND', 'Selected query method not found.', null, {
                        source: 'custom-query',
                        operation,
                    });
                    return logAndReturn(NextResponse.json(queryNotFound, { status: 400, headers }), queryNotFound);
                }

                if (requestBodyJsonInvalid && queryMethod.code.includes('{{body')) {
                    const invalidBody = makeStandardError('INVALID_JSON_BODY', 'Invalid JSON body', 'Request body must be valid JSON when query uses {{body.*}} placeholders.', {
                        source: 'custom-query',
                        operation,
                    });
                    return logAndReturn(NextResponse.json(invalidBody, { status: 400, headers }), invalidBody);
                }

                try {
                    const resolvedQuery = String(interpolate(queryMethod.code));
                    const queryData = executeQueryMethod(resolvedQuery, finalCollections, requestBodyParsed);
                    responseBody = makeStandardSuccess(queryData, {
                        source: 'custom-query',
                        operation,
                        queryId,
                    });
                } catch (queryError: any) {
                    const failedQuery = makeStandardError('QUERY_EXECUTION_FAILED', 'Query execution failed', queryError.message, {
                        source: 'custom-query',
                        operation,
                        queryId,
                    });
                    return logAndReturn(NextResponse.json(failedQuery, { status: 400, headers }), failedQuery);
                }
            } else if (stateConfig.collectionId) {
                const colIdx = finalCollections.findIndex((c: any) => c.id === stateConfig.collectionId);
                if (colIdx !== -1) {
                    const collection = finalCollections[colIdx];
                    const resourceId = searchParams.get('id'); // 'id' or 'rid' fallback
                
                    const validate = (data: any, options?: { excludeId?: any }) => {
                        const errors: string[] = [];
                        const schemaFieldNames = new Set((collection.fields || []).map((f: any) => f.name));

                        Object.keys(data || {}).forEach((key) => {
                            if (key === 'id') return;
                            if (!schemaFieldNames.has(key)) {
                                errors.push(`Field "${key}" is not defined in the schema.`);
                            }
                        });

                        collection.fields.forEach((f: any) => {
                            const value = data[f.name];

                            // Check required fields
                            if (f.required && isEmptyValue(value)) {
                                errors.push(`Field "${f.name}" is required.`);
                                return;
                            }

                            // Type validation for non-null/undefined values
                            if (!isEmptyValue(value)) {
                                const typeError = validateFieldType(f, value);
                                if (typeError) errors.push(typeError);
                            }

                            if (f.unique && !isEmptyValue(value)) {
                                const duplicate = collection.items.some((item: any) => {
                                    if (options?.excludeId !== undefined && String(item.id) === String(options.excludeId)) {
                                        return false;
                                    }
                                    return String(item?.[f.name]) === String(value);
                                });

                                if (duplicate) {
                                    errors.push(`Field "${f.name}" must be unique. Duplicate value "${value}" found.`);
                                }
                            }
                        });
                        return errors;
                    };

                    switch (operation) {
                        case 'LIST':
                            responseBody = makeStandardSuccess(collection.items, {
                                source: 'collection-crud',
                                operation,
                                collectionId: stateConfig.collectionId,
                            });
                            break;
                    
                        case 'GET': {
                            const item = collection.items.find((i: any) => String(i.id) === String(resourceId));
                            if (!item) {
                                const notFound = makeStandardError('RECORD_NOT_FOUND', 'Record not found', null, {
                                    source: 'collection-crud',
                                    operation,
                                    collectionId: stateConfig.collectionId,
                                    resourceId,
                                });
                                return logAndReturn(NextResponse.json(notFound, { status: 404, headers }), notFound);
                            }
                            responseBody = makeStandardSuccess(item, {
                                source: 'collection-crud',
                                operation,
                                collectionId: stateConfig.collectionId,
                                resourceId,
                            });
                            break;
                        }

                        case 'CREATE': {
                            if (requestBodyJsonInvalid) {
                                const invalidBody = makeStandardError('INVALID_JSON_BODY', 'Invalid JSON body', 'Request body must be valid JSON for CREATE operation.', {
                                    source: 'collection-crud',
                                    operation,
                                    collectionId: stateConfig.collectionId,
                                });
                                return logAndReturn(NextResponse.json(invalidBody, { status: 400, headers }), invalidBody);
                            }
                            const payload = (requestBodyParsed && typeof requestBodyParsed === 'object' && !Array.isArray(requestBodyParsed)) ? requestBodyParsed : {};
                            const errors = validate(payload);
                            if (errors.length > 0) {
                                const validationError = makeStandardError('VALIDATION_FAILED', 'Validation Failed', errors, {
                                    source: 'collection-crud',
                                    operation,
                                    collectionId: stateConfig.collectionId,
                                });
                                return logAndReturn(NextResponse.json(validationError, { status: 400, headers }), validationError);
                            }
                            
                            const newItem = { ...payload, id: payload.id || Date.now() };
                            collection.items.push(newItem);
                            responseBody = makeStandardSuccess(newItem, {
                                source: 'collection-crud',
                                operation,
                                collectionId: stateConfig.collectionId,
                                affectedRows: 1,
                            });
                            break;
                        }

                        case 'UPDATE': {
                            if (requestBodyJsonInvalid) {
                                const invalidBody = makeStandardError('INVALID_JSON_BODY', 'Invalid JSON body', 'Request body must be valid JSON for UPDATE operation.', {
                                    source: 'collection-crud',
                                    operation,
                                    collectionId: stateConfig.collectionId,
                                    resourceId,
                                });
                                return logAndReturn(NextResponse.json(invalidBody, { status: 400, headers }), invalidBody);
                            }
                            const payload = (requestBodyParsed && typeof requestBodyParsed === 'object' && !Array.isArray(requestBodyParsed)) ? requestBodyParsed : {};
                            const itemIdx = collection.items.findIndex((i: any) => String(i.id) === String(resourceId));
                            if (itemIdx === -1) {
                                const notFound = makeStandardError('RECORD_NOT_FOUND', 'Record not found', null, {
                                    source: 'collection-crud',
                                    operation,
                                    collectionId: stateConfig.collectionId,
                                    resourceId,
                                });
                                return logAndReturn(NextResponse.json(notFound, { status: 404, headers }), notFound);
                            }
                            
                            const errors = validate(payload, { excludeId: collection.items[itemIdx]?.id });
                            if (errors.length > 0) {
                                const validationError = makeStandardError('VALIDATION_FAILED', 'Validation Failed', errors, {
                                    source: 'collection-crud',
                                    operation,
                                    collectionId: stateConfig.collectionId,
                                    resourceId,
                                });
                                return logAndReturn(NextResponse.json(validationError, { status: 400, headers }), validationError);
                            }
                            
                            collection.items[itemIdx] = { ...collection.items[itemIdx], ...payload };
                            responseBody = makeStandardSuccess(collection.items[itemIdx], {
                                source: 'collection-crud',
                                operation,
                                collectionId: stateConfig.collectionId,
                                resourceId,
                                affectedRows: 1,
                            });
                            break;
                        }

                        case 'DELETE': {
                            const itemIdx = collection.items.findIndex((i: any) => String(i.id) === String(resourceId));
                            if (itemIdx === -1) {
                                const notFound = makeStandardError('RECORD_NOT_FOUND', 'Record not found', null, {
                                    source: 'collection-crud',
                                    operation,
                                    collectionId: stateConfig.collectionId,
                                    resourceId,
                                });
                                return logAndReturn(NextResponse.json(notFound, { status: 404, headers }), notFound);
                            }
                            
                            const deleted = collection.items.splice(itemIdx, 1);
                            responseBody = makeStandardSuccess({ deleted: deleted[0] }, {
                                source: 'collection-crud',
                                operation,
                                collectionId: stateConfig.collectionId,
                                resourceId,
                                affectedRows: 1,
                            });
                            break;
                        }
                    }
                }
            }

            headers.set('X-Mock-State-Update', LZString.compressToEncodedURIComponent(JSON.stringify(finalCollections)));
        }

        // Final response preparation
        const responseHeaders = Object.fromEntries(headers.entries());
        if (!responseHeaders['content-type']) {
            responseHeaders['content-type'] = 'application/json; charset=utf-8';
        }

        // Standard Backend Metadata
        responseHeaders['Date'] = new Date().toUTCString();
        responseHeaders['X-Powered-By'] = 'Mock-API-Sim-2.1';
        responseHeaders['Server'] = 'Vercel/Mock-Sim';
        
        // Security & Caching
        responseHeaders['X-Content-Type-Options'] = 'nosniff';
        responseHeaders['Cache-Control'] = 'no-store, no-cache, must-revalidate';
        responseHeaders['Pragma'] = 'no-cache';

        // Intelligently handle body: Don't double-stringify strings
        let bodyToSend: string;
        if (typeof responseBody === 'string') {
            bodyToSend = responseBody;
        } else {
            bodyToSend = JSON.stringify(responseBody, null, 2);
        }

        // Map common status codes to standard texts for authenticity
        const statusTexts: Record<number, string> = {
            200: 'OK', 201: 'Created', 204: 'No Content',
            400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found',
            500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable'
        };

        const finalResponse = new NextResponse(bodyToSend, {
            status,
            statusText: statusTexts[status] || 'OK',
            headers: responseHeaders
        });

        return logAndReturn(finalResponse, responseBody);

    } catch (e: any) {
        const unhandled = { error: 'Mock processing error', details: e.message };
        return logAndReturn(NextResponse.json(unhandled, { status: 500, headers }), unhandled);
    }
};

export { handleRequest as GET, handleRequest as POST, handleRequest as PUT, handleRequest as PATCH, handleRequest as DELETE, handleRequest as OPTIONS };
