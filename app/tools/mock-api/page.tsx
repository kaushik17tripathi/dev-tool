"use client";

import React, { useState, useEffect, useRef } from 'react';
import { EndpointList } from './components/EndpointList';
import { EndpointEditor } from './components/EndpointEditor';
import { storage, MockEndpoint, Folder } from './lib/storage';
import { Activity, Download, Upload, Trash2, Cpu } from 'lucide-react';

export default function MockApiPage() {
    const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [activeEndpoint, setActiveEndpoint] = useState<MockEndpoint | null>(null);
    const [isSwRegistered, setIsSwRegistered] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/mock-api-sw.js')
                .then(reg => {
                    console.log('SW Registered:', reg.scope);
                    setIsSwRegistered(true);
                })
                .catch(err => console.error('SW Registration Failed:', err));
        }
        const rootWorkspace = storage.getWorkspace();
        setEndpoints(rootWorkspace.endpoints);
        setFolders(rootWorkspace.folders);
        setIsLoaded(true);
    }, []);

    const syncState = async (newEndpoints: MockEndpoint[], newFolders: Folder[]) => {
        setEndpoints(newEndpoints);
        setFolders(newFolders);
        await storage.saveWorkspace(newEndpoints, newFolders);
    };

    const handleSave = async (endpoint: MockEndpoint) => {
        const updated = endpoints.map(e => e.id === endpoint.id ? endpoint : e);
        if (!endpoints.find(e => e.id === endpoint.id)) {
            updated.push(endpoint);
        }
        await syncState(updated, folders);
        setActiveEndpoint(endpoint);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Dismantle this mock node?')) return;
        const updated = endpoints.filter(e => e.id !== id);
        await syncState(updated, folders);
        if (activeEndpoint?.id === id) setActiveEndpoint(null);
    };

    const handleDeleteFolder = async (id: string) => {
        if (!confirm(`Execute recursive wipe of directory?`)) return;
        
        // Find all descendant folders
        const getDescendants = (folderId: string): string[] => {
            const children = folders.filter(f => f.parentId === folderId).map(f => f.id);
            return children.reduce((acc, childId) => [...acc, ...getDescendants(childId)], children);
        };
        
        const toDeleteFolderIds = [id, ...getDescendants(id)];
        
        // Remove folders
        const newFolders = folders.filter(f => !toDeleteFolderIds.includes(f.id));
        // Remove endpoints assigned to any deleted folder
        const newEndpoints = endpoints.filter(e => !e.folderId || !toDeleteFolderIds.includes(e.folderId));
        
        await syncState(newEndpoints, newFolders);
        
        // Clear active if it was inside the deleted folders
        if (activeEndpoint && activeEndpoint.folderId && toDeleteFolderIds.includes(activeEndpoint.folderId)) {
            setActiveEndpoint(null);
        }
    };

    const handleAddFolder = async (parentId?: string | null) => {
        const newFolder: Folder = {
            id: crypto.randomUUID(),
            name: 'New Directory',
            parentId: parentId || null
        };
        await syncState([...folders, newFolder], [...folders, newFolder]);
    };

    const handleAddEndpoint = async (folderId?: string | null) => {
        const newEndpoint: MockEndpoint = {
            id: crypto.randomUUID(),
            folderId: folderId || null,
            method: 'GET',
            url: `/api/v1/service-${Math.floor(Math.random() * 1000)}`,
            status: 200,
            body: { status: "online" }
        };
        await syncState([...endpoints, newEndpoint], folders);
        setActiveEndpoint(newEndpoint);
    };

    const handleUpdateFolderName = async (id: string, newName: string) => {
        const newFolders = folders.map(f => f.id === id ? { ...f, name: newName } : f);
        await syncState(endpoints, newFolders);
    };

    const handleDrop = async (draggedId: string, type: 'endpoint' | 'folder', targetFolderId: string | null) => {
        if (type === 'endpoint') {
            const newEndpoints = endpoints.map(e => e.id === draggedId ? { ...e, folderId: targetFolderId } : e);
            await syncState(newEndpoints, folders);
        } else if (type === 'folder') {
            if (draggedId === targetFolderId) return; // Can't drop into itself
            
            // Prevent cyclic nesting
            const isDescendant = (folderId: string, potentialParentId: string): boolean => {
                const folder = folders.find(f => f.id === folderId);
                if (!folder || !folder.parentId) return false;
                if (folder.parentId === potentialParentId) return true;
                return isDescendant(folder.parentId, potentialParentId);
            };

            if (targetFolderId && isDescendant(targetFolderId, draggedId)) return;

            const newFolders = folders.map(f => f.id === draggedId ? { ...f, parentId: targetFolderId } : f);
            await syncState(endpoints, newFolders);
        }
    };

    const handleUpdateActive = (endpoint: MockEndpoint) => {
        setActiveEndpoint(endpoint);
    };

    const exportConfig = () => {
        const data = JSON.stringify({ endpoints, folders }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mockcore-dir-snap-v3.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const importConfig = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const imported = JSON.parse(event.target?.result as string);
                const importedEndpoints = imported.endpoints || [];
                const importedFolders = imported.folders || [];
                await syncState(importedEndpoints, importedFolders);
                alert('V3 Snapshot loaded.');
            } catch (err) {
                alert('Load failed: Invalid JSON format.');
            }
        };
        reader.readAsText(file);
    };

    const clearAll = async () => {
        if (!confirm('Execute total system wipe?')) return;
        await syncState([], []);
        setActiveEndpoint(null);
    };

    if (!isLoaded) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-background-base text-text-primary font-sans selection:bg-accent/20 transition-colors duration-300">
            <header className="h-20 border-b border-border flex items-center justify-between px-10 bg-background-card shrink-0 z-40 transition-colors duration-300">
                <div className="flex items-center gap-6">
                    <div className="bg-accent p-3 rounded-[1.25rem] shadow-2xl shadow-accent/20 group hover:scale-110 transition-all duration-500 cursor-pointer">
                        <Cpu size={24} className="text-white group-hover:rotate-180 transition-transform duration-700" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xl tracking-tighter text-text-primary uppercase leading-none">MOCKCORE_DIR</span>
                            <span className="px-1.5 py-0.5 rounded-md bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest leading-none">NEXUS_V4</span>
                        </div>
                        <span className="text-[9px] font-black text-text-muted/40 uppercase tracking-[0.3em] mt-1 ml-0.5">Explicit Structural Architecture</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-10">
                    <div className="hidden lg:flex items-center gap-8 pr-10 border-r border-border">
                        <button onClick={exportConfig} className="text-[10px] font-black uppercase text-text-muted hover:text-accent transition-all flex items-center gap-2 pt-1"><Download size={14} /> EXPORT_SNAP</button>
                        <button onClick={() => fileInputRef.current?.click()} className="text-[10px] font-black uppercase text-text-muted hover:text-accent transition-all flex items-center gap-2 pt-1"><Upload size={14} /> IMPORT_SNAP</button>
                        <input type="file" ref={fileInputRef} className="hidden" onChange={importConfig} accept=".json" />
                    </div>
                    <div className="flex items-center gap-6">
                        <button onClick={clearAll} className="text-text-muted/50 hover:text-error transition-all duration-300"><Trash2 size={20} /></button>
                        <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-background-input border border-border/50">
                            <div className={`w-2 h-2 rounded-full ${isSwRegistered ? 'bg-success shadow-[0_0_12px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-text-muted/30'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">{isSwRegistered ? 'ONLINE' : 'OFFLINE'}</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden relative">
                <EndpointList 
                    endpoints={endpoints}
                    folders={folders}
                    activeId={activeId => activeEndpoint?.id === activeId ? activeId : null} 
                    activeEndpoint={activeEndpoint}
                    onSelect={setActiveEndpoint}
                    onDelete={handleDelete}
                    onDeleteFolder={handleDeleteFolder}
                    onAddFolder={handleAddFolder}
                    onAddEndpoint={handleAddEndpoint}
                    onUpdateFolderName={handleUpdateFolderName}
                    onDrop={handleDrop}
                />

                <div className="flex-1 overflow-hidden relative">
                    {activeEndpoint ? (
                        <EndpointEditor 
                            endpoint={activeEndpoint} 
                            onSave={handleSave} 
                            onUpdate={handleUpdateActive}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-background-base/50">
                            <div className="w-32 h-32 bg-background-card rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl shadow-accent/5 group border border-border">
                                <Activity size={56} className="text-text-muted/10 group-hover:text-accent/20 transition-all duration-1000" />
                            </div>
                            <h3 className="text-2xl font-black text-text-primary mb-4 tracking-tighter uppercase max-w-sm">MOCKCORE_SYSTEM_READY</h3>
                            <button onClick={() => handleAddEndpoint(null)} className="px-12 py-5 bg-accent text-white rounded-2xl hover:bg-accent-hover transition-all font-black text-[11px] shadow-2xl shadow-accent/20 uppercase tracking-[0.2em] active:scale-95">Open New Terminal Node</button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
