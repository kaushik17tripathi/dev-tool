"use client";

import { Database, Play, RotateCcw } from "lucide-react";
import { DEMO_SEED_SQL } from "@/lib/demo-data";

import type { ReactNode } from "react";

type SchemaSqlPanelProps = {
  sql: string;
  onSqlChange: (sql: string) => void;
  onLoad: () => void;
  loading?: boolean;
  error?: string | null;
  tableCount?: number;
  title?: string;
  description?: string;
  fileActions?: ReactNode;
};

export default function SchemaSqlPanel({
  sql,
  onSqlChange,
  onLoad,
  loading = false,
  error = null,
  tableCount = 0,
  title = "Schema SQL",
  description = "Paste CREATE TABLE statements to build your database. This section is independent from the playground.",
  fileActions,
}: SchemaSqlPanelProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      onLoad();
    }
  };

  return (
    <aside className="schema-sql-panel">
      <div className="schema-sql-header">
        <div>
          <p className="schema-sql-eyebrow">
            <Database size={13} /> {title}
          </p>
          <p className="schema-sql-desc">{description}</p>
        </div>
        <button
          className="quiet-button"
          type="button"
          onClick={() => onSqlChange(DEMO_SEED_SQL)}
        >
          <RotateCcw size={13} /> Demo
        </button>
      </div>

      <div className="schema-sql-editor-wrap">
        <textarea
          className="schema-sql-editor"
          spellCheck={false}
          value={sql}
          onChange={(e) => onSqlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`CREATE TABLE users (\n  id INTEGER PRIMARY KEY,\n  name TEXT NOT NULL\n);\n\nCREATE TABLE orders (\n  id INTEGER PRIMARY KEY,\n  user_id INTEGER REFERENCES users(id)\n);`}
          rows={14}
        />
      </div>

      <div className="schema-sql-actions">
        <button
          className="run-button"
          type="button"
          onClick={onLoad}
          disabled={loading || !sql.trim()}
        >
          <Play size={14} />
          {loading ? "Creating..." : "Create Database"}
        </button>
        <span className="shortcut-hint">Ctrl+Enter to run</span>
      </div>

      {fileActions}

      {error && <div className="schema-sql-error">{error}</div>}

      {tableCount > 0 && !error && (
        <div className="schema-sql-status">
          {tableCount} table{tableCount === 1 ? "" : "s"} loaded
        </div>
      )}
    </aside>
  );
}
