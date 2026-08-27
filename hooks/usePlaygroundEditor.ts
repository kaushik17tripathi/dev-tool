"use client";

import { useCallback, useState } from "react";
import type { Database } from "sql.js";
import { useViewState } from "@/context/ViewStateContext";
import { executeQuery, type QueryResult } from "@/lib/database";
import type { EditorTab, QueryHistoryEntry } from "@/lib/project-store";

export type SqlEditorController = {
  tabs: EditorTab[];
  activeTabId: string;
  setActiveTabId: (id: string) => void;
  addTab: (sql?: string, name?: string) => void;
  closeTab: (id: string) => void;
  updateTabSql: (id: string, sql: string) => void;
  runQuery: (sql?: string) => Promise<void>;
  running: boolean;
  queryHistory: QueryHistoryEntry[];
  resetEditor: () => void;
};

export type ResultsController = {
  lastResults: QueryResult[];
  lastError: string | null;
};

export function usePlaygroundEditor(
  db: Database | null,
  onSchemaChange?: () => void,
): SqlEditorController & ResultsController {
  const playground = useViewState().playground;
  const [running, setRunning] = useState(false);

  const runQuery = useCallback(
    async (sql?: string) => {
      if (!db) return;
      const activeTab = playground.tabs.find((t) => t.id === playground.activeTabId);
      const querySql = sql ?? activeTab?.sql ?? "";
      if (!querySql.trim()) return;

      setRunning(true);
      playground.setLastError(null);
      try {
        const results = executeQuery(db, querySql);
        playground.setLastResults(results);
        const entry: QueryHistoryEntry = {
          sql: querySql,
          timestamp: new Date().toISOString(),
          success: true,
        };
        playground.appendQueryHistory(entry);
        onSchemaChange?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Query failed.";
        playground.setLastError(message);
        playground.setLastResults([]);
        const entry: QueryHistoryEntry = {
          sql: querySql,
          timestamp: new Date().toISOString(),
          success: false,
        };
        playground.appendQueryHistory(entry);
      } finally {
        setRunning(false);
      }
    },
    [db, playground, onSchemaChange],
  );

  return {
    tabs: playground.tabs,
    activeTabId: playground.activeTabId,
    setActiveTabId: playground.setActiveTabId,
    addTab: playground.addTab,
    closeTab: playground.closeTab,
    updateTabSql: playground.updateTabSql,
    runQuery,
    running,
    queryHistory: playground.queryHistory,
    lastResults: playground.lastResults,
    lastError: playground.lastError,
    resetEditor: playground.resetEditor,
  };
}
