"use client";

import { useCallback, useState } from "react";
import {
  FileSpreadsheet,
  FileText,
  Filter,
  Search,
  SortAsc,
  Upload,
} from "lucide-react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { importCsvToSql, parseCsvText } from "@/lib/csv-utils";
import { profileDataset } from "@/lib/data-profile";
import { jsonToCsv, parseExcelFile, parseJsonFile } from "@/lib/export-utils";
import { getTablePreview } from "@/lib/database";

export default function DataExplorerView() {
  const { db, importSql, tables } = useWorkspace();
  const [preview, setPreview] = useState<{
    columns: string[];
    rows: unknown[][];
  } | null>(null);
  const [filter, setFilter] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [importing, setImporting] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setImporting(true);
      setMessage("");
      try {
        const sqlParts: string[] = [];
        for (const file of Array.from(files)) {
          const ext = file.name.split(".").pop()?.toLowerCase();
          if (ext === "csv" || ext === "txt") {
            const text = await file.text();
            const parsed = parseCsvText(text, file.name);
            sqlParts.push(importCsvToSql(parsed));
          } else if (ext === "xlsx" || ext === "xls") {
            const sheets = await parseExcelFile(file);
            for (const sheet of sheets) {
              const parsed = parseCsvText(sheet.text, sheet.name);
              sqlParts.push(importCsvToSql(parsed));
            }
          } else if (ext === "json") {
            const data = await parseJsonFile(file);
            const csv = jsonToCsv(data);
            const parsed = parseCsvText(csv, file.name);
            sqlParts.push(importCsvToSql(parsed));
          }
        }
        if (sqlParts.length) {
          await importSql(sqlParts.join("\n\n"));
          setMessage(`Imported ${files.length} file(s) successfully.`);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Import failed.");
      } finally {
        setImporting(false);
      }
    },
    [importSql],
  );

  const loadTablePreview = (tableName: string) => {
    if (!db) return;
    const result = getTablePreview(db, tableName, 500);
    setPreview({ columns: result.columns, rows: result.rows });
    setSortCol(null);
    setFilter("");
  };

  const displayedRows = preview
    ? preview.rows
        .filter((row) => {
          if (!filter) return true;
          return row.some((cell) =>
            String(cell ?? "").toLowerCase().includes(filter.toLowerCase()),
          );
        })
        .sort((a, b) => {
          if (!sortCol) return 0;
          const idx = preview.columns.indexOf(sortCol);
          if (idx < 0) return 0;
          return String(a[idx] ?? "").localeCompare(String(b[idx] ?? ""));
        })
    : [];

  const profile = preview ? profileDataset(preview.columns, preview.rows) : null;

  return (
    <div className="explorer-layout">
      <div className="explorer-import">
        <div
          className="drop-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <Upload size={28} />
          <p>Drop CSV, Excel, or JSON files here</p>
          <label className="upload-button">
            <input
              type="file"
              accept=".csv,.txt,.xlsx,.xls,.json"
              multiple
              hidden
              onChange={(e) => handleFiles(e.target.files)}
            />
            Choose files
          </label>
          {importing && <span>Importing...</span>}
          {message && <p className="import-message">{message}</p>}
        </div>

        <div className="import-formats">
          <span><FileText size={12} /> CSV</span>
          <span><FileSpreadsheet size={12} /> Excel</span>
          <span><FileText size={12} /> JSON</span>
        </div>
      </div>

      <div className="explorer-content">
        <aside className="explorer-tables">
          <strong>Tables</strong>
          <ul>
            {tables.map((t) => (
              <li key={t.name}>
                <button onClick={() => loadTablePreview(t.name)}>{t.name}</button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="explorer-data">
          {profile && (
            <div className="explorer-stats">
              <div className="stat-card">
                <span>Rows</span>
                <strong>{profile.rowCount.toLocaleString()}</strong>
              </div>
              <div className="stat-card">
                <span>Columns</span>
                <strong>{profile.columnCount}</strong>
              </div>
              <div className="stat-card">
                <span>Missing</span>
                <strong>{profile.missingPercent.toFixed(1)}%</strong>
              </div>
              <div className="stat-card">
                <span>Duplicates</span>
                <strong>{profile.duplicateRows}</strong>
              </div>
            </div>
          )}

          {preview && (
            <>
              <div className="explorer-toolbar">
                <label className="search-box">
                  <Search size={14} />
                  <input
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Filter rows..."
                  />
                </label>
                <label className="search-box">
                  <SortAsc size={14} />
                  <select
                    value={sortCol ?? ""}
                    onChange={(e) => setSortCol(e.target.value || null)}
                  >
                    <option value="">Sort by...</option>
                    {preview.columns.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <span className="row-count">
                  <Filter size={12} /> {displayedRows.length} rows shown
                </span>
              </div>

              <div className="results-table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      {preview.columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayedRows.slice(0, 200).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci}>{cell === null ? <em>null</em> : String(cell)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {profile && (
                <div className="column-profiles">
                  <h3>Column profiles</h3>
                  {profile.columns.map((col) => (
                    <div key={col.name} className="profile-col-card">
                      <strong>{col.name}</strong>
                      <span className="col-type">{col.type}</span>
                      <div className="col-stats">
                        <span>Unique: {col.unique}</span>
                        <span>Null: {col.nullCount}</span>
                        <span>Dup: {col.duplicateCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {!preview && (
            <div className="empty-panel">
              <p>Select a table or import data to explore</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
