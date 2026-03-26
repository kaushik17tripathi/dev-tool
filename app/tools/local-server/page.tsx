"use client";

import React, { useState, useEffect } from "react";
import ToolLayout from "@/components/layout/ToolLayout";
import { format } from "sql-formatter";
import { getToolBySlug } from "@/lib/toolRegistry";
import { Clipboard, Check, Play, Server, Plus, Trash2, Download, Upload, Folder as FolderIcon, FolderOpen, FolderPlus, Edit2, Share2, Settings, Activity, Filter, Clock, ArrowRight, RotateCcw, Send, Zap, AlertTriangle, Globe, ExternalLink, Copy, Database, Table, RefreshCw, Code, FileJson, Key, Lock, User, Save, History, ChevronDown, ChevronUp, ChevronRight, X, Terminal } from "lucide-react";
import LZString from "lz-string";
import { v4 as uuidv4 } from "uuid";

// ── Inline Fake Data Generator ─────────────────────────────────────────────
const firstNames = ['Alice','Bob','Carlos','Diana','Ethan','Fiona','George','Hannah','Ivan','Julia','Kevin','Laura','Marcus','Nina','Oscar','Priya','Quinn','Rachel','Samuel','Tara'];
const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Martinez','Wilson','Moore','Taylor','Anderson','Thomas','Jackson','White','Harris','Martin','Clark','Lewis'];
const domains = ['gmail.com','yahoo.com','outlook.com','protonmail.com','icloud.com'];
const companies = ['Acme Corp','Initech','Globex','Umbrella Ltd','Dunder Mifflin','Hooli','Pied Piper','Bluth Company','Vandelay Industries','Massive Dynamic'];
const categories = ['Electronics','Clothing','Books','Home & Garden','Sports','Beauty','Automotive','Toys','Food','Office'];
const adjectives = ['Premium','Deluxe','Ultra','Pro','Lite','Smart','Eco','Classic','Turbo','Flex'];
const nouns = ['Widget','Gadget','Gizmo','Doohickey','Thingamajig','Module','Kit','Pack','Bundle','Set'];
const statuses = ['active','inactive','pending','suspended'];
const orderStatuses = ['pending','processing','shipped','delivered','cancelled'];
const paymentMethods = ['credit_card','paypal','stripe','apple_pay','bank_transfer'];
const streets = ['Main St','Oak Ave','Maple Dr','Cedar Blvd','Pine Rd','Elm Way','Park Lane','River Rd','Hill St','Lake Dr'];
const cities = ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','Austin'];

const rand = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randFloat = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const randDate = (yearsBack = 2) => {
    const d = new Date();
    d.setDate(d.getDate() - randInt(0, yearsBack * 365));
    return d.toISOString();
};
const randEmail = (first: string, last: string) => `${first.toLowerCase()}.${last.toLowerCase()}${randInt(1,99)}@${rand(domains)}`;
const randPhone = () => `+1-${randInt(200,999)}-${randInt(100,999)}-${randInt(1000,9999)}`;
const randAvatar = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
const randId = () => randInt(1000, 99999);

const fakeUser = () => { const f = rand(firstNames), l = rand(lastNames); return { id: randId(), name: `${f} ${l}`, email: randEmail(f, l), phone: randPhone(), avatar: randAvatar(`${f} ${l}`), role: rand(['admin','user','moderator','viewer']), status: rand(statuses), company: rand(companies), createdAt: randDate(3), lastLoginAt: randDate(0) }; };
const fakeProduct = () => ({ id: randId(), name: `${rand(adjectives)} ${rand(nouns)}`, sku: `SKU-${randInt(10000,99999)}`, category: rand(categories), price: randFloat(5, 999), originalPrice: randFloat(999, 1999), rating: randFloat(1, 5), reviewCount: randInt(0, 5000), stock: randInt(0, 500), inStock: Math.random() > 0.2, images: [`https://picsum.photos/seed/${randInt(1,1000)}/400/300`], description: `High-quality ${rand(nouns).toLowerCase()} for everyday use.`, createdAt: randDate(2) });
const fakeOrder = () => ({ id: `ORD-${randInt(10000,99999)}`, userId: randId(), status: rand(orderStatuses), total: randFloat(20, 2000), subtotal: randFloat(15, 1800), tax: randFloat(1, 100), shipping: rand(['4.99','9.99','0.00']), paymentMethod: rand(paymentMethods), items: Array.from({length: randInt(1,5)}, () => ({ productId: randId(), name: `${rand(adjectives)} ${rand(nouns)}`, qty: randInt(1,5), price: randFloat(10, 300) })), address: { street: `${randInt(1,9999)} ${rand(streets)}`, city: rand(cities), state: 'CA', zip: `${randInt(10000,99999)}`, country: 'US' }, createdAt: randDate(1) });
const fakeComment = () => { const f = rand(firstNames), l = rand(lastNames); return { id: randId(), author: `${f} ${l}`, email: randEmail(f, l), avatar: randAvatar(`${f} ${l}`), body: `This is a ${rand(['great','helpful','excellent','poor','average','insightful'])} product. ${rand(['Would recommend!', 'Not what I expected.', 'Exceeded my expectations.', 'Good value for money.'])}`, rating: randInt(1,5), likes: randInt(0, 500), createdAt: randDate(1) }; };
const fakeAnalytics = () => ({ period: 'last_30_days', visitors: randInt(1000, 500000), pageViews: randInt(5000, 2000000), bounceRate: randFloat(20, 80), avgSessionDuration: `${randInt(1,10)}m ${randInt(0,59)}s`, conversionRate: randFloat(0.5, 8), revenue: randFloat(5000, 500000), topPages: ['/home','/products','/about','/checkout','/blog'].map(p => ({ path: p, views: randInt(100,50000) })), deviceBreakdown: { desktop: randInt(40,60), mobile: randInt(30,50), tablet: randInt(5,15) } });

