export interface Folder {
    id: string;
    name: string;
    parentId?: string | null;
}

export interface MockEndpoint {
    id: string;
    folderId?: string | null;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    status: number;
    body: any;
}

const STORAGE_KEY = 'mockcore-v3-pro'; // New key for the structural migration
const DB_NAME = 'mockcore-db-v3';
const STORE_NAME = 'endpoints';

const syncToIDB = async (endpoints: MockEndpoint[]) => {
    if (typeof window === 'undefined') return;
    
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        
        request.onupgradeneeded = (e: any) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        
        request.onsuccess = (e: any) => {
            const db = e.target.result;
            const transaction = db.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            
            const clearReq = store.clear();
            clearReq.onsuccess = () => {
                endpoints.forEach(endpoint => store.add(endpoint));
                resolve(true);
            };
        };
        
        request.onerror = () => reject(request.error);
    });
};

export const storage = {
    getWorkspace: (): { endpoints: MockEndpoint[], folders: Folder[] } => {
        if (typeof window === 'undefined') return { endpoints: [], folders: [] };
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            return JSON.parse(data);
        }
        return { endpoints: [], folders: [] };
    },

    saveWorkspace: async (endpoints: MockEndpoint[], folders: Folder[]) => {
        const workspace = { endpoints, folders };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
        await syncToIDB(endpoints); // IDB only needs endpoints for the Service Worker
    },

    saveEndpoint: async (endpoint: MockEndpoint, folders: Folder[]) => {
        const { endpoints } = storage.getWorkspace();
        const index = endpoints.findIndex(e => e.id === endpoint.id);
        if (index > -1) {
            endpoints[index] = endpoint;
        } else {
            endpoints.push(endpoint);
        }
        await storage.saveWorkspace(endpoints, folders);
    },

    deleteEndpoint: async (id: string, folders: Folder[]) => {
        const { endpoints } = storage.getWorkspace();
        const updated = endpoints.filter(e => e.id !== id);
        await storage.saveWorkspace(updated, folders);
    },

    importAll: async (endpoints: MockEndpoint[], folders: Folder[]) => {
        await storage.saveWorkspace(endpoints, folders);
    }
};
