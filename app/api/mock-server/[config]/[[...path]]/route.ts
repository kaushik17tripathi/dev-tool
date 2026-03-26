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
}

export async function handleRequest(req: NextRequest, { params }: any) {
    const startTime = Date.now();
    const reqPath = '/' + (params.path?.join('/') || '');
    const reqMethod = req.method.toUpperCase();
    const searchParams = req.nextUrl.searchParams;

    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (reqMethod === 'OPTIONS') {
        return new NextResponse(null, { status: 204, headers });
    }

    let workspace: Endpoint[] = [];
    let chaosMode = false;

    try {
        const decompressed = LZString.decompressFromEncodedURIComponent(params.config);
        if (!decompressed) throw new Error("Failed to decompress");
        
        const parsed = JSON.parse(decompressed);
        if (Array.isArray(parsed)) {
            workspace = parsed;
        } else if (parsed && Array.isArray(parsed.endpoints)) {
            workspace = parsed.endpoints;
            chaosMode = parsed.chaosMode === true;
        } else {
            throw new Error("Invalid format");
        }
    } catch (e) {
        return NextResponse.json({ error: "Invalid workspace configuration payload" }, { status: 400, headers });
    }

    // Pre-parse the request body once for rule evaluation
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

    // Rules Engine and Path Matcher
    for (const ep of workspace) {
        if (ep.method !== 'ALL' && ep.method !== reqMethod) continue;

        const [configUrlPath, configQueryString] = ep.path.split('?');
        const configSegments = configUrlPath.split('/').filter(Boolean);
        const actualSegments = reqPath.split('/').filter(Boolean);
        
        if (configSegments.length !== actualSegments.length) continue;
        
        let score = 0;
        let isExactPath = true;
        let pathMatched = true;

        const currentMatchParams: Record<string, string> = {};
        for (let i = 0; i < configSegments.length; i++) {
            if (configSegments[i].startsWith(':')) {
                isExactPath = false;
                const paramName = configSegments[i].slice(1);
                currentMatchParams[paramName] = actualSegments[i];
            } else if (configSegments[i] !== actualSegments[i]) {
                pathMatched = false;
                break;
            }
        }
        
        if (!pathMatched) continue;
        if (isExactPath) score += 100;
        
        if (configQueryString) {
            const configQuery = new URLSearchParams(configQueryString);
            let queryMatchCount = 0;
            let queriesMatched = true;

            configQuery.forEach((val, key) => {
                if (searchParams.get(key) === val) {
                    queryMatchCount++;
                } else {
                    queriesMatched = false;
                }
            });
            
            if (!queriesMatched) continue; 
            score += (10 * queryMatchCount);
        }

        // Evaluate Dynamic Rules
        let rulesMatched = true;
        let ruleScore = 0;

        if (ep.rules && ep.rules.length > 0) {
            for (const rule of ep.rules) {
                let actualValue: any = undefined;

                // Skip incomplete rules
                if (!rule.propertyPath) continue;

                if (rule.target === 'header') {
                    actualValue = req.headers.get(rule.propertyPath.toLowerCase());
                } else if (rule.target === 'body') {
                    if (reqBodyParsed && typeof reqBodyParsed === 'object') {
                        actualValue = rule.propertyPath.split('.').reduce((obj, key) => obj?.[key], reqBodyParsed);
                    }
                }

                if (rule.operator === 'exists') {
                    if (actualValue === undefined || actualValue === null) rulesMatched = false;
                } else if (rule.operator === 'missing') {
                    if (actualValue !== undefined && actualValue !== null) rulesMatched = false;
                } else if (rule.operator === 'equals') {
                    if (String(actualValue) !== rule.value) rulesMatched = false;
                }

                if (!rulesMatched) break;
                ruleScore += 500;
            }
        }

        if (!rulesMatched) continue; // Disqualified

        score += ruleScore;

        if (score > highestScore) {
            highestScore = score;
            bestMatch = ep;
            bestMatchParams = currentMatchParams;
        }
    }

    const endpoint = bestMatch;

    let response: NextResponse | null = null;
    let returnedBody: any = null;
    let returnedStatus = 404;

    if (!endpoint) {
        returnedBody = { error: `No mock endpoint configured for ${reqMethod} ${reqPath} that matches all required parameters and rules.` };
        response = NextResponse.json(returnedBody, { status: 404, headers });
    } else {
        const { status = 200, delay = 0, delayMax = 0, errorType = 'none', errorRate = 100, body = {}, headers: customHeaders = [] } = endpoint;
        
        // --- 1. Variable Interpolation (Body & Custom Headers) ---
        const interpolationMap: Record<string, string> = {};
        Object.entries(bestMatchParams).forEach(([k, v]) => interpolationMap[`params.${k}`] = v);
        searchParams.forEach((v, k) => interpolationMap[`query.${k}`] = v);

        const interpolate = (val: string) => {
            let result = val;
            Object.entries(interpolationMap).forEach(([k, v]) => {
                const regex = new RegExp(`\\{\\{${k.replace('.', '\\.')}\\}\\}`, 'g');
                result = result.replace(regex, v);
            });
            return result;
        };

        // Deeply interpolate body if it's a string or object
        let interpolatedBody = body;
        if (typeof body === 'string') {
            interpolatedBody = interpolate(body);
        } else if (typeof body === 'object' && body !== null) {
            const bodyStr = JSON.stringify(body);
            interpolatedBody = JSON.parse(interpolate(bodyStr));
        }

        // Apply Custom Headers (with interpolation)
        customHeaders.forEach(h => {
            if (h.key && h.value) {
                headers.set(h.key, interpolate(h.value));
            }
        });

        returnedStatus = status;

        const minDelay = Math.max(0, delay);
        const maxD = Math.max(minDelay, delayMax);
        let actualDelay = maxD > minDelay 
            ? Math.floor(Math.random() * (maxD - minDelay + 1)) + minDelay 
            : minDelay;

        // Apply Chaos Mode - Overwrite delays entirely to random spikes 0.3s - 3s
        if (chaosMode) actualDelay = Math.floor(Math.random() * 2700) + 300;

        if (actualDelay > 0) {
            await new Promise(resolve => setTimeout(resolve, actualDelay));
        }

        let shouldFail = errorType !== 'none' && (Math.random() * 100) < errorRate;
        let activeErrorType = errorType;
        let returnedBodyObj = typeof interpolatedBody === 'object' && interpolatedBody !== null ? JSON.parse(JSON.stringify(interpolatedBody)) : interpolatedBody;

        if (chaosMode) {
            const chaosRoll = Math.random() * 100;
            if (chaosRoll < 10) {
                // 10% 500 Server Error
                returnedStatus = 500;
                returnedBodyObj = { error: "CHAOS_MODE_INTERVENTION", message: "Chaos Monkey struck this request." };
                shouldFail = true;
                activeErrorType = 'none'; // Avoid other simulated errors
            } else if (chaosRoll < 20) {
                // 10% CORS
                activeErrorType = 'cors';
                shouldFail = true;
            } else if (chaosRoll < 30) {
                // 10% Timeout
                activeErrorType = 'timeout';
                shouldFail = true;
            } else if (chaosRoll < 40) {
                // 10% Schema break
                if (typeof returnedBodyObj === 'object' && returnedBodyObj !== null && !Array.isArray(returnedBodyObj)) {
                    const keys = Object.keys(returnedBodyObj);
                    if (keys.length > 0) {
                        const randomKey = keys[Math.floor(Math.random() * keys.length)];
                        const breakRoll = Math.random();
                        if (breakRoll < 0.33) delete returnedBodyObj[randomKey];
                        else if (breakRoll < 0.66) returnedBodyObj[randomKey] = null;
                        else returnedBodyObj[randomKey] = typeof returnedBodyObj[randomKey] === 'string' ? 9999 : "TYPE_CORRUPTION";
                    } else activeErrorType = 'malformed';
                } else if (Array.isArray(returnedBodyObj) && returnedBodyObj.length > 0) {
                    returnedBodyObj.pop(); // Delete a row
                } else {
                    activeErrorType = 'malformed';
                    shouldFail = true;
                }
            }
        }

        if (shouldFail) {
            if (activeErrorType === 'cors') {
                headers.delete('Access-Control-Allow-Origin');
                headers.delete('Access-Control-Allow-Methods');
                returnedBody = returnedBodyObj;
                response = new NextResponse(JSON.stringify(returnedBody), { status: returnedStatus, headers });
            } else if (activeErrorType === 'malformed') {
                returnedBody = '{"broken_json": true, "message": "Notice the missing closing brace"';
                headers.set('Content-Type', 'application/json');
                response = new NextResponse(returnedBody, { status: returnedStatus, headers });
            } else if (activeErrorType === 'timeout') {
                await new Promise(resolve => setTimeout(resolve, 30000));
                returnedBody = { error: 'Simulated Timeout' };
                returnedStatus = 504;
                response = NextResponse.json(returnedBody, { status: returnedStatus, headers });
            } else if (activeErrorType === 'none') {
                // For the 500 status chaos intervention
                returnedBody = returnedBodyObj;
                headers.set('Content-Type', 'application/json');
                response = new NextResponse(JSON.stringify(returnedBody), { status: returnedStatus, headers });
            }
        } else {
            returnedBody = returnedBodyObj;
            headers.set('Content-Type', 'application/json');
            response = new NextResponse(JSON.stringify(returnedBody), { status: returnedStatus, headers });
        }
    }

    // Save Request Telemetry to global Logs cache
    if (!response) { // Failsafe
        response = NextResponse.json({ error: "Unknown routing error" }, { status: 500, headers });
        returnedStatus = 500;
        returnedBody = { error: "Unknown routing error" };
    }

    const logEntry = {
        id: `log-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        method: reqMethod,
        url: req.nextUrl.pathname + req.nextUrl.search,
        headers: Object.fromEntries(req.headers.entries()),
        body: reqBodyStr,
        responseStatus: returnedStatus,
        responseHeaders: Object.fromEntries(headers.entries()),
        responseBody: typeof returnedBody === 'string' ? returnedBody : JSON.stringify(returnedBody),
        timeTakenMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        matchedEndpointId: endpoint?.id,
        matchedRules: endpoint?.rules
    };

    if (!(globalThis as any).mockApiWorkspaceLogs) {
        (globalThis as any).mockApiWorkspaceLogs = [];
    }
    const logs = (globalThis as any).mockApiWorkspaceLogs;
    logs.unshift(logEntry);
    if (logs.length > 50) logs.pop(); // Keep last 50 requests

    return response;
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
export const OPTIONS = handleRequest;
