import { NextRequest, NextResponse } from 'next/server';
import LZString from 'lz-string';

interface Rule {
    id: string;
    target: 'header' | 'body';
    propertyPath: string;
    operator: 'equals' | 'exists' | 'missing';
    value?: string;
}

interface Endpoint {
    id: string;
    folderId?: string | null;
    method: string;
    path: string;
    rules?: Rule[];
    headers?: { id: string; key: string; value: string }[];
    status: number;
    delay: number;
    delayMax?: number;
    errorType: string;
    errorRate?: number;
    body: any;
    stateConfig?: {
        enabled: boolean;
        collectionId: string;
        operation: 'LIST' | 'GET' | 'CREATE' | 'UPDATE' | 'DELETE' | string;
    };
}

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
            case '=': return String(leftVal) === String(rightVal);
            case '!=': return String(leftVal) !== String(rightVal);
            case '>': return Number(leftVal) > Number(rightVal);
            case '<': return Number(leftVal) < Number(rightVal);
            case '>=': return Number(leftVal) >= Number(rightVal);
            case '<=': return Number(leftVal) <= Number(rightVal);
            case 'LIKE': {
                const regex = new RegExp(`^${String(rightVal).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*')}$`, 'i');
                return regex.test(String(leftVal ?? ''));
            }
            default: return false;
        }
    });
};

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

