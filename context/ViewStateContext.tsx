"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Database } from "sql.js";
import { v4 as uuidv4 } from "uuid";
import {
  exportDatabaseBytes,
  getAllTablesInfo,
  getTableDDL,
  loadDatabaseFromBytes,
  type QueryResult,
  type TableInfo,
} from "@/lib/database";
import {
  getWorkspaceViewState,
  saveWorkspaceViewState,
  type EditorTab,
  type QueryHistoryEntry,
} from "@/lib/project-store";
import type { QueryBuilderState } from "@/lib/query-builder-sql";
import type { DesignerTable } from "@/lib/schema-ddl";
import {
  createDefaultViewState,
  emptyIsolatedDb,
  EMPTY_BUILDER_STATE,
  type IsolatedViewId,
  type WorkspaceViewState,
} from "@/lib/view-state";

type ViewStateContextValue = {
  ready: boolean;
  state: WorkspaceViewState;
  getDb: (view: IsolatedViewId) => Database | null;
  setIsolatedSql: (view: IsolatedViewId, sql: string) => void;
  setIsolatedDb: (view: IsolatedViewId, db: Database | null, sql?: string) => void;
  clearIsolatedDb: (view: IsolatedViewId) => void;
  playground: {
    tabs: EditorTab[];
    activeTabId: string;
    setActiveTabId: (id: string) => void;
    addTab: (sql?: string, name?: string) => void;
    closeTab: (id: string) => void;
    updateTabSql: (id: string, sql: string) => void;
    lastResults: QueryResult[];
    setLastResults: (results: QueryResult[]) => void;
    lastError: string | null;
    setLastError: (error: string | null) => void;
    queryHistory: QueryHistoryEntry[];
    appendQueryHistory: (entry: QueryHistoryEntry) => void;
    resetEditor: () => void;
    selectedTable: string | null;
    setSelectedTable: (table: string | null) => void;
  };
  queryBuilder: {
    builder: QueryBuilderState;
    setBuilder: (builder: QueryBuilderState) => void;
    updateBuilder: (updater: (prev: QueryBuilderState) => QueryBuilderState) => void;
    resetBuilder: () => void;
    showAdvanced: boolean;
    setShowAdvanced: (show: boolean) => void;
  };
  schemaDesigner: {
    designTables: DesignerTable[];
    setDesignTables: (tables: DesignerTable[]) => void;
    updateDesignTables: (updater: (prev: DesignerTable[]) => DesignerTable[]) => void;
    selectedIdx: number;
    setSelectedIdx: (idx: number) => void;
  };
};

const ViewStateContext = createContext<ViewStateContextValue | null>(null);

export function useViewState() {
  const ctx = useContext(ViewStateContext);
  if (!ctx) throw new Error("useViewState must be used within ViewStateProvider");
  return ctx;
}

function defaultEditorTabs(): EditorTab[] {
  return [{ id: uuidv4(), name: "Query 1", sql: "SELECT * FROM users;" }];
}