// ── cURL Parser Utility ───────────────────────────────────────────────────
const parseCurl = (curl: string) => {
    const result = {
        method: 'GET',
        url: '',
        headers: [] as { id: string; key: string; value: string }[],
        body: '',
        bodyType: 'none' as any
    };

    if (!curl.trim()) return result;

    // Normalize multi-line and extra whitespace
    const cleanCurl = curl.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Extract headers: handles -H 'Key: Val' and -H "Key: Val"
    const headerRegex = /(?:-H|--header)\s+(['"])(.*?)\1/g;
    let hMatch;
    while ((hMatch = headerRegex.exec(cleanCurl)) !== null) {
        const headerStr = hMatch[2];
        const [key, ...val] = headerStr.split(':');
        if (key) {
            result.headers.push({ id: uuidv4(), key: key.trim(), value: val.join(':').trim() });
        }
    }

    // Extract Body: handles -d '...', --data "...", --data-raw '...'
    // We look for the quote that DELIMITS the body to avoid truncation on internal quotes
    const bodyMarkers = ['--data-raw', '--data-binary', '--data', '-d'];
    for (const marker of bodyMarkers) {
        const markerIdx = cleanCurl.indexOf(marker);
        if (markerIdx !== -1) {
            const afterMarker = cleanCurl.substring(markerIdx + marker.length).trim();
            const quoteChar = afterMarker[0];
            if (quoteChar === "'" || quoteChar === '"') {
                // Find matching closing quote, but skip escaped ones
                let endIdx = -1;
                for (let i = 1; i < afterMarker.length; i++) {
                    if (afterMarker[i] === quoteChar && afterMarker[i-1] !== '\\') {
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

    // Extract Method: -X POST, --request PUT
    const methodMatch = cleanCurl.match(/(?:-X|--request)\s+([A-Z]+)/i);
    if (methodMatch) result.method = methodMatch[1].toUpperCase();

    // Extract URL: find http/https string not preceded by a flag
    const urlMatch = cleanCurl.match(/(?:https?:\/\/[^\s'"]+)/);
    if (urlMatch) result.url = urlMatch[0];

    return result;
};

// ────────────────────────────────────────────────────────────────────────────

interface Folder {
    id: string;
    name: string;
    parentId?: string | null;
}

interface Rule {
    id: string;
    target: 'header' | 'body';
    propertyPath: string;
    operator: 'equals' | 'exists' | 'missing';
    value?: string;
}

interface CollectionField {
    id: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
    required: boolean;
    unique?: boolean;
}

interface Collection {
    id: string;
    name: string;
    fields: CollectionField[];
    items: any[];
}

interface CustomQuery {
    id: string;
    name: string;
    collectionId: string;
    code: string;
}

interface Environment {
    id: string;
    name: string;
    variables: Record<string, string>;
}

interface SavedRequest {
    id: string;
    collectionId?: string;
    name: string;
    method: string;
    url: string;
    headers: { key: string; value: string }[];
    queryParams: { key: string; value: string }[];
    bodyType: 'none' | 'json' | 'form-data' | 'urlencoded' | 'raw';
    body: string;
    authType?: 'none' | 'bearer' | 'apikey' | 'basic';
    authConfig?: any;
    preRequestScript?: string;
    testScript?: string;
    createdAt: string;
}

interface RequestTab {
    id: string;
    requestId?: string;
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

interface RequestLog {
    id: string;
    method: string;
    url: string;
    fullUrl?: string;
    headers: Record<string, string>;
    body: string | null;
    responseStatus: number;
    responseHeaders?: Record<string, string>;
    responseBody: any;
    matchedEndpointId?: string;
    matchedRules?: Rule[];
    timeTakenMs: number;
    timestamp: string;
}

const createStandardResponseShell = () => ({
    success: {
        success: true,
        data: {
            example: "your-data-here"
        },
        error: null,
        meta: {
            timestamp: "2026-01-01T00:00:00.000Z",
            source: "collection-crud",
            operation: "LIST"
        }
    },
    failure: {
        success: false,
        data: null,
        error: {
            code: "VALIDATION_FAILED",
            message: "Validation Failed",
            details: [
                "Field \"name\" is required."
            ]
        },
        meta: {
            timestamp: "2026-01-01T00:00:00.000Z",
            source: "collection-crud",
            operation: "CREATE"
        }
    }
});

export default function MockApiGeneratorPage() {
    const tool = getToolBySlug("local-server")!;
    
    const [folders, setFolders] = useState<Folder[]>([
        { id: 'default-api-folder', name: 'api' }
    ]);
    const [endpoints, setEndpoints] = useState<Endpoint[]>([
        {
            id: 'default-endpoint-1',
            folderId: 'default-api-folder',
            method: 'GET',
            path: '/users',
            rules: [],
            headers: [],
            status: 200,
            delay: 0,
            delayMax: 0,
            errorType: 'none',
            errorRate: 100,
            body: createStandardResponseShell(),
            stateConfig: {
                enabled: true,
                collectionId: '',
                operation: ''
            }
        }
    ]);
    
    const [selectedId, setSelectedId] = useState<string>('default-endpoint-1');
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({ 'default-api-folder': true });
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);

    const [mockBaseUrl, setMockBaseUrl] = useState<string>("");
    const [showCopyFeedback, setShowCopyFeedback] = useState(false);
    const [showShareFeedback, setShowShareFeedback] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'config' | 'inspector' | 'client' | 'database'>('config');
    const [chaosMode, setChaosMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [collections, setCollections] = useState<Collection[]>([
        {
            id: 'default-users-col',
            name: 'users',
            fields: [
                { id: 'f1', name: 'id', type: 'string', required: true, unique: true },
                { id: 'f2', name: 'name', type: 'string', required: true, unique: false },
                { id: 'f3', name: 'email', type: 'string', required: true, unique: true },
                { id: 'f4', name: 'role', type: 'string', required: false, unique: false }
            ],
            items: Array.from({ length: 5 }, fakeUser)
        }
    ]);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
    const [dbActiveView, setDbActiveView] = useState<'schema' | 'data' | 'queries'>('schema');
    const [logs, setLogs] = useState<RequestLog[]>([]);;
    const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
    const [isLogsLoading, setIsLogsLoading] = useState(false);
    
    // Custom Database Queries
    const [customQueries, setCustomQueries] = useState<CustomQuery[]>([]);
    const [selectedQueryId, setSelectedQueryId] = useState<string | null>(null);
    const [dbExpandedSections, setDbExpandedSections] = useState({ collections: true, queries: true });

    // Environment & Variables
    const [environments, setEnvironments] = useState<Environment[]>([
        { id: 'dev-env', name: 'Development', variables: { base_url: 'http://localhost:3000', token: '' } },
        { id: 'staging-env', name: 'Staging', variables: { base_url: 'https://staging.api.example.com', token: '' } },
        { id: 'prod-env', name: 'Production', variables: { base_url: 'https://api.example.com', token: '' } }
    ]);
    const [activeEnvironmentId, setActiveEnvironmentId] = useState<string>('dev-env');
    const [showImportModal, setShowImportModal] = useState(false);
    const [showEnvModal, setShowEnvModal] = useState(false);
    const [importCurlInput, setImportCurlInput] = useState("");
    const [editingEnvId, setEditingEnvId] = useState<string | null>(null);
    
    // Saved Requests & Collections
    const [savedRequests, setSavedRequests] = useState<SavedRequest[]>([]);
    const [requestHistory, setRequestHistory] = useState<SavedRequest[]>([]);
    
    // Enhanced API Client State with Tabs
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
    const [clientResponse, setClientResponse] = useState<{ status: number, statusText: string, headers: Record<string, string>, body: string, time: number } | null>(null);
    const [isClientLoading, setIsClientLoading] = useState(false);
    const [clientSubTab, setClientSubTab] = useState<'headers' | 'body' | 'params' | 'auth'>('params');
    const [clientError, setClientError] = useState<string | null>(null);
    const [responseView, setResponseView] = useState<'pretty' | 'raw' | 'tree'>('pretty');
    const [generatedCode, setGeneratedCode] = useState<{ language: string; code: string } | null>(null);
    const [showCodeModal, setShowCodeModal] = useState(false);
    const [debugInfo, setDebugInfo] = useState<{ rawRequest: string; rawHeaders: string } | null>(null);
    const [showDebugPanel, setShowDebugPanel] = useState(false);

    // Legacy state for backward compatibility
    const [clientMethod, setClientMethod] = useState<string>('GET');
    const [clientUrl, setClientUrl] = useState<string>('');
    const [clientHeadersLegacy, setClientHeadersLegacy] = useState<{ id: string, key: string, value: string }[]>([
        { id: uuidv4(), key: 'Content-Type', value: 'application/json' }
    ]);
    const [clientBody, setClientBody] = useState<string>('');

    // Replay state
    const [replayBody, setReplayBody] = useState<string>('');
    const [replayHeaders, setReplayHeaders] = useState<string>('');
    const [replayResult, setReplayResult] = useState<{ status: number; body: string; time: number } | null>(null);
    const [isReplaying, setIsReplaying] = useState(false);
    const [showReplayPanel, setShowReplayPanel] = useState(false);
    const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);
    const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

    // For stringified body input
    const [jsonInput, setJsonInput] = useState(JSON.stringify(createStandardResponseShell(), null, 2));
    const [jsonError, setJsonError] = useState<string | null>(null);

    const selectedEndpoint = endpoints.find(e => e.id === selectedId) || endpoints[0];
    const selectedLog = logs.find(l => l.id === selectedLogId);

    const createDefaultRequestTab = (): RequestTab => ({
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
        isActive: true,
    });

    const createDefaultEnvironments = (): Environment[] => ([
        { id: 'dev-env', name: 'Development', variables: { base_url: 'http://localhost:3000', token: '' } },
        { id: 'staging-env', name: 'Staging', variables: { base_url: 'https://staging.api.example.com', token: '' } },
        { id: 'prod-env', name: 'Production', variables: { base_url: 'https://api.example.com', token: '' } }
    ]);

    const normalizeRequestTabs = (tabs: any, activeId?: string): RequestTab[] => {
        const safeTabs = Array.isArray(tabs) && tabs.length > 0 ? tabs : [createDefaultRequestTab()];
        const hydrated = safeTabs.map((tab: any) => ({
            ...createDefaultRequestTab(),
            ...tab,
            id: tab?.id || uuidv4(),
            headers: Array.isArray(tab?.headers) ? tab.headers : [{ id: uuidv4(), key: 'Content-Type', value: 'application/json' }],
            queryParams: Array.isArray(tab?.queryParams) ? tab.queryParams : [],
        }));

        const resolvedActiveId = activeId && hydrated.some((t: RequestTab) => t.id === activeId)
            ? activeId
            : hydrated[0].id;

        return hydrated.map((t: RequestTab) => ({ ...t, isActive: t.id === resolvedActiveId }));
    };

    const buildPortableSnapshot = () => ({
        kind: 'local-server-workspace',
        version: '3.0',
        timestamp: new Date().toISOString(),
        workspace: {
            folders,
            endpoints,
            collections,
            customQueries,
            chaosMode,
            selectedId,
            openFolders,
            activeTab,
            searchQuery,
            selectedCollectionId,
            dbActiveView,
            selectedQueryId,
            dbExpandedSections,
        },
        client: {
            requestTabs,
            activeTabId,
            clientSubTab,
            responseView,
            environments,
            activeEnvironmentId,
            savedRequests,
            requestHistory,
        },
        inspector: {
            logs,
            selectedLogId,
        },
        ui: {
            jsonInput,
        },
    });

    const withRequiredStateConfig = (endpoint: any): Endpoint => ({
        ...endpoint,
        rules: endpoint?.rules || [],
        stateConfig: {
            enabled: true,
            collectionId: endpoint?.stateConfig?.collectionId || '',
            operation: endpoint?.stateConfig?.operation || ''
        }
    });

    const applyPortableSnapshot = (imported: any) => {
        const workspace = imported?.workspace || {};
        const client = imported?.client || imported?.clientState || {};
        const inspector = imported?.inspector || {};

        const importedEndpoints = Array.isArray(workspace.endpoints)
            ? workspace.endpoints.map((e: any) => withRequiredStateConfig(e))
            : [];

        setFolders(Array.isArray(workspace.folders) ? workspace.folders : []);
        setEndpoints(importedEndpoints);
        setCollections(Array.isArray(workspace.collections) ? workspace.collections : []);
        setCustomQueries(Array.isArray(workspace.customQueries) ? workspace.customQueries : []);
        setChaosMode(!!workspace.chaosMode);
        setSelectedId(workspace.selectedId || importedEndpoints[0]?.id || '');
        setOpenFolders(workspace.openFolders && typeof workspace.openFolders === 'object' ? workspace.openFolders : { 'default-api-folder': true });
        setActiveTab(workspace.activeTab || 'config');
        setSearchQuery(workspace.searchQuery || '');
        setSelectedCollectionId(workspace.selectedCollectionId || null);
        setDbActiveView(workspace.dbActiveView || 'schema');
        setSelectedQueryId(workspace.selectedQueryId || null);
        setDbExpandedSections(workspace.dbExpandedSections || { collections: true, queries: true });

        const normalizedTabs = normalizeRequestTabs(client.requestTabs || client.tabs, client.activeTabId);
        setRequestTabs(normalizedTabs);
        setActiveTabId(normalizedTabs.find(t => t.isActive)?.id || normalizedTabs[0].id);
        setClientSubTab(client.clientSubTab || 'params');
        setResponseView(client.responseView || 'pretty');

        const importedEnvironments = Array.isArray(client.environments) && client.environments.length > 0
            ? client.environments
            : createDefaultEnvironments();
        setEnvironments(importedEnvironments);
        setActiveEnvironmentId(client.activeEnvironmentId || importedEnvironments[0].id);
        setSavedRequests(Array.isArray(client.savedRequests) ? client.savedRequests : []);
        setRequestHistory(Array.isArray(client.requestHistory) ? client.requestHistory : []);

        setLogs(Array.isArray(inspector.logs) ? inspector.logs : (Array.isArray(imported.logs) ? imported.logs : []));
        setSelectedLogId(inspector.selectedLogId || null);

        if (imported?.ui?.jsonInput && typeof imported.ui.jsonInput === 'string') {
            setJsonInput(imported.ui.jsonInput);
        }
    };

    // Hydration, Shared URLs, and Local Storage
    useEffect(() => {
        let loadedFromSharedUrl = false;
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const sharedWorkspace = urlParams.get('workspace');
            
            if (sharedWorkspace) {
                const decompressed = LZString.decompressFromEncodedURIComponent(sharedWorkspace);
                if (decompressed) {
                    const parsed = JSON.parse(decompressed);
                    if (parsed && Array.isArray(parsed.endpoints) && parsed.endpoints.length > 0) {
                        setFolders(parsed.folders || []);
                        setEndpoints(parsed.endpoints.map((e: any) => withRequiredStateConfig(e)));
                        setCollections(parsed.collections || []);
                        setCustomQueries(parsed.customQueries || []);
                        setSelectedId(parsed.endpoints[0].id);
                        loadedFromSharedUrl = true;
                    }
                }
            }

            if (!loadedFromSharedUrl) {
                const saved = localStorage.getItem('local-server-workspace');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setFolders(parsed.folders || []);
                    setEndpoints(parsed.endpoints?.map((e: any) => withRequiredStateConfig(e)) || []);
                    setCollections(parsed.collections || []);
                    if (parsed.endpoints && parsed.endpoints.length > 0) {
                        setSelectedId(parsed.endpoints[0].id);
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load workspace:", e);
        }
        setIsLoaded(true);
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        localStorage.setItem('local-server-workspace', JSON.stringify({ folders, endpoints, collections }));
    }, [folders, endpoints, collections, isLoaded]);

    // Removed Registry Sync Logic

    const getEndpointUrl = (endpoint?: Endpoint) => {
        const config = {
            folders,
            endpoints,
            collections,
            customQueries,
            chaosMode
        };
        const cfg = LZString.compressToEncodedURIComponent(JSON.stringify(config));
        // Guard against SSR
        if (typeof window === 'undefined') {
            if (!endpoint) return '/api/mock-server/' + cfg;
            const endpointPath = endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`;
            return `/api/mock-server/${cfg}${endpointPath}`;
        }
        const base = `${window.location.origin}/api/mock-server/${cfg}`;
        if (!endpoint) return base;
        const endpointPath = endpoint.path.startsWith('/') ? endpoint.path : `/${endpoint.path}`;
        return `${base}${endpointPath}`;
    };

    // Inspector Polling
    useEffect(() => {
        let isSubscribed = true;
        const fetchLogs = async () => {
            // Always poll for logs regardless of active tab to keep data fresh
            setIsLogsLoading(true);
            try {
                const res = await fetch('/api/mock-logs');
                if (res.ok && isSubscribed) {
                    const data = await res.json();
                    setLogs(data);
                }
            } catch (e) {
                console.error('Failed to fetch mock logs:', e);
            } finally {
                if (isSubscribed) setIsLogsLoading(false);
            }
        };
        fetchLogs();
        const interval = setInterval(fetchLogs, 1500);
        return () => {
            isSubscribed = false;
            clearInterval(interval);
        };
    }, []);

    const clearLogs = async () => {
        try {
            await fetch('/api/mock-logs', { method: 'DELETE' });
            setLogs([]);
            setSelectedLogId(null);
            setReplayResult(null);
            setShowReplayPanel(false);
        } catch (e) {}
    };

    const initReplay = (log: RequestLog) => {
        setReplayBody(log.body ? log.body : '{}');
        // Filter out Next.js internal headers for cleaner replay setup
        const replayableHeaders: Record<string, string> = {};
        const skipHeaders = ['host', 'connection', 'content-length', 'transfer-encoding'];
        Object.entries(log.headers).forEach(([k, v]) => {
            if (!skipHeaders.includes(k.toLowerCase())) replayableHeaders[k] = v;
        });
        setReplayHeaders(JSON.stringify(replayableHeaders, null, 2));
        setReplayResult(null);
        setShowReplayPanel(true);
    };

    const handleReplay = async (log: RequestLog) => {
        setIsReplaying(true);
        setReplayResult(null);
        const start = Date.now();
        try {
            let parsedHeaders: Record<string, string> = {};
            try { parsedHeaders = JSON.parse(replayHeaders); } catch (e) {}

            const fetchOptions: RequestInit = {
                method: log.method,
                headers: { 'Content-Type': 'application/json', ...parsedHeaders },
            };

            if (log.method !== 'GET' && log.method !== 'OPTIONS') {
                fetchOptions.body = replayBody;
            }

            const res = await fetch(log.fullUrl || log.url, fetchOptions);
            const text = await res.text();
            setReplayResult({ status: res.status, body: text, time: Date.now() - start });
        } catch (e: any) {
            setReplayResult({ status: 0, body: `Network Error: ${e.message}`, time: Date.now() - start });
        } finally {
            setIsReplaying(false);
        }
    };



    const openInClient = (log: RequestLog) => {
        // Create a new tab with the request details
        const newTab: RequestTab = {
            id: uuidv4(),
            name: `${log.method} ${log.url.split('/').slice(-1)[0] || 'request'}`,
            method: log.method,
            url: log.fullUrl || (log.url.startsWith('/') ? window.location.origin + log.url : log.url),
            headers: Object.entries(log.headers).map(([key, value]) => ({
                id: uuidv4(),
                key,
                value: String(value)
            })),
            queryParams: [],
            bodyType: log.body ? 'json' : 'none',
            body: typeof log.body === 'string' ? JSON.stringify(JSON.parse(log.body), null, 2) : JSON.stringify(log.body || {}, null, 2),
            authType: 'none',
            authConfig: {},
            isActive: true
        };
        
        // Deactivate other tabs and add new one
        setRequestTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
        setActiveTabId(newTab.id);
        setActiveTab('client');
    };

    // Warn against closing tab without exporting
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; // Required for Chrome/Edge
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
        if (isLoaded && selectedEndpoint) {
            setJsonInput(JSON.stringify(selectedEndpoint.body, null, 2));
        }
    }, [selectedId, isLoaded]);

    const updateEndpoint = (updates: Partial<Endpoint>) => {
        setEndpoints(prev => prev.map(e => e.id === selectedId ? { ...e, ...updates } : e));
    };

    // Body parsing
    useEffect(() => {
        try {
            const parsed = JSON.parse(jsonInput);
            setJsonError(null);
            setEndpoints(prev => prev.map(e => e.id === selectedId ? { ...e, body: parsed } : e));
        } catch (e: any) {
            setJsonError(e.message);
        }
    }, [jsonInput, selectedId]);

    // Auto-generate API Builder URL
    useEffect(() => {
        if (jsonError) return;
        const url = getEndpointUrl();
        setMockBaseUrl(url);
    }, [jsonError, folders, endpoints, collections, chaosMode]);

    const handleAddEndpoint = (folderId: string | null = null, duplicateContext?: Endpoint) => {
        const newEndpoint: Endpoint = {
            id: uuidv4(),
            folderId,
            method: duplicateContext?.method || 'GET',
            path: duplicateContext?.path || '/new-route',
            rules: [],
            status: duplicateContext?.status || 200,
            delay: duplicateContext?.delay || 0,
            delayMax: duplicateContext?.delayMax || 0,
            errorType: duplicateContext?.errorType || 'none',
            errorRate: duplicateContext?.errorRate || 100,
            body: duplicateContext?.body || createStandardResponseShell(),
            stateConfig: {
                enabled: true,
                collectionId: duplicateContext?.stateConfig?.collectionId || '',
                operation: duplicateContext?.stateConfig?.operation || ''
            }
        };
        setEndpoints([...endpoints, newEndpoint]);
        setSelectedId(newEndpoint.id);
        if (folderId) {
            setOpenFolders(prev => ({ ...prev, [folderId]: true }));
        }
        setActiveTab('config');
    };

    const handleDeleteEndpoint = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (endpoints.length === 1) return;
        setEndpoints(prev => {
            const filtered = prev.filter(ep => ep.id !== id);
            if (id === selectedId && filtered.length > 0) {
                setSelectedId(filtered[0].id);
            }
            return filtered;
        });
    };

    const handleAddFolder = (parentId: string | null = null) => {
        const newFolder: Folder = { id: uuidv4(), name: 'New Folder', parentId };
        setFolders([...folders, newFolder]);
        setOpenFolders({ ...openFolders, [newFolder.id]: true });
        if (parentId) setOpenFolders(prev => ({ ...prev, [parentId]: true }));
        setEditingFolderId(newFolder.id);
    };

    const handleDeleteFolder = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setFolders(prev => prev.filter(f => f.id !== id).map(f => f.parentId === id ? { ...f, parentId: null } : f));
        setEndpoints(endpoints.map(ep => ep.folderId === id ? { ...ep, folderId: null } : ep));
    };

    const toggleFolder = (id: string) => {
        setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const updateFolderName = (id: string, newName: string) => {
        setFolders(folders.map(f => f.id === id ? { ...f, name: newName } : f));
    };

    const handleDragStart = (e: React.DragEvent, id: string, type: 'endpoint' | 'folder') => {
        e.dataTransfer.setData('id', id);
        e.dataTransfer.setData('type', type);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-accent/20'); 
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-accent/20');
    };

    const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-accent/20');
        const id = e.dataTransfer.getData('id') || e.dataTransfer.getData('endpointId'); // Compatibility
        const type = e.dataTransfer.getData('type') || 'endpoint';
        
        if (type === 'endpoint') {
            setEndpoints(prev => prev.map(ep => ep.id === id ? { ...ep, folderId: targetFolderId } : ep));
            if (targetFolderId) setOpenFolders(prev => ({ ...prev, [targetFolderId]: true }));
        } else if (type === 'folder') {
            if (id === targetFolderId) return;
            
            const isDescendant = (folderId: string, potentialParentId: string): boolean => {
                const folder = folders.find(f => f.id === folderId);
                if (!folder || !folder.parentId) return false;
                if (folder.parentId === potentialParentId) return true;
                return isDescendant(folder.parentId, potentialParentId);
            };

            if (targetFolderId && isDescendant(targetFolderId, id)) return;

            setFolders(prev => prev.map(f => f.id === id ? { ...f, parentId: targetFolderId } : f));
            if (targetFolderId) setOpenFolders(prev => ({ ...prev, [targetFolderId]: true }));
        }
    };

    const handleCopy = () => {
        if (!mockBaseUrl) return;
        const urlToCopy = selectedEndpoint ? getEndpointUrl(selectedEndpoint) : mockBaseUrl;
        navigator.clipboard.writeText(urlToCopy);
        setShowCopyFeedback(true);
        setTimeout(() => setShowCopyFeedback(false), 2000);
    };

    const handleShareUI = () => {
        const payload = { folders, endpoints, collections, customQueries };
        const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
        const shareUrl = `${window.location.origin}${window.location.pathname}?workspace=${compressed}`;
        navigator.clipboard.writeText(shareUrl);
        setShowShareFeedback(true);
        setTimeout(() => setShowShareFeedback(false), 3000);
    };

    const handleExportFull = () => {
        const payload = buildPortableSnapshot();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `local-server-workspace-snapshot-v3.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImportFull = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                
                // Case 1: Portable full backup (v3.x)
                if (imported.kind === 'local-server-workspace' && imported.version?.startsWith("3.")) {
                    applyPortableSnapshot(imported);
                }
                // Case 2: Full Backup (v2.x legacy)
                else if (imported.version?.startsWith("2.")) {
                    applyPortableSnapshot({
                        workspace: {
                            folders: imported.folders || [],
                            endpoints: imported.endpoints || [],
                            collections: imported.collections || [],
                            customQueries: imported.customQueries || [],
                            chaosMode: !!imported.chaosMode,
                            selectedId: imported.endpoints?.[0]?.id || null,
                        },
                        client: {
                            requestTabs: imported.clientState?.tabs || [],
                            activeTabId: imported.clientState?.activeTabId,
                            environments: imported.clientState?.environments || [],
                            activeEnvironmentId: imported.clientState?.activeEnvironmentId,
                        },
                        inspector: {
                            logs: imported.logs || [],
                        },
                    });
                } 
                // Case 2: Legacy Workspace
                else if (Array.isArray(imported.endpoints) || Array.isArray(imported)) {
                    let eps = Array.isArray(imported) ? imported : imported.endpoints;
                    let flds = imported.folders || [];
                    let cols = imported.collections || [];
                    applyPortableSnapshot({
                        workspace: {
                            folders: flds,
                            endpoints: eps,
                            collections: cols,
                            customQueries: imported.customQueries || [],
                            selectedId: eps[0]?.id,
                        },
                    });
                }
                // Case 3: Legacy Collections
                else if (Array.isArray(imported) && imported[0]?.fields) {
                    setCollections([...collections, ...imported.map(c => ({ ...c, id: c.id || uuidv4() }))]);
                }
                else {
                    throw new Error("Unknown format");
                }
            } catch (err) {
                alert("Invalid or unsupported file format.");
            }
            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const handleImportWorkspace = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleImportFull(e);
    };

    const handleImportCollections = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleImportFull(e);
    };

    const handleClearAll = () => {
        if (confirm("Are you sure you want to clear all data? This will reset all routes, folders, and collections.")) {
            setFolders([]);
            setEndpoints([]);
            setCollections([]);
            setCustomQueries([]);
            setEnvironments([]);
            setSavedRequests([]);
            setRequestHistory([]);
            setActiveTab('config');
        }
    };

    // Helper: Get active tab
    const getActiveTab = (): RequestTab => {
        return requestTabs.find(t => t.isActive) || requestTabs[0];
    };

    // Helper: Interpolate variables in string
    const interpolateVariables = (str: string): string => {
        const env = environments.find(e => e.id === activeEnvironmentId);
        if (!env) return str;
        
        let result = str;
        Object.entries(env.variables).forEach(([key, value]) => {
            result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
        });
        return result;
    };

    // Helper: Build URL with query params
    const buildUrlWithParams = (url: string, params: { key: string; value: string }[]): string => {
        const filteredParams = params.filter(p => p.key.trim());
        if (filteredParams.length === 0) return url;
        
        const queryString = filteredParams
            .map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`)
            .join('&');
        
        return url.includes('?') ? `${url}&${queryString}` : `${url}?${queryString}`;
    };

    // Tab Management Functions
    const addNewTab = () => {
        const newTab: RequestTab = {
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

    const handleImportCurl = (curl: string) => {
        const parsed = parseCurl(curl);
        const newTab: RequestTab = {
            id: uuidv4(),
            name: `Imported ${parsed.method}`,
            method: parsed.method || 'GET',
            url: parsed.url || '',
            headers: parsed.headers || [],
            queryParams: [],
            bodyType: parsed.bodyType || 'none',
            body: parsed.body || '',
            authType: 'none',
            authConfig: {},
            isActive: true
        };
        
        setRequestTabs(prev => [...prev.map(t => ({ ...t, isActive: false })), newTab]);
        setActiveTabId(newTab.id);
        setShowImportModal(false);
        setImportCurlInput("");
    };

    const updateActiveTab = (updates: Partial<RequestTab>) => {
        setRequestTabs(prev => prev.map(t => t.isActive ? { ...t, ...updates } : t));
    };

    const saveCurrentRequest = () => {
        const activeTabReq = getActiveTab();
        const savedRequest: SavedRequest = {
            id: uuidv4(),
            collectionId: undefined,
            name: activeTabReq.name,
            method: activeTabReq.method,
            url: activeTabReq.url,
            headers: activeTabReq.headers.filter(h => h.key).map(h => ({ key: h.key, value: h.value })),
            queryParams: activeTabReq.queryParams.filter(p => p.key).map(p => ({ key: p.key, value: p.value })),
            bodyType: activeTabReq.bodyType,
            body: activeTabReq.body,
            authType: activeTabReq.authType,
            authConfig: activeTabReq.authConfig,
            preRequestScript: activeTabReq.preRequestScript,
            testScript: activeTabReq.testScript,
            createdAt: new Date().toISOString()
        };
        setSavedRequests([...savedRequests, savedRequest]);
        alert('Request saved successfully!');
    };

    // Helper: Generate code snippets
    const generateCodeSnippet = (language: string, tab: RequestTab): string => {
        const url = buildUrlWithParams(interpolateVariables(tab.url), tab.queryParams);
        const headers = tab.headers.filter(h => h.key).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});
        const body = tab.bodyType !== 'none' ? tab.body : null;

        switch (language) {
            case 'curl':
                let curlCmd = `curl -X ${tab.method} '${url}'`;
                Object.entries(headers).forEach(([k, v]) => {
                    curlCmd += ` \\n  -H '${k}: ${v}'`;
                });
                if (body) {
                    curlCmd += ` \\n  --data '${body}'`;
                }
                return curlCmd;
            
            case 'fetch':
                return `fetch('${url}', {
  method: '${tab.method}',
  headers: ${JSON.stringify(headers, null, 2).split('\n').map((l, i) => i === 0 ? l : '  ' + l).join('\n')},
  ${body ? `body: JSON.stringify(${body}),` : '// body: undefined,'}
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));`;
            
            case 'axios':
                return `import axios from 'axios';

const response = await axios({
  method: '${tab.method}',
  url: '${url}',
  headers: ${JSON.stringify(headers, null, 2)},
  ${body ? `data: ${body},` : '// data: undefined,'}
});

console.log(response.data);`;
            
            case 'python':
                return `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 2)}
${body ? `payload = ${body}` : '# payload = None'}

response = requests.${body ? 'post' : 'get'}(url, headers=headers${body ? ', json=payload' : ''})

print(response.status_code)
print(response.json())`;
            
            default:
                return '// Unsupported language';
        }
    };

    // Enhanced Client Request Handler
    const handleSendClientRequest = async () => {
        const activeTabReq = getActiveTab();
        if (!activeTabReq.url) return;
        
        setIsClientLoading(true);
        setClientError(null);
        setClientResponse(null);
        setDebugInfo(null);

        const startTime = Date.now();
        
        try {
            // Step 1: Execute pre-request script if exists
            if (activeTabReq.preRequestScript) {
                try {
                    // Basic sandbox execution - can be enhanced
                    const modifiedTab = { ...activeTabReq };
                    eval(activeTabReq.preRequestScript);
                    // Update tab if scripts modified it
                } catch (scriptErr) {
                    console.warn('Pre-request script error:', scriptErr);
                }
            }

            // Step 2: Prepare request
            let finalUrl = buildUrlWithParams(interpolateVariables(activeTabReq.url), activeTabReq.queryParams);

            // If client URL targets generated local-server mock endpoints, always refresh cfg from
            // current workspace state so mutations apply to latest in-memory collections.
            try {
                const parsedUrl = new URL(finalUrl, window.location.origin);
                const liveCfg = LZString.compressToEncodedURIComponent(JSON.stringify({
                    folders,
                    endpoints,
                    collections,
                    customQueries,
                    chaosMode,
                }));

                if (parsedUrl.pathname === '/api/mock' && parsedUrl.searchParams.has('cfg')) {
                    parsedUrl.searchParams.set('cfg', liveCfg);
                    finalUrl = parsedUrl.toString();
                } else if (parsedUrl.pathname.startsWith('/api/mock-server/')) {
                    const parts = parsedUrl.pathname.split('/');
                    // /api/mock-server/{cfg}/optional/path
                    if (parts.length >= 4) {
                        parts[3] = liveCfg;
                        parsedUrl.pathname = parts.join('/');
                        finalUrl = parsedUrl.toString();
                    }
                }
            } catch {
                // Ignore URL parsing failures and keep original URL.
            }
            
            // Add auth headers if configured & Interpolate variables in existing headers
            let finalHeaders = activeTabReq.headers.map(h => ({
                ...h,
                key: interpolateVariables(h.key),
                value: interpolateVariables(h.value)
            }));
            if (activeTabReq.authType === 'bearer' && activeTabReq.authConfig?.token) {
                const existingAuthIndex = finalHeaders.findIndex(h => h.key.toLowerCase() === 'authorization');
                if (existingAuthIndex >= 0) {
                    finalHeaders[existingAuthIndex].value = `Bearer ${activeTabReq.authConfig.token}`;
                } else {
                    finalHeaders.push({ id: uuidv4(), key: 'Authorization', value: `Bearer ${activeTabReq.authConfig.token}` });
                }
            } else if (activeTabReq.authType === 'basic' && activeTabReq.authConfig?.username && activeTabReq.authConfig?.password) {
                const basicToken = btoa(`${activeTabReq.authConfig.username}:${activeTabReq.authConfig.password}`);
                const existingAuthIndex = finalHeaders.findIndex(h => h.key.toLowerCase() === 'authorization');
                if (existingAuthIndex >= 0) {
                    finalHeaders[existingAuthIndex].value = `Basic ${basicToken}`;
                } else {
                    finalHeaders.push({ id: uuidv4(), key: 'Authorization', value: `Basic ${basicToken}` });
                }
            } else if (activeTabReq.authType === 'apikey') {
                if (activeTabReq.authConfig?.in === 'header') {
                    const existingKeyIndex = finalHeaders.findIndex(h => h.key.toLowerCase() === activeTabReq.authConfig.key?.toLowerCase());
                    if (existingKeyIndex >= 0) {
                        finalHeaders[existingKeyIndex].value = activeTabReq.authConfig.value;
                    } else {
                        finalHeaders.push({ id: uuidv4(), key: activeTabReq.authConfig.key || 'X-API-Key', value: activeTabReq.authConfig.value });
                    }
                }
            }

            // Prepare body based on type
            let bodyToSend: any = null;
            if (activeTabReq.bodyType !== 'none' && activeTabReq.body) {
                const interpolatedBody = interpolateVariables(activeTabReq.body);
                if (activeTabReq.bodyType === 'json') {
                    bodyToSend = interpolatedBody;
                    const contentTypeExists = finalHeaders.some(h => h.key.toLowerCase() === 'content-type');
                    if (!contentTypeExists) {
                        finalHeaders.push({ id: uuidv4(), key: 'Content-Type', value: 'application/json' });
                    }
                } else if (activeTabReq.bodyType === 'form-data') {
                    bodyToSend = new FormData();
                    activeTabReq.body.split('\n').forEach(line => {
                        const [key, ...valueParts] = line.split('=');
                        if (key.trim()) {
                            bodyToSend.append(key.trim(), valueParts.join('=').trim());
                        }
                    });
                    // Remove Content-Type for FormData (browser sets it automatically)
                    const ctIndex = finalHeaders.findIndex(h => h.key.toLowerCase() === 'content-type');
                    if (ctIndex >= 0) finalHeaders.splice(ctIndex, 1);
                } else if (activeTabReq.bodyType === 'urlencoded') {
                    bodyToSend = activeTabReq.body;
                    const contentTypeExists = finalHeaders.some(h => h.key.toLowerCase() === 'content-type');
                    if (!contentTypeExists) {
                        finalHeaders.push({ id: uuidv4(), key: 'Content-Type', value: 'application/x-www-form-urlencoded' });
                    }
                } else if (activeTabReq.bodyType === 'raw') {
                    bodyToSend = activeTabReq.body;
                }
            }

            // Store debug info
            const headersObj = finalHeaders.filter(h => h.key).reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});
            setDebugInfo({
                rawRequest: `${activeTabReq.method} ${finalUrl}`,
                rawHeaders: JSON.stringify(headersObj, null, 2)
            });

            // Step 3: Send request (proxied to bypass CORS)
            const res = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: finalUrl,
                    method: activeTabReq.method,
                    headers: headersObj,
                    body: ['GET', 'HEAD'].includes(activeTabReq.method) ? null : bodyToSend
                })
            });

            const proxyData = await res.json();
            if (proxyData.error) throw new Error(proxyData.error);

            const duration = proxyData.time || (Date.now() - startTime);
            const resBody = proxyData.body;

            // Sync local database state when mock backend returns a state update header
            const stateUpdate = proxyData.headers?.['x-mock-state-update'] || proxyData.headers?.['X-Mock-State-Update'];
            if (stateUpdate) {
                try {
                    const decompressed = LZString.decompressFromEncodedURIComponent(stateUpdate);
                    if (decompressed) {
                        const parsedCollections = JSON.parse(decompressed);
                        if (Array.isArray(parsedCollections)) {
                            setCollections(parsedCollections);
                        }
                    }
                } catch (stateErr) {
                    console.warn('Failed to apply X-Mock-State-Update:', stateErr);
                }
            }
            
            // Step 4: Process response
            setClientResponse({
                status: proxyData.status,
                statusText: proxyData.statusText,
                headers: proxyData.headers,
                body: resBody,
                time: duration
            });

            // Step 5: Execute test scripts if exists
            if (activeTabReq.testScript && resBody) {
                try {
                    // Create pm object for Postman-style tests
                    const pm = {
                        response: {
                            to: {
                                have: {
                                    status: (expected: number) => {
                                        if (res.status !== expected) {
                                            throw new Error(`Expected status ${expected}, got ${res.status}`);
                                        }
                                    }
                                }
                            },
                            json: () => {
                                try {
                                    return JSON.parse(resBody);
                                } catch {
                                    throw new Error('Response is not valid JSON');
                                }
                            }
                        },
                        test: (name: string, fn: () => void) => {
                            try {
                                fn();
                                console.log(`✓ ${name}`);
                            } catch (err: any) {
                                console.error(`✗ ${name}:`, err.message);
                            }
                        }
                    };
                    
                    eval(activeTabReq.testScript);
                } catch (scriptErr: any) {
                    console.warn('Test script error:', scriptErr.message);
                }
            }

            // Step 6: Save to history
            const historyEntry: SavedRequest = {
                id: uuidv4(),
                name: activeTabReq.name,
                method: activeTabReq.method,
                url: activeTabReq.url,
                headers: activeTabReq.headers.filter(h => h.key).map(h => ({ key: h.key, value: h.value })),
                queryParams: activeTabReq.queryParams.filter(p => p.key).map(p => ({ key: p.key, value: p.value })),
                bodyType: activeTabReq.bodyType,
                body: activeTabReq.body,
                createdAt: new Date().toISOString()
            };
            setRequestHistory(prev => [historyEntry, ...prev.slice(0, 49)]); // Keep last 50

        } catch (err: any) {
            setClientError(err.message || 'Network error occurred');
        } finally {
            setIsClientLoading(false);
        }
    };

    const renderEndpointItem = (ep: Endpoint, depth: number = 0) => (
        <div 
            key={ep.id} 
            draggable
            onDragStart={(e) => handleDragStart(e, ep.id, 'endpoint')}
            onClick={() => { setSelectedId(ep.id); setActiveTab('config'); }}
            className={`flex justify-between items-center p-2 rounded-lg cursor-pointer border transition-colors group mb-1 ${depth > 0 ? 'ml-4' : ''} ${selectedId === ep.id && activeTab === 'config' ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-background-input border-border hover:border-accent/40'}`}
        >
            <div className="flex flex-col overflow-hidden max-w-[80%]">
                <span className={`text-[10px] font-bold ${ep.method === 'GET' ? 'text-green-500' : ep.method === 'POST' ? 'text-blue-500' : ep.method === 'DELETE' ? 'text-red-500' : ep.method === 'PUT' ? 'text-yellow-500' : 'text-purple-500'}`}>{ep.method}</span>
                <span className="text-xs font-mono truncate">{ep.path}</span>
                {ep.rules && ep.rules.length > 0 && (
                    <span className="text-[9px] text-accent/80 font-semibold mt-0.5 flex items-center gap-1"><Filter className="w-2.5 h-2.5" /> {ep.rules.length} Rule{ep.rules.length>1?'s':''}</span>
                )}
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); handleAddEndpoint(ep.folderId, ep); }} className="text-text-muted hover:text-accent p-1" title="Duplicate Endpoint (Useful for Rules)">
                    <Server className="w-3.5 h-3.5" />
                </button>
                {endpoints.length > 1 && (
                    <button onClick={(e) => handleDeleteEndpoint(ep.id, e)} className="text-text-muted hover:text-error p-1" title="Delete Endpoint">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );

    const renderFolder = (folder: Folder, level: number = 0) => {
        const subFolders = folders.filter(f => f.parentId === folder.id);
        const folderEndpoints = endpoints.filter(ep => ep.folderId === folder.id);
        const filteredEndpoints = folderEndpoints.filter(e => 
            e.path.toLowerCase().includes(searchQuery.toLowerCase()) || 
            e.method.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // Simple match check for folders (name match or child match)
        const folderHasMatch = (f: Folder): boolean => {
            if (f.name.toLowerCase().includes(searchQuery.toLowerCase())) return true;
            if (endpoints.some(e => e.folderId === f.id && (e.path.toLowerCase().includes(searchQuery.toLowerCase()) || e.method.toLowerCase().includes(searchQuery.toLowerCase())))) return true;
            return folders.filter(sf => sf.parentId === f.id).some(sf => folderHasMatch(sf));
        };

        if (searchQuery && !folderHasMatch(folder)) return null;

        const isOpen = searchQuery ? true : openFolders[folder.id];
        
        return (
            <div key={folder.id} className="mb-1">
                <div 
                    draggable
                    onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, folder.id)}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-background-input group transition-colors ${level > 0 ? 'ml-3 border-l border-border/50 pl-3' : ''}`}
                    onClick={() => toggleFolder(folder.id)}
                >
                    <div className="flex items-center gap-2 max-w-[70%] pointer-events-none">
                        <span className="text-accent">{isOpen ? <FolderOpen className="w-4 h-4" /> : <FolderIcon className="w-4 h-4" />}</span>
                        {editingFolderId === folder.id ? (
                            <input 
                                autoFocus
                                type="text" 
                                className="bg-background border border-border rounded px-1 text-sm text-text-primary w-full"
                                value={folder.name}
                                onChange={(e) => updateFolderName(folder.id, e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onBlur={() => setEditingFolderId(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingFolderId(null)}
                            />
                        ) : (
                            <span className="text-sm font-semibold truncate select-none text-text-primary">{folder.name}</span>
                        )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); }} className="p-1 hover:text-accent text-text-muted" title="Rename Folder">
                            <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleAddFolder(folder.id); }} className="p-1 hover:text-accent text-text-muted" title="Add Subfolder">
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleAddEndpoint(folder.id); }} className="p-1 hover:text-accent text-text-muted" title="Add Endpoint to Folder">
                            <Server className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => handleDeleteFolder(folder.id, e)} className="p-1 hover:text-error text-text-muted" title="Delete Folder">
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
                {isOpen && (
                    <div className="mt-1">
                        {subFolders.map(sf => renderFolder(sf, level + 1))}
                        {filteredEndpoints.map(ep => renderEndpointItem(ep, level + 1))}
                    </div>
                )}
            </div>
        );
    };


    return (
        <ToolLayout tool={tool} shareValue={jsonInput}>
            <div className="flex justify-end mb-4 gap-2 flex-wrap">
                {/* ⚙ Advanced dropdown */}
                <div className="relative">
                    <button
                        onClick={() => setShowAdvancedMenu(m => !m)}
                        className={`py-1.5 px-3 text-xs flex items-center gap-2 rounded-lg border transition-colors ${showAdvancedMenu ? 'bg-background-input border-accent/40 text-accent' : 'btn-secondary text-text-muted'}`}
                    >
                        <Settings className="w-3.5 h-3.5" /> Advanced
                    </button>
                    {showAdvancedMenu && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-[#111111] border border-border shadow-2xl shadow-black/80 p-2 min-w-[220px] flex flex-col gap-1 rounded-xl">
                            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">System</div>
                            <button
                                onClick={() => { setChaosMode(c => !c); setShowAdvancedMenu(false); }}
                                className={`w-full text-left py-2 px-3 text-xs rounded-lg transition-colors flex items-center gap-2 ${chaosMode ? 'bg-red-500/10 text-red-400' : 'hover:bg-background-input text-text-muted hover:text-red-400'}`}
                            >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {chaosMode ? '🔥 Chaos Mode ON' : 'Enable Chaos Mode'}
                            </button>

                            <div className="h-px bg-border my-1" />
                            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">Snapshot & Restore</div>
                            
                            <button onClick={() => { handleExportFull(); setShowAdvancedMenu(false); }} className="w-full text-left py-2 px-3 text-xs rounded-lg hover:bg-background-input text-text-accent font-bold transition-colors flex items-center justify-between">
                                <span className="flex items-center gap-2"><Download className="w-3.5 h-3.5" /> Full Tool Snapshot</span>
                                <span className="text-[9px] opacity-60">.json</span>
                            </button>
                            <button onClick={() => { document.getElementById('import-file')?.click(); setShowAdvancedMenu(false); }} className="w-full text-left py-2 px-3 text-xs rounded-lg hover:bg-background-input text-text-muted hover:text-text transition-colors flex items-center gap-2">
                                <Upload className="w-3.5 h-3.5" /> Restore Snapshot
                            </button>

                            <div className="h-px bg-border my-1" />
                            <div className="px-3 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">Danger Zone</div>
                            <button onClick={handleClearAll} className="w-full text-left py-2 px-3 text-xs rounded-lg hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-colors flex items-center gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Clear All Data
                            </button>
                        </div>
                    )}
                </div>
                <input type="file" id="import-file" className="hidden" accept=".json" onChange={handleImportWorkspace} />
                <input type="file" id="import-collections" className="hidden" accept=".json" onChange={handleImportCollections} />
                <button onClick={handleShareUI} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-2" title="Share a full backend simulation via one URL">
                    {showShareFeedback ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    {showShareFeedback ? "Link Copied!" : "Share Backend"}
                </button>
                {chaosMode && (
                    <span className="text-[10px] font-bold text-red-400 animate-pulse flex items-center gap-1 border border-red-500/30 bg-red-500/10 px-2 py-1 rounded-lg">
                        <AlertTriangle className="w-3 h-3" /> Chaos On
                    </span>
                )}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
                {/* Left Sidebar - Routes List */}
                <div className="col-span-1 border-r border-border pr-2 flex flex-col gap-2 h-[750px] overflow-y-auto">
                    <div 
                        className="flex flex-col gap-3 mb-2 p-1 rounded transition-colors"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, null)}
                        title="Drop endpoints here to return them to the Root directory"
                    >
                        <div className="flex items-center justify-between">
                            <label className="label mb-0 pointer-events-none">API Routes</label>
                            <div className="flex gap-1">
                                <button onClick={() => handleAddFolder(null)} className="text-text-muted hover:text-accent p-1.5 rounded-md transition-colors hover:bg-accent/10" title="New Folder">
                                    <FolderPlus className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleAddEndpoint(null)} className="text-text-muted hover:text-accent p-1.5 rounded-md transition-colors hover:bg-accent/10" title="New Root Endpoint">
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        {/* Search Bar */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-muted" />
                            <input 
                                type="text" 
                                placeholder="Search routes..." 
                                className="input-field w-full pl-9 py-2 text-[11px] bg-background-input border-border focus:border-accent/40"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-text-muted hover:text-text-primary">
                                    <RotateCcw className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {folders.filter(f => !f.parentId).map(folder => renderFolder(folder, 0))}
                    {endpoints.filter(ep => !ep.folderId).filter(e => !searchQuery || e.path.toLowerCase().includes(searchQuery.toLowerCase()) || e.method.toLowerCase().includes(searchQuery.toLowerCase())).map(ep => renderEndpointItem(ep, 0))}
                </div>

                {/* Main Central Container */}
                <div className="col-span-1 md:col-span-3 flex flex-col pl-2 h-[750px]">
                    <div className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden shadow-xl shadow-black/20">
                        
                        {/* Tab Switcher */}
                        <div className="flex border-b border-border bg-background-input">
                            <button 
                                onClick={() => setActiveTab('config')}
                                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'config' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted hover:text-text hover:bg-background/50'}`}
                            >
                                <Settings className="w-4 h-4" /> Endpoint Configuration
                            </button>
                            <div className="w-px bg-border"></div>
                            <button 
                                onClick={() => setActiveTab('database')}
                                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'database' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted hover:text-text hover:bg-background/50'}`}
                            >
                                <Database className="w-4 h-4" /> Database
                            </button>
                            <div className="w-px bg-border"></div>
                            <button 
                                onClick={() => setActiveTab('inspector')}
                                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'inspector' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted hover:text-text hover:bg-background/50'}`}
                            >
                                <Activity className="w-4 h-4" /> Request Inspector
                                {logs.length > 0 && <span className="ml-1 bg-accent text-background text-[10px] font-bold px-1.5 py-0.5 rounded-full">{logs.length}</span>}
                            </button>
                            <div className="w-px bg-border"></div>
                            <button 
                                onClick={() => setActiveTab('client')}
                                className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'client' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted hover:text-text hover:bg-background/50'}`}
                            >
                                <Send className="w-4 h-4" /> API Client
                            </button>

                        </div>
                        
                        {/* Pane Content */}
                        <div className="flex-1 overflow-hidden flex flex-col custom-[scrollbar] bg-background">
                            
                            {/* TAB: CONFIG */}
                            {activeTab === 'config' && selectedEndpoint && (
                                <div className="flex flex-col h-full p-4 overflow-y-auto">
                                    <div className="space-y-4 flex-none py-1">
                                        <div className="bg-background-input/30 p-3 rounded-xl border border-border/50">
                                            <label className="label mb-1.5 flex items-center gap-2 text-accent"><ExternalLink className="w-3.5 h-3.5" /> Absolute Mock URL</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    readOnly
                                                    type="text" 
                                                    className="input-field flex-1 py-1.5 px-3 text-[11px] font-mono bg-background/50 border-border/50 cursor-default" 
                                                    value={getEndpointUrl(selectedEndpoint)}
                                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                                />
                                                <button 
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(getEndpointUrl(selectedEndpoint));
                                                        setShowCopyFeedback(true);
                                                        setTimeout(() => setShowCopyFeedback(false), 2000);
                                                    }}
                                                    className="btn-secondary py-1.5 px-3 flex items-center gap-2 text-[11px]"
                                                >
                                                    <Copy className="w-3 h-3" /> {showCopyFeedback ? 'Copied!' : 'Copy'}
                                                </button>
                                            </div>
                                            <p className="text-[9px] text-text-muted mt-1.5 pl-1 italic">Use this exact URL in your application or the API Client below.</p>
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                            <div>
                                                <label className="label mb-1">Method</label>
                                                <select 
                                                    className="input-field w-full py-2 px-3 text-sm bg-background border-border appearance-none font-mono"
                                                    value={selectedEndpoint.method}
                                                    onChange={(e) => updateEndpoint({ method: e.target.value })}
                                                >
                                                    <option value="GET">GET</option>
                                                    <option value="POST">POST</option>
                                                    <option value="PUT">PUT</option>
                                                    <option value="PATCH">PATCH</option>
                                                    <option value="DELETE">DELETE</option>
                                                    <option value="ALL">ALL</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1 lg:col-span-2">
                                                <label className="label mb-1">Route Path</label>
                                                <input 
                                                    type="text" 
                                                    className="input-field w-full py-2 px-3 text-sm bg-background border-border font-mono" 
                                                    value={selectedEndpoint.path} 
                                                    onChange={(e) => updateEndpoint({ path: e.target.value.startsWith('/') ? e.target.value : '/' + e.target.value })}
                                                    placeholder="/api/users"
                                                />
                                            </div>
                                            <div>
                                                <label className="label mb-1">Folder</label>
                                                <select 
                                                    className="input-field w-full py-2 px-3 text-sm bg-background border-border appearance-none"
                                                    value={selectedEndpoint.folderId || ''}
                                                    onChange={(e) => updateEndpoint({ folderId: e.target.value === '' ? null : e.target.value })}
                                                >
                                                    <option value="">(Root)</option>
                                                    {folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="label mb-1 pl-1">Status Code</label>
                                                <input 
                                                    type="number" 
                                                    className="input-field w-full py-2 px-3 text-sm bg-background border-border" 
                                                    value={selectedEndpoint.status} 
                                                    onChange={(e) => updateEndpoint({ status: Number(e.target.value) })}
                                                    min={100}
                                                    max={599}
                                                />
                                            </div>
                                        </div>

                                        {/* Stateful Mode (Database Integration) */}
                                        <div className="pt-4 mt-1 border-t border-border">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Database className="w-4 h-4 text-accent" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">State Management</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-success uppercase tracking-wider">Always Enabled</span>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 bg-accent/5 p-3 rounded-xl border border-accent/20">
                                                <div>
                                                    <label className="text-[10px] font-bold text-text-muted uppercase mb-1 block">Query Method</label>
                                                    <select 
                                                        className="input-field w-full py-1.5 px-3 text-xs bg-background border-border"
                                                        value={selectedEndpoint.stateConfig?.operation || ''}
                                                        onChange={(e) => updateEndpoint({ 
                                                            stateConfig: { ...(selectedEndpoint.stateConfig || { enabled: true, collectionId: '', operation: '' }), enabled: true, operation: e.target.value as any } 
                                                        })}
                                                    >
                                                        <option value="">Select a query method...</option>
                                                        {customQueries.map(q => (
                                                            <option key={q.id} value={`custom-${q.id}`}>{q.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="col-span-1">
                                                    <p className="text-[9px] text-text-muted/70 italic flex items-center gap-1">
                                                        <AlertTriangle className="w-3 h-3 text-accent" />
                                                        Selected query method will override the static response body and return results in a data field.
                                                    </p>
                                                    <p className="text-[9px] text-text-muted/60 mt-1.5">
                                                        Use placeholders like <code className="text-accent bg-accent/5 px-1">{"{{body.name}}"}</code> or <code className="text-accent bg-accent/5 px-1">{"{{query.id}}"}</code> inside query methods.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Advanced Settings Accordion */}
                                        <div className="mt-4 border border-border rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => setShowAdvancedConfig(v => !v)}
                                                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-text-muted hover:text-text-primary bg-background-input hover:bg-background-input/80 transition-colors"
                                            >
                                                <span className="flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> Advanced Settings</span>
                                                <span className="text-[10px]">{showAdvancedConfig ? '▲ Collapse' : '▼ Expand'}</span>
                                            </button>
                                            {showAdvancedConfig && (
                                                <div className="px-4 pb-4 pt-3 space-y-4 bg-background">
                                                    {/* Response Headers */}
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <label className="label mb-0 text-xs flex items-center gap-2"><Share2 className="w-3.5 h-3.5" /> Response Headers</label>
                                                            <button
                                                                onClick={() => updateEndpoint({ headers: [...(selectedEndpoint?.headers || []), { id: uuidv4(), key: '', value: '' }] })}
                                                                className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1 border-accent/30 hover:border-accent text-accent"
                                                            >
                                                                <Plus className="w-3 h-3" /> Add Header
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col gap-2">
                                                            {(selectedEndpoint.headers || []).map((header, index) => (
                                                                <div key={header.id} className="flex gap-2 items-center bg-background-input rounded-lg border border-border p-2">
                                                                     <input type="text" placeholder="Key (e.g. X-Powered-By)" className="input-field py-1.5 px-2 text-xs flex-1 bg-background border-border font-mono" value={header.key} onChange={(e) => { const h = [...(selectedEndpoint?.headers || [])]; h[index].key = e.target.value; updateEndpoint({ headers: h }); }} />
                                                                    <div className="text-text-muted">:</div>
                                                                    <input type="text" placeholder="Value..." className="input-field py-1.5 px-2 text-xs flex-1 bg-background border-border font-mono" value={header.value} onChange={(e) => { const h = [...(selectedEndpoint?.headers || [])]; h[index].value = e.target.value; updateEndpoint({ headers: h }); }} />
                                                                    <button onClick={() => { const h = [...(selectedEndpoint?.headers || [])]; h.splice(index, 1); updateEndpoint({ headers: h }); }} className="text-text-muted hover:text-error p-1.5"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                            ))}
                                                            {(!selectedEndpoint.headers || selectedEndpoint.headers.length === 0) && (
                                                                <p className="text-[10px] text-text-muted italic text-center">No custom headers defined. Only standard CORS and Content-Type will be returned.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col flex-1 pb-4">
                                            <div className="flex items-center justify-between mt-4 mb-2">
                                                <div className="flex items-center gap-3">
                                                    <label className="label mb-0">Response JSON Body</label>
                                                    <div className="group relative">
                                                        <Clock className="w-3 h-3 text-accent cursor-help" />
                                                        <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-background border border-border rounded-lg shadow-xl text-[10px] hidden group-hover:block z-50">
                                                            <div className="font-bold text-accent mb-1">Dynamic Interpolation</div>
                                                            Use <code className="text-accent bg-accent/5 px-1">{"{{params.id}}"}</code> to echo path parameters (e.g. /users/:id). <br/>
                                                            Use <code className="text-accent bg-accent/5 px-1">{"{{query.name}}"}</code> for URL search parameters.
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <textarea
                                                value={jsonInput}
                                                onChange={(e) => setJsonInput(e.target.value)}
                                                className={`input-field w-full flex-grow resize-none font-mono text-xs min-h-[250px] ${jsonError ? 'border-error/50' : ''}`}
                                                placeholder='Paste response JSON here...'
                                            />
                                            {jsonError ? (
                                                <div className="bg-error/10 border border-error/20 text-error text-xs p-3 rounded-lg font-mono mt-3">
                                                    Invalid JSON: {jsonError}
                                                </div>
                                            ) : ( 
                                                <div className="bg-background-input border border-border rounded-lg p-3 font-mono text-[10px] overflow-x-auto break-all flex flex-col justify-between items-start mt-3">
                                                    <div className="text-text-muted mb-1 font-bold tracking-wider">ENDPOINT URL:</div>
                                                    {mockBaseUrl ? (
                                                        <span className="text-accent">{selectedEndpoint ? getEndpointUrl(selectedEndpoint) : mockBaseUrl}</span>
                                                    ) : (
                                                        <span className="text-text-muted italic">Waiting for valid configuration...</span>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex gap-3 pt-3">
                                                <button 
                                                    onClick={handleCopy} 
                                                    disabled={!mockBaseUrl || !!jsonError}
                                                    className={`btn-primary flex-1 py-2 text-sm flex items-center justify-center gap-2 ${showCopyFeedback ? 'bg-success hover:bg-success/90 border-success text-white' : ''}`}
                                                >
                                                    {showCopyFeedback ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                                                    {showCopyFeedback ? 'Copied Endpoint URL!' : 'Copy Endpoint URL'}
                                                </button>
                                                <button 
                                                    onClick={() => window.open(selectedEndpoint ? getEndpointUrl(selectedEndpoint) : mockBaseUrl, '_blank')} 
                                                    disabled={!mockBaseUrl || !!jsonError || selectedEndpoint?.method !== 'GET'}
                                                    title={selectedEndpoint?.method !== 'GET' ? "Can only test GET endpoints directly in browser" : "Run and see the result instantly"}
                                                    className="btn-secondary flex-1 py-2 text-sm flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <Play className="w-4 h-4" /> Run GET Request in Browser
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: INSPECTOR */}
                            {activeTab === 'inspector' && (
                                <div className="flex h-full overflow-hidden">
                                    <div className="w-1/3 border-r border-border overflow-y-auto p-2 bg-background-input/30">
                                        <div className="flex items-center justify-between px-2 py-1 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Recent Hooks</span>
                                                {isLogsLoading && (
                                                    <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
                                                )}
                                            </div>
                                            <div className="flex gap-1">
                                                <button 
                                                    onClick={() => {
                                                        setIsLogsLoading(true);
                                                        fetch('/api/mock-logs').then(res => res.json()).then(data => {
                                                            setLogs(data);
                                                            setIsLogsLoading(false);
                                                        }).catch(() => setIsLogsLoading(false));
                                                    }} 
                                                    className="text-text-muted hover:text-accent transition-colors" 
                                                    title="Refresh Logs"
                                                >
                                                    <RefreshCw className={`w-3.5 h-3.5 ${isLogsLoading ? 'animate-spin' : ''}`} />
                                                </button>
                                                <button onClick={clearLogs} className="text-text-muted hover:text-error transition-colors" title="Clear Logs">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                        {logs.length === 0 ? (
                                            <div className="text-center p-4 mt-10">
                                                <Activity className="w-8 h-8 text-text-muted/30 mx-auto mb-2" />
                                                <p className="text-xs text-text-muted">Waiting for incoming requests...</p>
                                                <div className="text-[10px] text-text-muted mt-3 space-y-1">
                                                    <p>To see requests here:</p>
                                                    <ol className="text-left list-decimal list-inside space-y-1">
                                                        <li>Copy the Base URL from Config tab</li>
                                                        <li>Send requests using Postman, curl, or your app</li>
                                                        <li>Requests will appear here instantly</li>
                                                    </ol>
                                                    <p className="mt-2 italic">💡 Tip: You can also use the API Client tab to test your mock endpoints</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col gap-1">
                                                {logs.map(log => (
                                                    <div 
                                                        key={log.id} 
                                                        onClick={() => setSelectedLogId(log.id)}
                                                        className={`p-2.5 rounded-lg cursor-pointer border text-xs transition-colors overflow-hidden group ${selectedLogId === log.id ? 'bg-accent/10 border-accent/40 shadow-sm' : 'bg-background hover:bg-background-input border-transparent hover:border-border'}`}
                                                    >
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${log.method==='GET'?'bg-green-500/10 text-green-500': log.method==='POST'?'bg-blue-500/10 text-blue-500':'bg-yellow-500/10 text-yellow-500'}`}>{log.method}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{log.timeTakenMs}ms</span>
                                                                <span className={`font-bold font-mono text-[11px] ${log.responseStatus >= 400 ? 'text-error' : 'text-success'}`}>{log.responseStatus}</span>
                                                            </div>
                                                        </div>
                                                        <div className="truncate font-mono text-[11px] text-text-primary mb-1">{log.url}</div>
                                                        <div className="text-[9px] text-text-muted truncate">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="w-2/3 overflow-y-auto p-4 bg-background">
                                        {selectedLog ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 pb-4 border-b border-border">
                                                    <span className={`font-bold px-2 py-1 rounded text-xs ${selectedLog?.method==='GET'?'bg-green-500/10 text-green-500': selectedLog?.method==='POST'?'bg-blue-500/10 text-blue-500':'bg-yellow-500/10 text-yellow-500'}`}>{selectedLog?.method}</span>
                                                    <span className="font-mono text-sm break-all flex-1">{selectedLog?.url}</span>
                                                    <button
                                                        onClick={() => selectedLog && initReplay(selectedLog)}
                                                        className="flex items-center gap-1.5 btn-secondary py-1.5 px-3 text-xs border-accent/30 text-accent hover:bg-accent/10 flex-shrink-0"
                                                        title="Open Replay Panel to modify and resend"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5" /> Replay
                                                    </button>
                                                    <button
                                                        onClick={() => selectedLog && openInClient(selectedLog)}
                                                        className="flex items-center gap-1.5 btn-secondary py-1.5 px-3 text-xs border-accent/30 text-accent hover:bg-accent/10 flex-shrink-0"
                                                        title="Open in API Client for full independent control"
                                                    >
                                                        <Send className="w-3.5 h-3.5" /> Open in Client
                                                    </button>
                                                </div>
                                                
                                                {/* Inline Replay Panel */}
                                                {showReplayPanel && (
                                                    <div className="border border-accent/30 rounded-xl p-4 bg-accent/5 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-2"><Zap className="w-3.5 h-3.5" /> Request Replay Editor</h4>
                                                            <button onClick={() => setShowReplayPanel(false)} className="text-text-muted hover:text-error text-xs">✕</button>
                                                        </div>
                                                        <div>
                                                            <label className="label mb-1 text-[10px]">Edit Request Headers (JSON)</label>
                                                            <textarea
                                                                value={replayHeaders}
                                                                onChange={(e) => setReplayHeaders(e.target.value)}
                                                                rows={4}
                                                                className="input-field w-full font-mono text-[11px] resize-none bg-background"
                                                            />
                                                        </div>
                                                        {selectedLog.method !== 'GET' && (
                                                            <div>
                                                                <label className="label mb-1 text-[10px]">Edit Request Body (JSON)</label>
                                                                <textarea
                                                                    value={replayBody}
                                                                    onChange={(e) => setReplayBody(e.target.value)}
                                                                    rows={4}
                                                                    className="input-field w-full font-mono text-[11px] resize-none bg-background"
                                                                />
                                                            </div>
                                                        )}
                                                        <button
                                                            onClick={() => selectedLog && handleReplay(selectedLog)}
                                                            disabled={isReplaying}
                                                            className="btn-primary w-full py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                                                        >
                                                            {isReplaying ? <><span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> Sending...</> : <><Send className="w-3.5 h-3.5" /> Send Replay Request</>}
                                                        </button>
                                                        {replayResult && (
                                                            <div className={`rounded-lg border p-3 ${replayResult.status >= 400 || replayResult.status === 0 ? 'border-error/30 bg-error/5' : 'border-success/30 bg-success/5'}`}>
                                                                <div className="flex items-center justify-between mb-2">
                                                                    <span className={`font-bold font-mono text-sm ${replayResult!.status >= 400 || replayResult!.status === 0 ? 'text-error' : 'text-success'}`}>
                                                                        {replayResult!.status === 0 ? 'Network Error' : `← ${replayResult!.status}`}
                                                                    </span>
                                                                    <span className="text-[10px] text-text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> {replayResult!.time}ms</span>
                                                                </div>
                                                                <pre className="font-mono text-[11px] whitespace-pre-wrap break-all text-text-primary max-h-[120px] overflow-y-auto">{replayResult.body}</pre>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider flex items-center gap-2">Request Headers</h4>
                                                        <div className="bg-background-input border border-border rounded-lg p-3 font-mono text-[11px] overflow-x-auto max-h-[160px] overflow-y-auto">
                                                            {Object.entries(selectedLog.headers).map(([k, v]) => (
                                                                <div key={k} className="mb-1"><span className="text-accent">{k}:</span> <span className="text-text-primary uppercase">{v}</span></div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider flex items-center gap-2">Request Body</h4>
                                                        <div className="bg-background-input border border-border rounded-lg p-3 font-mono text-[11px] overflow-x-auto min-h-[100px] max-h-[160px] overflow-y-auto">
                                                            {selectedLog.body ? (
                                                                <pre className="text-text-primary">{selectedLog.body}</pre>
                                                            ) : (
                                                                <span className="text-text-muted italic">No body payload</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedLog.matchedRules && selectedLog.matchedRules.length > 0 && (
                                                    <div className="p-3 rounded-xl border border-accent/20 bg-accent/5">
                                                        <h4 className="text-[10px] font-bold text-accent uppercase mb-2 flex items-center gap-2"><Filter className="w-3 h-3" /> Routing Logic (Matched Rules)</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {selectedLog.matchedRules.map(rule => (
                                                                <div key={rule.id} className="bg-background border border-accent/30 rounded-md px-2 py-1 text-[10px] font-mono">
                                                                    <span className="text-text-muted">{rule.target}.{rule.propertyPath}</span> <span className="text-accent font-bold">{rule.operator}</span> <span className="text-text-primary">{rule.value || ''}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-border">
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider flex items-center gap-2">Response Headers</h4>
                                                        <div className="bg-background-input border border-border rounded-lg p-3 font-mono text-[11px] overflow-x-auto max-h-[160px] overflow-y-auto">
                                                            {selectedLog?.responseHeaders ? Object.entries(selectedLog.responseHeaders).map(([k, v]) => (
                                                                <div key={k} className="mb-1"><span className="text-accent">{k}:</span> <span className="text-text-primary">{v}</span></div>
                                                            )) : <span className="text-text-muted italic">No response headers logged</span>}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs font-semibold text-text-muted mb-2 uppercase tracking-wider flex items-center gap-2">Response Body</h4>
                                                        <div className="bg-background-input border border-border rounded-lg p-3 font-mono text-[11px] overflow-x-auto min-h-[100px] max-h-[160px] overflow-y-auto">
                                                            {selectedLog?.responseBody ? (
                                                                <pre className="text-text-primary whitespace-pre-wrap break-all">{selectedLog.responseBody}</pre>
                                                            ) : (
                                                                <span className="text-text-muted italic">No response body</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pt-2 text-[10px] text-text-muted pl-1">
                                                    Processed in {selectedLog.timeTakenMs}ms by <span className="text-accent font-bold">{endpoints.find(e => e.id === selectedLog.matchedEndpointId)?.path || 'unknown'}</span> endpoint evaluator
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center h-full opacity-50 space-y-4">
                                                <Activity className="w-16 h-16 text-text-muted mb-4" />
                                                <p className="font-semibold">Select a Request</p>
                                                <p className="text-sm text-text-muted">Click on a logged request from the left list to inspect its details.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB: API CLIENT */}
                            {activeTab === 'client' && (
                                <div className="flex flex-col h-full overflow-hidden bg-background">
                                    {/* Environment & Tab Bar */}
                                    <div className="border-b border-border bg-background-input/30 p-2 flex-none">
                                        <div className="flex items-center justify-between mb-2">
                                            {/* Environment Selector */}
                                            <div className="flex items-center gap-2">
                                                <label className="text-[10px] font-bold text-text-muted uppercase">Environment:</label>
                                                <select 
                                                    value={activeEnvironmentId}
                                                    onChange={(e) => setActiveEnvironmentId(e.target.value)}
                                                    className="input-field py-1 px-2 text-xs bg-background border-border min-w-[150px]"
                                                >
                                                    {environments.map(env => (
                                                        <option key={env.id} value={env.id}>{env.name}</option>
                                                    ))}
                                                </select>
                                                <button 
                                                    onClick={() => setShowEnvModal(true)}
                                                    className="p-1 text-text-muted hover:text-accent transition-colors"
                                                    title="Manage Environments"
                                                >
                                                    <Settings className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            
                                            {/* Save & Code Gen */}
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={saveCurrentRequest}
                                                    className="btn-secondary py-1 px-3 text-xs flex items-center gap-2"
                                                >
                                                    <Save className="w-3.5 h-3.5" /> Save
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        const code = generateCodeSnippet('curl', getActiveTab());
                                                        setGeneratedCode({ language: 'curl', code });
                                                        setShowCodeModal(true);
                                                    }}
                                                    className="btn-secondary py-1 px-3 text-xs flex items-center gap-2"
                                                >
                                                    <Code className="w-3.5 h-3.5" /> Generate Code
                                                </button>
                                                <button 
                                                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                                                    className={`btn-secondary py-1 px-3 text-xs flex items-center gap-2 ${showDebugPanel ? 'bg-accent/10 text-accent' : ''}`}
                                                >
                                                    <Activity className="w-3.5 h-3.5" /> Debug
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Request Tabs */}
                                        <div className="flex items-center gap-1 overflow-x-auto">
                                            {requestTabs.map(tab => (
                                                <div 
                                                    key={tab.id}
                                                    onClick={() => switchTab(tab.id)}
                                                    className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer border-t border-l border-r transition-colors min-w-[150px] max-w-[200px] ${tab.isActive ? 'bg-background border-border border-b-transparent text-accent' : 'bg-background-input/50 border-transparent hover:bg-background-input text-text-muted'}`}
                                                >
                                                    <span className="text-[10px] font-semibold truncate flex-1">{tab.name}</span>
                                                    <span className="text-[9px] font-mono opacity-60">{tab.method}</span>
                                                    {requestTabs.length > 1 && (
                                                        <button 
                                                            onClick={(e) => closeTab(tab.id, e)}
                                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-error/20 hover:text-error rounded transition-all"
                                                        >
                                                            <X className="w-3 h-3" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                                <button 
                                                    onClick={addNewTab}
                                                    className="p-1.5 text-text-muted hover:text-accent hover:bg-background-input rounded transition-colors"
                                                    title="New Request Tab"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    onClick={() => setShowImportModal(true)}
                                                    className="p-1.5 text-text-muted hover:text-accent hover:bg-background-input rounded transition-colors ml-1"
                                                    title="Import cURL"
                                                >
                                                    <Download className="w-4 h-4 rotate-180" />
                                                </button>
                                            </div>
                                    </div>

                                    {/* Request Composer Header */}
                                    <div className="p-3 border-b border-border bg-background-input/20 flex-none">
                                        <div className="flex gap-2 items-center">
                                            <div className="w-28 shrink-0">
                                                <select 
                                                    className="input-field w-full py-2 px-3 text-sm bg-background border-border font-bold text-accent"
                                                    value={getActiveTab().method}
                                                    onChange={(e) => updateActiveTab({ method: e.target.value })}
                                                >
                                                    <option value="GET">GET</option>
                                                    <option value="POST">POST</option>
                                                    <option value="PUT">PUT</option>
                                                    <option value="PATCH">PATCH</option>
                                                    <option value="DELETE">DELETE</option>
                                                </select>
                                            </div>
                                            <div className="flex-1">
                                                <input 
                                                    type="text" 
                                                    className="input-field w-full py-2 px-3 text-sm bg-background border-border font-mono" 
                                                    placeholder="Enter request URL (use {{base_url}} for environment variables)..."
                                                    value={getActiveTab().url}
                                                    onChange={(e) => updateActiveTab({ url: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSendClientRequest()}
                                                />
                                            </div>
                                            <button 
                                                onClick={handleSendClientRequest}
                                                disabled={isClientLoading || !getActiveTab().url}
                                                className="btn-primary px-6 py-2 text-sm flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed min-w-[100px] justify-center"
                                            >
                                                {isClientLoading ? <><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /></> : <><Send className="w-4 h-4" /> Send</>}
                                            </button>
                                        </div>
                                        <div className="mt-2 text-[10px] text-text-muted flex items-center gap-4">
                                            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> Requests are proxied to bypass CORS</span>
                                            <span className="flex items-center gap-1"><Key className="w-3 h-3" /> Use &#123;&#123;variable_name&#125;&#125; for environment vars</span>
                                            {getActiveTab().url.includes('YOUR_CFG_STRING') && (
                                                <span className="flex items-center gap-1 text-red-400 font-bold animate-pulse">
                                                    <AlertTriangle className="w-3 h-3" /> Warning: Replace "YOUR_CFG_STRING" with your actual Workspace Base URL
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-hidden flex flex-col">
                                        {/* Request Editor Pane */}
                                        <div className="h-1/2 border-b border-border flex flex-col overflow-hidden">
                                            <div className="flex bg-background-input/50 border-b border-border">
                                                <button 
                                                    onClick={() => setClientSubTab('params')}
                                                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors ${clientSubTab === 'params' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted'}`}
                                                >
                                                    Params
                                                </button>
                                                <button 
                                                    onClick={() => setClientSubTab('auth')}
                                                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors ${clientSubTab === 'auth' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted'}`}
                                                >
                                                    Auth
                                                </button>
                                                <button 
                                                    onClick={() => setClientSubTab('headers')}
                                                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors ${clientSubTab === 'headers' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted'}`}
                                                >
                                                    Headers ({getActiveTab().headers.filter(h => h.key).length})
                                                </button>
                                                <button 
                                                    onClick={() => setClientSubTab('body')}
                                                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider border-b-2 transition-colors ${clientSubTab === 'body' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted'}`}
                                                >
                                                    Body
                                                </button>
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                                {/* Params Tab */}
                                                {clientSubTab === 'params' && (
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] text-text-muted mb-2">Query parameters will be automatically appended to your URL</p>
                                                        {getActiveTab().queryParams.map((param, index) => (
                                                            <div key={param.id} className="flex gap-2 items-center">
                                                                <input 
                                                                    type="text" 
                                                                    className="input-field flex-1 py-1.5 px-3 text-xs bg-background-input border-border font-mono" 
                                                                    placeholder="Key"
                                                                    value={param.key}
                                                                    onChange={(e) => {
                                                                        const newParams = [...getActiveTab().queryParams];
                                                                        newParams[index].key = e.target.value;
                                                                        updateActiveTab({ queryParams: newParams });
                                                                        if (index === getActiveTab().queryParams.length - 1 && e.target.value) {
                                                                            updateActiveTab({ queryParams: [...newParams, { id: uuidv4(), key: '', value: '' }] });
                                                                        }
                                                                    }}
                                                                />
                                                                <span className="text-text-muted">=</span>
                                                                <input 
                                                                    type="text" 
                                                                    className="input-field flex-1 py-1.5 px-3 text-xs bg-background-input border-border font-mono" 
                                                                    placeholder="Value"
                                                                    value={param.value}
                                                                    onChange={(e) => {
                                                                        const newParams = [...getActiveTab().queryParams];
                                                                        newParams[index].value = e.target.value;
                                                                        updateActiveTab({ queryParams: newParams });
                                                                    }}
                                                                />
                                                                <button 
                                                                    onClick={() => {
                                                                        if (getActiveTab().queryParams.length > 1) {
                                                                            const newParams = getActiveTab().queryParams.filter((_, i) => i !== index);
                                                                            updateActiveTab({ queryParams: newParams });
                                                                        }
                                                                    }}
                                                                    className="p-2 text-text-muted hover:text-error"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Auth Tab */}
                                                {clientSubTab === 'auth' && (
                                                    <div className="max-w-2xl space-y-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Lock className="w-4 h-4 text-accent" />
                                                            <h4 className="text-sm font-bold text-text-primary">Authentication</h4>
                                                        </div>
                                                        
                                                        <div className="flex gap-2 mb-4">
                                                            {(['none', 'bearer', 'apikey', 'basic'] as const).map(type => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => updateActiveTab({ authType: type })}
                                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${getActiveTab().authType === type ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-background-input border-border text-text-muted hover:border-accent/40'}`}
                                                                >
                                                                    {type === 'none' ? 'None' : type === 'bearer' ? 'Bearer Token' : type === 'apikey' ? 'API Key' : 'Basic Auth'}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {getActiveTab().authType === 'bearer' && (
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-bold text-text-muted uppercase">Bearer Token</label>
                                                                <input 
                                                                    type="text" 
                                                                    className="input-field w-full py-2 px-3 text-sm bg-background-input border-border font-mono" 
                                                                    placeholder="Enter your bearer token"
                                                                    value={getActiveTab().authConfig?.token || ''}
                                                                    onChange={(e) => updateActiveTab({ authConfig: { ...getActiveTab().authConfig, token: e.target.value } })}
                                                                />
                                                            </div>
                                                        )}

                                                        {getActiveTab().authType === 'apikey' && (
                                                            <div className="space-y-3">
                                                                <div className="flex gap-2">
                                                                    <div className="flex-1">
                                                                        <label className="text-[10px] font-bold text-text-muted uppercase">Key Name</label>
                                                                        <input 
                                                                            type="text" 
                                                                            className="input-field w-full py-2 px-3 text-sm bg-background-input border-border font-mono" 
                                                                            placeholder="e.g., X-API-Key"
                                                                            value={getActiveTab().authConfig?.key || 'X-API-Key'}
                                                                            onChange={(e) => updateActiveTab({ authConfig: { ...getActiveTab().authConfig, key: e.target.value } })}
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <label className="text-[10px] font-bold text-text-muted uppercase">Key Value</label>
                                                                        <input 
                                                                            type="text" 
                                                                            className="input-field w-full py-2 px-3 text-sm bg-background-input border-border font-mono" 
                                                                            placeholder="Enter API key value"
                                                                            value={getActiveTab().authConfig?.value || ''}
                                                                            onChange={(e) => updateActiveTab({ authConfig: { ...getActiveTab().authConfig, value: e.target.value } })}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    {(['header', 'query'] as const).map(inType => (
                                                                        <button
                                                                            key={inType}
                                                                            onClick={() => updateActiveTab({ authConfig: { ...getActiveTab().authConfig, in: inType } })}
                                                                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${getActiveTab().authConfig?.in === inType ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-background-input border-border text-text-muted'}`}
                                                                        >
                                                                            Add to {inType === 'header' ? 'Header' : 'Query Params'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {getActiveTab().authType === 'basic' && (
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-text-muted uppercase">Username</label>
                                                                    <input 
                                                                        type="text" 
                                                                        className="input-field w-full py-2 px-3 text-sm bg-background-input border-border font-mono" 
                                                                        placeholder="Username"
                                                                        value={getActiveTab().authConfig?.username || ''}
                                                                        onChange={(e) => updateActiveTab({ authConfig: { ...getActiveTab().authConfig, username: e.target.value } })}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-text-muted uppercase">Password</label>
                                                                    <input 
                                                                        type="password" 
                                                                        className="input-field w-full py-2 px-3 text-sm bg-background-input border-border font-mono" 
                                                                        placeholder="Password"
                                                                        value={getActiveTab().authConfig?.password || ''}
                                                                        onChange={(e) => updateActiveTab({ authConfig: { ...getActiveTab().authConfig, password: e.target.value } })}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Headers Tab */}
                                                {clientSubTab === 'headers' && (
                                                    <div className="space-y-2">
                                                        <p className="text-[10px] text-text-muted mb-2">Custom headers to send with the request</p>
                                                        {getActiveTab().headers.map((header, index) => (
                                                            <div key={header.id} className="flex gap-2">
                                                                <input 
                                                                    type="text" 
                                                                    className="input-field flex-1 py-1.5 px-3 text-xs bg-background-input border-border font-mono" 
                                                                    placeholder="Key"
                                                                    value={header.key}
                                                                    onChange={(e) => {
                                                                        const newH = [...getActiveTab().headers];
                                                                        newH[index].key = e.target.value;
                                                                        updateActiveTab({ headers: newH });
                                                                        if (index === getActiveTab().headers.length - 1 && e.target.value) {
                                                                            updateActiveTab({ headers: [...newH, { id: uuidv4(), key: '', value: '' }] });
                                                                        }
                                                                    }}
                                                                />
                                                                <input 
                                                                    type="text" 
                                                                    className="input-field flex-1 py-1.5 px-3 text-xs bg-background-input border-border font-mono" 
                                                                    placeholder="Value"
                                                                    value={header.value}
                                                                    onChange={(e) => {
                                                                        const newH = [...getActiveTab().headers];
                                                                        newH[index].value = e.target.value;
                                                                        updateActiveTab({ headers: newH });
                                                                    }}
                                                                />
                                                                <button 
                                                                    onClick={() => {
                                                                        if (getActiveTab().headers.length > 1) {
                                                                            const newH = getActiveTab().headers.filter((_, i) => i !== index);
                                                                            updateActiveTab({ headers: newH });
                                                                        }
                                                                    }}
                                                                    className="p-2 text-text-muted hover:text-error"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Body Tab */}
                                                {clientSubTab === 'body' && (
                                                    <div className="space-y-3">
                                                        <div className="flex gap-2 mb-2">
                                                            {(['none', 'json', 'form-data', 'urlencoded', 'raw'] as const).map(type => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => updateActiveTab({ bodyType: type })}
                                                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${getActiveTab().bodyType === type ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-background-input border-border text-text-muted'}`}
                                                                >
                                                                    {type === 'none' ? 'None' : type === 'json' ? 'JSON' : type === 'form-data' ? 'Form Data' : type === 'urlencoded' ? 'x-www-form-urlencoded' : 'Raw'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        
                                                        {getActiveTab().bodyType !== 'none' && (
                                                            <textarea 
                                                                className="input-field w-full h-full min-h-[200px] py-3 px-4 text-xs bg-background-input border-border font-mono resize-none focus:ring-0" 
                                                                placeholder={getActiveTab().bodyType === 'json' ? '{\n  "key": "value"\n}' : getActiveTab().bodyType === 'form-data' ? 'key=value\nanother_key=another_value' : 'Enter raw body...'}
                                                                value={getActiveTab().body}
                                                                onChange={(e) => updateActiveTab({ body: e.target.value })}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Response Pane */}
                                        <div className="h-1/2 flex flex-col bg-background-input/20 overflow-hidden">
                                            <div className="px-4 py-2 border-b border-border flex justify-between items-center bg-background">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Response</h3>
                                                    <div className="flex gap-2">
                                                        {(['pretty', 'raw', 'tree'] as const).map(view => (
                                                            <button
                                                                key={view}
                                                                onClick={() => setResponseView(view)}
                                                                className={`px-2 py-1 text-[10px] font-semibold rounded transition-colors ${responseView === view ? 'bg-accent/10 text-accent' : 'text-text-muted hover:text-text'}`}
                                                            >
                                                                {view.toUpperCase()}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {clientResponse && (
                                                    <div className="flex gap-4 items-center">
                                                        <span className={`text-xs font-bold ${clientResponse.status >= 400 ? 'text-error' : 'text-success'}`}>
                                                            {clientResponse.status} {clientResponse.statusText}
                                                        </span>
                                                        <span className="text-[10px] text-text-muted flex items-center gap-1">
                                                            <Clock className="w-3 h-3" /> {clientResponse.time}ms
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                                {clientError && (
                                                    <div className="p-4 rounded-xl border border-error/20 bg-error/5 text-error text-xs font-mono">
                                                        Error: {clientError}
                                                    </div>
                                                )}
                                                {!clientResponse && !clientError && !isClientLoading && (
                                                    <div className="h-full flex flex-col items-center justify-center text-text-muted/40 opacity-50 space-y-3">
                                                        <Activity className="w-12 h-12" />
                                                        <p className="text-sm font-semibold tracking-wide uppercase">No request sent yet</p>
                                                    </div>
                                                )}
                                                {isClientLoading && (
                                                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                                                        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                                                        <p className="text-xs text-text-muted animate-pulse">Waiting for response...</p>
                                                    </div>
                                                )}
                                                {clientResponse && (
                                                    <div className="space-y-4">
                                                        {responseView === 'pretty' && (
                                                            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
                                                                <label className="text-[10px] font-bold text-text-muted uppercase mb-3 block">Response Body</label>
                                                                <pre className="text-xs font-mono text-text-primary whitespace-pre-wrap break-all leading-relaxed max-h-[400px] overflow-y-auto">
                                                                    {(() => {
                                                                        try {
                                                                            return JSON.stringify(JSON.parse(clientResponse.body), null, 2);
                                                                        } catch {
                                                                            return clientResponse.body;
                                                                        }
                                                                    })()}
                                                                </pre>
                                                            </div>
                                                        )}
                                                        {responseView === 'raw' && (
                                                            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
                                                                <label className="text-[10px] font-bold text-text-muted uppercase mb-3 block">Raw Response</label>
                                                                <pre className="text-xs font-mono text-text-primary whitespace-pre-wrap break-all leading-relaxed max-h-[400px] overflow-y-auto">
                                                                    {clientResponse.body}
                                                                </pre>
                                                            </div>
                                                        )}
                                                        {responseView === 'tree' && (
                                                            <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
                                                                <label className="text-[10px] font-bold text-text-muted uppercase mb-3 block">JSON Tree View</label>
                                                                <div className="text-xs font-mono max-h-[400px] overflow-y-auto">
                                                                    {(() => {
                                                                        try {
                                                                            const json = JSON.parse(clientResponse.body);
                                                                            const renderTree = (obj: any, depth: number = 0): React.ReactNode => {
                                                                                if (depth > 5) return <span className="text-text-muted">...</span>;
                                                                                if (typeof obj === 'object' && obj !== null) {
                                                                                    return (
                                                                                        <div className="ml-4">
                                                                                            {Object.entries(obj).map(([k, v]) => (
                                                                                                <div key={k}>
                                                                                                    <span className="text-accent">"{k}"</span>: {renderTree(v as any, depth + 1)}
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    );
                                                                                }
                                                                                return <span className={typeof obj === 'string' ? 'text-success' : typeof obj === 'number' ? 'text-blue-400' : 'text-purple-400'}>{JSON.stringify(obj)}</span>;
                                                                            };
                                                                            return renderTree(json);
                                                                        } catch {
                                                                            return <div className="text-text-muted italic">Not valid JSON</div>;
                                                                        }
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="bg-background border border-border rounded-xl p-4 shadow-sm">
                                                            <label className="text-[10px] font-bold text-text-muted uppercase mb-3 block">Response Headers</label>
                                                            <div className="grid gap-1 max-h-[200px] overflow-y-auto">
                                                                {Object.entries(clientResponse.headers).map(([k, v]) => (
                                                                    <div key={k} className="flex gap-4 text-[11px] border-b border-border/50 py-1 last:border-0">
                                                                        <span className="text-accent font-semibold shrink-0 min-w-[150px]">{k}:</span>
                                                                        <span className="text-text-primary font-mono break-all">{v}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Debug Panel */}
                                    {showDebugPanel && debugInfo && (
                                        <div className="border-t border-border bg-background p-4 max-h-[200px] overflow-y-auto">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="text-xs font-bold text-accent uppercase flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Debug Information</h4>
                                                <button onClick={() => setShowDebugPanel(false)} className="text-text-muted hover:text-error"><X className="w-4 h-4" /></button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Raw Request</label>
                                                    <pre className="text-[11px] font-mono bg-background-input p-2 rounded border border-border">{debugInfo.rawRequest}</pre>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-text-muted uppercase block mb-1">Raw Headers</label>
                                                    <pre className="text-[11px] font-mono bg-background-input p-2 rounded border border-border">{debugInfo.rawHeaders}</pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TAB: DATABASE */}
                            {activeTab === 'database' && (

                                <div className="flex h-full overflow-hidden bg-background">
                                    {/* Unified Database Sidebar */}
                                    <div className="w-64 border-r border-border flex flex-col bg-background-input/10 shrink-0 overflow-hidden">
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                                            {/* Collections Section */}
                                            <div className="space-y-1">
                                                <button 
                                                    onClick={() => setDbExpandedSections(prev => ({ ...prev, collections: !prev.collections }))}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-text-primary transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        {dbExpandedSections.collections ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                        Collections
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="opacity-50 font-mono text-[9px]">[{collections.length}]</span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                document.getElementById('import-collections')?.click();
                                                            }}
                                                            className="p-1 hover:text-accent transition-colors"
                                                            title="Import Collections"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newCol: Collection = { 
                                                                    id: uuidv4(), 
                                                                    name: `collection_${collections.length + 1}`, 
                                                                    fields: [{ id: uuidv4(), name: 'id', type: 'number', required: true, unique: true }], 
                                                                    items: [] 
                                                                };
                                                                setCollections([...collections, newCol]);
                                                                setSelectedCollectionId(newCol.id);
                                                                setSelectedQueryId(null);
                                                                if (dbActiveView === 'queries') setDbActiveView('schema');
                                                                if (!dbExpandedSections.collections) setDbExpandedSections(prev => ({ ...prev, collections: true }));
                                                            }}
                                                            className="p-1 hover:text-accent transition-colors"
                                                            title="Add Collection"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </button>
                                                
                                                {dbExpandedSections.collections && (
                                                    <div className="space-y-0.5 mt-1">
                                                        {collections.map(col => (
                                                            <button
                                                                key={col.id}
                                                                onClick={() => {
                                                                    setSelectedCollectionId(col.id);
                                                                    setSelectedQueryId(null);
                                                                    if (dbActiveView === 'queries') setDbActiveView('schema');
                                                                }}
                                                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${selectedCollectionId === col.id ? 'bg-accent/10 text-accent font-semibold shadow-sm' : 'text-text-muted hover:bg-background-input hover:text-text-primary'}`}
                                                            >
                                                                <span className="flex items-center gap-2 truncate text-left"><Table className="w-3.5 h-3.5 opacity-70 shrink-0" /> {col.name}</span>
                                                            </button>
                                                        ))}
                                                        {collections.length === 0 && <p className="text-[10px] text-text-muted italic px-3 py-4 text-center opacity-40 uppercase tracking-widest">No collections</p>}
                                                    </div>
                                                )}
                                            </div>

                                            {/* SQL Queries Section */}
                                            <div className="space-y-1 border-t border-border/50 pt-4">
                                                <button 
                                                    onClick={() => setDbExpandedSections(prev => ({ ...prev, queries: !prev.queries }))}
                                                    className="w-full flex items-center justify-between px-2 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-text-primary transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        {dbExpandedSections.queries ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                        SQL Queries
                                                    </span>
                                                    <div className="flex items-center gap-1">
                                                        <span className="opacity-50 font-mono text-[9px]">[{customQueries.length}]</span>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newQ: CustomQuery = {
                                                                    id: uuidv4(),
                                                                    name: `query_${customQueries.length + 1}`,
                                                                    collectionId: 'global',
                                                                    code: collections.length > 0 ? `SELECT * FROM ${collections[0].name}` : 'SELECT * FROM table'
                                                                };
                                                                setCustomQueries([...customQueries, newQ]);
                                                                setSelectedQueryId(newQ.id);
                                                                setSelectedCollectionId(null);
                                                                setDbActiveView('queries');
                                                                if (!dbExpandedSections.queries) setDbExpandedSections(prev => ({ ...prev, queries: true }));
                                                            }}
                                                            className="p-1 hover:text-accent transition-colors"
                                                            title="New SQL Query"
                                                        >
                                                            <Plus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </button>
                                                
                                                {dbExpandedSections.queries && (
                                                    <div className="space-y-0.5 mt-1">
                                                        {customQueries.map(q => (
                                                            <button
                                                                key={q.id}
                                                                onClick={() => {
                                                                    setSelectedQueryId(q.id);
                                                                    setSelectedCollectionId(null);
                                                                    setDbActiveView('queries');
                                                                }}
                                                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all ${selectedQueryId === q.id ? 'bg-accent/10 text-accent font-semibold shadow-sm' : 'text-text-muted hover:bg-background-input hover:text-text-primary'}`}
                                                            >
                                                                <span className="flex items-center gap-2 truncate text-left"><Terminal className="w-3.5 h-3.5 opacity-70 shrink-0" /> {q.name}</span>
                                                            </button>
                                                        ))}
                                                        {customQueries.length === 0 && <p className="text-[10px] text-text-muted italic px-3 py-4 text-center opacity-40 uppercase tracking-widest">No queries</p>}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="p-4 border-t border-border shrink-0">
                                            <button 
                                                onClick={() => {
                                                    if (confirm("Clear all database content (collections and queries)? This cannot be undone.")) {
                                                        setCollections([]);
                                                        setCustomQueries([]);
                                                        setSelectedCollectionId(null);
                                                        setSelectedQueryId(null);
                                                    }
                                                }}
                                                className="w-full btn-secondary py-1.5 px-3 text-[10px] font-bold text-error hover:bg-error/10 hover:border-error/30 flex items-center justify-center gap-2 uppercase tracking-widest"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" /> Reset Database
                                            </button>
                                        </div>
                                    </div>

                                    {/* Database Content Area */}
                                    <div className="flex-1 overflow-hidden flex flex-col bg-background">
                                        {selectedCollectionId ? (() => {
                                            const collection = collections.find(c => c.id === selectedCollectionId);
                                            if (!collection) return null;
                                            return (
                                                <div className="h-full flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
                                                    {/* Tabs for Collection Views */}
                                                    <div className="flex border-b border-border bg-background-input/30 px-4 shrink-0">
                                                        <button 
                                                            onClick={() => setDbActiveView('schema')}
                                                            className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${dbActiveView === 'schema' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                                                        >
                                                            Schema Design
                                                        </button>
                                                        <button 
                                                            onClick={() => setDbActiveView('data')}
                                                            className={`px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${dbActiveView === 'data' ? 'border-accent text-accent bg-background' : 'border-transparent text-text-muted hover:text-text-primary'}`}
                                                        >
                                                            Data Explorer
                                                        </button>
                                                    </div>

                                                    <div className="flex-1 overflow-hidden flex flex-col">
                                                        <div className="p-4 border-b border-border flex items-center justify-between bg-background-input/20 shrink-0">
                                                            <div className="flex items-center gap-4">
                                                                <div className="relative group">
                                                                    <input 
                                                                        type="text" 
                                                                        className="bg-transparent border-none focus:ring-0 text-lg font-bold p-0 text-text-primary hover:text-accent transition-colors min-w-[200px]"
                                                                        value={collection.name}
                                                                        onChange={(e) => {
                                                                            setCollections(collections.map(c => c.id === collection.id ? { ...c, name: e.target.value } : c));
                                                                        }}
                                                                    />
                                                                    <Edit2 className="w-3.5 h-3.5 absolute -right-5 top-1.5 opacity-0 group-hover:opacity-100 text-accent transition-opacity" />
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => {
                                                                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(collection, null, 2));
                                                                        const downloadAnchorNode = document.createElement('a');
                                                                        downloadAnchorNode.setAttribute("href", dataStr);
                                                                        downloadAnchorNode.setAttribute("download", `${collection.name}_collection.json`);
                                                                        document.body.appendChild(downloadAnchorNode);
                                                                        downloadAnchorNode.click();
                                                                        downloadAnchorNode.remove();
                                                                    }}
                                                                    className="btn-secondary py-1.5 px-3 text-[10px] font-bold uppercase tracking-tight flex items-center gap-2"
                                                                >
                                                                    <Download className="w-3.5 h-3.5" /> Export
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        if (confirm(`Delete collection "${collection.name}"?`)) {
                                                                            setCollections(collections.filter(c => c.id !== collection.id));
                                                                            setSelectedCollectionId(null);
                                                                        }
                                                                    }}
                                                                    className="btn-secondary py-1.5 px-3 text-[10px] font-bold text-error hover:bg-error/10 hover:border-error/30 flex items-center gap-2 uppercase tracking-tight"
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> Delete
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 overflow-hidden">
                                                            {dbActiveView === 'schema' ? (
                                                                <div className="h-full overflow-y-auto p-6 bg-background custom-scrollbar">
                                                                    <div className="max-w-4xl space-y-6">
                                                                        <div className="flex items-center justify-between">
                                                                            <div>
                                                                                <h4 className="text-sm font-bold text-text-primary">Schema Definition</h4>
                                                                                <p className="text-xs text-text-muted mt-0.5">Define fields and data types for this collection.</p>
                                                                            </div>
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const newCols = [...collections];
                                                                                    const idx = newCols.findIndex(c => c.id === collection.id);
                                                                                    newCols[idx].fields.push({ id: uuidv4(), name: 'new_field', type: 'string', required: false, unique: false });
                                                                                    setCollections(newCols);
                                                                                }}
                                                                                className="btn-primary py-1.5 px-4 text-xs font-bold uppercase tracking-tight flex items-center gap-2"
                                                                            >
                                                                                <Plus className="w-4 h-4" /> Add Field
                                                                            </button>
                                                                        </div>
                                                                        
                                                                        <div className="bg-background-input/30 border border-border rounded-xl overflow-hidden shadow-sm">
                                                                            <table className="w-full text-left text-xs">
                                                                                <thead className="bg-background-input/50 border-b border-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                                                                    <tr>
                                                                                        <th className="px-4 py-3">Field Name</th>
                                                                                        <th className="px-4 py-3">Type</th>
                                                                                        <th className="px-4 py-3">Required</th>
                                                                                        <th className="px-4 py-3">Unique</th>
                                                                                        <th className="px-4 py-3 text-right">Actions</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-border/50">
                                                                                    {collection.fields.map((field, fIdx) => (
                                                                                        <tr key={field.id} className="hover:bg-background-input/50 transition-colors">
                                                                                            <td className="px-4 py-3">
                                                                                                <input 
                                                                                                    className="bg-transparent border-none focus:ring-0 p-0 text-text-primary font-mono text-xs w-full"
                                                                                                    value={field.name}
                                                                                                    onChange={(e) => {
                                                                                                        const newCols = [...collections];
                                                                                                        const cIdx = newCols.findIndex(c => c.id === collection.id);
                                                                                                        newCols[cIdx].fields[fIdx].name = e.target.value;
                                                                                                        setCollections(newCols);
                                                                                                    }}
                                                                                                />
                                                                                            </td>
                                                                                            <td className="px-4 py-3">
                                                                                                <select 
                                                                                                    className="bg-transparent border-none focus:ring-0 p-0 text-accent text-xs font-bold uppercase tracking-tight"
                                                                                                    value={field.type}
                                                                                                    onChange={(e) => {
                                                                                                        const newCols = [...collections];
                                                                                                        const cIdx = newCols.findIndex(c => c.id === collection.id);
                                                                                                        newCols[cIdx].fields[fIdx].type = e.target.value as any;
                                                                                                        setCollections(newCols);
                                                                                                    }}
                                                                                                >
                                                                                                    <option value="string">String</option>
                                                                                                    <option value="number">Number</option>
                                                                                                    <option value="boolean">Boolean</option>
                                                                                                    <option value="date">Date</option>
                                                                                                    <option value="object">Object</option>
                                                                                                    <option value="array">Array</option>
                                                                                                </select>
                                                                                            </td>
                                                                                            <td className="px-4 py-3">
                                                                                                <input 
                                                                                                    type="checkbox"
                                                                                                    checked={field.required}
                                                                                                    onChange={(e) => {
                                                                                                        const newCols = [...collections];
                                                                                                        const cIdx = newCols.findIndex(c => c.id === collection.id);
                                                                                                        newCols[cIdx].fields[fIdx].required = e.target.checked;
                                                                                                        setCollections(newCols);
                                                                                                    }}
                                                                                                    className="rounded border-border text-accent focus:ring-accent bg-transparent"
                                                                                                />
                                                                                            </td>
                                                                                            <td className="px-4 py-3">
                                                                                                <input 
                                                                                                    type="checkbox"
                                                                                                    checked={field.unique || false}
                                                                                                    onChange={(e) => {
                                                                                                        const newCols = [...collections];
                                                                                                        const cIdx = newCols.findIndex(c => c.id === collection.id);
                                                                                                        newCols[cIdx].fields[fIdx].unique = e.target.checked;
                                                                                                        setCollections(newCols);
                                                                                                    }}
                                                                                                    className="rounded border-border text-accent focus:ring-accent bg-transparent"
                                                                                                />
                                                                                            </td>
                                                                                            <td className="px-4 py-3 text-right">
                                                                                                <button 
                                                                                                    onClick={() => {
                                                                                                        const newCols = [...collections];
                                                                                                        const cIdx = newCols.findIndex(c => c.id === collection.id);
                                                                                                        newCols[cIdx].fields.splice(fIdx, 1);
                                                                                                        setCollections(newCols);
                                                                                                    }}
                                                                                                    className="text-text-muted hover:text-error p-1 transition-colors"
                                                                                                >
                                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                                </button>
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="h-full flex flex-col overflow-hidden">
                                                                    {/* Data Explorer Content Area */}
                                                                    <div className="p-4 border-b border-border bg-background-input/10 flex items-center justify-between shrink-0">
                                                                        <div className="flex items-center gap-4">
                                                                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{collection.items.length} Records found</p>
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            <button 
                                                                                onClick={() => {
                                                                                    const newItem: any = { id: uuidv4() };
                                                                                    collection.fields.forEach(f => {
                                                                                        if (f.name !== 'id') {
                                                                                            newItem[f.name] = f.type === 'number' ? 0 : f.type === 'boolean' ? false : '';
                                                                                        }
                                                                                    });
                                                                                    const newCols = [...collections];
                                                                                    const idx = newCols.findIndex(c => c.id === collection.id);
                                                                                    newCols[idx].items.unshift(newItem);
                                                                                    setCollections(newCols);
                                                                                }}
                                                                                className="btn-primary py-1.5 px-4 text-xs font-bold uppercase tracking-tight flex items-center gap-2"
                                                                            >
                                                                                <Plus className="w-4 h-4" /> Add Record
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex-1 overflow-auto custom-scrollbar bg-background">
                                                                        <table className="w-full text-left text-xs border-collapse min-w-max">
                                                                            <thead className="bg-background-input/50 sticky top-0 z-10 border-b border-border text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                                                                <tr>
                                                                                    {collection.fields.map(f => (
                                                                                        <th key={f.id} className="px-4 py-3 border-r border-border last:border-r-0 min-w-[150px]">{f.name}</th>
                                                                                    ))}
                                                                                    <th className="px-4 py-3 text-right sticky right-0 bg-background-input/50">Actions</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                {collection.items.map((item, rowIdx) => (
                                                                                    <tr key={rowIdx} className="border-b border-border last:border-0 hover:bg-background-input/30 transition-colors">
                                                                                        {collection.fields.map(f => (
                                                                                            <td key={f.id} className="px-4 py-2 border-r border-border last:border-r-0">
                                                                                                <input 
                                                                                                    className="w-full bg-transparent border-none focus:ring-0 p-1 font-mono text-[11px] text-text-primary"
                                                                                                    value={typeof item[f.name] === 'object' ? JSON.stringify(item[f.name]) : (item[f.name] ?? '')}
                                                                                                    onChange={(e) => {
                                                                                                        const newCols = [...collections];
                                                                                                        const idx = newCols.findIndex(c => c.id === collection.id);
                                                                                                        let val: any = e.target.value;
                                                                                                        if (f.type === 'number') val = Number(val);
                                                                                                        if (f.type === 'boolean') val = val.toLowerCase() === 'true';
                                                                                                        newCols[idx].items[rowIdx][f.name] = val;
                                                                                                        setCollections(newCols);
                                                                                                    }}
                                                                                                />
                                                                                            </td>
                                                                                        ))}
                                                                                        <td className="px-4 py-2 text-right sticky right-0 bg-background/80 backdrop-blur-sm">
                                                                                            <button 
                                                                                                onClick={() => {
                                                                                                    const newCols = [...collections];
                                                                                                    const idx = newCols.findIndex(c => c.id === collection.id);
                                                                                                    newCols[idx].items.splice(rowIdx, 1);
                                                                                                    setCollections(newCols);
                                                                                                }}
                                                                                                className="text-text-muted hover:text-error p-1"
                                                                                            >
                                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                                            </button>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                                {collection.items.length === 0 && (
                                                                                    <tr>
                                                                                        <td colSpan={collection.fields.length + 1} className="text-center py-20 text-text-muted italic opacity-50 uppercase tracking-widest text-[10px]">No records in this collection</td>
                                                                                    </tr>
                                                                                )}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })() : selectedQueryId ? (() => {
                                            const query = customQueries.find(q => q.id === selectedQueryId);
                                            if (!query) return null;
                                            return (
                                                <div className="flex flex-col h-full overflow-hidden animate-in fade-in slide-in-from-right-2 duration-300">
                                                    <div className="p-4 border-b border-border flex items-center justify-between bg-background-input/20">
                                                        <div className="flex items-center gap-3 flex-1">
                                                            <Terminal className="w-5 h-5 text-accent" />
                                                            <input 
                                                                className="bg-transparent border-none focus:ring-0 text-lg font-bold p-0 text-text-primary hover:text-accent transition-colors w-full max-w-[300px]"
                                                                value={query.name}
                                                                placeholder="Query Name..."
                                                                onChange={(e) => {
                                                                    setCustomQueries(customQueries.map(q => q.id === query.id ? { ...q, name: e.target.value } : q));
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button 
                                                                onClick={() => {
                                                                    try {
                                                                        const formatted = format(query.code, { language: 'sql' });
                                                                        setCustomQueries(customQueries.map(q => q.id === query.id ? { ...q, code: formatted } : q));
                                                                    } catch (e) {
                                                                        console.error("SQL Format Error:", e);
                                                                    }
                                                                }}
                                                                className="btn-secondary py-1.5 px-3 text-[10px] font-bold uppercase tracking-tight flex items-center gap-2"
                                                            >
                                                                <Zap className="w-3.5 h-3.5" /> Format
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    if (confirm(`Delete SQL query "${query.name}"?`)) {
                                                                        setCustomQueries(customQueries.filter(q => q.id !== query.id));
                                                                        setSelectedQueryId(null);
                                                                    }
                                                                }}
                                                                className="btn-secondary py-1.5 px-3 text-[10px] font-bold text-error hover:bg-error/10 hover:border-error/30 flex items-center gap-2 uppercase tracking-tight"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" /> Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-background">
                                                        <div className="flex flex-col border border-border rounded-xl overflow-hidden shadow-2xl">
                                                            <div className="bg-[#1a1b26] px-4 py-2 border-b border-white/5 text-[10px] font-bold text-accent flex justify-between items-center tracking-widest">
                                                                <span>SQL EDITOR</span>
                                                                <span className="text-[9px] opacity-50 font-normal">Supports SELECT, INSERT, UPDATE, DELETE, WHERE</span>
                                                            </div>
                                                            <textarea 
                                                                className="w-full h-96 bg-[#0d1117] text-gray-300 font-mono text-sm p-6 border-none focus:ring-0 resize-none custom-scrollbar"
                                                                value={query.code}
                                                                placeholder="SELECT * FROM table..."
                                                                onChange={(e) => setCustomQueries(customQueries.map(q => q.id === query.id ? { ...q, code: e.target.value } : q))}
                                                                spellCheck={false}
                                                            />
                                                        </div>
                                                        <div className="p-4 rounded-xl border border-accent/20 bg-accent/5 space-y-3">
                                                            <h5 className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                                                                <Database className="w-3.5 h-3.5" /> Database Context
                                                            </h5>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Available Tables</p>
                                                                    <div className="flex flex-wrap gap-1.5">
                                                                        {collections.map(c => (
                                                                            <span key={c.id} className="bg-background border border-border rounded px-2 py-0.5 text-[10px] font-mono text-text-primary">{c.name}</span>
                                                                        ))}
                                                                        {collections.length === 0 && <span className="text-[10px] text-text-muted italic opacity-50 uppercase tracking-widest">No tables found</span>}
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Relational Example</p>
                                                                    <code className="text-[10px] text-accent font-mono block bg-background p-2 rounded border border-accent/10">
                                                                        SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.userId
                                                                    </code>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <div className="h-full flex flex-col items-center justify-center text-text-muted/40 p-12 text-center bg-background/50 animate-in fade-in zoom-in-95 duration-500">
                                                <Database className="w-20 h-20 mb-6 opacity-5" />
                                                <h4 className="text-xl font-bold text-text/60 tracking-tight">Database Central</h4>
                                                <p className="max-w-md text-sm mt-3 leading-relaxed">Manage your mock schemas, explore generated data, or write powerful relational SQL queries across all your collections.</p>
                                                <div className="flex gap-4 mt-10">
                                                    <button onClick={() => setDbExpandedSections({ ...dbExpandedSections, collections: true })} className="px-8 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"><Table className="w-4 h-4" /> Tables</button>
                                                    <button onClick={() => setDbExpandedSections({ ...dbExpandedSections, queries: true })} className="px-8 py-2.5 rounded-xl bg-background border border-border text-text-primary font-bold text-xs uppercase tracking-widest hover:bg-background-input active:scale-95 transition-all flex items-center gap-2"><Terminal className="w-4 h-4" /> Queries</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* Code Generation Modal */}
            {showCodeModal && generatedCode && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-background-input">
                            <div className="flex items-center gap-3">
                                <Code className="w-5 h-5 text-accent" />
                                <h3 className="text-lg font-bold text-text-primary">Generated Code</h3>
                            </div>
                            <div className="flex gap-2">
                                <select 
                                    value={generatedCode.language}
                                    onChange={(e) => {
                                        const code = generateCodeSnippet(e.target.value, getActiveTab());
                                        setGeneratedCode({ language: e.target.value, code });
                                    }}
                                    className="input-field py-1.5 px-3 text-xs bg-background border-border"
                                >
                                    <option value="curl">cURL</option>
                                    <option value="fetch">JavaScript (Fetch)</option>
                                    <option value="axios">JavaScript (Axios)</option>
                                    <option value="python">Python</option>
                                </select>
                                <button 
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedCode.code);
                                        setShowCodeModal(false);
                                    }}
                                    className="btn-primary py-1.5 px-4 text-xs flex items-center gap-2"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Copy
                                </button>
                                <button 
                                    onClick={() => setShowCodeModal(false)}
                                    className="p-2 text-text-muted hover:text-error transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto p-4 bg-[#0d1117]">
                            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">
                                {generatedCode.code}
                            </pre>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-background-input">
                            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <Download className="w-5 h-5 text-accent rotate-180" /> Import cURL Request
                            </h3>
                            <button onClick={() => setShowImportModal(false)} className="p-2 text-text-muted hover:text-error transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-text-muted">Paste a cURL command below to import it as a new request tab. Standard flags like -X, -H, and -d are supported.</p>
                            <textarea 
                                className="input-field w-full h-48 font-mono text-xs bg-background-input border-border p-4 resize-none"
                                placeholder="curl -X POST https://api.example.com/data -H 'Authorization: Bearer mytoken' -d '{&quot;key&quot;:&quot;value&quot;}'"
                                value={importCurlInput}
                                onChange={(e) => setImportCurlInput(e.target.value)}
                            />
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => setShowImportModal(false)} className="btn-secondary py-2 px-6">Cancel</button>
                                <button 
                                    onClick={() => handleImportCurl(importCurlInput)}
                                    disabled={!importCurlInput.trim()}
                                    className="btn-primary py-2 px-6 flex items-center gap-2 disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" /> Import as Tab
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Environment Management Modal */}
            {showEnvModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="p-4 border-b border-border flex items-center justify-between bg-background-input">
                            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                                <Globe className="w-5 h-5 text-accent" /> Manage Environments
                            </h3>
                            <button onClick={() => setShowEnvModal(false)} className="p-2 text-text-muted hover:text-error transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex flex-1 overflow-hidden">
                            {/* Env Sidebar */}
                            <div className="w-1/3 border-r border-border bg-background-input/30 p-4 space-y-2 overflow-y-auto">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Environments</span>
                                    <button 
                                        onClick={() => {
                                            const newEnv: Environment = { id: uuidv4(), name: 'New Environment', variables: {} };
                                            setEnvironments([...environments, newEnv]);
                                            setEditingEnvId(newEnv.id);
                                        }}
                                        className="text-accent hover:text-accent-highlight p-1"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                {environments.map(env => (
                                    <div 
                                        key={env.id}
                                        onClick={() => setEditingEnvId(env.id)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${editingEnvId === env.id ? 'bg-accent/10 border-accent/40 text-accent' : 'bg-background border-border hover:border-accent/20'}`}
                                    >
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className={`w-2 h-2 rounded-full ${activeEnvironmentId === env.id ? 'bg-accent animate-pulse' : 'bg-text-muted/30'}`} />
                                            <span className="text-xs font-semibold truncate">{env.name}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setEnvironments(environments.filter(ev => ev.id !== env.id)); if(editingEnvId === env.id) setEditingEnvId(null); }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-error transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Env Editor */}
                            <div className="flex-1 p-6 overflow-y-auto bg-background">
                                {editingEnvId ? (() => {
                                    const env = environments.find(e => e.id === editingEnvId);
                                    if (!env) return null;
                                    return (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="label mb-1">Environment Name</label>
                                                <input 
                                                    type="text" 
                                                    className="input-field w-full py-2 px-3 text-sm bg-background-input"
                                                    value={env.name}
                                                    onChange={(e) => setEnvironments(environments.map(ev => ev.id === env.id ? { ...ev, name: e.target.value } : ev))}
                                                />
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Variables</h4>
                                                    <button 
                                                        onClick={() => {
                                                            const newVars = { ...env.variables, "": "" };
                                                            setEnvironments(environments.map(ev => ev.id === env.id ? { ...ev, variables: newVars } : ev));
                                                        }}
                                                        className="btn-secondary py-1 px-2 text-[10px] flex items-center gap-1 border-accent/30 text-accent font-bold"
                                                    >
                                                        <Plus className="w-3 h-3" /> Add Variable
                                                    </button>
                                                </div>
                                                
                                                <div className="border border-border rounded-xl overflow-hidden">
                                                    <table className="w-full text-left text-xs">
                                                        <thead>
                                                            <tr className="bg-background-input border-b border-border text-text-muted uppercase text-[10px] font-bold">
                                                                <th className="px-4 py-3 border-r border-border">Variable Name</th>
                                                                <th className="px-4 py-3 border-r border-border">Current Value</th>
                                                                <th className="px-4 py-3 w-12"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Object.entries(env.variables).map(([key, val], idx) => (
                                                                <tr key={idx} className="border-b border-border last:border-0 hover:bg-background-input/20 transition-colors">
                                                                    <td className="px-2 py-1 border-r border-border">
                                                                        <input 
                                                                            className="w-full bg-transparent border-none focus:ring-0 p-1.5 font-mono text-[11px] text-accent"
                                                                            value={key}
                                                                            placeholder="VARIABLE_KEY"
                                                                            onChange={(e) => {
                                                                                const newKey = e.target.value;
                                                                                const newVars: Record<string, string> = {};
                                                                                Object.entries(env.variables).forEach(([k, v], i) => {
                                                                                    if (i === idx) newVars[newKey] = v;
                                                                                    else newVars[k] = v;
                                                                                });
                                                                                setEnvironments(environments.map(ev => ev.id === env.id ? { ...ev, variables: newVars } : ev));
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-1 border-r border-border">
                                                                        <input 
                                                                            className="w-full bg-transparent border-none focus:ring-0 p-1.5 font-mono text-[11px] text-text-primary"
                                                                            value={val}
                                                                            placeholder="value"
                                                                            onChange={(e) => {
                                                                                const newVal = e.target.value;
                                                                                const newVars = { ...env.variables, [key]: newVal };
                                                                                setEnvironments(environments.map(ev => ev.id === env.id ? { ...ev, variables: newVars } : ev));
                                                                            }}
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-1 text-center">
                                                                        <button 
                                                                            onClick={() => {
                                                                                const newVars = { ...env.variables };
                                                                                delete newVars[key];
                                                                                setEnvironments(environments.map(ev => ev.id === env.id ? { ...ev, variables: newVars } : ev));
                                                                            }}
                                                                            className="text-text-muted hover:text-error p-1"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            {Object.keys(env.variables).length === 0 && (
                                                                <tr>
                                                                    <td colSpan={3} className="text-center py-8 text-text-muted italic bg-background-input/10">No variables defined for this environment.</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <p className="text-[10px] text-text-muted italic flex items-center gap-1.5 mt-2">
                                                    <AlertTriangle className="w-3 h-3 text-accent" />
                                                    Use these in requests via <code className="text-accent bg-accent/5 px-1 font-bold">{"{{variable_name}}"}</code>
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div className="h-full flex flex-col items-center justify-center text-text-muted/40 text-center opacity-60">
                                        <Globe className="w-16 h-16 mb-4 opacity-10" />
                                        <h4 className="font-bold">No Environment Selected</h4>
                                        <p className="text-xs mt-1">Select an environment from the left to edit its variables.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="p-4 border-t border-border bg-background-input/20 flex justify-end">
                            <button onClick={() => setShowEnvModal(false)} className="btn-primary py-2 px-8">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </ToolLayout>
    );
}
