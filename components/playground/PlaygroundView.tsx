"use client";

import { useCallback } from "react";
import { ChevronRight, Table2 } from "lucide-react";
import DatabaseFileActions from "@/components/shared/DatabaseFileActions";
import SchemaSqlPanel from "@/components/shared/SchemaSqlPanel";
import SqlEditorPanel from "@/components/editor/SqlEditorPanel";
import ResultsPanel from "@/components/results/ResultsPanel";
import { useViewState } from "@/context/ViewStateContext";
import { useIsolatedDatabase } from "@/hooks/useIsolatedDatabase";
import { usePlaygroundEditor } from "@/hooks/usePlaygroundEditor";
import type { ImportResult } from "@/hooks/useDatabaseImport";

export default function PlaygroundView() {
  const { playground } = useViewState();
  const {
    sql,
    setSql,
    db,
    tables,
    error,
    loading,
    ready,
    loadSchema,
    refreshTables,
  } = useIsolatedDatabase("playground");

  const editor = usePlaygroundEditor(db, refreshTables);
  const activeTab = editor.tabs.find((t) => t.id === editor.activeTabId);

  const handleLoadSchema = useCallback(() => {
    editor.resetEditor();
    playground.setSelectedTable(null);
    void loadSchema();
  }, [editor, loadSchema, playground]);

  const handleImported = useCallback(
    (result: ImportResult) => {
      setSql(result.schemaSql);
      editor.resetEditor();
      playground.setSelectedTable(null);
    },
    [editor, playground, setSql],
  );

  const previewTable = (tableName: string) => {
    if (!db || !activeTab) return;
    if (playground.selectedTable === tableName) {
      playground.setSelectedTable(null);
      return;
    }
    editor.updateTabSql(activeTab.id, `SELECT * FROM ${tableName} LIMIT 100;`);
    playground.setSelectedTable(tableName);
  };

  return (
    <div className="independent-layout playground-independent-layout">
      <SchemaSqlPanel
        sql={sql}
        onSqlChange={setSql}
        onLoad={handleLoadSchema}
        loading={loading}
        error={error}
        tableCount={tables.length}
        title="Your Database"
        description="Paste SQL, import a file, or load demo data to start querying."
        fileActions={
          <DatabaseFileActions
            exportDb={db}
            onImported={handleImported}
            highlightImport
          />
        }
      />

      <div className="independent-main">
        {!ready ? (
          <div className="independent-empty">
            <p>Paste your database SQL and click Create Database to start querying.</p>
          </div>
        ) : (
          <div className="playground-layout">
            <aside className="tables-sidebar">
              <div className="sidebar-title">
                <Table2 size={14} />
                Tables
              </div>
              <ul className="table-list">
                {tables.map((table) => (
                  <li key={table.name}>
                    <button
                      type="button"
                      className={playground.selectedTable === table.name ? "active" : ""}
                      onClick={() => previewTable(table.name)}
                    >
                      <span>{table.name}</span>
                      <span className="table-meta">{table.columns.length} cols</span>
                      <ChevronRight size={12} />
                    </button>
                    {playground.selectedTable === table.name && (
                      <ul className="column-list">
                        {table.columns.map((col) => (
                          <li key={col.name}>
                            {col.pk && <strong>PK </strong>}
                            {col.name} <em>{col.type}</em>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </aside>

            <div className="playground-main">
              <SqlEditorPanel
                tabs={editor.tabs}
                activeTabId={editor.activeTabId}
                setActiveTabId={editor.setActiveTabId}
                addTab={editor.addTab}
                closeTab={editor.closeTab}
                updateTabSql={editor.updateTabSql}
                runQuery={editor.runQuery}
                running={editor.running}
                queryHistory={editor.queryHistory}
              />
              <ResultsPanel
                lastResults={editor.lastResults}
                lastError={editor.lastError}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
