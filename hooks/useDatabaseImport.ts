"use client";

import { useCallback } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useViewState } from "@/context/ViewStateContext";
import {
  createDatabase,
  exportDatabaseBytes,
  getAllTablesInfo,
  getTableDDL,
  loadDatabaseFromBytes,
  type TableInfo,
} from "@/lib/database";
import type { IsolatedViewId } from "@/lib/view-state";

const ISOLATED_VIEWS: IsolatedViewId[] = ["playground", "query-builder", "erd"];

export type ImportResult = {
  tableCount: number;
  tableNames: string[];
  schemaSql: string;
  tables: TableInfo[];
};

async function syncIsolatedViews(
  bytes: Uint8Array,
  schemaSql: string,
  setIsolatedDb: ReturnType<typeof useViewState>["setIsolatedDb"],
) {
  for (const view of ISOLATED_VIEWS) {
    const db = await loadDatabaseFromBytes(bytes);
    setIsolatedDb(view, db, schemaSql);
  }
}

export function useDatabaseImport() {
  const { importDatabaseFile, importSql } = useWorkspace();
  const { setIsolatedDb } = useViewState();

  const importFromBytes = useCallback(
    async (bytes: Uint8Array): Promise<ImportResult> => {
      const previewDb = await loadDatabaseFromBytes(bytes);
      const tables = getAllTablesInfo(previewDb);
      const schemaSql = getTableDDL(previewDb);
      previewDb.close();

      await importDatabaseFile(bytes);
      await syncIsolatedViews(bytes, schemaSql, setIsolatedDb);

      return {
        tableCount: tables.length,
        tableNames: tables.map((t) => t.name),
        schemaSql,
        tables,
      };
    },
    [importDatabaseFile, setIsolatedDb],
  );

  const importFromSql = useCallback(
    async (sql: string): Promise<ImportResult> => {
      await importSql(sql);

      const db = await createDatabase(sql);
      const tables = getAllTablesInfo(db);
      const schemaSql = getTableDDL(db);
      const bytes = exportDatabaseBytes(db);
      db.close();

      await syncIsolatedViews(bytes, schemaSql, setIsolatedDb);

      return {
        tableCount: tables.length,
        tableNames: tables.map((t) => t.name),
        schemaSql,
        tables,
      };
    },
    [importSql, setIsolatedDb],
  );

  return { importFromBytes, importFromSql };
}
