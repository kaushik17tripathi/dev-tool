"use client";

import React, { useState } from 'react';
import { MockEndpoint, Folder as FolderType } from '../lib/storage';
import { Plus, Trash2, ChevronRight, ChevronDown, Folder as FolderIcon, FileJson, FolderPlus, Globe, Edit2, Check, X } from 'lucide-react';

interface EndpointListProps {
    endpoints: MockEndpoint[];
    folders: FolderType[];
    activeId: string | null;
    activeEndpoint: MockEndpoint | null;
    onSelect: (endpoint: MockEndpoint) => void;
    onDelete: (id: string) => void;
    onDeleteFolder: (id: string) => void;
    onAddFolder: (parentId?: string | null) => void;
    onAddEndpoint: (folderId?: string | null) => void;
    onUpdateFolderName: (id: string, newName: string) => void;
    onDrop: (draggedId: string, type: 'endpoint' | 'folder', targetFolderId: string | null) => void;
}

export function EndpointList({ 
    endpoints, folders, activeId, activeEndpoint, 
    onSelect, onDelete, onDeleteFolder, onAddFolder, onAddEndpoint, onUpdateFolderName, onDrop 
}: EndpointListProps) {
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [editFolderName, setEditFolderName] = useState('');

    const toggleFolder = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDragStart = (e: React.DragEvent, id: string, type: 'endpoint' | 'folder') => {
        e.dataTransfer.setData('id', id);
        e.dataTransfer.setData('type', type);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-accent/10');
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.currentTarget.classList.remove('bg-accent/10');
    };

    const startFolderEdit = (folder: FolderType, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingFolderId(folder.id);
        setEditFolderName(folder.name);
    };

    const saveFolderEdit = (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
        if (e) e.stopPropagation();
        if (editFolderName.trim()) {
            onUpdateFolderName(id, editFolderName.trim());
        }
        setEditingFolderId(null);
    };

    const renderTree = (parentId: string | null = null, depth: number = 0) => {
        const childrenFolders = folders.filter(f => f.parentId === parentId || (parentId === null && !f.parentId)).sort((a,b) => a.name.localeCompare(b.name));
        const childrenEndpoints = endpoints.filter(e => e.folderId === parentId || (parentId === null && !e.folderId)).sort((a,b) => (a.url || '').localeCompare(b.url || ''));

        // Inject activeDraft if it matches this folder
        if (activeEndpoint && !endpoints.find(e => e.id === activeEndpoint.id)) {
            if (activeEndpoint.folderId === parentId || (parentId === null && !activeEndpoint.folderId)) {
                childrenEndpoints.push(activeEndpoint);
            }
        }

        return (
            <div className="flex flex-col relative w-full">
                {childrenFolders.map(folder => {
                    const isExpanded = expanded[folder.id];
                    const isEditing = editingFolderId === folder.id;

                    return (
                        <div key={folder.id} className="flex flex-col relative w-full">
                            {depth > 0 && (
                                <div 
                                    className="absolute left-[13px] top-0 bottom-0 w-[1px] bg-border/20 z-0" 
                                    style={{ left: `${depth * 14 + 13}px` }} 
                                />
                            )}
                            <div 
                                draggable
                                onDragStart={(e) => handleDragStart(e, folder.id, 'folder')}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => onDrop(e.dataTransfer.getData('id'), e.dataTransfer.getData('type') as any, folder.id)}
                                onClick={() => toggleFolder(folder.id)}
                                className="group relative flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer transition-all z-10 mx-2 hover:bg-background-input text-text-muted hover:text-text-primary border-l-2 border-transparent"
                                style={{ paddingLeft: `${depth * 14 + 10}px` }}
                            >
                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                    {isExpanded ? <ChevronDown size={14} className="shrink-0 opacity-40" /> : <ChevronRight size={14} className="shrink-0 opacity-40" />}
                                    <FolderIcon size={14} className={`shrink-0 ${isExpanded ? 'text-amber-500' : 'text-amber-500/60'}`} />
                                    
                                    {isEditing ? (
                                        <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                                            <input 
                                                autoFocus
                                                value={editFolderName}
                                                onChange={e => setEditFolderName(e.target.value)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') saveFolderEdit(folder.id, e);
                                                    if (e.key === 'Escape') setEditingFolderId(null);
                                                }}
                                                className="bg-background-base text-[12px] font-sans text-text-primary rounded px-1.5 py-0.5 outline-none border border-accent/30 w-full"
                                            />
                                            <button onClick={(e) => saveFolderEdit(folder.id, e)} className="text-success hover:bg-success/10 p-0.5 rounded"><Check size={12} /></button>
                                            <button onClick={() => setEditingFolderId(null)} className="text-error hover:bg-error/10 p-0.5 rounded"><X size={12} /></button>
                                        </div>
                                    ) : (
                                        <span className="text-[12px] truncate font-sans tracking-tight">{folder.name}</span>
                                    )}
                                </div>

                                {!isEditing && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                        <button 
                                            onClick={(e) => startFolderEdit(folder, e)}
                                            className="p-1 px-1.5 text-text-muted hover:text-accent rounded-md transition-all"
                                            title="Rename Directory"
                                        >
                                            <Edit2 size={10} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onAddEndpoint(folder.id); setExpanded(prev=>({...prev, [folder.id]: true})) }}
                                            className="p-1 px-1.5 text-text-muted hover:text-accent rounded-md transition-all"
                                            title="New Node"
                                        >
                                            <Plus size={10} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onAddFolder(folder.id); setExpanded(prev=>({...prev, [folder.id]: true})) }}
                                            className="p-1 px-1.5 text-text-muted hover:text-accent rounded-md transition-all"
                                            title="New Sub-Directory"
                                        >
                                            <FolderPlus size={10} />
                                        </button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
                                            className="p-1 px-1.5 text-text-muted hover:text-error rounded-md transition-all"
                                            title="Delete Directory Recursively"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isExpanded && (
                                <div className="flex flex-col w-full">
                                    {renderTree(folder.id, depth + 1)}
                                </div>
                            )}
                        </div>
                    );
                })}

                {childrenEndpoints.map(endpoint => {
                    const isSelected = activeId === endpoint.id || activeEndpoint?.id === endpoint.id;
                    const isDraft = !endpoints.find(e => e.id === endpoint.id);
                    const pathDisplay = (endpoint.url || '').split('/').pop() || endpoint.url || 'untitled';
                    const methodInitial = (endpoint.method || 'GET').charAt(0);

                    return (
                        <div 
                            key={endpoint.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, endpoint.id, 'endpoint')}
                            onClick={() => onSelect(endpoint)}
                            className={`group relative flex items-center justify-between py-1.5 px-3 rounded-lg cursor-pointer transition-all z-10 mx-2 ${
                                isSelected 
                                ? 'bg-accent/10 border-l-2 border-accent text-accent font-semibold' 
                                : 'hover:bg-background-input text-text-muted hover:text-text-primary border-l-2 border-transparent'
                            }`}
                            style={{ paddingLeft: `${depth * 14 + 10 + 20}px` }} // +20 for alignment without chevron
                        >
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                                <div className="flex items-center gap-2 min-w-[28px]">
                                    <FileJson size={14} className={`shrink-0 ${isDraft ? 'text-accent animate-pulse' : 'text-text-muted/30 group-hover:text-accent/60'}`} />
                                    <span className="text-[7px] font-black uppercase opacity-40 tracking-tighter shrink-0">{methodInitial}</span>
                                </div>
                                <span className={`text-[12px] truncate font-sans tracking-tight ${isDraft ? 'italic opacity-60' : ''}`}>
                                    {pathDisplay}
                                    {isDraft && ' *'}
                                </span>
                            </div>

                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onDelete(endpoint.id); }}
                                    className="p-1 px-1.5 text-text-muted hover:text-error rounded-md transition-all"
                                    title="Delete Node"
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background-card border-r border-border w-72 select-none transition-colors duration-300 shadow-2xl shadow-black/5">
            <div className="p-5 border-b border-border flex items-center justify-between bg-background-card">
                <div className="flex items-center gap-3">
                    <Globe size={18} className="text-accent" />
                    <h2 className="font-black text-text-primary tracking-tighter text-[11px] uppercase opacity-70">Project explorer</h2>
                </div>
                <div className="flex items-center gap-1.5">
                    <button 
                        onClick={() => onAddFolder(null)}
                        title="New Root Directory"
                        className="p-1.5 bg-background-input text-text-muted border border-border rounded-lg hover:bg-border transition-all hover:text-text-primary active:scale-95"
                    >
                        <FolderPlus size={15} />
                    </button>
                    <button 
                        onClick={() => onAddEndpoint(null)}
                        title="New Root Node"
                        className="p-1.5 bg-accent text-white rounded-lg hover:bg-accent-hover transition-all shadow-lg shadow-accent/10 active:scale-95"
                    >
                        <Plus size={15} />
                    </button>
                </div>
            </div>
            
            <div 
                className="flex-1 overflow-y-auto pt-4 pb-12 custom-scrollbar"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => {
                    e.currentTarget.classList.remove('bg-accent/10');
                    if (e.target === e.currentTarget) {
                        onDrop(e.dataTransfer.getData('id'), e.dataTransfer.getData('type') as any, null);
                    }
                }}
            >
                {endpoints.length === 0 && folders.length === 0 && !activeEndpoint ? (
                    <div className="text-center py-12 px-6 pointer-events-none">
                        <div className="w-12 h-12 bg-background-input rounded-2xl mx-auto mb-4 flex items-center justify-center border border-border">
                            <FolderIcon size={20} className="text-text-muted/10" />
                        </div>
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest opacity-30">Nexus Standby</p>
                    </div>
                ) : (
                    renderTree(null, 0)
                )}
            </div>
            
            <div className="p-4 border-t border-border bg-background-card">
                <div className="flex items-center justify-between text-[9px] font-black text-text-muted uppercase tracking-[0.2em] opacity-30 px-2">
                    <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-success rounded-full opacity-50" /> NETWORK_AUTO</span>
                    <span>V_PRO_V4</span>
                </div>
            </div>
        </div>
    );
}
