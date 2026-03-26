import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy Handler
 * Forwards requests from the API Client to any destination to bypass CORS.
 * This is essential for a "Power User" API Client experience.
 */
export async function POST(req: NextRequest) {
    try {
        const { url, method, headers, body } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'Missing target URL' }, { status: 400 });
        }

        // Prepare request init
        const init: RequestInit = {
            method: method || 'GET',
            headers: headers || {},
        };

        // Only add body if not GET/HEAD
        if (!['GET', 'HEAD'].includes(method?.toUpperCase() || 'GET') && body) {
            init.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const startTime = Date.now();
        const response = await fetch(url, init);
        const duration = Date.now() - startTime;

        // Collect response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((v, k) => {
            responseHeaders[k] = v;
        });

        // Try to get body as text (safer for proxying)
        const responseBody = await response.text();

        return NextResponse.json({
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseBody,
            time: duration
        });

    } catch (error: any) {
        console.error('[Proxy Error]:', error);
        return NextResponse.json({ 
            error: error.message || 'Failed to proxy request',
            details: error.toString() 
        }, { status: 502 });
    }
}
