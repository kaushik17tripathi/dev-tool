"use client";

import { useCallback, useEffect, useRef } from "react";
import { format } from "sql-formatter";
import {
  Clock,
  History,
  Play,
  Plus,
  Save,
  Wand2,
  X,
} from "lucide-react";
import { SQL_SNIPPETS } from "@/lib/demo-data";
import type { SqlEditorController } from "@/hooks/usePlaygroundEditor";

type SqlEditorPanelProps = Omit<SqlEditorController, "resetEditor">;

export default function SqlEditorPanel({
  tabs,
  activeTabId,
  setActiveTabId,
  addTab,
  closeTab,
  updateTabSql,
  runQuery,
  running,
  queryHistory,
}: SqlEditorPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        void runQuery();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const term = prompt("Find:");
        if (term && textareaRef.current) {
          const idx = activeTab?.sql.indexOf(term) ?? -1;
          if (idx >= 0) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(idx, idx + term.length);
          }
        }
      }
    },
    [runQuery, activeTab?.sql],
  );

  const formatSql = () => {
    if (!activeTab) return;
    try {
      updateTabSql(activeTab.id, format(activeTab.sql, { language: "sqlite" }));
    } catch {
      /* keep original */
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [activeTab?.sql]);

  return (
    <div className="editor-panel">
      <div className="query-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={tab.id === activeTabId ? "query-tab active" : "query-tab"}
            onClick={() => setActiveTabId(tab.id)}
          >
            {tab.name}
            {tabs.length > 1 && (
              <span
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X size={12} />
              </span>
            )}
          </button>
        ))}
        <button className="query-tab add-tab" onClick={() => addTab()} aria-label="New query tab">
          <Plus size={14} />
        </button>
      </div>

      <div className="editor-toolbar">
        <div className="snippet-group">
          <select
            className="snippet-select"
            defaultValue=""
            onChange={(e) => {
              if (e.target.value && activeTab) {
                updateTabSql(activeTab.id, e.target.value);
                e.target.value = "";
              }
            }}
          >
            <option value="" disabled>Snippets</option>
            {SQL_SNIPPETS.map((s) => (
              <option key={s.name} value={s.sql}>{s.name}</option>
            ))}
          </select>
        </div>
        <button className="quiet-button" onClick={formatSql}>
          <Wand2 size={13} /> Format
        </button>
        <button className="quiet-button" onClick={() => addTab(activeTab?.sql ?? "", "Saved copy")}>
          <Save size={13} /> Save copy
        </button>
      </div>

      <div className="sql-editor-wrap">
        <textarea
          ref={textareaRef}
          className="sql-editor"
          spellCheck={false}
          value={activeTab?.sql ?? ""}
          onChange={(e) => activeTab && updateTabSql(activeTab.id, e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write SQL here... (Ctrl+Enter to run)"
          rows={8}
        />
      </div>

      <div className="editor-actions">
        <button className="run-button" onClick={() => void runQuery()} disabled={running}>
          <Play size={15} />
          {running ? "Running..." : "Run Query"}
        </button>
        <span className="shortcut-hint">Ctrl+Enter to run · Ctrl+F find</span>
      </div>

      {queryHistory.length > 0 && (
        <details className="history-panel">
          <summary>
            <History size={13} /> Query history ({queryHistory.length})
          </summary>
          <ul className="history-list">
            {queryHistory.slice(0, 20).map((entry, i) => (
              <li key={i} className={entry.success ? "" : "error"}>
                <button
                  onClick={() => activeTab && updateTabSql(activeTab.id, entry.sql)}
                  title={entry.sql}
                >
                  <Clock size={11} />
                  <code>{entry.sql.slice(0, 80)}{entry.sql.length > 80 ? "..." : ""}</code>
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
