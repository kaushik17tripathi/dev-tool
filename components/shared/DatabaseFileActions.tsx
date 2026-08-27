"use client";

import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import type { Database } from "sql.js";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useDatabaseImport, type ImportResult } from "@/hooks/useDatabaseImport";
import { createDatabase, exportDatabaseBytes } from "@/lib/database";
import { downloadBytes, downloadText } from "@/lib/export-utils";

type DatabaseFileActionsProps = {
  exportDb?: Database | null;
  exportSqlContent?: string;
  onImported?: (result: ImportResult) => void;
  layout?: "inline" | "grid";
  showImportSqlite?: boolean;
  showImportSql?: boolean;
  showExportSqlite?: boolean;
  showExportSql?: boolean;
  highlightImport?: boolean;
};

function formatImportMessage(fileName: string, tableCount: number) {
  return `Imported "${fileName}" (${tableCount} table${tableCount === 1 ? "" : "s"}).`;
}

export default function DatabaseFileActions({
  exportDb,
  exportSqlContent,
  onImported,
  layout = "inline",
  showImportSqlite = true,
  showImportSql = true,
  showExportSqlite = true,
  showExportSql = false,
  highlightImport = false,
}: DatabaseFileActionsProps) {
  const { db: workspaceDb } = useWorkspace();
  const { importFromBytes, importFromSql } = useDatabaseImport();
  const sqliteInputRef = useRef<HTMLInputElement>(null);
  const sqlInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [messageIsError, setMessageIsError] = useState(false);

  const handleDbImport = async (file: File) => {
    setMessageIsError(false);
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const result = await importFromBytes(bytes);
      onImported?.(result);
      setMessage(formatImportMessage(file.name, result.tableCount));
    } catch (error) {
      setMessageIsError(true);
      setMessage(
        error instanceof Error
          ? `Import failed: ${error.message}`
          : "Import failed. Check that the file is a valid SQLite database.",
      );
    } finally {
      if (sqliteInputRef.current) sqliteInputRef.current.value = "";
    }
  };

  const handleSqlImport = async (file: File) => {
    setMessageIsError(false);
    try {
      const result = await importFromSql(await file.text());
      onImported?.(result);
      setMessage(formatImportMessage(file.name, result.tableCount));
    } catch (error) {
      setMessageIsError(true);
      setMessage(
        error instanceof Error ? `SQL import failed: ${error.message}` : "SQL import failed.",
      );
    } finally {
      if (sqlInputRef.current) sqlInputRef.current.value = "";
    }
  };

  const handleExportSqlite = async () => {
    setMessageIsError(false);
    try {
      if (exportSqlContent?.trim()) {
        const tempDb = await createDatabase(exportSqlContent);
        const bytes = exportDatabaseBytes(tempDb);
        tempDb.close();
        downloadBytes(bytes, "database.sqlite", "application/x-sqlite3");
      } else {
        const db = exportDb ?? workspaceDb;
        if (!db) {
          setMessageIsError(true);
          setMessage("No database loaded to export.");
          return;
        }
        const bytes = exportDatabaseBytes(db);
        downloadBytes(bytes, "database.sqlite", "application/x-sqlite3");
      }
      setMessage("SQLite database exported.");
    } catch (error) {
      setMessageIsError(true);
      setMessage(
        error instanceof Error
          ? `Export failed: ${error.message}`
          : "SQLite export failed.",
      );
    }
  };

  const handleExportSql = () => {
    const sql = exportSqlContent?.trim();
    if (!sql) {
      setMessageIsError(true);
      setMessage("No SQL to export.");
      return;
    }
    downloadText(sql, "schema.sql", "text/sql");
    setMessageIsError(false);
    setMessage("SQL schema exported.");
  };

  const cardClass = (isImport: boolean) => {
    const base = layout === "grid" ? "ie-card" : "quiet-button file-action-button";
    return isImport && highlightImport ? `${base} import-highlight` : base;
  };

  const className = layout === "grid" ? "import-export-grid" : "database-file-actions";

  return (
    <div className="database-file-actions-wrap">
      <div className={className}>
        {showImportSqlite && (
          <label className={cardClass(true)}>
            <input
              ref={sqliteInputRef}
              type="file"
              accept=".sqlite,.db,.sqlite3"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleDbImport(file);
              }}
            />
            <Upload size={layout === "grid" ? 20 : 13} />
            {layout === "grid" ? (
              <>
                <strong>Import SQLite</strong>
                <span>Open .sqlite database file</span>
              </>
            ) : (
              "Import SQLite"
            )}
          </label>
        )}

        {showImportSql && (
          <label className={cardClass(true)}>
            <input
              ref={sqlInputRef}
              type="file"
              accept=".sql"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleSqlImport(file);
              }}
            />
            <Upload size={layout === "grid" ? 20 : 13} />
            {layout === "grid" ? (
              <>
                <strong>Import SQL</strong>
                <span>Run schema.sql file</span>
              </>
            ) : (
              "Import SQL"
            )}
          </label>
        )}

        {showExportSql && (
          <button
            type="button"
            className={layout === "grid" ? "ie-card" : "quiet-button file-action-button"}
            onClick={handleExportSql}
          >
            <Download size={layout === "grid" ? 20 : 13} />
            {layout === "grid" ? (
              <>
                <strong>Export SQL</strong>
                <span>Download schema.sql file</span>
              </>
            ) : (
              "Export SQL"
            )}
          </button>
        )}

        {showExportSqlite && (
          <button
            type="button"
            className={layout === "grid" ? "ie-card" : "quiet-button file-action-button"}
            onClick={() => void handleExportSqlite()}
          >
            <Download size={layout === "grid" ? 20 : 13} />
            {layout === "grid" ? (
              <>
                <strong>Export SQLite</strong>
                <span>Download .sqlite file</span>
              </>
            ) : (
              "Export SQLite"
            )}
          </button>
        )}
      </div>

      {message && (
        <p className={messageIsError ? "import-message error" : "import-message"}>{message}</p>
      )}
    </div>
  );
}