export function ViewStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<WorkspaceViewState>(createDefaultViewState());
  const dbInstances = useRef<Map<IsolatedViewId, Database>>(new Map());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getWorkspaceViewState();
      if (cancelled) return;

      const views: IsolatedViewId[] = ["playground", "query-builder", "erd"];
      for (const view of views) {
        const bytes = stored[view].isolated.dbBytes;
        if (bytes && stored[view].isolated.ready) {
          try {
            const db = await loadDatabaseFromBytes(bytes);
            dbInstances.current.set(view, db);
          } catch {
            stored[view].isolated = emptyIsolatedDb();
          }
        }
      }

      setState(stored);
      setReady(true);
    })();
    return () => {
      cancelled = true;
      dbInstances.current.forEach((db) => db.close());
      dbInstances.current.clear();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      void saveWorkspaceViewState(state);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [state, ready]);

  const getDb = useCallback((view: IsolatedViewId) => {
    return dbInstances.current.get(view) ?? null;
  }, []);

  const setIsolatedSql = useCallback((view: IsolatedViewId, sql: string) => {
    setState((prev) => ({
      ...prev,
      [view]: {
        ...prev[view],
        isolated: { ...prev[view].isolated, sql },
      },
    }));
  }, []);

  const setIsolatedDb = useCallback(
    (view: IsolatedViewId, db: Database | null, sql?: string) => {
      if (db) {
        dbInstances.current.set(view, db);
      } else {
        dbInstances.current.delete(view);
      }

      const dbBytes = db ? exportDatabaseBytes(db) : null;
      setState((prev) => ({
        ...prev,
        [view]: {
          ...prev[view],
          isolated: {
            sql: sql ?? prev[view].isolated.sql,
            dbBytes,
            ready: db !== null,
          },
        },
      }));
    },
    [],
  );

  const clearIsolatedDb = useCallback((view: IsolatedViewId) => {
    dbInstances.current.delete(view);
    setState((prev) => ({
      ...prev,
      [view]: {
        ...prev[view],
        isolated: emptyIsolatedDb(),
      },
    }));
  }, []);

  const playgroundAddTab = useCallback((sql = "", name?: string) => {
    setState((prev) => {
      const id = uuidv4();
      const tab: EditorTab = {
        id,
        name: name ?? `Query ${prev.playground.tabs.length + 1}`,
        sql,
      };
      return {
        ...prev,
        playground: {
          ...prev.playground,
          tabs: [...prev.playground.tabs, tab],
          activeTabId: id,
        },
      };
    });
  }, []);

  const playgroundCloseTab = useCallback((id: string) => {
    setState((prev) => {
      const next = prev.playground.tabs.filter((t) => t.id !== id);
      if (!next.length) {
        const newTab = defaultEditorTabs()[0];
        return {
          ...prev,
          playground: {
            ...prev.playground,
            tabs: [newTab],
            activeTabId: newTab.id,
          },
        };
      }
      const activeTabId =
        prev.playground.activeTabId === id
          ? next[next.length - 1].id
          : prev.playground.activeTabId;
      return {
        ...prev,
        playground: {
          ...prev.playground,
          tabs: next,
          activeTabId,
        },
      };
    });
  }, []);

  const playgroundResetEditor = useCallback(() => {
    const tabs = defaultEditorTabs();
    setState((prev) => ({
      ...prev,
      playground: {
        ...prev.playground,
        tabs,
        activeTabId: tabs[0].id,
        lastResults: [],
        lastError: null,
        queryHistory: [],
        selectedTable: null,
      },
    }));
  }, []);

  const value = useMemo<ViewStateContextValue>(
    () => ({
      ready,
      state,
      getDb,
      setIsolatedSql,
      setIsolatedDb,
      clearIsolatedDb,
      playground: {
        tabs: state.playground.tabs,
        activeTabId: state.playground.activeTabId,
        setActiveTabId: (id) =>
          setState((prev) => ({
            ...prev,
            playground: { ...prev.playground, activeTabId: id },
          })),
        addTab: playgroundAddTab,
        closeTab: playgroundCloseTab,
        updateTabSql: (id, sql) =>
          setState((prev) => ({
            ...prev,
            playground: {
              ...prev.playground,
              tabs: prev.playground.tabs.map((t) => (t.id === id ? { ...t, sql } : t)),
            },
          })),
        lastResults: state.playground.lastResults,
        setLastResults: (results) =>
          setState((prev) => ({
            ...prev,
            playground: { ...prev.playground, lastResults: results },
          })),
        lastError: state.playground.lastError,
        setLastError: (error) =>
          setState((prev) => ({
            ...prev,
            playground: { ...prev.playground, lastError: error },
          })),
        queryHistory: state.playground.queryHistory,
        appendQueryHistory: (entry) =>
          setState((prev) => ({
            ...prev,
            playground: {
              ...prev.playground,
              queryHistory: [entry, ...prev.playground.queryHistory].slice(0, 100),
            },
          })),
        resetEditor: playgroundResetEditor,
        selectedTable: state.playground.selectedTable,
        setSelectedTable: (table) =>
          setState((prev) => ({
            ...prev,
            playground: { ...prev.playground, selectedTable: table },
          })),
      },
      queryBuilder: {
        builder: state["query-builder"].builder,
        setBuilder: (builder) =>
          setState((prev) => ({
            ...prev,
            "query-builder": { ...prev["query-builder"], builder },
          })),
        updateBuilder: (updater) =>
          setState((prev) => ({
            ...prev,
            "query-builder": {
              ...prev["query-builder"],
              builder: updater(prev["query-builder"].builder),
            },
          })),
        resetBuilder: () =>
          setState((prev) => ({
            ...prev,
            "query-builder": {
              ...prev["query-builder"],
              builder: { ...EMPTY_BUILDER_STATE },
            },
          })),
        showAdvanced: state["query-builder"].showAdvanced,
        setShowAdvanced: (show) =>
          setState((prev) => ({
            ...prev,
            "query-builder": { ...prev["query-builder"], showAdvanced: show },
          })),
      },
      schemaDesigner: {
        designTables: state["schema-designer"].designTables,
        setDesignTables: (tables) =>
          setState((prev) => ({
            ...prev,
            "schema-designer": { ...prev["schema-designer"], designTables: tables },
          })),
        updateDesignTables: (updater) =>
          setState((prev) => ({
            ...prev,
            "schema-designer": {
              ...prev["schema-designer"],
              designTables: updater(prev["schema-designer"].designTables),
            },
          })),
        selectedIdx: state["schema-designer"].selectedIdx,
        setSelectedIdx: (idx) =>
          setState((prev) => ({
            ...prev,
            "schema-designer": { ...prev["schema-designer"], selectedIdx: idx },
          })),
      },
    }),
    [
      ready,
      state,
      getDb,
      setIsolatedSql,
      setIsolatedDb,
      clearIsolatedDb,
      playgroundAddTab,
      playgroundCloseTab,
      playgroundResetEditor,
    ],
  );

  return (
    <ViewStateContext.Provider value={value}>{children}</ViewStateContext.Provider>
  );
}

export function useIsolatedDbTables(view: IsolatedViewId): {
  tables: TableInfo[];
  schemaSql: string;
} {
  const { getDb } = useViewState();
  const db = getDb(view);
  if (!db) return { tables: [], schemaSql: "" };
  return {
    tables: getAllTablesInfo(db),
    schemaSql: getTableDDL(db),
  };
}
