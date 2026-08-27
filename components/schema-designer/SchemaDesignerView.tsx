"use client";

import { useCallback } from "react";
import { Plus, Trash2, Wand2 } from "lucide-react";
import DatabaseFileActions from "@/components/shared/DatabaseFileActions";
import { useViewState } from "@/context/ViewStateContext";
import { useWorkspace } from "@/context/WorkspaceContext";
import {
  generateSchemaDDL,
  SQL_TYPES,
  type DesignerColumn,
  type DesignerTable,
} from "@/lib/schema-ddl";
import type { TableInfo } from "@/lib/database";

function emptyTable(): DesignerTable {
  return {
    name: `table_${Date.now()}`,
    columns: [
      {
        name: "id",
        type: "INTEGER",
        primaryKey: true,
        notNull: true,
        unique: false,
      },
    ],
  };
}

function tablesToDesigner(tables: TableInfo[]): DesignerTable[] {
  return tables.map((t) => ({
    name: t.name,
    columns: t.columns.map((c) => ({
      name: c.name,
      type: c.type,
      primaryKey: c.pk,
      notNull: c.notnull,
      unique: false,
    })),
  }));
}

export default function SchemaDesignerView() {
  const { importSql, tables: dbTables } = useWorkspace();
  const { schemaDesigner } = useViewState();
  const { designTables, selectedIdx } = schemaDesigner;

  const selected = designTables[selectedIdx];

  const updateTable = useCallback(
    (table: DesignerTable) => {
      schemaDesigner.updateDesignTables((prev) =>
        prev.map((t, i) => (i === selectedIdx ? table : t)),
      );
    },
    [schemaDesigner, selectedIdx],
  );

  const addColumn = () => {
    if (!selected) return;
    updateTable({
      ...selected,
      columns: [
        ...selected.columns,
        { name: "new_column", type: "TEXT", primaryKey: false, notNull: false, unique: false },
      ],
    });
  };

  const updateColumn = (colIdx: number, col: DesignerColumn) => {
    if (!selected) return;
    updateTable({
      ...selected,
      columns: selected.columns.map((c, i) => (i === colIdx ? col : c)),
    });
  };

  const removeColumn = (colIdx: number) => {
    if (!selected) return;
    updateTable({
      ...selected,
      columns: selected.columns.filter((_, i) => i !== colIdx),
    });
  };

  const generatedDDL = generateSchemaDDL(designTables);

  const applyToDatabase = async () => {
    await importSql(generatedDDL);
  };

  const loadFromDatabase = useCallback(
    (tables: TableInfo[] = dbTables) => {
      const loaded = tablesToDesigner(tables);
      if (loaded.length) {
        schemaDesigner.setDesignTables(loaded);
        schemaDesigner.setSelectedIdx(0);
      }
    },
    [dbTables, schemaDesigner],
  );

  return (
    <div className="designer-layout">
      <aside className="designer-sidebar">
        <div className="sidebar-header">
          <strong>Tables</strong>
          <button
            className="quiet-button"
            onClick={() => {
              schemaDesigner.updateDesignTables((prev) => [...prev, emptyTable()]);
              schemaDesigner.setSelectedIdx(designTables.length);
            }}
          >
            <Plus size={12} /> New
          </button>
        </div>
        <ul>
          {designTables.map((t, i) => (
            <li key={i}>
              <button
                className={i === selectedIdx ? "active" : ""}
                onClick={() => schemaDesigner.setSelectedIdx(i)}
              >
                {t.name}
              </button>
            </li>
          ))}
        </ul>
        <button className="quiet-button" onClick={() => loadFromDatabase()}>
          Load from database
        </button>

        <div className="designer-import-export">
          <DatabaseFileActions
            layout="grid"
            exportSqlContent={generatedDDL}
            showImportSqlite={false}
            showImportSql={false}
            showExportSql
            showExportSqlite
          />
        </div>
      </aside>

      <div className="designer-main">
        {selected && (
          <>
            <div className="designer-table-header">
              <label>
                Table name
                <input
                  value={selected.name}
                  onChange={(e) => updateTable({ ...selected, name: e.target.value })}
                />
              </label>
            </div>

            <table className="designer-columns-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>PK</th>
                  <th>NOT NULL</th>
                  <th>UNIQUE</th>
                  <th>Default</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {selected.columns.map((col, colIdx) => (
                  <tr key={colIdx}>
                    <td>
                      <input
                        value={col.name}
                        onChange={(e) =>
                          updateColumn(colIdx, { ...col, name: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <select
                        value={col.type}
                        onChange={(e) =>
                          updateColumn(colIdx, { ...col, type: e.target.value })
                        }
                      >
                        {SQL_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={col.primaryKey}
                        onChange={(e) =>
                          updateColumn(colIdx, { ...col, primaryKey: e.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={col.notNull}
                        onChange={(e) =>
                          updateColumn(colIdx, { ...col, notNull: e.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={col.unique}
                        onChange={(e) =>
                          updateColumn(colIdx, { ...col, unique: e.target.checked })
                        }
                      />
                    </td>
                    <td>
                      <input
                        value={col.defaultValue ?? ""}
                        placeholder="DEFAULT"
                        onChange={(e) =>
                          updateColumn(colIdx, {
                            ...col,
                            defaultValue: e.target.value || undefined,
                          })
                        }
                      />
                    </td>
                    <td>
                      <button onClick={() => removeColumn(colIdx)}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button className="quiet-button" onClick={addColumn}>
              <Plus size={12} /> Add column
            </button>
          </>
        )}
      </div>

      <aside className="designer-output">
        <div className="builder-output-header">
          <strong>Generated DDL</strong>
          <button className="run-button" onClick={applyToDatabase}>
            <Wand2 size={14} /> Apply to database
          </button>
        </div>
        <pre className="generated-sql">{generatedDDL}</pre>
      </aside>
    </div>
  );
}
