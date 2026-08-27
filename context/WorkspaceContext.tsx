"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Database } from "sql.js";
import { v4 as uuidv4 } from "uuid";
import {
  createDatabase,
  executeQuery,
  exportDatabaseBytes,
  getAllTablesInfo,
  getTableDDL,
  getTableNames,
  loadDatabaseFromBytes,
  type QueryResult,
  type TableInfo,
} from "@/lib/database";
import { DEMO_SEED_SQL } from "@/lib/demo-data";
import {
  addQueryHistory,
  getEditorTabs,
  getQueryHistory,
  saveEditorTabs,
  type EditorTab,
  type QueryHistoryEntry,
} from "@/lib/project-store";

export type WorkspaceView =
  | "playground"
  | "query-builder"
  | "erd"
  | "schema-designer";

type WorkspaceContextValue = {
  ready: boolean;
  db: Database | null;
  tables: TableInfo[];
  schemaSql: string;
  activeView: WorkspaceView;
  setActiveView: (view: WorkspaceView) => void;
  tabs: EditorTab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  addTab: (sql?: string, name?: string) => void;
  closeTab: (id: string) => void;
  updateTabSql: (id: string, sql: string) => void;
  updateTabName: (id: string, name: string) => void;
  runQuery: (sql?: string) => Promise<void>;
  lastResults: QueryResult[];
  lastError: string | null;
  running: boolean;
  queryHistory: QueryHistoryEntry[];
  resetDatabase: () => Promise<void>;
  importSql: (sql: string) => Promise<void>;
  importDatabaseFile: (bytes: Uint8Array) => Promise<void>;
  exportDatabase: () => void;
  refreshSchema: () => void;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

function defaultTabs(): EditorTab[] {
  return [{ id: uuidv4(), name: "Query 1", sql: "SELECT * FROM users;" }];
}

export function WorkspaceProvider({
  children,
  initialView = "playground",
}: {
  children: ReactNode;
  initialView?: WorkspaceView;
}) {
  const [ready, setReady] = useState(false);
  const [db, setDb] = useState<Database | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [schemaSql, setSchemaSql] = useState("");
  const [activeView, setActiveView] = useState<WorkspaceView>(initialView);
  const [tabs, setTabs] = useState<EditorTab[]>(defaultTabs());
  const [activeTabId, setActiveTabId] = useState("");
  const [lastResults, setLastResults] = useState<QueryResult[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [queryHistory, setQueryHistory] = useState<QueryHistoryEntry[]>([]);

  const refreshSchema = useCallback(() => {
    if (!db) return;
    setTables(getAllTablesInfo(db));
    setSchemaSql(getTableDDL(db));
  }, [db]);

  const initDb = useCallback(async (database: Database) => {
    setDb(database);
    setTables(getAllTablesInfo(database));
    setSchemaSql(getTableDDL(database));
    setReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const storedTabs = await getEditorTabs();
      const history = await getQueryHistory();
      if (cancelled) return;
      if (storedTabs.length) {
        setTabs(storedTabs);
        setActiveTabId(storedTabs[0].id);
      } else {
        const initial = defaultTabs();
        setTabs(initial);
        setActiveTabId(initial[0].id);
      }
      setQueryHistory(history);
      const database = await createDatabase();
      if (!cancelled) await initDb(database);
    })();
    return () => {
      cancelled = true;
    };
  }, [initDb]);

  useEffect(() => {
    if (!ready) return;
    saveEditorTabs(tabs);
  }, [tabs, ready]);

  const addTab = useCallback((sql = "", name?: string) => {
    const id = uuidv4();
    const tab: EditorTab = {
      id,
      name: name ?? `Query ${tabs.length + 1}`,
      sql,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(id);
  }, [tabs.length]);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (!next.length) {
        const newTab = defaultTabs()[0];
        setActiveTabId(newTab.id);
        return [newTab];
      }
      if (activeTabId === id) setActiveTabId(next[next.length - 1].id);
      return next;
    });
  }, [activeTabId]);

  const updateTabSql = useCallback((id: string, sql: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, sql } : t)));
  }, []);

  const updateTabName = useCallback((id: string, name: string) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t)));
  }, []);

  const runQuery = useCallback(async (sql?: string) => {
    if (!db) return;
    const activeTab = tabs.find((t) => t.id === activeTabId);
    const querySql = sql ?? activeTab?.sql ?? "";
    if (!querySql.trim()) return;

    setRunning(true);
    setLastError(null);
    try {
      const results = executeQuery(db, querySql);
      setLastResults(results);
      const entry: QueryHistoryEntry = {
        sql: querySql,
        timestamp: new Date().toISOString(),
        success: true,
      };
      await addQueryHistory(entry);
      setQueryHistory((prev) => [entry, ...prev].slice(0, 100));
      refreshSchema();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Query failed.";
      setLastError(message);
      setLastResults([]);
      const entry: QueryHistoryEntry = {
        sql: querySql,
        timestamp: new Date().toISOString(),
        success: false,
      };
      await addQueryHistory(entry);
      setQueryHistory((prev) => [entry, ...prev].slice(0, 100));
    } finally {
      setRunning(false);
    }
  }, [db, tabs, activeTabId, refreshSchema]);

  const resetDatabase = useCallback(async () => {
    const database = await createDatabase(DEMO_SEED_SQL);
    await initDb(database);
    setLastResults([]);
    setLastError(null);
  }, [initDb]);

  const importSql = useCallback(async (sql: string) => {
    const database = await createDatabase(sql);
    await initDb(database);
    setLastResults([]);
    setLastError(null);
  }, [initDb]);

  const importDatabaseFile = useCallback(async (bytes: Uint8Array) => {
    const database = await loadDatabaseFromBytes(bytes);
    await initDb(database);
    setLastResults([]);
    setLastError(null);
  }, [initDb]);

  const exportDatabase = useCallback(() => {
    if (!db) return;
    const bytes = exportDatabaseBytes(db);
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    const blob = new Blob([ab], {
      type: "application/x-sqlite3",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "database.sqlite";
    a.click();
    URL.revokeObjectURL(url);
  }, [db]);

  const value = useMemo(
    () => ({
      ready,
      db,
      tables,
      schemaSql,
      activeView,
      setActiveView,
      tabs,
      activeTabId,
      setActiveTabId,
      addTab,
      closeTab,
      updateTabSql,
      updateTabName,
      runQuery,
      lastResults,
      lastError,
      running,
      queryHistory,
      resetDatabase,
      importSql,
      importDatabaseFile,
      exportDatabase,
      refreshSchema,
    }),
    [
      ready,
      db,
      tables,
      schemaSql,
      activeView,
      tabs,
      activeTabId,
      addTab,
      closeTab,
      updateTabSql,
      updateTabName,
      runQuery,
      lastResults,
      lastError,
      running,
      queryHistory,
      resetDatabase,
      importSql,
      importDatabaseFile,
      exportDatabase,
      refreshSchema,
    ],
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}
