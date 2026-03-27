"use client";

import React, { useState, useEffect, useRef } from 'react';
import { EndpointList } from './components/EndpointList';
import { EndpointEditor } from './components/EndpointEditor';
import { storage, MockEndpoint, Folder } from './lib/storage';
import { Activity, Download, Upload, Trash2, Cpu, Globe, Server, Plus } from 'lucide-react';
import ToolLayout from "@/components/layout/ToolLayout";
import { getToolBySlug } from "@/lib/toolRegistry";

export default function MockApiPage() {
    const [endpoints, setEndpoints] = useState<MockEndpoint[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [activeEndpoint, setActiveEndpoint] = useState<MockEndpoint | null>(null);
    const [isSwRegistered, setIsSwRegistered] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const tool = getToolBySlug("mock-api")!;

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
        await syncState(endpoints, [...folders, newFolder]);
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
        <ToolLayout tool={tool}>
            <div className="bg-background-card border border-border rounded-3xl overflow-hidden flex flex-col md:flex-row h-[800px] shadow-sm">
                <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border shrink-0">
                    <EndpointList 
                        endpoints={endpoints}
                        folders={folders}
                        activeId={activeEndpoint?.id || null} 
                        activeEndpoint={activeEndpoint}
                        onSelect={setActiveEndpoint}
                        onDelete={handleDelete}
                        onDeleteFolder={handleDeleteFolder}
                        onAddFolder={handleAddFolder}
                        onAddEndpoint={handleAddEndpoint}
                        onUpdateFolderName={handleUpdateFolderName}
                        onDrop={handleDrop}
                    />
                </div>

                <div className="flex-1 overflow-hidden relative bg-background-base/30">
                    <div className="absolute inset-0 overflow-auto">
                        {activeEndpoint ? (
                            <EndpointEditor 
                                endpoint={activeEndpoint} 
                                onSave={handleSave} 
                                onUpdate={handleUpdateActive}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-12">
                                <div className="w-24 h-24 bg-background-card rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-accent/5 group border border-border transition-all hover:scale-105">
                                    <Activity size={40} className="text-text-muted/20 group-hover:text-accent/30 transition-all duration-700" />
                                </div>
                                <h3 className="text-xl font-bold text-text-primary mb-3 tracking-tight uppercase">Mock System Ready</h3>
                                <p className="text-sm text-text-muted mb-8 max-w-xs mx-auto leading-relaxed italic">Select a terminal node from the explorer or create a new one to begin interception.</p>
                                <button onClick={() => handleAddEndpoint(null)} className="btn-primary px-10 py-3.5 text-xs font-bold uppercase tracking-widest active:scale-95 transition-all">
                                    <Plus className="w-4 h-4 inline-block mr-2 -mt-0.5" /> New Terminal Node
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ToolLayout>
    );
}
