"use client";

import React, { useState, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Send, Plus, Trash2, Copy, Check, X, ChevronDown, ChevronRight, Play, Save, History, Code, Settings, Key, Lock, User, Globe, Terminal, FileJson, RefreshCw, Download, Upload } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// ── cURL Parser ─────────────────────────────────────────────────────────────
const parseCurl = (curl: string) => {
    const result = {
        method: 'GET',
        url: '',
        headers: [] as { id: string; key: string; value: string }[],
        body: '',
        bodyType: 'none' as 'none' | 'json' | 'form-data' | 'urlencoded' | 'raw'
    };
    if (!curl.trim()) return result;
    const cleanCurl = curl.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();

    const headerRegex = /(?:-H|--header)\s+(['"])(.*?)\1/g;
    let hMatch;
    while ((hMatch = headerRegex.exec(cleanCurl)) !== null) {
        const headerStr = hMatch[2];
        const [key, ...val] = headerStr.split(':');
        if (key) {
            result.headers.push({ id: uuidv4(), key: key.trim(), value: val.join(':').trim() });
        }
    }

    const bodyMarkers = ['--data-raw', '--data-binary', '--data', '-d'];
    for (const marker of bodyMarkers) {
        const markerIdx = cleanCurl.indexOf(marker);
        if (markerIdx !== -1) {
            const afterMarker = cleanCurl.substring(markerIdx + marker.length).trim();
            const quoteChar = afterMarker[0];
            if (quoteChar === "'" || quoteChar === '"') {
                let endIdx = -1;
                for (let i = 1; i < afterMarker.length; i++) {
                    if (afterMarker[i] === quoteChar && afterMarker[i - 1] !== '\\') {
                        endIdx = i;
                        break;
                    }
                }
                if (endIdx !== -1) {
                    result.body = afterMarker.substring(1, endIdx);
                    result.bodyType = 'json';
                    if (result.method === 'GET') result.method = 'POST';
                    break;
                }
            }
        }
    }

    const methodMatch = cleanCurl.match(/(?:-X|--request)\s+([A-Z]+)/i);
    if (methodMatch) result.method = methodMatch[1].toUpperCase();

    const urlMatch = cleanCurl.match(/(?:https?:\/\/[^\s'"]+)/);
    if (urlMatch) result.url = urlMatch[0];

    return result;
};

// ── Types ───────────────────────────────────────────────────────────────────
interface Environment {
    id: string;
    name: string;
    variables: Record<string, string>;
}

interface SavedRequest {
    id: string;
    name: string;
    method: string;
    url: string;
    headers: { key: string; value: string }[];
    queryParams: { key: string; value: string }[];
    bodyType: 'none' | 'json' | 'form-data' | 'urlencoded' | 'raw';
    body: string;
    authType?: string;
    authConfig?: any;
    preRequestScript?: string;
    testScript?: string;
    createdAt: string;
}

interface RequestTab {
    id: string;
    name: string;
    method: string;
    url: string;
    headers: { id: string; key: string; value: string }[];
    queryParams: { id: string; key: string; value: string }[];
    bodyType: 'none' | 'json' | 'form-data' | 'urlencoded' | 'raw';
    body: string;
    authType: 'none' | 'bearer' | 'apikey' | 'basic';
    authConfig: any;
    isActive: boolean;
    preRequestScript?: string;
    testScript?: string;
}

// ── Component ───────────────────────────────────────────────────────────────
export default function ApiClientPage() {
    const tool = getToolBySlug("api-client")!;

    // Environments
    const [environments, setEnvironments] = useState<Environment[]>([
        { id: 'dev-env', name: 'Development', variables: { base_url: 'http://localhost:3000', token: '' } },
        { id: 'staging-env', name: 'Staging', variables: { base_url: 'https://staging.api.example.com', token: '' } },
        { id: 'prod-env', name: 'Production', variables: { base_url: 'https://api.example.com', token: '' } }
    ]);
    const [activeEnvironmentId, setActiveEnvironmentId] = useState<string>('dev-env');
    const [showEnvModal, setShowEnvModal] = useState(false);
    const [editingEnvId, setEditingEnvId] = useState<string | null>(null);

    // Import
    const [showImportModal, setShowImportModal] = useState(false);
    const [importCurlInput, setImportCurlInput] = useState("");

    // Tabs
    const [requestTabs, setRequestTabs] = useState<RequestTab[]>([{
        id: uuidv4(),
        name: 'New Request',
        method: 'GET',
        url: '',
        headers: [{ id: uuidv4(), key: 'Content-Type', value: 'application/json' }],
        queryParams: [],
        bodyType: 'none',
        body: '',
        authType: 'none',
        authConfig: {},
        isActive: true
    }]);
    const [activeTabId, setActiveTabId] = useState<string>(requestTabs[0].id);

    // Response
    const [clientResponse, setClientResponse] = useState<{ status: number; statusText: string; headers: Record<string, string>; body: string; time: number } | null>(null);
    const [isClientLoading, setIsClientLoading] = useState(false);
    const [clientError, setClientError] = useState<string | null>(null);
    const [responseView, setResponseView] = useState<'pretty' | 'raw' | 'tree'>('pretty');

    // Sub-tabs
    const [clientSubTab, setClientSubTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'scripts'>('params');

    // Code generation & Debug
    const [generatedCode, setGeneratedCode] = useState<{ language: string; code: string } | null>(null);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [debugInfo, setDebugInfo] = useState<{ rawRequest: string; rawHeaders: string } | null>(null);
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    // History & Saved
    const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
    const [requestHistory, setRequestHistory] = useState<SavedRequest[]>([]);
    const [showSidebar, setShowSidebar] = useState(false);
    const [sidebarTab, setSidebarTab] = useState<'history' | 'saved'>('history');

    const [copyFeedback, setCopyFeedback] = useState(false);

    // ── Persistence ──────────────────────────────────────────────────────────
    useEffect(() => {
        try {
            const saved = localStorage.getItem('api-client-workspace');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (parsed.environments) setEnvironments(parsed.environments);
                if (parsed.savedRequests) setSavedRequests(parsed.savedRequests);
                if (parsed.requestHistory) setRequestHistory(parsed.requestHistory);
            }
        } catch (e) {
            console.error("Failed to load api-client workspace:", e);
        }
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            localStorage.setItem('api-client-workspace', JSON.stringify({
                environments,
                savedRequests,
                requestHistory
            }));
        }, 500);
        return () => clearTimeout(timeout);
    }, [environments, savedRequests, requestHistory]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getActiveTab = (): RequestTab => requestTabs.find(t => t.id === activeTabId) || requestTabs[0];

    const interpolateVariables = (str: string): string => {
        if (!str) return str;
        const env = environments.find(e => e.id === activeEnvironmentId);
        if (!env) return str;
        let result = str;
        Object.entries(env.variables).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        return result;
    };

    const buildUrlWithParams = (url: string, params: { key: string; value: string }[]): string => {
        const filteredParams = params.filter(p => p.key.trim());
        if (filteredParams.length === 0) return url;
        const queryString = filteredParams
            .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
            .join('&');
        return url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    };

    // ── Tab Management ───────────────────────────────────────────────────────
    const addNewTab = () => {
        const newTab: RequestTab = {
            id: uuidv4(), name: 'New Request', method: 'GET', url: '',
            headers: [{ id: uuidv4(), key: 'Content-Type', value: 'application/json' }],
            queryParams: [], bodyType: 'none', body: '', authType: 'none', authConfig: {}, isActive: true
        };
        setRequestTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
        setActiveTabId(newTab.id);
    };

    const closeTab = (tabId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (requestTabs.length === 1) return;
        const newTabs = requestTabs.filter(t => t.id !== tabId);
        setRequestTabs(newTabs);
        if (activeTabId === tabId) {
            const newActive = newTabs[newTabs.length - 1];
            setActiveTabId(newActive.id);
            newActive.isActive = true;
        }
    };

    const switchTab = (tabId: string) => {
        setRequestTabs(prev => prev.map(t => ({ ...t, isActive: t.id === tabId })));
        setActiveTabId(tabId);
    };

    const updateActiveTab = (updates: Partial<RequestTab>) => {
        setRequestTabs(prev => prev.map(t => t.isActive ? { ...t, ...updates } : t));
    };

    const handleImportCurl = (curl: string) => {
        const parsed = parseCurl(curl);
        const newTab: RequestTab = {
            id: uuidv4(), name: `Imported ${parsed.method}`, method: parsed.method || 'GET',
            url: parsed.url || '', headers: parsed.headers || [], queryParams: [],
            bodyType: parsed.bodyType || 'none', body: parsed.body || '',
            authType: 'none', authConfig: {}, isActive: true
        };
        setRequestTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
        setActiveTabId(newTab.id);
        setShowImportModal(false);
        setImportCurlInput("");
    };

    const saveCurrentRequest = () => {
        const tab = getActiveTab();
        const req: SavedRequest = {
            id: uuidv4(), name: tab.name, method: tab.method, url: tab.url,
            headers: tab.headers.filter(h => h.key).map(h => ({ key: h.key, value: h.value })),
            queryParams: tab.queryParams.filter(p => p.key).map(p => ({ key: p.key, value: p.value })),
            bodyType: tab.bodyType, body: tab.body, authType: tab.authType, authConfig: tab.authConfig,
            preRequestScript: tab.preRequestScript, testScript: tab.testScript,
            createdAt: new Date().toISOString()
        };
        setSavedRequests(prev => [...prev, req]);
    };

    // ── Code Generation ──────────────────────────────────────────────────────
    const generateCodeSnippet = (language: string, tab: RequestTab): string => {
        const url = buildUrlWithParams(interpolateVariables(tab.url), tab.queryParams);
        const headers = tab.headers.filter(h => h.key).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {} as Record<string, string>);
        const body = tab.bodyType !== 'none' ? tab.body : null;

        switch (language) {
            case 'curl':
                let curlCmd = `curl -X ${tab.method} '${url}'`;
                Object.entries(headers).forEach(([k, v]) => { curlCmd += ` \\\n  -H '${k}: ${v}'`; });
                if (body) curlCmd += ` \\\n  --data '${body}'`;
                return curlCmd;
            case 'fetch':
                return `fetch('${url}', {\n  method: '${tab.method}',\n  headers: ${JSON.stringify(headers, null, 2)},\n  ${body ? `body: JSON.stringify(${body}),` : '// body: undefined,'}\n})\n.then(res => res.json())\n.then(data => console.log(data))\n.catch(err => console.error(err));`;
            case 'axios':
                return `import axios from 'axios';\n\nconst response = await axios({\n  method: '${tab.method}',\n  url: '${url}',\n  headers: ${JSON.stringify(headers, null, 2)},\n  ${body ? `data: ${body},` : '// data: undefined,'}\n});\nconsole.log(response.data);`;
            case 'python':
                return `import requests\n\nurl = "${url}"\nheaders = ${JSON.stringify(headers, null, 2)}\n${body ? `payload = ${body}` : '# payload = None'}\n\nresponse = requests.${body ? 'post' : 'get'}(url, headers=headers${body ? ', json=payload' : ''})\nprint(response.status_code)\nprint(response.json())`;
            default: return '// Unsupported';
        }
    };

    // ── Send Request ─────────────────────────────────────────────────────────
    const handleSendRequest = async () => {
        const tab = getActiveTab();
        if (!tab.url) return;

        setIsClientLoading(true);
        setClientError(null);
        setClientResponse(null);
        setDebugInfo(null);
        const startTime = Date.now();

        try {
            // Pre-request script
            if (tab.preRequestScript) {
                try { eval(tab.preRequestScript); } catch (e) { console.warn('Pre-request script error:', e); }
            }

            const finalUrl = buildUrlWithParams(interpolateVariables(tab.url), tab.queryParams);
            let finalHeaders = tab.headers.map(h => ({
                ...h, key: interpolateVariables(h.key), value: interpolateVariables(h.value)
            }));

            // Auth
            if (tab.authType === 'bearer' && tab.authConfig?.token) {
                const idx = finalHeaders.findIndex(h => h.key.toLowerCase() === 'authorization');
                if (idx >= 0) finalHeaders[idx].value = `Bearer ${tab.authConfig.token}`;
                else finalHeaders.push({ id: uuidv4(), key: 'Authorization', value: `Bearer ${tab.authConfig.token}` });
            } else if (tab.authType === 'basic' && tab.authConfig?.username && tab.authConfig?.password) {
                const basicToken = btoa(`${tab.authConfig.username}:${tab.authConfig.password}`);
                const idx = finalHeaders.findIndex(h => h.key.toLowerCase() === 'authorization');
                if (idx >= 0) finalHeaders[idx].value = `Basic ${basicToken}`;
                else finalHeaders.push({ id: uuidv4(), key: 'Authorization', value: `Basic ${basicToken}` });
            } else if (tab.authType === 'apikey' && tab.authConfig?.in === 'header') {
                const idx = finalHeaders.findIndex(h => h.key.toLowerCase() === tab.authConfig.key?.toLowerCase());
                if (idx >= 0) finalHeaders[idx].value = tab.authConfig.value;
                else finalHeaders.push({ id: uuidv4(), key: tab.authConfig.key || 'X-API-Key', value: tab.authConfig.value });
            }

            // Body
            let bodyToSend: any = null;
            if (tab.bodyType !== 'none' && tab.body) {
                const interpolatedBody = interpolateVariables(tab.body);
                if (tab.bodyType === 'json') {
                    bodyToSend = interpolatedBody;
                    if (!finalHeaders.some(h => h.key.toLowerCase() === 'content-type')) {
                        finalHeaders.push({ id: uuidv4(), key: 'Content-Type', value: 'application/json' });
                    }
                } else if (tab.bodyType === 'urlencoded') {
                    bodyToSend = interpolatedBody;
                    if (!finalHeaders.some(h => h.key.toLowerCase() === 'content-type')) {
                        finalHeaders.push({ id: uuidv4(), key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
                    }
                } else {
                    bodyToSend = interpolatedBody;
                }
            }

            const headersObj = finalHeaders.filter(h => h.key).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {} as Record<string, string>);
            setDebugInfo({ rawRequest: `${tab.method} ${finalUrl}`, rawHeaders: JSON.stringify(headersObj, null, 2) });

            let responseData: { status: number; statusText: string; headers: Record<string, string>; body: string; time: number };
            const resolvedUrl = new URL(finalUrl, window.location.origin);
            const isSameOrigin = resolvedUrl.origin === window.location.origin;

            if (isSameOrigin) {
                // Same-origin requests can be sent directly so service-worker-backed mock routes are reachable.
                const directResponse = await fetch(resolvedUrl.toString(), {
                    method: tab.method,
                    headers: headersObj,
                    body: ['GET', 'HEAD'].includes(tab.method) ? undefined : bodyToSend,
                });

                const directHeaders: Record<string, string> = {};
                directResponse.headers.forEach((v, k) => {
                    directHeaders[k] = v;
                });

                responseData = {
                    status: directResponse.status,
                    statusText: directResponse.statusText,
                    headers: directHeaders,
                    body: await directResponse.text(),
                    time: Date.now() - startTime,
                };
            } else {
                const proxyResponse = await fetch('/api/proxy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: finalUrl,
                        method: tab.method,
                        headers: headersObj,
                        body: ['GET', 'HEAD'].includes(tab.method) ? null : bodyToSend
                    })
                });

                const proxyData = await proxyResponse.json();
                if (proxyData.error) throw new Error(proxyData.error);

                responseData = {
                    status: proxyData.status,
                    statusText: proxyData.statusText,
                    headers: proxyData.headers,
                    body: proxyData.body,
                    time: proxyData.time || (Date.now() - startTime),
                };
            }

            const resBody = responseData.body;
            setClientResponse(responseData);

            // Test scripts
            if (tab.testScript && resBody) {
                try {
                    const pm = {
                        response: {
                            to: { have: { status: (expected: number) => { if (responseData.status !== expected) throw new Error(`Expected status ${expected}, got ${responseData.status}`); } } },
                            json: () => { try { return JSON.parse(resBody); } catch { throw new Error('Response is not valid JSON'); } }
                        },
                        test: (name: string, fn: () => void) => {
                            try { fn(); console.log(`✓ ${name}`); } catch (err: any) { console.error(`✗ ${name}:`, err.message); }
                        }
                    };
                    eval(tab.testScript);
                } catch (e: any) { console.warn('Test script error:', e.message); }
            }

            // History
            const historyEntry: SavedRequest = {
                id: uuidv4(), name: tab.name, method: tab.method, url: tab.url,
                headers: tab.headers.filter(h => h.key).map(h => ({ key: h.key, value: h.value })),
                queryParams: tab.queryParams.filter(p => p.key).map(p => ({ key: p.key, value: p.value })),
                bodyType: tab.bodyType, body: tab.body, createdAt: new Date().toISOString()
            };
            setRequestHistory(prev => [historyEntry, ...prev.slice(0, 49)]);
        } catch (err: any) {
            setClientError(err.message || 'Network error occurred');
        } finally {
            setIsClientLoading(false);
        }
    };

    // ── Render Helpers ───────────────────────────────────────────────────────
    const activeTab = getActiveTab();
    const methodColors: Record<string, string> = {
        GET: 'text-green-400', POST: 'text-blue-400', PUT: 'text-yellow-400',
        PATCH: 'text-purple-400', DELETE: 'text-red-400', OPTIONS: 'text-gray-400', HEAD: 'text-gray-400'
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-400 bg-green-500/10';
        if (status >= 300 && status < 400) return 'text-yellow-400 bg-yellow-500/10';
        if (status >= 400 && status < 500) return 'text-orange-400 bg-orange-500/10';
        return 'text-red-400 bg-red-500/10';
    };

    const formatJson = (str: string): string => {
        try { return JSON.stringify(JSON.parse(str), null, 2); } catch { return str; }
    };

    const renderJsonTree = (data: any, depth = 0): React.ReactNode => {
        if (data === null) return <span className="text-orange-400">null</span>;
        if (typeof data === 'boolean') return <span className="text-purple-400">{String(data)}</span>;
        if (typeof data === 'number') return <span className="text-blue-400">{data}</span>;
        if (typeof data === 'string') return <span className="text-green-400">&ldquo;{data}&rdquo;</span>;
        if (Array.isArray(data)) {
            if (data.length === 0) return <span className="text-text-muted">[]</span>;
            return (
                <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
                    <span className="text-text-muted">[</span>
                    {data.map((item, i) => (
                        <div key={i} style={{ marginLeft: 16 }}>
                            {renderJsonTree(item, depth + 1)}
                            {i < data.length - 1 && <span className="text-text-muted">,</span>}
                        </div>
                    ))}
                    <span className="text-text-muted">]</span>
                </div>
            );
        }
        if (typeof data === 'object') {
            const keys = Object.keys(data);
            if (keys.length === 0) return <span className="text-text-muted">{'{}'}</span>;
            return (
                <div style={{ marginLeft: depth > 0 ? 16 : 0 }}>
                    <span className="text-text-muted">{'{'}</span>
                    {keys.map((key, i) => (
                        <div key={key} style={{ marginLeft: 16 }}>
                            <span className="text-accent">&ldquo;{key}&rdquo;</span>
                            <span className="text-text-muted">: </span>
                            {renderJsonTree(data[key], depth + 1)}
                            {i < keys.length - 1 && <span className="text-text-muted">,</span>}
                        </div>
                    ))}
                    <span className="text-text-muted">{'}'}</span>
                </div>
            );
        }
        return <span>{String(data)}</span>;
    };

    // ── Main Render ──────────────────────────────────────────────────────────
    return (
        <ToolLayout tool={tool}>
            <div className="space-y-4">
                {/* ── Toolbar ──────────────────────────────────────── */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowImportModal(true)} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
                            <Upload className="w-3.5 h-3.5" /> Import cURL
                        </button>
                        <button onClick={() => setShowEnvModal(true)} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
                            <Globe className="w-3.5 h-3.5" /> Environments
                        </button>
                        <button onClick={() => { setShowSidebar(!showSidebar); }} className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5">
                            <History className="w-3.5 h-3.5" /> History
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            className="text-xs bg-background-input border border-border rounded px-2 py-1 text-text-primary"
                            value={activeEnvironmentId}
                            onChange={(e) => setActiveEnvironmentId(e.target.value)}
                        >
                            {environments.map(env => (
                                <option key={env.id} value={env.id}>{env.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── Request Tabs ────────────────────────────────── */}
                <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-0">
                    {requestTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => switchTab(tab.id)}
                            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                                tab.id === activeTabId
                                    ? 'border-accent text-accent bg-accent/5'
                                    : 'border-transparent text-text-muted hover:text-text-primary hover:bg-background-input'
                            }`}
                        >
                            <span className={`font-bold text-[10px] ${methodColors[tab.method] || 'text-gray-400'}`}>{tab.method}</span>
                            <span className="max-w-[120px] truncate">{tab.name || tab.url || 'Untitled'}</span>
                            {requestTabs.length > 1 && (
                                <X className="w-3 h-3 hover:text-red-400" onClick={(e) => closeTab(tab.id, e)} />
                            )}
                        </button>
                    ))}
                    <button onClick={addNewTab} className="p-2 text-text-muted hover:text-accent transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* ── URL Bar ─────────────────────────────────────── */}
                <div className="flex gap-2">
                    <select
                        className={`bg-background-input border border-border rounded-lg px-3 py-2.5 text-sm font-bold ${methodColors[activeTab.method] || 'text-gray-400'}`}
                        value={activeTab.method}
                        onChange={(e) => updateActiveTab({ method: e.target.value })}
                    >
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Enter URL or paste cURL..."
                        className="flex-1 bg-background-input border border-border rounded-lg px-4 py-2.5 text-sm font-mono text-text-primary focus:outline-none focus:border-accent"
                        value={activeTab.url}
                        onChange={(e) => updateActiveTab({ url: e.target.value, name: e.target.value.split('/').pop() || 'Request' })}
                    />
                    <button
                        onClick={handleSendRequest}
                        disabled={isClientLoading || !activeTab.url}
                        className="btn-primary flex items-center gap-2 px-6 py-2.5 text-sm font-bold disabled:opacity-50"
                    >
                        {isClientLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Send
                    </button>
                </div>

                {/* ── Request Config Sub-tabs ──────────────────────── */}
                <div className="bg-background-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center border-b border-border overflow-x-auto">
                        {(['params', 'headers', 'body', 'auth', 'scripts'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setClientSubTab(tab)}
                                className={`px-4 py-2.5 text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                                    clientSubTab === tab ? 'text-accent border-b-2 border-accent bg-accent/5' : 'text-text-muted hover:text-text-primary'
                                }`}
                            >
                                {tab}
                                {tab === 'headers' && activeTab.headers.filter(h => h.key).length > 0 && (
                                    <span className="ml-1 text-[10px] bg-accent/20 text-accent px-1.5 rounded-full">{activeTab.headers.filter(h => h.key).length}</span>
                                )}
                                {tab === 'params' && activeTab.queryParams.filter(p => p.key).length > 0 && (
                                    <span className="ml-1 text-[10px] bg-accent/20 text-accent px-1.5 rounded-full">{activeTab.queryParams.filter(p => p.key).length}</span>
                                )}
                            </button>
                        ))}
                        <div className="flex-1" />
                        <div className="flex items-center gap-1 pr-2">
                            <button onClick={saveCurrentRequest} className="p-1.5 text-text-muted hover:text-accent transition-colors" title="Save Request">
                                <Save className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => { const code = generateCodeSnippet('curl', activeTab); setGeneratedCode({ language: 'curl', code }); setShowCodeModal(true); }} className="p-1.5 text-text-muted hover:text-accent transition-colors" title="Generate Code">
                                <Code className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setShowDebugPanel(!showDebugPanel)} className="p-1.5 text-text-muted hover:text-accent transition-colors" title="Debug Panel">
                                <Terminal className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 max-h-[300px] overflow-y-auto">
                        {/* ── Params ──────────────────────────────── */}
                        {clientSubTab === 'params' && (
                            <div className="space-y-2">
                                {activeTab.queryParams.map((param, idx) => (
                                    <div key={param.id} className="flex gap-2 items-center">
                                        <input className="flex-1 bg-background-input border border-border rounded px-3 py-1.5 text-xs font-mono" placeholder="Key" value={param.key} onChange={(e) => {
                                            const params = [...activeTab.queryParams]; params[idx] = { ...params[idx], key: e.target.value }; updateActiveTab({ queryParams: params });
                                        }} />
                                        <input className="flex-1 bg-background-input border border-border rounded px-3 py-1.5 text-xs font-mono" placeholder="Value" value={param.value} onChange={(e) => {
                                            const params = [...activeTab.queryParams]; params[idx] = { ...params[idx], value: e.target.value }; updateActiveTab({ queryParams: params });
                                        }} />
                                        <button onClick={() => updateActiveTab({ queryParams: activeTab.queryParams.filter((_, i) => i !== idx) })} className="text-text-muted hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                                <button onClick={() => updateActiveTab({ queryParams: [...activeTab.queryParams, { id: uuidv4(), key: '', value: '' }] })} className="text-xs text-accent hover:text-accent/80 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add Parameter
                                </button>
                            </div>
                        )}

                        {/* ── Headers ─────────────────────────────── */}
                        {clientSubTab === 'headers' && (
                            <div className="space-y-2">
                                {activeTab.headers.map((header, idx) => (
                                    <div key={header.id} className="flex gap-2 items-center">
                                        <input className="flex-1 bg-background-input border border-border rounded px-3 py-1.5 text-xs font-mono" placeholder="Header Name" value={header.key} onChange={(e) => {
                                            const headers = [...activeTab.headers]; headers[idx] = { ...headers[idx], key: e.target.value }; updateActiveTab({ headers });
                                        }} />
                                        <input className="flex-1 bg-background-input border border-border rounded px-3 py-1.5 text-xs font-mono" placeholder="Value" value={header.value} onChange={(e) => {
                                            const headers = [...activeTab.headers]; headers[idx] = { ...headers[idx], value: e.target.value }; updateActiveTab({ headers });
                                        }} />
                                        <button onClick={() => updateActiveTab({ headers: activeTab.headers.filter((_, i) => i !== idx) })} className="text-text-muted hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                                <button onClick={() => updateActiveTab({ headers: [...activeTab.headers, { id: uuidv4(), key: '', value: '' }] })} className="text-xs text-accent hover:text-accent/80 flex items-center gap-1">
                                    <Plus className="w-3 h-3" /> Add Header
                                </button>
                            </div>
                        )}

                        {/* ── Body ────────────────────────────────── */}
                        {clientSubTab === 'body' && (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    {(['none', 'json', 'form-data', 'urlencoded', 'raw'] as const).map(bt => (
                                        <button key={bt} onClick={() => updateActiveTab({ bodyType: bt })} className={`text-xs px-3 py-1 rounded-full border transition-colors ${activeTab.bodyType === bt ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-muted hover:border-accent/40'}`}>
                                            {bt === 'none' ? 'None' : bt === 'json' ? 'JSON' : bt === 'form-data' ? 'Form Data' : bt === 'urlencoded' ? 'URL Encoded' : 'Raw'}
                                        </button>
                                    ))}
                                </div>
                                {activeTab.bodyType !== 'none' && (
                                    <textarea
                                        className="w-full h-40 bg-background-input border border-border rounded-lg p-3 text-xs font-mono text-text-primary resize-y focus:outline-none focus:border-accent"
                                        placeholder={activeTab.bodyType === 'json' ? '{\n  "key": "value"\n}' : 'key=value'}
                                        value={activeTab.body}
                                        onChange={(e) => updateActiveTab({ body: e.target.value })}
                                    />
                                )}
                            </div>
                        )}

                        {/* ── Auth ────────────────────────────────── */}
                        {clientSubTab === 'auth' && (
                            <div className="space-y-3">
                                <select className="bg-background-input border border-border rounded px-3 py-1.5 text-xs" value={activeTab.authType} onChange={(e) => updateActiveTab({ authType: e.target.value as any, authConfig: {} })}>
                                    <option value="none">No Auth</option>
                                    <option value="bearer">Bearer Token</option>
                                    <option value="basic">Basic Auth</option>
                                    <option value="apikey">API Key</option>
                                </select>
                                {activeTab.authType === 'bearer' && (
                                    <div className="flex items-center gap-2">
                                        <Key className="w-4 h-4 text-accent" />
                                        <input className="flex-1 bg-background-input border border-border rounded px-3 py-1.5 text-xs font-mono" placeholder="Token" value={activeTab.authConfig?.token || ''} onChange={(e) => updateActiveTab({ authConfig: { ...activeTab.authConfig, token: e.target.value } })} />
                                    </div>
                                )}
                                {activeTab.authType === 'basic' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2"><User className="w-4 h-4 text-accent" /><input className="flex-1 bg-background-input border border-border rounded px-3 py-1.5 text-xs" placeholder="Username" value={activeTab.authConfig?.username || ''} onChange={(e) => updateActiveTab({ authConfig: { ...activeTab.authConfig, username: e.target.value } })} /></div>
                                        <div className="flex items-center gap-2"><Lock className="w-4 h-4 text-accent" /><input type="password" className="flex-1 bg-background-input border border-border rounded px-3 py-1.5 text-xs" placeholder="Password" value={activeTab.authConfig?.password || ''} onChange={(e) => updateActiveTab({ authConfig: { ...activeTab.authConfig, password: e.target.value } })} /></div>
                                    </div>
                                )}
                                {activeTab.authType === 'apikey' && (
                                    <div className="space-y-2">
                                        <select className="bg-background-input border border-border rounded px-3 py-1.5 text-xs" value={activeTab.authConfig?.in || 'header'} onChange={(e) => updateActiveTab({ authConfig: { ...activeTab.authConfig, in: e.target.value } })}>
                                            <option value="header">Header</option>
                                            <option value="query">Query Param</option>
                                        </select>
                                        <input className="bg-background-input border border-border rounded px-3 py-1.5 text-xs w-full" placeholder="Key Name" value={activeTab.authConfig?.key || ''} onChange={(e) => updateActiveTab({ authConfig: { ...activeTab.authConfig, key: e.target.value } })} />
                                        <input className="bg-background-input border border-border rounded px-3 py-1.5 text-xs w-full" placeholder="Value" value={activeTab.authConfig?.value || ''} onChange={(e) => updateActiveTab({ authConfig: { ...activeTab.authConfig, value: e.target.value } })} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Scripts ─────────────────────────────── */}
                        {clientSubTab === 'scripts' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-text-muted mb-1 block">Pre-request Script</label>
                                    <textarea className="w-full h-24 bg-background-input border border-border rounded-lg p-3 text-xs font-mono text-text-primary resize-y focus:outline-none focus:border-accent" placeholder="// Runs before the request is sent..." value={activeTab.preRequestScript || ''} onChange={(e) => updateActiveTab({ preRequestScript: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-text-muted mb-1 block">Test Script</label>
                                    <textarea className="w-full h-24 bg-background-input border border-border rounded-lg p-3 text-xs font-mono text-text-primary resize-y focus:outline-none focus:border-accent" placeholder={'pm.test("Status is 200", () => {\n  pm.response.to.have.status(200);\n});'} value={activeTab.testScript || ''} onChange={(e) => updateActiveTab({ testScript: e.target.value })} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Debug Panel ──────────────────────────────────── */}
                {showDebugPanel && debugInfo && (
                    <div className="bg-background-card border border-border rounded-xl p-4 space-y-2">
                        <h4 className="text-xs font-bold text-accent flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5" /> Debug Info</h4>
                        <div className="text-xs font-mono text-text-muted"><span className="text-text-primary font-bold">Request:</span> {debugInfo.rawRequest}</div>
                        <pre className="text-xs font-mono text-text-muted bg-background-input rounded p-2 overflow-x-auto max-h-[100px]">{debugInfo.rawHeaders}</pre>
                    </div>
                )}

                {/* ── Response ─────────────────────────────────────── */}
                {(clientResponse || clientError || isClientLoading) && (
                    <div className="bg-background-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between border-b border-border px-4 py-2">
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-bold text-text-muted">Response</span>
                                {clientResponse && (
                                    <>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${getStatusColor(clientResponse.status)}`}>
                                            {clientResponse.status} {clientResponse.statusText}
                                        </span>
                                        <span className="text-[10px] text-text-muted">{clientResponse.time}ms</span>
                                    </>
                                )}
                            </div>
                            {clientResponse && (
                                <div className="flex items-center gap-1">
                                    {(['pretty', 'raw', 'tree'] as const).map(v => (
                                        <button key={v} onClick={() => setResponseView(v)} className={`text-[10px] px-2 py-1 rounded transition-colors capitalize ${responseView === v ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text-primary'}`}>{v}</button>
                                    ))}
                                    <button onClick={() => { navigator.clipboard.writeText(clientResponse.body || ''); setCopyFeedback(true); setTimeout(() => setCopyFeedback(false), 2000); }} className="p-1 text-text-muted hover:text-accent ml-2">
                                        {copyFeedback ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="p-4 max-h-[400px] overflow-auto">
                            {isClientLoading && (
                                <div className="flex items-center justify-center py-8">
                                    <RefreshCw className="w-6 h-6 animate-spin text-accent" />
                                    <span className="ml-2 text-sm text-text-muted">Sending request...</span>
                                </div>
                            )}
                            {clientError && (
                                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                                    <span className="font-bold">Error:</span> {clientError}
                                </div>
                            )}
                            {clientResponse && !isClientLoading && (
                                <>
                                    {responseView === 'pretty' && (
                                        <pre className="text-xs font-mono text-text-primary whitespace-pre-wrap break-words">{formatJson(clientResponse.body)}</pre>
                                    )}
                                    {responseView === 'raw' && (
                                        <pre className="text-xs font-mono text-text-muted whitespace-pre-wrap break-all">{clientResponse.body}</pre>
                                    )}
                                    {responseView === 'tree' && (
                                        <div className="text-xs font-mono">
                                            {(() => { try { return renderJsonTree(JSON.parse(clientResponse.body)); } catch { return <span className="text-text-muted">Not valid JSON</span>; } })()}
                                        </div>
                                    )}
                                    {clientResponse.headers && Object.keys(clientResponse.headers).length > 0 && (
                                        <details className="mt-4 border-t border-border pt-3">
                                            <summary className="text-xs font-semibold text-text-muted cursor-pointer hover:text-text-primary">Response Headers ({Object.keys(clientResponse.headers).length})</summary>
                                            <div className="mt-2 space-y-1">
                                                {Object.entries(clientResponse.headers).map(([k, v]) => (
                                                    <div key={k} className="flex gap-2 text-[10px] font-mono">
                                                        <span className="text-accent font-bold min-w-[140px]">{k}:</span>
                                                        <span className="text-text-muted break-all">{v}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </details>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Sidebar (History / Saved) ────────────────────── */}
                {showSidebar && (
                    <div className="bg-background-card border border-border rounded-xl overflow-hidden">
                        <div className="flex items-center border-b border-border">
                            <button onClick={() => setSidebarTab('history')} className={`flex-1 text-xs font-medium py-2.5 transition-colors ${sidebarTab === 'history' ? 'text-accent border-b-2 border-accent' : 'text-text-muted'}`}>
                                <History className="w-3.5 h-3.5 inline mr-1" /> History ({requestHistory.length})
                            </button>
                            <button onClick={() => setSidebarTab('saved')} className={`flex-1 text-xs font-medium py-2.5 transition-colors ${sidebarTab === 'saved' ? 'text-accent border-b-2 border-accent' : 'text-text-muted'}`}>
                                <Save className="w-3.5 h-3.5 inline mr-1" /> Saved ({savedRequests.length})
                            </button>
                        </div>
                        <div className="max-h-[250px] overflow-y-auto p-2">
                            {sidebarTab === 'history' && requestHistory.length === 0 && <p className="text-xs text-text-muted text-center py-4">No history yet</p>}
                            {sidebarTab === 'saved' && savedRequests.length === 0 && <p className="text-xs text-text-muted text-center py-4">No saved requests</p>}
                            {(sidebarTab === 'history' ? requestHistory : savedRequests).map(req => (
                                <button
                                    key={req.id}
                                    onClick={() => {
                                        const newTab: RequestTab = {
                                            id: uuidv4(), name: req.name, method: req.method, url: req.url,
                                            headers: req.headers.map(h => ({ id: uuidv4(), ...h })),
                                            queryParams: req.queryParams.map(p => ({ id: uuidv4(), ...p })),
                                            bodyType: req.bodyType, body: req.body,
                                            authType: (req.authType as any) || 'none', authConfig: req.authConfig || {},
                                            isActive: true, preRequestScript: req.preRequestScript, testScript: req.testScript
                                        };
                                        setRequestTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
                                        setActiveTabId(newTab.id);
                                    }}
                                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-background-input transition-colors text-left"
                                >
                                    <span className={`text-[10px] font-bold ${methodColors[req.method] || 'text-gray-400'}`}>{req.method}</span>
                                    <span className="text-xs text-text-primary truncate flex-1 font-mono">{req.url || req.name}</span>
                                    <span className="text-[9px] text-text-muted">{new Date(req.createdAt).toLocaleTimeString()}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Import cURL Modal ───────────────────────────────── */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowImportModal(false)}>
                    <div className="bg-background-card border border-border rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Import cURL</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                        </div>
                        <textarea className="w-full h-40 bg-background-input border border-border rounded-lg p-3 text-xs font-mono text-text-primary resize-y focus:outline-none focus:border-accent" placeholder="Paste your cURL command here..." value={importCurlInput} onChange={e => setImportCurlInput(e.target.value)} />
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowImportModal(false)} className="btn-secondary text-xs px-4 py-2">Cancel</button>
                            <button onClick={() => handleImportCurl(importCurlInput)} disabled={!importCurlInput.trim()} className="btn-primary text-xs px-4 py-2 disabled:opacity-50">Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Environments Modal ──────────────────────────────── */}
            {showEnvModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowEnvModal(false)}>
                    <div className="bg-background-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Manage Environments</h3>
                            <button onClick={() => setShowEnvModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                        </div>
                        {environments.map(env => (
                            <div key={env.id} className={`border rounded-xl p-4 mb-3 transition-colors ${env.id === activeEnvironmentId ? 'border-accent bg-accent/5' : 'border-border'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <input className="bg-transparent border-b border-border text-sm font-bold text-text-primary focus:outline-none focus:border-accent" value={env.name} onChange={e => setEnvironments(prev => prev.map(en => en.id === env.id ? { ...en, name: e.target.value } : en))} />
                                        {env.id === activeEnvironmentId && <span className="text-[9px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">ACTIVE</span>}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => setActiveEnvironmentId(env.id)} className="text-xs text-accent hover:underline">Activate</button>
                                        {environments.length > 1 && <button onClick={() => setEnvironments(prev => prev.filter(en => en.id !== env.id))} className="text-xs text-red-400 hover:underline ml-2">Delete</button>}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    {Object.entries(env.variables).map(([key, value]) => (
                                        <div key={key} className="flex gap-2 items-center">
                                            <input className="flex-1 bg-background-input border border-border rounded px-2 py-1 text-xs font-mono" value={key} onChange={e => {
                                                const newVars = { ...env.variables };
                                                const oldValue = newVars[key];
                                                delete newVars[key];
                                                newVars[e.target.value] = oldValue;
                                                setEnvironments(prev => prev.map(en => en.id === env.id ? { ...en, variables: newVars } : en));
                                            }} />
                                            <input className="flex-1 bg-background-input border border-border rounded px-2 py-1 text-xs font-mono" value={value} onChange={e => {
                                                setEnvironments(prev => prev.map(en => en.id === env.id ? { ...en, variables: { ...en.variables, [key]: e.target.value } } : en));
                                            }} />
                                            <button onClick={() => {
                                                const newVars = { ...env.variables }; delete newVars[key];
                                                setEnvironments(prev => prev.map(en => en.id === env.id ? { ...en, variables: newVars } : en));
                                            }} className="text-text-muted hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                    <button onClick={() => setEnvironments(prev => prev.map(en => en.id === env.id ? { ...en, variables: { ...en.variables, ['new_var']: '' } } : en))} className="text-[10px] text-accent hover:underline flex items-center gap-1 mt-1">
                                        <Plus className="w-3 h-3" /> Add Variable
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button onClick={() => setEnvironments(prev => [...prev, { id: uuidv4(), name: 'New Environment', variables: {} }])} className="btn-secondary text-xs w-full py-2 mt-2">
                            <Plus className="w-3.5 h-3.5 inline mr-1" /> New Environment
                        </button>
                    </div>
                </div>
            )}

            {/* ── Code Generation Modal ───────────────────────────── */}
            {showCodeModal && generatedCode && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowCodeModal(false)}>
                    <div className="bg-background-card border border-border rounded-2xl p-6 w-full max-w-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Generated Code</h3>
                            <button onClick={() => setShowCodeModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="flex gap-2 mb-3">
                            {['curl', 'fetch', 'axios', 'python'].map(lang => (
                                <button key={lang} onClick={() => setGeneratedCode({ language: lang, code: generateCodeSnippet(lang, activeTab) })} className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${generatedCode.language === lang ? 'bg-accent/10 border-accent text-accent' : 'border-border text-text-muted'}`}>{lang}</button>
                            ))}
                        </div>
                        <pre className="bg-background-input border border-border rounded-lg p-4 text-xs font-mono text-text-primary overflow-x-auto max-h-[300px]">{generatedCode.code}</pre>
                        <div className="flex justify-end mt-4">
                            <button onClick={() => { navigator.clipboard.writeText(generatedCode.code); }} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"><Copy className="w-3.5 h-3.5" /> Copy</button>
                        </div>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
