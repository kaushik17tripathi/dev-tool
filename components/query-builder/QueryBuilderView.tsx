"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Columns3,
  Filter,
  HelpCircle,
  ListOrdered,
  Plus,
  RotateCcw,
  Sparkles,
  Table2,
  X,
} from "lucide-react";
import SchemaSqlPanel from "@/components/shared/SchemaSqlPanel";
import { useViewState } from "@/context/ViewStateContext";
import { useIsolatedDatabase } from "@/hooks/useIsolatedDatabase";
import {
  generateSqlFromBuilder,
  type BuilderFilter,
} from "@/lib/query-builder-sql";

type FilterOp = BuilderFilter["operator"];

const FILTER_OPTIONS: { value: FilterOp; label: string; needsValue: boolean }[] = [
  { value: "=", label: "equals", needsValue: true },
  { value: "!=", label: "does not equal", needsValue: true },
  { value: ">", label: "is greater than", needsValue: true },
  { value: "<", label: "is less than", needsValue: true },
  { value: ">=", label: "is at least", needsValue: true },
  { value: "<=", label: "is at most", needsValue: true },
  { value: "LIKE", label: "contains text", needsValue: true },
  { value: "IS NULL", label: "is empty", needsValue: false },
  { value: "IS NOT NULL", label: "is not empty", needsValue: false },
];

function parseColumnRef(ref: string): { table: string; column: string } {
  const dot = ref.indexOf(".");
  if (dot === -1) return { table: "", column: ref };
  return { table: ref.slice(0, dot), column: ref.slice(dot + 1) };
}

function formatColumnLabel(ref: string, multiTable: boolean): string {
  if (!ref || ref.endsWith(".*")) {
    const table = ref.endsWith(".*") ? ref.slice(0, -2) : "";
    return table ? `All columns from ${table}` : "All columns";
  }
  const { table, column } = parseColumnRef(ref);
  return multiTable && table ? `${table} → ${column}` : column;
}

function StepCard({
  step,
  title,
  hint,
  children,
  disabled,
}: {
  step: number;
  title: string;
  hint: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <section className="qb-step" aria-disabled={disabled}>
      <div className="qb-step-head">
        <span className="qb-step-num">{step}</span>
        <div className="qb-step-titles">
          <h3 className="qb-step-title">{title}</h3>
          <p className="qb-step-hint">{hint}</p>
        </div>
      </div>
      <div className="qb-step-body">{children}</div>
    </section>
  );
}

