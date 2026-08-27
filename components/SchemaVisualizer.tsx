"use client";

import {
  Braces,
  Check,
  ChevronRight,
  Database,
  FileCode2,
  KeyRound,
  Link2,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Scan,
  Search,
  ShieldCheck,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { format } from "sql-formatter";
import {
  PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ParsedSchema,
  SqlRelation,
  SqlTable,
  parsePostgresSchema,
} from "@/lib/sql-parser";

const TABLE_WIDTH = 264;
const HEADER_HEIGHT = 48;
const ROW_HEIGHT = 36;
const CANVAS_WIDTH = 3200;
const CANVAS_HEIGHT = 2200;

const DEMO_SQL = `CREATE TABLE users (
  id UUID PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE projects (
  id BIGSERIAL PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  status VARCHAR(30) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL,
  assignee_id UUID,
  title TEXT NOT NULL,
  priority SMALLINT DEFAULT 2,
  completed_at TIMESTAMPTZ,
  CONSTRAINT fk_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_assignee FOREIGN KEY (assignee_id) REFERENCES users(id)
);

CREATE TABLE comments (
  id BIGSERIAL PRIMARY KEY,
  task_id BIGINT NOT NULL REFERENCES tasks(id),
  author_id UUID NOT NULL REFERENCES users(id),
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

const CONFIG = {
    label: "PostgreSQL",
    brand: "Postgres",
    inputTitle: "PostgreSQL DDL",
    fileName: "schema.sql",
    entitySingular: "table",
    entityPlural: "tables",
    fieldSingular: "column",
    searchPlaceholder: "Find table or column",
    supportTitle: "Supported PostgreSQL DDL",
    supportText:
      "CREATE TABLE, primary keys, data types, inline and table-level foreign keys, quoted names, and ALTER TABLE foreign keys.",
    privacyNote:
      "Your SQL never leaves this tab. No database connection or backend is used.",
    schemaLabel: "public",
    demo: DEMO_SQL,
    parse: parsePostgresSchema,
    format: (input: string) => format(input, { language: "postgresql" }),
    formatError: "SQL could not be formatted.",
    parseError: "Unable to parse SQL.",
    resetMessage: "Demo SQL restored. Click Visualize schema.",
    formatSuccess: "SQL formatted.",
    inputAria: "PostgreSQL schema",
} as const;

const EMPTY_SCHEMA: ParsedSchema = { tables: [], relations: [] };

function resolveInitialInput(initialSql: string | undefined, embedded: boolean): string {
  const trimmed = initialSql?.trim();
  if (trimmed) return trimmed;
  return embedded ? "" : CONFIG.demo;
}

function parseSchemaSafely(
  source: string,
  parse: (input: string) => ParsedSchema,
): ParsedSchema {
  const trimmed = source.trim();
  if (!trimmed) return EMPTY_SCHEMA;
  try {
    return parse(trimmed);
  } catch {
    return EMPTY_SCHEMA;
  }
}

type Point = { x: number; y: number };
type Positions = Record<string, Point>;

function createPositions(tables: SqlTable[]): Positions {
  return Object.fromEntries(
    tables.map((table, index) => [
      table.name,
      {
        x: 140 + (index % 3) * 390,
        y: 120 + Math.floor(index / 3) * 360,
      },
    ]),
  );
}

function shortName(name: string) {
  return name.split(".").at(-1) ?? name;
}

function getColumnY(table: SqlTable, column: string) {
  const index = Math.max(
    0,
    table.columns.findIndex((item) => item.name === column),
  );
  return HEADER_HEIGHT + index * ROW_HEIGHT + ROW_HEIGHT / 2;
}

function edgePath(
  relation: SqlRelation,
  schema: ParsedSchema,
  positions: Positions,
) {
  const fromTable = schema.tables.find(
    (table) => table.name === relation.fromTable,
  );
  const toTable = schema.tables.find((table) => table.name === relation.toTable);
  const from = positions[relation.fromTable];
  const to = positions[relation.toTable];
  if (!fromTable || !toTable || !from || !to) return "";

  const fromIsLeft = from.x < to.x;
  const startX = from.x + (fromIsLeft ? TABLE_WIDTH : 0);
  const endX = to.x + (fromIsLeft ? 0 : TABLE_WIDTH);
  const startY = from.y + getColumnY(fromTable, relation.fromColumn);
  const endY = to.y + getColumnY(toTable, relation.toColumn);
  const curve = Math.max(70, Math.abs(endX - startX) * 0.42);
  const direction = fromIsLeft ? 1 : -1;
  return `M ${startX} ${startY} C ${startX + curve * direction} ${startY}, ${endX - curve * direction} ${endY}, ${endX} ${endY}`;
}

export default function SchemaVisualizer({
  initialSql,
  liveMode = false,
  embedded = false,
}: {
  initialSql?: string;
  liveMode?: boolean;
  embedded?: boolean;
} = {}) {
  const config = CONFIG;
  const resolvedInput = resolveInitialInput(initialSql, embedded);

  const [input, setInput] = useState<string>(resolvedInput);
  const [schema, setSchema] = useState<ParsedSchema>(() =>
    parseSchemaSafely(resolvedInput, config.parse),
  );
  const [positions, setPositions] = useState<Positions>(() =>
    createPositions(schema.tables),
  );
  const [transform, setTransform] = useState({ x: 40, y: 30, scale: 0.82 });
  const [message, setMessage] = useState("Demo schema visualized successfully.");
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const viewportRef = useRef<HTMLDivElement>(null);
  const interaction = useRef<
    | { type: "pan"; start: Point; origin: Point }
    | { type: "table"; name: string; start: Point; origin: Point }
    | null
  >(null);

  const filteredTables = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return new Set(schema.tables.map((table) => table.name));
    return new Set(
      schema.tables
        .filter(
          (table) =>
            table.name.toLowerCase().includes(normalized) ||
            table.columns.some((column) =>
              column.name.toLowerCase().includes(normalized),
            ),
        )
        .map((table) => table.name),
    );
  }, [query, schema.tables]);

  const visualize = useCallback(() => {
    try {
      const parsed = config.parse(input);
      setSchema(parsed);
      setPositions(createPositions(parsed.tables));
      setTransform({ x: 40, y: 30, scale: 0.82 });
      setMessage(
        `${parsed.tables.length} ${parsed.tables.length === 1 ? config.entitySingular : config.entityPlural} and ${parsed.relations.length} relationships found.`,
      );
      setError(false);
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : config.parseError,
      );
      setError(true);
    }
  }, [config, input]);

  const fitDiagram = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !schema.tables.length) return;
    const points = schema.tables.map((table) => positions[table.name]);
    const minX = Math.min(...points.map((point) => point.x));
    const minY = Math.min(...points.map((point) => point.y));
    const maxX = Math.max(...points.map((point) => point.x + TABLE_WIDTH));
    const maxY = Math.max(
      ...schema.tables.map(
        (table) =>
          positions[table.name].y +
          HEADER_HEIGHT +
          table.columns.length * ROW_HEIGHT,
      ),
    );
    const padding = 80;
    const scale = Math.min(
      1.1,
      Math.max(
        0.28,
        Math.min(
          (viewport.clientWidth - padding * 2) / (maxX - minX),
          (viewport.clientHeight - padding * 2) / (maxY - minY),
        ),
      ),
    );
    setTransform({
      x: (viewport.clientWidth - (maxX - minX) * scale) / 2 - minX * scale,
      y: (viewport.clientHeight - (maxY - minY) * scale) / 2 - minY * scale,
      scale,
    });
  }, [positions, schema.tables]);

  useEffect(() => {
    if (!(liveMode || embedded)) return;

    const nextInput = resolveInitialInput(initialSql, embedded);
    setInput(nextInput);

    if (!nextInput) {
      setSchema(EMPTY_SCHEMA);
      setPositions({});
      setMessage("Paste schema SQL to visualize relationships.");
      setError(false);
      return;
    }

    try {
      const parsed = config.parse(nextInput);
      setSchema(parsed);
      setPositions(createPositions(parsed.tables));
      setMessage(
        `${parsed.tables.length} ${parsed.tables.length === 1 ? config.entitySingular : config.entityPlural} visualized.`,
      );
      setError(false);
    } catch (caught) {
      setMessage(
        caught instanceof Error ? caught.message : config.parseError,
      );
      setError(true);
    }
  }, [initialSql, liveMode, embedded, config]);

  function zoom(delta: number) {
    setTransform((current) => ({
      ...current,
      scale: Math.min(1.6, Math.max(0.3, current.scale + delta)),
    }));
  }

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (
      event.button !== 0 ||
      (event.target as HTMLElement).closest(".table-card")
    )
      return;
    event.currentTarget.setPointerCapture(event.pointerId);
    interaction.current = {
      type: "pan",
      start: { x: event.clientX, y: event.clientY },
      origin: { x: transform.x, y: transform.y },
    };
  }

  function movePointer(event: ReactPointerEvent<HTMLDivElement>) {
    const active = interaction.current;
    if (!active) return;
    const dx = event.clientX - active.start.x;
    const dy = event.clientY - active.start.y;
    if (active.type === "pan") {
      setTransform((current) => ({
        ...current,
        x: active.origin.x + dx,
        y: active.origin.y + dy,
      }));
    } else {
      setPositions((current) => ({
        ...current,
        [active.name]: {
          x: Math.max(0, active.origin.x + dx / transform.scale),
          y: Math.max(0, active.origin.y + dy / transform.scale),
        },
      }));
    }
  }

  function startTableDrag(
    event: ReactPointerEvent<HTMLDivElement>,
    tableName: string,
  ) {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    interaction.current = {
      type: "table",
      name: tableName,
      start: { x: event.clientX, y: event.clientY },
      origin: positions[tableName],
    };
  }

  const showStandaloneChrome = !liveMode && !embedded;
  const showSqlPanel = showStandaloneChrome;

  return (
    <main
      className={
        embedded
          ? "erd-embedded-shell"
          : liveMode
            ? "app-shell erd-live-shell"
            : "app-shell"
      }
    >
      {showStandaloneChrome && (
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Database size={19} strokeWidth={2.2} />
          </div>
          <div>
            <div className="brand-name">
              {config.brand} <span>Visualizer</span>
            </div>
            <p>Schema relationships, made clear.</p>
          </div>
        </div>

        <div className="topbar-actions">
          <div className="privacy-pill">
            <ShieldCheck size={14} />
            100% browser-based
          </div>
        </div>
      </header>
      )}

      <section
        className={
          embedded
            ? "workspace erd-embedded-workspace"
            : liveMode
              ? "workspace erd-live-workspace"
              : "workspace"
        }
      >
        {showSqlPanel && (
        <aside className="sql-panel">
          <div className="panel-title">
            <div>
              <p className="eyebrow">
                <FileCode2 size={13} /> Schema input
              </p>
              <h1>{config.inputTitle}</h1>
            </div>
            <button
              className="quiet-button"
              onClick={() => {
                setInput(config.demo);
                setMessage(config.resetMessage);
                setError(false);
              }}
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>

          <div className="editor-wrap">
            <div className="editor-label">
              <span>{config.fileName}</span>
              <button
                onClick={() => {
                  try {
                    setInput(config.format(input));
                    setMessage(config.formatSuccess);
                    setError(false);
                  } catch {
                    setMessage(config.formatError);
                    setError(true);
                  }
                }}
              >
                <Wand2 size={12} /> Format
              </button>
            </div>
            <textarea
              aria-label={config.inputAria}
              spellCheck={false}
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>

          <div className={error ? "status error" : "status"}>
            {error ? <X size={14} /> : <Check size={14} />}
            <span>{message}</span>
          </div>

          <button className="visualize-button" onClick={visualize}>
            <Sparkles size={16} />
            Visualize schema
            <ChevronRight size={16} />
          </button>

          <div className="support-card">
            <Braces size={16} />
            <div>
              <strong>{config.supportTitle}</strong>
              <p>{config.supportText}</p>
            </div>
          </div>
          <p className="local-note">{config.privacyNote}</p>
        </aside>
        )}

        <section className="diagram-section">
          <div className="diagram-toolbar">
            <div className="diagram-title">
              <div className="diagram-icon">
                <Link2 size={16} />
              </div>
              <div>
                <strong>Relationship diagram</strong>
                <span>
                  {schema.tables.length} {config.entityPlural} ·{" "}
                  {schema.relations.length} relationships
                </span>
              </div>
            </div>

            <div className="toolbar-right">
              <label className="search-box">
                <Search size={14} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={config.searchPlaceholder}
                />
                {query && (
                  <button onClick={() => setQuery("")} aria-label="Clear search">
                    <X size={13} />
                  </button>
                )}
              </label>
              <div className="zoom-controls">
                <button onClick={() => zoom(-0.1)} aria-label="Zoom out">
                  <Minus size={15} />
                </button>
                <span>{Math.round(transform.scale * 100)}%</span>
                <button onClick={() => zoom(0.1)} aria-label="Zoom in">
                  <Plus size={15} />
                </button>
                <button onClick={fitDiagram} aria-label="Fit diagram">
                  <Scan size={15} />
                </button>
                <button
                  onClick={() =>
                    setTransform({ x: 40, y: 30, scale: 0.82 })
                  }
                  aria-label="Reset view"
                >
                  <Maximize2 size={15} />
                </button>
              </div>
            </div>
          </div>

          <div
            ref={viewportRef}
            className="diagram-viewport"
            onPointerDown={startPan}
            onPointerMove={movePointer}
            onPointerUp={() => {
              interaction.current = null;
            }}
            onPointerCancel={() => {
              interaction.current = null;
            }}
            onWheel={(event) => {
              event.preventDefault();
              zoom(event.deltaY > 0 ? -0.06 : 0.06);
            }}
          >
            <div className="canvas-hint">
              Drag canvas to pan · Drag {config.entityPlural} to arrange
            </div>
            <div
              className="diagram-canvas"
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              }}
            >
              <svg
                className="edges"
                viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
                aria-hidden="true"
              >
                {schema.relations.map((relation, index) => {
                  const path = edgePath(relation, schema, positions);
                  const visible =
                    filteredTables.has(relation.fromTable) &&
                    filteredTables.has(relation.toTable);
                  return (
                    <g
                      key={`${relation.fromTable}-${relation.fromColumn}-${index}`}
                      className={visible ? "edge" : "edge muted"}
                    >
                      <path d={path} />
                    </g>
                  );
                })}
              </svg>

              {schema.tables.map((table) => (
                <article
                  key={table.name}
                  className={
                    filteredTables.has(table.name)
                      ? "table-card"
                      : "table-card muted"
                  }
                  style={{
                    left: positions[table.name].x,
                    top: positions[table.name].y,
                    width: TABLE_WIDTH,
                  }}
                >
                  <div
                    className="table-header"
                    onPointerDown={(event) => startTableDrag(event, table.name)}
                  >
                    <div>
                      <span className="table-schema">
                        {table.name.includes(".")
                          ? table.name.split(".")[0]
                          : config.schemaLabel}
                      </span>
                      <strong>{shortName(table.name)}</strong>
                    </div>
                    <span className="column-total">{table.columns.length}</span>
                  </div>
                  <div>
                    {table.columns.map((column) => {
                      const relation = schema.relations.find(
                        (item) =>
                          item.fromTable === table.name &&
                          item.fromColumn === column.name,
                      );
                      return (
                        <div className="column-row" key={column.name}>
                          <span
                            className={
                              column.primaryKey
                                ? "key-icon primary"
                                : relation
                                  ? "key-icon foreign"
                                  : "key-icon"
                            }
                          >
                            {column.primaryKey ? (
                              <KeyRound size={12} />
                            ) : relation ? (
                              <Link2 size={12} />
                            ) : (
                              <span />
                            )}
                          </span>
                          <span className="column-name">
                            {column.name}
                            {column.nullable && <i>?</i>}
                          </span>
                          <span className="column-type">{column.type}</span>
                        </div>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