const validateFieldType = (field: any, value: any) => {
    if (isEmptyValue(value)) return null;
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    switch (field.type) {
        case 'string': return typeof value === 'string' ? null : `Field "${field.name}" must be a string, got ${actualType}.`;
        case 'number': return typeof value === 'number' && !isNaN(value) ? null : `Field "${field.name}" must be a number, got ${actualType}.`;
        case 'boolean': return typeof value === 'boolean' ? null : `Field "${field.name}" must be a boolean, got ${actualType}.`;
        case 'date': return typeof value === 'string' && !isNaN(Date.parse(value)) ? null : `Field "${field.name}" must be a valid ISO date string, got ${actualType}.`;
        case 'object': return typeof value === 'object' && value !== null && !Array.isArray(value) ? null : `Field "${field.name}" must be an object, got ${actualType}.`;
        case 'array': return Array.isArray(value) ? null : `Field "${field.name}" must be an array, got ${actualType}.`;
        default: return null;
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

const executeQueryMethod = (sql: string, collections: any[]) => {
    const normalized = sql.replace(/;\s*$/, '').trim();

    // SELECT
    const selectMatch = normalized.match(/^SELECT\s+(.+?)\s+FROM\s+([\w-]+)(?:\s+WHERE\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i);
    if (selectMatch) {
        const [, columnsRaw, tableName, whereRaw, limitRaw] = selectMatch;
        const collection = collections.find((c: any) => c.name?.toLowerCase() === tableName.toLowerCase());
        if (!collection) throw new Error(`Table "${tableName}" not found.`);
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
        if (limitRaw) rows = rows.slice(0, Number(limitRaw));
        return rows;
    }

    // INSERT
    const insertMatch = normalized.match(/^INSERT\s+INTO\s+([\w-]+)\s*\((.+?)\)\s*VALUES\s*\((.+?)\)$/i);
    if (insertMatch) {
        const [, tableName, columnsRaw, valuesRaw] = insertMatch;
        const collection = collections.find((c: any) => c.name?.toLowerCase() === tableName.toLowerCase());
        if (!collection) throw new Error(`Table "${tableName}" not found.`);
        const columns = splitSqlCsv(columnsRaw);
        const values = splitSqlCsv(valuesRaw).map(parseSqlLiteral);
        if (columns.length !== values.length) throw new Error('INSERT columns count must match values count.');
        if (!Array.isArray(collection.items)) collection.items = [];

        // Simple validation
        const errors: string[] = [];
        const schemaFieldNames = collection.fields?.map((f: any) => f.name) || [];
        columns.forEach((col) => {
            if (col !== 'id' && !schemaFieldNames.includes(col)) errors.push(`Field "${col}" is not defined in the schema.`);
        });

        if (errors.length > 0) throw new Error(`Validation Failed: ${errors.join(' | ')}`);

        const newItem: Record<string, any> = {};
        columns.forEach((col, idx) => { newItem[col] = values[idx]; });
        if (!newItem.id) newItem.id = Date.now();
        collection.items.push(newItem);

        return { action: 'CREATE', affectedRows: 1, row: newItem };
    }

    // UPDATE
    const updateMatch = normalized.match(/^UPDATE\s+([\w-]+)\s+SET\s+(.+?)(?:\s+WHERE\s+(.+))?$/i);
    if (updateMatch) {
        const [, tableName, setRaw, whereRaw] = updateMatch;
        const collection = collections.find((c: any) => c.name?.toLowerCase() === tableName.toLowerCase());
        if (!collection) throw new Error(`Table "${tableName}" not found.`);
        const assignments = splitSqlCsv(setRaw).map(expr => {
            const m = expr.match(/^([\w.]+)\s*=\s*(.+)$/);
            if (!m) throw new Error(`Invalid SET expression: ${expr}`);
            return { key: m[1], value: parseSqlLiteral(m[2]) };
        });
        if (!Array.isArray(collection.items)) collection.items = [];
        let affectedRows = 0;
        collection.items = collection.items.map((item: any) => {
            if (!matchesWhereClause(item, whereRaw)) return item;
            affectedRows++;
            const updated = { ...item };
            assignments.forEach(({ key, value }) => { updated[key] = value; });
            return updated;
        });
        return { action: 'UPDATE', affectedRows };
    }

    // DELETE
    const deleteMatch = normalized.match(/^DELETE\s+FROM\s+([\w-]+)(?:\s+WHERE\s+(.+))?$/i);
    if (deleteMatch) {
        const [, tableName, whereRaw] = deleteMatch;
        const collection = collections.find((c: any) => c.name?.toLowerCase() === tableName.toLowerCase());
        if (!collection) throw new Error(`Table "${tableName}" not found.`);
        if (!Array.isArray(collection.items)) collection.items = [];
        const before = collection.items.length;
        collection.items = collection.items.filter((item: any) => !matchesWhereClause(item, whereRaw));
        const affectedRows = before - collection.items.length;
        return { action: 'DELETE', affectedRows };
    }

    throw new Error('Unsupported query method. Use SELECT, INSERT, UPDATE, or DELETE.');
};

export async function handleRequest(req: NextRequest, { params }: any) {
    const startTime = Date.now();
    const reqPath = '/' + (params.path?.join('/') || '');
    const reqMethod = req.method.toUpperCase();
    const searchParams = req.nextUrl.searchParams;

    const resHeaders = new Headers();
    resHeaders.set('Access-Control-Allow-Origin', '*');
    resHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (reqMethod === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers: resHeaders });
    }

    let endpoints: Endpoint[] = [];
    let collections: any[] = [];
    let customQueries: any[] = [];
    let chaosMode = false;

    try {
        const decompressed = LZString.decompressFromEncodedURIComponent(params.config);
        if (!decompressed) throw new Error("Failed to decompress");
        const parsed = JSON.parse(decompressed);
        if (Array.isArray(parsed)) {
            endpoints = parsed;
        } else {
            endpoints = parsed.endpoints || [];
            collections = parsed.collections || [];
            customQueries = parsed.customQueries || [];
            chaosMode = parsed.chaosMode === true;
        }
    } catch (e) {
        return NextResponse.json({ error: "Invalid workspace configuration" }, { status: 400, headers: resHeaders });
    }

    let reqBodyStr: string | null = null;
    let reqBodyParsed: any = null;
    if (reqMethod !== 'GET' && reqMethod !== 'OPTIONS') {
        try {
            reqBodyStr = await req.text();
            if (reqBodyStr) reqBodyParsed = JSON.parse(reqBodyStr);
        } catch (e) {}
    }

    let bestMatch: Endpoint | null = null;
    let highestScore = -1;
    let bestMatchParams: Record<string, string> = {};

    for (const ep of endpoints) {
        if (ep.method !== 'ALL' && ep.method !== reqMethod) continue;
        const [configUrlPath, configQueryString] = ep.path.split('?');
        const configSegments = configUrlPath.split('/').filter(Boolean);
        const actualSegments = reqPath.split('/').filter(Boolean);
        if (configSegments.length !== actualSegments.length) continue;
        
        let score = 0;
        let pathMatched = true;
        const currentParams: Record<string, string> = {};
        for (let i = 0; i < configSegments.length; i++) {
            if (configSegments[i].startsWith(':')) {
                currentParams[configSegments[i].slice(1)] = actualSegments[i];
            } else if (configSegments[i] !== actualSegments[i]) {
                pathMatched = false;
                break;
            }
        }
        if (!pathMatched) continue;
        score += 100;

        if (ep.rules && ep.rules.length > 0) {
            let rulesMatched = true;
            for (const rule of ep.rules) {
                if (!rule.propertyPath) continue;
                let actual: any;
                if (rule.target === 'header') actual = req.headers.get(rule.propertyPath.toLowerCase());
                else if (rule.target === 'body' && reqBodyParsed) actual = getValueByPath(reqBodyParsed, rule.propertyPath);
                
                if (rule.operator === 'exists' && (actual === undefined || actual === null)) rulesMatched = false;
                else if (rule.operator === 'missing' && (actual !== undefined && actual !== null)) rulesMatched = false;
                else if (rule.operator === 'equals' && String(actual) !== rule.value) rulesMatched = false;
                if (!rulesMatched) break;
            }
            if (!rulesMatched) continue;
            score += 500;
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = ep;
            bestMatchParams = currentParams;
        }
    }

    if (!bestMatch) {
        const error = { error: `No mock endpoint configured for ${reqMethod} ${reqPath}` };
        return NextResponse.json(error, { status: 404, headers: resHeaders });
    }

    const { status = 200, delay = 0, delayMax = 0, errorType = 'none', errorRate = 100, body = {}, headers: customHeaders = [], stateConfig } = bestMatch;

    // Interpolation
    const interpolate = (val: string) => {
        let result = val;
        // Params
        Object.entries(bestMatchParams).forEach(([k, v]) => {
            result = result.replace(new RegExp(`\\{\\{params\\.${k}\\}\\}`, 'g'), v);
        });
        // Query
        searchParams.forEach((v, k) => {
            result = result.replace(new RegExp(`\\{\\{query\\.${k}\\}\\}`, 'g'), v);
        });
        // Body
        result = result.replace(/\{\{body(?:\.([^}]+))?\}\}/g, (_, path) => {
            if (!path) return reqBodyStr || '';
            const v = getValueByPath(reqBodyParsed, path);
            return v !== undefined && v !== null ? (typeof v === 'object' ? JSON.stringify(v) : String(v)) : '';
        });
        return result;
    };

    const processInterpolation = (data: any): any => {
        if (typeof data === 'string') return interpolate(data);
        if (typeof data === 'object' && data !== null) {
            const str = JSON.stringify(data);
            try { return JSON.parse(interpolate(str)); } catch(e) { return data; }
        }
        return data;
    };

    let responseBody = processInterpolation(body);

    // Custom Headers
    customHeaders.forEach(h => { if (h.key && h.value) resHeaders.set(h.key, interpolate(h.value)); });

    // Stateful Operations
    if (stateConfig?.enabled) {
        const operation = stateConfig.operation;
        if (operation?.startsWith('custom-')) {
            const queryId = operation.replace('custom-', '');
            const query = customQueries.find(q => q.id === queryId);
            if (query) {
                try {
                    const resolvedQuery = interpolate(query.code);
                    const queryResult = executeQueryMethod(resolvedQuery, collections);
                    responseBody = makeStandardSuccess(queryResult, { operation, queryId });
                } catch (e: any) {
                    responseBody = makeStandardError('QUERY_FAILED', e.message);
                }
            }
        } else if (stateConfig.collectionId) {
            const collection = collections.find(c => c.id === stateConfig.collectionId);
            if (collection) {
                const resourceId = searchParams.get('id');
                if (operation === 'LIST') responseBody = makeStandardSuccess(collection.items);
                else if (operation === 'GET') {
                    const item = collection.items.find((i: any) => String(i.id) === String(resourceId));
                    responseBody = item ? makeStandardSuccess(item) : makeStandardError('NOT_FOUND', 'Item not found');
                }
            }
        }
        
        // Return updated state in header for persistence synchronization
        resHeaders.set('X-Mock-State-Update', LZString.compressToEncodedURIComponent(JSON.stringify(collections)));
        resHeaders.set('Access-Control-Expose-Headers', 'X-Mock-State-Update');
    }

    // Delay
    const actualDelay = chaosMode ? Math.floor(Math.random() * 2700) + 300 : (delayMax > delay ? Math.floor(Math.random() * (delayMax - delay + 1)) + delay : delay);
    if (actualDelay > 0) await new Promise(r => setTimeout(r, actualDelay));

    // Chaos Mode / Errors
    let finalStatus = status;
    if (chaosMode && Math.random() < 0.1) {
        finalStatus = 500;
        responseBody = { error: "CHAOS_MODE", message: "Chaos Monkey intervention" };
    } else if (errorType !== 'none' && (Math.random() * 100) < errorRate) {
        finalStatus = parseInt(errorType) || 500;
        responseBody = { error: "SIMULATED_ERROR", type: errorType };
    }

    if (!resHeaders.has('Content-Type')) {
        resHeaders.set('Content-Type', 'application/json; charset=utf-8');
    }
    resHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    resHeaders.set('Pragma', 'no-cache');
    resHeaders.set('Date', new Date().toUTCString());

    const bodyToSend = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody, null, 2);
    const response = new NextResponse(bodyToSend, { 
        status: finalStatus, 
        headers: resHeaders 
    });

    // Logging
    const logEntry = {
        id: `log-${Date.now()}`,
        method: reqMethod,
        url: reqPath + (searchParams.toString() ? '?' + searchParams.toString() : ''),
        headers: Object.fromEntries(req.headers),
        body: reqBodyStr,
        responseStatus: finalStatus,
        responseHeaders: Object.fromEntries(resHeaders),
        responseBody: bodyToSend,
        timeTakenMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        matchedEndpointId: bestMatch.id
    };

    if (!(globalThis as any).mockApiWorkspaceLogs) (globalThis as any).mockApiWorkspaceLogs = [];
    (globalThis as any).mockApiWorkspaceLogs.unshift(logEntry);
    if ((globalThis as any).mockApiWorkspaceLogs.length > 50) (globalThis as any).mockApiWorkspaceLogs.pop();

    return response;
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;

