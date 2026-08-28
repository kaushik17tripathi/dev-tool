"use client";

import { useCallback, useState } from "react";
import { useViewState } from "@/context/ViewStateContext";
import {
  createDatabase,
  getAllTablesInfo,
  getTableDDL,
} from "@/lib/database";
import { prepareDdlForSqlite } from "@/lib/postgres-to-sqlite";
import type { IsolatedViewId } from "@/lib/view-state";

export function useIsolatedDatabase(view: IsolatedViewId) {
  const {
    ready: viewStateReady,
    state,
    getDb,
    setIsolatedSql,
    setIsolatedDb,
    clearIsolatedDb,
  } = useViewState();

  const isolated = state[view].isolated;
  const sql = isolated.sql;
  const db = getDb(view);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const tables = db ? getAllTablesInfo(db) : [];
  const schemaSql = db ? getTableDDL(db) : "";
  const ready = isolated.ready && db !== null;

  const setSql = useCallback(
    (value: string) => {
      setIsolatedSql(view, value);
    },
    [view, setIsolatedSql],
  );

  const loadSchema = useCallback(
    async (schemaSqlInput?: string) => {
      const toRun = (schemaSqlInput ?? sql).trim();
      if (!toRun) {
        setError("Paste CREATE TABLE statements first.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const sqliteDdl = prepareDdlForSqlite(toRun);
        const database = await createDatabase(sqliteDdl);
        setIsolatedDb(view, database, toRun);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Failed to create database.");
        clearIsolatedDb(view);
      } finally {
        setLoading(false);
      }
    },
    [sql, view, setIsolatedDb, clearIsolatedDb],
  );

  const refreshTables = useCallback(() => {
    const currentDb = getDb(view);
    if (!currentDb) return;
    setIsolatedDb(view, currentDb);
  }, [view, getDb, setIsolatedDb]);

  return {
    sql,
    setSql,
    db,
    tables,
    schemaSql,
    error,
    loading,
    ready: viewStateReady && ready,
    loadSchema,
    refreshTables,
  };
}
