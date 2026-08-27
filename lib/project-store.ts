import { get, set, del, keys, createStore } from "idb-keyval";

const projectStore = createStore("sql-workspace", "projects");

export type SavedQuery = {
  id: string;
  name: string;
  sql: string;
  createdAt: string;
};

export type WorkspaceProject = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  schemaSql: string;
  savedQueries: SavedQuery[];
  diagramJson?: string;
};

import type { WorkspaceViewState } from "@/lib/view-state";
import { createDefaultViewState } from "@/lib/view-state";

const CURRENT_PROJECT_KEY = "current-project-id";
const QUERY_HISTORY_KEY = "query-history";
const EDITOR_TABS_KEY = "editor-tabs";
const VIEW_STATE_KEY = "workspace-view-state";

export async function listProjects(): Promise<WorkspaceProject[]> {
  const allKeys = await keys(projectStore);
  const projects: WorkspaceProject[] = [];
  for (const key of allKeys) {
    if (typeof key === "string" && key.startsWith("project:")) {
      const project = await get<WorkspaceProject>(key, projectStore);
      if (project) projects.push(project);
    }
  }
  return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getProject(id: string): Promise<WorkspaceProject | undefined> {
  return get<WorkspaceProject>(`project:${id}`, projectStore);
}

export async function saveProject(project: WorkspaceProject): Promise<void> {
  project.updatedAt = new Date().toISOString();
  await set(`project:${project.id}`, project, projectStore);
}

export async function deleteProject(id: string): Promise<void> {
  await del(`project:${id}`, projectStore);
}

export async function getCurrentProjectId(): Promise<string | null> {
  return (await get<string>(CURRENT_PROJECT_KEY, projectStore)) ?? null;
}

export async function setCurrentProjectId(id: string): Promise<void> {
  await set(CURRENT_PROJECT_KEY, id, projectStore);
}

export type QueryHistoryEntry = {
  sql: string;
  timestamp: string;
  success: boolean;
};

export async function getQueryHistory(): Promise<QueryHistoryEntry[]> {
  return (await get<QueryHistoryEntry[]>(QUERY_HISTORY_KEY, projectStore)) ?? [];
}

export async function addQueryHistory(entry: QueryHistoryEntry): Promise<void> {
  const history = await getQueryHistory();
  const updated = [entry, ...history].slice(0, 100);
  await set(QUERY_HISTORY_KEY, updated, projectStore);
}

export type EditorTab = {
  id: string;
  name: string;
  sql: string;
};

export async function getEditorTabs(): Promise<EditorTab[]> {
  return (await get<EditorTab[]>(EDITOR_TABS_KEY, projectStore)) ?? [];
}

export async function saveEditorTabs(tabs: EditorTab[]): Promise<void> {
  await set(EDITOR_TABS_KEY, tabs, projectStore);
}

export async function getWorkspaceViewState(): Promise<WorkspaceViewState> {
  const stored = await get<WorkspaceViewState>(VIEW_STATE_KEY, projectStore);
  return stored ?? createDefaultViewState();
}

export async function saveWorkspaceViewState(state: WorkspaceViewState): Promise<void> {
  await set(VIEW_STATE_KEY, state, projectStore);
}