export default function QueryBuilderView() {
  const { queryBuilder } = useViewState();
  const { sql, setSql, tables, error, loading, ready, loadSchema } =
    useIsolatedDatabase("query-builder");

  const state = queryBuilder.builder;
  const [copied, setCopied] = useState(false);
  const showAdvanced = queryBuilder.showAdvanced;
  const setShowAdvanced = queryBuilder.setShowAdvanced;
  const [showSqlHelp, setShowSqlHelp] = useState(false);

  const tableNames = tables.map((t) => t.name);
  const generatedSql = useMemo(() => generateSqlFromBuilder(state), [state]);

  const multiTable = state.tables.length > 1;

  const tableColumns = state.tables.flatMap((t) => {
    const info = tables.find((ti) => ti.name === t.name);
    return (
      info?.columns.map((c) => ({
        ref: `${t.name}.${c.name}`,
        table: t.name,
        name: c.name,
        type: c.type,
      })) ?? []
    );
  });

  const addTable = (name: string) => {
    if (!name || state.tables.some((t) => t.name === name)) return;
    queryBuilder.updateBuilder((s) => ({
      ...s,
      tables: [...s.tables, { name }],
    }));
  };

  const addFilter = () => {
    queryBuilder.updateBuilder((s) => ({
      ...s,
      filters: [...s.filters, { column: "", operator: "=", value: "" }],
    }));
  };

  const updateFilter = (index: number, filter: BuilderFilter) => {
    queryBuilder.updateBuilder((s) => ({
      ...s,
      filters: s.filters.map((f, i) => (i === index ? filter : f)),
    }));
  };

  const removeFilter = (index: number) => {
    queryBuilder.updateBuilder((s) => ({
      ...s,
      filters: s.filters.filter((_, i) => i !== index),
    }));
  };

  const handleLoadSchema = () => {
    queryBuilder.resetBuilder();
    void loadSchema();
  };

  const resetQuery = () => queryBuilder.resetBuilder();

  const copySql = async () => {
    try {
      await navigator.clipboard.writeText(generatedSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const hasTables = state.tables.length > 0;
  const showingAllColumns = state.selectColumns.length === 0;
  const visibleSelectColumns = state.selectColumns.filter(
    (c) => c && !c.endsWith(".*")
  );

  const plainSummary = (() => {
    if (!hasTables) return "";
    const parts: string[] = [];
    const tableLabel =
      state.tables.length === 1
        ? `from ${state.tables[0].name}`
        : `from ${state.tables.length} tables`;
    parts.push(tableLabel);
    if (showingAllColumns) {
      parts.push("all fields");
    } else {
      parts.push(`${visibleSelectColumns.length} field${visibleSelectColumns.length !== 1 ? "s" : ""}`);
    }
    if (state.filters.length > 0) {
      parts.push(`${state.filters.length} condition${state.filters.length !== 1 ? "s" : ""}`);
    }
    if (state.limit) {
      parts.push(`max ${state.limit} rows`);
    }
    return parts.join(" · ");
  })();

  return (
    <div className="independent-layout">
      <SchemaSqlPanel
        sql={sql}
        onSqlChange={setSql}
        onLoad={handleLoadSchema}
        loading={loading}
        error={error}
        tableCount={tables.length}
        title="Your Database"
        description="Paste SQL to create tables, then use the steps on the right to pull data without writing code."
      />

      <div className="independent-main">
        {!ready ? (
          <div className="independent-empty">
            <Sparkles size={28} className="qb-empty-icon" />
            <p>
              Load your database on the left, then follow the steps here to get
              your data.
            </p>
          </div>
        ) : (
          <div className="builder-layout builder-layout-embedded qb-layout">
            <div className="builder-panel qb-panel">
              <header className="qb-header">
                <div className="qb-header-main">
                  <div className="qb-header-icon">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2>Get your data</h2>
                    <p className="builder-desc">
                      Answer a few simple questions — we&apos;ll write the SQL for
                      you.
                    </p>
                  </div>
                </div>
                <div className="qb-header-actions">
                  {plainSummary && (
                    <span className="qb-summary">{plainSummary}</span>
                  )}
                  <button
                    type="button"
                    className="qb-ghost-btn"
                    onClick={resetQuery}
                    disabled={!hasTables && state.filters.length === 0}
                  >
                    <RotateCcw size={14} />
                    Start over
                  </button>
                </div>
              </header>

              <div className="qb-clauses">
                <StepCard
                  step={1}
                  title="Which table has your data?"
                  hint="Pick the spreadsheet-style list you want to look at."
                >
                  <select
                    className="qb-select"
                    defaultValue=""
                    onChange={(e) => {
                      addTable(e.target.value);
                      e.target.value = "";
                    }}
                  >
                    <option value="" disabled>Choose a table…</option>
                    {tableNames
                      .filter((n) => !state.tables.some((t) => t.name === n))
                      .map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                  </select>
                  {state.tables.length === 0 ? (
                    <p className="qb-helper">
                      <HelpCircle size={14} />
                      Example: pick &quot;Customers&quot; to see customer rows.
                    </p>
                  ) : (
                    <div className="tag-list qb-tag-list">
                      {state.tables.map((t) => (
                        <span key={t.name} className="tag qb-tag">
                          <Table2 size={12} />
                          {t.name}
                          <button
                            type="button"
                            className="qb-tag-remove"
                            aria-label={`Remove ${t.name}`}
                            onClick={() =>
                              queryBuilder.updateBuilder((s) => ({
                                ...s,
                                tables: s.tables.filter((tb) => tb.name !== t.name),
                                selectColumns: s.selectColumns.filter(
                                  (c) => !c.startsWith(`${t.name}.`)
                                ),
                                groupBy: s.groupBy.filter(
                                  (c) => !c.startsWith(`${t.name}.`)
                                ),
                                filters: s.filters.filter(
                                  (f) => !f.column.startsWith(`${t.name}.`)
                                ),
                              }))
                            }
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </StepCard>

                <StepCard
                  step={2}
                  title="What do you want to see?"
                  hint="Leave as “all fields” or pick specific columns."
                  disabled={!hasTables}
                >
                  <select
                    className="qb-select"
                    disabled={!hasTables}
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      if (v === "__ALL__") {
                        queryBuilder.updateBuilder((s) => ({ ...s, selectColumns: [] }));
                      } else {
                        queryBuilder.updateBuilder((s) => ({
                          ...s,
                          selectColumns: [...s.selectColumns, v],
                        }));
                      }
                      e.target.value = "";
                    }}
                  >
                    <option value="" disabled>
                      {hasTables ? "Add a field to show…" : "Pick a table first"}
                    </option>
                    {showingAllColumns && (
                      <option value="__ALL__">All fields (current)</option>
                    )}
                    {!showingAllColumns && (
                      <option value="__ALL__">Switch back to all fields</option>
                    )}
                    {tableColumns
                      .filter((c) => !state.selectColumns.includes(c.ref))
                      .map((c) => (
                        <option key={c.ref} value={c.ref}>
                          {formatColumnLabel(c.ref, multiTable)}
                          {c.type ? ` (${c.type})` : ""}
                        </option>
                      ))}
                  </select>

                  {showingAllColumns ? (
                    <div className="qb-default-chip">
                      <Columns3 size={14} />
                      <span>All fields — every column in your table</span>
                    </div>
                  ) : (
                    <div className="tag-list qb-tag-list">
                      {visibleSelectColumns.map((col) => (
                        <span key={col} className="tag qb-tag">
                          <Columns3 size={12} />
                          {formatColumnLabel(col, multiTable)}
                          <button
                            type="button"
                            className="qb-tag-remove"
                            aria-label={`Remove ${col}`}
                            onClick={() =>
                              queryBuilder.updateBuilder((s) => ({
                                ...s,
                                selectColumns: s.selectColumns.filter((c) => c !== col),
                              }))
                            }
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </StepCard>

                <StepCard
                  step={3}
                  title="Any rules for which rows to include?"
                  hint="Optional — skip this to include every row."
                  disabled={!hasTables}
                >
                  {state.filters.length === 0 ? (
                    <div className="qb-empty-slot qb-empty-slot--dashed">
                      <span>Every row will be included.</span>
                      {hasTables && (
                        <button type="button" className="qb-link-btn" onClick={addFilter}>
                          Add a rule (e.g. only active users)
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="qb-filters">
                      {state.filters.map((filter, i) => {
                        const needsValue = FILTER_OPTIONS.find(
                          (o) => o.value === filter.operator
                        )?.needsValue;
                        return (
                          <div key={i} className="qb-filter-wrap">
                            {i > 0 && (
                              <span className="qb-and-label">and also</span>
                            )}
                            <div className="qb-filter-card qb-filter-card--friendly">
                              <div className="qb-filter-card-header">
                                <span className="qb-filter-label">
                                  Only include rows where
                                </span>
                                <button
                                  type="button"
                                  className="qb-filter-remove"
                                  aria-label="Remove rule"
                                  onClick={() => removeFilter(i)}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                              <div className="qb-filter-fields">
                                <select
                                  className="qb-filter-field"
                                  value={filter.column}
                                  onChange={(e) =>
                                    updateFilter(i, { ...filter, column: e.target.value })
                                  }
                                >
                                  <option value="">choose a field…</option>
                                  {tableColumns.map((c) => (
                                    <option key={c.ref} value={c.ref}>
                                      {formatColumnLabel(c.ref, multiTable)}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="qb-filter-op"
                                  value={filter.operator}
                                  onChange={(e) =>
                                    updateFilter(i, {
                                      ...filter,
                                      operator: e.target.value as FilterOp,
                                    })
                                  }
                                >
                                  {FILTER_OPTIONS.map((op) => (
                                    <option key={op.value} value={op.value}>
                                      {op.label}
                                    </option>
                                  ))}
                                </select>
                                {needsValue && (
                                  <input
                                    className="qb-filter-value"
                                    value={filter.value ?? ""}
                                    onChange={(e) =>
                                      updateFilter(i, { ...filter, value: e.target.value })
                                    }
                                    placeholder="enter a value…"
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {hasTables && state.filters.length > 0 && (
                    <button type="button" className="qb-add-btn qb-add-btn--block" onClick={addFilter}>
                      <Plus size={14} />
                      Add another rule
                    </button>
                  )}
                </StepCard>

                <div className="qb-advanced-toggle">
                  <button
                    type="button"
                    className="qb-advanced-btn"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    aria-expanded={showAdvanced}
                  >
                    <ListOrdered size={14} />
                    {showAdvanced ? "Hide extra options" : "More options (grouping & row limit)"}
                    {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {showAdvanced && (
                  <div className="qb-advanced-panel">
                    <StepCard
                      step={4}
                      title="Group similar rows together?"
                      hint="Advanced — counts or totals per category (e.g. orders per city)."
                      disabled={!hasTables}
                    >
                      <select
                        className="qb-select"
                        disabled={!hasTables}
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            queryBuilder.updateBuilder((s) => ({
                              ...s,
                              groupBy: [...s.groupBy, e.target.value],
                            }));
                            e.target.value = "";
                          }
                        }}
                      >
                        <option value="" disabled>Choose a field to group by…</option>
                        {tableColumns
                          .filter((c) => !state.groupBy.includes(c.ref))
                          .map((c) => (
                            <option key={c.ref} value={c.ref}>
                              {formatColumnLabel(c.ref, multiTable)}
                            </option>
                          ))}
                      </select>
                      {state.groupBy.length > 0 && (
                        <div className="tag-list qb-tag-list">
                          {state.groupBy.map((col) => (
                            <span key={col} className="tag qb-tag">
                              {formatColumnLabel(col, multiTable)}
                              <button
                                type="button"
                                className="qb-tag-remove"
                                aria-label={`Remove ${col}`}
                                onClick={() =>
                                  queryBuilder.updateBuilder((s) => ({
                                    ...s,
                                    groupBy: s.groupBy.filter((c) => c !== col),
                                  }))
                                }
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </StepCard>

                    <StepCard
                      step={5}
                      title="How many rows do you want back?"
                      hint="Optional — useful for previews (e.g. first 10 rows)."
                      disabled={!hasTables}
                    >
                      <input
                        className="qb-limit-input"
                        type="number"
                        min={1}
                        disabled={!hasTables}
                        placeholder="No limit — show everything"
                        value={state.limit ?? ""}
                        onChange={(e) =>
                          queryBuilder.updateBuilder((s) => ({
                            ...s,
                            limit: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                      />
                    </StepCard>
                  </div>
                )}
              </div>
            </div>

            <div className="builder-output qb-output">
              <div className="builder-output-header qb-output-header">
                <div className="qb-output-title">
                  <span className="qb-output-label">Your query</span>
                  <span className="qb-output-hint">
                    Written in SQL — copy and run anywhere
                  </span>
                </div>
                <button
                  type="button"
                  className="qb-copy-btn"
                  onClick={() => void copySql()}
                  disabled={!hasTables}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <button
                type="button"
                className="qb-sql-help-toggle"
                onClick={() => setShowSqlHelp((v) => !v)}
                aria-expanded={showSqlHelp}
              >
                <HelpCircle size={14} />
                {showSqlHelp ? "Hide what this means" : "What is SQL?"}
              </button>
              {showSqlHelp && (
                <p className="qb-sql-help">
                  SQL is the language databases understand. You don&apos;t need to
                  learn it here — just use the steps on the left and we&apos;ll
                  build the query for you.
                </p>
              )}
              <div className="qb-sql-wrap">
                <pre className="generated-sql qb-generated-sql">{generatedSql}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
