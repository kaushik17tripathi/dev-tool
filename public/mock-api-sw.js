const DB_NAME = 'mockcore-db-v3';
const STORE_NAME = 'endpoints';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

function getEndpointsFromDB() {
    return new Promise((resolve) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                resolve([]);
                return;
            }
            const transaction = db.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const getAll = store.getAll();
            getAll.onsuccess = () => resolve(getAll.result);
            getAll.onerror = () => resolve([]);
        };
        request.onerror = () => resolve([]);
    });
}

function matchPath(pattern, path) {
    const patternParts = String(pattern || '').split('/').filter(p => p !== '');
    const pathParts = path.split('/').filter(p => p !== '');

    if (patternParts.length !== pathParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) continue;
        if (patternParts[i] !== pathParts[i]) return false;
    }
    return true;
}

function normalizeEndpointPath(path) {
    let normalized = String(path || '/').trim();
    if (!normalized.startsWith('/')) normalized = '/' + normalized;
    return normalized;
}

function stripMockPrefix(pathname) {
    if (pathname.startsWith('/mock/')) {
        const stripped = pathname.slice('/mock'.length);
        return stripped.startsWith('/') ? stripped : '/' + stripped;
    }
    return pathname;
}

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    
    if (url.origin === self.location.origin && (url.pathname.startsWith('/mock/') || url.pathname.startsWith('/api/'))) {
        event.respondWith(
            getEndpointsFromDB().then((endpoints) => {
                const requestPath = normalizeEndpointPath(url.pathname);
                const requestPathNoMockPrefix = normalizeEndpointPath(stripMockPrefix(url.pathname));

                const match = endpoints.find(e => {
                    const methodMatch = e.method === event.request.method;
                    const endpointPath = normalizeEndpointPath(e.url);
                    const pathMatch = matchPath(endpointPath, requestPath) || matchPath(endpointPath, requestPathNoMockPrefix);
                    return methodMatch && pathMatch;
                });

                if (match) {
                    const body = typeof match.body === 'string' 
                        ? match.body 
                        : JSON.stringify(match.body);
                    
                    return new Response(body, {
                        status: match.status,
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Mock-Engine': 'MOCKCORE_DIR_V1'
                        }
                    });
                }
                return fetch(event.request);
            })
        );
    }
});
